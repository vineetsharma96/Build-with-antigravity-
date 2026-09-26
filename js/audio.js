/**
 * TYPE//TANK - Procedural Retro Web Audio Synthesizer
 * 100% native Web Audio API synthesizer. Zero audio files or external sound assets.
 */

class RetroAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Load initial mute state from localStorage
    const savedMute = localStorage.getItem("typetank_muted");
    if (savedMute !== null) {
      this.isMuted = savedMute === "true";
    }
  }

  /**
   * Lazily initialize AudioContext on user gesture
   */
  init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn("Web Audio API not supported");
        return;
      }
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.isInitialized = true;
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  /**
   * Toggle mute state and persist to localStorage
   */
  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    localStorage.setItem("typetank_muted", String(this.isMuted));

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  setMuted(muted) {
    this.init();
    this.isMuted = Boolean(muted);
    localStorage.setItem("typetank_muted", String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
    }
  }

  ensureReady() {
    if (!this.isInitialized) {
      this.init();
    } else if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /**
   * Helper: Generate white noise buffer
   */
  createNoiseBuffer(duration = 0.5) {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * 1. High-frequency laser shot for normal keystrokes
   */
  playLaserShot() {
    if (this.isMuted) return;
    this.ensureReady();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    // Fast downward pitch glide
    osc.frequency.setValueAtTime(980, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.setValueAtTime(3.0, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * 2. Heavy metallic thump / explosion on word elimination
   */
  playWordExplosion(isBonus = false) {
    if (this.isMuted) return;
    this.ensureReady();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const duration = isBonus ? 0.45 : 0.32;

    // Sub-bass sine thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(isBonus ? 160 : 130, t);
    subOsc.frequency.exponentialRampToValueAtTime(28, t + duration);

    subGain.gain.setValueAtTime(isBonus ? 0.6 : 0.45, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(t);
    subOsc.stop(t + duration);

    // Noise burst through lowpass
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (noiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.setValueAtTime(isBonus ? 1800 : 1200, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(150, t + duration);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(isBonus ? 0.5 : 0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noiseSource.start(t);
      noiseSource.stop(t + duration);
    }
  }

  /**
   * 3. High-pitched dual-tone chime on red bonus word spawn
   */
  playCrimsonSpawnChime() {
    if (this.isMuted) return;
    this.ensureReady();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    const playTone = (freq, start, dur) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + dur);
    };

    playTone(880, t, 0.1);
    playTone(1760, t + 0.11, 0.16);
  }

  /**
   * 4. Low crunch / screen shake buzz on perimeter breach & damage impact
   */
  playDamageCrunch(isBonus = false) {
    if (this.isMuted) return;
    this.ensureReady();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const dur = isBonus ? 0.42 : 0.28;

    // Distorted sawtooth buzz
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(85, t);
    osc.frequency.linearRampToValueAtTime(35, t + dur);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    // Fast amplitude tremolo modulation
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(45, t);
    lfoGain.gain.setValueAtTime(0.2, t);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start(t);
    lfo.stop(t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur);

    // Crunch noise
    const noise = this.ctx.createBufferSource();
    const noiseBuf = this.createNoiseBuffer(dur);
    if (noiseBuf) {
      noise.buffer = noiseBuf;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.4, t);
      nGain.gain.exponentialRampToValueAtTime(0.01, t + dur);
      noise.connect(nGain);
      nGain.connect(this.masterGain);
      noise.start(t);
      noise.stop(t + dur);
    }
  }

  /**
   * 5. Multi-tone triumphant fanfare for new arcade records
   */
  playFanfare() {
    if (this.isMuted) return;
    this.ensureReady();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // C5, E5, G5, C6 triumphant arpeggio sequence
    const notes = [
      { f: 523.25, time: 0.00, dur: 0.12 },
      { f: 659.25, time: 0.13, dur: 0.12 },
      { f: 783.99, time: 0.26, dur: 0.14 },
      { f: 1046.50, time: 0.42, dur: 0.65 }
    ];

    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(note.f, t + note.time);

      gain.gain.setValueAtTime(0.3, t + note.time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.time + note.dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + note.time);
      osc.stop(t + note.time + note.dur);
    });
  }

  /**
   * 6. Soft retro terminal click on UI buttons and menus
   */
  playTerminalClick() {
    if (this.isMuted) return;
    this.ensureReady();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.012);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.014);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.015);
  }

  /**
   * Terminal error buzz (wrong keypress)
   */
  playErrorBuzz() {
    if (this.isMuted) return;
    this.ensureReady();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.065);
  }
}

// Global export for vanilla JS
window.RetroAudio = new RetroAudioEngine();
