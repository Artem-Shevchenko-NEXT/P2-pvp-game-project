export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload() {
        //Load the assets for the game first we set path for the map assets 
        this.load.setPath('assets');
        
        //loading our tileset png file so that our json files from the proggram Tiled can use the json and use and arrange our tileset.
        this.load.image('tiles', 'oak_woods/oak_woods_tileset.png');
        //loading background images
        this.load.image('background1', 'oak_woods/background/background_layer_1.png');
        this.load.image('background2', 'oak_woods/background/background_layer_2.png');
        this.load.image('background3', 'oak_woods/background/background_layer_3.png');
        
        //loading our game map Json file from the program Tiled
        this.load.tilemapTiledJSON('tilemap', 'game_map_oakwood_v2.json');
       
        //Tank character assets loads here
        this.load.atlas(
            'tank_idle',
            'tank/tank_idle.png', 'tank/tank_idle.json'    
        );
        this.load.atlas(
            'tank_run',
            'tank/tank_run.png', 'tank/tank_run.json'    
        );
        this.load.atlas(
            'tank_jump',
            'tank/tank_jump.png', 'tank/tank_jump.json'    
        );
        this.load.atlas(
            'tank_attack',
            'tank/tank_attack.png', 'tank/tank_attack.json'    
        );

    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('Game');
         
    }
}
