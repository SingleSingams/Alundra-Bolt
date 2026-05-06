import * as Phaser from 'phaser';
import { Player } from './Player';
import { TILE_SIZE, ENEMY_MAX_HP, ENEMY_HIT_INVULN_MS, ENEMY_FLASH_MS, ENEMY_HP_SCALE, ENEMY_DAMAGE_SCALE } from './constants';

const CHASE_RANGE = 150;
const LEASH_RANGE = 250;
const ENEMY_SPEED = 75;
const PATROL_SPEED = 42;
const PATROL_RANGE = TILE_SIZE * 3;
const RANGER_STOP_RANGE = 120;
const RANGER_SHOOT_INTERVAL = 2000;

type EnemyState = 'PATROL' | 'CHASE';
export type PatrolAxis = 'x' | 'y';
export type EnemyType = 'basic' | 'ranger' | 'shielder' | 'speedrunner' | 'dragon' | 'dragon-red';

const ENEMY_SPRITE_SCALE = 0.095; // 256px frame → ~24px visual

export class Enemy extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private alertBubble: Phaser.GameObjects.Graphics;

  private aiState: EnemyState = 'PATROL';
  private readonly patrolCenter: Phaser.Math.Vector2;
  private readonly patrolAxis: PatrolAxis;
  readonly enemyType: EnemyType;
  private patrolDir = 1;
  private readonly flankAngleOffset: number;
  private alertVisible = false;
  private hp: number;
  private maxHp: number;
  private contactDamage: number;
  private hitInvulnTimer = 0;
  private dying = false;
  private shieldActive = false;
  private shieldGfx!: Phaser.GameObjects.Graphics;
  private shootCooldown = 0;
  private chaseSpeed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolAxis: PatrolAxis = 'x', level = 1, type: EnemyType = 'basic', hpMult = 1, damageMult = 1) {
    super(scene, x, y);

    this.patrolCenter = new Phaser.Math.Vector2(x, y);
    this.patrolAxis = patrolAxis;
    this.enemyType = type;
    this.flankAngleOffset = (Math.random() - 0.5) * 0.9;
    const idx = Math.min(level - 1, ENEMY_HP_SCALE.length - 1);
    this.maxHp = Math.round(ENEMY_MAX_HP * ENEMY_HP_SCALE[idx] * hpMult);
    this.hp = this.maxHp;
    this.contactDamage = Math.round(ENEMY_DAMAGE_SCALE[idx] * damageMult);
    if (type === 'dragon' || type === 'dragon-red') {
      this.maxHp = Math.round((type === 'dragon-red' ? 8 : 6) * hpMult);
      this.hp = this.maxHp;
      this.contactDamage = Math.round((type === 'dragon-red' ? 4 : 3) * damageMult);
    }
    this.chaseSpeed = type === 'speedrunner' ? ENEMY_SPEED * 2.1
      : type === 'dragon' || type === 'dragon-red' ? ENEMY_SPEED * 0.7
      : ENEMY_SPEED;

    this.ensureTextures(scene);

    // Real sprite keys for each type (loaded in LoadingScene)
    const realSpriteKey = type === 'shielder' ? 'enemy-orc'
      : type === 'speedrunner' ? 'enemy-rat'
      : type === 'basic' ? 'enemy-goblin'
      : type === 'dragon' ? 'enemy-dark-dragon'
      : type === 'dragon-red' ? 'enemy-red-dragon'
      : null;

    const fallbackKey = type === 'ranger' ? 'enemy-ranger'
      : type === 'shielder' ? 'enemy-shielder'
      : type === 'speedrunner' ? 'enemy-speedrunner'
      : (type === 'dragon' || type === 'dragon-red') ? 'enemy'
      : 'enemy';

    this.shadow = scene.add.image(0, 9, 'shadow').setAlpha(0.38).setScale(0.8);

    if (realSpriteKey && scene.textures.exists(realSpriteKey)) {
      const spriteScale = (type === 'dragon' || type === 'dragon-red') ? ENEMY_SPRITE_SCALE * 1.35 : ENEMY_SPRITE_SCALE;
      const spr = scene.add.sprite(0, 0, realSpriteKey, 0).setScale(spriteScale);
      if (scene.anims.exists(`${realSpriteKey}-idle`)) spr.play(`${realSpriteKey}-idle`);
      this.sprite = spr;
    } else {
      this.sprite = scene.add.image(0, 0, fallbackKey);
    }
    this.alertBubble = scene.add.graphics();
    this.shieldGfx = scene.add.graphics();

    if (type === 'shielder') {
      this.shieldActive = true;
      this.drawShield();
    }

    this.add([this.shadow, this.sprite, this.shieldGfx, this.alertBubble]);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 14);
    body.setOffset(-9, 2);
    body.setCollideWorldBounds(true);
  }

  private ensureTextures(scene: Phaser.Scene): void {
    // Basic enemy – red orc-like creature
    if (!scene.textures.exists('enemy')) {
      const g = scene.add.graphics();
      const s = 24;
      // Legs
      g.fillStyle(0x7f1d1d, 1); g.fillRect(5, 16, 5, 7); g.fillRect(14, 16, 5, 7);
      // Body
      g.fillStyle(0xb91c1c, 1); g.fillRect(3, 7, 18, 10);
      // Belly
      g.fillStyle(0xef4444, 1); g.fillRect(5, 9, 14, 6);
      // Arms
      g.fillStyle(0xb91c1c, 1); g.fillRect(0, 8, 4, 7); g.fillRect(20, 8, 4, 7);
      // Claws
      g.fillStyle(0xfef2f2, 1);
      g.fillRect(0, 14, 2, 2); g.fillRect(2, 15, 2, 2);
      g.fillRect(20, 14, 2, 2); g.fillRect(22, 15, 2, 2);
      // Head
      g.fillStyle(0xef4444, 1); g.fillRect(4, 0, 16, 8);
      // Horns
      g.fillStyle(0x7f1d1d, 1);
      g.fillTriangle(4, 0, 7, 0, 5, -4);
      g.fillTriangle(17, 0, 20, 0, 19, -4);
      // Eyes
      g.fillStyle(0xfef08a, 1); g.fillCircle(9, 4, 3); g.fillCircle(15, 4, 3);
      g.fillStyle(0x111111, 1); g.fillCircle(9, 5, 1.5); g.fillCircle(15, 5, 1.5);
      g.generateTexture('enemy', s, 24); g.destroy();
    }

    // Ranger enemy – blue hooded archer
    if (!scene.textures.exists('enemy-ranger')) {
      const g = scene.add.graphics();
      const s = 22;
      // Legs
      g.fillStyle(0x1e3a8a, 1); g.fillRect(4, 15, 4, 6); g.fillRect(14, 15, 4, 6);
      // Cloak / body
      g.fillStyle(0x1d4ed8, 1); g.fillEllipse(s / 2, 11, 16, 12);
      g.fillStyle(0x2563eb, 1); g.fillRect(3, 7, s - 6, 7);
      // Arms
      g.fillStyle(0x1d4ed8, 1); g.fillRect(0, 8, 4, 6); g.fillRect(s - 4, 8, 4, 6);
      // Bow
      g.lineStyle(2, 0x7c3aed, 1);
      g.beginPath(); g.arc(s - 3, 10, 5, -Math.PI * 0.6, Math.PI * 0.6); g.strokePath();
      g.lineStyle(1, 0xfef3c7, 0.9);
      g.lineBetween(s - 3, 5, s - 3, 15);
      // Head / hood
      g.fillStyle(0x1e3a8a, 1); g.fillEllipse(s / 2, 4, 12, 10);
      g.fillStyle(0x3b82f6, 1); g.fillEllipse(s / 2, 5, 8, 6);
      // Eyes
      g.fillStyle(0x7dd3fc, 1); g.fillCircle(8, 4, 2); g.fillCircle(s - 8, 4, 2);
      g.fillStyle(0x111111, 1); g.fillCircle(8, 5, 1); g.fillCircle(s - 8, 5, 1);
      g.generateTexture('enemy-ranger', s, 22); g.destroy();
    }

    // Shielder – stocky grey armored enemy
    if (!scene.textures.exists('enemy-shielder')) {
      const g = scene.add.graphics();
      const s = 28;
      // Legs / greaves
      g.fillStyle(0x44403c, 1); g.fillRect(5, 17, 7, 8); g.fillRect(16, 17, 7, 8);
      g.fillStyle(0x78716c, 1); g.fillRect(5, 21, 7, 2); g.fillRect(16, 21, 7, 2);
      // Body armor
      g.fillStyle(0x57534e, 1); g.fillRect(4, 7, 20, 11);
      g.fillStyle(0x78716c, 1); g.fillRect(5, 8, 18, 5);
      // Pauldrons (shoulder pads)
      g.fillStyle(0x44403c, 1); g.fillEllipse(4, 9, 8, 6); g.fillEllipse(s - 4, 9, 8, 6);
      // Shield
      g.fillStyle(0x1e3a8a, 1); g.fillRect(-4, 8, 8, 12);
      g.lineStyle(1.5, 0x93c5fd, 1); g.strokeRect(-4, 8, 8, 12);
      g.fillStyle(0x3b82f6, 1); g.fillCircle(-1, 14, 3);
      // Head / helm
      g.fillStyle(0x57534e, 1); g.fillRect(7, 0, 14, 8);
      g.fillStyle(0x78716c, 1); g.fillRect(6, 2, 16, 4);
      // Eye slit
      g.fillStyle(0x111111, 1); g.fillRect(9, 3, 10, 2);
      g.fillStyle(0x7dd3fc, 0.8); g.fillRect(10, 3, 8, 1);
      g.generateTexture('enemy-shielder', s, 26); g.destroy();
    }

    // Speedrunner – slim orange demon
    if (!scene.textures.exists('enemy-speedrunner')) {
      const g = scene.add.graphics();
      const s = 20;
      // Tail
      g.fillStyle(0x92400e, 1);
      g.fillTriangle(s - 2, 10, s + 4, 6, s + 2, 14);
      // Legs (blurred motion)
      g.fillStyle(0xd97706, 1); g.fillRect(3, 14, 4, 6); g.fillRect(13, 14, 4, 6);
      g.fillStyle(0x92400e, 0.5); g.fillRect(1, 14, 4, 4); g.fillRect(11, 14, 4, 4);
      // Body
      g.fillStyle(0xd97706, 1); g.fillRect(3, 6, 14, 9);
      g.fillStyle(0xfbbf24, 1); g.fillRect(4, 7, 12, 5);
      // Arms
      g.fillStyle(0xd97706, 1); g.fillRect(0, 7, 3, 6); g.fillRect(s - 3, 7, 3, 6);
      // Head
      g.fillStyle(0xf59e0b, 1); g.fillEllipse(s / 2, 4, 12, 8);
      // Horns
      g.fillStyle(0x78350f, 1);
      g.fillTriangle(5, 1, 8, 1, 6, -3);
      g.fillTriangle(12, 1, 15, 1, 14, -3);
      // Eyes (angry)
      g.fillStyle(0xff0000, 1); g.fillCircle(7, 4, 2); g.fillCircle(13, 4, 2);
      g.fillStyle(0x111111, 1); g.fillCircle(7, 5, 1); g.fillCircle(13, 5, 1);
      // Speed lines
      g.lineStyle(1.5, 0xfef3c7, 0.7);
      g.lineBetween(-3, 7, 2, 7); g.lineBetween(-4, 11, 1, 11);
      g.generateTexture('enemy-speedrunner', s + 6, 21); g.destroy();
    }
  }

  private drawShield(): void {
    this.shieldGfx.clear();
    if (!this.shieldActive) return;
    this.shieldGfx.lineStyle(2.5, 0x93c5fd, 0.85);
    this.shieldGfx.strokeCircle(0, 0, 16);
    this.shieldGfx.fillStyle(0x3b82f6, 0.18);
    this.shieldGfx.fillCircle(0, 0, 16);
  }

  update(player: Player, delta: number = 16): void {
    if (this.dying) return;
    if (this.hitInvulnTimer > 0) {
      this.hitInvulnTimer = Math.max(0, this.hitInvulnTimer - delta);
    }
    if (this.shootCooldown > 0) {
      this.shootCooldown = Math.max(0, this.shootCooldown - delta);
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
        } else if (this.enemyType === 'ranger' && dist < RANGER_STOP_RANGE) {
          body.setVelocity(0, 0);
        } else {
          this.doChase(player, body);
        }
        break;
    }

    this.setDepth(this.y + 1);
  }

  wantsShoot(player: Player): boolean {
    if (this.enemyType !== 'ranger' || this.dying || this.aiState !== 'CHASE') return false;
    if (this.shootCooldown > 0) return false;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    return dist < RANGER_STOP_RANGE + 30;
  }

  markShot(): void {
    this.shootCooldown = RANGER_SHOOT_INTERVAL;
  }

  getShootAngle(playerX: number, playerY: number): number {
    return Math.atan2(playerY - this.y, playerX - this.x) * (180 / Math.PI);
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
    if (len <= 1) return;

    if (this.enemyType === 'ranger') {
      // Rangers maintain optimal firing distance
      if (len < RANGER_STOP_RANGE - 20) {
        // Too close: back away
        body.setVelocity(-(dx / len) * this.chaseSpeed * 0.75, -(dy / len) * this.chaseSpeed * 0.75);
      } else if (len <= RANGER_STOP_RANGE + 50) {
        // In optimal range: strafe slightly
        body.setVelocity(-(dy / len) * 28, (dx / len) * 28);
      } else {
        // Too far: close in
        body.setVelocity((dx / len) * this.chaseSpeed, (dy / len) * this.chaseSpeed);
      }
      return;
    }

    // Basic / shielder / speedrunner: approach with per-enemy angle offset (flanking spread)
    const rawAngle = Math.atan2(dy, dx);
    const adjustedAngle = rawAngle + this.flankAngleOffset;
    body.setVelocity(
      Math.cos(adjustedAngle) * this.chaseSpeed,
      Math.sin(adjustedAngle) * this.chaseSpeed
    );
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
    if (this.shieldActive) {
      this.shieldActive = false;
      this.shieldGfx.clear();
      this.hitInvulnTimer = ENEMY_HIT_INVULN_MS;
      return false;
    }
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
