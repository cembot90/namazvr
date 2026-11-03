// Handhaltung aus der Hand-Erkennung der Quest (WebXR Hand Input).
// Positionen in Metern, y = Höhe über dem Boden. Die Prüfung ist bewusst großzügig: Sie soll helfen, nicht streng bewerten.

const JOINTS = { wrist: 'wrist', index: 'index-finger-tip', middle: 'middle-finger-tip', ring: 'ring-finger-tip' };

// Gelenke einer Hand (three.js-Gruppe aus renderer.xr.getHand) → { wrist, index, middle, ring } oder null, wenn nicht erkannt.
export function readHand(hand) {
  const j = hand?.joints;
  if (!j || !j.wrist || !j.wrist.visible) return null;
  const out = {};
  for (const [k, name] of Object.entries(JOINTS)) {
    const joint = j[name];
    if (!joint) return null;
    const p = joint.getWorldPosition(joint.userData.tmp || (joint.userData.tmp = joint.position.clone()));
    out[k] = { x: p.x, y: p.y, z: p.z };
  }
  return out;
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * Passt die Handhaltung zur verlangten Haltung?
 * hands = { left, right } (je readHand oder null), head = Kopfposition, standH = Kopfhöhe im Stehen.
 * @returns {{ ok: boolean|null, hint: string|null }} ok = null, wenn keine Hände erkannt sind (dann zählt nur der Kopf).
 */
export function checkHands(pose, hands, head, standH = 1.6) {
  const list = [hands.left, hands.right].filter(Boolean);
  if (list.length < 2) return { ok: null, hint: null };
  const [a, b] = list;
  const all = (fn) => list.every(fn);
  const res = (ok, hint) => ({ ok, hint: ok ? null : hint });
  switch (pose) {
    case 'takbir':
      // Hände etwa auf Ohren- bis Schulterhöhe, seitlich am Kopf
      return res(all((h) => h.wrist.y > head.y - 0.4 && h.index.y > head.y - 0.25 && flat(h.wrist, head) < 0.45), 'raise');
    case 'qiyam':
      // Hände liegen übereinander vor dem Körper (Brust bis unter den Nabel)
      return res(dist(a.wrist, b.wrist) < 0.16 && all((h) => h.wrist.y < head.y - 0.2 && h.wrist.y > head.y - 0.95), 'fold');
    case 'dua':
      // Hände vor der Brust, nicht zu weit auseinander
      return res(dist(a.wrist, b.wrist) < 0.45 && all((h) => h.wrist.y < head.y - 0.1 && h.wrist.y > head.y - 0.7 && flat(h.wrist, head) > 0.12), 'dua');
    case 'ruku':
      // Hände auf den Knien
      return res(all((h) => h.wrist.y < 0.47 * standH && h.wrist.y > 0.15 * standH), 'knees');
    case 'sujud':
      // Handflächen auf dem Boden
      return res(all((h) => h.wrist.y < 0.13 * standH), 'floor');
    case 'sit':
      // Hände auf den Oberschenkeln
      return res(all((h) => h.wrist.y < 0.4 * standH && h.wrist.y > 0.04), 'thighs');
    default:
      // Stehen (auch Sadl), Taslīm: keine Vorgabe für die Hände
      return { ok: true, hint: null };
  }
}

// Erhobener Zeigefinger beim Tashahhud: Zeigefinger gestreckt, Mittel- und Ringfinger eingerollt.
export function indexRaised(hand) {
  if (!hand) return false;
  const reach = (tip) => dist(tip, hand.wrist);
  return reach(hand.index) > 0.14 && reach(hand.middle) < 0.12 && reach(hand.ring) < 0.12;
}
