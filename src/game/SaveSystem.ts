import { ZoneId, InventoryItem, ZONES } from './constants';

export interface SaveData {
  hp: number;
  zone: ZoneId;
  inventory: InventoryItem[];
  xp: number;
  level: number;
  savedAt: number;
  killedEnemies: string[];
}

export interface SlotPreview {
  slot: number;
  level: number;
  zone: string;
  xp: number;
  savedAt: number;
}

const NUM_SLOTS = 3;
const slotKey = (slot: number) => `verdant-chronicles-save-${slot}`;

let _activeSlot = 0;

const defaults: SaveData = {
  hp: 6,
  zone: 'grasslands',
  inventory: [],
  xp: 0,
  level: 1,
  savedAt: 0,
  killedEnemies: [],
};

function parseSlot(slot: number): SaveData | null {
  try {
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<SaveData>;
    return {
      hp: p.hp ?? defaults.hp,
      zone: p.zone ?? defaults.zone,
      inventory: p.inventory ?? defaults.inventory,
      xp: p.xp ?? defaults.xp,
      level: p.level ?? defaults.level,
      savedAt: p.savedAt ?? defaults.savedAt,
      killedEnemies: p.killedEnemies ?? defaults.killedEnemies,
    };
  } catch {
    return null;
  }
}

export const SaveSystem = {
  setSlot(slot: number): void {
    _activeSlot = slot;
  },

  getSlot(): number {
    return _activeSlot;
  },

  save(data: SaveData): void {
    try {
      localStorage.setItem(slotKey(_activeSlot), JSON.stringify(data));
    } catch {
      // localStorage unavailable
    }
  },

  load(): SaveData | null {
    return parseSlot(_activeSlot);
  },

  clear(): void {
    try {
      localStorage.removeItem(slotKey(_activeSlot));
    } catch {
      // ignore
    }
  },

  exists(): boolean {
    try {
      return localStorage.getItem(slotKey(_activeSlot)) !== null;
    } catch {
      return false;
    }
  },

  clearSlot(slot: number): void {
    try {
      localStorage.removeItem(slotKey(slot));
    } catch {
      // ignore
    }
  },

  listSlots(): (SlotPreview | null)[] {
    return Array.from({ length: NUM_SLOTS }, (_, i) => {
      const data = parseSlot(i);
      if (!data) return null;
      return {
        slot: i,
        level: data.level,
        zone: ZONES[data.zone]?.name ?? data.zone,
        xp: data.xp,
        savedAt: data.savedAt,
      };
    });
  },
};
