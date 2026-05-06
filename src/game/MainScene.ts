import * as Phaser from 'phaser';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Item, WorldItemType } from './Item';
import { NPC, NPCDefinition } from './NPC';
import {
  createGrassTileset,
  createShadowTexture,
  createHeartTexture,
  createObstacleTextures,
  createParticleTexture,
  createHazardTextures,
  createSecretWallTexture,
} from './TextureFactory';
import { JuiceHelper } from './JuiceHelper';
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
  PROJECTILE_DAMAGE,
  CHEST_DROP_CHANCE,
  CHEST_INTERACT_RADIUS,
  HEART_HEAL_AMOUNT,
  MAX_HP,
  HAZARD_DAMAGE_INTERVAL,
  MAX_INVENTORY,
  POTION_HEAL_AMOUNT,
  InventoryItem,
  ZoneId,
  ZONES,
  TRANSITION_FADE_MS,
  TRANSITION_EDGE_TILES,
  DialogPayload,
  XP_PER_ENEMY,
  XP_PER_BOSS,
  MAX_LEVEL,
  XP_THRESHOLDS,
  MinimapData,
  LevelUpSkill,
  NG_PLUS_HP_MULT,
  NG_PLUS_DAMAGE_MULT,
  SKILL_SYNERGIES,
  QuestState,
} from './constants';
import { SaveSystem } from './SaveSystem';
import { Boss } from './Boss';
import { Projectile } from './Projectile';
import { SoundSystem } from './SoundSystem';
import { HapticSystem } from './HapticSystem';
import { ZONE_CONFIGS, ZoneConfig, EdgeDirection } from './ZoneConfigs';

const centerX = WORLD_WIDTH / 2;
const centerY = WORLD_HEIGHT / 2;

const TREE_POSITIONS: Array<{ x: number; y: number }> = [];
const SPAWN_SAFE_TILES = 6;
const DIRECTION_ANGLES: Record<string, number> = {
  n: -90, ne: -45, e: 0, se: 45,
  s: 90, sw: 135, w: 180, nw: -135,
};
const NPC_INTERACT_RADIUS = 42;
const TRANSITION_ZONE_THICKNESS = TRANSITION_EDGE_TILES * TILE_SIZE;

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private items: Item[] = [];
  private npcs: NPC[] = [];
  private transitionZones: Array<{ zone: Phaser.GameObjects.Zone; target: ZoneId; edge: EdgeDirection }> = [];
  private treeGroup!: Phaser.GameObjects.Group;
  private decorGroup!: Phaser.GameObjects.Group;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private treeObstacles!: Phaser.Physics.Arcade.StaticGroup;
  private hazardGroup!: Phaser.Physics.Arcade.StaticGroup;
  private secretWallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private hazardCooldown = 0;

  private inventory: InventoryItem[] = [];
  private activeChest: Item | null = null;
  private activeNpc: NPC | null = null;
  private currentZone: ZoneId = 'grasslands';
  private isTransitioning = false;
  private ambientBreathTime = 0;
  private currentAttackDamage = ATTACK_DAMAGE;
  private currentProjectileDamage = PROJECTILE_DAMAGE;
  private boss: Boss | null = null;
  private projectiles: Projectile[] = [];
  private xp = 0;
  private level = 1;
  private minimapThrottle = 0;
  private useItemKey!: Phaser.Input.Keyboard.Key;
  private killedEnemyIds = new Set<string>();
  private exploredChunks = new Set<string>();
  private readonly CHUNK_SIZE = 4;
  private ngPlus = 0;
  private combo = 0;
  private comboResetTimer = 0;
  private readonly COMBO_RESET_MS = 3000;
  private chosenSkills: LevelUpSkill[] = [];
  private openedSecrets = new Set<string>();
  private piercingShots = 0;
  private parryXpBonus = 0;
  private enhancedPotions = false;
  private juice!: JuiceHelper;
  private bossIntroShown = false;
  private questKills = 0;
  private questShieldFound = false;
  private questBossKilled = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    createGrassTileset(this);
    createShadowTexture(this);
    createHeartTexture(this);
    Projectile.ensureTexture(this);
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.buildTilemap();
    createObstacleTextures(this);
    createParticleTexture(this);
    createHazardTextures(this);
    createSecretWallTexture(this);
    Item.ensureTextures(this);
    NPC.ensureTextures(this);

    this.juice = new JuiceHelper(this);

    this.obstacles = this.physics.add.staticGroup();
    this.treeObstacles = this.physics.add.staticGroup();
    this.hazardGroup = this.physics.add.staticGroup();
    this.secretWallGroup = this.physics.add.staticGroup();
    this.treeGroup = this.add.group();
    this.decorGroup = this.add.group();

    this.player = new Player(this, centerX, centerY);
    this.setupPersistentColliders();

    const save = SaveSystem.load();
    this.loadZone(save?.zone ?? 'grasslands', null);

    this.setupCamera();
    this.setupDepth();

    if (save) {
      this.player.setHp(save.hp);
      this.inventory = save.inventory.slice(0, MAX_INVENTORY);
      this.xp = save.xp ?? 0;
      this.level = save.level ?? 1;
      this.ngPlus = save.ngPlus ?? 0;
      this.killedEnemyIds = new Set(save.killedEnemies ?? []);
      this.chosenSkills = save.chosenSkills ?? [];
      this.openedSecrets = new Set(save.openedSecrets ?? []);
      this.questKills = save.questKills ?? 0;
      this.questShieldFound = save.questShieldFound ?? false;
      this.questBossKilled = save.questBossKilled ?? false;
      this.recalculateAttackDamage();
      this.checkSynergies();
      this.emitInventoryChange();
      this.game.events.emit(GAME_EVENTS.XP_CHANGE, {
        xp: this.xp, level: this.level, nextLevelXp: XP_THRESHOLDS[this.level - 1] ?? null,
      });
      this.game.events.emit(GAME_EVENTS.SHIELD_CHANGE, this.player.getShieldCharges());
      this.game.events.emit(GAME_EVENTS.SAVE_LOADED);
    } else {
      this.inventory = [];
      this.emitInventoryChange();
      this.game.events.emit(GAME_EVENTS.XP_CHANGE, {
        xp: 0, level: 1, nextLevelXp: XP_THRESHOLDS[0],
      });
      this.game.events.emit(GAME_EVENTS.SHIELD_CHANGE, 0);
      // Show Mira intro dialog for new games
      this.time.delayedCall(900, () => {
        const introPaylod: DialogPayload = {
          npcName: 'Mira die Dorfälteste',
          portrait: 'assets/portraits/elder-woman.png',
          lines: [
            'Willkommen, Ritter. Ich bin froh, dass du gekommen bist — wir brauchen dich.',
            'Im Osten breitet sich das Dunkel aus. Der Leere-Tyrann erwacht nach hundert Jahren.',
            'Deine Aufgabe: besiege seine Diener im Wald, finde das Schild im Verlies, und stelle dich dem Tyrannen selbst.',
          ],
        };
        this.player.setDialogActive(true);
        this.game.events.emit(GAME_EVENTS.DIALOG_OPEN, introPaylod);
      });
    }

    this.emitQuestState();
    this.useItemKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // React → Phaser: dialog close signal
    this.game.events.on(GAME_EVENTS.DIALOG_CLOSE, this.handleDialogClose, this);
    // Player damage → particles via game event
    this.game.events.on(GAME_EVENTS.PLAYER_DAMAGED, this.onPlayerDamaged, this);
    // Shield block → blue spark effect
    this.game.events.on(GAME_EVENTS.SHIELD_BLOCK, this.onShieldBlock, this);
    // Attack sound on every swing
    this.game.events.on(GAME_EVENTS.PLAYER_ATTACK, () => SoundSystem.playAttack(), this);
    // React → Phaser: use potion from inventory
    this.game.events.on(GAME_EVENTS.USE_POTION, this.handleUsePotion, this);
    // React → Phaser: skill chosen at level-up
    this.game.events.on(GAME_EVENTS.LEVEL_UP_CHOSEN, this.handleSkillChosen, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(GAME_EVENTS.DIALOG_CLOSE, this.handleDialogClose, this);
      this.game.events.off(GAME_EVENTS.PLAYER_DAMAGED, this.onPlayerDamaged, this);
      this.game.events.off(GAME_EVENTS.SHIELD_BLOCK, this.onShieldBlock, this);
      this.game.events.off(GAME_EVENTS.PLAYER_ATTACK, undefined, this);
      this.game.events.off(GAME_EVENTS.USE_POTION, this.handleUsePotion, this);
      this.game.events.off(GAME_EVENTS.LEVEL_UP_CHOSEN, this.handleSkillChosen, this);
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

  // ─── Hazards ──────────────────────────────────────────────────────────────

  private spawnHazards(spawns: NonNullable<ZoneConfig['hazardSpawns']>): void {
    for (const h of spawns) {
      const px = h.tx * TILE_SIZE + TILE_SIZE / 2;
      const py = h.ty * TILE_SIZE + TILE_SIZE / 2;
      const key = h.kind === 'lava' ? 'hazard-lava' : 'hazard-thorns';
      const tile = this.hazardGroup.create(px, py, key) as Phaser.Physics.Arcade.Image;
      tile.setDepth(0.5);
      tile.refreshBody();
    }
  }

  // ─── Secret walls ─────────────────────────────────────────────────────────

  private spawnSecretWall(wall: NonNullable<ZoneConfig['secretWall']>): void {
    const secretId = `${this.currentZone}:${wall.tx},${wall.ty}`;
    if (this.openedSecrets.has(secretId)) return;

    const px = wall.tx * TILE_SIZE + TILE_SIZE / 2;
    const py = wall.ty * TILE_SIZE + TILE_SIZE / 2;
    const img = this.secretWallGroup.create(px, py, 'secret-wall') as Phaser.Physics.Arcade.Image;
    img.setDepth(py);
    img.setData('secretId', secretId);
    img.setData('reward', wall.reward);
    img.refreshBody();
  }

  private openSecret(wall: Phaser.Physics.Arcade.Image): void {
    if (!wall.active) return;
    const secretId = wall.getData('secretId') as string;
    const reward = wall.getData('reward') as InventoryItem;
    if (this.openedSecrets.has(secretId)) return;

    this.openedSecrets.add(secretId);
    const wx = wall.x;
    const wy = wall.y;

    this.juice.spawnParticleBurst(wx, wy, 0xfde68a, 18, 85, 550);
    this.juice.spawnParticleBurst(wx, wy, 0xfbbf24, 12, 55, 400);
    this.cameras.main.shake(250, 0.008);
    SoundSystem.playChestOpen();

    wall.destroy();
    this.applyChestReward(reward);
    this.saveCurrentState();
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
    if (this.textures.exists('decor-tree')) {
      // Use real pixel-art tree sprite
      const shadow = this.add.ellipse(x + 4, y + 22, 52, 16, 0x000000, 0.20);
      shadow.setDepth(0.1);
      const tree = this.add.image(x, y - 10, 'decor-tree').setScale(0.30);
      tree.setDepth(y + 0.5);
      this.treeGroup.add(shadow);
      this.treeGroup.add(tree);
      return;
    }

    // Fallback procedural tree
    const shadowGfx = this.add.graphics();
    shadowGfx.fillStyle(0x000000, 0.2);
    shadowGfx.fillEllipse(0, 0, 38, 14);
    const shadowKey = `tree-shadow-${x}-${y}`;
    if (!this.textures.exists(shadowKey)) shadowGfx.generateTexture(shadowKey, 38, 14);
    shadowGfx.destroy();

    const canopyGfx = this.add.graphics();
    canopyGfx.fillStyle(0x2d6a35, 1); canopyGfx.fillCircle(0, 0, 22);
    canopyGfx.fillStyle(0x3a8044, 1); canopyGfx.fillCircle(-7, -6, 14); canopyGfx.fillCircle(8, -4, 16);
    const canopyKey = `tree-canopy-${x}-${y}`;
    if (!this.textures.exists(canopyKey)) canopyGfx.generateTexture(canopyKey, 48, 48);
    canopyGfx.destroy();

    const shadow = this.add.image(x + 6, y + 10, shadowKey); shadow.setDepth(0.1);
    const canopy = this.add.image(x, y - 18, canopyKey); canopy.setDepth(y + 0.5);
    this.treeGroup.add(shadow);
    this.treeGroup.add(canopy);
  }

  // ─── Village (grasslands only) ────────────────────────────────────────────

  private placeVillage(): void {
    if (!this.textures.exists('building-tavern')) return; // assets not loaded yet

    // Ensure tiny blocker texture exists
    if (!this.textures.exists('_blocker')) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0); g.fillRect(0, 0, 2, 2);
      g.generateTexture('_blocker', 2, 2); g.destroy();
    }

    // Each entry: [textureKey, offsetX, offsetY, scale, blockerW, blockerH, blockerOffY]
    const layout: [string, number, number, number, number, number, number][] = [
      ['building-tavern',     -110, -145, 0.22,  64, 24, 30],
      ['building-farm',        160, -155, 0.20,  80, 22, 28],
      ['building-apothecary', -195,   20, 0.21,  72, 22, 26],
      ['building-market',      155,   30, 0.21,  72, 20, 24],
      ['building-blacksmith', -200,  165, 0.21,  68, 22, 26],
      ['building-windmill',      0,  220, 0.22,  52, 22, 30],
      ['building-watchtower',  205, -215, 0.22,  44, 22, 28],
    ];

    for (const [key, ox, oy, scale, bw, bh, bOffY] of layout) {
      if (!this.textures.exists(key)) continue;
      const x = centerX + ox;
      const y = centerY + oy;

      // Shadow ellipse under building
      const frame = this.textures.getFrame(key);
      const vw = frame.realWidth * scale;
      const vh = frame.realHeight * scale;
      const shadow = this.add.ellipse(x, y + vh * 0.48, vw * 0.75, 14, 0x000000, 0.22);
      shadow.setDepth(y - 1);
      this.decorGroup.add(shadow);

      // Visual building image
      const img = this.add.image(x, y, key).setScale(scale);
      img.setDepth(y + vh * 0.3);
      this.decorGroup.add(img);

      // Physics blocker at building base (keeps player/NPCs from walking through)
      const blocker = this.obstacles.create(x, y + bOffY, '_blocker') as Phaser.Physics.Arcade.Image;
      (blocker.body as Phaser.Physics.Arcade.StaticBody).setSize(bw, bh);
      blocker.setVisible(false).setAlpha(0);
      blocker.refreshBody();
    }

    // Dirt path connecting buildings — drawn under everything
    const pathGfx = this.add.graphics();
    pathGfx.fillStyle(0xb8a070, 0.35);
    // Horizontal main street
    pathGfx.fillRoundedRect(centerX - 230, centerY - 20, 460, 38, 8);
    // Vertical lane
    pathGfx.fillRoundedRect(centerX - 20, centerY - 240, 38, 320, 8);
    pathGfx.setDepth(0.05);
  }

  // ─── Decorations (non-blocking world dressing) ────────────────────────────

  private placeDecorations(zone: ZoneId, protectedTiles: Set<string>): void {
    type DecorSet = { keys: string[]; scale: number; count: number };

    const byZone: Partial<Record<ZoneId, DecorSet[]>> = {
      grasslands: [
        { keys: ['decor-bush-yellow', 'decor-bush-berry', 'decor-bush-flower'], scale: 0.28, count: 18 },
        { keys: ['decor-bush'], scale: 0.26, count: 12 },
        { keys: ['decor-rock'], scale: 0.22, count: 8 },
      ],
      forest: [
        { keys: ['decor-log', 'decor-stump'], scale: 0.28, count: 14 },
        { keys: ['decor-bush', 'decor-bush-berry'], scale: 0.26, count: 16 },
        { keys: ['decor-rock'], scale: 0.22, count: 6 },
      ],
      dungeon: [
        { keys: ['decor-rock'], scale: 0.22, count: 10 },
        { keys: ['decor-dungeon-wall'], scale: 0.30, count: 5 },
      ],
      dungeon_interior: [
        { keys: ['decor-rock'], scale: 0.20, count: 8 },
        { keys: ['decor-dungeon-wall'], scale: 0.30, count: 6 },
      ],
      boss_room: [
        { keys: ['decor-dungeon-gate'], scale: 0.32, count: 2 },
        { keys: ['decor-dungeon-wall'], scale: 0.28, count: 4 },
      ],
    };

    const sets = byZone[zone] ?? [];
    const margin = 3;

    for (const { keys, scale, count } of sets) {
      for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts++ < 20) {
          const tx = Phaser.Math.Between(margin, MAP_WIDTH - margin);
          const ty = Phaser.Math.Between(margin, MAP_HEIGHT - margin);
          const key = `${tx},${ty}`;
          if (protectedTiles.has(key)) continue;
          const px = tx * TILE_SIZE + TILE_SIZE / 2;
          const py = ty * TILE_SIZE + TILE_SIZE / 2;
          if (Math.abs(px - centerX) < 100 && Math.abs(py - centerY) < 100) continue;

          const texKey = keys[Math.floor(Math.random() * keys.length)];
          if (!this.textures.exists(texKey)) break;

          const img = this.add.image(px, py, texKey).setScale(scale);
          img.setDepth(py + 0.3);
          this.decorGroup.add(img);
          break;
        }
      }
    }
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
    this.exploredChunks.clear();

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
    this.placeDecorations(this.currentZone, protectedTiles);
    if (this.currentZone === 'grasslands') this.placeVillage();
    if (this.currentZone === 'forest') {
      this.placeCampfire(centerX - 50, centerY + 195);
      this.placeCampfire(centerX + 80, centerY + 195);
    }
    this.spawnEnemies(config.enemySpawns);
    this.spawnInitialItems(config.heartSpawns);
    if (config.hazardSpawns) this.spawnHazards(config.hazardSpawns);
    if (config.secretWall) this.spawnSecretWall(config.secretWall);
    this.spawnNPCs(config.npcs);
    if (config.bossSpawn) {
      this.spawnBoss(config.bossSpawn.tx, config.bossSpawn.ty);
    }
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

    const musicTheme = zone === 'boss_room' ? 'boss'
      : zone === 'dungeon' || zone === 'dungeon_interior' ? 'dungeon'
      : zone === 'forest' ? 'forest'
      : 'grasslands';
    SoundSystem.startMusic(musicTheme);
  }

  private clearZoneContent(): void {
    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
      this.game.events.emit(GAME_EVENTS.BOSS_HP, { hp: 0, maxHp: 0, phase: 1 });
    }

    // Deactivate pooled projectiles instead of destroying them
    for (const proj of this.projectiles) proj.deactivate();

    for (const enemy of this.enemies) enemy.destroy();
    this.enemies.length = 0;

    for (const item of this.items) item.destroy();
    this.items.length = 0;

    for (const npc of this.npcs) npc.destroy();
    this.npcs.length = 0;

    for (const t of this.transitionZones) t.zone.destroy();
    this.transitionZones.length = 0;

    this.treeGroup.clear(true, true);
    this.decorGroup.clear(true, true);
    this.obstacles.clear(true, true);
    this.treeObstacles.clear(true, true);
    this.hazardGroup.clear(true, true);
    this.secretWallGroup.clear(true, true);

    this.activeChest = null;
    this.activeNpc = null;
  }

  // ─── Enemies ──────────────────────────────────────────────────────────────

  private spawnEnemies(spawns: ZoneConfig['enemySpawns']): void {
    for (const spawn of spawns) {
      const id = `${this.currentZone}:${spawn.tx},${spawn.ty}`;
      if (this.killedEnemyIds.has(id)) continue;
      const px = spawn.tx * TILE_SIZE + TILE_SIZE / 2;
      const py = spawn.ty * TILE_SIZE + TILE_SIZE / 2;
      const hpMult = Math.pow(NG_PLUS_HP_MULT, this.ngPlus);
      const dmgMult = Math.pow(NG_PLUS_DAMAGE_MULT, this.ngPlus);
      const enemy = new Enemy(this, px, py, spawn.axis, this.level, spawn.type ?? 'basic', hpMult, dmgMult);
      enemy.setName(id);
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

  // ─── Boss ─────────────────────────────────────────────────────────────────

  private spawnBoss(tx: number, ty: number): void {
    const px = tx * TILE_SIZE + TILE_SIZE / 2;
    const py = ty * TILE_SIZE + TILE_SIZE / 2;
    this.boss = new Boss(this, px, py);
    this.boss.emitHp();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.physics.add.collider(this.boss as any, this.obstacles);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.physics.add.collider(this.boss as any, this.treeObstacles);

    this.physics.add.overlap(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.player as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.boss as any,
      () => {
        if (!this.boss || this.boss.isDying()) return;
        this.player.takeDamage(2);
      }
    );

    this.physics.add.overlap(
      this.player.getAttackZone(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.boss as any,
      () => {
        if (!this.boss || !this.boss.canBeHit()) return;
        const died = this.boss.takeDamage(
          this.currentAttackDamage,
          (bx, by) => this.onBossDeath(bx, by)
        );
        if (!died) {
          SoundSystem.playEnemyHit();
          this.cameras.main.shake(120, 0.004);
          this.juice.spawnParticleBurst(this.boss.x, this.boss.y, 0xef4444, 7, 50, 320);
          this.juice.showDamageNumber(this.boss.x, this.boss.y - 22, this.currentAttackDamage, false);
          this.juice.triggerFreezeFrame(50);
        }
      }
    );

    // Player projectiles ↔ boss
    this.physics.add.overlap(
      this.projectiles as unknown as Phaser.GameObjects.GameObject[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.boss as any,
      (projObj) => {
        const proj = projObj as Projectile;
        if (proj.isSpent() || proj.isEnemyProjectile || !this.boss?.canBeHit()) return;
        proj.hit();
        const died = this.boss!.takeDamage(this.currentProjectileDamage, (bx, by) => this.onBossDeath(bx, by));
        if (!died) {
          SoundSystem.playEnemyHit();
          this.juice.spawnParticleBurst(this.boss!.x, this.boss!.y, 0xfbbf24, 5, 40, 280);
          this.juice.showDamageNumber(this.boss!.x, this.boss!.y - 22, this.currentProjectileDamage, false);
        }
      }
    );

    this.game.events.once('boss-phase-2', (pos: { x: number; y: number }) => {
      SoundSystem.playBossPhase2();
      this.cameras.main.shake(450, 0.018);
      this.juice.spawnParticleBurst(pos.x, pos.y, 0x9333ea, 22, 95, 650);
      this.juice.spawnParticleBurst(pos.x, pos.y, 0xec4899, 16, 70, 500);
      this.juice.flashScreen();
    });
  }

  private onBossDeath(x: number, y: number): void {
    this.boss = null;
    this.gainXp(XP_PER_BOSS);
    SoundSystem.playBossDeath();
    if (!this.questBossKilled) {
      this.questBossKilled = true;
      this.emitQuestState();
      this.game.events.emit(GAME_EVENTS.QUEST_COMPLETE, 'Tyrann besiegt!');
    }
    this.cameras.main.shake(500, 0.022);
    this.juice.spawnParticleBurst(x, y, 0xef4444, 24, 110, 700);
    this.juice.spawnParticleBurst(x, y, 0xfbbf24, 18, 85, 580);
    this.juice.spawnParticleBurst(x, y, 0x9333ea, 14, 65, 450);
    this.juice.flashScreen();
    this.spawnWorldItem(x - 24, y, 'heart_pickup');
    this.spawnWorldItem(x + 24, y, 'heart_pickup');
    this.spawnWorldItem(x, y - 24, 'heart_pickup');
    this.time.delayedCall(1800, () => {
      this.game.events.emit(GAME_EVENTS.VICTORY, { ngPlus: this.ngPlus, level: this.level, xp: this.xp });
    });
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
    SoundSystem.playZoneTransition();

    this.cameras.main.fadeOut(TRANSITION_FADE_MS, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.loadZone(nextZone, fromDirection);
      this.cameras.main.fadeIn(TRANSITION_FADE_MS, 0, 0, 0);
      this.cameras.main.once('camerafadeincomplete', () => {
        this.isTransitioning = false;
        this.player.setFrozen(false);
        this.saveCurrentState();

        if (nextZone === 'boss_room' && !this.bossIntroShown) {
          this.bossIntroShown = true;
          this.time.delayedCall(500, () => {
            const bossPayload: DialogPayload = {
              npcName: 'Der Leere-Tyrann',
              portrait: 'assets/portraits/void-tyrant.png',
              lines: [
                '...Endlich. Ich habe auf dich gewartet, kleiner Ritter.',
                'Hundert Jahre schlief ich — bis das erste Schwert meinen Schlaf brach.',
                'Nun stirbst du hier. In der Leere.',
              ],
            };
            this.player.setDialogActive(true);
            this.game.events.emit(GAME_EVENTS.DIALOG_OPEN, bossPayload);
          });
        }
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
      this.hazardGroup,
      () => {
        if (this.hazardCooldown > 0) return;
        this.player.takeDamage(1);
        this.hazardCooldown = HAZARD_DAMAGE_INTERVAL;
      },
      undefined,
      this
    );

    this.physics.add.overlap(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.player as any,
      this.enemies as unknown as Phaser.GameObjects.GameObject[],
      (_p, enemyObj) => {
        const enemy = enemyObj as Enemy;
        if (enemy.isDying()) return;
        this.player.takeDamage(enemy.getContactDamage());
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
        const eid = enemy.name;
        enemy.takeDamage(this.currentAttackDamage, (ex, ey) => this.onEnemyDeath(ex, ey, eid));

        SoundSystem.playEnemyHit();
        HapticSystem.hit();
        this.cameras.main.shake(120, 0.004);
        this.juice.spawnParticleBurst(enemy.x, enemy.y, 0xef4444, 7, 50, 320);
        this.juice.showDamageNumber(enemy.x, enemy.y - 10, this.currentAttackDamage, false);
        this.juice.triggerFreezeFrame(50);
        this.incrementCombo();
      },
      undefined,
      this
    );

    // Player projectiles ↔ enemies (piercing-aware)
    this.physics.add.overlap(
      this.projectiles as unknown as Phaser.GameObjects.GameObject[],
      this.enemies as unknown as Phaser.GameObjects.GameObject[],
      (projObj, enemyObj) => {
        const proj = projObj as Projectile;
        const enemy = enemyObj as Enemy;
        if (proj.isSpent() || proj.isEnemyProjectile || !enemy.canBeHit()) return;
        const hitResult = proj.markHit(enemy.name);
        if (hitResult === 'skip') return;
        if (hitResult === 'normal') proj.hit();
        const eid2 = enemy.name;
        enemy.takeDamage(this.currentProjectileDamage, (ex, ey) => this.onEnemyDeath(ex, ey, eid2));
        SoundSystem.playProjectileHit();
        this.juice.spawnParticleBurst(enemy.x, enemy.y, 0xfbbf24, 5, 40, 280);
        this.juice.showDamageNumber(enemy.x, enemy.y - 10, this.currentProjectileDamage, false);
        this.incrementCombo();
      },
      undefined,
      this
    );

    // Enemy projectiles ↔ player
    this.physics.add.overlap(
      this.projectiles as unknown as Phaser.GameObjects.GameObject[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.player as any,
      (projObj) => {
        const proj = projObj as Projectile;
        if (proj.isSpent() || !proj.isEnemyProjectile) return;
        proj.hit();
        this.player.takeDamage(1);
      },
      undefined,
      this
    );

    // Attack zone ↔ secret walls
    this.physics.add.overlap(
      this.player.getAttackZone(),
      this.secretWallGroup,
      (_zone, wallObj) => {
        this.openSecret(wallObj as Phaser.Physics.Arcade.Image);
      },
      undefined,
      this
    );
  }

  private onEnemyDeath(x: number, y: number, enemyId: string): void {
    if (enemyId) this.killedEnemyIds.add(enemyId);
    this.enemies = this.enemies.filter((e) => !e.isDying() && e.active);
    if (Math.random() < CHEST_DROP_CHANCE) {
      this.spawnWorldItem(x, y, 'chest');
    }
    this.gainXp(XP_PER_ENEMY);
    SoundSystem.playEnemyDeath();
    HapticSystem.death();
    this.juice.spawnParticleBurst(x, y, 0xef4444, 12, 70, 500);
    this.juice.spawnParticleBurst(x, y, 0xfbbf24, 6, 45, 400);
    this.juice.flashScreen();

    if (this.questKills < 5) {
      this.questKills++;
      this.emitQuestState();
      if (this.questKills === 5) {
        this.game.events.emit(GAME_EVENTS.QUEST_COMPLETE, '5 Feinde besiegt!');
      }
    }
  }

  private incrementCombo(): void {
    this.combo++;
    this.comboResetTimer = this.COMBO_RESET_MS;
    this.game.events.emit(GAME_EVENTS.COMBO_CHANGE, this.combo);
  }

  private resetCombo(): void {
    if (this.combo === 0) return;
    this.combo = 0;
    this.comboResetTimer = 0;
    this.game.events.emit(GAME_EVENTS.COMBO_CHANGE, 0);
  }

  // ─── Player damaged handler ───────────────────────────────────────────────

  private onPlayerDamaged(pos: { x: number; y: number }): void {
    SoundSystem.playPlayerDamage();
    HapticSystem.hit();
    this.resetCombo();
    this.juice.spawnParticleBurst(pos.x, pos.y, 0xffffff, 8, 55, 350);
    this.juice.spawnParticleBurst(pos.x, pos.y, 0xfde68a, 5, 35, 280);
    this.juice.showDamageNumber(pos.x, pos.y - 10, 2, false);
    if (this.player.getHp() <= 1) HapticSystem.danger();
    if (this.player.getHp() > 0) {
      this.saveCurrentState();
    }
  }

  private onShieldBlock(pos: { x: number; y: number }): void {
    SoundSystem.playShieldBlock();
    this.juice.spawnParticleBurst(pos.x, pos.y, 0x60a5fa, 10, 45, 320);
    this.juice.spawnParticleBurst(pos.x, pos.y, 0xbfdbfe, 6, 28, 240);
    this.juice.showDamageNumber(pos.x, pos.y - 10, 0, true);
    this.cameras.main.shake(80, 0.003);
    if (this.parryXpBonus > 0) this.gainXp(this.parryXpBonus);
  }

  // ─── Projectile pool ──────────────────────────────────────────────────────

  private getProjectile(x: number, y: number, angle: number, isEnemy: boolean, piercing = 0): Projectile {
    const inactive = this.projectiles.find(p => !p.active);
    if (inactive) {
      inactive.reset(x, y, angle, isEnemy, piercing);
      return inactive;
    }
    const proj = new Projectile(this, x, y, angle, isEnemy);
    if (piercing > 0) proj.setPiercing(piercing);
    this.projectiles.push(proj);
    return proj;
  }

  // ─── Skill synergies ──────────────────────────────────────────────────────

  private checkSynergies(): void {
    for (const syn of SKILL_SYNERGIES) {
      const needed = [...syn.requires];
      const available = [...this.chosenSkills];
      let matched = true;
      for (const req of needed) {
        const idx = available.indexOf(req);
        if (idx === -1) { matched = false; break; }
        available.splice(idx, 1);
      }
      if (!matched) continue;

      // Apply synergy effects idempotently
      if (syn.label === 'Durchdringende Schüsse' && this.piercingShots < 2) {
        this.piercingShots = 2;
      } else if (syn.label === 'Parrier-Meister' && this.parryXpBonus === 0) {
        this.parryXpBonus = 3;
      } else if (syn.label === 'Heilsame Tränke' && !this.enhancedPotions) {
        this.enhancedPotions = true;
      }
    }
  }

  // ─── Quest tracking ───────────────────────────────────────────────────────

  private emitQuestState(): void {
    let state: QuestState | null;
    if (this.questKills < 5) {
      state = { label: '5 Feinde besiegen', progress: this.questKills, goal: 5 };
    } else if (!this.questShieldFound) {
      state = { label: 'Schild-Fragment finden', progress: 0, goal: 1 };
    } else if (!this.questBossKilled) {
      state = { label: 'Den Tyrannen besiegen', progress: 0, goal: 1 };
    } else {
      state = null;
    }
    this.game.events.emit(GAME_EVENTS.QUEST_UPDATE, state);
  }

  // ─── Campfire ─────────────────────────────────────────────────────────────

  private placeCampfire(x: number, y: number): void {
    const gfx = this.add.graphics();
    // Ground ring
    gfx.fillStyle(0x44403c, 0.7);
    gfx.fillCircle(x, y + 6, 8);
    // Logs
    gfx.lineStyle(2, 0x78350f, 1);
    gfx.lineBetween(x - 6, y + 8, x + 6, y + 2);
    gfx.lineBetween(x + 6, y + 8, x - 6, y + 2);
    // Flame
    gfx.fillStyle(0xff6600, 0.9);
    gfx.fillTriangle(x - 4, y + 4, x + 4, y + 4, x, y - 8);
    gfx.fillStyle(0xffaa00, 0.85);
    gfx.fillTriangle(x - 2, y + 4, x + 2, y + 4, x, y - 4);
    gfx.fillStyle(0xffee00, 0.7);
    gfx.fillTriangle(x - 1, y + 3, x + 1, y + 3, x, y);
    gfx.setDepth(y + 1);

    this.tweens.add({
      targets: gfx,
      alpha: { from: 0.75, to: 1 },
      scaleX: { from: 0.95, to: 1.05 },
      scaleY: { from: 0.95, to: 1.05 },
      yoyo: true,
      repeat: -1,
      duration: 280 + Math.random() * 120,
      ease: 'Sine.easeInOut',
    });

    this.decorGroup.add(gfx);
  }

  // ─── Minimap ──────────────────────────────────────────────────────────────

  private emitMinimapUpdate(): void {
    const sx = 1 / WORLD_WIDTH;
    const sy = 1 / WORLD_HEIGHT;

    // Mark current chunk as explored
    const cx = Math.floor(this.player.x / (TILE_SIZE * this.CHUNK_SIZE));
    const cy = Math.floor(this.player.y / (TILE_SIZE * this.CHUNK_SIZE));
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        this.exploredChunks.add(`${cx + dx},${cy + dy}`);
      }
    }

    const data: MinimapData = {
      player: { nx: this.player.x * sx, ny: this.player.y * sy },
      enemies: this.enemies
        .filter(e => e.active && !e.isDying())
        .map(e => ({ nx: e.x * sx, ny: e.y * sy })),
      boss: (this.boss && this.boss.active && !this.boss.isDying())
        ? { nx: this.boss.x * sx, ny: this.boss.y * sy } : null,
      chests: this.items
        .filter(i => i.active && i.itemType === 'chest' && !i.isOpened())
        .map(i => ({ nx: i.x * sx, ny: i.y * sy })),
      zone: this.currentZone,
      exploredChunks: [...this.exploredChunks],
    };
    this.game.events.emit(GAME_EVENTS.MINIMAP_UPDATE, data);
  }

  // ─── Save / Load ──────────────────────────────────────────────────────────

  private saveCurrentState(): void {
    SaveSystem.save({
      hp: this.player.getHp(),
      zone: this.currentZone,
      inventory: [...this.inventory],
      xp: this.xp,
      level: this.level,
      savedAt: Date.now(),
      killedEnemies: [...this.killedEnemyIds],
      ngPlus: this.ngPlus,
      chosenSkills: [...this.chosenSkills],
      openedSecrets: [...this.openedSecrets],
      questKills: this.questKills,
      questShieldFound: this.questShieldFound,
      questBossKilled: this.questBossKilled,
    });
  }

  private gainXp(amount: number): void {
    if (this.level >= MAX_LEVEL) return;
    this.xp += amount;
    const threshold = XP_THRESHOLDS[this.level - 1];
    this.game.events.emit(GAME_EVENTS.XP_CHANGE, {
      xp: this.xp, level: this.level, nextLevelXp: threshold,
    });
    if (this.xp >= threshold) {
      this.level++;
      this.onLevelUp();
    }
  }

  private onLevelUp(): void {
    this.player.setHp(MAX_HP);
    SoundSystem.playLevelUp();
    HapticSystem.levelUp();
    this.game.events.emit(GAME_EVENTS.LEVEL_UP, this.level);
    this.game.events.emit(GAME_EVENTS.XP_CHANGE, {
      xp: this.xp, level: this.level, nextLevelXp: XP_THRESHOLDS[this.level - 1] ?? null,
    });
    this.juice.spawnParticleBurst(this.player.x, this.player.y, 0xfde68a, 16, 80, 500);
    this.juice.spawnParticleBurst(this.player.x, this.player.y, 0x4ade80, 12, 60, 400);
    this.cameras.main.shake(200, 0.006);
    this.saveCurrentState();

    const allSkills: LevelUpSkill[] = ['hp_up', 'attack_up', 'shield', 'xp_boost', 'speed_up'];
    const shuffled = allSkills.sort(() => Math.random() - 0.5);
    const choices = shuffled.slice(0, 3);
    this.scene.pause();
    this.game.events.emit(GAME_EVENTS.LEVEL_UP_CHOICE, { skills: choices, chosen: [...this.chosenSkills] });
  }

  private handleSkillChosen(skill: LevelUpSkill): void {
    this.scene.resume();
    this.chosenSkills.push(skill);
    switch (skill) {
      case 'hp_up':
        this.player.setHp(Math.min(MAX_HP + 2, this.player.getHp() + 2));
        break;
      case 'attack_up':
        this.currentAttackDamage += 2;
        break;
      case 'shield':
        this.player.addShield();
        break;
      case 'xp_boost':
        this.gainXp(20);
        break;
      case 'speed_up':
        this.player.applySpeedBoost(1.15);
        break;
    }
    this.checkSynergies();
    this.juice.spawnParticleBurst(this.player.x, this.player.y, 0xfde68a, 18, 90, 550);
    this.saveCurrentState();
  }

  // ─── Inventory ────────────────────────────────────────────────────────────

  private addToInventory(item: InventoryItem): void {
    this.inventory = [...this.inventory, item];
    if (this.inventory.length > MAX_INVENTORY) {
      this.inventory = this.inventory.slice(this.inventory.length - MAX_INVENTORY);
    }
    this.recalculateAttackDamage();
    this.emitInventoryChange();
    this.saveCurrentState();
  }

  private recalculateAttackDamage(): void {
    const upgrades = this.inventory.filter(i => i === 'sword_upgrade').length;
    this.currentAttackDamage = ATTACK_DAMAGE + upgrades * 2;
  }

  private emitInventoryChange(): void {
    this.game.events.emit(GAME_EVENTS.INVENTORY_CHANGE, [...this.inventory]);
  }

  // ─── Interaction (NPC priority over chest) ────────────────────────────────

  private updateInteractions(): void {
    this.items = this.items.filter((item) => item.active);
    this.npcs = this.npcs.filter((n) => n.active);

    // Auto-collect heart and potion pickups
    for (const item of this.items) {
      if ((item.itemType === 'heart_pickup' || item.itemType === 'potion_pickup') && !item.isOpened()) {
        const dist = Phaser.Math.Distance.Between(item.x, item.y, this.player.x, this.player.y);
        if (dist < 22) {
          const ix = item.x;
          const iy = item.y;
          const isPotion = item.itemType === 'potion_pickup';
          item.collect(() => {
            if (isPotion) {
              SoundSystem.playPickup();
              this.addToInventory('potion');
              this.juice.spawnParticleBurst(ix, iy, 0x4ade80, 6, 36, 350);
            } else {
              this.player.heal(HEART_HEAL_AMOUNT);
              SoundSystem.playHeal();
              this.addToInventory('heart');
              this.juice.spawnParticleBurst(ix, iy, 0x4ade80, 8, 42, 400);
              this.juice.showDamageNumber(ix, iy - 8, HEART_HEAL_AMOUNT, true);
            }
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
          SoundSystem.playChestOpen();
          this.applyChestReward(reward);
          this.juice.spawnParticleBurst(chestX, chestY, 0x4ade80, 10, 55, 480);
        }
        this.activeChest = null;
      }
    } else {
      this.player.setNearInteractable(false);
    }
  }

  private openDialog(npc: NPC): void {
    this.player.setDialogActive(true);
    const payload: DialogPayload = { npcName: npc.npcName, lines: npc.lines, portrait: npc.portrait, portraitColumns: npc.portraitColumns };
    this.game.events.emit(GAME_EVENTS.DIALOG_OPEN, payload);
  }

  private handleDialogClose(): void {
    this.player.setDialogActive(false);
  }

  private applyChestReward(reward: InventoryItem): void {
    if (reward === 'heart') this.player.heal(HEART_HEAL_AMOUNT);
    if (reward === 'shield_fragment') {
      this.player.addShield();
      if (!this.questShieldFound) {
        this.questShieldFound = true;
        this.emitQuestState();
        this.game.events.emit(GAME_EVENTS.QUEST_COMPLETE, 'Schild-Fragment gefunden!');
      }
    }
    if (reward === 'projectile_upgrade') this.currentProjectileDamage++;
    this.addToInventory(reward);
  }

  private handleUsePotion(): void {
    const idx = this.inventory.indexOf('potion');
    if (idx === -1 || this.player.getHp() >= MAX_HP) return;
    this.inventory.splice(idx, 1);
    const healAmount = POTION_HEAL_AMOUNT + (this.enhancedPotions ? 2 : 0);
    this.player.heal(healAmount);
    SoundSystem.playHeal();
    this.emitInventoryChange();
    this.juice.spawnParticleBurst(this.player.x, this.player.y, 0x4ade80, 10, 50, 450);
    this.juice.showDamageNumber(this.player.x, this.player.y - 20, healAmount, true);
    this.saveCurrentState();
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
    if (this.hazardCooldown > 0) this.hazardCooldown = Math.max(0, this.hazardCooldown - delta);

    // Combo reset timer
    if (this.combo > 0 && this.comboResetTimer > 0) {
      this.comboResetTimer -= delta;
      if (this.comboResetTimer <= 0) this.resetCombo();
    }

    this.player.update(delta);
    this.player.setDepth(this.player.y + 1);

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.update(this.player, delta);
      if (enemy.wantsShoot(this.player)) {
        const angle = enemy.getShootAngle(this.player.x, this.player.y);
        this.getProjectile(enemy.x, enemy.y, angle, true);
        enemy.markShot();
        SoundSystem.playProjectile();
      }
    }

    for (const item of this.items) {
      if (item.active) item.update(delta);
    }

    for (const npc of this.npcs) {
      if (npc.active) npc.update(delta);
    }

    if (this.boss?.active) {
      this.boss.update(this.player.x, this.player.y, delta);
      if (this.boss.wantsShoot()) {
        const angles = this.boss.getShootAngles(this.player.x, this.player.y);
        for (const angle of angles) {
          this.getProjectile(this.boss.x, this.boss.y, angle, true);
        }
        this.boss.markShot();
        SoundSystem.playProjectile();
      }
    }

    // Update projectiles (pool-aware: skip inactive)
    for (const proj of this.projectiles) {
      if (proj.active) proj.update(delta);
    }

    // Ranged attack: Y key
    if (this.player.wantsShoot()) {
      const angle = DIRECTION_ANGLES[this.player.getLastDirection()] ?? 0;
      this.getProjectile(this.player.x, this.player.y, angle, false, this.piercingShots);
      this.player.markShot();
      SoundSystem.playProjectile();
    }

    if (!this.isTransitioning && !this.player.isDialogActive()) {
      this.updateInteractions();
    }

    if (Phaser.Input.Keyboard.JustDown(this.useItemKey) && !this.player.isDialogActive()) {
      this.handleUsePotion();
    }

    // Ambient camera breathing — very slow sin-wave follow offset
    this.ambientBreathTime += delta * 0.00055;
    this.cameras.main.setFollowOffset(0, Math.sin(this.ambientBreathTime) * 1.2);

    // Minimap: throttled to ~10 fps
    this.minimapThrottle += delta;
    if (this.minimapThrottle >= 100) {
      this.minimapThrottle = 0;
      this.emitMinimapUpdate();
    }
  }
}
