export const TILE_SIZE = 32;
export const MAP_WIDTH = 60;
export const MAP_HEIGHT = 60;

export const PLAYER_SPEED = 160;
export const JUMP_DURATION = 480;
export const JUMP_HEIGHT = 44;
export const JUMP_SCALE_PEAK = 1.18;

export const MAX_HP = 6;
export const HEART_HEAL_AMOUNT = 2;

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

export const ENEMY_MAX_HP = 4;
export const ENEMY_HIT_INVULN_MS = 240;
export const ENEMY_FLASH_MS = 55;
export const CHEST_DROP_CHANCE = 0.5;

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
} as const;

export type InventoryItem = 'heart' | 'sword_upgrade';

export type ZoneId = 'grasslands' | 'forest' | 'dungeon' | 'dungeon_interior' | 'boss_room';

export interface ZoneMeta {
  id: ZoneId;
  name: string;
  tint: number;
}

export const ZONES: Record<ZoneId, ZoneMeta> = {
  grasslands:        { id: 'grasslands',        name: 'Grasslands',       tint: 0xffffff },
  forest:            { id: 'forest',            name: 'Forest',           tint: 0x78a878 },
  dungeon:           { id: 'dungeon',           name: 'Dungeon Entrance', tint: 0x8a8a8a },
  dungeon_interior:  { id: 'dungeon_interior',  name: 'Dungeon Interior', tint: 0x606880 },
  boss_room:         { id: 'boss_room',         name: 'Boss Chamber',     tint: 0x5a2850 },
};

export const ZONE_ORDER: ZoneId[] = ['grasslands', 'forest', 'dungeon', 'dungeon_interior', 'boss_room'];

export const TRANSITION_FADE_MS = 500;
export const TRANSITION_EDGE_TILES = 2;

export interface DialogPayload {
  npcName: string;
  lines: string[];
}

export const ZONE_BOB_FREQ: Record<string, number> = {
  grasslands:       1.0,
  forest:           0.7,
  dungeon:          1.35,
  dungeon_interior: 1.6,
  boss_room:        1.9,
};
