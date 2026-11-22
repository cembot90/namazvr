// Prüfbögen für Muttersprachler: je Sprache eine Tabelle mit Deutsch und Übersetzung zum Gegenlesen.
// Aufruf: node tools/review.mjs  →  review/<sprache>.csv (öffnet sich in Excel, LibreOffice, Google Tabellen)
// Spalten: Bereich, Schlüssel, Deutsch, Übersetzung, OK?, Verbesserung, Kommentar
import fs from 'node:fs';

const LANGS = ['tr', 'en', 'ar', 'bs', 'sq', 'ku', 'fa', 'fr', 'ur', 'id'];
// Bereiche, die religiös heikel sind, kommen zuerst
const FIRST = ['mean', 'niyya', 'instr', 'holy', 'nfl', 'tsp', 'hinfo', 'hajj', 'sit', 'sefer', 'kaza', 'zakat', 'cuma', 'siyer', 'esma', 'elif', 'duas', 'kids', 'inner', 'alevi'];
const sample = (f) => { try { return f(2, 'X', 3, 4); } catch { return '(Funktion)'; } };
function flat(o, path, out) {
  if (typeof o === 'function') o = sample(o);
  if (Array.isArray(o)) { o.forEach((x, i) => flat(x, `${path}[${i}]`, out)); return out; }
  if (o && typeof o === 'object') { for (const [k, v] of Object.entries(o)) flat(v, path ? `${path}.${k}` : k, out); return out; }
  if (typeof o === 'string' && o.trim()) out.set(path, o);
  return out;
}
const de = flat((await import('../src/lang/de.js')).default, '', new Map());
const esc = (s) => `"${String(s).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
fs.mkdirSync('review', { recursive: true });
for (const lang of LANGS) {
  const xx = flat((await import(`../src/lang/${lang}.js`)).default, '', new Map());
  const keys = [...xx.keys()].filter((k) => de.has(k));
  const area = (k) => k.split(/[.[]/)[0];
  const rank = (k) => { const i = FIRST.indexOf(area(k)); return i < 0 ? FIRST.length : i; };
  keys.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const rows = ['Bereich,Schlüssel,Deutsch,Übersetzung,OK?,Verbesserung,Kommentar', ...keys.map((k) => [area(k), k, esc(de.get(k)), esc(xx.get(k)), '', '', ''].join(','))];
  fs.writeFileSync(`review/${lang}.csv`, `﻿${rows.join('\n')}\n`);
  console.log(`${lang}: ${keys.length} Texte`);
}
