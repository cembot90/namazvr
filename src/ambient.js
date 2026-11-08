// Klangkulisse für Umre & Hac und den Waschraum – im Browser erzeugt (Web Audio), ohne Aufnahmen und offline.
// Pilger-Murmeln, Schritte, Wind, Grillen in der Nacht, Wasser, Steinchen; dazu ein entfernter Chor der Talbiya,
// wenn die freie arabische Stimme geladen ist (mehrfach versetzt und leicht verstimmt abgespielt).

// Grundstimmung je Ort: [Murmeln, Wind, Grillen, Hall]
const PROFILES = {
  miqat: [0.08, 0, 0, 0.3],
  haram: [0.5, 0.04, 0, 0.5],
  masa: [0.42, 0, 0, 0.7],
  mina: [0.22, 0.12, 0, 0.2],
  arafat: [0.25, 0.3, 0, 0.1],
  muzdalifa: [0.1, 0.18, 0.5, 0.1],
  jamarat: [0.55, 0.1, 0, 0.3],
  wudu: [0, 0, 0, 0.4],
  cemevi: [0.06, 0, 0, 0.45],
  // Geschichten der Propheten und Sternenhimmel
  ark: [0, 0.3, 0, 0.05], fire: [0.04, 0.14, 0.35, 0], nile: [0, 0.1, 0, 0], sea: [0, 0.45, 0, 0.05],
  valley: [0, 0.12, 0.12, 0], cave: [0, 0.16, 0.45, 0.3], starsky: [0, 0.07, 0.4, 0],
};

// Angedeutete Bağlama: gezupfte Saite (Karplus-Strong), Töne nahe der Hüseynî-Leiter über dem Grundton A
const NOTES = [220, 247.5, 264, 293.3, 330, 371, 396, 440];

export class Ambience {
  constructor(getCtx) {
    this.getCtx = getCtx;
    this.ctx = null;
    this.key = '';
    this.nodes = null;
    this.stepT = 0;
    this.chorusT = 0;
    this.chorusBuf = null;
    this.chorusFetch = null;
  }

  init() {
    if (this.ctx) return true;
    const ctx = this.getCtx();
    if (!ctx) return false;
    this.ctx = ctx;
    // Rauschen (rosa angenähert) als Grundbaustein
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048;
      d[i] = (b0 + b1 + b2 + w * 0.02) * 0.9;
    }
    this.noise = buf;
    const master = ctx.createGain();
    master.gain.value = 0;
    // Einfacher Hall: Rückkopplung über eine Verzögerung
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.11;
    const fb = ctx.createGain();
    fb.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2500;
    master.connect(ctx.destination);
    master.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); fb.connect(ctx.destination);
    const src = (filter, freq, q = 0.7) => {
      const s = ctx.createBufferSource();
      s.buffer = buf; s.loop = true;
      s.playbackRate.value = 0.9 + Math.random() * 0.2;
      const f = ctx.createBiquadFilter();
      f.type = filter; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(master);
      s.start(0, Math.random() * 2);
      return g;
    };
    // Murmeln: zwei Stimmbänder mit unruhiger Lautstärke; Wind: tiefes Rauschen; Wasser: helles Rauschen
    this.nodes = {
      master, fb,
      murmurLo: src('bandpass', 420, 0.8), murmurHi: src('bandpass', 1300, 1.2),
      wind: src('lowpass', 380), water: src('bandpass', 3200, 0.5),
    };
    return true;
  }

  // ort: Szene ('haram' …, 'wudu') oder null; enabled: Klänge an
  set({ scene = null, enabled = true, chorus = false, chorusText = null, voices = null }) {
    const key = `${scene}|${enabled}|${chorus}`;
    this.chorus = chorus && enabled;
    this.chorusText = chorusText;
    this.voices = voices;
    if (key === this.key) return;
    this.key = key;
    if (!scene || !enabled) { this.fade(0); return; }
    if (!this.init()) return;
    const [murmur, wind, crickets, hall] = PROFILES[scene] || [0, 0, 0, 0];
    this.level = { murmur, wind, crickets };
    this.nodes.fb.gain.setTargetAtTime(hall * 0.55, this.ctx.currentTime, 0.3);
    this.fade(0.32);
  }

  fade(to) {
    if (!this.nodes) return;
    const now = this.ctx.currentTime;
    this.nodes.master.gain.cancelScheduledValues(now);
    this.nodes.master.gain.setTargetAtTime(to, now, 0.6);
    this.on = to > 0;
    if (!this.on) for (const k of ['murmurLo', 'murmurHi', 'wind', 'water']) this.nodes[k].gain.setTargetAtTime(0, now, 0.5);
  }

  // Jedes Bild: Lautstärke-Schwankungen, Schritte, Grillen, Chor
  update(dt, { walking = false, speed = 2, water = false } = {}) {
    if (!this.on || !this.nodes) return;
    const ctx = this.ctx, now = ctx.currentTime, n = this.nodes, L = this.level;
    const wob = () => 0.6 + Math.random() * 0.8;
    if (Math.random() < dt * 4) {
      n.murmurLo.gain.setTargetAtTime(L.murmur * wob(), now, 0.25);
      n.murmurHi.gain.setTargetAtTime(L.murmur * 0.35 * wob(), now, 0.2);
    }
    if (Math.random() < dt * 0.6) n.wind.gain.setTargetAtTime(L.wind * (0.4 + Math.random() * 1.2), now, 1.5);
    n.water.gain.setTargetAtTime(water ? 0.16 : 0, now, 0.2);
    // Schritte im Takt des Gehens
    if (walking) {
      this.stepT += dt * speed * 0.9;
      if (this.stepT >= 1) { this.stepT = 0; this.burst(160, 0.07, 0.35, 'lowpass'); }
    }
    // Bağlama: Grundton als Bordun, darüber eine ruhig wandernde Melodie
    if (this.musicMode) {
      const beat = this.musicMode === 2 ? 0.26 : 0.52;
      this.beatT = (this.beatT || 0) + dt;
      if (this.beatT >= beat) {
        this.beatT = 0;
        this.noteI = Math.max(0, Math.min(NOTES.length - 1, (this.noteI ?? 4) + [-1, -1, 0, 1, 1, 2, -2][Math.floor(Math.random() * 7)]));
        this.bar = ((this.bar || 0) + 1) % 4;
        if (this.bar === 0) this.pluck(110, 0.14);
        this.pluck(NOTES[this.noteI], 0.16);
      }
    }
    // Grillen: kurze, hohe Zirpfolgen
    if (L.crickets && Math.random() < dt * 1.2) this.chirp(L.crickets);
    // Entfernter Chor der Talbiya, etwa alle 10 Sekunden
    if (this.chorus) {
      this.chorusT -= dt;
      if (this.chorusT <= 0) { this.chorusT = 10 + Math.random() * 4; this.playChorus(); }
    }
  }

  burst(freq, dur, gain, type = 'bandpass') {
    const ctx = this.ctx, now = ctx.currentTime;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq * (0.8 + Math.random() * 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    s.connect(f); f.connect(g); g.connect(this.nodes.master);
    s.start(now, Math.random() * 2, dur + 0.05);
  }

  chirp(level) {
    const ctx = this.ctx, now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.value = 4200 + Math.random() * 600;
    const g = ctx.createGain();
    g.gain.value = 0;
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.06;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.025 * level, t + 0.01);
      g.gain.linearRampToValueAtTime(0, t + 0.04);
    }
    o.connect(g); g.connect(this.nodes.master);
    o.start(now); o.stop(now + 0.3);
  }

  // Steinchen trifft die Wand
  // Bağlama-Klänge: 0 = aus, 1 = ruhig (Ağırlama, Zakir), 2 = lebhaft (Yeldirme)
  music(mode) { this.musicMode = this.on ? mode : 0; }

  pluck(freq, gain = 0.18) {
    const ctx = this.ctx;
    this.plucks ??= new Map();
    let buf = this.plucks.get(freq);
    if (!buf) {
      const sr = ctx.sampleRate, len = Math.floor(sr * 1.6), period = Math.round(sr / freq);
      buf = ctx.createBuffer(1, len, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < period; i++) d[i] = Math.random() * 2 - 1;
      // Saite: Mittelwert benachbarter Werte, leicht gedämpft – klingt hell und metallisch wie eine Bağlama
      for (let i = period; i < len; i++) d[i] = 0.498 * (d[i - period] + d[i - period + 1]);
      this.plucks.set(freq, buf);
    }
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = gain;
    s.connect(g); g.connect(this.nodes.master);
    s.start();
  }

  pebble() {
    if (!this.on) return;
    this.burst(2800, 0.05, 0.5);
  }

  async playChorus() {
    const v = this.voices;
    if (!v || !this.chorusText || !v.usesPiper('ar')) return;
    try {
      if (!this.chorusBuf) {
        this.chorusFetch ??= v.synth('ar', this.chorusText, 0.95);
        const { pcm, rate } = await this.chorusFetch;
        const b = this.ctx.createBuffer(1, pcm.length, rate);
        b.copyToChannel(pcm, 0);
        this.chorusBuf = b;
      }
    } catch { this.chorusFetch = null; return; }
    if (!this.chorus) return;
    const ctx = this.ctx, now = ctx.currentTime;
    // Viele Stimmen: versetzt, leicht höher und tiefer, gedämpft wie aus der Ferne
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1800;
    lp.connect(this.nodes.master);
    for (let i = 0; i < 7; i++) {
      const s = ctx.createBufferSource();
      s.buffer = this.chorusBuf;
      s.playbackRate.value = 0.86 + Math.random() * 0.24;
      const g = ctx.createGain();
      g.gain.value = 0.05 + Math.random() * 0.06;
      s.connect(g); g.connect(lp);
      s.start(now + Math.random() * 0.9);
    }
  }
}
