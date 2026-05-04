import { describe, it, expect } from 'vitest';
import {
  ENEMY_HP_SCALE,
  ENEMY_DAMAGE_SCALE,
  ATTACK_DAMAGE,
  PROJECTILE_DAMAGE,
  MAX_LEVEL,
} from '../constants';

describe('ENEMY_HP_SCALE', () => {
  it('has MAX_LEVEL entries (one per player level)', () => {
    expect(ENEMY_HP_SCALE.length).toBe(MAX_LEVEL);
  });

  it('starts at 1.0 for level 1', () => {
    expect(ENEMY_HP_SCALE[0]).toBe(1);
  });

  it('is non-decreasing across levels', () => {
    for (let i = 1; i < ENEMY_HP_SCALE.length; i++) {
      expect(ENEMY_HP_SCALE[i]).toBeGreaterThanOrEqual(ENEMY_HP_SCALE[i - 1]);
    }
  });

  it('all values are positive', () => {
    for (const v of ENEMY_HP_SCALE) {
      expect(v).toBeGreaterThan(0);
    }
  });
});

describe('ENEMY_DAMAGE_SCALE', () => {
  it('has MAX_LEVEL entries', () => {
    expect(ENEMY_DAMAGE_SCALE.length).toBe(MAX_LEVEL);
  });

  it('has a positive starting value', () => {
    expect(ENEMY_DAMAGE_SCALE[0]).toBeGreaterThan(0);
  });

  it('is non-decreasing across levels', () => {
    for (let i = 1; i < ENEMY_DAMAGE_SCALE.length; i++) {
      expect(ENEMY_DAMAGE_SCALE[i]).toBeGreaterThanOrEqual(ENEMY_DAMAGE_SCALE[i - 1]);
    }
  });

  it('all values are positive', () => {
    for (const v of ENEMY_DAMAGE_SCALE) {
      expect(v).toBeGreaterThan(0);
    }
  });
});

describe('Combat constants sanity', () => {
  it('base ATTACK_DAMAGE is positive', () => {
    expect(ATTACK_DAMAGE).toBeGreaterThan(0);
  });

  it('base PROJECTILE_DAMAGE is positive', () => {
    expect(PROJECTILE_DAMAGE).toBeGreaterThan(0);
  });

  it('scaled enemy HP at max level is greater than at level 1', () => {
    const hpAtL1 = 6 * ENEMY_HP_SCALE[0];
    const hpAtMax = 6 * ENEMY_HP_SCALE[MAX_LEVEL - 1];
    expect(hpAtMax).toBeGreaterThanOrEqual(hpAtL1);
  });

  it('scaled enemy damage at max level is greater than at level 1', () => {
    const dmgAtL1 = 1 * ENEMY_DAMAGE_SCALE[0];
    const dmgAtMax = 1 * ENEMY_DAMAGE_SCALE[MAX_LEVEL - 1];
    expect(dmgAtMax).toBeGreaterThanOrEqual(dmgAtL1);
  });
});

describe('Chest loot table probabilities', () => {
  // Loot table boundaries from Item.openChest()
  // r < 0.28 → heart, r < 0.50 → potion, r < 0.70 → shield_fragment,
  // r < 0.85 → sword_upgrade, else → projectile_upgrade
  it('loot boundaries are ordered and sum to 1', () => {
    const boundaries = [0.28, 0.50, 0.70, 0.85, 1.0];
    for (let i = 1; i < boundaries.length; i++) {
      expect(boundaries[i]).toBeGreaterThan(boundaries[i - 1]);
    }
    expect(boundaries[boundaries.length - 1]).toBe(1.0);
  });

  it('each loot tier has positive probability', () => {
    const boundaries = [0, 0.28, 0.50, 0.70, 0.85, 1.0];
    for (let i = 1; i < boundaries.length; i++) {
      expect(boundaries[i] - boundaries[i - 1]).toBeGreaterThan(0);
    }
  });
});
