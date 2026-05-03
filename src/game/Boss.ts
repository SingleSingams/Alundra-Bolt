import * as Phaser from 'phaser';
import { GAME_EVENTS } from './constants';

export const BOSS_MAX_HP = 20;
const BOSS_SPEED_P1 = 58;
const BOSS_SPEED_P2 = 108;
const BOSS_HIT_INVULN_MS = 300;
const BOSS_FLASH_MS = 80;
const BAR_W = 46;
const BAR_H = 5;

export class Boss extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private hpBar: Phaser.GameObjects.Graphics;
  private nameLabel: Phaser.GameObjects.Text;

  private hp = BOSS_MAX_HP;
  private phase = 1;
  private invulnTimer = 0;
  private dying = false;
  private speed = BOSS_SPEED_P1;
  private phaseTriggered = false;
  private shootCooldown = 0;
  private readonly SHOOT_INTERVAL = 2200;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.ensureTextures(scene);

    this.shadow = scene.add.image(0, 16, 'shadow').setAlpha(0.5).setScale(1.5, 1.1);
    this.sprite = scene.add.image(0, 0, 'boss');
    this.hpBar = scene.add.graphics();
    this.nameLabel = scene.add.text(0, -43, 'VOID TYRANT', {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '7px',
      color: '#f87171',
      stroke: '#000000',
      strokeThickness: 2,
      resolution: 2,
    }).setOrigin(0.5, 0);

    this.add([this.shadow, this.sprite, this.hpBar, this.nameLabel]);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(32, 26);
    body.setOffset(-16, 2);
    body.setCollideWorldBounds(true);

    this.drawHpBar();
  }

  private ensureTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists('boss')) {
      const g = scene.add.graphics();
      const s = 40;
      g.fillStyle(0x7f1d1d, 1);
      g.fillRect(2, 9, s - 4, s - 11);
      g.fillStyle(0xb91c1c, 1);
      g.fillRect(3, 10, s - 6, 5);
      // Crown horns
      g.fillStyle(0xfbbf24, 1);
      g.fillTriangle(5, 9, 9, 0, 13, 9);
      g.fillTriangle(18, 9, 20, 2, 22, 9);
      g.fillTriangle(s - 13, 9, s - 9, 0, s - 5, 9);
      // Glowing eyes
      g.fillStyle(0xff4444, 1);
      g.fillCircle(11, 19, 5);
      g.fillCircle(s - 11, 19, 5);
      g.fillStyle(0xdc2626, 1);
      g.fillCircle(11, 19, 3);
      g.fillCircle(s - 11, 19, 3);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(9, 17, 1.5);
      g.fillCircle(s - 13, 17, 1.5);
      // Grimace
      g.fillStyle(0x450a0a, 1);
      g.fillRect(11, 27, 18, 4);
      g.fillStyle(0xffffff, 1);
      g.fillRect(12, 28, 3, 3);
      g.fillRect(18, 28, 3, 3);
      g.fillRect(24, 28, 3, 3);
      g.generateTexture('boss', s, s);
      g.destroy();
    }

    if (!scene.textures.exists('boss-p2')) {
      const g = scene.add.graphics();
      const s = 40;
      g.fillStyle(0x581c87, 1);
      g.fillRect(2, 9, s - 4, s - 11);
      g.fillStyle(0x7e22ce, 1);
      g.fillRect(3, 10, s - 6, 5);
      g.fillStyle(0xfbbf24, 1);
      g.fillTriangle(5, 9, 9, 0, 13, 9);
      g.fillTriangle(18, 9, 20, 2, 22, 9);
      g.fillTriangle(s - 13, 9, s - 9, 0, s - 5, 9);
      g.fillStyle(0xff00ff, 1);
      g.fillCircle(11, 19, 5);
      g.fillCircle(s - 11, 19, 5);
      g.fillStyle(0xd946ef, 1);
      g.fillCircle(11, 19, 3);
      g.fillCircle(s - 11, 19, 3);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(9, 17, 1.5);
      g.fillCircle(s - 13, 17, 1.5);
      g.fillStyle(0x3b0764, 1);
      g.fillRect(11, 27, 18, 4);
      g.fillStyle(0xffffff, 1);
      g.fillRect(12, 28, 3, 3);
      g.fillRect(18, 28, 3, 3);
      g.fillRect(24, 28, 3, 3);
      g.generateTexture('boss-p2', s, s);
      g.destroy();
    }
  }

  private drawHpBar(): void {
    this.hpBar.clear();
    const bx = -BAR_W / 2;
    const by = -34;
    const fillW = Math.max(0, (this.hp / BOSS_MAX_HP) * BAR_W);

    this.hpBar.fillStyle(0x111827, 0.9);
    this.hpBar.fillRect(bx - 1, by - 1, BAR_W + 2, BAR_H + 2);

    const color = this.phase === 1 ? 0xdc2626 : 0x9333ea;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(bx, by, fillW, BAR_H);
  }

  update(playerX: number, playerY: number, delta: number): void {
    if (this.dying) return;
    if (this.invulnTimer > 0) {
      this.invulnTimer = Math.max(0, this.invulnTimer - delta);
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      body.setVelocity((dx / len) * this.speed, (dy / len) * this.speed);
    }

    if (this.phase === 2) {
      this.shootCooldown = Math.max(0, this.shootCooldown - delta);
    }

    this.setDepth(this.y + 1);
  }

  wantsShoot(): boolean {
    return this.phase === 2 && !this.dying && this.shootCooldown <= 0;
  }

  markShot(): void {
    this.shootCooldown = this.SHOOT_INTERVAL;
  }

  getShootAngles(playerX: number, playerY: number): number[] {
    const base = Math.atan2(playerY - this.y, playerX - this.x) * (180 / Math.PI);
    return [base - 25, base, base + 25];
  }

  emitHp(): void {
    this.scene.game.events.emit(GAME_EVENTS.BOSS_HP, { hp: this.hp, maxHp: BOSS_MAX_HP, phase: this.phase });
  }

  takeDamage(amount: number, onDeath: (x: number, y: number) => void): boolean {
    if (!this.canBeHit()) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnTimer = BOSS_HIT_INVULN_MS;
    this.drawHpBar();
    this.emitHp();

    // Hit flash
    this.sprite.setTint(0xffffff);
    (this.sprite as Phaser.GameObjects.Image & { setTintMode?: (m: number) => void })
      .setTintMode?.(1);
    this.scene.time.delayedCall(BOSS_FLASH_MS, () => {
      if (!this.active || this.dying) return;
      this.sprite.clearTint();
    });

    if (!this.phaseTriggered && this.hp <= BOSS_MAX_HP / 2) {
      this.phaseTriggered = true;
      this.enterPhase2();
    }

    if (this.hp <= 0) {
      this.die(onDeath);
      return true;
    }
    return false;
  }

  private enterPhase2(): void {
    this.phase = 2;
    this.speed = BOSS_SPEED_P2;
    this.sprite.setTexture('boss-p2');
    this.nameLabel.setColor('#e879f9');
    this.drawHpBar();
    this.scene.game.events.emit('boss-phase-2', { x: this.x, y: this.y });
  }

  canBeHit(): boolean {
    return !this.dying && this.invulnTimer <= 0;
  }

  isDying(): boolean {
    return this.dying;
  }

  private die(onDeath: (x: number, y: number) => void): void {
    this.dying = true;
    this.scene.game.events.emit(GAME_EVENTS.BOSS_HP, { hp: 0, maxHp: BOSS_MAX_HP, phase: this.phase });
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    const dx = this.x;
    const dy = this.y;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.15,
      scaleY: 0.15,
      duration: 550,
      ease: 'Sine.easeIn',
      onComplete: () => {
        onDeath(dx, dy);
        this.destroy();
      },
    });
  }
}
