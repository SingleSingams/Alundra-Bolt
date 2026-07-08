import * as Phaser from 'phaser';
import { LoadingScene } from './LoadingScene';
import { MainScene } from './MainScene';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: parent.clientWidth,
    height: parent.clientHeight,
    parent,
    backgroundColor: '#2d5a27',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [LoadingScene, MainScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
    },
    render: {
      // The art assets are HD illustrations (256–1024px), not retro pixel art.
      // Linear filtering + antialiasing keeps them smooth when scaled down.
      pixelArt: false,
      antialias: true,
      roundPixels: false,
    },
  };
}
