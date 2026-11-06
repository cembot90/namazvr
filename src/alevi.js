// Alevilik – Entwurf zum Kennenlernen: Rundgang durch ein Cemevi, Semah zum Mitmachen, Muharrem und Aşure, Werte.
// Bräuche unterscheiden sich je nach Ocak und Region; Texte in der Sprachdatei unter alevi.*.
import { t } from './i18n.js';
import { MEYDAN } from './hajjworld.js';
import { hijri } from './ramadan.js';

const TAU = Math.PI * 2;
const at = (x, z, hx, hz) => ({ x, z, hx, hz });
// Blick zur Mitte des Meydan von einem Platz aus
const toMeydan = (x, z) => at(x, z, MEYDAN.x - x, MEYDAN.z - z);

function words(id, n) {
  const v = t(`alevi.s.${id}`, n);
  return Array.isArray(v) ? v : [id, '', ''];
}
const kidOf = (id) => { const v = t(`alevi.kid.${id}`); return v === `alevi.kid.${id}` ? '' : v; };

function step(id, { place = at(0, 0, 0, -1), pose = 'stand', dur = 14, motion = null, n = 0, extra = {} }) {
  const [title, cue, instr] = words(id, n);
  return { hajj: true, id, title, cue, instr, pose, scene: 'cemevi', place, motion, dur, rakah: 0, status: '', kid: kidOf(id), inner: '', ar: [], tr: [], de: [], ...extra };
}

// Rundgang durch das Cemevi
function cemTour() {
  return [
    step('cemevi', { place: at(0, 6, 0, -1), dur: 14 }),
    step('niyaz', { place: at(0, 3.2, 0, -1), pose: 'niyaz', dur: 12 }),
    step('meydan', { place: toMeydan(0, 0.2), dur: 14 }),
    step('dede', { place: at(0, MEYDAN.z - 1.6, 0, -1), dur: 16 }),
    step('cerag', { place: at(0.9, MEYDAN.z - 1.9, 0.4, -1), dur: 14 }),
    step('zakir', { place: at(-0.6, MEYDAN.z - 1.9, -0.6, -1), dur: 14 }),
    step('hizmet', { place: toMeydan(2.6, 0.4), dur: 22 }),
    step('gorgu', { place: toMeydan(-2.6, 0.4), dur: 18 }),
    step('lokma', { place: toMeydan(0, 0.6), dur: 14 }),
    step('cemEnd', { place: at(0, 3.2, 0, -1), pose: 'niyaz', dur: 10 }),
  ];
}

// Semah: Niyaz, langsamer Teil (Ağırlama), schneller Teil (Yeldirme), Niyaz
function semahSteps() {
  const r = MEYDAN.r + 0.8; // du gehst außen, die Semah-Gruppe innen
  const circle = (rounds, fast, from) => ({ type: 'circle', rounds, fast, from, r, cx: MEYDAN.x, cz: MEYDAN.z });
  const p0 = { x: MEYDAN.x + r, z: MEYDAN.z };
  return [
    step('semahIntro', { place: toMeydan(p0.x, p0.z), pose: 'niyaz', dur: 14 }),
    step('agirlama', { pose: 'semah', motion: circle(2, false, 0), extra: { semah: 1 } }),
    step('yeldirme', { pose: 'semahFast', motion: circle(3, true, 0), extra: { semah: 2 } }),
    step('semahEnd', { place: toMeydan(p0.x, p0.z), pose: 'niyaz', dur: 10 }),
  ].map((s) => (s.motion ? { ...s, dur: (TAU * r * s.motion.rounds) / (s.motion.fast ? 1.5 : 0.8) + 3 } : s));
}

export const buildAlevi = (kind) => (kind === 'semah' ? semahSteps() : cemTour());

// Bewegung im Kreis um den Meydan (gegen den Uhrzeigersinn)
export function circleAt(m, d) {
  const a = m.from + d / m.r;
  return { x: m.cx + m.r * Math.cos(a), z: m.cz - m.r * Math.sin(a), hx: -Math.sin(a), hz: -Math.cos(a) };
}

// Muharrem: Tage bis zum 1. Muharrem bzw. Fastentag (12 Tage) – Beginn je nach Gemeinde (oft 20 Tage nach dem Kurban Bayramı)
export function muharremInfo(now = new Date(), timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (k) => Number(parts.find((p) => p.type === k).value);
  const today = [get('year'), get('month'), get('day')];
  const h = hijri(...today);
  if (h.m === 1 && h.d <= 12) return { inFast: true, day: h.d, hijriYear: h.y };
  for (let i = 1; i < 400; i++) {
    const d = new Date(Date.UTC(today[0], today[1] - 1, today[2] + i, 12));
    const g = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
    const x = hijri(...g);
    if (x.m === 1 && x.d === 1) return { inFast: false, days: i, date: g, hijriYear: x.y };
  }
  return { inFast: false, days: null };
}

// Werte: kurze Sätze aus der alevitisch-bektaşischen Überlieferung
export const SAYINGS = 7;
