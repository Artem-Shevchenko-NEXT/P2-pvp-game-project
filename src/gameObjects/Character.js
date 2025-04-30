import { StateMachine } from './state-machine/stateMachine.js';

export class Character extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, config) {
        super(scene, x, y, config.idleSpriteKey || 'tank_idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setBounce(0.0); //maybe set this to 0
        this.setCollideWorldBounds(true);

        //combat properties
        this.health = config.health || 100;
        this.maxHealth = config.maxHealth || 100;
        this.isInvincible = false;
        this.invincibilityDuration = config.invincibilityDuration || 1000; // cannot take damage 1 second after hit
        this.attackDamage = config.attackDamage || 10;
        this.hitboxConfig = config.hitboxConfig || { width: 40, height: 50 };
        this.hitbox = null;

        // Character specific properties
        this.characterType = config.characterType || 'unknown';
        this.animationKeys = config.animationKeys || {
            left: 'left',
            right: 'right',
            turn: 'turn',
            jump: 'jump',
            attack: 'attack',
            hurt: 'hurt'
        };

        this.initAnimations();
        this.initStateMachine(scene);
    }

    initAnimations() {
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
        this.anims.create({
            key: this.animationKeys.attack,
            frames: this.anims.generateFrameNames('tank_attack', { prefix: 'attackRight', end: 4, zeroPad: 4 }),
            frameRate: 13,
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.hurt,
            frames: this.anims.generateFrameNames('tank_idle', { prefix: 'idle', end: 8, zeroPad: 4 }), // Placeholder replace with hurt animation
            frameRate: 10,
            repeat: 0
        });
    }

    initStateMachine(scene) {
        this.stateMachine = new StateMachine('IDLE', {
            IDLE: {
                enter: () => {
                    this.setVelocityX(0);
                    this.anims.play(this.animationKeys.turn, true);
                },
                execute: () => {
                    this.handleKeyInput();
                }
            },
            MOVE_LEFT: {
                enter: () => {
                    this.setVelocityX(-200);
                    this.flipX = true;
                    if (this.body.blocked.down) {
                        this.anims.play(this.animationKeys.left, true);
                    }
                },
                execute: () => {
                    const cursors = scene.input.keyboard.createCursorKeys();
                    if (!cursors.left.isDown) {
                        if (cursors.right.isDown) {
                            this.stateMachine.transition('MOVE_RIGHT');
                        } else {
                            this.stateMachine.transition('IDLE');
                        }
                    } else if (cursors.up.isDown && this.body.blocked.down) {
                        this.stateMachine.transition('JUMP');
                    } else if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
                        this.stateMachine.transition('ATTACK');
                    }
                }
            },
            MOVE_RIGHT: {
                enter: () => {
                    this.setVelocityX(200);
                    this.flipX = false;
                    if (this.body.blocked.down) {
                        this.anims.play(this.animationKeys.right, true);
                    }
                },
                execute: () => {
                    const cursors = scene.input.keyboard.createCursorKeys();
                    if (!cursors.right.isDown) {
                        if (cursors.left.isDown) {
                            this.stateMachine.transition('MOVE_LEFT');
                        } else {
                            this.stateMachine.transition('IDLE');
                        }
                    } else if (cursors.up.isDown && this.body.blocked.down) {
                        this.stateMachine.transition('JUMP');
                    } else if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
                        this.stateMachine.transition('ATTACK');
                    }
                }
            },
            JUMP: {
                enter: () => {
                    if (this.body.blocked.down){
                        this.setVelocityY(-440);
                    }
                    this.anims.play(this.animationKeys.jump, true);
                },
                execute: () => {
                    const cursors = this.scene.input.keyboard.createCursorKeys();
                    if (this.body.blocked.down) {
                        this.handleKeyInput();
                    } else if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
                        this.stateMachine.transition('ATTACK');
                    }
                }
            },
            ATTACK: {
                enter: () => {
                    if (this.body.blocked.down){
                        this.setVelocityX(0);
                    }
                    this.anims.play(this.animationKeys.attack, true);
                    // create hitbox on attack animation (this can be adjusted to the individual sprite)
                    this.scene.time.delayedCall(100, () => { //to match hitbox on specific frame adjust this timer
                        if (this.stateMachine.currentState === 'ATTACK') {
                            this.createHitbox();
                        }
                    });

                    this.once(`animationcomplete-${this.animationKeys.attack}`, () => {
                        this.destroyHitbox();
                        if (!this.body.blocked.down) {
                            this.stateMachine.transition('JUMP');
                        } else {
                        this.handleKeyInput();
                        }
                    });
                },
                execute: () => {
                    // No input during attack
                },
                exit: () => {
                    this.destroyHitbox();
                }
            },
            HURT: {
                enter: () => {
                    this.setVelocityX(0);
                    this.anims.play(this.animationKeys.hurt, true);
                    this.isInvincible = true;
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
                    });
                },
                execute: () => {
                    //no input during hurt state
                }
            }
        }, this);
    }

    handleKeyInput(){
        const cursors = this.scene.input.keyboard.createCursorKeys();
        if (cursors.left.isDown) {
            this.stateMachine.transition('MOVE_LEFT');
        } else if (cursors.right.isDown) {
            this.stateMachine.transition('MOVE_RIGHT');
        } else if (cursors.up.isDown && this.body.blocked.down) {
            this.stateMachine.transition('JUMP');
        } else if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
            this.stateMachine.transition('ATTACK');
        } else {
            this.stateMachine.transition('IDLE');
        }
    }

    createHitbox() {
        if (!this.hitbox) {
            const { width, height } = this.hitboxConfig;
            const offsetX = this.flipX ? -width : this.width; //set hitbox in front of player
            this.hitbox = this.scene.add.rectangle(
                this.x + offsetX,
                this.y - this.height / 2,
                width,
                height
            );
            this.scene.physics.add.existing(this.hitbox);
            this.hitbox.body.setAllowGravity(false);
            this.hitbox.owner = this; // this is referencing player for collision handling
            //Debug: visual hitbox will/need to be removed later
            this.hitbox.setStrokeStyle(2, 0xff0000); //debug
        }
    }

    destroyHitbox() {
        if (this.hitbox) {
            this.hitbox.destroy();
            this.hitbox = null;
        }
    }

    takeDamage(damage) {
        if (!this.isInvincible) {
            this.health = Math.max(0, this.health - damage);
            if (this.health > 0) {
                this.stateMachine.transition('HURT');
            } else {
                // player HP hits 0, set game over or respawm (does not work need fix)
                this.scene.scene.start('GameOver');
            }
        }
    }

    update() {
        this.stateMachine.update();
        // Update hitbox position so it will follow player
        if (this.hitbox) {
            const { width } = this.hitboxConfig;
            const offsetX = this.flipX ? -width : this.width;
            this.hitbox.setPosition(this.x + offsetX, this.y - this.height / 2);
        }
    }
}