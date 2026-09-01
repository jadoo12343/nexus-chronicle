/**
 * AudioSynth - Next-Gen Procedural Web Audio Engine
 * Generates dynamic retro/sci-fi/fantasy soundscapes, adaptive multi-stem music,
 * combat sound effects, and interactive UI feedback without external audio assets.
 */
class AudioSynth {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('nexus_audio_muted') === 'true';
    this.currentTheme = localStorage.getItem('nexus_scenario') || 'cyberpunk';
    this.ambientGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isAmbientPlaying = false;
    this.musicLoopInterval = null;
    this.musicStep = 0;
    this.combatMode = false;
    this.volume = 0.8;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        this.ambientGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('nexus_audio_muted', this.muted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.muted;
  }

  setTheme(theme) {
    this.currentTheme = theme;
    if (this.isAmbientPlaying) {
      this.stopAmbient();
      this.startAmbient();
    }
  }

  /* -------------------------------------------------------------
     1. UI & DIALOGUE SOUNDS
  ------------------------------------------------------------- */
  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playHover() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(540, this.ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  playTypewriter() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    const freq = 1200 + (Math.random() * 400 - 200);
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.015);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.015);
  }

  playDiceRoll() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    for (let i = 0; i < 7; i++) {
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(250 + Math.random() * 500, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
      }, i * 65);
    }
  }

  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
      }, idx * 75);
    });
  }

  playFailure() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [350, 311.13, 277.18, 220.0];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
      }, idx * 90);
    });
  }

  /* -------------------------------------------------------------
     2. COMBAT & ACTION SOUNDS
  ------------------------------------------------------------- */
  playSlash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playLaserShot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playShieldHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playHackingBeep() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const freqs = [1050, 1320, 1580, 1980];
    const freq = freqs[Math.floor(Math.random() * freqs.length)];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playGlitch() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100 + Math.random() * 1200, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
      }, i * 25);
    }
  }

  /* -------------------------------------------------------------
     3. ADAPTIVE AMBIENT & PROCEDURAL MUSIC
  ------------------------------------------------------------- */
  startAmbient() {
    this.init();
    if (!this.ctx || this.isAmbientPlaying) return;

    this.isAmbientPlaying = true;
    this.startMusicLoop();
  }

  stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.musicLoopInterval) {
      clearInterval(this.musicLoopInterval);
      this.musicLoopInterval = null;
    }
  }

  startMusicLoop() {
    if (this.musicLoopInterval) clearInterval(this.musicLoopInterval);

    // Cyberpunk Synth Scales vs Dark Fantasy Modes vs Void Abyss Drones
    const scales = {
      cyberpunk: [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 311.13, 392.00], // C Minor Pentatonic + blues
      fantasy:   [110.00, 130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66], // A Aeolian / Dorian
      void:      [92.50, 110.00, 123.47, 138.59, 164.81, 185.00, 220.00, 246.94]  // F# Locrian / Cosmic
    };

    const bpm = this.combatMode ? 140 : (this.currentTheme === 'cyberpunk' ? 100 : 75);
    const stepTime = (60 / bpm) * 1000 / 2; // Eighth note step

    this.musicLoopInterval = setInterval(() => {
      if (this.muted || !this.ctx || !this.isAmbientPlaying) return;

      const currentScale = scales[this.currentTheme] || scales.cyberpunk;
      const step = this.musicStep % 16;
      this.musicStep++;

      // Bass drone on downbeats
      if (step === 0 || step === 8) {
        const rootFreq = currentScale[0] / 2;
        this.playPad(rootFreq, (stepTime * 7) / 1000, 0.05);
      }

      // Melodic arpeggio patterns
      if (this.combatMode) {
        // Driving combat pulse
        if (step % 2 === 0) {
          const noteIndex = Math.floor(Math.random() * currentScale.length);
          this.playPluck(currentScale[noteIndex], 0.12, 0.06, 'sawtooth');
        }
        if (step === 0 || step === 4 || step === 8 || step === 12) {
          this.playKick();
        }
      } else {
        // Atmospheric mystery arpeggios
        if (step % 4 === 0 || (step % 3 === 0 && Math.random() > 0.4)) {
          const noteIndex = (step * 2) % currentScale.length;
          this.playPluck(currentScale[noteIndex], 0.35, 0.04, 'sine');
        }
      }
    }, stepTime);
  }

  setCombatMode(isCombat) {
    this.combatMode = isCombat;
    if (this.isAmbientPlaying) {
      this.startMusicLoop();
    }
  }

  playPad(freq, duration, volume = 0.04) {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = this.currentTheme === 'cyberpunk' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Subtle low pass filter for warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playPluck(freq, duration, volume = 0.05, type = 'sine') {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playKick() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }
}

window.audioSynth = new AudioSynth();
