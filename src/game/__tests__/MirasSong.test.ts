import { describe, it, expect } from 'vitest';
import { MIRAS_SONG, MIRAS_SONG_FAREWELL_ENDING } from '../SoundSystem';

describe('MIRAS_SONG', () => {
  it('has a substantial melody with valid notes', () => {
    expect(MIRAS_SONG.length).toBeGreaterThanOrEqual(8);
    for (const note of MIRAS_SONG) {
      expect(note.freq).toBeGreaterThanOrEqual(0);
      expect(note.beats).toBeGreaterThan(0);
    }
  });

  it('stays in a singable range (a lullaby, not a synth solo)', () => {
    for (const note of MIRAS_SONG) {
      if (note.freq === 0) continue;
      expect(note.freq).toBeGreaterThanOrEqual(200);
      expect(note.freq).toBeLessThanOrEqual(1000);
    }
  });

  it('ends unresolved (E5) — the seal still holds', () => {
    const last = MIRAS_SONG[MIRAS_SONG.length - 1];
    expect(Math.round(last.freq)).toBe(659);
  });
});

describe('MIRAS_SONG_FAREWELL_ENDING', () => {
  it('contains the Picardy third (C#5) and resolves down to A4', () => {
    const freqs = MIRAS_SONG_FAREWELL_ENDING.map(n => Math.round(n.freq));
    expect(freqs).toContain(554); // C#5 — the major third
    expect(Math.round(MIRAS_SONG_FAREWELL_ENDING[MIRAS_SONG_FAREWELL_ENDING.length - 1].freq)).toBe(440);
  });

  it('the final note is held longest — a real ending', () => {
    const last = MIRAS_SONG_FAREWELL_ENDING[MIRAS_SONG_FAREWELL_ENDING.length - 1];
    for (const note of MIRAS_SONG_FAREWELL_ENDING.slice(0, -1)) {
      expect(last.beats).toBeGreaterThan(note.beats);
    }
  });
});
