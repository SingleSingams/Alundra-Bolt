import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem } from '../SaveSystem';

import type { InventoryItem } from '../constants';

const FULL_SAVE = {
  hp: 4,
  zone: 'forest' as const,
  inventory: ['heart', 'potion'] as InventoryItem[],
  xp: 25,
  level: 3,
  savedAt: 1000,
  killedEnemies: ['grasslands:14,14', 'forest:30,14'],
  ngPlus: 0,
  chosenSkills: [] as import('../constants').LevelUpSkill[],
  openedSecrets: [] as string[],
  questKills: 0,
  questShieldFound: false,
  questBossKilled: false,
  materials: { wood: 2, herb: 1 } as Partial<Record<import('../constants').MaterialId, number>>,
  sideQuests: { elara_herbs: 1 } as Record<string, number>,
};

describe('SaveSystem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no save exists', () => {
    expect(SaveSystem.load()).toBeNull();
  });

  it('exists() returns false when no save', () => {
    expect(SaveSystem.exists()).toBe(false);
  });

  it('saves and loads all fields correctly', () => {
    SaveSystem.save(FULL_SAVE);
    const loaded = SaveSystem.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.hp).toBe(4);
    expect(loaded?.zone).toBe('forest');
    expect(loaded?.inventory).toEqual(['heart', 'potion']);
    expect(loaded?.xp).toBe(25);
    expect(loaded?.level).toBe(3);
    expect(loaded?.savedAt).toBe(1000);
  });

  it('exists() returns true after save', () => {
    SaveSystem.save(FULL_SAVE);
    expect(SaveSystem.exists()).toBe(true);
  });

  it('clear() removes the save', () => {
    SaveSystem.save(FULL_SAVE);
    SaveSystem.clear();
    expect(SaveSystem.load()).toBeNull();
    expect(SaveSystem.exists()).toBe(false);
  });

  it('uses defaults for missing fields on partial data', () => {
    localStorage.setItem('verdant-chronicles-save-0', JSON.stringify({ hp: 3 }));
    const loaded = SaveSystem.load();
    expect(loaded?.hp).toBe(3);
    expect(loaded?.zone).toBe('grasslands');
    expect(loaded?.inventory).toEqual([]);
    expect(loaded?.xp).toBe(0);
    expect(loaded?.level).toBe(1);
    expect(loaded?.killedEnemies).toEqual([]);
  });

  it('saves and restores killedEnemies', () => {
    SaveSystem.save(FULL_SAVE);
    const loaded = SaveSystem.load();
    expect(loaded?.killedEnemies).toEqual(['grasslands:14,14', 'forest:30,14']);
  });

  it('returns null on corrupt JSON', () => {
    localStorage.setItem('verdant-chronicles-save-0', 'not-valid-json{{');
    expect(SaveSystem.load()).toBeNull();
  });
});
