// Gebets-Tracker: welche der 5 Pflichtgebete an einem Tag gebetet wurden. Liegt im Fortschritt unter `log`.
import { langInfo } from './i18n.js';
import { PRAYERS } from './prayer.js';
import { dayKey } from './learn.js';

export const FARD = PRAYERS.map((p) => p.id);
export const TRACK_DAYS = 7; // so weit zurück kann man nachtragen

const shift = (n, now = new Date()) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

export const keyFor = (back = 0) => dayKey(shift(back));
export const prayedOn = (p, key) => p.log?.[key] || [];
export const dayDone = (p, key) => FARD.every((id) => prayedOn(p, key).includes(id));

// Gebet an einem Tag (0 = heute, 1 = gestern …) ab- oder anhaken. Ergebnis: Tag jetzt vollständig?
export function toggle(p, id, back = 0) {
  const key = dayKey(shift(back));
  const list = prayedOn(p, key);
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  p.log = { ...(p.log || {}), [key]: next };
  // Nur die letzten 60 Tage behalten
  const keys = Object.keys(p.log).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete p.log[k];
  return dayDone(p, key);
}

// Nach einem geführten Pflichtgebet: heute als gebetet markieren (nie wieder entfernen)
export function markPrayed(p, id) {
  if (!FARD.includes(id)) return false;
  const key = dayKey();
  if (prayedOn(p, key).includes(id)) return false;
  p.log = { ...(p.log || {}), [key]: [...prayedOn(p, key), id] };
  return dayDone(p, key);
}

// Tage in Folge mit allen 5 Gebeten (bis heute oder gestern)
export function fullStreak(p) {
  let n = 0, i = dayDone(p, dayKey()) ? 0 : 1;
  while (dayDone(p, dayKey(shift(i)))) { n++; i++; }
  return n;
}

// Woche für die Übersicht, ältester Tag zuerst
export function week(p, now = new Date()) {
  const wd = new Intl.DateTimeFormat(langInfo().locale, { weekday: 'short' });
  return Array.from({ length: TRACK_DAYS }, (_, k) => {
    const back = TRACK_DAYS - 1 - k, d = shift(back, now), key = dayKey(d);
    return { back, key, label: wd.format(d), date: `${d.getDate()}.${d.getMonth() + 1}.`, prayed: prayedOn(p, key), done: dayDone(p, key) };
  });
}
