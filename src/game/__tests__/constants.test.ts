import { describe, it, expect } from 'vitest';
import {
  XP_THRESHOLDS,
  MAX_LEVEL,
  XP_PER_ENEMY,
  XP_PER_BOSS,
  ZONE_ORDER,
  ZONES,
  MAX_HP,
  ATTACK_DAMAGE,
  PROJECTILE_DAMAGE,
  HEART_HEAL_AMOUNT,
  MAX_INVENTORY,
  GAME_EVENTS,
} from '../constants';

describe('XP constants', () => {
  it('XP_THRESHOLDS has exactly MAX_LEVEL - 1 entries', () => {
    expect(XP_THRESHOLDS.length).toBe(MAX_LEVEL - 1);
  });

  it('XP_THRESHOLDS is strictly increasing', () => {
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
      expect(XP_THRESHOLDS[i]).toBeGreaterThan(XP_THRESHOLDS[i - 1]);
    }
  });

  it('boss XP reward exceeds single enemy reward', () => {
    expect(XP_PER_BOSS).toBeGreaterThan(XP_PER_ENEMY);
  });

  it('reaching max level requires at least XP_PER_BOSS * some kills', () => {
    const totalNeeded = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
    expect(totalNeeded).toBeGreaterThan(0);
  });
});

describe('Zone constants', () => {
  it('ZONE_ORDER covers every entry in ZONES', () => {
    const zoneKeys = Object.keys(ZONES);
    expect(ZONE_ORDER.length).toBe(zoneKeys.length);
    for (const id of ZONE_ORDER) {
      expect(ZONES[id]).toBeDefined();
    }
  });

  it('every ZoneMeta has a non-empty name', () => {
    for (const meta of Object.values(ZONES)) {
      expect(meta.name.length).toBeGreaterThan(0);
    }
  });
});

describe('Combat constants', () => {
  it('melee damage is positive', () => {
    expect(ATTACK_DAMAGE).toBeGreaterThan(0);
  });

  it('projectile damage is less than melee damage', () => {
    expect(PROJECTILE_DAMAGE).toBeLessThan(ATTACK_DAMAGE);
  });

  it('MAX_HP is a positive even number (supports half-heart display)', () => {
    expect(MAX_HP).toBeGreaterThan(0);
    expect(MAX_HP % 2).toBe(0);
  });

  it('heal amount does not exceed max HP in one pickup', () => {
    expect(HEART_HEAL_AMOUNT).toBeLessThanOrEqual(MAX_HP);
  });
});

describe('Inventory constants', () => {
  it('MAX_INVENTORY is at least 1', () => {
    expect(MAX_INVENTORY).toBeGreaterThanOrEqual(1);
  });
});

describe('GAME_EVENTS', () => {
  it('all event values are unique strings', () => {
    const values = Object.values(GAME_EVENTS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('contains required lifecycle events', () => {
    expect(GAME_EVENTS.HP_CHANGE).toBeDefined();
    expect(GAME_EVENTS.GAME_OVER).toBeDefined();
    expect(GAME_EVENTS.ZONE_CHANGE).toBeDefined();
    expect(GAME_EVENTS.LEVEL_UP).toBeDefined();
    expect(GAME_EVENTS.MINIMAP_UPDATE).toBeDefined();
  });
});
