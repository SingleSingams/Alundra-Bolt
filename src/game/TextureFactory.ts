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

// All 5 variants share one base hue; variation comes from soft blobs and
// grass blades, NOT from per-tile color jumps — this kills the checkerboard look.
const GRASS_BASE = { r: 74, g: 118, b: 62 };

function drawGrassTile(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  variant: number,
  scale: number
): void {
  const size = TILE_SIZE * scale;
  const rng = (n: number) => Math.abs(Math.sin((variant + 1) * 9301 + n * 49297) * 0.5 + 0.5);

  // Base with a *very* subtle per-variant brightness drift (±1.25%)
  const drift = (rng(0) - 0.5) * 0.025;
  const base = `rgb(${Math.round(GRASS_BASE.r * (1 + drift))}, ${Math.round(GRASS_BASE.g * (1 + drift))}, ${Math.round(GRASS_BASE.b * (1 + drift))})`;
  ctx.fillStyle = base;
  ctx.fillRect(offsetX, 0, size, size);

  // Soft organic blobs (darker + lighter patches), drawn with radial gradients
  for (let i = 0; i < 6; i++) {
    const bx = offsetX + rng(i * 7 + 1) * size;
    const by = rng(i * 7 + 2) * size;
    const br = (0.18 + rng(i * 7 + 3) * 0.35) * size;
    const dark = rng(i * 7 + 4) > 0.5;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    const c = dark ? '0,20,0' : '90,150,60';
    g.addColorStop(0, `rgba(${c},${dark ? 0.10 : 0.12})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(offsetX, 0, size, size);
  }

  // Fine grass blades
  for (let i = 0; i < 26; i++) {
    const x = offsetX + rng(i * 5 + 40) * size;
    const y = rng(i * 5 + 41) * size;
    const h = (1.5 + rng(i * 5 + 42) * 3) * scale;
    const lean = (rng(i * 5 + 43) - 0.5) * 2 * scale;
    const light = rng(i * 5 + 44) > 0.6;
    ctx.strokeStyle = light ? 'rgba(140,190,105,0.5)' : 'rgba(38,72,32,0.45)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + lean * 0.5, y - h * 0.6, x + lean, y - h);
    ctx.stroke();
  }

  // Occasional tiny flowers on some variants
  if (variant === 2 || variant === 4) {
    for (let i = 0; i < 2; i++) {
      const x = offsetX + rng(i * 11 + 80) * (size - 4 * scale) + 2 * scale;
      const y = rng(i * 11 + 81) * (size - 4 * scale) + 2 * scale;
      ctx.fillStyle = variant === 2 ? 'rgba(250,240,180,0.55)' : 'rgba(235,205,235,0.5)';
      ctx.beginPath();
      ctx.arc(x, y, 1.3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(250,190,80,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 0.6 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function createGrassTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists('grass-tiles')) return;

  // Render at 2x and let Phaser display it at TILE_SIZE — with linear
  // filtering this gives noticeably crisper ground detail.
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE * TILE_VARIANTS * scale;
  canvas.height = TILE_SIZE * scale;
  const ctx = canvas.getContext('2d')!;

  for (let i = 0; i < TILE_VARIANTS; i++) {
    drawGrassTile(ctx, i * TILE_SIZE * scale, i, scale);
  }

  scene.textures.addCanvas('grass-tiles', canvas);
}

/**
 * A large transparent overlay with big soft light/dark patches. Tiled across
 * the world at low alpha it breaks up ground repetition — a key ingredient
 * of the painterly HD-2D ground look.
 */
export function createGroundDetailTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('ground-detail')) return;
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const rng = (n: number) => Math.abs(Math.sin(7 * 9301 + n * 49297) * 0.5 + 0.5);

  for (let i = 0; i < 22; i++) {
    const x = rng(i * 3 + 1) * S;
    const y = rng(i * 3 + 2) * S;
    const r = 40 + rng(i * 3 + 3) * 120;
    const dark = i % 3 !== 0;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = dark ? '10,26,8' : '150,190,110';
    g.addColorStop(0, `rgba(${c},${dark ? 0.16 : 0.14})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    // draw wrapped so the tiling has no visible seams
    for (const ox of [-S, 0, S]) {
      for (const oy of [-S, 0, S]) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillRect(0, 0, S, S);
        ctx.restore();
      }
    }
  }
  scene.textures.addCanvas('ground-detail', canvas);
}

/** Soft radial light halo for lanterns, campfires and magic glows (additive blend). */
export function createLightHaloTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('light-halo')) return;
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  scene.textures.addCanvas('light-halo', canvas);
}

/** Small soft round particle for ambient effects (pollen, fireflies, embers, dust). */
export function createSoftParticleTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('particle-soft')) return;
  const S = 16;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  scene.textures.addCanvas('particle-soft', canvas);
}

/** Round dirt "stamp" used to build organic-looking paths by stamping along a line. */
export function createPathStampTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('path-stamp')) return;
  const S = 64;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(150,122,86,0.95)');
  g.addColorStop(0.55, 'rgba(140,113,78,0.85)');
  g.addColorStop(0.8, 'rgba(120,96,66,0.4)');
  g.addColorStop(1, 'rgba(110,88,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  // a few pebbles
  const rng = (n: number) => Math.abs(Math.sin(3 * 9301 + n * 49297) * 0.5 + 0.5);
  for (let i = 0; i < 5; i++) {
    const x = 12 + rng(i * 2) * (S - 24);
    const y = 12 + rng(i * 2 + 1) * (S - 24);
    ctx.fillStyle = i % 2 ? 'rgba(105,85,60,0.5)' : 'rgba(180,155,115,0.45)';
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + rng(i + 9) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  scene.textures.addCanvas('path-stamp', canvas);
}

/** Ore vein node — a rock with glowing crystals, for the crafting resource nodes. */
export function createOreNodeTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('ore-node')) return;
  const gfx = scene.add.graphics();
  const s = 34;
  gfx.fillStyle(0x57534e, 1); gfx.fillEllipse(s / 2, s / 2 + 3, s - 4, s - 12);
  gfx.fillStyle(0x78716c, 1); gfx.fillEllipse(s / 2 - 3, s / 2 - 1, s - 12, s - 18);
  // crystals
  gfx.fillStyle(0x38bdf8, 1);
  gfx.fillTriangle(10, 16, 14, 6, 18, 16);
  gfx.fillTriangle(18, 19, 22, 10, 25, 19);
  gfx.fillStyle(0x7dd3fc, 1);
  gfx.fillTriangle(12, 16, 14, 9, 16, 16);
  gfx.fillStyle(0xbae6fd, 0.8);
  gfx.fillTriangle(20, 18, 22, 13, 23, 18);
  gfx.generateTexture('ore-node', s, s);
  gfx.destroy();
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

  // Soft radial blob shadow (canvas gradient) instead of a hard-edged ellipse.
  const W = 56, H = 24;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(1, H / W);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, W / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.4)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-W / 2, -W / 2, W, W);
  ctx.restore();
  scene.textures.addCanvas('shadow', canvas);
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
