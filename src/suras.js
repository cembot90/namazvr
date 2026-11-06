// Suren lernen: kurze Suren für das Gebet, Vers für Vers zum Auswendiglernen.
// Arabisch und Umschrift stehen in prayer.js (TXT), Namen und Bedeutungen in der Sprachdatei.
import { t } from './i18n.js';
import { text } from './prayer.js';

// n: Nummer im Qurʾān; keys: Textgruppen, falls die Sure im Gebet auf mehrere Schritte verteilt ist
export const SURAS = [
  { id: 'fatiha', n: 1, keys: ['fatiha1', 'fatiha2'] },
  { id: 'ikhlas', n: 112 },
  { id: 'kawthar', n: 108 },
  { id: 'asr', n: 103 },
  { id: 'falaq', n: 113 },
  { id: 'nas', n: 114 },
  { id: 'fil', n: 105 },
  { id: 'quraysh', n: 106 },
  { id: 'maun', n: 107 },
  { id: 'kafirun', n: 109 },
  { id: 'nasr', n: 110 },
  { id: 'masad', n: 111 },
  // Gebetsruf und Ruf zum Aufstehen – zum Lernen, nicht als Sure im Gebet
  { id: 'ezan', n: '', call: true },
  { id: 'ikamet', n: '', call: true },
].map((s) => ({
  ...s,
  get name() { return t(`suras.names.${s.id}`); },
  get about() { return t(`suras.about.${s.id}`); },
}));

export const findSura = (id) => SURAS.find((s) => s.id === id) || SURAS[0];

// Verse als Liste { ar, tr, de }; bei der Fātiḥa ohne das „Āmīn“, es gehört nicht zur Sure.
export function verses(id) {
  const s = findSura(id);
  const txt = text(...(s.keys || [s.id]));
  const n = s.keys ? txt.ar.length - 1 : txt.ar.length;
  return Array.from({ length: n }, (_, i) => ({ ar: txt.ar[i], tr: txt.tr[i] || '', de: txt.de[i] || '' }));
}
