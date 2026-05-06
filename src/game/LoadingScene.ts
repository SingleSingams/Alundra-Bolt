import * as Phaser from 'phaser';
import { GAME_EVENTS } from './constants';
import {
  createGrassTileset,
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

  preload(): void {
    this.load.spritesheet('knight', 'assets/knight.png', {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.spritesheet('npc-elder', 'assets/npc-elder.png', {
      frameWidth: 256,
      frameHeight: 256,
    });

    // NPC character sprites (4×4 grid, 256px frames, RGBA)
    const npcSprites = [
      'npc-woman-adventurer',
      'npc-elder-woman',
      'npc-old-explorer',
      'npc-old-pilgrim',
      'npc-young-man',
      'npc-innkeeper-woman',
    ];
    for (const key of npcSprites) {
      this.load.spritesheet(key, `assets/${key}.png`, {
        frameWidth: 256,
        frameHeight: 256,
      });
    }

    // Enemy sprites (4×4 grid, 256px frames, RGBA)
    const enemySprites = ['enemy-goblin', 'enemy-orc', 'enemy-rat', 'enemy-dark-dragon', 'enemy-red-dragon'];
    for (const key of enemySprites) {
      this.load.spritesheet(key, `assets/${key}.png`, {
        frameWidth: 256,
        frameHeight: 256,
      });
    }

    // Village buildings
    const buildings = [
      'building-farm', 'building-tavern', 'building-apothecary', 'building-market',
      'building-blacksmith', 'building-windmill', 'building-watchtower', 'building-manor',
    ];
    for (const key of buildings) {
      this.load.image(key, `assets/${key}.png`);
    }

    // World decorations (individual RGBA images)
    const decors = [
      'decor-tree', 'decor-rock', 'decor-log', 'decor-stump',
      'decor-bush', 'decor-bush-yellow', 'decor-bush-berry', 'decor-bush-flower',
      'decor-dungeon-gate', 'decor-dungeon-wall',
    ];
    for (const key of decors) {
      this.load.image(key, `assets/${key}.png`);
    }
  }

  create(): void {
    this.progress(0);

    // Knight — walk uses only frame 0 to prevent off-centre frame artefacts
    this.anims.create({
      key: 'knight-idle',
      frames: [{ key: 'knight', frame: 0 }],
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: 'knight-walk',
      frames: [{ key: 'knight', frame: 0 }],
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: 'knight-attack',
      frames: this.anims.generateFrameNumbers('knight', { start: 4, end: 7 }),
      frameRate: 16,
      repeat: 0,
    });
    this.anims.create({
      key: 'knight-hurt',
      frames: this.anims.generateFrameNumbers('knight', { start: 8, end: 9 }),
      frameRate: 10,
      repeat: 0,
    });
    this.anims.create({
      key: 'knight-death',
      frames: this.anims.generateFrameNumbers('knight', { start: 12, end: 13 }),
      frameRate: 5,
      repeat: 0,
    });

    // fallback elder (original sprite)
    this.anims.create({
      key: 'elder-idle',
      frames: [{ key: 'npc-elder', frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });

    // Enemy sprites — static frame 0
    for (const key of ['enemy-goblin', 'enemy-orc', 'enemy-rat', 'enemy-dark-dragon', 'enemy-red-dragon']) {
      if (this.textures.exists(key)) {
        this.anims.create({ key: `${key}-idle`, frames: [{ key, frame: 0 }], frameRate: 1, repeat: -1 });
      }
    }

    // All new NPC types — single static idle frame (frame 0 = front-facing)
    const npcKeys = [
      'npc-woman-adventurer',
      'npc-elder-woman',
      'npc-old-explorer',
      'npc-old-pilgrim',
      'npc-young-man',
      'npc-innkeeper-woman',
    ];
    for (const key of npcKeys) {
      if (this.textures.exists(key)) {
        this.anims.create({
          key: `${key}-idle`,
          frames: [{ key, frame: 0 }],
          frameRate: 1,
          repeat: -1,
        });
      }
    }

    createGrassTileset(this);
    this.progress(0.2);

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
