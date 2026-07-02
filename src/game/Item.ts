import * as Phaser from 'phaser';
import { InventoryItem, ZoneId, ZONE_LOOT_TABLE, rollLoot } from './constants';

export type WorldItemType = 'chest' | 'heart_pickup' | 'potion_pickup';

export class Item extends Phaser.GameObjects.Container {
  public readonly itemType: WorldItemType;
  private sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private promptGfx: Phaser.GameObjects.Graphics;
  private bobTime = 0;
  private opened = false;
  private promptVisible = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: WorldItemType) {
    super(scene, x, y);
    this.itemType = type;

    Item.ensureTextures(scene);

    this.shadow = scene.add.image(0, 10, 'shadow').setAlpha(0.5).setScale(0.4, 0.3);

    const textureKey = type === 'chest' ? 'chest-closed' : type === 'potion_pickup' ? 'potion-pickup' : 'heart-pickup';
    this.sprite = scene.add.image(0, 0, textureKey);

    this.promptGfx = scene.add.graphics();

    this.add([this.shadow, this.sprite, this.promptGfx]);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (type === 'chest') {
      body.setSize(20, 16);
      body.setOffset(-10, -2);
    } else {
      body.setSize(16, 16);
      body.setOffset(-8, -8);
    }
    body.setImmovable(type === 'chest');
    body.setAllowGravity(false);
  }

  static ensureTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists('chest-closed')) {
      const gfx = scene.add.graphics();
      // Chest base
      gfx.fillStyle(0x78350f, 1);
      gfx.fillRect(2, 8, 20, 14);
      gfx.fillStyle(0x92400e, 1);
      gfx.fillRect(3, 9, 18, 5);
      // Lid
      gfx.fillStyle(0x92400e, 1);
      gfx.fillRect(2, 4, 20, 6);
      gfx.fillStyle(0xb45309, 1);
      gfx.fillRect(3, 5, 18, 2);
      // Gold trim
      gfx.fillStyle(0xfbbf24, 1);
      gfx.fillRect(2, 10, 20, 1);
      gfx.fillRect(11, 12, 2, 6);
      // Lock
      gfx.fillStyle(0xeab308, 1);
      gfx.fillRect(10, 11, 4, 4);
      gfx.fillStyle(0x111111, 1);
      gfx.fillRect(11, 12, 2, 2);
      // Outline
      gfx.lineStyle(1, 0x451a03, 1);
      gfx.strokeRect(2, 4, 20, 18);

      gfx.generateTexture('chest-closed', 24, 24);
      gfx.destroy();
    }

    if (!scene.textures.exists('chest-open')) {
      const gfx = scene.add.graphics();
      gfx.fillStyle(0x78350f, 1);
      gfx.fillRect(2, 10, 20, 12);
      gfx.fillStyle(0xfbbf24, 1);
      gfx.fillRect(5, 12, 14, 6);
      gfx.fillStyle(0xfef3c7, 0.7);
      gfx.fillRect(6, 13, 12, 2);
      gfx.fillStyle(0x92400e, 1);
      gfx.fillRect(1, 2, 22, 4);
      gfx.lineStyle(1, 0x451a03, 1);
      gfx.strokeRect(2, 10, 20, 12);
      gfx.generateTexture('chest-open', 24, 24);
      gfx.destroy();
    }

    if (!scene.textures.exists('heart-pickup')) {
      const gfx = scene.add.graphics();
      // Heart shape
      gfx.fillStyle(0x7f1d1d, 1);
      gfx.fillCircle(7, 8, 5);
      gfx.fillCircle(13, 8, 5);
      gfx.fillTriangle(2, 10, 18, 10, 10, 18);
      gfx.fillStyle(0xef4444, 1);
      gfx.fillCircle(7, 7, 4);
      gfx.fillCircle(13, 7, 4);
      gfx.fillTriangle(3, 9, 17, 9, 10, 17);
      // Shine
      gfx.fillStyle(0xfecaca, 1);
      gfx.fillEllipse(6, 6, 3, 2);
      gfx.generateTexture('heart-pickup', 20, 20);
      gfx.destroy();
    }

    if (!scene.textures.exists('potion-pickup')) {
      const gfx = scene.add.graphics();
      // Flask body
      gfx.fillStyle(0x14532d, 1);
      gfx.fillRect(7, 10, 8, 10);
      gfx.fillStyle(0x16a34a, 1);
      gfx.fillEllipse(11, 16, 10, 10);
      // Liquid shine
      gfx.fillStyle(0x4ade80, 1);
      gfx.fillEllipse(10, 15, 7, 7);
      gfx.fillStyle(0xbbf7d0, 0.6);
      gfx.fillEllipse(9, 13, 3, 2);
      // Neck & cork
      gfx.fillStyle(0x166534, 1);
      gfx.fillRect(9, 5, 4, 6);
      gfx.fillStyle(0x92400e, 1);
      gfx.fillRect(8, 3, 6, 3);
      gfx.generateTexture('potion-pickup', 22, 22);
      gfx.destroy();
    }
  }

  update(delta: number): void {
    if (!this.opened) {
      this.bobTime += delta * 0.004;
      this.sprite.y = Math.sin(this.bobTime) * 2;
    }
    this.setDepth(this.y + 1);
  }

  isOpened(): boolean {
    return this.opened;
  }

  showInteractPrompt(show: boolean): void {
    if (show === this.promptVisible) return;
    this.promptVisible = show;
    this.promptGfx.clear();
    if (!show) return;

    this.promptGfx.fillStyle(0x1f2937, 0.85);
    this.promptGfx.fillRoundedRect(-11, -26, 22, 12, 3);
    this.promptGfx.lineStyle(1, 0xfef08a, 1);
    this.promptGfx.strokeRoundedRect(-11, -26, 22, 12, 3);

    this.promptGfx.fillStyle(0xfef08a, 1);
    // A small "Z" letter made of rects
    this.promptGfx.fillRect(-4, -23, 8, 1);
    this.promptGfx.fillRect(-4, -17, 8, 1);
    this.promptGfx.fillRect(2, -22, 1, 2);
    this.promptGfx.fillRect(0, -20, 1, 1);
    this.promptGfx.fillRect(-2, -19, 1, 1);
    this.promptGfx.fillRect(-4, -18, 1, 1);
  }

  /** Opens a chest. Returns the granted inventory item, or null if not openable. */
  openChest(zone?: ZoneId): InventoryItem | null {
    if (this.itemType !== 'chest' || this.opened) return null;
    this.opened = true;
    this.showInteractPrompt(false);
    this.sprite.setTexture('chest-open');

    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 4,
      duration: 140,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    if (zone && ZONE_LOOT_TABLE[zone]) return rollLoot(ZONE_LOOT_TABLE[zone]);

    // fallback: original flat distribution
    const r = Math.random();
    if (r < 0.28) return 'heart';
    if (r < 0.50) return 'potion';
    if (r < 0.70) return 'shield_fragment';
    if (r < 0.85) return 'sword_upgrade';
    return 'projectile_upgrade';
  }

  /** Marks a pickup as collected and removes it with a small tween. */
  collect(onComplete: () => void): void {
    if (this.opened) return;
    this.opened = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    this.scene.tweens.add({
      targets: this,
      y: this.y - 14,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 260,
      ease: 'Sine.easeOut',
      onComplete: () => {
        onComplete();
        this.destroy();
      },
    });
  }
}
