/**
 * Procedural Web Audio Synthesizer for J.A.R.V.I.S.
 * 100% zero-404 audio generation via Web Audio API oscillators and filters.
 */

class JarvisAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private ambientLfoGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private soundEffectsEnabled = true;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setSoundEffectsEnabled(enabled: boolean) {
    this.soundEffectsEnabled = enabled;
  }

  /**
   * Crisp Stark HUD Chirp
   */
  public playHudBeep(freq = 1200, duration = 0.08) {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext policy catch
    }
  }

  /**
   * Distinctive Stark Wake Word Activation Double-Chime
   */
  public playWakeWordChime() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Note 1: E6 (1318.5 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.5, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Note 2: B6 (1975.5 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1975.5, now + 0.08);
      gain2.gain.setValueAtTime(0.14, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.28);
    } catch {
      // AudioContext policy catch
    }
  }

  /**
   * Gesture recognition trigger audio
   */
  public playGestureDetectedSound() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880, now + 0.05); // A5
      osc.frequency.setValueAtTime(1318.51, now + 0.1); // E6

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  /**
   * Stark Optical Pointer Engagement Chime
   */
  public playPointerEngage() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(2200, now + 0.16);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }

  /**
   * High-tech Stark Laser Click / Pinch Trigger
   */
  public playLaserClick() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      
      // Fast pitch drop click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.07);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  /**
   * Subtle micro hover tick when targeting UI controls
   */
  public playTargetHover() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Ignore
    }
  }

  /**
   * Repulsor / Arc Reactor energy charge up sound
   */
  public playRepulsorCharge(duration = 0.8) {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(850, now + duration);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(150, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + duration);
      filter.Q.value = 4;

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.12, now + duration * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore
    }
  }

  /**
   * Ambient Stark Lab Reactor hum
   */
  public toggleAmbientReactorHum(enable?: boolean): boolean {
    try {
      const ctx = this.getContext();
      const shouldPlay = enable !== undefined ? enable : !this.isAmbientPlaying;

      if (shouldPlay && !this.isAmbientPlaying) {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, now); // A1 bass hum

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(110.5, now); // subtle detune

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.035, now + 1.5);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        // LFO for rhythmic pulsing ambient beat (breathing effect: ~0.55 Hz = ~1.82s period)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.55, now);
        lfoGain.gain.setValueAtTime(0.012, now); // gentle breathing depth
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);

        osc1.start();
        osc2.start();
        lfo.start();

        this.ambientOsc1 = osc1;
        this.ambientOsc2 = osc2;
        this.ambientLfo = lfo;
        this.ambientLfoGain = lfoGain;
        this.ambientGain = gain;
        this.isAmbientPlaying = true;
      } else if (!shouldPlay && this.isAmbientPlaying) {
        if (this.ambientGain) {
          const now = ctx.currentTime;
          this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
          this.ambientGain.gain.linearRampToValueAtTime(0.001, now + 0.8);
          setTimeout(() => {
            try {
              this.ambientOsc1?.stop();
              this.ambientOsc2?.stop();
              this.ambientLfo?.stop();
              this.ambientOsc1?.disconnect();
              this.ambientOsc2?.disconnect();
              this.ambientLfo?.disconnect();
              this.ambientLfoGain?.disconnect();
              this.ambientGain?.disconnect();
            } catch {}
          }, 850);
        }
        this.isAmbientPlaying = false;
      }
      return this.isAmbientPlaying;
    } catch {
      return false;
    }
  }

  /**
   * Futuristic Stark data download completion chime
   */
  public playDownloadChime() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.06);
        gain.gain.setValueAtTime(0.1, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    } catch {
      // Ignore
    }
  }

  public getIsAmbientPlaying(): boolean {
    return this.isAmbientPlaying;
  }
}

export const jarvisAudio = new JarvisAudioEngine();
