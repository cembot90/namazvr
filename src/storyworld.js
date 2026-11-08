// Orte für die Geschichten der Propheten und den Sternenhimmel.
// Propheten werden aus Respekt nicht gezeigt: man sieht die Orte, die Tiere und was geschieht, und hört die Geschichte.
// Jede Szene hat Abschnitte (phase), die main.js je Schritt setzt; updateStory() bewegt Wasser, Tiere, Feuer usw.
import * as THREE from 'three';
import { canvasTex, ground, mountains } from './hajjworld.js';

const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const ease = (k) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, k)));
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });

let S = null; // aktuelle Szene: { id, phase, pt, t, upd, lift, ... }

// --- Himmel mit Stimmungen ---
const MOODS = {
  day: [['#4f8fd8', '#a9d0f0', '#f2e6cf'], 1],
  dawn: [['#3a5a9a', '#e8a080', '#fde2b0'], 0.75],
  dusk: [['#1c2550', '#b0607a', '#f2b36b'], 0.55],
  night: [['#050a1c', '#101c3a', '#2a2a3a'], 0.3],
  storm: [['#1e222a', '#3a404a', '#5a5e64'], 0.38],
};
const skyTex = {};
function moodTex(m) {
  if (!skyTex[m]) {
    const [c] = MOODS[m];
    skyTex[m] = canvasTex(16, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, c[0]); g.addColorStop(0.5, c[1]); g.addColorStop(1, c[2]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
  }
  return skyTex[m];
}

function moodSky(scene, mood) {
  for (const k of Object.keys(skyTex)) { skyTex[k].dispose(); delete skyTex[k]; }
  const hemi = new THREE.HemisphereLight(0xfff6e8, 0x7a6a58, 2.4);
  const sun = new THREE.DirectionalLight(0xffe7c0, 2.0);
  sun.position.set(30, 60, 20);
  // Die Kuppel-Textur gehört allen Stimmungen: beim Aufräumen nicht pro Mesh freigeben
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: moodTex(mood), fog: false }));
  const pts = [];
  for (let i = 0; i < 700; i++) { const a = Math.random() * TAU, e = rand(0.08, 1.45); pts.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, transparent: true, opacity: 0 }));
  scene.add(hemi, sun, dome, stars);
  S.sky = { hemi, sun, dome, stars, mood, k: MOODS[mood][1], flash: 0 };
  setMood(mood);
}
function setMood(m) {
  const s = S?.sky;
  if (!s || !MOODS[m]) return;
  s.mood = m;
  s.dome.material.map = moodTex(m);
  s.dome.material.needsUpdate = true;
}
// Licht weich der Stimmung nachführen (Grundhelligkeit wird nach dem Bau gemerkt, Graphics dimmt die Lampen)
function skyUpdate(dt) {
  const s = S.sky;
  if (!s) return;
  if (s.base == null) s.base = [s.hemi.intensity, s.sun.intensity];
  const want = MOODS[s.mood][1];
  s.k += (want - s.k) * Math.min(1, dt * 1.5);
  s.flash = Math.max(0, s.flash - dt * 3);
  s.hemi.intensity = s.base[0] * (s.k + s.flash * 2);
  s.sun.intensity = s.base[1] * s.k * s.k;
  const night = s.mood === 'night' || s.mood === 'dusk' ? 1 : 0;
  s.stars.material.opacity += (night * (s.mood === 'night' ? 1 : 0.4) - s.stars.material.opacity) * Math.min(1, dt);
}

// --- Wasser mit Wellen ---
function water(scene, w, d, seg, color, y = 0) {
  const geo = new THREE.PlaneGeometry(w, d, seg, Math.max(2, Math.round((seg * d) / w)));
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.25, metalness: 0.15, transparent: true, opacity: 0.92 }));
  m.position.y = y;
  scene.add(m);
  return { m, amp: 0.15, t: 0 };
}
function waves(wt, dt, freq = 0.18) {
  wt.t += dt;
  const p = wt.m.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, wt.amp * (Math.sin(x * freq + wt.t * 1.3) * 0.6 + Math.cos(z * freq * 0.8 + wt.t) * 0.4 + Math.sin((x + z) * freq * 2.1 + wt.t * 2) * 0.15));
  }
  p.needsUpdate = true;
  wt.m.geometry.computeVertexNormals();
}

// --- Regen ---
function rain(scene, cx = 0, cz = 0, n = 5000) {
  const pts = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pts[i * 3] = cx + rand(-35, 35); pts[i * 3 + 1] = rand(0, 30); pts[i * 3 + 2] = cz + rand(-35, 35); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const r = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xb8c6dd, size: 0.09, transparent: true, opacity: 0.7 }));
  r.visible = false;
  scene.add(r);
  return r;
}
function rainUpdate(r, dt, bottom = 0) {
  if (!r.visible) return;
  const p = r.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let y = p.getY(i) - dt * 16;
    if (y < bottom) y += 30;
    p.setY(i, y);
  }
  p.needsUpdate = true;
}

// --- Einfache Tiere (Löwe, Elefant, Giraffe, Schaf, Kamel, Pferd) ---
const ANIMALS = {
  lion: { c: 0xd9a441, s: 1, body: [0.9, 0.45, 0.4], leg: 0.5, mane: 0x8a5a20 },
  elephant: { c: 0x8d8f94, s: 1.7, body: [1.0, 0.6, 0.55], leg: 0.7, trunk: true },
  giraffe: { c: 0xe0b050, s: 1.1, body: [0.8, 0.4, 0.35], leg: 1.0, neck: 1.4 },
  sheep: { c: 0xf2efe6, s: 0.7, body: [0.7, 0.45, 0.42], leg: 0.35 },
  camel: { c: 0xc8a070, s: 1.2, body: [0.9, 0.4, 0.38], leg: 0.9, hump: true, neck: 0.6 },
  horse: { c: 0x6b4a30, s: 1.1, body: [0.95, 0.4, 0.35], leg: 0.8, neck: 0.5 },
};
function animal(kind) {
  const a = ANIMALS[kind], m = mat(a.c), g = new THREE.Group(), s = a.s;
  const [bx, by, bz] = a.body;
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), m);
  body.scale.set(bz * s, by * s, bx * s);
  body.position.y = (a.leg + by * 0.8) * s;
  g.add(body);
  const legs = [];
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const hip = new THREE.Group();
    hip.position.set(x * bz * 0.55 * s, a.leg * s + by * 0.3 * s, z * bx * 0.6 * s);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.06 * s, a.leg * s + by * 0.3 * s, 6), m);
    leg.position.y = -(a.leg * s + by * 0.3 * s) / 2;
    hip.add(leg);
    g.add(hip);
    legs.push(hip);
  }
  const neckLen = (a.neck || 0.25) * s;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26 * s, 12, 8), m);
  head.position.set(0, body.position.y + by * 0.4 * s + neckLen, bx * s * 0.95 + 0.1 * s);
  if (a.neck) {
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.16 * s, neckLen + 0.2 * s, 8), m);
    neck.position.set(0, body.position.y + by * 0.3 * s + neckLen / 2, bx * s * 0.85);
    neck.rotation.x = 0.35;
    g.add(neck);
  }
  g.add(head);
  if (a.mane) { const mane = new THREE.Mesh(new THREE.SphereGeometry(0.36 * s, 12, 8), mat(a.mane)); mane.position.copy(head.position).add(new THREE.Vector3(0, 0, -0.08 * s)); g.add(mane); }
  if (a.trunk) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.09 * s, 0.6 * s, 6), m); tr.position.copy(head.position).add(new THREE.Vector3(0, -0.3 * s, 0.22 * s)); tr.rotation.x = 0.3; g.add(tr); for (const x of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 8, 6), m); ear.scale.set(0.3, 1, 1); ear.position.copy(head.position).add(new THREE.Vector3(x * 0.25 * s, 0.02, -0.1 * s)); g.add(ear); } }
  if (a.hump) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.32 * s, 10, 8), m); h.position.set(0, body.position.y + by * 0.75 * s, 0); g.add(h); }
  g.userData.legs = legs;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function legSwing(g, t, k = 1) {
  const L = g.userData.legs;
  if (!L) return;
  const sw = Math.sin(t * 6) * 0.4 * k;
  L[0].rotation.x = sw; L[3].rotation.x = sw; L[1].rotation.x = -sw; L[2].rotation.x = -sw;
}

// Vogel (V-Form) – kreist oder fliegt
function bird(color = 0xffffff, s = 1) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 8, 6), m);
  body.scale.set(1, 0.8, 1.8);
  g.add(body);
  const wings = [];
  for (const x of [-1, 1]) {
    const w = new THREE.Group();
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5 * s, 0.22 * s), m);
    p.rotation.x = -Math.PI / 2;
    p.position.x = x * 0.25 * s;
    w.add(p);
    g.add(w);
    wings.push([w, x]);
  }
  g.userData.wings = wings;
  return g;
}
const flap = (g, t, k = 1) => { for (const [w, x] of g.userData.wings) w.rotation.z = x * Math.sin(t * 9) * 0.6 * k; };

// Palme
function palm(scene, x, z, h = rand(5, 8)) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, h, 7), mat(0x8a6a48));
  trunk.position.set(x, h / 2, z);
  trunk.rotation.z = rand(-0.08, 0.08);
  scene.add(trunk);
  const leaf = mat(0x4f7d3a, { side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const l = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.6, 4), leaf);
    const a = (i / 7) * TAU;
    l.position.set(x + Math.cos(a) * 1.1, h - 0.2, z + Math.sin(a) * 1.1);
    l.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2);
    l.scale.z = 0.25;
    scene.add(l);
  }
}

function house(scene, x, z, w = 4, h = 3, d = 4, color = 0xc9a77c) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, { roughness: 1 }));
  b.position.set(x, h / 2, z);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), mat(0x5a3a24));
  door.position.set(x, 0.9, z + d / 2 + 0.01);
  scene.add(b, door);
}

// Schrift als Sprite (für den Sternenhimmel)
function label(text, size = 2, color = '#f4e4b8') {
  const tex = canvasTex(512, 96, (ctx, w, h) => {
    ctx.font = '600 52px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  s.scale.set(size * 5.33, size, 1);
  return s;
}
let glowTex = null;
function glow() {
  if (!glowTex) glowTex = canvasTex(64, 64, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,240,200,0.9)'); g.addColorStop(0.5, 'rgba(255,210,120,0.25)'); g.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, w);
  });
  return glowTex;
}
const glowSprite = (color = 0xffffff, size = 1) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  s.scale.setScalar(size);
  s.userData.sharedMap = true;
  return s;
};

// ======================= Nuh (as): die Arche =======================
const ARK = { z: -22, deck: 4.15 };
function ark(scene) {
  moodSky(scene, 'day');
  ground(scene, 0x7aa35a);
  mountains(scene, 12, 260, 0x6f7f5a);
  const wood = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#7a5532'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) { ctx.fillStyle = y % 32 ? '#6a4628' : '#835c37'; ctx.fillRect(0, y, w, 14); }
  });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(4, 1);
  const wm = mat(0xffffff, { map: wood });
  const shape = new THREE.Shape();
  shape.moveTo(-15, 4.0); shape.lineTo(15, 4.0); shape.lineTo(12, 0.6); shape.quadraticCurveTo(11, 0, 9, 0); shape.lineTo(-9, 0); shape.quadraticCurveTo(-11, 0, -12, 0.6); shape.lineTo(-15, 4.0);
  const hullGeo = new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 2 });
  hullGeo.translate(0, 0, -4);
  const a = new THREE.Group();
  a.add(new THREE.Mesh(hullGeo, wm));
  const deck = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 8.4), mat(0x8a6a44));
  deck.position.y = 4.0;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(12, 3.4, 6), wm);
  cabin.position.set(-3, 5.85, 0);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 12.6, 3), mat(0x5a3d22));
  roof.rotation.z = Math.PI / 2;
  roof.position.set(-3, 8.1, 0);
  roof.scale.set(1, 1, 0.5);
  a.add(deck, cabin, roof);
  // Rampe zur Seite hin (zu dir)
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 9), mat(0x8a6a44));
  ramp.position.set(0, 2.0, 8.4);
  ramp.rotation.x = Math.atan2(4, 8.4);
  a.add(ramp);
  a.position.z = ARK.z;
  a.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(a);
  // Holzstapel und Bäume (Bauplatz)
  const logs = new THREE.Group();
  for (let i = 0; i < 14; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4, 7), mat(0x7a5532)); l.rotation.z = Math.PI / 2; l.position.set(18 + (i % 4) * 0.1, 0.18 + Math.floor(i / 4) * 0.34, -14 + (i % 4) * 0.38); logs.add(l); }
  scene.add(logs);
  const trees = mat(0x4a7a36, { roughness: 1 }), treeG = new THREE.Group();
  for (let i = 0; i < 30; i++) { const x = rand(-70, 70), z = rand(-70, 30); if (Math.hypot(x, z - ARK.z) < 24 || Math.hypot(x, z) < 12) continue; const t = new THREE.Mesh(new THREE.SphereGeometry(rand(1.5, 3), 8, 6), trees); t.position.set(x, 2.5, z); treeG.add(t); }
  scene.add(treeG);
  // Berg Cudi: taucht am Ende unter der Arche auf
  const hill = new THREE.Mesh(new THREE.CylinderGeometry(7, 46, 5, 18), mat(0x6f9a4a, { roughness: 1, flatShading: true }));
  hill.position.set(0, 2.4, ARK.z);
  hill.visible = false;
  scene.add(hill);
  const sea = water(scene, 500, 500, 70, 0x2f6f9a, -0.5);
  const r = rain(scene, 0, ARK.z);
  // Tiere: je Art ein Paar, kommen von links und rechts zur Rampe
  const kinds = ['elephant', 'lion', 'giraffe', 'camel', 'sheep', 'horse'];
  const animals = [];
  kinds.forEach((k, i) => [-1, 1].forEach((side) => {
    const g = animal(k);
    g.visible = false;
    scene.add(g);
    const start = new THREE.Vector3(side * (26 + rand(0, 6)), 0, -8 + rand(-3, 3));
    animals.push({ g, delay: i * 2.6 + (side > 0 ? 0.6 : 0), path: [start, new THREE.Vector3(side * 0.7, 0, ARK.z + 12.4), new THREE.Vector3(side * 0.5, 4.1, ARK.z + 4.2)] }); // eslint-disable-line no-mixed-operators
  }));
  const birds = Array.from({ length: 6 }, (_, i) => { const b = bird(0xffffff, 1.4); b.visible = false; b.userData.a = (i / 6) * TAU; scene.add(b); return b; });
  S.upd = (dt) => {
    const ph = S.phase, pt = S.pt;
    let level = -0.5;
    if (ph === 'rain') level = -0.5 + 7.5 * ease(pt / 16);
    else if (ph === 'sea') level = 7;
    else if (ph === 'cudi') level = 3.0 - 2.5 * ease(pt / 10);
    sea.m.position.y = level;
    sea.amp = ph === 'rain' ? 0.6 : ph === 'sea' ? 1.0 : 0.2;
    waves(sea, dt, 0.12);
    const float = level > 2.0;
    const bob = float && !(ph === 'cudi' && level < 5.2) ? Math.sin(S.t * 0.9) * sea.amp * 0.35 : 0;
    a.position.y = ph === 'cudi' ? 4.9 : Math.max(0, level - 2.0) + bob;
    a.rotation.z = float && ph !== 'cudi' ? Math.sin(S.t * 0.7) * 0.03 * sea.amp : 0;
    ramp.visible = ph === 'build' || ph === 'animals';
    hill.visible = ph === 'cudi';
    treeG.visible = level < 1.5;
    logs.visible = ph === 'build';
    r.visible = ph === 'rain' || (ph === 'sea' && pt < 12);
    rainUpdate(r, dt, level);
    setMood(ph === 'rain' || ph === 'sea' ? 'storm' : 'day');
    if (ph === 'rain' && Math.random() < dt * 0.25) S.sky.flash = 1;
    for (const an of animals) {
      if (ph !== 'animals') { an.g.visible = false; continue; }
      const k = pt - an.delay;
      if (k < 0) { an.g.visible = false; continue; }
      // Weg ablaufen (3 m/s)
      let d = k * 3, i = 0;
      while (i < an.path.length - 1 && d > an.path[i].distanceTo(an.path[i + 1])) { d -= an.path[i].distanceTo(an.path[i + 1]); i++; }
      if (i >= an.path.length - 1) { an.g.visible = false; continue; }
      const p = an.path[i], q = an.path[i + 1];
      an.g.visible = true;
      an.g.position.lerpVectors(p, q, d / p.distanceTo(q));
      an.g.rotation.y = Math.atan2(q.x - p.x, q.z - p.z);
      legSwing(an.g, k);
    }
    birds.forEach((b, i) => {
      b.visible = ph === 'cudi' && pt > 6;
      b.userData.a += dt * 0.35;
      const ra = 10 + i * 1.5;
      b.position.set(Math.cos(b.userData.a) * ra, 12 + i * 0.6, ARK.z + Math.sin(b.userData.a) * ra);
      b.rotation.y = -b.userData.a;
      flap(b, S.t + i);
    });
    S.lift = ph === 'rain' || ph === 'sea' ? a.position.y : 0;
  };
}

// ======================= Ibrahim (as): das Feuer wird kühl =======================
const PILE = { x: 0, z: -12 };
function fire(scene) {
  moodSky(scene, 'night');
  ground(scene, 0xc9b48a);
  mountains(scene, 14, 250, 0x7a6048);
  for (let i = 0; i < 16; i++) { const a = rand(-1.2, 1.2) + Math.PI, r = rand(45, 70); house(scene, Math.sin(a) * r, Math.cos(a) * r - 10, rand(4, 7), rand(3, 5), rand(4, 7)); }
  // Heller Stern und Mond (der junge Ibrahim schaut in den Himmel)
  const star = glowSprite(0xfff4d0, 14);
  star.position.set(-60, 120, -300);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4efd8, fog: false }));
  moon.position.set(70, 20, -300);
  scene.add(star, moon);
  const logs = new THREE.Group();
  for (let i = 0; i < 60; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(rand(0.12, 0.22), rand(0.12, 0.22), rand(2, 3.4), 6), mat(0x6b4a2e));
    const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 3;
    l.position.set(PILE.x + Math.cos(a) * r, 0.2 + rand(0, 1.8) * (1 - r / 3.4), PILE.z + Math.sin(a) * r);
    l.rotation.set(rand(-1.4, 1.4), rand(0, 3), Math.PI / 2 + rand(-0.4, 0.4));
    logs.add(l);
  }
  scene.add(logs);
  const flames = new THREE.Group();
  const fm = [0xff6a1a, 0xff9a2a, 0xffc94a].map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  for (let i = 0; i < 40; i++) {
    const h = rand(2, 6.5), f = new THREE.Mesh(new THREE.ConeGeometry(rand(0.5, 1.1), h, 7), fm[i % 3]);
    const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 2.8;
    f.position.set(PILE.x + Math.cos(a) * r, h / 2, PILE.z + Math.sin(a) * r);
    f.userData = { h, s: rand(0, 6) };
    flames.add(f);
  }
  const light = new THREE.PointLight(0xff7a2a, 0, 60, 1.2);
  light.position.set(PILE.x, 4, PILE.z);
  scene.add(flames, light);
  // Funken
  const embers = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 600 }, (_, i) => (i % 3 === 1 ? rand(0, 12) : (i % 3 === 0 ? PILE.x : PILE.z) + rand(-3, 3))), 3)), new THREE.PointsMaterial({ color: 0xffb04a, size: 0.12, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(embers);
  // Garten: Wiese, Blumen, Bäumchen und ein kleiner Brunnen
  const garden = new THREE.Group();
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(6.5, 32), mat(0x6fae4a, { roughness: 1 }));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(PILE.x, 0.02, PILE.z);
  garden.add(lawn);
  const colors = [0xff8fb0, 0xffe066, 0xffffff, 0xb08cff, 0xff6a6a, 0x8fd8ff];
  const fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ roughness: 0.6 }), 420);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < 420; i++) {
    const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 6.2;
    dummy.position.set(PILE.x + Math.cos(a) * r, rand(0.12, 0.4), PILE.z + Math.sin(a) * r);
    dummy.updateMatrix();
    fl.setMatrixAt(i, dummy.matrix);
    fl.setColorAt(i, col.setHex(colors[i % colors.length]));
  }
  garden.add(fl);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3, x = PILE.x + Math.cos(a) * 5, z = PILE.z + Math.sin(a) * 5;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.6, 6), mat(0x7a5a3a));
    tr.position.set(x, 0.8, z);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), mat(0x4f8f3a));
    crown.position.set(x, 2.0, z);
    garden.add(tr, crown);
  }
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 0.5, 20), mat(0xe8e0d0));
  basin.position.set(PILE.x, 0.25, PILE.z);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), mat(0x6fc0e0, { roughness: 0.2 }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(PILE.x, 0.51, PILE.z);
  garden.add(basin, pool);
  garden.visible = false;
  const gHolder = new THREE.Group();
  gHolder.position.set(PILE.x, 0, PILE.z);
  garden.position.set(-PILE.x, 0, -PILE.z);
  gHolder.add(garden);
  scene.add(gHolder);
  S.upd = (dt) => {
    const ph = S.phase, pt = S.pt;
    setMood(ph === 'sky' ? 'night' : ph === 'wood' ? 'dusk' : ph === 'fire' ? 'dusk' : 'day');
    star.visible = ph === 'sky';
    star.material.opacity = ph === 'sky' ? Math.max(0, 1 - Math.max(0, pt - 10) / 4) : 0;
    moon.visible = ph === 'sky';
    moon.position.y = 20 + Math.min(1, pt / 12) * 90;
    logs.visible = ph === 'wood' || ph === 'fire' || (ph === 'garden' && pt < 3);
    let f = 0;
    if (ph === 'fire') f = ease(pt / 3);
    else if (ph === 'garden') f = 1 - ease(pt / 3);
    flames.visible = f > 0.01;
    flames.children.forEach((c) => {
      const k = f * (0.8 + Math.sin(S.t * 7 + c.userData.s) * 0.15 + Math.random() * 0.08);
      c.scale.set(f, Math.max(0.01, k), f);
      c.position.y = (c.userData.h * k) / 2;
    });
    light.intensity = f * 40 * (0.9 + Math.random() * 0.2);
    embers.visible = f > 0.05;
    const p = embers.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { let y = p.getY(i) + dt * rand(1.5, 3.5); if (y > 12) y = 0; p.setY(i, y); }
    p.needsUpdate = true;
    garden.visible = ph === 'garden';
    const g = ph === 'garden' ? ease((pt - 1.5) / 4) : 0;
    gHolder.scale.setScalar(Math.max(0.001, g));
    logs.scale.setScalar(ph === 'garden' ? Math.max(0.001, 1 - pt / 3) : 1);
  };
}

// ======================= Musa (as): das Körbchen auf dem Nil =======================
const RIVER_Z = -12;
function nile(scene) {
  moodSky(scene, 'dawn');
  ground(scene, 0xd8c79a);
  mountains(scene, 10, 280, 0xb08a5a);
  const river = water(scene, 420, 14, 120, 0x3b7f9a, 0.05);
  river.m.position.z = RIVER_Z;
  river.amp = 0.06;
  for (const z of [RIVER_Z + 8.5, RIVER_Z - 8.5]) { const bank = new THREE.Mesh(new THREE.PlaneGeometry(420, 4), mat(0x7a9a4a, { roughness: 1 })); bank.rotation.x = -Math.PI / 2; bank.position.set(0, 0.03, z); scene.add(bank); }
  const reed = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.03, 1.8, 4), mat(0x8aa04a), 900);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 900; i++) {
    const side = i % 2 ? 1 : -1;
    dummy.position.set(rand(-100, 120), 0.9, RIVER_Z + side * rand(6.4, 8));
    dummy.rotation.set(rand(-0.2, 0.2), 0, rand(-0.2, 0.2));
    dummy.scale.y = rand(0.6, 1.3);
    dummy.updateMatrix();
    reed.setMatrixAt(i, dummy.matrix);
  }
  scene.add(reed);
  for (let i = 0; i < 30; i++) { const x = rand(-90, 110), north = i % 2 === 0; if (north && x > 38 && x < 82) continue;
    if (!north && x > -14 && x < 22) continue; palm(scene, x, RIVER_Z + (north ? -1 : 1) * rand(13, 28)); }
  // Haus der Mutter am Ufer (bei dir) und der Palast weiter flussabwärts
  house(scene, -7, 0, 5, 3.2, 4.5, 0xb8936a);
  const palace = new THREE.Group();
  const pm = mat(0xeadfc8, { roughness: 0.7 });
  const main = new THREE.Mesh(new THREE.BoxGeometry(34, 11, 14), pm);
  main.position.set(0, 5.5, 0);
  palace.add(main);
  for (let i = 0; i < 10; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 9, 12), pm); c.position.set(-15 + i * 3.33, 4.5, 8); palace.add(c); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(36, 1.4, 18), mat(0xd9c49a));
  roof.position.set(0, 11.2, 2);
  palace.add(roof);
  for (let i = 0; i < 5; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 1.2), pm); st.position.set(0, 0.15 + i * 0.3, 9.2 + (4 - i) * 1.2); palace.add(st); }
  palace.position.set(60, 0, RIVER_Z - 24);
  scene.add(palace);
  // Körbchen
  const basket = new THREE.Group();
  const weave = canvasTex(64, 64, (ctx, w, h) => { ctx.fillStyle = '#a07a40'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 3; for (let i = 0; i < w; i += 8) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 8, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i + 6); ctx.stroke(); } });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10, 0, TAU, Math.PI / 2, Math.PI / 2), mat(0xffffff, { map: weave, side: THREE.DoubleSide }));
  b.scale.set(1, 0.6, 1.5);
  const cloth = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 8, 0, TAU, 0, Math.PI / 2), mat(0xf2ede0));
  cloth.scale.set(1, 0.25, 1.4);
  cloth.position.y = -0.02;
  basket.add(b, cloth);
  basket.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(basket);
  const SHORE = new THREE.Vector3(-1.2, 0.3, -3.2), WATER = new THREE.Vector3(-1.2, 0.3, RIVER_Z + 5), PALACE = new THREE.Vector3(57, 0.3, RIVER_Z - 6);
  S.upd = (dt) => {
    const ph = S.phase, pt = S.pt;
    setMood(ph === 'home' || ph === 'basket' ? 'dawn' : ph === 'back' ? 'dusk' : 'day');
    waves(river, dt, 0.4);
    let p;
    if (ph === 'home') p = SHORE;
    else if (ph === 'basket') p = new THREE.Vector3().lerpVectors(SHORE, WATER, ease((pt - 3) / 5));
    else if (ph === 'float') p = new THREE.Vector3(WATER.x + Math.min(48, pt * 1.6), 0.3, WATER.z - Math.min(1, pt / 30) * 6);
    else if (ph === 'palace') p = new THREE.Vector3().lerpVectors(new THREE.Vector3(47, 0.3, RIVER_Z - 3), PALACE, ease(pt / 8));
    else p = new THREE.Vector3(-6.2, 0.3, 3);
    basket.position.copy(p);
    const onWater = ph === 'float' || ph === 'palace' || (ph === 'basket' && pt > 6);
    if (onWater) { basket.position.y = 0.12 + Math.sin(S.t * 1.6) * 0.04; basket.rotation.z = Math.sin(S.t * 1.1) * 0.05; } else basket.rotation.z = 0;
    basket.rotation.y = ph === 'float' ? Math.PI / 2 : 0;
  };
}

// ======================= Yunus (as): Schiff, Sturm, Wal und Strand =======================
const BEACH_Z = 70;
function sea(scene) {
  moodSky(scene, 'dusk');
  const sw = water(scene, 700, 700, 80, 0x1e4a6a, 0);
  sw.amp = 0.3;
  // Küste mit der Stadt in der Ferne
  const coast = new THREE.Mesh(new THREE.BoxGeometry(260, 2, 40), mat(0xb8a27a));
  coast.position.set(-140, 0.3, -230);
  scene.add(coast);
  for (let i = 0; i < 24; i++) house(scene, -200 + rand(0, 120), -230 + rand(-12, 6), rand(4, 8), rand(3, 8), rand(4, 8), 0xd6c4a0);
  // Schiff: Bug zeigt nach −z, du stehst hinten an Deck
  const ship = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(-6, 2); sh.lineTo(6, 2); sh.lineTo(4.5, 0); sh.lineTo(-4.5, 0); sh.lineTo(-6, 2);
  const hg = new THREE.ExtrudeGeometry(sh, { depth: 3.2, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 2 });
  hg.translate(0, -0.6, -1.6);
  const hull = new THREE.Mesh(hg, mat(0x6a4a2e));
  hull.rotation.y = Math.PI / 2;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.2, 12), mat(0x8a6a44));
  deck.position.y = 1.4;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 8, 8), mat(0x5a3d22));
  mast.position.set(0, 5.4, -1.5);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 5, 8, 8), mat(0xefe6d2, { side: THREE.DoubleSide }));
  sail.position.set(0, 5.8, -1.4);
  // Kisten (das Schiff ist schwer beladen)
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), mat(0x9a7a4a)); c.position.set(rand(-1.2, 1.2), 1.85, rand(-5, -2.6)); ship.add(c); }
  ship.add(hull, deck, mast, sail);
  ship.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(ship);
  const r = rain(scene, 0, 0);
  // Wal
  const whale = new THREE.Group();
  const wm = mat(0x3a4a5e, { roughness: 0.5 });
  const wb = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), wm);
  wb.scale.set(2.6, 2.1, 8);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), mat(0x9aa8b8));
  belly.scale.set(2.2, 1.4, 7);
  belly.position.y = -0.8;
  const tail = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.2, 3), wm);
  tail.scale.set(1, 1, 0.2);
  tail.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  tail.position.z = 8.5;
  for (const x of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0x101418 })); eye.position.set(x * 2.0, 0.3, -5.6); whale.add(eye); }
  whale.add(wb, belly, tail);
  scene.add(whale);
  // Dunkelheit im Bauch des Wals: dunkle Hülle um dich, darin leise leuchtende Pünktchen
  const dark = new THREE.Group();
  dark.add(new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshBasicMaterial({ color: 0x020306, side: THREE.BackSide, fog: false })));
  const dots = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 360 }, () => rand(-4.5, 4.5)), 3)), new THREE.PointsMaterial({ color: 0x6fd8ff, size: 0.05, transparent: true, opacity: 0.7, fog: false }));
  dots.position.y = 1.6;
  dark.add(dots);
  dark.visible = false;
  scene.add(dark);
  // Strand mit Kürbispflanze
  const beach = new THREE.Mesh(new THREE.CylinderGeometry(60, 64, 1, 40), mat(0xe6d3a0, { roughness: 1 }));
  beach.position.set(0, -0.2, BEACH_Z + 50);
  scene.add(beach);
  for (let i = 0; i < 10; i++) palm(scene, rand(-40, 40), BEACH_Z + rand(15, 40));
  const plant = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU, leaf = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 6), mat(0x5a9a3a, { side: THREE.DoubleSide }));
    leaf.scale.set(1, 0.12, 1.2);
    leaf.position.set(Math.cos(a) * 0.7, 1.9 + Math.sin(i) * 0.15, Math.sin(a) * 0.7);
    leaf.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
    plant.add(leaf);
  }
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2, 6), mat(0x5a7a2a));
  stalk.position.y = 1;
  const gourd = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0xd8c050));
  gourd.position.set(0.3, 0.2, 0.4);
  gourd.scale.y = 1.4;
  plant.add(stalk, gourd);
  plant.position.set(1.4, 0.3, BEACH_Z - 5.5);
  scene.add(plant);
  S.upd = (dt) => {
    const ph = S.phase, pt = S.pt;
    setMood(ph === 'ship' ? 'dusk' : ph === 'storm' || ph === 'whale' ? 'storm' : ph === 'dark' ? 'night' : 'dawn');
    sw.amp += ((ph === 'storm' ? 1.4 : ph === 'whale' ? 1.0 : ph === 'shore' ? 0.15 : 0.35) - sw.amp) * Math.min(1, dt);
    waves(sw, dt, 0.1);
    const bob = Math.sin(S.t * 1.1) * sw.amp * 0.45;
    ship.position.set(0, bob, 0);
    ship.visible = ph !== 'dark' && ph !== 'shore';
    sw.m.visible = ph !== 'dark';
    ship.rotation.z = Math.sin(S.t * 0.8) * 0.06 * sw.amp;
    ship.rotation.x = Math.sin(S.t * 0.6) * 0.03 * sw.amp;
    r.visible = ph === 'storm' || ph === 'whale';
    rainUpdate(r, dt, 0);
    if (ph === 'storm' && Math.random() < dt * 0.4) S.sky.flash = 1;
    whale.visible = ph === 'whale' || ph === 'shore';
    if (ph === 'whale') { whale.position.set(8, -4 + 4.2 * ease(pt / 5), -16); whale.rotation.set(0, 0.5, 0); } else if (ph === 'shore') { whale.position.set(12, -0.6, BEACH_Z - 14 - pt * 2.5); whale.rotation.set(0, Math.PI, 0); }
    dark.visible = ph === 'dark';
    dark.position.set(0, 0, 0);
    dots.rotation.y += dt * 0.05;
    const sail0 = sail.geometry.attributes.position;
    for (let i = 0; i < sail0.count; i++) sail0.setZ(i, Math.sin(sail0.getX(i) * 0.6 + S.t * 2) * 0.12 * sw.amp + (1 - (sail0.getY(i) / 2.5) ** 2) * 0.4);
    sail0.needsUpdate = true;
    S.lift = ph === 'shore' ? 0 : ph === 'dark' ? 0 : 1.5 + bob;
  };
}

// ======================= Süleyman (as) und die Ameise =======================
const HILL = { x: 0.5, z: -1.7 };
function valley(scene) {
  moodSky(scene, 'day');
  ground(scene, 0x86a85e);
  mountains(scene, 14, 230, 0x8a7a5a);
  for (let i = 0; i < 40; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.2, 1.4), 0), mat(0x9a9080, { flatShading: true })); const x = rand(-40, 40), z = rand(-60, 20); if (Math.hypot(x, z) < 5) continue; r.position.set(x, 0.2, z); scene.add(r); }
  const hill = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.42, 16), mat(0x8a6a44, { roughness: 1 }));
  hill.position.set(HILL.x, 0.21, HILL.z);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0x1a120a }));
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(HILL.x, 0.425, HILL.z);
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), mat(0xa09888, { flatShading: true }));
  stone.scale.y = 0.45;
  stone.position.set(-0.25, 0.08, -1.05);
  scene.add(hill, hole, stone);
  // Ameisen: viele kleine (Instanzen) und eine große auf dem Stein, die spricht
  const antGeo = new THREE.CapsuleGeometry(0.006, 0.02, 2, 6);
  antGeo.rotateX(Math.PI / 2);
  const ants = new THREE.InstancedMesh(antGeo, mat(0x1a1410), 260);
  const A = Array.from({ length: 260 }, () => ({ a: rand(0, TAU), r: rand(0.6, 3.5), v: rand(0.08, 0.16) }));
  scene.add(ants);
  const hero = new THREE.Group();
  const am = mat(0x2a1a12, { roughness: 0.5 });
  [[0, 0.05], [0.07, 0.04], [-0.08, 0.055]].forEach(([z, r], i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), am); s.position.set(0, 0.06, -z); if (i === 2) s.scale.z = 1.4; hero.add(s); });
  for (let i = 0; i < 6; i++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.09, 4), am); leg.position.set((i % 2 ? 1 : -1) * 0.05, 0.03, -0.06 + Math.floor(i / 2) * 0.05); leg.rotation.z = (i % 2 ? -1 : 1) * 1.0; hero.add(leg); }
  for (const x of [-1, 1]) { const an = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.09, 4), am); an.position.set(x * 0.025, 0.12, -0.11); an.rotation.set(-0.8, 0, x * 0.4); hero.add(an); }
  hero.position.set(-0.25, 0.13, -1.05);
  hero.rotation.y = Math.PI * 0.9;
  hero.scale.setScalar(1.3);
  scene.add(hero);
  // Das Heer in der Ferne: Fahnen und Pferde, darüber Vögel
  const army = new THREE.Group();
  const flagCols = [0x2e7d5b, 0xc9a85c, 0x3a6ea5, 0xb04a4a];
  for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 4 + (row % 2) * 2, z = row * 5;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 6), mat(0x5a4a3a));
    pole.position.set(x, 2.5, z);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), mat(flagCols[(i + row) % 4], { side: THREE.DoubleSide }));
    flag.position.set(x + 0.8, 4.4, z);
    army.add(pole, flag);
    if (i % 2 === 0) { const h = animal('horse'); h.position.set(x + 1.5, 0, z + 1); h.rotation.y = 0; h.userData.walk = true; army.add(h); }
  }
  scene.add(army);
  const birds = Array.from({ length: 14 }, (_, i) => { const b = bird(i % 3 ? 0x6a6a6a : 0xffffff, 2.5); scene.add(b); return b; });
  let armyZ = -140;
  S.upd = (dt) => {
    const ph = S.phase, pt = S.pt;
    const target = ph === 'gift' ? -70 : ph === 'ant' ? -38 : -38;
    const moving = armyZ < target - 0.05;
    if (moving) armyZ = Math.min(target, armyZ + dt * 5);
    army.position.set(0, 0, armyZ);
    army.rotation.y = Math.PI;
    army.children.forEach((c) => { if (c.userData.walk) legSwing(c, S.t, moving ? 1 : 0); });
    birds.forEach((b, i) => { b.position.set(Math.sin(S.t * 0.2 + i) * 12 + (i - 7) * 2, 14 + (i % 4) * 2, armyZ + 6 + Math.cos(S.t * 0.3 + i) * 4); b.rotation.y = Math.PI; flap(b, S.t + i * 0.7); });
    // Ameisen laufen zum Hügel; ab dem Ruf der Ameise schneller hinein
    const hurry = ph === 'ant' ? 2.6 : ph === 'smile' ? 0.6 : 1;
    const dummy = new THREE.Object3D();
    A.forEach((a, i) => {
      a.r -= a.v * hurry * dt;
      if (a.r < 0.08) { a.r = ph === 'ant' && pt > 4 ? 99 : rand(2.5, 3.5); a.a = rand(0, TAU); }
      const vis = a.r < 50;
      dummy.position.set(HILL.x + Math.cos(a.a + a.r * 0.6) * a.r, vis ? 0.008 + Math.max(0, 0.42 * (1 - a.r / 0.55)) : -5, HILL.z + Math.sin(a.a + a.r * 0.6) * a.r);
      dummy.rotation.y = -(a.a + a.r * 0.6) + Math.PI / 2;
      dummy.updateMatrix();
      ants.setMatrixAt(i, dummy.matrix);
    });
    ants.instanceMatrix.needsUpdate = true;
    hero.visible = ph !== 'gift';
    hero.position.y = 0.13 + (ph === 'ant' ? Math.abs(Math.sin(S.t * 5)) * 0.015 : 0);
    hero.rotation.y = Math.PI * 0.9 + (ph === 'ant' ? Math.sin(S.t * 2) * 0.3 : 0);
    if (ph === 'smile' && pt > 6) { A.forEach((a) => { if (a.r > 50) a.r = rand(1, 3); }); }
  };
}

// ======================= Die Hidschra: Höhle, Spinne und Taube =======================
const MEDINA_Z = 205;
function cave(scene) {
  moodSky(scene, 'night');
  ground(scene, 0x6a5a48);
  mountains(scene, 16, 200, 0x3a3028);
  // Lichter von Mekka in der Ferne
  const city = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 900 }, (_, i) => (i % 3 === 0 ? rand(-50, 50) : i % 3 === 1 ? rand(0.5, 6) : rand(-170, -120))), 3)), new THREE.PointsMaterial({ color: 0xffc870, size: 0.9, transparent: true, opacity: 0.9 }));
  scene.add(city);
  // Berg Sevr mit der Höhle: Halbkugel aus Fels, der Eingang zeigt nach −z
  const geo = new THREE.SphereGeometry(4, 40, 20, (3 * Math.PI) / 2 + 0.45, TAU - 0.9, 0, Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 1 + rand(-0.06, 0.06); p.setXYZ(i, p.getX(i) * k, p.getY(i) * (1 + rand(-0.04, 0.04)), p.getZ(i) * k); }
  geo.computeVertexNormals();
  const rock = new THREE.Mesh(geo, mat(0x5e5044, { side: THREE.DoubleSide, flatShading: true, roughness: 1 }));
  rock.scale.y = 0.75;
  const mountain = new THREE.Mesh(new THREE.ConeGeometry(16, 14, 9), mat(0x4e4238, { flatShading: true }));
  mountain.position.set(0, 2, 22);
  scene.add(rock, mountain);
  const moonLight = new THREE.PointLight(0x8fa0d0, 3, 12);
  moonLight.position.set(0, 2.5, -5);
  scene.add(moonLight);
  // Spinnennetz über dem Eingang (wächst Faden für Faden)
  const seg = [];
  const cx = 0, cy = 1.25, cz = -3.4, R = 1.3;
  for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; seg.push(cx, cy, cz, cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.9, cz); }
  for (let ring = 1; ring <= 9; ring++) for (let i = 0; i < 14; i++) {
    const r = (ring / 9.5) * R, a = (i / 14) * TAU, b = ((i + 1) / 14) * TAU;
    seg.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, cz, cx + Math.cos(b) * r, cy + Math.sin(b) * r * 0.9, cz);
  }
  const webGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
  const web = new THREE.LineSegments(webGeo, new THREE.LineBasicMaterial({ color: 0xe8eef8, transparent: true, opacity: 0.75 }));
  const spider = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0x1a1410));
  scene.add(web, spider);
  // Busch mit Taubennest, Taube fliegt herbei
  const bush = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), mat(0x4f6a3a));
  bush.position.set(1.05, 0.4, -4.1);
  const nest = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 6, 14), mat(0x7a5a3a));
  nest.rotation.x = Math.PI / 2;
  nest.position.set(1.05, 0.85, -4.1);
  const eggs = [0, 1].map((i) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0xf6f2ea)); e.scale.y = 1.3; e.position.set(1.02 + i * 0.06, 0.86, -4.1); return e; });
  const dove = bird(0xf4f4f4, 1.0);
  scene.add(bush, nest, ...eggs, dove);
  // Fackeln der Verfolger
  const torches = [0, 1, 2].map((i) => {
    const g = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 5), mat(0x5a3a22));
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 6), new THREE.MeshBasicMaterial({ color: 0xffa040 }));
    fl.position.y = 0.5;
    const l = new THREE.PointLight(0xff8a30, 0, 14, 1.5);
    l.position.y = 0.6;
    g.add(stick, fl, l);
    g.userData = { l, fl, off: i };
    g.visible = false;
    scene.add(g);
    return g;
  });
  // Medina am Morgen: Palmen, Häuser, Tücher zur Begrüßung
  for (let i = 0; i < 26; i++) palm(scene, rand(-40, 40), MEDINA_Z + rand(8, 60));
  for (let i = 0; i < 14; i++) house(scene, (i % 2 ? 1 : -1) * rand(7, 25), MEDINA_Z + 10 + i * 3.5, rand(4, 7), rand(3, 5), rand(4, 6), 0xd6b88a);
  const flagCols = [0xf2efe6, 0x2e7d5b, 0xc9a85c];
  for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), mat(flagCols[i % 3], { side: THREE.DoubleSide })); f.position.set((i % 2 ? 1 : -1) * 4, 3.2, MEDINA_Z + 6 + i * 2.5); f.rotation.y = Math.PI / 2; scene.add(f); }
  const DOVE0 = new THREE.Vector3(-4, 5, -14), DOVE1 = new THREE.Vector3(1.05, 0.95, -4.1);
  S.upd = (dt) => {
    const ph = S.phase, pt = S.pt;
    setMood(ph === 'medina' ? 'dawn' : 'night');
    city.visible = ph !== 'medina';
    const total = webGeo.attributes.position.count;
    const k = ph === 'web' ? ease((pt - 1) / 12) : ph === 'search' || ph === 'medina' ? 1 : 0;
    webGeo.setDrawRange(0, Math.floor(total * k / 2) * 2);
    web.visible = k > 0;
    spider.visible = ph === 'web' || ph === 'search';
    const sp = webGeo.attributes.position, si = Math.max(0, Math.floor(total * k) - 1);
    if (si > 0) spider.position.set(sp.getX(si), sp.getY(si), sp.getZ(si) - 0.01);
    const nestOn = ph === 'web' || ph === 'search' || ph === 'medina';
    nest.visible = nestOn && (ph !== 'web' || pt > 4);
    eggs.forEach((e) => { e.visible = nest.visible && (ph !== 'web' || pt > 9); });
    dove.visible = nestOn;
    if (ph === 'web') {
      const d = ease((pt - 2) / 5);
      dove.position.lerpVectors(DOVE0, DOVE1, d);
      dove.position.y += Math.sin(d * Math.PI) * 1.5;
      dove.rotation.y = Math.atan2(DOVE1.x - DOVE0.x, DOVE1.z - DOVE0.z) + Math.PI;
      flap(dove, S.t, d < 1 ? 1 : 0.1);
    } else { dove.position.copy(DOVE1).add(new THREE.Vector3(0, 0.08, 0)); flap(dove, S.t, 0.05); }
    // Verfolger kommen bis vor die Höhle, bleiben stehen und gehen wieder
    torches.forEach((g) => {
      g.visible = ph === 'search';
      if (!g.visible) return;
      const o = g.userData.off;
      const k = pt < 7 ? ease(pt / 7) : pt < 14 ? 1 : 1 - ease((pt - 14) / 7);
      g.position.set(-14 + o * 3 + k * (13.5 - o * 2.2), 0.9 + Math.sin(S.t * 3 + o) * 0.05, -32 + k * (24 - o * 1.2));
      g.userData.l.intensity = (5 + Math.random() * 1.5) * Math.max(0.15, k);
      g.userData.fl.scale.y = 0.8 + Math.random() * 0.4;
    });
    moonLight.intensity = ph === 'medina' ? 0 : 3;
  };
}

// ======================= Sternenhimmel: gesammelte Sterne =======================
let skyData = [];
export const setSkyData = (groups) => { skyData = groups; };
function starsky(scene) {
  moodSky(scene, 'night');
  ground(scene, 0x1c2030);
  mountains(scene, 18, 160, 0x141824);
  const crescent = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (ctx, w) => {
    ctx.fillStyle = '#f6efd2'; ctx.beginPath(); ctx.arc(w / 2, w / 2, w * 0.4, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(w / 2 + w * 0.17, w / 2 - w * 0.08, w * 0.36, 0, TAU); ctx.fill();
  }), transparent: true, fog: false }));
  crescent.scale.setScalar(12);
  crescent.position.set(55, 70, -90);
  scene.add(crescent);
  const twinkle = [];
  const n = skyData.length, dist = 70;
  skyData.forEach((grp, gi) => {
    // Sternbild: Gruppen nebeneinander über dem Horizont vor dir
    const az = n > 1 ? -1.05 + (2.1 * gi) / (n - 1) : 0, el = 0.5 + (gi % 2) * 0.22;
    const center = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(dist);
    const right = new THREE.Vector3(Math.cos(az), 0, Math.sin(az)), up = new THREE.Vector3().crossVectors(right, center.clone().normalize());
    const pts = [];
    grp.items.forEach((it, i) => {
      // Spirale nach außen (Goldener Winkel), damit jede Gruppe ordentlich aussieht
      const r = 1.8 * Math.sqrt(i + 0.6), a = i * 2.39996;
      const pos = center.clone().addScaledVector(right, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r * 0.8);
      const s = glowSprite(it.on ? 0xffe8a8 : 0x8fa0c8, it.on ? 3.6 : 1.7);
      s.material.opacity = it.on ? 1 : 0.7;
      s.position.copy(pos);
      scene.add(s);
      if (it.on) { twinkle.push({ s, base: 3.6, k: rand(0, TAU) }); pts.push(pos); }
    });
    if (pts.length > 1) {
      const lg = new THREE.BufferGeometry().setFromPoints(pts);
      scene.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xc9a85c, transparent: true, opacity: 0.35, fog: false })));
    }
    const lab = label(`${grp.icon} ${grp.name}  ${grp.items.filter((x) => x.on).length}/${grp.items.length}`, 3.2);
    lab.position.copy(center).addScaledVector(up, -1.8 * Math.sqrt(grp.items.length + 1) - 2.2);
    scene.add(lab);
  });
  S.upd = (dt) => { for (const tw of twinkle) { tw.k += dt * 2; tw.s.scale.setScalar(tw.base * (0.85 + Math.sin(tw.k) * 0.15)); } };
}

export const STORY_SCENES = { ark, fire, nile, sea, valley, cave, starsky };

export function buildStoryScene(group, id) {
  S = { id, phase: null, pt: 0, t: 0, upd: null, lift: 0 };
  STORY_SCENES[id](group);
}
export const clearStory = () => { S = null; };
export function setStoryPhase(phase) {
  if (!S || S.phase === phase) return;
  S.phase = phase;
  S.pt = 0;
}
export function updateStory(dt) {
  if (!S) return;
  S.t += dt;
  S.pt += dt;
  skyUpdate(dt);
  S.upd?.(dt);
}
// Höhe, um die du gerade angehoben wirst (an Deck der Arche bzw. des Schiffs)
export const storyLift = () => S?.lift || 0;
