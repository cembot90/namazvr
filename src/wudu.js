// Gebetswaschung (Wuḍūʾ) Schritt für Schritt. Pflichten nach Koran 5:6; Details je Rechtsschule vereinfacht.
import { t } from './i18n.js';
import { text } from './prayer.js';

export const WUDU = { id: 'wudu', kind: 'wudu', get name() { return t('pn.wudu'); } };

// [Körperteil, Haltung der Figur, Anzahl, Pflicht?] – Titel, Ansage und Anleitung stehen in der Sprachdatei (wudu.steps).
const PARTS = [
  ['heart', 'stand', 1, (m) => m !== 'hanafi'],
  ['hands', 'wash', 3, () => false],
  ['mouth', 'face', 3, (m) => m === 'hanbali'],
  ['nose', 'face', 3, (m) => m === 'hanbali'],
  ['face', 'face', 3, () => true],
  ['armR', 'wash', 3, () => true],
  ['armL', 'wash', 3, () => true],
  ['head', 'head', 1, () => true],
  ['ears', 'head', 1, (m) => m === 'hanbali'],
  ['footR', 'footWash', 3, () => true],
  ['footL', 'footWash', 3, () => true],
  ['heart', 'stand', 1, () => false],
];

export function buildWuduSteps(madhab = 'hanafi') {
  const texts = t('wudu.steps');
  return PARTS.map(([part, pose, count, fard], i) => {
    const [title, cue, instr] = texts[i];
    const step = { title, cue, instr, pose, wudu: part, count, fard: fard(madhab), rakah: 0, dur: count * 4 + 4, ar: [], tr: [], de: [] };
    if (i === 0) {
      const b = text('basmala');
      Object.assign(step, b, { de: [...b.de, t(`wudu.general.${madhab}`)] });
    } else if (part === 'head') step.de = [t(`wudu.head.${madhab}`)];
    else if (i === PARTS.length - 1) Object.assign(step, text('shahada'), { key: 'shahada' });
    return step;
  });
}

// Körper von vorn im Spiegelbild: Die rechte Körperseite ist rechts zu sehen.
const J = {
  head: [0.5, 0.15], shR: [0.61, 0.3], shL: [0.39, 0.3], elR: [0.69, 0.45], elL: [0.31, 0.45], haR: [0.72, 0.6], haL: [0.28, 0.6],
  hipR: [0.55, 0.58], hipL: [0.45, 0.58], knR: [0.56, 0.77], knL: [0.44, 0.77], anR: [0.56, 0.93], anL: [0.44, 0.93], toR: [0.62, 0.96], toL: [0.38, 0.96],
};

export function drawBody(ctx, part, x, y, size, { color = 'rgba(207,216,227,0.55)', water = '#6fc3e8', gold = '#e6c77f' } = {}) {
  const P = (k) => [x + J[k][0] * size, y + J[k][1] * size];
  const line = (keys, c, w) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    keys.forEach((k, i) => (i ? ctx.lineTo(...P(k)) : ctx.moveTo(...P(k))));
    ctx.stroke();
  };
  const dot = (k, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(...P(k), r * size, 0, Math.PI * 2); ctx.fill(); };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const w = size * 0.045, hw = size * 0.07;
  // Rumpf und Glieder
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 0.4 * size, y + 0.27 * size, 0.2 * size, 0.33 * size, 0.04 * size);
  ctx.fill();
  line(['shR', 'elR', 'haR'], color, w);
  line(['shL', 'elL', 'haL'], color, w);
  line(['hipR', 'knR', 'anR', 'toR'], color, w);
  line(['hipL', 'knL', 'anL', 'toL'], color, w);
  dot('head', 0.085, color);

  const hx = x + J.head[0] * size, hy = y + J.head[1] * size;
  switch (part) {
    case 'hands': dot('haR', 0.05, water); dot('haL', 0.05, water); break;
    case 'armR': line(['haR', 'elR'], water, hw); dot('elR', 0.04, water); dot('haR', 0.045, water); break;
    case 'armL': line(['haL', 'elL'], water, hw); dot('elL', 0.04, water); dot('haL', 0.045, water); break;
    case 'footR': line(['anR', 'toR'], water, hw); break;
    case 'footL': line(['anL', 'toL'], water, hw); break;
    case 'face': dot('head', 0.075, water); break;
    case 'mouth':
      ctx.strokeStyle = water; ctx.lineWidth = size * 0.022;
      ctx.beginPath(); ctx.arc(hx, hy + 0.02 * size, 0.035 * size, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      break;
    case 'nose':
      ctx.strokeStyle = water; ctx.lineWidth = size * 0.022;
      ctx.beginPath(); ctx.moveTo(hx, hy - 0.03 * size); ctx.lineTo(hx, hy + 0.015 * size); ctx.stroke();
      break;
    case 'head':
      ctx.strokeStyle = water; ctx.lineWidth = size * 0.03;
      ctx.beginPath(); ctx.arc(hx, hy, 0.095 * size, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke();
      break;
    case 'ears':
      ctx.fillStyle = water;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + s * 0.09 * size, hy, 0.025 * size, 0, Math.PI * 2); ctx.fill(); }
      break;
    default: {
      // Herz für Absicht und Bittgebet
      const cx = x + 0.5 * size, cy = y + 0.38 * size, r = 0.035 * size;
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 1.6);
      ctx.bezierCurveTo(cx - r * 2.2, cy, cx - r * 1.1, cy - r * 1.4, cx, cy - r * 0.4);
      ctx.bezierCurveTo(cx + r * 1.1, cy - r * 1.4, cx + r * 2.2, cy, cx, cy + r * 1.6);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(207,216,227,0.7)';
  ctx.font = `600 ${Math.round(size * 0.07)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(t('wudu.R'), x + 0.86 * size, y + 0.3 * size);
  ctx.fillText(t('wudu.L'), x + 0.14 * size, y + 0.3 * size);
  ctx.restore();
}
