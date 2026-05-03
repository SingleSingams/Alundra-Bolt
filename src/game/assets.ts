// Centralized asset key manifest.
// All keys reference entries in Phaser's global texture/audio cache.
// To swap procedural textures for real sprites, add files to public/assets/
// and load them in LoadingScene using the matching key.

export const ASSET_KEYS = {
  PLAYER:        'player',
  SHADOW:        'shadow',
  GRASS_TILES:   'grass-tiles',
  HEART:         'heart',
  PROJECTILE:    'projectile',
  ROCK:          'rock',
  BLOCKER:       'blocker',
  PARTICLE_SQ:   'particle-sq',
  BOSS_P1:       'boss',
  BOSS_P2:       'boss-p2',
  CHEST:         'chest',
  CHEST_OPEN:    'chest-open',
  HEART_PICKUP:  'heart-pickup',
  POTION_PICKUP: 'potion-pickup',
  NPC:           'npc',
} as const;

// External sprite paths (relative to /public).
// Set these to real file paths once art assets are available.
export const ASSET_PATHS: Partial<Record<keyof typeof ASSET_KEYS, string>> = {
  // PLAYER: '/assets/sprites/player.png',
  // GRASS_TILES: '/assets/tilesets/grass.png',
};
