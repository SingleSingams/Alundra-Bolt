import { describe, it, expect } from 'vitest';
import {
  RECIPES,
  MATERIALS,
  MATERIAL_IDS,
  RESOURCE_NODE_COUNTS,
  SIDE_QUESTS,
  ESSENCE_DROP_CHANCE,
  MaterialId,
} from '../constants';
import { ZONE_CONFIGS } from '../ZoneConfigs';

describe('RECIPES', () => {
  it('has at least one recipe per station', () => {
    expect(RECIPES.some(r => r.station === 'forge')).toBe(true);
    expect(RECIPES.some(r => r.station === 'alchemy')).toBe(true);
  });

  it('has unique ids', () => {
    const ids = RECIPES.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('costs reference only valid materials with positive amounts', () => {
    for (const recipe of RECIPES) {
      const entries = Object.entries(recipe.cost);
      expect(entries.length).toBeGreaterThan(0);
      for (const [mat, n] of entries) {
        expect(MATERIAL_IDS).toContain(mat as MaterialId);
        expect(n).toBeGreaterThan(0);
      }
    }
  });

  it('every recipe has label, desc and icon', () => {
    for (const recipe of RECIPES) {
      expect(recipe.label.length).toBeGreaterThan(0);
      expect(recipe.desc.length).toBeGreaterThan(0);
      expect(recipe.icon.length).toBeGreaterThan(0);
    }
  });
});

describe('MATERIALS', () => {
  it('has metadata for every material id', () => {
    for (const id of MATERIAL_IDS) {
      expect(MATERIALS[id].id).toBe(id);
      expect(MATERIALS[id].label.length).toBeGreaterThan(0);
    }
  });
});

describe('RESOURCE_NODE_COUNTS', () => {
  it('references only gatherable materials (no essence nodes)', () => {
    for (const counts of Object.values(RESOURCE_NODE_COUNTS)) {
      for (const [kind, count] of Object.entries(counts)) {
        expect(kind).not.toBe('essence');
        expect(MATERIAL_IDS).toContain(kind as MaterialId);
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  it('boss room has no resource nodes', () => {
    expect(Object.keys(RESOURCE_NODE_COUNTS.boss_room)).toHaveLength(0);
  });

  it('herbs are gatherable somewhere (needed for the Elara side quest)', () => {
    const totalHerbs = Object.values(RESOURCE_NODE_COUNTS)
      .reduce((sum, counts) => sum + (counts.herb ?? 0), 0);
    expect(totalHerbs).toBeGreaterThan(0);
  });
});

describe('SIDE_QUESTS', () => {
  it('has unique ids and positive goals', () => {
    const ids = SIDE_QUESTS.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const quest of SIDE_QUESTS) {
      expect(quest.goal).toBeGreaterThan(0);
      expect(quest.rewardXp).toBeGreaterThan(0);
    }
  });

  it('every quest giver exists as an NPC in some zone', () => {
    const npcIds = new Set(
      Object.values(ZONE_CONFIGS).flatMap(cfg => cfg.npcs.map(n => n.id)),
    );
    for (const quest of SIDE_QUESTS) {
      expect(npcIds.has(quest.giver)).toBe(true);
    }
  });

  it('dragon quest is completable (dragons spawn in some zone)', () => {
    const dragonSpawns = Object.values(ZONE_CONFIGS)
      .flatMap(cfg => cfg.enemySpawns)
      .filter(s => s.type === 'dragon' || s.type === 'dragon-red');
    const dragonQuest = SIDE_QUESTS.find(q => q.kind === 'kill_dragon');
    if (dragonQuest) {
      expect(dragonSpawns.length).toBeGreaterThanOrEqual(dragonQuest.goal);
    }
  });
});

describe('ESSENCE_DROP_CHANCE', () => {
  it('is a sane probability', () => {
    expect(ESSENCE_DROP_CHANCE).toBeGreaterThan(0);
    expect(ESSENCE_DROP_CHANCE).toBeLessThanOrEqual(1);
  });
});

describe('crafting stations in the world', () => {
  it('both stations have a crafter NPC in the village', () => {
    const stations = ZONE_CONFIGS.grasslands.npcs.map(n => n.station).filter(Boolean);
    expect(stations).toContain('forge');
    expect(stations).toContain('alchemy');
  });
});
