// „Weiter ohne Tippen“: zwei Wege, im Tutorial zum nächsten Schritt zu kommen, ohne das Handy zu berühren.
//
// 1. Apple Watch und Kopfhörer: Die Seite meldet sich beim System als Wiedergabe (Media Session). Dann zeigt die
//    Uhr den aktuellen Schritt unter „Jetzt läuft“; ⏭/⏮ schalten weiter/zurück. Die Doppeltipp-Geste (Series 9 /
//    Ultra 2) und ein Druck auf AirPods lösen „Wiedergabe/Pause“ aus – das bedeutet hier ebenfalls „weiter“.
//    Funktioniert genauso mit Sperrbildschirm, Bluetooth-Kopfhörern und Medientasten.
// 2. Handgeste ohne Uhr: Die Frontkamera misst nur die Helligkeit; wird sie kurz mit der Hand abgedeckt und wieder
//    frei, geht es weiter. Es wird kein Bild gespeichert oder verschickt.

// Fast lautloser Ton in Schleife (ganz stumme Wiedergaben zeigt manches System nicht als „Jetzt läuft“ an)
function quietLoopUrl() {
  const rate = 8000, n = rate; // 1 Sekunde
  const buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(Math.sin(i * 0.3) * 2), true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

export class MediaRemote {
  constructor({ next, prev }) {
    this.next = next;
    this.prev = prev;
    this.on = false;
    this.last = 0;
    this.supported = typeof navigator !== 'undefined' && 'mediaSession' in navigator;
  }

  // Muss aus einer Berührung heraus aufgerufen werden (sonst darf die Wiedergabe nicht starten)
  start() {
    if (!this.supported) return false;
    if (!this.audio) {
      this.audio = new Audio(quietLoopUrl());
      this.audio.loop = true;
      this.audio.setAttribute('playsinline', '');
      this.audio.volume = 0.05;
    }
    this.audio.play().catch(() => {});
    const ms = navigator.mediaSession;
    const go = (fn) => () => {
      // Doppelte Meldungen (z. B. Pause + Play kurz hintereinander) nur einmal zählen
      const now = performance.now();
      if (now - this.last < 700) return;
      this.last = now;
      fn();
      this.audio.play().catch(() => {});
      ms.playbackState = 'playing';
    };
    for (const [a, fn] of [['nexttrack', this.next], ['previoustrack', this.prev], ['play', this.next], ['pause', this.next], ['seekforward', this.next], ['seekbackward', this.prev]]) {
      try { ms.setActionHandler(a, go(fn)); } catch { /* vom Browser nicht unterstützt */ }
    }
    ms.playbackState = 'playing';
    this.on = true;
    return true;
  }

  stop() {
    if (!this.on) return;
    this.on = false;
    this.audio?.pause();
    const ms = navigator.mediaSession;
    for (const a of ['nexttrack', 'previoustrack', 'play', 'pause', 'seekforward', 'seekbackward']) {
      try { ms.setActionHandler(a, null); } catch { /* nicht unterstützt */ }
    }
    ms.playbackState = 'none';
    ms.metadata = null;
  }

  // Anzeige auf Uhr und Sperrbildschirm: Schritt und Gebet
  show(title, sub) {
    if (!this.on || typeof MediaMetadata === 'undefined') return;
    const key = `${title}|${sub}`;
    if (key === this.shown) return;
    this.shown = key;
    navigator.mediaSession.metadata = new MediaMetadata({
      title, artist: sub, album: 'NamazVR',
      artwork: [{ src: new URL('../icons/icon-192.png', import.meta.url).href, sizes: '192x192', type: 'image/png' }],
    });
  }
}

// Erkennung „Hand über der Kamera“ aus der mittleren Helligkeit (0–255) je Messung.
// Gibt 'trigger' zurück, wenn die Kamera kurz abgedeckt und wieder frei wurde; 'dark', wenn es zu dunkel ist.
export function waveDetector({ minCover = 180, maxCover = 2500, cooldown = 1200 } = {}) {
  let base = null, coveredAt = null, longCover = false, lastTrigger = -1e9;
  return (mean, t) => {
    if (base == null) base = mean;
    const covered = mean < Math.max(10, base * 0.42);
    if (covered) {
      if (coveredAt == null) coveredAt = t;
      if (t - coveredAt > maxCover) longCover = true; // Handy liegt mit der Kamera nach unten o. Ä.
      return null;
    }
    // frei: Grundhelligkeit langsam nachführen
    base += (mean - base) * 0.06;
    let out = base < 22 ? 'dark' : null;
    if (coveredAt != null) {
      const held = t - coveredAt;
      if (!longCover && held >= minCover && t - lastTrigger > cooldown) { out = 'trigger'; lastTrigger = t; }
      coveredAt = null;
      longCover = false;
    }
    return out;
  };
}

export class HandWave {
  constructor({ onTrigger, onState }) {
    this.onTrigger = onTrigger;
    this.onState = onState || (() => {});
    this.supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  async start() {
    if (!this.supported || this.stream || this.starting) return;
    this.starting = true;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 160 }, height: { ideal: 120 } }, audio: false });
    } catch {
      this.starting = false;
      this.onState('denied');
      return;
    }
    this.starting = false;
    if (this.cancelled) { this.cancelled = false; this.stop(); return; }
    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.setAttribute('playsinline', '');
    video.srcObject = this.stream;
    await video.play().catch(() => {});
    const c = document.createElement('canvas');
    c.width = 24; c.height = 18;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const detect = waveDetector();
    this.video = video;
    this.onState('on');
    let dark = false;
    this.timer = setInterval(() => {
      if (video.readyState < 2) return;
      ctx.drawImage(video, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      const r = detect(sum / (d.length / 4), performance.now());
      if (r === 'trigger') this.onTrigger();
      if ((r === 'dark') !== dark) { dark = r === 'dark'; this.onState(dark ? 'dark' : 'on'); }
    }, 70);
  }

  stop() {
    if (this.starting) { this.cancelled = true; return; }
    clearInterval(this.timer);
    this.timer = null;
    for (const tr of this.stream?.getTracks() || []) tr.stop();
    this.stream = null;
    if (this.video) { this.video.srcObject = null; this.video = null; }
    this.onState('off');
  }

  get on() { return !!this.stream || !!this.starting; }
}
