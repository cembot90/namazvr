// Erinnerung zur Gebetszeit: Benachrichtigung (solange die Web-App läuft) und Kalender-Export (.ics, mit Alarm),
// der auf jedem Handy zuverlässig erinnert – auch wenn NamazVR geschlossen ist. Kein Server nötig.
import { t } from './i18n.js';
import { TIME_NAMES, computeTimes, formatTime } from './prayertimes.js';

export const BEFORE = [0, 5, 10, 15, 30];
const PRAYER_IDS = TIME_NAMES.filter((n) => n.prayer).map((n) => n.id);
const nameOf = (id) => TIME_NAMES.find((n) => n.id === id).name;

export const canNotify = () => typeof window !== 'undefined' && 'Notification' in window;

export async function askPermission() {
  if (!canNotify()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return Notification.permission;
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

export async function notify(title, body) {
  if (!canNotify() || Notification.permission !== 'granted') return false;
  const opt = { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: title };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.showNotification(title, opt); return true; }
  } catch { /* weiter mit der einfachen Variante */ }
  try { new Notification(title, opt); return true; } catch { return false; }
}

/**
 * Fällige Erinnerung? Prüft einmal pro Minute; sent = Menge bereits gemeldeter Schlüssel „Tag|Gebet“.
 * @returns {{ id, at, key } | null}
 */
export function dueReminder(loc, now, method, asr, before, sent) {
  const { times } = computeTimes(loc, now, method, asr);
  for (const id of PRAYER_IDS) {
    const at = times[id];
    const fire = at.getTime() - before * 60000;
    const key = `${at.toISOString().slice(0, 10)}|${id}`;
    // Bis zu 2 Minuten Verspätung zulassen (Tab im Hintergrund)
    if (now.getTime() >= fire && now.getTime() < fire + 120000 && !sent.has(key)) return { id, at, key };
  }
  return null;
}

export function reminderText(id, at, before, timeZone) {
  return { title: t('rem.title2', nameOf(id), formatTime(at, timeZone)), body: t('rem.body', before) };
}

// Kalenderdatei mit den 5 Gebeten der nächsten `days` Tage, jeweils mit Alarm `before` Minuten vorher
export function buildIcs(loc, method, asr, before = 10, days = 30, now = new Date()) {
  const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s) => String(s).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NamazVR//Gebetszeiten//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc('NamazVR')}`];
  for (let i = 0; i < days; i++) {
    const day = new Date(now.getTime() + i * 864e5);
    const { times } = computeTimes(loc, day, method, asr);
    for (const id of PRAYER_IDS) {
      const at = times[id];
      if (Number.isNaN(at.getTime()) || at < now) continue;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${stamp(at)}-${id}@namazvr`,
        `DTSTAMP:${stamp(now)}`,
        `DTSTART:${stamp(at)}`,
        'DURATION:PT15M',
        `SUMMARY:${esc(t('rem.calTitle', nameOf(id)))}`,
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${esc(t('rem.body', before))}`,
        `TRIGGER:-PT${before}M`,
        'END:VALARM',
        'END:VEVENT',
      );
    }
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(text) {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'namazvr-gebetszeiten.ics';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
