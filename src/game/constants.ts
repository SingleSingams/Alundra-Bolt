export const TILE_SIZE = 32;
export const MAP_WIDTH = 60;
export const MAP_HEIGHT = 60;

export const PLAYER_SPEED = 160;
export const JUMP_DURATION = 480;
export const JUMP_HEIGHT = 44;
export const JUMP_SCALE_PEAK = 1.18;

export const MAX_HP = 6;
export const HEART_HEAL_AMOUNT = 2;
export const POTION_HEAL_AMOUNT = 4;

export const CAMERA_LERP = 0.08;

export const TILE_VARIANTS = 5;

export const WORLD_WIDTH = MAP_WIDTH * TILE_SIZE;
export const WORLD_HEIGHT = MAP_HEIGHT * TILE_SIZE;

export const ATTACK_DURATION = 200;
export const ATTACK_COOLDOWN = 600;
export const ATTACK_ZONE_WIDTH = 34;
export const ATTACK_ZONE_HEIGHT = 26;
export const ATTACK_OFFSET = 18;
export const ATTACK_DAMAGE = 2;
export const PROJECTILE_DAMAGE = 1;

export const XP_PER_ENEMY = 5;
export const XP_PER_BOSS = 50;

// Combo XP multiplier tiers (checked highest-first)
export const COMBO_XP_MULT: Array<{ min: number; mult: number }> = [
  { min: 10, mult: 3.0 },
  { min: 6,  mult: 2.0 },
  { min: 3,  mult: 1.5 },
];

// XP granted per enemy type on kill
export const XP_BY_ENEMY_TYPE: Record<string, number> = {
  basic:        5,
  ranger:       7,
  shielder:     8,
  speedrunner:  6,
  dragon:       15,
  'dragon-red': 20,
};
export const MAX_LEVEL = 6;
// Cumulative XP thresholds to reach levels 2–6
export const XP_THRESHOLDS = [10, 30, 60, 100, 150] as const;

export const ENEMY_MAX_HP = 4;
export const ENEMY_HIT_INVULN_MS = 240;
export const ENEMY_FLASH_MS = 55;
export const CHEST_DROP_CHANCE = 0.5;
export const HAZARD_DAMAGE_INTERVAL = 1000;

// Multipliers indexed by (level - 1): HP and contact damage scale with player level
export const ENEMY_HP_SCALE    = [1, 1, 1.25, 1.5, 1.75, 2] as const;
export const ENEMY_DAMAGE_SCALE = [2, 2, 2,    2,   3,    3] as const;

export const MAX_INVENTORY = 3;
export const CHEST_INTERACT_RADIUS = 44;

export const GAME_EVENTS = {
  HP_CHANGE: 'hp-change',
  PLAYER_JUMP: 'player-jump',
  PLAYER_LAND: 'player-land',
  PLAYER_ATTACK: 'player-attack',
  PLAYER_DAMAGED: 'player-damaged',
  INVENTORY_CHANGE: 'inventory-change',
  CHEST_PROXIMITY: 'chest-proximity',
  ZONE_CHANGE: 'zone-change',
  DIALOG_OPEN: 'dialog-open',
  DIALOG_CLOSE: 'dialog-close',
  SAVE_LOADED: 'save-loaded',
  GAME_OVER: 'game-over',
  SHIELD_BLOCK: 'shield-block',
  XP_CHANGE: 'xp-change',
  LEVEL_UP: 'level-up',
  MINIMAP_UPDATE: 'minimap-update',
  LOADING_PROGRESS: 'loading-progress',
  LOADING_COMPLETE: 'loading-complete',
  USE_POTION: 'use-potion',
  SHIELD_CHANGE: 'shield-change',
  BOSS_HP: 'boss-hp',
  LEVEL_UP_CHOICE: 'level-up-choice',
  LEVEL_UP_CHOSEN: 'level-up-chosen',
  VICTORY: 'victory',
  COMBO_CHANGE: 'combo-change',
  QUEST_UPDATE: 'quest-update',
  QUEST_COMPLETE: 'quest-complete',
  SHOP_OPEN: 'shop-open',
  SHOP_BUY: 'shop-buy',
  SHOP_CLOSE: 'shop-close',
} as const;

export type ShopItemId = 'heal_potion' | 'shield_charge' | 'heart' | 'projectile_upgrade';

export interface ShopItem {
  id: ShopItemId;
  label: string;
  desc: string;
  xpCost: number;
  icon: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'heart',             label: 'Herz-Trank',        desc: '+2 HP sofort',             xpCost: 5,  icon: '❤️' },
  { id: 'heal_potion',       label: 'Heiltrank',          desc: '+4 HP sofort',             xpCost: 8,  icon: '🧪' },
  { id: 'shield_charge',     label: 'Schild-Ladung',      desc: '+1 Schild-Ladung',         xpCost: 12, icon: '🛡️' },
  { id: 'projectile_upgrade',label: 'Projektilstärke',   desc: '+1 Projektilschaden',      xpCost: 20, icon: '⚡' },
];

export const NG_PLUS_HP_MULT = 1.5;
export const NG_PLUS_DAMAGE_MULT = 1.25;

export type LevelUpSkill = 'hp_up' | 'attack_up' | 'shield' | 'xp_boost' | 'speed_up' | 'double_shot' | 'vampire' | 'dash';

export interface LevelUpChoice {
  skills: LevelUpSkill[];
  chosen: LevelUpSkill[];
}

export const SKILL_DESCRIPTIONS: Record<LevelUpSkill, string> = {
  hp_up:       '+2 maximale HP',
  attack_up:   '+2 Nahkampfschaden',
  shield:      '+1 Schild-Ladung',
  xp_boost:    '+20 XP sofort',
  speed_up:    '+15% Bewegungsgeschwindigkeit',
  double_shot: 'Schießt immer 2 Projektile (±12°)',
  vampire:     'Trefferheilung +1 HP (max. alle 3s)',
  dash:        'Shift: 300ms Unverwundbarkeit + Dash (8s CD)',
};

export const SKILL_SYNERGIES: Array<{
  requires: LevelUpSkill[];
  label: string;
  desc: string;
}> = [
  { requires: ['attack_up', 'attack_up'], label: 'Durchdringende Schüsse', desc: 'Projektile treffen 2 Feinde' },
  { requires: ['attack_up', 'shield'],    label: 'Parrier-Meister',        desc: 'Blocken gibt +3 XP' },
  { requires: ['xp_boost', 'hp_up'],      label: 'Heilsame Tränke',        desc: 'Tränke heilen +2 extra' },
  { requires: ['double_shot', 'attack_up'], label: 'Sturmschütze',          desc: 'Doppelschuss durchdringt 1 Feind' },
  { requires: ['vampire', 'hp_up'],         label: 'Lebenshunger',          desc: 'Trefferheilung +2 HP statt 1' },
];

export interface MinimapDot {
  nx: number;
  ny: number;
}

export interface MinimapData {
  player: MinimapDot;
  enemies: MinimapDot[];
  boss: MinimapDot | null;
  chests: MinimapDot[];
  zone: ZoneId;
  exploredChunks: string[];
}

export type InventoryItem = 'heart' | 'sword_upgrade' | 'potion' | 'shield_fragment' | 'projectile_upgrade';

export type ZoneId = 'grasslands' | 'forest' | 'dungeon' | 'dungeon_interior' | 'boss_room';

export interface LootEntry { item: InventoryItem; weight: number; }

export const ZONE_LOOT_TABLE: Record<ZoneId, LootEntry[]> = {
  grasslands:       [{ item: 'heart', weight: 50 }, { item: 'potion', weight: 30 }, { item: 'sword_upgrade', weight: 20 }],
  forest:           [{ item: 'heart', weight: 50 }, { item: 'potion', weight: 30 }, { item: 'sword_upgrade', weight: 20 }],
  dungeon:          [{ item: 'heart', weight: 30 }, { item: 'potion', weight: 30 }, { item: 'sword_upgrade', weight: 25 }, { item: 'shield_fragment', weight: 15 }],
  dungeon_interior: [{ item: 'potion', weight: 25 }, { item: 'sword_upgrade', weight: 30 }, { item: 'projectile_upgrade', weight: 30 }, { item: 'shield_fragment', weight: 15 }],
  boss_room:        [{ item: 'sword_upgrade', weight: 35 }, { item: 'projectile_upgrade', weight: 35 }, { item: 'shield_fragment', weight: 30 }],
};

export function rollLoot(table: LootEntry[]): InventoryItem {
  const total = table.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const entry of table) {
    r -= entry.weight;
    if (r <= 0) return entry.item;
  }
  return table[table.length - 1].item;
}

export interface ZoneMeta {
  id: ZoneId;
  name: string;
  tint: number;
}

export const ZONES: Record<ZoneId, ZoneMeta> = {
  grasslands:        { id: 'grasslands',        name: 'Grasland',         tint: 0xffffff },
  forest:            { id: 'forest',            name: 'Wald',             tint: 0x78a878 },
  dungeon:           { id: 'dungeon',           name: 'Verlies-Eingang',  tint: 0x8a8a8a },
  dungeon_interior:  { id: 'dungeon_interior',  name: 'Verlies-Inneres',  tint: 0x606880 },
  boss_room:         { id: 'boss_room',         name: 'Bosskammer',       tint: 0x5a2850 },
};

export const ZONE_ORDER: ZoneId[] = ['grasslands', 'forest', 'dungeon', 'dungeon_interior', 'boss_room'];

export const TRANSITION_FADE_MS = 500;
export const TRANSITION_EDGE_TILES = 2;

export interface DialogPayload {
  npcName: string;
  lines: string[];
  portrait?: string;
  portraitColumns?: number; // columns in the pose sheet (3 for 3×2 sheets, 4 for 4×4 sheets)
}

export interface QuestState {
  label: string;
  progress: number;
  goal: number;
}

export const ZONE_BOB_FREQ: Record<string, number> = {
  grasslands:       1.0,
  forest:           0.7,
  dungeon:          1.35,
  dungeon_interior: 1.6,
  boss_room:        1.9,
};
