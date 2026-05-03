export const TILE_SIZE = 32;
export const MAP_WIDTH = 60;
export const MAP_HEIGHT = 60;

export const PLAYER_SPEED = 160;
export const JUMP_DURATION = 480;
export const JUMP_HEIGHT = 44;
export const JUMP_SCALE_PEAK = 1.18;

export const MAX_HP = 6;

export const CAMERA_LERP = 0.08;

export const TILE_VARIANTS = 5;

export const WORLD_WIDTH = MAP_WIDTH * TILE_SIZE;
export const WORLD_HEIGHT = MAP_HEIGHT * TILE_SIZE;

export const GAME_EVENTS = {
  HP_CHANGE: 'hp-change',
  PLAYER_JUMP: 'player-jump',
  PLAYER_LAND: 'player-land',
} as const;
