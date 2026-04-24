import * as Phaser from 'phaser';
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
    scene: [MainScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
    },
    render: {
      pixelArt: true,
      antialias: false,
    },
  };
}
