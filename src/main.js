import { SCREEN_HEIGHT, SCREEN_WIDTH } from './config.js';
import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { Preloader } from './scenes/Preloader.js';

const config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#4488aa',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 800 }
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        Game,
        GameOver
    ]
};

new Phaser.Game(config);
