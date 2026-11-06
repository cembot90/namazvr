// Orte für Umre und Hac – vereinfacht und respektvoll gestaltet, keine detailgetreuen Nachbauten.
// Jeder Ort wird in Ortskoordinaten gebaut (y oben, −z = Norden); main.js verschiebt den Ort so,
// dass du dort stehst, wo der aktuelle Schritt dich hinführt.
import * as THREE from 'three';
import { Guide } from './figure.js';

// Maße (Meter). Kaaba vereinfacht als Würfel 11 × 11 × 13, Ecken zu den Himmelsrichtungen:
// Osten = Ecke mit dem Schwarzen Stein (Start des Tavaf), Norden = ʿIrāqī, Westen = Shāmī, Süden = Yemānī.
export const KAABA = { half: 5.5, h: 13 };
export const TAWAF_R = 14.5;
export const SAY_L = 110; // Safā–Marwa verkürzt (in Wirklichkeit etwa 450 m)
export const GREEN = [0.42, 0.56]; // Abschnitt mit den grünen Lichtern (Anteil der Strecke)
// Jamarāt: kleine, mittlere, große Säule entlang der z-Achse
export const JAMARAT = [{ z: 0 }, { z: -40 }, { z: -80 }];
// Maqām Ibrāhīm vor der Tür (Nordosten), Zamzam-Spender am Rand des Tavaf-Platzes
export const MAQAM = { x: 9.5, z: -9.5 };

let crowd = [];
const rand = (a, b) => a + Math.random() * (b - a);

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function sky(scene, night) {
  scene.add(new THREE.HemisphereLight(night ? 0x8a9ccf : 0xfff6e8, night ? 0x2a2420 : 0x9a8a70, night ? 1.2 : 2.4));
  const sun = new THREE.DirectionalLight(night ? 0xbcc8ff : 0xffe7c0, night ? 0.4 : 2.0);
  sun.position.set(30, 60, 20);
  scene.add(sun);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 16),
    new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: canvasTex(16, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      if (night) { g.addColorStop(0, '#050a1c'); g.addColorStop(0.5, '#101c3a'); g.addColorStop(1, '#2a2a3a'); } else { g.addColorStop(0, '#5f9ee0'); g.addColorStop(0.5, '#a9d0f0'); g.addColorStop(1, '#f2e6cf'); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }) }),
  );
  scene.add(dome);
  if (night) {
    const stars = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i < 600; i++) { const a = Math.random() * Math.PI * 2, e = rand(0.15, 1.4); pts.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380); }
    stars.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6 })));
  }
}

function ground(scene, color, size = 800, map = null) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color, roughness: 0.95, map }));
  g.rotation.x = -Math.PI / 2;
  scene.add(g);
  return g;
}

function mountains(scene, n = 14, r = 260, color = 0x8a6a4a) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-0.1, 0.1);
    const m = new THREE.Mesh(new THREE.ConeGeometry(rand(40, 80), rand(40, 90), 6), mat);
    m.position.set(Math.cos(a) * r, 15, Math.sin(a) * r);
    scene.add(m);
  }
}

// Pilger im Iḥrām (Männer weiß, Frauen in bedeckter Kleidung); mode: 'tawaf' | 'say' | 'stand' | 'dua'
function pilgrims(scene, list) {
  for (const p of list) {
    const f = p.female;
    const g = new Guide({ robe: f ? [0xf3f0e8, 0x2b2d33, 0x5f7f86, 0xd9cdb4][Math.floor(Math.random() * 4)] : 0xfbfaf6, skin: [0xe2c2a2, 0xc9a988, 0xa77b58, 0x8a5e3c, 0x6b4630][Math.floor(Math.random() * 5)], scarf: 0xf3f0e8, cap: false, scale: rand(0.92, 1.06) });
    g.setGender(f ? 'f' : 'm');
    g.speed = rand(3, 5);
    if (p.mode === 'dua') g.setPose('dua');
    scene.add(g.group);
    crowd.push({ g, ...p, t: rand(0, 10) });
  }
}

// Kiswa: schwarz mit feinem Muster, goldenes Schriftband
function kiswaTextures() {
  const cloth = canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#0b0b0d'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.ellipse(x + 32, y + 32, 22, 12, 0, 0, Math.PI * 2); ctx.stroke(); }
  });
  cloth.wrapS = cloth.wrapT = THREE.RepeatWrapping;
  cloth.repeat.set(3, 3);
  const band = canvasTex(2048, 160, (ctx, w, h) => {
    ctx.fillStyle = '#0b0b0d'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c9a85c'; ctx.lineWidth = 6; ctx.strokeRect(6, 10, w - 12, h - 20);
    ctx.fillStyle = '#d9b867';
    ctx.font = '90px Amiri, "Noto Naskh Arabic", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
    ctx.fillText('لَا إِلَٰهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ', w / 2, h / 2 + 6);
  });
  return { cloth, band };
}

function kaaba(scene) {
  const { half, h } = KAABA;
  const g = new THREE.Group();
  g.rotation.y = Math.PI / 4; // Ecken zeigen in die Himmelsrichtungen
  const { cloth, band } = kiswaTextures();
  const body = new THREE.Mesh(new THREE.BoxGeometry(half * 2, h, half * 2), new THREE.MeshStandardMaterial({ map: cloth, roughness: 0.9 }));
  body.position.y = h / 2;
  // Sockel (Shādharwān)
  const base = new THREE.Mesh(new THREE.BoxGeometry(half * 2 + 0.6, 0.35, half * 2 + 0.6), new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.5 }));
  base.position.y = 0.17;
  g.add(body, base);
  // Goldband auf allen vier Seiten
  const bandMat = new THREE.MeshStandardMaterial({ map: band, roughness: 0.5, metalness: 0.2 });
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, 0.95), bandMat);
    const a = i * Math.PI / 2;
    b.position.set(Math.sin(a) * (half + 0.01), h * 0.7, Math.cos(a) * (half + 0.01));
    b.rotation.y = a;
    g.add(b);
  }
  // Tür (Nordostseite): im gedrehten Würfel ist das die lokale +x-Seite, nahe der Ostecke
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9b867, roughness: 0.3, metalness: 0.8 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.1, 1.8), gold);
  door.position.set(half + 0.05, 2.2 + 1.55, 2.2);
  g.add(door);
  scene.add(g);
  // Schwarzer Stein in der Ostecke, Silberrahmen
  const stone = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.1, 10, 24), new THREE.MeshStandardMaterial({ color: 0xc0c4c8, metalness: 0.9, roughness: 0.25 }));
  const d = half * Math.SQRT2 + 0.12;
  stone.position.set(d, 1.5, 0);
  stone.rotation.y = Math.PI / 2;
  const blk = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: 0x1a1414, roughness: 0.4 }));
  blk.position.set(d - 0.05, 1.5, 0);
  scene.add(stone, blk);
  // Ḥijr Ismāʿīl: halbrunde Mauer vor der Nordwestseite
  const hijrMat = new THREE.MeshStandardMaterial({ color: 0xeeeae2, roughness: 0.5 });
  // Halbkreis von der Nord- zur Westecke, nach Nordwesten gewölbt
  const c = new THREE.Vector3(-half / Math.SQRT2, 0.65, -half / Math.SQRT2);
  const u = new THREE.Vector3(Math.SQRT1_2, 0, -Math.SQRT1_2), nrm = new THREE.Vector3(-Math.SQRT1_2, 0, -Math.SQRT1_2);
  const seg = 28;
  for (let i = 0; i <= seg; i++) {
    const b = (i / seg) * Math.PI;
    const p = c.clone().addScaledVector(u, half * Math.cos(b)).addScaledVector(nrm, half * Math.sin(b));
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.25), hijrMat);
    m.position.copy(p);
    m.lookAt(c);
    scene.add(m);
  }
  // Maqām Ibrāhīm: kleiner goldener Schrein mit Glas
  const maqam = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.45, roughness: 0.1 }));
  glass.position.y = 0.9;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold);
  cap.position.y = 1.6;
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.25, 8), hijrMat);
  plinth.position.y = 0.12;
  maqam.add(glass, cap, plinth);
  maqam.position.set(MAQAM.x, 0, MAQAM.z);
  scene.add(maqam);
}

function haram(scene, night) {
  sky(scene, night);
  // Tavaf-Platz aus weißem Marmor
  const marble = canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f2f0ea'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#dcd8ce'; ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 128, 0); ctx.lineTo(i * 128, h); ctx.moveTo(0, i * 128); ctx.lineTo(w, i * 128); ctx.stroke(); }
  });
  marble.wrapS = marble.wrapT = THREE.RepeatWrapping;
  marble.repeat.set(40, 40);
  ground(scene, 0xffffff, 260, marble);
  kaaba(scene);
  // Grünes Licht auf der Linie des Schwarzen Steins (Startlinie) am Säulengang
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x3ddc84, emissive: 0x3ddc84, emissiveIntensity: 2 });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), greenMat);
  lamp.position.set(46, 6, 0);
  scene.add(lamp);
  // Säulengänge ringsum (drei Ebenen) und Minarette
  const stone = new THREE.MeshStandardMaterial({ color: 0xe9e2d2, roughness: 0.7 });
  const n = 64, R = 48;
  const colGeo = new THREE.CylinderGeometry(0.45, 0.5, 6, 12);
  const cols = new THREE.InstancedMesh(colGeo, stone, n * 3);
  const dummy = new THREE.Object3D();
  let k = 0;
  for (let lvl = 0; lvl < 3; lvl++) for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * R, 3 + lvl * 6.4, Math.sin(a) * R);
    dummy.updateMatrix();
    cols.setMatrixAt(k++, dummy.matrix);
  }
  scene.add(cols);
  for (let lvl = 1; lvl <= 3; lvl++) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(R + 4, R + 4, 0.5, 96, 1, true), stone);
    ring.position.y = lvl * 6.4 - 0.2;
    ring.material.side = THREE.DoubleSide;
    scene.add(ring);
  }
  const back = new THREE.Mesh(new THREE.CylinderGeometry(R + 8, R + 8, 19.5, 96, 1, true), new THREE.MeshStandardMaterial({ color: 0xd9cfba, roughness: 0.9, side: THREE.BackSide }));
  back.position.y = 9.75;
  scene.add(back);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const m = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, 80, 10), stone);
    shaft.position.y = 40;
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.6, 8, 10), new THREE.MeshStandardMaterial({ color: 0xd9b867, metalness: 0.6, roughness: 0.4 }));
    top.position.y = 84;
    m.add(shaft, top);
    m.position.set(Math.cos(a) * (R + 14), 0, Math.sin(a) * (R + 14));
    scene.add(m);
  }
  // Lampen nachts
  if (night) {
    const glow = new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd48a, emissiveIntensity: 2 });
    const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 10, 8), glow, n);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; dummy.position.set(Math.cos(a) * (R - 1), 5.5, Math.sin(a) * (R - 1)); dummy.updateMatrix(); lamps.setMatrixAt(i, dummy.matrix); }
    scene.add(lamps);
  }
  // Zamzam-Spender am Rand
  const tank = new THREE.MeshStandardMaterial({ color: 0xb9c4c8, metalness: 0.6, roughness: 0.3 });
  for (const a of [0.9, 1.0, 1.1]) {
    const z = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16), tank);
    z.position.set(Math.cos(a) * 30, 0.55, -Math.sin(a) * 30);
    scene.add(z);
  }
  // Pilger im Tavaf
  const list = [];
  for (let i = 0; i < 34; i++) list.push({ mode: 'tawaf', r: rand(TAWAF_R - 1.5, TAWAF_R + 12), a: rand(0, Math.PI * 2), v: rand(0.8, 1.3), female: Math.random() < 0.35 });
  pilgrims(scene, list);
}

function masa(scene, night) {
  const L = SAY_L;
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x9a8a70, 2.6));
  const marble = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#efece5'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d6d0c4'; ctx.lineWidth = 3; ctx.strokeRect(0, 0, w, h);
  });
  marble.wrapS = marble.wrapT = THREE.RepeatWrapping;
  marble.repeat.set(10, (L + 40) / 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, L + 40), new THREE.MeshStandardMaterial({ map: marble, roughness: 0.4 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -L / 2;
  scene.add(floor);
  const stone = new THREE.MeshStandardMaterial({ color: 0xe9e2d2, roughness: 0.6 });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(40, L + 40), new THREE.MeshStandardMaterial({ color: 0xf3efe6, emissive: 0xf3efe6, emissiveIntensity: 0.25, side: THREE.DoubleSide }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, 9, -L / 2);
  scene.add(ceil);
  const dummy = new THREE.Object3D();
  const zs = [];
  for (let z = 8; z >= -L - 8; z -= 8) zs.push(z);
  const cols = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 9, 1.1), stone, zs.length * 3);
  let k = 0;
  for (const z of zs) for (const x of [-18, 0, 18]) { dummy.position.set(x, 4.5, z); dummy.updateMatrix(); cols.setMatrixAt(k++, dummy.matrix); }
  scene.add(cols);
  for (const x of [-20, 20]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(L + 40, 9), new THREE.MeshStandardMaterial({ color: 0xe2d9c6, roughness: 0.8 }));
    wall.position.set(x, 4.5, -L / 2);
    wall.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(wall);
  }
  // Grüne Lichter: Abschnitt, in dem Männer schneller gehen
  const green = new THREE.MeshStandardMaterial({ color: 0x3ddc84, emissive: 0x3ddc84, emissiveIntensity: 1.6 });
  for (const f of GREEN) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(38, 0.4, 0.4), green);
    bar.position.set(0, 8.6, -f * L);
    scene.add(bar);
  }
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, (GREEN[1] - GREEN[0]) * L), green);
  strip.position.set(-17.5, 8.6, -((GREEN[0] + GREEN[1]) / 2) * L);
  scene.add(strip, strip.clone().translateX(35));
  // Safā (hier) und Marwa (am Ende): Felsen unter einer kleinen Kuppel
  const rock = new THREE.MeshStandardMaterial({ color: 0x9a8a78, roughness: 1, flatShading: true });
  for (const z of [8, -L - 8]) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(5, 0), rock);
    r.scale.set(1.4, 0.45, 0.8);
    r.position.set(0, 0.8, z);
    scene.add(r);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(8, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf1ece0, side: THREE.DoubleSide }));
    dome.position.set(0, 9, z);
    scene.add(dome);
  }
  const list = [];
  for (let i = 0; i < 20; i++) list.push({ mode: 'say', x: rand(-14, 14), s: rand(0, L * 2), v: rand(1.0, 1.6), female: Math.random() < 0.35 });
  pilgrims(scene, list);
  void night;
}

// Zeltstadt Mina
function mina(scene, night) {
  sky(scene, night);
  ground(scene, 0xcdb58e);
  mountains(scene);
  const tent = new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.9 });
  const dummy = new THREE.Object3D();
  const spots = [];
  for (let x = -120; x <= 120; x += 9) for (let z = -160; z <= 40; z += 9) if (Math.hypot(x, z) > 12) spots.push([x + rand(-1, 1), z + rand(-1, 1)]);
  const tents = new THREE.InstancedMesh(new THREE.ConeGeometry(4, 4.2, 4), tent, spots.length);
  spots.forEach(([x, z], i) => { dummy.position.set(x, 2.1, z); dummy.rotation.y = Math.PI / 4; dummy.updateMatrix(); tents.setMatrixAt(i, dummy.matrix); });
  scene.add(tents);
  if (night) addLamps(scene, spots.filter((_, i) => i % 7 === 0));
  pilgrims(scene, Array.from({ length: 10 }, () => ({ mode: 'stand', x: rand(-10, 10), z: rand(-10, 6), female: Math.random() < 0.35 })));
}

function addLamps(scene, spots) {
  const glow = new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd48a, emissiveIntensity: 2 });
  const dummy = new THREE.Object3D();
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.4, 8, 6), glow, spots.length);
  spots.forEach(([x, z], i) => { dummy.position.set(x, 5, z); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
  scene.add(m);
}

// ʿArafāt: weite Ebene, der Jabal ar-Raḥma mit weißer Säule
function arafat(scene, night) {
  sky(scene, night);
  ground(scene, 0xd2bb92);
  mountains(scene, 12, 300);
  const hill = new THREE.Mesh(new THREE.ConeGeometry(45, 55, 9), new THREE.MeshStandardMaterial({ color: 0x8c6e52, roughness: 1, flatShading: true }));
  hill.position.set(0, 27, -120);
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 8, 1.6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  pillar.position.set(0, 58, -120);
  scene.add(hill, pillar);
  // Schattenspender (Sprühnebel-Masten) und Bäume
  const pole = new THREE.MeshStandardMaterial({ color: 0xbfc4c8, metalness: 0.5 });
  const tree = new THREE.MeshStandardMaterial({ color: 0x4f7a3a, roughness: 1 });
  for (let i = 0; i < 40; i++) {
    const x = rand(-90, 90), z = rand(-80, 40);
    if (Math.hypot(x, z) < 10) continue;
    const t = new THREE.Mesh(new THREE.SphereGeometry(rand(2, 3.5), 8, 6), tree);
    t.position.set(x, 3, z);
    scene.add(t);
  }
  for (let i = 0; i < 12; i++) {
    const x = rand(-40, 40), z = rand(-40, 20);
    if (Math.hypot(x, z) < 12) continue; // nicht direkt vor dir
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8, 8), pole);
    p.position.set(x, 4, z);
    scene.add(p);
  }
  pilgrims(scene, Array.from({ length: 18 }, () => ({ mode: 'dua', x: rand(-14, 14), z: rand(-16, 6), female: Math.random() < 0.35 })));
}

// Muzdalifa: nachts unter freiem Himmel, Steinchen sammeln
function muzdalifa(scene) {
  sky(scene, true);
  ground(scene, 0x6e5f4c);
  mountains(scene, 12, 240, 0x3a3028);
  const pebble = new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 1 });
  const dummy = new THREE.Object3D();
  const m = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.05, 0), pebble, 500);
  for (let i = 0; i < 500; i++) { dummy.position.set(rand(-6, 6), 0.03, rand(-6, 6)); dummy.rotation.set(rand(0, 3), rand(0, 3), 0); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }
  scene.add(m);
  const mats = new THREE.MeshStandardMaterial({ color: 0x7a2e2e, roughness: 1 });
  for (let i = 0; i < 16; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2), mats); r.rotation.x = -Math.PI / 2; r.position.set(rand(-20, 20), 0.01, rand(-20, 20)); scene.add(r); }
  addLamps(scene, Array.from({ length: 30 }, () => [rand(-60, 60), rand(-60, 60)]));
  pilgrims(scene, Array.from({ length: 12 }, () => ({ mode: 'stand', x: rand(-12, 12), z: rand(-12, 8), female: Math.random() < 0.35 })));
}

// Jamarāt: drei lange Wände in ovalen Becken auf einer großen Brücke
function jamarat(scene, night) {
  sky(scene, night);
  ground(scene, 0xd8d2c4);
  mountains(scene, 10, 260);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xbdb6a8, roughness: 0.8 });
  const rim = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.6 });
  const sizes = [16, 20, 26];
  JAMARAT.forEach((j, i) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(sizes[i], 6, 1.2), wallMat);
    w.position.set(0, 3, j.z - 8);
    const basin = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 6, 48), rim);
    basin.scale.set(sizes[i] / 2 + 3, 4, 1);
    basin.rotation.x = Math.PI / 2;
    basin.position.set(0, 0.5, j.z - 8);
    scene.add(w, basin);
  });
  // Brücke: Ebene darüber auf Pfeilern
  const deck = new THREE.Mesh(new THREE.BoxGeometry(60, 1, 140), new THREE.MeshStandardMaterial({ color: 0xe9e4d8, side: THREE.DoubleSide }));
  deck.position.set(0, 18, -40);
  scene.add(deck);
  for (let z = 20; z >= -100; z -= 20) for (const x of [-28, 28]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 18, 10), rim);
    p.position.set(x, 9, z);
    scene.add(p);
  }
  pilgrims(scene, Array.from({ length: 16 }, () => ({ mode: 'throw', x: rand(-10, 10), z: rand(-4, 2) + JAMARAT[Math.floor(Math.random() * 3)].z, female: Math.random() < 0.3 })));
}

export const HAJJ_SCENES = { haram, masa, mina, arafat, muzdalifa, jamarat };

export function buildHajjScene(group, id, night) {
  crowd = [];
  HAJJ_SCENES[id](group, night || id === 'muzdalifa');
}

// Pilger bewegen: Tavaf gegen den Uhrzeigersinn, Sa'y hin und her, Werfen, Stehen
export function updateCrowd(dt) {
  for (const p of crowd) {
    p.t += dt;
    const g = p.g;
    if (p.mode === 'tawaf') {
      p.a += (p.v / p.r) * dt;
      const x = p.r * Math.cos(p.a), z = -p.r * Math.sin(p.a);
      g.group.position.set(x, 0, z);
      g.group.rotation.y = Math.atan2(-Math.sin(p.a), -Math.cos(p.a));
      walkSwing(g, p.t);
    } else if (p.mode === 'say') {
      p.s = (p.s + p.v * dt) % (SAY_L * 2);
      const fwd = p.s < SAY_L;
      g.group.position.set(p.x + (fwd ? 2 : -2), 0, fwd ? -p.s : -(SAY_L * 2 - p.s));
      g.group.rotation.y = fwd ? Math.PI : 0;
      walkSwing(g, p.t);
    } else {
      g.group.position.set(p.x, 0, p.z);
      g.group.rotation.y = Math.PI;
      if (p.mode === 'throw') g.setPose(Math.floor(p.t / 2.2) % 2 ? 'throw' : 'stand');
      g.update(dt);
    }
  }
}

// Gehbewegung: Beine und Arme schwingen (nach update(), damit es die Haltung überlagert)
export function walkSwing(g, t, k = 1) {
  g.setPose('stand');
  g.update(0.016);
  const swing = Math.sin(t * 7) * 0.35 * k;
  g.legs[0].hip.rotation.x = swing;
  g.legs[1].hip.rotation.x = -swing;
  g.arms[0].sh.rotation.x = -swing * 0.6;
  g.arms[1].sh.rotation.x = swing * 0.6;
}
