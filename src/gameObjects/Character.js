import { StateMachine } from './state-machine/stateMachine.js';
import { PLAYER1_SPAWN_X, PLAYER1_SPAWN_Y, SCREEN_HEIGHT, SCREEN_WIDTH } from '../config.js';

export class Character extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, config) {
        super(scene, x, y, config.idleSpriteKey || 'tank_idle');
        this.setOrigin(0.5, 0.2);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setBounce(0.0); //maybe set this to 0
        this.setCollideWorldBounds(true);

        //combat properties
        this.health = config.health || 100;
        this.maxHealth = config.maxHealth || 100;
        this.isInvincible = false;
        this.invincibilityDuration = config.invincibilityDuration || 1000; // cannot take damage 1 second after hit
        this.attackDamage = config.attackDamage || 50;
        this.attack2Damage = config.attack2Damage || 75;
        this.hitboxConfig = config.hitboxConfig || { width: 40, height: 50 };
        this.hitboxOffsetConfig = config.hitboxOffsetConfig || { 
            x: { left: -40, right: 40 },  // different values for left/right facing
            y: 0 // Y offset (can be positive or negative)
        };
        this.hitbox = null;
        this.shockwave = null; // Shockwave: Track shockwave sprite for tank's ATTACK2

        // Movement properties
        this.moveSpeed = config.moveSpeed || 200; // Default movement speed
        this.jumpVelocity = config.jumpVelocity || 480; // Default jump velocity (negative for upward)

        // Character specific properties
        this.characterType = config.characterType || 'unknown';
        this.animationKeys = config.animationKeys || {
            left: 'left',
            right: 'right',
            turn: 'turn',
            jump: 'jump',
            attack: 'attack',
            attack2: 'attack2',
            hurt: 'hurt'
        };

        // Input buffering
        this.inputBuffer = {
            jump: false,
            attack: false,
            attack2: false,
            moveLeft: false,
            moveRight: false
        };

        // Track landing frame to stabilize JUMP
        this.lastGroundedFrame = 0;

        // Initialize Shift key for ATTACK2
        this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // Initialize WASD keys
        this.wKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.aKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.sKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.dKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        console.log(`Creating ${this.characterType} character at x=${x}, y=${y}`);
        this.initAnimations();
        this.initStateMachine(scene);
        this.anims.play(this.animationKeys.turn, true); // Added this line so animations start to play the very first frame,
    }

    initAnimations() {
        try {
            this.anims.create({
                key: this.animationKeys.left,
                frames: this.anims.generateFrameNames('tank_run', { prefix: 'running', end: 8, zeroPad: 4 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: this.animationKeys.turn,
                frames: this.anims.generateFrameNames('tank_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: this.animationKeys.right,
                frames: this.anims.generateFrameNames('tank_run', { prefix: 'running', end: 8, zeroPad: 4 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: this.animationKeys.jump,
                frames: this.anims.generateFrameNames('tank_jump', { prefix: 'jumping', end: 8, zeroPad: 4 }),
                frameRate: 5,
                repeat: 0
            });
            this.anims.create({ //standard attack
                key: this.animationKeys.attack,
                frames: this.anims.generateFrameNames('tank_attack', { prefix: 'attackRight', end: 5, zeroPad: 4 }), // Extended to include attackRight0005
                frameRate: 13,
                repeat: 0
            });
            this.anims.create({ //secondary attack i.e attack2
                key: this.animationKeys.attack2,
                frames: this.anims.generateFrameNames('tank_attack', { prefix: 'secondAttack', end: 5, zeroPad: 4 }), // Corrected to end at 5
                frameRate: 13,
                repeat: 0
            });
            this.anims.create({
                key: this.animationKeys.hurt,
                frames: this.anims.generateFrameNames('tank_idle', { prefix: 'idle', end: 8, zeroPad: 4 }), // Placeholder replace with hurt animation
                frameRate: 10,
                repeat: 0
            });
            console.log(`${this.characterType} animations created successfully`);
        } catch (error) {
            console.error(`${this.characterType} animation creation failed:`, error);
        }
    }

    initStateMachine(scene) {
        this.stateMachine = new StateMachine('IDLE', {
            IDLE: {
                enter: () => {
                    this.setVelocityX(0);
                    this.anims.play(this.animationKeys.turn, true);
                    console.log(`${this.characterType} entered IDLE state`);
                },
                execute: () => {
                    const cursors = scene.input.keyboard.createCursorKeys();
                    if (cursors.left.isDown || this.aKey.isDown) {
                        this.stateMachine.transition('MOVE_LEFT');
                    } else if (cursors.right.isDown || this.dKey.isDown) {
                        this.stateMachine.transition('MOVE_RIGHT');
                    } else if ((cursors.up.isDown || this.wKey.isDown) && this.body.blocked.down) {
                        this.stateMachine.transition('JUMP');
                    } else if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
                        this.stateMachine.transition('ATTACK');
                    } else if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
                        this.stateMachine.transition('ATTACK2');
                    }
                }
            },
            MOVE_LEFT: {
                enter: () => {
                    this.setVelocityX(-this.moveSpeed);
                    this.flipX = true;
                    this.anims.play(this.animationKeys.left, true);
                    console.log(`${this.characterType} entered MOVE_LEFT state`);
                },
                execute: () => {
                    const cursors = scene.input.keyboard.createCursorKeys();
                    if (!cursors.left.isDown && !this.aKey.isDown) {
                        if (cursors.right.isDown || this.dKey.isDown) {
                            this.stateMachine.transition('MOVE_RIGHT');
                        } else {
                            this.stateMachine.transition('IDLE');
                        }
                    } else if ((cursors.up.isDown || this.wKey.isDown) && this.body.blocked.down) {
                        this.stateMachine.transition('JUMP');
                    } else if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
                        this.stateMachine.transition('ATTACK');
                    } else if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
                        this.stateMachine.transition('ATTACK2');
                    }
                }
            },
            MOVE_RIGHT: {
                enter: () => {
                    this.setVelocityX(this.moveSpeed);
                    this.flipX = false;
                    this.anims.play(this.animationKeys.right, true);
                    console.log(`${this.characterType} entered MOVE_RIGHT state`);
                },
                execute: () => {
                    const cursors = scene.input.keyboard.createCursorKeys();
                    if (!cursors.right.isDown && !this.dKey.isDown) {
                        if (cursors.left.isDown || this.aKey.isDown) {
                            this.stateMachine.transition('MOVE_LEFT');
                        } else {
                            this.stateMachine.transition('IDLE');
                        }
                    } else if ((cursors.up.isDown || this.wKey.isDown) && this.body.blocked.down) {
                        this.stateMachine.transition('JUMP');
                    } else if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
                        this.stateMachine.transition('ATTACK');
                    } else if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
                        this.stateMachine.transition('ATTACK2');
                    }
                }
            },
            JUMP: {
                enter: () => {
                    this.setVelocityY(-this.jumpVelocity); // Original: 440
                    if (this.stateMachine.currentState !== 'ATTACK' && this.stateMachine.currentState !== 'ATTACK2') {
                        this.anims.play(this.animationKeys.jump, true);
                        console.log(`${this.characterType} entered JUMP state`);
                    }
                },
                execute: () => {
                    const cursors = scene.input.keyboard.createCursorKeys();
                    // Only transition to IDLE after a few frames on ground to stabilize
                    if (this.body.blocked.down) {
                        this.lastGroundedFrame++; //increment 2 frames of being grounded
                        if (this.lastGroundedFrame > 2) {
                            this.stateMachine.transition('IDLE');
                        }
                    } else {
                        this.lastGroundedFrame = 0; //reset last lastGroundedFrame
                    }
                    // Buffer inputs during jump
                    this.inputBuffer.jump = (cursors.up.isDown || this.wKey.isDown) && this.body.blocked.down && !this.inputBuffer.jump;
                    this.inputBuffer.attack = Phaser.Input.Keyboard.JustDown(cursors.space);
                    this.inputBuffer.attack2 = Phaser.Input.Keyboard.JustDown(this.shiftKey);
                    this.inputBuffer.moveLeft = cursors.left.isDown || this.aKey.isDown;
                    this.inputBuffer.moveRight = cursors.right.isDown || this.dKey.isDown;
                }
            },
            ATTACK: {
                enter: () => {
                    if (this.body.blocked.down){
                        this.setVelocityX(0);
                    }
                    this.anims.play(this.animationKeys.attack, true);
                    console.log(`${this.characterType} entered ATTACK state`);
                    // create hitbox on attack animation (this can be adjusted to the individual sprite)
                    this.scene.time.delayedCall(50, () => {
                        if (this.stateMachine.currentState === 'ATTACK') {
                            this.createHitbox();
                            console.log(`${this.characterType} created hitbox at frame: ${this.anims.currentFrame ? this.anims.currentFrame.index : 'unknown'}`);
                        }
                    });
                    // Transition to IDLE when attack anim. is complete
                    this.off(`animationcomplete-${this.animationKeys.attack}`);
                    this.once(`animationcomplete-${this.animationKeys.attack}`, () => {
                        //this.destroyHitbox();
                        this.stateMachine.transition('IDLE');
                        console.log(`${this.characterType} attack animation complete`);
                    });
                },
                execute: () => {
                    // Buffer inputs during attack
                    const cursors = scene.input.keyboard.createCursorKeys();
                    this.inputBuffer.jump = (cursors.up.isDown || this.wKey.isDown) && this.body.blocked.down && !this.inputBuffer.jump;
                    this.inputBuffer.attack = Phaser.Input.Keyboard.JustDown(cursors.space);
                    this.inputBuffer.attack2 = Phaser.Input.Keyboard.JustDown(this.shiftKey);
                    this.inputBuffer.moveLeft = cursors.left.isDown || this.aKey.isDown;
                    this.inputBuffer.moveRight = cursors.right.isDown || this.dKey.isDown;
                },
                exit: () => {
                    //this.destroyHitbox();
                    console.log(`${this.characterType} exited ATTACK state`);
                    // Delay buffered input processing to next update cycle
                    this.scene.time.delayedCall(0, () => {
                        if (this.inputBuffer.attack) {
                            this.stateMachine.transition('ATTACK');
                        } else if (this.inputBuffer.attack2) {
                            this.stateMachine.transition('ATTACK2');
                        } else if (this.inputBuffer.jump) {
                            this.stateMachine.transition('JUMP');
                        } else if (this.inputBuffer.moveLeft) {
                            this.stateMachine.transition('MOVE_LEFT');
                        } else if (this.inputBuffer.moveRight) {
                            this.stateMachine.transition('MOVE_RIGHT');
                        }
                        this.inputBuffer = { jump: false, attack: false, attack2: false, moveLeft: false, moveRight: false };
                    });
                }
            },
            ATTACK2: {
                enter: () => {
                    this.setVelocityX(0);
                    this.anims.play(this.animationKeys.attack2, true);
                    console.log(`${this.characterType} entered ATTACK2 state`);
                    // Shockwave: Create shockwave for tank, hitbox for others
                    this.scene.time.delayedCall(50, () => {
                        if (this.stateMachine.currentState === 'ATTACK2') {
                            if (this.characterType === 'tank') {
                                this.createShockwave(); // SHOCKWAVE!
                                console.log(`${this.characterType} created shockwave at frame: ${this.anims.currentFrame ? this.anims.currentFrame.index : 'unknown'}`);
                            } else if (this.characterType === 'archer') {
                                this.createArrow(); //archer ARROW!
                                console.log(`${this.characterType} created hitbox at frame: ${this.anims.currentFrame ? this.anims.currentFrame.index : 'unknown'}`);
                            } else if (this.characterType === 'hero') {
                                this.createHerowave(); //insert attack2 for hero adjust console log
                                console.log(`${this.characterType} created HeroWave at frame: ${this.anims.currentFrame ? this.anims.currentFrame.index : 'unknown'}`);
                            } else if (this.characterType === 'ninja') {
                                this.createHitbox(); //insert attack2 for archer
                                console.log(`${this.characterType} created hitbox at frame: ${this.anims.currentFrame ? this.anims.currentFrame.index : 'unknown'}`);
                            } else if (this.characterType === 'skeleton') {
                                this.createFireball(); //insert attack2 for skeleton
                                console.log(`${this.characterType} created hitbox at frame: ${this.anims.currentFrame ? this.anims.currentFrame.index : 'unknown'}`);
                            }
                        }
                    });
                    // Transition to IDLE when attack anim. is complete
                    this.off(`animationcomplete-${this.animationKeys.attack2}`);
                    this.once(`animationcomplete-${this.animationKeys.attack2}`, () => {
                        if (this.characterType === 'tank') {
                            this.destroyShockwave();
                        } else if (this.characterType === 'archer') {
                            //nothing happens
                        }  else if (this.characterType === 'hero') {
                            this.destroyHerowave();
                        }  else if (this.characterType === 'ninja') {
                            this.destroyArrow();
                        }  else if (this.characterType === 'skeleton') {
                            //this.destroyFireball();
                        }
                        this.stateMachine.transition('IDLE');
                        console.log(`${this.characterType} attack2 animation complete`);
                    });
                },
                execute: () => {
                    // Buffer inputs during attack
                    const cursors = scene.input.keyboard.createCursorKeys();
                    this.inputBuffer.jump = (cursors.up.isDown || this.wKey.isDown) && this.body.blocked.down && !this.inputBuffer.jump;
                    this.inputBuffer.attack = Phaser.Input.Keyboard.JustDown(cursors.space);
                    this.inputBuffer.attack2 = Phaser.Input.Keyboard.JustDown(this.shiftKey);
                    this.inputBuffer.moveLeft = cursors.left.isDown || this.aKey.isDown;
                    this.inputBuffer.moveRight = cursors.right.isDown || this.dKey.isDown;
                },
                exit: () => {
                    if (this.characterType === 'tank') {
                        this.destroyShockwave();
                    } else if (this.characterType === 'archer') {
                        //nithing happens
                    } else if (this.characterType === 'hero') {
                        this.destroyHerowave();
                    } else if (this.characterType === 'ninja') {
                        this.destroyArrow();
                    } else if (this.characterType === 'skeleton') {
                        //this.destroyFireball();
                    }
                    console.log(`${this.characterType} exited ATTACK2 state`);
                    // Delay buffered input processing to next update cycle
                    this.scene.time.delayedCall(0, () => {
                        if (this.inputBuffer.attack) {
                            this.stateMachine.transition('ATTACK');
                        } else if (this.inputBuffer.attack2) {
                            this.stateMachine.transition('ATTACK2');
                        } else if (this.inputBuffer.jump) {
                            this.stateMachine.transition('JUMP');
                        } else if (this.inputBuffer.moveLeft) {
                            this.stateMachine.transition('MOVE_LEFT');
                        } else if (this.inputBuffer.moveRight) {
                            this.stateMachine.transition('MOVE_RIGHT');
                        }
                        this.inputBuffer = { jump: false, attack: false, attack2: false, moveLeft: false, moveRight: false };
                    });
                }
            },
            HURT: {
                enter: () => {
                    this.setVelocityX(0);
                    this.anims.play(this.animationKeys.hurt, true);
                    this.isInvincible = true;
                    console.log(`${this.characterType} entered HURT state`);
                    //Flash effect to show we have a hit using tweens
                    this.scene.tweens.add({
                        targets: this,
                        alpha: 0.5,
                        duration: 100,
                        yoyo: true,
                        repeat: 3
                    });
                    //end invincibility after duration
                    this.scene.time.delayedCall(this.invincibilityDuration, () => {
                        this.isInvincible = false;
                        this.stateMachine.transition('IDLE');
                        console.log(`${this.characterType} exited HURT state`);
                    });
                },
                execute: () => {
                    // Buffer inputs during hurt state
                    const cursors = scene.input.keyboard.createCursorKeys();
                    this.inputBuffer.jump = (cursors.up.isDown || this.wKey.isDown) && this.body.blocked.down && !this.inputBuffer.jump;
                    this.inputBuffer.attack = Phaser.Input.Keyboard.JustDown(cursors.space);
                    this.inputBuffer.attack2 = Phaser.Input.Keyboard.JustDown(this.shiftKey);
                    this.inputBuffer.moveLeft = cursors.left.isDown || this.aKey.isDown;
                    this.inputBuffer.moveRight = cursors.right.isDown || this.dKey.isDown;
                },
                exit: () => {
                    // Delay buffered input processing to next update cycle
                    this.scene.time.delayedCall(0, () => {
                        if (this.inputBuffer.attack) {
                            this.stateMachine.transition('ATTACK');
                        } else if (this.inputBuffer.attack2) {
                            this.stateMachine.transition('ATTACK2');
                        } else if (this.inputBuffer.jump) {
                            this.stateMachine.transition('JUMP');
                        } else if (this.inputBuffer.moveLeft) {
                            this.stateMachine.transition('MOVE_LEFT');
                        } else if (this.inputBuffer.moveRight) {
                            this.stateMachine.transition('MOVE_RIGHT');
                        }
                        this.inputBuffer = { jump: false, attack: false, attack2: false, moveLeft: false, moveRight: false };
                    });
                }
            }
        }, this);
    }

    createHitbox() {
        if (!this.hitbox) {
            const { width, height } = this.hitboxConfig;
            // Get the appropriate X offset based on direction
            const offsetX = this.flipX 
                ? this.hitboxOffsetConfig.x.left 
                : this.hitboxOffsetConfig.x.right;
            const offsetY = this.hitboxOffsetConfig.y;

            // Create the hitbox rectangle
            this.hitbox = this.scene.add.rectangle(
                this.x + offsetX,
                this.y + offsetY,
                width,
                height
            );
            this.scene.hitboxes.add(this.hitbox);
            this.hitbox.body.setAllowGravity(false);
            this.hitbox.owner = this; // this is referencing player for collision handling
            this.hitbox.damage = this.attackDamage;
            this.hitbox.hitTargets = new Set();
            //Debug: visual hitbox will/need to be removed later
            
            this.hitbox.setStrokeStyle(2, 0xff0000); //debug
            console.log(`${this.characterType} hitbox position: x=${this.hitbox.x}, y=${this.hitbox.y}, width=${width}, height=${height}`);
            this.scene.time.delayedCall(250, () => {
                if (this.hitbox) {
                    this.destroyHitbox();
                }
            });
        }
    }

    destroyHitbox() {
        if (this.hitbox) {
            console.log(`${this.characterType} destroyed hitbox at x=${this.hitbox.x}, y=${this.hitbox.y}`);
            //this.scene.time.delayedCall(300, () => {
                this.hitbox.destroy();
                this.hitbox = null;
            //});
        }
    }

    // Shockwave: Create shockwave sprite for tank's ATTACK2
    createShockwave() {
        if (!this.shockwave) {
            const offsetX = this.flipX ? -10 : 10; // Position 10px in front of player
            this.shockwave = this.scene.physics.add.sprite(
                this.x + offsetX,
                this.y + 8, // Align with player's center
                'tank_attack',
                'secondAttackShockwave0000'
            );
            this.shockwave.setDepth(5); // Ensure visibility
            if (this.flipX === true) {
                this.shockwave.flipX = true;
            }
            this.shockwave.owner = this; // Reference player for collision handling
            this.shockwave.damage = this.attack2Damage; 
            this.shockwave.setVelocityX(this.flipX ? -200 : 200); // Move 500px/s in facing direction
            this.shockwave.body.setAllowGravity(false);

            // Shockwave: Add to scene's shockwave group(important due to maing physics group in game)
            this.scene.shockwaves.add(this.shockwave);
            // Shockwave: Ensure gravity after group addition
            this.shockwave.body.setAllowGravity(false);
            this.scene.shockwaves.setVelocityX(this.flipX ? -200 : 200);
            // Shockwave: Log position and physics properties over time
            this.scene.time.addEvent({
                delay: 10,
                callback: () => {
                    if (this.shockwave) {
                        console.log(`Shockwave position: x=${this.shockwave.x}, y=${this.shockwave.y}, velocityX=${this.shockwave.body.velocity.x}, allowGravity=${this.shockwave.body.allowGravity}`);
                    }
                },
                repeat: 30 // Log for 300ms
            });
            if (this === this.scene.gameSync?.localPlayer) {
                this.scene.combatManager.registerShockwave();
            }
            // Shockwave: Destroy after 300ms if no collision
            this.scene.time.delayedCall(300, () => {
                if (this.shockwave) {
                    this.destroyShockwave();
                }
            });
            console.log(`${this.characterType} shockwave created at x=${this.shockwave.x}, y=${this.shockwave.y}`);
        }
    }

    // Shockwave: Destroy shockwave sprite
    destroyShockwave() {
        if (this.shockwave) {
            // If this is local player, notify network
            if (this === this.scene.gameSync?.localPlayer) {
              this.scene.networkManager.sendShockwaveDestroyed({ id: this.scene.networkManager.playerId });
            }
            
            console.log(`${this.characterType} shockwave destroyed at x=${this.shockwave.x}, y=${this.shockwave.y}`);
            this.shockwave.destroy();
            this.shockwave = null;
        }
    }

    /* createArrow Archer ATTACK2 */   

    createArrow() {
        if (!this.arrow) {
            const offsetX = this.flipX ? -10 : 10; // Position 10px in front of player
            this.arrow = this.scene.physics.add.sprite(
                this.x + offsetX,
                this.y + 8, // Align with player's center
                'arrow'
            );
            this.arrow.setDepth(5); // Ensure visibility
            if (this.flipX === true) {
                this.arrow.flipX = true;
            }
            this.arrow.owner = this; // Reference player for collision handling
            this.arrow.damage = this.attack2Damage;
            this.arrow.setVelocityX(this.flipX ? -200 : 200); // Move 500px/s in facing direction
            this.arrow.body.setAllowGravity(false);
            this.arrow.body.setCollideWorldBounds(true);
            this.arrow.body.onWorldBounds = true;
            this.arrow.body.setSize(60, 30);
            this.arrow.setScale(0.5);
            // Shockwave: Add to scene's shockwave group(important due to maing physics group in game)
            this.scene.arrows.add(this.arrow);
            // Shockwave: Ensure no gravity after group addition
            this.arrow.body.setAllowGravity(false);
            this.scene.arrows.setVelocityX(this.flipX ? -500 : 500);
            // Shockwave: Log position and physics properties over time
            this.scene.time.addEvent({
                delay: 10,
                callback: () => {
                    if (this.arrow) {
                        console.log(`Arrow position: x=${this.arrow.x}, y=${this.arrow.y}, velocityX=${this.arrow.body.velocity.x}, allowGravity=${this.arrow.body.allowGravity}`);
                    }
                },
                repeat: 30 // Log for 300ms
            });
            // Register arrow with combat manager if this is the local player
            if (this === this.scene.gameSync?.localPlayer) {
                this.scene.combatManager.registerArrow();
            }         
            // Arrow: Destroy after 300ms if no collision
            this.scene.time.delayedCall(1600, () => {
                if (this.arrow) {
                    this.destroyArrow();
                }
            });
            console.log(`${this.characterType} arrow created at x=${this.arrow.x}, y=${this.arrow.y}`);
        }
    }

    // Arrow: Destroy arrow sprite
    destroyArrow() {
        if (this.arrow) {
            // If this is local player, notify network
            if (this === this.scene.gameSync?.localPlayer) {
              this.scene.networkManager.sendArrowDestroyed({ id: this.scene.networkManager.playerId });
            }
            
            console.log(`${this.characterType} arrow destroyed at x=${this.arrow.x}, y=${this.arrow.y}`);
            this.arrow.destroy();
            this.arrow = null;
        }
    } 
    //Skeleton fireball special attack
    createFireball() {
        if (!this.fireball) {
            for (let i = 0; i<12; i++){
            //let i = 0;
            console.log('fireball has been called')
            //skal tweakes
            let randomInt = Math.floor(Math.random() * 75) + 0;
            this.fireball = this.scene.physics.add.sprite(
                randomInt+(i)*SCREEN_WIDTH/12, //needs to be semi random
                0, // spawns at the top
                'fireball'
            );
            this.fireball.setDepth(5); // Ensure visibility

            this.fireball.owner = this; // Reference player for collision handling
            this.fireball.body.setSize(20, 30);//skal tweakes
            // Shockwave: Add to scene's shockwave group(important due to maing physics group in game)
            this.scene.fireballs.add(this.fireball);
            //calls destroyFireball, just when it reaches the ground
            this.scene.time.delayedCall(1150, () => {
                if (this.fireball) {
                    this.destroyFireball(this.fireball);
                }
            });
        }
    }
    }

    // fireball: Destroy fireball sprite
    destroyFireball() {
        if (this.fireball) {
            // If this is local player, notify network
            if (this === this.scene.gameSync?.localPlayer) {
              this.scene.networkManager.sendFireballDestroyed({ id: this.scene.networkManager.playerId });
            }
            //sletter en enkel fireball, har brug for at slette alle fireballs
            console.log(`${this.characterType} fireball destroyed at x=${this.fireball.x}, y=${this.fireball.y}`);
            this.fireball.destroy();
            this.fireball = null;
            
        }
    }

    // Herowave: Create herowave sprite for hero's ATTACK2
    createHerowave() {       
            if (!this.herowave) {
                const offsetX = this.flipX ? -10 : 10; // Position 10px in front of player
                this.herowave = this.scene.physics.add.sprite(
                this.x + offsetX,
                this.y + 8, // Align with player's center
                'tank_attack',
                'secondAttackShockwave0000'
                );
                this.herowave.setTint(0xff0000); // Red tint to differentiate from tank's shockwave
                this.herowave.setDepth(5); // Ensure visibility
                //tweens
                if (this.flipX === true) {
                this.herowave.flipX = true;
            }
            
            this.herowave.owner = this; // Reference player for collision handling
            this.herowave.damage = this.attack2Damage; // Use hero's attack2 damage
            this.herowave.setVelocityX(this.flipX ? -250 : 250); // Slightly faster than tank's shockwave
            this.herowave.body.setAllowGravity(false);

            // Herowave: Add to scene's shockwave group(important due to maing physics group in game)
            this.scene.herowaves.add(this.herowave);
            // Herowave: Ensure gravity after group addition
            this.herowave.body.setAllowGravity(false);
            this.scene.herowaves.setVelocityX(this.flipX ? -250 : 250);

            // Register herowave with combat manager if this is the local player
            if (this === this.scene.gameSync?.localPlayer) {
                this.scene.combatManager.registerHerowave();
            }

            // Herowave: Log position and physics properties over time
            this.scene.time.addEvent({
                delay: 10,
                callback: () => {
                    if (this.herowave) {
                        console.log(`Herowave position: x=${this.herowave.x}, y=${this.herowave.y}, velocityX=${this.herowave.body.velocity.x}, allowGravity=${this.herowave.body.allowGravity}`);
                    }
                },
                repeat: 30 // Log for 300ms
            });
            // Herowave: Destroy after 300ms if no collision
            this.scene.time.delayedCall(300, () => {
                if (this.herowave) {
                    this.destroyHerowave();
                }
            });
            console.log(`${this.characterType} Herowave created at x=${this.herowave.x}, y=${this.herowave.y}`);
        }
    }

    // Herowave: Destroy herowave sprite
    destroyHerowave() {
        if (this.herowave) {
            // If this is local player, notify network
            if (this === this.scene.gameSync?.localPlayer) {
                this.scene.networkManager.sendHerowaveDestroyed({ id: this.scene.networkManager.playerId });
            }
            
            console.log(`${this.characterType} Herowave destroyed at x=${this.herowave.x}, y=${this.herowave.y}`);
            this.herowave.destroy();
            this.herowave = null;
        }
    }


    update() {
        this.stateMachine.update();
        // Update hitbox position so it will follow player
        if (this.hitbox) {
            const offsetX = this.flipX 
                ? this.hitboxOffsetConfig.x.left 
                : this.hitboxOffsetConfig.x.right;
            const offsetY = this.hitboxOffsetConfig.y;

            // Update position
            this.hitbox.setPosition(this.x + offsetX, this.y + offsetY);
        }
        // Shockwave: Log physics body position to confirm movement
        if (this.shockwave) {
            console.log(`Shockwave body position: x=${this.shockwave.body.x}, y=${this.shockwave.body.y}`);
        }
    }
}