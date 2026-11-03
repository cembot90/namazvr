// Lernmodus: Quizfragen zum Gebet und zur Waschung, Fortschritt und Abzeichen.
import { t } from './i18n.js';
import { PRAYERS } from './prayer.js';

// Fragen aus der Sprachdatei: [Frage, richtige Antwort, falsche Antworten]; dazu je Pflichtgebet die Zahl der Rakʿāt.
function questions() {
  return [
    ...t('quiz.questions').map(([q, a, w]) => ({ q, a, w })),
    ...PRAYERS.map((p) => ({
      q: t('quiz.rakat', p.name),
      a: String(p.rakat),
      w: ['2', '3', '4', '5'].filter((n) => n !== String(p.rakat)).slice(0, 3),
    })),
  ];
}

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
    questions: shuffle(questions()).slice(0, count).map((x) => {
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

const BADGE_TESTS = [
  (p) => Object.keys(p.done).length > 0,
  (p) => PRAYERS.every((x) => p.done[x.id]),
  (p) => p.wudu > 0,
  (p) => p.quizBest >= 10,
  (p) => streak(p) >= 7,
  (p) => ['witr', 'sfajr'].every((id) => p.done[id]),
];
export const BADGES = BADGE_TESTS.map((test, i) => ({ test, get name() { return t('badges')[i]; } }));
