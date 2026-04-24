import * as Phaser from 'phaser';
import { Player } from './Player';
import { Enemy, PatrolAxis } from './Enemy';
import { Item, WorldItemType } from './Item';
import { NPC, NPCDefinition } from './NPC';
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
  GAME_EVENTS,
  ATTACK_DAMAGE,
  CHEST_DROP_CHANCE,
  CHEST_INTERACT_RADIUS,
  HEART_HEAL_AMOUNT,
  MAX_INVENTORY,
  InventoryItem,
  ZoneId,
  ZONES,
  TRANSITION_FADE_MS,
  TRANSITION_EDGE_TILES,
  DialogPayload,
} from './constants';

const TREE_POSITIONS: Array<{ x: number; y: number }> = [];
const SPAWN_SAFE_TILES = 6;
const NPC_INTERACT_RADIUS = 42;
const TRANSITION_ZONE_THICKNESS = TRANSITION_EDGE_TILES * TILE_SIZE;

type EdgeDirection = 'east' | 'west';

interface ZoneConfig {
  numTrees: number;
  obstacleDensity: number;
  enemySpawns: Array<{ tx: number; ty: number; axis: PatrolAxis }>;
  heartSpawns: Array<{ tx: number; ty: number }>;
  npcs: NPCDefinition[];
  transitions: Partial<Record<EdgeDirection, ZoneId>>;
}

const centerX = WORLD_WIDTH / 2;
const centerY = WORLD_HEIGHT / 2;

const ZONE_CONFIGS: Record<ZoneId, ZoneConfig> = {
  grasslands: {
    numTrees: 40,
    obstacleDensity: 0.1,
    enemySpawns: [
      { tx: 14, ty: 14, axis: 'x' },
      { tx: 46, ty: 14, axis: 'y' },
      { tx: 14, ty: 46, axis: 'y' },
      { tx: 46, ty: 46, axis: 'x' },
    ],
    heartSpawns: [
      { tx: 22, ty: 40 },
      { tx: 38, ty: 40 },
    ],
    npcs: [
      {
        id: 'elara',
        name: 'Elara the Herbalist',
        x: centerX - 110,
        y: centerY - 60,
        lines: [
          'Welcome to the Grasslands, traveler. These fields have been my home for many seasons.',
          'Beware the shadows stirring in the Forest to the east — creatures not seen for an age.',
          'Take care, and may the old light guide your path.',
        ],
      },
      {
        id: 'magnus',
        name: 'Old Magnus',
        x: centerX + 110,
        y: centerY - 60,
        lines: [
          'Hmph. Another young soul wandering into ruin.',
          'Past the Forest lies the Dungeon Entrance — none who ventured within have returned whole.',
          'If you must go, gather strength. Slay beasts. Crack open chests. Only then stand a chance.',
        ],
      },
    ],
    transitions: { east: 'forest' },
  },
  forest: {
    numTrees: 90,
    obstacleDensity: 0.08,
    enemySpawns: [
      { tx: 14, ty: 20, axis: 'x' },
      { tx: 44, ty: 22, axis: 'y' },
      { tx: 22, ty: 44, axis: 'x' },
      { tx: 42, ty: 42, axis: 'y' },
      { tx: 30, ty: 14, axis: 'x' },
      { tx: 18, ty: 32, axis: 'y' },
    ],
    heartSpawns: [
      { tx: 30, ty: 30 },
      { tx: 42, ty: 16 },
    ],
    npcs: [],
    transitions: { west: 'grasslands', east: 'dungeon' },
  },
  dungeon: {
    numTrees: 4,
    obstacleDensity: 0.22,
    enemySpawns: [
      { tx: 18, ty: 20, axis: 'x' },
      { tx: 42, ty: 20, axis: 'y' },
      { tx: 18, ty: 40, axis: 'y' },
      { tx: 42, ty: 40, axis: 'x' },
      { tx: 30, ty: 30, axis: 'x' },
      { tx: 30, ty: 16, axis: 'y' },
      { tx: 14, ty: 30, axis: 'x' },
    ],
    heartSpawns: [{ tx: 30, ty: 46 }],
    npcs: [],
    transitions: { west: 'forest' },
  },
};

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private items: Item[] = [];
  private npcs: NPC[] = [];
  private transitionZones: Array<{ zone: Phaser.GameObjects.Zone; target: ZoneId; edge: EdgeDirection }> = [];
  private treeGroup!: Phaser.GameObjects.Group;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private treeObstacles!: Phaser.Physics.Arcade.StaticGroup;

  private inventory: InventoryItem[] = [];
  private activeChest: Item | null = null;
  private activeNpc: NPC | null = null;
  private currentZone: ZoneId = 'grasslands';
  private isTransitioning = false;
  private isFreezeFraming = false;
  private ambientBreathTime = 0;

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
    this.createParticleTexture();
    Item.ensureTextures(this);
    NPC.ensureTextures(this);

    this.obstacles = this.physics.add.staticGroup();
    this.treeObstacles = this.physics.add.staticGroup();
    this.treeGroup = this.add.group();

    this.player = new Player(this, centerX, centerY);
    this.setupPersistentColliders();

    this.loadZone('grasslands', null);

    this.setupCamera();
    this.setupDepth();

    this.inventory = [];
    this.emitInventoryChange();

    // React → Phaser: dialog close signal
    this.game.events.on(GAME_EVENTS.DIALOG_CLOSE, this.handleDialogClose, this);
    // Player damage → particles via game event
    this.game.events.on(GAME_EVENTS.PLAYER_DAMAGED, this.onPlayerDamaged, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(GAME_EVENTS.DIALOG_CLOSE, this.handleDialogClose, this);
      this.game.events.off(GAME_EVENTS.PLAYER_DAMAGED, this.onPlayerDamaged, this);
    });
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

  // ─── Textures ─────────────────────────────────────────────────────────────

  private createObstacleTextures(): void {
    if (!this.textures.exists('rock')) {
      const gfx = this.add.graphics();
      const s = 28;
      gfx.fillStyle(0x78716c, 1);
      gfx.fillEllipse(s / 2, s / 2 + 2, s - 2, s - 8);
      gfx.fillStyle(0xa8a29e, 1);
      gfx.fillEllipse(s / 2 - 3, s / 2 - 2, s - 10, s - 16);
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

  private createParticleTexture(): void {
    if (!this.textures.exists('particle-sq')) {
      const gfx = this.add.graphics();
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(0, 0, 5, 5);
      gfx.generateTexture('particle-sq', 5, 5);
      gfx.destroy();
    }
  }

  // ─── Trees ────────────────────────────────────────────────────────────────

  private placeTrees(count: number): void {
    TREE_POSITIONS.length = 0;
    const margin = 3;

    for (let i = 0; i < count; i++) {
      const tx = Phaser.Math.Between(margin, MAP_WIDTH - margin);
      const ty = Phaser.Math.Between(margin, MAP_HEIGHT - margin);
      const px = tx * TILE_SIZE + TILE_SIZE / 2;
      const py = ty * TILE_SIZE + TILE_SIZE / 2;

      if (Math.abs(px - centerX) < 120 && Math.abs(py - centerY) < 120) continue;

      TREE_POSITIONS.push({ x: px, y: py });
      this.drawTree(px, py);
    }
  }

  private drawTree(x: number, y: number): void {
    const trunkGfx = this.add.graphics();
    trunkGfx.fillStyle(0x6b4226, 1);
    trunkGfx.fillRect(-5, -6, 10, 12);
    const trunkKey = `tree-trunk-${x}-${y}`;
    if (!this.textures.exists(trunkKey)) {
      trunkGfx.generateTexture(trunkKey, 10, 12);
    }
    trunkGfx.destroy();

    const shadowGfx = this.add.graphics();
    shadowGfx.fillStyle(0x000000, 0.2);
    shadowGfx.fillEllipse(0, 0, 38, 14);
    const shadowKey = `tree-shadow-${x}-${y}`;
    if (!this.textures.exists(shadowKey)) {
      shadowGfx.generateTexture(shadowKey, 38, 14);
    }
    shadowGfx.destroy();

    const shadow = this.add.image(x + 6, y + 10, shadowKey);
    shadow.setDepth(0.1);

    const canopyGfx = this.add.graphics();
    canopyGfx.fillStyle(0x2d6a35, 1);
    canopyGfx.fillCircle(0, 0, 22);
    canopyGfx.fillStyle(0x3a8044, 1);
    canopyGfx.fillCircle(-7, -6, 14);
    canopyGfx.fillCircle(8, -4, 16);
    const canopyKey = `tree-canopy-${x}-${y}`;
    if (!this.textures.exists(canopyKey)) {
      canopyGfx.generateTexture(canopyKey, 48, 48);
    }
    canopyGfx.destroy();

    const trunk = this.add.image(x, y, trunkKey);
    trunk.setDepth(y);
    const canopy = this.add.image(x, y - 18, canopyKey);
    canopy.setDepth(y + 0.5);

    this.treeGroup.add(shadow);
    this.treeGroup.add(trunk);
    this.treeGroup.add(canopy);
  }

  // ─── Obstacles ────────────────────────────────────────────────────────────

  private placeObstacles(density: number, protectedTiles: Set<string>): void {
    const centerTX = Math.floor(MAP_WIDTH / 2);
    const centerTY = Math.floor(MAP_HEIGHT / 2);

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

    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
      for (let tx = 0; tx < MAP_WIDTH; tx++) {
        const dFromSpawn = Math.max(
          Math.abs(tx - centerTX),
          Math.abs(ty - centerTY)
        );
        if (dFromSpawn < SPAWN_SAFE_TILES) continue;
        if (tx < 2 || tx > MAP_WIDTH - 3) continue;
        if (treeTiles.has(`${tx},${ty}`)) continue;
        if (protectedTiles.has(`${tx},${ty}`)) continue;
        if (Math.random() > density) continue;

        const px = tx * TILE_SIZE + TILE_SIZE / 2;
        const py = ty * TILE_SIZE + TILE_SIZE / 2;

        const rock = this.obstacles.create(px, py, 'rock') as Phaser.Physics.Arcade.Image;
        rock.setDepth(py);
        rock.refreshBody();
      }
    }

    for (const pos of TREE_POSITIONS) {
      const blocker = this.treeObstacles.create(
        pos.x, pos.y + 4, 'blocker'
      ) as Phaser.Physics.Arcade.Image;
      blocker.setVisible(false);
      blocker.refreshBody();
    }
  }

  // ─── Zone loading ─────────────────────────────────────────────────────────

  private loadZone(zone: ZoneId, enteredFrom: EdgeDirection | null): void {
    this.currentZone = zone;
    const config = ZONE_CONFIGS[zone];

    this.clearZoneContent();

    this.groundLayer.setTint(ZONES[zone].tint);

    const protectedTiles = new Set<string>();
    for (const spawn of config.enemySpawns) {
      protectedTiles.add(`${spawn.tx},${spawn.ty}`);
    }
    for (const spawn of config.heartSpawns) {
      protectedTiles.add(`${spawn.tx},${spawn.ty}`);
    }
    for (const npc of config.npcs) {
      const tx = Math.floor(npc.x / TILE_SIZE);
      const ty = Math.floor(npc.y / TILE_SIZE);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          protectedTiles.add(`${tx + dx},${ty + dy}`);
        }
      }
    }

    this.placeTrees(config.numTrees);
    this.placeObstacles(config.obstacleDensity, protectedTiles);
    this.spawnEnemies(config.enemySpawns);
    this.spawnInitialItems(config.heartSpawns);
    this.spawnNPCs(config.npcs);
    this.createTransitionZones(config.transitions);

    if (enteredFrom === 'east') {
      this.player.setPosition(TILE_SIZE * 3, centerY);
    } else if (enteredFrom === 'west') {
      this.player.setPosition(WORLD_WIDTH - TILE_SIZE * 3, centerY);
    } else {
      this.player.setPosition(centerX, centerY);
    }

    this.player.setZone(zone);
    this.player.setDepth(this.player.y + 1);

    this.game.events.emit(GAME_EVENTS.ZONE_CHANGE, this.currentZone);
  }

  private clearZoneContent(): void {
    for (const enemy of this.enemies) enemy.destroy();
    this.enemies.length = 0;

    for (const item of this.items) item.destroy();
    this.items.length = 0;

    for (const npc of this.npcs) npc.destroy();
    this.npcs.length = 0;

    for (const t of this.transitionZones) t.zone.destroy();
    this.transitionZones.length = 0;

    this.treeGroup.clear(true, true);
    this.obstacles.clear(true, true);
    this.treeObstacles.clear(true, true);

    this.activeChest = null;
    this.activeNpc = null;
  }

  // ─── Enemies ──────────────────────────────────────────────────────────────

  private spawnEnemies(spawns: ZoneConfig['enemySpawns']): void {
    for (const spawn of spawns) {
      const px = spawn.tx * TILE_SIZE + TILE_SIZE / 2;
      const py = spawn.ty * TILE_SIZE + TILE_SIZE / 2;
      const enemy = new Enemy(this, px, py, spawn.axis);
      this.enemies.push(enemy);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.physics.add.collider(enemy as any, this.obstacles);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.physics.add.collider(enemy as any, this.treeObstacles);
    }
  }

  // ─── Items ────────────────────────────────────────────────────────────────

  private spawnInitialItems(spawns: ZoneConfig['heartSpawns']): void {
    for (const spawn of spawns) {
      const px = spawn.tx * TILE_SIZE + TILE_SIZE / 2;
      const py = spawn.ty * TILE_SIZE + TILE_SIZE / 2;
      this.spawnWorldItem(px, py, 'heart_pickup');
    }
  }

  private spawnWorldItem(x: number, y: number, type: WorldItemType): Item {
    const item = new Item(this, x, y, type);
    this.items.push(item);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.physics.add.collider(item as any, this.obstacles);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.physics.add.collider(item as any, this.treeObstacles);
    return item;
  }

  // ─── NPCs ─────────────────────────────────────────────────────────────────

  private spawnNPCs(defs: NPCDefinition[]): void {
    for (const def of defs) {
      const npc = new NPC(this, def);
      this.npcs.push(npc);
      this.physics.add.collider(this.player, npc as unknown as Phaser.GameObjects.GameObject);
    }
  }

  // ─── Transitions ──────────────────────────────────────────────────────────

  private createTransitionZones(transitions: ZoneConfig['transitions']): void {
    const edgeHeight = WORLD_HEIGHT - 4 * TILE_SIZE;

    if (transitions.east) {
      const zone = this.add.zone(
        WORLD_WIDTH - TRANSITION_ZONE_THICKNESS / 2,
        centerY,
        TRANSITION_ZONE_THICKNESS,
        edgeHeight
      );
      this.physics.add.existing(zone);
      const body = zone.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      this.transitionZones.push({ zone, target: transitions.east, edge: 'east' });
      this.physics.add.overlap(this.player, zone, () => {
        this.changeToZone('east', transitions.east!);
      });
    }

    if (transitions.west) {
      const zone = this.add.zone(
        TRANSITION_ZONE_THICKNESS / 2,
        centerY,
        TRANSITION_ZONE_THICKNESS,
        edgeHeight
      );
      this.physics.add.existing(zone);
      const body = zone.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      this.transitionZones.push({ zone, target: transitions.west, edge: 'west' });
      this.physics.add.overlap(this.player, zone, () => {
        this.changeToZone('west', transitions.west!);
      });
    }
  }

  private changeToZone(fromDirection: EdgeDirection, nextZone: ZoneId): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.player.setFrozen(true);

    this.cameras.main.fadeOut(TRANSITION_FADE_MS, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.loadZone(nextZone, fromDirection);
      this.cameras.main.fadeIn(TRANSITION_FADE_MS, 0, 0, 0);
      this.cameras.main.once('camerafadeincomplete', () => {
        this.isTransitioning = false;
        this.player.setFrozen(false);
      });
    });
  }

  // ─── Persistent colliders (set up once, use array refs) ───────────────────

  private setupPersistentColliders(): void {
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.player, this.treeObstacles);

    this.physics.add.overlap(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.player as any,
      this.enemies as unknown as Phaser.GameObjects.GameObject[],
      (_p, enemyObj) => {
        const enemy = enemyObj as Enemy;
        if (enemy.isDying()) return;
        this.player.takeDamage(2);
      },
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player.getAttackZone(),
      this.enemies as unknown as Phaser.GameObjects.GameObject[],
      (_zone, enemyObj) => {
        const enemy = enemyObj as Enemy;
        if (!enemy.canBeHit()) return;
        enemy.takeDamage(ATTACK_DAMAGE, (ex, ey) => this.onEnemyDeath(ex, ey));

        this.cameras.main.shake(120, 0.004);
        this.spawnParticleBurst(enemy.x, enemy.y, 0xef4444, 7, 50, 320);
        this.showDamageNumber(enemy.x, enemy.y - 10, ATTACK_DAMAGE, false);
        this.triggerFreezeFrame(50);
      },
      undefined,
      this
    );
  }

  private onEnemyDeath(x: number, y: number): void {
    this.enemies = this.enemies.filter((e) => !e.isDying() && e.active);
    if (Math.random() < CHEST_DROP_CHANCE) {
      this.spawnWorldItem(x, y, 'chest');
    }
    // Big death burst + screen flash
    this.spawnParticleBurst(x, y, 0xef4444, 12, 70, 500);
    this.spawnParticleBurst(x, y, 0xfbbf24, 6, 45, 400);
    this.flashScreen();
  }

  // ─── Player damaged handler ───────────────────────────────────────────────

  private onPlayerDamaged(pos: { x: number; y: number }): void {
    this.spawnParticleBurst(pos.x, pos.y, 0xffffff, 8, 55, 350);
    this.spawnParticleBurst(pos.x, pos.y, 0xfde68a, 5, 35, 280);
    this.showDamageNumber(pos.x, pos.y - 10, 2, false);
  }

  // ─── Juice helpers ────────────────────────────────────────────────────────

  private spawnParticleBurst(
    x: number, y: number,
    color: number,
    count: number,
    spread: number,
    lifetime: number
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.4, 0.4);
      const speed = Phaser.Math.FloatBetween(spread * 0.35, spread);
      const sq = this.add.image(x, y, 'particle-sq');
      sq.setTint(color);
      sq.setDepth(9990);
      this.tweens.add({
        targets: sq,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed - spread * 0.15,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: lifetime,
        ease: 'Sine.easeOut',
        onComplete: () => sq.destroy(),
      });
    }
  }

  private showDamageNumber(worldX: number, worldY: number, amount: number, isHeal: boolean): void {
    const label = isHeal ? `+${amount}` : `-${amount}`;
    const text = this.add.text(worldX, worldY, label, {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '13px',
      color: isHeal ? '#4ade80' : '#f87171',
      stroke: '#000000',
      strokeThickness: 3,
      resolution: 2,
    });
    text.setOrigin(0.5, 1);
    text.setDepth(9991);
    this.tweens.add({
      targets: text,
      y: worldY - 42,
      alpha: 0,
      duration: 620,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private flashScreen(): void {
    const cam = this.cameras.main;
    const overlay = this.add.graphics();
    overlay.fillStyle(0xffffff, 1);
    overlay.fillRect(0, 0, cam.width, cam.height);
    overlay.setScrollFactor(0);
    overlay.setDepth(99998);
    overlay.setAlpha(0.3);
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 90,
      onComplete: () => overlay.destroy(),
    });
  }

  private triggerFreezeFrame(durationMs: number): void {
    if (this.isFreezeFraming) return;
    this.isFreezeFraming = true;
    window.setTimeout(() => {
      this.scene.resume();
      this.isFreezeFraming = false;
    }, durationMs);
    this.scene.pause();
  }

  // ─── Inventory ────────────────────────────────────────────────────────────

  private addToInventory(item: InventoryItem): void {
    this.inventory = [...this.inventory, item];
    if (this.inventory.length > MAX_INVENTORY) {
      this.inventory = this.inventory.slice(this.inventory.length - MAX_INVENTORY);
    }
    this.emitInventoryChange();
  }

  private emitInventoryChange(): void {
    this.game.events.emit(GAME_EVENTS.INVENTORY_CHANGE, [...this.inventory]);
  }

  // ─── Interaction (NPC priority over chest) ────────────────────────────────

  private updateInteractions(): void {
    this.items = this.items.filter((item) => item.active);
    this.npcs = this.npcs.filter((n) => n.active);

    // Auto-collect heart pickups
    for (const item of this.items) {
      if (item.itemType === 'heart_pickup' && !item.isOpened()) {
        const dist = Phaser.Math.Distance.Between(item.x, item.y, this.player.x, this.player.y);
        if (dist < 22) {
          const ix = item.x;
          const iy = item.y;
          item.collect(() => {
            this.player.heal(HEART_HEAL_AMOUNT);
            this.addToInventory('heart');
            this.spawnParticleBurst(ix, iy, 0x4ade80, 8, 42, 400);
            this.showDamageNumber(ix, iy - 8, HEART_HEAL_AMOUNT, true);
          });
        }
      }
    }

    // NPC proximity
    let nearestNpc: NPC | null = null;
    let nearestNpcDist = NPC_INTERACT_RADIUS;
    for (const npc of this.npcs) {
      const d = Phaser.Math.Distance.Between(npc.x, npc.y, this.player.x, this.player.y);
      if (d < nearestNpcDist) {
        nearestNpcDist = d;
        nearestNpc = npc;
      }
    }

    // Chest proximity (only if no NPC is available)
    let nearestChest: Item | null = null;
    if (!nearestNpc) {
      let nearestChestDist = CHEST_INTERACT_RADIUS;
      for (const item of this.items) {
        if (item.itemType !== 'chest' || item.isOpened()) continue;
        const d = Phaser.Math.Distance.Between(item.x, item.y, this.player.x, this.player.y);
        if (d < nearestChestDist) {
          nearestChestDist = d;
          nearestChest = item;
        }
      }
    }

    // Update prompts
    if (nearestNpc !== this.activeNpc) {
      this.activeNpc?.showInteractPrompt(false);
      this.activeNpc = nearestNpc;
    }
    if (nearestChest !== this.activeChest) {
      this.activeChest?.showInteractPrompt(false);
      this.activeChest = nearestChest;
    }

    if (this.activeNpc) {
      this.activeNpc.showInteractPrompt(true);
      this.player.setNearInteractable(true);
      if (this.player.wantsInteract()) {
        this.openDialog(this.activeNpc);
      }
    } else if (this.activeChest) {
      this.activeChest.showInteractPrompt(true);
      this.player.setNearInteractable(true);
      if (this.player.wantsInteract()) {
        const chestX = this.activeChest.x;
        const chestY = this.activeChest.y;
        const reward = this.activeChest.openChest();
        if (reward) {
          this.applyChestReward(reward);
          this.spawnParticleBurst(chestX, chestY, 0x4ade80, 10, 55, 480);
        }
        this.activeChest = null;
      }
    } else {
      this.player.setNearInteractable(false);
    }
  }

  private openDialog(npc: NPC): void {
    this.player.setDialogActive(true);
    const payload: DialogPayload = { npcName: npc.npcName, lines: npc.lines };
    this.game.events.emit(GAME_EVENTS.DIALOG_OPEN, payload);
  }

  private handleDialogClose(): void {
    this.player.setDialogActive(false);
  }

  private applyChestReward(reward: InventoryItem): void {
    if (reward === 'heart') this.player.heal(HEART_HEAL_AMOUNT);
    this.addToInventory(reward);
  }

  // ─── Camera & depth ───────────────────────────────────────────────────────

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
      if (enemy.active) enemy.update(this.player, delta);
    }

    for (const item of this.items) {
      if (item.active) item.update(delta);
    }

    for (const npc of this.npcs) {
      if (npc.active) npc.update(delta);
    }

    if (!this.isTransitioning && !this.player.isDialogActive()) {
      this.updateInteractions();
    }

    // Ambient camera breathing — very slow sin-wave follow offset
    this.ambientBreathTime += delta * 0.00055;
    this.cameras.main.setFollowOffset(0, Math.sin(this.ambientBreathTime) * 1.2);
  }
}
