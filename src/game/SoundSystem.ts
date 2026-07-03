type OscType = OscillatorType;

type ZoneTheme = 'grasslands' | 'forest' | 'dungeon' | 'boss';

// ─── Miras Lied ───────────────────────────────────────────────────────────────
// The song that holds the seal — the story's central motif. A simple lullaby
// in A minor: rising ("sleep, little brother"), rocking back, opening up, and
// ending on an unresolved note. The farewell variant resolves to A major
// (Picardy third) — the release.

export interface SongNote {
  /** frequency in Hz; 0 = rest */
  freq: number;
  /** duration in beats */
  beats: number;
}

const A4 = 440, C5 = 523.25, CS5 = 554.37, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880;

export const MIRAS_SONG: SongNote[] = [
  { freq: A4, beats: 1 }, { freq: C5, beats: 1 }, { freq: E5, beats: 2 },
  { freq: D5, beats: 1 }, { freq: C5, beats: 1 }, { freq: A4, beats: 2 },
  { freq: A4, beats: 1 }, { freq: C5, beats: 1 }, { freq: E5, beats: 1 }, { freq: A5, beats: 3 },
  { freq: G5, beats: 1 }, { freq: E5, beats: 1 }, { freq: D5, beats: 1 }, { freq: E5, beats: 3 },
];

/** Farewell ending: replaces the last phrase, resolving to A major. */
export const MIRAS_SONG_FAREWELL_ENDING: SongNote[] = [
  { freq: G5, beats: 1 }, { freq: E5, beats: 1 }, { freq: CS5, beats: 1 }, { freq: A4, beats: 4 },
];

export type SongVariant = 'lullaby' | 'haunted' | 'farewell';

class SoundSystemClass {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private volumeMultiplier = 1;
  private musicOscs: OscillatorNode[] = [];
  private musicTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentTheme: ZoneTheme | null = null;
  private songGain: GainNode | null = null;
  private songEndsAt = 0;

  private percussionGain: GainNode | null = null;
  private percussionInterval: ReturnType<typeof setInterval> | null = null;
  private _combatIntensity: 0 | 1 | 2 = 0;

  setVolume(v: number): void {
    this.volumeMultiplier = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = 0.18 * this.volumeMultiplier;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0.06 * this.volumeMultiplier, this.ctx.currentTime, 0.1);
    }
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18 * this.volumeMultiplier;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.06 * this.volumeMultiplier;
      this.musicGain.connect(this.ctx.destination);
    } catch {
      return null;
    }
    return this.ctx;
  }

  // ─── Ambient music ────────────────────────────────────────────────────────

  private stopMusic(): void {
    if (this.musicTimeout) { clearTimeout(this.musicTimeout); this.musicTimeout = null; }
    const ctx = this.ctx;
    const g = this.musicGain;
    if (ctx && g) {
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    }
    this.musicOscs.forEach(o => { try { o.stop(ctx ? ctx.currentTime + 1 : 0); } catch { /**/ } });
    this.musicOscs = [];
  }

  private playDrone(freq: number, type: OscType, gainVal: number): OscillatorNode | null {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return null;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.value = gainVal;
    osc.connect(env);
    env.connect(this.musicGain);
    osc.start();
    this.musicOscs.push(osc);
    return osc;
  }

  private scheduleGrasslandsPhrase(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain || this.currentTheme !== 'grasslands') return;
    const melody = [523, 659, 784, 880, 784, 659, 523, 440];
    const dur = 0.28;
    melody.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const e = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      e.gain.setValueAtTime(0.001, ctx.currentTime + i * dur);
      e.gain.linearRampToValueAtTime(0.45, ctx.currentTime + i * dur + 0.04);
      e.gain.setTargetAtTime(0.001, ctx.currentTime + i * dur + dur * 0.7, 0.05);
      o.connect(e); e.connect(this.musicGain!);
      o.start(ctx.currentTime + i * dur);
      o.stop(ctx.currentTime + i * dur + dur + 0.05);
    });
    this.musicTimeout = setTimeout(() => this.scheduleGrasslandsPhrase(), melody.length * dur * 1000 + 3000);
  }

  private scheduleDungeonPhrase(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain || this.currentTheme !== 'dungeon') return;
    const pattern = [110, 0, 82, 0, 98, 0, 73, 110];
    const dur = 0.38;
    pattern.forEach((freq, i) => {
      if (!freq) return;
      const o = ctx.createOscillator();
      const e = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = freq;
      e.gain.setValueAtTime(0.001, ctx.currentTime + i * dur);
      e.gain.linearRampToValueAtTime(0.5, ctx.currentTime + i * dur + 0.05);
      e.gain.setTargetAtTime(0.001, ctx.currentTime + i * dur + dur * 0.6, 0.06);
      o.connect(e); e.connect(this.musicGain!);
      o.start(ctx.currentTime + i * dur);
      o.stop(ctx.currentTime + i * dur + dur + 0.05);
    });
    this.musicTimeout = setTimeout(() => this.scheduleDungeonPhrase(), pattern.length * dur * 1000 + 2000);
  }

  private scheduleBossPhrase(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain || this.currentTheme !== 'boss') return;
    const pattern = [220, 220, 293, 220, 196, 220, 164, 196];
    const dur = 0.22;
    pattern.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const e = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = freq;
      e.gain.setValueAtTime(0.001, ctx.currentTime + i * dur);
      e.gain.linearRampToValueAtTime(0.6, ctx.currentTime + i * dur + 0.03);
      e.gain.setTargetAtTime(0.001, ctx.currentTime + i * dur + dur * 0.5, 0.04);
      o.connect(e); e.connect(this.musicGain!);
      o.start(ctx.currentTime + i * dur);
      o.stop(ctx.currentTime + i * dur + dur + 0.04);
    });
    this.musicTimeout = setTimeout(() => this.scheduleBossPhrase(), pattern.length * dur * 1000 + 800);
  }

  startMusic(theme: ZoneTheme): void {
    const ctx = this.ensure();
    if (!ctx || !this.musicGain) return;
    if (this.currentTheme === theme) return;
    this.stopMusic();
    this.currentTheme = theme;
    this.musicGain.gain.setTargetAtTime(0.06 * this.volumeMultiplier, ctx.currentTime, 0.8);

    if (theme === 'grasslands') {
      // Gentle drone + melodic phrase
      this.playDrone(130, 'sine', 0.18);
      this.playDrone(196, 'sine', 0.10);
      this.scheduleGrasslandsPhrase();
    } else if (theme === 'forest') {
      // Low mysterious drone
      this.playDrone(98, 'sine', 0.22);
      this.playDrone(146, 'triangle', 0.12);
      this.playDrone(73, 'sine', 0.08);
    } else if (theme === 'dungeon') {
      // Dark pulsing pattern
      this.playDrone(55, 'sawtooth', 0.15);
      this.scheduleDungeonPhrase();
    } else if (theme === 'boss') {
      // Intense boss theme
      this.playDrone(55, 'sawtooth', 0.20);
      this.playDrone(82, 'sawtooth', 0.12);
      this.scheduleBossPhrase();
    }
  }

  stopMusicFade(): void {
    this.currentTheme = null;
    this.stopMusic();
    this.setCombatIntensity(0);
  }

  // ─── Miras Lied (story motif) ────────────────────────────────────────────

  /**
   * Plays the song that holds the seal.
   * - 'lullaby'  — soft and warm (intro, Mira's confession, Lina)
   * - 'haunted'  — detuned and urgent, cuts through the boss theme (phase 3)
   * - 'farewell' — slow and clear, resolving to A major (Arthos' release)
   */
  playMirasSong(variant: SongVariant): void {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.currentTime < this.songEndsAt) return; // don't overlap with itself

    if (!this.songGain) {
      this.songGain = ctx.createGain();
      this.songGain.connect(ctx.destination);
    }
    const level =
      variant === 'haunted' ? 0.085 :
      variant === 'farewell' ? 0.10 : 0.075;
    this.songGain.gain.setValueAtTime(level * this.volumeMultiplier, ctx.currentTime);

    const beatSec = variant === 'farewell' ? 0.62 : variant === 'haunted' ? 0.42 : 0.52;
    const notes: SongNote[] = variant === 'farewell'
      ? [...MIRAS_SONG.slice(0, MIRAS_SONG.length - 4), ...MIRAS_SONG_FAREWELL_ENDING]
      : MIRAS_SONG;

    let t = ctx.currentTime + 0.05;
    for (const note of notes) {
      const dur = note.beats * beatSec;
      if (note.freq > 0) {
        this.songVoice(note.freq, t, dur, variant);
        if (variant !== 'haunted') {
          // soft lower octave doubling — the "humming" quality
          this.songVoice(note.freq / 2, t, dur, variant, 0.35);
        } else {
          // beating detuned second voice — something is wrong with the song
          this.songVoice(note.freq * 1.013, t, dur, variant, 0.7);
        }
      }
      t += dur;
    }

    if (variant === 'farewell') {
      // final A-major chord, very soft — the seal releases
      const chord = [220, 554.37, 659.25];
      for (const freq of chord) this.songVoice(freq, t, 3.2, variant, 0.5);
      t += 3.2;
    }
    this.songEndsAt = t;
  }

  private songVoice(freq: number, start: number, dur: number, variant: SongVariant, gainScale = 1): void {
    const ctx = this.ctx;
    if (!ctx || !this.songGain) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = variant === 'haunted' ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0.001, start);
    env.gain.linearRampToValueAtTime(0.6 * gainScale, start + Math.min(0.08, dur * 0.2));
    env.gain.setTargetAtTime(0.001, start + dur * 0.75, dur * 0.12);
    osc.connect(env);
    env.connect(this.songGain);
    osc.start(start);
    osc.stop(start + dur + 0.1);
  }

  setCombatIntensity(level: 0 | 1 | 2): void {
    if (this._combatIntensity === level) return;
    this._combatIntensity = level;
    const ctx = this.ensure();

    if (level === 0) {
      if (this.percussionInterval) { clearInterval(this.percussionInterval); this.percussionInterval = null; }
      if (this.percussionGain && ctx) {
        this.percussionGain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      }
      return;
    }

    if (!ctx) return;

    if (!this.percussionGain) {
      this.percussionGain = ctx.createGain();
      this.percussionGain.gain.value = 0;
      this.percussionGain.connect(ctx.destination);
    }
    const targetGain = level === 2 ? 0.045 * this.volumeMultiplier : 0.028 * this.volumeMultiplier;
    this.percussionGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.3);

    if (!this.percussionInterval) {
      const beatMs = level === 2 ? 333 : 500;
      this.percussionInterval = setInterval(() => {
        const c = this.ctx;
        const g = this.percussionGain;
        if (!c || !g || this._combatIntensity === 0) return;
        const o = c.createOscillator();
        const e = c.createGain();
        o.type = 'sawtooth';
        o.frequency.value = 55;
        e.gain.setValueAtTime(0.9, c.currentTime);
        e.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        o.connect(e);
        e.connect(g);
        o.start(c.currentTime);
        o.stop(c.currentTime + 0.12);
      }, beatMs);
    }
  }

  private tone(
    freq: number,
    type: OscType,
    durationSec: number,
    startGain: number,
    endGain = 0.001,
    delaySec = 0
  ): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env);
    env.connect(this.master);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + delaySec;
    env.gain.setValueAtTime(startGain, t);
    env.gain.exponentialRampToValueAtTime(Math.max(0.001, endGain), t + durationSec);
    osc.start(t);
    osc.stop(t + durationSec + 0.02);
  }

  playAttack(): void {
    this.tone(340, 'sawtooth', 0.10, 0.22, 0.001);
    this.tone(200, 'sawtooth', 0.08, 0.12, 0.001, 0.03);
  }

  playProjectile(): void {
    this.tone(900, 'square', 0.05, 0.09, 0.001);
    this.tone(1300, 'square', 0.04, 0.06, 0.001, 0.01);
  }

  playEnemyHit(): void {
    this.tone(160, 'square', 0.08, 0.28, 0.001);
  }

  playEnemyDeath(): void {
    this.tone(220, 'square', 0.07, 0.35, 0.001);
    this.tone(110, 'sawtooth', 0.12, 0.25, 0.001, 0.04);
  }

  playPlayerDamage(): void {
    this.tone(90, 'square', 0.12, 0.35, 0.001);
    this.tone(60, 'square', 0.15, 0.20, 0.001, 0.05);
  }

  playShieldBlock(): void {
    this.tone(480, 'square', 0.05, 0.30, 0.001);
    this.tone(720, 'square', 0.07, 0.22, 0.001, 0.02);
  }

  playHeal(): void {
    this.tone(440, 'sine', 0.22, 0.18, 0.001);
    this.tone(554, 'sine', 0.22, 0.16, 0.001, 0.07);
    this.tone(659, 'sine', 0.30, 0.14, 0.001, 0.14);
  }

  playChestOpen(): void {
    this.tone(660, 'sine', 0.14, 0.18, 0.001);
    this.tone(880, 'sine', 0.18, 0.16, 0.001, 0.10);
    this.tone(1100, 'sine', 0.22, 0.12, 0.001, 0.20);
  }

  playLevelUp(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.tone(freq, 'sine', 0.38, 0.26, 0.001, i * 0.09);
    });
  }

  playBossPhase2(): void {
    const notes = [220, 277, 330, 440];
    notes.forEach((freq, i) => {
      this.tone(freq, 'sawtooth', 0.55, 0.32, 0.001, i * 0.05);
    });
  }

  playBossDeath(): void {
    const notes = [110, 138, 165, 220, 293];
    notes.forEach((freq, i) => {
      this.tone(freq, 'sawtooth', 0.6, 0.4, 0.001, i * 0.07);
    });
    this.tone(55, 'square', 0.8, 0.3, 0.001, 0.1);
  }

  playPickup(): void {
    this.tone(880, 'sine', 0.05, 0.18, 0.001);
    this.tone(1320, 'sine', 0.07, 0.14, 0.001, 0.04);
    this.tone(1760, 'sine', 0.06, 0.10, 0.001, 0.09);
  }

  playZoneTransition(): void {
    this.tone(220, 'sine', 0.18, 0.22, 0.001);
    this.tone(330, 'sine', 0.22, 0.16, 0.001, 0.06);
    this.tone(440, 'sine', 0.28, 0.12, 0.001, 0.14);
  }

  playProjectileHit(): void {
    this.tone(540, 'square', 0.04, 0.20, 0.001);
    this.tone(360, 'sawtooth', 0.06, 0.14, 0.001, 0.02);
  }
}

export const SoundSystem = new SoundSystemClass();
