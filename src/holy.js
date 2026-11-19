// Heilige Tage und Nächte im islamischen Jahr: Daten (Umm-al-Qura-Kalender), Erinnerung und Kalenderdatei.
// Nächte (Kandil) beginnen am Abend vor dem Tag: die Nacht zum 27. Rajab ist der Abend des 26.
// Je nach Land und Mondsichtung (z. B. Diyanet) kann ein Datum um einen Tag abweichen.
import { t } from './i18n.js';
import { addDays, hijri, localYMD } from './ramadan.js';

// night: Nacht (Kandil) am Vorabend; regaib: Nacht zum ersten Freitag im Rajab
export const HOLY = [
  { id: 'hijri', m: 1, d: 1, icon: '🌙' },
  { id: 'ashura', m: 1, d: 10, icon: '💧' },
  { id: 'mevlid', m: 3, d: 12, night: true, icon: '🌹' },
  { id: 'regaib', m: 7, regaib: true, night: true, icon: '🕯️' },
  { id: 'mirac', m: 7, d: 27, night: true, icon: '✨' },
  { id: 'berat', m: 8, d: 15, night: true, icon: '🌕' },
  { id: 'ramadan', m: 9, d: 1, icon: '🌙' },
  { id: 'qadr', m: 9, d: 27, night: true, icon: '⭐' },
  { id: 'fitr', m: 10, d: 1, icon: '🎉' },
  { id: 'arafa', m: 12, d: 9, icon: '⛰️' },
  { id: 'adha', m: 12, d: 10, icon: '🐑' },
];
// Passende Gebete, Lobpreis und Bittgebete je Tag (Aktionen der App und Textschlüssel)
export const HOLY_LINKS = {
  hijri: { acts: ['tasbih'], duas: ['astaghfir'] },
  ashura: { acts: ['muharrem', 'tasbih'], duas: ['astaghfir'] },
  mevlid: { acts: ['prayer:tasbihp', 'prayer:tahajjud', 'stories'], duas: ['salawatShort', 'salawat'] },
  regaib: { acts: ['prayer:tasbihp', 'prayer:tawba', 'prayer:tahajjud'], duas: ['astaghfir', 'istighfar'] },
  mirac: { acts: ['prayer:tasbihp', 'prayer:tahajjud', 'prayer:isha'], duas: ['salawatShort', 'astaghfir'] },
  berat: { acts: ['prayer:tasbihp', 'prayer:tawba', 'prayer:tahajjud'], duas: ['istighfar', 'astaghfir'] },
  ramadan: { acts: ['ramadan', 'prayer:tarawih', 'prayer:witr'], duas: [] },
  qadr: { acts: ['prayer:tasbihp', 'prayer:tahajjud', 'prayer:tarawih'], duas: ['qadrDua', 'istighfar'] },
  fitr: { acts: ['prayer:eid', 'tasbih'], duas: ['tashriq'] },
  arafa: { acts: ['prayer:dhuhr', 'tasbih'], duas: ['tahlil', 'tashriq'] },
  adha: { acts: ['prayer:eid', 'tasbih'], duas: ['tashriq'] },
};

const dayDiff = (a, b) => Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 864e5);
const WEEKDAY = (g) => new Date(Date.UTC(g[0], g[1] - 1, g[2], 12)).getUTCDay();

// Alle Termine ab heute (bis zu ~13 Monate), sortiert. day = der Tag; eve = Abend, an dem die Nacht beginnt.
export function holyList(now = new Date(), timeZone = 'UTC', max = 400) {
  const today = localYMD(now, timeZone);
  const found = new Map();
  let rajabFri = null;
  for (let i = -1; i <= max; i++) {
    const g = addDays(today, i);
    const h = hijri(...g);
    for (const e of HOLY) {
      if (found.has(e.id)) continue;
      let hit = false;
      if (e.regaib) {
        // erster Freitag im Rajab
        if (h.m === 7 && h.d <= 7 && WEEKDAY(g) === 5 && rajabFri !== h.y) { rajabFri = h.y; hit = true; }
      } else hit = h.m === e.m && h.d === e.d;
      if (!hit) continue;
      const eve = e.night ? addDays(g, -1) : null;
      const start = eve || g;
      // Schon vorbei? (Der Tag selbst zählt noch, die Nacht bis zum Morgen danach)
      const days = dayDiff(today, start);
      if (days < (e.night ? -1 : 0)) continue;
      found.set(e.id, { ...e, day: g, eve, hy: h.y, days });
    }
    if (found.size === HOLY.length) break;
  }
  return [...found.values()].sort((a, b) => a.days - b.days);
}

/**
 * Erinnerung fällig? Nächte: am Tag des Vorabends ab 10 Uhr („heute Abend …“);
 * Tage: am Vortag ab 18 Uhr („morgen …“). Bis Mitternacht nachholbar. sent = Menge gemeldeter Schlüssel.
 */
export function dueHoly(now, timeZone, sent) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now));
  for (const e of holyList(now, timeZone, 3)) {
    const key = `holy|${e.id}|${e.hy}`;
    if (sent.has(key)) continue;
    if (e.night && e.days === 0 && hour >= 10) return { e, key, when: 'tonight' };
    if (!e.night && e.days === 1 && hour >= 18) return { e, key, when: 'tomorrow' };
  }
  return null;
}

export function holyText(e, when) {
  return { title: `${e.icon} ${t(`holy.${e.id}.name`)}`, body: `${t(`holy.${when}`)} ${t(`holy.${e.id}.short`)}` };
}

// Kalenderdatei: jeder Termin als ganztägiger Eintrag mit Erinnerung (Nacht: 10 Uhr am Vorabend, Tag: 18 Uhr am Vortag)
export function buildHolyIcs(now = new Date(), timeZone = 'UTC') {
  const ymd = (g) => g.map((v, i) => String(v).padStart(i ? 2 : 4, '0')).join('');
  const esc = (s) => String(s).replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NamazVR//Heilige Tage//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(t('holy.calName'))}`];
  for (const e of holyList(now, timeZone, 380)) {
    const start = e.eve || e.day;
    lines.push(
      'BEGIN:VEVENT', `UID:${e.id}-${e.hy}@namazvr`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(start)}`, `DTEND;VALUE=DATE:${ymd(addDays(start, 1))}`,
      `SUMMARY:${esc(`${e.icon} ${t(`holy.${e.id}.name`)}${e.night ? ` (${t('holy.nightShort')})` : ''}`)}`,
      `DESCRIPTION:${esc(t(`holy.${e.id}.short`))}`, 'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(t(`holy.${e.id}.name`))}`, `TRIGGER:${e.night ? 'PT10H' : '-PT6H'}`, 'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
