// Ramadan: islamisches Datum (Umm-al-Qura-Kalender), Countdown bis Ramadan und Fest, Sahur- und Iftar-Zeit.
// Der tatsächliche Beginn hängt in vielen Ländern von der Mondsichtung ab und kann um einen Tag abweichen.
import { getLang, langInfo } from './i18n.js';
import { computeTimes } from './prayertimes.js';

const DAY = 864e5;

// Tabellarischer islamischer Kalender als Rückfall, falls der Browser Umm al-Qura nicht kennt
function tabular(date) {
  let l = Math.round(date.getTime() / DAY + 2440587.5) - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const m = Math.floor((24 * l) / 709);
  return { y: 30 * n + j - 30, m, d: l - Math.floor((709 * m) / 24) };
}

let fmt = null;
function umalqura() {
  if (fmt === null) {
    try {
      const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric', numberingSystem: 'latn' });
      fmt = f.resolvedOptions().calendar === 'islamic-umalqura' ? f : false;
    } catch { fmt = false; }
  }
  return fmt;
}

// Islamisches Datum zu einem Kalendertag (y, m, d gregorianisch, Mittag UTC)
export function hijri(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const f = umalqura();
  if (!f) return tabular(date);
  const parts = f.formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

// Heutiges Datum (am Ort) als [y, m, d]
function localYMD(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return [get('year'), get('month'), get('day')];
}

const addDays = ([y, m, d], n) => {
  const x = new Date(Date.UTC(y, m - 1, d + n, 12));
  return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()];
};

// Erster Tag (gregorianisch) ab `from`, an dem das islamische Datum Monat `hm`, Tag `hd` ist
function findNext(from, hm, hd, max = 400) {
  for (let i = 0; i <= max; i++) {
    const g = addDays(from, i);
    const h = hijri(...g);
    if (h.m === hm && h.d === hd) return { g, days: i, h };
  }
  return null;
}

// Datum in der Sprache der App, z. B. „Montag, 8. Februar 2027“
export function formatDay([y, m, d]) {
  return new Intl.DateTimeFormat(langInfo().locale, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(Date.UTC(y, m - 1, d, 12)));
}

// Islamisches Datum ausgeschrieben, z. B. „24. Jumada I 1448“; in Arabisch mit arabischen Monatsnamen
export function formatHijri([y, m, d]) {
  try {
    const loc = getLang() === 'ar' ? 'ar-SA' : langInfo().locale;
    return new Intl.DateTimeFormat(`${loc}-u-ca-islamic-umalqura`, { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn' })
      .format(new Date(Date.UTC(y, m - 1, d, 12)));
  } catch {
    const h = hijri(y, m, d);
    return `${h.d}.${h.m}.${h.y}`;
  }
}

/**
 * Alles für die Ramadan-Ansicht.
 * @returns {{ today, hijriToday, inRamadan, day?, length?, start?, eid?, fajr?, maghrib?, nextSahur? }}
 */
export function ramadanInfo(loc, now = new Date(), method = 'mwl', asr = 'standard') {
  const today = localYMD(now, loc.timeZone);
  const h = hijri(...today);
  const info = { today, hijriToday: formatHijri(today), inRamadan: h.m === 9 };
  if (info.inRamadan) {
    const eid = findNext(today, 10, 1, 31);
    info.day = h.d;
    info.length = eid ? h.d + eid.days - 1 : 30;
    info.eid = eid && { date: eid.g, days: eid.days };
    const { times } = computeTimes(loc, now, method, asr);
    info.fajr = times.fajr;
    info.maghrib = times.maghrib;
    // Nach dem Iftar: Sahur des nächsten Tages
    info.nextSahur = now >= times.fajr ? computeTimes(loc, new Date(now.getTime() + DAY), method, asr).times.fajr : times.fajr;
    info.lastTen = h.d >= 20;
  } else {
    const start = findNext(today, 9, 1);
    info.start = start && { date: start.g, days: start.days, year: start.h.y };
    // Nach Ramadan: Festtag noch anzeigen
    if (h.m === 10 && h.d <= 3) info.eidToday = h.d;
  }
  return info;
}
