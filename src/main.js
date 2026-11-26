import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { STYLES, WUDU_BASINS, buildEnvironment, clearEnvironment, galleryInfo, makeFloorCompass, makeRug, roomBounds, blocked, setWater, wuduStools } from './environment.js';
import { Guide, setFaces } from './figure.js';
import { Congregation } from './congregation.js';
import { Panel, FloorCard, CueBanner } from './panel.js';
import { classifyHead, matchesPose, moveFor } from './movement.js';
import { ALEVI, EXTRA_PRAYERS, MADHABS, NAFILE, PILGRIMAGES, PRAYERS, PURIFY, TASBIH, buildSteps, findPrayer, text as prayerText } from './prayer.js';
import { LETTERS, MARKS, WORDS, elifQuiz } from './alphabet.js';
import { ESMA, esmaQuiz } from './esma.js';
import { hubItems } from './menu.js';
import { downloadCertificate, today as certDate } from './certificate.js';
import { HOLY_LINKS, buildHolyIcs, dueHoly, holyList, holyText } from './holy.js';
import { LANGS, deviceLang, getLang, isLoaded, isRTL, langInfo, loadLang, setLang, t } from './i18n.js';
import { WUDU, buildWuduSteps } from './wudu.js';
import { BADGES, emptyProgress, newQuiz, recordPractice, streak } from './learn.js';
import { BREATH, innerMeaning } from './spirit.js';
import { CALM_BREATHS, PEACE, kidLine } from './peace.js';
import { DUA_CATS, duasOf } from './duas.js';
import { SAYINGS, muharremInfo } from './alevi.js';
import { SURAS, findSura, verses } from './suras.js';
import { MobileUI } from './mobile.js';
import { checkHands, indexRaised, readHand } from './hands.js';
import { CITIES, qiblaBearing } from './qibla.js';
import { ASR, METHODS, TIME_NAMES, formatCountdown, formatTime, prayerStatus } from './prayertimes.js';
import { PIPER, SAMPLES, Voices } from './voice.js';
import { buildPilgrimage, isHajj, isPilgrimage, pathAt, pathLength, speedAt, statusOf } from './hajj.js';
import { JAMARAT, setCemStep, setSemah, updateCrowd } from './hajjworld.js';
import { Ambience } from './ambient.js';
import { Graphics, envFor } from './graphics.js';
import { TRACK_DAYS, dayDone, fullStreak, keyFor, markPrayed, prayedOn, toggle as toggleTrack, week } from './tracker.js';
import { addDays, formatDay, formatHijri, ramadanInfo } from './ramadan.js';
import { dayKey } from './learn.js';
import { ALL_PRAYERS, BEFORE, askPermission, buildIcs, canNotify, downloadIcs, dueReminder, notify, reminderText } from './remind.js';
import { STORY_LIST, buildStory, findStory, storyQuestion } from './stories.js';
import { setSkyData, setStoryPhase, storyLift, updateStory } from './storyworld.js';
import { HandWave, MediaRemote } from './remote.js';

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(`salahvr.${key}`); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(`salahvr.${key}`, JSON.stringify(value)); } catch { /* privater Modus */ }
  },
};

// --- Renderer, Szene, Kamera ---
// alpha: In Mixed Reality scheint das echte Zimmer (Passthrough) durch.
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
document.body.appendChild(renderer.domElement);
// VR-/AR-Knopf: eigene Klasse, damit er am Handy und ohne WebXR ausgeblendet werden kann
const xrButton = (b) => { b.classList.add('xrbtn'); document.body.appendChild(b); return b; };
xrButton(VRButton.createButton(renderer));
// Mixed Reality: Gebetsplatz im eigenen Zimmer, mit Handerkennung
xrButton(ARButton.createButton(renderer, { optionalFeatures: ['local-floor', 'hand-tracking'] }));

const scene = new THREE.Scene();
const ROOM_BG = new THREE.Color(0x1a1410);
scene.background = ROOM_BG;
// Licht für Mixed Reality, wenn der Moscheeraum (mit seinen Lampen) ausgeblendet ist
const arLight = new THREE.HemisphereLight(0xfff6e8, 0x8a7a66, 2.4);
arLight.visible = false;
scene.add(arLight);
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 1000);
camera.position.set(0, 1.6, 0);

// `world` enthält den ganzen Gebetsraum; seine -Z-Achse ist die Qibla.
const world = new THREE.Group();
scene.add(world);
// Der Raum selbst hängt in einer eigenen Gruppe, damit der Moschee-Stil gewechselt werden kann.
const env = new THREE.Group();
world.add(env);
const compass = makeFloorCompass();
const guideRug = makeRug(1.5, -1.95);
const userRug = makeRug(0, -0.5);
world.add(compass, userRug, guideRug);

// Bildqualität: auf der Quest „Normal“ (ohne Schatten), sonst „Hoch“
const onQuest = /OculusBrowser|Quest/i.test(navigator.userAgent);
const graphics = new Graphics(renderer, scene, world, store.get('gfxHigh', !onQuest));

// Gesichter der Figuren lassen sich in den Einstellungen ausblenden
setFaces(store.get('faces', true));
const guide = new Guide({ beard: true, build: 1, hair: 0x2b1d14 });
guide.group.position.set(1.5, 0, -1.5);
guide.group.rotation.y = Math.PI;
world.add(guide.group);

// Gemeinschaftsgebet: Imam und Gemeinde (statt der Vorbeter-Figur)
const cong = new Congregation();
world.add(cong.group);

const panel = new Panel();
panel.mesh.position.set(-0.75, 1.35, -1.5);
panel.mesh.rotation.set(-0.05, 0.32, 0, 'YXZ');
world.add(panel.mesh);

const card = new FloorCard();
card.mesh.position.set(0, 0.012, -1.38);
world.add(card.mesh);

// Atem-Kugel für den Dhikr über dem Panel
const orb = new THREE.Mesh(
  new THREE.SphereGeometry(0.07, 24, 16),
  new THREE.MeshStandardMaterial({ color: 0xbff0dc, emissive: 0x5fd1a8, emissiveIntensity: 1.4 }),
);
orb.position.set(-0.75, 1.98, -1.62);
orb.visible = false;
world.add(orb);

// Bewegungsansage schwebt kurz vor dem Blick (liegt in der Szene, nicht im Raum).
const banner = new CueBanner();
scene.add(banner.mesh);

// --- Zustand ---
// Profile: jedes Kind mit eigenem Fortschritt (Sterne, Tracker, Suren, Quiz) und eigenem Kinder-Modus.
// Das erste Profil („Ich“) nutzt den bisherigen Speicherplatz, damit nichts verloren geht.
const ICONS = ['🌙', '⭐', '🌸', '🦁', '🐢', '🚀', '🌳', '🐝', '🦋', '🐬'];
const MAX_PROFILES = 6;
const progKey = (id) => (id === 'main' ? 'progress' : `progress.${id}`);
const loadProgress = (id) => ({ ...emptyProgress(), ...store.get(progKey(id), {}) });
const profiles = store.get('profiles', null) || [{ id: 'main', name: null, icon: '🌙', kids: store.get('kids', false) }];
let profileId = store.get('profileId', 'main');
if (!profiles.some((p) => p.id === profileId)) profileId = profiles[0].id;
const profile = () => profiles.find((p) => p.id === profileId) || profiles[0];
const saveProfiles = () => { store.set('profiles', profiles); store.set('profileId', profileId); };

// Sprache vor allem anderen setzen, damit alle Texte schon passen.
const startLang = store.get('lang', deviceLang());
await loadLang(startLang);
setLang(startLang);

const state = {
  view: 'menu',
  prayer: null,
  steps: [],
  i: 0,
  auto: false,
  autoT: 0,
  big: store.get('big', false), // große Schrift
  zakat: { cash: 0, gold: 0, silver: 0, other: 0, debts: 0, goldPrice: 0, silverPrice: 0, by: 'gold', persons: 1, perPerson: 0, cur: 'EUR', ...store.get('zakat', {}) },
  siyer: 0,
  sitting: store.get('sitting', ''), // im Sitzen beten: '' | 'floor' | 'chair'
  travel: store.get('travel', false), // unterwegs (Seferî): 4 Rakʿāt werden 2
  quiet: store.get('calm', false), // ruhiger Modus: keine Musik und Geräusche, langsamer vorlesen
  location: store.get('location', CITIES[0]),
  northYaw: store.get('northYaw', null),
  // Alternative zur Nord-Kalibrierung: Blickrichtung zur Qibla direkt festgelegt
  qiblaYaw: store.get('qiblaYaw', null),
  ar: false,
  placePending: false,
  msg: '',
  tasbih: { phase: 0, count: 0 },
  method: store.get('method', 'mwl'),
  asr: store.get('asr', 'standard'),
  madhab: store.get('madhab', 'hanafi'),
  gender: store.get('gender', 'm'),
  beginner: store.get('beginner', false),
  // Jeden Schritt automatisch vorlesen (Schalter „Vorlesen“)
  voice: store.get('voice', true),
  spiritual: store.get('spiritual', false),
  // Kinder-Modus: einfache Erklärung je Schritt, langsamer, Sterne als Belohnung
  kids: !!profile().kids,
  peace: 0,
  dua: { cat: 'protect', i: 0, msg: '' },
  saying: 0,
  // Suren lernen: gewählte Sure, Modus (read | verse | test), aktueller Vers, aufgedeckt?
  sura: { id: 'fatiha', mode: 'read', v: 0, reveal: false, msg: '' },
  prayerSura: store.get('prayerSura', 'ikhlas'),
  calm: { count: 0 },
  style: store.get('style', 'klassisch'),
  night: false,
  // Cemaat: Gemeinschaftsgebet mit Imam; Größe der Gemeinde; natürlicher Takt oder Gleichtakt
  cemaat: store.get('cemaat', false),
  cemaatSize: store.get('cemaatSize', 'small'),
  cemaatNatural: store.get('cemaatNatural', true),
  // Frauenbereich: hinter dem Holzgitter ('screen') oder auf der Empore der Großmoschee ('gallery')
  womenPlace: store.get('womenPlace', 'screen'),
  // Gebets-Tracker: angezeigter Tag (0 = heute, 1 = gestern …)
  trackBack: 0,
  ramadanDua: null,
  breath: { on: false, t: 0, phase: 'in' },
  wuduRoom: false,
  scene: null,
  pilgrim: { d: 0, thrown: 0, tt: 0, snap: null },
  // Beim Tavaf und Sa'y fließend mitgehen (aus: in kurzen Sprüngen)
  walkAlong: store.get('walkAlong', true),
  sounds: store.get('sounds', true),
  progress: loadProgress(profileId),
  pDel: null,
  // Erinnerung: an/aus und wie viele Minuten vorher
  remind: { on: false, before: 10, prayers: ALL_PRAYERS, holy: true, ...store.get('remind', {}) },
  holySel: null,
  hocaPick: [],
  hocaName: '',
  elif: { part: 'letters', i: 0, quiz: null },
  esma: { i: 0, quiz: null, list: false },
  holyDua: null,
  remMsg: '',
  // Weiter ohne Tippen: Apple Watch / Kopfhörer bzw. Hand über die Kamera
  remoteMedia: store.get('remoteMedia', false),
  remoteCam: store.get('remoteCam', false),
  quiz: null,
  // Haltungserkennung in VR: Stehhöhe des Kopfes, erkannte Haltung, wie lange schon gehalten
  // dazu in Mixed Reality/VR mit Hand-Erkennung: Hinweis zur Handhaltung und erhobener Zeigefinger
  posture: { standH: null, ok: false, held: 0, cueT: 0, handHint: null, finger: false },
};

// Sprachausgabe: freie Piper-Stimmen, sonst die Stimme des Geräts
const voices = new Voices({ enabled: store.get('piper', true), onChange: () => refresh() });

const saveProgress = () => store.set(progKey(profileId), state.progress);
// Zuschauen: der Vorbeter macht alles vor, die App liest vor und geht von selbst weiter (auch mehrere Abläufe hintereinander)
const WATCH = [
  { id: 'wudufajr', seq: ['wudu', 'fajr'] }, { id: 'wudu', seq: ['wudu'] }, { id: 'fajr', seq: ['fajr'] }, { id: 'dhuhr', seq: ['dhuhr'] },
  { id: 'asr', seq: ['asr'] }, { id: 'maghrib', seq: ['maghrib'] }, { id: 'isha', seq: ['isha'] }, { id: 'witr', seq: ['witr'] },
  { id: 'jumua', seq: ['jumua'] }, { id: 'eid', seq: ['eid'] }, { id: 'janaza', seq: ['janaza'] }, { id: 'ghusl', seq: ['ghusl'] },
];
// Hoca-Modus: Aufgaben, die ein Lehrer per Link schickt (?tasks=fajr,sura:ikhlas,elif&from=Klasse)
const HOCA_SURAS = ['fatiha', 'ikhlas', 'kawthar', 'asr', 'falaq', 'nas', 'fil', 'quraysh', 'maun', 'kafirun', 'nasr', 'masad'];
const TASK_IDS = ['wudu', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr', ...HOCA_SURAS.map((x) => `sura:${x}`), 'elif', 'esma', 'story', 'fullDay', 'quiz'];
function taskInfo(id, p = state.progress) {
  if (id.startsWith('sura:')) { const s = id.slice(5); return { id, label: `📖 ${t(`suras.names.${s}`)}`, ok: !!p.suras?.[s], action: `sura:${s}` }; }
  if (id === 'wudu') return { id, label: `💧 ${t('pn.wudu')}`, ok: p.wudu > 0, action: 'wudu' };
  if (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr'].includes(id)) return { id, label: `🕌 ${findPrayer(id).name}`, ok: !!p.done[id], action: `prayer:${id}` };
  const ok = { elif: (p.elifBest || 0) >= 8, esma: (p.esmaSeen || []).length >= 10, story: Object.keys(p.stories || {}).length > 0, fullDay: BADGES[9].test(p), quiz: p.quizBest >= 7 }[id];
  const action = { elif: 'elif:quiz', esma: 'esma', story: 'stories', fullDay: 'tracker', quiz: 'quiz' }[id];
  return { id, label: `⭐ ${t(`hoca.t.${id}`)}`, ok: !!ok, action };
}
try {
  const q = new URLSearchParams(location.search);
  if (q.has('tasks')) {
    const ids = q.get('tasks').split(',').filter((x) => TASK_IDS.includes(x));
    if (ids.length) store.set('tasks', { ids, from: (q.get('from') || '').slice(0, 40) });
  }
} catch { /* kein Fenster */ }
// Kaza: offene (nachzuholende) Gebete und Fastentage je Profil
const KAZA_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr', 'fast'];
const kazaOf = () => ({ ...Object.fromEntries(KAZA_IDS.map((k) => [k, 0])), made: 0, ...(state.progress.kaza || {}) });
function kazaDone(id) {
  const k = kazaOf();
  if (k[id] > 0) { k[id]--; k.made++; }
  state.progress.kaza = k; saveProgress();
}
// Teilen (Handy) oder in die Zwischenablage kopieren
function shareText(text, url) {
  const done = () => { state.hocaMsg = t('hoca.copied'); refresh(); };
  if (navigator.share) { navigator.share(url ? { text, url } : { text }).catch(() => {}); return; }
  navigator.clipboard?.writeText(text).then(done, () => {});
}
// Gedanke für heute: jeden Tag ein anderer Grund zu beten
function dailyThought() {
  const list = t('path.why');
  const d = new Date(), day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  const [title, text, kid] = list[day % list.length];
  return { title, text: state.kids ? kid : text };
}
// Angesehene Namen Allahs zählen (für Eltern-Übersicht und Urkunden)
function markEsma() {
  const seen = new Set(state.progress.esmaSeen || []);
  if (seen.has(state.esma.i)) return;
  seen.add(state.esma.i); state.progress.esmaSeen = [...seen]; saveProgress();
}
const profName = (p) => p.name || (p.id === 'main' ? t('prof.me') : t('prof.child', Math.max(1, profiles.indexOf(p))));

// Weiter ohne Tippen (siehe remote.js); Anzeige oben links, solange etwas aktiv ist
const remoteInd = document.createElement('div');
remoteInd.id = 'rind';
document.body.appendChild(remoteInd);
let remoteFlashT = null;
function remoteFlash() {
  remoteInd.classList.add('flash');
  clearTimeout(remoteFlashT);
  remoteFlashT = setTimeout(() => remoteInd.classList.remove('flash'), 600);
}
function remoteNext() { if (state.view === 'step') { act('next'); remoteFlash(); } }
function remotePrev() { if (state.view === 'step') { act('prev'); remoteFlash(); } }
// Große Schrift und ruhiger Modus (für jüngere Kinder und ältere Menschen)
function applyComfort() {
  document.documentElement.classList.toggle('big', !!state.big);
  document.documentElement.classList.toggle('calm', !!state.quiet);
}

// Eltern-Übersicht: was jedes Familienmitglied geübt hat und wo es noch hakt
function parentReport(p, prog) {
  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return dayKey(d); });
  const learnedPrayers = PRAYERS.filter((x) => prog.done[x.id]);
  const missing = PRAYERS.filter((x) => !prog.done[x.id]);
  const suraList = SURAS.filter((x) => !x.call);
  const suras = suraList.filter((x) => prog.suras?.[x.id]);
  const tracked = last7.reduce((a, k) => a + (prog.log?.[k]?.length || 0), 0);
  const tips = [];
  if (!prog.wudu) tips.push(t('par.tipWudu'));
  if (missing.length && missing.length < PRAYERS.length) tips.push(t('par.tipMissing', missing.map((x) => x.name).join(', ')));
  if (!learnedPrayers.length) tips.push(t('par.tipFirst'));
  if (!suras.length) tips.push(t('par.tipSura'));
  else if (suras.length < suraList.length) tips.push(t('par.tipNextSura', suraList.find((x) => !prog.suras?.[x.id]).name));
  if (prog.quizRuns && prog.quizBest < 7) tips.push(t('par.tipQuiz'));
  if (!prog.quizRuns) tips.push(t('par.tipQuizStart'));
  if (!last7.some((k) => prog.days.includes(k))) tips.push(t('par.tipRoutine'));
  if (!prog.done.sahw) tips.push(t('par.tipSahw'));
  return {
    id: p.id, name: profName(p), icon: p.icon, kids: !!p.kids,
    days7: last7.filter((k) => prog.days.includes(k)).length, streak: streak(prog),
    prayers: learnedPrayers.map((x) => x.name), prayersN: learnedPrayers.length, prayersOf: PRAYERS.length,
    wudu: prog.wudu, ghusl: prog.done.ghusl || 0, tayammum: prog.done.tayammum || 0,
    suras: suras.map((x) => x.name), surasOf: suraList.length,
    quizBest: prog.quizBest, quizRuns: prog.quizRuns, stars: prog.stars || 0, tracked,
    stories: Object.keys(prog.stories || {}).length,
    tips: tips.slice(0, 4),
  };
}

const mediaRemote = new MediaRemote({ next: remoteNext, prev: remotePrev, busy: () => voices.busy, edge: () => voices.edgeAt ?? -1e9 });
let camState = 'off';
const handWave = new HandWave({ onTrigger: remoteNext, onState: (st) => { camState = st; showRemoteInd(); if (st === 'denied') { state.remoteCam = false; store.set('remoteCam', false); refresh(); } } });
function showRemoteInd() {
  const parts = [];
  if (mediaRemote.on) parts.push(t('remote.mediaOn'));
  if (camState === 'on') parts.push(t('remote.camOn'));
  else if (camState === 'dark') parts.push(t('remote.camDark'));
  remoteInd.textContent = parts.join(' · ');
  remoteInd.classList.toggle('show', parts.length > 0);
}
// Ein- und ausschalten passend zur Ansicht: nur während eines Ablaufs
function syncRemote() {
  const active = state.view === 'step' || state.view === 'done';
  if (state.remoteMedia && active) {
    if (!mediaRemote.on) mediaRemote.start();
    const st = state.steps[state.i];
    mediaRemote.show(state.view === 'done' ? t('remote.finished') : st?.title || '', state.prayer?.name || '');
  } else mediaRemote.stop();
  if (state.remoteCam && state.view === 'step') { if (!handWave.on) handWave.start(); } else if (handWave.on) handWave.stop();
  showRemoteInd();
}

// Klänge für Umre & Hac und den Waschraum (im Browser erzeugt)
const ambience = new Ambience(() => voices.audioCtx());
// Bei diesen Schritten hört man die Talbiya der Pilger von fern (bis zum ersten Steinwurf)
const CHORUS = new Set(['talbiya', 'arrive', 'ihramH', 'mina8', 'arafat', 'wuquf', 'muzdalifa', 'pebbles', 'muzWuquf']);
const TALBIYA_AR = 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ';

const madhab = () => MADHABS.find((m) => m.id === state.madhab) || MADHABS[0];
const bearing = () => qiblaBearing(state.location.lat, state.location.lon);
const isCalibrated = () => state.northYaw != null || state.qiblaYaw != null;
// Der eigene Standort heißt in jeder Sprache anders (ältere Speicherstände kennen nur den deutschen Namen).
const isGps = () => !!state.location.gps || state.location.name === 'Mein Standort';
const locationName = () => (isGps() ? t('ui.myLocation') : state.location.name);
const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Gebetszeiten für heute am gewählten Ort, als fertige Anzeigewerte.
function timesInfo() {
  const loc = { ...state.location, timeZone: state.location.timeZone || deviceZone };
  const now = new Date();
  const s = prayerStatus(loc, now, state.method, state.asr);
  const name = (id) => TIME_NAMES.find((n) => n.id === id).name;
  return {
    rows: TIME_NAMES.map((n) => ({ ...n, time: formatTime(s.times[n.id], loc.timeZone) })),
    current: s.current,
    next: { id: s.next.id, name: name(s.next.id), time: formatTime(s.next.at, loc.timeZone), inText: formatCountdown(s.next.at - now) },
    highLatitude: s.highLatitude,
    method: METHODS.find((m) => m.id === state.method).name,
    asr: ASR.find((a) => a.id === state.asr).name,
    location: locationName(),
  };
}

function applyQibla() {
  const b = THREE.MathUtils.degToRad(bearing());
  world.rotation.y = state.qiblaYaw != null ? state.qiblaYaw : state.northYaw == null ? 0 : state.northYaw - b;
  compass.rotation.y = b;
  if (mobileUI) aimAtGuide();
}

// Nacht zwischen Maghrib und Sonnenaufgang: dunkle Fenster, hellere Lampen
function isNight() {
  // ?night=1 / ?night=0 erzwingt Nacht oder Tag (zum Prüfen der Beleuchtung)
  const force = new URLSearchParams(location.search).get('night');
  if (force === '1' || force === '0') return force === '1';
  const loc = { ...state.location, timeZone: state.location.timeZone || deviceZone };
  const now = new Date();
  const { times } = prayerStatus(loc, now, state.method, state.asr);
  return now < times.sunrise || now >= times.maghrib;
}

// Die Gebetswaschung findet im Waschraum statt, nicht im Gebetssaal
const wantsWuduRoom = () => state.prayer?.kind === 'wudu' && (state.view === 'step' || state.view === 'done');

// Umre und Hac: Ort des aktuellen Schritts (Mīqāt-Moschee, Haram, Sa'y-Gang, Mina, ʿArafāt, Muzdalifa, Jamarāt)
const pilgrimActive = () => isPilgrimage(state.prayer) && (state.view === 'step' || state.view === 'done');
const pilgrimStep = () => (state.view === 'done' ? state.steps[state.steps.length - 1] : state.steps[state.i]);
const wantsScene = () => (state.view === 'sky' ? 'starsky' : pilgrimActive() ? pilgrimStep()?.scene || 'haram' : null);
// Geschichten der Propheten (laufen wie Umre & Hac über Orte und Schritte, aber ohne Vorbeter)
const storyActive = () => pilgrimActive() && state.prayer.kind === 'story';

function rebuildEnv() {
  state.night = isNight();
  state.wuduRoom = wantsWuduRoom();
  state.scene = wantsScene();
  clearEnvironment(env);
  env.rotation.set(0, 0, 0);
  env.position.set(0, 0, 0);
  const sc = state.scene;
  const night = sc === 'arafat' ? false : sc === 'muzdalifa' ? true : state.night;
  buildEnvironment(env, state.wuduRoom ? 'wudu' : sc && sc !== 'miqat' ? sc : sc === 'miqat' ? 'klassisch' : state.style, { night });
  graphics.afterBuild(env);
  graphics.casters(env);
  graphics.setEnv(envFor(state.wuduRoom ? 'wudu' : sc, night));
  if (sc) placePilgrim(true);
  layoutRoom();
}

// Empore nur in der Großmoschee; sonst beten die Frauen hinter dem Holzgitter
const gallery = () => (state.womenPlace === 'gallery' ? galleryInfo(state.style) : null);
// Betet man als Frau auf der Empore, steht man oben: der Saal liegt tiefer und weiter vorn.
const onGallery = () => !!gallery() && state.gender === 'f' && cong.group.visible;

// Panel, Vorbeter und Teppiche je nach Raum: im Waschraum hängt das Panel über deinem Becken,
// der Vorbeter wäscht sich am Becken rechts neben dir.
function layoutRoom() {
  const w = state.wuduRoom;
  if (w) {
    state.atStools = atStools();
    placeWuduFigures(true);
    panel.mesh.position.set(0, 1.62, -0.84);
    panel.mesh.rotation.set(0.1, 0, 0);
    panel.mesh.scale.setScalar(0.72);
  } else {
    movers.delete(guide);
    guide.group.position.set(1.5, 0, -1.5);
    guide.group.rotation.y = Math.PI;
    panel.mesh.position.set(-0.75, 1.35, -1.5);
    panel.mesh.rotation.set(-0.05, 0.32, 0, 'YXZ');
    panel.mesh.scale.setScalar(1);
  }
  const outdoor = state.scene && state.scene !== 'miqat';
  userRug.visible = compass.visible = !w && !outdoor;
  card.mesh.visible = !w && !mobileUI;
  if (!w) guideRug.visible = guide.group.visible && !outdoor;
  else guideRug.visible = false;
  if (mobileUI) aimAtGuide();
  // Am Computer auf das Panel schauen, wenn der Raum wechselt
  else if (!renderer.xr.isPresenting) {
    const target = panel.mesh.getWorldPosition(new THREE.Vector3());
    const d = target.sub(camera.position);
    yaw = Math.atan2(-d.x, -d.z);
    pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }
}

// --- Umre und Hac: den Ort so verschieben, dass du an der Stelle des Schritts stehst ---
// p = { x, z, hx, hz } in Ortskoordinaten (Position und Blickrichtung)
const UPV = new THREE.Vector3(0, 1, 0);
function setEnvPose(p) {
  const yaw = Math.atan2(-p.hx, -p.hz);
  env.rotation.set(0, -yaw, 0);
  env.position.copy(new THREE.Vector3(p.x, 0, p.z).applyAxisAngle(UPV, -yaw).negate());
  // Höhe: an Deck stehen (y > 0) oder ganz klein bei den Ameisen (y < 0)
  env.position.y = -(p.y || 0);
}
function placePilgrim(snap = false) {
  if (!state.scene) return;
  if (state.scene === 'starsky') { setEnvPose({ x: 0, z: 0, hx: 0, hz: -1 }); return; }
  const st = pilgrimStep();
  if (st?.story) { setEnvPose({ ...st.place, y: (st.place.y || 0) + storyLift() }); return; }
  const m = st?.motion;
  let p = m && m.type !== 'throw' ? pathAt(m, state.view === 'done' ? pathLength(m) : state.pilgrim?.d || 0) : st?.place;
  if (!p) p = { x: 0, z: 0, hx: 0, hz: -1 };
  // Mitgehen aus (angenehmer für manche in VR): in kurzen Sprüngen statt fließend
  if (!snap && !state.walkAlong && m && m.type !== 'throw') {
    const stepLen = m.type === 'tawaf' ? 6 : 10;
    const d = Math.floor((state.pilgrim.d || 0) / stepLen) * stepLen;
    if (state.pilgrim.snap === d) return;
    state.pilgrim.snap = d;
    p = pathAt(m, d);
  }
  setEnvPose(p);
}

// Ein Steinchen fliegt von dir zur Säule
const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8a8478 }));
pebble.visible = false;
world.add(pebble);
const throwAnim = { t: -1, from: new THREE.Vector3(), to: new THREE.Vector3() };
function throwPebble(target) {
  setTimeout(() => ambience.pebble(), 800);
  throwAnim.t = 0;
  throwAnim.from.set(0.25, 1.55, -0.3);
  const w = env.localToWorld(new THREE.Vector3(0, 2.6, JAMARAT[target].z - 8));
  throwAnim.to.copy(world.worldToLocal(w));
  pebble.visible = true;
}

function updatePilgrim(dt) {
  const st = state.view === 'step' && state.steps[state.i];
  const m = st?.motion, pg = state.pilgrim;
  let moving = false;
  if (st && m && (m.type === 'tawaf' || m.type === 'say')) {
    const len = pathLength(m);
    if (pg.d < len) { pg.d = Math.min(len, pg.d + speedAt(m, pg.d) * dt * (state.beginner || state.kids ? 0.8 : 1)); moving = true; pg.speed = speedAt(m, pg.d); }
    placePilgrim();
  } else if (st && m?.type === 'throw') {
    pg.tt += dt;
    // Alle 2,4 Sekunden ein Wurf: Hand hoch, Stein fliegt
    const due = Math.min(m.count, Math.floor(pg.tt / 2.4));
    if (due > pg.thrown) { pg.thrown = due; throwPebble(m.target); }
    const up = pg.tt % 2.4 < 0.9 && pg.thrown < m.count;
    posePerson(guide, up ? 'throw' : 'stand');
  }
  if (throwAnim.t >= 0) {
    throwAnim.t += dt / 0.8;
    const k = Math.min(1, throwAnim.t);
    pebble.position.lerpVectors(throwAnim.from, throwAnim.to, k);
    pebble.position.y += Math.sin(Math.PI * k) * 1.2;
    if (k >= 1) { throwAnim.t = -1; pebble.visible = false; }
  }
  // Mitgehen: der Vorbeter macht Schritte
  pg.moving = moving;
  // Semah: die Gruppe steht auf und dreht sich; du und der Rehber drehen mit
  const semah = (st && st.semah) || 0;
  setSemah(semah);
  if (state.scene === 'cemevi') {
    const ci = state.steps.findIndex((x) => x.id === 'cerag');
    setCemStep(state.view === 'step' ? st?.id || '' : '', ci < 0 || state.view !== 'step' || state.i >= ci);
  }
  ambience.music(state.scene === 'cemevi' && !state.quiet ? (semah || (st && st.id === 'zakir' ? 1 : 0)) : 0);
  if (moving) for (const fig of [guide]) {
    const swing = Math.sin(clock.elapsedTime * (semah ? (semah === 2 ? 6 : 3.5) : 7)) * (semah ? 0.25 : 0.35);
    fig.legs[0].hip.rotation.x = swing;
    fig.legs[1].hip.rotation.x = -swing;
    if (semah) continue; // Arme bleiben in der Semah-Bewegung
    fig.arms[0].sh.rotation.x = -swing * 0.6;
    fig.arms[1].sh.rotation.x = swing * 0.6;
  }
  if (st) {
    const s = statusOf(m, pg.d, pg.thrown);
    if (s !== st.status) { st.status = s; refresh(); }
  }
}

// --- Waschraum: Füße werden auf den Hockern rechts gewaschen ---
// Ab dem ersten Fuß-Schritt (und danach beim Bittgebet) sitzt der Vorbeter dort; vorher stehen sie an den Becken.
const atStools = () => {
  if (!state.wuduRoom) return false;
  const k = state.steps.findIndex((x) => x.wudu === 'footR');
  return k >= 0 && (state.view === 'done' || (state.view === 'step' && state.i >= k));
};

// Figuren gehen zu ihrem Platz: über einen Punkt hinter den Becken, damit niemand durch dich hindurchläuft
const movers = new Map();
function sendTo(fig, pos, rot, snap) {
  const g = fig.group;
  if (snap) { movers.delete(fig); g.position.copy(pos); g.rotation.y = rot; fig.setPose(fig.wantPose || 'stand'); return; }
  const m = movers.get(fig);
  if (m ? m.to.distanceTo(pos) < 0.02 : g.position.distanceTo(pos) < 0.02) { if (!m) g.rotation.y = rot; return; }
  const via = pos.x > 2 ? new THREE.Vector3(g.position.x, 0, 1.15) : new THREE.Vector3(pos.x, 0, 1.15);
  movers.set(fig, { path: [g.position.clone(), via, pos.clone()], i: 0, k: 0, t: 0, rot, to: pos.clone() });
  fig.setPose('stand');
}
function placeWuduFigures(snap = false) {
  const st = wuduStools(), feet = atStools() && st.length > 1;
  sendTo(guide, feet ? new THREE.Vector3(st[0][0], 0, st[0][1]) : new THREE.Vector3(1.1, 0, 0), feet ? Math.PI / 2 : Math.PI, snap);
}
// Haltung setzen; wer gerade geht, nimmt sie erst am Ziel ein
// Stuhl unter der Figur, wenn im Sitzen auf dem Stuhl gebetet wird
let chairMesh = null;
function setChair(on) {
  if (!on && !chairMesh) return;
  if (!chairMesh) {
    chairMesh = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.7 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.44), wood);
    seat.position.set(0, 0.45, 0.06);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.04), wood);
    back.position.set(0, 0.7, -0.17);
    chairMesh.add(seat, back);
    for (const [x, z] of [[-0.2, -0.14], [0.2, -0.14], [-0.2, 0.26], [0.2, 0.26]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.45, 0.035), wood);
      leg.position.set(x, 0.225, z);
      chairMesh.add(leg);
    }
    guide.group.add(chairMesh);
  }
  chairMesh.visible = on;
}
function posePerson(fig, pose) {
  fig.wantPose = pose;
  if (!movers.has(fig)) fig.setPose(pose);
}
function updateMovers(dt) {
  for (const [fig, m] of movers) {
    const a = m.path[m.i], b = m.path[m.i + 1];
    m.t += dt;
    m.k += (dt * 1.1) / Math.max(a.distanceTo(b), 0.001);
    if (m.k >= 1) {
      m.i++; m.k = 0;
      if (m.i >= m.path.length - 1) {
        fig.group.position.copy(m.to);
        fig.group.rotation.y = m.rot;
        movers.delete(fig);
        fig.setPose(fig.wantPose || 'stand');
        continue;
      }
    }
    const p = m.path[m.i], q = m.path[m.i + 1];
    fig.group.position.lerpVectors(p, q, m.k);
    if (p.distanceTo(q) > 0.01) fig.group.rotation.y = Math.atan2(q.x - p.x, q.z - p.z);
    // Schritte: Beine und Arme schwingen
    const swing = Math.sin(m.t * 7) * 0.35;
    fig.legs[0].hip.rotation.x = swing;
    fig.legs[1].hip.rotation.x = -swing;
    fig.arms[0].sh.rotation.x = -swing * 0.6;
    fig.arms[1].sh.rotation.x = swing * 0.6;
  }
}

function rebuildCong() {
  cong.build({ size: state.cemaatSize, gender: state.gender, natural: state.cemaatNatural, blocked, gallery: gallery() });
  graphics.casters(cong.group);
  updateCast(true);
}

// Mit Cemaat beten Imam und Gemeinde; bei der Gebetswaschung zeigt weiter die Vorbeter-Figur.
function updateCast(force = false) {
  const wudu = state.view === 'step' && state.prayer?.kind === 'wudu';
  const show = state.cemaat && !wudu && !pilgrimActive();
  if (show === cong.group.visible && !force) return;
  cong.group.visible = show;
  guide.group.visible = !show;
  guideRug.visible = !show && !state.wuduRoom && !(state.scene && state.scene !== 'miqat');
  const g = onGallery() ? gallery() : null;
  env.position.set(0, g ? -g.top : 0, g ? -g.z : 0);
  // Handy: Kamera auf Imam und Reihen bzw. zurück auf die Vorbeter-Figur
  if (mobileUI) aimAtGuide();
}
const leader = () => (cong.group.visible && cong.imam ? cong.imam.g : guide);

// Blickrichtung (Yaw) von Kopf bzw. Desktop-Kamera; 0 = Start-Blickrichtung.
function currentYaw() {
  const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : camera;
  const d = new THREE.Vector3();
  cam.getWorldDirection(d);
  return Math.atan2(-d.x, -d.z);
}

function view() {
  switch (state.view) {
    case 'qibla':
      return { type: 'qibla', cities: CITIES, location: { ...state.location, gps: isGps() }, locationName: locationName(), bearing: bearing(), calibrated: isCalibrated(), xr: renderer.xr.isPresenting, msg: state.msg };
    case 'step':
      return {
        type: 'step', prayer: state.prayer, step: state.steps[state.i], index: state.i, total: state.steps.length, auto: state.auto,
        prevPose: state.steps[state.i - 1]?.pose ?? null,
        inner: state.kids ? kidLine(state.steps[state.i]) : state.spiritual ? innerMeaning(state.steps[state.i]) : '',
        kids: state.kids,
        posture: state.steps[state.i].wudu ? 'wudu' : state.steps[state.i].hajj ? 'hajj' : !renderer.xr.isPresenting ? 'off' : state.posture.ok ? 'ok' : 'wait',
        handHint: renderer.xr.isPresenting ? state.posture.handHint : null,
        finger: renderer.xr.isPresenting && state.posture.finger,
        voice: state.voice,
        noVoice: state.voice && voiceMissing(),
        canDownload: voices.supported && !!PIPER[langInfo().speech],
      };
    case 'mosque':
      return { type: 'mosque', styles: STYLES, style: state.style, cemaat: state.cemaat, size: state.cemaatSize, natural: state.cemaatNatural, womenPlace: state.womenPlace };
    case 'voice':
      return {
        type: 'voice', enabled: voices.enabled, supported: voices.supported, lang: langInfo().speech,
        voices: Object.entries(PIPER).map(([id, v]) => ({ ...v, id, model: v.id, langName: LANGS.find((l) => l.id === id).name, status: voices.status(id), progress: voices.progress(id), error: voices.state[id]?.error })),
      };
    case 'profiles':
      return {
        type: 'profiles', pDel: state.pDel, max: MAX_PROFILES,
        list: profiles.map((p) => {
          const pr = p.id === profileId ? state.progress : loadProgress(p.id);
          return { id: p.id, name: profName(p), icon: p.icon, kids: !!p.kids, active: p.id === profileId,
            today: prayedOn(pr, keyFor(0)).length, streak: fullStreak(pr), stars: pr.stars || 0, suras: Object.values(pr.suras || {}).filter(Boolean).length };
        }),
      };
    case 'alevi':
      return { type: 'alevi', list: ALEVI, walkAlong: state.walkAlong, sounds: state.sounds };
    case 'muharrem': {
      const m = muharremInfo(new Date(), state.location.timeZone || deviceZone);
      return { type: 'muharrem', ...m, dateText: m.date && formatDay(m.date), part: state.muharremPart || 'about' };
    }
    case 'alevival':
      return { type: 'alevival', index: state.saying, total: SAYINGS };
    case 'pilgrim':
      return { type: 'pilgrim', list: PILGRIMAGES, walkAlong: state.walkAlong, sounds: state.sounds, madhab: madhab().name, gender: state.gender };
    case 'remind':
      return { type: 'remind', back: ['settings', 'holy'].includes(state.remFrom) ? state.remFrom : 'times', ...state.remind, prayerList: PRAYERS.map((p) => ({ id: p.id, name: p.name, on: state.remind.prayers.includes(p.id) })), msg: state.remMsg, supported: canNotify(), perm: canNotify() ? Notification.permission : 'unsupported',
        ios: /iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone, next: timesInfo().next };
    case 'tracker': {
      const p = state.progress, key = keyFor(state.trackBack);
      return {
        type: 'tracker', back: state.trackBack, maxBack: TRACK_DAYS - 1, kids: state.kids,
        day: week(p).find((d) => d.back === state.trackBack),
        prayers: PRAYERS.map((x) => ({ id: x.id, name: x.name, ar: x.ar, ok: prayedOn(p, key).includes(x.id) })),
        week: week(p), streak: fullStreak(p), dayDone: dayDone(p, key),
      };
    }
    case 'ramadan': {
      const loc = { ...state.location, timeZone: state.location.timeZone || deviceZone };
      const r = ramadanInfo(loc, new Date(), state.method, state.asr);
      const now = new Date();
      const at = (d) => d && { time: formatTime(d, loc.timeZone), inText: formatCountdown(d - now), past: d <= now };
      return {
        type: 'ramadan', ...r, location: locationName(), kids: state.kids, dua: state.ramadanDua,
        startText: r.start && formatDay(r.start.date), eidText: r.eid && formatDay(r.eid.date),
        sahur: at(r.inRamadan && r.nextSahur), iftar: at(r.inRamadan && r.maghrib),
      };
    }
    case 'more':
      return { type: 'more', prayers: EXTRA_PRAYERS, madhab: madhab().name };
    case 'purify':
      return { type: 'more', title: t('pure.title'), note: t('pure.note'), prayers: PURIFY, madhab: madhab().name };
    case 'zakat': {
      const z = state.zakat;
      const net = z.cash + z.other + z.gold * z.goldPrice + z.silver * z.silverPrice - z.debts;
      const nisab = z.by === 'gold' ? 85 * z.goldPrice : 595 * z.silverPrice;
      const money = (n) => { try { return new Intl.NumberFormat(langInfo().locale, { style: 'currency', currency: z.cur, maximumFractionDigits: 2 }).format(n); } catch { return `${n.toFixed(2)} ${z.cur}`; } };
      return { type: 'zakat', z, money, net, nisab, priced: nisab > 0, due: nisab > 0 && net >= nisab ? net * 0.025 : 0, fitra: z.persons * z.perPerson };
    }
    case 'cuma': {
      const day = new Date().getDay();
      return { type: 'cuma', kids: state.kids, inDays: (5 - day + 7) % 7, remindOn: state.remind.cuma !== false && state.remind.on };
    }
    case 'siyer': {
      const ev = t('siyer.events');
      return { type: 'siyer', i: state.siyer, n: ev.length, ev: ev[state.siyer], kids: state.kids };
    }
    case 'certs': {
      const p = state.progress;
      return { type: 'certs', list: BADGES.map((b, i) => ({ i, name: b.name, ok: b.test(p) })), msg: state.certMsg || '', vr: !mobileUI && !!renderer.xr.isPresenting };
    }
    case 'hoca':
      return { type: 'hoca', all: TASK_IDS.map((id) => ({ ...taskInfo(id), on: state.hocaPick.includes(id) })), name: state.hocaName, link: state.hocaLink || '', msg: state.hocaMsg || '' };
    case 'tasks': {
      const T = store.get('tasks', null);
      const list = T ? T.ids.map((id) => taskInfo(id)) : [];
      return { type: 'tasks', from: T?.from || '', list, done: list.filter((x) => x.ok).length, msg: state.hocaMsg || '' };
    }
    case 'path': {
      const p = state.progress, log = p.log || {};
      const daysWith = (n) => Object.values(log).filter((l) => l.length >= n).length;
      // Tage in Folge mit mindestens einem Gebet (bis heute oder gestern)
      let streakN = 0;
      { const d = new Date(); if (!(log[dayKey(d)] || []).length) d.setDate(d.getDate() - 1); while ((log[dayKey(d)] || []).length) { streakN++; d.setDate(d.getDate() - 1); } }
      const tests = [
        () => p.wudu > 0, () => !!p.done.fajr, () => !!p.suras?.fatiha, () => !!p.suras?.ikhlas, () => daysWith(1) >= 3,
        () => PRAYERS.every((x) => p.done[x.id]), () => daysWith(3) >= 1, () => BADGES[9].test(p), () => BADGES[10].test(p),
      ];
      const acts = ['wudu', 'prayer:fajr', 'sura:fatiha', 'sura:ikhlas', 'tracker', 'more5', 'tracker', 'tracker', 'tracker'];
      const steps = t('path.steps').map(([title, text], i) => ({ title, text, ok: tests[i](), action: acts[i] }));
      const cur = steps.findIndex((x) => !x.ok);
      const garden = Array.from({ length: 14 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - (13 - k)); const n = (log[dayKey(d)] || []).length; return n >= 5 ? '🌸' : n >= 3 ? '🌿' : n >= 1 ? '🌱' : '🟫'; });
      const tinfo = timesInfo(), nowId = tinfo.current && PRAYERS.some((x) => x.id === tinfo.current) ? tinfo.current : tinfo.next.id;
      return { type: 'path', part: state.pathPart || 'steps', steps, cur, streak: streakN, restart: streakN === 0 && Object.keys(log).length > 0,
        garden, gardenEmpty: !Object.values(log).some((l) => l.length), why: t('path.why'), kids: state.kids, now: { id: nowId, name: findPrayer(nowId).name }, thought: dailyThought() };
    }
    case 'watch':
      return { type: 'watch', list: WATCH.map((w) => ({ id: w.id, label: w.id === 'wudufajr' ? t('watch.wudufajr') : findPrayer(w.id).name, sub: w.seq.length > 1 ? '' : findPrayer(w.id).de })) };
    case 'hub':
      return { type: 'hub', id: state.hubId, title: t('ui.grp.pray'), items: hubItems(state.hubId, { adapted: !!state.sitting || state.travel }) };
    case 'adapt':
      return { type: 'adapt', sitting: state.sitting, travel: state.travel, madhab: madhab() };
    case 'kaza': {
      const k = kazaOf(), open = KAZA_IDS.reduce((a, id) => a + k[id], 0);
      return { type: 'kaza', k, open, ids: KAZA_IDS, names: Object.fromEntries(KAZA_IDS.map((id) => [id, id === 'fast' ? t('kaza.fast') : findPrayer(id).name])), years: state.kazaYears || 1, madhab: madhab() };
    }
    case 'elif': {
      const e = state.elif, z = e.quiz;
      return { type: 'elif', part: e.part, i: e.i, letter: LETTERS[e.i], total: LETTERS.length, marks: MARKS, words: WORDS, kids: state.kids,
        best: state.progress.elifBest || 0,
        quiz: z && { ...z, cur: z.q[z.i] && { ...z.q[z.i], letter: LETTERS[z.q[z.i].ans], opts: z.q[z.i].opts.map((k) => ({ k, name: LETTERS[k].name })) } } };
    }
    case 'esma': {
      const e = state.esma, z = e.quiz;
      return { type: 'esma', i: e.i, name: ESMA[e.i], all: e.list ? ESMA : null, kids: state.kids, seen: (state.progress.esmaSeen || []).length, best: state.progress.esmaBest || 0,
        quiz: z && { ...z, cur: z.q[z.i] && { ...z.q[z.i], name: ESMA[z.q[z.i].ans], opts: z.q[z.i].opts.map((k) => ({ k, mean: ESMA[k].mean })) } } };
    }
    case 'hajjinfo': {
      const arafa = holyList(new Date(), state.location.timeZone || deviceZone).find((e) => e.id === 'arafa');
      const start = arafa && addDays(arafa.day, -1);
      return { type: 'hajjinfo', part: state.hajjPart || 'basics', kids: state.kids, nextText: arafa ? t('hinfo.next', formatDay(start), Math.max(0, arafa.days - 1)) : '' };
    }
    case 'nafile':
      return { type: 'more', title: t('nfl.title'), note: t('nfl.note'), prayers: NAFILE, madhab: madhab().name };
    case 'holy': {
      const tz = state.location.timeZone || deviceZone;
      const when = (e) => (e.days === 0 ? t('holy.today') : e.days === -1 ? t('holy.today') : e.days === 1 ? t('holy.tomorrowShort') : t('holy.inDays', e.days));
      const list = holyList(new Date(), tz).map((e) => ({
        id: e.id, icon: e.icon, night: !!e.night, days: e.days, name: t(`holy.${e.id}.name`), short: t(`holy.${e.id}.short`), when: when(e),
        dateText: e.night ? t('holy.nightOf', formatDay(e.eve)) : formatDay(e.day), hijriText: formatHijri(e.day),
      }));
      const sel = list.find((e) => e.id === state.holySel);
      let detail = null;
      if (sel) {
        const L = HOLY_LINKS[sel.id];
        const label = (a) => (a.startsWith('prayer:') ? findPrayer(a.slice(7)).name : a === 'tasbih' ? t('ui.menuTasbih') : a === 'muharrem' ? t('alevi.muharremBtn') : a === 'ramadan' ? t('ram.menu') : a === 'hajjinfo' ? t('hinfo.btn') : a === 'pilgrim' ? t('hajj.menu') : t('story.menu'));
        detail = {
          ...sel, about: t(`holy.${sel.id}.about`), todo: t(`holy.${sel.id}.do`), kidsText: t(`holy.${sel.id}.kids`), note: t(`holy.${sel.id}.note`),
          acts: L.acts.map((a) => ({ action: a, label: label(a) })), duas: L.duas.map((k) => ({ key: k, label: t(`holy.duaName.${k}`) })),
          dua: state.holyDua && L.duas.includes(state.holyDua) ? prayerText(state.holyDua) : null, duaKey: state.holyDua,
        };
      }
      return { type: 'holy', list, detail, kids: state.kids, remindOn: state.remind.on && state.remind.holy, msg: state.remMsg };
    }
    case 'parents':
      return { type: 'parents', list: profiles.map((p) => parentReport(p, p.id === profileId ? state.progress : loadProgress(p.id))) };
    case 'settings':
      return { type: 'settings', gfxHigh: graphics.high, faces: store.get('faces', true),
        big: state.big, calm: state.quiet,
        remoteMedia: state.remoteMedia, remoteCam: state.remoteCam, mediaOk: mediaRemote.supported, camOk: handWave.supported, langs: LANGS, lang: getLang(), madhabs: MADHABS, madhab: madhab(), beginner: state.beginner, gender: state.gender, spiritual: state.spiritual };
    case 'learn': {
      const p = state.progress;
      return {
        type: 'learn', progress: p, streak: streak(p),
        totalPrayers: Object.values(p.done).reduce((a, b) => a + b, 0),
        badges: BADGES.map((b) => ({ name: b.name, ok: b.test(p) })),
      };
    }
    case 'quiz':
      return { type: 'quiz', quiz: state.quiz, progress: state.progress };
    case 'done':
      return { type: 'done', watched: !!state.watch, prayer: state.prayer, kids: state.kids, stars: state.progress.stars || 0, story: state.prayer.kind === 'story' ? { ...findStory(state.prayer.id), lesson: t(`story.list.${state.prayer.id}.lesson`), q: state.storyQ } : null };
    case 'stories':
      return { type: 'stories', list: STORY_LIST.map((s) => ({ id: s.id, icon: s.icon, name: s.name, sub: s.de, done: !!state.progress.stories?.[s.id] })), sounds: state.sounds };
    case 'sky': {
      const groups = skyGroups();
      const lit = groups.reduce((a, g) => a + g.items.filter((x) => x.on).length, 0), all = groups.reduce((a, g) => a + g.items.length, 0);
      // Vorschlag für den nächsten Stern: zuerst eine Geschichte, dann eine Sure, dann ein Gebet
      const order = [2, 1, 0, 3];
      let next = null;
      for (const gi of order) { const it = groups[gi].items.find((x) => !x.on && x.action); if (it) { next = { ...it, group: groups[gi].name }; break; } }
      return { type: 'sky', groups: groups.map((g) => ({ icon: g.icon, name: g.name, on: g.items.filter((x) => x.on).length, total: g.items.length, items: g.items })), lit, all, next, kids: state.kids };
    }
    case 'suras':
      return {
        type: 'suras',
        suras: SURAS.map((s) => ({ id: s.id, n: s.n, name: s.name, about: s.about, call: !!s.call, count: verses(s.id).length, learned: !!state.progress.suras?.[s.id], inPrayer: s.id === state.prayerSura })),
      };
    case 'sura': {
      const s = state.sura;
      return { type: 'sura', id: s.id, call: !!findSura(s.id).call, name: findSura(s.id).name, n: findSura(s.id).n, verses: verses(s.id), mode: s.mode, v: s.v, reveal: s.reveal, msg: s.msg, learned: !!state.progress.suras?.[s.id], inPrayer: s.id === state.prayerSura };
    }
    case 'duas': {
      const list = duasOf(state.dua.cat);
      return { type: 'duas', cats: DUA_CATS, cat: state.dua.cat, index: state.dua.i, total: list.length, dua: list[state.dua.i], msg: state.dua.msg };
    }
    case 'peace':
      return { type: 'peace', item: PEACE[state.peace], index: state.peace, total: PEACE.length };
    case 'calm':
      return { type: 'calm', count: state.calm.count, total: CALM_BREATHS, breathPhase: state.breath.phase, finished: state.calm.count >= CALM_BREATHS };
    case 'tasbih': {
      const { phase, count } = state.tasbih;
      const finished = phase >= TASBIH.length;
      return { type: 'tasbih', ...(TASBIH[phase] || {}), phase, count, finished, phases: TASBIH.length, breath: state.breath.on, breathPhase: state.breath.phase };
    }
    case 'info':
      return { type: 'info' };
    case 'times':
      return { type: 'times', ...timesInfo() };
    default:
      return {
        type: 'menu', thought: dailyThought(), beginner: !PRAYERS.every((x) => state.progress.done[x.id]), adapted: !!state.sitting || state.travel, tasks: !!store.get('tasks', null),
        prayers: PRAYERS,
        qibla: t('ui.qiblaLine', locationName(), Math.round(bearing())),
        calibrated: isCalibrated(),
        times: timesInfo(),
        madhab: madhab().name,
        wuduDone: state.progress.wudu > 0,
        kids: state.kids,
        tracked: prayedOn(state.progress, dayKey()).length,
        profile: { icon: profile().icon, name: profName(profile()), many: profiles.length > 1 },
      };
  }
}

// Sternenhimmel: jede gelernte Sache ist ein Stern – Gebete, Suren, Geschichten, Abzeichen und Tage mit allen 5 Gebeten
function skyGroups() {
  const p = state.progress;
  const fullDays = Object.keys(p.log || {}).filter((k) => dayDone(p, k)).length;
  const nDays = Math.min(30, Math.max(10, Math.ceil((fullDays + 1) / 10) * 10));
  return [
    { icon: '🕌', name: t('sky.prayers'), items: [WUDU, ...PRAYERS, ...EXTRA_PRAYERS].map((x) => ({ label: x.name, on: x.id === 'wudu' ? p.wudu > 0 : !!p.done[x.id], action: x.id === 'wudu' ? 'wudu' : `prayer:${x.id}` })) },
    { icon: '📖', name: t('sky.suras'), items: SURAS.map((x) => ({ label: x.name, on: !!p.suras?.[x.id], action: `sura:${x.id}` })) },
    { icon: '🌙', name: t('sky.stories'), items: STORY_LIST.map((x) => ({ label: x.name, on: !!p.stories?.[x.id], action: `prayer:${x.id}` })) },
    { icon: '🏅', name: t('sky.badges'), items: BADGES.map((b) => ({ label: b.name, on: b.test(p) })) },
    { icon: '✨', name: t('sky.days'), items: Array.from({ length: nDays }, (_, i) => ({ label: `${i + 1}`, on: i < fullDays })) },
  ];
}

function refresh() {
  const v = view();
  if (mobileUI) mobileUI.render(v);
  else {
    panel.render(v);
    card.render(v);
  }
  if (wantsWuduRoom() !== state.wuduRoom || wantsScene() !== state.scene) rebuildEnv();
  // Im Iḥrām: Männer in Weiß ohne Kappe
  // Im Cemevi ohne Kopftuch (Rehber, wenn man als Frau unterwegs ist)
  const scarf = state.scene !== 'cemevi';
  if (!!guide.noScarf !== !scarf) guide.setGender(state.gender, { scarf });
  const ihram = pilgrimActive() && isHajj(state.prayer);
  if (!!guide.ihram !== ihram) guide.setIhram(ihram);
  if (state.scene) { placePilgrim(true); if (mobileUI) aimAtGuide(); }
  const cur = state.view === 'step' && state.steps[state.i];
  ambience.set({ scene: state.wuduRoom ? 'wudu' : state.scene, enabled: state.sounds && !state.quiet, chorus: pilgrimActive() && !!cur && CHORUS.has(cur.id), chorusText: TALBIYA_AR, voices });
  const pose = v.type === 'step' ? v.step.pose : 'stand';
  posePerson(guide, pose);
  if (state.wuduRoom) {
    const feet = atStools();
    placeWuduFigures();
    if (feet !== state.atStools && mobileUI) { state.atStools = feet; aimAtGuide(); }
    state.atStools = feet;
  }
  updateCast();
  if (cong.group.visible && v.type === 'step') cong.lead(v.step.basePose || v.step.pose, v.step.rakah);
  setChair(v.type === 'step' && v.step.seated === 'chair' && !state.wuduRoom && !state.scene);
  syncRemote();
  // Geschichten und Sternenhimmel: keine Figur (Propheten werden nicht gezeigt); Szene zeigt den Abschnitt des Schritts
  const noGuide = storyActive() || state.scene === 'starsky';
  if (noGuide) { guide.group.visible = false; guideRug.visible = false; } else if (!guide.group.visible && !cong.group.visible) guide.group.visible = true;
  if (storyActive()) setStoryPhase(pilgrimStep().phase);
}

// Neuer Schritt: Erkennung zurücksetzen und bei einem Haltungswechsel die Ansage zeigen.
function onStep() {
  const p = state.posture;
  p.ok = false;
  p.held = 0;
  const step = state.steps[state.i];
  const m = step.wudu || step.hajj ? { arrow: null, cue: step.cue } : moveFor(state.steps[state.i - 1]?.pose ?? null, step.pose);
  state.pilgrim = { d: 0, thrown: 0, tt: 0, snap: null };
  // Mit Cemaat spricht der Imam; sonst wird der Schritt vorgelesen (Anfänger-Modus immer)
  const imamLeads = state.cemaat && state.prayer?.kind !== 'wudu';
  if (state.watch || state.beginner || (state.voice && !imamLeads)) speak();
  else imamCall(step, state.steps[state.i - 1]);
  if (m.arrow || step.wudu || step.hajj) {
    banner.render(m);
    p.cueT = 3.5;
    placeBanner(true);
  }
}

const stepsFor = (prayer) => (prayer.kind === 'wudu' ? buildWuduSteps(state.madhab, prayer.variant)
  : prayer.kind === 'story' ? buildStory(prayer.id)
  : isPilgrimage(prayer) ? buildPilgrimage(prayer.kind, state.madhab, state.gender, state.prayerSura)
    : buildSteps(prayerVariant(prayer), state.madhab, state.gender, state.prayerSura, { sitting: state.sitting }));
// Unterwegs (Seferî): Pflichtgebete mit 4 Rakʿāt werden zu 2 (Qaṣr)
function prayerVariant(prayer) {
  if (!state.travel || prayer.kind || prayer.rakat !== 4) return prayer;
  return Object.assign(Object.create(prayer), { rakat: 2, travel: true });
}

function start(prayer) {
  state.prayer = prayer;
  state.steps = stepsFor(prayer);
  state.i = 0;
  state.autoT = 0;
  state.view = 'step';
  state.posture.standH = null;
  // Zurück auf den Gebetsplatz; mit Cemaat gibt der Imam den Takt vor
  goHome();
  cong.reset();
  if ((state.cemaat && prayer.kind !== 'wudu') || isPilgrimage(prayer)) state.auto = true;
  onStep();
}

// Arabisch vorlesen (freie Stimme oder Gerätestimme); false, wenn es keine arabische Stimme gibt.
function sayArabic(line, { rate = 0.8, pitch = 1 } = {}) {
  if (!voices.has('ar')) return false;
  voices.say([{ text: line, lang: 'ar', rate, pitch }]);
  return true;
}

// Imam spricht die Übergänge laut (arabische Stimme, falls das Gerät eine hat).
const IMAM = { takbir: 'اللَّهُ أَكْبَرُ', sami: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', salam: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ' };
function imamCall(step, prev) {
  if (!state.cemaat || step.wudu) return;
  let line = null;
  if (step.key === 'itidal') line = IMAM.sami;
  else if (step.key === 'salam') line = IMAM.salam;
  else if (step.key === 'takbir' || (prev && step.pose !== prev.pose && prev.pose !== 'takbir' && step.pose !== 'dua')) line = IMAM.takbir;
  if (line) sayArabic(line, { rate: 0.75, pitch: 0.8 });
}

// Gibt es eine Stimme für die gewählte Sprache? (Solange die Gerätestimmen noch laden: ja annehmen.)
const voiceMissing = () => voices.missing(langInfo().speech);
if ('speechSynthesis' in window) window.speechSynthesis.addEventListener?.('voiceschanged', () => refresh());

function speak() {
  const step = state.view === 'step' && state.steps[state.i];
  if (!step) return;
  const m = step.wudu || step.hajj ? { cue: step.cue } : moveFor(state.steps[state.i - 1]?.pose ?? null, step.pose);
  // Arabisch: Anleitung und Rezitation in einem Zug mit derselben Stimme
  const lang = langInfo().speech;
  // Geschichte: einfach erzählen, danach der Koranvers auf Arabisch
  if (step.story) {
    const parts = [{ text: `${step.title}. ${step.instr}`, lang, rate: state.kids ? 0.92 : 1 }];
    if (step.ar.length && voices.has('ar') && lang !== 'ar') parts.push(...step.ar.map((l) => ({ text: l, lang: 'ar', rate: 0.8 })));
    voices.say(parts);
    return;
  }
  // Ausführlich vorlesen: was du tust, wie du dich bewegst, wie oft – und für Kinder die einfache Erklärung
  const kid = state.kids ? kidLine(step) : '';
  const how = step.wudu
    ? `${t('ui.timesSpoken', step.count)} ${step.fard ? t('wudu.fard') : t('wudu.sunnah')}.`
    : step.hajj ? '' : (step.how || (state.steps[state.i - 1]?.pose === step.pose ? '' : m.how) || '');
  // Bewegung nur sagen, wenn sie nicht schon in der Anleitung steht
  const body = kid ? [kid] : [how && !step.instr.includes(how.replace(/\.$/, '')) ? how : '', step.instr];
  // Im Kinder-Text steht schon, wie oft – dann nur noch, ob es Pflicht ist
  const said = [`${m.cue}.`, ...body, ...(kid && step.wudu ? [`${step.fard ? t('wudu.fard') : t('wudu.sunnah')}.`] : [])].filter(Boolean);
  const rate = (state.kids ? 0.92 : 1) * (state.quiet ? 0.88 : 1);
  if (lang === 'ar') { voices.say([...said, ...step.ar].map((l) => ({ text: l, lang: 'ar', rate: 0.9 }))); return; }
  const parts = [{ text: [...said, ...step.de].join(' '), lang, rate }];
  if (step.ar.length && voices.has('ar')) parts.push(...step.ar.map((l) => ({ text: l, lang: 'ar', rate: 0.8 })));
  voices.say(parts);
}

function locate() {
  if (!navigator.geolocation) { state.msg = t('ui.gpsNo'); return; }
  state.msg = t('ui.gpsWait');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.location = { name: 'GPS', gps: true, lat: pos.coords.latitude, lon: pos.coords.longitude, timeZone: deviceZone };
      store.set('location', state.location);
      state.msg = t('ui.gpsOk');
      applyQibla();
      refresh();
    },
    () => { state.msg = t('ui.gpsFail'); refresh(); },
    { timeout: 10000 },
  );
}

// Kinder bekommen für jeden Tag mit allen 5 Gebeten einen Extra-Stern (einmal je Tag)
function fullDayStar(key) {
  const p = state.progress;
  if (!state.kids || (p.starDays || []).includes(key)) return;
  p.starDays = [...(p.starDays || []), key].slice(-60);
  p.stars = (p.stars || 0) + 1;
}

function act(action) {
  const [key, arg, arg2] = action.split(':');
  switch (key) {
    case 'prayer': start(findPrayer(arg)); break;
    case 'wudu': start(WUDU); break;
    case 'more': state.view = 'more'; break;
    case 'purify': state.view = 'purify'; break;
    case 'nafile': state.view = 'nafile'; break;
    case 'zakat': state.view = 'zakat'; break;
    case 'zset': {
      const z = state.zakat;
      if (arg === 'by') z.by = z.by === 'gold' ? 'silver' : 'gold';
      else if (arg === 'cur') { const list = ['EUR', 'TRY', 'USD', 'CHF', 'GBP', 'BAM', 'ALL', 'IDR', 'PKR', 'IRR', 'AFN', 'SAR']; z.cur = list[(list.indexOf(z.cur) + 1) % list.length]; }
      else if (arg2) z[arg] = Math.max(0, (z[arg] || 0) + Number(arg2));
      else if (arg in z) {
        let v = null;
        try { v = window.prompt(t('zakat.ask', ['persons', 'perPerson'].includes(arg) ? t(`zakat.${arg}`) : t(`zakat.fields.${arg}`)), String(z[arg] || '')); } catch { /* kein Dialog */ }
        const n = v == null ? NaN : Number(String(v).replace(/\s/g, '').replace(',', '.'));
        if (Number.isFinite(n) && n >= 0) z[arg] = n;
      }
      store.set('zakat', z);
      break;
    }
    case 'cuma': state.view = 'cuma'; break;
    case 'remcuma': state.remind.cuma = state.remind.cuma === false; store.set('remind', state.remind); break;
    case 'siyer': state.view = 'siyer'; if (arg) state.siyer = Number(arg) || 0; break;
    case 'sinext': case 'siprev': { const n = t('siyer.events').length; state.siyer = (state.siyer + (key === 'sinext' ? 1 : n - 1)) % n; break; }
    case 'sisay': { const e = t('siyer.events')[state.siyer]; voices.say([{ text: `${e[1]}. ${state.kids ? e[3] : e[2]}`, lang: langInfo().speech }]); break; }
    case 'certs': state.view = 'certs'; state.certMsg = ''; break;
    case 'cert': {
      const b = BADGES[Number(arg)];
      if (b && b.test(state.progress)) { downloadCertificate({ name: profName(profile()), title: b.name, date: certDate() }); state.certMsg = t('cert.saved'); }
      break;
    }
    case 'hoca': state.view = 'hoca'; state.hocaMsg = ''; break;
    case 'hpick': state.hocaPick = state.hocaPick.includes(arg) ? state.hocaPick.filter((x) => x !== arg) : TASK_IDS.filter((x) => x === arg || state.hocaPick.includes(x)); state.hocaLink = ''; break;
    case 'hname': { let v = null; try { v = window.prompt(t('hoca.askName'), state.hocaName); } catch { /* kein Dialog */ } if (v != null) state.hocaName = v.trim().slice(0, 40); state.hocaLink = ''; break; }
    case 'hshare': {
      if (!state.hocaPick.length) { state.hocaMsg = t('hoca.none'); break; }
      const url = `${location.origin}${location.pathname}?tasks=${state.hocaPick.join(',')}${state.hocaName ? `&from=${encodeURIComponent(state.hocaName)}` : ''}`;
      state.hocaLink = url;
      shareText(`${t('hoca.shareText', state.hocaName)} ${url}`, url);
      break;
    }
    case 'tasks': state.view = 'tasks'; state.hocaMsg = ''; break;
    case 'tresult': {
      const T = store.get('tasks', null);
      if (!T) break;
      const list = T.ids.map((id) => taskInfo(id));
      shareText(`${t('hoca.resultText', profName(profile()), list.filter((x) => x.ok).length, list.length)}\n${list.map((x) => `${x.ok ? '✓' : '○'} ${x.label}`).join('\n')}`);
      break;
    }
    case 'tclear': store.set('tasks', null); state.view = 'menu'; break;
    case 'path': state.view = 'path'; state.pathPart = arg || state.pathPart || 'steps'; break;
    case 'more5': {
      // nächstes der fünf Gebete, das noch nie geübt wurde
      const p = PRAYERS.find((x) => !state.progress.done[x.id]) || PRAYERS[0];
      start(p);
      break;
    }
    case 'watch': state.view = 'watch'; state.watch = null; break;
    case 'watchgo': {
      const w = WATCH.find((x) => x.id === arg);
      if (!w) break;
      state.watch = { queue: w.seq.slice(1), id: w.id };
      start(findPrayer(w.seq[0]));
      state.auto = true;
      if (mobileUI) setView('front');
      break;
    }
    case 'hub': state.view = 'hub'; state.hubId = arg || 'prayers'; break;
    case 'adapt': state.view = 'adapt'; break;
    case 'sitting': state.sitting = arg === 'off' ? '' : arg; store.set('sitting', state.sitting); break;
    case 'travel': state.travel = !state.travel; store.set('travel', state.travel); break;
    case 'kaza': state.view = 'kaza'; break;
    case 'kz': {
      // kz:<id>:+1 / -1 – Zähler ändern; kz:years:+1 – Jahre für die Schätzung; kz:fill – Schätzung übernehmen
      const k = kazaOf();
      if (arg === 'years') state.kazaYears = Math.max(1, Math.min(60, (state.kazaYears || 1) + Number(arg2)));
      else if (arg === 'fill') { const n = (state.kazaYears || 1) * 354; for (const id of KAZA_IDS) k[id] += id === 'fast' ? (state.kazaYears || 1) * 30 : n; }
      else if (arg === 'reset') { for (const id of KAZA_IDS) k[id] = 0; k.made = 0; }
      else if (KAZA_IDS.includes(arg)) { const d = Number(arg2); if (d < 0 && k[arg] > 0) { k[arg]--; k.made++; } else if (d > 0) k[arg] += d; }
      state.progress.kaza = k; saveProgress();
      break;
    }
    case 'kazapray': start(Object.assign(Object.create(findPrayer(arg)), { kaza: true })); break;
    case 'elif':
      state.view = 'elif';
      if (arg) { state.elif.part = arg; state.elif.quiz = arg === 'quiz' ? elifQuiz() : null; }
      break;
    case 'elnext': case 'elprev': {
      const n = LETTERS.length;
      state.elif.i = (state.elif.i + (key === 'elnext' ? 1 : n - 1)) % n;
      break;
    }
    case 'elgo': state.elif.i = Number(arg) || 0; state.elif.part = 'letters'; break;
    case 'elsay': {
      const L = LETTERS[state.elif.i];
      voices.say([{ text: arg === 'w' ? WORDS[Number(arg2)]?.ar : arg === 'm' ? MARKS[Number(arg2)]?.ar : L.arName, lang: 'ar', rate: 0.75 }]);
      break;
    }
    case 'elq': case 'esq': {
      const box = key === 'elq' ? state.elif : state.esma, z = box.quiz;
      if (!z) break;
      if (z.picked == null && z.i < z.q.length) {
        z.picked = Number(arg);
        if (z.picked === z.q[z.i].ans) z.score++;
      } else {
        z.i++; z.picked = null;
        if (z.i >= z.q.length) {
          const k = key === 'elq' ? 'elifBest' : 'esmaBest';
          state.progress[k] = Math.max(state.progress[k] || 0, z.score);
          saveProgress();
        }
      }
      break;
    }
    case 'esma':
      state.view = 'esma';
      state.esma.list = arg === 'list';
      state.esma.quiz = arg === 'quiz' ? esmaQuiz() : null;
      if (arg && /^\d+$/.test(arg)) { state.esma.i = Number(arg); state.esma.list = false; }
      markEsma();
      break;
    case 'esnext': case 'esprev':
      state.esma.i = (state.esma.i + (key === 'esnext' ? 1 : ESMA.length - 1)) % ESMA.length;
      markEsma();
      break;
    case 'essay': {
      const e = ESMA[state.esma.i];
      voices.say([{ text: e.ar, lang: 'ar', rate: 0.8 }, ...(langInfo().speech === 'ar' ? [] : [{ text: e.mean, lang: langInfo().speech }])]);
      break;
    }
    case 'hajjinfo': state.view = 'hajjinfo'; state.hajjPart = arg || 'basics'; break;
    case 'holy': state.view = 'holy'; state.holySel = arg || null; state.holyDua = null; state.remMsg = ''; break;
    case 'hdua':
      state.holyDua = state.holyDua === arg && state.view === 'holy' ? null : arg;
      if (state.holyDua) voices.say(prayerText(arg).ar.map((l) => ({ text: l, lang: 'ar', rate: 0.8 })));
      break;
    case 'holycal':
      downloadIcs(buildHolyIcs(new Date(), state.location.timeZone || deviceZone), 'namazvr-heilige-tage.ics');
      state.remMsg = t('rem.calDone');
      break;
    case 'remholy': state.remind.holy = !state.remind.holy; store.set('remind', state.remind); break;
    case 'parents': state.view = 'parents'; break;
    case 'big': state.big = !state.big; store.set('big', state.big); applyComfort(); break;
    case 'calmmode': state.quiet = !state.quiet; store.set('calm', state.quiet); applyComfort(); break;
    case 'settings': state.view = 'settings'; break;
    case 'madhab':
      state.madhab = arg;
      state.asr = madhab().asr;
      store.set('madhab', arg);
      store.set('asr', state.asr);
      break;
    case 'gender': state.gender = arg; store.set('gender', arg); guide.setGender(arg); rebuildCong(); break;
    case 'lang':
      // Sprache erst laden, dann umschalten (die erste Wahl einer Sprache dauert einen Moment)
      if (!isLoaded(arg)) { loadLang(arg).then((ok) => { if (ok) act(`lang:${arg}`); }); break; }
      setLang(arg);
      store.set('lang', arg);
      applyLang();
      // Laufendes Gebet in der neuen Sprache neu aufbauen, an derselben Stelle
      if (state.prayer && (state.view === 'step' || state.view === 'done')) state.steps = stepsFor(state.prayer);
      if (state.quiz) state.quiz = newQuiz();
      break;
    case 'mosque': state.view = 'mosque'; break;
    case 'style':
      if (arg !== state.style) {
        state.style = arg;
        store.set('style', arg);
        rebuildEnv();
        rebuildCong();
        goHome();
      }
      break;
    case 'cemaat': state.cemaat = !state.cemaat; store.set('cemaat', state.cemaat); cong.reset(); break;
    // Größe oder Takt wählen schaltet Cemaat gleich mit ein
    case 'csize': state.cemaatSize = arg; store.set('cemaatSize', arg); state.cemaat = true; store.set('cemaat', true); rebuildCong(); break;
    case 'ctakt': state.cemaatNatural = arg === 'natural'; store.set('cemaatNatural', state.cemaatNatural); state.cemaat = true; store.set('cemaat', true); rebuildCong(); break;
    case 'spiritual': state.spiritual = !state.spiritual; store.set('spiritual', state.spiritual); break;
    case 'breath': state.breath = { on: !state.breath.on, t: 0, phase: 'in' }; break;
    case 'beginner': state.beginner = !state.beginner; store.set('beginner', state.beginner); break;
    case 'kids': state.kids = !state.kids; profile().kids = state.kids; saveProfiles(); break;
    case 'profiles': state.view = 'profiles'; state.pDel = null; break;
    case 'puse':
      saveProgress();
      profileId = arg;
      state.progress = loadProgress(arg);
      state.kids = !!profile().kids;
      saveProfiles();
      break;
    case 'padd': {
      if (profiles.length >= MAX_PROFILES) break;
      const id = `p${Date.now().toString(36)}`;
      profiles.push({ id, name: null, icon: ICONS[profiles.length % ICONS.length], kids: true });
      saveProfiles();
      break;
    }
    case 'picon': { const p = profiles.find((x) => x.id === arg); if (p) { p.icon = ICONS[(ICONS.indexOf(p.icon) + 1) % ICONS.length]; saveProfiles(); } break; }
    case 'pren': {
      const p = profiles.find((x) => x.id === arg);
      // In VR gibt es kein Eingabefeld; dann bleibt der Name
      let name = null;
      try { name = window.prompt(t('prof.ask'), profName(p)); } catch { /* kein Dialog möglich */ }
      if (p && name && name.trim()) { p.name = name.trim().slice(0, 18); saveProfiles(); }
      break;
    }
    case 'pdel':
      if (state.pDel !== arg) { state.pDel = arg; break; }
      if (arg !== 'main' && profiles.length > 1) {
        profiles.splice(profiles.findIndex((x) => x.id === arg), 1);
        try { localStorage.removeItem(`salahvr.${progKey(arg)}`); } catch { /* egal */ }
        if (profileId === arg) { profileId = profiles[0].id; state.progress = loadProgress(profileId); state.kids = !!profile().kids; }
        saveProfiles();
      }
      state.pDel = null;
      break;
    case 'remind': state.remFrom = state.view; state.view = 'remind'; state.remMsg = ''; break;
    case 'pilgrim': state.view = 'pilgrim'; break;
    case 'stories': state.view = 'stories'; voices.cancel(); break;
    case 'sky': setSkyData(skyGroups()); state.view = 'sky'; voices.cancel(); break;
    case 'sans': {
      const q = state.storyQ, i = Number(arg);
      if (!q || q.answer != null) break;
      q.answer = i;
      // Richtig beantwortet: ein Stern (einmal je Geschichte)
      const p = state.progress;
      if (i === q.correct && !p.storyStars?.[state.prayer.id]) {
        p.storyStars = { ...(p.storyStars || {}), [state.prayer.id]: true };
        p.stars = (p.stars || 0) + 1;
        q.star = true;
        saveProgress();
      }
      break;
    }
    case 'storylesson': {
      const lesson = t(`story.list.${state.prayer?.id}.lesson`);
      voices.say([{ text: lesson, lang: langInfo().speech }]);
      break;
    }
    case 'alevi': state.view = 'alevi'; break;
    case 'muharrem': state.view = 'muharrem'; state.muharremPart = arg || 'about'; break;
    case 'alevival': state.view = 'alevival'; break;
    case 'saynext': state.saying = (state.saying + 1) % SAYINGS; break;
    case 'sayprev': state.saying = (state.saying + SAYINGS - 1) % SAYINGS; break;
    case 'walkalong': state.walkAlong = !state.walkAlong; store.set('walkAlong', state.walkAlong); break;
    case 'gfx': graphics.setQuality(!graphics.high); store.set('gfxHigh', graphics.high); break;
    case 'rmedia': state.remoteMedia = !state.remoteMedia; store.set('remoteMedia', state.remoteMedia); break;
    case 'rcam': state.remoteCam = !state.remoteCam; store.set('remoteCam', state.remoteCam); break;
    case 'faces': { const on = !store.get('faces', true); store.set('faces', on); setFaces(on); break; }
    case 'sounds': state.sounds = !state.sounds; store.set('sounds', state.sounds); break;
    case 'remon':
      if (state.remind.on) { state.remind.on = false; store.set('remind', state.remind); break; }
      askPermission().then((perm) => {
        state.remind.on = perm === 'granted';
        state.remMsg = perm === 'granted' ? '' : perm === 'unsupported' ? t('rem.unsupported') : t('rem.denied');
        store.set('remind', state.remind);
        refresh();
      });
      break;
    case 'remp': {
      // Gebet für die Erinnerung an- oder abwählen (mindestens eines bleibt)
      const list = state.remind.prayers;
      const next = list.includes(arg) ? list.filter((x) => x !== arg) : ALL_PRAYERS.filter((x) => x === arg || list.includes(x));
      if (next.length) state.remind.prayers = next;
      store.set('remind', state.remind);
      break;
    }
    case 'rembefore': state.remind.before = BEFORE[(BEFORE.indexOf(state.remind.before) + 1) % BEFORE.length]; store.set('remind', state.remind); break;
    case 'remtest': {
      const n = timesInfo().next;
      askPermission().then(async (perm) => {
        const ok = perm === 'granted' && await notify(t('rem.title2', n.name, n.time), `${t('rem.body', state.remind.before)} ${t('rem.gentle')[0]}`);
        state.remMsg = ok ? '' : perm === 'unsupported' ? t('rem.unsupported') : t('rem.denied');
        refresh();
      });
      break;
    }
    case 'remcal': {
      const loc = { ...state.location, timeZone: state.location.timeZone || deviceZone };
      downloadIcs(buildIcs(loc, state.method, state.asr, state.remind.before, 30, new Date(), state.remind.prayers));
      state.remMsg = t('rem.calDone');
      break;
    }
    case 'peace': state.view = 'peace'; break;
    case 'duas': state.view = 'duas'; state.dua.msg = ''; break;
    case 'duacat': state.dua = { cat: arg, i: 0, msg: '' }; break;
    case 'duanext': case 'duaprev': {
      const n = duasOf(state.dua.cat).length;
      state.dua.i = (state.dua.i + (key === 'duanext' ? 1 : n - 1)) % n;
      state.dua.msg = '';
      break;
    }
    case 'duaspeak': {
      const d = duasOf(state.dua.cat)[state.dua.i];
      const lang = langInfo().speech;
      if (!voices.has('ar')) { state.dua.msg = t('ui.noVoice'); break; }
      voices.say([{ text: d.ar, lang: 'ar', rate: 0.8 }, ...(lang !== 'ar' && d.mean ? [{ text: d.mean, lang }] : [])]);
      break;
    }
    case 'suras': state.view = 'suras'; break;
    case 'sura': state.sura = { id: arg, mode: 'read', v: 0, reveal: false, msg: '' }; state.view = 'sura'; break;
    case 'smode': Object.assign(state.sura, { mode: arg, v: 0, reveal: false }); break;
    case 'snext': case 'sprev': {
      const s = state.sura, n = verses(s.id).length;
      s.v = Math.max(0, Math.min(n - 1, s.v + (key === 'snext' ? 1 : -1)));
      s.reveal = false;
      break;
    }
    case 'sreveal': state.sura.reveal = !state.sura.reveal; break;
    case 'sspeak': {
      const s = state.sura, vs = verses(s.id);
      const line = s.mode === 'read' ? vs.map((x) => x.ar).join(' ۝ ') : vs[s.v].ar;
      s.msg = sayArabic(line, { rate: 0.7 }) ? '' : t('ui.noVoice');
      break;
    }
    case 'slearned': {
      const p = state.progress, id = state.sura.id;
      p.suras = { ...(p.suras || {}), [id]: !p.suras?.[id] };
      // Kinder bekommen einen Stern für jede gelernte Sure
      if (p.suras[id] && state.kids) p.stars = (p.stars || 0) + 1;
      saveProgress();
      break;
    }
    case 'sprayer': if (findSura(state.sura.id).call) break; state.prayerSura = state.sura.id; store.set('prayerSura', state.prayerSura); break;
    case 'peacenext': state.peace = (state.peace + 1) % PEACE.length; break;
    case 'peaceprev': state.peace = (state.peace + PEACE.length - 1) % PEACE.length; break;
    case 'calm': state.view = 'calm'; state.calm = { count: 0 }; state.breath = { on: true, t: 0, phase: 'in' }; break;
    case 'learn': state.view = 'learn'; break;
    case 'quiz': state.quiz = newQuiz(); state.view = 'quiz'; break;
    case 'answer': {
      const z = state.quiz, q = z.questions[z.i];
      if (z.answer != null) break;
      z.answer = Number(arg);
      if (z.answer === q.correct) z.score++;
      break;
    }
    case 'quiznext': {
      const z = state.quiz;
      z.i++;
      z.answer = null;
      if (z.i >= z.questions.length) {
        state.progress.quizBest = Math.max(state.progress.quizBest, z.score);
        state.progress.quizRuns++;
        saveProgress();
      }
      break;
    }
    case 'resetprogress': state.progress = emptyProgress(); saveProgress(); break;
    case 'again': start(state.prayer); break;
    case 'next':
      if (state.view !== 'step') break;
      if (state.i < state.steps.length - 1) { state.i++; onStep(); } else if (state.prayer.kind === 'story') {
        // Geschichte zu Ende: ein Stern am Himmel leuchtet, dann die Frage „Was lernen wir?“
        state.view = 'done';
        state.auto = false;
        const p = state.progress;
        p.stories = { ...(p.stories || {}), [state.prayer.id]: true };
        if (!p.days.includes(dayKey())) p.days = [...p.days, dayKey()].slice(-60);
        saveProgress();
        state.storyQ = storyQuestion(state.prayer.id);
        voices.cancel();
      } else if (state.watch?.queue.length) {
        // Zuschauen: gleich der nächste Ablauf (z. B. nach der Waschung das Morgengebet)
        start(findPrayer(state.watch.queue.shift()));
        state.auto = true;
      } else if (state.watch) {
        state.view = 'done';
        state.auto = false;
        if (cong.group.visible) cong.finish();
      } else {
        state.view = 'done';
        state.auto = false;
        if (cong.group.visible) cong.finish();
        recordPractice(state.progress, state.prayer.id);
        if (state.prayer.kaza) kazaDone(state.prayer.id);
        // Pflichtgebet geschafft: im Gebets-Tracker für heute abhaken (nicht beim Nachholen)
        else if (markPrayed(state.progress, state.prayer.id)) fullDayStar(dayKey());
        // Kinder bekommen für jedes geschaffte Gebet einen Stern
        if (state.kids) state.progress.stars = (state.progress.stars || 0) + 1;
        saveProgress();
      }
      state.autoT = 0;
      break;
    case 'prev':
      if (state.view === 'step' && state.i > 0) { state.i--; onStep(); }
      state.autoT = 0;
      break;
    case 'auto': state.auto = !state.auto; state.autoT = 0; break;
    case 'speak':
      state.voice = !state.voice;
      store.set('voice', state.voice);
      if (state.voice) speak();
      else voices.cancel();
      break;
    case 'voice': state.view = 'voice'; break;
    case 'piper': voices.enabled = !voices.enabled; store.set('piper', voices.enabled); voices.cancel(); break;
    case 'vload': voices.download(arg); break;
    case 'vdel': voices.remove(arg); break;
    case 'vtest': voices.say([{ text: SAMPLES[arg], lang: arg }]); break;
    case 'tracker': state.view = 'tracker'; state.trackBack = 0; break;
    case 'trackback': state.trackBack = Math.min(TRACK_DAYS - 1, state.trackBack + 1); break;
    case 'trackfwd': state.trackBack = Math.max(0, state.trackBack - 1); break;
    case 'track': {
      const p = state.progress, key = keyFor(state.trackBack);
      const was = dayDone(p, key);
      if (toggleTrack(p, arg, state.trackBack) && !was) fullDayStar(key);
      saveProgress();
      break;
    }
    case 'ramadan': state.view = 'ramadan'; state.ramadanDua = null; break;
    case 'rdua': {
      state.ramadanDua = arg;
      const d = t(`ram.duas.${arg}`);
      voices.say([{ text: d.ar, lang: 'ar', rate: 0.8 }, ...(langInfo().speech === 'ar' ? [] : [{ text: d.mean, lang: langInfo().speech }])]);
      break;
    }
    case 'women':
      state.womenPlace = arg;
      store.set('womenPlace', arg);
      // Die Empore gibt es in der Großmoschee
      if (arg === 'gallery' && state.style !== 'gross') { state.style = 'gross'; store.set('style', 'gross'); rebuildEnv(); goHome(); }
      state.cemaat = true;
      store.set('cemaat', true);
      rebuildCong();
      break;
    case 'menu': state.view = 'menu'; state.auto = false; state.watch = null; cong.reset(); voices.cancel(); break;
    case 'qibla': state.view = 'qibla'; state.msg = ''; break;
    case 'info': state.view = 'info'; break;
    case 'times': state.view = 'times'; break;
    case 'method': {
      const i = METHODS.findIndex((m) => m.id === state.method);
      state.method = METHODS[(i + 1) % METHODS.length].id;
      store.set('method', state.method);
      break;
    }
    case 'asr':
      state.asr = state.asr === 'standard' ? 'hanafi' : 'standard';
      store.set('asr', state.asr);
      break;
    case 'city':
      state.location = CITIES[Number(arg)];
      store.set('location', state.location);
      state.msg = t('ui.citySet', state.location.name);
      applyQibla();
      break;
    case 'gps': locate(); break;
    case 'calibrate':
      state.northYaw = currentYaw();
      state.qiblaYaw = null;
      store.set('northYaw', state.northYaw);
      store.set('qiblaYaw', null);
      state.msg = t('ui.calDone');
      applyQibla();
      faceQibla();
      break;
    case 'qiblahere':
      // Blickrichtung ist die Qibla (z. B. vorher mit dem Handy-Kompass bestimmt); der Teppich kommt unter die Füße
      state.qiblaYaw = currentYaw();
      state.northYaw = null;
      store.set('qiblaYaw', state.qiblaYaw);
      store.set('northYaw', null);
      if (renderer.xr.isPresenting) placeHere();
      state.msg = t('ui.qiblaHereDone');
      applyQibla();
      break;
    case 'placehere':
      placeHere();
      state.msg = t('ui.placeDone');
      break;
    case 'resetcal':
      state.northYaw = null;
      state.qiblaYaw = null;
      store.set('northYaw', null);
      store.set('qiblaYaw', null);
      state.msg = t('ui.calReset');
      applyQibla();
      break;
    case 'tasbih': state.view = 'tasbih'; state.tasbih = { phase: 0, count: 0 }; state.breath = { on: state.spiritual, t: 0, phase: 'in' }; break;
    case 'tasbihreset': state.tasbih = { phase: 0, count: 0 }; break;
    case 'count': {
      const t = state.tasbih;
      if (t.phase >= TASBIH.length) break;
      t.count++;
      if (t.count >= TASBIH[t.phase].target) { t.phase++; t.count = 0; }
      break;
    }
  }
  refresh();
}

// --- Eingabe: Raycast aufs Panel ---
const raycaster = new THREE.Raycaster();
function panelHit() {
  const hit = raycaster.intersectObject(panel.mesh)[0];
  return hit ? { distance: hit.distance, button: panel.hit(hit.uv) } : null;
}
function updateHover(action) {
  if (panel.setHover(action)) panel.render(panel.last);
}

// Desktop: Ziehen = umsehen, kurzer Klick = Button
let yaw = 0.3, pitch = -0.15, drag = null;
const ndc = new THREE.Vector2();
const el = renderer.domElement;
function setNdc(e) {
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
}
el.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, y: e.clientY, moved: 0 };
  el.setPointerCapture(e.pointerId);
});
el.addEventListener('pointermove', (e) => {
  if (mobileUI) {
    // Handy: mit einem Finger langsam um die Figur drehen; erst ab einer deutlichen Bewegung (Tippen bewegt nichts)
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.x = e.clientX; drag.y = e.clientY;
    if (drag.moved < 12) return;
    mobileCam.goal.yaw = mobileCam.yaw -= dx * 0.005;
    mobileCam.goal.pitch = mobileCam.pitch = THREE.MathUtils.clamp(mobileCam.pitch + dy * 0.004, -0.9, 0.7);
    applyOrbit();
    return;
  }
  if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.x = e.clientX; drag.y = e.clientY;
    yaw += dx * 0.004;
    pitch = THREE.MathUtils.clamp(pitch + dy * 0.004, -1.4, 1.4);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }
  setNdc(e);
  const h = panelHit();
  updateHover(h?.button?.action ?? null);
  el.style.cursor = h?.button ? 'pointer' : 'grab';
});
el.addEventListener('pointercancel', () => { drag = null; });
el.addEventListener('pointerup', (e) => {
  if (mobileUI) { drag = null; return; }
  if (drag && drag.moved < 6 && !mobileUI) {
    setNdc(e);
    const b = panelHit()?.button;
    if (b) act(b.action);
  }
  drag = null;
});
// WASD: durch die Moschee gehen (Umschalt = schneller)
const keys = new Set();
window.addEventListener('keyup', (e) => keys.delete(e.key === 'Shift' ? 'shift' : e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd'].includes(k)) { keys.add(k); return; }
  if (e.key === 'Shift') keys.add('shift');
  // Pfeiltasten, Leertaste und Bluetooth-Seitenwender (Bild auf/ab)
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') act('next');
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') act('prev');
  else if (k === 'm') act('menu');
});

// VR: Controller bzw. Hand-Tracking (Pinch löst ebenfalls „select“ aus)
const controllers = [];
const modelFactory = new XRControllerModelFactory();
const rot = new THREE.Matrix4();
for (let i = 0; i < 2; i++) {
  const c = renderer.xr.getController(i);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]),
    new THREE.LineBasicMaterial({ color: 0xe6c77f }),
  );
  line.scale.z = 3;
  c.add(line);
  c.userData.line = line;
  c.addEventListener('select', () => {
    aim(c);
    const b = panelHit()?.button;
    if (b) act(b.action);
  });
  scene.add(c);
  const grip = renderer.xr.getControllerGrip(i);
  grip.add(modelFactory.createControllerModel(grip));
  scene.add(grip);
  controllers.push(c);
}
function aim(c) {
  rot.identity().extractRotation(c.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rot);
}

// Beim Betreten/Verlassen von VR ändert sich, ob die Haltung erkannt werden kann.
// Hände: Modell in VR, in Mixed Reality sieht man die echten Hände
const handModels = new XRHandModelFactory();
const hands = { left: null, right: null };
for (let i = 0; i < 2; i++) {
  const hand = renderer.xr.getHand(i);
  const model = handModels.createHandModel(hand, 'mesh');
  hand.add(model);
  hand.userData.model = model;
  hand.addEventListener('connected', (e) => { if (e.data.hand) hands[e.data.handedness] = hand; });
  hand.addEventListener('disconnected', () => { for (const k of ['left', 'right']) if (hands[k] === hand) hands[k] = null; });
  scene.add(hand);
}

// Mixed Reality: Moscheeraum ausblenden, das echte Zimmer scheint durch; der Gebetsplatz kommt unter die Füße.
function setAR(on) {
  state.ar = on;
  env.visible = !on;
  scene.background = on ? null : ROOM_BG;
  arLight.visible = on;
  for (let i = 0; i < 2; i++) renderer.xr.getHand(i).userData.model.visible = !on;
  if (!on) world.position.set(0, 0, 0);
}

// Gebetsplatz (Ursprung des Raums, dort steht man auf dem Teppich) an die aktuelle Kopfposition legen.
function placeHere() {
  readHead();
  world.position.set(headPos.x, 0, headPos.z);
}

renderer.xr.addEventListener('sessionstart', () => {
  state.posture.standH = null;
  const mode = renderer.xr.getSession()?.environmentBlendMode;
  setAR(!!mode && mode !== 'opaque');
  // Kopfposition gibt es erst im ersten Frame
  state.placePending = state.ar;
  // In VR ohne Kompass: zuerst die Qibla einstellen, damit der Mihrab in die richtige Richtung zeigt
  if (!state.ar && !isCalibrated()) { state.view = 'qibla'; state.msg = t('ui.vrQiblaFirst'); }
  refresh();
});
renderer.xr.addEventListener('sessionend', () => {
  setAR(false);
  applyQibla();
  refresh();
});

// Handy (schmaler Bildschirm, nicht der Quest-Browser): HTML-Bedienung unten, Figur oben. ?mobile / ?desktop erzwingen.
const params = new URLSearchParams(location.search);
const isMobile = params.has('mobile') || (!params.has('desktop') && window.innerWidth <= 820 && !/OculusBrowser|Quest/i.test(navigator.userAgent));
const mobileUI = isMobile ? new MobileUI(document.getElementById('ui'), act) : null;
// Am Handy: drei Knöpfe über der 3D-Ansicht – hinter dir, von vorn, von der Seite
const VIEWS = { back: { yaw: 0, pitch: 0, zoom: 1 }, front: { yaw: Math.PI, pitch: 0.12, zoom: 0.6 }, side: { yaw: Math.PI / 2, pitch: 0.08, zoom: 0.7 } };
const orbitUI = mobileUI ? (() => {
  const box = document.createElement('div');
  box.id = 'orbit';
  box.innerHTML = Object.keys(VIEWS).map((k) => `<button type="button" data-view="${k}"></button>`).join('');
  document.body.appendChild(box);
  box.addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });
  return { box };
})() : null;
function setView(name) {
  Object.assign(mobileCam.goal, VIEWS[name] || VIEWS.back);
  mobileCam.view = name;
  markView();
}
function markView() {
  if (!orbitUI) return;
  // Von vorn geht im Waschraum nicht (dort ist die Wand)
  const noFront = state.wuduRoom;
  if (noFront && mobileCam.view === 'front') setView('back');
  for (const b of orbitUI.box.children) {
    b.classList.toggle('on', b.dataset.view === mobileCam.view);
    b.hidden = noFront && b.dataset.view === 'front';
  }
}

// Auf dem Handy blickt die Kamera auf die Vorbeter-Figur; mit Cemaat von schräg hinten über die Reihen.
function aimAtGuide() {
  // Waschraum: von hinten auf die Becken und den Vorbeter
  // Im Gebetsraum: hinter dir, Blick zur Qibla (Mihrab) – der Vorbeter steht vor dir
  const eye = state.wuduRoom ? new THREE.Vector3(0.2, 1.75, 2.2) : cong.group.visible ? new THREE.Vector3(0, 2.3, 3.2) : new THREE.Vector3(0.5, 1.9, 2.4);
  camera.position.copy(world.localToWorld(eye));
  const target = new THREE.Vector3(0, 0.85, 0);
  // Im Waschraum auf dein Becken: rechts der Vorbeter
  const sst = state.view === 'step' || state.view === 'done' ? pilgrimStep() : null;
  if (state.scene === 'starsky') {
    // Sternenhimmel: nach oben zu den Sternbildern schauen
    camera.position.copy(world.localToWorld(new THREE.Vector3(0, 1.4, 1.5)));
    world.localToWorld(target.set(0, 28, -60));
  } else if (sst?.story) {
    const c = sst.cam || { x: 0.3, y: 2.0, z: 2.6 }, l = sst.look || { x: 0, y: 1.4, z: -8 };
    camera.position.copy(world.localToWorld(new THREE.Vector3(c.x, c.y, c.z)));
    world.localToWorld(target.set(l.x, l.y, l.z));
  } else if (state.scene && state.scene !== 'miqat') {
    // Umre & Hac: hinter dir, Blick nach vorn (zur Kaaba bzw. den Weg entlang)
    // Beim Tavaf etwas nach links, damit die Kaaba im Bild ist
    const tawaf = state.view === 'step' && state.steps[state.i]?.motion?.type === 'tawaf';
    camera.position.copy(world.localToWorld(new THREE.Vector3(0.3, 2.0, 2.6)));
    world.localToWorld(target.set(tawaf ? -5 : 0, 1.4, -8));
  } else if (state.wuduRoom && state.atStools) {
    // Beim Füßewaschen: auf die Hocker rechts
    camera.position.copy(world.localToWorld(new THREE.Vector3(1.0, 1.8, 3.0)));
    world.localToWorld(target.set(3.4, 0.5, 1.0));
  } else if (state.wuduRoom) world.localToWorld(target.set(0, 0.95, -0.4));
  else if (cong.group.visible) leader().group.localToWorld(target);
  else world.localToWorld(target.set(0.6, 1.0, -3));
  // Grundansicht merken; die eigene Drehung und der Zoom kommen darüber (bleiben beim nächsten Schritt erhalten)
  mobileCam.eye.copy(camera.position);
  mobileCam.target.copy(target);
  markView();
  applyOrbit();
}

// Handy: mit einem Finger um die Figur herumgehen, mit zwei Fingern zoomen, doppelt tippen = zurück zur Grundansicht
const mobileCam = { eye: new THREE.Vector3(), target: new THREE.Vector3(), yaw: 0, pitch: 0, zoom: 1, goal: { yaw: 0, pitch: 0, zoom: 1 }, view: 'back' };
// Weicher Kameraflug zur gewählten Ansicht
function stepOrbit(dt) {
  const o = mobileCam, g = o.goal, k = 1 - Math.exp(-dt * 5);
  if (Math.abs(g.yaw - o.yaw) + Math.abs(g.pitch - o.pitch) + Math.abs(g.zoom - o.zoom) < 1e-3) return;
  o.yaw += (g.yaw - o.yaw) * k; o.pitch += (g.pitch - o.pitch) * k; o.zoom += (g.zoom - o.zoom) * k;
  applyOrbit();
}
const orbitSph = new THREE.Spherical();
function applyOrbit() {
  const o = mobileCam, v = o.eye.clone().sub(o.target);
  orbitSph.setFromVector3(v);
  orbitSph.theta += o.yaw;
  // nicht unter den Boden und nicht senkrecht von oben
  orbitSph.phi = THREE.MathUtils.clamp(orbitSph.phi - o.pitch, 0.25, 1.5);
  orbitSph.radius = THREE.MathUtils.clamp(orbitSph.radius * o.zoom, 0.6, 14);
  camera.position.copy(o.target).add(v.setFromSpherical(orbitSph));
  if (camera.position.y < 0.25) camera.position.y = 0.25;
  camera.lookAt(o.target);
}

function layout() {
  const h = mobileUI ? Math.round(window.innerHeight * 0.36) : window.innerHeight;
  camera.aspect = window.innerWidth / h;
  camera.fov = mobileUI ? 55 : 70;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, h);
  graphics.resize();
  if (mobileUI) aimAtGuide();
}
// Schreibrichtung und Hilfetext der Seite zur gewählten Sprache
function applyLang() {
  document.documentElement.dir = isRTL() ? 'rtl' : 'ltr';
  const hint = document.getElementById('hint');
  if (orbitUI) {
    for (const b of orbitUI.box.children) b.textContent = t(`ui.view.${b.dataset.view}`);
    markView();
  }
  if (hint) {
    // Hinweis lässt sich einklappen (bleibt gemerkt) und wieder öffnen
    hint.innerHTML = `<span>${t('ui.hint')}</span><button class="x" type="button" aria-label="${t('ui.back')}">×</button>`;
    const x = hint.querySelector('.x');
    const set = (min) => { hint.classList.toggle('min', min); x.textContent = min ? '?' : '×'; store.set('hintMin', min); };
    x.addEventListener('click', () => set(!hint.classList.contains('min')));
    set(store.get('hintMin', false));
  }
}
applyLang();

if (mobileUI) {
  document.body.classList.add('mobile');
  panel.mesh.visible = false;
  card.mesh.visible = false;
}
window.addEventListener('resize', layout);
// Nachbearbeitung: am Handy nur das Leuchten, am Computer auch Kontaktschatten
graphics.usePost(camera, { ao: !mobileUI });

// Kopf in VR (bzw. Desktop-Kamera): Höhe über dem Boden, Neigung, Drehung gegenüber der Qibla.
const headPos = new THREE.Vector3(), headDir = new THREE.Vector3();
function readHead() {
  const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : camera;
  cam.getWorldPosition(headPos);
  cam.getWorldDirection(headDir);
  const yaw = Math.atan2(-headDir.x, -headDir.z);
  const rel = Math.atan2(Math.sin(yaw - world.rotation.y), Math.cos(yaw - world.rotation.y));
  return { height: headPos.y, pitch: Math.asin(THREE.MathUtils.clamp(headDir.y, -1, 1)), yawRel: rel };
}

function updatePosture(dt) {
  const p = state.posture;
  const step = state.steps[state.i];
  const head = readHead();
  if (head.height > (p.standH ?? 0) && head.height < 2.1) p.standH = Math.max(head.height, 1.1);
  const body = classifyHead(head.height, p.standH ?? 1.6, head.pitch);
  const headOk = matchesPose(step.pose, body, head.yawRel);
  // Mit Hand-Erkennung zählt auch die Handhaltung; mit Controllern nur der Kopf.
  const hc = checkHands(step.pose, { left: readHand(hands.left), right: readHand(hands.right) }, headPos, p.standH ?? 1.6);
  const match = headOk && hc.ok !== false;
  const hint = headOk ? hc.hint : null;
  const { key: kind } = step;
  const finger = kind === 'tashahhud' && indexRaised(readHand(hands.right));
  p.held = match ? p.held + dt : 0;
  const ok = p.held > 0.4;
  if (ok !== p.ok || hint !== p.handHint || finger !== p.finger) {
    if (ok && !p.ok) pulse();
    p.ok = ok;
    p.handHint = hint;
    p.finger = finger;
    refresh();
  }
}

// Gehen: Ziel nur annehmen, wenn es innerhalb der Moschee liegt (Weltkoordinaten des Raums).
const walkTmp = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
function insideMosque(scenePos) {
  const g = onGallery() ? gallery() : null;
  const b = g ? g.bounds : roomBounds();
  const p = world.worldToLocal(walkTmp.copy(scenePos));
  // Auf der Empore: Koordinaten des (verschobenen) Raums
  if (g) p.z += g.z;
  return p.x > b.minX && p.x < b.maxX && p.z > b.minZ && p.z < b.maxZ;
}

function walk(dt) {
  if (state.ar || mobileUI || pilgrimActive()) return;
  const dir = new THREE.Vector3();
  let speed = 1.6;
  if (renderer.xr.isPresenting) {
    // Stick bewegt; die Welt rückt entgegengesetzt.
    for (const src of renderer.xr.getSession()?.inputSources ?? []) {
      const a = src.gamepad?.axes;
      if (!a) continue;
      const x = a[2] ?? a[0] ?? 0, y = a[3] ?? a[1] ?? 0;
      if (Math.hypot(x, y) > 0.2) { dir.x += x; dir.z += y; }
    }
  } else {
    if (keys.has('w')) dir.z -= 1;
    if (keys.has('s')) dir.z += 1;
    if (keys.has('a')) dir.x -= 1;
    if (keys.has('d')) dir.x += 1;
    if (keys.has('shift')) speed = 3.5;
  }
  if (!dir.lengthSq()) return;
  if (dir.length() > 1) dir.normalize();
  readHead();
  dir.applyAxisAngle(UP, Math.atan2(-headDir.x, -headDir.z)).multiplyScalar(speed * dt);
  const next = headPos.clone().add(dir);
  if (!insideMosque(next)) return;
  if (renderer.xr.isPresenting) world.position.sub(dir);
  else camera.position.add(dir);
}

// Zurück auf den Gebetsteppich
// Am Computer zur Qibla schauen (das Panel ist links davon noch im Bild)
function faceQibla() {
  if (renderer.xr.isPresenting || mobileUI) return;
  yaw = world.rotation.y + 0.18;
  pitch = -0.12;
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
}

function goHome() {
  if (renderer.xr.isPresenting) { if (!state.ar) world.position.set(0, 0, 0); } else if (!mobileUI) { camera.position.set(0, 1.6, 0); faceQibla(); }
}

// Kurzes Vibrieren der Controller, wenn die Haltung erreicht ist.
function pulse() {
  const session = renderer.xr.getSession();
  for (const src of session?.inputSources ?? []) src.gamepad?.hapticActuators?.[0]?.pulse?.(0.4, 60);
}

// Ansage etwas unter der Blickrichtung, folgt dem Kopf weich.
const bannerTarget = new THREE.Vector3();
function placeBanner(snap) {
  readHead();
  bannerTarget.copy(headDir).multiplyScalar(0.9).add(headPos);
  bannerTarget.y -= 0.12;
  if (snap) banner.mesh.position.copy(bannerTarget);
  else banner.mesh.position.lerp(bannerTarget, 0.08);
  banner.mesh.lookAt(headPos);
}

// Erinnerung zur Gebetszeit (einmal pro Minute, solange die App läuft)
const sentReminders = new Set(store.get('remindSent', []));
function checkReminder() {
  if (!state.remind.on || !canNotify() || Notification.permission !== 'granted') return;
  const loc = { ...state.location, timeZone: state.location.timeZone || deviceZone };
  const due = dueReminder(loc, new Date(), state.method, state.asr, state.remind.before, sentReminders, state.remind.prayers);
  if (!due) return;
  sentReminders.add(due.key);
  store.set('remindSent', [...sentReminders].slice(-20));
  const { title, body } = reminderText(due.id, due.at, state.remind.before, loc.timeZone);
  notify(title, body);
}
// Erinnerung an heilige Tage und Nächte (am Vorabend bzw. Vortag)
function checkHoly() {
  if (!state.remind.on || !state.remind.holy || !canNotify() || Notification.permission !== 'granted') return;
  const sent = new Set(store.get('holySent', []));
  const due = dueHoly(new Date(), state.location.timeZone || deviceZone, sent);
  if (!due) return;
  sent.add(due.key);
  store.set('holySent', [...sent].slice(-30));
  const { title, body } = holyText(due.e, due.when);
  notify(title, body);
}
setInterval(checkHoly, 60000);
// Freitags-Erinnerung um 10 Uhr (solange die App offen ist)
function checkCuma() {
  if (!state.remind.on || state.remind.cuma === false || !canNotify() || Notification.permission !== 'granted') return;
  const now = new Date();
  if (now.getDay() !== 5 || now.getHours() < 10) return;
  const key = `cuma|${dayKey(now)}`;
  if (store.get('cumaSent', '') === key) return;
  store.set('cumaSent', key);
  notify(t('cuma.notifyTitle'), t('cuma.notifyBody'));
}
setInterval(checkCuma, 60000);
// Auch wenn der Bildschirm still steht (keine Animation, z. B. Tab im Hintergrund)
setInterval(checkReminder, 30000);

// --- Loop ---
const clock = new THREE.Clock();
let lastMinute = Math.floor(Date.now() / 60000);
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (state.placePending && renderer.xr.isPresenting) {
    // Mixed Reality gestartet: Gebetsplatz hierher; ohne Kalibrierung zeigt die Qibla erst einmal nach vorn
    state.placePending = false;
    placeHere();
    if (!isCalibrated()) world.rotation.y = currentYaw();
    state.view = 'qibla';
    state.msg = t('ui.arWelcome');
    refresh();
  }
  if (renderer.xr.isPresenting) {
    let hover = null;
    for (const c of controllers) {
      aim(c);
      const h = panelHit();
      c.userData.line.scale.z = h ? h.distance : 3;
      if (h?.button) hover = h.button.action;
    }
    updateHover(hover);
  }
  const wudu = state.view === 'step' && (!!state.steps[state.i].wudu || !!state.steps[state.i].hajj);
  if (state.view === 'step' && renderer.xr.isPresenting && !wudu) updatePosture(dt);
  // Auto-Modus wartet in VR, bis die Haltung eingenommen ist; im Anfänger-Modus langsamer.
  if (state.view === 'step' && state.auto && (state.posture.ok || !renderer.xr.isPresenting || wudu || state.watch)) {
    state.autoT += dt;
    const cur = state.steps[state.i];
    // Geschichten: die Dauer passt sich der Länge des Textes an, Kinder bekommen nur etwas mehr Zeit
    const need = cur.dur * (cur.story ? (state.kids ? 1.2 : 1) : state.beginner || state.kids ? 1.6 : 1);
    // Erst weiter, wenn die Ansage zu Ende ist (sonst wird die Stimme mitten im Satz abgeschnitten); höchstens 3× so lange warten
    if (state.autoT >= need && (!voices.busy || state.autoT >= need * 3)) act('next');
  }
  // Atem-Dhikr: einatmen (Kugel wächst), ausatmen (schrumpft); nach jedem Atemzug +1.
  const br = state.breath;
  const calming = state.view === 'calm' && state.calm.count < CALM_BREATHS;
  const breathing = calming || (state.view === 'tasbih' && br.on && state.tasbih.phase < TASBIH.length);
  orb.visible = breathing;
  if (breathing) {
    br.t += dt;
    const cycle = BREATH.inhale + BREATH.exhale;
    if (br.t >= cycle) {
      br.t -= cycle;
      br.phase = 'in';
      if (calming) { state.calm.count++; refresh(); } else act('count');
    }
    const phase = br.t < BREATH.inhale ? 'in' : 'out';
    if (phase !== br.phase) { br.phase = phase; refresh(); }
    const k = phase === 'in' ? br.t / BREATH.inhale : 1 - (br.t - BREATH.inhale) / BREATH.exhale;
    orb.scale.setScalar(0.7 + 1.3 * (0.5 - 0.5 * Math.cos(Math.PI * k)));
  }
  walk(dt);
  if (mobileUI) stepOrbit(dt);
  const cue = state.posture;
  if (cue.cueT > 0 && state.view === 'step' && !mobileUI) {
    cue.cueT -= dt;
    banner.mesh.visible = true;
    banner.mesh.material.opacity = Math.min(1, cue.cueT / 0.6);
    placeBanner(false);
  } else banner.mesh.visible = false;
  // Countdown im Menü und in der Zeiten-Ansicht einmal pro Minute auffrischen.
  const minute = Math.floor(Date.now() / 60000);
  if (minute !== lastMinute && (state.view === 'menu' || state.view === 'times')) refresh();
  if (minute !== lastMinute) checkReminder();
  if (minute !== lastMinute && isNight() !== state.night) rebuildEnv();
  lastMinute = minute;
  guide.update(dt);
  updateMovers(dt);
  if (state.scene) { updatePilgrim(dt); updateCrowd(dt); updateStory(dt); if (storyActive()) placePilgrim(true); }
  {
    const st = state.view === 'step' && state.steps[state.i];
    const ph = st?.story ? st.phase : null;
    const water = (state.wuduRoom && !!st && st.wudu !== 'heart') || (!!st && st.id === 'zamzam')
      || state.scene === 'nile' || (state.scene === 'sea' && ph !== 'dark') || (state.scene === 'ark' && ['rain', 'sea', 'cudi'].includes(ph));
    ambience.update(dt, { walking: !!(state.scene && state.pilgrim.moving), speed: state.pilgrim.speed || 2, water });
  }
  cong.update(dt);
  // Im Waschraum läuft das Wasser bei den Waschschritten (nicht bei Absicht und Bittgebet), bei den Füßen an den Hockern
  if (state.wuduRoom) {
    const st = state.view === 'step' && state.steps[state.i];
    const arrived = (f) => !movers.has(f);
    if (state.atStools) setWater(!!st && st.wudu !== 'heart', clock.elapsedTime, [], arrived(guide) ? [0] : []);
    else setWater(!!st && st.wudu !== 'heart', clock.elapsedTime, [0, ...(arrived(guide) ? [1.1] : [])]);
  }
  graphics.render(camera);
});

// ?debug stellt Hilfsobjekte für Tests in der Konsole bereit.
if (new URLSearchParams(location.search).has('debug')) window.salah = { act, guide, cong, camera, state, panel, card, world, env, setAR, view, voices, ambience };

camera.rotation.set(pitch, yaw, 0, 'YXZ');
guide.setGender(state.gender);
applyComfort();
graphics.casters(guide.group);
rebuildEnv();
rebuildCong();
applyQibla();
// Am Desktop von Anfang an zur Qibla schauen
faceQibla();
layout();
// Installierbar und offline nutzbar (PWA)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
refresh();
// Ladeanzeige ausblenden, sobald das erste Bild steht
requestAnimationFrame(() => window.__bootDone?.());
// VR-/AR-Knopf ausblenden, wenn das Gerät es nicht kann (statt „VR NOT SUPPORTED“)
setTimeout(() => {
  for (const b of document.querySelectorAll('.xrbtn')) {
    if (/NOT SUPPORTED|NOT ALLOWED|NOT AVAILABLE|NEEDS HTTPS/i.test(b.textContent)) b.classList.add('off');
  }
}, 1500);
// Schriften nachladen, dann Panel neu zeichnen (Arabisch braucht Amiri).
Promise.all(['54px Amiri', '600 32px Inter', 'italic 30px Inter'].map((f) => document.fonts.load(f)))
  .catch(() => {})
  .then(() => refresh());
