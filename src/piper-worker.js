// Freie Stimmen (Piper) im Hintergrund: Lautschrift mit espeak-ng (WASM), Sprachsynthese mit ONNX Runtime.
// Läuft als Modul-Worker, damit das Vorlesen die VR-Darstellung nicht ruckeln lässt.
// Nachrichten: download {voice, url} · synth {id, voice, url, text, rate} · drop {upto} · remove {url}
// Antworten:   progress {voice, loaded, total} · ready {voice} · audio {id, pcm, rate} · error {id?, voice?, msg}

// Emscripten erkennt einen Modul-Worker sonst nicht als Worker
self.importScripts ??= () => {};

const CACHE = 'salah-voices-v1';
const base = new URL('../vendor/', import.meta.url).href;

let ortP = null;
const ort = () => (ortP ??= import(`${base}ort/ort.wasm.min.mjs`).then((m) => {
  const o = m.default || m;
  o.env.wasm.wasmPaths = `${base}ort/`;
  o.env.wasm.numThreads = 1;
  return o;
}));

// Lautschrift-Modul und seine Daten nur einmal laden, für jeden Aufruf neu instanziieren
let phonP = null;
const phonemizer = () => (phonP ??= Promise.all([
  import(`${base}piper/piper_phonemize.mjs`),
  fetch(`${base}piper/piper_phonemize.wasm`).then((r) => r.arrayBuffer()),
  fetch(`${base}piper/piper_phonemize.data`).then((r) => r.arrayBuffer()),
]).then(([m, wasm, data]) => ({ create: m.createPiperPhonemize, wasm, data })));

async function phonemeIds(text, voice) {
  const p = await phonemizer();
  return new Promise((resolve, reject) => {
    let done = false;
    p.create({
      wasmBinary: p.wasm,
      getPreloadedPackage: () => p.data,
      print: (line) => {
        if (done) return;
        try { done = true; resolve(JSON.parse(line).phoneme_ids); } catch (e) { reject(e); }
      },
      printErr: () => {},
      locateFile: (f) => `${base}piper/${f}`,
    }).then((mod) => {
      mod.callMain(['-l', voice, '--input', JSON.stringify([{ text }]), '--espeak_data', '/espeak-ng-data']);
      if (!done) reject(new Error('phonemize: keine Ausgabe'));
    }, reject);
  });
}

// Modell herunterladen (mit Fortschritt) und im Cache ablegen
async function cached(url, onProgress) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(url);
  if (hit) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, total);
  }
  const blob = new Blob(chunks);
  await cache.put(url, new Response(blob, { headers: { 'content-type': res.headers.get('content-type') || 'application/octet-stream' } }));
  return new Response(blob);
}

const sessions = new Map();
function session(url) {
  if (!sessions.has(url)) {
    const p = (async () => {
      const o = await ort();
      const config = await (await cached(`${url}.json`)).json();
      const model = await (await cached(url)).arrayBuffer();
      const s = await o.InferenceSession.create(model, { executionProviders: ['wasm'] });
      return { o, s, config };
    })();
    p.catch(() => sessions.delete(url));
    sessions.set(url, p);
  }
  return sessions.get(url);
}

async function synth(url, text, rate = 1) {
  const { o, s, config } = await session(url);
  const ids = await phonemeIds(text, config.espeak.voice);
  const inf = config.inference || {};
  const feeds = {
    input: new o.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
    input_lengths: new o.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
    scales: new o.Tensor('float32', Float32Array.from([inf.noise_scale ?? 0.667, (inf.length_scale ?? 1) / rate, inf.noise_w ?? 0.8]), [3]),
  };
  if (Object.keys(config.speaker_id_map || {}).length) feeds.sid = new o.Tensor('int64', BigInt64Array.from([0n]), [1]);
  const out = await s.run(feeds);
  return { pcm: Float32Array.from(out.output.data), rate: config.audio.sample_rate };
}

// Aufträge der Reihe nach abarbeiten; überholte (abgebrochenes Vorlesen) fallen weg
const queue = [];
let busy = false, dropUpto = 0;
async function pump() {
  if (busy) return;
  busy = true;
  while (queue.length) {
    const job = queue.shift();
    if (job.id <= dropUpto) { self.postMessage({ type: 'error', id: job.id, msg: 'dropped' }); continue; }
    try {
      const { pcm, rate } = await synth(job.url, job.text, job.rate);
      self.postMessage({ type: 'audio', id: job.id, pcm, rate }, [pcm.buffer]);
    } catch (e) {
      self.postMessage({ type: 'error', id: job.id, msg: String(e?.message || e) });
    }
  }
  busy = false;
}

self.onmessage = async ({ data: m }) => {
  if (m.type === 'synth') { queue.push(m); pump(); } else if (m.type === 'drop') {
    dropUpto = Math.max(dropUpto, m.upto);
  } else if (m.type === 'download') {
    try {
      await cached(`${m.url}.json`);
      let last = 0;
      await cached(m.url, (loaded, total) => {
        const now = Date.now();
        if (now - last > 250) { last = now; self.postMessage({ type: 'progress', voice: m.voice, loaded, total }); }
      });
      // Gleich einmal laden, damit das erste Vorlesen schnell geht
      await session(m.url);
      await phonemizer();
      self.postMessage({ type: 'ready', voice: m.voice });
    } catch (e) {
      self.postMessage({ type: 'error', voice: m.voice, msg: String(e?.message || e) });
    }
  } else if (m.type === 'remove') {
    sessions.delete(m.url);
    const cache = await caches.open(CACHE);
    await cache.delete(m.url);
    await cache.delete(`${m.url}.json`);
    self.postMessage({ type: 'removed', voice: m.voice });
  }
};
