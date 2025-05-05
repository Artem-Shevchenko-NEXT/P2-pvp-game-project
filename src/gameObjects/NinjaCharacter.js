import { Character } from './Character.js';

export class NinjaCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'ninja',
            idleSpriteKey: 'ninja_idle',
            health: 80, // Less health than tank
            maxHealth: 80,
            attackDamage: 15, // Higher damage
            invincibilityDuration: 800, // Shorter invincibility
            hitboxConfig: { width: 30, height: 40 }, // Smaller hitbox
            animationKeys: {
                left: 'ninja_left',
                right: 'ninja_right',
                turn: 'ninja_turn',
                jump: 'ninja_jump',
                attack: 'ninja_attack',
                hurt: 'ninja_hurt'
            }
        });
    }

    initAnimations() {
        // Placeholder: Using tank animations; replace with ninja assets
        this.anims.create({
            key: this.animationKeys.left,
            frames: this.anims.generateFrameNames('ninja_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 12, // Faster for ninja
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.turn,
            frames: this.anims.generateFrameNames('ninja_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.right,
            frames: this.anims.generateFrameNames('ninja_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.jump,
            frames: this.anims.generateFrameNames('ninja_jump', { prefix: 'jumping', end: 8, zeroPad: 4 }),
            frameRate: 6,
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.attack,
            frames: this.anims.generateFrameNames('ninja_attack', { prefix: 'attackRight', end: 4, zeroPad: 4 }),
            frameRate: 16, // Faster attack
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.hurt,
            frames: this.anims.generateFrameNames('ninja_hurt', { prefix: 'hurt', end: 8, zeroPad: 4 }),
            frameRate: 12,
            repeat: 0
        });
    }
}