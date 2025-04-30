import { TankCharacter } from '../gameObjects/TankCharacter.js';
import { NinjaCharacter } from '../gameObjects/NinjaCharacter.js';
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
                        image.setScale(object.width / sourceWidth, object.height / sourceHeight);
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

        // Create player 1
        this.player1 = new TankCharacter(this, 100, 450);
                //display health note. we can customise this font see description over text method
                this.player1HealthText = this.add.text(20, 20, `Player 1 (${this.player1.characterType}) Health: ${this.player1.health}`, {
                    fontFamily: 'Arial',
                    fontSize: 24,
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setDepth(10);
        // Set up collision between player and ground
        this.physics.add.collider(this.player1, ground);
                //this.cameras.main.startFollow(this.player);
                this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // player 2 logic if need be add it back in
        //this.player2 = new NinjaCharacter(this, 900, 450);
        //this.physics.add.collider(this.player2, ground);
        // set up collison between player1 and player2 to prevent overlap(note somethings a little off here)
        //this.physics.add.collider(this.player1, this.player2);

        /*
        //Set up hitbox collisions
        this.physics.add.overlap(
            this.player1,
            this.player2,
            this.handleHitboxCollision,
            (player1, player2) => {
                return player1.hitbox && player2.active;
            },
            this
        );
        this.physics.add.overlap(
            this.player2,
            this.player1,
            this.handleHitboxCollision,
            (player2, player1) => {
                return player2.hitbox && player1.active;
            },
            this
        );
        */

        /*
        this.player2HealthText = this.add.text(560, 20, `Player 2 (${this.player2.characterType}) Health: ${this.player2.health}`, {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(10);
        */
        /*
        // Set up input for player2 (temporary for testing)
        this.player2Keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            attack: Phaser.Input.Keyboard.KeyCodes.S
        });
        */
        // Set camera to follow player if we would like this feature


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
            target.takeDamage(attacker.attackDamage);
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

        this.player1HealthText.setText(`Player 1 (${this.player1.characterType}) Health: ${this.player1.health}`);

        /* once again all below is player 2 logic
        this.player2.update();
        // Temporary input handling for player2 (replace with network input for multiplayer)
        if (this.player2Keys.left.isDown) {
            this.player2.stateMachine.transition('MOVE_LEFT');
        } else if (this.player2Keys.right.isDown) {
            this.player2.stateMachine.transition('MOVE_RIGHT');
        } else if (Phaser.Input.Keyboard.JustDown(this.player2Keys.attack)) {
            this.player2.stateMachine.transition('ATTACK');
        } else if (this.player2Keys.up.isDown && this.player2.body.blocked.down) {
            this.player2.stateMachine.transition('JUMP');
        } else if (
            !this.player2Keys.left.isDown &&
            !this.player2Keys.right.isDown &&
            this.player2.stateMachine.currentState !== 'ATTACK' &&
            this.player2.stateMachine.currentState !== 'HURT' &&
            this.player2.stateMachine.currentState !== 'JUMP'
        ) {
            this.player2.stateMachine.transition('IDLE');
        }

        // Update health text
        this.player2HealthText.setText(`Player 2 (${this.player2.characterType}) Health: ${this.player2.health}`);
        */
    }
    
}