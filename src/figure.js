import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { softShadowMap } from './environment.js';

// Betende Figur: Kopf mit ruhigem, gesenktem Blick, Bart, Gewand mit Falten, Hände mit Fingern.
// Die Gesichter lassen sich in den Einstellungen ausblenden (setFaces). Lokal blickt die Figur nach +Z.
// Winkel in Radiant: spine > 0 beugt nach vorn, hip < 0 hebt den Oberschenkel nach vorn,
// knee > 0 beugt den Unterschenkel nach hinten, shZ/elZ > 0 = nach außen.
export const POSES = {
  stand:   { y: 0.95, spine: 0,    headX: 0.2,  headY: 0,    shX: 0,     shZ: 0.08, elX: -0.1,  elZ: 0,    hip: 0,     knee: 0 },
  takbir:  { y: 0.95, spine: 0,    headX: 0.15, headY: 0,    shX: -0.25, shZ: 0.55, elX: -2.6,  elZ: 0,    hip: 0,     knee: 0 },
  qiyam:   { y: 0.95, spine: 0,    headX: 0.25, headY: 0,    shX: -0.25, shZ: -0.1, elX: -1.45, elZ: -0.9, hip: 0,     knee: 0 },
  ruku:    { y: 0.93, spine: 1.45, headX: 0,    headY: 0,    shX: -0.71, shZ: 0.08, elX: 0,     elZ: 0,    hip: 0,     knee: 0 },
  sujud:   { y: 0.46, spine: 2.2,  headX: 0.1,  headY: 0,    shX: -3.3,  shZ: 0.35, elX: 1.9,   elZ: 0,    hip: -0.3,  knee: 1.87 },
  sit:     { y: 0.24, spine: 0.05, headX: 0.25, headY: 0,    shX: -0.5,  shZ: 0.05, elX: -0.9,  elZ: 0,    hip: -1.25, knee: 2.82 },
  taslimR: { y: 0.24, spine: 0.05, headX: 0.1,  headY: -1.1, shX: -0.5,  shZ: 0.05, elX: -0.9,  elZ: 0,    hip: -1.25, knee: 2.82 },
  taslimL: { y: 0.24, spine: 0.05, headX: 0.1,  headY: 1.1,  shX: -0.5,  shZ: 0.05, elX: -0.9,  elZ: 0,    hip: -1.25, knee: 2.82 },
  // Umre und Hac: Istilām (Hände zum Schwarzen Stein), Werfen (rechte Hand), Trinken, Steinchen aufheben
  istilam: { y: 0.95, spine: 0, headX: 0.1, headY: 0, shX: -1.25, shZ: 0.3, elX: -1.1, elZ: 0, hip: 0, knee: 0 },
  throw:   { y: 0.95, spine: -0.05, headX: 0, headY: 0, shX: 0, shZ: 0.08, elX: -0.1, elZ: 0, hip: 0, knee: 0, right: { shX: -2.7, elX: -0.5 } },
  drink:   { y: 0.95, spine: 0, headX: -0.15, headY: 0, shX: 0, shZ: 0.08, elX: -0.1, elZ: 0, hip: 0, knee: 0, right: { shX: -0.75, elX: -2.1 } },
  pick:    { y: 0.72, spine: 1.25, headX: 0.2, headY: 0, shX: -1.1, shZ: 0.1, elX: -0.2, elZ: 0, hip: -0.6, knee: 1.0 },
  // Alevilik: Niyaz (leichte Verneigung, rechte Hand auf dem Herzen), Semah (Arme wie Flügel), im Kreis sitzen
  niyaz:   { y: 0.95, spine: 0.35, headX: 0.35, headY: 0, shX: 0, shZ: 0.08, elX: -0.1, elZ: 0, hip: 0, knee: 0, right: { shX: -0.55, elX: -1.9 } },
  semah:   { y: 0.95, spine: 0.05, headX: 0.1, headY: 0, shX: -0.55, shZ: 1.0, elX: -0.55, elZ: 0.2, hip: 0, knee: 0 },
  semahFast: { y: 0.95, spine: 0.1, headX: 0.05, headY: 0, shX: -0.45, shZ: 1.25, elX: -0.35, elZ: 0.2, hip: 0, knee: 0 },
  // Cem: Niyaz im Sitzen (Verneigung, rechte Hand auf dem Herzen), Bağlama spielen, Tablett tragen, Kehren
  sitNiyaz: { y: 0.24, spine: 0.5, headX: 0.45, headY: 0, shX: -0.55, shZ: 0.05, elX: -0.7, elZ: 0, hip: -1.25, knee: 2.82, right: { shX: -0.5, elX: -1.95 } },
  sitPlay: { y: 0.24, spine: 0.12, headX: 0.35, headY: 0, shX: -0.95, shZ: 0.35, elX: -1.25, elZ: 0, hip: -1.25, knee: 2.82, right: { shX: -0.45, elX: -1.35 } },
  tray:    { y: 0.95, spine: 0.05, headX: 0.3, headY: 0, shX: -0.3, shZ: 0.12, elX: -1.45, elZ: 0, hip: 0, knee: 0 },
  sweep:   { y: 0.9, spine: 0.55, headX: 0.35, headY: 0, shX: -0.75, shZ: 0.1, elX: -0.35, elZ: 0, hip: -0.15, knee: 0.25 },
  // Salām im Stehen (Totengebet)
  salamStandR: { y: 0.95, spine: 0, headX: 0.15, headY: -1.1, shX: 0, shZ: 0.08, elX: -0.1, elZ: 0, hip: 0, knee: 0 },
  salamStandL: { y: 0.95, spine: 0, headX: 0.15, headY: 1.1,  shX: 0, shZ: 0.08, elX: -0.1, elZ: 0, hip: 0, knee: 0 },
  dua:     { y: 0.95, spine: 0,    headX: 0.3,  headY: 0,    shX: -0.35, shZ: 0.12, elX: -1.35, elZ: 0.1,  hip: 0,     knee: 0 },
  // Haltungen für die Gebetswaschung
  wash:    { y: 0.95, spine: 0.15, headX: 0.4,  headY: 0,    shX: -0.45, shZ: -0.05, elX: -1.1, elZ: -0.75, hip: 0,    knee: 0 },
  face:    { y: 0.95, spine: 0.1,  headX: 0.1,  headY: 0,    shX: -0.75, shZ: 0.05, elX: -2.35, elZ: -0.45, hip: 0,    knee: 0 },
  head:    { y: 0.95, spine: 0.05, headX: 0.2,  headY: 0,    shX: -2.3,  shZ: 0.45, elX: -1.5,  elZ: -0.3, hip: 0,     knee: 0 },
  // Bittgebet im Sitzen nach dem Gebet (Gemeinde)
  // Im Sitzen beten: auf dem Boden (Beine wie beim Sitzen) und auf dem Stuhl (Oberschenkel waagerecht)
  floorTakbir: { y: 0.24, spine: 0.02, headX: 0.15, headY: 0, shX: -0.25, shZ: 0.55, elX: -2.6, elZ: 0, hip: -1.25, knee: 2.82 },
  floorQiyam:  { y: 0.24, spine: 0.02, headX: 0.25, headY: 0, shX: -0.25, shZ: -0.1, elX: -1.45, elZ: -0.9, hip: -1.25, knee: 2.82 },
  floorRuku:   { y: 0.24, spine: 0.55, headX: 0.15, headY: 0, shX: -0.75, shZ: 0.05, elX: -0.35, elZ: 0, hip: -1.25, knee: 2.82 },
  floorSujud:  { y: 0.24, spine: 0.95, headX: 0.1, headY: 0, shX: -1.05, shZ: 0.08, elX: -0.25, elZ: 0, hip: -1.25, knee: 2.82 },
  chair:       { y: 0.5, spine: 0.05, headX: 0.25, headY: 0, shX: -0.5, shZ: 0.05, elX: -0.9, elZ: 0, hip: -1.57, knee: 1.57 },
  chairTakbir: { y: 0.5, spine: 0.02, headX: 0.15, headY: 0, shX: -0.25, shZ: 0.55, elX: -2.6, elZ: 0, hip: -1.57, knee: 1.57 },
  chairQiyam:  { y: 0.5, spine: 0.02, headX: 0.25, headY: 0, shX: -0.25, shZ: -0.1, elX: -1.45, elZ: -0.9, hip: -1.57, knee: 1.57 },
  chairDua:    { y: 0.5, spine: 0.05, headX: 0.35, headY: 0, shX: -0.6, shZ: 0.15, elX: -1.5, elZ: 0.1, hip: -1.57, knee: 1.57 },
  chairRuku:   { y: 0.5, spine: 0.5, headX: 0.15, headY: 0, shX: -0.85, shZ: 0.05, elX: -0.45, elZ: 0, hip: -1.57, knee: 1.57 },
  chairSujud:  { y: 0.5, spine: 0.95, headX: 0.1, headY: 0, shX: -1.2, shZ: 0.08, elX: -0.35, elZ: 0, hip: -1.57, knee: 1.57 },
  chairTaslimR: { y: 0.5, spine: 0.05, headX: 0.1, headY: -1.1, shX: -0.5, shZ: 0.05, elX: -0.9, elZ: 0, hip: -1.57, knee: 1.57 },
  chairTaslimL: { y: 0.5, spine: 0.05, headX: 0.1, headY: 1.1, shX: -0.5, shZ: 0.05, elX: -0.9, elZ: 0, hip: -1.57, knee: 1.57 },
  sitDua:  { y: 0.24, spine: 0.05, headX: 0.35, headY: 0,    shX: -0.6,  shZ: 0.15, elX: -1.5,  elZ: 0.1,  hip: -1.25, knee: 2.82 },
  // Füße waschen im Sitzen auf dem Hocker: Oberschenkel waagerecht, vorgebeugt, Hände an den Füßen
  footWash:{ y: 0.5,  spine: 0.75, headX: 0.35, headY: 0,    shX: -0.95, shZ: 0.12, elX: -0.25, elZ: 0,    hip: -1.55, knee: 1.55 },
  feet:    { y: 0.82, spine: 1.15, headX: -0.2, headY: 0,    shX: -1.0,  shZ: 0.1,  elX: -0.2,  elZ: 0,    hip: -0.35, knee: 0.6 },
};
// Zwischenhaltungen für natürliche Übergänge (werden nicht als Schritt angezeigt):
// crouch = in die Knie gehen, kneel = Knie auf dem Boden, Oberkörper aufrecht, handsDown = kniend, Hände am Boden
const VIA = {
  crouch:    { y: 0.76, spine: 0.32, headX: 0.3,  headY: 0, shX: -0.4,  shZ: 0.1,  elX: -0.3,  elZ: 0, hip: -0.75, knee: 1.45 },
  kneel:     { y: 0.55, spine: 0.12, headX: 0.35, headY: 0, shX: -0.15, shZ: 0.1,  elX: -0.35, elZ: 0, hip: -0.05, knee: 1.62 },
  handsDown: { y: 0.5,  spine: 1.1,  headX: 0.25, headY: 0, shX: -1.3,  shZ: 0.12, elX: -0.05, elZ: 0, hip: -0.45, knee: 2.0 },
};
// Rechter Arm (side −1) hat eigene Schlüssel, damit Haltungen wie „Werfen“ weich ein- und ausgeblendet werden
const full = (p) => { const { right, ...rest } = p; return { ...rest, rshX: right?.shX ?? p.shX, relX: right?.elX ?? p.elX }; };
for (const k of Object.keys(POSES)) POSES[k] = full(POSES[k]);
for (const k of Object.keys(VIA)) VIA[k] = full(VIA[k]);
const KEYS = Object.keys(POSES.stand);
const SIT = new Set(['sit', 'taslimR', 'taslimL', 'sitDua', 'sitNiyaz', 'sitPlay']);
const kind = (name, p) => (name === 'sujud' ? 'sujud' : SIT.has(name) ? 'sit' : p.y > 0.8 && p.hip > -0.4 ? 'stand' : 'other');
// Reihenfolge wie beim Beten: zur Niederwerfung erst die Knie, dann die Hände, dann die Stirn – beim Aufstehen umgekehrt
const PATHS = {
  'stand>sujud': ['crouch', 'kneel', 'handsDown'],
  'stand>sit': ['crouch', 'kneel'],
  'sujud>sit': ['handsDown'],
  'sit>sujud': ['handsDown'],
  'sujud>stand': ['handsDown', 'kneel', 'crouch'],
  'sit>stand': ['kneel', 'crouch'],
};
const smooth = (k) => k * k * (3 - 2 * k);
const ramp = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// --- Gewand als eine durchgehende Haut über dem Skelett (keine sichtbaren Übergänge an Schulter, Ellbogen, Hüfte) ---
// Knochen: 0 Becken, 1 Rücken, 2/3 linke Schulter/Ellbogen, 4/5 rechte, 6/7 linke Hüfte/Knie, 8/9 rechte
const Y0 = 0.95; // Höhe des Beckens in der Grundhaltung
const sx = (build) => 0.2 * build + 0.008;
class SkinBuilder {
  constructor() { this.pos = []; this.uv = []; this.si = []; this.sw = []; this.idx = []; this.seams = []; }
  vert(x, y, z, u, v, w) {
    const list = w.filter(([, k]) => k > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = list.reduce((a, [, k]) => a + k, 0) || 1;
    while (list.length < 4) list.push([0, 0]);
    this.pos.push(x, y, z); this.uv.push(u, v);
    for (const [b, k] of list) { this.si.push(b); this.sw.push(k / sum); }
    return this.pos.length / 3 - 1;
  }
  // rings: [{ y, cx, cz, rx, rz }] von unten nach oben; weight(x, y, z) → [[Knochen, Gewicht], …]
  tube(rings, seg, weight, { n = 2, capTop = null, capBottom = null, uRep = 1 } = {}) {
    const start = this.pos.length / 3;
    const pe = 2 / n;
    rings.forEach((r) => {
      const first = this.pos.length / 3;
      for (let j = 0; j <= seg; j++) {
        const a = (j / seg) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
        const x = r.cx + r.rx * Math.sign(c) * Math.abs(c) ** pe, z = r.cz + r.rz * Math.sign(sn) * Math.abs(sn) ** pe;
        this.vert(x, r.y, z, (j / seg) * uRep, r.y * 1.4, weight(x, r.y, z));
      }
      this.seams.push([first, first + seg]);
    });
    const S = seg + 1;
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < seg; j++) {
      const a = start + i * S + j, b = a + 1, c = a + S, d = c + 1;
      this.idx.push(a, c, b, b, c, d);
    }
    const cap = (r, y, top) => {
      const base = start + (top ? rings.length - 1 : 0) * S;
      const ctr = this.vert(r.cx, y, r.cz, 0.5, y * 1.4, weight(r.cx, y, r.cz));
      for (let j = 0; j < seg; j++) {
        if (top) this.idx.push(base + j, ctr, base + j + 1);
        else this.idx.push(base + j, base + j + 1, ctr);
      }
    };
    if (capTop != null) cap(rings[rings.length - 1], capTop, true);
    if (capBottom != null) cap(rings[0], capBottom, false);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    // Naht jedes Rings: gleiche Normale auf beiden Seiten, damit keine Linie zu sehen ist
    const nrm = g.attributes.normal;
    for (const [a, b] of this.seams) {
      const v = new THREE.Vector3(nrm.getX(a) + nrm.getX(b), nrm.getY(a) + nrm.getY(b), nrm.getZ(a) + nrm.getZ(b)).normalize();
      nrm.setXYZ(a, v.x, v.y, v.z); nrm.setXYZ(b, v.x, v.y, v.z);
    }
    return g;
  }
}
// Oberkörper und Ärmel (eine Haut) sowie die Beine (eigene Haut, beim Stehen vom langen Gewand verdeckt)
function bodyGeometry(build) {
  const up = new SkinBuilder(), legs = new SkinBuilder();
  const dz = 0.85 + 0.15 * build, SX = sx(build), shY = Y0 + 0.452;
  // Oberkörper: unten Becken, oben Rücken; an den Schultern ein Teil des Arms, damit die Schulter mitgeht
  const torso = [[-0.09, 0.172, 0.126], [0, 0.185, 0.134], [0.12, 0.195, 0.135], [0.25, 0.2, 0.135], [0.34, 0.212, 0.136],
    [0.395, 0.23, 0.13], [0.43, 0.228, 0.122], [0.455, 0.205, 0.11], [0.477, 0.16, 0.092], [0.497, 0.1, 0.07], [0.512, 0.06, 0.055]]
    .map(([y, rx, rz]) => ({ y: Y0 + y, cx: 0, cz: 0, rx: rx * build, rz: rz * dz }));
  up.tube(torso, 28, (x, y) => {
    const ys = y - Y0, ws = ramp(-0.06, 0.16, ys);
    const wa = ramp(0.13 * build, 0.22 * build, Math.abs(x)) * ramp(0.33, 0.42, ys) * 0.55;
    const arm = x > 0 ? 2 : 4;
    return [[0, 1 - ws], [1, ws * (1 - wa)], [arm, ws * wa]];
  }, { n: 2.35, capTop: Y0 + 0.52, capBottom: Y0 - 0.1, uRep: 2 });
  // Ärmel: von innerhalb der Schulter bis zum Handgelenk; Ellbogen weich zwischen Ober- und Unterarm
  for (const side of [1, -1]) {
    const cx = SX * side, sh = side > 0 ? 2 : 4, el = sh + 1;
    const rings = [[-0.565, 0.046, 0.044], [-0.555, 0.05, 0.048], [-0.45, 0.048, 0.047], [-0.34, 0.05, 0.05], [-0.3, 0.052, 0.052],
      [-0.26, 0.054, 0.053], [-0.15, 0.058, 0.057], [-0.06, 0.062, 0.06], [0, 0.06, 0.062], [0.03, 0.05, 0.055]]
      .map(([y, rx, rz]) => ({ y: shY + y, cx, cz: 0, rx, rz }));
    up.tube(rings, 16, (x, y) => {
      const ys = y - shY, we = ramp(-0.27, -0.33, ys), wsh = ramp(0.03, -0.06, ys) * (1 - we);
      return [[1, 1 - we - wsh], [sh, wsh], [el, we]];
    }, { capTop: shY + 0.05, capBottom: shY - 0.56 });
  }
  // Beine (Gewand über den Beinen): oben Becken, Hüfte, Knie weich
  for (const side of [1, -1]) {
    const cx = 0.1 * side, hy = Y0 - 0.02, hip = side > 0 ? 6 : 8, knee = hip + 1;
    const rings = [[-0.875, 0.1, 0.1], [-0.865, 0.104, 0.104], [-0.8, 0.096, 0.096], [-0.6, 0.088, 0.09], [-0.45, 0.09, 0.092],
      [-0.3, 0.096, 0.096], [-0.12, 0.101, 0.1], [0, 0.106, 0.104], [0.06, 0.098, 0.1]]
      .map(([y, rx, rz]) => ({ y: hy + y, cx, cz: 0, rx: rx * (0.9 + 0.1 * build), rz }));
    legs.tube(rings, 16, (x, y) => {
      const ys = y - hy, wk = ramp(-0.41, -0.49, ys), wh = ramp(0.05, -0.08, ys) * (1 - wk);
      return [[0, 1 - wk - wh], [hip, wh], [knee, wk]];
    }, { capTop: hy + 0.09, capBottom: hy - 0.875 });
  }
  return { upper: up.geometry(), legs: legs.geometry() };
}

// Stoff: weiche senkrechte Falten und feines Gewebe – wird mit der Gewandfarbe multipliziert
let clothTex = null;
function cloth() {
  if (clothTex) return clothTex;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 256, 256);
  // Falten: unregelmäßige dunklere und hellere Streifen
  let x = 0, seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (x < 256) {
    const w = 26 + rnd() * 44, g = ctx.createLinearGradient(x, 0, x + w, 0), d = 0.025 + rnd() * 0.055;
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(0,0,0,${d})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x, 0, w, 256);
    x += w * (0.8 + rnd() * 0.9);
  }
  // Gewebe: feines Rauschen
  const img = ctx.getImageData(0, 0, 256, 256);
  for (let i = 0; i < img.data.length; i += 4) { const n = (rnd() - 0.5) * 9; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
  ctx.putImageData(img, 0, 0);
  clothTex = new THREE.CanvasTexture(c);
  clothTex.colorSpace = THREE.SRGBColorSpace;
  clothTex.wrapS = clothTex.wrapT = THREE.RepeatWrapping;
  clothTex.repeat.set(1, 1);
  clothTex.anisotropy = 4;
  return clothTex;
}
const IHRAM = new THREE.MeshStandardMaterial({ color: 0xfdfdfb, roughness: 0.9 });

// Gesichter an/aus (Einstellungen): wer möchte, betet mit gesichtslosen Figuren
const FACES = { on: true };
export const setFaces = (on) => { FACES.on = !!on; };

// Bewegung in den Wasch-Haltungen: [Gelenk, Ausschlag, Tempo] – Hände reiben, Gesicht waschen, über den Kopf wischen
const MOTION = {
  wash: [['elZ', 0.22, 6], ['shX', 0.06, 6]],
  face: [['elX', 0.16, 3.5], ['shZ', 0.05, 3.5]],
  head: [['shX', 0.22, 2.2], ['elX', 0.15, 2.2]],
  feet: [['elZ', 0.2, 5.5], ['shX', 0.08, 5.5]],
  footWash: [['elZ', 0.2, 5.5], ['shX', 0.1, 5.5]],
  // Semah: Arme heben und senken sich wie Kranichflügel
  semah: [['shZ', 0.35, 1.8], ['shX', 0.25, 1.8], ['spine', 0.05, 1.8]],
  semahFast: [['shZ', 0.3, 3.6], ['shX', 0.25, 3.6], ['spine', 0.06, 3.6]],
};

// Geometrien und Materialien werden zwischen allen Figuren geteilt (eine ganze Gemeinde bleibt so leicht).
const GEO = new Map(), MAT = new Map();
const geo = (key, make) => GEO.get(key) || GEO.set(key, make()).get(key);
const mat = (color, roughness, fabric = false) => {
  const key = `${color}/${roughness}/${fabric}`;
  return MAT.get(key) || MAT.set(key, new THREE.MeshStandardMaterial({ color, roughness, map: fabric ? cloth() : null })).get(key);
};
// Mehrere Teile zu einer Geometrie verbinden (weniger Zeichenaufrufe bei einer ganzen Gemeinde)
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
function merged(parts) {
  return mergeGeometries(parts.map(([g, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]]) => {
    const c = g.index ? g.toNonIndexed() : g.clone();
    for (const name of Object.keys(c.attributes)) if (!['position', 'normal', 'uv'].includes(name)) c.deleteAttribute(name);
    c.applyMatrix4(M4.compose(new THREE.Vector3(...pos), Q.setFromEuler(E.set(...rot)), new THREE.Vector3(...scale)));
    return c;
  }));
}
const BLOB = {};
const HAIRS = [0x2b1d14, 0x1c1512, 0x3a2a1c, 0x4a3524, 0x6e6a66, 0x9a968f];
const darker = (hex, k = 0.82) => new THREE.Color(hex).multiplyScalar(k).getHex();

export class Guide {
  // robe/skin/scarf: Farben, cap: Gebetsmütze bei Männern, scale: Körpergröße
  // beard: Bart bei Männern, build: Statur (schmal < 1 < kräftig) – ohne Angabe bei jeder Figur etwas anders
  constructor({ robe: robeColor = 0xddd6c4, skin: skinColor = 0xc9a988, scarf: scarfColor = 0x5f7f86, cap: capOn = true, scale = 1,
    hair: hairColor = HAIRS[Math.floor(Math.random() * HAIRS.length)], beard = Math.random() < 0.65, build = 0.94 + Math.random() * 0.18 } = {}) {
    this.group = new THREE.Group();
    this.group.scale.setScalar(scale);
    this.capOn = capOn;
    this.beardOn = beard;
    this.phase = Math.random() * 6.28;
    // Wie schnell die Haltung wechselt, und kleine persönliche Abweichungen davon
    this.speed = 4;
    this.vary = null;
    const robe = mat(robeColor, 0.85, true);
    const skin = mat(skinColor, 0.62);
    const capMat = mat(0xf7f5ef, 0.95, true);

    // Skelett: Becken (root) → Rücken (spine) → Schultern/Ellbogen; Becken → Hüften/Knie
    this.root = new THREE.Bone();
    this.root.position.y = Y0;
    this.group.add(this.root);
    this.spine = new THREE.Bone();
    this.root.add(this.spine);
    const dz = 0.85 + 0.15 * build;
    // Kragen und Knopfleiste (etwas dunkler als das Gewand)
    const trimMat = mat(darker(robeColor), 0.85);
    const collar = new THREE.Mesh(geo('collar', () => new THREE.TorusGeometry(0.058, 0.014, 8, 20)), trimMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.505;
    const placket = new THREE.Mesh(geo('placket', () => new THREE.BoxGeometry(0.016, 0.2, 0.006)), trimMat);
    placket.position.set(0, 0.36, 0.137 * dz + 0.002);
    placket.rotation.x = -0.1;
    this.trim = [collar, placket];
    this.spine.add(collar, placket);
    // Langes Gewand (Cübbe) von der Hüfte bis zu den Knöcheln – sichtbar, solange die Beine gestreckt sind
    this.skirt = new THREE.Mesh(geo('skirt3', () => {
      // von unten nach oben, damit die Außenseite nach außen zeigt; der Saum reicht bis knapp über den Boden
      const prof = [[0, -0.91], [0.25, -0.91], [0.258, -0.89], [0.24, -0.65], [0.215, -0.35], [0.198, -0.1], [0.192, 0.02], [0.17, 0.05], [0, 0.05]];
      return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 32);
    }), robe);
    this.skirt.scale.set(1.1 * build, 1, 0.84 * dz);
    this.root.add(this.skirt);

    this.head = new THREE.Group();
    this.head.position.y = 0.53;
    this.spine.add(this.head);
    const neck = new THREE.Mesh(geo('neck2', () => new THREE.CylinderGeometry(0.046, 0.056, 0.1, 14)), skin);
    neck.position.y = 0.02;
    // Kopf: Schädel und Kiefer als eine Form, dazu Ohren und Nase
    const headMesh = new THREE.Mesh(geo('head2', () => merged([
      [new THREE.SphereGeometry(0.105, 24, 18), [0, 0.135, 0], [0, 0, 0], [0.9, 1.02, 1]],
      [new THREE.SphereGeometry(0.072, 20, 14), [0, 0.072, 0.022], [0, 0, 0], [0.98, 1, 1.02]],
      [new THREE.SphereGeometry(0.022, 10, 8), [0.094, 0.125, -0.005], [0, 0, 0], [0.45, 1.25, 0.9]],
      [new THREE.SphereGeometry(0.022, 10, 8), [-0.094, 0.125, -0.005], [0, 0, 0], [0.45, 1.25, 0.9]],
      [new THREE.SphereGeometry(0.02, 10, 8), [0, 0.112, 0.102], [0, 0, 0], [0.85, 1.5, 1]],
      [new THREE.SphereGeometry(0.014, 8, 6), [0, 0.097, 0.108], [0, 0, 0], [1.5, 0.8, 0.9]],
    ])), skin);
    // Gesicht: gesenkter, ruhiger Blick (Augen fast geschlossen), Brauen, Mund
    const faceMat = mat(0x2a1d17, 0.7);
    const eyes = new THREE.Mesh(geo('faceDark', () => merged([
      [new THREE.SphereGeometry(0.014, 10, 6), [0.036, 0.133, 0.091], [0.15, 0, -0.08], [1.25, 0.28, 0.5]],
      [new THREE.SphereGeometry(0.014, 10, 6), [-0.036, 0.133, 0.091], [0.15, 0, 0.08], [1.25, 0.28, 0.5]],
      [new THREE.CapsuleGeometry(0.004, 0.026, 3, 6), [0.036, 0.158, 0.092], [0, 0, Math.PI / 2 - 0.12], [1, 1, 0.8]],
      [new THREE.CapsuleGeometry(0.004, 0.026, 3, 6), [-0.036, 0.158, 0.092], [0, 0, Math.PI / 2 + 0.12], [1, 1, 0.8]],
    ])), faceMat);
    const mouth = new THREE.Mesh(geo('mouth', () => merged([[new THREE.CapsuleGeometry(0.0035, 0.03, 3, 6), [0, 0.07, 0.093], [0, 0, Math.PI / 2], [1, 1, 0.8]]])), mat(darker(skinColor, 0.62), 0.7));
    this.face = new THREE.Group();
    this.face.add(eyes, mouth);
    const cap = new THREE.Mesh(geo('cap2', () => new THREE.SphereGeometry(0.108, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.35)), capMat);
    cap.position.y = 0.152;
    cap.scale.set(0.92, 1, 1.02);
    // Kopftuch: umschließt den Kopf, lässt das Gesicht frei und fällt über Hals und Schultern
    const scarfMat = mat(scarfColor, 0.9, true);
    const hood = new THREE.Mesh(geo('hood2', () => merged([
      // Seiten und Hinterkopf (vorn offen)
      [new THREE.SphereGeometry(0.122, 28, 16, Math.PI / 2 + 0.78, Math.PI * 2 - 1.56), [0, 0.125, -0.008], [0, 0, 0], [0.98, 1.12, 1.06]],
      // Stirn und Oberkopf
      [new THREE.SphereGeometry(0.1235, 28, 10, 0, Math.PI * 2, 0, 1.02), [0, 0.125, -0.008], [0, 0, 0], [0.98, 1.12, 1.06]],
      // Tuch unter dem Kinn über Hals und Schultern
      [new THREE.CylinderGeometry(0.1, 0.215, 0.19, 24), [0, -0.05, 0.004]],
    ])), scarfMat);
    this.scarf = new THREE.Group();
    this.scarf.add(hood);
    this.scarf.visible = false;
    this.cap = cap;
    // Haar: kurz für Männer, für Frauen ohne Kopftuch zusätzlich langes Haar am Hinterkopf
    const hairMat = mat(hairColor, 0.8);
    const hairTop = new THREE.Mesh(geo('hairTop2', () => new THREE.SphereGeometry(0.109, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.56)), hairMat);
    hairTop.position.set(0, 0.138, -0.01);
    hairTop.rotation.x = -0.42;
    hairTop.scale.set(0.92, 1.02, 1.02);
    const hairLong = new THREE.Mesh(geo('hairLong', () => new THREE.CapsuleGeometry(0.07, 0.16, 6, 14)), hairMat);
    hairLong.position.set(0, 0.03, -0.075);
    hairLong.scale.set(1.25, 1, 0.55);
    this.hair = new THREE.Group();
    this.hair.add(hairTop, hairLong);
    this.hairLong = hairLong;
    this.hair.visible = false;
    // Bart: Kinn und Wangen, dazu ein Schnurrbart
    this.beard = new THREE.Mesh(geo('beard', () => merged([
      [new THREE.SphereGeometry(0.077, 20, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), [0, 0.068, 0.02], [0.12, 0, 0], [1.0, 1.05, 1.06]],
      [new THREE.CapsuleGeometry(0.006, 0.034, 3, 6), [0, 0.083, 0.097], [0, 0, Math.PI / 2], [1, 1, 0.9]],
    ])), hairMat);
    this.beard.visible = false;
    this.head.add(neck, headMesh, this.face, cap, this.scarf, this.hair, this.beard);

    this.arms = [1, -1].map((side) => {
      const sh = new THREE.Bone();
      sh.position.set(sx(build) * side, 0.452, 0);
      const el = new THREE.Bone();
      el.position.y = -0.3;
      // Hand: Handfläche, vier Finger (leicht gebeugt) und Daumen – als eine Form
      const hand = new THREE.Mesh(geo(`hand3${side}`, () => merged([
        [new THREE.CapsuleGeometry(0.03, 0.035, 5, 10), [0, -0.3, 0], [0, 0, 0], [1.2, 1, 0.5]],
        ...[-1.5, -0.5, 0.5, 1.5].map((k) => [new THREE.CapsuleGeometry(0.0085, 0.05, 3, 6), [k * 0.0165, -0.365 + Math.abs(k) * 0.004, 0.006], [0.22, 0, k * -0.04], [1, 1, 1]]),
        [new THREE.CapsuleGeometry(0.0105, 0.034, 3, 6), [-0.04 * side, -0.305, 0.012], [0.2, 0, 0.6 * side], [1, 1, 1]],
      ])), skin);
      el.add(hand);
      sh.add(el);
      this.spine.add(sh);
      return { side, sh, el };
    });

    this.legs = [1, -1].map((side) => {
      const hip = new THREE.Bone();
      hip.position.set(0.1 * side, -0.02, 0);
      const knee = new THREE.Bone();
      knee.position.y = -0.45;
      // Fuß in Socken: Ferse, Mittelfuß und Zehen
      const foot = new THREE.Mesh(geo('foot3', () => merged([
        [new THREE.CapsuleGeometry(0.04, 0.12, 5, 10), [0, 0, 0.06], [Math.PI / 2, 0, 0], [1, 1, 0.62]],
        [new THREE.SphereGeometry(0.04, 10, 8), [0, 0.008, -0.01], [0, 0, 0], [0.95, 0.9, 1]],
        [new THREE.SphereGeometry(0.036, 10, 8), [0, -0.004, 0.14], [0, 0, 0], [1.15, 0.6, 0.9]],
      ])), mat(0xeeeae0, 0.95, true));
      foot.position.set(0, -0.455, 0);
      foot.userData.figure = true;
      knee.add(foot);
      hip.add(knee);
      this.root.add(hip);
      return { hip, knee };
    });

    // Haut an das Skelett binden (Grundhaltung: alle Gelenke gerade, Arme hängen)
    const bq = Math.round(build * 20) / 20;
    const body = geo(`body${bq}`, () => bodyGeometry(bq));
    const bones = [this.root, this.spine, this.arms[0].sh, this.arms[0].el, this.arms[1].sh, this.arms[1].el,
      this.legs[0].hip, this.legs[0].knee, this.legs[1].hip, this.legs[1].knee];
    this.group.updateMatrixWorld(true);
    const skeleton = new THREE.Skeleton(bones);
    this.upper = new THREE.SkinnedMesh(body.upper, robe);
    this.legMesh = new THREE.SkinnedMesh(body.legs, robe);
    for (const m of [this.upper, this.legMesh]) {
      this.group.add(m);
      m.bind(skeleton);
      // Beim Niederwerfen liegt die Figur weit außerhalb der Grundhaltung – nicht wegschneiden
      m.frustumCulled = false;
    }

    this.t = 0;
    this.shown = {};
    this.group.traverse((o) => { if (o.isMesh) o.userData.figure = true; });
    // Weicher Schatten auf dem Boden unter der Figur (wächst beim Sitzen und Niederwerfen nach vorn)
    BLOB.mat ||= new THREE.MeshBasicMaterial({ map: softShadowMap(), transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    BLOB.geo ||= new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    this.blob = new THREE.Mesh(BLOB.geo, BLOB.mat);
    this.blob.position.y = 0.007;
    this.blob.renderOrder = 1;
    this.group.add(this.blob);
    this.robeMat = robe;
    this.robeMeshes = [];
    this.group.traverse((o) => { if (o.isMesh && o.material === robe) this.robeMeshes.push(o); });
    this.cur = { ...POSES.stand };
    this.path = null;
    this.pose = 'stand';
    this.apply(this.cur);
  }

  // opts.scarf = false: Frau ohne Kopftuch (z. B. im Cemevi)
  setGender(g, opts = {}) {
    this.gender = g;
    if (opts.scarf !== undefined) this.noScarf = opts.scarf === false;
    this.scarf.visible = g === 'f' && !this.noScarf;
    this.cap.visible = g !== 'f' && this.capOn && !this.ihram;
    // Unter der Kappe schaut das Haar an den Seiten hervor; unter dem Kopftuch sieht man es nicht
    this.hair.visible = !this.scarf.visible;
    this.hairLong.visible = g === 'f';
    this.beard.visible = g !== 'f' && this.beardOn;
  }

  // Iḥrām: Männer in zwei weißen Tüchern ohne Kopfbedeckung (Frauen bleiben in ihrer bedeckten Kleidung)
  setIhram(on) {
    this.ihram = on;
    if (!this.ghostMat) {
      const white = on && this.gender !== 'f';
      IHRAM.map ||= cloth();
      for (const m of this.robeMeshes) m.material = white ? IHRAM : this.robeMat;
      for (const m of this.trim) m.visible = !white;
    }
    this.setGender(this.gender || 'm');
  }

  // Neue Haltung: Weg über passende Zwischenhaltungen, mit weichem Anfang und Ende und gleichmäßigem Tempo dazwischen
  setPose(name) {
    if (name === this.pose && (this.path || this.settled)) return;
    const base = POSES[name] || POSES.stand;
    const add = (p) => {
      if (!this.vary) return p;
      const q = { ...p };
      for (const [k, d] of Object.entries(this.vary)) { q[k] += d; if (k === 'shX') q.rshX += d; if (k === 'elX') q.relX += d; }
      return q;
    };
    const from = kind(this.pose, this.cur), to = kind(name, base);
    const stops = [...(PATHS[`${from}>${to}`] || []).map((v) => add(VIA[v])), add(base)];
    const points = [{ ...this.cur }, ...stops];
    // Dauer je Abschnitt nach dem größten Gelenkweg; schnellere Menschen sind schneller
    const durs = [];
    for (let i = 1; i < points.length; i++) {
      let m = 0;
      for (const k of KEYS) m = Math.max(m, Math.abs(points[i][k] - points[i - 1][k]) * (k === 'y' ? 2.5 : 1));
      durs.push(Math.min(1.3, Math.max(0.22, 0.25 + m * 0.3)) * (4 / this.speed));
    }
    const total = durs.reduce((a, b) => a + b, 0);
    this.path = { points, durs, total, t: 0 };
    this.pose = name;
    this.settled = false;
  }

  update(dt) {
    this.t += dt;
    const P = this.path;
    if (P) {
      P.t += dt;
      // Fortschritt über den ganzen Weg weich ein- und ausgeblendet, innerhalb der Abschnitte gleichmäßig
      let d = smooth(Math.min(1, P.t / P.total)) * P.total, i = 0;
      while (i < P.durs.length - 1 && d > P.durs[i]) { d -= P.durs[i]; i++; }
      const k = Math.min(1, d / P.durs[i]), a = P.points[i], b = P.points[i + 1];
      for (const key of KEYS) this.cur[key] = a[key] + (b[key] - a[key]) * k;
      if (P.t >= P.total) { this.path = null; this.settled = true; }
    }
    const motion = MOTION[this.pose];
    if (!motion || this.path) { this.apply(this.cur); return; }
    Object.assign(this.shown, this.cur);
    for (const [key, amp, speed] of motion) this.shown[key] += Math.sin(this.t * speed) * amp;
    if (motion.some(([key]) => key === 'shX')) this.shown.rshX = this.shown.shX;
    if (motion.some(([key]) => key === 'elX')) this.shown.relX = this.shown.elX;
    this.apply(this.shown);
  }

  // Ghost: durchscheinend und leuchtend, ohne Schatten auf den Rest der Szene
  makeGhost(color = 0x8fd8ff) {
    this.ghostMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, transparent: true, opacity: 0.38, depthWrite: false, roughness: 0.6 });
    this.group.traverse((o) => { if (o.isMesh) { o.material = this.ghostMat; o.renderOrder = 2; } });
    this.blob.visible = false;
    // Der Ghost bleibt eine schlichte Leuchtfigur: ohne Gesicht, Bart und Knopfleiste
    this.face.visible = false;
    this.beardOn = false;
    this.beard.visible = false;
    for (const m of this.trim) m.visible = false;
    return this;
  }

  setGhostColor(color) { this.ghostMat?.color.setHex(color); this.ghostMat?.emissive.setHex(color); }

  apply(p) {
    this.root.position.y = p.y;
    // Beim Sitzen und Niederwerfen folgt das Gewand den Beinen (dann zeigen die Beinteile das Gewand)
    this.skirt.visible = p.hip > -0.3 && p.knee < 0.4 && p.y > 0.7;
    this.legMesh.visible = !this.skirt.visible;
    // Schatten folgt dem Körper: beim Niederwerfen und Sitzen länger und weiter vorn
    const fwd = Math.min(1, Math.max(0, p.spine / 2.2, -p.hip / 1.25 * 0.7));
    this.blob.position.z = 0.32 * fwd;
    this.blob.scale.set(0.7, 1, 0.6 + 0.85 * fwd);
    // Leichtes Atmen und kaum merkliche Kopfbewegung – jede Figur in ihrem eigenen Takt
    const breath = Math.sin(this.t * 1.25 + this.phase);
    this.spine.rotation.x = p.spine + breath * 0.006;
    this.head.position.y = 0.53 + breath * 0.004;
    this.head.rotation.set(p.headX + breath * 0.008, p.headY, Math.sin(this.t * 0.43 + this.phase * 2) * 0.012);
    if (!this.ghostMat) this.face.visible = FACES.on;
    // Der rechte Arm (side −1, die Figur blickt nach +Z) hat eigene Schlüssel (z. B. beim Werfen)
    for (const a of this.arms) {
      const r = a.side < 0;
      a.sh.rotation.set(r ? p.rshX : p.shX, 0, p.shZ * a.side);
      a.el.rotation.set(r ? p.relX : p.elX, 0, p.elZ * a.side);
    }
    for (const l of this.legs) {
      l.hip.rotation.x = p.hip;
      l.knee.rotation.x = p.knee;
    }
  }
}
