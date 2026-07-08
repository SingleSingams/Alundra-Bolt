import * as Phaser from 'phaser';
import { MaterialId, RESOURCE_RESPAWN_MS } from './constants';

export type ResourceKind = Exclude<MaterialId, 'essence'>;

const NODE_TEXTURES: Record<ResourceKind, { key: string; scale: number; fallbackTint: number }> = {
  wood:  { key: 'decor-stump',      scale: 0.30, fallbackTint: 0x92400e },
  stone: { key: 'decor-rock',       scale: 0.30, fallbackTint: 0x78716c },
  herb:  { key: 'decor-bush-berry', scale: 0.30, fallbackTint: 0x16a34a },
  ore:   { key: 'ore-node',         scale: 1.0,  fallbackTint: 0x38bdf8 },
};

/**
 * A gatherable resource in the world (wood/stone/herb/ore). Interact to
 * harvest; the node depletes and respawns after RESOURCE_RESPAWN_MS.
 */
export class ResourceNode extends Phaser.GameObjects.Container {
  public readonly kind: ResourceKind;
  private sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private promptGfx: Phaser.GameObjects.Graphics;
  private sparkle: Phaser.GameObjects.Image | null = null;
  private depleted = false;
  private promptVisible = false;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: ResourceKind) {
    super(scene, x, y);
    this.kind = kind;

    const tex = NODE_TEXTURES[kind];
    const key = scene.textures.exists(tex.key) ? tex.key : 'rock';

    const frame = scene.textures.getFrame(key);
    const vw = frame.realWidth * tex.scale;
    const vh = frame.realHeight * tex.scale;
    this.shadow = scene.add.image(vw * 0.04, vh * 0.4, 'shadow')
      .setDisplaySize(Math.max(20, vw * 0.9), Math.max(8, vh * 0.3))
      .setAlpha(0.6);
    this.sprite = scene.add.image(0, 0, key).setScale(tex.scale);

    // subtle sparkle so gatherables read as interactive
    if (scene.textures.exists('particle-soft')) {
      this.sparkle = scene.add.image(vw * 0.25, -vh * 0.3, 'particle-soft');
      this.sparkle.setTint(0xfff7c2).setBlendMode(Phaser.BlendModes.ADD).setScale(0.7);
      scene.tweens.add({
        targets: this.sparkle,
        alpha: { from: 0.15, to: 0.85 },
        scale: { from: 0.45, to: 0.8 },
        yoyo: true,
        repeat: -1,
        duration: 1000 + Math.random() * 600,
        ease: 'Sine.easeInOut',
      });
    }

    this.promptGfx = scene.add.graphics();
    const children: Phaser.GameObjects.GameObject[] = [this.shadow, this.sprite, this.promptGfx];
    if (this.sparkle) children.splice(2, 0, this.sparkle);
    this.add(children);

    scene.add.existing(this);
    this.setDepth(y + 0.3);
  }

  isAvailable(): boolean {
    return !this.depleted;
  }

  showInteractPrompt(show: boolean): void {
    if (show === this.promptVisible) return;
    this.promptVisible = show;
    this.promptGfx.clear();
    if (!show) return;
    this.promptGfx.fillStyle(0x1f2937, 0.9);
    this.promptGfx.fillRoundedRect(-13, -34, 26, 14, 3);
    this.promptGfx.lineStyle(1, 0xa7f3d0, 1);
    this.promptGfx.strokeRoundedRect(-13, -34, 26, 14, 3);
    this.promptGfx.fillStyle(0xa7f3d0, 1);
    this.promptGfx.fillCircle(-5, -27, 1.2);
    this.promptGfx.fillCircle(0, -27, 1.2);
    this.promptGfx.fillCircle(5, -27, 1.2);
    this.promptGfx.fillTriangle(-2, -20, 2, -20, 0, -16);
  }

  /** Harvest the node. Returns true if it yielded (was not depleted). */
  gather(): boolean {
    if (this.depleted) return false;
    this.depleted = true;
    this.showInteractPrompt(false);
    this.sparkle?.setVisible(false);

    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.15,
      scaleY: this.sprite.scaleY * 0.8,
      duration: 90,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.sprite.setAlpha(0.35);
      },
    });

    this.scene.time.delayedCall(RESOURCE_RESPAWN_MS, () => {
      if (!this.active) return;
      this.depleted = false;
      this.sprite.setAlpha(1);
      this.sparkle?.setVisible(true);
    });
    return true;
  }
}
