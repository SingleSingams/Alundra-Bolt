import { ZoneId, InventoryItem } from './constants';

export interface SaveData {
  hp: number;
  zone: ZoneId;
  inventory: InventoryItem[];
  xp: number;
  level: number;
  savedAt: number;
  killedEnemies: string[];
}

const SAVE_KEY = 'verdant-chronicles-save';

export const SaveSystem = {
  save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable (e.g. private browsing with storage blocked)
    }
  },

  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        hp: parsed.hp ?? 6,
        zone: parsed.zone ?? 'grasslands',
        inventory: parsed.inventory ?? [],
        xp: parsed.xp ?? 0,
        level: parsed.level ?? 1,
        savedAt: parsed.savedAt ?? 0,
        killedEnemies: parsed.killedEnemies ?? [],
      };
    } catch {
      return null;
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
  },

  exists(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  },
};
