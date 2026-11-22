// Urkunde zum Ausdrucken oder Speichern: ein Bild (PNG) mit Name, Leistung und Datum.
import { getLang, isRTL, langInfo, t } from './i18n.js';

export function drawCertificate({ name, title, date }) {
  const W = 1754, H = 1240; // A4 quer bei 150 dpi
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const UI = 'Inter, "Segoe UI", system-ui, sans-serif', AR = 'Amiri, "Noto Naskh Arabic", "Geeza Pro", serif';
  ctx.fillStyle = '#fbf6ea'; ctx.fillRect(0, 0, W, H);
  // Rahmen mit Ornament-Ecken
  ctx.strokeStyle = '#c9a85c'; ctx.lineWidth = 14; ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = '#1d5c6e'; ctx.lineWidth = 4; ctx.strokeRect(70, 70, W - 140, H - 140);
  for (const [x, y] of [[70, 70], [W - 70, 70], [70, H - 70], [W - 70, H - 70]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#c9a85c'; ctx.fillRect(-26, -26, 52, 52);
    ctx.fillStyle = '#1d5c6e'; ctx.fillRect(-12, -12, 24, 24); ctx.restore();
  }
  const center = (text, y, font, color = '#1f2a3a') => {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.direction = isRTL() ? 'rtl' : 'ltr';
    ctx.fillText(text, W / 2, y);
  };
  ctx.direction = 'rtl';
  center('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 185, `64px ${AR}`, '#1d5c6e');
  center(t('cert.title'), 365, `700 110px ${UI}`, '#a9852f');
  center(t('cert.line'), 450, `40px ${UI}`, '#5a6474');
  center(name, 570, `700 96px ${UI}`);
  center(t('cert.done'), 670, `40px ${UI}`, '#5a6474');
  center(title, 790, `700 72px ${UI}`, '#1d5c6e');
  center(t('cert.wish'), 900, `italic 38px ${UI}`, '#5a6474');
  center(`${date} · NamazVR`, 1080, `32px ${UI}`, '#8a8f99');
  return c;
}

export function downloadCertificate(info) {
  const c = drawCertificate(info);
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = `urkunde-${String(info.title).toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-')}.png`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 500);
  return true;
}

export const today = () => new Intl.DateTimeFormat(langInfo().locale || getLang(), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
