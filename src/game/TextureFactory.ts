import * as Phaser from 'phaser';
import { TILE_SIZE, TILE_VARIANTS } from './constants';

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

  ctx.fillStyle = palette.base;
  ctx.fillRect(offsetX, 0, size, size);

  const rng = (n: number) => Math.abs(Math.sin(seed * 9301 + n * 49297) * 0.5 + 0.5);

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
  const size = 24;

  gfx.fillStyle(0x3b82f6, 1);
  gfx.fillEllipse(size / 2, size / 2 + 2, size - 4, size - 6);

  gfx.fillStyle(0xfde68a, 1);
  gfx.fillCircle(size / 2, size / 2 - 1, 8);

  gfx.fillStyle(0x1e40af, 1);
  gfx.fillCircle(size / 2, size / 2 - 1, 4);

  gfx.fillStyle(0x1e3a8a, 1);
  gfx.fillTriangle(
    size / 2, size / 2 - 11,
    size / 2 - 3, size / 2 - 6,
    size / 2 + 3, size / 2 - 6
  );

  gfx.generateTexture('player', size, size);
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
    const color = filled ? 0xe53e3e : 0x4a5568;
    gfx.fillStyle(color, 1);
    gfx.fillCircle(6, 6, 5);
    gfx.fillCircle(12, 6, 5);
    gfx.fillTriangle(1, 8, 17, 8, 9, 17);
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
