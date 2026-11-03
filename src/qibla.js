// Qibla-Richtung: Großkreis-Peilung vom Standort zur Kaaba, in Grad im Uhrzeigersinn ab Norden.
const KAABA = { lat: 21.422487, lon: 39.826206 };

export const CITIES = [
  { name: 'Berlin', lat: 52.520, lon: 13.405, timeZone: 'Europe/Berlin' },
  { name: 'Hamburg', lat: 53.551, lon: 9.993, timeZone: 'Europe/Berlin' },
  { name: 'München', lat: 48.137, lon: 11.575, timeZone: 'Europe/Berlin' },
  { name: 'Köln', lat: 50.938, lon: 6.960, timeZone: 'Europe/Berlin' },
  { name: 'Frankfurt', lat: 50.110, lon: 8.682, timeZone: 'Europe/Berlin' },
  { name: 'Stuttgart', lat: 48.776, lon: 9.183, timeZone: 'Europe/Berlin' },
  { name: 'Wien', lat: 48.208, lon: 16.373, timeZone: 'Europe/Vienna' },
  { name: 'Zürich', lat: 47.377, lon: 8.541, timeZone: 'Europe/Zurich' },
  { name: 'Istanbul', lat: 41.008, lon: 28.978, timeZone: 'Europe/Istanbul' },
];

export function qiblaBearing(lat, lon) {
  const r = Math.PI / 180;
  const p1 = lat * r, p2 = KAABA.lat * r, dl = (KAABA.lon - lon) * r;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) / r + 360) % 360;
}
