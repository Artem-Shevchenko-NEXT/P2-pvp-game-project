export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'tank_idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setBounce(0.2);
        this.setCollideWorldBounds(true);
        this.isAttacking = false; // attack state
        this.initAnimations();
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
    }

    moveLeft() {
        if (!this.isAttacking) { // Only move if not attacking
            this.setVelocityX(-200);
            this.flipX = true;
            if (this.body.blocked.down) {
                this.anims.play('left', true);
            }
        }
    }

    moveRight() {
        if (!this.isAttacking) { // Only move if not attacking
            this.setVelocityX(200);
            this.flipX = false;
            if (this.body.blocked.down) {
                this.anims.play('right', true);
            }
        }
    }

    idle() {
        if (!this.isAttacking) { // Only idle if not attacking
            this.setVelocityX(0);
            this.anims.play('turn', true);
        }
    }

    jump() {
        if (this.body.blocked.down && !this.isAttacking) { // Only jump if on ground and not attacking
            this.setVelocityY(-440);
            this.anims.play('jump', true);
        }
    }

    attack() {
        if (!this.isAttacking) { // Only attack if not already attacking
            this.isAttacking = true;
            this.setVelocityX(0); // Stop movement during attack
            this.anims.play('attack', true);
            // Reset to idle after animation completes
            this.once('animationcomplete-attack', () => {
                this.isAttacking = false;
                this.anims.play('turn', true);
            });
        }
    }
}