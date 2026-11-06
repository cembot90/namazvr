import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { STYLES, WUDU_BASINS, buildEnvironment, clearEnvironment, galleryInfo, makeFloorCompass, makeRug, roomBounds, blocked, setWater, wuduStools } from './environment.js';
import { Guide } from './figure.js';
import { Congregation } from './congregation.js';
import { Panel, FloorCard, CueBanner } from './panel.js';
import { classifyHead, matchesPose, moveFor } from './movement.js';
import { ALEVI, EXTRA_PRAYERS, MADHABS, PILGRIMAGES, PRAYERS, TASBIH, buildSteps, findPrayer } from './prayer.js';
import { LANGS, deviceLang, getLang, isRTL, langInfo, setLang, t } from './i18n.js';
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
import { JAMARAT, setSemah, updateCrowd } from './hajjworld.js';
import { Ambience } from './ambient.js';
import { TRACK_DAYS, dayDone, fullStreak, keyFor, markPrayed, prayedOn, toggle as toggleTrack, week } from './tracker.js';
import { formatDay, ramadanInfo } from './ramadan.js';
import { dayKey } from './learn.js';
import { ALL_PRAYERS, BEFORE, askPermission, buildIcs, canNotify, downloadIcs, dueReminder, notify, reminderText } from './remind.js';

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

const guide = new Guide();
guide.group.position.set(1.5, 0, -1.5);
guide.group.rotation.y = Math.PI;
world.add(guide.group);

// Gemeinschaftsgebet: Imam und Gemeinde (statt der Vorbeter-Figur)
const cong = new Congregation();
world.add(cong.group);

// Ghost: durchscheinende Figur vor oder neben dir, gleiche Blickrichtung wie du (nicht gespiegelt), macht jede Bewegung mit
const ghost = new Guide().makeGhost();
ghost.group.rotation.y = Math.PI;
ghost.group.visible = false;
world.add(ghost.group);
const GHOST_OK = 0x7fe0a8, GHOST_WAIT = 0x8fd8ff;

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
  // Ghost-Modus: 'off' | 'front' (vor dir) | 'side' (neben dir)
  ghost: store.get('ghost', 'front'),
  wuduRoom: false,
  scene: null,
  pilgrim: { d: 0, thrown: 0, tt: 0, snap: null },
  // Beim Tavaf und Sa'y fließend mitgehen (aus: in kurzen Sprüngen)
  walkAlong: store.get('walkAlong', true),
  sounds: store.get('sounds', true),
  progress: loadProgress(profileId),
  pDel: null,
  // Erinnerung: an/aus und wie viele Minuten vorher
  remind: { on: false, before: 10, prayers: ALL_PRAYERS, ...store.get('remind', {}) },
  remMsg: '',
  quiz: null,
  // Haltungserkennung in VR: Stehhöhe des Kopfes, erkannte Haltung, wie lange schon gehalten
  // dazu in Mixed Reality/VR mit Hand-Erkennung: Hinweis zur Handhaltung und erhobener Zeigefinger
  posture: { standH: null, ok: false, held: 0, cueT: 0, handHint: null, finger: false },
};

// Sprachausgabe: freie Piper-Stimmen, sonst die Stimme des Geräts
const voices = new Voices({ enabled: store.get('piper', true), onChange: () => refresh() });

const saveProgress = () => store.set(progKey(profileId), state.progress);
const profName = (p) => p.name || (p.id === 'main' ? t('prof.me') : t('prof.child', Math.max(1, profiles.indexOf(p))));

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
const wantsScene = () => (pilgrimActive() ? pilgrimStep()?.scene || 'haram' : null);

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
  placeGhost();
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
}
function placePilgrim(snap = false) {
  if (!state.scene) return;
  const st = pilgrimStep();
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
    posePerson(ghost, up ? 'throw' : 'stand');
  }
  if (throwAnim.t >= 0) {
    throwAnim.t += dt / 0.8;
    const k = Math.min(1, throwAnim.t);
    pebble.position.lerpVectors(throwAnim.from, throwAnim.to, k);
    pebble.position.y += Math.sin(Math.PI * k) * 1.2;
    if (k >= 1) { throwAnim.t = -1; pebble.visible = false; }
  }
  // Mitgehen: Vorbeter und Ghost machen Schritte
  pg.moving = moving;
  // Semah: die Gruppe steht auf und dreht sich; du, der Rehber und der Ghost drehen mit
  const semah = (st && st.semah) || 0;
  setSemah(semah);
  ambience.music(state.scene === 'cemevi' ? (semah || (st && st.id === 'zakir' ? 1 : 0)) : 0);
  if (moving) for (const fig of [guide, ghost]) {
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
// Ab dem ersten Fuß-Schritt (und danach beim Bittgebet) sitzen Vorbeter und Ghost dort; vorher stehen sie an den Becken.
const atStools = () => state.wuduRoom && (state.view === 'done' || (state.view === 'step' && state.i >= state.steps.findIndex((x) => x.wudu === 'footR')));

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
  sendTo(ghost, feet ? new THREE.Vector3(st[1][0], 0, st[1][1]) : new THREE.Vector3(WUDU_BASINS[2], 0, 0), feet ? Math.PI / 2 : Math.PI, snap);
}
// Haltung setzen; wer gerade geht, nimmt sie erst am Ziel ein
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

// Ghost vor dir (Blick zur Qibla wie du) oder neben dir; im Waschraum am Becken links neben dir
function placeGhost() {
  const g = ghost.group;
  g.visible = state.ghost !== 'off' && (state.view === 'step' || (state.wuduRoom && state.view === 'done'));
  if (state.wuduRoom) return;
  movers.delete(ghost);
  g.rotation.y = Math.PI;
  if (state.ghost === 'side' && !(state.cemaat && cong.group.visible)) g.position.set(0.85, 0, 0);
  // Mit Cemaat steht neben dir schon jemand: dann vor dir; auf der Empore dicht vor der Brüstung
  else g.position.set(0, 0, onGallery() ? -0.6 : pilgrimActive() && state.scene !== 'miqat' ? -2.2 : -1.3);
}

function rebuildCong() {
  cong.build({ size: state.cemaatSize, gender: state.gender, natural: state.cemaatNatural, blocked, gallery: gallery() });
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
        posture: state.steps[state.i].wudu ? 'wudu' : state.steps[state.i].hajj ? 'hajj' : !renderer.xr.isPresenting ? 'off' : state.posture.ok ? 'ok' : 'wait',
        handHint: renderer.xr.isPresenting ? state.posture.handHint : null,
        finger: renderer.xr.isPresenting && state.posture.finger,
        voice: state.voice,
        ghost: state.ghost,
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
      return { type: 'remind', back: state.remFrom === 'settings' ? 'settings' : 'times', ...state.remind, prayerList: PRAYERS.map((p) => ({ id: p.id, name: p.name, on: state.remind.prayers.includes(p.id) })), msg: state.remMsg, supported: canNotify(), perm: canNotify() ? Notification.permission : 'unsupported',
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
      return { type: 'done', prayer: state.prayer, kids: state.kids, stars: state.progress.stars || 0 };
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
        type: 'menu',
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

function refresh() {
  const v = view();
  if (mobileUI) mobileUI.render(v);
  else {
    panel.render(v);
    card.render(v);
  }
  if (wantsWuduRoom() !== state.wuduRoom || wantsScene() !== state.scene) rebuildEnv();
  // Im Iḥrām: Männer in Weiß ohne Kappe
  const ihram = pilgrimActive() && isHajj(state.prayer);
  if (!!guide.ihram !== ihram) { guide.setIhram(ihram); ghost.setIhram(ihram); }
  if (state.scene) { placePilgrim(true); if (mobileUI) aimAtGuide(); }
  const cur = state.view === 'step' && state.steps[state.i];
  ambience.set({ scene: state.wuduRoom ? 'wudu' : state.scene, enabled: state.sounds, chorus: pilgrimActive() && !!cur && CHORUS.has(cur.id), chorusText: TALBIYA_AR, voices });
  const pose = v.type === 'step' ? v.step.pose : 'stand';
  posePerson(guide, pose);
  posePerson(ghost, pose);
  placeGhost();
  if (state.wuduRoom) {
    const feet = atStools();
    placeWuduFigures();
    if (feet !== state.atStools && mobileUI) { state.atStools = feet; aimAtGuide(); }
    state.atStools = feet;
  }
  // Grün, wenn deine Haltung in VR erkannt ist
  ghost.setGhostColor(v.type === 'step' && v.posture === 'ok' ? GHOST_OK : GHOST_WAIT);
  updateCast();
  if (cong.group.visible && v.type === 'step') cong.lead(v.step.pose, v.step.rakah);
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
  if (state.beginner || (state.voice && !imamLeads)) speak();
  else imamCall(step, state.steps[state.i - 1]);
  if (m.arrow || step.wudu || step.hajj) {
    banner.render(m);
    p.cueT = 3.5;
    placeBanner(true);
  }
}

const stepsFor = (prayer) => (prayer.kind === 'wudu' ? buildWuduSteps(state.madhab)
  : isPilgrimage(prayer) ? buildPilgrimage(prayer.kind, state.madhab, state.gender, state.prayerSura)
    : buildSteps(prayer, state.madhab, state.gender, state.prayerSura));

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
  if (lang === 'ar') { voices.say([{ text: [`${m.cue}.`, step.instr, ...step.ar].join(' '), lang: 'ar', rate: 0.9 }]); return; }
  const parts = [{ text: [`${m.cue}.`, step.instr, ...step.de].join(' '), lang }];
  if (step.ar.length && voices.has('ar')) parts.push({ text: step.ar.join('، '), lang: 'ar', rate: 0.8 });
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
    case 'gender': state.gender = arg; store.set('gender', arg); guide.setGender(arg); ghost.setGender(arg); rebuildCong(); break;
    case 'ghost': {
      const order = ['front', 'side', 'off'];
      state.ghost = order[(order.indexOf(state.ghost) + 1) % order.length];
      store.set('ghost', state.ghost);
      break;
    }
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
    case 'alevi': state.view = 'alevi'; break;
    case 'muharrem': state.view = 'muharrem'; state.muharremPart = arg || 'about'; break;
    case 'alevival': state.view = 'alevival'; break;
    case 'saynext': state.saying = (state.saying + 1) % SAYINGS; break;
    case 'sayprev': state.saying = (state.saying + SAYINGS - 1) % SAYINGS; break;
    case 'walkalong': state.walkAlong = !state.walkAlong; store.set('walkAlong', state.walkAlong); break;
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
      if (state.i < state.steps.length - 1) { state.i++; onStep(); } else {
        state.view = 'done';
        state.auto = false;
        if (cong.group.visible) cong.finish();
        recordPractice(state.progress, state.prayer.id);
        // Pflichtgebet geschafft: im Gebets-Tracker für heute abhaken
        if (markPrayed(state.progress, state.prayer.id)) fullDayStar(dayKey());
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
    case 'menu': state.view = 'menu'; state.auto = false; cong.reset(); voices.cancel(); break;
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

// Auf dem Handy blickt die Kamera auf die Vorbeter-Figur; mit Cemaat von schräg hinten über die Reihen.
function aimAtGuide() {
  // Waschraum: von hinten auf die Becken, Vorbeter und Ghost
  // Im Gebetsraum: hinter dir, Blick zur Qibla (Mihrab) – Vorbeter und Ghost stehen vor dir
  const eye = state.wuduRoom ? new THREE.Vector3(0.2, 1.75, 2.2) : cong.group.visible ? new THREE.Vector3(0, 2.3, 3.2) : new THREE.Vector3(0.5, 1.9, 2.4);
  camera.position.copy(world.localToWorld(eye));
  const target = new THREE.Vector3(0, 0.85, 0);
  // Im Waschraum auf dein Becken: links der Ghost, rechts der Vorbeter
  if (state.scene && state.scene !== 'miqat') {
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
  if (state.view === 'step' && state.auto && (state.posture.ok || !renderer.xr.isPresenting || wudu)) {
    state.autoT += dt;
    if (state.autoT >= state.steps[state.i].dur * (state.beginner || state.kids ? 1.6 : 1)) act('next');
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
  ghost.update(dt);
  updateMovers(dt);
  if (state.scene) { updatePilgrim(dt); updateCrowd(dt); }
  {
    const st = state.view === 'step' && state.steps[state.i];
    const water = (state.wuduRoom && !!st && st.wudu !== 'heart') || (!!st && st.id === 'zamzam');
    ambience.update(dt, { walking: !!(state.scene && state.pilgrim.moving), speed: state.pilgrim.speed || 2, water });
  }
  cong.update(dt);
  // Im Waschraum läuft das Wasser bei den Waschschritten (nicht bei Absicht und Bittgebet), bei den Füßen an den Hockern
  if (state.wuduRoom) {
    const st = state.view === 'step' && state.steps[state.i];
    const g = ghost.group.visible, arrived = (f) => !movers.has(f);
    if (state.atStools) setWater(!!st && st.wudu !== 'heart', clock.elapsedTime, [], [...(arrived(guide) ? [0] : []), ...(g && arrived(ghost) ? [1] : [])]);
    else setWater(!!st && st.wudu !== 'heart', clock.elapsedTime, [0, ...(arrived(guide) ? [1.1] : []), ...(g && arrived(ghost) ? [WUDU_BASINS[2]] : [])]);
  }
  renderer.render(scene, camera);
});

// ?debug stellt Hilfsobjekte für Tests in der Konsole bereit.
if (new URLSearchParams(location.search).has('debug')) window.salah = { act, guide, cong, camera, state, panel, card, world, setAR, view, voices, ambience };

camera.rotation.set(pitch, yaw, 0, 'YXZ');
guide.setGender(state.gender);
ghost.setGender(state.gender);
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
// Schriften nachladen, dann Panel neu zeichnen (Arabisch braucht Amiri).
Promise.all(['54px Amiri', '600 32px Inter', 'italic 30px Inter'].map((f) => document.fonts.load(f)))
  .catch(() => {})
  .then(() => refresh());
