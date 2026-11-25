import * as THREE from 'three';
import { taqabbal } from './prayer.js';
import { isRTL, t } from './i18n.js';
import { drawArrow, drawPictogram, moveFor } from './movement.js';
import { drawBody } from './wudu.js';
import { menuGroups } from './menu.js';

const C = {
  bg: 'rgba(11,19,34,0.95)', border: '#c9a85c', gold: '#e6c77f', text: '#f0f3f8', muted: '#a9b7cb',
  btn: '#1a2740', btnHover: '#263a5c', primary: '#23805f', primaryHover: '#2c9a73', active: '#3a3524', activeHover: '#4a4329', track: '#22324f',
  line: 'rgba(255,255,255,0.14)',
};
const AR = 'Amiri, "Noto Naskh Arabic", "Geeza Pro", serif';
const UI = 'Inter, "Noto Sans Arabic", "Geeza Pro", system-ui, sans-serif';

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

  // In Arabisch wird die Oberfläche gespiegelt: linksbündig wird rechtsbündig (fixed: Position beibehalten).
  text(str, x, y, { size = 30, font = UI, weight = '', color = C.text, align = 'left', rtl = false, base = 'alphabetic', fixed = false } = {}) {
    const { ctx } = this;
    if (isRTL() && font === UI && !fixed) {
      rtl = true;
      if (align !== 'center') { x = this.W - x; align = align === 'left' ? 'right' : 'left'; }
    }
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

  // Knopf: neutral, Hauptaktion (grün) oder gewählt (goldener Rand und goldene Schrift).
  // Zu lange Beschriftungen werden verkleinert, statt über den Rand zu laufen.
  btn(label, x, y, w, h, action, opt = {}) {
    const { ctx } = this;
    const hov = this.hover === action;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(18, h / 3.2));
    ctx.fillStyle = opt.primary ? (hov ? C.primaryHover : C.primary) : opt.active ? (hov ? C.activeHover : C.active) : (hov ? C.btnHover : C.btn);
    ctx.fill();
    ctx.lineWidth = hov || opt.active ? 3 : 2;
    ctx.strokeStyle = opt.wrong ? '#e06a5a' : hov || opt.active ? C.gold : opt.primary ? 'rgba(255,255,255,0.22)' : C.line;
    if (opt.wrong) ctx.lineWidth = 4;
    ctx.stroke();
    const cy = y + h / 2;
    let size = opt.size || 32;
    ctx.font = `600 ${size}px ${UI}`;
    while (size > 18 && ctx.measureText(label).width > w - 20) ctx.font = `600 ${(size -= 1)}px ${UI}`;
    const color = opt.active && !opt.primary ? C.gold : C.text;
    // Passt die Beschriftung auch klein nicht in eine Zeile: auf zwei Zeilen umbrechen (statt überlappen)
    const space = ctx.measureText(label).width > w - 20 && !opt.sub ? label.lastIndexOf(' ', Math.ceil(label.length / 2) + 4) : -1;
    if (space > 0) {
      let s2 = Math.min(opt.size || 32, 26);
      const lines = [label.slice(0, space), label.slice(space + 1)];
      ctx.font = `600 ${s2}px ${UI}`;
      while (s2 > 15 && Math.max(...lines.map((l) => ctx.measureText(l).width)) > w - 16) ctx.font = `600 ${(s2 -= 1)}px ${UI}`;
      lines.forEach((l, k) => this.text(l, x + w / 2, cy + (k - 0.5) * s2 * 1.15 + 2, { size: s2, weight: 600, align: 'center', base: 'middle', color }));
      this.buttons.push({ x, y, w, h, action });
      return;
    }
    this.text(label, x + w / 2, opt.sub ? cy - 18 : cy + 2, { size, weight: 600, align: 'center', base: 'middle', color });
    if (opt.sub) {
      const font = opt.subFont || UI;
      let sub = opt.subSize || 30;
      ctx.font = `${sub}px ${font}`;
      while (sub > 16 && ctx.measureText(opt.sub).width > w - 20) ctx.font = `${(sub -= 1)}px ${font}`;
      this.text(opt.sub, x + w / 2, cy + 30, { size: sub, font, color: opt.primary ? 'rgba(255,255,255,0.85)' : C.gold, align: 'center', base: 'middle' });
    }
    this.buttons.push({ x, y, w, h, action });
  }

  // Überschrift links, Untertitel rechts – bei langen Texten kleiner, damit sich nichts überlappt
  heading(title, sub) {
    const { ctx, W } = this, room = W - 120;
    let ts = 50, ss = 28;
    const tw = () => { ctx.font = `700 ${ts}px ${UI}`; return ctx.measureText(title).width; };
    const sw = () => { if (!sub) return 0; ctx.font = `${ss}px ${UI}`; return ctx.measureText(sub).width; };
    while (tw() + sw() + 30 > room && (ts > 34 || ss > 18)) { if (ss > 18) ss -= 1; if (ts > 34) ts -= 1; }
    this.text(title, 60, 96, { size: ts, weight: 700, color: C.gold });
    if (!sub) return;
    if (tw() + sw() + 30 > room) this.text(sub, W - 60, 118, { size: 18, color: C.muted, align: 'right' });
    else this.text(sub, W - 60, 96, { size: ss, color: C.muted, align: 'right' });
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

  // Arabisch + Umschrift + Bedeutung zwischen top und bottom.
  // Mehrere Verse stehen Zeile für Zeile nebeneinander (rechts Arabisch, links Umschrift und Bedeutung) –
  // so bleibt die Schrift groß. Ein einzelner Text (center) steht untereinander in der Mitte.
  recitation(t, top, bottom, center = false) {
    const { ctx, W } = this;
    const rows = !center && t.ar.length > 1 && t.ar.length === t.de.length && (t.tr.length === 0 || t.tr.length === t.ar.length);
    if (rows) return this.recitationRows(t, top, bottom);
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

  recitationRows(t, top, bottom) {
    const { ctx, W } = this;
    const leftW = (W - 120) * 0.54, rightW = (W - 120) * 0.42;
    const layout = (s, draw) => {
      let y = top;
      t.ar.forEach((ar, i) => {
        ctx.font = `${50 * s}px ${AR}`;
        ctx.direction = 'rtl';
        const arLines = wrap(ctx, ar, rightW);
        ctx.direction = 'ltr';
        ctx.font = `italic ${27 * s}px ${UI}`;
        const trLines = t.tr[i] ? wrap(ctx, t.tr[i], leftW) : [];
        ctx.font = `${27 * s}px ${UI}`;
        const deLines = t.de[i] ? wrap(ctx, t.de[i], leftW) : [];
        const hL = (trLines.length + deLines.length) * 36 * s, hR = arLines.length * 78 * s;
        const h = Math.max(hL, hR);
        if (draw) {
          // feine Trennlinie zwischen den Versen
          if (i) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(60, y - 5 * s, W - 120, 2); }
          let ya = y + (h - hR) / 2;
          for (const l of arLines) { this.text(l, W - 60, ya + 52 * s, { size: 50 * s, font: AR, rtl: true, align: 'right' }); ya += 78 * s; }
          let yl = y + (h - hL) / 2;
          for (const l of trLines) { this.text(l, 60, yl + 27 * s, { size: 27 * s, color: C.gold, weight: 'italic' }); yl += 36 * s; }
          for (const l of deLines) { this.text(l, 60, yl + 27 * s, { size: 27 * s, color: C.text }); yl += 36 * s; }
        }
        y += h + 12 * s;
      });
      return y;
    };
    let s = 1;
    while (s > 0.55 && layout(s, false) > bottom) s -= 0.02;
    return layout(s, true);
  }

  v_menu(v) {
    const { W } = this;
    this.heading('NamazVR', t('ui.sub'));
    this.text(t('ui.choose'), 60, 146, { size: 28, color: C.muted });
    const gap = 16, w = (W - 120 - gap * 4) / 5, top = 170, h = 172;
    v.prayers.forEach((p, i) => {
      const x = 60 + i * (w + gap), cx = x + w / 2, now = p.id === v.times.current;
      const row = v.times.rows.find((r) => r.id === p.id);
      this.btn('', x, top, w, h, `prayer:${p.id}`, { active: now });
      this.text(p.name, cx, top + 50, { size: 38, weight: 700, align: 'center', color: now ? C.gold : C.text });
      if (!isRTL()) this.text(p.ar, cx, top + 104, { size: 42, font: AR, align: 'center', color: C.gold });
      this.text(`${row.time} · ${now ? t('ui.now') : t('ui.rakat', p.rakat)}`, cx, top + (isRTL() ? 110 : 148), { size: 23, color: now ? C.gold : C.muted, align: 'center' });
    });
    const n = v.times.next;
    this.text(t('ui.next', n.name, n.time, n.inText), 60, 392, { size: 30, weight: 600, color: C.gold });
    this.text(`${v.qibla} · ${v.calibrated ? t('ui.calibrated') : t('ui.notCalibrated')} · ${v.madhab}`, 60, 428, { size: 23, color: v.calibrated ? '#7fd1a8' : C.muted });
    // Vier Gruppen, jede mit Überschrift und einer Reihe Knöpfe
    menuGroups(v).forEach((g, gi) => {
      const y = 452 + gi * 124;
      this.text(g.label.toUpperCase(), 62, y + 22, { size: 20, weight: 600, color: C.muted });
      const bw = (W - 120 - 14 * (g.items.length - 1)) / g.items.length;
      g.items.forEach((it, i) => this.btn(`${it.icon} ${it.label}`, 60 + i * (bw + 14), y + 34, bw, 76, it.action, { primary: it.primary, active: it.active, size: 25 }));
    });
  }

  v_times(v) {
    const { W, H, ctx } = this;
    this.heading(t('ui.menuTimes'), t('ui.today', v.location));
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
      const tag = isCurrent ? t('ui.nowTap') : isNext ? t('ui.inTime', v.next.inText) : row.prayer ? '' : t('ui.noPrayer');
      if (tag) this.text(tag, W / 2, y + rowH / 2 + 2, { size: 26, color: isCurrent || isNext ? C.gold : C.muted, align: 'center', base: 'middle' });
    });
    const note = v.highLatitude ? t('ui.highLat') : t('ui.sunCalc');
    this.text(note, 60, 720, { size: 24, color: C.muted });
    const by = H - 140, bw = (W - 120 - 60) / 4;
    this.btn(t('ui.method'), 60, by, bw, 96, 'method', { size: 26, sub: v.method, subSize: 20 });
    this.btn(t('ui.asrCalc'), 60 + bw + 20, by, bw, 96, 'asr', { size: 26, sub: v.asr.split(' (')[0], subSize: 20 });
    this.btn(t('rem.btn'), 60 + 2 * (bw + 20), by, bw, 96, 'remind', { size: 26, primary: true });
    this.btn(t('ui.back'), 60 + 3 * (bw + 20), by, bw, 96, 'menu');
  }

  v_qibla(v) {
    const { W, H } = this;
    this.heading(t('ui.qiblaTitle'));
    let y = this.paragraphs([
      t('ui.qiblaHelp1'),
      t('ui.qiblaHelp2'),
    ], 160, { size: 28, color: C.muted, gap: 6 });
    this.text(t('ui.placeLine', v.locationName, Math.round(v.bearing)), 60, y + 24, { size: 32, weight: 600 });
    y += 60;
    const gap = 16, cols = 5, w = (W - 120 - gap * (cols - 1)) / cols, h = 74;
    v.cities.forEach((c, i) => {
      const x = 60 + (i % cols) * (w + gap), yy = y + Math.floor(i / cols) * (h + gap);
      this.btn(c.name, x, yy, w, h, `city:${i}`, { size: 28, active: c.name === v.location.name });
    });
    this.btn('📍 GPS', 60 + 4 * (w + gap), y + h + gap, w, h, 'gps', { size: 28, active: !!v.location.gps });
    y += 2 * (h + gap) + 20;
    this.text(v.calibrated ? t('ui.statusCal') : t('ui.statusNotCal'), 60, y + 20, { size: 28, color: v.calibrated ? '#7fd1a8' : C.muted });
    if (v.msg) this.paragraphs([v.msg], y + 62, { size: 26, color: C.gold, gap: 0 });
    // Qibla über Norden oder direkt über die Blickrichtung; in VR/Mixed Reality auch den Teppich hierher legen
    const by = H - 140;
    if (v.xr) this.btn(t('ui.placeHere'), 60, by - 112, 400, 92, 'placehere', { size: 28 });
    this.btn(t('ui.lookNorth'), 60, by, 400, 96, 'calibrate', { size: 28 });
    this.btn(t('ui.qiblaHere'), 480, by, 400, 96, 'qiblahere', { primary: true, size: 28 });
    this.btn(t('ui.reset'), 900, by, 220, 96, 'resetcal', { size: 28 });
    this.btn(t('ui.back'), 1140, by, W - 1200, 96, 'menu', { size: 28 });
  }

  v_step(v) {
    const { W, H } = this;
    const { step, prayer } = v;
    const unit = step.unit ? ` · ${step.unit}` : '';
    const status = step.rakah ? `${prayer.name}${unit} · ${t('ui.rakaOf', step.rakah, step.of || prayer.rakat)}` : `${prayer.name}${unit}`;
    this.heading(step.title, status);
    // Fortschritt
    const { ctx } = this;
    ctx.fillStyle = C.track;
    ctx.beginPath(); ctx.roundRect(60, 120, W - 120, 10, 5); ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.roundRect(60, 120, (W - 120) * (v.index + 1) / v.total, 10, 5); ctx.fill();

    this.movement(v, 150, 236);
    let y = 434;
    if (v.inner) y = this.paragraphs([`${v.kids ? '🧒' : '✦'}  ${v.inner}`], 429, { size: v.kids ? 29 : 27, color: v.kids ? C.text : C.gold, gap: 10 });
    y = this.paragraphs([step.instr], y, { size: 28, color: C.muted, gap: 10 });
    this.recitation(step, y, H - 150);

    const by = H - 120, bh = 90;
    this.btn(t('ui.prev'), 60, by, 200, bh, 'prev', { size: 30 });
    this.btn(t('ui.menu'), 280, by, 160, bh, 'menu', { size: 30 });
    this.btn(v.auto ? t('ui.autoOn') : t('ui.autoOff'), 460, by, 200, bh, 'auto', { active: v.auto, size: 30 });
    this.btn(`${v.voice ? '🔊' : '🔇'} ${t('ui.speak')}`, 680, by, 240, bh, 'speak', { active: v.voice, size: 28 });
    if (v.noVoice) this.text(v.canDownload ? t('voice.hintStep') : t('ui.noVoiceLang'), W - 60, by - 12, { size: 21, color: C.gold, align: 'right' });
    this.btn(v.index === v.total - 1 ? t('ui.done') : t('ui.nextStep'), 940, by, W - 1000, bh, 'next', { primary: true, size: 32 });
  }

  // Bewegungs-Box: Piktogramm, Ansage, Ausführung und – in VR – ob die Haltung erkannt wurde.
  movement(v, top, h) {
    const { ctx, W } = this;
    const step = v.step;
    const m = step.wudu
      ? { cue: step.cue, how: `${step.count}×${step.count > 1 && step.fard ? t('wudu.oneFard') : ''} · ${step.fard ? t('wudu.fard') : t('wudu.sunnah')}`, arrow: null }
      : step.story ? { cue: step.cue, how: step.where, arrow: null }
      : step.hajj ? { cue: step.cue, how: t(`hajj.where.${step.scene}`), arrow: null }
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
    else if (step.story) this.text(step.icon, 80 + (h - 20) / 2, top + h / 2 + 4, { size: Math.round(h * 0.55), align: 'center', base: 'middle', fixed: true });
    else drawPictogram(ctx, v.prevPose, step.pose, 80, top + 10, h - 20);
    const x = 80 + h + 10;
    this.text(m.cue, x, top + 62, { size: 46, weight: 700, color: m.arrow ? C.gold : C.text });
    ctx.font = `25px ${UI}`;
    let y = top + 106;
    for (const line of wrap(ctx, m.how, W - 60 - x - 20).slice(0, 3)) {
      this.text(line, x, y, { size: 25, color: C.muted });
      y += 33;
    }
    const status = {
      ok: [v.finger ? t('hands.finger') : t('ui.postureOk'), '#7fd1a8'],
      wait: [v.handHint ? t(`hands.${v.handHint}`) : t('ui.postureWait'), C.gold],
      off: [t('ui.postureOff'), C.muted],
      wudu: [t('wudu.stepOf', v.index + 1, v.total), C.muted],
      hajj: [step.status || '', C.gold],
    }[v.posture] || ['', C.muted];
    this.text(status[0], x, top + h - 22, { size: 26, weight: v.posture === 'off' ? '' : 600, color: status[1] });
  }

  v_done(v) {
    const { W, H } = this;
    if (v.story) {
      // Geschichte zu Ende: Lehre und Frage „Was lernen wir?“
      const q = v.story.q;
      this.heading(`${v.story.icon} ${t('story.done')}`, v.prayer.name);
      let y = this.paragraphs([`✦  ${v.story.lesson}`], 150, { size: 29, color: C.gold, gap: 10 });
      this.text(q.q, 60, y + 30, { size: 32, weight: 700 });
      q.options.forEach((o, i) => {
        const ok = q.answer != null && i === q.correct, bad = q.answer === i && i !== q.correct;
        this.btn(`${ok ? '✓ ' : bad ? '✗ ' : ''}${o}`, 60, y + 60 + i * 92, W - 120, 80, q.answer == null ? `sans:${i}` : 'noop', { size: 28, primary: ok, active: bad });
      });
      y += 60 + 3 * 92 + 20;
      if (q.answer != null) this.paragraphs([q.answer === q.correct ? (q.star ? t('story.rightStar', v.stars) : t('story.right')) : t('story.wrong')], y, { size: 28, color: q.answer === q.correct ? '#7fd1a8' : C.gold, gap: 0 });
      const by = H - 120, gap = 20, w = (W - 120 - 3 * gap) / 4;
      this.btn(t('story.listen'), 60, by, w, 90, 'storylesson', { size: 26 });
      this.btn(t('ui.again'), 60 + w + gap, by, w, 90, 'again', { size: 26 });
      this.btn(t('story.more'), 60 + 2 * (w + gap), by, w, 90, 'stories', { primary: true, size: 26 });
      this.btn(t('sky.menu'), 60 + 3 * (w + gap), by, w, 90, 'sky', { size: 26 });
      return;
    }
    if (v.prayer.kind === 'cem' || v.prayer.kind === 'semah') {
      this.heading(t(`alevi.done.${v.prayer.kind}`), v.prayer.name);
      this.paragraphs(t('alevi.doneText'), 250, { size: 32, gap: 20 });
      const by = H - 140, gap = 20, w = (W - 120 - 2 * gap) / 3;
      this.btn(t('ui.again'), 60, by, w, 96, 'again');
      this.btn(t('alevi.title'), 60 + w + gap, by, w, 96, 'alevi', { primary: true });
      this.btn(t('ui.menu'), 60 + 2 * (w + gap), by, w, 96, 'menu');
      return;
    }
    if (v.prayer.kind === 'umre' || v.prayer.kind === 'hajj') {
      this.heading(t(`hajj.done.${v.prayer.kind}`), v.prayer.name);
      this.text('تَقَبَّلَ اللَّهُ مِنَّا وَمِنكُم', W / 2, 290, { size: 64, font: AR, align: 'center', rtl: true, color: C.gold });
      this.paragraphs(t('hajj.doneText'), 380, { size: 30, gap: 18 });
      const by = H - 140, gap = 20, w = (W - 120 - gap) / 2;
      this.btn(t('ui.again'), 60, by, w, 96, 'again');
      this.btn(t('ui.menu'), 60 + w + gap, by, w, 96, 'menu', { primary: true });
      return;
    }
    if (v.prayer.kind === 'wudu') {
      const vr = v.prayer.variant;
      this.heading(vr ? t(`pure.${vr}.done`) : t('ui.wuduDone'), t('ui.wuduSub'));
      this.paragraphs([vr ? t(`pure.${vr}.well`) : t('ui.wuduWell'), t('ui.wuduBreak')], 200, { size: 32, gap: 26 });
      const by = H - 140, gap = 20, w = (W - 120 - gap) / 2;
      this.btn(t('ui.prayNow'), 60, by, w, 96, 'menu', { primary: true });
      this.btn(t('ui.practiceAgain'), 60 + w + gap, by, w, 96, 'again');
      return;
    }
    this.heading(t('ui.prayerDone'), v.prayer.name);
    this.recitation(taqabbal(), 230, 560, true);
    this.paragraphs([t('ui.afterPrayer')], 620, { size: 28, color: C.muted });
    if (v.kids) this.text(t('ui.kidsStars', v.stars), W / 2, 740, { size: 34, weight: 700, color: C.gold, align: 'center' });
    const by = H - 140, gap = 20, w = (W - 120 - 2 * gap) / 3;
    this.btn(t('ui.tasbihCount'), 60, by, w, 96, 'tasbih', { primary: true });
    this.btn(t('ui.prayAgain'), 60 + w + gap, by, w, 96, 'again');
    this.btn(t('ui.menu'), 60 + 2 * (w + gap), by, w, 96, 'menu');
  }

  // Suren lernen: Auswahl
  v_suras(v) {
    const { W, H } = this;
    this.heading(t('ui.surasTitle'));
    this.text(t('ui.surasSub'), 60, 160, { size: 28, color: C.muted });
    const gap = 16, cols = 3, w = (W - 120 - gap * (cols - 1)) / cols;
    v.suras.forEach((s, i) => {
      const x = 60 + (i % cols) * (w + gap), y = 190 + Math.floor(i / cols) * 128;
      const name = `${s.call ? '📣 ' : ''}${s.name}${s.learned ? '  ✓' : ''}${s.inPrayer ? '  ★' : ''}`;
      // Unterzeile kürzen, damit sie in den Knopf passt
      this.ctx.font = `19px ${UI}`;
      let sub = s.about;
      while (sub.length > 8 && this.ctx.measureText(sub).width > w - 24) sub = `${sub.slice(0, -2).trimEnd()}…`;
      this.btn(name, x, y, w, 114, `sura:${s.id}`, { size: 31, sub, subSize: 19, active: s.learned });
    });
    this.btn(t('ui.back'), 60, H - 140, W - 120, 96, 'menu');
  }

  // Eine Zeile je Vers: Arabisch rechts, nummerierte Umschrift links; Schrift schrumpft, bis die Zeile passt.
  verseRows(verses, top, bottom) {
    const { ctx, W } = this;
    const rowH = Math.min(110, (bottom - top) / verses.length);
    const fit = (str, font, size, maxW, min) => {
      ctx.font = `${size}px ${font}`;
      while (size > min && ctx.measureText(str).width > maxW) { size -= 2; ctx.font = `${size}px ${font}`; }
      return size;
    };
    verses.forEach((x, i) => {
      const y = top + i * rowH + rowH / 2, hasTr = !!x.tr;
      ctx.direction = 'rtl';
      const as = fit(x.ar, AR, Math.min(48, rowH * 0.55), hasTr ? W / 2 - 40 : W - 120, 20);
      ctx.direction = 'ltr';
      this.text(x.ar, hasTr ? W - 60 : W / 2, y + as * 0.3, { size: as, font: AR, rtl: true, align: hasTr ? 'right' : 'center' });
      if (hasTr) {
        const label = `${i + 1}.  ${x.tr}`, maxW = W / 2 - 100;
        const ts = fit(label, UI, Math.min(27, rowH * 0.3), maxW, 22);
        // Zu lang für eine Zeile: auf zwei Zeilen umbrechen
        const lines = ctx.measureText(label).width > maxW ? wrap(ctx, label, maxW).slice(0, 2) : [label];
        lines.forEach((l, k) => this.text(l, 60, y + ts * 0.35 + (k - (lines.length - 1) / 2) * ts * 1.2, { size: ts, color: C.gold, weight: 'italic' }));
      }
      if (i < verses.length - 1) {
        ctx.fillStyle = 'rgba(201,168,92,0.18)';
        ctx.fillRect(60, top + (i + 1) * rowH, W - 120, 2);
      }
    });
  }

  // Suren lernen: eine Sure lesen, Vers für Vers üben oder sich abfragen
  v_sura(v) {
    const { W, H } = this;
    const n = v.verses.length, cur = v.verses[v.v];
    this.heading(v.name, v.mode === 'read' ? `${v.n ? `${v.n} · ` : ''}${t('ui.verses', n)}` : t('ui.verseOf', v.v + 1, n));
    [['read', t('ui.modeRead')], ['verse', t('ui.modeVerse')], ['test', t('ui.modeTest')]].forEach(([m, label], i) => {
      this.btn(label, 60 + i * 250, 125, 240, 64, `smode:${m}`, { size: 26, active: v.mode === m });
    });
    if (v.id !== 'fatiha' && !v.call) this.btn(v.inPrayer ? t('ui.inPrayer') : t('ui.usePrayer'), W - 60 - 320, 125, 320, 64, 'sprayer', { size: 26, active: v.inPrayer });
    const top = 225, bottom = H - 175;
    if (v.mode === 'read') {
      this.verseRows(v.verses, top, bottom);
    } else if (v.mode === 'test' && !v.reveal) {
      // Nur das erste Wort als Hilfe, dazu die Bedeutung
      const first = cur.ar.split(' ')[0];
      this.text(`${first} …`, W / 2, top + 110, { size: 72, font: AR, align: 'center', rtl: true, color: C.gold });
      this.paragraphs([cur.de, t('ui.testHint')].filter(Boolean), top + 200, { size: 30, color: C.muted });
    } else {
      this.recitation({ ar: [cur.ar], tr: [cur.tr].filter(Boolean), de: [cur.de].filter(Boolean) }, top + 30, bottom, true);
    }
    if (v.msg) this.text(v.msg, W / 2, H - 160, { size: 22, color: C.gold, align: 'center' });
    const by = H - 140, gap = 16, w = (W - 120 - 4 * gap) / 5;
    const x = (i) => 60 + i * (w + gap);
    if (v.mode !== 'read') {
      this.btn('←', x(0), by, w, 96, 'sprev', { size: 44 });
      // Abfragen: erst aufdecken, dann weiter zum nächsten Vers
      if (v.mode === 'test' && !v.reveal) this.btn(t('ui.reveal'), x(1), by, w, 96, 'sreveal', { primary: true, size: 28 });
      else this.btn('→', x(1), by, w, 96, 'snext', { size: 44, primary: true });
    }
    this.btn(t('ui.listen'), x(2), by, w, 96, 'sspeak', { size: 28 });
    this.btn(v.learned ? t('ui.isLearned') : t('ui.markLearned'), x(3), by, w, 96, 'slearned', { size: 26, active: v.learned });
    this.btn(t('ui.back'), x(4), by, w, 96, 'suras', { size: 28 });
  }

  // Frieden & gutes Herz: ein Vers bzw. Hadith mit arabischem Original, Übersetzung und Quelle
  v_peace(v) {
    const { W, H } = this;
    this.heading(t('ui.peaceTitle'), `${v.index + 1} / ${v.total}`);
    const y = this.paragraphs([t('peace.intro')], 150, { size: 24, color: C.muted, gap: 0 });
    const end = this.recitation({ ar: [v.item.ar], tr: [], de: [v.item.text].filter(Boolean) }, y + 30, H - 240, true);
    this.text(v.item.source, W / 2, end + 24, { size: 28, color: C.gold, align: 'center', weight: 600 });
    const by = H - 140, gap = 16, w = (W - 120 - 4 * gap) / 5;
    this.btn('←', 60, by, w, 96, 'peaceprev', { size: 44 });
    this.btn('→', 60 + (w + gap), by, w, 96, 'peacenext', { size: 44, primary: true });
    this.btn(t('duas.btn'), 60 + 2 * (w + gap), by, w, 96, 'duas', { size: 28, primary: true });
    this.btn(t('ui.calm'), 60 + 3 * (w + gap), by, w, 96, 'calm', { size: 26 });
    this.btn(t('ui.menuTasbih').replace(/^[^\p{L}]+/u, ''), 60 + 4 * (w + gap), by - 110, w, 96, 'tasbih', { size: 26 });
    this.btn(t('ui.menu'), 60 + 4 * (w + gap), by, w, 96, 'menu', { size: 28 });
  }

  // Duas für sich, die Familie und die Menschen, die man liebt
  v_duas(v) {
    const { W, H } = this;
    this.heading(t('duas.title'), `${t(`duas.cats.${v.cat}`)} · ${v.index + 1} / ${v.total}`);
    // Bereiche in zwei Reihen
    const per = Math.ceil(v.cats.length / 2), gap = 12, w = (W - 120 - gap * (per - 1)) / per;
    v.cats.forEach((c, i) => this.btn(t(`duas.cats.${c}`), 60 + (i % per) * (w + gap), 122 + Math.floor(i / per) * 68, w, 60, `duacat:${c}`, { size: 25, active: c === v.cat }));
    let y = 262;
    if (v.cat === 'protect' && v.index === 0) y = this.paragraphs([t('duas.nazarNote')], 272, { size: 21, color: C.muted, gap: 0 }) - 10;
    this.text(v.dua.when, W / 2, y + 24, { size: 26, weight: 600, color: C.gold, align: 'center' });
    const end = this.recitation({ ar: [v.dua.ar], tr: [v.dua.translit].filter(Boolean), de: [v.dua.mean].filter(Boolean) }, y + 50, H - 200, true);
    this.text(v.dua.source, W / 2, Math.min(end + 22, H - 160), { size: 24, color: C.muted, align: 'center', weight: 600 });
    const by = H - 128, bw = (W - 120 - 4 * 16) / 5, x = (i) => 60 + i * (bw + 16);
    this.btn('←', x(0), by, bw, 96, 'duaprev', { size: 44 });
    this.btn('→', x(1), by, bw, 96, 'duanext', { size: 44, primary: true });
    this.btn(t('ui.listen'), x(2), by, bw, 96, 'duaspeak', { size: 28 });
    this.btn(t('ui.menuPeace'), x(3), by, bw, 96, 'peace', { size: 24 });
    this.btn(t('ui.menu'), x(4), by, bw, 96, 'menu', { size: 28 });
    if (v.msg) this.text(v.msg, W / 2, by - 14, { size: 21, color: C.gold, align: 'center' });
  }

  // Ruhig werden: Schritte gegen die Wut, dazu Atemzüge mit der Kugel
  v_calm(v) {
    const { W, H, ctx } = this;
    this.heading(t('ui.calm'), v.finished ? '' : t('ui.breathCount', Math.min(v.count + 1, v.total), v.total));
    this.paragraphs(t('peace.calm').map((s, i) => `${i + 1}.  ${s}`), 160, { size: 27, gap: 10 });
    const msg = v.finished ? t('peace.calmDone') : v.breathPhase === 'in' ? t('ui.inhale') : t('ui.calmOut');
    this.paragraphs([msg], 640, { size: 36, color: v.finished ? C.gold : v.breathPhase === 'in' ? C.muted : '#7fd1a8', gap: 0 });
    ctx.fillStyle = C.track;
    ctx.beginPath(); ctx.roundRect(60, 760, W - 120, 12, 6); ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.roundRect(60, 760, (W - 120) * Math.min(1, v.count / v.total), 12, 6); ctx.fill();
    const by = H - 140, gap = 20, w = (W - 120 - 2 * gap) / 3;
    this.btn(t('ui.again'), 60, by, w, 96, 'calm', { primary: v.finished });
    this.btn(t('ui.menuPeace'), 60 + w + gap, by, w, 96, 'peace');
    this.btn(t('ui.menu'), 60 + 2 * (w + gap), by, w, 96, 'menu');
  }

  v_tasbih(v) {
    const { W, H, ctx } = this;
    this.heading(t('ui.tasbih'), v.finished ? t('ui.finished') : t('ui.round', v.phase + 1, v.phases));
    if (v.finished) {
      this.recitation(taqabbal(), 250, 600, true);
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
      this.text(inhale ? t('ui.inhale') : t('ui.exhale', v.tr || v.ar), W / 2, 690, { size: 36, weight: 600, color: inhale ? C.muted : '#7fd1a8', align: 'center' });
      this.text(t('ui.followOrb'), W / 2, 735, { size: 24, color: C.muted, align: 'center' });
    }
    const by = H - 160;
    this.btn(v.finished ? t('ui.again') : t('ui.countPlus'), 60, by, 600, 116, v.finished ? 'tasbihreset' : 'count', { primary: true, size: 40 });
    this.btn(v.breath ? t('ui.breathOn') : t('ui.breathOff'), 680, by, 260, 116, 'breath', { active: v.breath });
    this.btn(t('ui.fresh'), 960, by, 180, 116, 'tasbihreset');
    this.btn(t('ui.menu'), 1160, by, W - 1220, 116, 'menu');
  }

  v_more(v) {
    const { W, H } = this;
    this.heading(v.title || t('ui.menuMore'), v.madhab);
    const gap = 20, w = (W - 120 - gap) / 2, rows = Math.ceil(v.prayers.length / 2), h = Math.min(112, Math.floor((H - 350) / rows) - 10);
    v.prayers.forEach((p, i) => {
      const x = 60 + (i % 2) * (w + gap), y = 130 + Math.floor(i / 2) * (h + 10);
      this.btn(p.name, x, y, w, h, `prayer:${p.id}`, { size: h < 100 ? 30 : 34, sub: p.rakat ? `${t('ui.rakat', p.rakat)} · ${p.de}` : p.de, subSize: h < 100 ? 20 : 24 });
    });
    const note = v.note || t('ui.moreNote');
    this.paragraphs([note], note.length > 220 ? H - 232 : H - 200, { size: note.length > 220 ? 20 : 24, color: C.muted, gap: 0 });
    this.btn(t('ui.back'), 60, H - 140, W - 120, 96, 'menu');
  }

  // Beschriftung auf der einen, Schalter auf der anderen Seite (in Arabisch gespiegelt)
  switchRow(y, label, sub, buttons, h = 70) {
    const { W } = this;
    this.text(label, 60, y + 30, { size: 28, weight: 600 });
    if (sub) this.text(sub, 60, y + 60, { size: 22, color: C.muted });
    buttons.forEach(([text, action, active], i) => {
      const x = isRTL() ? 60 + i * 250 : W - 60 - (buttons.length - i) * 250 + 10;
      this.btn(text, x, y + (70 - h) / 2, 240, h, action, { active, ...(h < 70 ? { size: 26 } : {}) });
    });
  }

  v_settings(v) {
    const { W, H } = this;
    this.heading(t('ui.settings'));
    const gap = 20, w = (W - 120 - gap * 3) / 4;
    this.text(t('ui.language'), 60, 150, { size: 28, weight: 600 });
    // Sprachen in zwei Reihen (es sind viele)
    const per = Math.ceil(v.langs.length / 2), lw = (W - 120 - 10 * (per - 1)) / per;
    v.langs.forEach((l, i) => this.btn(l.name, 60 + (i % per) * (lw + 10), 160 + Math.floor(i / per) * 58, lw, 50, `lang:${l.id}`, { active: l.id === v.lang, size: 22 }));
    this.text(t('ui.madhab'), 60, 305, { size: 28, weight: 600 });
    v.madhabs.forEach((m, i) => this.btn(m.name, 60 + i * (w + gap), 318, w, 60, `madhab:${m.id}`, { active: m.id === v.madhab.id }));
    this.text(t('ui.changes', v.madhab.name), 60, 412, { size: 26, color: C.gold, weight: 600 });
    this.paragraphs(v.madhab.notes.map((n) => `•  ${n}`), 444, { size: 22, gap: 0 });
    const row = (y, l, sub, b) => this.switchRow(y, l, sub, b, 56);
    row(632, t('ui.guideFor'), '', [[t('ui.men'), 'gender:m', v.gender !== 'f'], [t('ui.women'), 'gender:f', v.gender === 'f']]);
    row(696, t('ui.beginner'), t('ui.beginnerSub'), [[v.beginner ? t('ui.on') : t('ui.off'), 'beginner', v.beginner]]);
    row(760, t('ui.spiritual'), t('ui.spiritualSub'), [[v.spiritual ? t('ui.on') : t('ui.off'), 'spiritual', v.spiritual]]);
    row(824, t('comfort.calm'), t('comfort.calmSub'), [[v.calm ? t('ui.on') : t('ui.off'), 'calmmode', v.calm]]);
    const q = (W - 120 - 70) / 6, x = (i) => 60 + i * (q + 14);
    this.btn(t('voice.btn'), x(0), H - 98, q, 80, 'voice', { primary: true, size: 26 });
    this.btn(t('rem.btn'), x(1), H - 98, q, 80, 'remind', { primary: true, size: 26 });
    this.btn(t('gfx.btn'), x(2), H - 98, q, 80, 'gfx', { size: 24, active: v.gfxHigh, sub: v.gfxHigh ? t('gfx.high') : t('gfx.normal'), subSize: 19 });
    this.btn(t('gfx.facesShort'), x(3), H - 98, q, 80, 'faces', { size: 24, active: v.faces, sub: v.faces ? t('ui.on') : t('ui.off'), subSize: 19 });
    this.btn(t('ui.info'), x(4), H - 98, q, 80, 'info', { size: 26 });
    this.btn(t('ui.back'), x(5), H - 98, q, 80, 'menu', { size: 26 });
  }

  v_mosque(v) {
    const { W, H } = this;
    this.heading(t('ui.mosqueTitle'), t('ui.mosqueSub'));
    v.styles.forEach((st, i) => {
      this.btn(st.name, 60, 122 + i * 84, W - 120, 82, `style:${st.id}`, { size: 28, sub: st.de, subSize: 18, active: st.id === v.style });
    });
    this.paragraphs([t('ui.mosqueNote')], 562, { size: 20, color: C.muted, gap: 0 });
    // Cemaat: Gemeinschaftsgebet mit Imam
    const row = (...a) => this.switchRow(...a);
    row(592, t('ui.cemaat'), t('ui.cemaatTip'), [[v.cemaat ? t('ui.on') : t('ui.off'), 'cemaat', v.cemaat]]);
    row(667, t('ui.cemaatSize'), '', [[t('ui.small'), 'csize:small', v.size !== 'large'], [t('ui.large'), 'csize:large', v.size === 'large']]);
    row(742, t('ui.takt'), t('ui.taktSub'), [[t('ui.natural'), 'ctakt:natural', v.natural], [t('ui.sync'), 'ctakt:sync', !v.natural]]);
    row(817, t('gal.title'), t('gal.sub'), [[t('gal.screen'), 'women:screen', v.womenPlace !== 'gallery'], [t('gal.gallery'), 'women:gallery', v.womenPlace === 'gallery']]);
    this.btn(t('ui.back'), 60, H - 98, W - 120, 80, 'menu');
  }

  // Heilige Tage und Nächte: Liste (zwei Spalten) oder ein Tag mit Erklärung, Gebeten und Bittgebeten
  v_holy(v) {
    const { W, H } = this, d = v.detail, gap = 20, half = (W - 120 - gap) / 2;
    if (d) {
      this.heading(`${d.icon} ${d.name}`, d.hijriText);
      this.text(`${d.dateText} · ${d.when}`, 60, 160, { size: 27, weight: 600, color: C.gold });
      if (d.dua) this.recitation(d.dua, 190, 640, true);
      else {
        let y = this.paragraphs([v.kids ? d.kidsText : [].concat(d.about)[0]], 205, { size: 23, gap: 8 });
        this.text(t('holy.doTitle'), 60, y + 8, { size: 25, weight: 700, color: C.gold });
        y = this.paragraphs([].concat(d.todo).map((x) => `• ${x}`), y + 42, { size: 22, gap: 2 });
        if (d.note && y < 600) this.paragraphs([d.note], y + 6, { size: 20, color: C.muted, gap: 0 });
      }
      const row = (items, y) => {
        const n = Math.max(1, items.length), w = (W - 120 - 14 * (n - 1)) / n;
        items.forEach((it, i) => this.btn(it.label, 60 + i * (w + 14), y, w, 70, it.action, { size: 24, active: it.active }));
      };
      row(d.acts, 660);
      if (d.duas.length) row(d.duas.map((x) => ({ label: `🔊 ${x.label}`, action: `hdua:${x.key}`, active: x.key === d.duaKey })), 745);
      this.btn(t('ui.back'), 60, H - 120, W - 120, 88, 'holy');
      return;
    }
    this.heading(t('holy.title'), t('holy.sub'));
    v.list.forEach((e, i) => {
      const x = 60 + (i % 2) * (half + gap), y = 122 + Math.floor(i / 2) * 92;
      this.btn(`${e.icon} ${e.name}`, x, y, half, 84, `holy:${e.id}`, { size: 27, sub: `${e.dateText} · ${e.when}`, subSize: 19, active: e.days <= 0 });
    });
    this.paragraphs([t('holy.sighting')], 690, { size: 19, color: C.muted, gap: 0 });
    this.switchRow(730, t('holy.remind'), t('holy.remindSub'), [[v.remindOn ? t('ui.on') : t('ui.off'), 'remind', v.remindOn]]);
    if (v.msg) this.text(v.msg, 60, 832, { size: 22, color: C.gold });
    const third = (W - 120 - 2 * gap) / 3;
    this.btn(t('holy.cal'), 60, H - 120, third, 88, 'holycal', { primary: true, size: 24 });
    this.btn(`🕌 ${t('cuma.menu')}`, 60 + third + gap, H - 120, third, 88, 'cuma', { size: 26 });
    this.btn(t('ui.menu'), 60 + 2 * (third + gap), H - 120, third, 88, 'menu');
  }

  // Eltern-Übersicht: je Familienmitglied eine Spalte mit Zahlen und den nächsten Schritten
  v_parents(v) {
    const { W, H, ctx } = this;
    this.heading(t('par.title'), t('par.sub'));
    const n = Math.max(1, v.list.length), gap = 20, w = (W - 120 - gap * (n - 1)) / n;
    v.list.forEach((r, i) => {
      const x = 60 + i * (w + gap), y = 130;
      ctx.beginPath(); ctx.roundRect(x, y, w, H - 270, 20); ctx.fillStyle = C.btn; ctx.fill();
      const tx = isRTL() ? x + w - 24 : x + 24, al = isRTL() ? 'right' : 'left';
      this.text(`${r.icon} ${r.name}${r.kids ? ' 🧒' : ''}`, tx, y + 48, { size: 32, weight: 700, color: C.gold, align: al });
      const lines = [
        `${t('par.days')}: ${r.days7}/7`,
        `${t('par.prayers')}: ${r.prayersN}/${r.prayersOf}`,
        `${t('par.suras')}: ${r.suras.length}/${r.surasOf}`,
        `${t('par.quiz')}: ${r.quizRuns ? `${r.quizBest}/10` : '–'}`,
        `💧 ${t('par.wash', r.wudu, r.ghusl, r.tayammum)}`,
        `⭐ ${r.stars}  ·  ✅ ${t('par.tracked', r.tracked)}`,
      ];
      lines.forEach((l, k) => this.text(l, tx, y + 100 + k * 38, { size: 24, align: al }));
      this.text(t('par.next'), tx, y + 345, { size: 24, weight: 600, color: C.gold, align: al });
      let yy = y + 380;
      ctx.font = `21px ${UI}`;
      for (const tip of r.tips.length ? r.tips : [t('par.allGood')]) {
        for (const line of wrap(ctx, `• ${tip}`, w - 48).slice(0, 3)) { if (yy > H - 160) break; this.text(line, tx, yy, { size: 21, color: C.muted, align: al }); yy += 28; }
        yy += 8;
      }
    });
    const by = H - 120, bw = (W - 120 - gap * 3) / 4;
    this.btn(t('par.profiles'), 60, by, bw, 90, 'profiles', { size: 26 });
    this.btn(`📄 ${t('cert.menu')}`, 60 + (bw + gap), by, bw, 90, 'certs', { size: 26 });
    this.btn(`🎓 ${t('hoca.menu')}`, 60 + 2 * (bw + gap), by, bw, 90, 'hoca', { size: 26 });
    this.btn(t('ui.back'), 60 + 3 * (bw + gap), by, bw, 90, 'menu', { size: 26 });
  }

  v_learn(v) {
    const { W, H, ctx } = this;
    this.heading(t('ui.learnTitle'));
    const p = v.progress;
    const stats = [
      [`${v.totalPrayers}`, t('ui.statPrayers')],
      [`${p.wudu}`, t('ui.statWudu')],
      [`${v.streak}`, t('ui.statStreak')],
      [`${p.quizBest}/10`, t('ui.statQuiz')],
    ];
    const gap = 20, w = (W - 120 - gap * 3) / 4;
    stats.forEach(([num, label], i) => {
      const x = 60 + i * (w + gap);
      ctx.beginPath(); ctx.roundRect(x, 140, w, 150, 20); ctx.fillStyle = C.btn; ctx.fill();
      this.text(num, x + w / 2, 225, { size: 64, weight: 700, color: C.gold, align: 'center' });
      this.text(label, x + w / 2, 268, { size: 24, color: C.muted, align: 'center' });
    });
    this.text(t('ui.badges'), 60, 350, { size: 32, weight: 600 });
    const bw = (W - 120 - gap * 2) / 3;
    v.badges.forEach((b, i) => {
      const x = 60 + (i % 3) * (bw + gap), y = 372 + Math.floor(i / 3) * 78;
      ctx.beginPath(); ctx.roundRect(x, y, bw, 66, 16);
      ctx.fillStyle = b.ok ? C.active : 'rgba(29,43,69,0.5)'; ctx.fill();
      this.text(`${b.ok ? '★' : '☆'}  ${b.name}`, isRTL() ? x + bw - 24 : x + 24, y + 34, { size: 26, color: b.ok ? C.text : C.muted, base: 'middle', weight: b.ok ? 600 : '', align: isRTL() ? 'right' : 'left', fixed: true, rtl: isRTL() });
    });
    this.text(t('ui.quizTeaser'), 60, 718, { size: 26, color: C.muted });
    const by = H - 140, bw2 = (W - 120 - gap) / 2;
    this.btn(t('ui.quizStart'), 60, by - 120, W - 120, 100, 'quiz', { primary: true, size: 38 });
    this.btn(t('ui.resetProgress'), 60, by, bw2, 96, 'resetprogress', { size: 28 });
    this.btn(t('ui.back'), 60 + bw2 + gap, by, bw2, 96, 'menu');
  }

  v_quiz(v) {
    const { W, H, ctx } = this;
    const z = v.quiz;
    if (z.i >= z.questions.length) {
      this.heading(t('ui.quizDone'));
      this.text(t('ui.scoreOf', z.score, z.questions.length), W / 2, 360, { size: 120, weight: 700, color: C.gold, align: 'center' });
      const msg = z.score === z.questions.length ? t('ui.perfect') : z.score >= 7 ? t('ui.good') : t('ui.keepGoing');
      this.text(msg, W / 2, 450, { size: 36, align: 'center' });
      this.text(t('ui.best', v.progress.quizBest), W / 2, 510, { size: 28, color: C.muted, align: 'center' });
      const by = H - 140, gap = 20, w = (W - 120 - gap) / 2;
      this.btn(t('ui.again'), 60, by, w, 96, 'quiz', { primary: true });
      this.btn(t('ui.back'), 60 + w + gap, by, w, 96, 'learn');
      return;
    }
    const q = z.questions[z.i];
    this.heading(t('ui.question', z.i + 1, z.questions.length), t('ui.correctCount', z.score));
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
      this.text(right ? t('ui.right') : t('ui.wrong'), 60, H - 165, { size: 30, weight: 600, color: right ? '#7fd1a8' : '#e8908a' });
      this.btn(z.i === z.questions.length - 1 ? t('ui.result') : t('ui.nextQuestion'), W - 480, H - 140, 420, 96, 'quiznext', { primary: true });
    }
    this.btn(t('ui.cancel'), 60, H - 140, 300, 96, 'learn');
  }

  // Freie Stimmen: laden, probehören, löschen
  v_voice(v) {
    const { W, H, ctx } = this;
    this.heading(t('voice.title'), t('voice.sub'));
    let y = this.paragraphs(v.supported ? t('voice.intro') : [t('voice.unsupported')], 160, { size: 24, color: C.muted, gap: 4 });
    this.switchRow(y, t('voice.use'), t('voice.useSub'), [[v.enabled ? t('ui.on') : t('ui.off'), 'piper', v.enabled]]);
    y += 100;
    for (const x of v.voices) {
      ctx.beginPath(); ctx.roundRect(60, y, W - 120, 118, 18);
      ctx.fillStyle = x.id === v.lang ? 'rgba(122,95,34,0.35)' : 'rgba(29,43,69,0.6)'; ctx.fill();
      this.text(`${x.langName} – ${x.name}`, 90, y + 44, { size: 30, weight: 600 });
      const status = x.status === 'ready' ? t('voice.ready') : x.status === 'loading' ? t('voice.loading', Math.round(x.progress * 100))
        : x.status === 'error' ? t('voice.error') : t('voice.size', x.mb);
      this.text(`${status} · ${x.license ? t('voice.license', x.license) : t('voice.licenseCard')}`, 90, y + 88, { size: 22, color: x.status === 'error' ? '#e8908a' : C.muted });
      const b = (label, action, i, opt) => this.btn(label, isRTL() ? 80 + i * 210 : W - 80 - (i + 1) * 210 + 10, y + 19, 200, 80, action, { size: 26, ...opt });
      if (x.status === 'ready') { b(t('voice.del'), `vdel:${x.id}`, 0); b(t('voice.test'), `vtest:${x.id}`, 1, { primary: true }); }
      else if (x.status === 'loading') b(`${Math.round(x.progress * 100)} %`, 'noop', 0, { active: true });
      else if (v.supported) b(x.status === 'error' ? t('voice.retry') : t('voice.load'), `vload:${x.id}`, 0, { primary: true });
      y += 134;
    }
    this.paragraphs([t('voice.note')], y + 10, { size: 21, color: C.muted, gap: 0 });
    this.btn(t('ui.back'), 60, H - 98, W - 120, 80, 'settings');
  }

  // Gebets-Tracker: heute (oder ein Tag davor) abhaken, darunter die Woche
  v_tracker(v) {
    const { W, H, ctx } = this;
    const dayName = v.back === 0 ? t('track.today') : v.back === 1 ? t('track.yesterday') : `${v.day.label} ${v.day.date}`;
    this.heading(t('track.title'), dayName);
    const gap = 20, w = (W - 120 - gap * 4) / 5;
    v.prayers.forEach((p, i) => {
      this.btn(`${p.ok ? '✓ ' : ''}${p.name}`, 60 + i * (w + gap), 140, w, 150, `track:${p.id}`, { size: 34, sub: isRTL() ? '' : p.ar, subFont: AR, subSize: 40, primary: p.ok });
    });
    const n = v.prayers.filter((p) => p.ok).length;
    this.text(v.dayDone ? t('track.allDone') : t('track.count', n), W / 2, 345, { size: 32, weight: 600, color: v.dayDone ? '#7fd1a8' : C.gold, align: 'center' });
    // Woche: eine Spalte je Tag, ein Punkt je Gebet
    const cw = (W - 120) / v.week.length;
    v.week.forEach((d, k) => {
      const x = isRTL() ? W - 60 - (k + 1) * cw : 60 + k * cw, cx = x + cw / 2;
      if (d.back === v.back) { ctx.beginPath(); ctx.roundRect(x + 6, 380, cw - 12, 330, 16); ctx.fillStyle = 'rgba(122,95,34,0.35)'; ctx.fill(); }
      this.text(d.label, cx, 418, { size: 26, weight: 600, align: 'center', fixed: true, color: d.back === 0 ? C.gold : C.text });
      this.text(d.date, cx, 450, { size: 20, color: C.muted, align: 'center', fixed: true });
      v.prayers.forEach((p, i) => {
        ctx.beginPath(); ctx.arc(cx, 488 + i * 40, 13, 0, Math.PI * 2);
        if (d.prayed.includes(p.id)) { ctx.fillStyle = C.gold; ctx.fill(); } else { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(201,168,92,0.45)'; ctx.stroke(); }
      });
      if (d.done) this.text('★', cx, 700, { size: 30, color: C.gold, align: 'center', fixed: true });
    });
    this.text(t('track.streak', v.streak), 60, 760, { size: 28, weight: 600, color: v.streak ? '#7fd1a8' : C.muted });
    this.text(v.kids ? t('track.kids') : t('track.auto'), 60, 800, { size: 22, color: C.muted });
    const by = H - 140, bw = (W - 120 - 2 * gap) / 3;
    this.btn(t('track.older'), 60, by, bw, 96, v.back < v.maxBack ? 'trackback' : 'noop', { size: 28 });
    this.btn(t('track.newer'), 60 + bw + gap, by, bw, 96, v.back > 0 ? 'trackfwd' : 'noop', { size: 28 });
    this.btn(t('ui.menu'), 60 + 2 * (bw + gap), by, bw, 96, 'menu');
  }

  // Ramadan: Countdown bzw. Fastentag mit Sahur- und Iftar-Zeit, dazu zwei Bittgebete
  v_ramadan(v) {
    const { W, H } = this;
    this.heading(t('ram.title'), v.hijriToday);
    let y;
    if (v.inRamadan) {
      this.text(t('ram.day', v.day, v.length), W / 2, 230, { size: 72, weight: 700, color: C.gold, align: 'center' });
      const line = (label, x, yy) => this.text(`${label}: ${x.time}${x.past ? '' : ` · ${t('ui.inTime', x.inText)}`}`, 60, yy, { size: 32, weight: 600 });
      line(t('ram.sahur'), v.sahur, 300);
      if (v.iftar.past) this.text(t('ram.iftarDone'), 60, 350, { size: 32, weight: 600, color: '#7fd1a8' });
      else line(t('ram.iftar'), v.iftar, 350);
      y = this.paragraphs([v.lastTen ? t('ram.lastTen') : t('ram.fastNote'), v.eid ? t('ram.eidIn', v.eid.days, v.eidText) : ''].filter(Boolean), 400, { size: 24, color: C.muted, gap: 6 });
    } else if (v.start) {
      this.text(v.eidToday ? t('ram.eid') : t('ram.days', v.start.days), W / 2, 240, { size: v.eidToday ? 54 : 84, weight: 700, color: C.gold, align: 'center' });
      this.text(t('ram.until', v.start.year), W / 2, 295, { size: 30, align: 'center' });
      this.text(v.startText, W / 2, 345, { size: 32, weight: 600, align: 'center', color: C.gold });
      y = this.paragraphs([t('ram.tarawih'), t('ram.sighting')], 395, { size: 24, color: C.muted, gap: 6 });
    }
    const d = v.dua && t(`ram.duas.${v.dua}`);
    if (d) this.recitation({ ar: [d.ar], tr: [d.tr].filter(Boolean), de: [d.mean] }, y + 10, H - 160, true);
    else this.paragraphs(v.kids ? [t('ram.kids')] : [t('ram.about')], y + 10, { size: 26, gap: 0 });
    const by = H - 140, gap = 20, bw = (W - 120 - 2 * gap) / 3;
    this.btn(t('ram.iftarDua'), 60, by, bw, 96, 'rdua:iftar', { size: 27, active: v.dua === 'iftar' });
    this.btn(t('ram.niyyaBtn'), 60 + bw + gap, by, bw, 96, 'rdua:niyya', { size: 27, active: v.dua === 'niyya' });
    this.btn(t('ui.menu'), 60 + 2 * (bw + gap), by, bw, 96, 'menu');
  }

  // Alevilik: Übersicht
  v_alevi(v) {
    const { W, H } = this;
    this.heading(t('alevi.title'), t('alevi.sub'));
    let y = this.paragraphs(t('alevi.intro'), 155, { size: 24, color: C.muted, gap: 6 });
    const gap = 20, w = (W - 120 - gap) / 2;
    const items = [[`🕯️ ${v.list[0].name}`, `prayer:${v.list[0].id}`, v.list[0].de], [`🌀 ${v.list[1].name}`, `prayer:${v.list[1].id}`, v.list[1].de], [t('alevi.muharremBtn'), 'muharrem', t('alevi.muharremSub')], [t('alevi.valuesBtn'), 'alevival', t('alevi.valuesSub')]];
    items.forEach(([label, action, sub], i) => this.btn(label, 60 + (i % 2) * (w + gap), y + 10 + Math.floor(i / 2) * 140, w, 124, action, { primary: i < 2, size: 34, sub, subSize: 21 }));
    y += 300;
    this.switchRow(y, t('hajj.walk'), t('hajj.walkSub'), [[v.walkAlong ? t('ui.on') : t('ui.off'), 'walkalong', v.walkAlong]]);
    this.switchRow(y + 82, t('hajj.sounds'), t('alevi.soundsSub'), [[v.sounds ? t('ui.on') : t('ui.off'), 'sounds', v.sounds]]);
    this.paragraphs([t('alevi.note')], H - 205, { size: 20, color: C.gold, gap: 0 });
    this.btn(t('ui.menu'), 60, H - 128, W - 120, 96, 'menu');
  }

  // Muharrem, Aşure, Hızır-Fasten
  v_muharrem(v) {
    const { W, H } = this;
    this.heading(t('alevi.muharremTitle'), v.hijriYear ? `${v.hijriYear}` : '');
    const big = v.inFast ? t('alevi.fastDay', v.day) : v.days != null ? t('ram.days', v.days) : '';
    this.text(big, W / 2, 210, { size: 66, weight: 700, color: C.gold, align: 'center' });
    if (!v.inFast && v.dateText) this.text(t('alevi.untilMuharrem', v.dateText), W / 2, 260, { size: 28, align: 'center' });
    const tabs = [['about', t('alevi.tabAbout')], ['kerbela', t('alevi.tabKerbela')], ['asure', t('alevi.tabAsure')], ['hizir', t('alevi.tabHizir')]];
    const gap = 14, w = (W - 120 - 3 * gap) / 4;
    tabs.forEach(([id, label], i) => this.btn(label, 60 + i * (w + gap), 290, w, 62, `muharrem:${id}`, { active: v.part === id, size: 24 }));
    this.paragraphs(t(`alevi.${v.part}`), 400, { size: 25, gap: 10 });
    this.btn(t('alevi.title'), 60, H - 128, (W - 140) / 2, 96, 'alevi');
    this.btn(t('ui.menu'), 80 + (W - 140) / 2, H - 128, (W - 140) / 2, 96, 'menu');
  }

  // Werte: Sätze aus der alevitisch-bektaşischen Überlieferung
  v_alevival(v) {
    const { W, H } = this;
    this.heading(t('alevi.valuesTitle'), `${v.index + 1} / ${v.total}`);
    const [tr, mean, who] = t('alevi.sayings')[v.index];
    this.text(`„${tr}“`, W / 2, 330, { size: 54, weight: 700, color: C.gold, align: 'center' });
    this.paragraphs([mean], 420, { size: 30, gap: 0 });
    this.text(who, W / 2, 620, { size: 26, color: C.muted, align: 'center' });
    const by = H - 128, gap = 16, w = (W - 120 - 3 * gap) / 4;
    this.btn('←', 60, by, w, 96, 'sayprev', { size: 44 });
    this.btn('→', 60 + (w + gap), by, w, 96, 'saynext', { size: 44, primary: true });
    this.btn(t('alevi.title'), 60 + 2 * (w + gap), by, w, 96, 'alevi', { size: 26 });
    this.btn(t('ui.menu'), 60 + 3 * (w + gap), by, w, 96, 'menu', { size: 28 });
  }

  // Umre & Hac: Auswahl
  // Geschichten der Propheten: Auswahl
  v_stories(v) {
    const { W, H } = this;
    this.heading(t('story.title'), t('story.sub'));
    let y = this.paragraphs(t('story.intro'), 140, { size: 23, color: C.muted, gap: 4 });
    const gap = 20, w = (W - 120 - gap) / 2, h = 112;
    v.list.forEach((s, i) => {
      this.btn(`${s.icon} ${s.name}${s.done ? '  ⭐' : ''}`, 60 + (i % 2) * (w + gap), y + 6 + Math.floor(i / 2) * (h + 14), w, h, `prayer:${s.id}`, { size: 30, sub: s.sub, subSize: 21, active: s.done });
    });
    y += 6 + 3 * (h + 14);
    this.switchRow(y, t('hajj.sounds'), t('story.soundsSub'), [[v.sounds ? t('ui.on') : t('ui.off'), 'sounds', v.sounds]]);
    const by = H - 118, w3 = (W - 120 - 2 * gap) / 3;
    this.btn(t('sky.menu'), 60, by, w3, 90, 'sky', { primary: true, size: 26 });
    this.btn(`🕰️ ${t('siyer.menu')}`, 60 + w3 + gap, by, w3, 90, 'siyer', { primary: true, size: 24 });
    this.btn(t('ui.menu'), 60 + 2 * (w3 + gap), by, w3, 90, 'menu');
  }

  // Sternenhimmel: was schon leuchtet und was als Nächstes kommt
  v_sky(v) {
    const { W, H, ctx } = this;
    this.heading(t('sky.title'), t('sky.count', v.lit, v.all));
    this.text(t('sky.lookUp'), 60, 150, { size: 25, color: C.muted });
    v.groups.forEach((g, i) => {
      const y = 180 + i * 104;
      ctx.beginPath(); ctx.roundRect(60, y, W - 120, 92, 18); ctx.fillStyle = 'rgba(29,43,69,0.7)'; ctx.fill();
      this.text(`${g.icon}  ${g.name}`, 90, y + 40, { size: 30, weight: 700 });
      this.text(`${g.on} / ${g.total}`, W - 90, y + 40, { size: 30, weight: 700, color: C.gold, align: 'right' });
      // Sterne als Reihe (höchstens 30)
      const n = Math.min(30, g.items.length), sw = Math.min(36, (W - 200) / n);
      g.items.slice(0, n).forEach((it, k) => this.text(it.on ? '★' : '☆', 92 + k * sw, y + 78, { size: 26, color: it.on ? C.gold : '#4a5a78', fixed: true }));
    });
    const y = 180 + v.groups.length * 104 + 10;
    if (v.next) {
      this.text(t('sky.next'), 60, y + 26, { size: 26, color: C.muted });
      this.btn(`☆ ${v.next.label}`, 60, y + 40, W - 120, 72, v.next.action, { primary: true, size: 28, sub: v.next.group, subSize: 20 });
    } else this.text(t('sky.allDone'), W / 2, y + 50, { size: 30, color: C.gold, align: 'center' });
    const by = H - 104, gap = 20, w = (W - 120 - gap) / 2;
    this.btn(t('story.menu'), 60, by, w, 80, 'stories');
    this.btn(t('ui.menu'), 60 + w + gap, by, w, 80, 'menu');
  }

  v_pilgrim(v) {
    const { W, H } = this;
    this.heading(t('hajj.title'), `${v.madhab} · ${v.gender === 'f' ? t('ui.women') : t('ui.men')}`);
    let y = this.paragraphs(t('hajj.intro'), 160, { size: 25, color: C.muted, gap: 8 });
    const gap = 20, w = (W - 120 - gap) / 2;
    v.list.forEach((p, i) => this.btn(`${i ? '🕋' : '🤍'} ${p.name}`, 60 + i * (w + gap), y + 10, w, 150, `prayer:${p.id}`, { primary: true, size: 40, sub: p.de, subSize: 22 }));
    y += 190;
    this.switchRow(y, t('hajj.walk'), t('hajj.walkSub'), [[v.walkAlong ? t('ui.on') : t('ui.off'), 'walkalong', v.walkAlong]]);
    this.switchRow(y + 90, t('hajj.sounds'), t('hajj.soundsSub'), [[v.sounds ? t('ui.on') : t('ui.off'), 'sounds', v.sounds]]);
    this.paragraphs([t('hajj.note')], y + 200, { size: 21, color: C.muted, gap: 0 });
    const half = (W - 140) / 2;
    this.btn(t('hinfo.btn'), 60, H - 128, half, 96, 'hajjinfo', { size: 28 });
    this.btn(t('ui.menu'), 80 + half, H - 128, half, 96, 'menu');
  }

  // Zakat-Rechner auf der Tafel: Werte mit − / + (in der Brille gibt es keine Tastatur)
  v_zakat(v) {
    const { W, H } = this, z = v.z, F = t('zakat.fields');
    this.heading(t('zakat.title'), t('zakat.sub'));
    const step = { cash: 100, other: 100, debts: 100, gold: 1, silver: 10, goldPrice: 1, silverPrice: 0.1, persons: 1, perPerson: 1 };
    const rows = ['cash', 'other', 'debts', 'gold', 'silver', 'goldPrice', 'silverPrice'];
    const cw = (W - 140) / 2;
    rows.forEach((id, i) => {
      const x = 60 + (i % 2) * (cw + 20), y = 130 + Math.floor(i / 2) * 82;
      this.btn('', x, y, cw, 74, `zset:${id}`);
      this.text(F[id], x + 18, y + 30, { size: 21, color: C.muted });
      this.text(id === 'gold' || id === 'silver' ? `${z[id]} g` : v.money(z[id]), x + 18, y + 60, { size: 26, weight: 700 });
      this.btn('−', x + cw - 150, y + 10, 64, 54, `zset:${id}:-${step[id]}`, { size: 30 });
      this.btn('+', x + cw - 78, y + 10, 64, 54, `zset:${id}:${step[id]}`, { size: 30 });
    });
    this.btn(`${t('zakat.currency')}: ${z.cur}`, 60 + cw + 20, 130 + 3 * 82, cw, 74, 'zset:cur', { size: 24 });
    const y = 130 + 4 * 82 + 6;
    this.btn(`${t('zakat.nisabBy')}: ${z.by === 'gold' ? t('zakat.byGold') : t('zakat.bySilver')}`, 60, y, cw, 64, 'zset:by', { active: true, size: 22 });
    this.text(`${t('zakat.total')}: ${v.money(v.net)} · ${t('zakat.nisab')}: ${v.priced ? v.money(v.nisab) : '–'}`, 60 + cw + 20, y + 40, { size: 22 });
    this.text(`${t('zakat.due')}: ${v.money(v.due)}`, W / 2, y + 120, { size: 44, weight: 700, color: C.gold, align: 'center' });
    this.text(!v.priced ? t('zakat.noPrice') : v.due ? '' : t('zakat.below'), W / 2, y + 160, { size: 22, color: C.muted, align: 'center' });
    // Fitra
    const fy = y + 190;
    this.text(`${t('zakat.fitra')}: ${t('zakat.persons')} ${z.persons} × ${v.money(z.perPerson)} = ${v.money(v.fitra)}`, 60, fy + 40, { size: 24, weight: 600 });
    this.btn('−', W - 60 - 4 * 74, fy + 8, 66, 54, 'zset:persons:-1', { size: 28 });
    this.btn('+', W - 60 - 3 * 74, fy + 8, 66, 54, 'zset:persons:1', { size: 28 });
    this.btn('−1', W - 60 - 2 * 74, fy + 8, 66, 54, 'zset:perPerson:-1', { size: 22 });
    this.btn('+1', W - 60 - 74, fy + 8, 66, 54, 'zset:perPerson:1', { size: 22 });
    this.btn(t('ui.menu'), 60, H - 96, W - 120, 72, 'menu');
  }

  v_cuma(v) {
    const { W, H } = this;
    this.heading(t('cuma.title'), t('cuma.sub'));
    this.text(t('cuma.nextIn', v.inDays), 60, 170, { size: 30, weight: 700, color: C.gold });
    let y = this.paragraphs([v.kids ? t('cuma.kids') : t('cuma.about')], 215, { size: 23, gap: 8 });
    y = this.paragraphs(t('cuma.sunnah').map((x) => `• ${x}`), y + 6, { size: 22, gap: 2 });
    const half = (W - 140) / 2;
    this.btn(t('pn.jumua'), 60, y + 16, half, 76, 'prayer:jumua', { primary: true });
    this.btn(`🔊 ${t('holy.duaName.salawatShort')}`, 80 + half, y + 16, half, 76, 'hdua:salawatShort', { size: 26 });
    this.switchRow(y + 110, t('cuma.remind'), t('cuma.remindSub'), [[v.remindOn ? t('ui.on') : t('ui.off'), v.remindOn ? 'remcuma' : 'remind', v.remindOn]]);
    this.btn(t('ui.menu'), 60, H - 100, W - 120, 76, 'menu');
  }

  v_siyer(v) {
    const { W, H } = this, [year, title, text, kid] = v.ev;
    this.heading(t('siyer.title'), t('siyer.stepOf', v.i + 1, v.n));
    // Zeitstrahl: ein Punkt je Ereignis
    const x0 = 80, x1 = W - 80, ly = 175;
    this.ctx.fillStyle = C.line; this.ctx.fillRect(x0, ly - 2, x1 - x0, 4);
    for (let k = 0; k < v.n; k++) {
      const x = x0 + (k / (v.n - 1)) * (x1 - x0);
      this.btn('', x - 16, ly - 16, 32, 32, `siyer:${k}`, { active: k === v.i, primary: k < v.i });
    }
    this.text(year, W / 2, 270, { size: 54, weight: 700, color: C.gold, align: 'center' });
    this.text(title, W / 2, 330, { size: 36, weight: 700, align: 'center' });
    this.paragraphs([v.kids ? kid : text], 380, { size: 27, gap: 0 });
    const bw = (W - 140) / 3;
    this.btn('◀', 60, H - 210, bw, 84, 'siprev', { size: 36 });
    this.btn(t('elif.say'), 70 + bw, H - 210, bw, 84, 'sisay', { primary: true, size: 28 });
    this.btn('▶', 80 + 2 * bw, H - 210, bw, 84, 'sinext', { size: 36 });
    this.btn(t('ui.menu'), 60, H - 110, W - 120, 84, 'menu');
  }

  // Urkunden, Hoca-Modus und Aufgaben auf der Tafel
  v_certs(v) {
    const { W, H } = this;
    this.heading(t('cert.menu'), t('cert.sub'));
    const cw = (W - 140) / 2;
    v.list.forEach((b, i) => {
      const x = 60 + (i % 2) * (cw + 20), y = 125 + Math.floor(i / 2) * 84;
      this.btn(`${b.ok ? '★' : '☆'} ${b.name}`, x, y, cw, 74, b.ok ? `cert:${b.i}` : 'noop', { primary: b.ok, size: 24 });
    });
    this.paragraphs([v.msg || (v.vr ? t('cert.vr') : t('cert.save'))], H - 170, { size: 21, color: C.muted, gap: 0 });
    this.btn(t('ui.menu'), 60, H - 110, W - 120, 84, 'menu');
  }

  v_hoca(v) {
    const { W, H } = this;
    this.heading(t('hoca.title'), t('hoca.sub'));
    const y0 = this.paragraphs([t('hoca.intro')], 150, { size: 20, color: C.muted, gap: 0 });
    const cw = (W - 120 - 30) / 4;
    v.all.forEach((x, i) => this.btn(`${x.on ? '✓ ' : ''}${x.label}`, 60 + (i % 4) * (cw + 10), y0 + 10 + Math.floor(i / 4) * 66, cw, 58, `hpick:${x.id}`, { active: x.on, size: 19 }));
    const y = y0 + 10 + Math.ceil(v.all.length / 4) * 66 + 10;
    if (v.link) this.paragraphs([v.link], y + 20, { size: 18, color: C.gold, gap: 0 });
    if (v.msg) this.text(v.msg, 60, y + 70, { size: 22, color: C.gold });
    const half = (W - 140) / 2;
    this.btn(t('hoca.share'), 60, H - 110, half, 84, 'hshare', { primary: true });
    this.btn(t('ui.menu'), 80 + half, H - 110, half, 84, 'menu');
  }

  v_tasks(v) {
    const { W, H } = this;
    this.heading(t('hoca.tasks'), t('hoca.from', v.from));
    this.text(`${v.done} / ${v.list.length}${v.done === v.list.length && v.list.length ? `  ·  ${t('hoca.allDone')}` : ''}`, 60, 175, { size: 34, weight: 700, color: C.gold });
    const cw = (W - 140) / 2;
    v.list.forEach((x, i) => this.btn(`${x.ok ? '✅' : '⬜'} ${x.label}`, 60 + (i % 2) * (cw + 20), 205 + Math.floor(i / 2) * 76, cw, 68, x.action, { active: x.ok, size: 22 }));
    if (v.msg) this.text(v.msg, 60, H - 140, { size: 22, color: C.gold });
    const third = (W - 160) / 3;
    this.btn(t('hoca.result'), 60, H - 110, third, 84, 'tresult', { primary: true, size: 24 });
    this.btn(t('hoca.clear'), 80 + third, H - 110, third, 84, 'tclear', { size: 24 });
    this.btn(t('ui.menu'), 100 + 2 * third, H - 110, third, 84, 'menu');
  }

  // Mein Weg auf der Tafel
  v_path(v) {
    const { W, H } = this;
    this.heading(t('path.title'), t('path.sub'));
    const tabs = Object.entries(t('path.tabs')), tw = (W - 140) / 3;
    tabs.forEach(([id, l], i) => this.btn(l, 60 + i * (tw + 10), 125, tw, 62, `path:${id}`, { active: v.part === id, size: 24 }));
    if (v.part === 'steps') {
      const c = v.steps[v.cur];
      let y = 225;
      if (v.restart) y = this.paragraphs([t('path.restart')], y, { size: 21, color: C.gold, gap: 4 });
      else if (v.streak) { this.text(`🔥 ${t('path.streak', v.streak)}`, 60, y + 10, { size: 26, weight: 700, color: C.gold }); y += 40; }
      if (c) {
        this.text(`${t('path.next')} · ${t('path.stepOf', v.cur + 1, v.steps.length)}`, 60, y + 20, { size: 22, color: C.muted });
        this.text(c.title, 60, y + 60, { size: 34, weight: 700, color: C.gold });
        y = this.paragraphs([c.text], y + 92, { size: 23, gap: 0 });
        this.btn(t('path.go'), 60, y + 4, 380, 70, c.action, { primary: true, size: 28 });
        this.btn(t('path.oneNow', v.now.name), 460, y + 4, W - 520, 70, `prayer:${v.now.id}`, { size: 24 });
        y += 90;
      } else y = this.paragraphs([t('path.allDone')], y + 10, { size: 24, color: C.gold, gap: 6 });
      const cw = (W - 140) / 3;
      v.steps.forEach((s, i) => this.btn(`${s.ok ? '✅' : i === v.cur ? '👉' : '⬜'} ${s.title}`, 60 + (i % 3) * (cw + 10), y + Math.floor(i / 3) * 62, cw, 54, s.action, { active: s.ok, size: 19 }));
    } else if (v.part === 'why') {
      const cw = (W - 140) / 2;
      v.why.forEach(([title, text, kid], i) => {
        const x = 60 + (i % 2) * (cw + 20), y = 205 + Math.floor(i / 2) * 120;
        this.btn('', x, y, cw, 112, 'noop');
        this.text(title, x + 18, y + 32, { size: 23, weight: 700, color: C.gold });
        this.ctx.font = `17px ${UI}`;
        const lines = wrap(this.ctx, v.kids ? kid : text, cw - 36).slice(0, 3);
        lines.forEach((l, k) => this.text(l, x + 18, y + 60 + k * 22, { size: 17 }));
      });
    } else {
      this.text(v.garden.slice(0, 7).join(' '), W / 2, 330, { size: 70, align: 'center' });
      this.text(v.garden.slice(7).join(' '), W / 2, 430, { size: 70, align: 'center' });
      this.paragraphs([v.gardenEmpty ? t('path.gardenEmpty') : t('path.garden')], 500, { size: 24, gap: 0 });
      this.btn(t('track.title'), 360, 640, W - 720, 84, 'tracker', { primary: true });
    }
    this.btn(t('ui.menu'), 60, H - 100, W - 120, 76, 'menu');
  }

  // Unterseite mit Kacheln (z. B. „Weitere Gebete“)
  v_hub(v) {
    const { W, H } = this;
    this.heading(v.title);
    v.items.forEach((it, i) => this.btn(`${it.icon} ${it.label}`, 60, 130 + i * 128, W - 120, 116, it.action, { size: 34, sub: it.sub, subSize: 22, active: it.active }));
    this.btn(t('ui.menu'), 60, H - 110, W - 120, 84, 'menu');
  }

  // Gebet anpassen: Sitzen und Reise
  v_adapt(v) {
    const { W, H } = this;
    this.heading(t('sit.title'), t('sit.sub'));
    let y = this.paragraphs([t('sit.intro')], 160, { size: 22, color: C.muted, gap: 0 });
    const cur = v.sitting || 'off', bw = (W - 140) / 3;
    this.text(t('sit.label'), 60, y + 30, { size: 28, weight: 700 });
    [['off', t('sit.off')], ['floor', t('sit.floor')], ['chair', t('sit.chair')]].forEach(([id, l], i) => this.btn(l, 60 + i * (bw + 10), y + 50, bw, 70, `sitting:${id}`, { active: cur === id, size: 26 }));
    y = this.paragraphs([v.sitting ? t(`sit.mode.${v.sitting}`) : t('sit.lying'), t(`sit.note.${v.madhab.id}`)], y + 160, { size: 21, gap: 6 });
    this.switchRow(y + 4, t('sit.travel'), t('sit.travelSub'), [[v.travel ? t('ui.on') : t('ui.off'), 'travel', v.travel]]);
    this.paragraphs([t(`sefer.qasr.${v.madhab.id}`), t('sefer.about')[2]], y + 96, { size: 20, color: C.muted, gap: 4 });
    this.btn(t('ui.menu'), 60, H - 110, W - 120, 84, 'menu');
  }

  v_kaza(v) {
    const { W, H } = this;
    this.heading(t('kaza.title'), t('kaza.sub'));
    this.text(String(v.open), 140, 200, { size: 64, weight: 700, color: C.gold, align: 'center' });
    this.text(t('kaza.made', v.k.made), 230, 200, { size: 24, color: C.muted });
    const cw = (W - 120 - 20) / 2;
    v.ids.forEach((id, i) => {
      const x = 60 + (i % 2) * (cw + 20), y = 235 + Math.floor(i / 2) * 92;
      this.text(v.names[id], x, y + 32, { size: 25, weight: 700 });
      this.text(t('kaza.open', v.k[id]), x, y + 62, { size: 21, color: C.muted });
      const bx = x + cw - 3 * 78;
      this.btn('−', bx, y + 6, 70, 70, `kz:${id}:-1`, { size: 34 });
      this.btn('+', bx + 78, y + 6, 70, 70, `kz:${id}:1`, { size: 34 });
      if (id !== 'fast') this.btn('▶', bx + 156, y + 6, 70, 70, `kazapray:${id}`, { primary: true, size: 28 });
    });
    const y = 235 + 4 * 92;
    this.text(`${t('kaza.estimate')}: ${t('kaza.estimateSub')}`, 60, y + 24, { size: 21, color: C.muted });
    this.btn('−', 60, y + 40, 70, 64, 'kz:years:-1', { size: 30 });
    this.btn(t('kaza.years', v.years), 140, y + 40, 200, 64, 'noop', { active: true, size: 24 });
    this.btn('+', 350, y + 40, 70, 64, 'kz:years:1', { size: 30 });
    this.btn(t('kaza.fill'), 440, y + 40, 360, 64, 'kz:fill', { primary: true, size: 24 });
    this.btn(t('kaza.reset'), 810, y + 40, W - 870, 64, 'kz:reset', { size: 24 });
    this.paragraphs([t('kaza.tips')[0]], y + 140, { size: 20, color: C.muted, gap: 0 });
    this.btn(t('ui.menu'), 60, H - 100, W - 120, 76, 'menu');
  }

  // Elif-Ba auf der Tafel: Reiter, darunter Buchstabe mit Formen, Vokalzeichen, Wörter oder Quiz
  v_elif(v) {
    const { W, H } = this;
    this.heading(t('elif.title'), t('elif.sub'));
    const tabs = Object.entries(t('elif.tabs')), tw = (W - 120 - 30) / 4;
    tabs.forEach(([id, l], i) => this.btn(l, 60 + i * (tw + 10), 125, tw, 62, `elif:${id}`, { active: v.part === id, size: 24 }));
    const cx = W / 2;
    if (v.part === 'letters') {
      const L = v.letter, forms = t('elif.forms');
      this.text(L.ch, cx, 340, { size: 190, font: AR, align: 'center', rtl: true, color: C.gold });
      this.text(`${L.name} · ${L.arName}`, cx, 440, { size: 34, weight: 700, align: 'center' });
      this.text(L.tip + (L.joins ? '' : ` · ${t('elif.noJoin')}`), cx, 482, { size: 22, color: C.muted, align: 'center' });
      const fw = (W - 120 - 30) / 4;
      L.forms.forEach((f, k) => {
        const x = W - 60 - (k + 1) * fw - k * 10;
        this.btn('', x, 510, fw, 130, 'noop');
        this.text(f, x + fw / 2, 585, { size: 64, font: AR, align: 'center', rtl: true });
        this.text(forms[k], x + fw / 2, 625, { size: 20, color: C.muted, align: 'center' });
      });
      const bw = (W - 140) / 3;
      this.btn('→', 60, 665, bw, 80, 'elprev', { size: 40 });
      this.btn(t('elif.say'), 70 + bw, 665, bw, 80, 'elsay', { primary: true, size: 28 });
      this.btn('←', 80 + 2 * bw, 665, bw, 80, 'elnext', { size: 40 });
      this.paragraphs([v.kids ? t('elif.kids') : t('elif.intro')], 790, { size: 20, color: C.muted, gap: 0 });
    } else if (v.part === 'marks') {
      this.paragraphs([t('elif.marksIntro')], 225, { size: 21, color: C.muted, gap: 0 });
      v.marks.forEach((m, k) => {
        const y = 290 + k * 78;
        this.btn('', 60, y, W - 120, 70, `elsay:m:${k}`);
        this.text(m.ar, W - 90, y + 50, { size: 44, font: AR, align: 'right', rtl: true, color: C.gold });
        this.text(`${m.name} · ${m.tr}`, 90, y + 30, { size: 25, weight: 700 });
        this.text(m.desc, 90, y + 56, { size: 19, color: C.muted });
      });
    } else if (v.part === 'words') {
      this.paragraphs([t('elif.wordsIntro')], 225, { size: 21, color: C.muted, gap: 0 });
      const ww = (W - 120 - 20) / 3;
      v.words.forEach((w, k) => {
        const x = 60 + (k % 3) * (ww + 10), y = 290 + Math.floor(k / 3) * 128;
        this.btn('', x, y, ww, 118, `elsay:w:${k}`);
        this.text(w.ar, x + ww / 2, y + 62, { size: 50, font: AR, align: 'center', rtl: true, color: C.gold });
        this.text(`${w.tr} · ${w.de}`, x + ww / 2, y + 100, { size: 21, align: 'center' });
      });
    } else this.quizBoard(v, 'elq', (c) => [c.letter.forms[c.form], ''], (o) => o.name, (c) => c.letter.name, t('elif.quizQ'));
    this.btn(t('ui.menu'), 60, H - 110, W - 120, 84, 'menu');
  }

  // Gemeinsames Quiz-Brett (Elif-Ba und 99 Namen)
  quizBoard(v, act, show, label, answer, question) {
    const { W } = this, z = v.quiz, cx = W / 2;
    if (!z || !z.cur) {
      this.text(z ? t('elif.done', z.score, z.q.length) : '', cx, 380, { size: 60, weight: 700, color: C.gold, align: 'center' });
      this.text(t('elif.best', v.best), cx, 440, { size: 28, color: C.muted, align: 'center' });
      this.btn(t('elif.again'), 360, 500, W - 720, 96, `${act === 'elq' ? 'elif' : 'esma'}:quiz`, { primary: true });
      return;
    }
    const c = z.cur, [big, small] = show(c);
    this.text(`${t('elif.quizOf', z.i + 1, z.q.length)} · ⭐ ${z.score}`, cx, 225, { size: 22, color: C.muted, align: 'center' });
    this.text(big, cx, act === 'esq' ? 320 : 340, { size: act === 'esq' ? (big.length > 12 ? 64 : 92) : 150, font: AR, align: 'center', rtl: true, color: C.gold });
    if (small) this.text(small, cx, 395, { size: 28, color: C.gold, align: 'center' });
    this.text(question, cx, 435, { size: 26, align: 'center' });
    const ow = (W - 140) / 2;
    c.opts.forEach((o, k) => {
      const state = z.picked == null ? {} : o.k === c.ans ? { active: true } : o.k === z.picked ? { primary: false, active: false, wrong: true } : {};
      this.btn(label(o), 60 + (k % 2) * (ow + 20), 460 + Math.floor(k / 2) * 92, ow, 82, `${act}:${o.k}`, { size: 22, ...state });
    });
    if (z.picked != null) {
      this.text(z.picked === c.ans ? t('elif.right') : t('elif.wrong', answer(c)), cx, 680, { size: 26, color: C.gold, align: 'center' });
      this.btn(t('elif.nextQ'), 360, 705, W - 720, 78, `${act}:0`, { primary: true });
    }
  }

  v_esma(v) {
    const { W, H } = this;
    this.heading(t('esma.title'), t('esma.sub'));
    const tw = (W - 140) / 3, cx = W / 2;
    [[t('esma.name'), 'esma', !v.all && !v.quiz], [t('esma.list'), 'esma:list', !!v.all], [t('esma.quiz'), 'esma:quiz', !!v.quiz]]
      .forEach(([l, a, on], i) => this.btn(l, 60 + i * (tw + 10), 125, tw, 62, a, { active: on, size: 24 }));
    if (v.all) {
      // Tafel: 33 Namen je Seite wären zu klein – zeige 15 um den aktuellen Namen herum
      const start = Math.max(0, Math.min(99 - 15, v.i - 7)), cw = (W - 140) / 3;
      v.all.slice(start, start + 15).forEach((e, k) => {
        const x = 60 + (k % 3) * (cw + 10), y = 205 + Math.floor(k / 3) * 112;
        this.btn('', x, y, cw, 102, `esma:${e.i}`, { active: e.i === v.i });
        this.text(`${e.i + 1}. ${e.ar}`, x + cw / 2, y + 48, { size: 34, font: AR, align: 'center', rtl: true, color: C.gold });
        this.text(e.mean.length > 34 ? `${e.mean.slice(0, 33)}…` : e.mean, x + cw / 2, y + 84, { size: 18, align: 'center' });
      });
    } else if (v.quiz) this.quizBoard(v, 'esq', (c) => [c.name.ar, c.name.tr], (o) => o.mean, (c) => c.name.mean, t('esma.quizQ'));
    else {
      const e = v.name;
      this.text(`${t('esma.nameOf', e.i + 1)} · ${t('esma.learned', v.seen)}`, cx, 230, { size: 22, color: C.muted, align: 'center' });
      this.text(e.ar, cx, 380, { size: e.ar.length > 12 ? 80 : 120, font: AR, align: 'center', rtl: true, color: C.gold });
      if (e.tr) this.text(e.tr, cx, 450, { size: 36, weight: 700, align: 'center' });
      this.paragraphs([e.mean], 500, { size: 28, gap: 0 });
      const bw = (W - 140) / 3;
      this.btn('←', 60, 600, bw, 84, 'esprev', { size: 40 });
      this.btn(t('elif.say'), 70 + bw, 600, bw, 84, 'essay', { primary: true, size: 28 });
      this.btn('→', 80 + 2 * bw, 600, bw, 84, 'esnext', { size: 40 });
      this.paragraphs([v.kids ? t('esma.kids') : t('esma.intro')], 730, { size: 20, color: C.muted, gap: 0 });
    }
    this.btn(t('ui.menu'), 60, H - 110, W - 120, 84, 'menu');
  }

  // Wissen zu Hac und Umre: sieben Reiter, darunter der Text
  v_hajjinfo(v) {
    const { W, H } = this;
    this.heading(t('hinfo.title'), v.nextText);
    const tabs = Object.entries(t('hinfo.tabs')), gap = 10, w = (W - 120 - gap * (tabs.length - 1)) / tabs.length;
    tabs.forEach(([id, label], i) => this.btn(label, 60 + i * (w + gap), 130, w, 64, `hajjinfo:${id}`, { active: v.part === id, size: 20 }));
    let y = 240;
    if (v.kids) y = this.paragraphs([t(`hinfo.kid.${v.part}`)], y, { size: 23, color: C.gold, gap: 12 });
    this.paragraphs(t(`hinfo.${v.part}`), y, { size: 22, gap: 10 });
    const half = (W - 140) / 2;
    this.btn(t('hajj.title'), 60, H - 120, half, 88, 'pilgrim');
    this.btn(t('ui.menu'), 80 + half, H - 120, half, 88, 'menu');
  }

  // Familie: Profile wechseln, hinzufügen, umbenennen, löschen
  v_profiles(v) {
    const { W, H, ctx } = this;
    this.heading(t('prof.title'), t('prof.sub'));
    v.list.forEach((p, i) => {
      const y = 130 + i * 104;
      ctx.beginPath(); ctx.roundRect(60, y, W - 120, 92, 18);
      ctx.fillStyle = p.active ? 'rgba(122,95,34,0.45)' : 'rgba(29,43,69,0.7)'; ctx.fill();
      this.btn(p.icon, 72, y + 10, 72, 72, `picon:${p.id}`, { size: 40 });
      this.text(p.name, 164, y + 40, { size: 32, weight: 700 });
      const stats = [p.kids ? `🧒 ${t('prof.kids')}` : '', t('prof.today', p.today), t('prof.streak', p.streak), t('prof.stars', p.stars), t('prof.suras', p.suras)].filter(Boolean).join(' · ');
      this.text(stats, 164, y + 76, { size: 21, color: C.muted });
      const b = (label, action, k, opt) => this.btn(label, W - 72 - (k + 1) * 170 + 10, y + 14, 160, 64, action, { size: 24, ...opt });
      b(p.active ? t('prof.active') : t('prof.use'), p.active ? 'noop' : `puse:${p.id}`, 0, { primary: !p.active, active: p.active });
      b(t('prof.rename'), `pren:${p.id}`, 1);
      if (p.id !== 'main') b(v.pDel === p.id ? t('prof.delSure') : t('prof.del'), `pdel:${p.id}`, 2, { size: v.pDel === p.id ? 19 : 24 });
    });
    this.text(t('prof.note'), 60, H - 160, { size: 20, color: C.muted });
    const half = (W - 120 - 20) / 2;
    this.btn(v.list.length < v.max ? t('prof.add') : t('prof.max'), 60, H - 128, half, 96, v.list.length < v.max ? 'padd' : 'noop', { primary: v.list.length < v.max });
    this.btn(t('ui.menu'), 60 + half + 20, H - 128, half, 96, 'menu');
  }

  // Erinnerung: Benachrichtigung und Kalender
  v_remind(v) {
    const { W, H } = this;
    this.heading(t('rem.title'), t('rem.sub'));
    this.text(t('ui.next', v.next.name, v.next.time, v.next.inText), 60, 170, { size: 28, weight: 600, color: C.gold });
    this.switchRow(205, t('rem.on'), t('rem.onSub'), [[v.on ? t('ui.on') : t('ui.off'), 'remon', v.on]]);
    this.text(t('rem.before'), 60, 330, { size: 28, weight: 600 });
    this.btn(t('rem.min', v.before), isRTL() ? 60 : W - 60 - 660, 295, 300, 70, 'rembefore', { active: true, size: 26 });
    this.btn(t('rem.test'), isRTL() ? 380 : W - 60 - 340, 295, 340, 70, 'remtest', { size: 24 });
    let y = 400;
    if (v.ios) y = this.paragraphs([t('rem.ios')], y, { size: 23, color: C.muted, gap: 6 });
    this.btn(t('rem.cal'), 60, y + 10, W - 120, 90, 'remcal', { primary: true, size: 32 });
    y = this.paragraphs([t('rem.calSub')], y + 132, { size: 22, color: C.muted, gap: 0 });
    // Welche Gebete?
    this.text(t('rem.which'), 60, y + 30, { size: 26, weight: 600 });
    const gap = 16, w = (W - 120 - gap * 4) / 5;
    v.prayerList.forEach((p, i) => this.btn(`${p.on ? '✓ ' : ''}${p.name}`, 60 + i * (w + gap), y + 50, w, 66, `remp:${p.id}`, { active: p.on, size: 26 }));
    this.switchRow(y + 128, t('holy.remind'), t('holy.remindSub'), [[v.holy ? t('ui.on') : t('ui.off'), 'remholy', v.holy]]);
    if (v.msg) this.paragraphs([v.msg], y + 220, { size: 24, color: C.gold, gap: 0 });
    this.btn(t('ui.back'), 60, H - 128, W - 120, 96, v.back);
  }

  v_info() {
    this.heading(t('ui.info'));
    this.paragraphs(t('ui.infoText'), 170, { size: 30, gap: 22 });
    this.btn(t('ui.back'), 60, this.H - 140, this.W - 120, 96, 'settings');
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
      const m = s.wudu ? { cue: `${s.cue} · ${s.count}×` } : s.hajj ? { cue: s.status ? `${s.cue} · ${s.status.split(' · ')[0]}` : s.cue } : moveFor(v.prevPose, s.pose);
      // links das Piktogramm, rechts Ansage und Text
      if (s.wudu) drawBody(this.ctx, s.wudu, 24, 60, 260);
      else drawPictogram(this.ctx, v.prevPose, s.pose, 24, 60, 260);
      const x0 = 300, cx = (x0 + W - 30) / 2;
      let cueSize = 44;
      this.ctx.font = `700 ${cueSize}px ${UI}`;
      while (cueSize > 28 && this.ctx.measureText(m.cue).width > W - x0 - 210) this.ctx.font = `700 ${(cueSize -= 2)}px ${UI}`;
      this.text(m.cue, x0, 72, { size: cueSize, weight: 700, color: v.posture === 'ok' ? '#7fd1a8' : C.gold });
      if (s.rakah) this.text(t('ui.rakaShort', s.rakah, s.of || v.prayer.rakat), W - 40, 72, { size: 32, color: C.muted, align: 'right', fixed: true, rtl: isRTL() });
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
      this.text('NamazVR', W / 2, 150, { size: 64, weight: 700, color: C.gold, align: 'center' });
      this.text(t('ui.cardIdle'), W / 2, 250, { size: 36, color: C.muted, align: 'center' });
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
    this.text(move.cue, x, H / 2 + 4, { size, weight: 700, color: C.gold, base: 'middle', align: move.arrow ? 'left' : 'center', fixed: true, rtl: isRTL() });
    this.tex.needsUpdate = true;
  }
}
