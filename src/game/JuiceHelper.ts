import * as Phaser from 'phaser';

export class JuiceHelper {
  private isFreezeFraming = false;

  constructor(private scene: Phaser.Scene) {}

  spawnParticleBurst(
    x: number, y: number,
    color: number,
    count: number,
    spread: number,
    lifetime: number
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.4, 0.4);
      const speed = Phaser.Math.FloatBetween(spread * 0.35, spread);
      const sq = this.scene.add.image(x, y, 'particle-sq');
      sq.setTint(color);
      sq.setDepth(9990);
      this.scene.tweens.add({
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

  showFloatingText(worldX: number, worldY: number, label: string, color = '#fde68a'): void {
    const text = this.scene.add.text(worldX, worldY, label, {
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      fontSize: '12px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
      resolution: 2,
    });
    text.setOrigin(0.5, 1);
    text.setDepth(9991);
    this.scene.tweens.add({
      targets: text,
      y: worldY - 36,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  showDamageNumber(worldX: number, worldY: number, amount: number, isHeal: boolean): void {
    const label = isHeal ? `+${amount}` : `-${amount}`;
    const text = this.scene.add.text(worldX, worldY, label, {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '13px',
      color: isHeal ? '#4ade80' : '#f87171',
      stroke: '#000000',
      strokeThickness: 3,
      resolution: 2,
    });
    text.setOrigin(0.5, 1);
    text.setDepth(9991);
    this.scene.tweens.add({
      targets: text,
      y: worldY - 42,
      alpha: 0,
      duration: 620,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  flashScreen(): void {
    const cam = this.scene.cameras.main;
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0xffffff, 1);
    overlay.fillRect(0, 0, cam.width, cam.height);
    overlay.setScrollFactor(0);
    overlay.setDepth(99998);
    overlay.setAlpha(0.3);
    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 90,
      onComplete: () => overlay.destroy(),
    });
  }

  triggerFreezeFrame(durationMs: number): void {
    if (this.isFreezeFraming) return;
    this.isFreezeFraming = true;
    window.setTimeout(() => {
      this.scene.scene.resume();
      this.isFreezeFraming = false;
    }, durationMs);
    this.scene.scene.pause();
  }
}
