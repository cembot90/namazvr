// Gebetszeiten aus dem Sonnenstand (Verfahren wie praytimes.org), komplett offline.
// Alle Zeiten werden zuerst in UTC-Stunden berechnet und dann in der Zeitzone des Ortes angezeigt.

export const METHODS = [
  { id: 'mwl', name: 'Muslim World League', fajr: 18, isha: 17 },
  { id: 'diyanet', name: 'Diyanet (Näherung)', fajr: 18, isha: 17, maghribOffset: 7, sunriseOffset: -7, dhuhrOffset: 5 },
  { id: 'isna', name: 'ISNA (Nordamerika)', fajr: 15, isha: 15 },
  { id: 'egypt', name: 'Ägypten', fajr: 19.5, isha: 17.5 },
  { id: 'makkah', name: 'Umm al-Qura (Mekka)', fajr: 18.5, ishaMinutes: 90 },
];

export const ASR = [
  { id: 'standard', name: 'Standard (Shāfiʿī, Mālikī, Ḥanbalī)', factor: 1 },
  { id: 'hanafi', name: 'Ḥanafī', factor: 2 },
];

export const TIME_NAMES = [
  { id: 'fajr', name: 'Fajr', prayer: true },
  { id: 'sunrise', name: 'Sonnenaufgang', prayer: false },
  { id: 'dhuhr', name: 'Dhuhr', prayer: true },
  { id: 'asr', name: 'Asr', prayer: true },
  { id: 'maghrib', name: 'Maghrib', prayer: true },
  { id: 'isha', name: 'Isha', prayer: true },
];

const rad = (d) => d * Math.PI / 180;
const deg = (r) => r * 180 / Math.PI;
const fix = (a, b) => ((a % b) + b) % b;

function sunPosition(jd) {
  const d = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * d, 360);
  const q = fix(280.459 + 0.98564736 * d, 360);
  const l = fix(q + 1.915 * Math.sin(rad(g)) + 0.020 * Math.sin(rad(2 * g)), 360);
  const e = 23.439 - 0.00000036 * d;
  const ra = deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(l)), Math.cos(rad(l)))) / 15;
  return { decl: deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(l)))), eqt: q / 15 - fix(ra, 24) };
}

function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

// Kalenderdatum „heute“ in der Zeitzone des Ortes.
function localDate(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return [get('year'), get('month'), get('day')];
}

/**
 * @returns {{ times: Record<string, Date>, highLatitude: boolean }}
 */
export function computeTimes({ lat, lon, timeZone }, date = new Date(), methodId = 'mwl', asrId = 'standard') {
  const method = METHODS.find((m) => m.id === methodId) || METHODS[0];
  const asrFactor = (ASR.find((a) => a.id === asrId) || ASR[0]).factor;
  const [y, m, d] = localDate(date, timeZone);
  const jd0 = julian(y, m, d);

  // UTC-Stunde, zu der die Sonne den Winkel `angle` unter dem Horizont erreicht (vor bzw. nach Mittag).
  const noon = (t) => fix(12 - lon / 15 - sunPosition(jd0 + t / 24).eqt, 24);
  const angleTime = (angle, t, ccw) => {
    const { decl } = sunPosition(jd0 + t / 24);
    const cos = (-Math.sin(rad(angle)) - Math.sin(rad(lat)) * Math.sin(rad(decl))) / (Math.cos(rad(lat)) * Math.cos(rad(decl)));
    const h = deg(Math.acos(cos)) / 15; // NaN, wenn die Sonne den Winkel nie erreicht
    return noon(t) + (ccw ? -h : h);
  };
  const asrTime = (t) => {
    const { decl } = sunPosition(jd0 + t / 24);
    const angle = -deg(Math.atan(1 / (asrFactor + Math.tan(rad(Math.abs(lat - decl))))));
    return angleTime(angle, t, false);
  };

  // Zwei Durchläufe: erst mit Schätzwerten, dann mit dem Sonnenstand zur jeweiligen Zeit.
  const lonShift = -lon / 15;
  let t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
  for (let pass = 0; pass < 2; pass++) {
    const at = (k) => t[k] + (pass === 0 ? lonShift : 0);
    t = {
      fajr: angleTime(method.fajr, at('fajr'), true),
      sunrise: angleTime(0.833, at('sunrise'), true),
      dhuhr: noon(at('dhuhr')),
      asr: asrTime(at('asr')),
      sunset: angleTime(0.833, at('sunset'), false),
      isha: method.isha != null ? angleTime(method.isha, at('isha'), false) : NaN,
    };
  }

  // Hohe Breiten (z. B. Norddeutschland im Sommer): Winkel-Anteil der Nacht.
  const night = 24 - (t.sunset - t.sunrise);
  let highLatitude = false;
  const fajrLimit = (method.fajr / 60) * night;
  if (Number.isNaN(t.fajr) || t.sunrise - t.fajr > fajrLimit) { t.fajr = t.sunrise - fajrLimit; highLatitude = true; }
  if (method.ishaMinutes) t.isha = t.sunset + method.ishaMinutes / 60;
  else {
    const ishaLimit = (method.isha / 60) * night;
    if (Number.isNaN(t.isha) || t.isha - t.sunset > ishaLimit) { t.isha = t.sunset + ishaLimit; highLatitude = true; }
  }

  const minutes = { sunrise: method.sunriseOffset || 0, dhuhr: method.dhuhrOffset || 1, maghrib: method.maghribOffset || 0 };
  const hours = {
    fajr: t.fajr,
    sunrise: t.sunrise + minutes.sunrise / 60,
    dhuhr: t.dhuhr + minutes.dhuhr / 60,
    asr: t.asr,
    maghrib: t.sunset + minutes.maghrib / 60,
    isha: t.isha,
  };
  const base = Date.UTC(y, m - 1, d);
  const times = {};
  for (const [k, h] of Object.entries(hours)) times[k] = new Date(base + Math.round(h * 60) * 60000);
  return { times, highLatitude };
}

export function formatTime(date, timeZone) {
  return new Intl.DateTimeFormat('de-DE', { timeZone, hour: '2-digit', minute: '2-digit' }).format(date);
}

// Laufendes Gebet (seit dessen Beginn) und nächstes Gebet; nach Isha ist Fajr von morgen das nächste.
export function prayerStatus(loc, now, methodId, asrId) {
  const today = computeTimes(loc, now, methodId, asrId);
  const order = TIME_NAMES.filter((n) => n.prayer).map((n) => n.id);
  let current = null, next = null;
  for (const id of order) {
    if (today.times[id] <= now) current = id;
    else if (!next) next = { id, at: today.times[id] };
  }
  if (!next) {
    const tomorrow = computeTimes(loc, new Date(now.getTime() + 864e5), methodId, asrId);
    next = { id: 'fajr', at: tomorrow.times.fajr };
  }
  // Vor Fajr läuft noch Isha vom Vortag.
  if (!current) current = 'isha';
  return { ...today, current, next };
}

export function formatCountdown(ms) {
  const min = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h} Std. ${m} Min.` : `${m} Min.`;
}
