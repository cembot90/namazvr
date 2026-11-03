import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { STYLES, buildEnvironment, clearEnvironment, makeFloorCompass, makeRug, roomBounds, blocked } from './environment.js';
import { Guide } from './figure.js';
import { Congregation } from './congregation.js';
import { Panel, FloorCard, CueBanner } from './panel.js';
import { classifyHead, matchesPose, moveFor } from './movement.js';
import { EXTRA_PRAYERS, MADHABS, PRAYERS, TASBIH, buildSteps, findPrayer } from './prayer.js';
import { LANGS, deviceLang, getLang, isRTL, langInfo, setLang, t } from './i18n.js';
import { WUDU, buildWuduSteps } from './wudu.js';
import { BADGES, emptyProgress, newQuiz, recordPractice, streak } from './learn.js';
import { BREATH, innerMeaning } from './spirit.js';
import { MobileUI } from './mobile.js';
import { checkHands, indexRaised, readHand } from './hands.js';
import { CITIES, qiblaBearing } from './qibla.js';
import { ASR, METHODS, TIME_NAMES, formatCountdown, formatTime, prayerStatus } from './prayertimes.js';

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
document.body.appendChild(VRButton.createButton(renderer));
// Mixed Reality: Gebetsplatz im eigenen Zimmer, mit Handerkennung
document.body.appendChild(ARButton.createButton(renderer, { optionalFeatures: ['local-floor', 'hand-tracking'] }));

const scene = new THREE.Scene();
const ROOM_BG = new THREE.Color(0x1a1410);
scene.background = ROOM_BG;
// Licht für Mixed Reality, wenn der Moscheeraum (mit seinen Lampen) ausgeblendet ist
const arLight = new THREE.HemisphereLight(0xfff6e8, 0x8a7a66, 2.4);
arLight.visible = false;
scene.add(arLight);
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 150);
camera.position.set(0, 1.6, 0);

// `world` enthält den ganzen Gebetsraum; seine -Z-Achse ist die Qibla.
const world = new THREE.Group();
scene.add(world);
// Der Raum selbst hängt in einer eigenen Gruppe, damit der Moschee-Stil gewechselt werden kann.
const env = new THREE.Group();
world.add(env);
const compass = makeFloorCompass();
const guideRug = makeRug(1.5, -1.95);
world.add(compass, makeRug(0, -0.5), guideRug);

const guide = new Guide();
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
// Sprache vor allem anderen setzen, damit alle Texte schon passen.
setLang(store.get('lang', deviceLang()));

const state = {
  view: 'menu',
  prayer: null,
  steps: [],
  i: 0,
  auto: false,
  autoT: 0,
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
  spiritual: store.get('spiritual', false),
  style: store.get('style', 'klassisch'),
  night: false,
  // Cemaat: Gemeinschaftsgebet mit Imam; Größe der Gemeinde; natürlicher Takt oder Gleichtakt
  cemaat: store.get('cemaat', false),
  cemaatSize: store.get('cemaatSize', 'small'),
  cemaatNatural: store.get('cemaatNatural', true),
  breath: { on: false, t: 0, phase: 'in' },
  progress: { ...emptyProgress(), ...store.get('progress', {}) },
  quiz: null,
  // Haltungserkennung in VR: Stehhöhe des Kopfes, erkannte Haltung, wie lange schon gehalten
  // dazu in Mixed Reality/VR mit Hand-Erkennung: Hinweis zur Handhaltung und erhobener Zeigefinger
  posture: { standH: null, ok: false, held: 0, cueT: 0, handHint: null, finger: false },
};

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
  const loc = { ...state.location, timeZone: state.location.timeZone || deviceZone };
  const now = new Date();
  const { times } = prayerStatus(loc, now, state.method, state.asr);
  return now < times.sunrise || now >= times.maghrib;
}

function rebuildEnv() {
  state.night = isNight();
  clearEnvironment(env);
  buildEnvironment(env, state.style, { night: state.night });
}

function rebuildCong() {
  cong.build({ size: state.cemaatSize, gender: state.gender, natural: state.cemaatNatural, blocked });
  updateCast();
}

// Mit Cemaat beten Imam und Gemeinde; bei der Gebetswaschung zeigt weiter die Vorbeter-Figur.
function updateCast() {
  const wudu = state.view === 'step' && state.prayer?.kind === 'wudu';
  cong.group.visible = state.cemaat && !wudu;
  guide.group.visible = guideRug.visible = !cong.group.visible;
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
        inner: state.spiritual ? innerMeaning(state.steps[state.i]) : '',
        posture: state.steps[state.i].wudu ? 'wudu' : !renderer.xr.isPresenting ? 'off' : state.posture.ok ? 'ok' : 'wait',
        handHint: renderer.xr.isPresenting ? state.posture.handHint : null,
        finger: renderer.xr.isPresenting && state.posture.finger,
      };
    case 'mosque':
      return { type: 'mosque', styles: STYLES, style: state.style, cemaat: state.cemaat, size: state.cemaatSize, natural: state.cemaatNatural };
    case 'more':
      return { type: 'more', prayers: EXTRA_PRAYERS, madhab: madhab().name };
    case 'settings':
      return { type: 'settings', langs: LANGS, lang: getLang(), madhabs: MADHABS, madhab: madhab(), beginner: state.beginner, gender: state.gender, spiritual: state.spiritual };
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
      return { type: 'done', prayer: state.prayer };
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
        type: 'menu',
        prayers: PRAYERS,
        qibla: t('ui.qiblaLine', locationName(), Math.round(bearing())),
        calibrated: isCalibrated(),
        times: timesInfo(),
        madhab: madhab().name,
        wuduDone: state.progress.wudu > 0,
      };
  }
}

function refresh() {
  const v = view();
  if (mobileUI) mobileUI.render(v);
  else {
    panel.render(v);
    card.render(v);
  }
  guide.setPose(v.type === 'step' ? v.step.pose : 'stand');
  updateCast();
  if (cong.group.visible && v.type === 'step') cong.lead(v.step.pose, v.step.rakah);
}

// Neuer Schritt: Erkennung zurücksetzen und bei einem Haltungswechsel die Ansage zeigen.
function onStep() {
  const p = state.posture;
  p.ok = false;
  p.held = 0;
  const step = state.steps[state.i];
  const m = step.wudu ? { arrow: null, cue: step.cue } : moveFor(state.steps[state.i - 1]?.pose ?? null, step.pose);
  if (state.beginner) speak();
  else imamCall(step, state.steps[state.i - 1]);
  if (m.arrow || step.wudu) {
    banner.render(m);
    p.cueT = 3.5;
    placeBanner(true);
  }
}

const stepsFor = (prayer) => (prayer.kind === 'wudu' ? buildWuduSteps(state.madhab) : buildSteps(prayer, state.madhab, state.gender));

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
  if (state.cemaat && prayer.kind !== 'wudu') state.auto = true;
  onStep();
}

// Imam spricht die Übergänge laut (arabische Stimme, falls das Gerät eine hat).
const IMAM = { takbir: 'اللَّهُ أَكْبَرُ', sami: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', salam: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ' };
function imamCall(step, prev) {
  if (!state.cemaat || step.wudu || !('speechSynthesis' in window)) return;
  let line = null;
  if (step.key === 'itidal') line = IMAM.sami;
  else if (step.key === 'salam') line = IMAM.salam;
  else if (step.key === 'takbir' || (prev && step.pose !== prev.pose && prev.pose !== 'takbir' && step.pose !== 'dua')) line = IMAM.takbir;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('ar'));
  if (!line || !voice) return;
  const u = new SpeechSynthesisUtterance(line);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.75;
  u.pitch = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function speak() {
  const step = state.view === 'step' && state.steps[state.i];
  if (!step || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = synth.getVoices();
  const say = (text, lang, rate = 1) => {
    const u = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.lang?.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice;
    u.lang = voice?.lang || lang;
    u.rate = rate;
    synth.speak(u);
    return !!voice;
  };
  const m = step.wudu ? { cue: step.cue } : moveFor(state.steps[state.i - 1]?.pose ?? null, step.pose);
  // Arabisch: Anleitung und Rezitation in einem Zug mit derselben Stimme
  const lang = langInfo().speech;
  if (lang === 'ar') { say([`${m.cue}.`, step.instr, ...step.ar].join(' '), 'ar', 0.9); return; }
  say([`${m.cue}.`, step.instr, ...step.de].join(' '), lang);
  if (step.ar.length && voices.some((v) => v.lang?.toLowerCase().startsWith('ar'))) say(step.ar.join('، '), 'ar', 0.8);
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

function act(action) {
  const [key, arg] = action.split(':');
  switch (key) {
    case 'prayer': start(findPrayer(arg)); break;
    case 'wudu': start(WUDU); break;
    case 'more': state.view = 'more'; break;
    case 'settings': state.view = 'settings'; break;
    case 'madhab':
      state.madhab = arg;
      state.asr = madhab().asr;
      store.set('madhab', arg);
      store.set('asr', state.asr);
      break;
    case 'gender': state.gender = arg; store.set('gender', arg); guide.setGender(arg); rebuildCong(); break;
    case 'lang':
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
    case 'csize': state.cemaatSize = arg; store.set('cemaatSize', arg); rebuildCong(); break;
    case 'ctakt': state.cemaatNatural = arg === 'natural'; store.set('cemaatNatural', state.cemaatNatural); rebuildCong(); break;
    case 'spiritual': state.spiritual = !state.spiritual; store.set('spiritual', state.spiritual); break;
    case 'breath': state.breath = { on: !state.breath.on, t: 0, phase: 'in' }; break;
    case 'beginner': state.beginner = !state.beginner; store.set('beginner', state.beginner); break;
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
        store.set('progress', state.progress);
      }
      break;
    }
    case 'resetprogress': state.progress = emptyProgress(); store.set('progress', state.progress); break;
    case 'again': start(state.prayer); break;
    case 'next':
      if (state.view !== 'step') break;
      if (state.i < state.steps.length - 1) { state.i++; onStep(); } else {
        state.view = 'done';
        state.auto = false;
        if (cong.group.visible) cong.finish();
        recordPractice(state.progress, state.prayer.id);
        store.set('progress', state.progress);
      }
      state.autoT = 0;
      break;
    case 'prev':
      if (state.view === 'step' && state.i > 0) { state.i--; onStep(); }
      state.autoT = 0;
      break;
    case 'auto': state.auto = !state.auto; state.autoT = 0; break;
    case 'speak': speak(); break;
    case 'menu': state.view = 'menu'; state.auto = false; cong.reset(); break;
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
el.addEventListener('pointerup', (e) => {
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
  if (e.key === 'ArrowRight' || e.key === ' ') act('next');
  else if (e.key === 'ArrowLeft') act('prev');
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

// Auf dem Handy blickt die Kamera auf die Vorbeter-Figur; mit Cemaat von schräg hinten über die Reihen.
function aimAtGuide() {
  camera.position.copy(cong.group.visible ? world.localToWorld(new THREE.Vector3(0, 2.3, 3.2)) : new THREE.Vector3(0, 1.6, 0));
  const target = new THREE.Vector3(0, 0.85, 0);
  leader().group.localToWorld(target);
  const d = target.sub(camera.position);
  yaw = Math.atan2(-d.x, -d.z);
  pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
}

function layout() {
  const h = mobileUI ? Math.round(window.innerHeight * 0.36) : window.innerHeight;
  camera.aspect = window.innerWidth / h;
  camera.fov = mobileUI ? 55 : 70;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, h);
  if (mobileUI) aimAtGuide();
}
// Schreibrichtung und Hilfetext der Seite zur gewählten Sprache
function applyLang() {
  document.documentElement.dir = isRTL() ? 'rtl' : 'ltr';
  const hint = document.getElementById('hint');
  if (hint) hint.innerHTML = t('ui.hint');
}
applyLang();

if (mobileUI) {
  document.body.classList.add('mobile');
  panel.mesh.visible = false;
  card.mesh.visible = false;
}
window.addEventListener('resize', layout);

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
  const b = roomBounds();
  const p = world.worldToLocal(walkTmp.copy(scenePos));
  return p.x > b.minX && p.x < b.maxX && p.z > b.minZ && p.z < b.maxZ;
}

function walk(dt) {
  if (state.ar || mobileUI) return;
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
function goHome() {
  if (renderer.xr.isPresenting) { if (!state.ar) world.position.set(0, 0, 0); } else if (!mobileUI) camera.position.set(0, 1.6, 0);
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
  const wudu = state.view === 'step' && !!state.steps[state.i].wudu;
  if (state.view === 'step' && renderer.xr.isPresenting && !wudu) updatePosture(dt);
  // Auto-Modus wartet in VR, bis die Haltung eingenommen ist; im Anfänger-Modus langsamer.
  if (state.view === 'step' && state.auto && (state.posture.ok || !renderer.xr.isPresenting || wudu)) {
    state.autoT += dt;
    if (state.autoT >= state.steps[state.i].dur * (state.beginner ? 1.6 : 1)) act('next');
  }
  // Atem-Dhikr: einatmen (Kugel wächst), ausatmen (schrumpft); nach jedem Atemzug +1.
  const br = state.breath;
  const breathing = state.view === 'tasbih' && br.on && state.tasbih.phase < TASBIH.length;
  orb.visible = breathing;
  if (breathing) {
    br.t += dt;
    const cycle = BREATH.inhale + BREATH.exhale;
    if (br.t >= cycle) { br.t -= cycle; br.phase = 'in'; act('count'); }
    const phase = br.t < BREATH.inhale ? 'in' : 'out';
    if (phase !== br.phase) { br.phase = phase; refresh(); }
    const k = phase === 'in' ? br.t / BREATH.inhale : 1 - (br.t - BREATH.inhale) / BREATH.exhale;
    orb.scale.setScalar(0.7 + 1.3 * (0.5 - 0.5 * Math.cos(Math.PI * k)));
  }
  walk(dt);
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
  if (minute !== lastMinute && isNight() !== state.night) rebuildEnv();
  lastMinute = minute;
  guide.update(dt);
  cong.update(dt);
  renderer.render(scene, camera);
});

// ?debug stellt Hilfsobjekte für Tests in der Konsole bereit.
if (new URLSearchParams(location.search).has('debug')) window.salah = { act, guide, cong, camera, state, panel, card, world, setAR, view };

camera.rotation.set(pitch, yaw, 0, 'YXZ');
guide.setGender(state.gender);
rebuildEnv();
rebuildCong();
applyQibla();
// Am Desktop zuerst aufs Panel schauen, auch wenn der Raum zur Qibla gedreht ist.
if (!mobileUI) { yaw += world.rotation.y; camera.rotation.set(pitch, yaw, 0, 'YXZ'); }
layout();
// Installierbar und offline nutzbar (PWA)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
refresh();
// Schriften nachladen, dann Panel neu zeichnen (Arabisch braucht Amiri).
Promise.all(['54px Amiri', '600 32px Inter', 'italic 30px Inter'].map((f) => document.fonts.load(f)))
  .catch(() => {})
  .then(() => refresh());
