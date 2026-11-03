// Lernmodus: Quizfragen zum Gebet und zur Waschung, Fortschritt und Abzeichen.
import { PRAYERS } from './prayer.js';

// a = richtige Antwort, w = falsche Antworten
const QUESTIONS = [
  { q: 'Was sprichst du im Rukūʿ (Verbeugung)?', a: 'Subḥāna rabbiya l-ʿaẓīm', w: ['Subḥāna rabbiya l-aʿlā', 'Rabbi ghfir lī', 'Samiʿa llāhu li-man ḥamidah'] },
  { q: 'Was sprichst du im Sujūd (Niederwerfung)?', a: 'Subḥāna rabbiya l-aʿlā', w: ['Subḥāna rabbiya l-ʿaẓīm', 'Allāhu akbar', 'Rabbanā wa laka l-ḥamd'] },
  { q: 'Was sprichst du beim Aufrichten aus dem Rukūʿ?', a: 'Samiʿa llāhu li-man ḥamidah', w: ['Subḥāna rabbiya l-aʿlā', 'As-salāmu ʿalaykum', 'Āmīn'] },
  { q: 'Was sprichst du beim kurzen Sitzen zwischen den Niederwerfungen?', a: 'Rabbi ghfir lī', w: ['Subḥāna rabbiya l-ʿaẓīm', 'Allāhu akbar', 'Āmīn'] },
  { q: 'Was bedeutet „Allāhu akbar“?', a: 'Allah ist größer (als alles)', w: ['Gepriesen sei Allah', 'Im Namen Allahs', 'Alles Lob gebührt Allah'] },
  { q: 'Was bedeutet „Subḥāna rabbiya l-aʿlā“?', a: 'Gepriesen sei mein Herr, der Höchste', w: ['Mein Herr, vergib mir', 'Gepriesen sei mein Herr, der Gewaltige', 'Allah hört den, der Ihn lobt'] },
  { q: 'Welche Sure ist in jeder Rakʿa Pflicht?', a: 'Al-Fātiḥa', w: ['Al-Ikhlāṣ', 'Al-Kahf', 'Yā-Sīn'] },
  { q: 'Was kommt direkt nach dem Rukūʿ?', a: 'Iʿtidāl – Aufrichten', w: ['Sujūd', 'Tashahhud', 'Taslīm'] },
  { q: 'Was kommt nach der ersten Niederwerfung?', a: 'Kurzes Sitzen, dann die 2. Niederwerfung', w: ['Aufstehen', 'Taslīm', 'Rukūʿ'] },
  { q: 'Wie beendest du das Gebet?', a: 'Mit dem Friedensgruß nach rechts und links', w: ['Mit „Āmīn“', 'Mit dem Takbīr', 'Mit einer Verbeugung'] },
  { q: 'Wohin richtest du dich beim Gebet aus?', a: 'Zur Kaaba in Mekka (Qibla)', w: ['Nach Osten', 'Nach Jerusalem', 'Egal wohin'] },
  { q: 'Wie oft sagt man den Lobpreis im Rukūʿ üblicherweise?', a: '3×', w: ['1×', '7×', '33×'] },
  { q: 'Wann sitzt man zum ersten Tashahhud?', a: 'Nach der 2. Rakʿa in 3- und 4-Rakʿa-Gebeten', w: ['Nach jeder Rakʿa', 'Nur ganz am Ende', 'Vor dem Rukūʿ'] },
  { q: 'Wo fasst man die Absicht (Niyya)?', a: 'Im Herzen', w: ['Laut vor dem Imam', 'Schriftlich', 'Erst nach dem Gebet'] },
  { q: 'Was ist bei der Waschung laut Koran Pflicht?', a: 'Gesicht, Arme, Kopf (bestreichen), Füße', w: ['Nur die Hände', 'Mund und Nase', 'Der ganze Körper'] },
  { q: 'Bis wohin wäschst du die Arme bei der Wuḍūʾ?', a: 'Bis einschließlich Ellbogen', w: ['Bis zum Handgelenk', 'Bis zur Schulter', 'Nur die Finger'] },
  { q: 'Bis wohin wäschst du die Füße?', a: 'Bis einschließlich der Knöchel', w: ['Nur die Zehen', 'Bis zum Knie', 'Nur die Fußsohlen'] },
  { q: 'Mit welcher Seite beginnst du beim Waschen von Armen und Füßen?', a: 'Rechts', w: ['Links', 'Egal', 'Beide zugleich – Pflicht'] },
  { q: 'Wie oft wäscht man ein Glied bei der Wuḍūʾ üblicherweise (Sunnah)?', a: '3×', w: ['1×', '5×', '7×'] },
  ...PRAYERS.map((p) => ({
    q: `Wie viele Pflicht-Rakʿāt hat das ${p.name}-Gebet?`,
    a: String(p.rakat),
    w: ['2', '3', '4', '5'].filter((n) => n !== String(p.rakat)).slice(0, 3),
  })),
];

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function newQuiz(count = 10) {
  return {
    questions: shuffle(QUESTIONS).slice(0, count).map((x) => {
      const options = shuffle([x.a, ...x.w]);
      return { q: x.q, options, correct: options.indexOf(x.a) };
    }),
    i: 0,
    score: 0,
    answer: null, // gewählte Antwort der aktuellen Frage
  };
}

// --- Fortschritt ---
export const emptyProgress = () => ({ done: {}, wudu: 0, quizBest: 0, quizRuns: 0, days: [] });

const dayKey = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function recordPractice(progress, id) {
  if (id === 'wudu') progress.wudu++;
  else progress.done[id] = (progress.done[id] || 0) + 1;
  const today = dayKey();
  if (!progress.days.includes(today)) progress.days = [...progress.days, today].slice(-60);
}

// Tage in Folge geübt, bis heute oder gestern.
export function streak(progress) {
  const days = new Set(progress.days);
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const BADGES = [
  { name: 'Erstes Gebet', test: (p) => Object.keys(p.done).length > 0 },
  { name: 'Alle 5 Pflichtgebete', test: (p) => PRAYERS.every((x) => p.done[x.id]) },
  { name: 'Wuḍūʾ gelernt', test: (p) => p.wudu > 0 },
  { name: 'Quiz-Profi (10/10)', test: (p) => p.quizBest >= 10 },
  { name: '7 Tage in Folge', test: (p) => streak(p) >= 7 },
  { name: 'Sunnah & Witr', test: (p) => ['witr', 'sfajr'].every((id) => p.done[id]) },
];
