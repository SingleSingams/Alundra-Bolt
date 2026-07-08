import { describe, it, expect } from 'vitest';
import { ZONE_CONFIGS, ZoneConfig } from '../ZoneConfigs';
import { ZONE_ORDER, ZoneId, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../constants';

const inBounds = (tx: number, ty: number) =>
  tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT;

describe('ZONE_CONFIGS', () => {
  it('has an entry for every zone in ZONE_ORDER', () => {
    for (const id of ZONE_ORDER) {
      expect(ZONE_CONFIGS).toHaveProperty(id);
    }
  });

  it('every zone has non-negative numTrees and obstacleDensity in [0,1]', () => {
    for (const [, cfg] of Object.entries(ZONE_CONFIGS) as [string, ZoneConfig][]) {
      expect(cfg.numTrees).toBeGreaterThanOrEqual(0);
      expect(cfg.obstacleDensity).toBeGreaterThanOrEqual(0);
      expect(cfg.obstacleDensity).toBeLessThanOrEqual(1);
    }
  });

  it('every enemy spawn tile coordinate is within map bounds', () => {
    for (const [zone, cfg] of Object.entries(ZONE_CONFIGS) as [string, ZoneConfig][]) {
      for (const spawn of cfg.enemySpawns) {
        if (!inBounds(spawn.tx, spawn.ty)) {
          throw new Error(`${zone} enemy spawn (${spawn.tx},${spawn.ty}) out of bounds`);
        }
      }
    }
  });

  it('every heart spawn tile coordinate is within map bounds', () => {
    for (const [zone, cfg] of Object.entries(ZONE_CONFIGS) as [string, ZoneConfig][]) {
      for (const spawn of cfg.heartSpawns) {
        if (!inBounds(spawn.tx, spawn.ty)) {
          throw new Error(`${zone} heart spawn (${spawn.tx},${spawn.ty}) out of bounds`);
        }
      }
    }
  });

  it('every hazard spawn tile coordinate is within map bounds', () => {
    for (const [zone, cfg] of Object.entries(ZONE_CONFIGS) as [string, ZoneConfig][]) {
      for (const spawn of cfg.hazardSpawns ?? []) {
        if (!inBounds(spawn.tx, spawn.ty)) {
          throw new Error(`${zone} hazard (${spawn.tx},${spawn.ty}) out of bounds`);
        }
        expect(['thorns', 'lava']).toContain(spawn.kind);
      }
    }
  });

  it('all NPC definitions have id, name, and at least one dialog line', () => {
    for (const [, cfg] of Object.entries(ZONE_CONFIGS) as [string, ZoneConfig][]) {
      for (const npc of cfg.npcs) {
        expect(typeof npc.id).toBe('string');
        expect(npc.name.length).toBeGreaterThan(0);
        expect(npc.lines.length).toBeGreaterThan(0);
      }
    }
  });

  it('zone transitions only reference valid zone IDs', () => {
    const validIds = new Set<ZoneId>(ZONE_ORDER);
    for (const [, cfg] of Object.entries(ZONE_CONFIGS) as [string, ZoneConfig][]) {
      for (const target of Object.values(cfg.transitions)) {
        expect(validIds.has(target!)).toBe(true);
      }
    }
  });

  it('boss_room has exactly one bossSpawn within map bounds', () => {
    const boss = ZONE_CONFIGS.boss_room;
    expect(boss.bossSpawn).toBeDefined();
    expect(inBounds(boss.bossSpawn!.tx, boss.bossSpawn!.ty)).toBe(true);
  });

  it('only boss_room has a bossSpawn', () => {
    for (const [id, cfg] of Object.entries(ZONE_CONFIGS) as [string, ZoneConfig][]) {
      if (id !== 'boss_room') {
        expect(cfg.bossSpawn).toBeUndefined();
      }
    }
  });

  it('TILE_SIZE is positive', () => {
    expect(TILE_SIZE).toBeGreaterThan(0);
  });
});
