import * as Phaser from 'phaser';

const NPC_SCALE = 0.19;

export interface NPCDefinition {
  id: string;
  name: string;
  lines: string[];
  x: number;
  y: number;
  portrait?: string;
  portraitColumns?: number;
  spriteKey?: string; // e.g. 'npc-woman-adventurer' — overrides default elder sprite
  tint?: number;
  isShop?: boolean;
}

export class NPC extends Phaser.GameObjects.Container {
  public readonly npcId: string;
  public readonly npcName: string;
  public readonly lines: string[];
  public readonly portrait?: string;
  public readonly portraitColumns?: number;
  public readonly isShop: boolean;

  private sprite: Phaser.GameObjects.Sprite;
  private shadow: Phaser.GameObjects.Image;
  private nameTag: Phaser.GameObjects.Text;
  private promptGfx: Phaser.GameObjects.Graphics;
  private promptVisible = false;

  constructor(scene: Phaser.Scene, def: NPCDefinition) {
    super(scene, def.x, def.y);

    this.npcId = def.id;
    this.npcName = def.name;
    this.lines = def.lines;
    this.portrait = def.portrait;
    this.portraitColumns = def.portraitColumns;
    this.isShop = def.isShop ?? false;

    this.shadow = scene.add.image(0, 14, 'shadow').setAlpha(0.45).setScale(1.4, 0.45);

    const customKey = def.spriteKey && scene.textures.exists(def.spriteKey) ? def.spriteKey : null;
    const elderKey = scene.textures.exists('npc-elder') ? 'npc-elder' : null;
    const spriteKey = customKey ?? elderKey;

    if (spriteKey) {
      this.sprite = scene.add.sprite(0, 0, spriteKey, 0).setScale(NPC_SCALE);
      const animKey = `${spriteKey}-idle`;
      if (scene.anims.exists(animKey)) {
        this.sprite.play(animKey);
      } else {
        this.sprite.play('elder-idle');
      }
    } else {
      NPC.ensureTextures(scene);
      this.sprite = scene.add.sprite(0, 0, 'npc').setScale(1);
    }

    if (def.tint !== undefined) {
      this.sprite.setTint(def.tint);
    }

    this.promptGfx = scene.add.graphics();

    this.nameTag = scene.add.text(0, -34, def.name, {
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      fontSize: '10px',
      color: '#fef3c7',
      backgroundColor: 'rgba(28, 25, 23, 0.85)',
      padding: { left: 4, right: 4, top: 1, bottom: 1 },
      resolution: 2,
    });
    this.nameTag.setOrigin(0.5, 0.5);

    this.add([this.shadow, this.sprite, this.nameTag, this.promptGfx]);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 16);
    body.setOffset(-10, 2);
    body.setImmovable(true);
    body.setAllowGravity(false);
  }

  static ensureTextures(scene: Phaser.Scene): void {
    if (scene.textures.exists('npc')) return;
    const gfx = scene.add.graphics();
    const s = 24;
    gfx.fillStyle(0x1e3a8a, 1);
    gfx.fillRect(3, 6, s - 6, s - 8);
    gfx.fillStyle(0x3b82f6, 1);
    gfx.fillRect(4, 7, s - 8, 4);
    gfx.fillStyle(0xfcd5b5, 1);
    gfx.fillRect(6, 2, s - 12, 6);
    gfx.fillStyle(0x0c1e4a, 1);
    gfx.fillRect(5, 1, s - 10, 3);
    gfx.fillStyle(0x111111, 1);
    gfx.fillRect(8, 5, 2, 1);
    gfx.fillRect(s - 10, 5, 2, 1);
    gfx.fillStyle(0x7c2d12, 1);
    gfx.fillRect(4, 14, s - 8, 2);
    gfx.fillStyle(0xfbbf24, 1);
    gfx.fillRect(11, 14, 3, 2);
    gfx.generateTexture('npc', s, s);
    gfx.destroy();
  }

  update(_delta: number): void {
    this.setDepth(this.y + 1);
  }

  showInteractPrompt(show: boolean): void {
    if (show === this.promptVisible) return;
    this.promptVisible = show;
    this.promptGfx.clear();
    if (!show) return;

    this.promptGfx.fillStyle(0x1f2937, 0.9);
    this.promptGfx.fillRoundedRect(-13, -52, 26, 14, 3);
    this.promptGfx.lineStyle(1, 0xfef08a, 1);
    this.promptGfx.strokeRoundedRect(-13, -52, 26, 14, 3);

    this.promptGfx.fillStyle(0xfef08a, 1);
    this.promptGfx.fillCircle(-5, -45, 1.2);
    this.promptGfx.fillCircle(0, -45, 1.2);
    this.promptGfx.fillCircle(5, -45, 1.2);
    this.promptGfx.fillTriangle(-2, -38, 2, -38, 0, -34);
  }
}
