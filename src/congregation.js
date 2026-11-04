import * as THREE from 'three';
import { Guide } from './figure.js';

// Gemeinschaftsgebet (Cemaat): ein Imam vorn, Betende Schulter an Schulter in Reihen, Blick nach -Z (Qibla).
// Der Nutzer steht in der ersten Reihe bei x = 0. Die Gemeinde folgt dem Imam immer etwas später –
// im natürlichen Takt jeder mit eigener Verzögerung, eigenem Tempo und kleinen Abweichungen.
const SLOT = 0.72, ROW = 1.3;
const ROBES = [0xf3f0e8, 0xeae4d6, 0xd9cdb4, 0xb9b2a4, 0x8a8f99, 0x4a5a73, 0x2f5d50, 0x6b5a48, 0x2b2d33, 0x7a2e2e];
const SCARVES = [0x2b2d33, 0x5f7f86, 0x8a6f9e, 0x3d5a80, 0x7a5c4a, 0xe8e2d6, 0x4f6b4a];
const SKINS = [0xe2c2a2, 0xc9a988, 0xa77b58, 0x8a5e3c, 0x6b4630];
const WALK = 3.5; // Sekunden, die der Nachzügler zu seinem Platz braucht

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Was der Nachzügler nach dem Salām des Imams allein nachholt: eine Rakʿa bis zum eigenen Salām (Sekunden ab Salām).
const MAKEUP = [[1.5, 'stand'], [2.5, 'qiyam'], [10, 'ruku'], [13, 'stand'], [15, 'sujud'], [18, 'sit'], [20, 'sujud'], [23, 'sit'], [33, 'taslimR'], [34.5, 'taslimL'], [36, 'sit']];

// Holzgitterwand zwischen Männer- und Frauenbereich
const SCREEN_Z = -2.5, SCREEN_H = 2.3;
let latticeMap = null;
function latticeScreen(width, z) {
  if (!latticeMap) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#6b4426';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#8a5a34';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 124, 124);
    // Achtzackige Öffnungen im Raster ausstanzen
    ctx.globalCompositeOperation = 'destination-out';
    for (const [cx, cy, r] of [[32, 32, 20], [96, 32, 20], [32, 96, 20], [96, 96, 20], [64, 64, 9], [0, 64, 9], [128, 64, 9], [64, 0, 9], [64, 128, 9]]) {
      for (const a of [0, Math.PI / 4]) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4); ctx.restore();
      }
    }
    latticeMap = new THREE.CanvasTexture(c);
    latticeMap.colorSpace = THREE.SRGBColorSpace;
    latticeMap.wrapS = latticeMap.wrapT = THREE.RepeatWrapping;
  }
  const g = new THREE.Group();
  const map = latticeMap.clone();
  map.needsUpdate = true;
  map.repeat.set(width / 0.5, SCREEN_H / 0.5);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(width, SCREEN_H),
    new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }),
  );
  panel.position.set(0, SCREEN_H / 2, z);
  const wood = new THREE.MeshStandardMaterial({ color: 0x4e3019, roughness: 0.8 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.1, 0.08), wood);
  rail.position.set(0, SCREEN_H, z);
  g.add(panel, rail);
  for (let x = -width / 2; x <= width / 2 + 1e-6; x += width / Math.round(width / 2)) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, SCREEN_H, 0.1), wood);
    post.position.set(x, SCREEN_H / 2, z);
    g.add(post);
  }
  return g;
}

export class Congregation {
  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;
    // Zweite Ebene (Empore bzw. Saal darunter), gegenüber dem Nutzer verschoben
    this.far = new THREE.Group();
    this.people = [];
    this.imam = null;
    this.late = null;
    this.time = 0;
    this.pose = 'stand';
  }

  // size: 'small' | 'large'; gender: des Nutzers; natural: natürlicher Takt statt Gleichtakt
  // blocked(x, z): steht dort eine Säule? Dann bleibt der Platz frei.
  // gallery: { top, z } – Frauen beten auf der Empore (Großmoschee); top = Höhe, z = Lage des Platzes an der Brüstung
  build({ size = 'small', gender = 'm', natural = true, blocked = () => false, gallery = null } = {}) {
    this.clear();
    this.natural = natural;
    const large = size === 'large', female = gender === 'f';
    // Betet der Nutzer als Frau auf der Empore, stehen die eigene Reihe und die Reihen dahinter oben (ohne Säulen);
    // Männer und Imam beten unten im Saal (Gruppe `far`, um Höhe und Abstand der Empore verschoben).
    const up = female && gallery;
    this.blocked = up ? () => false : blocked;
    // Erste Reihe links und rechts vom Nutzer, dahinter weitere Reihen
    const side = large ? 7 : 3;
    for (let k = 1; k <= side; k++) for (const s of [-1, 1]) if (!this.blocked(s * k * SLOT, 0)) this.add({ x: s * k * SLOT, z: 0, female });
    (large ? [14, 13, 12] : [6]).forEach((n, r) => this.addRow(n, (r + 1) * ROW, female));
    let imamZ = -2.1, imamParent = this.group;
    if (gallery) {
      this.far.position.set(0, up ? -gallery.top : gallery.top, up ? -gallery.z : gallery.z);
      this.blocked = up ? blocked : () => false;
      if (up) {
        // Unten im Saal: Männerreihen, der Imam vorn am Mihrab
        (large ? [15, 15, 14, 14, 13] : [7, 7]).forEach((n, r) => this.addRow(n, r * ROW, false, null, this.far));
        imamParent = this.far;
      } else {
        // Der Nutzer betet unten; oben auf der Empore beten die Frauen
        (large ? [15, 15] : [7]).forEach((n, r) => this.addRow(n, r * ROW, true, null, this.far));
      }
      this.blocked = up ? () => false : blocked;
    } else if (female) {
      // Eigener Frauenbereich hinter einer Holzgitterwand (Kafes), die Männer beten davor;
      // durch das Gitter sieht man den Imam und kann ihm folgen.
      const rows = large ? [15, 15] : [7];
      rows.forEach((n, r) => this.addRow(n, -3.6 - r * ROW, false));
      imamZ = -3.6 - rows.length * ROW;
      this.group.add(latticeScreen(large ? 16 : 9, SCREEN_Z));
    }
    this.imam = this.add({ x: 0.25, z: imamZ, female: false, imam: true, parent: imamParent });
    // Ein Nachzügler (Masbūq) kommt in der zweiten Rakʿa dazu und holt die verpasste Rakʿa nach dem Salām nach.
    if (natural) {
      let k = side + 1;
      while (this.blocked(k * SLOT, 0)) k++;
      this.late = this.add({ x: k * SLOT, z: 0, female });
      this.late.late = true;
    }
    this.reset();
  }

  addRow(n, z, female, gap = null, parent = this.group) {
    for (let k = 0; k < n; k++) {
      const x = (k - (n - 1) / 2) * SLOT;
      if ((gap && x > gap[0] && x < gap[1]) || this.blocked(x, z)) continue;
      this.add({ x, z, female, parent });
    }
  }

  add({ x, z, female, imam = false, parent = this.group }) {
    const g = new Guide({
      robe: imam ? 0xfbfaf6 : pick(ROBES),
      skin: pick(SKINS),
      scarf: pick(SCARVES),
      cap: imam || Math.random() < 0.7,
      scale: imam ? 1.02 : rand(0.92, 1.07),
    });
    g.setGender(female ? 'f' : 'm');
    g.group.position.set(x, 0, z);
    g.group.rotation.y = Math.PI;
    const p = { g, x, z, imam, delay: 0, queue: [], phase: rand(0, 6) };
    if (!imam) {
      p.delay = this.natural ? rand(0.25, 0.85) : 0.3;
      if (this.natural) {
        g.speed = rand(2.8, 4.8);
        g.vary = { spine: rand(-0.07, 0.07), headX: rand(-0.12, 0.12), shZ: rand(-0.05, 0.05), elX: rand(-0.08, 0.08) };
      }
    }
    parent.add(g.group);
    this.people.push(p);
    return p;
  }

  clear() {
    this.group.clear();
    this.far.clear();
    this.far.position.set(0, 0, 0);
    this.group.add(this.far);
    this.people = [];
    this.imam = this.late = null;
  }

  // Vor einem neuen Gebet: alle stehen, der Nachzügler ist noch nicht da.
  reset() {
    this.pose = 'stand';
    for (const p of this.people) {
      p.queue = [];
      p.g.setPose('stand');
      p.g.group.position.set(p.x, 0, p.z);
      p.g.group.rotation.y = Math.PI;
    }
    if (this.late) {
      this.late.state = 'away';
      this.late.g.group.visible = false;
    }
  }

  // Der Imam nimmt eine neue Haltung ein; die Gemeinde folgt nach ihm.
  lead(pose, rakah = 0) {
    if (pose === this.pose || !this.imam) return;
    this.pose = pose;
    this.imam.g.setPose(pose);
    for (const p of this.people) {
      if (p.imam) continue;
      if (p.late && p.state !== 'with') {
        if (p.state === 'away' && rakah >= 2) this.arrive(p);
        continue;
      }
      // Die neue Haltung ersetzt alles, was noch später geplant war (z. B. beim Zurückblättern).
      const at = this.time + p.delay + (this.natural ? rand(-0.08, 0.15) : 0);
      p.queue = p.queue.filter((q) => q.at < at);
      p.queue.push({ at, pose });
    }
  }

  arrive(p) {
    p.state = 'walk';
    p.walkT = 0;
    p.from = new THREE.Vector3(p.x + 2.5, 0, p.z + 3.5);
    p.g.group.visible = true;
    p.g.setPose('stand');
  }

  // Gebet beendet: kurzes Bittgebet im Sitzen, manche stehen danach auf; der Nachzügler betet weiter.
  finish() {
    for (const p of this.people) {
      if (p.late) {
        if (p.state === 'with') for (const [at, pose] of MAKEUP) p.queue.push({ at: this.time + at, pose });
        continue;
      }
      const a = this.time + (this.natural ? rand(1.5, 4) : 2);
      p.queue.push({ at: a, pose: 'sitDua' });
      const up = this.natural ? Math.random() < 0.55 : false;
      p.queue.push({ at: a + (this.natural ? rand(6, 14) : 9), pose: up ? 'stand' : 'sit' });
    }
  }

  update(dt) {
    if (!this.group.visible) return;
    this.time += dt;
    for (const p of this.people) {
      while (p.queue.length && p.queue[0].at <= this.time) p.g.setPose(p.queue.shift().pose);
      p.g.update(dt);
      if (p.late && p.state === 'walk') this.walk(p, dt);
      else if (this.natural && !p.imam) {
        // Atmen und leichtes Schwanken
        p.g.root.position.y += Math.sin(this.time * 1.4 + p.phase) * 0.004;
        p.g.spine.rotation.z = Math.sin(this.time * 0.5 + p.phase) * 0.012;
      }
    }
  }

  // Nachzügler geht von hinten zu seinem Platz, dreht sich zur Qibla, sagt den Takbīr und schließt sich an.
  walk(p, dt) {
    p.walkT += dt;
    const k = Math.min(1, p.walkT / WALK), e = k * k * (3 - 2 * k);
    const pos = p.g.group.position;
    pos.lerpVectors(p.from, new THREE.Vector3(p.x, 0, p.z), e);
    const heading = Math.atan2(p.x - p.from.x, p.z - p.from.z);
    const turn = Math.max(0, (k - 0.75) / 0.25);
    p.g.group.rotation.y = heading + (Math.atan2(Math.sin(Math.PI - heading), Math.cos(Math.PI - heading))) * turn;
    const swing = Math.sin(p.walkT * 7) * 0.35 * (1 - turn);
    p.g.legs[0].hip.rotation.x = swing;
    p.g.legs[1].hip.rotation.x = -swing;
    p.g.arms[0].sh.rotation.x = -swing * 0.6;
    p.g.arms[1].sh.rotation.x = swing * 0.6;
    p.g.root.position.y += Math.abs(Math.sin(p.walkT * 7)) * 0.015 * (1 - turn);
    if (k >= 1) {
      p.state = 'with';
      p.queue = [{ at: this.time + 0.3, pose: 'takbir' }, { at: this.time + 2, pose: this.pose }];
    }
  }
}
