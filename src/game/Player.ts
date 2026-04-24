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
} from './constants';

export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'idle';

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
}

export class Player extends Phaser.GameObjects.Container {
  private shadow: Phaser.GameObjects.Image;
  private sprite: Phaser.GameObjects.Image;
  private directionIndicator: Phaser.GameObjects.Graphics;
  private dustParticles: Phaser.GameObjects.Graphics;

  private keys!: InputKeys;
  private isJumping = false;
  private jumpTween: Phaser.Tweens.Tween | null = null;
  private jumpOffset = 0;
  private facing: Direction = 'idle';
  private hp: number = MAX_HP;
  private invincibleTimer = 0;
  private stepBob = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.shadow = scene.add.image(0, 10, 'shadow').setAlpha(0.5);
    this.sprite = scene.add.image(0, 0, 'player');
    this.directionIndicator = scene.add.graphics();
    this.dustParticles = scene.add.graphics();

    this.add([this.shadow, this.dustParticles, this.sprite, this.directionIndicator]);

    this.setupInput(scene);
    this.drawDirectionIndicator('s');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 16);
    body.setOffset(-10, 4);
    body.setCollideWorldBounds(true);
    body.setBoundsRectangle(new Phaser.Geom.Rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT));
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
    };
  }

  private drawDirectionIndicator(dir: Direction): void {
    this.directionIndicator.clear();
    if (dir === 'idle') return;

    const angles: Record<Direction, number> = {
      n: -90, ne: -45, e: 0, se: 45,
      s: 90, sw: 135, w: 180, nw: -135, idle: 0,
    };

    const angle = Phaser.Math.DegToRad(angles[dir]);
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
    this.handleMovement();
    this.handleJump();
    this.updateSpritePosition();
    this.updateInvincibility(delta);
    this.updateBob(delta);
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

      this.drawDirectionIndicator(this.facing);
    } else {
      this.facing = 'idle';
    }

    body.setVelocity(vx, vy);
  }

  private handleJump(): void {
    const { jumpZ, spaceJump } = this.keys;
    if ((Phaser.Input.Keyboard.JustDown(jumpZ) || Phaser.Input.Keyboard.JustDown(spaceJump)) && !this.isJumping) {
      this.startJump();
    }
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
    this.dustParticles.fillStyle(0xcccccc, 0.6);
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4;
      const dist = 8;
      this.dustParticles.fillCircle(
        Math.cos(angle) * dist, 10 + Math.sin(angle) * 3, 3
      );
    }
    this.scene.time.delayedCall(180, () => this.dustParticles.clear());
  }

  private updateSpritePosition(): void {
    this.sprite.y = this.jumpOffset;

    const jumpProgress = Math.abs(this.jumpOffset) / JUMP_HEIGHT;
    this.shadow.setScale(1 - jumpProgress * 0.4, 1 - jumpProgress * 0.35);
    this.shadow.setAlpha(0.5 - jumpProgress * 0.25);

    this.directionIndicator.y = this.jumpOffset;
  }

  private updateBob(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const moving = body.velocity.x !== 0 || body.velocity.y !== 0;

    if (moving && !this.isJumping) {
      this.stepBob += delta * 0.009;
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

  takeDamage(amount: number): void {
    if (this.invincibleTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invincibleTimer = 1500;
    this.scene.game.events.emit(GAME_EVENTS.HP_CHANGE, this.hp);
  }

  heal(amount: number): void {
    this.hp = Math.min(MAX_HP, this.hp + amount);
    this.scene.game.events.emit(GAME_EVENTS.HP_CHANGE, this.hp);
  }

  getHp(): number {
    return this.hp;
  }

  isInAir(): boolean {
    return this.isJumping;
  }

  getFacing(): Direction {
    return this.facing;
  }
}
