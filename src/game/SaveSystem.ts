import { ZoneId, InventoryItem, LevelUpSkill, MaterialId, ZONES } from './constants';

export interface SaveData {
  hp: number;
  zone: ZoneId;
  inventory: InventoryItem[];
  xp: number;
  level: number;
  savedAt: number;
  killedEnemies: string[];
  ngPlus: number;
  chosenSkills: LevelUpSkill[];
  openedSecrets: string[];
  questKills: number;
  questShieldFound: boolean;
  questBossKilled: boolean;
  materials: Partial<Record<MaterialId, number>>;
  /** side quest id → progress; -1 = completed & rewarded */
  sideQuests: Record<string, number>;
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
  ngPlus: 0,
  chosenSkills: [],
  openedSecrets: [],
  questKills: 0,
  questShieldFound: false,
  questBossKilled: false,
  materials: {},
  sideQuests: {},
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
      ngPlus: p.ngPlus ?? defaults.ngPlus,
      chosenSkills: (p as Partial<SaveData>).chosenSkills ?? defaults.chosenSkills,
      openedSecrets: (p as Partial<SaveData>).openedSecrets ?? defaults.openedSecrets,
      questKills: p.questKills ?? defaults.questKills,
      questShieldFound: p.questShieldFound ?? defaults.questShieldFound,
      questBossKilled: p.questBossKilled ?? defaults.questBossKilled,
      materials: p.materials ?? defaults.materials,
      sideQuests: p.sideQuests ?? defaults.sideQuests,
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
