import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../config.js';
export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.playersRanking  = data.playersRanking;
    }

    create() {

        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'menu_background').setOrigin(0.5, 0.57).setDisplaySize(SCREEN_WIDTH + 300, SCREEN_HEIGHT + 300);
        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.13, 'gameOver_sign').setScale(0.8).setOrigin(0.5);
        
        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.646, 'pedestal_1').setScale(3);
        this.add.image(SCREEN_WIDTH / 4, SCREEN_HEIGHT * 0.72, 'pedestal_2').setScale(3);
        this.add.image(SCREEN_WIDTH / 1.35, SCREEN_HEIGHT * 0.785, 'pedestal_3').setScale(3);

        this.add.sprite(310, 410, 'torch').play('torch_burn').setScale(3.5);
        this.add.sprite(505, 410, 'torch').play('torch_burn').setScale(3.5);

        this.add.image(SCREEN_WIDTH / 1.1, SCREEN_HEIGHT * 0.94, 'newGame_button')
        .setInteractive({ useHandCursor: true })
        .setScale(0.42)
        .setOrigin(0.5)
        .on('pointerdown', () => this.scene.start('CharacterSelector'));

        const amountOfPlayers = this.playersRanking.length;

        if (this.playersRanking[0]) { this.displayOnPedestal(this.playersRanking[0], amountOfPlayers) };
        if (this.playersRanking[1]) { this.displayOnPedestal(this.playersRanking[1], amountOfPlayers) };
        if (this.playersRanking[2]) { this.displayOnPedestal(this.playersRanking[2], amountOfPlayers) };
    

        /* ORIGINAL BELOW:
        this.cameras.main.setBackgroundColor(0xff0000);

        this.add.image(512, 384, 'background').setAlpha(0.5);

        this.add.text(512, 384, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);
        */
    }

    displayOnPedestal(player, playerAmount) {
        if (!player){
            return
        }

        let x, y;
        const thirdX = SCREEN_WIDTH / 1.35;
        const thirdY = SCREEN_HEIGHT * 0.73;
        const secondX = SCREEN_WIDTH / 4;
        const secondY = SCREEN_HEIGHT * 0.60;
        const firstX = SCREEN_WIDTH / 2;
        const firstY = SCREEN_HEIGHT * 0.45;
    
        if (player === this.playersRanking[0]){
            if (playerAmount > 2){
                x = thirdX;
                y = thirdY;
            } else {
                x = secondX
                y = secondY
            }
        } else if (player === this.playersRanking[1]){
            if (playerAmount > 2){
                x = secondX;
                y = secondY;
            } else {
                x = firstX
                y = firstY
            }
        } else if (player === this.playersRanking[2]) {
            x = firstX
            y = firstY
        } else {
            return
        }
        
        const textureKey = player.texture.key; 

        const animKey = (player.animationKeys && player.animationKeys.turn) || 'turn';

        const rankingPreviewSprite = this.add.sprite(x, y, textureKey).setOrigin(0.5, 1).setScale(2.5);

        if (this.anims.exists(animKey)) {
            rankingPreviewSprite.play(animKey, true);
        }
    
    }
}
