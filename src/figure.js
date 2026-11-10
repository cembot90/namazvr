import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
  // Salām im Stehen (Totengebet)
  salamStandR: { y: 0.95, spine: 0, headX: 0.15, headY: -1.1, shX: 0, shZ: 0.08, elX: -0.1, elZ: 0, hip: 0, knee: 0 },
  salamStandL: { y: 0.95, spine: 0, headX: 0.15, headY: 1.1,  shX: 0, shZ: 0.08, elX: -0.1, elZ: 0, hip: 0, knee: 0 },
  dua:     { y: 0.95, spine: 0,    headX: 0.3,  headY: 0,    shX: -0.35, shZ: 0.12, elX: -1.35, elZ: 0.1,  hip: 0,     knee: 0 },
  // Haltungen für die Gebetswaschung
  wash:    { y: 0.95, spine: 0.15, headX: 0.4,  headY: 0,    shX: -0.45, shZ: -0.05, elX: -1.1, elZ: -0.75, hip: 0,    knee: 0 },
  face:    { y: 0.95, spine: 0.1,  headX: 0.1,  headY: 0,    shX: -0.75, shZ: 0.05, elX: -2.35, elZ: -0.45, hip: 0,    knee: 0 },
  head:    { y: 0.95, spine: 0.05, headX: 0.2,  headY: 0,    shX: -2.3,  shZ: 0.45, elX: -1.5,  elZ: -0.3, hip: 0,     knee: 0 },
  // Bittgebet im Sitzen nach dem Gebet (Gemeinde)
  sitDua:  { y: 0.24, spine: 0.05, headX: 0.35, headY: 0,    shX: -0.6,  shZ: 0.15, elX: -1.5,  elZ: 0.1,  hip: -1.25, knee: 2.82 },
  // Füße waschen im Sitzen auf dem Hocker: Oberschenkel waagerecht, vorgebeugt, Hände an den Füßen
  footWash:{ y: 0.5,  spine: 0.75, headX: 0.35, headY: 0,    shX: -0.95, shZ: 0.12, elX: -0.25, elZ: 0,    hip: -1.55, knee: 1.55 },
  feet:    { y: 0.82, spine: 1.15, headX: -0.2, headY: 0,    shX: -1.0,  shZ: 0.1,  elX: -0.2,  elZ: 0,    hip: -0.35, knee: 0.6 },
};
const KEYS = Object.keys(POSES.stand);

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

    // Gliedmaße: hängt am Gelenk (Ursprung) nach unten.
    const limb = (len, r, m) => {
      const mesh = new THREE.Mesh(geo(`limb${len}/${r}`, () => new THREE.CapsuleGeometry(r, Math.max(len - 2 * r, 0.01), 8, 16)), m);
      mesh.position.y = -len / 2;
      return mesh;
    };
    // Gewandteil: weite Röhre, unten etwas breiter (Ärmel, Hosenbein des Gewands), oben abgerundet
    const garment = (len, r0, r1, m) => {
      const mesh = new THREE.Mesh(geo(`garment${len}/${r0}/${r1}`, () => {
        const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(r0 * 0.7, -0.01), new THREE.Vector2(r0, -0.04)];
        for (let i = 1; i <= 8; i++) { const k = i / 8; pts.push(new THREE.Vector2(r0 + (r1 - r0) * k, -0.04 - (len - 0.04) * k)); }
        pts.push(new THREE.Vector2(r1 * 0.85, -len), new THREE.Vector2(0, -len));
        return new THREE.LatheGeometry(pts, 20);
      }), m);
      return mesh;
    };

    this.root = new THREE.Group();
    this.group.add(this.root);
    const pelvis = new THREE.Mesh(geo('pelvis', () => new THREE.SphereGeometry(0.15, 16, 12)), robe);
    pelvis.scale.set(1.08 * build, 0.7, 0.85);
    this.root.add(pelvis);

    this.spine = new THREE.Group();
    this.root.add(this.spine);
    // Oberkörper als gedrehtes Profil: Taille, Brust, runde Schultern
    const torso = new THREE.Mesh(geo('torso3', () => {
      // gerade geschnittenes Hemd: geht ohne Einschnürung in das Gewand über, runde Schultern
      const prof = [[0, -0.06], [0.166, -0.05], [0.168, 0.1], [0.172, 0.24], [0.172, 0.34], [0.158, 0.41], [0.12, 0.465], [0.07, 0.497], [0, 0.508]];
      return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28);
    }), robe);
    torso.position.y = 0.0;
    torso.scale.set(1.18 * build, 1, 0.78 * (0.6 + 0.4 * build) * (build > 1 ? build : 1));
    this.spine.add(torso);
    this.torso = torso;
    // Kragen und Knopfleiste (etwas dunkler als das Gewand)
    const trimMat = mat(darker(robeColor), 0.85);
    const collar = new THREE.Mesh(geo('collar', () => new THREE.TorusGeometry(0.058, 0.014, 8, 20)), trimMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.505;
    const placket = new THREE.Mesh(geo('placket', () => new THREE.BoxGeometry(0.016, 0.2, 0.006)), trimMat);
    placket.position.set(0, 0.36, 0.168 * 0.78 * (0.6 + 0.4 * build) * (build > 1 ? build : 1));
    placket.rotation.x = -0.1;
    this.trim = [collar, placket];
    this.spine.add(collar, placket);
    // Schultern (dezent, gehen in den Oberkörper über)
    for (const sx of [-1, 1]) {
      const shoulder = new THREE.Mesh(geo('shoulder3', () => new THREE.SphereGeometry(0.074, 16, 12)), robe);
      shoulder.position.set(0.178 * sx * build, 0.432, 0);
      shoulder.scale.set(1.05, 0.8, 1.05);
      this.spine.add(shoulder);
    }
    // Langes Gewand (Cübbe) von der Hüfte bis zu den Knöcheln – sichtbar, solange die Beine gestreckt sind
    this.skirt = new THREE.Mesh(geo('skirt', () => {
      const prof = [[0, 0.04], [0.16, 0.04], [0.175, -0.1], [0.2, -0.35], [0.23, -0.65], [0.25, -0.86], [0.24, -0.88], [0, -0.88]];
      return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 32);
    }), robe);
    this.skirt.scale.set(1.05 * build, 1, 0.82 * (build > 1 ? build : 1));
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
      const sh = new THREE.Group();
      sh.position.set((0.2 * build + 0.008) * side, 0.452, 0);
      sh.add(garment(0.31, 0.058, 0.054, robe));
      const el = new THREE.Group();
      el.position.y = -0.3;
      el.add(garment(0.265, 0.05, 0.047, robe));
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

    this.legParts = [];
    this.legs = [1, -1].map((side) => {
      const hip = new THREE.Group();
      hip.position.set(0.1 * side, -0.02, 0);
      const thigh = garment(0.47, 0.095, 0.105, robe), shin = garment(0.42, 0.09, 0.1, robe);
      hip.add(thigh);
      const knee = new THREE.Group();
      knee.position.y = -0.45;
      knee.add(shin);
      this.legParts.push(thigh, shin);
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

    this.t = 0;
    this.shown = {};
    this.group.traverse((o) => { if (o.isMesh) o.userData.figure = true; });
    this.robeMat = robe;
    this.robeMeshes = [];
    this.group.traverse((o) => { if (o.isMesh && o.material === robe) this.robeMeshes.push(o); });
    this.cur = { ...POSES.stand };
    this.target = POSES.stand;
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

  setPose(name) {
    const base = POSES[name] || POSES.stand;
    this.pose = name;
    if (!this.vary) { this.target = base; return; }
    this.target = { ...base };
    for (const [k, d] of Object.entries(this.vary)) this.target[k] += d;
  }

  update(dt) {
    const k = 1 - Math.exp(-dt * this.speed);
    this.t += dt;
    for (const key of KEYS) this.cur[key] += (this.target[key] - this.cur[key]) * k;
    const motion = MOTION[this.pose];
    if (!motion) { this.apply(this.cur); return; }
    Object.assign(this.shown, this.cur);
    for (const [key, amp, speed] of motion) this.shown[key] += Math.sin(this.t * speed) * amp;
    this.apply(this.shown);
  }

  // Ghost: durchscheinend und leuchtend, ohne Schatten auf den Rest der Szene
  makeGhost(color = 0x8fd8ff) {
    this.ghostMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, transparent: true, opacity: 0.38, depthWrite: false, roughness: 0.6 });
    this.group.traverse((o) => { if (o.isMesh) { o.material = this.ghostMat; o.renderOrder = 2; } });
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
    for (const m of this.legParts) m.visible = !this.skirt.visible;
    this.spine.rotation.x = p.spine;
    // Leichtes Atmen und kaum merkliche Kopfbewegung – jede Figur in ihrem eigenen Takt
    const breath = Math.sin(this.t * 1.25 + this.phase);
    this.torso.scale.y = 1 + breath * 0.012;
    this.head.position.y = 0.53 + breath * 0.004;
    this.head.rotation.set(p.headX + breath * 0.008, p.headY, Math.sin(this.t * 0.43 + this.phase * 2) * 0.012);
    if (!this.ghostMat) this.face.visible = FACES.on;
    // Eine Haltung kann den rechten Arm (side −1, die Figur blickt nach +Z) eigens festlegen
    const right = (POSES[this.pose] || {}).right;
    for (const a of this.arms) {
      const r = a.side < 0 && right;
      a.sh.rotation.set(r ? right.shX : p.shX, 0, p.shZ * a.side);
      a.el.rotation.set(r ? right.elX : p.elX, 0, p.elZ * a.side);
    }
    for (const l of this.legs) {
      l.hip.rotation.x = p.hip;
      l.knee.rotation.x = p.knee;
    }
  }
}
