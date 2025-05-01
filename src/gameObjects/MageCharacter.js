import { Character } from './Character.js';

export class MageCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'mage',
            idleSpriteKey: 'mage_idle',
            health: 50, // much Less health than tank and ninja
            maxHealth: 50,
            attackDamage: 30, // Glass cannon damage
            invincibilityDuration: 1000, 
            hitboxConfig: { width: 30, height: 70 }, // tall and skinny maybe?
            animationKeys: {
                left: 'mage_left',
                right: 'mage_right',
                turn: 'mage_turn',
                jump: 'mage_jump',
                attack: 'mage_attack',
                hurt: 'mage_hurt'
            }
        });
    }

    initAnimations() {
        // Placeholder: Using tank animations; replace with ninja assets
        this.anims.create({
            key: this.animationKeys.left,
            frames: this.anims.generateFrameNames('mage_run', { prefix: 'running', end: 7, zeroPad: 4 }),
            frameRate: 8, // Faster for ninja
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.turn,
            frames: this.anims.generateFrameNames('mage_idle', { prefix: 'idle', end: 7, zeroPad: 4 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.right,
            frames: this.anims.generateFrameNames('mage_run', { prefix: 'running', end: 7, zeroPad: 4 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.jump,
            frames: this.anims.generateFrameNames('mage_jump', { prefix: 'jumping', end: 7, zeroPad: 4 }),
            frameRate: 4,
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.attack,
            frames: this.anims.generateFrameNames('mage_attack', { prefix: 'attackRight', end: 7, zeroPad: 4 }),
            frameRate: 16, // bigger animation
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.hurt,
            frames: this.anims.generateFrameNames('mage_idle', { prefix: 'idle', end: 7, zeroPad: 4 }),
            frameRate: 8,
            repeat: 0
        });
    }
}