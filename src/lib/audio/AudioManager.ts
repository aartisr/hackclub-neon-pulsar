/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Drone state
  private droneOscs: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  
  // Rhythm state
  private rhythmGain: GainNode | null = null;
  private rhythmInterval: number | null = null;
  private step = 0;
  
  private isStarted = false;

  constructor() {}

  public async init() {
    if (this.isStarted) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);

    this.initDrone();
    this.initRhythm();
    this.isStarted = true;
    
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  private initDrone() {
    if (!this.ctx || !this.masterGain) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.2;
    
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 200;
    this.droneFilter.Q.value = 5;

    // Harmonic cluster for tension
    const freqs = [55, 110, 164.81, 220]; // A1, A2, E3, A3
    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      
      const oscGain = this.ctx!.createGain();
      oscGain.gain.value = 0.1;
      
      // LFO for movement
      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.frequency.value = 0.1 + Math.random() * 0.2;
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      osc.connect(oscGain);
      oscGain.connect(this.droneFilter!);
      osc.start();
      this.droneOscs.push(osc);
    });

    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
  }

  private initRhythm() {
    if (!this.ctx || !this.masterGain) return;

    this.rhythmGain = this.ctx.createGain();
    this.rhythmGain.gain.value = 0; // Silent by default
    this.rhythmGain.connect(this.masterGain);

    this.startSequencer();
  }

  private startSequencer() {
    const bpm = 128;
    const stepTime = 60 / bpm / 4; // 16th notes

    const tick = () => {
      if (!this.ctx) return;
      this.playStep(this.ctx.currentTime);
      this.step = (this.step + 1) % 16;
      this.rhythmInterval = window.setTimeout(tick, stepTime * 1000);
    };

    tick();
  }

  private playStep(time: number) {
    if (!this.ctx || !this.rhythmGain) return;

    // Kick on 1, 5, 9, 13
    if (this.step % 4 === 0) {
      this.playKick(time);
    }

    // Snare on 5, 13
    if (this.step === 4 || this.step === 12) {
      this.playSnare(time);
    }

    // Hi-hats
    if (this.step % 2 === 0) {
      this.playHiHat(time);
    }
    
    // Random synth pluck
    if (Math.random() > 0.7) {
      this.playPluck(time);
    }
  }

  private playKick(time: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    osc.connect(gain);
    gain.connect(this.rhythmGain!);
    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playSnare(time: number) {
    const noise = this.ctx!.createBufferSource();
    const bufferSize = this.ctx!.sampleRate * 0.1;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.rhythmGain!);
    noise.start(time);
  }

  private playHiHat(time: number) {
    const osc = this.ctx!.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 10000;
    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.rhythmGain!);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  private playPluck(time: number) {
    const osc = this.ctx!.createOscillator();
    osc.type = 'triangle';
    const notes = [440, 523.25, 659.25, 783.99]; // A, C, E, G
    osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(this.rhythmGain!);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  public update(speed: number, status: string) {
    if (!this.isStarted || !this.ctx) return;

    const targetRhythmGain = status === 'playing' ? Math.min(speed * 0.5, 0.4) : 0;
    const targetDroneFreq = status === 'playing' ? 200 + speed * 1000 : 200;
    const targetDroneGain = status === 'playing' ? 0.1 : 0.3;

    if (this.rhythmGain) {
      this.rhythmGain.gain.setTargetAtTime(targetRhythmGain, this.ctx.currentTime, 0.1);
    }
    if (this.droneFilter) {
      this.droneFilter.frequency.setTargetAtTime(targetDroneFreq, this.ctx.currentTime, 0.5);
    }
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(targetDroneGain, this.ctx.currentTime, 1.0);
    }
  }

  public stop() {
    if (this.rhythmInterval) clearTimeout(this.rhythmInterval);
    this.ctx?.close();
  }
}
