import { StateMachine } from './state-machine/stateMachine.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'tank_idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setBounce(0.2);
        this.setCollideWorldBounds(true);

        this.initAnimations();
        this.initStateMachine(scene);
    }

    initAnimations() {
        // Same as your existing initAnimations method
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
                    // Transition to IDLE when attack animation completes
                    this.once('animationcomplete-attack', () => {
                        this.stateMachine.transition('IDLE');
                    });
                },
                execute: () => {
                    // No input during attack; wait for animation to complete
                }
            }
        }, this);
    }

    update() {
        this.stateMachine.update();

        // Send player position updates to server if connected
        if (this.networkManager && this.networkManager.connected) {
            // Get current animation and direction from player's state
            const currentState = this.player.stateMachine.currentState;
            let animation = 'turn';  // Default animation
            let facing = this.player.flipX ? 'left' : 'right';
            
            // Map state to animation 
            switch (currentState) {
                case 'IDLE':
                    animation = 'turn';
                    break;
                case 'MOVE_LEFT':
                    animation = 'left';
                    break;
                case 'MOVE_RIGHT':
                    animation = 'right';
                    break;
                case 'JUMP':
                    animation = 'jump';
                    break;
                case 'ATTACK':
                    animation = 'attack';
                    break;
            }
            
            // Send update to server
            this.networkManager.sendPlayerUpdate(
                this.player.x,
                this.player.y,
                {
                    animation,
                    facing
                }
            );
        }
    }
}