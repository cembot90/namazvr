// Spiritueller Modus: kurze Impulse zur inneren Bedeutung (Khushūʿ), frei formuliert
// in Anlehnung an die Gedanken al-Ghazālīs zu den inneren Dimensionen von Gebet und Waschung.

const PRAYER = {
  niyya: 'Lass die Welt für einen Moment los. Du stehst jetzt vor deinem Herrn – sei mit dem Herzen hier, nicht nur mit dem Körper.',
  takbir: 'Mit den erhobenen Händen wirfst du alles hinter dich: Sorgen, Pläne, Ablenkung. Allah ist größer als all das.',
  opening: 'Beginne mit Lobpreis, wie ein Gast, der grüßt, bevor er bittet.',
  fatiha: 'Die Fātiḥa ist ein Gespräch: Bei jedem Vers antwortet Allah dir. Sprich langsam und hör innerlich hin.',
  sura: 'Lass die Worte nicht nur über die Zunge gehen – lass ihre Bedeutung im Herzen ankommen.',
  ruku: 'Du verneigst dich vor Dem, vor dem sich alles verneigt. Spüre die Demut in deinem Rücken.',
  itidal: 'Richte dich auf in Dankbarkeit: Er hört dich, wenn du Ihn lobst.',
  sujud: 'Das Höchste an dir – dein Gesicht – liegt auf dem Boden. Hier bist du deinem Herrn am nächsten. Bitte Ihn.',
  jalsa: 'Ein Atemzug zwischen zwei Niederwerfungen: Bitte um Vergebung, ehrlich und ohne Eile.',
  tashahhud: 'Du grüßt den Propheten ﷺ und alle Rechtschaffenen – du bist Teil einer Gemeinschaft durch alle Zeiten.',
  salawat: 'Segenswünsche für den Propheten ﷺ öffnen das Herz für die eigenen Bitten.',
  dua: 'Jetzt ist ein guter Moment für deine persönliche Bitte – in deinen eigenen Worten.',
  qunut: 'Halte die Hände offen wie ein Bedürftiger. Du bittest um Führung, Schutz und Segen.',
  salam: 'Du kehrst zurück in die Welt und bringst ihr Frieden mit – nach rechts und nach links.',
};

const WUDU = {
  heart: 'Die äußere Reinigung ist ein Spiegel der inneren: Nimm dir vor, auch dein Herz zu reinigen.',
  hands: 'Wasche ab, was deine Hände an Unrecht berührt haben, und lass los, woran du dich klammerst.',
  mouth: 'Reinige den Mund von harten Worten, Lügen und üblem Gerede.',
  nose: 'Atme Reinheit ein – möge dir der Duft des Guten erreichbar werden.',
  face: 'Du wäschst das Gesicht, mit dem du dich gleich deinem Herrn zuwendest.',
  armR: 'Mögen deine Hände Gutes geben und Gutes tun.',
  armL: 'Lass mit dem Wasser auch Fehler abfließen, die deine Hände begangen haben.',
  head: 'Streiche über den Kopf und bitte um reine Gedanken.',
  ears: 'Mögen deine Ohren das Gute hören und sich vom Schlechten abwenden.',
  footR: 'Mögen deine Füße dich zu Orten tragen, an denen Gutes geschieht.',
  footL: 'Ein fester Stand auf dem geraden Weg – darum bittest du mit jedem Schritt.',
};

export function innerMeaning(step) {
  if (step.wudu) return step.title.startsWith('Bittgebet') ? 'Du bezeugst die Einheit Allahs – rein an Körper und Herz.' : WUDU[step.wudu];
  const t = step.title;
  if (t.startsWith('Niyya')) return PRAYER.niyya;
  if (t.startsWith('Takbīr')) return PRAYER.takbir;
  if (t.startsWith('Eröffnung')) return PRAYER.opening;
  if (t.startsWith('Al-Fātiḥa')) return PRAYER.fatiha;
  if (t.startsWith('Zusätzliche')) return PRAYER.sura;
  if (t.startsWith('Qunūt')) return PRAYER.qunut;
  if (t.startsWith('Rukūʿ')) return PRAYER.ruku;
  if (t.startsWith('Iʿtidāl')) return PRAYER.itidal;
  if (t.startsWith('Sujūd')) return PRAYER.sujud;
  if (t.startsWith('Julūs')) return PRAYER.jalsa;
  if (t.includes('Tashahhud')) return PRAYER.tashahhud;
  if (t.startsWith('Ṣalawāt')) return PRAYER.salawat;
  if (t.startsWith('Bittgebet')) return PRAYER.dua;
  if (t.startsWith('Taslīm')) return PRAYER.salam;
  if (t.startsWith('Aufstehen')) return 'Eine neue Rakʿa – ein neuer Anfang. Sammle dein Herz noch einmal.';
  return '';
}

// Atem-Rhythmus für den Dhikr: Einatmen, dann beim Ausatmen den Dhikr sprechen.
export const BREATH = { inhale: 3, exhale: 3 };
