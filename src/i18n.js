// Sprachen: Texte der Oberfläche und Inhalte je Sprache in src/lang/*.js.
// t('a.b', ...args) liest den Eintrag der aktuellen Sprache (Rückfall: Deutsch); Funktionen bekommen die args.
import de from './lang/de.js';
import tr from './lang/tr.js';
import en from './lang/en.js';
import ar from './lang/ar.js';

const DICTS = { de, tr, en, ar };

export const LANGS = [
  { id: 'de', name: 'Deutsch', locale: 'de-DE', speech: 'de' },
  { id: 'tr', name: 'Türkçe', locale: 'tr-TR', speech: 'tr' },
  { id: 'en', name: 'English', locale: 'en-GB', speech: 'en' },
  { id: 'ar', name: 'العربية', locale: 'ar', speech: 'ar', rtl: true },
];

let current = 'de';

export const getLang = () => current;
export const langInfo = () => LANGS.find((l) => l.id === current);
export const isRTL = () => !!langInfo().rtl;

export function setLang(id) {
  current = DICTS[id] ? id : 'de';
  if (typeof document !== 'undefined') document.documentElement.lang = current;
}

// Sprache des Geräts, falls unterstützt
export function deviceLang() {
  const code = (navigator.language || 'de').slice(0, 2).toLowerCase();
  return DICTS[code] ? code : 'de';
}

const lookup = (dict, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict);

export function t(key, ...args) {
  let v = lookup(DICTS[current], key);
  if (v == null) v = lookup(de, key);
  if (v == null) return key;
  return typeof v === 'function' ? v(...args) : v;
}
