// Gebetswaschung (Wuḍūʾ) Schritt für Schritt. Pflichten nach Koran 5:6; Details je Rechtsschule vereinfacht.

export const WUDU = { id: 'wudu', name: 'Wuḍūʾ', kind: 'wudu' };

const SHAHADA = {
  ar: ['أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ'],
  tr: ['Ashhadu an lā ilāha illa llāhu waḥdahū lā sharīka lah, wa ashhadu anna Muḥammadan ʿabduhū wa rasūluh.'],
  de: ['Ich bezeuge, dass es keinen Gott gibt außer Allah, dem Einen ohne Teilhaber, und dass Muhammad Sein Diener und Gesandter ist.'],
};

const HEAD_RULE = {
  hanafi: 'Ḥanafī: Pflicht ist mindestens ein Viertel des Kopfes, den ganzen Kopf zu bestreichen ist Sunnah.',
  shafii: 'Shāfiʿī: Pflicht ist, einen Teil des Kopfes zu bestreichen, den ganzen Kopf zu bestreichen ist Sunnah.',
  maliki: 'Mālikī: Pflicht ist, den ganzen Kopf zu bestreichen.',
  hanbali: 'Ḥanbalī: Pflicht ist, den ganzen Kopf einschließlich der Ohren zu bestreichen.',
};

const GENERAL = {
  hanafi: 'Ḥanafī: Die Absicht und die Reihenfolge sind Sunnah, aber stark empfohlen.',
  shafii: 'Shāfiʿī: Die Absicht und die Reihenfolge sind Pflicht.',
  maliki: 'Mālikī: Die Absicht ist Pflicht, ebenso das Reiben der Glieder (Dalk) und das zügige Waschen ohne lange Pausen.',
  hanbali: 'Ḥanbalī: Die Absicht, die Reihenfolge und das zügige Waschen sind Pflicht, ebenso Mund und Nase.',
};

export function buildWuduSteps(madhab = 'hanafi') {
  const hb = madhab === 'hanbali';
  const s = (title, cue, pose, part, count, fard, instr, extra = {}) => ({
    title, cue, pose, wudu: part, count, fard, instr, rakah: 0, dur: count * 4 + 4, ar: [], tr: [], de: [], ...extra,
  });
  return [
    s('Niyya und Basmala', 'Absicht fassen', 'stand', 'heart', 1, madhab !== 'hanafi',
      'Fasse im Herzen die Absicht, die Gebetswaschung für Allah zu vollziehen, und sprich „Bismi llāh“.',
      { ar: ['بِسْمِ اللَّهِ'], tr: ['Bismi llāh'], de: ['Im Namen Allahs.', GENERAL[madhab]] }),
    s('Hände waschen', 'Hände waschen', 'wash', 'hands', 3, false,
      'Wasche beide Hände bis zu den Handgelenken, auch zwischen den Fingern. Beginne mit der rechten Hand.'),
    s('Mund ausspülen', 'Mund ausspülen', 'face', 'mouth', 3, hb,
      'Nimm mit der rechten Hand Wasser in den Mund, spüle ihn gründlich aus und spucke das Wasser wieder aus.'),
    s('Nase reinigen', 'Nase reinigen', 'face', 'nose', 3, hb,
      'Zieh mit der rechten Hand etwas Wasser in die Nase und schnäuze es mit der linken Hand wieder aus.'),
    s('Gesicht waschen', 'Gesicht waschen', 'face', 'face', 3, true,
      'Wasche das ganze Gesicht: von der Stirn (Haaransatz) bis unter das Kinn und von Ohr zu Ohr.'),
    s('Rechter Arm', 'Rechten Arm waschen', 'wash', 'armR', 3, true,
      'Wasche den rechten Arm von den Fingerspitzen bis einschließlich Ellbogen.'),
    s('Linker Arm', 'Linken Arm waschen', 'wash', 'armL', 3, true,
      'Wasche genauso den linken Arm bis einschließlich Ellbogen.'),
    s('Kopf bestreichen (Masḥ)', 'Über den Kopf streichen', 'head', 'head', 1, true,
      'Streiche mit den nassen Händen über den Kopf: von der Stirn bis zum Nacken und wieder zurück.',
      { de: [HEAD_RULE[madhab]] }),
    s('Ohren bestreichen', 'Ohren bestreichen', 'head', 'ears', 1, hb,
      'Fahre mit den nassen Zeigefingern innen durch die Ohren und streiche mit den Daumen über die Rückseite.'),
    s('Rechter Fuß', 'Rechten Fuß waschen', 'feet', 'footR', 3, true,
      'Wasche den rechten Fuß bis einschließlich der Knöchel, auch zwischen den Zehen (am besten mit dem kleinen Finger).'),
    s('Linker Fuß', 'Linken Fuß waschen', 'feet', 'footL', 3, true,
      'Wasche genauso den linken Fuß bis einschließlich der Knöchel.'),
    s('Bittgebet danach', 'Glaubensbekenntnis sprechen', 'stand', 'heart', 1, false,
      'Sprich nach der Waschung das Glaubensbekenntnis (Sunnah):', SHAHADA),
  ];
}

// Körper von vorn im Spiegelbild: Die rechte Körperseite ist rechts zu sehen.
const J = {
  head: [0.5, 0.15], shR: [0.61, 0.3], shL: [0.39, 0.3], elR: [0.69, 0.45], elL: [0.31, 0.45], haR: [0.72, 0.6], haL: [0.28, 0.6],
  hipR: [0.55, 0.58], hipL: [0.45, 0.58], knR: [0.56, 0.77], knL: [0.44, 0.77], anR: [0.56, 0.93], anL: [0.44, 0.93], toR: [0.62, 0.96], toL: [0.38, 0.96],
};

export function drawBody(ctx, part, x, y, size, { color = 'rgba(207,216,227,0.55)', water = '#6fc3e8', gold = '#e6c77f' } = {}) {
  const P = (k) => [x + J[k][0] * size, y + J[k][1] * size];
  const line = (keys, c, w) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    keys.forEach((k, i) => (i ? ctx.lineTo(...P(k)) : ctx.moveTo(...P(k))));
    ctx.stroke();
  };
  const dot = (k, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(...P(k), r * size, 0, Math.PI * 2); ctx.fill(); };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const w = size * 0.045, hw = size * 0.07;
  // Rumpf und Glieder
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 0.4 * size, y + 0.27 * size, 0.2 * size, 0.33 * size, 0.04 * size);
  ctx.fill();
  line(['shR', 'elR', 'haR'], color, w);
  line(['shL', 'elL', 'haL'], color, w);
  line(['hipR', 'knR', 'anR', 'toR'], color, w);
  line(['hipL', 'knL', 'anL', 'toL'], color, w);
  dot('head', 0.085, color);

  const hx = x + J.head[0] * size, hy = y + J.head[1] * size;
  switch (part) {
    case 'hands': dot('haR', 0.05, water); dot('haL', 0.05, water); break;
    case 'armR': line(['haR', 'elR'], water, hw); dot('elR', 0.04, water); dot('haR', 0.045, water); break;
    case 'armL': line(['haL', 'elL'], water, hw); dot('elL', 0.04, water); dot('haL', 0.045, water); break;
    case 'footR': line(['anR', 'toR'], water, hw); break;
    case 'footL': line(['anL', 'toL'], water, hw); break;
    case 'face': dot('head', 0.075, water); break;
    case 'mouth':
      ctx.strokeStyle = water; ctx.lineWidth = size * 0.022;
      ctx.beginPath(); ctx.arc(hx, hy + 0.02 * size, 0.035 * size, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      break;
    case 'nose':
      ctx.strokeStyle = water; ctx.lineWidth = size * 0.022;
      ctx.beginPath(); ctx.moveTo(hx, hy - 0.03 * size); ctx.lineTo(hx, hy + 0.015 * size); ctx.stroke();
      break;
    case 'head':
      ctx.strokeStyle = water; ctx.lineWidth = size * 0.03;
      ctx.beginPath(); ctx.arc(hx, hy, 0.095 * size, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke();
      break;
    case 'ears':
      ctx.fillStyle = water;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + s * 0.09 * size, hy, 0.025 * size, 0, Math.PI * 2); ctx.fill(); }
      break;
    default: {
      // Herz für Absicht und Bittgebet
      const cx = x + 0.5 * size, cy = y + 0.38 * size, r = 0.035 * size;
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 1.6);
      ctx.bezierCurveTo(cx - r * 2.2, cy, cx - r * 1.1, cy - r * 1.4, cx, cy - r * 0.4);
      ctx.bezierCurveTo(cx + r * 1.1, cy - r * 1.4, cx + r * 2.2, cy, cx, cy + r * 1.6);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(207,216,227,0.7)';
  ctx.font = `600 ${Math.round(size * 0.07)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', x + 0.86 * size, y + 0.3 * size);
  ctx.fillText('L', x + 0.14 * size, y + 0.3 * size);
  ctx.restore();
}
