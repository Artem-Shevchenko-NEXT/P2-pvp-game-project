import { Character } from './Character.js';
//temp
export class SkeletonCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'skeleton',
            idleSpriteKey: 'skeleton_idle',
            health: 80, // TBD
            maxHealth: 80,
            attackDamage: 15, // TBD
            invincibilityDuration: 800, // TBD
            hitboxConfig: { width: 30, height: 40 }, // TBD
            animationKeys: {
                left: 'skeleton_left',
                right: 'skeleton_right',
                turn: 'skeleton_turn',
                jump: 'skeleton_jump',
                attack: 'skeleton_attack',
                attack2: 'skeleton_attack2',
                hurt: 'skeleton_hurt'
            }
        });
        
    }

    initAnimations() {
        // Placeholder: Using tank animations; replace with skeleton assets
        try{
        this.anims.create({
            key: this.animationKeys.left,
            frames: this.anims.generateFrameNames('skeleton_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 12, // Faster for ninja
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.turn,
            frames: this.anims.generateFrameNames('skeleton_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.right,
            frames: this.anims.generateFrameNames('skeleton_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.jump,
            frames: this.anims.generateFrameNames('skeleton_jump', { prefix: 'jumping', end: 8, zeroPad: 4 }),
            frameRate: 6,
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.attack,
            frames: this.anims.generateFrameNames('skeleton_attack', { prefix: 'attackRight', end: 4, zeroPad: 4 }),
            frameRate: 16, // Faster attack
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.hurt,
            frames: this.anims.generateFrameNames('skeleton_hurt', { prefix: 'hurt', end: 8, zeroPad: 4 }),
            frameRate: 12,
            repeat: 0
        });
            console.log('SkeletonCharacter animations created successfully');
        } catch (error) {
            console.error('SkeletonCharacter animation creation failed:', error);
        }
    }
}