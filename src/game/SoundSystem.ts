type OscType = OscillatorType;

type ZoneTheme = 'grasslands' | 'forest' | 'dungeon' | 'boss';

class SoundSystemClass {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private volumeMultiplier = 1;
  private musicOscs: OscillatorNode[] = [];
  private musicTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentTheme: ZoneTheme | null = null;

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
