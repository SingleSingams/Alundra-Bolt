import { describe, it, expect } from 'vitest';
import {
  COMBO_XP_MULT,
  XP_BY_ENEMY_TYPE,
  XP_PER_ENEMY,
  ZONE_LOOT_TABLE,
  rollLoot,
  SKILL_SYNERGIES,
  LevelUpSkill,
} from '../constants';

// ─── Combo XP multiplier ─────────────────────────────────────────────────────

describe('COMBO_XP_MULT', () => {
  const getMultiplier = (combo: number): number => {
    const entry = COMBO_XP_MULT.find(e => combo >= e.min);
    return entry ? entry.mult : 1;
  };

  it('combo 0 → ×1.0', () => {
    expect(getMultiplier(0)).toBe(1);
  });

  it('combo 2 → ×1.0', () => {
    expect(getMultiplier(2)).toBe(1);
  });

  it('combo 3 → ×1.5', () => {
    expect(getMultiplier(3)).toBe(1.5);
  });

  it('combo 5 → ×1.5', () => {
    expect(getMultiplier(5)).toBe(1.5);
  });

  it('combo 6 → ×2.0', () => {
    expect(getMultiplier(6)).toBe(2.0);
  });

  it('combo 9 → ×2.0', () => {
    expect(getMultiplier(9)).toBe(2.0);
  });

  it('combo 10 → ×3.0', () => {
    expect(getMultiplier(10)).toBe(3.0);
  });

  it('combo 15 → ×3.0', () => {
    expect(getMultiplier(15)).toBe(3.0);
  });

  it('tiers are sorted highest-first so find() returns highest match', () => {
    for (let i = 1; i < COMBO_XP_MULT.length; i++) {
      expect(COMBO_XP_MULT[i - 1].min).toBeGreaterThan(COMBO_XP_MULT[i].min);
    }
  });
});

// ─── XP by enemy type ────────────────────────────────────────────────────────

describe('XP_BY_ENEMY_TYPE', () => {
  it('dragon-red gives more XP than dragon', () => {
    expect(XP_BY_ENEMY_TYPE['dragon-red']).toBeGreaterThan(XP_BY_ENEMY_TYPE['dragon']);
  });

  it('all enemy types give at least XP_PER_ENEMY', () => {
    for (const xp of Object.values(XP_BY_ENEMY_TYPE)) {
      expect(xp).toBeGreaterThanOrEqual(XP_PER_ENEMY);
    }
  });

  it('dragon gives more than basic enemy', () => {
    expect(XP_BY_ENEMY_TYPE['dragon']).toBeGreaterThan(XP_BY_ENEMY_TYPE['basic']);
  });
});

// ─── Zone loot tables ────────────────────────────────────────────────────────

describe('ZONE_LOOT_TABLE + rollLoot', () => {
  it('all zones have non-empty loot tables', () => {
    for (const [, table] of Object.entries(ZONE_LOOT_TABLE)) {
      expect(table.length).toBeGreaterThan(0);
    }
  });

  it('boss_room table contains no hearts', () => {
    const bossItems = ZONE_LOOT_TABLE['boss_room'].map(e => e.item);
    expect(bossItems).not.toContain('heart');
  });

  it('boss_room weights sum to 100', () => {
    const total = ZONE_LOOT_TABLE['boss_room'].reduce((s, e) => s + e.weight, 0);
    expect(total).toBe(100);
  });

  it('rollLoot always returns an item from the table', () => {
    const table = ZONE_LOOT_TABLE['dungeon_interior'];
    const validItems = new Set(table.map(e => e.item));
    for (let i = 0; i < 50; i++) {
      expect(validItems.has(rollLoot(table))).toBe(true);
    }
  });

  it('rollLoot returns last item when rng forces it', () => {
    const table = [{ item: 'heart' as const, weight: 100 }];
    expect(rollLoot(table)).toBe('heart');
  });

  it('grasslands table contains heart pickups', () => {
    const grassItems = ZONE_LOOT_TABLE['grasslands'].map(e => e.item);
    expect(grassItems).toContain('heart');
  });
});

// ─── Skill synergies ─────────────────────────────────────────────────────────

describe('SKILL_SYNERGIES', () => {
  const hasSynergy = (skills: LevelUpSkill[]): boolean => {
    for (const syn of SKILL_SYNERGIES) {
      const needed = [...syn.requires];
      const available = [...skills];
      let matched = true;
      for (const req of needed) {
        const idx = available.indexOf(req);
        if (idx === -1) { matched = false; break; }
        available.splice(idx, 1);
      }
      if (matched) return true;
    }
    return false;
  };

  it('attack_up + attack_up triggers Durchdringende Schüsse', () => {
    expect(hasSynergy(['attack_up', 'attack_up'])).toBe(true);
  });

  it('attack_up + shield triggers Parrier-Meister', () => {
    expect(hasSynergy(['attack_up', 'shield'])).toBe(true);
  });

  it('xp_boost + hp_up triggers Heilsame Tränke', () => {
    expect(hasSynergy(['xp_boost', 'hp_up'])).toBe(true);
  });

  it('double_shot + attack_up triggers Sturmschütze', () => {
    expect(hasSynergy(['double_shot', 'attack_up'])).toBe(true);
  });

  it('vampire + hp_up triggers Lebenshunger', () => {
    expect(hasSynergy(['vampire', 'hp_up'])).toBe(true);
  });

  it('single skill alone does not trigger any synergy', () => {
    expect(hasSynergy(['attack_up'])).toBe(false);
  });
});
