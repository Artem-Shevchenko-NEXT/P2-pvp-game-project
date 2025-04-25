import { Player } from '../gameObjects/player.js';
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

        // Create player
        this.player = new Player(this, 100, 450);
        // Set up collision between player and ground
        this.physics.add.collider(this.player, ground);

        // Set camera to follow player if we would like this feature
        //this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Set up keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Connect to server
        this.networkManager = new NetworkManager();
        this.networkManager.connect()
            .then(data => {
                console.log('Connected to server with ID:', data.id);
                
                // Join game with player's initial position
                this.networkManager.joinGame({
                    x: this.player.x,
                    y: this.player.y
                });
                
                // Listen for game joined event
                this.networkManager.on('gameJoined', (data) => {
                    console.log('Joined game room with players:', data.players);
                });
            })
            .catch(err => {
                console.error('Failed to connect:', err);
            });
        
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.moveLeft();
            /*explanation for why the if statement is needed
             this.networkManager prevents the error that would happen if the game had loaded quiker 
             than the the network manager
             this.networkManager.connected makes sure no data is sent before your fully connected 
            */
            if (this.networkManager && this.networkManager.connected) {
                //sends the player data as defined in server.js through the networkManager
                this.networkManager.sendPlayerUpdate(
                    this.player.x,  
                    this.player.y,
                    { 
                        animation: 'left',
                        facing: 'left'
                    }
                );
            }
        } else if (this.cursors.right.isDown) {
            this.player.moveRight();
            if (this.networkManager && this.networkManager.connected) {
                this.networkManager.sendPlayerUpdate(
                    this.player.x, 
                    this.player.y,
                    { 
                        animation: 'right',
                        facing: 'right'
                    }
                );
            }
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.player.attack();
            this.player.attack();
            if (this.networkManager && this.networkManager.connected) {
                this.networkManager.sendPlayerUpdate(
                    this.player.x, 
                    this.player.y,
                    { 
                        animation: 'attack'
                    }
                );
            }
        } else {
            this.player.idle();
            if (this.networkManager && this.networkManager.connected) {
                this.networkManager.sendPlayerUpdate(
                    this.player.x, 
                    this.player.y,
                    { 
                        animation: 'turn'
                    }
                );
            }
        }

        if (this.cursors.up.isDown) {
            this.player.jump();
            if (this.networkManager && this.networkManager.connected) {
                this.networkManager.sendPlayerUpdate(
                    this.player.x, 
                    this.player.y,
                    { 
                        animation: 'jump'
                    }
                );
            }
        }
    }
}