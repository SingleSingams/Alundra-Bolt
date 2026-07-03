import * as Phaser from 'phaser';
import { Player } from './Player';
import { Item } from './Item';
import { NPC } from './NPC';
import { ResourceNode } from './ResourceNode';
import { JuiceHelper } from './JuiceHelper';
import { SoundSystem } from './SoundSystem';
import {
  GAME_EVENTS,
  InventoryItem,
  MaterialId,
  ZoneId,
  DialogPayload,
  HEART_HEAL_AMOUNT,
  POTION_HEAL_AMOUNT,
  MAX_HP,
  CHEST_INTERACT_RADIUS,
  RESOURCE_INTERACT_RADIUS,
  SHOP_ITEMS,
  MATERIALS,
} from './constants';

const NPC_INTERACT_RADIUS = 42;

export interface InteractionCallbacks {
  addToInventory(item: InventoryItem): void;
  addMaterial(id: MaterialId, amount: number): void;
  saveCurrentState(): void;
  emitQuestState(): void;
  onShieldQuestFound(): void;
  onNpcTalked(npcId: string): void;
  openCrafting(npc: NPC): void;
  /** Story-stage-dependent dialog override; null = use the NPC's base lines. */
  getNpcLines(npcId: string): string[] | null;
  getInventory(): InventoryItem[];
  getProjectileDamage(): number;
  setProjectileDamage(v: number): void;
  isEnhancedPotions(): boolean;
  emitInventoryChange(): void;
  getCurrentZone(): ZoneId;
  getXp(): number;
}

export class InteractionManager {
  activeChest: Item | null = null;
  activeNpc: NPC | null = null;
  activeNode: ResourceNode | null = null;

  constructor(
    private game: Phaser.Game,
    private player: Player,
    private items: Item[],
    private npcs: NPC[],
    private resourceNodes: ResourceNode[],
    private juice: JuiceHelper,
    private cb: InteractionCallbacks,
  ) {}

  update(): void {
    // filter stale refs
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (!this.items[i].active) this.items.splice(i, 1);
    }
    for (let i = this.npcs.length - 1; i >= 0; i--) {
      if (!this.npcs[i].active) this.npcs.splice(i, 1);
    }

    this.collectPickups();
    this.updateProximity();
  }

  private collectPickups(): void {
    for (const item of this.items) {
      if ((item.itemType !== 'heart_pickup' && item.itemType !== 'potion_pickup') || item.isOpened()) continue;
      const dist = Phaser.Math.Distance.Between(item.x, item.y, this.player.x, this.player.y);
      if (dist >= 22) continue;
      const ix = item.x;
      const iy = item.y;
      const isPotion = item.itemType === 'potion_pickup';
      item.collect(() => {
        if (isPotion) {
          SoundSystem.playPickup();
          this.cb.addToInventory('potion');
          this.juice.spawnParticleBurst(ix, iy, 0x4ade80, 6, 36, 350);
        } else {
          this.player.heal(HEART_HEAL_AMOUNT);
          SoundSystem.playHeal();
          this.cb.addToInventory('heart');
          this.juice.spawnParticleBurst(ix, iy, 0x4ade80, 8, 42, 400);
          this.juice.showDamageNumber(ix, iy - 8, HEART_HEAL_AMOUNT, true);
        }
      });
    }
  }

  private updateProximity(): void {
    let nearestNpc: NPC | null = null;
    let nearestNpcDist = NPC_INTERACT_RADIUS;
    for (const npc of this.npcs) {
      const d = Phaser.Math.Distance.Between(npc.x, npc.y, this.player.x, this.player.y);
      if (d < nearestNpcDist) { nearestNpcDist = d; nearestNpc = npc; }
    }

    let nearestChest: Item | null = null;
    if (!nearestNpc) {
      let nearestChestDist = CHEST_INTERACT_RADIUS;
      for (const item of this.items) {
        if (item.itemType !== 'chest' || item.isOpened()) continue;
        const d = Phaser.Math.Distance.Between(item.x, item.y, this.player.x, this.player.y);
        if (d < nearestChestDist) { nearestChestDist = d; nearestChest = item; }
      }
    }

    let nearestNode: ResourceNode | null = null;
    if (!nearestNpc && !nearestChest) {
      let nearestNodeDist = RESOURCE_INTERACT_RADIUS;
      for (const node of this.resourceNodes) {
        if (!node.active || !node.isAvailable()) continue;
        const d = Phaser.Math.Distance.Between(node.x, node.y, this.player.x, this.player.y);
        if (d < nearestNodeDist) { nearestNodeDist = d; nearestNode = node; }
      }
    }

    if (nearestNpc !== this.activeNpc) {
      this.activeNpc?.showInteractPrompt(false);
      this.activeNpc = nearestNpc;
    }
    if (nearestChest !== this.activeChest) {
      this.activeChest?.showInteractPrompt(false);
      this.activeChest = nearestChest;
    }
    if (nearestNode !== this.activeNode) {
      this.activeNode?.showInteractPrompt(false);
      this.activeNode = nearestNode;
    }

    if (this.activeNpc) {
      this.activeNpc.showInteractPrompt(true);
      this.player.setNearInteractable(true);
      if (this.player.wantsInteract()) this.openDialog(this.activeNpc);
    } else if (this.activeChest) {
      this.activeChest.showInteractPrompt(true);
      this.player.setNearInteractable(true);
      if (this.player.wantsInteract()) {
        const chestX = this.activeChest.x;
        const chestY = this.activeChest.y;
        const reward = this.activeChest.openChest(this.cb.getCurrentZone());
        if (reward) {
          SoundSystem.playChestOpen();
          this.applyChestReward(reward);
          this.juice.spawnParticleBurst(chestX, chestY, 0x4ade80, 10, 55, 480);
        }
        this.activeChest = null;
      }
    } else if (this.activeNode) {
      this.activeNode.showInteractPrompt(true);
      this.player.setNearInteractable(true);
      if (this.player.wantsInteract()) {
        const node = this.activeNode;
        if (node.gather()) {
          SoundSystem.playPickup();
          this.cb.addMaterial(node.kind, 1);
          const meta = MATERIALS[node.kind];
          this.juice.showFloatingText(node.x, node.y - 14, `+1 ${meta.label}`, '#a7f3d0');
          this.juice.spawnParticleBurst(node.x, node.y, 0x4ade80, 7, 40, 350);
        }
        this.activeNode = null;
      }
    } else {
      this.player.setNearInteractable(false);
    }
  }

  openDialog(npc: NPC): void {
    this.player.setDialogActive(true);
    this.cb.onNpcTalked(npc.npcId);
    const override = this.cb.getNpcLines(npc.npcId);
    // Crafters and shopkeepers open their screens — unless they have
    // something to say right now (quest offer/thanks, story override).
    if (npc.station && !override) {
      this.cb.openCrafting(npc);
      return;
    }
    if (npc.isShop && !override) {
      this.game.events.emit(GAME_EVENTS.SHOP_OPEN, { npcName: npc.npcName, items: SHOP_ITEMS, xp: this.cb.getXp() });
      return;
    }
    const payload: DialogPayload = {
      npcName: npc.npcName,
      lines: override ?? npc.lines,
      portrait: npc.portrait,
      portraitColumns: npc.portraitColumns,
    };
    this.game.events.emit(GAME_EVENTS.DIALOG_OPEN, payload);
  }

  closeDialog(): void {
    this.player.setDialogActive(false);
  }

  applyChestReward(reward: InventoryItem): void {
    if (reward === 'heart') this.player.heal(HEART_HEAL_AMOUNT);
    if (reward === 'shield_fragment') {
      this.player.addShield();
      this.cb.onShieldQuestFound();
    }
    if (reward === 'projectile_upgrade') {
      this.cb.setProjectileDamage(this.cb.getProjectileDamage() + 1);
    }
    this.cb.addToInventory(reward);
  }

  handleUsePotion(): void {
    const inv = this.cb.getInventory();
    const idx = inv.indexOf('potion');
    if (idx === -1 || this.player.getHp() >= MAX_HP) return;
    inv.splice(idx, 1);
    const healAmount = POTION_HEAL_AMOUNT + (this.cb.isEnhancedPotions() ? 2 : 0);
    this.player.heal(healAmount);
    SoundSystem.playHeal();
    this.cb.emitInventoryChange();
    this.juice.spawnParticleBurst(this.player.x, this.player.y, 0x4ade80, 10, 50, 450);
    this.juice.showDamageNumber(this.player.x, this.player.y - 20, healAmount, true);
    this.cb.saveCurrentState();
  }

  reset(): void {
    this.activeChest = null;
    this.activeNpc = null;
    this.activeNode = null;
  }
}
