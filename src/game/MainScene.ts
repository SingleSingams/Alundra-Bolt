import * as Phaser from 'phaser';
import { Player } from './Player';
import { Enemy, PatrolAxis } from './Enemy';
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
const OBSTACLE_DENSITY = 0.13;
const SPAWN_SAFE_TILES = 6;

const ENEMY_SPAWNS: Array<{ tx: number; ty: number; axis: PatrolAxis }> = [
  { tx: 14, ty: 14, axis: 'x' },
  { tx: 46, ty: 14, axis: 'y' },
  { tx: 14, ty: 46, axis: 'y' },
  { tx: 46, ty: 46, axis: 'x' },
  { tx: 30, ty: 10, axis: 'x' },
];

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private treeGroup!: Phaser.GameObjects.Group;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private treeObstacles!: Phaser.Physics.Arcade.StaticGroup;

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
    this.createObstacleTextures();
    this.placeTrees();
    this.placeObstacles();

    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.spawnEnemies();
    this.setupColliders();

    this.sortTrees();
    this.setupCamera();
    this.setupDepth();
  }

  // ─── Tilemap ──────────────────────────────────────────────────────────────

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

  // ─── Obstacle textures ────────────────────────────────────────────────────

  private createObstacleTextures(): void {
    if (!this.textures.exists('rock')) {
      const gfx = this.add.graphics();
      const s = 28;

      // Rock base
      gfx.fillStyle(0x78716c, 1);
      gfx.fillEllipse(s / 2, s / 2 + 2, s - 2, s - 8);

      // Highlight
      gfx.fillStyle(0xa8a29e, 1);
      gfx.fillEllipse(s / 2 - 3, s / 2 - 2, s - 10, s - 16);

      // Crack detail
      gfx.lineStyle(1, 0x57534e, 0.8);
      gfx.strokeLineShape(new Phaser.Geom.Line(10, 14, 16, 20));
      gfx.strokeLineShape(new Phaser.Geom.Line(16, 20, 20, 16));

      gfx.generateTexture('rock', s, s);
      gfx.destroy();
    }

    if (!this.textures.exists('blocker')) {
      const gfx = this.add.graphics();
      gfx.fillStyle(0xffffff, 0.01);
      gfx.fillRect(0, 0, 18, 14);
      gfx.generateTexture('blocker', 18, 14);
      gfx.destroy();
    }
  }

  // ─── Trees ────────────────────────────────────────────────────────────────

  private placeTrees(): void {
    TREE_POSITIONS.length = 0;
    this.treeGroup = this.add.group();

    const margin = 3;
    const cx = WORLD_WIDTH / 2;
    const cy = WORLD_HEIGHT / 2;

    for (let i = 0; i < NUM_TREES; i++) {
      const tx = Phaser.Math.Between(margin, MAP_WIDTH - margin);
      const ty = Phaser.Math.Between(margin, MAP_HEIGHT - margin);
      const px = tx * TILE_SIZE + TILE_SIZE / 2;
      const py = ty * TILE_SIZE + TILE_SIZE / 2;

      if (Math.abs(px - cx) < 120 && Math.abs(py - cy) < 120) continue;

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
    canopyGfx.fillStyle(0x2d6a35, 1);
    canopyGfx.fillCircle(0, 0, 22);
    canopyGfx.fillStyle(0x3a8044, 1);
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

  // ─── Obstacles ────────────────────────────────────────────────────────────

  private placeObstacles(): void {
    this.obstacles = this.physics.add.staticGroup();
    this.treeObstacles = this.physics.add.staticGroup();

    const centerTX = Math.floor(MAP_WIDTH / 2);
    const centerTY = Math.floor(MAP_HEIGHT / 2);

    // Build a set of tile coords occupied by trees (plus 1-tile padding)
    const treeTiles = new Set<string>();
    for (const pos of TREE_POSITIONS) {
      const tx = Math.floor(pos.x / TILE_SIZE);
      const ty = Math.floor(pos.y / TILE_SIZE);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          treeTiles.add(`${tx + dx},${ty + dy}`);
        }
      }
    }

    // Also keep enemy spawn tiles clear
    const enemyTiles = new Set<string>(
      ENEMY_SPAWNS.flatMap(({ tx, ty }) => [
        `${tx},${ty}`, `${tx - 1},${ty}`, `${tx + 1},${ty}`,
        `${tx},${ty - 1}`, `${tx},${ty + 1}`,
      ])
    );

    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
      for (let tx = 0; tx < MAP_WIDTH; tx++) {
        const dFromSpawn = Math.max(
          Math.abs(tx - centerTX),
          Math.abs(ty - centerTY)
        );
        if (dFromSpawn < SPAWN_SAFE_TILES) continue;
        if (treeTiles.has(`${tx},${ty}`)) continue;
        if (enemyTiles.has(`${tx},${ty}`)) continue;
        if (Math.random() > OBSTACLE_DENSITY) continue;

        const px = tx * TILE_SIZE + TILE_SIZE / 2;
        const py = ty * TILE_SIZE + TILE_SIZE / 2;

        const rock = this.obstacles.create(px, py, 'rock') as Phaser.Physics.Arcade.Image;
        rock.setDepth(py);
        rock.refreshBody();
      }
    }

    // Invisible trunk colliders for each tree
    for (const pos of TREE_POSITIONS) {
      const blocker = this.treeObstacles.create(
        pos.x, pos.y + 4, 'blocker'
      ) as Phaser.Physics.Arcade.Image;
      blocker.setVisible(false);
      blocker.refreshBody();
    }
  }

  // ─── Enemies ──────────────────────────────────────────────────────────────

  private spawnEnemies(): void {
    this.enemies = [];
    for (const spawn of ENEMY_SPAWNS) {
      const px = spawn.tx * TILE_SIZE + TILE_SIZE / 2;
      const py = spawn.ty * TILE_SIZE + TILE_SIZE / 2;
      this.enemies.push(new Enemy(this, px, py, spawn.axis));
    }
  }

  // ─── Physics setup ────────────────────────────────────────────────────────

  private setupColliders(): void {
    // Player ↔ solid obstacles
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.player, this.treeObstacles);

    // Enemies ↔ solid obstacles (so they don't walk through rocks/trees)
    for (const enemy of this.enemies) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.physics.add.collider(enemy as any, this.obstacles);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.physics.add.collider(enemy as any, this.treeObstacles);
    }

    // Player ↔ enemies → deal damage
    this.physics.add.overlap(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.player as any,
      this.enemies as any[],
      () => {
        this.player.takeDamage(2);
      },
      undefined,
      this
    );
  }

  // ─── Camera & depth ───────────────────────────────────────────────────────

  private sortTrees(): void {
    this.children.each((child) => {
      const img = child as Phaser.GameObjects.Image;
      if (img.depth === undefined || img.depth === 0) {
        img.setDepth(img.y ?? 0);
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

  // ─── Game loop ────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    this.player.update(delta);
    this.player.setDepth(this.player.y + 1);

    for (const enemy of this.enemies) {
      enemy.update(this.player);
    }
  }
}
