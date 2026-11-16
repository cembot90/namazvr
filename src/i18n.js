// Sprachen: Texte der Oberfläche und Inhalte je Sprache in src/lang/*.js.
// t('a.b', ...args) liest den Eintrag der aktuellen Sprache (Rückfall: Deutsch); Funktionen bekommen die args.
// Deutsch ist immer geladen; jede andere Sprache wird erst geladen, wenn sie gewählt wird (loadLang).
import de from './lang/de.js';

const DICTS = { de };
const LOADERS = {
  tr: () => import('./lang/tr.js'),
  en: () => import('./lang/en.js'),
  ar: () => import('./lang/ar.js'),
  bs: () => import('./lang/bs.js'),
  sq: () => import('./lang/sq.js'),
  ku: () => import('./lang/ku.js'),
  fa: () => import('./lang/fa.js'),
  fr: () => import('./lang/fr.js'),
  ur: () => import('./lang/ur.js'),
  id: () => import('./lang/id.js'),
};

// speech: Sprache der Vorlese-Stimme; voiceAlt: ähnliche Stimmen, falls das Gerät keine eigene hat
export const LANGS = [
  { id: 'de', name: 'Deutsch', locale: 'de-DE', speech: 'de' },
  { id: 'tr', name: 'Türkçe', locale: 'tr-TR', speech: 'tr' },
  { id: 'en', name: 'English', locale: 'en-GB', speech: 'en' },
  { id: 'ar', name: 'العربية', locale: 'ar', speech: 'ar', rtl: true },
  { id: 'bs', name: 'Bosanski', locale: 'bs-BA', speech: 'bs', voiceAlt: ['hr', 'sr'] },
  { id: 'sq', name: 'Shqip', locale: 'sq-AL', speech: 'sq' },
  { id: 'ku', name: 'Kurdî', locale: 'ku', speech: 'ku', voiceAlt: ['tr'] },
  { id: 'fa', name: 'فارسی / دری', locale: 'fa', speech: 'fa', rtl: true },
  { id: 'fr', name: 'Français', locale: 'fr-FR', speech: 'fr' },
  { id: 'ur', name: 'اردو', locale: 'ur-PK', speech: 'ur', rtl: true },
  { id: 'id', name: 'Indonesia', locale: 'id-ID', speech: 'id' },
];

let current = 'de';

export const getLang = () => current;
export const langInfo = () => LANGS.find((l) => l.id === current);
export const isRTL = () => !!langInfo().rtl;
export const isLoaded = (id) => !!DICTS[id];

// Sprachdatei laden (einmal); bei einem Fehler (z. B. offline) bleibt es bei Deutsch
export async function loadLang(id) {
  if (!DICTS[id] && LOADERS[id]) {
    try { DICTS[id] = (await LOADERS[id]()).default; } catch { /* nicht erreichbar */ }
  }
  return !!DICTS[id];
}

export function setLang(id) {
  current = DICTS[id] ? id : 'de';
  if (typeof document !== 'undefined') document.documentElement.lang = current;
}

// Sprache des Geräts, falls unterstützt
export function deviceLang() {
  const code = (navigator.language || 'de').slice(0, 2).toLowerCase();
  return LANGS.some((l) => l.id === code) ? code : 'de';
}

const lookup = (dict, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict);

export function t(key, ...args) {
  let v = lookup(DICTS[current], key);
  if (v == null) v = lookup(de, key);
  if (v == null) return key;
  return typeof v === 'function' ? v(...args) : v;
}
