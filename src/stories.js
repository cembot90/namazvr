// Geschichten der Propheten zum Mitreisen (für Kinder): Schritte mit Ort, Abschnitt der Szene und Koranstelle.
// Propheten werden aus Respekt nicht dargestellt. Texte stehen in der Sprachdatei unter story.list.<id>.
import { t } from './i18n.js';

const at = (x, z, hx, hz, y = 0) => ({ x, z, hx, hz, y });

// An Deck der Arche und in der Höhle: Kamera am Handy näher bei dir
const DECK = { cam: { x: 0.3, y: 2.7, z: 2.2 }, look: { x: 0, y: 2.4, z: -14 } };
const CAVE = { cam: { x: 0.2, y: 1.5, z: 0.9 }, look: { x: 0.2, y: 1.1, z: -5 } };
// cam/look (nur Handy): Kamera und Blickpunkt relativ zu dir, falls die Standard-Ansicht nicht passt
export const STORIES = [
  { id: 'nuh', icon: '🚢', scene: 'ark', steps: [
    { id: 'build', ref: '11:25–38', place: at(9, -4, -9, -18) },
    { id: 'animals', ref: '11:40', place: at(7, -5, -7, -4.5) },
    { id: 'rain', ref: '11:41', place: at(8, -22, 1, 0.5, 4.15), cam: DECK.cam, look: DECK.look, ar: 'بِسْمِ اللَّهِ مَجْرَاهَا وَمُرْسَاهَا' },
    { id: 'sea', ref: '11:42–43', place: at(8, -22, 1, 0.5, 4.15), ...DECK },
    { id: 'cudi', ref: '11:44–48', place: at(10, -4, -10, -18, 3.2) },
  ] },
  { id: 'ibrahim', icon: '🔥', scene: 'fire', steps: [
    { id: 'sky', ref: '6:75–79', place: at(0, 0, 0, -1), look: { x: 0, y: 5, z: -8 } },
    { id: 'wood', ref: '21:51–68', place: at(2, 0, -2, -12) },
    { id: 'fire', ref: '21:68', place: at(0, 6, 0, -1), ar: 'حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ' },
    { id: 'garden', ref: '21:69', place: at(0, -3, 0, -1), ar: 'يَا نَارُ كُونِي بَرْدًا وَسَلَامًا عَلَىٰ إِبْرَاهِيمَ' },
  ] },
  { id: 'musa', icon: '🧺', scene: 'nile', steps: [
    { id: 'home', ref: '28:4–7', place: at(0.5, 0, -0.6, -1) },
    { id: 'basket', ref: '28:7', place: at(0.5, -1, -0.5, -1), ar: 'وَلَا تَخَافِي وَلَا تَحْزَنِي إِنَّا رَادُّوهُ إِلَيْكِ' },
    { id: 'float', ref: '28:11', place: at(16, -2.5, -0.35, -1) },
    { id: 'palace', ref: '28:8–12', place: at(50, -4, 0.45, -1) },
    { id: 'back', ref: '28:12–13', place: at(-3.5, 10, -0.35, -1) },
  ] },
  { id: 'yunus', icon: '🐋', scene: 'sea', steps: [
    { id: 'ship', ref: '37:139–140', place: at(0, 3.5, 0, -1) },
    { id: 'storm', ref: '37:141', place: at(0, 3.5, 0, -1) },
    { id: 'whale', ref: '37:142', place: at(0, 3.5, 0.45, -1) },
    { id: 'dark', ref: '21:87', place: at(0, 2, 0, -1), ar: 'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ' },
    { id: 'shore', ref: '21:88 · 37:143–148', place: at(0, 67, 0.2, -1, 0.3) },
  ] },
  { id: 'suleyman', icon: '🐜', scene: 'valley', steps: [
    { id: 'gift', ref: '27:15–17', place: at(0, 0, 0, -1) },
    { id: 'ant', ref: '27:18', place: at(0, 0, 0, -1, -0.9), ar: 'يَا أَيُّهَا النَّمْلُ ادْخُلُوا مَسَاكِنَكُمْ', cam: { x: 0.15, y: 1.4, z: 0.5 }, look: { x: -0.1, y: 1.0, z: -1.4 } },
    { id: 'smile', ref: '27:19', place: at(0, 0, 0, -1), ar: 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ' },
  ] },
  { id: 'hijra', icon: '🕸️', scene: 'cave', steps: [
    { id: 'night', ref: '8:30', place: at(0, -10, 0, -1) },
    { id: 'cave', ref: '9:40', place: at(0, 1.4, 0, -1), ...CAVE },
    { id: 'web', ref: '', place: at(0, 1.4, 0, -1), ...CAVE },
    { id: 'search', ref: '9:40', place: at(0, 1.4, 0, -1), ...CAVE, ar: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا' },
    { id: 'medina', ref: '', place: at(0, 205, 0, 1), ar: 'طَلَعَ الْبَدْرُ عَلَيْنَا' },
  ] },
];

export const findStory = (id) => STORIES.find((s) => s.id === id);
const L = (id, k) => t(`story.list.${id}.${k}`);

// Als „Gebet“ für die Auswahl und den Ablauf (kind 'story')
export const STORY_LIST = STORIES.map((s) => ({ id: s.id, kind: 'story', icon: s.icon, get name() { return L(s.id, 'name'); }, get de() { return L(s.id, 'sub'); } }));

export function buildStory(id) {
  const st = findStory(id);
  const name = L(id, 'name');
  return st.steps.map((d) => {
    const v = L(id, `s.${d.id}`);
    const [title, text, tl, mean] = Array.isArray(v) ? v : [d.id, '', '', ''];
    const words = text.split(/\s+/).length;
    return {
      hajj: true, story: id, icon: st.icon, id: d.id, phase: d.id, title, cue: title, instr: text, pose: 'stand',
      scene: st.scene, place: d.place, cam: d.cam, look: d.look, motion: null, rakah: 0, status: '', kid: '', inner: '',
      // Lesezeit: etwa 2,3 Wörter je Sekunde, dazu Zeit zum Schauen (und für den Koranvers)
      dur: Math.max(14, words / 2.3 + 6 + (d.ar ? 6 : 0)),
      ar: d.ar ? [d.ar] : [], tr: d.ar && tl ? [tl] : [], de: d.ar && mean ? [mean] : [],
      where: d.ref ? `${name} · ${t('story.quran', d.ref)}` : `${name} · ${t('story.told')}`,
    };
  });
}

// Frage am Ende: richtige Antwort und zwei andere, gemischt
export function storyQuestion(id) {
  const [q, a, ...w] = L(id, 'q');
  const options = [a, ...w].map((x, i) => ({ x, i })).sort(() => Math.random() - 0.5);
  return { q, options: options.map((o) => o.x), correct: options.findIndex((o) => o.i === 0), answer: null, star: false };
}
