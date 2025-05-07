import { Character } from './Character.js';

export class HeroCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'hero',
            idleSpriteKey: 'hero_idle', 
            health: 80, // ninjavaerdier
            maxHealth: 80,
            attackDamage: 15, 
            invincibilityDuration: 800, 
            hitboxConfig: { width: 30, height: 40 }, 
            animationKeys: {
                left: 'hero_left',
                right: 'hero_right',
                turn: 'hero_turn',
                jump: 'hero_jump',
                attack: 'hero_attack',
                attack2: 'hero_atack2',
                hurt: 'hero_hurt'
            }
        });
    }

    initAnimations() {
        this.anims.create({
            key: this.animationKeys.left,
            frames: this.anims.generateFrameNames('hero_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 12, //ninjavaerdier hele vejen ned
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.turn,
            frames: this.anims.generateFrameNames('hero_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 12, 
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.right,
            frames: this.anims.generateFrameNames('hero_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.jump,
            frames: this.anims.generateFrameNames('hero_jump', { prefix: 'jumping', end: 8, zeroPad: 4 }),
            frameRate: 6,
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.attack,
            frames: this.anims.generateFrameNames('hero_attack', { prefix: 'attackRight', end: 4, zeroPad: 4 }),
            frameRate: 16, // Faster attack
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.hurt,
            frames: this.anims.generateFrameNames('hero_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 12,
            repeat: 0
        });
    }
}