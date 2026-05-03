import * as Phaser from 'phaser';
import { Player } from './Player';
import { TILE_SIZE, ENEMY_MAX_HP, ENEMY_HIT_INVULN_MS, ENEMY_FLASH_MS, ENEMY_HP_SCALE, ENEMY_DAMAGE_SCALE } from './constants';

const CHASE_RANGE = 150;
const LEASH_RANGE = 250;
const ENEMY_SPEED = 75;
const PATROL_SPEED = 42;
const PATROL_RANGE = TILE_SIZE * 3;

type EnemyState = 'PATROL' | 'CHASE';
export type PatrolAxis = 'x' | 'y';

export class Enemy extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private alertBubble: Phaser.GameObjects.Graphics;

  private aiState: EnemyState = 'PATROL';
  private readonly patrolCenter: Phaser.Math.Vector2;
  private readonly patrolAxis: PatrolAxis;
  private patrolDir = 1;
  private alertVisible = false;
  private hp: number;
  private maxHp: number;
  private contactDamage: number;
  private hitInvulnTimer = 0;
  private dying = false;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolAxis: PatrolAxis = 'x', level = 1) {
    super(scene, x, y);

    this.patrolCenter = new Phaser.Math.Vector2(x, y);
    this.patrolAxis = patrolAxis;
    const idx = Math.min(level - 1, ENEMY_HP_SCALE.length - 1);
    this.maxHp = Math.round(ENEMY_MAX_HP * ENEMY_HP_SCALE[idx]);
    this.hp = this.maxHp;
    this.contactDamage = ENEMY_DAMAGE_SCALE[idx];

    this.ensureTextures(scene);

    this.shadow = scene.add.image(0, 9, 'shadow').setAlpha(0.38).setScale(0.8);
    this.sprite = scene.add.image(0, 0, 'enemy');
    this.alertBubble = scene.add.graphics();

    this.add([this.shadow, this.sprite, this.alertBubble]);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 14);
    body.setOffset(-9, 2);
    body.setCollideWorldBounds(true);
  }

  private ensureTextures(scene: Phaser.Scene): void {
    if (scene.textures.exists('enemy')) return;

    const gfx = scene.add.graphics();
    const s = 24;

    // Body
    gfx.fillStyle(0xb91c1c, 1);
    gfx.fillRect(2, 5, s - 4, s - 7);

    // Highlight
    gfx.fillStyle(0xef4444, 1);
    gfx.fillRect(3, 6, s - 6, 4);

    // Eyes (white sclera)
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(7, 11, 3.5);
    gfx.fillCircle(s - 7, 11, 3.5);

    // Pupils
    gfx.fillStyle(0x111111, 1);
    gfx.fillCircle(7, 12, 1.8);
    gfx.fillCircle(s - 7, 12, 1.8);

    // Angry brows
    gfx.fillStyle(0x7f1d1d, 1);
    gfx.fillRect(3, 6, 7, 2);
    gfx.fillRect(s - 10, 6, 7, 2);

    gfx.generateTexture('enemy', s, s);
    gfx.destroy();
  }

  update(player: Player, delta: number = 16): void {
    if (this.dying) return;
    if (this.hitInvulnTimer > 0) {
      this.hitInvulnTimer = Math.max(0, this.hitInvulnTimer - delta);
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const body = this.body as Phaser.Physics.Arcade.Body;

    switch (this.aiState) {
      case 'PATROL':
        if (dist < CHASE_RANGE) {
          this.enterChase();
        } else {
          this.doPatrol(body);
        }
        break;

      case 'CHASE':
        if (dist > LEASH_RANGE) {
          this.enterPatrol(body);
        } else {
          this.doChase(player, body);
        }
        break;
    }

    this.setDepth(this.y + 1);
  }

  private enterChase(): void {
    this.aiState = 'CHASE';
    this.sprite.setTint(0xff6060);
    this.showAlert();
  }

  private enterPatrol(body: Phaser.Physics.Arcade.Body): void {
    this.aiState = 'PATROL';
    this.sprite.clearTint();
    body.setVelocity(0, 0);
    this.hideAlert();
  }

  private doPatrol(body: Phaser.Physics.Arcade.Body): void {
    const isX = this.patrolAxis === 'x';
    const current = isX ? this.x : this.y;
    const center = isX ? this.patrolCenter.x : this.patrolCenter.y;

    if (current >= center + PATROL_RANGE) {
      this.patrolDir = -1;
    } else if (current <= center - PATROL_RANGE) {
      this.patrolDir = 1;
    }

    if (isX) {
      body.setVelocity(PATROL_SPEED * this.patrolDir, 0);
    } else {
      body.setVelocity(0, PATROL_SPEED * this.patrolDir);
    }
  }

  private doChase(player: Player, body: Phaser.Physics.Arcade.Body): void {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      body.setVelocity((dx / len) * ENEMY_SPEED, (dy / len) * ENEMY_SPEED);
    }
  }

  private showAlert(): void {
    if (this.alertVisible) return;
    this.alertVisible = true;
    this.alertBubble.clear();

    // Exclamation bubble above enemy
    this.alertBubble.fillStyle(0xfef08a, 1);
    this.alertBubble.fillRoundedRect(-6, -26, 12, 14, 3);
    this.alertBubble.fillStyle(0xfbbf24, 1);
    this.alertBubble.fillRect(-1.5, -23, 3, 6);
    this.alertBubble.fillRect(-1.5, -15, 3, 3);

    this.scene.time.delayedCall(600, () => this.hideAlert());
  }

  private hideAlert(): void {
    this.alertVisible = false;
    this.alertBubble.clear();
  }

  getState(): EnemyState {
    return this.aiState;
  }

  canBeHit(): boolean {
    return !this.dying && this.hitInvulnTimer <= 0;
  }

  isDying(): boolean {
    return this.dying;
  }

  getContactDamage(): number {
    return this.contactDamage;
  }

  takeDamage(amount: number, onDeath: (x: number, y: number) => void): boolean {
    if (!this.canBeHit()) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.hitInvulnTimer = ENEMY_HIT_INVULN_MS;

    // White hit flash — Phaser 4 uses setTint + setTintMode(FILL) instead of setTintFill
    this.sprite.setTint(0xffffff);
    (this.sprite as Phaser.GameObjects.Image & { setTintMode?: (m: number) => void })
      .setTintMode?.(1); // 1 = FILL in Phaser 4
    this.scene.time.delayedCall(ENEMY_FLASH_MS, () => {
      if (this.dying) return;
      this.sprite.clearTint();
      if (this.aiState === 'CHASE') {
        this.sprite.setTint(0xff6060);
      }
    });

    // Knockback away from attacker not required; keep simple
    if (this.hp <= 0) {
      this.die(onDeath);
    }
    return true;
  }

  private die(onDeath: (x: number, y: number) => void): void {
    this.dying = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.hideAlert();

    const deathX = this.x;
    const deathY = this.y;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.4,
      scaleY: 0.4,
      duration: 320,
      ease: 'Sine.easeIn',
      onComplete: () => {
        onDeath(deathX, deathY);
        this.destroy();
      },
    });
  }
}
