import * as Phaser from 'phaser';
import { ZoneId, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from './constants';
import { ZoneConfig, HazardType } from './ZoneConfigs';

const centerX = WORLD_WIDTH / 2;
const centerY = WORLD_HEIGHT / 2;
const SPAWN_SAFE_TILES = 6;

export const TREE_POSITIONS: Array<{ x: number; y: number }> = [];

export function placeTrees(
  scene: Phaser.Scene,
  treeGroup: Phaser.GameObjects.Group,
  count: number,
): void {
  TREE_POSITIONS.length = 0;
  const margin = 3;
  for (let i = 0; i < count; i++) {
    const tx = Phaser.Math.Between(margin, MAP_WIDTH - margin);
    const ty = Phaser.Math.Between(margin, MAP_HEIGHT - margin);
    const px = tx * TILE_SIZE + TILE_SIZE / 2;
    const py = ty * TILE_SIZE + TILE_SIZE / 2;
    if (Math.abs(px - centerX) < 120 && Math.abs(py - centerY) < 120) continue;
    TREE_POSITIONS.push({ x: px, y: py });
    drawTree(scene, treeGroup, px, py);
  }
}

function drawTree(
  scene: Phaser.Scene,
  treeGroup: Phaser.GameObjects.Group,
  x: number,
  y: number,
): void {
  if (scene.textures.exists('decor-tree')) {
    const shadow = scene.add.ellipse(x + 4, y + 22, 52, 16, 0x000000, 0.20);
    shadow.setDepth(0.1);
    const tree = scene.add.image(x, y - 10, 'decor-tree').setScale(0.30);
    tree.setDepth(y + 0.5);
    treeGroup.add(shadow);
    treeGroup.add(tree);
    return;
  }

  const shadowGfx = scene.add.graphics();
  shadowGfx.fillStyle(0x000000, 0.2);
  shadowGfx.fillEllipse(0, 0, 38, 14);
  const shadowKey = `tree-shadow-${x}-${y}`;
  if (!scene.textures.exists(shadowKey)) shadowGfx.generateTexture(shadowKey, 38, 14);
  shadowGfx.destroy();

  const canopyGfx = scene.add.graphics();
  canopyGfx.fillStyle(0x2d6a35, 1); canopyGfx.fillCircle(0, 0, 22);
  canopyGfx.fillStyle(0x3a8044, 1); canopyGfx.fillCircle(-7, -6, 14); canopyGfx.fillCircle(8, -4, 16);
  const canopyKey = `tree-canopy-${x}-${y}`;
  if (!scene.textures.exists(canopyKey)) canopyGfx.generateTexture(canopyKey, 48, 48);
  canopyGfx.destroy();

  const shadow = scene.add.image(x + 6, y + 10, shadowKey); shadow.setDepth(0.1);
  const canopy = scene.add.image(x, y - 18, canopyKey); canopy.setDepth(y + 0.5);
  treeGroup.add(shadow);
  treeGroup.add(canopy);
}

export function placeVillage(
  scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.StaticGroup,
  decorGroup: Phaser.GameObjects.Group,
): void {
  if (!scene.textures.exists('building-tavern')) return;

  if (!scene.textures.exists('_blocker')) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 0); g.fillRect(0, 0, 2, 2);
    g.generateTexture('_blocker', 2, 2); g.destroy();
  }

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
    if (!scene.textures.exists(key)) continue;
    const x = centerX + ox;
    const y = centerY + oy;
    const frame = scene.textures.getFrame(key);
    const vw = frame.realWidth * scale;
    const vh = frame.realHeight * scale;
    const shadow = scene.add.ellipse(x, y + vh * 0.48, vw * 0.75, 14, 0x000000, 0.22);
    shadow.setDepth(y - 1);
    decorGroup.add(shadow);
    const img = scene.add.image(x, y, key).setScale(scale);
    img.setDepth(y + vh * 0.3);
    decorGroup.add(img);
    const blocker = obstacles.create(x, y + bOffY, '_blocker') as Phaser.Physics.Arcade.Image;
    (blocker.body as Phaser.Physics.Arcade.StaticBody).setSize(bw, bh);
    blocker.setVisible(false).setAlpha(0);
    blocker.refreshBody();
  }

  const pathGfx = scene.add.graphics();
  pathGfx.fillStyle(0xb8a070, 0.35);
  pathGfx.fillRoundedRect(centerX - 230, centerY - 20, 460, 38, 8);
  pathGfx.fillRoundedRect(centerX - 20, centerY - 240, 38, 320, 8);
  pathGfx.setDepth(0.05);
}

export function placeDecorations(
  scene: Phaser.Scene,
  decorGroup: Phaser.GameObjects.Group,
  zone: ZoneId,
  protectedTiles: Set<string>,
): void {
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
  const margin = 3;
  for (const { keys, scale, count } of byZone[zone] ?? []) {
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      while (attempts++ < 20) {
        const tx = Phaser.Math.Between(margin, MAP_WIDTH - margin);
        const ty = Phaser.Math.Between(margin, MAP_HEIGHT - margin);
        if (protectedTiles.has(`${tx},${ty}`)) continue;
        const px = tx * TILE_SIZE + TILE_SIZE / 2;
        const py = ty * TILE_SIZE + TILE_SIZE / 2;
        if (Math.abs(px - centerX) < 100 && Math.abs(py - centerY) < 100) continue;
        const texKey = keys[Math.floor(Math.random() * keys.length)];
        if (!scene.textures.exists(texKey)) break;
        const img = scene.add.image(px, py, texKey).setScale(scale);
        img.setDepth(py + 0.3);
        decorGroup.add(img);
        break;
      }
    }
  }
}

export function placeObstacles(
  _scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.StaticGroup,
  treeObstacles: Phaser.Physics.Arcade.StaticGroup,
  density: number,
  protectedTiles: Set<string>,
): void {
  const centerTX = Math.floor(MAP_WIDTH / 2);
  const centerTY = Math.floor(MAP_HEIGHT / 2);
  const treeTiles = new Set<string>();
  for (const pos of TREE_POSITIONS) {
    const tx = Math.floor(pos.x / TILE_SIZE);
    const ty = Math.floor(pos.y / TILE_SIZE);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        treeTiles.add(`${tx + dx},${ty + dy}`);
  }
  for (let ty = 0; ty < MAP_HEIGHT; ty++) {
    for (let tx = 0; tx < MAP_WIDTH; tx++) {
      const dFromSpawn = Math.max(Math.abs(tx - centerTX), Math.abs(ty - centerTY));
      if (dFromSpawn < SPAWN_SAFE_TILES) continue;
      if (tx < 2 || tx > MAP_WIDTH - 3) continue;
      if (treeTiles.has(`${tx},${ty}`)) continue;
      if (protectedTiles.has(`${tx},${ty}`)) continue;
      if (Math.random() > density) continue;
      const px = tx * TILE_SIZE + TILE_SIZE / 2;
      const py = ty * TILE_SIZE + TILE_SIZE / 2;
      const rock = obstacles.create(px, py, 'rock') as Phaser.Physics.Arcade.Image;
      rock.setDepth(py);
      rock.refreshBody();
    }
  }
  for (const pos of TREE_POSITIONS) {
    const blocker = treeObstacles.create(pos.x, pos.y + 4, 'blocker') as Phaser.Physics.Arcade.Image;
    blocker.setVisible(false);
    blocker.refreshBody();
  }
}

export function placeCampfire(
  scene: Phaser.Scene,
  decorGroup: Phaser.GameObjects.Group,
  x: number,
  y: number,
): void {
  const gfx = scene.add.graphics();
  gfx.fillStyle(0x44403c, 0.7);
  gfx.fillCircle(x, y + 6, 8);
  gfx.lineStyle(2, 0x78350f, 1);
  gfx.lineBetween(x - 6, y + 8, x + 6, y + 2);
  gfx.lineBetween(x + 6, y + 8, x - 6, y + 2);
  gfx.fillStyle(0xff6600, 0.9);
  gfx.fillTriangle(x - 4, y + 4, x + 4, y + 4, x, y - 8);
  gfx.fillStyle(0xffaa00, 0.85);
  gfx.fillTriangle(x - 2, y + 4, x + 2, y + 4, x, y - 4);
  gfx.fillStyle(0xffee00, 0.7);
  gfx.fillTriangle(x - 1, y + 3, x + 1, y + 3, x, y);
  gfx.setDepth(y + 1);
  scene.tweens.add({
    targets: gfx,
    alpha: { from: 0.75, to: 1 },
    scaleX: { from: 0.95, to: 1.05 },
    scaleY: { from: 0.95, to: 1.05 },
    yoyo: true,
    repeat: -1,
    duration: 280 + Math.random() * 120,
    ease: 'Sine.easeInOut',
  });
  decorGroup.add(gfx);
}

export function spawnHazards(
  _scene: Phaser.Scene,
  hazardGroup: Phaser.Physics.Arcade.StaticGroup,
  spawns: Array<{ tx: number; ty: number; kind: HazardType }>,
): void {
  for (const h of spawns) {
    const px = h.tx * TILE_SIZE + TILE_SIZE / 2;
    const py = h.ty * TILE_SIZE + TILE_SIZE / 2;
    const key = h.kind === 'lava' ? 'hazard-lava' : 'hazard-thorns';
    const tile = hazardGroup.create(px, py, key) as Phaser.Physics.Arcade.Image;
    tile.setDepth(0.5);
    tile.refreshBody();
  }
}

export function spawnSecretWall(
  _scene: Phaser.Scene,
  secretWallGroup: Phaser.Physics.Arcade.StaticGroup,
  secretId: string,
  wall: NonNullable<ZoneConfig['secretWall']>,
): void {
  const px = wall.tx * TILE_SIZE + TILE_SIZE / 2;
  const py = wall.ty * TILE_SIZE + TILE_SIZE / 2;
  const img = secretWallGroup.create(px, py, 'secret-wall') as Phaser.Physics.Arcade.Image;
  img.setDepth(py);
  img.setData('secretId', secretId);
  img.setData('reward', wall.reward);
  img.refreshBody();
}
