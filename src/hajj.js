// Umre- und Hac-Simulator: Schrittfolge, Wege (Tavaf, Sa'y) und Steinwürfe.
// Texte (Titel, Ansage, Anleitung) stehen in der Sprachdatei unter hajj.s.<id>; arabische Texte in prayer.js.
import { t } from './i18n.js';
import { IHRAM_PRAYER, TAWAF_PRAYER, buildSteps, text } from './prayer.js';
import { JAMARAT, MAQAM, SAY_L, GREEN, TAWAF_R } from './hajjworld.js';
import { buildAlevi, circleAt } from './alevi.js';

const TAU = Math.PI * 2;
const polar = (r, a) => ({ x: r * Math.cos(a), z: -r * Math.sin(a) });
// Platz mit Blick zur Kaaba (Mitte des Haram)
const facingKaaba = (p) => ({ ...p, hx: -p.x, hz: -p.z });

const PLACES = {
  arrive: facingKaaba(polar(32, 0.35)),
  start: facingKaaba(polar(TAWAF_R, 0)),
  maqam: facingKaaba({ x: MAQAM.x * 1.3, z: MAQAM.z * 1.3 }),
  zamzam: facingKaaba(polar(28.5, 1.0)),
  safa: { x: 2.5, z: 1, hx: -1, hz: 0 },
  marwa: { x: -2.5, z: -SAY_L + 1, hx: 0, hz: -1 },
  origin: { x: 0, z: 0, hx: 0, hz: -1 },
};
const jamraPlace = (i) => ({ x: 0, z: JAMARAT[i].z + 3, hx: 0, hz: -1 });

// Text eines Schritts; Einträge in der Sprachdatei sind [Titel, Ansage, Anleitung] oder eine Funktion (f, n)
function words(id, f, n) {
  const v = t(`hajj.s.${id}`, f, n);
  return Array.isArray(v) ? v : [id, '', ''];
}
const kidOf = (id) => { const v = t(`hajj.kid.${id}`); return v === `hajj.kid.${id}` ? '' : v; };

function step(id, { scene, place = PLACES.origin, pose = 'stand', dur = 12, txt = [], motion = null, f = false, n = 0, extra = {} }) {
  const [title, cue, instr] = words(id, f, n);
  const body = txt.length ? text(...txt) : { ar: [], tr: [], de: [] };
  return { hajj: true, id, title, cue, instr, pose, scene, place, motion, dur, rakah: 0, status: '', kid: kidOf(id), inner: '', ...body, ...extra };
}

// Weglänge und Dauer (bei durchschnittlichem Tempo) einer Bewegung
export function pathLength(m) {
  if (m.type === 'tawaf') return TAU * TAWAF_R * m.rounds;
  if (m.type === 'say') return SAY_L * m.laps;
  if (m.type === 'circle') return TAU * m.r * m.rounds;
  return 0;
}
const withDur = (s) => {
  if (s.motion?.type === 'throw') s.dur = s.motion.count * 2.4 + 4;
  else if (s.motion) s.dur = pathLength(s.motion) / 2.3 + 4;
  return s;
};

// Gebet als Teil des Ablaufs (gleiche Gebetsführung wie sonst), an einem festen Platz
function prayerAt(p, madhab, gender, sura, scene, place) {
  return buildSteps(p, madhab, gender, sura).map((s) => ({ ...s, scene, place }));
}

export function buildPilgrimage(kind, madhab = 'hanafi', gender = 'm', sura = 'ikhlas') {
  if (kind === 'cem' || kind === 'semah') return buildAlevi(kind);
  const f = gender === 'f';
  const out = [];
  const add = (id, o) => out.push(withDur(step(id, { f, ...o })));
  const tawafRounds = (id, raml) => {
    for (let n = 1; n <= 7; n++) add(id, { scene: 'haram', n, txt: ['dua'], motion: { type: 'tawaf', rounds: 1, from: (n - 1) * TAU, raml: raml && !f && n <= 3, round0: n - 1 } });
  };
  const sayLaps = (id) => {
    for (let n = 1; n <= 7; n++) add(id, { scene: 'masa', n, txt: ['sayDua'], motion: { type: 'say', laps: 1, lap0: n - 1, run: !f } });
  };
  if (kind === 'umre') {
    add('ihram', { scene: 'miqat', dur: 14 });
    add('forbid', { scene: 'miqat', dur: 16 });
    out.push(...prayerAt(IHRAM_PRAYER, madhab, gender, sura, 'miqat', PLACES.origin));
    add('niyyaU', { scene: 'miqat', pose: 'dua', txt: ['niyyaUmre'] });
    add('talbiya', { scene: 'miqat', pose: 'dua', txt: ['talbiya'], dur: 14 });
    add('arrive', { scene: 'haram', place: PLACES.arrive, pose: 'dua', dur: 14 });
    add('start', { scene: 'haram', place: PLACES.start, pose: 'istilam', txt: ['istilam'], dur: 10 });
    tawafRounds('round', true);
    add('maqam', { scene: 'haram', place: PLACES.maqam, txt: ['maqam'], dur: 10 });
    out.push(...prayerAt(TAWAF_PRAYER, madhab, gender, sura, 'haram', PLACES.maqam));
    add('zamzam', { scene: 'haram', place: PLACES.zamzam, pose: 'drink', txt: ['zamzam'] });
    add('safa', { scene: 'masa', place: PLACES.safa, pose: 'dua', txt: ['safa', 'tahlil'], dur: 16 });
    sayLaps('lap');
    add('halq', { scene: 'masa', place: PLACES.marwa, dur: 14 });
    add('endU', { scene: 'masa', place: PLACES.marwa, pose: 'dua', txt: ['dua'] });
    return out;
  }
  // Hac (Temettuʿ: die Umre ist schon gemacht)
  add('types', { scene: 'haram', place: PLACES.arrive, dur: 18 });
  add('ihramH', { scene: 'haram', place: PLACES.arrive, pose: 'dua', txt: ['niyyaHajj', 'talbiya'], dur: 16 });
  add('mina8', { scene: 'mina', dur: 14 });
  add('arafat', { scene: 'arafat', dur: 16 });
  add('wuquf', { scene: 'arafat', pose: 'dua', txt: ['tahlil', 'dua'], dur: 20 });
  add('muzdalifa', { scene: 'muzdalifa', dur: 14 });
  add('pebbles', { scene: 'muzdalifa', pose: 'pick', dur: 12 });
  add('muzWuquf', { scene: 'muzdalifa', pose: 'dua', txt: ['dua'], dur: 12 });
  add('aqaba', { scene: 'jamarat', place: jamraPlace(2), pose: 'throw', txt: ['jamra'], motion: { type: 'throw', count: 7, target: 2 } });
  add('kurban', { scene: 'mina', dur: 14 });
  add('halqH', { scene: 'mina', dur: 14 });
  add('ifada', { scene: 'haram', txt: ['dua'], motion: { type: 'tawaf', rounds: 7, from: 0, raml: !f, round0: 0 } });
  add('sayH', { scene: 'masa', txt: ['sayDua'], motion: { type: 'say', laps: 7, lap0: 0, run: !f } });
  add('j1', { scene: 'jamarat', place: jamraPlace(0), pose: 'throw', txt: ['jamra'], motion: { type: 'throw', count: 7, target: 0 } });
  add('j2', { scene: 'jamarat', place: jamraPlace(1), pose: 'throw', txt: ['jamra'], motion: { type: 'throw', count: 7, target: 1 } });
  add('j3', { scene: 'jamarat', place: jamraPlace(2), pose: 'throw', txt: ['jamra'], motion: { type: 'throw', count: 7, target: 2 } });
  add('day12', { scene: 'jamarat', place: jamraPlace(2), dur: 16 });
  add('tashriq', { scene: 'mina', txt: ['tashriq'], dur: 14 });
  add('wada', { scene: 'haram', txt: ['dua'], motion: { type: 'tawaf', rounds: 7, from: 0, round0: 0 } });
  add('endH', { scene: 'haram', place: PLACES.arrive, pose: 'dua', txt: ['dua'] });
  return out;
}

// Position und Blickrichtung (in Ortskoordinaten) nach d Metern Weg
export function pathAt(m, d) {
  if (m.type === 'circle') return circleAt(m, d);
  if (m.type === 'tawaf') {
    const a = m.from + d / TAWAF_R;
    return { x: TAWAF_R * Math.cos(a), z: -TAWAF_R * Math.sin(a), hx: -Math.sin(a), hz: -Math.cos(a) };
  }
  if (m.type === 'say') {
    const i = Math.min(m.laps - 1, Math.floor(d / SAY_L)), u = Math.min(SAY_L, d - i * SAY_L);
    const toMarwa = (m.lap0 + i) % 2 === 0;
    return toMarwa ? { x: 2.5, z: -u, hx: 0, hz: -1 } : { x: -2.5, z: -SAY_L + u, hx: 0, hz: 1 };
  }
  return null;
}

// Tempo (m/s): beim Raml und zwischen den grünen Lichtern gehen Männer schneller
export function speedAt(m, d) {
  if (m.type === 'circle') return m.fast ? 1.5 : 0.8;
  if (m.type === 'tawaf') return m.raml && d / (TAU * TAWAF_R) < 3 ? 2.8 : 2.2;
  if (m.type === 'say') {
    const u = (d % SAY_L) / SAY_L;
    return m.run && u > GREEN[0] && u < GREEN[1] ? 3.6 : 2.4;
  }
  return 0;
}

// Anzeige unten im Bewegungsfeld: Runde, Strecke oder Stein
export function statusOf(m, d, thrown) {
  if (!m) return '';
  if (m.type === 'tawaf') return t('hajj.roundOf', Math.min(7, m.round0 + Math.floor(d / (TAU * TAWAF_R)) + 1), 7);
  if (m.type === 'say') {
    const i = Math.min(m.laps - 1, Math.floor(d / SAY_L)), lap = m.lap0 + i;
    const u = (d % SAY_L) / SAY_L;
    const green = m.run && u > GREEN[0] && u < GREEN[1] ? ` · ${t('hajj.green')}` : '';
    return `${t('hajj.lapOf', lap + 1, 7)} · ${lap % 2 === 0 ? t('hajj.toMarwa') : t('hajj.toSafa')}${green}`;
  }
  if (m.type === 'throw') return t('hajj.stoneOf', Math.min(m.count, thrown), m.count);
  if (m.type === 'circle') return t('alevi.roundOf', Math.min(m.rounds, Math.floor(d / (TAU * m.r)) + 1), m.rounds);
  return '';
}

// Welche Orte gibt es (für die Auswahl der Umgebung)
export const isPilgrimage = (p) => ['umre', 'hajj', 'cem', 'semah', 'story'].includes(p?.kind);
export const isHajj = (p) => p?.kind === 'umre' || p?.kind === 'hajj';
