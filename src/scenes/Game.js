import { PLAYER1_SPAWN_X, PLAYER1_SPAWN_Y, SCREEN_HEIGHT, SCREEN_WIDTH } from '../config.js';
import { TankCharacter } from '../gameObjects/TankCharacter.js';
import { NinjaCharacter } from '../gameObjects/NinjaCharacter.js';
import { ArcherCharacter } from '../gameObjects/ArcherCharacter.js';
import { HeroCharacter } from '../gameObjects/HeroCharacter.js';
import { SkeletonCharacter } from '../gameObjects/SkeletonCharacter.js';
import NetworkManager from '../multiplayer/NetworkManager.js';
import GameSync from '../multiplayer/GameSync.js';
import CombatManager from '../multiplayer/CombatManager.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.networkManager = null;
    }

    init(data) {
        this.selectedCharacter = data.character || 'tank';
    }

    create() {
        // Create the tilemap
        const map = this.make.tilemap({ key: 'tilemap' });
        const tileset = map.addTilesetImage('oakwood', 'tiles');

        // Create background from object layer note: this turned out to be way to complicated and we should have just used one background image.
        //we did this in hope of being able to make parralaxing but this is not important for MVP. and so far parralaxing has not been implemented.
        //so a little was of time.
        const backgroundLayer = map.getObjectLayer('Background');
        if (backgroundLayer) {
            backgroundLayer.objects.forEach((object, index) => {
                // Get the image key from properties
                let imageKey = null;
                if (object.properties) {
                    const imageProp = object.properties.find(prop => prop.name === 'image');
                    if (imageProp) {
                        imageKey = imageProp.value;
                    }
                }

                // Fallback to GID if no image property.
                if (!imageKey && object.gid) {
                    const gid = object.gid;
                    if (gid === 316) imageKey = 'background1';
                    else if (gid === 317) imageKey = 'background2';
                    else if (gid === 318) imageKey = 'background3';
                }

                if (imageKey) {
                    // Create the image with scaling to match Tiled dimensions
                    const image = this.add.image(object.x, object.y, imageKey)
                        .setOrigin(0, 0) // Align with Tiled's top-left origin
                        //setting background layers with different depths in order to stack them
                        .setDepth(-3 + index); // Unique depth: -3, -2, -1

                    // Override y-position with slight offset from Tiled
                    image.y = 0;

                    // Apply scaling if Tiled object dimensions differ from image
                    const imageData = this.textures.get(imageKey);
                    const sourceWidth = imageData.source[0].width;
                    const sourceHeight = imageData.source[0].height;
                    if (object.width && object.height) {
                            // The original background-scaling below: outcommented for experimenting with "dynamic"-background scaling
                        // image.setScale(object.width / sourceWidth, object.height / sourceHeight);

                        const scaleX = this.scale.width / sourceWidth; // sourceWidth/Height: is the height/width from the actual image file.
                        const scaleY = this.scale.height / sourceHeight;
                        const scale = Math.max(scaleX, scaleY); // Use Math.min() instead to NOT crop the image. 
                        
                        image.setScale(scale);
                    }

                    // Optional: Add parallax effect not sure if this really works
                    //image.setScrollFactor(0.3 + index * 0.2); // 0.3, 0.5, 0.7

                    // Debug: Log image details there was trouble rendering the object layer Background for from Tiled hense Debug
                    //console.log(`Background image: ${imageKey}, name: ${object.name}, gid: ${object.gid}, x: ${image.x}, y: ${image.y}, scaleX: ${image.scaleX}, scaleY: ${image.scaleY}, depth: ${image.depth}`);
                } else {
                    console.warn(`No valid image key for background object: ${object.name}, gid: ${object.gid}`);
                }
            });
        } else {
            console.warn('Background layer not found in tilemap');
        }

        // Create ground layer and set collisions
        const ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({ collides: true });

        // Debug: Log ground collision bounds
        ground.forEachTile(tile => {
            if (tile.properties.collides) {
                //console.log(`Ground collision tile at x=${tile.pixelX * ground.scaleX}, y=${tile.pixelY * ground.scaleY}`);
            }
        });

        // Create platforms layer and set collisions
        const platforms = map.createLayer('Platforms', tileset);
        platforms.setCollisionByProperty({ collides: true });

        const mapWidth    = map.widthInPixels;
        const mapHeight   = map.heightInPixels;
        // Calculating the scale for the map-file in relation to the resolution.
        const scaleX = SCREEN_WIDTH / mapWidth;
        const scaleY = SCREEN_HEIGHT / mapHeight;
        // And then seeting that scale ground- and platforms map-files.
        ground.setScale(scaleX, scaleY);
        platforms.setScale(scaleX, scaleY);

        const scaledWidth = mapWidth * scaleX;
        const scaledHeight = mapHeight * scaleY;


        this.playersInMatch = [];
        this.playersRanking = [];

        // Create player 1
        // Selecting character based on the key passed from CharacterSelector.js
        if (this.selectedCharacter === 'tank') {
            this.player1 = new TankCharacter(this, PLAYER1_SPAWN_X, PLAYER1_SPAWN_Y);
        } else if (this.selectedCharacter === 'ninja') {
            this.player1 = new NinjaCharacter(this, PLAYER1_SPAWN_X, PLAYER1_SPAWN_Y);
        } else if (this.selectedCharacter === 'hero') {
            this.player1 = new HeroCharacter(this, PLAYER1_SPAWN_X, PLAYER1_SPAWN_Y);
        } else if (this.selectedCharacter === 'archer') {
            this.player1 = new ArcherCharacter(this, PLAYER1_SPAWN_X, PLAYER1_SPAWN_Y);
        } else if (this.selectedCharacter === 'skeleton') {
            this.player1 = new SkeletonCharacter(this, PLAYER1_SPAWN_X, PLAYER1_SPAWN_Y);
        } else {
            // Fall back to tank as default
            this.player1 = new TankCharacter(this, PLAYER1_SPAWN_X, PLAYER1_SPAWN_Y);
        }

        this.playersInMatch.push(this.player1);

        // Create shockwave group with no gravity
        this.hitboxes = this.physics.add.group({
            allowGravity: false
        });

        // Create shockwave group with no gravity
        this.shockwaves = this.physics.add.group({
            allowGravity: false
        });
        // Create arrows group with gravity
        this.arrows = this.physics.add.group({
            allowGravity: false 
        });
        //arrows collide
        this.physics.add.collider(this.arrows, this.ground);
        this.physics.add.collider(
            this.arrows, 
            platforms, 
            (arrow, platform) => {
                if (arrow.owner) {
                    arrow.owner.destroyArrow();
                } else {
                    arrow.destroy();
                }
            },
            null,
            this
        );
        //create fireball group
        this.fireballs = this.physics.add.group({
            allowGravity: true
        });
        //fireball collision
        this.physics.add.collider(this.fireballs, this.ground);
        //this.physics.add.collider(this.fireballs, platforms);

        // Create player 1
        //this.player1 = new ArcherCharacter(this, 100, 480); // Adjusted y to align with ground

        //socket.emit('newPlayer');

        // Create a dummy target for hitbox testing
        this.dummyTarget = this.physics.add.sprite(200, 480, 'tank_idle'); // Adjusted y to align with ground
        this.dummyTarget.setImmovable(true);
        this.dummyTarget.health = 100; // For testing damage
        this.physics.add.collider(this.dummyTarget, ground);

        this.playersInMatch.push(this.dummyTarget);
        

        //Debug: to check hurt state for player: in console everything works although health bar does not correctly update.
        //this.input.keyboard.on('keydown-T', () => {
        //    this.player1.takeDamage(10);
        //});

        // Set up hitbox collisions with dummy target
        /*
        this.physics.add.overlap(
            this.player1,
            this.dummyTarget,
            this.handleHitboxCollision,
            (player, target) => {
                return player.hitbox && target.active;
            },
            this
        );
        */
        // Set up hitbox collisions with dummy target
        this.physics.add.overlap(
            this.hitboxes,          // Use the hitboxes group instead of player
            this.dummyTarget,
            this.handleHitboxCollision,
            null,                   // No need for additional checks
            this
        );
        // Shockwave: Set up shockwave collisions with dummy target
        this.physics.add.overlap(
            this.dummyTarget,
            this.shockwaves,
            this.handleShockwaveCollision,
            (target, shockwave) => {
                const overlap = shockwave && shockwave.active && target.active;
                if (overlap) {
                    console.log(`Shockwave overlap detected at x=${shockwave.x}, y=${shockwave.y}, target x=${target.body.x}, y=${target.body.y}`);
                }
                return overlap;
            },
            this
        );
        // Arrow: Set up shockwave collisions with dummy target
        this.physics.add.overlap(
            this.dummyTarget,
            this.arrows,
            this.handleArrowCollision,
            (target, arrow) => {
                const overlap = arrow && arrow.active && target.active;
                if (overlap) {
                    console.log(`Arrow overlap detected at x=${arrow.x}, y=${arrow.y}, target x=${target.body.x}, y=${target.body.y}`);
                }
                return overlap;
            },
            this
        );
        //Dummy/fireball collision
        this.physics.add.overlap(
            this.dummyTarget,
            this.fireballs,
            this.handleFireballCollision,
            (target, fireball) => {
                const overlap = fireball && fireball.active && target.active;
                if (overlap) {
                    console.log(`Fireball overlap detected at x=${fireball.x}, y=${fireball.y}, target x=${target.body.x}, y=${target.body.y}`);
                }
                return overlap;
            },
            this
        );
        //display health note. we can customise this font see description over text method
        this.player1HealthText = this.add.text(20, 20, `Player 1 (${this.player1.characterType}) Health: ${this.player1.health}`, {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(10);

        //dummy health
        this.dummyHealthText = this.add.text(500, 20, `Dummy Target Health: ${this.dummyTarget.health}`, {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(10);


        //health bar goes here
        const bar_x = 0;
        const bar_y = 0;
        this.healthBar = this.add.text(bar_x, bar_y, `${this.player1.health} HP`, {
            fontFamily: 'Arial',
            fontSize: 17,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1,
        }).setDepth(10);        

        // Set up collision between player and ground and platforms
        this.physics.add.collider(this.player1, ground);
        this.physics.add.collider(this.player1, platforms);
        
        //this.cameras.main.startFollow(this.player);
        this.physics.world.setBounds(0, 0, scaledWidth, scaledHeight);
        this.cameras.main.setBounds(0, 0, scaledWidth, scaledHeight);
        // Set up collision between player and ground
        this.physics.add.collider(this.player1, ground); //DBE i think this is a mistake?
        
        //this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Connect to server
        this.networkManager = new NetworkManager();
        this.networkManager.connect()
            .then(data => {
                console.log('Connected to server with ID:', data.id);

                // Create GameSync to handle player data
                this.gameSync = new GameSync(this, this.networkManager);
                this.gameSync.setLocalPlayer(this.player1);

                this.combatManager = new CombatManager(this, this.gameSync, this.networkManager);
                // Join the game after successful connection
                this.networkManager.joinGame({
                    x: this.player1.x,
                    y: this.player1.y,
                    characterType: this.selectedCharacter 
                });

                this.setupPvPCollisions();
            })
            .catch(err => {
                console.error('Failed to connect:', err);
            });      
        // Debug: Log dummy grounded state and body position
        //console.log(`Dummy body: x=${this.dummyTarget.body.x}, y=${this.dummyTarget.body.y}, width=${this.dummyTarget.body.width}, height=${this.dummyTarget.body.height}`);
    }   
    //needed logic for the pvp 
    setupPvPCollisions() {
        // Skip if gameSync doesn't exist yet
        if (!this.gameSync) return;
        
        // Get all remote players as array
        const remotePlayers = Array.from(this.gameSync.remotePlayers.values());
        
        // No players to collide with
        if (remotePlayers.length === 0) return;
        
        console.log(`Setting up PvP collisions with ${remotePlayers.length} remote players`);
        
        // Setup hitbox collisions with remote players
        this.physics.add.overlap(
            this.hitboxes,
            remotePlayers,
            this.handleHitboxCollision,
            null,
            this
        );
        
        // Setup shockwave collisions with remote players
        this.physics.add.overlap(
            remotePlayers, 
            this.shockwaves,
            this.handleShockwaveCollision,
            (target, shockwave) => {
                // CRITICAL FIX: Don't allow shockwave to collide with its owner
                if (shockwave.owner === target) {
                    return false;
                }
                return shockwave && shockwave.active && target.active;
            },
            this
        );

        // Setup arrow collisions with remote players
        this.physics.add.overlap(
            remotePlayers, 
            this.arrows,
            this.handleArrowCollision,
            (target, arrow) => {
                // Don't allow arrow to collide with its owner
                if (arrow.owner === target) {
                return false;
                }
                return arrow && arrow.active && target.active;
            },
            this
        );

        console.log("PvP collision handlers set up successfully");
    }
    // new handleHitboxCollision method
    handleHitboxCollision(target, hitbox) {  // Order is now target, hitbox
        // Skip if target is invincible or already hit
        if (target.isInvincible || hitbox.hitTargets.has(target.playerId || target)) {
            return;
        }
        
        // Get the owner (player) of the hitbox
        const attacker = hitbox.owner;
        
        // Mark this target as hit
        hitbox.hitTargets.add(target.playerId || target);
        
        // Use the specific damage from the hitbox
        const damage = hitbox.damage || attacker.attackDamage; // Fallback to owner's attackDamage if not set
        console.log(`Hitbox collision: ${attacker.characterType} hits target, dealing ${damage} damage`);
        
        // Register hit with combat manager if attacker is local player
        if (attacker === this.gameSync?.localPlayer && target.playerId) {
            this.combatManager.registerHit(attacker, target, damage);
        } else if (!target.playerId) {
            // For non-networked entities like dummy target
            target.health = Math.max(0, target.health - damage);
            if (target.health <= 0) {
                this.playersRanking.push(target);
                console.log('target destroyed');
                target.destroy();
                this.checkForGameOver();
            }
        }
    }
    // new handleShockwaveCollision method
    handleShockwaveCollision(target, shockwave) {
        if (shockwave && shockwave.active && target && target.active && !target.isInvincible) {
            //Double-check to prevent self-collision
            if (shockwave.owner === target) {
                console.log("Prevented self-collision with shockwave owner");
                return;
            }
            
            // Use the correct damage value from owner character
            const damage = shockwave.damage || (shockwave.owner ? shockwave.owner.attack2Damage : 10);
          
            console.log(`Shockwave hit: ${shockwave.owner.characterType} dealing ${damage} damage to target at (${target.x}, ${target.y})`);
          
            // only process if shockwave belongs to local player
            if (shockwave.owner === this.gameSync?.localPlayer && target.playerId) {
                this.combatManager.registerHit(shockwave.owner, target, damage);
            } else if (!target.playerId) {
                // for dummy targets
                target.health = Math.max(0, target.health - damage);
                if (target.health <= 0) {
                console.log('target destroyed');
                target.destroy();
                }
            }
            // destroy shockwave regardless
            shockwave.owner.destroyShockwave();
        }
    }



    // Arrow: Handle collision between arrow and target
    handleArrowCollision(target, arrow) {
        if (arrow && arrow.active && target && target.active && !target.isInvincible) {
            // Double-check to prevent self-collision
            if (arrow.owner === target) {
                console.log("Prevented self-collision with arrow owner");
                return;
            }

            // Get damage from arrow owner
            const damage = arrow.owner ? arrow.owner.attackDamage : 10;

            console.log(`Arrow hit: ${arrow.owner.characterType} dealing ${damage} damage to target at (${target.x}, ${target.y})`);

            // Only process if arrow belongs to local player
            if (arrow.owner === this.gameSync?.localPlayer && target.playerId) {
                this.combatManager.registerHit(arrow.owner, target, damage);
            } else if (!target.playerId) {
                // For dummy targets
                target.health = Math.max(0, target.health - damage);
                if (target.health <= 0) {
                    console.log('Target destroyed');
                    target.destroy();
                }
            }
            // Destroy arrow regardless
            arrow.owner.destroyArrow();
        }
    }
    //fireball collision
    handleFireballCollision(target, fireball) {
        if (fireball && fireball.active && target && target.active && !target.isInvincible) {
            // Double-check to prevent self-collision
            if (fireball.owner === target) {
                console.log("Prevented self-collision with fireball owner");
                return;
            }

            // Get damage from arrow owner
            const damage = fireball.owner ? fireball.owner.attackDamage : 10;

            console.log(`Fireball hit: ${fireball.owner.characterType} dealing ${damage} damage to target at (${target.x}, ${target.y})`);

            // Only process if arrow belongs to local player
            if (fireball.owner === this.gameSync?.localPlayer && target.playerId) {
                this.combatManager.registerHit(fireball.owner, target, damage);
            } else if (!target.playerId) {
                // For dummy targets
                target.health = Math.max(0, target.health - damage);
                if (target.health <= 0) {
                    console.log('Target destroyed');
                    target.destroy();
                }
            }
            // Destroy arrow regardless
            fireball.owner.destroyFireball();
        }
    }

    checkForGameOver(){
        if (this.playersRanking.length >= (this.playersInMatch.length -1)) {
            const winner = this.playersInMatch.find(player => !this.playersRanking.includes(player));
            this.playersRanking.push(winner);
            this.scene.start('GameOver', { playersRanking : this.playersRanking });
        } else {
            return;
        }
    }

    update() {
        // Update players
        this.player1.update();

        // Debug: Update dummy debug rectangle position
        if (this.dummyDebug && this.dummyTarget.active) {
            this.dummyDebug.setPosition(
                this.dummyTarget.body.x + this.dummyTarget.body.width / 2,
                this.dummyTarget.body.y + this.dummyTarget.body.height / 2
            );
        }

        // Debug: Log dummy grounded state
        if (this.dummyTarget.active) {
            console.log(`Dummy grounded: ${this.dummyTarget.body.blocked.down}`);
        }

        // Send player position updates to server if connected
        if (this.networkManager && this.networkManager.connected) {
            const currentState = this.player1.stateMachine.currentState;
            let animation = 'turn';
            let facing = this.player1.flipX ? 'left' : 'right';

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
                case 'ATTACK2':
                    animation = 'attack2';
                    break;    
                case 'HURT':     
                    animation = 'hurt';
                    break;
            }

            this.networkManager.sendPlayerUpdate(
                this.player1.x,
                this.player1.y,
                {
                    animation,
                    facing
                }
            );
        }

        // Update health text
        this.player1HealthText.setText(`Player 1 (${this.player1.characterType}) Health: ${this.player1.health}`);
        if (this.dummyTarget && this.dummyTarget.active) {
            this.dummyHealthText.setText(`Dummy Target Health: ${this.dummyTarget.health}`);
        } else {
            this.dummyHealthText.setText('Dummy Target: Destroyed');
        }

        //
        //
        //this.healthBar.setPosition(this.player1.x, this.player.y);
        ;
        //bar_x=1, bay_y=1;
        
        const bar_x = this.player1.x - 25;
        const bar_y = this.player1.y - 40;
        this.healthBar.setPosition(bar_x, bar_y);
        this.healthBar.setText(`${this.player1.health} HP`);
        this.healthBar.update();
        
        const hp = this.player1.health;

        if (hp > 60) {
            this.healthBar.setColor('#00ff00'); // groen
        } else if (hp > 30) {
            this.healthBar.setColor('#ffa500'); // orange
        } else {
            this.healthBar.setColor('#ff0000'); // roed
        }
        //
        if (this.characterType === 'archer' && this.stateMachine.currentState === 'ATTACK2') {
            console.log(`ATTACK2 state, arrow exists: ${!!this.arrow}`);
        }
    }
}