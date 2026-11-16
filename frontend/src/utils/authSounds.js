/**
 * Web Audio API Sound Synthesizer for FinRAG Authentication & Character Interactions.
 * 100% self-contained, zero external asset dependencies, zero network latency.
 */

class AuthSoundEngine {
  constructor() {
    this.ctx = null;
    const saved = localStorage.getItem('finrag_auth_sound_enabled');
    this.enabled = saved !== null ? saved === 'true' : true;
  }

  getAudioContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(val) {
    this.enabled = !!val;
    localStorage.setItem('finrag_auth_sound_enabled', this.enabled ? 'true' : 'false');
  }

  toggleSound() {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.playKeypop();
    }
    return this.enabled;
  }

  /**
   * Subtle key blip / bubble pop when typing password characters
   */
  playKeypop() {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Randomize slightly between 700Hz - 900Hz for a playful typing bounce
      const startFreq = 720 + Math.random() * 160;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // Ignore audio errors on unsupported browsers
    }
  }

  /**
   * Subtle whoosh when minions & cats cover/uncover eyes
   */
  playWhoosh() {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  /**
   * Sad / Crying Sound:
   * Playful descending "womp-womp-womp-waaah" with a sad kitten whimper
   */
  playSad() {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // 4 descending tones: D4 (293), C#4 (277), C4 (261), B3 (246 -> slide down to 196 G3)
      const notes = [
        { f: 293.66, t: 0.00, dur: 0.18 },
        { f: 277.18, t: 0.20, dur: 0.18 },
        { f: 261.63, t: 0.40, dur: 0.20 },
        { f: 246.94, t: 0.62, dur: 0.55, slideTo: 180.00 }
      ];

      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        // Lowpass filter to soften the sawtooth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now + n.t);

        osc.frequency.setValueAtTime(n.f, now + n.t);
        if (n.slideTo) {
          osc.frequency.exponentialRampToValueAtTime(n.slideTo, now + n.t + n.dur);
        }

        gain.gain.setValueAtTime(0.001, now + n.t);
        gain.gain.linearRampToValueAtTime(0.12, now + n.t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.t);
        osc.stop(now + n.t + n.dur + 0.02);
      });

      // Sad kitten meow warble at the end
      setTimeout(() => {
        try {
          if (!this.enabled || !this.ctx) return;
          const meowNow = this.ctx.currentTime;
          const meowOsc = this.ctx.createOscillator();
          const meowGain = this.ctx.createGain();

          meowOsc.type = 'sine';
          meowOsc.frequency.setValueAtTime(580, meowNow);
          meowOsc.frequency.linearRampToValueAtTime(720, meowNow + 0.12);
          meowOsc.frequency.exponentialRampToValueAtTime(380, meowNow + 0.4);

          meowGain.gain.setValueAtTime(0.001, meowNow);
          meowGain.gain.linearRampToValueAtTime(0.08, meowNow + 0.06);
          meowGain.gain.exponentialRampToValueAtTime(0.001, meowNow + 0.4);

          meowOsc.connect(meowGain);
          meowGain.connect(this.ctx.destination);
          meowOsc.start(meowNow);
          meowOsc.stop(meowNow + 0.42);
        } catch (e) {}
      }, 750);

    } catch (e) {}
  }

  /**
   * Joyful Celebration Fanfare:
   * Uplifting arpeggio (C5 - E5 - G5 - C6) + sparkling chime bell chords
   */
  playSuccess() {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { f: 523.25, t: 0.00, dur: 0.14 }, // C5
        { f: 659.25, t: 0.12, dur: 0.14 }, // E5
        { f: 783.99, t: 0.24, dur: 0.16 }, // G5
        { f: 1046.50, t: 0.38, dur: 0.45 }, // C6
        { f: 1318.51, t: 0.46, dur: 0.50 }  // E6 sparkle
      ];

      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);

        gain.gain.setValueAtTime(0.001, now + n.t);
        gain.gain.linearRampToValueAtTime(0.15, now + n.t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.t);
        osc.stop(now + n.t + n.dur + 0.02);
      });

      // Joyful cheer shimmer chime
      setTimeout(() => {
        try {
          if (!this.enabled || !this.ctx) return;
          const chimeNow = this.ctx.currentTime;
          [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, chimeNow + idx * 0.05);

            gain.gain.setValueAtTime(0.001, chimeNow + idx * 0.05);
            gain.gain.linearRampToValueAtTime(0.08, chimeNow + idx * 0.05 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, chimeNow + idx * 0.05 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(chimeNow + idx * 0.05);
            osc.stop(chimeNow + idx * 0.05 + 0.38);
          });
        } catch (e) {}
      }, 420);

    } catch (e) {}
  }
}

export const authSounds = new AuthSoundEngine();
export default authSounds;
