import * as Phaser from 'phaser';

const PROJECTILE_SPEED = 265;
const PROJECTILE_LIFETIME = 1100;

export class Projectile extends Phaser.GameObjects.Image {
  private lifetime = PROJECTILE_LIFETIME;
  private spent = false;
  isEnemyProjectile: boolean;

  // Piercing: track which enemies this projectile has already hit
  private readonly hitEnemies = new Set<string>();
  private piercingHitsRemaining = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, angleDeg: number, isEnemy = false) {
    super(scene, x, y, isEnemy ? 'projectile-enemy' : 'projectile');
    this.isEnemyProjectile = isEnemy;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 10);
    body.setAllowGravity(false);
    const rad = Phaser.Math.DegToRad(angleDeg);
    body.setVelocity(Math.cos(rad) * PROJECTILE_SPEED, Math.sin(rad) * PROJECTILE_SPEED);

    this.setDepth(5000);
  }

  static ensureTexture(scene: Phaser.Scene): void {
    if (!scene.textures.exists('projectile')) {
      const g = scene.add.graphics();
      g.fillStyle(0xfbbf24, 0.55);
      g.fillCircle(8, 8, 8);
      g.fillStyle(0xfef3c7, 1);
      g.fillCircle(8, 8, 5);
      g.fillStyle(0xfde68a, 1);
      g.fillCircle(8, 8, 3);
      g.generateTexture('projectile', 16, 16);
      g.destroy();
    }
    if (!scene.textures.exists('projectile-enemy')) {
      const g = scene.add.graphics();
      g.fillStyle(0x9333ea, 0.55);
      g.fillCircle(8, 8, 8);
      g.fillStyle(0xe879f9, 1);
      g.fillCircle(8, 8, 5);
      g.fillStyle(0xf0abfc, 1);
      g.fillCircle(8, 8, 3);
      g.generateTexture('projectile-enemy', 16, 16);
      g.destroy();
    }
  }

  // ─── Pool support ────────────────────────────────────────────────────────

  reset(x: number, y: number, angleDeg: number, isEnemy: boolean, piercing = 0): void {
    this.isEnemyProjectile = isEnemy;
    this.spent = false;
    this.lifetime = PROJECTILE_LIFETIME;
    this.hitEnemies.clear();
    this.piercingHitsRemaining = piercing;

    this.setTexture(isEnemy ? 'projectile-enemy' : 'projectile');
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(1);
    this.setDepth(5000);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(x, y);
    const rad = Phaser.Math.DegToRad(angleDeg);
    body.setVelocity(Math.cos(rad) * PROJECTILE_SPEED, Math.sin(rad) * PROJECTILE_SPEED);
  }

  deactivate(): void {
    this.spent = true;
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    body.setVelocity(0, 0);
  }

  // ─── Piercing ────────────────────────────────────────────────────────────

  /** Returns 'normal' (spend on hit), 'pierce' (damage but stay alive), or 'skip' (already hit). */
  markHit(enemyId: string): 'normal' | 'pierce' | 'skip' {
    if (this.hitEnemies.has(enemyId)) return 'skip';
    this.hitEnemies.add(enemyId);
    if (this.piercingHitsRemaining > 0) {
      this.piercingHitsRemaining--;
      return 'pierce';
    }
    return 'normal';
  }

  setPiercing(count: number): void {
    this.piercingHitsRemaining = count;
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  update(delta: number): void {
    if (this.spent || !this.scene || !this.active) return;
    this.lifetime -= delta;
    if (this.lifetime <= 0) {
      this.deactivate();
      return;
    }
    if (this.lifetime < 220) {
      this.setAlpha(this.lifetime / 220);
    }
    this.setDepth(this.y + 0.5);
  }

  hit(): void {
    if (this.spent || !this.scene) return;
    this.spent = true;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 2.2,
      scaleY: 2.2,
      duration: 130,
      ease: 'Sine.easeOut',
      onComplete: () => this.deactivate(),
    });
  }

  isSpent(): boolean {
    return this.spent;
  }
}
