import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsSystem } from '../SettingsSystem';

describe('SettingsSystem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when no settings saved', () => {
    const s = SettingsSystem.load();
    expect(s.volume).toBe(1);
    expect(s.showHints).toBe(true);
    expect(typeof s.showTouchControls).toBe('boolean');
  });

  it('saves and loads all settings', () => {
    SettingsSystem.save({ volume: 0.5, showHints: false, showTouchControls: true });
    const loaded = SettingsSystem.load();
    expect(loaded.volume).toBe(0.5);
    expect(loaded.showHints).toBe(false);
    expect(loaded.showTouchControls).toBe(true);
  });

  it('uses defaults for missing fields in partial data', () => {
    localStorage.setItem('verdant-chronicles-settings', JSON.stringify({ volume: 0.3 }));
    const s = SettingsSystem.load();
    expect(s.volume).toBe(0.3);
    expect(s.showHints).toBe(true);
  });

  it('volume clamps are preserved on save/load', () => {
    SettingsSystem.save({ volume: 0, showHints: true, showTouchControls: false });
    expect(SettingsSystem.load().volume).toBe(0);
    SettingsSystem.save({ volume: 1, showHints: true, showTouchControls: false });
    expect(SettingsSystem.load().volume).toBe(1);
  });

  it('returns defaults on corrupt JSON', () => {
    localStorage.setItem('verdant-chronicles-settings', '!!!bad');
    const s = SettingsSystem.load();
    expect(s.volume).toBe(1);
    expect(s.showHints).toBe(true);
  });
});
