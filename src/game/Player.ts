import * as Phaser from 'phaser';
import {
  PLAYER_SPEED,
  JUMP_DURATION,
  JUMP_HEIGHT,
  JUMP_SCALE_PEAK,
  MAX_HP,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  GAME_EVENTS,
  ATTACK_DURATION,
  ATTACK_COOLDOWN,
  ATTACK_ZONE_WIDTH,
  ATTACK_ZONE_HEIGHT,
  ATTACK_OFFSET,
  ZoneId,
  ZONE_BOB_FREQ,
} from './constants';

export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'idle';
export type FacingDirection = Exclude<Direction, 'idle'>;

interface InputKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jumpZ: Phaser.Input.Keyboard.Key;
  upW: Phaser.Input.Keyboard.Key;
  downS: Phaser.Input.Keyboard.Key;
  leftA: Phaser.Input.Keyboard.Key;
  rightD: Phaser.Input.Keyboard.Key;
  spaceJump: Phaser.Input.Keyboard.Key;
  attackX: Phaser.Input.Keyboard.Key;
  shootY: Phaser.Input.Keyboard.Key;
}

const DIRECTION_ANGLES: Record<FacingDirection, number> = {
  n: -90, ne: -45, e: 0, se: 45,
  s: 90, sw: 135, w: 180, nw: -135,
};

export class Player extends Phaser.GameObjects.Container {
  private shadow: Phaser.GameObjects.Image;
  private sprite: Phaser.GameObjects.Image;
  private directionIndicator: Phaser.GameObjects.Graphics;
  private dustParticles: Phaser.GameObjects.Graphics;
  private slashGfx: Phaser.GameObjects.Graphics;
  private attackZone!: Phaser.GameObjects.Zone;

  private keys!: InputKeys;
  private isJumping = false;
  private jumpTween: Phaser.Tweens.Tween | null = null;
  private jumpOffset = 0;
  private facing: Direction = 'idle';
  private lastDirection: FacingDirection = 's';
  private hp: number = MAX_HP;
  private invincibleTimer = 0;
  private stepBob = 0;

  private isAttacking = false;
  private attackCooldown = 0;
  private attackTimer = 0;
  private shootCooldown = 0;
  private nearChest = false;
  private dialogActive = false;
  private frozen = false;
  private shieldCharges = 0;

  private zoneBobMult = 1.0;

  // Cached per-frame key states — JustDown consumes the flag on first call,
  // so we read it exactly once per key per frame and share the result.
  private jumpPressedThisFrame = false;
  private attackPressedThisFrame = false;
  private shootPressedThisFrame = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.shadow = scene.add.image(0, 10, 'shadow').setAlpha(0.55);
    this.sprite = scene.add.image(0, 0, 'player');
    this.directionIndicator = scene.add.graphics();
    this.dustParticles = scene.add.graphics();
    this.slashGfx = scene.add.graphics();

    this.add([this.shadow, this.dustParticles, this.sprite, this.directionIndicator, this.slashGfx]);

    this.setupInput(scene);
    this.drawDirectionIndicator('s');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 16);
    body.setOffset(-10, 4);
    body.setCollideWorldBounds(true);
    body.setBoundsRectangle(new Phaser.Geom.Rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT));

    this.attackZone = scene.add.zone(x, y, ATTACK_ZONE_WIDTH, ATTACK_ZONE_HEIGHT);
    scene.physics.add.existing(this.attackZone);
    const zoneBody = this.attackZone.body as Phaser.Physics.Arcade.Body;
    zoneBody.setAllowGravity(false);
    zoneBody.setImmovable(true);
    zoneBody.enable = false;
  }

  private setupInput(scene: Phaser.Scene): void {
    const kb = scene.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      jumpZ: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      upW: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      downS: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      leftA: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      rightD: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      spaceJump: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      attackX: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      shootY: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Y),
    };
  }

  private drawDirectionIndicator(dir: Direction): void {
    this.directionIndicator.clear();
    if (dir === 'idle') return;

    const angle = Phaser.Math.DegToRad(DIRECTION_ANGLES[dir]);
    const dist = 11;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;

    this.directionIndicator.fillStyle(0xfde68a, 1);
    this.directionIndicator.fillTriangle(
      tx + Math.cos(angle) * 4, ty + Math.sin(angle) * 4,
      tx + Math.cos(angle + Math.PI * 0.8) * 5, ty + Math.sin(angle + Math.PI * 0.8) * 5,
      tx + Math.cos(angle - Math.PI * 0.8) * 5, ty + Math.sin(angle - Math.PI * 0.8) * 5
    );
  }

  update(delta: number): void {
    // Read JustDown once per frame before any handler can consume the flag.
    this.jumpPressedThisFrame =
      Phaser.Input.Keyboard.JustDown(this.keys.jumpZ) ||
      Phaser.Input.Keyboard.JustDown(this.keys.spaceJump);
    this.attackPressedThisFrame = Phaser.Input.Keyboard.JustDown(this.keys.attackX);
    this.shootPressedThisFrame = Phaser.Input.Keyboard.JustDown(this.keys.shootY);

    if (this.dialogActive || this.frozen) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.updateSpritePosition();
      this.updateInvincibility(delta);
      return;
    }

    this.handleMovement();
    this.handleJump();
    this.handleAttack(delta);
    if (this.shootCooldown > 0) this.shootCooldown = Math.max(0, this.shootCooldown - delta);
    this.updateSpritePosition();
    this.updateInvincibility(delta);
    this.updateBob(delta);
    this.updateAttackZonePosition();
  }

  private handleMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const { up, down, left, right, upW, downS, leftA, rightD } = this.keys;

    const goUp = up.isDown || upW.isDown;
    const goDown = down.isDown || downS.isDown;
    const goLeft = left.isDown || leftA.isDown;
    const goRight = right.isDown || rightD.isDown;

    let vx = 0;
    let vy = 0;

    if (goLeft) vx -= 1;
    if (goRight) vx += 1;
    if (goUp) vy -= 1;
    if (goDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx = (vx / len) * PLAYER_SPEED;
      vy = (vy / len) * PLAYER_SPEED;

      if (goUp && goRight) this.facing = 'ne';
      else if (goDown && goRight) this.facing = 'se';
      else if (goDown && goLeft) this.facing = 'sw';
      else if (goUp && goLeft) this.facing = 'nw';
      else if (goUp) this.facing = 'n';
      else if (goDown) this.facing = 's';
      else if (goLeft) this.facing = 'w';
      else if (goRight) this.facing = 'e';

      this.lastDirection = this.facing as FacingDirection;
      this.drawDirectionIndicator(this.facing);
    } else {
      this.facing = 'idle';
    }

    body.setVelocity(vx, vy);
  }

  private handleJump(): void {
    if (this.jumpPressedThisFrame && !this.isJumping && !this.nearChest) {
      this.startJump();
    }
  }

  private handleAttack(delta: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    }
    if (this.isAttacking) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.endAttack();
      }
    }

    if (this.attackPressedThisFrame && !this.isAttacking && this.attackCooldown <= 0) {
      this.startAttack();
    }
  }

  private startAttack(): void {
    this.isAttacking = true;
    this.attackTimer = ATTACK_DURATION;
    this.attackCooldown = ATTACK_COOLDOWN;

    const body = this.attackZone.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    this.updateAttackZonePosition();
    this.drawSlashEffect();
    this.spawnGhostTrail();

    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.5,
      scaleY: 0.85,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.sprite.setScale(1);
      },
    });

    this.scene.game.events.emit(GAME_EVENTS.PLAYER_ATTACK, this.lastDirection);
  }

  private spawnGhostTrail(): void {
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 18, () => {
        if (!this.active) return;
        const ghost = this.scene.add.image(this.x, this.y + this.jumpOffset, 'player');
        ghost.setAlpha(0.45 - i * 0.12);
        ghost.setTint(0x93c5fd);
        ghost.setDepth(this.depth - 0.1);
        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          duration: 70,
          onComplete: () => ghost.destroy(),
        });
      });
    }
  }

  private endAttack(): void {
    this.isAttacking = false;
    const body = this.attackZone.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.slashGfx.clear();
    this.sprite.setScale(1);
  }

  private updateAttackZonePosition(): void {
    if (!this.isAttacking) return;
    const angle = Phaser.Math.DegToRad(DIRECTION_ANGLES[this.lastDirection]);
    const ox = Math.cos(angle) * ATTACK_OFFSET;
    const oy = Math.sin(angle) * ATTACK_OFFSET;
    this.attackZone.setPosition(this.x + ox, this.y + oy);
  }

  private drawSlashEffect(): void {
    this.slashGfx.clear();
    const angle = Phaser.Math.DegToRad(DIRECTION_ANGLES[this.lastDirection]);
    const cx = Math.cos(angle) * ATTACK_OFFSET;
    const cy = Math.sin(angle) * ATTACK_OFFSET;

    // Bright arc
    this.slashGfx.lineStyle(4, 0xffffff, 1);
    this.slashGfx.beginPath();
    this.slashGfx.arc(cx, cy, 14, angle - Math.PI * 0.45, angle + Math.PI * 0.45, false);
    this.slashGfx.strokePath();

    // Soft glow fill
    this.slashGfx.fillStyle(0xfef9c3, 0.4);
    this.slashGfx.fillCircle(cx, cy, 11);

    this.scene.tweens.add({
      targets: this.slashGfx,
      alpha: 0,
      duration: ATTACK_DURATION,
      onComplete: () => {
        this.slashGfx.clear();
        this.slashGfx.setAlpha(1);
      },
    });
  }

  private startJump(): void {
    this.isJumping = true;
    this.scene.game.events.emit(GAME_EVENTS.PLAYER_JUMP);

    this.jumpTween?.stop();
    this.jumpTween = this.scene.tweens.add({
      targets: this,
      jumpOffset: -JUMP_HEIGHT,
      duration: JUMP_DURATION * 0.45,
      ease: 'Sine.easeOut',
      yoyo: true,
      hold: 30,
      onYoyo: () => {
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: JUMP_SCALE_PEAK,
          scaleY: JUMP_SCALE_PEAK,
          duration: JUMP_DURATION * 0.2,
          yoyo: true,
          ease: 'Sine.easeOut',
        });
      },
      onComplete: () => {
        this.isJumping = false;
        this.jumpOffset = 0;
        this.sprite.setScale(1);
        this.scene.game.events.emit(GAME_EVENTS.PLAYER_LAND);
        this.spawnLandDust();
      },
    });
  }

  private spawnLandDust(): void {
    this.dustParticles.clear();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 + Phaser.Math.FloatBetween(-0.2, 0.2);
      const dist = Phaser.Math.FloatBetween(6, 14);
      this.dustParticles.fillStyle(0xd6d3d1, 0.75);
      this.dustParticles.fillRect(
        Math.cos(angle) * dist - 2,
        10 + Math.sin(angle) * 4 - 2,
        4, 4
      );
    }
    this.scene.time.delayedCall(200, () => this.dustParticles.clear());
  }

  private updateSpritePosition(): void {
    this.sprite.y = this.jumpOffset;

    const jumpProgress = Math.abs(this.jumpOffset) / JUMP_HEIGHT;
    // More pronounced shadow — shrinks more and fades more during jump
    this.shadow.setScale(1 - jumpProgress * 0.6, 1 - jumpProgress * 0.55);
    this.shadow.setAlpha(0.55 - jumpProgress * 0.45);

    this.directionIndicator.y = this.jumpOffset;
  }

  private updateBob(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const moving = body.velocity.x !== 0 || body.velocity.y !== 0;

    if (moving && !this.isJumping && !this.isAttacking) {
      this.stepBob += delta * 0.009 * this.zoneBobMult;
      this.sprite.y = this.jumpOffset + Math.sin(this.stepBob * Math.PI) * 1.5;
      this.directionIndicator.y = this.sprite.y;
    }
  }

  private updateInvincibility(delta: number): void {
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      this.sprite.setAlpha(Math.round(this.invincibleTimer / 80) % 2 === 0 ? 0.4 : 1);
      if (this.invincibleTimer <= 0) {
        this.sprite.setAlpha(1);
      }
    }
  }

  takeDamage(rawAmount: number): void {
    if (this.invincibleTimer > 0) return;
    let amount = rawAmount;
    if (this.shieldCharges > 0) {
      this.shieldCharges--;
      this.scene.game.events.emit(GAME_EVENTS.SHIELD_BLOCK, { x: this.x, y: this.y });
      this.invincibleTimer = 700;
      return;
    }
    this.hp = Math.max(0, this.hp - amount);
    this.invincibleTimer = 1500;
    this.scene.game.events.emit(GAME_EVENTS.HP_CHANGE, this.hp);
    this.scene.game.events.emit(GAME_EVENTS.PLAYER_DAMAGED, { x: this.x, y: this.y });
    this.scene.cameras.main.shake(250, 0.008);
    if (this.hp <= 0) {
      this.frozen = true;
      this.scene.game.events.emit(GAME_EVENTS.GAME_OVER);
    }
  }

  addShield(): void {
    this.shieldCharges++;
  }

  wantsShoot(): boolean {
    return !this.dialogActive && !this.frozen && this.shootPressedThisFrame && this.shootCooldown <= 0;
  }

  markShot(): void {
    this.shootCooldown = 450;
  }

  heal(amount: number): void {
    this.hp = Math.min(MAX_HP, this.hp + amount);
    this.scene.game.events.emit(GAME_EVENTS.HP_CHANGE, this.hp);
  }

  setZone(zone: ZoneId): void {
    this.zoneBobMult = ZONE_BOB_FREQ[zone] ?? 1.0;
  }

  getHp(): number {
    return this.hp;
  }

  setHp(value: number): void {
    this.hp = Math.max(0, Math.min(MAX_HP, value));
    this.scene.game.events.emit(GAME_EVENTS.HP_CHANGE, this.hp);
  }

  isInAir(): boolean {
    return this.isJumping;
  }

  getFacing(): Direction {
    return this.facing;
  }

  getLastDirection(): FacingDirection {
    return this.lastDirection;
  }

  getAttackZone(): Phaser.GameObjects.Zone {
    return this.attackZone;
  }

  setNearInteractable(value: boolean): void {
    this.nearChest = value;
  }

  setDialogActive(value: boolean): void {
    this.dialogActive = value;
    if (value) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      if (this.isAttacking) {
        this.isAttacking = false;
        const zoneBody = this.attackZone.body as Phaser.Physics.Arcade.Body;
        zoneBody.enable = false;
        this.slashGfx.clear();
        this.sprite.setScale(1);
      }
    }
  }

  setFrozen(value: boolean): void {
    this.frozen = value;
    if (value) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
    }
  }

  isDialogActive(): boolean {
    return this.dialogActive;
  }

  wantsInteract(): boolean {
    if (this.dialogActive || this.frozen) return false;
    return this.jumpPressedThisFrame;
  }
}
