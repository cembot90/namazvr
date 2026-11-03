// Körperbewegungen zwischen den Haltungen: Ansage, Piktogramm und Erkennung über die Kopfhöhe in VR.

// Haltung → Körperlage, die in VR erkannt werden kann.
const BODY = { stand: 'stand', takbir: 'stand', qiyam: 'stand', dua: 'stand', ruku: 'ruku', sujud: 'sujud', sit: 'sit', taslimR: 'sit', taslimL: 'sit' };

const HOW = {
  stand: 'Steh aufrecht, Füße etwa schulterbreit, Blick auf den Platz der Niederwerfung.',
  takbir: 'Hebe beide Hände mit offenen Handflächen bis auf Ohren- bzw. Schulterhöhe.',
  qiyam: 'Steh aufrecht und lege die rechte Hand über die linke auf Brust oder Bauch.',
  ruku: 'Beuge den Oberkörper nach vorn, bis der Rücken waagerecht ist. Hände auf die Knie, Blick nach unten.',
  sujud: 'Knie auf den Boden, dann Hände; Stirn und Nase auf den Boden. Zehen bleiben aufgestellt.',
  sit: 'Setz dich auf den linken Fuß, der rechte Fuß bleibt aufgestellt. Hände auf die Oberschenkel.',
  dua: 'Hebe beide Hände vor die Brust, die Handflächen zeigen nach oben.',
  taslimR: 'Bleib sitzen und dreh den Kopf nach rechts, bis du über die Schulter schaust.',
  taslimL: 'Bleib sitzen und dreh den Kopf nach links, bis du über die Schulter schaust.',
};

/**
 * Bewegung von der vorherigen zur aktuellen Haltung.
 * @returns {{ arrow: 'down'|'up'|'right'|'left'|null, cue: string, how: string, body: string }}
 */
export function moveFor(prev, pose) {
  const body = BODY[pose];
  const from = prev ? BODY[prev] : null;
  const how = HOW[pose];
  if (pose === 'taslimR') return { arrow: 'right', cue: 'Kopf nach rechts drehen', how, body };
  if (pose === 'taslimL') return { arrow: 'left', cue: 'Kopf nach links drehen', how, body };
  if (!prev) return { arrow: null, cue: 'Aufrecht hinstellen', how, body };
  if (pose === 'dua') return { arrow: 'up', cue: 'Hände zum Bittgebet heben', how, body };
  if (pose === 'takbir') return { arrow: 'up', cue: 'Hände heben', how, body };
  if (from === body) {
    if (pose === 'qiyam' && prev === 'takbir') return { arrow: null, cue: 'Hände übereinanderlegen', how, body };
    if (pose === 'stand' && prev === 'takbir') return { arrow: null, cue: 'Arme sinken lassen', how, body };
    const hold = { stand: 'Stehen bleiben', ruku: 'In der Verbeugung bleiben', sujud: 'In der Niederwerfung bleiben', sit: 'Sitzen bleiben' };
    return { arrow: null, cue: hold[body], how, body };
  }
  const cues = {
    stand: from === 'ruku' ? 'Aufrichten' : 'Aufstehen',
    ruku: 'Verbeugen',
    sujud: from === 'sit' ? 'Wieder niederwerfen' : 'Niederwerfen – auf den Boden',
    sit: 'Aufsetzen',
  };
  const arrow = { stand: 'up', ruku: 'down', sujud: 'down', sit: from === 'sujud' ? 'up' : 'down' }[body];
  return { arrow, cue: cues[body], how, body };
}

/**
 * Körperlage aus dem Kopf: Höhe relativ zur Stehhöhe und Neigung (Pitch, Radiant, negativ = nach unten).
 * Rukūʿ und Sitzen liegen ähnlich hoch – in Rukūʿ zeigt der Blick aber steil nach unten.
 */
export function classifyHead(height, standHeight, pitch) {
  const r = height / standHeight;
  if (r > 0.86) return 'stand';
  if (r < 0.42) return 'sujud';
  if (r > 0.5 && pitch < -0.95) return 'ruku';
  if (r < 0.75) return 'sit';
  return 'ruku';
}

/** Erfüllt die Kopfhaltung die verlangte Haltung? yawRel = Kopfdrehung gegenüber der Qibla (positiv = links). */
export function matchesPose(pose, body, yawRel) {
  if (body !== BODY[pose]) return false;
  if (pose === 'taslimR') return yawRel < -0.5;
  if (pose === 'taslimL') return yawRel > 0.5;
  return true;
}

// Seitenansicht, Blick nach rechts (= Qibla). Koordinaten im Einheitsquadrat, y nach unten.
const FIG = {
  stand: { head: [0.5, 0.11], neck: [0.5, 0.22], hip: [0.5, 0.53], knee: [0.5, 0.75], foot: [0.5, 0.95], toe: [0.6, 0.95], elbow: [0.5, 0.38], hand: [0.52, 0.53] },
  takbir: { head: [0.5, 0.11], neck: [0.5, 0.22], hip: [0.5, 0.53], knee: [0.5, 0.75], foot: [0.5, 0.95], toe: [0.6, 0.95], elbow: [0.58, 0.3], hand: [0.58, 0.12] },
  qiyam: { head: [0.5, 0.11], neck: [0.5, 0.22], hip: [0.5, 0.53], knee: [0.5, 0.75], foot: [0.5, 0.95], toe: [0.6, 0.95], elbow: [0.53, 0.4], hand: [0.6, 0.36] },
  ruku: { head: [0.82, 0.5], neck: [0.71, 0.52], hip: [0.4, 0.53], knee: [0.42, 0.75], foot: [0.4, 0.95], toe: [0.5, 0.95], elbow: [0.6, 0.63], hand: [0.47, 0.72] },
  sujud: { head: [0.8, 0.88], neck: [0.68, 0.8], hip: [0.36, 0.66], knee: [0.46, 0.95], foot: [0.18, 0.95], toe: [0.22, 0.88], elbow: [0.62, 0.92], hand: [0.74, 0.95] },
  sit: { head: [0.42, 0.4], neck: [0.41, 0.51], hip: [0.38, 0.83], knee: [0.7, 0.93], foot: [0.36, 0.95], toe: [0.28, 0.95], elbow: [0.46, 0.68], hand: [0.62, 0.84] },
};
FIG.dua = { ...FIG.stand, elbow: [0.56, 0.42], hand: [0.68, 0.34] };
FIG.taslimR = FIG.sit;
FIG.taslimL = FIG.sit;

function figure(ctx, f, x, y, s, color, width) {
  const P = (k) => [x + f[k][0] * s, y + f[k][1] * s];
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const line = (...keys) => {
    ctx.beginPath();
    keys.forEach((k, i) => (i ? ctx.lineTo(...P(k)) : ctx.moveTo(...P(k))));
    ctx.stroke();
  };
  line('neck', 'hip', 'knee', 'foot', 'toe');
  line('neck', 'elbow', 'hand');
  ctx.beginPath();
  ctx.arc(...P('head'), s * 0.075, 0, Math.PI * 2);
  ctx.fill();
}

// Pfeil ↓ ↑ → ← als Linie mit Spitze.
export function drawArrow(ctx, dir, cx, cy, len, color, width = 10) {
  const v = { down: [0, 1], up: [0, -1], right: [1, 0], left: [-1, 0] }[dir];
  if (!v) return;
  const [dx, dy] = v;
  const x0 = cx - dx * len / 2, y0 = cy - dy * len / 2, x1 = cx + dx * len / 2, y1 = cy + dy * len / 2;
  const head = len * 0.38;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.moveTo(x1 - dx * head - dy * head, y1 - dy * head - dx * head);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - dx * head + dy * head, y1 - dy * head + dx * head);
  ctx.stroke();
}

/** Piktogramm: vorherige Haltung blass, aktuelle Haltung kräftig, dazu der Bewegungspfeil. */
export function drawPictogram(ctx, prev, pose, x, y, size, { color = '#e6c77f', ghost = 'rgba(159,176,198,0.35)', ground = 'rgba(201,168,92,0.5)' } = {}) {
  ctx.save();
  ctx.strokeStyle = ground;
  ctx.lineWidth = Math.max(2, size * 0.012);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.08, y + size * 0.97);
  ctx.lineTo(x + size * 0.92, y + size * 0.97);
  ctx.stroke();
  if (prev && FIG[prev] !== FIG[pose]) figure(ctx, FIG[prev], x, y, size, ghost, size * 0.045);
  figure(ctx, FIG[pose], x, y, size, color, size * 0.055);
  const { arrow } = moveFor(prev, pose);
  if (arrow === 'right' || arrow === 'left') {
    // Kopfdrehung beim Taslīm: Pfeil über dem Kopf
    drawArrow(ctx, arrow, x + size * 0.42, y + size * 0.2, size * 0.32, '#7fd1a8', size * 0.04);
  } else if (arrow) {
    drawArrow(ctx, arrow, x + size * 0.12, y + size * 0.5, size * 0.4, '#7fd1a8', size * 0.04);
  }
  ctx.restore();
}
