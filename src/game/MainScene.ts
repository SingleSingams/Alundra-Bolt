import * as Phaser from 'phaser';
import { Player } from './Player';
import {
  createGrassTileset,
  createPlayerTexture,
  createShadowTexture,
  createHeartTexture,
} from './TextureFactory';
import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_VARIANTS,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CAMERA_LERP,
} from './constants';

const TREE_POSITIONS: Array<{ x: number; y: number }> = [];
const NUM_TREES = 40;

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private treeGroup!: Phaser.GameObjects.Group;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    createGrassTileset(this);
    createPlayerTexture(this);
    createShadowTexture(this);
    createHeartTexture(this);
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.buildTilemap();
    this.placeTrees();

    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    this.sortTrees();
    this.setupCamera();
    this.setupDepth();
  }

  private buildTilemap(): void {
    const map = this.make.tilemap({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
    });

    const tileset = map.addTilesetImage('grass-tiles', 'grass-tiles', TILE_SIZE, TILE_SIZE, 0, 0, 0);
    if (!tileset) throw new Error('Failed to add tileset');

    const layer = map.createBlankLayer('ground', tileset, 0, 0);
    if (!layer) throw new Error('Failed to create layer');

    this.groundLayer = layer;

    const weights = [0, 0, 0, 1, 1, 2, 3, 4];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tileIndex = weights[Math.floor(Math.random() * weights.length)] % TILE_VARIANTS;
        layer.putTileAt(tileIndex, x, y);
      }
    }
  }

  private placeTrees(): void {
    TREE_POSITIONS.length = 0;
    this.treeGroup = this.add.group();

    const margin = 3;
    for (let i = 0; i < NUM_TREES; i++) {
      const tx = Phaser.Math.Between(margin, MAP_WIDTH - margin);
      const ty = Phaser.Math.Between(margin, MAP_HEIGHT - margin);

      const px = tx * TILE_SIZE + TILE_SIZE / 2;
      const py = ty * TILE_SIZE + TILE_SIZE / 2;

      const centerX = WORLD_WIDTH / 2;
      const centerY = WORLD_HEIGHT / 2;
      if (Math.abs(px - centerX) < 100 && Math.abs(py - centerY) < 100) continue;

      TREE_POSITIONS.push({ x: px, y: py });
      this.drawTree(px, py);
    }
  }

  private drawTree(x: number, y: number): void {
    const trunkGfx = this.add.graphics();
    trunkGfx.fillStyle(0x6b4226, 1);
    trunkGfx.fillRect(-5, -6, 10, 12);
    trunkGfx.generateTexture(`tree-trunk-${x}-${y}`, 10, 12);
    trunkGfx.destroy();

    const shadowGfx = this.add.graphics();
    shadowGfx.fillStyle(0x000000, 0.2);
    shadowGfx.fillEllipse(0, 0, 38, 14);
    shadowGfx.generateTexture(`tree-shadow-${x}-${y}`, 38, 14);
    shadowGfx.destroy();

    const shadow = this.add.image(x + 6, y + 10, `tree-shadow-${x}-${y}`);
    shadow.setDepth(0.1);

    const canopyGfx = this.add.graphics();
    const green1 = 0x2d6a35;
    const green2 = 0x3a8044;
    canopyGfx.fillStyle(green1, 1);
    canopyGfx.fillCircle(0, 0, 22);
    canopyGfx.fillStyle(green2, 1);
    canopyGfx.fillCircle(-7, -6, 14);
    canopyGfx.fillCircle(8, -4, 16);
    canopyGfx.generateTexture(`tree-canopy-${x}-${y}`, 48, 48);
    canopyGfx.destroy();

    const trunk = this.add.image(x, y, `tree-trunk-${x}-${y}`);
    trunk.setDepth(y);
    const canopy = this.add.image(x, y - 18, `tree-canopy-${x}-${y}`);
    canopy.setDepth(y + 0.5);

    this.treeGroup.add(shadow);
    this.treeGroup.add(trunk);
    this.treeGroup.add(canopy);
  }

  private sortTrees(): void {
    this.children.each((child) => {
      const go = child as Phaser.GameObjects.GameObject;
      if ('depth' in go && typeof (go as Phaser.GameObjects.Image).y === 'number') {
        const img = go as Phaser.GameObjects.Image;
        if (img.depth === undefined || img.depth === 0) {
          img.setDepth(img.y);
        }
      }
    });
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
    this.cameras.main.setZoom(1.5);
  }

  private setupDepth(): void {
    this.groundLayer.setDepth(0);
    this.player.setDepth(this.player.y + 1);
  }

  update(_time: number, delta: number): void {
    this.player.update(delta);
    this.player.setDepth(this.player.y + 1);
  }
}
