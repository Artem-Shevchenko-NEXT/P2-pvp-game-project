import { Character } from './Character.js';

export class TankCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'tank',
            idleSpriteKey: 'tank_idle',
            health: 100,
            maxHealth: 100,
            attackDamage: 10,
            invincibilityDuration: 1000,
            hitboxConfig: { width: 40, height: 50 },
            animationKeys: {
                left: 'left',
                right: 'right',
                turn: 'turn',
                jump: 'jump',
                attack: 'attack',
                hurt: 'hurt'
            }
        });
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
            frames: this.anims.generateFrameNames('tank_idle', { prefix: 'idle', end: 8, zeroPad: 4 }), // Placeholder we need to put in special animation for this
            frameRate: 10,
            repeat: 0
        });
    }
}