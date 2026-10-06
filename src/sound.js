// Âm thanh tổng hợp bằng WebAudio (không cần file). Có đầu ra stream để ghi vào video.
export class Sound {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  ensure() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.streamDest = this.ctx.createMediaStreamDestination();
    this.master.connect(this.streamDest);
    return this.ctx;
  }

  get stream() {
    this.ensure();
    return this.streamDest ? this.streamDest.stream : null;
  }

  noiseBurst(t, dur, freq, q, gain) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(bp).connect(g).connect(this.master);
    src.start(t);
  }

  tone(t, freq, dur, gain, type = 'sine') {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  play(kind) {
    if (!this.enabled || !this.ensure()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime + 0.01;
    switch (kind) {
      case 'move':
        this.noiseBurst(t, 0.07, 1800, 1.2, 1.4);
        this.tone(t, 190, 0.09, 0.35);
        break;
      case 'capture':
        this.noiseBurst(t, 0.09, 1400, 1, 1.8);
        this.tone(t, 150, 0.12, 0.45);
        this.noiseBurst(t + 0.06, 0.06, 2600, 1.5, 0.9);
        break;
      case 'drop':
        this.noiseBurst(t, 0.12, 900, 0.8, 1.2);
        this.tone(t, 110, 0.15, 0.3);
        break;
      case 'check':
        this.tone(t, 880, 0.5, 0.18);
        this.tone(t + 0.02, 1320, 0.45, 0.1);
        break;
      case 'mate':
        [523, 659, 784, 1046].forEach((f, i) => this.tone(t + i * 0.09, f, 0.9, 0.16, 'triangle'));
        break;
      case 'select':
        this.tone(t, 1200, 0.06, 0.05);
        break;
    }
  }
}
