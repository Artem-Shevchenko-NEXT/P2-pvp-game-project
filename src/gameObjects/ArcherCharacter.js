import { Character } from './Character.js';

export class ArcherCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'archer',
            idleSpriteKey: 'archer_idle', 
            health: 80, // ninjavaerdier
            maxHealth: 80,
            attackDamage: 15, 
            invincibilityDuration: 800, 
            hitboxConfig: { width: 30, height: 40 }, 
            animationKeys: {
                left: 'archer_left',
                right: 'archer_right',
                turn: 'archer_turn',
                jump: 'archer_jump',
                attack: 'archer_attack',
                hurt: 'archer_hurt'
            }
        });
    }

    initAnimations() {
        this.anims.create({
            key: this.animationKeys.left,
            frames: this.anims.generateFrameNames('archer_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 10, // aendrede vaerdier
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.turn,
            frames: this.anims.generateFrameNames('archer_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 4, 
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.right,
            frames: this.anims.generateFrameNames('archer_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.jump,
            frames: this.anims.generateFrameNames('archer_jump', { prefix: 'jumping', end: 7, zeroPad: 4 }),
            frameRate: 4,
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.attack,
            frames: this.anims.generateFrameNames('archer_attack', { prefix: 'attackRight', end: 4, zeroPad: 4 }),
            frameRate: 10, // slow
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.hurt,
            frames: this.anims.generateFrameNames('archer_hurt', { prefix: 'hurt', end: 3, zeroPad: 4 }),
            frameRate: 12,
            repeat: 0
        });
    }
}