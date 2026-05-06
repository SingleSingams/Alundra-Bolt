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
} from './constants';
import { VirtualInput } from './VirtualInput';

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
  dashShift: Phaser.Input.Keyboard.Key;
}

const DIRECTION_ANGLES: Record<FacingDirection, number> = {
  n: -90, ne: -45, e: 0, se: 45,
  s: 90, sw: 135, w: 180, nw: -135,
};

const KNIGHT_SCALE = 0.19; // 256px frame → ~48px visual

export class Player extends Phaser.GameObjects.Container {
  private shadow: Phaser.GameObjects.Image;
  private sprite: Phaser.GameObjects.Sprite;
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
  private isAttacking = false;
  private attackCooldown = 0;
  private attackTimer = 0;
  private shootCooldown = 0;
  private nearChest = false;
  private dialogActive = false;
  private frozen = false;
  private shieldCharges = 0;

  private speedMult = 1.0;

  private dashCooldown = 0;
  private dashTimer = 0;
  private dashPressedThisFrame = false;

  // Cached per-frame key states — JustDown consumes the flag on first call,
  // so we read it exactly once per key per frame and share the result.
  private jumpPressedThisFrame = false;
  private attackPressedThisFrame = false;
  private shootPressedThisFrame = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.shadow = scene.add.image(0, 14, 'shadow').setAlpha(0.55).setScale(1.6, 0.5);
    this.sprite = scene.add.sprite(0, 0, 'knight', 0).setScale(KNIGHT_SCALE);
    this.sprite.play('knight-idle');
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
      dashShift: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
    };
  }

  private drawDirectionIndicator(_dir: Direction): void {
    // Direction triangle hidden — the knight sprite's facing/flip shows direction.
  }

  update(delta: number): void {
    // Read JustDown once per frame (keyboard + virtual input).
    this.jumpPressedThisFrame =
      Phaser.Input.Keyboard.JustDown(this.keys.jumpZ) ||
      Phaser.Input.Keyboard.JustDown(this.keys.spaceJump) ||
      VirtualInput.isJumpJustDown();
    this.attackPressedThisFrame =
      Phaser.Input.Keyboard.JustDown(this.keys.attackX) ||
      VirtualInput.isAttackJustDown();
    this.shootPressedThisFrame =
      Phaser.Input.Keyboard.JustDown(this.keys.shootY) ||
      VirtualInput.isShootJustDown();
    this.dashPressedThisFrame =
      Phaser.Input.Keyboard.JustDown(this.keys.dashShift);

    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - delta);
      if (this.dashTimer === 0) {
        this.invincibleTimer = 0;
        this.speedMult = Math.max(1, this.speedMult / 1.8);
      }
    }

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
    this.updateAnimation();
    VirtualInput.endFrame();
  }

  private updateAnimation(): void {
    // Flip horizontally based on horizontal facing
    const goingLeft = this.lastDirection === 'w' || this.lastDirection === 'nw' || this.lastDirection === 'sw';
    const goingRight = this.lastDirection === 'e' || this.lastDirection === 'ne' || this.lastDirection === 'se';
    if (goingLeft) this.sprite.setFlipX(true);
    else if (goingRight) this.sprite.setFlipX(false);

    if (this.isAttacking) return; // attack anim plays itself out

    const moving = this.facing !== 'idle';
    const currentAnim = this.sprite.anims?.currentAnim?.key;

    if (moving && currentAnim !== 'knight-walk') {
      this.sprite.play('knight-walk');
    } else if (!moving && currentAnim !== 'knight-idle') {
      this.sprite.play('knight-idle');
    }
  }

  private handleMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const { up, down, left, right, upW, downS, leftA, rightD } = this.keys;

    const goUp    = up.isDown    || upW.isDown    || VirtualInput.up;
    const goDown  = down.isDown  || downS.isDown  || VirtualInput.down;
    const goLeft  = left.isDown  || leftA.isDown  || VirtualInput.left;
    const goRight = right.isDown || rightD.isDown || VirtualInput.right;

    let vx = 0;
    let vy = 0;

    if (goLeft) vx -= 1;
    if (goRight) vx += 1;
    if (goUp) vy -= 1;
    if (goDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      const spd = PLAYER_SPEED * this.speedMult;
      vx = (vx / len) * spd;
      vy = (vy / len) * spd;

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
    this.sprite.play('knight-attack');
    this.sprite.once('animationcomplete', () => {
      if (!this.isAttacking) return;
      this.sprite.play('knight-idle');
    });
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: KNIGHT_SCALE * 1.4,
      scaleY: KNIGHT_SCALE * 0.88,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => { this.sprite.setScale(KNIGHT_SCALE); },
    });

    this.scene.game.events.emit(GAME_EVENTS.PLAYER_ATTACK, this.lastDirection);
  }

  private spawnGhostTrail(): void {
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 18, () => {
        if (!this.active) return;
        const ghost = this.scene.add.sprite(this.x, this.y + this.jumpOffset, 'knight', this.sprite.frame.name as unknown as number);
        ghost.setScale(KNIGHT_SCALE);
        ghost.setFlipX(this.sprite.flipX);
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
    this.sprite.setScale(KNIGHT_SCALE);
    this.sprite.play('knight-idle');
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
          scaleX: KNIGHT_SCALE * JUMP_SCALE_PEAK,
          scaleY: KNIGHT_SCALE * JUMP_SCALE_PEAK,
          duration: JUMP_DURATION * 0.2,
          yoyo: true,
          ease: 'Sine.easeOut',
          onComplete: () => { this.sprite.setScale(KNIGHT_SCALE); },
        });
      },
      onComplete: () => {
        this.isJumping = false;
        this.jumpOffset = 0;
        this.sprite.setScale(KNIGHT_SCALE);
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

  private updateBob(_delta: number): void {
    // Step bob removed — walk animation provides the movement feel.
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
      this.scene.game.events.emit(GAME_EVENTS.SHIELD_CHANGE, this.shieldCharges);
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
    this.scene.game.events.emit(GAME_EVENTS.SHIELD_CHANGE, this.shieldCharges);
  }

  getShieldCharges(): number {
    return this.shieldCharges;
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

  setZone(_zone: ZoneId): void {
    // Bob multiplier removed — walk animation handles movement feel per zone.
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
        this.sprite.setScale(KNIGHT_SCALE);
        this.sprite.play('knight-idle');
      }
    }
  }

  applySpeedBoost(mult: number): void {
    this.speedMult *= mult;
  }

  wantsDash(): boolean {
    return !this.dialogActive && !this.frozen && this.dashPressedThisFrame && this.dashCooldown <= 0 && this.dashTimer <= 0;
  }

  startDash(): void {
    this.dashCooldown = 8000;
    this.dashTimer = 300;
    this.invincibleTimer = Math.max(this.invincibleTimer, 300);
    this.speedMult *= 1.8;
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
