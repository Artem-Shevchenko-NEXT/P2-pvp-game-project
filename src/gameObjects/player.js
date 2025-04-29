import { StateMachine } from './state-machine/stateMachine.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'tank_idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setBounce(0.2);
        this.setCollideWorldBounds(true);

        //combat properties
        this.health = 100;
        this.maxHealth = 100;
        this.isInvincible = false;
        this.invicibilityDuration = 1000; // cannot take damage 1 second after hit
        this.attackDamage = 10;
        this.hitbox = null;

        this.initAnimations();
        this.initStateMachine(scene);
    }

    initAnimations() {
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNames('tank_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'turn',
            frames: this.anims.generateFrameNames('tank_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNames('tank_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNames('tank_jump', { prefix: 'jumping', end: 8, zeroPad: 4 }),
            frameRate: 5,
            repeat: 0
        });
        this.anims.create({
            key: 'attack',
            frames: this.anims.generateFrameNames('tank_attack', { prefix: 'attackRight', end: 4, zeroPad: 4 }),
            frameRate: 13,
            repeat: 0
        });
        this.anims.create({
            key: 'hurt',
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
                    this.anims.play('turn', true);
                },
                execute: () => {
                    const cursors = scene.input.keyboard.createCursorKeys();
                    if (cursors.left.isDown) {
                        this.stateMachine.transition('MOVE_LEFT');
                    } else if (cursors.right.isDown) {
                        this.stateMachine.transition('MOVE_RIGHT');
                    } else if (cursors.up.isDown && this.body.blocked.down) {
                        this.stateMachine.transition('JUMP');
                    } else if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
                        this.stateMachine.transition('ATTACK');
                    }
                }
            },
            MOVE_LEFT: {
                enter: () => {
                    this.setVelocityX(-200);
                    this.flipX = true;
                    if (this.body.blocked.down) {
                        this.anims.play('left', true);
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
                        this.anims.play('right', true);
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
                    this.setVelocityY(-440);
                    this.anims.play('jump', true);
                },
                execute: () => {
                    if (this.body.blocked.down) {
                        this.stateMachine.transition('IDLE');
                    }
                }
            },
            ATTACK: {
                enter: () => {
                    this.setVelocityX(0);
                    this.anims.play('attack', true);
                    // create hitbox on attack animation (this can be adjusted to the individual sprite)
                    this.scene.time.delayedCall(100, () => { //to match hitbox on specific frame adjust this timer
                        if(this.stateMachine.currentState === 'ATTACK') {
                           this.createHitbox();     
                        }
                    });
                    // Transition to IDLE when attack anim. is complete.
                    this.once('animationcomplete-attack', () => {
                        this.destroyHitbox();
                        this.stateMachine.transition('IDLE');
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
                    this.anims.play('hurt', true);
                    this.isInvincible = true;
                    //Flash effect to show we have a hit using tweens
                    this.scene.tweens.add({
                        targets: this,
                        alpha: 0.5,
                        duration:100,
                        yoyo: true,
                        repeat: 3
                    });
                    //end invincibility after duration
                    this.scene.time.delayedCall(this.invicibilityDuration, () => {
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

    createHitbox() {
        if (!this.hitbox) {
            // create a rectangel hitbox. adjust size and offset based sprite
            const hitboxWidth = 40;
            const hitboxHeight = 50;
            const offsetX = this.flipX ? -hitboxWidth : this.width; //set hitbox in front of player
            
            this.hitbox = this.scene.add.rectangle(
                this.x + offsetX,
                this.y - this.height / 2,
                hitboxWidth,
                hitboxHeight
            );
            this.scene.physics.add.existing(this.hitbox);
            this.hitbox.body.setAllowGravity(false);
            this.hitbox.owner = this; // this is referencing player for collision handling
            //Debug: visual hitbox will/need to be removed later
            this.hitbox.setStrokeStyle(2, 0xff0000);
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
            }else {
                // player HP hits 0, set game over or respawm (does not work need fix)
                this.scene.scene.start('GameOver');
            }
        }
    }

    update() {
        this.stateMachine.update();
        // Update hitbox position so it will follow player
        if (this.hitbox) {
            const offsetX = this.flipX ? -40 : this.width;
            this.hitbox.setPosition(this.x + offsetX, this.y - this.height / 2);
        }
    }
}