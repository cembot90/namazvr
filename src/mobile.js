// Handy-Oberfläche: dieselben Ansichten wie das VR-Panel, als HTML unter der 3D-Szene.
import { drawPictogram, moveFor } from './movement.js';
import { drawBody } from './wudu.js';
import { TAQABBAL } from './prayer.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const btn = (label, action, { cls = '', sub = '', subAr = false } = {}) =>
  `<button class="${cls}" data-a="${esc(action)}">${esc(label)}${sub ? `<small class="${subAr ? 'ar' : ''}">${esc(sub)}</small>` : ''}</button>`;

const recitation = (t) => `
  <div class="rec">
    ${t.ar.map((l) => `<p class="ar" dir="rtl">${esc(l)}</p>`).join('')}
    ${t.tr.map((l) => `<p class="tr">${esc(l)}</p>`).join('')}
    ${t.de.map((l) => `<p class="de">${esc(l)}</p>`).join('')}
  </div>`;

const head = (title, sub = '') => `<header><h2>${esc(title)}</h2>${sub ? `<span>${esc(sub)}</span>` : ''}</header>`;
const progressBar = (k) => `<div class="bar"><i style="width:${Math.round(k * 100)}%"></i></div>`;

export class MobileUI {
  constructor(root, act) {
    this.root = root;
    this.act = act;
    this.compass = null;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'compass') this.startCompass();
      else act(a);
    });
  }

  render(v) {
    const fn = this[`v_${v.type}`];
    if (!fn) return;
    const keepScroll = v.type === this.lastType && v.type !== 'step';
    const y = this.root.scrollTop;
    this.root.innerHTML = fn.call(this, v);
    this.root.scrollTop = keepScroll ? y : 0;
    this.lastType = v.type;
    this.last = v;
    if (v.type === 'step') this.drawStep(v);
    if (v.type === 'qibla') this.updateNeedle();
  }

  v_menu(v) {
    return `
      ${head('Salah', 'Gebetsassistent')}
      <div class="grid5">${v.prayers.map((p) => {
        const row = v.times.rows.find((t) => t.id === p.id);
        return btn(p.name, `prayer:${p.id}`, { cls: p.id === v.times.current ? 'active' : '', sub: `${row.time} · ${p.rakat}` });
      }).join('')}</div>
      <p class="gold">Nächstes Gebet: ${esc(v.times.next.name)} um ${esc(v.times.next.time)} Uhr – in ${esc(v.times.next.inText)}</p>
      <p class="muted">${esc(v.qibla)} · ${esc(v.madhab)}</p>
      <div class="grid2">
        ${btn('Gebetszeiten', 'times')}${btn('Weitere Gebete', 'more')}
        ${btn('Wuḍūʾ lernen', 'wudu', { cls: v.wuduDone ? '' : 'primary' })}${btn('Lernen & Quiz', 'learn')}
        ${btn('Qibla & Kompass', 'qibla')}${btn('Tasbīḥ zählen', 'tasbih')}
        ${btn('Moschee wählen', 'mosque')}${btn('Einstellungen', 'settings')}
      </div>`;
  }

  v_times(v) {
    return `
      ${head('Gebetszeiten', `${v.location} · heute`)}
      <div class="list">${v.rows.map((r) => {
        const tag = r.id === v.current ? 'jetzt' : r.id === v.next.id ? `in ${v.next.inText}` : '';
        const inner = `<span>${esc(r.name)}</span><em>${esc(tag)}</em><b>${esc(r.time)}</b>`;
        return r.prayer
          ? `<button class="row ${r.id === v.current ? 'active' : ''}" data-a="prayer:${r.id}">${inner}</button>`
          : `<div class="row dim">${inner}</div>`;
      }).join('')}</div>
      <p class="muted small">${v.highLatitude ? 'Hohe Breite: Fajr/Isha sind angenähert.' : 'Berechnet aus dem Sonnenstand.'} Lokale Moscheen können abweichen.</p>
      <div class="grid2">${btn('Methode', 'method', { sub: v.method })}${btn('Asr', 'asr', { sub: v.asr.split(' (')[0] })}</div>
      ${btn('Zurück', 'menu', { cls: 'wide' })}`;
  }

  v_qibla(v) {
    return `
      ${head('Qibla & Kompass')}
      <p class="muted">Ort: <b>${esc(v.location.name)}</b> · Qibla ${Math.round(v.bearing)}° von Norden</p>
      <div class="compass"><div class="dial"><span class="n">↑</span><div id="needle" class="needle"><span>🕋</span></div></div></div>
      <p id="compass-msg" class="muted center">${this.compass ? '' : 'Tippe auf „Kompass starten“ und halte das Handy flach.'}</p>
      ${btn(this.compass ? 'Kompass läuft' : 'Kompass starten', 'compass', { cls: 'primary wide' })}
      <div class="grid3">${v.cities.map((c, i) => btn(c.name, `city:${i}`, { cls: c.name === v.location.name ? 'active' : '' })).join('')}${btn('📍 GPS', 'gps', { cls: v.location.name === 'Mein Standort' ? 'active' : '' })}</div>
      ${v.msg ? `<p class="gold">${esc(v.msg)}</p>` : ''}
      ${btn('Zurück', 'menu', { cls: 'wide' })}`;
  }

  // Handy-Kompass: Nadel zeigt Richtung Kaaba (iOS: webkitCompassHeading, Android: absolute Ausrichtung).
  async startCompass() {
    if (this.compass) return;
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') throw new Error('denied');
      }
    } catch {
      this.setCompassMsg('Kein Zugriff auf den Kompass – bitte in den Einstellungen erlauben.');
      return;
    }
    const onOrient = (e) => {
      let heading = null;
      if (typeof e.webkitCompassHeading === 'number') heading = e.webkitCompassHeading;
      else if (e.absolute && typeof e.alpha === 'number') heading = 360 - e.alpha;
      if (heading == null) return;
      this.compass.heading = heading;
      this.updateNeedle();
    };
    this.compass = { heading: null };
    window.addEventListener('deviceorientationabsolute', onOrient);
    window.addEventListener('deviceorientation', onOrient);
    this.setCompassMsg('Drehe dich, bis die Nadel nach oben zeigt.');
    setTimeout(() => { if (this.compass && this.compass.heading == null) this.setCompassMsg('Dieses Gerät liefert keine Kompassdaten.'); }, 3000);
    if (this.last) this.render(this.last);
  }

  setCompassMsg(text) {
    const el = this.root.querySelector('#compass-msg');
    if (el) el.textContent = text;
  }

  updateNeedle() {
    const needle = this.root.querySelector('#needle');
    if (!needle || !this.last || this.last.type !== 'qibla') return;
    const h = this.compass?.heading;
    const angle = h == null ? this.last.bearing : this.last.bearing - h;
    needle.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
    if (h != null) {
      const diff = ((angle % 360) + 540) % 360 - 180;
      needle.classList.toggle('ok', Math.abs(diff) < 5);
      this.setCompassMsg(Math.abs(diff) < 5 ? '✓ Du schaust zur Qibla.' : 'Drehe dich, bis die Nadel nach oben zeigt.');
    }
  }

  v_step(v) {
    const s = v.step;
    const unit = s.unit ? ` · ${s.unit}` : '';
    const status = s.rakah ? `${v.prayer.name}${unit} · Rakʿa ${s.rakah}/${s.of || v.prayer.rakat}` : `${v.prayer.name}${unit}`;
    const m = s.wudu
      ? { cue: s.cue, how: `${s.count}× · ${s.fard ? 'Pflicht (Farḍ)' : 'Sunnah'}` }
      : { ...moveFor(v.prevPose, s.pose), ...(s.how ? { how: s.how } : {}) };
    return `
      ${head(s.title, status)}
      ${progressBar((v.index + 1) / v.total)}
      <div class="move"><canvas id="pict" width="240" height="240"></canvas><div><b>${esc(m.cue)}</b><p>${esc(m.how)}</p></div></div>
      ${v.inner ? `<p class="inner">✦ ${esc(v.inner)}</p>` : ''}
      <p class="muted">${esc(s.instr)}</p>
      ${recitation(s)}
      <div class="dock">
        ${btn('◀', 'prev')}${btn('Menü', 'menu')}${btn(v.auto ? 'Auto an' : 'Auto', 'auto', { cls: v.auto ? 'active' : '' })}${btn('🔊', 'speak')}
        ${btn(v.index === v.total - 1 ? 'Fertig ✓' : 'Weiter ▶', 'next', { cls: 'primary' })}
      </div>`;
  }

  drawStep(v) {
    const c = this.root.querySelector('#pict');
    if (!c) return;
    const ctx = c.getContext('2d');
    if (v.step.wudu) drawBody(ctx, v.step.wudu, 10, 10, 220);
    else drawPictogram(ctx, v.prevPose, v.step.pose, 10, 10, 220);
  }

  v_done(v) {
    if (v.prayer.kind === 'wudu') {
      return `${head('Wuḍūʾ beendet')}
        <p>Gut gemacht! Du bist jetzt im Zustand der rituellen Reinheit und kannst beten.</p>
        <p class="muted">Ungültig wird die Wuḍūʾ u. a. durch Toilettengang, Blähungen, tiefen Schlaf und Bewusstlosigkeit.</p>
        <div class="grid2">${btn('Jetzt beten', 'menu', { cls: 'primary' })}${btn('Nochmal üben', 'again')}</div>`;
    }
    return `${head('Gebet beendet', v.prayer.name)}
      ${recitation(TAQABBAL)}
      <p class="muted">Empfohlen: 33× Subḥāna llāh, 33× Al-ḥamdu li-llāh, 34× Allāhu akbar.</p>
      <div class="grid3">${btn('Tasbīḥ', 'tasbih', { cls: 'primary' })}${btn('Nochmal', 'again')}${btn('Menü', 'menu')}</div>`;
  }

  v_tasbih(v) {
    const body = v.finished
      ? recitation(TAQABBAL)
      : `<p class="ar big center" dir="rtl">${esc(v.ar)}</p><p class="tr center">${esc(v.tr)}</p><p class="muted center">${esc(v.de)}</p>
         <p class="count">${v.count} / ${v.target}</p>${progressBar(v.count / v.target)}
         ${v.breath ? `<div class="breath ${v.breathPhase}"></div><p class="center ${v.breathPhase === 'in' ? 'muted' : 'ok'}">${v.breathPhase === 'in' ? 'Einatmen …' : `Ausatmen – ${esc(v.tr)}`}</p>` : ''}`;
    return `${head('Tasbīḥ', v.finished ? 'abgeschlossen' : `Runde ${v.phase + 1} von ${v.phases}`)}
      ${body}
      ${btn(v.finished ? 'Nochmal' : 'Zählen  +1', v.finished ? 'tasbihreset' : 'count', { cls: 'primary huge' })}
      <div class="grid3">${btn(v.breath ? 'Atem an' : 'Atem aus', 'breath', { cls: v.breath ? 'active' : '' })}${btn('Neu', 'tasbihreset')}${btn('Menü', 'menu')}</div>`;
  }

  v_more(v) {
    return `${head('Weitere Gebete', v.madhab)}
      <div class="list">${v.prayers.map((p) => btn(p.name, `prayer:${p.id}`, { sub: `${p.rakat} Rakʿāt · ${p.de}` })).join('')}</div>
      ${btn('Zurück', 'menu', { cls: 'wide' })}`;
  }

  v_settings(v) {
    const toggle = (label, sub, action, on) => `<div class="setting"><div><b>${esc(label)}</b><small>${esc(sub)}</small></div>${btn(on ? 'An' : 'Aus', action, { cls: on ? 'active' : '' })}</div>`;
    return `${head('Einstellungen')}
      <h3>Rechtsschule</h3>
      <div class="grid2">${v.madhabs.map((m) => btn(m.name, `madhab:${m.id}`, { cls: m.id === v.madhab.id ? 'active' : '' })).join('')}</div>
      <ul class="notes">${v.madhab.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      <h3>Anleitung für</h3>
      <div class="grid2">${btn('Männer', 'gender:m', { cls: v.gender !== 'f' ? 'active' : '' })}${btn('Frauen', 'gender:f', { cls: v.gender === 'f' ? 'active' : '' })}</div>
      ${toggle('Anfänger-Modus', 'langsamer, mit Vorlesen', 'beginner', v.beginner)}
      ${toggle('Spiritueller Modus', 'innere Bedeutung, Atem-Dhikr', 'spiritual', v.spiritual)}
      <div class="grid2">${btn('Hinweise', 'info')}${btn('Zurück', 'menu')}</div>`;
  }

  v_learn(v) {
    const p = v.progress;
    return `${head('Lernen & Fortschritt')}
      <div class="stats">
        <div><b>${v.totalPrayers}</b><small>Gebete</small></div><div><b>${p.wudu}</b><small>Waschungen</small></div>
        <div><b>${v.streak}</b><small>Tage in Folge</small></div><div><b>${p.quizBest}/10</b><small>Bestes Quiz</small></div>
      </div>
      <h3>Abzeichen</h3>
      <div class="badges">${v.badges.map((b) => `<span class="${b.ok ? 'ok' : ''}">${b.ok ? '★' : '☆'} ${esc(b.name)}</span>`).join('')}</div>
      ${btn('Quiz starten', 'quiz', { cls: 'primary wide' })}
      <div class="grid2">${btn('Zurücksetzen', 'resetprogress')}${btn('Zurück', 'menu')}</div>`;
  }

  v_quiz(v) {
    const z = v.quiz;
    if (z.i >= z.questions.length) {
      return `${head('Quiz beendet')}<p class="count">${z.score} / ${z.questions.length}</p>
        <p class="center">${z.score === z.questions.length ? 'Māshāʾ Allāh – alles richtig!' : z.score >= 7 ? 'Sehr gut!' : 'Weiter üben – du schaffst das!'}</p>
        <div class="grid2">${btn('Nochmal', 'quiz', { cls: 'primary' })}${btn('Zurück', 'learn')}</div>`;
    }
    const q = z.questions[z.i];
    const answered = z.answer != null;
    return `${head(`Frage ${z.i + 1} von ${z.questions.length}`, `${z.score} richtig`)}
      ${progressBar(z.i / z.questions.length)}
      <p class="question">${esc(q.q)}</p>
      <div class="list">${q.options.map((o, i) => {
        const cls = answered ? (i === q.correct ? 'primary' : i === z.answer ? 'wrong' : '') : '';
        return btn(o, answered ? 'noop' : `answer:${i}`, { cls });
      }).join('')}</div>
      ${answered ? `<p class="${z.answer === q.correct ? 'ok' : 'bad'}">${z.answer === q.correct ? '✓ Richtig!' : '✗ Leider falsch – grün ist richtig.'}</p>${btn(z.i === z.questions.length - 1 ? 'Ergebnis' : 'Nächste Frage ▶', 'quiznext', { cls: 'primary wide' })}` : ''}
      ${btn('Abbrechen', 'learn', { cls: 'wide' })}`;
  }

  v_mosque(v) {
    return `${head('Moschee wählen')}
      <div class="list">${v.styles.map((s) => btn(s.name, `style:${s.id}`, { cls: s.id === v.style ? 'active' : '', sub: s.de })).join('')}</div>
      <p class="muted small">Freie Gestaltungen, inspiriert von islamischen Bautraditionen – keine Nachbauten bestimmter Moscheen.</p>
      ${btn('Zurück', 'menu', { cls: 'wide' })}`;
  }

  v_info() {
    return `${head('Hinweise')}
      <p>Diese App ist eine Lernhilfe nach verbreiteter sunnitischer Praxis. Einzelheiten unterscheiden sich je nach Rechtsschule.</p>
      <p>Voraussetzungen: Wuḍūʾ, saubere Kleidung und ein sauberer Platz, Bedeckung der ʿAwra, die richtige Gebetszeit und die Ausrichtung zur Qibla.</p>
      <p>Die Sprachausgabe ist eine Computerstimme und ersetzt keine Rezitation mit Tajwīd. Bei Fragen wende dich an einen Imam deines Vertrauens.</p>
      ${btn('Zurück', 'settings', { cls: 'wide' })}`;
  }
}
