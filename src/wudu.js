// Gebetswaschung (Wuḍūʾ) Schritt für Schritt. Pflichten nach Koran 5:6; Details je Rechtsschule vereinfacht.
import { t } from './i18n.js';
import { text } from './prayer.js';

export const WUDU = { id: 'wudu', kind: 'wudu', get name() { return t('pn.wudu'); } };

// [Körperteil, Haltung der Figur, Anzahl, Pflicht?] – Titel, Ansage und Anleitung stehen in der Sprachdatei (wudu.steps).
const WUDU_PARTS = [
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
// Ghusl: Pflicht ist, dass Wasser den ganzen Körper erreicht (Ḥanafī: auch Mund und Nase ausspülen)
const GHUSL_PARTS = [
  ['heart', 'stand', 1, (m) => m !== 'hanafi'],
  ['hands', 'wash', 3, () => false],
  ['private', 'wash', 1, () => false],
  ['wuduAll', 'face', 1, () => false],
  ['mouth', 'face', 3, (m) => m === 'hanafi' || m === 'hanbali'],
  ['nose', 'face', 3, (m) => m === 'hanafi' || m === 'hanbali'],
  ['headPour', 'head', 3, () => true],
  ['sideR', 'wash', 3, () => false],
  ['sideL', 'wash', 3, () => false],
  ['body', 'wash', 1, () => true],
  ['heart', 'stand', 1, () => false],
];
// Tayammum: mit reiner Erde oder Stein, wenn kein Wasser da ist oder Wasser schaden würde
const TAYAMMUM_PARTS = [
  ['heart', 'stand', 1, () => true],
  ['strike', 'pick', 1, () => true],
  ['dust', 'stand', 1, () => false],
  ['tFace', 'face', 1, () => true],
  ['strike2', 'pick', 1, (m) => m === 'hanafi' || m === 'shafii'],
  ['tArmR', 'wash', 1, () => true],
  ['tArmL', 'wash', 1, () => true],
  ['heart', 'stand', 1, () => false],
];
// Eigene, detaillierte Bewegung je Körperteil (figure.js: POSES und CYCLES)
const DETAIL = { hands: 'wHands', mouth: 'wMouth', nose: 'wNose', face: 'wFace', armR: 'wArmR', armL: 'wArmL', head: 'wHead', ears: 'wEars', footR: 'wFootR', footL: 'wFootL', tFace: 'wFace', tArmR: 'wArmR', tArmL: 'wArmL' };
const PARTS_OF = { wudu: WUDU_PARTS, ghusl: GHUSL_PARTS, tayammum: TAYAMMUM_PARTS };

export function buildWuduSteps(madhab = 'hanafi', variant = 'wudu') {
  const PARTS = PARTS_OF[variant] || WUDU_PARTS;
  const texts = t(variant === 'wudu' ? 'wudu.steps' : `pure.${variant}.steps`);
  return PARTS.map(([part, pose, count, fard], i) => {
    const [title, cue, instr] = texts[i];
    const step = { title, cue, instr, pose: DETAIL[part] || pose, wudu: part, variant, count, fard: fard(madhab), rakah: 0, dur: count * 4 + 4, ar: [], tr: [], de: [] };
    if (i === 0) {
      const b = text('basmala');
      Object.assign(step, b, { de: [...b.de, t(variant === 'wudu' ? `wudu.general.${madhab}` : `pure.${variant}.when`)] });
    } else if (part === 'head' && variant === 'wudu') step.de = [t(`wudu.head.${madhab}`)];
    else if (part === 'strike2') step.de = [t(`pure.tayammum.second.${madhab}`)];
    else if (i === PARTS.length - 1) Object.assign(step, text('shahada'), { key: 'shahada' });
    return step;
  });
}

// Körper von vorn im Spiegelbild: Die rechte Körperseite ist rechts zu sehen.
const J = {
  head: [0.5, 0.15], shR: [0.61, 0.3], shL: [0.39, 0.3], elR: [0.69, 0.45], elL: [0.31, 0.45], haR: [0.72, 0.6], haL: [0.28, 0.6],
  hipR: [0.55, 0.58], hipL: [0.45, 0.58], knR: [0.56, 0.77], knL: [0.44, 0.77], anR: [0.56, 0.93], anL: [0.44, 0.93], toR: [0.62, 0.96], toL: [0.38, 0.96],
};

export function drawBody(ctx, part, x, y, size, { color = 'rgba(207,216,227,0.55)', water: waterColor = '#6fc3e8', gold = '#e6c77f' } = {}) {
  // Tayammum: Erde statt Wasser
  const earth = ['strike', 'strike2', 'dust', 'tFace', 'tArmR', 'tArmL'].includes(part);
  const water = earth ? '#c9a26b' : waterColor;
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
    case 'hands': case 'dust': dot('haR', 0.05, water); dot('haL', 0.05, water); break;
    case 'strike': case 'strike2':
      dot('haR', 0.05, water); dot('haL', 0.05, water);
      ctx.fillStyle = water; ctx.fillRect(x + 0.2 * size, y + 0.985 * size, 0.6 * size, 0.012 * size);
      break;
    case 'tFace': dot('head', 0.075, water); break;
    case 'tArmR': line(['haR', 'elR'], water, hw); dot('haR', 0.045, water); break;
    case 'tArmL': line(['haL', 'elL'], water, hw); dot('haL', 0.045, water); break;
    case 'private': dot('hipR', 0.045, water); dot('hipL', 0.045, water); break;
    case 'wuduAll':
      dot('head', 0.075, water);
      line(['haR', 'elR'], water, hw); line(['haL', 'elL'], water, hw);
      line(['anR', 'toR'], water, hw); line(['anL', 'toL'], water, hw);
      break;
    case 'headPour':
      dot('head', 0.09, water);
      ctx.strokeStyle = water; ctx.lineWidth = size * 0.012;
      for (const dx of [-0.05, 0, 0.05]) { ctx.beginPath(); ctx.moveTo(hx + dx * size, hy - 0.2 * size); ctx.lineTo(hx + dx * size, hy - 0.12 * size); ctx.stroke(); }
      break;
    case 'sideR': case 'sideL': {
      const s = part === 'sideR' ? 'R' : 'L';
      line([`sh${s}`, `el${s}`, `ha${s}`], water, hw); line([`hip${s}`, `kn${s}`, `an${s}`, `to${s}`], water, hw);
      ctx.fillStyle = water; ctx.beginPath();
      ctx.roundRect(x + (s === 'R' ? 0.5 : 0.4) * size, y + 0.27 * size, 0.1 * size, 0.33 * size, 0.03 * size); ctx.fill();
      break;
    }
    case 'body':
      ctx.fillStyle = water; ctx.beginPath(); ctx.roundRect(x + 0.4 * size, y + 0.27 * size, 0.2 * size, 0.33 * size, 0.04 * size); ctx.fill();
      for (const s of ['R', 'L']) { line([`sh${s}`, `el${s}`, `ha${s}`], water, hw); line([`hip${s}`, `kn${s}`, `an${s}`, `to${s}`], water, hw); }
      dot('head', 0.085, water);
      break;
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
