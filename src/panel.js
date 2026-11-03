import * as THREE from 'three';
import { TAQABBAL } from './prayer.js';
import { drawArrow, drawPictogram, moveFor } from './movement.js';
import { drawBody } from './wudu.js';

const C = {
  bg: 'rgba(10,18,32,0.94)', border: '#c9a85c', gold: '#e6c77f', text: '#eef2f7', muted: '#9fb0c6',
  btn: '#1d2b45', btnHover: '#2c4168', primary: '#24785a', primaryHover: '#2f9670', active: '#7a5f22', track: '#24324d',
};
const AR = 'Amiri, "Noto Naskh Arabic", "Geeza Pro", serif';
const UI = 'Inter, system-ui, sans-serif';

function wrap(ctx, text, maxW) {
  const lines = [];
  let cur = '';
  for (const word of text.split(' ')) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && ctx.measureText(next).width > maxW) { lines.push(cur); cur = word; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

class CanvasPlane {
  constructor(widthM, heightM, pxW) {
    this.W = pxW;
    this.H = Math.round(pxW * heightM / widthM);
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(widthM, heightM),
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true }),
    );
  }

  frame(radius = 36) {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();
    ctx.roundRect(4, 4, W - 8, H - 8, radius);
    ctx.fillStyle = C.bg;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = C.border;
    ctx.stroke();
  }

  text(str, x, y, { size = 30, font = UI, weight = '', color = C.text, align = 'left', rtl = false, base = 'alphabetic' } = {}) {
    const { ctx } = this;
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = base;
    ctx.direction = rtl ? 'rtl' : 'ltr';
    ctx.fillText(str, x, y);
    ctx.direction = 'ltr';
  }
}

export class Panel extends CanvasPlane {
  constructor(widthM = 1.3, heightM = 0.93, pxW = 1400) {
    super(widthM, heightM, pxW);
    this.buttons = [];
    this.hover = null;
    this.last = null;
  }

  // uv vom Raycast → Button oder null
  hit(uv) {
    const x = uv.x * this.W, y = (1 - uv.y) * this.H;
    return this.buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || null;
  }

  setHover(action) {
    if (action === this.hover) return false;
    this.hover = action;
    return true;
  }

  render(v) {
    this.last = v;
    this.buttons = [];
    this.frame();
    this[`v_${v.type}`](v);
    this.tex.needsUpdate = true;
  }

  btn(label, x, y, w, h, action, opt = {}) {
    const { ctx } = this;
    const hov = this.hover === action;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 18);
    ctx.fillStyle = opt.primary ? (hov ? C.primaryHover : C.primary) : opt.active ? C.active : (hov ? C.btnHover : C.btn);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = hov ? C.gold : 'rgba(201,168,92,0.35)';
    ctx.stroke();
    const cy = y + h / 2;
    this.text(label, x + w / 2, opt.sub ? cy - 18 : cy + 2, { size: opt.size || 32, weight: 600, align: 'center', base: 'middle' });
    if (opt.sub) this.text(opt.sub, x + w / 2, cy + 30, { size: opt.subSize || 30, font: opt.subFont || UI, color: C.gold, align: 'center', base: 'middle' });
    this.buttons.push({ x, y, w, h, action });
  }

  heading(title, sub) {
    this.text(title, 60, 96, { size: 50, weight: 700, color: C.gold });
    if (sub) this.text(sub, this.W - 60, 96, { size: 28, color: C.muted, align: 'right' });
  }

  paragraphs(list, y, { size = 30, color = C.text, gap = 18, maxW = this.W - 120 } = {}) {
    const { ctx } = this;
    ctx.font = `${size}px ${UI}`;
    for (const p of list) {
      for (const line of wrap(ctx, p, maxW)) {
        this.text(line, 60, y, { size, color });
        y += size * 1.4;
      }
      y += gap;
    }
    return y;
  }

  // Arabisch + Umschrift + Deutsch, bei Bedarf verkleinert, damit alles zwischen top und bottom passt.
  recitation(t, top, bottom, center = false) {
    const { ctx, W } = this;
    const maxW = W - 120;
    const layout = (s, draw) => {
      let y = top;
      ctx.font = `${54 * s}px ${AR}`;
      ctx.direction = 'rtl';
      for (const line of t.ar) {
        for (const l of wrap(ctx, line, maxW)) {
          if (draw) this.text(l, center ? W / 2 : W - 60, y + 50 * s, { size: 54 * s, font: AR, rtl: true, align: center ? 'center' : 'right' });
          y += 88 * s;
        }
      }
      ctx.direction = 'ltr';
      y += t.ar.length ? 12 * s : 0;
      for (const [items, style] of [[t.tr, { color: C.gold, weight: 'italic' }], [t.de, { color: C.text }]]) {
        ctx.font = `${style.weight || ''} ${30 * s}px ${UI}`;
        for (const line of items) {
          for (const l of wrap(ctx, line, maxW)) {
            if (draw) this.text(l, center ? W / 2 : 60, y + 30 * s, { size: 30 * s, align: center ? 'center' : 'left', ...style });
            y += 42 * s;
          }
        }
        y += 14 * s;
      }
      return y;
    };
    let s = 1;
    while (s > 0.5 && layout(s, false) > bottom) s -= 0.02;
    return layout(s, true);
  }

  v_menu(v) {
    const { W } = this;
    this.heading('Salah VR', 'Gebetsassistent');
    this.text('Wähle ein Gebet – ich führe dich Schritt für Schritt hindurch.', 60, 160, { size: 32, color: C.muted });
    const gap = 20, w = (W - 120 - gap * 4) / 5;
    v.prayers.forEach((p, i) => {
      this.btn(p.name, 60 + i * (w + gap), 210, w, 200, `prayer:${p.id}`, {
        size: 40, sub: `${p.ar}`, subFont: AR, subSize: 46, active: p.id === v.times.current,
      });
      const cx = 60 + i * (w + gap) + w / 2;
      const row = v.times.rows.find((t) => t.id === p.id);
      this.text(`${row.time} Uhr · ${p.rakat} Rakʿāt`, cx, 450, { size: 26, color: C.text, align: 'center' });
      this.text(p.id === v.times.current ? 'jetzt' : p.de, cx, 484, { size: 22, color: p.id === v.times.current ? C.gold : C.muted, align: 'center' });
    });
    const n = v.times.next;
    this.text(`Nächstes Gebet: ${n.name} um ${n.time} Uhr – in ${n.inText}`, 60, 545, { size: 32, weight: 600, color: C.gold });
    this.text(`${v.qibla} · ${v.calibrated ? 'kalibriert ✓' : 'nicht kalibriert'} · ${v.madhab}`, 60, 588, { size: 26, color: v.calibrated ? '#7fd1a8' : C.muted });
    const bw = (W - 120 - gap * 3) / 4;
    [
      [['Gebetszeiten', 'times'], ['Weitere Gebete', 'more'], ['Wuḍūʾ lernen', 'wudu'], ['Lernen & Quiz', 'learn']],
      [['Qibla einstellen', 'qibla'], ['Tasbīḥ zählen', 'tasbih'], ['Moschee wählen', 'mosque'], ['Einstellungen', 'settings']],
    ].forEach((row, ri) => row.forEach(([label, action], i) => {
      this.btn(label, 60 + i * (bw + gap), 630 + ri * 115, bw, 98, action, { primary: action === 'wudu' && !v.wuduDone });
    }));
    this.text('السَّلَامُ عَلَيْكُمْ', W / 2, this.H - 60, { size: 44, font: AR, color: C.gold, align: 'center', rtl: true });
  }

  v_times(v) {
    const { W, H, ctx } = this;
    this.heading('Gebetszeiten', `${v.location} · heute`);
    const rowH = 82, gap = 12;
    v.rows.forEach((row, i) => {
      const y = 140 + i * (rowH + gap);
      const isCurrent = row.id === v.current, isNext = row.id === v.next.id;
      if (row.prayer) {
        this.btn('', 60, y, W - 120, rowH, `prayer:${row.id}`, { active: isCurrent });
      } else {
        ctx.beginPath();
        ctx.roundRect(60, y, W - 120, rowH, 18);
        ctx.fillStyle = 'rgba(29,43,69,0.5)';
        ctx.fill();
      }
      const color = row.prayer ? C.text : C.muted;
      this.text(row.name, 100, y + rowH / 2 + 2, { size: 36, weight: 600, color, base: 'middle' });
      this.text(row.time, W - 100, y + rowH / 2 + 2, { size: 40, weight: 700, color, align: 'right', base: 'middle' });
      const tag = isCurrent ? 'jetzt · tippen zum Beten' : isNext ? `in ${v.next.inText}` : row.prayer ? '' : 'kein Gebet';
      if (tag) this.text(tag, W / 2, y + rowH / 2 + 2, { size: 26, color: isCurrent || isNext ? C.gold : C.muted, align: 'center', base: 'middle' });
    });
    const note = v.highLatitude
      ? 'Hohe Breite: Fajr/Isha sind angenähert (Anteil der Nacht). Lokale Moscheen können abweichen.'
      : 'Berechnet aus dem Sonnenstand. Lokale Moscheen können um einige Minuten abweichen.';
    this.text(note, 60, 720, { size: 24, color: C.muted });
    const by = H - 140, bw = (W - 120 - 40) / 3;
    this.btn('Methode', 60, by, bw, 96, 'method', { size: 26, sub: v.method, subSize: 22 });
    this.btn('Asr-Berechnung', 60 + bw + 20, by, bw, 96, 'asr', { size: 26, sub: v.asr.split(' (')[0], subSize: 22 });
    this.btn('Zurück', 60 + 2 * (bw + 20), by, bw, 96, 'menu');
  }

  v_qibla(v) {
    const { W, H } = this;
    this.heading('Qibla-Richtung');
    let y = this.paragraphs([
      'Die Quest hat keinen Kompass. So richtest du den Raum nach Mekka aus:',
      '1. Wähle deinen Ort.   2. Schau genau nach Norden (z. B. mit der Kompass-App deines Handys) und drücke „Ich schaue nach Norden“. Danach zeigt der Mihrab die Qibla.',
    ], 160, { size: 28, color: C.muted, gap: 6 });
    this.text(`Ort: ${v.location.name}  ·  Qibla ${Math.round(v.bearing)}° von Norden`, 60, y + 24, { size: 32, weight: 600 });
    y += 60;
    const gap = 16, cols = 5, w = (W - 120 - gap * (cols - 1)) / cols, h = 74;
    v.cities.forEach((c, i) => {
      const x = 60 + (i % cols) * (w + gap), yy = y + Math.floor(i / cols) * (h + gap);
      this.btn(c.name, x, yy, w, h, `city:${i}`, { size: 28, active: c.name === v.location.name });
    });
    this.btn('📍 GPS', 60 + 4 * (w + gap), y + h + gap, w, h, 'gps', { size: 28, active: v.location.name === 'Mein Standort' });
    y += 2 * (h + gap) + 20;
    this.text(v.calibrated ? 'Status: kalibriert ✓' : 'Status: nicht kalibriert', 60, y + 20, { size: 28, color: v.calibrated ? '#7fd1a8' : C.muted });
    if (v.msg) this.text(v.msg, 60, y + 64, { size: 28, color: C.gold });
    const by = H - 140;
    this.btn('Ich schaue nach Norden', 60, by, 560, 96, 'calibrate', { primary: true });
    this.btn('Zurücksetzen', 640, by, 300, 96, 'resetcal');
    this.btn('Zurück', 960, by, W - 1020, 96, 'menu');
  }

  v_step(v) {
    const { W, H } = this;
    const { step, prayer } = v;
    const unit = step.unit ? ` · ${step.unit}` : '';
    const status = step.rakah ? `${prayer.name}${unit} · Rakʿa ${step.rakah} von ${step.of || prayer.rakat}` : `${prayer.name}${unit}`;
    this.heading(step.title, status);
    // Fortschritt
    const { ctx } = this;
    ctx.fillStyle = C.track;
    ctx.beginPath(); ctx.roundRect(60, 120, W - 120, 10, 5); ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.roundRect(60, 120, (W - 120) * (v.index + 1) / v.total, 10, 5); ctx.fill();

    this.movement(v, 150, 230);
    let y = 430;
    if (v.inner) y = this.paragraphs([`✦  ${v.inner}`], 425, { size: 27, color: C.gold, gap: 8 });
    y = this.paragraphs([step.instr], y, { size: 28, color: C.muted, gap: 10 });
    this.recitation(step, y, H - 150);

    const by = H - 120, bh = 90;
    this.btn('◀ Zurück', 60, by, 220, bh, 'prev');
    this.btn('Menü', 300, by, 170, bh, 'menu');
    this.btn(v.auto ? 'Auto: an' : 'Auto: aus', 490, by, 220, bh, 'auto', { active: v.auto });
    this.btn('Vorlesen', 730, by, 230, bh, 'speak');
    this.btn(v.index === v.total - 1 ? 'Fertig ✓' : 'Weiter ▶', 980, by, W - 1040, bh, 'next', { primary: true });
  }

  // Bewegungs-Box: Piktogramm, Ansage, Ausführung und – in VR – ob die Haltung erkannt wurde.
  movement(v, top, h) {
    const { ctx, W } = this;
    const step = v.step;
    const m = step.wudu
      ? { cue: step.cue, how: `${step.count}×${step.count > 1 && step.fard ? ' (1× ist Pflicht)' : ''} · ${step.fard ? 'Pflicht (Farḍ)' : 'Sunnah'}`, arrow: null }
      : { ...moveFor(v.prevPose, step.pose), ...(step.how ? { how: step.how } : {}) };
    const ok = v.posture === 'ok';
    ctx.beginPath();
    ctx.roundRect(60, top, W - 120, h, 22);
    ctx.fillStyle = ok ? 'rgba(36,120,90,0.32)' : 'rgba(36,50,77,0.7)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = ok ? '#7fd1a8' : 'rgba(201,168,92,0.45)';
    ctx.stroke();
    if (step.wudu) drawBody(ctx, step.wudu, 80, top + 10, h - 20);
    else drawPictogram(ctx, v.prevPose, step.pose, 80, top + 10, h - 20);
    const x = 80 + h + 10;
    this.text(m.cue, x, top + 62, { size: 46, weight: 700, color: m.arrow ? C.gold : C.text });
    ctx.font = `26px ${UI}`;
    let y = top + 108;
    for (const line of wrap(ctx, m.how, W - 60 - x - 20).slice(0, 2)) {
      this.text(line, x, y, { size: 26, color: C.muted });
      y += 36;
    }
    const status = {
      ok: ['✓ Haltung erkannt', '#7fd1a8'],
      wait: ['… nimm jetzt die Haltung ein', C.gold],
      off: ['In VR erkennt die App deine Haltung an der Kopfhöhe.', C.muted],
      wudu: [`Schritt ${v.index + 1} von ${v.total} der Gebetswaschung`, C.muted],
    }[v.posture] || ['', C.muted];
    this.text(status[0], x, top + h - 22, { size: 26, weight: v.posture === 'off' ? '' : 600, color: status[1] });
  }

  v_done(v) {
    const { W, H } = this;
    if (v.prayer.kind === 'wudu') {
      this.heading('Wuḍūʾ beendet', 'Gebetswaschung');
      this.paragraphs([
        'Gut gemacht! Du bist jetzt im Zustand der rituellen Reinheit und kannst beten.',
        'Die Wuḍūʾ wird u. a. ungültig durch: Toilettengang, Blähungen, tiefen Schlaf, Bewusstlosigkeit und – je nach Rechtsschule – Blutungen oder Erbrechen.',
      ], 200, { size: 32, gap: 26 });
      const by = H - 140, gap = 20, w = (W - 120 - gap) / 2;
      this.btn('Jetzt beten', 60, by, w, 96, 'menu', { primary: true });
      this.btn('Nochmal üben', 60 + w + gap, by, w, 96, 'again');
      return;
    }
    this.heading('Gebet beendet', v.prayer.name);
    this.recitation(TAQABBAL, 230, 560, true);
    this.paragraphs(['Empfohlen nach dem Gebet: 33× Subḥāna llāh, 33× Al-ḥamdu li-llāh, 34× Allāhu akbar.'], 620, { size: 28, color: C.muted });
    const by = H - 140, gap = 20, w = (W - 120 - 2 * gap) / 3;
    this.btn('Tasbīḥ zählen', 60, by, w, 96, 'tasbih', { primary: true });
    this.btn('Nochmal beten', 60 + w + gap, by, w, 96, 'again');
    this.btn('Menü', 60 + 2 * (w + gap), by, w, 96, 'menu');
  }

  v_tasbih(v) {
    const { W, H, ctx } = this;
    this.heading('Tasbīḥ', v.finished ? 'abgeschlossen' : `Runde ${v.phase + 1} von ${v.phases}`);
    if (v.finished) {
      this.recitation(TAQABBAL, 250, 600, true);
    } else {
      this.text(v.ar, W / 2, 290, { size: 92, font: AR, color: C.text, align: 'center', rtl: true });
      this.text(v.tr, W / 2, 370, { size: 34, color: C.gold, align: 'center', weight: 'italic' });
      this.text(v.de, W / 2, 420, { size: 30, color: C.muted, align: 'center' });
      this.text(`${v.count} / ${v.target}`, W / 2, 560, { size: 110, weight: 700, color: C.text, align: 'center' });
      ctx.fillStyle = C.track;
      ctx.beginPath(); ctx.roundRect(260, 600, W - 520, 12, 6); ctx.fill();
      ctx.fillStyle = C.gold;
      ctx.beginPath(); ctx.roundRect(260, 600, (W - 520) * v.count / v.target, 12, 6); ctx.fill();
    }
    if (v.breath && !v.finished) {
      const inhale = v.breathPhase === 'in';
      this.text(inhale ? 'Einatmen …' : `Ausatmen – sprich: ${v.tr}`, W / 2, 690, { size: 36, weight: 600, color: inhale ? C.muted : '#7fd1a8', align: 'center' });
      this.text('Folge der leuchtenden Kugel über dem Panel.', W / 2, 735, { size: 24, color: C.muted, align: 'center' });
    }
    const by = H - 160;
    this.btn(v.finished ? 'Nochmal' : 'Zählen  +1', 60, by, 600, 116, v.finished ? 'tasbihreset' : 'count', { primary: true, size: 40 });
    this.btn(v.breath ? 'Atem: an' : 'Atem: aus', 680, by, 260, 116, 'breath', { active: v.breath });
    this.btn('Neu', 960, by, 180, 116, 'tasbihreset');
    this.btn('Menü', 1160, by, W - 1220, 116, 'menu');
  }

  v_more(v) {
    const { W, H } = this;
    this.heading('Weitere Gebete', v.madhab);
    const gap = 20, w = (W - 120 - gap) / 2, h = 112;
    v.prayers.forEach((p, i) => {
      const x = 60 + (i % 2) * (w + gap), y = 140 + Math.floor(i / 2) * (h + 18);
      this.btn(p.name, x, y, w, h, `prayer:${p.id}`, { size: 34, sub: `${p.rakat} Rakʿāt · ${p.de}`, subSize: 24 });
    });
    this.text('Witr und 4 Rakʿāt Sunnah werden je nach Rechtsschule am Stück oder in zwei Teilen gebetet.', 60, H - 170, { size: 24, color: C.muted });
    this.btn('Zurück', 60, H - 140, W - 120, 96, 'menu');
  }

  v_settings(v) {
    const { W, H } = this;
    this.heading('Einstellungen');
    this.text('Rechtsschule (Madhhab)', 60, 160, { size: 30, weight: 600 });
    const gap = 20, w = (W - 120 - gap * 3) / 4;
    v.madhabs.forEach((m, i) => this.btn(m.name, 60 + i * (w + gap), 180, w, 80, `madhab:${m.id}`, { active: m.id === v.madhab.id }));
    this.text(`Das ändert sich mit ${v.madhab.name}:`, 60, 310, { size: 26, color: C.gold, weight: 600 });
    this.paragraphs(v.madhab.notes.map((n) => `•  ${n}`), 350, { size: 24, gap: 0 });
    const row = (y, label, sub, buttons) => {
      this.text(label, 60, y + 32, { size: 30, weight: 600 });
      if (sub) this.text(sub, 60, y + 64, { size: 22, color: C.muted });
      buttons.forEach(([text, action, active], i) => this.btn(text, W - 60 - (buttons.length - i) * 250 + 10, y, 240, 76, action, { active }));
    };
    row(590, 'Anleitung für', '', [['Männer', 'gender:m', v.gender !== 'f'], ['Frauen', 'gender:f', v.gender === 'f']]);
    row(680, 'Anfänger-Modus', 'langsamer, jeder Schritt wird vorgelesen', [[v.beginner ? 'An' : 'Aus', 'beginner', v.beginner]]);
    row(770, 'Spiritueller Modus', 'innere Bedeutung jedes Schritts, Atem-Dhikr', [[v.spiritual ? 'An' : 'Aus', 'spiritual', v.spiritual]]);
    const half = (W - 120 - 20) / 2;
    this.btn('Hinweise', 60, H - 120, half, 90, 'info');
    this.btn('Zurück', 60 + half + 20, H - 120, half, 90, 'menu');
  }

  v_mosque(v) {
    const { W, H } = this;
    this.heading('Moschee wählen', 'Der Raum wechselt sofort');
    v.styles.forEach((st, i) => {
      this.btn(st.name, 60, 150 + i * 170, W - 120, 150, `style:${st.id}`, { size: 42, sub: st.de, subSize: 26, active: st.id === v.style });
    });
    this.paragraphs(['Die Räume sind freie Gestaltungen, inspiriert von islamischen Bautraditionen – keine Nachbauten bestimmter Moscheen.'], H - 220, { size: 24, color: C.muted });
    this.btn('Zurück', 60, H - 140, W - 120, 96, 'menu');
  }

  v_learn(v) {
    const { W, H, ctx } = this;
    this.heading('Lernen & Fortschritt');
    const p = v.progress;
    const stats = [
      [`${v.totalPrayers}`, 'Gebete geübt'],
      [`${p.wudu}`, 'Waschungen geübt'],
      [`${v.streak}`, 'Tage in Folge'],
      [`${p.quizBest}/10`, 'Bestes Quiz'],
    ];
    const gap = 20, w = (W - 120 - gap * 3) / 4;
    stats.forEach(([num, label], i) => {
      const x = 60 + i * (w + gap);
      ctx.beginPath(); ctx.roundRect(x, 140, w, 150, 20); ctx.fillStyle = C.btn; ctx.fill();
      this.text(num, x + w / 2, 225, { size: 64, weight: 700, color: C.gold, align: 'center' });
      this.text(label, x + w / 2, 268, { size: 24, color: C.muted, align: 'center' });
    });
    this.text('Abzeichen', 60, 350, { size: 32, weight: 600 });
    const bw = (W - 120 - gap * 2) / 3;
    v.badges.forEach((b, i) => {
      const x = 60 + (i % 3) * (bw + gap), y = 375 + Math.floor(i / 3) * 90;
      ctx.beginPath(); ctx.roundRect(x, y, bw, 74, 16);
      ctx.fillStyle = b.ok ? C.active : 'rgba(29,43,69,0.5)'; ctx.fill();
      this.text(`${b.ok ? '★' : '☆'}  ${b.name}`, x + 24, y + 38, { size: 26, color: b.ok ? C.text : C.muted, base: 'middle', weight: b.ok ? 600 : '' });
    });
    this.text('Teste dein Wissen: 10 Fragen zu Ablauf, Texten und Waschung.', 60, 600, { size: 28, color: C.muted });
    const by = H - 140, bw2 = (W - 120 - gap) / 2;
    this.btn('Quiz starten', 60, by - 120, W - 120, 100, 'quiz', { primary: true, size: 38 });
    this.btn('Fortschritt zurücksetzen', 60, by, bw2, 96, 'resetprogress', { size: 28 });
    this.btn('Zurück', 60 + bw2 + gap, by, bw2, 96, 'menu');
  }

  v_quiz(v) {
    const { W, H, ctx } = this;
    const z = v.quiz;
    if (z.i >= z.questions.length) {
      this.heading('Quiz beendet');
      this.text(`${z.score} von ${z.questions.length}`, W / 2, 360, { size: 120, weight: 700, color: C.gold, align: 'center' });
      const msg = z.score === z.questions.length ? 'Māshāʾ Allāh – alles richtig!' : z.score >= 7 ? 'Sehr gut! Noch ein bisschen üben.' : 'Weiter üben – du schaffst das!';
      this.text(msg, W / 2, 450, { size: 36, align: 'center' });
      this.text(`Bisher bestes Ergebnis: ${v.progress.quizBest}/10`, W / 2, 510, { size: 28, color: C.muted, align: 'center' });
      const by = H - 140, gap = 20, w = (W - 120 - gap) / 2;
      this.btn('Nochmal', 60, by, w, 96, 'quiz', { primary: true });
      this.btn('Zurück', 60 + w + gap, by, w, 96, 'learn');
      return;
    }
    const q = z.questions[z.i];
    this.heading(`Frage ${z.i + 1} von ${z.questions.length}`, `${z.score} richtig`);
    ctx.fillStyle = C.track;
    ctx.beginPath(); ctx.roundRect(60, 120, W - 120, 10, 5); ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.roundRect(60, 120, (W - 120) * z.i / z.questions.length, 10, 5); ctx.fill();
    const y = this.paragraphs([q.q], 210, { size: 40, gap: 0 });
    const top = Math.max(y + 10, 300);
    q.options.forEach((o, i) => {
      const yy = top + i * 108;
      const answered = z.answer != null;
      const isRight = i === q.correct, isChosen = i === z.answer;
      // Nach der Antwort: richtige grün, falsch gewählte rot markieren
      this.btn(o, 60, yy, W - 120, 92, answered ? 'noop' : `answer:${i}`, { size: 32, primary: answered && isRight });
      if (answered && isChosen && !isRight) {
        ctx.lineWidth = 6; ctx.strokeStyle = '#d9645a';
        ctx.beginPath(); ctx.roundRect(60, yy, W - 120, 92, 18); ctx.stroke();
      }
    });
    if (z.answer != null) {
      const right = z.answer === q.correct;
      this.text(right ? '✓ Richtig!' : '✗ Leider falsch – die grüne Antwort ist richtig.', 60, H - 165, { size: 30, weight: 600, color: right ? '#7fd1a8' : '#e8908a' });
      this.btn(z.i === z.questions.length - 1 ? 'Ergebnis' : 'Nächste Frage ▶', W - 480, H - 140, 420, 96, 'quiznext', { primary: true });
    }
    this.btn('Abbrechen', 60, H - 140, 300, 96, 'learn');
  }

  v_info() {
    this.heading('Hinweise');
    this.paragraphs([
      'Diese App ist eine Lernhilfe. Sie folgt dem verbreiteten sunnitischen Ablauf. Einzelheiten – Handhaltung, Eröffnungs-Bittgebet, laute oder leise Rezitation – unterscheiden sich je nach Rechtsschule (Hanafī, Shāfiʿī, Mālikī, Ḥanbalī).',
      'Voraussetzungen: rituelle Waschung (Wuḍūʾ), saubere Kleidung und ein sauberer Platz, Bedeckung der ʿAwra, die richtige Gebetszeit und die Ausrichtung zur Qibla.',
      'Die Sprachausgabe ist eine Computerstimme und ersetzt keine Rezitation mit Tajwīd. Lerne die Aussprache am besten mit einem Lehrer.',
      'Bei Fragen wende dich an einen Imam oder eine kundige Person deines Vertrauens. Die Vorbeter-Figur ist bewusst gesichtslos gestaltet.',
    ], 170, { size: 30, gap: 22 });
    this.btn('Zurück', 60, this.H - 140, this.W - 120, 96, 'settings');
  }
}

// Kleine Tafel flach auf dem Boden vor dem Gebetsteppich – lesbar in Rukūʿ und Sujūd.
export class FloorCard extends CanvasPlane {
  constructor() {
    super(0.9, 0.34, 1024);
    this.mesh.rotation.x = -Math.PI / 2;
  }

  render(v) {
    const { W, H } = this;
    this.frame(28);
    if (v.type === 'step') {
      const s = v.step;
      const m = s.wudu ? { cue: `${s.cue} · ${s.count}×` } : moveFor(v.prevPose, s.pose);
      // links das Piktogramm, rechts Ansage und Text
      if (s.wudu) drawBody(this.ctx, s.wudu, 24, 60, 260);
      else drawPictogram(this.ctx, v.prevPose, s.pose, 24, 60, 260);
      const x0 = 300, cx = (x0 + W - 30) / 2;
      let cueSize = 44;
      this.ctx.font = `700 ${cueSize}px ${UI}`;
      while (cueSize > 28 && this.ctx.measureText(m.cue).width > W - x0 - 210) this.ctx.font = `700 ${(cueSize -= 2)}px ${UI}`;
      this.text(m.cue, x0, 72, { size: cueSize, weight: 700, color: v.posture === 'ok' ? '#7fd1a8' : C.gold });
      if (s.rakah) this.text(`Rakʿa ${s.rakah}/${s.of || v.prayer.rakat}`, W - 40, 72, { size: 32, color: C.muted, align: 'right' });
      this.text(s.title, x0, 122, { size: 30, color: C.muted });
      if (s.ar.length) {
        let size = 64;
        this.ctx.font = `${size}px ${AR}`;
        while (size > 30 && this.ctx.measureText(s.ar[0]).width > W - x0 - 40) this.ctx.font = `${(size -= 4)}px ${AR}`;
        this.text(s.ar[0], cx, 236, { size, font: AR, align: 'center', rtl: true });
      }
      this.ctx.font = `italic 30px ${UI}`;
      this.text(wrap(this.ctx, s.tr[0] || s.de[0] || '', W - x0 - 40)[0] || '', cx, 330, { size: 30, color: C.muted, align: 'center', weight: 'italic' });
    } else {
      this.text('Salah VR', W / 2, 150, { size: 64, weight: 700, color: C.gold, align: 'center' });
      this.text('Wähle am Panel ein Gebet', W / 2, 250, { size: 36, color: C.muted, align: 'center' });
    }
    this.tex.needsUpdate = true;
  }
}

// Kurze Bewegungsansage, die beim Haltungswechsel vor dem Blick erscheint.
export class CueBanner extends CanvasPlane {
  constructor() {
    super(0.6, 0.16, 1024);
    this.mesh.material.depthTest = false;
    this.mesh.renderOrder = 10;
    this.mesh.visible = false;
  }

  render(move) {
    const { ctx, W, H } = this;
    this.frame(30);
    drawArrow(ctx, move.arrow, 110, H / 2, 150, '#7fd1a8', 18);
    const x = move.arrow ? 210 : W / 2;
    let size = 64;
    ctx.font = `700 ${size}px ${UI}`;
    while (size > 36 && ctx.measureText(move.cue).width > W - 40 - (move.arrow ? 210 : 40)) ctx.font = `700 ${(size -= 2)}px ${UI}`;
    this.text(move.cue, x, H / 2 + 4, { size, weight: 700, color: C.gold, base: 'middle', align: move.arrow ? 'left' : 'center' });
    this.tex.needsUpdate = true;
  }
}
