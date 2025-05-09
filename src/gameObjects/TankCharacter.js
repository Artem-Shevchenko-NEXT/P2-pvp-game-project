import { Character } from './Character.js';

export class TankCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'tank',
            idleSpriteKey: 'tank_idle',
            health: 100,
            maxHealth: 100,
            attackDamage: 1,
            invincibilityDuration: 1000,
            hitboxConfig: { width: 40, height: 50 },
            animationKeys: {
                left: 'tank_left',
                right: 'tank_right',
                turn: 'tank_turn',
                jump: 'tank_jump',
                attack: 'tank_attack',
                attack2: 'tank_attack2',
                hurt: 'tank_hurt'
            }
        });
        this.body.setSize(27, 60); 
        this.body.setOffset(0, 0);
        console.log('TankCharacter initialized');
    }

    initAnimations() {
        try {
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
            this.anims.create({ //standard attack
                key: this.animationKeys.attack,
                frames: this.anims.generateFrameNames('tank_attack', { prefix: 'attackRight', end: 5, zeroPad: 4 }),
                frameRate: 13,
                repeat: 0
            });
            this.anims.create({ //secondary attack i.e attack2
                key: this.animationKeys.attack2,
                frames: this.anims.generateFrameNames('tank_attack', { prefix: 'secondAttack', end: 5, zeroPad: 4 }),
                frameRate: 13,
                repeat: 0
            });
            this.anims.create({
                key: this.animationKeys.hurt,
                frames: this.anims.generateFrameNames('tank_hurt', { prefix: 'hurt', end: 3, zeroPad: 4 }), // Placeholder replace with hurt animation
                frameRate: 10,
                repeat: 0
            });
            console.log('TankCharacter animations created successfully');
        } catch (error) {
            console.error('TankCharacter animation creation failed:', error);
        }
    }
}