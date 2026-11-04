import * as THREE from 'three';
import { taqabbal } from './prayer.js';
import { isRTL, t } from './i18n.js';
import { drawArrow, drawPictogram, moveFor } from './movement.js';
import { drawBody } from './wudu.js';

const C = {
  bg: 'rgba(10,18,32,0.94)', border: '#c9a85c', gold: '#e6c77f', text: '#eef2f7', muted: '#9fb0c6',
  btn: '#1d2b45', btnHover: '#2c4168', primary: '#24785a', primaryHover: '#2f9670', active: '#7a5f22', track: '#24324d',
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
    this.heading('NamazVR', t('ui.sub'));
    this.text(t('ui.choose'), 60, 160, { size: 32, color: C.muted });
    const gap = 20, w = (W - 120 - gap * 4) / 5;
    v.prayers.forEach((p, i) => {
      this.btn(p.name, 60 + i * (w + gap), 210, w, 200, `prayer:${p.id}`, {
        size: 40, sub: isRTL() ? '' : p.ar, subFont: AR, subSize: 46, active: p.id === v.times.current,
      });
      const cx = 60 + i * (w + gap) + w / 2;
      const row = v.times.rows.find((t) => t.id === p.id);
      this.text(`${t('ui.clock', row.time)} · ${t('ui.rakat', p.rakat)}`, cx, 450, { size: 26, color: C.text, align: 'center' });
      this.text(p.id === v.times.current ? t('ui.now') : p.de, cx, 484, { size: 22, color: p.id === v.times.current ? C.gold : C.muted, align: 'center' });
    });
    const n = v.times.next;
    this.text(t('ui.next', n.name, n.time, n.inText), 60, 545, { size: 32, weight: 600, color: C.gold });
    this.text(`${v.qibla} · ${v.calibrated ? t('ui.calibrated') : t('ui.notCalibrated')} · ${v.madhab}`, 60, 588, { size: 26, color: v.calibrated ? '#7fd1a8' : C.muted });
    const bw = (W - 120 - gap * 3) / 4;
    [
      [[t('ui.menuTimes'), 'times'], [t('ui.menuMore'), 'more'], [t('ui.menuWudu'), 'wudu'], [t('ui.menuLearn'), 'learn']],
      [[t('ui.menuQibla'), 'qibla'], [t('ui.menuTasbih'), 'tasbih'], [t('ui.menuMosque'), 'mosque'], [t('ui.menuSettings'), 'settings']],
      [[t('ui.menuSuras'), 'suras'], [t('ui.menuPeace'), 'peace'], [t('track.menu', v.tracked), 'tracker'], [t('ram.menu'), 'ramadan']],
      [[t('ui.kidsBtn', v.kids), 'kids']],
    ].forEach((row, ri) => row.forEach(([label, action], i) => {
      const w = row.length === 1 ? 2 * bw + gap : bw;
      this.btn(label, 60 + i * (bw + gap), 612 + ri * 84, w, 72, action, { primary: action === 'wudu' && !v.wuduDone, active: (action === 'kids' && v.kids) || (action === 'tracker' && v.tracked === 5), size: 29 });
    }));
    this.text('السَّلَامُ عَلَيْكُمْ', (60 + 2 * bw + 2 * gap + W - 60) / 2, 612 + 3 * 84 + 50, { size: 42, font: AR, color: C.gold, align: 'center', rtl: true, fixed: true });
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
    const by = H - 140, bw = (W - 120 - 40) / 3;
    this.btn(t('ui.method'), 60, by, bw, 96, 'method', { size: 26, sub: v.method, subSize: 22 });
    this.btn(t('ui.asrCalc'), 60 + bw + 20, by, bw, 96, 'asr', { size: 26, sub: v.asr.split(' (')[0], subSize: 22 });
    this.btn(t('ui.back'), 60 + 2 * (bw + 20), by, bw, 96, 'menu');
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

    this.movement(v, 150, 230);
    let y = 430;
    if (v.inner) y = this.paragraphs([`✦  ${v.inner}`], 425, { size: 27, color: C.gold, gap: 8 });
    y = this.paragraphs([step.instr], y, { size: 28, color: C.muted, gap: 10 });
    this.recitation(step, y, H - 150);

    const by = H - 120, bh = 90;
    this.btn(t('ui.prev'), 60, by, 220, bh, 'prev');
    this.btn(t('ui.menu'), 300, by, 170, bh, 'menu');
    this.btn(v.auto ? t('ui.autoOn') : t('ui.autoOff'), 490, by, 220, bh, 'auto', { active: v.auto });
    this.btn(`${v.voice ? '🔊' : '🔇'} ${t('ui.speak')}`, 730, by, 230, bh, 'speak', { active: v.voice });
    if (v.noVoice) this.text(v.canDownload ? t('voice.hintStep') : t('ui.noVoiceLang'), W - 60, by - 12, { size: 21, color: C.gold, align: 'right' });
    this.btn(v.index === v.total - 1 ? t('ui.done') : t('ui.nextStep'), 980, by, W - 1040, bh, 'next', { primary: true });
  }

  // Bewegungs-Box: Piktogramm, Ansage, Ausführung und – in VR – ob die Haltung erkannt wurde.
  movement(v, top, h) {
    const { ctx, W } = this;
    const step = v.step;
    const m = step.wudu
      ? { cue: step.cue, how: `${step.count}×${step.count > 1 && step.fard ? t('wudu.oneFard') : ''} · ${step.fard ? t('wudu.fard') : t('wudu.sunnah')}`, arrow: null }
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
      ok: [v.finger ? t('hands.finger') : t('ui.postureOk'), '#7fd1a8'],
      wait: [v.handHint ? t(`hands.${v.handHint}`) : t('ui.postureWait'), C.gold],
      off: [t('ui.postureOff'), C.muted],
      wudu: [t('wudu.stepOf', v.index + 1, v.total), C.muted],
    }[v.posture] || ['', C.muted];
    this.text(status[0], x, top + h - 22, { size: 26, weight: v.posture === 'off' ? '' : 600, color: status[1] });
  }

  v_done(v) {
    const { W, H } = this;
    if (v.prayer.kind === 'wudu') {
      this.heading(t('ui.wuduDone'), t('ui.wuduSub'));
      this.paragraphs([t('ui.wuduWell'), t('ui.wuduBreak')], 200, { size: 32, gap: 26 });
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
    const gap = 20, w = (W - 120 - gap) / 2;
    v.suras.forEach((s, i) => {
      const x = 60 + (i % 2) * (w + gap), y = 200 + Math.floor(i / 2) * 165;
      const name = `${s.name}${s.learned ? '  ✓' : ''}${s.inPrayer ? '  ★' : ''}`;
      this.btn(name, x, y, w, 145, `sura:${s.id}`, { size: 38, sub: s.about, subSize: 23, active: s.learned });
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
    this.heading(v.name, v.mode === 'read' ? `${v.n} · ${t('ui.verses', n)}` : t('ui.verseOf', v.v + 1, n));
    [['read', t('ui.modeRead')], ['verse', t('ui.modeVerse')], ['test', t('ui.modeTest')]].forEach(([m, label], i) => {
      this.btn(label, 60 + i * 250, 125, 240, 64, `smode:${m}`, { size: 26, active: v.mode === m });
    });
    if (v.id !== 'fatiha') this.btn(v.inPrayer ? t('ui.inPrayer') : t('ui.usePrayer'), W - 60 - 320, 125, 320, 64, 'sprayer', { size: 26, active: v.inPrayer });
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
    const by = H - 140, gap = 20, w = (W - 120 - 3 * gap) / 4;
    this.btn('←', 60, by, w, 96, 'peaceprev', { size: 44 });
    this.btn('→', 60 + (w + gap), by, w, 96, 'peacenext', { size: 44, primary: true });
    this.btn(t('ui.calm'), 60 + 2 * (w + gap), by, w, 96, 'calm', { size: 28 });
    this.btn(t('ui.menu'), 60 + 3 * (w + gap), by, w, 96, 'menu', { size: 28 });
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
    this.heading(t('ui.menuMore'), v.madhab);
    const gap = 20, w = (W - 120 - gap) / 2, h = 112;
    v.prayers.forEach((p, i) => {
      const x = 60 + (i % 2) * (w + gap), y = 140 + Math.floor(i / 2) * (h + 18);
      this.btn(p.name, x, y, w, h, `prayer:${p.id}`, { size: 34, sub: `${t('ui.rakat', p.rakat)} · ${p.de}`, subSize: 24 });
    });
    this.text(t('ui.moreNote'), 60, H - 170, { size: 24, color: C.muted });
    this.btn(t('ui.back'), 60, H - 140, W - 120, 96, 'menu');
  }

  // Beschriftung auf der einen, Schalter auf der anderen Seite (in Arabisch gespiegelt)
  switchRow(y, label, sub, buttons) {
    const { W } = this;
    this.text(label, 60, y + 30, { size: 28, weight: 600 });
    if (sub) this.text(sub, 60, y + 60, { size: 22, color: C.muted });
    buttons.forEach(([text, action, active], i) => {
      const x = isRTL() ? 60 + i * 250 : W - 60 - (buttons.length - i) * 250 + 10;
      this.btn(text, x, y, 240, 70, action, { active });
    });
  }

  v_settings(v) {
    const { W, H } = this;
    this.heading(t('ui.settings'));
    const gap = 20, w = (W - 120 - gap * 3) / 4;
    this.text(t('ui.language'), 60, 150, { size: 28, weight: 600 });
    v.langs.forEach((l, i) => this.btn(l.name, 60 + i * (w + gap), 165, w, 68, `lang:${l.id}`, { active: l.id === v.lang }));
    this.text(t('ui.madhab'), 60, 280, { size: 28, weight: 600 });
    v.madhabs.forEach((m, i) => this.btn(m.name, 60 + i * (w + gap), 295, w, 68, `madhab:${m.id}`, { active: m.id === v.madhab.id }));
    this.text(t('ui.changes', v.madhab.name), 60, 405, { size: 26, color: C.gold, weight: 600 });
    this.paragraphs(v.madhab.notes.map((n) => `•  ${n}`), 440, { size: 23, gap: 0 });
    const row = (...a) => this.switchRow(...a);
    row(645, t('ui.guideFor'), '', [[t('ui.men'), 'gender:m', v.gender !== 'f'], [t('ui.women'), 'gender:f', v.gender === 'f']]);
    row(728, t('ui.beginner'), t('ui.beginnerSub'), [[v.beginner ? t('ui.on') : t('ui.off'), 'beginner', v.beginner]]);
    row(811, t('ui.spiritual'), t('ui.spiritualSub'), [[v.spiritual ? t('ui.on') : t('ui.off'), 'spiritual', v.spiritual]]);
    const third = (W - 120 - 40) / 3;
    this.btn(t('voice.btn'), 60, H - 98, third, 80, 'voice', { primary: true });
    this.btn(t('ui.info'), 60 + third + 20, H - 98, third, 80, 'info');
    this.btn(t('ui.back'), 60 + 2 * (third + 20), H - 98, third, 80, 'menu');
  }

  v_mosque(v) {
    const { W, H } = this;
    this.heading(t('ui.mosqueTitle'), t('ui.mosqueSub'));
    v.styles.forEach((st, i) => {
      this.btn(st.name, 60, 128 + i * 100, W - 120, 90, `style:${st.id}`, { size: 31, sub: st.de, subSize: 21, active: st.id === v.style });
    });
    this.paragraphs([t('ui.mosqueNote')], 548, { size: 20, color: C.muted, gap: 0 });
    // Cemaat: Gemeinschaftsgebet mit Imam
    const row = (...a) => this.switchRow(...a);
    row(585, t('ui.cemaat'), t('ui.cemaatTip'), [[v.cemaat ? t('ui.on') : t('ui.off'), 'cemaat', v.cemaat]]);
    row(662, t('ui.cemaatSize'), '', [[t('ui.small'), 'csize:small', v.size !== 'large'], [t('ui.large'), 'csize:large', v.size === 'large']]);
    row(739, t('ui.takt'), t('ui.taktSub'), [[t('ui.natural'), 'ctakt:natural', v.natural], [t('ui.sync'), 'ctakt:sync', !v.natural]]);
    row(816, t('gal.title'), t('gal.sub'), [[t('gal.screen'), 'women:screen', v.womenPlace !== 'gallery'], [t('gal.gallery'), 'women:gallery', v.womenPlace === 'gallery']]);
    this.btn(t('ui.back'), 60, H - 98, W - 120, 80, 'menu');
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
      const m = s.wudu ? { cue: `${s.cue} · ${s.count}×` } : moveFor(v.prevPose, s.pose);
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
