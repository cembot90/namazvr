import * as THREE from 'three';
import { t } from './i18n.js';

// Gebetsraum. Alles hängt an `group`; dessen -Z-Achse ist die Qibla.
// Die Mihrab-Wand liegt immer FRONT Meter vor dem Gebetsplatz (Ursprung), der Raum erstreckt sich nach hinten.
const FRONT = 6;
// Waschraum (Abdesthane): Wand mit Waschbecken dicht vor dem Platz
const WUDU_FRONT = 0.95;
const SIZES = {
  klassisch: { w: 26, d: 30, h: 10 },
  osmanisch: { w: 36, d: 36, h: 13 },
  andalusisch: { w: 44, d: 40, h: 8.5 },
  gross: { w: 60, d: 56, h: 18 },
  wudu: { w: 9, d: 6, h: 3.4 },
};
// Maße des aktuell gebauten Raums; NIGHT: Fenster dunkel, Lampen heller
let W, D, H, HW, HD, NIGHT = false;
// Säulen und Pfeiler als Kreise [x, z, r] in Weltkoordinaten – dort stellt sich niemand hin
let OBSTACLES = [];
// Wasserstrahlen im Waschraum (vorn der eigene Hahn) und begehbarer Bereich, falls vom Standard abweichend
let WATER = [];
let BOUNDS = null;
// Hocker zum Füßewaschen [x, z] und die Wasserstrahlen der niedrigen Hähne
let STOOLS = [], FOOT_WATER = [];
const block = (list, r) => { for (const [x, , z] of list) OBSTACLES.push([x, z + HD - FRONT, r]); };

// Freie Stile, inspiriert von Bautraditionen – keine Nachbauten bestimmter Moscheen.
export const STYLES = ['klassisch', 'osmanisch', 'andalusisch', 'gross'].map((id) => ({
  id, get name() { return t(`styles.${id}`)[0]; }, get de() { return t(`styles.${id}`)[1]; },
}));

const PALETTE = {
  klassisch: { carpet: ['#5e1a24', '#6f2330', '#c9a85c', '#2f6b5a'], wall: ['#efe4cf', '#e2d3b6'], tile: ['#1d5a63', '#e8dcc0', '#2b7c86'], band: 1.3 },
  osmanisch: { carpet: ['#7c1820', '#8e2229', '#d8b46a', '#2c4f8a'], wall: ['#f4f1ea', '#e7e2d6'], tile: ['#f4f6f8', '#1f4fa0', '#2fa3b5'], band: 2.6 },
  andalusisch: { carpet: ['#23443f', '#2c524b', '#c9a85c', '#8c2f24'], wall: ['#ecd7b4', '#ddc39a'], tile: ['#2d5a4f', '#e9d8b0', '#b8442f'], band: 1.4 },
  gross: { carpet: ['#8a1c24', '#9c2630', '#d8b46a', '#1f3f7a'], wall: ['#f6f1e6', '#e9e1cf'], tile: ['#f4f6f8', '#1f4fa0', '#c0392b'], band: 3.2 },
};

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Spitzbogen-Umriss: Breite w, Höhe der Seitenwände h.
function archShape(w, h, y0 = 0, shape = new THREE.Shape()) {
  shape.moveTo(-w / 2, y0);
  shape.lineTo(-w / 2, h);
  shape.quadraticCurveTo(-w / 2, h + w * 0.6, 0, h + w * 0.75);
  shape.quadraticCurveTo(w / 2, h + w * 0.6, w / 2, h);
  shape.lineTo(w / 2, y0);
  shape.lineTo(-w / 2, y0);
  return shape;
}

function drawArch(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + w * 0.6);
  ctx.quadraticCurveTo(x, y, x + w / 2, y - w * 0.15);
  ctx.quadraticCurveTo(x + w, y, x + w, y + w * 0.6);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

// Teppich mit Gebetsreihen: eine Kachel = ein Gebetsplatz.
function carpetTexture([base, inner, line, accent]) {
  const t = canvasTexture(256, 340, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = line;
    ctx.lineWidth = 6;
    drawArch(ctx, 22, 60, w - 44, h - 80);
    ctx.stroke();
    ctx.fillStyle = inner;
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    drawArch(ctx, 44, 95, w - 88, h - 130);
    ctx.stroke();
    ctx.fillStyle = line;
    ctx.fillRect(0, h - 8, w, 8);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(W / 0.9, D / 1.2);
  return t;
}

function rugTexture() {
  return canvasTexture(256, 420, (ctx, w, h) => {
    ctx.fillStyle = '#8c1d2c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e6c77f';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.lineWidth = 4;
    ctx.strokeRect(26, 26, w - 52, h - 52);
    drawArch(ctx, 46, 80, w - 92, h - 130);
    ctx.fillStyle = '#1f5c4d';
    ctx.fill();
    ctx.strokeStyle = '#e6c77f';
    ctx.stroke();
    ctx.fillStyle = '#e6c77f';
    ctx.beginPath();
    ctx.arc(w / 2, 150, 10, 0, Math.PI * 2);
    ctx.fill();
  });
}

function wallTexture(style) {
  const pal = PALETTE[style];
  if (style === 'gross') style = 'osmanisch'; // gleiches Fliesenmuster
  return canvasTexture(1024, 448, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, pal.wall[0]);
    g.addColorStop(1, pal.wall[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Fliesenband unten
    const band = h * (pal.band / H), top = h - band;
    const [bg, fg, dot] = pal.tile;
    ctx.fillStyle = bg;
    ctx.fillRect(0, top, w, band);
    const s = style === 'osmanisch' ? band / 4 : band / 2;
    for (let x = 0; x < w; x += s) {
      for (let y = top; y < h; y += s) {
        const cx = x + s / 2, cy = y + s / 2;
        if (style === 'osmanisch') {
          // Fliese mit Blüte: vier Blätter, Mitte, Rahmen
          ctx.strokeStyle = 'rgba(31,79,160,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, s, s);
          ctx.fillStyle = fg;
          for (let k = 0; k < 4; k++) {
            const a = k * Math.PI / 2;
            ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * s * 0.2, cy + Math.sin(a) * s * 0.2, s * 0.17, s * 0.08, a, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(cx, cy, s * 0.09, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x + 3, y + 3, s * 0.05, 0, Math.PI * 2); ctx.fill();
        } else if (style === 'andalusisch') {
          // Zellij-artiger achtzackiger Stern
          ctx.fillStyle = fg;
          ctx.fillRect(cx - s * 0.3, cy - s * 0.3, s * 0.6, s * 0.6);
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4); ctx.fillRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.6); ctx.restore();
          ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(cx, cy, s * 0.14, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.moveTo(cx, y + 4); ctx.lineTo(x + s - 4, cy);
          ctx.lineTo(cx, y + s - 4); ctx.lineTo(x + 4, cy);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = dot;
          ctx.beginPath(); ctx.arc(cx, cy, s / 6, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    if (style === 'osmanisch') { ctx.fillStyle = '#1f4fa0'; ctx.fillRect(0, top, w, 8); }
    ctx.fillStyle = '#c9a85c';
    ctx.fillRect(0, top - 6, w, 6);
  });
}

function bannerTexture() {
  return canvasTexture(2048, 320, (ctx, w, h) => {
    ctx.fillStyle = '#123f36';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c9a85c';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = '#e6c77f';
    ctx.font = '150px Amiri, "Noto Naskh Arabic", "Geeza Pro", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', w / 2, h / 2 + 10);
  });
}

function nicheTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2b7c86');
    g.addColorStop(1, '#123f45');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(230,199,127,0.5)';
    ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 32) {
      for (let x = (y / 32) % 2 ? 16 : 0; x < w; x += 32) {
        ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke();
      }
    }
  });
}

// Hufeisenbogen (andalusisch): Kreisbogen über die Halbkreislinie hinaus, unten eingezogen.
function horseshoeShape(r, spring, y0 = 0, shape = new THREE.Shape()) {
  const cy = spring + r * 0.34, jx = r * Math.cos(0.35);
  shape.moveTo(-jx, y0);
  shape.lineTo(-jx, spring);
  shape.absarc(0, cy, r, Math.PI + 0.35, -0.35, true);
  shape.lineTo(jx, y0);
  shape.lineTo(-jx, y0);
  return shape;
}

// Rot-weiße Keilsteine, radial um den Bogenmittelpunkt (UVs der Extrusion = Meter).
function voussoirMaterial(r, spring) {
  const cy = spring + r * 0.34, W = 2 * r + 0.4, H = cy + r + 0.2;
  const tex = canvasTexture(256, Math.round(256 * H / W), (ctx, w, h) => {
    const px = w / W, ox = w / 2, oy = h - cy * px;
    const n = 22;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? '#efe1c3' : '#a5392b';
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.arc(ox, oy, w * 2, (i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }
  });
  tex.repeat.set(1 / W, 1 / H);
  tex.offset.set(0.5, 0);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
}

// Viele gleiche Teile (Säulen, Bögen, Lampen, Fenster) als ein InstancedMesh: [x, y, z, Drehung um Y, Maßstab].
const dummy = new THREE.Object3D();
function inst(scene, geo, mat, list) {
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach(([x, y, z, ry = 0, s = 1], i) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, ry, 0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix);
  });
  scene.add(m);
  return m;
}

// Werte von a bis b (einschließlich) im Abstand step
const range = (a, b, step) => { const out = []; for (let v = a; v <= b + 1e-6; v += step) out.push(v); return out; };

const glassColor = (day) => (NIGHT ? 0x1c2c4f : day);

function lights(scene, warm = 1) {
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x4a3426, (NIGHT ? 1.5 : 2.2) * warm));
  const sun = new THREE.DirectionalLight(NIGHT ? 0xffc890 : 0xffe2b0, NIGHT ? 0.6 : 1.6);
  sun.position.set(3, 6, 2);
  scene.add(sun);
}

function floorAndWalls(scene, style) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ map: carpetTexture(PALETTE[style].carpet), roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  // Wandtextur je Wandlänge wiederholen, damit das Fliesenband nicht verzerrt
  const tex = wallTexture(style);
  tex.wrapS = THREE.RepeatWrapping;
  const mats = [W, D].map((len) => {
    const map = len === W ? tex : tex.clone();
    map.repeat.set(len / (H * 16 / 7), 1);
    map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map, roughness: 0.95 });
  });
  for (let i = 0; i < 4; i++) {
    const len = i % 2 ? D : W;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, H), mats[i % 2]);
    const a = i * Math.PI / 2;
    wall.position.set(-Math.sin(a) * HW, H / 2, -Math.cos(a) * HD);
    wall.rotation.y = a;
    scene.add(wall);
  }
}

// Flache Decke mit runden Öffnungen, darüber je eine Kuppel: domes = [{ x, z, r, mat }]
function ceilingWithDomes(scene, domes, ceilColor = 0xf3ead8) {
  const shape = new THREE.Shape();
  shape.moveTo(-HW, -HD); shape.lineTo(HW, -HD); shape.lineTo(HW, HD); shape.lineTo(-HW, HD); shape.lineTo(-HW, -HD);
  for (const d of domes) {
    const hole = new THREE.Path();
    hole.absarc(d.x, d.z, d.r, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const ceiling = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 48),
    new THREE.MeshStandardMaterial({ color: ceilColor, roughness: 1, side: THREE.DoubleSide, emissive: ceilColor, emissiveIntensity: NIGHT ? 0.15 : 0.3 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  scene.add(ceiling);
  for (const d of domes) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(d.r, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), d.mat);
    dome.position.set(d.x, H, d.z);
    scene.add(dome);
  }
}

// Fensterkranz am Kuppelfuß
function domeWindows(scene, x, z, r, n, size = 1) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    list.push([x + Math.sin(a) * (r - 0.1), H + 0.25 * size, z + Math.cos(a) * (r - 0.1), a + Math.PI]);
  }
  inst(scene, new THREE.ShapeGeometry(archShape(0.42 * size, 0.55 * size)), new THREE.MeshBasicMaterial({ color: glassColor(0xe8f4ff) }), list);
}

function sideWindows(scene, rows, color, zs, size = 1) {
  const list = [];
  for (const side of [-1, 1]) for (const y of rows) for (const z of zs) list.push([side * (HW - 0.02), y, z, -side * Math.PI / 2]);
  inst(scene, new THREE.ShapeGeometry(archShape(0.9 * size, 1.4 * size)), new THREE.MeshBasicMaterial({ color: glassColor(color) }), list);
}

// Ornamentierte Kuppel-Innenseite (osmanisch und Großmoschee)
function ottomanDomeMaterial(rings = 4) {
  const map = canvasTexture(1024, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1d3f86'); g.addColorStop(0.55, '#e9eef5'); g.addColorStop(1, '#f6f3ea');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c9a85c'; ctx.beginPath(); ctx.arc(w / 2, 0, 40, 0, Math.PI * 2); ctx.fill();
    for (let row = 0; row < rings; row++) {
      const y = 70 + row * (300 / rings), n = 16 + row * 8;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * w / n;
        ctx.strokeStyle = row < rings / 2 ? 'rgba(233,200,120,0.8)' : 'rgba(31,79,160,0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x, y, w / n * 0.32, 24, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.fillStyle = '#c9a85c'; ctx.fillRect(0, h - 34, w, 10);
  });
  return new THREE.MeshStandardMaterial({ map, roughness: 1, side: THREE.BackSide, emissive: 0x1a2a4a, emissiveIntensity: NIGHT ? 0.12 : 0.25 });
}

function mihrab(scene, frameMat, nicheMap, horseshoe = false, s = 1) {
  const g = new THREE.Group();
  g.position.set(0, 0, -HD + 0.02);
  g.scale.setScalar(s);
  const inner = horseshoe ? horseshoeShape(0.95, 2.4) : archShape(1.8, 2.5);
  const niche = new THREE.Mesh(new THREE.ShapeGeometry(inner), new THREE.MeshStandardMaterial({ map: nicheMap, roughness: 0.8 }));
  niche.material.map.repeat.set(1 / 1.9, 1 / 3.9);
  niche.material.map.offset.set(0.5, 0);
  const frameShape = horseshoe ? horseshoeShape(1.25, 2.5, -0.1) : archShape(2.4, 2.6, -0.1);
  frameShape.holes.push(horseshoe ? horseshoeShape(0.95, 2.4) : archShape(1.8, 2.5));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(frameShape, { depth: 0.18, bevelEnabled: false }), frameMat);
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.69), new THREE.MeshBasicMaterial({ map: bannerTexture() }));
  banner.position.set(0, 5.0, 0.02);
  g.add(niche, frame, banner);
  scene.add(g);
}

// Minbar (Kanzel) rechts neben dem Mihrab: Treppe steigt zur Qibla-Wand hin an, oben ein kleines Dach.
function minbar(scene, s, mat, accent, x) {
  const g = new THREE.Group();
  const n = 9, stepH = 0.24, stepD = 0.42, w = 0.95, top = n * stepH;
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, (i + 1) * stepH, stepD), mat);
    b.position.set(0, (i + 1) * stepH / 2, -i * stepD);
    g.add(b);
  }
  // Seitenwangen; Profil in (Abstand zur Wand, Höhe), nach der Drehung zeigt x zur Wand
  const side = new THREE.Shape();
  side.moveTo(-stepD / 2, 0); side.lineTo(-stepD / 2, 0.9);
  side.lineTo((n - 1) * stepD + stepD / 2, top + 0.9); side.lineTo((n - 1) * stepD + stepD / 2, 0); side.lineTo(-stepD / 2, 0);
  const sideGeo = new THREE.ExtrudeGeometry(side, { depth: 0.06, bevelEnabled: false });
  for (const x of [-w / 2 - 0.06, w / 2]) {
    const m = new THREE.Mesh(sideGeo, accent);
    m.rotation.y = Math.PI / 2;
    m.position.x = x;
    g.add(m);
  }
  const zTop = -(n * stepD + 0.2);
  const platform = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, top, 0.9), mat);
  platform.position.set(0, top / 2, zTop);
  g.add(platform);
  const postGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.9, 8);
  for (const x of [-0.48, 0.48]) for (const dz of [-0.4, 0.4]) {
    const post = new THREE.Mesh(postGeo, accent);
    post.position.set(x, top + 0.95, zTop + dz);
    g.add(post);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.78, 1.5, 8), mat);
  roof.position.set(0, top + 1.9 + 0.75, zTop);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), accent);
  finial.position.set(0, top + 1.9 + 1.55, zTop);
  // Tor am Treppenfuß
  const gateShape = archShape(w + 0.2, 1.7, 0);
  gateShape.holes.push(archShape(w - 0.1, 1.6, 0.02));
  const gate = new THREE.Mesh(new THREE.ExtrudeGeometry(gateShape, { depth: 0.08, bevelEnabled: false }), accent);
  gate.position.z = stepD / 2;
  g.add(roof, finial, gate);
  g.scale.setScalar(s);
  g.position.set(x, 0, -HD + (n * stepD + 0.7) * s);
  scene.add(g);
}

// Hängelampen: [x, z, y?]
function lanterns(scene, spots, color = 0xffd48a) {
  const glow = new THREE.MeshStandardMaterial({ color, emissive: 0xffb24a, emissiveIntensity: NIGHT ? 2 : 1.2 });
  const chain = new THREE.MeshBasicMaterial({ color: 0x5a4a2a });
  const byY = new Map();
  for (const [x, z, y = 3.4] of spots) byY.set(y, [...(byY.get(y) || []), [x, y, z]]);
  inst(scene, new THREE.CylinderGeometry(0.16, 0.12, 0.38, 8), glow, spots.map(([x, z, y = 3.4]) => [x, y, z]));
  for (const [y, list] of byY) {
    const len = H - y - 0.2;
    inst(scene, new THREE.CylinderGeometry(0.01, 0.01, len, 4), chain, list.map(([x, , z]) => [x, y + 0.2 + len / 2, z]));
  }
}

// Tief hängender Lichterkranz (osmanische Art) mit Ketten zur Decke
function lightRing(scene, x, z, r, y, n) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035 + r * 0.004, 8, 128), gold());
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y, z);
  scene.add(ring);
  const glow = new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffc870, emissiveIntensity: NIGHT ? 2.2 : 1.5 });
  const lamps = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; lamps.push([x + Math.sin(a) * r, y - 0.08, z + Math.cos(a) * r]); }
  inst(scene, new THREE.SphereGeometry(0.06 + r * 0.004, 10, 8), glow, lamps);
  const len = H + 1 - y, ropes = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ropes.push([x + Math.sin(a) * r, y + len / 2, z + Math.cos(a) * r]); }
  inst(scene, new THREE.CylinderGeometry(0.008, 0.008, len, 4), new THREE.MeshBasicMaterial({ color: 0x5a4a2a }), ropes);
}

const gold = () => new THREE.MeshStandardMaterial({ color: 0xc9a85c, roughness: 0.35, metalness: 0.7 });
const woodMat = () => new THREE.MeshStandardMaterial({ color: 0x6b4426, roughness: 0.7 });

// Gebetsplatz (Weltursprung) in Raumkoordinaten
const userZ = () => FRONT - HD;

function buildKlassisch(scene) {
  lights(scene);
  floorAndWalls(scene, 'klassisch');
  const domeMat = new THREE.MeshStandardMaterial({ color: 0xdfeef0, roughness: 1, side: THREE.BackSide, emissive: 0x24464a, emissiveIntensity: 0.3 });
  ceilingWithDomes(scene, [{ x: 0, z: userZ(), r: 5, mat: domeMat }, { x: 0, z: userZ() + 12, r: 5, mat: domeMat }]);
  domeWindows(scene, 0, userZ(), 5, 20);
  domeWindows(scene, 0, userZ() + 12, 5, 20);
  const stone = new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.9 });
  const g = gold();
  const xs = [-9, -4.5, 4.5, 9], zs = range(-HD + 3, HD - 2, 4);
  const cols = xs.flatMap((x) => zs.map((z) => [x, 2.1, z]));
  inst(scene, new THREE.CylinderGeometry(0.22, 0.26, 4.2, 20), stone, cols);
  inst(scene, new THREE.CylinderGeometry(0.34, 0.22, 0.25, 20), g, cols.map(([x, , z]) => [x, 4.3, z]));
  const outer = archShape(4, 3.4, -0.1);
  outer.holes.push(archShape(3.5, 3.4));
  const arches = xs.flatMap((x) => zs.slice(1).map((z) => [x - 0.15, 0, z - 2, Math.PI / 2]));
  inst(scene, new THREE.ExtrudeGeometry(outer, { depth: 0.3, bevelEnabled: false }), stone, arches);
  sideWindows(scene, [5.2, 8], 0xbfe3ea, range(-HD + 4, HD - 3, 4));
  mihrab(scene, g, nicheTexture(), false, 1.3);
  minbar(scene, 1.2, woodMat(), g, 6.6);
  block(cols, 0.3);
  const spots = [];
  for (const x of [-6.75, -2.25, 2.25, 6.75]) for (const z of range(-HD + 3, HD - 3, 4)) spots.push([x, z + 2, 3.6]);
  lanterns(scene, spots);
}

function buildOsmanisch(scene) {
  lights(scene, 1.05);
  floorAndWalls(scene, 'osmanisch');
  const domeZ = userZ() + 7;
  const small = new THREE.MeshStandardMaterial({ color: 0xe9eef5, roughness: 1, side: THREE.BackSide, emissive: 0x1a2a4a, emissiveIntensity: 0.2 });
  ceilingWithDomes(scene, [
    { x: 0, z: domeZ, r: 13, mat: ottomanDomeMaterial(5) },
    { x: -9, z: domeZ + 17, r: 4.5, mat: small },
    { x: 9, z: domeZ + 17, r: 4.5, mat: small },
  ], 0xeef0f2);
  domeWindows(scene, 0, domeZ, 13, 40, 1.8);
  // Vier mächtige Pfeiler tragen die Hauptkuppel
  const marble = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.6 });
  const piers = [-9.2, 9.2].flatMap((x) => [-9.2, 9.2].map((dz) => [x, H / 2, domeZ + dz]));
  inst(scene, new THREE.CylinderGeometry(1.1, 1.25, H, 12), marble, piers);
  inst(scene, new THREE.CylinderGeometry(1.16, 1.16, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x1f4fa0, roughness: 0.6 }), piers.map(([x, , z]) => [x, 2.8, z]));
  sideWindows(scene, [3.5, 6.5, 9.5], 0xd9ecff, range(-HD + 3, HD - 3, 3.5));
  const nicheMap = canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f4f6f8'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = '#1f4fa0'; ctx.beginPath(); ctx.arc(x + 16, y + 16, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2fa3b5'; ctx.beginPath(); ctx.arc(x + 16, y + 16, 4, 0, Math.PI * 2); ctx.fill();
    }
  });
  mihrab(scene, marble, nicheMap, false, 1.5);
  minbar(scene, 1.4, marble, gold(), 6.5);
  block(piers, 1.3);
  lightRing(scene, 0, domeZ, 8, 3.4, 64);
  lightRing(scene, 0, domeZ, 5.5, 3.8, 44);
  lanterns(scene, [[-9, domeZ + 17, 4], [9, domeZ + 17, 4], [-14, domeZ + 4, 4.2], [14, domeZ + 4, 4.2], [-14, domeZ - 6, 4.2], [14, domeZ - 6, 4.2]]);
}

function buildAndalusisch(scene) {
  lights(scene, 0.95);
  floorAndWalls(scene, 'andalusisch');
  // Holzdecke mit Balken
  const wood = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 64) {
      ctx.fillStyle = '#3e2716'; ctx.fillRect(x, 0, 14, h);
      ctx.fillStyle = '#c9a85c'; ctx.fillRect(x + 14, 0, 2, h);
    }
  });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(W / 4, D / 4);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.9, side: THREE.DoubleSide }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  scene.add(ceil);
  // Säulenwald: doppelstöckige Hufeisenbögen in Reihen Richtung Qibla, breiter Mittelgang
  const stone = new THREE.MeshStandardMaterial({ color: 0xd9c49c, roughness: 0.9 });
  const marble = new THREE.MeshStandardMaterial({ color: 0x6d5a4a, roughness: 0.5 });
  const xs = range(2.8, HW - 2, 2.8).flatMap((x) => [-x, x]);
  const zs = range(-HD + 1.5, HD - 1.5, 3);
  const cols = xs.flatMap((x) => zs.map((z) => [x, 1.3, z]));
  inst(scene, new THREE.CylinderGeometry(0.16, 0.18, 2.6, 14), marble, cols);
  inst(scene, new THREE.BoxGeometry(0.32, 2.0, 0.32), stone, cols.map(([x, , z]) => [x, 3.6, z]));
  const spots = xs.flatMap((x) => zs.slice(1).map((z) => [x - 0.14, 0, z - 1.5, Math.PI / 2]));
  for (const spring of [2.6, 4.6]) {
    const outer = horseshoeShape(1.5, spring, spring - 0.3);
    outer.holes.push(horseshoeShape(1.2, spring, spring - 0.25));
    inst(scene, new THREE.ExtrudeGeometry(outer, { depth: 0.28, bevelEnabled: false }), voussoirMaterial(1.5, spring), spots);
  }
  sideWindows(scene, [5.6], 0xffe3b0, range(-HD + 3, HD - 3, 3));
  const nicheMap = canvasTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c9a85c'); g.addColorStop(1, '#2d5a4f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 28) for (let x = 0; x < w; x += 28) { ctx.strokeRect(x + 6, y + 6, 16, 16); }
  });
  mihrab(scene, gold(), nicheMap, true, 1.2);
  minbar(scene, 1.1, woodMat(), gold(), 7);
  block(cols, 0.2);
  const lamps = [];
  for (const x of range(1.4, HW - 3, 2.8).flatMap((v) => [-v, v])) for (const z of range(-HD + 3, HD - 3, 6)) lamps.push([x, z, 5.6]);
  lanterns(scene, lamps, 0xffc070);
}

// Großmoschee: Hauptkuppel auf vier Elefantenfüßen, Nebenkuppeln, Emporen an den Seiten und hinten.
function buildGross(scene) {
  lights(scene, 1.1);
  floorAndWalls(scene, 'gross');
  const domeZ = userZ() + 12;
  const small = ottomanDomeMaterial(3);
  ceilingWithDomes(scene, [
    { x: 0, z: domeZ, r: 16, mat: ottomanDomeMaterial(6) },
    { x: -23, z: domeZ, r: 6, mat: small },
    { x: 23, z: domeZ, r: 6, mat: small },
    { x: -12, z: domeZ + 26, r: 8, mat: small },
    { x: 12, z: domeZ + 26, r: 8, mat: small },
  ], 0xf1efe9);
  domeWindows(scene, 0, domeZ, 16, 48, 2.2);
  for (const [x, z, r] of [[-23, domeZ, 6], [23, domeZ, 6], [-12, domeZ + 26, 8], [12, domeZ + 26, 8]]) domeWindows(scene, x, z, r, 20, 1.2);
  const marble = new THREE.MeshStandardMaterial({ color: 0xf3f0ea, roughness: 0.55 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x1f4fa0, roughness: 0.6 });
  const piers = [-11.5, 11.5].flatMap((x) => [-11.5, 11.5].map((dz) => [x, H / 2, domeZ + dz]));
  inst(scene, new THREE.CylinderGeometry(1.8, 2.0, H, 8), marble, piers);
  for (const y of [3.2, 9]) inst(scene, new THREE.CylinderGeometry(1.9, 1.9, 0.4, 8), blue, piers.map(([x, , z]) => [x, y, z]));
  // Emporen (Mahfil) an beiden Seiten und hinten, mit Brüstung und Säulen darunter
  const { y: gy, depth } = GALLERY, z0 = -HD + 10, len = HD - 1 - z0;
  const slabGeo = new THREE.BoxGeometry(depth, GALLERY.slab, len), railGeo = new THREE.BoxGeometry(0.12, 1.0, len);
  inst(scene, slabGeo, marble, [-1, 1].map((s) => [s * (HW - depth / 2), gy, z0 + len / 2]));
  inst(scene, railGeo, gold(), [-1, 1].map((s) => [s * (HW - depth), gy + 0.7, z0 + len / 2]));
  const back = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * depth, GALLERY.slab, depth), marble);
  back.position.set(0, gy, HD - depth / 2);
  const backRail = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * depth, 1.0, 0.12), gold());
  backRail.position.set(0, gy + 0.7, HD - depth);
  scene.add(back, backRail);
  const posts = [
    ...[-1, 1].flatMap((s) => range(z0 + 1, HD - 1, 4).map((z) => [s * (HW - depth + 0.3), gy / 2, z])),
    ...range(-HW + depth + 2, HW - depth - 2, 4).map((x) => [x, gy / 2, HD - depth + 0.3]),
  ];
  inst(scene, new THREE.CylinderGeometry(0.28, 0.32, gy, 14), marble, posts);
  sideWindows(scene, [3.2, 9.5, 13.5], 0xd9ecff, range(-HD + 4, HD - 4, 4), 1.5);
  // Buntglasfenster über dem Mihrab
  const colors = [0x3d7bd9, 0xd94f3d, 0x3db58a, 0xe6b84a];
  colors.forEach((c, k) => {
    const list = [];
    for (const [y, xs] of [[12.2, range(-9, 9, 3)], [15, range(-4.5, 4.5, 3)]]) xs.forEach((x, i) => { if ((i + Math.round(y)) % colors.length === k) list.push([x, y, -HD + 0.03]); });
    if (list.length) inst(scene, new THREE.ShapeGeometry(archShape(1.3, 1.6)), new THREE.MeshBasicMaterial({ color: NIGHT ? 0x1c2c4f : c }), list);
  });
  const nicheMap = canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f4f6f8'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = '#1f4fa0'; ctx.beginPath(); ctx.arc(x + 16, y + 16, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x + 16, y + 16, 4, 0, Math.PI * 2); ctx.fill();
    }
  });
  mihrab(scene, marble, nicheMap, false, 2.1);
  minbar(scene, 1.9, marble, gold(), 7.5);
  block(piers, 2.0);
  block(posts, 0.35);
  lightRing(scene, 0, domeZ, 11, 4.2, 96);
  lightRing(scene, 0, domeZ, 7.5, 4.7, 64);
  for (const [x, z, r] of [[-23, domeZ, 3], [23, domeZ, 3], [-12, domeZ + 26, 4], [12, domeZ + 26, 4]]) lightRing(scene, x, z, r, 4.4, 28);
}

// Waschraum (Abdesthane) neben dem Gebetssaal: Reihe von Waschbecken mit Hähnen an der Wand vor dir,
// rechts niedrige Hähne mit Hockern für die Füße, hinten der Durchgang zum Gebetssaal.
// Gebaut in Weltkoordinaten: Platz am Ursprung, Becken vor dir (−Z).
export const WUDU_BASINS = [-3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3];
function buildWudu(scene) {
  lights(scene, 1.15);
  const zWall = -WUDU_FRONT, zBack = D - WUDU_FRONT, cx = 0, cz = (zWall + zBack) / 2;
  // Boden: helle Marmorfliesen
  const floorMap = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e9e6df'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c9c3b6'; ctx.lineWidth = 4;
    for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 128, 0); ctx.lineTo(i * 128, h); ctx.moveTo(0, i * 128); ctx.lineTo(w, i * 128); ctx.stroke(); }
    ctx.fillStyle = 'rgba(120,140,150,0.08)';
    for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 60, 4, Math.random() * 3, 0, Math.PI * 2); ctx.fill(); }
  });
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping;
  floorMap.repeat.set(W / 2, D / 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: floorMap, roughness: 0.4 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0, cz);
  // Wände: weiße Fliesen, unten ein türkises Band mit Muster
  const wallMap = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f4f6f6'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#dfe5e6'; ctx.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, h); ctx.moveTo(0, i * 64); ctx.lineTo(w, i * 64); ctx.stroke(); }
    const top = h * 0.62;
    ctx.fillStyle = '#1f7a86'; ctx.fillRect(0, top, w, 36);
    for (let x = 0; x < w; x += 64) {
      ctx.fillStyle = '#f4f6f6'; ctx.beginPath(); ctx.moveTo(x + 32, top + 4); ctx.lineTo(x + 50, top + 18); ctx.lineTo(x + 32, top + 32); ctx.lineTo(x + 14, top + 18); ctx.fill();
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x + 32, top + 18, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#2b9aa8'; ctx.fillRect(0, top + 36, w, h - top - 36);
  });
  wallMap.wrapS = THREE.RepeatWrapping;
  const wallMat = (len) => { const m = wallMap.clone(); m.needsUpdate = true; m.repeat.set(len / H, 1); return new THREE.MeshStandardMaterial({ map: m, roughness: 0.35 }); };
  for (const [len, x, z, ry] of [[W, cx, zWall, 0], [W, cx, zBack, Math.PI], [D, -HW, cz, Math.PI / 2], [D, HW, cz, -Math.PI / 2]]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, H), wallMat(len));
    wall.position.set(x, H / 2, z);
    wall.rotation.y = ry;
    scene.add(wall);
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 1, emissive: 0xf3efe6, emissiveIntensity: 0.25 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(cx, H, cz);
  scene.add(floor, ceiling);

  // Waschtisch aus Marmor mit eingelassenen Becken
  const marble = new THREE.MeshStandardMaterial({ color: 0xf1efe9, roughness: 0.3 });
  const tile = new THREE.MeshStandardMaterial({ color: 0x1f7a86, roughness: 0.4 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a85c, roughness: 0.25, metalness: 0.85 });
  const len = W - 1.2;
  const top = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.55), marble);
  top.position.set(cx, 0.86, zWall + 0.275);
  const front = new THREE.Mesh(new THREE.BoxGeometry(len, 0.82, 0.08), tile);
  front.position.set(cx, 0.41, zWall + 0.5);
  scene.add(top, front);
  const bowlZ = zWall + 0.3;
  inst(scene, new THREE.CylinderGeometry(0.2, 0.15, 0.03, 28), new THREE.MeshStandardMaterial({ color: 0xc7d3d6, roughness: 0.2 }), WUDU_BASINS.map((x) => [x, 0.895, bowlZ]));
  // Hähne: Rohr aus der Wand, Auslauf nach unten
  inst(scene, new THREE.CylinderGeometry(0.018, 0.018, 0.2, 10).rotateX(Math.PI / 2), brass, WUDU_BASINS.map((x) => [x, 1.12, zWall + 0.1]));
  inst(scene, new THREE.CylinderGeometry(0.016, 0.022, 0.06, 10), brass, WUDU_BASINS.map((x) => [x, 1.09, zWall + 0.2]));
  inst(scene, new THREE.SphereGeometry(0.03, 12, 8), brass, WUDU_BASINS.map((x) => [x, 1.17, zWall + 0.05]));
  // Wasserstrahlen: eigener Hahn (Index 3) und die beiden Nachbarn
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x9fdcf5, transparent: true, opacity: 0.55, roughness: 0.05, emissive: 0x2a6f8a, emissiveIntensity: 0.3 });
  WATER = WUDU_BASINS.map((x) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.013, 0.17, 8), waterMat);
    w.position.set(x, 0.99, zWall + 0.2);
    w.visible = false;
    scene.add(w);
    return w;
  });
  // Wandbogen über jedem Becken (Nische) und ein Schriftband
  const nicheMat = new THREE.MeshStandardMaterial({ color: 0xe9f3f4, roughness: 0.5 });
  inst(scene, new THREE.ShapeGeometry(archShape(0.8, 1.0)), nicheMat, WUDU_BASINS.map((x) => [x, 1.25, zWall + 0.01]));
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.5), new THREE.MeshBasicMaterial({ map: bannerTexture() }));
  banner.position.set(cx, 2.85, zWall + 0.015);
  scene.add(banner);

  // Rechts: niedrige Hähne mit Hockern (zum Füßewaschen im Sitzen)
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd9d3c7, roughness: 0.6 });
  const footZ = range(0.6, zBack - 1.2, 0.9);
  inst(scene, new THREE.CylinderGeometry(0.17, 0.19, 0.4, 16), stoneMat, footZ.map((z) => [HW - 0.75, 0.2, z]));
  inst(scene, new THREE.CylinderGeometry(0.016, 0.016, 0.22, 10).rotateZ(Math.PI / 2), brass, footZ.map((z) => [HW - 0.12, 0.55, z]));
  STOOLS = footZ.map((z) => [HW - 0.75, z]);
  FOOT_WATER = footZ.map((z) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.014, 0.5, 8), waterMat);
    w.position.set(HW - 0.24, 0.29, z);
    w.visible = false;
    scene.add(w);
    return w;
  });
  const gutter = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, zBack - 0.4), new THREE.MeshStandardMaterial({ color: 0x8fa3a8, roughness: 0.3 }));
  gutter.position.set(HW - 0.2, 0.025, (0.2 + zBack) / 2);
  scene.add(gutter);

  // Links: Fenster, Handtuchhaken; hinten: Durchgang zum Gebetssaal und Schuhregal
  const glass = new THREE.MeshBasicMaterial({ color: glassColor(0xd9ecff) });
  for (const z of [0.6, 2.6]) {
    const win = new THREE.Mesh(new THREE.ShapeGeometry(archShape(0.9, 1.3)), glass);
    win.position.set(-HW + 0.02, 1.3, z);
    win.rotation.y = Math.PI / 2;
    scene.add(win);
  }
  inst(scene, new THREE.SphereGeometry(0.025, 8, 6), brass, range(-0.4, 3.6, 0.5).map((z) => [-HW + 0.04, 1.5, z]));
  const door = new THREE.Mesh(new THREE.ShapeGeometry(archShape(1.6, 2.4)), new THREE.MeshBasicMaterial({ color: NIGHT ? 0x8a6a3a : 0xf3d9a0 }));
  door.position.set(-1.6, 0, zBack - 0.02);
  door.rotation.y = Math.PI;
  scene.add(door);
  const shelf = new THREE.MeshStandardMaterial({ color: 0x6b4426, roughness: 0.7 });
  for (const y of [0.15, 0.55, 0.95]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.35), shelf);
    b.position.set(1.8, y, zBack - 0.2);
    scene.add(b);
  }
  lanterns(scene, [[-2, 0.8, 2.6], [2, 0.8, 2.6], [-2, 3.2, 2.6], [2, 3.2, 2.6]], 0xfff0c8);
  BOUNDS = { minX: -HW + 0.5, maxX: HW - 1.1, minZ: zWall + 0.75, maxZ: zBack - 0.5 };
  OBSTACLES = footZ.map((z) => [HW - 0.75, z, 0.25]);
}

// Wasser laufen lassen: on = eigener Hahn und der der Vorbeter-Figur (Nachbarbecken), t = Zeit für das Flackern
// stools: Indizes der Hocker, an denen gerade die Füße gewaschen werden
export function setWater(on, t = 0, basins = [0, 1.1], stools = []) {
  const flicker = (w, i) => w.scale.set(1 + Math.sin(t * 23 + i) * 0.15, 1, 1 + Math.cos(t * 19 + i) * 0.15);
  WATER.forEach((w, i) => { w.visible = on && basins.includes(WUDU_BASINS[i]); if (w.visible) flicker(w, i); });
  FOOT_WATER.forEach((w, i) => { w.visible = on && stools.includes(i); if (w.visible) flicker(w, i); });
}

// Hocker im Waschraum in Weltkoordinaten
export const wuduStools = () => STOOLS;

const BUILDERS = { klassisch: buildKlassisch, osmanisch: buildOsmanisch, andalusisch: buildAndalusisch, gross: buildGross };

// night: nach Sonnenuntergang bzw. vor Sonnenaufgang
export function buildEnvironment(group, style = 'klassisch', { night = false } = {}) {
  if (!BUILDERS[style] && style !== 'wudu') style = 'klassisch';
  ({ w: W, d: D, h: H } = SIZES[style]);
  HW = W / 2; HD = D / 2; NIGHT = night;
  OBSTACLES = [];
  WATER = [];
  FOOT_WATER = [];
  STOOLS = [];
  BOUNDS = null;
  if (style === 'wudu') { buildWudu(group); return; }
  // Raumkoordinaten: Mitte des Raums; die Mihrab-Wand liegt FRONT Meter vor dem Gebetsplatz
  const room = new THREE.Group();
  room.position.z = HD - FRONT;
  BUILDERS[style](room);
  group.add(room);
}

// Empore der Großmoschee (hinten): Höhe der Oberfläche, Gebetsplatz an der Brüstung (Welt-z), begehbarer Bereich.
const GALLERY = { y: 6, depth: 6, slab: 0.45 };
export function galleryInfo(style) {
  if (style !== 'gross') return null;
  const { w, d } = SIZES.gross;
  const rail = d - FRONT - GALLERY.depth;
  return { top: GALLERY.y + GALLERY.slab / 2, z: rail + 0.9, bounds: { minX: -w / 2 + 0.6, maxX: w / 2 - 0.6, minZ: rail + 0.45, maxZ: d - FRONT - 0.6 } };
}

// Steht an (x, z) (Welt) eine Säule im Weg?
export function blocked(x, z, pad = 0.25) {
  return OBSTACLES.some(([ox, oz, r]) => Math.hypot(x - ox, z - oz) < r + pad);
}

// Begehbarer Bereich in Weltkoordinaten (für das Gehen durch die Moschee)
export function roomBounds() {
  return BOUNDS || { minX: -HW + 0.6, maxX: HW - 0.6, minZ: -FRONT + 0.8, maxZ: D - FRONT - 0.6 };
}

// Raum abbauen (Geometrien, Materialien, Texturen freigeben), um einen anderen Stil zu laden.
export function clearEnvironment(group) {
  group.traverse((o) => {
    o.geometry?.dispose();
    if (o.isInstancedMesh) o.dispose();
    for (const m of [].concat(o.material || [])) { m.map?.dispose(); m.dispose(); }
  });
  group.clear();
}

export function makeRug(x, z) {
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.25), new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(x, 0.006, z);
  return rug;
}

// Kompassring um den Nutzer; das „N“ wird um die Qibla-Peilung gedreht.
export function makeFloorCompass() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.65, 64),
    new THREE.MeshBasicMaterial({ color: 0xc9a85c, transparent: true, opacity: 0.55 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.009;
  g.add(ring);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.16),
    new THREE.MeshBasicMaterial({
      transparent: true,
      map: canvasTexture(128, 128, (ctx) => {
        ctx.fillStyle = '#e6c77f';
        ctx.font = '700 96px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', 64, 70);
      }),
    }),
  );
  label.rotation.x = -Math.PI / 2;
  label.position.set(0, 0.01, -0.76);
  g.add(label);
  return g;
}
