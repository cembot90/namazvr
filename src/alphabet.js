// Elif-Ba: das arabische Alphabet für Kinder und Anfänger – Buchstaben in ihren Formen, Vokalzeichen, erste Wörter, Quiz.
// Arabisch und wissenschaftliche Umschrift hier; Namen in der Sprache, Tipps und Bedeutungen in der Sprachdatei (elif.*).
import { t } from './i18n.js';

// [Buchstabe, arabischer Name, verbindet nach links?]
export const LETTERS = [
  ['ا', 'أَلِف', false], ['ب', 'بَاء', true], ['ت', 'تَاء', true], ['ث', 'ثَاء', true], ['ج', 'جِيم', true], ['ح', 'حَاء', true],
  ['خ', 'خَاء', true], ['د', 'دَال', false], ['ذ', 'ذَال', false], ['ر', 'رَاء', false], ['ز', 'زَاي', false], ['س', 'سِين', true],
  ['ش', 'شِين', true], ['ص', 'صَاد', true], ['ض', 'ضَاد', true], ['ط', 'طَاء', true], ['ظ', 'ظَاء', true], ['ع', 'عَيْن', true],
  ['غ', 'غَيْن', true], ['ف', 'فَاء', true], ['ق', 'قَاف', true], ['ك', 'كَاف', true], ['ل', 'لَام', true], ['م', 'مِيم', true],
  ['ن', 'نُون', true], ['ه', 'هَاء', true], ['و', 'وَاو', false], ['ي', 'يَاء', true],
].map(([ch, arName, joins], i) => ({
  i, ch, arName, joins,
  // Formen: allein, am Anfang, in der Mitte, am Ende (Verbindungsstrich Tatwīl)
  forms: joins ? [ch, `${ch}ـ`, `ـ${ch}ـ`, `ـ${ch}`] : [ch, ch, `ـ${ch}`, `ـ${ch}`],
  get name() { return t('elif.names')[i]; },
  get tip() { return t('elif.tips')[i]; },
}));

// Vokalzeichen am Beispiel ب
export const MARKS = [
  ['fatha', 'بَ', 'ba'], ['kasra', 'بِ', 'bi'], ['damma', 'بُ', 'bu'], ['sukun', 'أَبْ', 'ab'], ['shadda', 'رَبّ', 'rabb'],
  ['tanwin', 'بًا · بٍ · بٌ', 'ban · bin · bun'], ['madd', 'بَا · بِي · بُو', 'bā · bī · bū'],
].map(([id, ar, tr]) => ({ id, ar, tr, get name() { return t(`elif.marks.${id}`)[0]; }, get desc() { return t(`elif.marks.${id}`)[1]; } }));

// Erste Wörter (viele aus dem Gebet)
export const WORDS = [
  ['بِسْمِ', 'bismi'], ['اللَّهُ', 'Allāh'], ['رَبّ', 'rabb'], ['نُور', 'nūr'], ['سَلَام', 'salām'], ['صَلَاة', 'ṣalāh'],
  ['قُرْآن', 'Qurʾān'], ['كِتَاب', 'kitāb'], ['قَلَم', 'qalam'], ['بَيْت', 'bayt'], ['أُمّ', 'umm'], ['شُكْرًا', 'shukran'],
].map(([ar, tr], i) => ({ ar, tr, get de() { return t('elif.words')[i]; } }));

// Quiz: 10 Fragen, jeweils ein Buchstabe (in einer zufälligen Form) und 4 Namen zur Auswahl
export function elifQuiz(n = 10, rnd = Math.random) {
  const pick = [...LETTERS].sort(() => rnd() - 0.5).slice(0, n);
  return {
    i: 0, score: 0, picked: null,
    q: pick.map((l) => {
      const others = LETTERS.filter((x) => x.i !== l.i).sort(() => rnd() - 0.5).slice(0, 3).map((x) => x.i);
      return { ans: l.i, form: Math.floor(rnd() * 4), opts: [l.i, ...others].sort(() => rnd() - 0.5) };
    }),
  };
}
