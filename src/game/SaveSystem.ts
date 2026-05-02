import { ZoneId, InventoryItem } from './constants';

interface SaveData {
  hp: number;
  zone: ZoneId;
  inventory: InventoryItem[];
  savedAt: number;
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
      return JSON.parse(raw) as SaveData;
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
