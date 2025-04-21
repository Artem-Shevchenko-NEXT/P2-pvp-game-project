import { Player } from '../gameObjects/player.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        // Create the tilemap in our preloader we name and load tilesheet and json from Tiled
        const map = this.make.tilemap({ key: 'tilemap' });
        const tileset = map.addTilesetImage('oakwood', 'tiles'); 
        
        //attaching arcade physics to the tiles. in Tiled we have set at boolean property on our tiles 
        //called collides we want to transfer this property to phaser
        const ground = map.createLayer('ground', tileset); 
        ground.setCollisionByProperty({collides: true});
        
        // Create player
        this.player = new Player(this, 100, 450);
        // Set up collision between player and ground
        this.physics.add.collider(this.player, ground);


        // Set camera to follow player
       // this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Set up keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.moveLeft();
        } else if (this.cursors.right.isDown) {
            this.player.moveRight();
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.player.attack();
        } else {
            this.player.idle();
        }

        if (this.cursors.up.isDown) {
            this.player.jump();
        }
    }
}