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

// Bewegung in den Wasch-Haltungen: [Gelenk, Ausschlag, Tempo] – Hände reiben, Gesicht waschen, über den Kopf wischen
const MOTION = {
  wash: [['elZ', 0.22, 6], ['shX', 0.06, 6]],
  face: [['elX', 0.16, 3.5], ['shZ', 0.05, 3.5]],
  head: [['shX', 0.22, 2.2], ['elX', 0.15, 2.2]],
  feet: [['elZ', 0.2, 5.5], ['shX', 0.08, 5.5]],
  footWash: [['elZ', 0.2, 5.5], ['shX', 0.1, 5.5]],
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
  constructor({ robe: robeColor = 0xece6d8, skin: skinColor = 0xc9a988, scarf: scarfColor = 0x5f7f86, cap: capOn = true, scale = 1 } = {}) {
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
      const mesh = new THREE.Mesh(geo(`limb${len}/${r}`, () => new THREE.CapsuleGeometry(r, Math.max(len - 2 * r, 0.01), 6, 12)), m);
      mesh.position.y = -len / 2;
      return mesh;
    };

    this.root = new THREE.Group();
    this.group.add(this.root);
    const pelvis = new THREE.Mesh(geo('pelvis', () => new THREE.SphereGeometry(0.15, 16, 12)), robe);
    pelvis.scale.set(1.1, 0.7, 0.85);
    this.root.add(pelvis);

    this.spine = new THREE.Group();
    this.root.add(this.spine);
    const torso = new THREE.Mesh(geo('torso', () => new THREE.CapsuleGeometry(0.15, 0.3, 6, 16)), robe);
    torso.position.y = 0.27;
    torso.scale.set(1.15, 1, 0.75);
    this.spine.add(torso);

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
    this.head.add(neck, headMesh, cap, this.scarf);

    this.arms = [1, -1].map((side) => {
      const sh = new THREE.Group();
      sh.position.set(0.21 * side, 0.46, 0);
      sh.add(limb(0.3, 0.05, robe));
      const el = new THREE.Group();
      el.position.y = -0.3;
      el.add(limb(0.27, 0.045, robe));
      const hand = new THREE.Mesh(geo('hand', () => new THREE.SphereGeometry(0.045, 12, 10)), skin);
      hand.position.y = -0.29;
      hand.scale.set(0.8, 1.2, 0.5);
      el.add(hand);
      sh.add(el);
      this.spine.add(sh);
      return { side, sh, el };
    });

    this.legs = [1, -1].map((side) => {
      const hip = new THREE.Group();
      hip.position.set(0.1 * side, -0.02, 0);
      hip.add(limb(0.45, 0.075, robe));
      const knee = new THREE.Group();
      knee.position.y = -0.45;
      knee.add(limb(0.45, 0.06, robe));
      const foot = new THREE.Mesh(geo('foot', () => new THREE.BoxGeometry(0.09, 0.05, 0.22)), skin);
      foot.position.set(0, -0.45, 0.06);
      knee.add(foot);
      hip.add(knee);
      this.root.add(hip);
      return { hip, knee };
    });

    this.t = 0;
    this.shown = {};
    this.cur = { ...POSES.stand };
    this.target = POSES.stand;
    this.apply(this.cur);
  }

  setGender(g) {
    this.scarf.visible = g === 'f';
    this.cap.visible = g !== 'f' && this.capOn;
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
    this.spine.rotation.x = p.spine;
    this.head.rotation.set(p.headX, p.headY, 0);
    for (const a of this.arms) {
      a.sh.rotation.set(p.shX, 0, p.shZ * a.side);
      a.el.rotation.set(p.elX, 0, p.elZ * a.side);
    }
    for (const l of this.legs) {
      l.hip.rotation.x = p.hip;
      l.knee.rotation.x = p.knee;
    }
  }
}
