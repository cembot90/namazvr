import * as THREE from 'three';

// Bewusst gesichtslose Vorbeter-Figur. Lokal blickt sie nach +Z.
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
const IHRAM = new THREE.MeshStandardMaterial({ color: 0xfdfdfb, roughness: 0.9 });

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
const mat = (color, roughness) => {
  const key = `${color}/${roughness}`;
  return MAT.get(key) || MAT.set(key, new THREE.MeshStandardMaterial({ color, roughness })).get(key);
};

export class Guide {
  // robe/skin/scarf: Farben, cap: Gebetsmütze bei Männern, scale: Körpergröße
  constructor({ robe: robeColor = 0xece6d8, skin: skinColor = 0xc9a988, scarf: scarfColor = 0x5f7f86, cap: capOn = true, scale = 1, hair: hairColor = 0x2b1d14 } = {}) {
    this.group = new THREE.Group();
    this.group.scale.setScalar(scale);
    this.capOn = capOn;
    // Wie schnell die Haltung wechselt, und kleine persönliche Abweichungen davon
    this.speed = 4;
    this.vary = null;
    const robe = mat(robeColor, 0.85);
    const skin = mat(skinColor, 0.7);
    const capMat = mat(0xffffff, 0.9);

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
    pelvis.scale.set(1.1, 0.7, 0.85);
    this.root.add(pelvis);

    this.spine = new THREE.Group();
    this.root.add(this.spine);
    // Oberkörper als gedrehtes Profil: Taille, Brust, runde Schultern
    const torso = new THREE.Mesh(geo('torso2', () => {
      const prof = [[0, -0.02], [0.14, 0], [0.15, 0.08], [0.165, 0.2], [0.175, 0.3], [0.17, 0.38], [0.14, 0.45], [0.08, 0.5], [0, 0.51]];
      return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28);
    }), robe);
    torso.position.y = 0.0;
    torso.scale.set(1.18, 1, 0.78);
    this.spine.add(torso);
    // Schultern (dezent, gehen in den Oberkörper über)
    for (const sx of [-1, 1]) {
      const shoulder = new THREE.Mesh(geo('shoulder2', () => new THREE.SphereGeometry(0.055, 16, 12)), robe);
      shoulder.position.set(0.185 * sx, 0.45, 0);
      shoulder.scale.set(1, 0.8, 1.1);
      this.spine.add(shoulder);
    }
    // Langes Gewand (Cübbe) von der Hüfte bis zu den Knöcheln – sichtbar, solange die Beine gestreckt sind
    this.skirt = new THREE.Mesh(geo('skirt', () => {
      const prof = [[0, 0.04], [0.16, 0.04], [0.175, -0.1], [0.2, -0.35], [0.23, -0.65], [0.25, -0.86], [0.24, -0.88], [0, -0.88]];
      return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 32);
    }), robe);
    this.skirt.scale.set(1.05, 1, 0.82);
    this.root.add(this.skirt);

    this.head = new THREE.Group();
    this.head.position.y = 0.53;
    this.spine.add(this.head);
    const neck = new THREE.Mesh(geo('neck', () => new THREE.CylinderGeometry(0.045, 0.05, 0.08, 12)), skin);
    neck.position.y = 0.02;
    const headMesh = new THREE.Mesh(geo('head', () => new THREE.SphereGeometry(0.105, 24, 16)), skin);
    headMesh.position.y = 0.13;
    headMesh.scale.set(0.9, 1.05, 1);
    const cap = new THREE.Mesh(geo('cap', () => new THREE.SphereGeometry(0.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.3)), capMat);
    cap.position.y = 0.155;
    // Kopftuch für die Vorbeterin (statt der Gebetsmütze)
    const scarfMat = mat(scarfColor, 0.9);
    const hood = new THREE.Mesh(geo('hood', () => new THREE.SphereGeometry(0.122, 24, 16)), scarfMat);
    hood.position.set(0, 0.125, -0.01);
    hood.scale.set(0.98, 1.12, 1.06);
    // Tuch fällt vom Kinn über Hals und Schultern
    const drape = new THREE.Mesh(geo('drape', () => new THREE.CylinderGeometry(0.105, 0.2, 0.17, 24)), scarfMat);
    drape.position.y = -0.02;
    this.scarf = new THREE.Group();
    this.scarf.add(hood, drape);
    this.scarf.visible = false;
    this.cap = cap;
    // Haar (ohne Kopfbedeckung): kurz für Männer, für Frauen zusätzlich langes Haar am Hinterkopf
    const hairMat = mat(hairColor, 0.8);
    const hairTop = new THREE.Mesh(geo('hairTop', () => new THREE.SphereGeometry(0.113, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55)), hairMat);
    hairTop.position.set(0, 0.14, -0.008);
    hairTop.rotation.x = -0.35;
    hairTop.scale.set(0.92, 1.05, 1.02);
    const hairLong = new THREE.Mesh(geo('hairLong', () => new THREE.CapsuleGeometry(0.07, 0.16, 6, 14)), hairMat);
    hairLong.position.set(0, 0.03, -0.075);
    hairLong.scale.set(1.25, 1, 0.55);
    this.hair = new THREE.Group();
    this.hair.add(hairTop, hairLong);
    this.hairLong = hairLong;
    this.hair.visible = false;
    this.head.add(neck, headMesh, cap, this.scarf, this.hair);

    this.arms = [1, -1].map((side) => {
      const sh = new THREE.Group();
      sh.position.set(0.21 * side, 0.46, 0);
      sh.add(garment(0.3, 0.052, 0.058, robe));
      const el = new THREE.Group();
      el.position.y = -0.3;
      el.add(garment(0.26, 0.05, 0.062, robe));
      // Hand: Handfläche mit Daumen
      const hand = new THREE.Mesh(geo('hand2', () => new THREE.CapsuleGeometry(0.035, 0.06, 6, 12)), skin);
      hand.position.y = -0.31;
      hand.scale.set(1.15, 1, 0.55);
      const thumb = new THREE.Mesh(geo('thumb', () => new THREE.CapsuleGeometry(0.013, 0.035, 4, 8)), skin);
      thumb.position.set(-0.035 * side, -0.29, 0.015);
      thumb.rotation.z = 0.5 * side;
      el.add(hand, thumb);
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
      const foot = new THREE.Mesh(geo('foot2', () => new THREE.CapsuleGeometry(0.042, 0.14, 6, 12)), skin);
      foot.rotation.x = Math.PI / 2;
      foot.scale.set(1, 1, 0.6);
      foot.position.set(0, -0.455, 0.06);
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
    // Ohne Kopftuch oder Kappe sieht man das Haar
    this.hair.visible = !this.scarf.visible && !this.cap.visible;
    this.hairLong.visible = g === 'f';
  }

  // Iḥrām: Männer in zwei weißen Tüchern ohne Kopfbedeckung (Frauen bleiben in ihrer bedeckten Kleidung)
  setIhram(on) {
    this.ihram = on;
    if (!this.ghostMat) {
      const white = on && this.gender !== 'f';
      for (const m of this.robeMeshes) m.material = white ? IHRAM : this.robeMat;
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
    return this;
  }

  setGhostColor(color) { this.ghostMat?.color.setHex(color); this.ghostMat?.emissive.setHex(color); }

  apply(p) {
    this.root.position.y = p.y;
    // Beim Sitzen und Niederwerfen folgt das Gewand den Beinen (dann zeigen die Beinteile das Gewand)
    this.skirt.visible = p.hip > -0.3 && p.knee < 0.4 && p.y > 0.7;
    for (const m of this.legParts) m.visible = !this.skirt.visible;
    this.spine.rotation.x = p.spine;
    this.head.rotation.set(p.headX, p.headY, 0);
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
