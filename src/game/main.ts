import { Boot } from './scenes/Boot';

import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { GridScene } from './scenes/GridScene';
import { AnimationScene } from './scenes/AnimationScene';
//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        GridScene,
        AnimationScene
    ]
};

const StartGame = (parent: string): Game => {

    return new Game({ ...config, parent });

}

export default StartGame;
