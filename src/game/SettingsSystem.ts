export interface Settings {
  volume: number;        // 0–1
  showHints: boolean;    // keyboard controls badge
  showTouchControls: boolean;
}

const SETTINGS_KEY = 'verdant-chronicles-settings';

function getDefaults(): Settings {
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return { volume: 1, showHints: true, showTouchControls: touch };
}

export const SettingsSystem = {
  load(): Settings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return getDefaults();
      const p = JSON.parse(raw) as Partial<Settings>;
      const d = getDefaults();
      return {
        volume:            p.volume            ?? d.volume,
        showHints:         p.showHints         ?? d.showHints,
        showTouchControls: p.showTouchControls ?? d.showTouchControls,
      };
    } catch {
      return getDefaults();
    }
  },

  save(s: Settings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch { /* ignore */ }
  },
};
