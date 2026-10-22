/**
 * Cozy Procedural Web Audio Synthesizer
 * 100% procedural Web Audio API sounds - zero external audio assets!
 */

class SynthAudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.35;
  private sfxVolume: number = 0.6;

  // Engine audio nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Snow crunch / plowing noise nodes
  private snowNoiseNode: AudioNode | null = null;
  private snowNoiseFilter: BiquadFilterNode | null = null;
  private snowNoiseGain: GainNode | null = null;

  // Ambient synth music timer
  private ambientInterval: number | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;

  private pentatonicScale = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50, // C6
    1174.66, // D6
  ];

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngineSynth();
      this.setupSnowNoise();
      this.startAmbientMusic();
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  public ensureAudio() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.masterGain) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(48, this.ctx.currentTime);

      this.engineSubOsc.type = 'triangle';
      this.engineSubOsc.frequency.setValueAtTime(24, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc.start();
      this.engineSubOsc.start();
    } catch (e) {
      console.warn('Could not setup engine synth', e);
    }
  }

  private setupSnowNoise() {
    if (!this.ctx || !this.masterGain) return;

    try {
      // 2 seconds buffer of pink/white noise
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Simple pink noise filter approximation
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.1349386;
        b2 = 0.57000 * b2 + white * 0.4075590;
        output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.12;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      this.snowNoiseFilter = this.ctx.createBiquadFilter();
      this.snowNoiseFilter.type = 'bandpass';
      this.snowNoiseFilter.frequency.setValueAtTime(650, this.ctx.currentTime);
      this.snowNoiseFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.snowNoiseGain = this.ctx.createGain();
      this.snowNoiseGain.gain.setValueAtTime(0, this.ctx.currentTime);

      whiteNoise.connect(this.snowNoiseFilter);
      this.snowNoiseFilter.connect(this.snowNoiseGain);
      this.snowNoiseGain.connect(this.masterGain);

      whiteNoise.start();
      this.snowNoiseNode = whiteNoise;
    } catch (e) {
      console.warn('Could not setup snow noise', e);
    }
  }

  public updateEngine(speedNormalized: number, isBoosting: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineGain || !this.engineFilter || !this.engineSubOsc) return;

    const t = this.ctx.currentTime;
    const baseFreq = 42 + speedNormalized * 75 + (isBoosting ? 35 : 0);
    const filterFreq = 120 + speedNormalized * 320 + (isBoosting ? 220 : 0);
    const targetGain = Math.min(0.12, (0.02 + speedNormalized * 0.08) * this.sfxVolume);

    this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.08);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.1);
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.08);
  }

  public updateSnowPlowing(isClearing: boolean, speedRatio: number) {
    if (!this.ctx || !this.snowNoiseGain || !this.snowNoiseFilter) return;

    const t = this.ctx.currentTime;
    if (isClearing && speedRatio > 0.05) {
      const targetGain = Math.min(0.24, (0.06 + speedRatio * 0.15) * this.sfxVolume);
      const targetFreq = 500 + speedRatio * 450;
      this.snowNoiseGain.gain.setTargetAtTime(targetGain, t, 0.06);
      this.snowNoiseFilter.frequency.setTargetAtTime(targetFreq, t, 0.06);
    } else {
      this.snowNoiseGain.gain.setTargetAtTime(0.0001, t, 0.09);
    }
  }

  public playComboChime(comboLevel: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const index = Math.min(this.pentatonicScale.length - 1, 3 + comboLevel);
      const freq = this.pentatonicScale[index];

      // Bell chime: Sine oscillator with fast transient and rich harmonic overtone
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, t);

      // Bell harmonic (e.g. 2.76x or octave)
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2.01, t);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65 + Math.min(comboLevel * 0.05, 0.4));

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 1.2);
      osc2.stop(t + 1.2);
    } catch {
      // Audio fallback safe
    }
  }

  public playPickup() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880.00, t + 0.06); // A5
      osc.frequency.setValueAtTime(1174.66, t + 0.12); // D6

      gain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.4);
    } catch {}
  }

  public playBoost() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.4);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, t);
      filter.frequency.exponentialRampToValueAtTime(1200, t + 0.35);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.5);
    } catch {}
  }

  public playBump() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch {}
  }

  public playWeatherAlert() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Dual-tone warning chime for weather shifts (A4 -> E5)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.setValueAtTime(659.25, now + 0.14);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1318.5, now + 0.14);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
    } catch {}
  }

  public playBlizzardGust() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Howling wind gust: filtered noise/oscillator with sweeping lowpass filter
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(260, now + 0.8);
      osc.frequency.linearRampToValueAtTime(80, now + 2.2);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.linearRampToValueAtTime(680, now + 1.0);
      filter.frequency.linearRampToValueAtTime(220, now + 2.5);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18 * this.sfxVolume, now + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 2.7);
    } catch {}
  }

  public playUpgrade() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const notes = [329.63, 392.0, 523.25, 659.25, 783.99]; // E4, G4, C5, E5, G5
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const noteTime = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.18 * this.sfxVolume, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
      });
    } catch {}
  }

  private startAmbientMusic() {
    if (this.ambientInterval) return;

    // Cozy, calm winter progression: Cmaj7 -> Am7 -> Dm9 -> Gsus4
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [146.83, 220.00, 293.66, 369.99], // Dm9-ish
      [196.00, 261.63, 293.66, 392.00], // Gsus4
    ];

    let chordIndex = 0;

    const playChord = () => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const chord = chords[chordIndex % chords.length];
      chordIndex++;

      const now = this.ctx.currentTime;
      chord.forEach((freq) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.5, now); // soft warm octave down

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);

        // Gentle swell & fade
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.035 * this.musicVolume, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 4.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 5.0);
      });
    };

    // Initial chord and every 4.6 seconds
    playChord();
    this.ambientInterval = window.setInterval(playChord, 4600);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
  }

  public dispose() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.isInitialized = false;
  }
}

export const synthAudio = new SynthAudioSystem();
