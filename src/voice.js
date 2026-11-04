// Sprachausgabe: freie Piper-Stimmen (einmal herunterladen, dann offline) oder die Stimme des Geräts.
// say([{ text, lang, rate, pitch }]) liest Abschnitte nacheinander vor; ein neuer Aufruf bricht den alten ab.

// Kostenlose, offene Stimmen aus dem Piper-Projekt (rhasspy/piper-voices). Die Dateien kommen direkt von
// Hugging Face auf das Gerät und bleiben dort gespeichert; die App selbst verteilt sie nicht.
const HF = 'https://huggingface.co/rhasspy/piper-voices';
export const PIPER = {
  de: { id: 'de_DE-thorsten-medium', dir: 'de/de_DE/thorsten/medium', name: 'Thorsten', mb: 63, license: 'CC0 1.0' },
  tr: { id: 'tr_TR-dfki-medium', dir: 'tr/tr_TR/dfki/medium', name: 'DFKI', mb: 63 },
  ar: { id: 'ar_JO-kareem-medium', dir: 'ar/ar_JO/kareem/medium', name: 'Kareem', mb: 63 },
};
for (const v of Object.values(PIPER)) {
  v.url = `${HF}/resolve/main/${v.dir}/${v.id}.onnx`;
  v.card = `${HF}/blob/main/${v.dir}/MODEL_CARD`;
}

// Probesatz je Sprache
export const SAMPLES = {
  de: 'Assalāmu ʿalaikum. Ich lese dir jeden Schritt des Gebets vor.',
  tr: 'Esselâmü aleyküm. Namazın her adımını sana okuyacağım.',
  ar: 'السَّلَامُ عَلَيْكُمْ. سَأَقْرَأُ لَكَ كُلَّ خُطْوَةٍ مِنَ الصَّلَاةِ.',
};

const CACHE = 'salah-voices-v1';
const hasSystem = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

// Umschrift für die deutsche/englische Stimme vereinfachen (ḥ → h, ā → a, ʿ weg); türkische Buchstaben bleiben.
const TRANSLIT = { ḥ: 'h', Ḥ: 'H', ṣ: 's', Ṣ: 'S', ḍ: 'd', Ḍ: 'D', ṭ: 't', Ṭ: 'T', ẓ: 'z', Ẓ: 'Z', ḏ: 'dh', ṯ: 'th', ġ: 'gh', ā: 'a', Ā: 'A', ī: 'i', Ī: 'I', ū: 'u', Ū: 'U', ʿ: '', ʾ: '', '’': '', 'ʼ': '' };
export function cleanText(text, lang) {
  let s = String(text);
  if (lang === 'ar') {
    // Koran-Pausenzeichen und Verszeichen entfernen, Alif waṣla als normales Alif
    s = s.replace(/[ۖ-ࣰۭ-ࣿ]/g, '').replace(/ٱ/g, 'ا').replace(/۝/g, '، ');
  } else if (lang !== 'tr') s = s.replace(/[ḥḤṣṢḍḌṭṬẓẒḏṯġāĀīĪūŪʿʾ’ʼ]/g, (c) => TRANSLIT[c]);
  return s.replace(/\s+/g, ' ').trim();
}

// In Sätze teilen, damit der erste Satz schnell kommt und die nächsten im Hintergrund entstehen
export function sentences(text) {
  const parts = text.match(/[^.!?؟…]+[.!?؟…]*\s*/g) || [text];
  const out = [];
  for (const p of parts.map((x) => x.trim()).filter(Boolean)) {
    if (out.length && out[out.length - 1].length < 40) out[out.length - 1] += ` ${p}`;
    else out.push(p);
  }
  return out;
}

export class Voices {
  constructor({ onChange = () => {}, enabled = true } = {}) {
    this.onChange = onChange;
    this.enabled = enabled; // freie Stimmen benutzen, wenn geladen
    this.state = {}; // lang → { status: 'none' | 'loading' | 'ready' | 'error', progress, error }
    for (const l of Object.keys(PIPER)) this.state[l] = { status: 'none', progress: 0 };
    this.gen = 0;
    this.jobId = 0;
    this.jobs = new Map();
    this.cache = new Map();
    this.source = null;
    this.ctx = null;
    this.worker = null;
    this.supported = typeof Worker !== 'undefined' && typeof caches !== 'undefined' && typeof WebAssembly !== 'undefined';
    if (this.supported) this.checkStored();
  }

  async checkStored() {
    try {
      const cache = await caches.open(CACHE);
      for (const [l, v] of Object.entries(PIPER)) {
        if (await cache.match(v.url)) this.state[l] = { status: 'ready', progress: 1 };
      }
      this.onChange();
    } catch { /* kein Cache (privater Modus) */ }
  }

  getWorker() {
    if (!this.worker) {
      this.worker = new Worker(new URL('./piper-worker.js', import.meta.url), { type: 'module' });
      this.worker.onmessage = ({ data: m }) => this.onMessage(m);
      this.worker.onerror = () => {
        for (const l of Object.keys(PIPER)) if (this.state[l].status === 'loading') this.state[l] = { status: 'error', progress: 0, error: 'worker' };
        for (const j of this.jobs.values()) j.reject(new Error('worker'));
        this.jobs.clear();
        this.worker = null;
        this.onChange();
      };
    }
    return this.worker;
  }

  onMessage(m) {
    const lang = m.voice && Object.keys(PIPER).find((l) => PIPER[l].id === m.voice);
    if (m.type === 'progress' && lang) {
      this.state[lang] = { status: 'loading', progress: m.total ? m.loaded / m.total : 0 };
      this.onChange();
    } else if (m.type === 'ready' && lang) {
      this.state[lang] = { status: 'ready', progress: 1 };
      this.onChange();
    } else if (m.type === 'removed' && lang) {
      this.state[lang] = { status: 'none', progress: 0 };
      this.onChange();
    } else if (m.type === 'audio' || m.type === 'error') {
      if (m.id != null) {
        const j = this.jobs.get(m.id);
        this.jobs.delete(m.id);
        if (j) (m.type === 'audio' ? j.resolve(m) : j.reject(new Error(m.msg)));
      } else if (lang) {
        this.state[lang] = { status: 'error', progress: 0, error: m.msg };
        this.onChange();
      }
    }
  }

  status(lang) { return this.state[lang]?.status || 'unsupported'; }
  progress(lang) { return this.state[lang]?.progress || 0; }
  usesPiper(lang) { return this.enabled && this.status(lang) === 'ready'; }

  // Gibt es für diese Sprache überhaupt eine Stimme (frei oder auf dem Gerät)?
  has(lang) {
    if (this.usesPiper(lang)) return true;
    if (!hasSystem()) return false;
    const voices = window.speechSynthesis.getVoices();
    return voices.some((v) => v.lang?.toLowerCase().startsWith(lang));
  }

  // Während die Gerätestimmen noch laden, nicht „fehlt“ melden
  missing(lang) {
    if (this.usesPiper(lang)) return false;
    if (!hasSystem()) return true;
    const voices = window.speechSynthesis.getVoices();
    return voices.length > 0 && !voices.some((v) => v.lang?.toLowerCase().startsWith(lang));
  }

  download(lang) {
    const v = PIPER[lang];
    if (!v || !this.supported || this.status(lang) === 'loading') return;
    this.state[lang] = { status: 'loading', progress: 0 };
    this.onChange();
    this.getWorker().postMessage({ type: 'download', voice: v.id, url: v.url });
  }

  remove(lang) {
    const v = PIPER[lang];
    if (!v) return;
    for (const k of [...this.cache.keys()]) if (k.startsWith(`${v.id}|`)) this.cache.delete(k);
    this.getWorker().postMessage({ type: 'remove', voice: v.id, url: v.url });
  }

  synth(lang, text, rate) {
    const v = PIPER[lang];
    const key = `${v.id}|${rate}|${text}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const id = ++this.jobId;
    const p = new Promise((resolve, reject) => {
      this.jobs.set(id, { resolve, reject });
      this.getWorker().postMessage({ type: 'synth', id, voice: v.id, url: v.url, text, rate });
    });
    this.cache.set(key, p);
    p.then(() => { p.settled = true; }, () => this.cache.delete(key));
    // Nur die letzten Sätze aufheben (Zurückblättern geht dann sofort)
    if (this.cache.size > 60) this.cache.delete(this.cache.keys().next().value);
    return p;
  }

  audioCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = AC ? new AC() : null;
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  playPcm({ pcm, rate }, { pitch = 1 } = {}) {
    const ctx = this.audioCtx();
    if (!ctx) return Promise.resolve();
    return new Promise((resolve) => {
      const buf = ctx.createBuffer(1, pcm.length, rate);
      buf.copyToChannel(pcm, 0);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      // Tiefere Stimme (Imam) über etwas langsameres Abspielen
      src.playbackRate.value = pitch;
      src.connect(ctx.destination);
      src.onended = () => { if (this.source === src) this.source = null; resolve(); };
      this.source = src;
      src.start();
    });
  }

  saySystem({ text, lang, rate = 1, pitch = 1 }) {
    if (!hasSystem()) return Promise.resolve(false);
    const synth = window.speechSynthesis;
    const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith(lang));
    if (!voice && lang === 'ar') return Promise.resolve(false); // ohne arabische Stimme lieber still
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || lang;
      u.rate = rate;
      u.pitch = pitch;
      // Manche Browser melden das Ende nie: Sicherheits-Zeitlimit
      const timer = setTimeout(() => resolve(true), 4000 + text.length * 140 / rate);
      u.onend = u.onerror = () => { clearTimeout(timer); resolve(true); };
      synth.speak(u);
    });
  }

  cancel() {
    this.gen++;
    if (this.jobId) this.worker?.postMessage({ type: 'drop', upto: this.jobId });
    // Verworfene Aufträge nicht weiter im Zwischenspeicher halten
    for (const [k, p] of [...this.cache]) if (!p.settled) this.cache.delete(k);
    try { this.source?.stop(); } catch { /* schon beendet */ }
    this.source = null;
    if (hasSystem()) window.speechSynthesis.cancel();
  }

  // Abschnitte nacheinander vorlesen. Ergebnis: false, wenn für einen Abschnitt keine Stimme da war.
  async say(segments) {
    this.cancel();
    const gen = this.gen;
    const parts = [];
    for (const s of segments) {
      const text = cleanText(s.text, s.lang);
      if (!text) continue;
      if (this.usesPiper(s.lang)) for (const x of sentences(text)) parts.push({ ...s, text: x, piper: true });
      else parts.push({ ...s, text });
    }
    // Alle freien Abschnitte gleich in Auftrag geben; der Worker arbeitet sie der Reihe nach ab
    const pending = parts.map((p) => {
      if (!p.piper) return null;
      const pr = this.synth(p.lang, p.text, p.rate || 1);
      pr.catch(() => {});
      return pr;
    });
    let ok = true;
    for (let i = 0; i < parts.length; i++) {
      if (gen !== this.gen) return ok;
      const p = parts[i];
      if (p.piper) {
        try {
          const audio = await pending[i];
          if (gen !== this.gen) return ok;
          await this.playPcm(audio, p);
        } catch {
          // Freie Stimme gescheitert: mit der Gerätestimme weiter
          if (gen !== this.gen) return ok;
          ok = (await this.saySystem(p)) && ok;
        }
      } else ok = (await this.saySystem(p)) && ok;
    }
    return ok;
  }
}
