type OscType = OscillatorType;

class SoundSystemClass {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
    } catch {
      return null;
    }
    return this.ctx;
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
}

export const SoundSystem = new SoundSystemClass();
