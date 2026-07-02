import * as Phaser from 'phaser';
import { ZoneId, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from './constants';
import { ZoneConfig, HazardType } from './ZoneConfigs';
import { AtmosphereSystem } from './AtmosphereSystem';

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
    const shadow = scene.add.image(x + 4, y + 26, 'shadow').setScale(1.5, 0.95).setAlpha(0.8);
    shadow.setDepth(0.1);
    const tree = scene.add.image(x, y - 14, 'decor-tree').setScale(0.38);
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
    ['building-tavern',     -130, -165, 0.30,  84, 30, 40],
    ['building-farm',        185, -175, 0.27, 104, 28, 38],
    ['building-apothecary', -225,   15, 0.28,  94, 28, 34],
    ['building-market',      180,   30, 0.28,  94, 26, 32],
    ['building-blacksmith', -230,  185, 0.28,  88, 28, 34],
    ['building-windmill',      5,  250, 0.30,  68, 28, 40],
    ['building-watchtower',  235, -245, 0.30,  56, 28, 38],
  ];

  for (const [key, ox, oy, scale, bw, bh, bOffY] of layout) {
    if (!scene.textures.exists(key)) continue;
    const x = centerX + ox;
    const y = centerY + oy;
    const frame = scene.textures.getFrame(key);
    const vw = frame.realWidth * scale;
    const vh = frame.realHeight * scale;
    const shadow = scene.add.image(x + vw * 0.06, y + vh * 0.46, 'shadow')
      .setDisplaySize(vw * 1.05, vh * 0.4)
      .setAlpha(0.85);
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

  // Organic dirt paths: plaza in the middle, spokes to the buildings
  const plaza = { x: centerX, y: centerY };
  drawPath(scene, decorGroup, [{ x: centerX - 250, y: centerY }, plaza, { x: centerX + 250, y: centerY + 10 }], 30);
  drawPath(scene, decorGroup, [{ x: centerX, y: centerY - 250 }, plaza, { x: centerX + 5, y: centerY + 250 }], 26);
  drawPath(scene, decorGroup, [plaza, { x: centerX - 195, y: centerY + 170 }], 20);
  drawPath(scene, decorGroup, [plaza, { x: centerX + 200, y: centerY - 200 }], 20);
  // plaza center — a wider trampled circle
  for (let i = 0; i < 7; i++) {
    const a = (Math.PI * 2 * i) / 7;
    stampPath(scene, decorGroup, centerX + Math.cos(a) * 18, centerY + Math.sin(a) * 12, 44);
  }
}

function stampPath(
  scene: Phaser.Scene,
  decorGroup: Phaser.GameObjects.Group,
  x: number,
  y: number,
  size: number,
): void {
  if (!scene.textures.exists('path-stamp')) return;
  const jx = x + (Math.random() - 0.5) * 6;
  const jy = y + (Math.random() - 0.5) * 6;
  const img = scene.add.image(jx, jy, 'path-stamp');
  img.setDisplaySize(size, size * 0.82);
  img.setAlpha(0.9);
  img.setDepth(0.05);
  decorGroup.add(img);
}

/** Stamps soft dirt circles along a polyline — produces an organic path. */
export function drawPath(
  scene: Phaser.Scene,
  decorGroup: Phaser.GameObjects.Group,
  points: Array<{ x: number; y: number }>,
  width: number,
): void {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    const steps = Math.max(2, Math.ceil(dist / (width * 0.35)));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // slight sinus wobble so paths don't look ruler-straight
      const wobble = Math.sin(t * Math.PI * 3 + a.x * 0.01) * width * 0.18;
      const nx = -(b.y - a.y) / (dist || 1);
      const ny = (b.x - a.x) / (dist || 1);
      stampPath(
        scene, decorGroup,
        Phaser.Math.Linear(a.x, b.x, t) + nx * wobble,
        Phaser.Math.Linear(a.y, b.y, t) + ny * wobble,
        width * (0.9 + Math.random() * 0.35),
      );
    }
  }
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
      { keys: ['decor-bush-yellow', 'decor-bush-berry', 'decor-bush-flower'], scale: 0.36, count: 26 },
      { keys: ['decor-bush'], scale: 0.34, count: 18 },
      { keys: ['decor-rock'], scale: 0.28, count: 10 },
      { keys: ['decor-log', 'decor-stump'], scale: 0.32, count: 6 },
    ],
    forest: [
      { keys: ['decor-log', 'decor-stump'], scale: 0.36, count: 18 },
      { keys: ['decor-bush', 'decor-bush-berry'], scale: 0.34, count: 24 },
      { keys: ['decor-bush-flower'], scale: 0.32, count: 8 },
      { keys: ['decor-rock'], scale: 0.28, count: 8 },
    ],
    dungeon: [
      { keys: ['decor-rock'], scale: 0.28, count: 14 },
      { keys: ['decor-dungeon-wall'], scale: 0.38, count: 7 },
    ],
    dungeon_interior: [
      { keys: ['decor-rock'], scale: 0.26, count: 10 },
      { keys: ['decor-dungeon-wall'], scale: 0.38, count: 8 },
    ],
    boss_room: [
      { keys: ['decor-dungeon-gate'], scale: 0.40, count: 2 },
      { keys: ['decor-dungeon-wall'], scale: 0.36, count: 6 },
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
        const frame = scene.textures.getFrame(texKey);
        const vw = frame.realWidth * scale;
        const vh = frame.realHeight * scale;
        const shadow = scene.add.image(px + vw * 0.05, py + vh * 0.42, 'shadow')
          .setDisplaySize(vw * 0.95, Math.max(8, vh * 0.3))
          .setAlpha(0.65);
        shadow.setDepth(0.1);
        decorGroup.add(shadow);
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
  atmosphere?: AtmosphereSystem,
): void {
  atmosphere?.addLightHalo(x, y - 2, 85, 0xff9a3c, 0.55);
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
