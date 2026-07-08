import * as Phaser from 'phaser';
import { ZoneId } from './constants';

/**
 * HD-2.5D atmosphere: camera post-processing (color grade, vignette, tilt-shift)
 * plus per-zone ambient particles and light halos. All postFX calls are guarded —
 * on the Canvas renderer they are simply skipped.
 */

interface ZoneGrade {
  /** color matrix tint austerity: [brightness, saturation] */
  brightness: number;
  saturate: number;
  /** additional hue-ish overlay color + alpha painted over the whole world */
  overlay: number;
  overlayAlpha: number;
  /** ambient particle style */
  particles: 'pollen' | 'leaves' | 'dust' | 'embers' | null;
  particleTint: number;
}

const ZONE_GRADES: Record<ZoneId, ZoneGrade> = {
  grasslands:       { brightness: 1.06, saturate: 0.18, overlay: 0xffd9a0, overlayAlpha: 0.06, particles: 'pollen', particleTint: 0xfff3c4 },
  forest:           { brightness: 0.97, saturate: 0.12, overlay: 0x86efac, overlayAlpha: 0.05, particles: 'leaves', particleTint: 0x86c06a },
  dungeon:          { brightness: 0.90, saturate: -0.08, overlay: 0x94a3b8, overlayAlpha: 0.08, particles: 'dust',   particleTint: 0xcbd5e1 },
  dungeon_interior: { brightness: 0.85, saturate: -0.12, overlay: 0x6d7ba8, overlayAlpha: 0.10, particles: 'dust',   particleTint: 0xa5b4fc },
  boss_room:        { brightness: 0.88, saturate: 0.10, overlay: 0x9333ea, overlayAlpha: 0.10, particles: 'embers', particleTint: 0xc084fc },
};

export class AtmosphereSystem {
  private overlayRect: Phaser.GameObjects.Rectangle | null = null;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private halos: Phaser.GameObjects.Image[] = [];
  private cameraFXApplied = false;

  constructor(private scene: Phaser.Scene) {}

  /** One-time camera FX. Call once after camera setup. */
  applyCameraFX(): void {
    if (this.cameraFXApplied) return;
    this.cameraFXApplied = true;
    if (this.isSoftwareRenderer()) return;
    const cam = this.scene.cameras.main;
    try {
      // Phaser 4 filter API; `external` = screen-space, after camera zoom.
      const fx = cam.filters?.external;
      if (!fx) return;
      // Miniature/diorama depth-of-field — the signature Octopath look.
      // Very subtle: blur only kicks in near the top and bottom edges.
      fx.addTiltShift(0.3, 1.1, 0.05, 0.2, 0.8, 0.5);
      fx.addVignette(0.5, 0.5, 0.95, 0.3);
    } catch {
      // Renderer without filter support (Canvas) — visuals degrade gracefully.
    }
  }

  /**
   * Multi-pass camera filters bring software WebGL (SwiftShader/llvmpipe —
   * VMs, CI, very weak devices) to a crawl. Skip them there; everything else
   * (overlay grade, particles, halos) stays on.
   */
  private isSoftwareRenderer(): boolean {
    try {
      const renderer = this.scene.game.renderer;
      const gl = (renderer as Phaser.Renderer.WebGL.WebGLRenderer).gl;
      if (!gl) return true; // Canvas renderer — no filter support anyway
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const name = info
        ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER));
      return /swiftshader|llvmpipe|softpipe|software/i.test(name);
    } catch {
      return false;
    }
  }

  /** Per-zone grade + ambient particles. Call from loadZone(). */
  applyZone(zone: ZoneId): void {
    const grade = ZONE_GRADES[zone];

    // Screen-space color overlay (cheap "color grade" that also works on Canvas).
    // scrollFactor(0) + oversized rect: GPU fill cost is only the viewport.
    if (!this.overlayRect) {
      this.overlayRect = this.scene.add.rectangle(0, 0, 4096, 4096, grade.overlay, grade.overlayAlpha);
      this.overlayRect.setOrigin(0, 0);
      this.overlayRect.setScrollFactor(0);
      this.overlayRect.setDepth(5000);
      this.overlayRect.setBlendMode(Phaser.BlendModes.OVERLAY);
    } else {
      this.overlayRect.setFillStyle(grade.overlay, grade.overlayAlpha);
    }

    this.startParticles(grade);
  }

  private startParticles(grade: ZoneGrade): void {
    this.emitter?.destroy();
    this.emitter = null;
    if (!grade.particles || !this.scene.textures.exists('particle-soft')) return;
    // Software GL chokes on additive-blend particles — skip them there.
    if (this.isSoftwareRenderer()) return;

    // Screen-space ambient particles: emitted across a generous viewport-sized
    // band instead of the whole 1920² world — far fewer live particles.
    const base: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: { min: -100, max: 2100 },
      y: { min: -100, max: 1300 },
      tint: grade.particleTint,
      blendMode: Phaser.BlendModes.ADD,
    };

    let config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;
    switch (grade.particles) {
      case 'pollen':
        config = {
          ...base,
          lifespan: 9000, frequency: 220, quantity: 1,
          alpha: { values: [0, 0.5, 0], interpolation: 'linear' },
          scale: { min: 0.25, max: 0.5 },
          speedX: { min: 4, max: 14 }, speedY: { min: -6, max: 6 },
        };
        break;
      case 'leaves':
        config = {
          ...base,
          lifespan: 8000, frequency: 260, quantity: 1,
          alpha: { values: [0, 0.55, 0], interpolation: 'linear' },
          scale: { min: 0.3, max: 0.6 },
          speedX: { min: -18, max: -6 }, speedY: { min: 8, max: 22 },
          rotate: { min: 0, max: 360 },
        };
        break;
      case 'dust':
        config = {
          ...base,
          lifespan: 11000, frequency: 300, quantity: 1,
          alpha: { values: [0, 0.32, 0], interpolation: 'linear' },
          scale: { min: 0.2, max: 0.45 },
          speedX: { min: -4, max: 4 }, speedY: { min: -4, max: 4 },
        };
        break;
      case 'embers':
        config = {
          ...base,
          lifespan: 6500, frequency: 150, quantity: 1,
          alpha: { values: [0, 0.65, 0], interpolation: 'linear' },
          scale: { min: 0.25, max: 0.55 },
          speedX: { min: -6, max: 6 }, speedY: { min: -26, max: -10 },
        };
        break;
    }

    this.emitter = this.scene.add.particles(0, 0, 'particle-soft', config);
    this.emitter.setScrollFactor(0);
    this.emitter.setDepth(6000);
  }

  /** Warm pulsing light halo (campfires, lanterns). Returned image is auto-tracked. */
  addLightHalo(x: number, y: number, radius: number, color: number, alpha = 0.5): Phaser.GameObjects.Image {
    const halo = this.scene.add.image(x, y, 'light-halo');
    halo.setDisplaySize(radius * 2, radius * 2);
    halo.setTint(color);
    halo.setAlpha(alpha);
    halo.setBlendMode(Phaser.BlendModes.ADD);
    halo.setDepth(4500);
    this.scene.tweens.add({
      targets: halo,
      alpha: { from: alpha * 0.75, to: alpha },
      scaleX: { from: halo.scaleX * 0.94, to: halo.scaleX * 1.05 },
      scaleY: { from: halo.scaleY * 0.94, to: halo.scaleY * 1.05 },
      yoyo: true,
      repeat: -1,
      duration: 900 + Math.random() * 500,
      ease: 'Sine.easeInOut',
    });
    this.halos.push(halo);
    return halo;
  }

  /** Destroy zone-scoped objects (halos). Call from clearZoneContent(). */
  clearZone(): void {
    for (const halo of this.halos) halo.destroy();
    this.halos.length = 0;
  }
}
