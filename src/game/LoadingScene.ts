import * as Phaser from 'phaser';
import { GAME_EVENTS } from './constants';
import {
  createGrassTileset,
  createPlayerTexture,
  createShadowTexture,
  createHeartTexture,
} from './TextureFactory';
import { Projectile } from './Projectile';
import { Item } from './Item';
import { NPC } from './NPC';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  create(): void {
    this.progress(0);

    createGrassTileset(this);
    this.progress(0.2);

    createPlayerTexture(this);
    createShadowTexture(this);
    createHeartTexture(this);
    this.progress(0.5);

    Projectile.ensureTexture(this);
    Item.ensureTextures(this);
    NPC.ensureTextures(this);
    this.progress(0.85);

    this.time.delayedCall(200, () => {
      this.progress(1);
      this.time.delayedCall(200, () => {
        this.game.events.emit(GAME_EVENTS.LOADING_COMPLETE);
        this.scene.start('MainScene');
      });
    });
  }

  private progress(value: number): void {
    this.game.events.emit(GAME_EVENTS.LOADING_PROGRESS, value);
  }
}
