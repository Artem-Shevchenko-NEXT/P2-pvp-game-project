import { Character } from './Character.js';
//import { StateMachine } from './state-machine/stateMachine.js';

export class HeroCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'hero',
            idleSpriteKey: 'hero_idle', 
            health: 100,  
            maxHealth: 100,
            attackDamage: 8, 
            invincibilityDuration: 800, 
            hitboxConfig: { width: 50, height: 100 }, 
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
        this.setScale(0.80);
        this.body.setSize(27, 60); 
        this.body.setOffset(0, 0);
        // Store the different offsets 
        this.rightFacingOffset = { x: 0, y: 0 };
        this.leftFacingOffset = { x: 5, y: 0 };  
        
        // offest based on initial direction
        this.body.setOffset(this.rightFacingOffset.x, this.rightFacingOffset.y);
        
        //previous flipX state to detect changes
        this.prevFlipX = this.flipX;
    }
    
    initAnimations() {
        this.anims.create({
            key: this.animationKeys.left,
            frames: this.anims.generateFrameNames('hero_run', { prefix: 'running', end: 10, zeroPad: 4 }),
            frameRate: 16, //aendrede vaerdier
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.turn,
            frames: this.anims.generateFrameNames('hero_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 5, 
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.right,
            frames: this.anims.generateFrameNames('hero_run', { prefix: 'running', end: 10, zeroPad: 4 }),
            frameRate: 16,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.jump,
            frames: this.anims.generateFrameNames('hero_jump', { prefix: 'jumping', end: 11, zeroPad: 4 }),
            frameRate: 10,
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.attack,
            frames: this.anims.generateFrameNames('hero_attack', { prefix: 'attackRight', end: 4, zeroPad: 4 }),
            frameRate: 12, // 
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.hurt,
            frames: this.anims.generateFrameNames('hero_hurt', { prefix: 'hurt', end: 3, zeroPad: 4 }),
            frameRate: 12,
            repeat: 0
        });
    }

    update() {
        // Check if flipX state changed
        if (this.flipX !== this.prevFlipX) {
            if (this.flipX) {
                this.body.setOffset(this.leftFacingOffset.x, this.leftFacingOffset.y);
            } else {
                this.body.setOffset(this.rightFacingOffset.x, this.rightFacingOffset.y);
            }
            this.prevFlipX = this.flipX;
        }
        
        // Call parent update method
        super.update();
    }
}
