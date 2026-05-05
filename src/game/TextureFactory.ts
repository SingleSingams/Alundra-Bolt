import * as Phaser from 'phaser';
import { TILE_SIZE, TILE_VARIANTS } from './constants';

export function createObstacleTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('rock')) {
    const gfx = scene.add.graphics();
    const s = 28;
    gfx.fillStyle(0x78716c, 1); gfx.fillEllipse(s / 2, s / 2 + 2, s - 2, s - 8);
    gfx.fillStyle(0xa8a29e, 1); gfx.fillEllipse(s / 2 - 3, s / 2 - 2, s - 10, s - 16);
    gfx.lineStyle(1, 0x57534e, 0.8);
    gfx.strokeLineShape(new Phaser.Geom.Line(10, 14, 16, 20));
    gfx.strokeLineShape(new Phaser.Geom.Line(16, 20, 20, 16));
    gfx.generateTexture('rock', s, s);
    gfx.destroy();
  }
  if (!scene.textures.exists('blocker')) {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0xffffff, 0.01);
    gfx.fillRect(0, 0, 18, 14);
    gfx.generateTexture('blocker', 18, 14);
    gfx.destroy();
  }
}

export function createParticleTexture(scene: Phaser.Scene): void {
  if (!scene.textures.exists('particle-sq')) {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(0, 0, 5, 5);
    gfx.generateTexture('particle-sq', 5, 5);
    gfx.destroy();
  }
}

export function createHazardTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('hazard-thorns')) {
    const g = scene.add.graphics();
    const s = TILE_SIZE;
    g.fillStyle(0x14532d, 1); g.fillRect(0, 0, s, s);
    g.fillStyle(0x166534, 1);
    for (let i = 0; i < 5; i++) {
      const cx = 6 + i * 5;
      g.fillTriangle(cx, 4, cx - 3, s - 4, cx + 3, s - 4);
    }
    g.fillStyle(0x4ade80, 0.6); g.fillRect(0, 0, s, 3);
    g.generateTexture('hazard-thorns', s, s);
    g.destroy();
  }
  if (!scene.textures.exists('hazard-lava')) {
    const g = scene.add.graphics();
    const s = TILE_SIZE;
    g.fillStyle(0x7c2d12, 1); g.fillRect(0, 0, s, s);
    g.fillStyle(0xf97316, 0.8); g.fillEllipse(s / 2, s / 2, s - 6, s - 10);
    g.fillStyle(0xfef3c7, 0.45); g.fillEllipse(s / 2, s / 2 - 2, s * 0.4, s * 0.25);
    g.generateTexture('hazard-lava', s, s);
    g.destroy();
  }
}

export function createSecretWallTexture(scene: Phaser.Scene): void {
  if (!scene.textures.exists('secret-wall')) {
    const g = scene.add.graphics();
    const s = 28;
    // Base stone — slightly lighter than rock, with golden tint
    g.fillStyle(0x92816a, 1); g.fillEllipse(s / 2, s / 2 + 2, s - 2, s - 8);
    g.fillStyle(0xb8a48c, 1); g.fillEllipse(s / 2 - 3, s / 2 - 2, s - 10, s - 16);
    // Cracks (hint of something hidden)
    g.lineStyle(1, 0x6b5742, 0.9);
    g.strokeLineShape(new Phaser.Geom.Line(8, 12, 14, 18));
    g.strokeLineShape(new Phaser.Geom.Line(14, 18, 18, 14));
    g.strokeLineShape(new Phaser.Geom.Line(16, 8, 19, 13));
    // Faint golden runes/glow hint
    g.fillStyle(0xfde68a, 0.5);
    g.fillCircle(s / 2, s / 2 - 2, 3);
    g.fillStyle(0xfde68a, 0.25);
    g.fillCircle(s / 2, s / 2 - 2, 5);
    g.generateTexture('secret-wall', s, s);
    g.destroy();
  }
}

const GRASS_PALETTES = [
  { base: '#4a7c3f', detail: '#3a6432', accent: '#5e9452' },
  { base: '#527d44', detail: '#406636', accent: '#67a058' },
  { base: '#3d6e35', detail: '#2e5528', accent: '#52894a' },
  { base: '#5a8a4d', detail: '#477040', accent: '#6ba05e' },
  { base: '#446e3a', detail: '#355730', accent: '#58874c' },
];

function drawGrassTile(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  palette: (typeof GRASS_PALETTES)[0],
  seed: number
): void {
  const size = TILE_SIZE;
  const rng = (n: number) => Math.abs(Math.sin(seed * 9301 + n * 49297) * 0.5 + 0.5);

  ctx.fillStyle = palette.base;
  ctx.fillRect(offsetX, 0, size, size);

  ctx.fillStyle = palette.detail;
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(rng(i * 2) * (size - 4));
    const y = Math.floor(rng(i * 2 + 1) * (size - 4));
    ctx.fillRect(offsetX + x, y, 2, 2);
  }

  ctx.fillStyle = palette.accent;
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(rng(i * 3 + 20) * (size - 3));
    const y = Math.floor(rng(i * 3 + 21) * (size - 3));
    ctx.fillRect(offsetX + x, y, 1, 3);
    ctx.fillRect(offsetX + x + 1, y + 1, 1, 2);
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX + 0.5, 0.5, size - 1, size - 1);
}

export function createGrassTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists('grass-tiles')) return;

  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE * TILE_VARIANTS;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d')!;

  GRASS_PALETTES.forEach((palette, i) => {
    drawGrassTile(ctx, i * TILE_SIZE, palette, i + 1);
  });

  scene.textures.addCanvas('grass-tiles', canvas);
}

export function createPlayerTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('player')) return;

  const gfx = scene.add.graphics();
  const W = 24, H = 28;
  const cx = W / 2;

  // Legs (two stumps)
  gfx.fillStyle(0x1e3a8a, 1);
  gfx.fillRect(cx - 5, H - 8, 4, 7);
  gfx.fillRect(cx + 1, H - 8, 4, 7);

  // Boots
  gfx.fillStyle(0x78350f, 1);
  gfx.fillRect(cx - 6, H - 4, 5, 4);
  gfx.fillRect(cx + 1, H - 4, 5, 4);

  // Body / tunic
  gfx.fillStyle(0x2563eb, 1);
  gfx.fillRect(cx - 6, H - 18, 12, 10);

  // Belt
  gfx.fillStyle(0x92400e, 1);
  gfx.fillRect(cx - 6, H - 10, 12, 2);
  gfx.fillStyle(0xfbbf24, 1);
  gfx.fillRect(cx - 1, H - 11, 3, 3);

  // Left arm
  gfx.fillStyle(0xfbbf24, 1);
  gfx.fillRect(cx - 10, H - 18, 4, 8);

  // Right arm (sword arm)
  gfx.fillStyle(0xfbbf24, 1);
  gfx.fillRect(cx + 6, H - 18, 4, 7);

  // Sword
  gfx.fillStyle(0xd1d5db, 1);
  gfx.fillRect(cx + 10, H - 24, 2, 10);
  gfx.fillStyle(0xfbbf24, 1);
  gfx.fillRect(cx + 8, H - 16, 6, 2);
  gfx.fillStyle(0x92400e, 1);
  gfx.fillRect(cx + 10, H - 15, 2, 3);

  // Neck
  gfx.fillStyle(0xfde68a, 1);
  gfx.fillRect(cx - 2, H - 22, 4, 4);

  // Head
  gfx.fillStyle(0xfde68a, 1);
  gfx.fillRect(cx - 5, H - 30, 10, 10);

  // Eyes
  gfx.fillStyle(0x1e1b4b, 1);
  gfx.fillRect(cx - 3, H - 27, 2, 2);
  gfx.fillRect(cx + 1, H - 27, 2, 2);

  // Eye shine
  gfx.fillStyle(0xffffff, 1);
  gfx.fillRect(cx - 3, H - 27, 1, 1);
  gfx.fillRect(cx + 1, H - 27, 1, 1);

  // Hair / hat brim
  gfx.fillStyle(0x1e3a8a, 1);
  gfx.fillRect(cx - 6, H - 32, 12, 3);
  // Hat top
  gfx.fillRect(cx - 4, H - 36, 8, 4);

  // Hat feather
  gfx.fillStyle(0xfbbf24, 1);
  gfx.fillRect(cx + 2, H - 37, 2, 5);

  gfx.generateTexture('player', W, H);
  gfx.destroy();
}

export function createShadowTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('shadow')) return;

  const gfx = scene.add.graphics();
  gfx.fillStyle(0x000000, 0.35);
  gfx.fillEllipse(14, 6, 20, 9);
  gfx.generateTexture('shadow', 28, 12);
  gfx.destroy();
}

export function createHeartTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('heart-full') && scene.textures.exists('heart-empty')) return;

  const drawHeart = (gfx: Phaser.GameObjects.Graphics, filled: boolean) => {
    if (filled) {
      gfx.fillStyle(0x7f1d1d, 1);
      gfx.fillCircle(6, 6, 5);
      gfx.fillCircle(12, 6, 5);
      gfx.fillTriangle(1, 8, 17, 8, 9, 17);
      gfx.fillStyle(0xef4444, 1);
      gfx.fillCircle(6, 5, 4);
      gfx.fillCircle(12, 5, 4);
      gfx.fillTriangle(2, 7, 16, 7, 9, 16);
      gfx.fillStyle(0xfca5a5, 0.6);
      gfx.fillEllipse(6, 4, 4, 2);
    } else {
      gfx.fillStyle(0x374151, 1);
      gfx.fillCircle(6, 6, 5);
      gfx.fillCircle(12, 6, 5);
      gfx.fillTriangle(1, 8, 17, 8, 9, 17);
      gfx.fillStyle(0x4b5563, 1);
      gfx.fillCircle(6, 5, 4);
      gfx.fillCircle(12, 5, 4);
      gfx.fillTriangle(2, 7, 16, 7, 9, 16);
    }
  };

  const gfxFull = scene.add.graphics();
  drawHeart(gfxFull, true);
  gfxFull.generateTexture('heart-full', 18, 18);
  gfxFull.destroy();

  const gfxEmpty = scene.add.graphics();
  drawHeart(gfxEmpty, false);
  gfxEmpty.generateTexture('heart-empty', 18, 18);
  gfxEmpty.destroy();
}
