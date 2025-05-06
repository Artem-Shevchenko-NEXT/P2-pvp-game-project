import { PLAYER1_SPAWN_X, PLAYER1_SPAWN_Y, SCREEN_HEIGHT, SCREEN_WIDTH } from '../config.js';
import { TankCharacter } from '../gameObjects/TankCharacter.js';
import { NinjaCharacter } from '../gameObjects/NinjaCharacter.js';
import { ArcherCharacter } from '../gameObjects/ArcherCharacter.js';
import { HeroCharacter } from '../gameObjects/HeroCharacter.js';
import NetworkManager from '../multiplayer/NetworkManager.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.networkManager = null;
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
                    console.log(`Background image: ${imageKey}, name: ${object.name}, gid: ${object.gid}, x: ${image.x}, y: ${image.y}, scaleX: ${image.scaleX}, scaleY: ${image.scaleY}, depth: ${image.depth}`);
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

        /*
        // Old attempt: Scaling the offset instead of the scale.
        let xOffset = 0;
        if (screenWidth > mapWidth) {
            xOffset = Math.floor((screenWidth - mapWidth) / 2);
        }

        let yOffset = 0;
        if (screenHeight > mapHeight) {
          yOffset = screenHeight - mapHeight;
        }

        ground.setPosition(xOffset, yOffset);
        platforms.setPosition(xOffset, yOffset);

        this.physics.world.setBounds(xOffset, yOffset, mapWidth, mapHeight);
        this.cameras.main.setBounds(xOffset, yOffset, mapWidth, mapHeight);
        */

        // Experimental code for scaling the player with resolution-change.
        /*
        const spawnX = PLAYER1_SPAWN_X * scaleX;
        const spawnY = PLAYER1_SPAWN_Y * scaleY;

        this.player1 = new Player(this, spawnX, spawnY);
        this.player1.setScale(scaleX, scaleY);

        this.player1.body.setSize(
            this.player1.displayWidth,
            this.player1.displayHeight
        );
        */

        // Create player 1
        
        this.player1 = new HeroCharacter(this, 100, 450);
        //socket.emit('newPlayer');

        // Create a dummy target for hitbox testing
        this.dummyTarget = this.physics.add.sprite(200, 450, 'tank_idle');
        this.dummyTarget.setImmovable(true);
        this.dummyTarget.health = 100; // For testing damage
        this.physics.add.collider(this.dummyTarget, ground);
        
        //Debug: to check hurt state for player: in console everything works although health bar does not correctly update.
        //this.input.keyboard.on('keydown-T', () => {
        //    this.player1.takeDamage(10);
        //});

        // Set up hitbox collisions with dummy target
        this.physics.add.overlap(
            this.player1,
            this.dummyTarget,
            this.handleHitboxCollision,
            (player, target) => {
                return player.hitbox && target.active;
            },
            this
        );

        // Shockwave: Set up shockwave collisions with dummy target
        this.physics.add.overlap(
            this.player1,
            this.dummyTarget,
            this.handleShockwaveCollision,
            (player, target) => {
                return player.shockwave && target.active;
            },
            this
        );
        //socket.emit('newPlayer');
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
        this.physics.add.collider(this.player1, ground);
        
        //this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Connect to server
        this.networkManager = new NetworkManager();
        this.networkManager.connect()
            .then(data => {
                console.log('Connected to server with ID:', data.id);
                
                // Join the game after successful connection
                this.networkManager.joinGame({
                    x: this.player1.x,
                    y: this.player1.y
                });
            })
            .catch(err => {
                console.error('Failed to connect:', err);
            });
    }   

    handleHitboxCollision(attacker, target) {
        if (attacker.hitbox && attacker !== target && !target.isInvincible) {
            console.log(`Hitbox collision: ${attacker.characterType} hits target, dealing ${attacker.attackDamage} damage`);
            target.health = Math.max(0, target.health - attacker.attackDamage);
            if (target.health <= 0) {
                console.log('Dummy target destroyed');
                target.destroy();
            }
        }
    }

    // Shockwave: Handle collision between shockwave and target
    handleShockwaveCollision(attacker, target) {
        if (attacker.shockwave && attacker !== target && !target.isInvincible) {
            console.log(`Shockwave collision: ${attacker.characterType} hits target, dealing ${attacker.attackDamage} damage`);
            target.health = Math.max(0, target.health - attacker.attackDamage);
            attacker.destroyShockwave(); // Destroy shockwave immediately on hit
            if (target.health <= 0) {
                console.log('Dummy target destroyed');
                target.destroy();
            }
        }
    }

    update() {
        // Update players
        this.player1.update();

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
        
        const bar_x = this.player1.x - 22;
        const bar_y = this.player1.y - 90;
        this.healthBar.setPosition(bar_x, bar_y);
        this.healthBar.setText(`${this.player1.health} HP`);
        this.healthBar.update();
        
        //
    }
}