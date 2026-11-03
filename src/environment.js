import * as THREE from 'three';

// Gebetsraum. Alles hängt an `group`; dessen -Z-Achse ist die Qibla (Mihrab bei z = -8).
const ROOM = 16, HEIGHT = 7, HALF = ROOM / 2;

// Freie Stile, inspiriert von Bautraditionen – keine Nachbauten bestimmter Moscheen.
export const STYLES = [
  { id: 'klassisch', name: 'Klassisch', de: 'Heller Gebetsraum mit Spitzbögen, Kuppel und Laternen' },
  { id: 'osmanisch', name: 'Osmanisch', de: 'Große Zentralkuppel, blaue Fliesen, Lichterkranz und Kuppelfenster' },
  { id: 'andalusisch', name: 'Andalusisch', de: 'Säulenwald mit rot-weißen Hufeisenbögen und Holzdecke' },
];

const PALETTE = {
  klassisch: { carpet: ['#5e1a24', '#6f2330', '#c9a85c', '#2f6b5a'], wall: ['#efe4cf', '#e2d3b6'], tile: ['#1d5a63', '#e8dcc0', '#2b7c86'], band: 1.3 },
  osmanisch: { carpet: ['#7c1820', '#8e2229', '#d8b46a', '#2c4f8a'], wall: ['#f4f1ea', '#e7e2d6'], tile: ['#f4f6f8', '#1f4fa0', '#2fa3b5'], band: 2.6 },
  andalusisch: { carpet: ['#23443f', '#2c524b', '#c9a85c', '#8c2f24'], wall: ['#ecd7b4', '#ddc39a'], tile: ['#2d5a4f', '#e9d8b0', '#b8442f'], band: 1.4 },
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
  t.repeat.set(ROOM / 0.9, ROOM / 1.2);
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
  return canvasTexture(1024, 448, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, pal.wall[0]);
    g.addColorStop(1, pal.wall[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Fliesenband unten
    const band = h * (pal.band / HEIGHT), top = h - band;
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

function lights(scene, warm = 1) {
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x4a3426, 2.2 * warm));
  const sun = new THREE.DirectionalLight(0xffe2b0, 1.6);
  sun.position.set(3, 6, 2);
  scene.add(sun);
}

function floorAndWalls(scene, style) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM, ROOM),
    new THREE.MeshStandardMaterial({ map: carpetTexture(PALETTE[style].carpet), roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture(style), roughness: 0.95 });
  for (let i = 0; i < 4; i++) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM, HEIGHT), wallMat);
    const a = i * Math.PI / 2;
    wall.position.set(-Math.sin(a) * HALF, HEIGHT / 2, -Math.cos(a) * HALF);
    wall.rotation.y = a;
    scene.add(wall);
  }
}

function domeCeiling(scene, radius, domeMat, ceilColor = 0xf3ead8) {
  const ceiling = new THREE.Mesh(
    new THREE.RingGeometry(radius, HALF * 1.5, 64),
    new THREE.MeshStandardMaterial({ color: ceilColor, roughness: 1, side: THREE.DoubleSide, emissive: ceilColor, emissiveIntensity: 0.3 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = HEIGHT;
  scene.add(ceiling);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
  dome.position.y = HEIGHT;
  scene.add(dome);
}

function sideWindows(scene, rows = [4.6], color = 0xbfe3ea, zs = [-4, 0, 4]) {
  const glass = new THREE.MeshBasicMaterial({ color });
  for (const side of [-1, 1]) {
    for (const y of rows) {
      for (const z of zs) {
        const win = new THREE.Mesh(new THREE.ShapeGeometry(archShape(0.9, 1.4)), glass);
        win.position.set(side * (HALF - 0.02), y, z);
        win.rotation.y = -side * Math.PI / 2;
        scene.add(win);
      }
    }
  }
}

function mihrab(scene, frameMat, nicheMap, horseshoe = false) {
  const g = new THREE.Group();
  g.position.set(0, 0, -HALF + 0.02);
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

function lanterns(scene, spots, color = 0xffd48a) {
  const glow = new THREE.MeshStandardMaterial({ color, emissive: 0xffb24a, emissiveIntensity: 1.2 });
  const chain = new THREE.MeshBasicMaterial({ color: 0x5a4a2a });
  for (const [x, z, y = 3.4] of spots) {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.38, 8), glow);
    lamp.position.set(x, y, z);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, HEIGHT - y - 0.2, 4), chain);
    rope.position.set(x, y + 0.2 + (HEIGHT - y - 0.2) / 2, z);
    scene.add(lamp, rope);
  }
}

const gold = () => new THREE.MeshStandardMaterial({ color: 0xc9a85c, roughness: 0.35, metalness: 0.7 });

function buildKlassisch(scene) {
  lights(scene);
  floorAndWalls(scene, 'klassisch');
  domeCeiling(scene, 3.5, new THREE.MeshStandardMaterial({ color: 0xdfeef0, roughness: 1, side: THREE.BackSide, emissive: 0x24464a, emissiveIntensity: 0.3 }));
  const stone = new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.9 });
  const g = gold();
  const zs = [-6, -2, 2, 6];
  for (const x of [-4.5, 4.5]) {
    for (const z of zs) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.2, 20), stone);
      col.position.set(x, 2.1, z);
      const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.22, 0.25, 20), g);
      capital.position.set(x, 4.3, z);
      scene.add(col, capital);
    }
    for (let i = 0; i < zs.length - 1; i++) {
      const outer = archShape(4, 3.4, -0.1);
      outer.holes.push(archShape(3.5, 3.4));
      const arch = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 0.3, bevelEnabled: false }), stone);
      arch.rotation.y = Math.PI / 2;
      arch.position.set(x - 0.15, 0, (zs[i] + zs[i + 1]) / 2);
      scene.add(arch);
    }
  }
  sideWindows(scene);
  mihrab(scene, g, nicheTexture());
  lanterns(scene, [[-2.5, -4], [2.5, -4], [-2.5, 0.5], [2.5, 0.5], [0, -6.5]]);
}

function buildOsmanisch(scene) {
  lights(scene, 1.05);
  floorAndWalls(scene, 'osmanisch');
  // Große Zentralkuppel mit blauer Ornamentik
  const domeMap = canvasTexture(1024, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1d3f86'); g.addColorStop(0.55, '#e9eef5'); g.addColorStop(1, '#f6f3ea');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) {
      const y = 70 + row * 70, n = 16 + row * 8;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * w / n;
        ctx.strokeStyle = row < 2 ? 'rgba(233,200,120,0.8)' : 'rgba(31,79,160,0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x, y, w / n * 0.32, 24, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.fillStyle = '#c9a85c'; ctx.fillRect(0, h - 34, w, 10);
  });
  domeCeiling(scene, 6.4, new THREE.MeshStandardMaterial({ map: domeMap, roughness: 1, side: THREE.BackSide, emissive: 0x1a2a4a, emissiveIntensity: 0.25 }), 0xeef0f2);
  // Fensterkranz am Kuppelfuß
  const glass = new THREE.MeshBasicMaterial({ color: 0xe8f4ff });
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const win = new THREE.Mesh(new THREE.ShapeGeometry(archShape(0.42, 0.55)), glass);
    win.position.set(Math.sin(a) * 6.3, HEIGHT + 0.25, Math.cos(a) * 6.3);
    win.lookAt(0, HEIGHT + 0.25, 0);
    scene.add(win);
  }
  // Vier mächtige Pfeiler
  const marble = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.6 });
  for (const x of [-5.4, 5.4]) {
    for (const z of [-5, 5]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, HEIGHT, 12), marble);
      pillar.position.set(x, HEIGHT / 2, z);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.25, 12), new THREE.MeshStandardMaterial({ color: 0x1f4fa0, roughness: 0.6 }));
      band.position.set(x, 2.6, z);
      scene.add(pillar, band);
    }
  }
  sideWindows(scene, [3.4, 5.4], 0xd9ecff, [-4.5, -1.5, 1.5, 4.5]);
  // Mihrab aus Marmor mit Fliesen-Nische
  const nicheMap = canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f4f6f8'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = '#1f4fa0'; ctx.beginPath(); ctx.arc(x + 16, y + 16, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2fa3b5'; ctx.beginPath(); ctx.arc(x + 16, y + 16, 4, 0, Math.PI * 2); ctx.fill();
    }
  });
  mihrab(scene, marble, nicheMap);
  // Tief hängender Lichterkranz
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.035, 8, 96), gold());
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3.1;
  scene.add(ring);
  const glow = new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffc870, emissiveIntensity: 1.5 });
  const lampGeo = new THREE.SphereGeometry(0.06, 10, 8);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const lamp = new THREE.Mesh(lampGeo, glow);
    lamp.position.set(Math.sin(a) * 3.4, 3.02, Math.cos(a) * 3.4);
    scene.add(lamp);
  }
  const chain = new THREE.MeshBasicMaterial({ color: 0x5a4a2a });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, HEIGHT + 2 - 3.1, 4), chain);
    rope.position.set(Math.sin(a) * 3.4, 3.1 + (HEIGHT + 2 - 3.1) / 2, Math.cos(a) * 3.4);
    scene.add(rope);
  }
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
  wood.repeat.set(4, 4);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM, ROOM), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.9, side: THREE.DoubleSide }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = HEIGHT;
  scene.add(ceil);
  // Säulenwald: doppelstöckige Hufeisenbögen in Reihen Richtung Qibla
  const stone = new THREE.MeshStandardMaterial({ color: 0xd9c49c, roughness: 0.9 });
  const marble = new THREE.MeshStandardMaterial({ color: 0x6d5a4a, roughness: 0.5 });
  const lower = voussoirMaterial(1.5, 2.6), upper = voussoirMaterial(1.5, 4.6);
  const zs = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5];
  for (const x of [-5.6, -2.8, 2.8, 5.6]) {
    for (const z of zs) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 2.6, 14), marble);
      col.position.set(x, 1.3, z);
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.0, 0.32), stone);
      pier.position.set(x, 3.6, z);
      scene.add(col, pier);
    }
    for (let i = 0; i < zs.length - 1; i++) {
      const zc = (zs[i] + zs[i + 1]) / 2;
      for (const [spring, mat] of [[2.6, lower], [4.6, upper]]) {
        const outer = horseshoeShape(1.5, spring, spring - 0.3);
        outer.holes.push(horseshoeShape(1.2, spring, spring - 0.25));
        const arch = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 0.28, bevelEnabled: false }), mat);
        arch.rotation.y = Math.PI / 2;
        arch.position.set(x - 0.14, 0, zc);
        scene.add(arch);
      }
    }
  }
  sideWindows(scene, [5.0], 0xffe3b0, [-6, -3, 0, 3, 6]);
  const nicheMap = canvasTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c9a85c'); g.addColorStop(1, '#2d5a4f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 28) for (let x = 0; x < w; x += 28) { ctx.strokeRect(x + 6, y + 6, 16, 16); }
  });
  mihrab(scene, gold(), nicheMap, true);
  lanterns(scene, [[-1.4, -4.5, 4.2], [1.4, -4.5, 4.2], [-1.4, 0, 4.2], [1.4, 0, 4.2], [0, -6.5, 4.2], [-4.2, -3, 4.4], [4.2, -3, 4.4], [-4.2, 3, 4.4], [4.2, 3, 4.4]], 0xffc070);
}

export function buildEnvironment(group, style = 'klassisch') {
  ({ osmanisch: buildOsmanisch, andalusisch: buildAndalusisch }[style] || buildKlassisch)(group);
}

// Raum abbauen (Geometrien, Materialien, Texturen freigeben), um einen anderen Stil zu laden.
export function clearEnvironment(group) {
  group.traverse((o) => {
    o.geometry?.dispose();
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
