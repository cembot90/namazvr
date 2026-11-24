// Handy-Oberfläche: dieselben Ansichten wie das VR-Panel, als HTML unter der 3D-Szene.
import { drawPictogram, moveFor } from './movement.js';
import { LETTERS as LETTERS_ALL } from './alphabet.js';
import { drawBody } from './wudu.js';
import { taqabbal } from './prayer.js';
import { isRTL, t } from './i18n.js';
import { menuGroups } from './menu.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const btn = (label, action, { cls = '', sub = '', subAr = false } = {}) =>
  `<button class="${cls}" data-a="${esc(action)}">${esc(label)}${sub ? `<small class="${subAr ? 'ar' : ''}">${esc(sub)}</small>` : ''}</button>`;

const recitation = (t) => (!t.ar.length && !t.tr.length && !t.de.length ? '' : `
  <div class="rec">
    ${t.ar.map((l) => `<p class="ar" dir="rtl">${esc(l)}</p>`).join('')}
    ${t.tr.map((l) => `<p class="tr">${esc(l)}</p>`).join('')}
    ${t.de.map((l) => `<p class="de">${esc(l)}</p>`).join('')}
  </div>`);

const head = (title, sub = '') => `<header><h2>${esc(title)}</h2>${sub ? `<span>${esc(sub)}</span>` : ''}</header>`;
const progressBar = (k) => `<div class="bar"><i style="width:${Math.round(k * 100)}%"></i></div>`;

export class MobileUI {
  constructor(root, act) {
    this.root = root;
    this.act = act;
    this.compass = null;
    let sw = null;
    root.addEventListener('touchstart', (e) => {
      sw = this.last?.type === 'step' && e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    }, { passive: true });
    root.addEventListener('touchend', (e) => {
      if (!sw) return;
      const t0 = e.changedTouches[0], dx = t0.clientX - sw.x, dy = t0.clientY - sw.y;
      sw = null;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;
      const forward = isRTL() ? dx > 0 : dx < 0;
      act(forward ? 'next' : 'prev');
    }, { passive: true });
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
    // Zurück-Pfeil oben links in jeder Ansicht außer Menü und laufendem Ablauf (dort steht „Menü“ in der Leiste unten)
    const h = this.root.querySelector('header');
    if (h && v.type !== 'menu' && v.type !== 'step') {
      h.classList.add('nav');
      h.insertAdjacentHTML('afterbegin', `<button class="back" data-a="menu" aria-label="${esc(t('ui.menu'))}">${isRTL() ? '›' : '‹'}</button>`);
    }
    this.root.dataset.view = v.type;
    this.root.scrollTop = keepScroll ? y : 0;
    this.lastType = v.type;
    this.last = v;
    if (v.type === 'step') this.drawStep(v);
    if (v.type === 'qibla') this.updateNeedle();
  }

  v_menu(v) {
    const n = v.times.next;
    const tile = (it) => `<button class="tile${it.primary ? ' primary' : ''}${it.active ? ' active' : ''}" data-a="${esc(it.action)}"><span class="ico" aria-hidden="true">${it.icon}</span><span>${esc(it.label)}</span></button>`;
    return `
      ${head('NamazVR', t('ui.sub'))}
      <div class="next"><span class="ico" aria-hidden="true">🕌</span><div><b>${esc(t('ui.next', n.name, n.time, n.inText))}</b><small>${esc(v.qibla)} · ${esc(v.madhab)}</small></div></div>
      <div class="grid5">${v.prayers.map((p) => {
        const row = v.times.rows.find((t) => t.id === p.id);
        return btn(p.name, `prayer:${p.id}`, { cls: p.id === v.times.current ? 'active' : '', sub: `${row.time} · ${p.rakat}` });
      }).join('')}</div>
      ${v.thought ? `<button class="next" data-a="path:why"><span class="ico" aria-hidden="true">💡</span><div><b>${esc(t('path.thought'))}: ${esc(v.thought.title)}</b><small>${esc(v.thought.text)}</small></div></button>` : ''}
      ${menuGroups(v, { mobile: true }).map((g) => `<h4>${esc(g.label)}</h4><div class="tiles">${g.items.map(tile).join('')}</div>`).join('')}`;
  }

  v_times(v) {
    return `
      ${head(t('ui.menuTimes'), t('ui.today', v.location))}
      <div class="list">${v.rows.map((r) => {
        const tag = r.id === v.current ? t('ui.now') : r.id === v.next.id ? t('ui.inTime', v.next.inText) : '';
        const inner = `<span>${esc(r.name)}</span><em>${esc(tag)}</em><b>${esc(r.time)}</b>`;
        return r.prayer
          ? `<button class="row ${r.id === v.current ? 'active' : ''}" data-a="prayer:${r.id}">${inner}</button>`
          : `<div class="row dim">${inner}</div>`;
      }).join('')}</div>
      <p class="muted small">${esc(v.highLatitude ? t('ui.highLatShort') : t('ui.sunCalcShort'))} ${esc(t('ui.mayDiffer'))}</p>
      <div class="grid2">${btn(t('ui.method'), 'method', { sub: v.method })}${btn(t('ui.asr'), 'asr', { sub: v.asr.split(' (')[0] })}</div>
      ${btn(t('rem.btn'), 'remind', { cls: 'primary wide' })}
      ${btn(t('ui.back'), 'menu', { cls: 'wide' })}`;
  }

  v_qibla(v) {
    return `
      ${head(t('ui.qiblaMobileTitle'))}
      <p class="muted">${esc(t('ui.qiblaLine', v.locationName, Math.round(v.bearing)))}</p>
      <div class="compass"><div class="dial"><span class="n">↑</span><div id="needle" class="needle"><span>🕋</span></div></div></div>
      <p id="compass-msg" class="muted center">${this.compass ? '' : esc(t('ui.compassTap'))}</p>
      ${btn(this.compass ? t('ui.compassRunning') : t('ui.compassStart'), 'compass', { cls: 'primary wide' })}
      <div class="grid3">${v.cities.map((c, i) => btn(c.name, `city:${i}`, { cls: c.name === v.location.name ? 'active' : '' })).join('')}${btn('📍 GPS', 'gps', { cls: v.location.gps ? 'active' : '' })}</div>
      ${v.msg ? `<p class="gold">${esc(v.msg)}</p>` : ''}
      ${btn(t('ui.back'), 'menu', { cls: 'wide' })}`;
  }

  // Handy-Kompass: Nadel zeigt Richtung Kaaba (iOS: webkitCompassHeading, Android: absolute Ausrichtung).
  async startCompass() {
    if (this.compass) return;
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') throw new Error('denied');
      }
    } catch {
      this.setCompassMsg(t('ui.compassDenied'));
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
    this.setCompassMsg(t('ui.compassTurn'));
    setTimeout(() => { if (this.compass && this.compass.heading == null) this.setCompassMsg(t('ui.compassNone')); }, 3000);
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
      this.setCompassMsg(Math.abs(diff) < 5 ? t('ui.compassOk') : t('ui.compassTurn'));
    }
  }

  v_step(v) {
    const s = v.step;
    const unit = s.unit ? ` · ${s.unit}` : '';
    const status = s.rakah ? `${v.prayer.name}${unit} · ${t('ui.rakaShort', s.rakah, s.of || v.prayer.rakat)}` : `${v.prayer.name}${unit}`;
    const m = s.wudu
      ? { cue: s.cue, how: `${s.count}× · ${s.fard ? t('wudu.fard') : t('wudu.sunnah')}` }
      : s.story ? { cue: s.cue, how: s.where }
      : s.hajj ? { cue: s.cue, how: [t(`hajj.where.${s.scene}`), s.status].filter(Boolean).join(' · ') }
      : { ...moveFor(v.prevPose, s.pose), ...(s.how ? { how: s.how } : {}) };
    return `
      ${head(s.title, status)}
      ${progressBar((v.index + 1) / v.total)}
      <div class="move"><canvas id="pict" width="240" height="240"></canvas><div><b>${esc(m.cue)}</b><p>${esc(m.how)}</p></div></div>
      ${v.inner ? (v.kids ? `<div class="kid"><span aria-hidden="true">🧒</span><p>${esc(v.inner)}</p></div>` : `<p class="inner">✦ ${esc(v.inner)}</p>`) : ''}
      <p class="muted">${esc(s.instr)}</p>
      ${recitation(s)}
      <div class="dock">
        ${v.noVoice ? `<p class="gold small center">${esc(v.canDownload ? t('voice.hintStep') : t('ui.noVoiceLang'))}</p>` : ''}
        ${btn(isRTL() ? '▶' : '◀', 'prev')}${btn('☰', 'menu', { sub: t('ui.menu') })}${btn(t('ui.autoShort'), 'auto', { cls: `txt${v.auto ? ' active' : ''}`, sub: v.auto ? t('ui.on') : t('ui.off') })}${btn(v.voice ? '🔊' : '🔇', 'speak', { cls: v.voice ? 'active' : '', sub: t('ui.speak') })}
        ${btn(v.index === v.total - 1 ? t('ui.done') : t('ui.nextStep'), 'next', { cls: 'primary' })}
      </div>`;
  }

  drawStep(v) {
    const c = this.root.querySelector('#pict');
    if (!c) return;
    const ctx = c.getContext('2d');
    if (v.step.story) { ctx.clearRect(0, 0, 240, 240); ctx.font = '150px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(v.step.icon, 120, 128); return; }
    if (v.step.wudu) drawBody(ctx, v.step.wudu, 10, 10, 220);
    else drawPictogram(ctx, v.prevPose, v.step.pose, 10, 10, 220);
  }

  v_done(v) {
    if (v.story) {
      const q = v.story.q;
      const fb = q.answer == null ? '' : `<p class="${q.answer === q.correct ? 'ok' : 'gold'}">${esc(q.answer === q.correct ? (q.star ? t('story.rightStar', v.stars) : t('story.right')) : t('story.wrong'))}</p>`;
      return `${head(`${v.story.icon} ${t('story.done')}`, v.prayer.name)}
        <p class="inner">✦ ${esc(v.story.lesson)}</p>
        <h3>${esc(q.q)}</h3>
        <div class="list">${q.options.map((o, i) => {
          const ok = q.answer != null && i === q.correct, bad = q.answer === i && i !== q.correct;
          return btn(`${ok ? '✓ ' : bad ? '✗ ' : ''}${o}`, q.answer == null ? `sans:${i}` : 'noop', { cls: ok ? 'primary' : bad ? 'active' : '' });
        }).join('')}</div>
        ${fb}
        <div class="grid2">${btn(t('story.listen'), 'storylesson')}${btn(t('ui.again'), 'again')}${btn(t('story.more'), 'stories', { cls: 'primary' })}${btn(t('sky.menu'), 'sky')}</div>`;
    }
    if (v.prayer.kind === 'cem' || v.prayer.kind === 'semah') {
      return `${head(t(`alevi.done.${v.prayer.kind}`), v.prayer.name)}
        ${t('alevi.doneText').map((p) => `<p>${esc(p)}</p>`).join('')}
        <div class="grid3">${btn(t('ui.again'), 'again')}${btn(t('alevi.title'), 'alevi', { cls: 'primary' })}${btn(t('ui.menu'), 'menu')}</div>`;
    }
    if (v.prayer.kind === 'umre' || v.prayer.kind === 'hajj') {
      return `${head(t(`hajj.done.${v.prayer.kind}`), v.prayer.name)}
        <p class="ar big center" dir="rtl">تَقَبَّلَ اللَّهُ مِنَّا وَمِنكُم</p>
        ${t('hajj.doneText').map((p) => `<p>${esc(p)}</p>`).join('')}
        <div class="grid2">${btn(t('ui.again'), 'again')}${btn(t('ui.menu'), 'menu', { cls: 'primary' })}</div>`;
    }
    if (v.prayer.kind === 'wudu') {
      return `${head(v.prayer.variant ? t(`pure.${v.prayer.variant}.done`) : t('ui.wuduDone'))}
        <p>${esc(v.prayer.variant ? t(`pure.${v.prayer.variant}.well`) : t('ui.wuduWell'))}</p>
        <p class="muted">${esc(t('ui.wuduBreak'))}</p>
        <div class="grid2">${btn(t('ui.prayNow'), 'menu', { cls: 'primary' })}${btn(t('ui.practiceAgain'), 'again')}</div>`;
    }
    return `${head(t('ui.prayerDone'), v.prayer.name)}
      ${recitation(taqabbal())}
      <p class="muted">${esc(t('ui.afterPrayer'))}</p>
      ${v.kids ? `<p class="gold center">${esc(t('ui.kidsStars', v.stars))}</p>` : ''}
      <div class="grid3">${btn(t('ui.tasbih'), 'tasbih', { cls: 'primary' })}${btn(t('ui.again'), 'again')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  v_suras(v) {
    return `${head(t('ui.surasTitle'))}
      <p class="muted small">${esc(t('ui.surasSub'))}</p>
      <div class="list">${v.suras.map((s) => btn(`${s.call ? '📣 ' : ''}${s.name}${s.learned ? ' ✓' : ''}${s.inPrayer ? ' ★' : ''}`, `sura:${s.id}`, { cls: s.learned ? 'active' : '', sub: s.call ? s.about : `${s.about} · ${t('ui.verses', s.count)}` })).join('')}</div>
      ${btn(t('ui.back'), 'menu', { cls: 'wide' })}`;
  }

  v_sura(v) {
    const n = v.verses.length, cur = v.verses[v.v];
    const verse = (x) => `<p class="ar big center" dir="rtl">${esc(x.ar)}</p>${x.tr ? `<p class="tr center">${esc(x.tr)}</p>` : ''}${x.de ? `<p class="center">${esc(x.de)}</p>` : ''}`;
    let body;
    if (v.mode === 'read') body = v.verses.map(verse).join('<hr>');
    else if (v.mode === 'test' && !v.reveal) {
      body = `<p class="ar big center gold" dir="rtl">${esc(cur.ar.split(' ')[0])} …</p>${cur.de ? `<p class="center">${esc(cur.de)}</p>` : ''}<p class="muted small center">${esc(t('ui.testHint'))}</p>`;
    } else body = verse(cur);
    const nav = v.mode === 'read' ? '' : `<div class="grid2">${btn('←', 'sprev')}${v.mode === 'test' && !v.reveal ? btn(t('ui.reveal'), 'sreveal', { cls: 'primary' }) : btn('→', 'snext', { cls: 'primary' })}</div>`;
    return `${head(v.name, v.mode === 'read' ? `${v.n ? `${v.n} · ` : ''}${t('ui.verses', n)}` : t('ui.verseOf', v.v + 1, n))}
      <div class="grid3">${[['read', t('ui.modeRead')], ['verse', t('ui.modeVerse')], ['test', t('ui.modeTest')]].map(([m, label]) => btn(label, `smode:${m}`, { cls: v.mode === m ? 'active' : '' })).join('')}</div>
      ${body}
      ${v.msg ? `<p class="gold small center">${esc(v.msg)}</p>` : ''}
      ${nav}
      <div class="grid2">${btn(t('ui.listen'), 'sspeak')}${btn(v.learned ? t('ui.isLearned') : t('ui.markLearned'), 'slearned', { cls: v.learned ? 'active' : '' })}</div>
      ${v.id !== 'fatiha' && !v.call ? btn(v.inPrayer ? t('ui.inPrayer') : t('ui.usePrayer'), 'sprayer', { cls: `wide ${v.inPrayer ? 'active' : ''}` }) : ''}
      ${btn(t('ui.back'), 'suras', { cls: 'wide' })}`;
  }

  v_peace(v) {
    return `${head(t('ui.peaceTitle'), `${v.index + 1} / ${v.total}`)}
      <p class="muted small">${esc(t('peace.intro'))}</p>
      <p class="ar big center" dir="rtl">${esc(v.item.ar)}</p>
      ${v.item.text ? `<p class="center">${esc(v.item.text)}</p>` : ''}
      <p class="gold center">${esc(v.item.source)}</p>
      <div class="grid2">${btn('←', 'peaceprev')}${btn('→', 'peacenext', { cls: 'primary' })}</div>
      ${btn(t('duas.btn'), 'duas', { cls: 'primary wide' })}
      <div class="grid2">${btn(t('ui.calm'), 'calm')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  v_duas(v) {
    const d = v.dua;
    return `${head(t('duas.title'), `${v.index + 1} / ${v.total}`)}
      <div class="grid3">${v.cats.map((c) => btn(t(`duas.cats.${c}`), `duacat:${c}`, { cls: c === v.cat ? 'active' : '' })).join('')}</div>
      ${v.cat === 'protect' && v.index === 0 ? `<p class="muted small">${esc(t('duas.nazarNote'))}</p>` : ''}
      <p class="gold center"><b>${esc(d.when)}</b></p>
      ${recitation({ ar: [d.ar], tr: [d.translit].filter(Boolean), de: [d.mean].filter(Boolean) })}
      <p class="muted small center">${esc(d.source)}</p>
      ${v.msg ? `<p class="gold small center">${esc(v.msg)}</p>` : ''}
      <div class="grid3">${btn('←', 'duaprev')}${btn(t('ui.listen'), 'duaspeak')}${btn('→', 'duanext', { cls: 'primary' })}</div>
      <div class="grid2">${btn(t('ui.menuPeace'), 'peace')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  v_calm(v) {
    const msg = v.finished ? t('peace.calmDone') : v.breathPhase === 'in' ? t('ui.inhale') : t('ui.calmOut');
    return `${head(t('ui.calm'), v.finished ? '' : t('ui.breathCount', Math.min(v.count + 1, v.total), v.total))}
      <ol class="steps">${t('peace.calm').map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      ${v.finished ? '' : `<div class="breath ${v.breathPhase}"></div>`}
      <p class="center ${v.finished ? 'gold' : v.breathPhase === 'in' ? 'muted' : 'ok'}">${esc(msg)}</p>
      ${progressBar(Math.min(1, v.count / v.total))}
      <div class="grid3">${btn(t('ui.again'), 'calm', { cls: v.finished ? 'primary' : '' })}${btn(t('ui.menuPeace'), 'peace')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  v_tasbih(v) {
    const body = v.finished
      ? recitation(taqabbal())
      : `<p class="ar big center" dir="rtl">${esc(v.ar)}</p><p class="tr center">${esc(v.tr)}</p><p class="muted center">${esc(v.de)}</p>
         <p class="count">${v.count} / ${v.target}</p>${progressBar(v.count / v.target)}
         ${v.breath ? `<div class="breath ${v.breathPhase}"></div><p class="center ${v.breathPhase === 'in' ? 'muted' : 'ok'}">${esc(v.breathPhase === 'in' ? t('ui.inhale') : t('ui.exhaleShort', v.tr || v.ar))}</p>` : ''}`;
    return `${head(t('ui.tasbih'), v.finished ? t('ui.finished') : t('ui.round', v.phase + 1, v.phases))}
      ${body}
      ${btn(v.finished ? t('ui.again') : t('ui.countPlus'), v.finished ? 'tasbihreset' : 'count', { cls: 'primary huge' })}
      <div class="grid3">${btn(v.breath ? t('ui.breathOnShort') : t('ui.breathOffShort'), 'breath', { cls: v.breath ? 'active' : '' })}${btn(t('ui.fresh'), 'tasbihreset')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  v_more(v) {
    return `${head(v.title || t('ui.menuMore'), v.madhab)}
      <div class="list">${v.prayers.map((p) => btn(p.name, `prayer:${p.id}`, { sub: p.rakat ? `${t('ui.rakat', p.rakat)} · ${p.de}` : p.de })).join('')}</div>
      ${v.note ? `<p class="muted small">${esc(v.note)}</p>` : ''}
      ${btn(t('ui.back'), 'menu', { cls: 'wide' })}`;
  }

  // Heilige Tage und Nächte: Liste mit Datum, darunter je Tag eine Seite mit Erklärung, Gebeten und Bittgebeten
  v_holy(v) {
    const d = v.detail;
    if (d) {
      const list = (arr) => `<ul>${[].concat(arr).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
      return `${head(`${d.icon} ${d.name}`, d.hijriText)}
        <p class="gold"><b>${esc(d.dateText)}</b> <span class="muted">· ${esc(d.when)}</span></p>
        ${v.kids ? `<p>${esc(d.kidsText)}</p>` : [].concat(d.about).map((x) => `<p>${esc(x)}</p>`).join('')}
        <h3>${esc(t('holy.doTitle'))}</h3>${list(d.todo)}
        ${d.note ? `<p class="muted small">${esc(d.note)}</p>` : ''}
        ${d.acts.length ? `<div class="grid2">${d.acts.map((a) => btn(a.label, a.action)).join('')}</div>` : ''}
        ${d.duas.length ? `<h3>${esc(t('holy.duaTitle'))}</h3><div class="grid2">${d.duas.map((x) => btn(`🔊 ${x.label}`, `hdua:${x.key}`, { cls: x.key === d.duaKey ? 'active' : '' })).join('')}</div>` : ''}
        ${d.dua ? recitation(d.dua) : ''}
        ${btn(t('ui.back'), 'holy', { cls: 'wide' })}`;
    }
    return `${head(t('holy.title'), t('holy.sub'))}
      <div class="list">${v.list.map((e) => btn(`${e.icon} ${e.name}`, `holy:${e.id}`, { sub: `${e.dateText} · ${e.when}`, cls: e.days <= 0 ? 'active' : '' })).join('')}</div>
      <p class="muted small">${esc(t('holy.sighting'))}</p>
      <div class="setting"><div><b>${esc(t('holy.remind'))}</b><small>${esc(t('holy.remindSub'))}</small></div>${btn(v.remindOn ? t('ui.on') : t('ui.off'), 'remind', { cls: v.remindOn ? 'active' : '' })}</div>
      ${btn(t('holy.cal'), 'holycal', { cls: 'primary wide' })}
      ${v.msg ? `<p class="gold">${esc(v.msg)}</p>` : ''}
      ${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  // Eltern-Übersicht: je Familienmitglied eine Karte mit Zahlen und Tipps
  v_parents(v) {
    const card = (r) => `<div class="pcard">
        <h3>${esc(r.icon)} ${esc(r.name)}${r.kids ? ' · 🧒' : ''}</h3>
        <div class="stats">
          <div><b>${r.days7}/7</b><small>${esc(t('par.days'))}</small></div><div><b>${r.prayersN}/${r.prayersOf}</b><small>${esc(t('par.prayers'))}</small></div>
          <div><b>${r.suras.length}/${r.surasOf}</b><small>${esc(t('par.suras'))}</small></div><div><b>${r.quizRuns ? `${r.quizBest}/10` : '–'}</b><small>${esc(t('par.quiz'))}</small></div>
        </div>
        <p class="small">💧 ${esc(t('par.wash', r.wudu, r.ghusl, r.tayammum))} · ⭐ ${r.stars} · 📚 ${r.stories} · ✅ ${esc(t('par.tracked', r.tracked))}</p>
        ${r.prayers.length ? `<p class="small muted">${esc(t('par.learned'))}: ${esc(r.prayers.join(', '))}</p>` : ''}
        ${r.suras.length ? `<p class="small muted">${esc(t('par.surasKnown'))}: ${esc(r.suras.join(', '))}</p>` : ''}
        ${r.tips.length ? `<h4>${esc(t('par.next'))}</h4><ul class="notes">${r.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="ok">${esc(t('par.allGood'))}</p>`}
      </div>`;
    return `${head(t('par.title'), t('par.sub'))}
      <p class="muted small">${esc(t('par.intro'))}</p>
      ${v.list.map(card).join('')}
      <div class="grid2">${btn(`📄 ${t('cert.menu')}`, 'certs')}${btn(`🎓 ${t('hoca.menu')}`, 'hoca')}</div>
      <div class="grid2">${btn(t('par.profiles'), 'profiles')}${btn(t('ui.back'), 'menu')}</div>`;
  }

  v_settings(v) {
    const toggle = (label, sub, action, on) => `<div class="setting"><div><b>${esc(label)}</b><small>${esc(sub)}</small></div>${btn(on ? t('ui.on') : t('ui.off'), action, { cls: on ? 'active' : '' })}</div>`;
    return `${head(t('ui.settings'))}
      <h3>${esc(t('ui.language'))}</h3>
      <div class="grid3">${v.langs.map((l) => btn(l.name, `lang:${l.id}`, { cls: l.id === v.lang ? 'active' : '' })).join('')}</div>
      <h3>${esc(t('ui.madhabShort'))}</h3>
      <div class="grid2">${v.madhabs.map((m) => btn(m.name, `madhab:${m.id}`, { cls: m.id === v.madhab.id ? 'active' : '' })).join('')}</div>
      <ul class="notes">${v.madhab.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      <h3>${esc(t('ui.guideFor'))}</h3>
      <div class="grid2">${btn(t('ui.men'), 'gender:m', { cls: v.gender !== 'f' ? 'active' : '' })}${btn(t('ui.women'), 'gender:f', { cls: v.gender === 'f' ? 'active' : '' })}</div>
      ${toggle(t('ui.beginner'), t('ui.beginnerSubShort'), 'beginner', v.beginner)}
      ${toggle(t('ui.spiritual'), t('ui.spiritualSubShort'), 'spiritual', v.spiritual)}
      <div class="grid2">${btn(t('voice.btn'), 'voice', { cls: 'primary' })}${btn(t('rem.btn'), 'remind', { cls: 'primary' })}</div>
      ${btn(`${t('gfx.btn')}: ${v.gfxHigh ? t('gfx.high') : t('gfx.normal')}`, 'gfx', { cls: `wide ${v.gfxHigh ? 'active' : ''}` })}
      ${toggle(t('gfx.faces'), t('gfx.facesSub'), 'faces', v.faces)}
      ${toggle(t('comfort.big'), t('comfort.bigSub'), 'big', v.big)}
      ${toggle(t('comfort.calm'), t('comfort.calmSub'), 'calmmode', v.calm)}
      <h3>${esc(t('remote.title'))}</h3>
      ${v.mediaOk ? toggle(t('remote.media'), t('remote.mediaSub'), 'rmedia', v.remoteMedia) : ''}
      ${v.camOk ? toggle(t('remote.cam'), t('remote.camSub'), 'rcam', v.remoteCam) : ''}
      <p class="muted small">${esc(t('remote.keys'))}</p>
      <div class="grid2">${btn(t('ui.info'), 'info')}${btn(t('ui.back'), 'menu')}</div>`;
  }

  v_voice(v) {
    const row = (x) => {
      const status = x.status === 'ready' ? t('voice.ready') : x.status === 'loading' ? t('voice.loading', Math.round(x.progress * 100))
        : x.status === 'error' ? t('voice.error') : t('voice.size', x.mb);
      const buttons = x.status === 'ready' ? `${btn(t('voice.test'), `vtest:${x.id}`, { cls: 'primary' })}${btn(t('voice.del'), `vdel:${x.id}`)}`
        : x.status === 'loading' ? btn(`${Math.round(x.progress * 100)} %`, 'noop', { cls: 'active' })
          : v.supported ? btn(x.status === 'error' ? t('voice.retry') : t('voice.load'), `vload:${x.id}`, { cls: 'primary' }) : '';
      const lic = x.license ? t('voice.license', x.license) : t('voice.licenseCard');
      return `<div class="voice ${x.id === v.lang ? 'cur' : ''}"><b>${esc(x.langName)} – ${esc(x.name)}</b>
        <small class="${x.status === 'error' ? 'bad' : ''}">${esc(status)} · <a href="${esc(x.card)}" target="_blank" rel="noopener">${esc(lic)}</a></small>
        <div class="grid2">${buttons}</div></div>`;
    };
    const toggle = `<div class="setting"><div><b>${esc(t('voice.use'))}</b><small>${esc(t('voice.useSub'))}</small></div>${btn(v.enabled ? t('ui.on') : t('ui.off'), 'piper', { cls: v.enabled ? 'active' : '' })}</div>`;
    return `${head(t('voice.title'), t('voice.sub'))}
      ${(v.supported ? t('voice.intro') : [t('voice.unsupported')]).map((p) => `<p class="muted small">${esc(p)}</p>`).join('')}
      ${toggle}
      ${v.voices.map(row).join('')}
      <p class="muted small">${esc(t('voice.note'))}</p>
      ${btn(t('ui.back'), 'settings', { cls: 'wide' })}`;
  }

  v_tracker(v) {
    const dayName = v.back === 0 ? t('track.today') : v.back === 1 ? t('track.yesterday') : `${v.day.label} ${v.day.date}`;
    const n = v.prayers.filter((p) => p.ok).length;
    const weekRows = `<div class="week">${v.week.map((d) => `<div class="${d.back === v.back ? 'sel' : ''}"><b>${esc(d.label)}</b><small>${esc(d.date)}</small>${v.prayers.map((p) => `<i class="${d.prayed.includes(p.id) ? 'on' : ''}"></i>`).join('')}<em>${d.done ? '★' : ''}</em></div>`).join('')}</div>`;
    return `${head(t('track.title'), dayName)}
      <div class="grid5">${v.prayers.map((p) => btn(`${p.ok ? '✓ ' : ''}${p.name}`, `track:${p.id}`, { cls: p.ok ? 'primary' : '', sub: isRTL() ? '' : p.ar, subAr: true })).join('')}</div>
      <p class="center ${v.dayDone ? 'ok' : 'gold'}">${esc(v.dayDone ? t('track.allDone') : t('track.count', n))}</p>
      ${weekRows}
      <p class="${v.streak ? 'ok' : 'muted'}">${esc(t('track.streak', v.streak))}</p>
      <p class="muted small">${esc(v.kids ? t('track.kids') : t('track.auto'))}</p>
      <div class="grid2">${btn(t('track.older'), v.back < v.maxBack ? 'trackback' : 'noop')}${btn(t('track.newer'), v.back > 0 ? 'trackfwd' : 'noop')}</div>
      ${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  v_ramadan(v) {
    let top;
    if (v.inRamadan) {
      const line = (label, x) => `<p><b>${esc(label)}: ${esc(x.time)}</b>${x.past ? '' : ` <span class="muted">· ${esc(t('ui.inTime', x.inText))}</span>`}</p>`;
      top = `<p class="count">${esc(t('ram.day', v.day, v.length))}</p>
        ${line(t('ram.sahur'), v.sahur)}
        ${v.iftar.past ? `<p class="ok"><b>${esc(t('ram.iftarDone'))}</b></p>` : line(t('ram.iftar'), v.iftar)}
        <p class="muted small">${esc(v.lastTen ? t('ram.lastTen') : t('ram.fastNote'))}</p>
        ${v.eid ? `<p class="gold">${esc(t('ram.eidIn', v.eid.days, v.eidText))}</p>` : ''}`;
    } else if (v.start) {
      top = `<p class="count">${esc(v.eidToday ? t('ram.eid') : t('ram.days', v.start.days))}</p>
        <p class="center">${esc(t('ram.until', v.start.year))}</p>
        <p class="center gold"><b>${esc(v.startText)}</b></p>
        <p class="muted small">${esc(t('ram.tarawih'))} ${esc(t('ram.sighting'))}</p>`;
    } else top = '';
    const d = v.dua && t(`ram.duas.${v.dua}`);
    return `${head(t('ram.title'), v.hijriToday)}
      ${top}
      ${d ? recitation({ ar: [d.ar], tr: [d.tr].filter(Boolean), de: [d.mean] }) : `<p>${esc(v.kids ? t('ram.kids') : t('ram.about'))}</p>`}
      <div class="grid2">${btn(t('ram.iftarDua'), 'rdua:iftar', { cls: v.dua === 'iftar' ? 'active' : '' })}${btn(t('ram.niyyaBtn'), 'rdua:niyya', { cls: v.dua === 'niyya' ? 'active' : '' })}</div>
      ${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  v_learn(v) {
    const p = v.progress;
    return `${head(t('ui.learnTitle'))}
      <div class="stats">
        <div><b>${v.totalPrayers}</b><small>${esc(t('ui.statPrayersShort'))}</small></div><div><b>${p.wudu}</b><small>${esc(t('ui.statWuduShort'))}</small></div>
        <div><b>${v.streak}</b><small>${esc(t('ui.statStreak'))}</small></div><div><b>${p.quizBest}/10</b><small>${esc(t('ui.statQuiz'))}</small></div>
      </div>
      <h3>${esc(t('ui.badges'))}</h3>
      <div class="badges">${v.badges.map((b) => `<span class="${b.ok ? 'ok' : ''}">${b.ok ? '★' : '☆'} ${esc(b.name)}</span>`).join('')}</div>
      ${btn(t('ui.quizStart'), 'quiz', { cls: 'primary wide' })}
      ${btn(`📄 ${t('cert.menu')}`, 'certs', { cls: 'wide' })}
      <div class="grid2">${btn(t('ui.reset'), 'resetprogress')}${btn(t('ui.back'), 'menu')}</div>`;
  }

  v_quiz(v) {
    const z = v.quiz;
    if (z.i >= z.questions.length) {
      return `${head(t('ui.quizDone'))}<p class="count">${z.score} / ${z.questions.length}</p>
        <p class="center">${esc(z.score === z.questions.length ? t('ui.perfect') : z.score >= 7 ? t('ui.goodShort') : t('ui.keepGoing'))}</p>
        <div class="grid2">${btn(t('ui.again'), 'quiz', { cls: 'primary' })}${btn(t('ui.back'), 'learn')}</div>`;
    }
    const q = z.questions[z.i];
    const answered = z.answer != null;
    return `${head(t('ui.question', z.i + 1, z.questions.length), t('ui.correctCount', z.score))}
      ${progressBar(z.i / z.questions.length)}
      <p class="question">${esc(q.q)}</p>
      <div class="list">${q.options.map((o, i) => {
        const cls = answered ? (i === q.correct ? 'primary' : i === z.answer ? 'wrong' : '') : '';
        return btn(o, answered ? 'noop' : `answer:${i}`, { cls });
      }).join('')}</div>
      ${answered ? `<p class="${z.answer === q.correct ? 'ok' : 'bad'}">${esc(z.answer === q.correct ? t('ui.right') : t('ui.wrongShort'))}</p>${btn(z.i === z.questions.length - 1 ? t('ui.result') : t('ui.nextQuestion'), 'quiznext', { cls: 'primary wide' })}` : ''}
      ${btn(t('ui.cancel'), 'learn', { cls: 'wide' })}`;
  }

  v_mosque(v) {
    return `${head(t('ui.mosqueTitle'))}
      <div class="list">${v.styles.map((s) => btn(s.name, `style:${s.id}`, { cls: s.id === v.style ? 'active' : '', sub: s.de })).join('')}</div>
      <p class="muted small">${esc(t('ui.mosqueNoteShort'))}</p>
      <h3>${esc(t('ui.cemaat'))}</h3>
      <p class="muted small">${esc(t('ui.cemaatSub'))}</p>
      ${btn(v.cemaat ? t('ui.on') : t('ui.off'), 'cemaat', { cls: `wide ${v.cemaat ? 'active' : ''}` })}
      <p class="muted small">${esc(t('ui.cemaatSize'))}</p>
      <div class="grid2">${btn(t('ui.small'), 'csize:small', { cls: v.size !== 'large' ? 'active' : '' })}${btn(t('ui.large'), 'csize:large', { cls: v.size === 'large' ? 'active' : '' })}</div>
      <p class="muted small">${esc(t('ui.takt'))} – ${esc(t('ui.taktSub'))}</p>
      <div class="grid2">${btn(t('ui.natural'), 'ctakt:natural', { cls: v.natural ? 'active' : '' })}${btn(t('ui.sync'), 'ctakt:sync', { cls: v.natural ? '' : 'active' })}</div>
      <p class="muted small">${esc(t('gal.title'))} – ${esc(t('gal.sub'))}</p>
      <div class="grid2">${btn(t('gal.screen'), 'women:screen', { cls: v.womenPlace !== 'gallery' ? 'active' : '' })}${btn(t('gal.gallery'), 'women:gallery', { cls: v.womenPlace === 'gallery' ? 'active' : '' })}</div>
      <p class="gold small">${esc(t('ui.cemaatTip'))}</p>
      ${btn(t('ui.back'), 'menu', { cls: 'wide' })}`;
  }

  v_alevi(v) {
    const toggle = (l, sub, a, on) => `<div class="setting"><div><b>${esc(l)}</b><small>${esc(sub)}</small></div>${btn(on ? t('ui.on') : t('ui.off'), a, { cls: on ? 'active' : '' })}</div>`;
    return `${head(t('alevi.title'), t('alevi.sub'))}
      ${t('alevi.intro').map((p) => `<p class="muted small">${esc(p)}</p>`).join('')}
      <div class="list">
        ${btn(`🕯️ ${v.list[0].name}`, `prayer:${v.list[0].id}`, { cls: 'primary', sub: v.list[0].de })}
        ${btn(`🌀 ${v.list[1].name}`, `prayer:${v.list[1].id}`, { cls: 'primary', sub: v.list[1].de })}
        ${btn(t('alevi.muharremBtn'), 'muharrem', { sub: t('alevi.muharremSub') })}
        ${btn(t('alevi.valuesBtn'), 'alevival', { sub: t('alevi.valuesSub') })}
      </div>
      ${toggle(t('hajj.walk'), t('hajj.walkSub'), 'walkalong', v.walkAlong)}${toggle(t('hajj.sounds'), t('alevi.soundsSub'), 'sounds', v.sounds)}
      <p class="gold small">${esc(t('alevi.note'))}</p>
      ${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  v_muharrem(v) {
    const big = v.inFast ? t('alevi.fastDay', v.day) : v.days != null ? t('ram.days', v.days) : '';
    const tabs = [['about', t('alevi.tabAbout')], ['kerbela', t('alevi.tabKerbela')], ['asure', t('alevi.tabAsure')], ['hizir', t('alevi.tabHizir')]];
    return `${head(t('alevi.muharremTitle'), v.hijriYear ? `${v.hijriYear}` : '')}
      <p class="count">${esc(big)}</p>
      ${!v.inFast && v.dateText ? `<p class="center">${esc(t('alevi.untilMuharrem', v.dateText))}</p>` : ''}
      <div class="grid2">${tabs.map(([id, l]) => btn(l, `muharrem:${id}`, { cls: v.part === id ? 'active' : '' })).join('')}</div>
      ${t(`alevi.${v.part}`).map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="grid2">${btn(t('alevi.title'), 'alevi')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  v_alevival(v) {
    const [tr, mean, who] = t('alevi.sayings')[v.index];
    return `${head(t('alevi.valuesTitle'), `${v.index + 1} / ${v.total}`)}
      <p class="gold center" style="font-size:28px;font-weight:700">„${esc(tr)}“</p>
      <p class="center">${esc(mean)}</p>
      <p class="muted small center">${esc(who)}</p>
      <div class="grid2">${btn('←', 'sayprev')}${btn('→', 'saynext', { cls: 'primary' })}</div>
      <div class="grid2">${btn(t('alevi.title'), 'alevi')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  v_stories(v) {
    const sounds = `<div class="setting"><div><b>${esc(t('hajj.sounds'))}</b><small>${esc(t('story.soundsSub'))}</small></div>${btn(v.sounds ? t('ui.on') : t('ui.off'), 'sounds', { cls: v.sounds ? 'active' : '' })}</div>`;
    return `${head(t('story.title'), t('story.sub'))}
      ${t('story.intro').map((p) => `<p class="muted small">${esc(p)}</p>`).join('')}
      <div class="list">${v.list.map((s) => btn(`${s.icon} ${s.name}${s.done ? ' ⭐' : ''}`, `prayer:${s.id}`, { cls: s.done ? 'active' : 'primary', sub: s.sub })).join('')}</div>
      ${btn(`🕰️ ${t('siyer.menu')}`, 'siyer', { cls: 'wide' })}
      ${sounds}
      <div class="grid2">${btn(t('sky.menu'), 'sky', { cls: 'primary' })}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  v_sky(v) {
    return `${head(t('sky.title'), t('sky.count', v.lit, v.all))}
      <p class="muted small">${esc(t('sky.lookUpMobile'))}</p>
      ${v.groups.map((g) => `<div class="voice"><b>${esc(`${g.icon} ${g.name}`)} <span class="gold">${g.on} / ${g.total}</span></b>
        <div class="stars">${g.items.slice(0, 30).map((it) => `<i class="${it.on ? 'on' : ''}" title="${esc(it.label)}">${it.on ? '★' : '☆'}</i>`).join('')}</div></div>`).join('')}
      ${v.next ? `<p class="muted small">${esc(t('sky.next'))}</p>${btn(`☆ ${v.next.label}`, v.next.action, { cls: 'primary wide', sub: v.next.group })}` : `<p class="gold center">${esc(t('sky.allDone'))}</p>`}
      <div class="grid2">${btn(t('story.menu'), 'stories')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  v_pilgrim(v) {
    const toggle = `<div class="setting"><div><b>${esc(t('hajj.walk'))}</b><small>${esc(t('hajj.walkSub'))}</small></div>${btn(v.walkAlong ? t('ui.on') : t('ui.off'), 'walkalong', { cls: v.walkAlong ? 'active' : '' })}</div>`;
    const sounds = `<div class="setting"><div><b>${esc(t('hajj.sounds'))}</b><small>${esc(t('hajj.soundsSub'))}</small></div>${btn(v.sounds ? t('ui.on') : t('ui.off'), 'sounds', { cls: v.sounds ? 'active' : '' })}</div>`;
    return `${head(t('hajj.title'), `${v.madhab} · ${v.gender === 'f' ? t('ui.women') : t('ui.men')}`)}
      ${t('hajj.intro').map((p) => `<p class="muted small">${esc(p)}</p>`).join('')}
      <div class="list">${v.list.map((p, i) => btn(`${i ? '🕋' : '🤍'} ${p.name}`, `prayer:${p.id}`, { cls: 'primary', sub: p.de })).join('')}</div>
      ${btn(t('hinfo.btn'), 'hajjinfo', { cls: 'wide' })}
      ${toggle}${sounds}
      <p class="muted small">${esc(t('hajj.note'))}</p>
      ${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  // Zakat- und Fitra-Rechner: Felder antippen zum Eingeben
  v_zakat(v) {
    const z = v.z, F = t('zakat.fields');
    const field = (id, label, val) => btn(label, `zset:${id}`, { sub: `${val} · ${t('zakat.tap')}` });
    const unit = (id) => (id === 'gold' || id === 'silver' ? `${z[id]} g` : v.money(z[id]));
    return `${head(t('zakat.title'), t('zakat.sub'))}
      <p class="small">${esc(t('zakat.intro'))}</p>
      <div class="grid2">${['cash', 'other', 'gold', 'silver', 'goldPrice', 'silverPrice', 'debts'].map((id) => field(id, F[id], unit(id))).join('')}${btn(`${t('zakat.currency')}: ${z.cur}`, 'zset:cur')}</div>
      <div class="setting"><div><b>${esc(t('zakat.nisabBy'))}</b><small>${esc(t('zakat.schools'))}</small></div>${btn(z.by === 'gold' ? t('zakat.byGold') : t('zakat.bySilver'), 'zset:by', { cls: 'active' })}</div>
      <div class="stats"><div><b>${esc(v.money(v.net))}</b><small>${esc(t('zakat.total'))}</small></div><div><b>${esc(v.priced ? v.money(v.nisab) : '–')}</b><small>${esc(t('zakat.nisab'))}</small></div></div>
      <p class="count">${esc(v.money(v.due))}</p><p class="center gold">${esc(!v.priced ? t('zakat.noPrice') : v.due ? t('zakat.due') : t('zakat.below'))}</p>
      <p class="muted small">${esc(t('zakat.hawl'))}</p>
      <h3>${esc(t('zakat.fitra'))}</h3>
      <div class="grid2">${field('persons', t('zakat.persons'), z.persons)}${field('perPerson', t('zakat.perPerson'), v.money(z.perPerson))}</div>
      <p class="center gold"><b>${esc(t('zakat.fitraDue'))}: ${esc(v.money(v.fitra))}</b></p>
      <p class="muted small">${esc(t('zakat.fitraNote'))}</p><p class="muted small">${esc(t('zakat.who'))}</p>
      ${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  v_cuma(v) {
    return `${head(t('cuma.title'), t('cuma.sub'))}
      <p class="count" style="font-size:22px">${esc(t('cuma.nextIn', v.inDays))}</p>
      <p>${esc(v.kids ? t('cuma.kids') : t('cuma.about'))}</p>
      <ul>${t('cuma.sunnah').map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="grid2">${btn(t('pn.jumua'), 'prayer:jumua', { cls: 'primary' })}${btn(`🔊 ${t('holy.duaName.salawatShort')}`, 'hdua:salawatShort')}</div>
      <div class="setting"><div><b>${esc(t('cuma.remind'))}</b><small>${esc(t('cuma.remindSub'))}</small></div>${btn(v.remindOn ? t('ui.on') : t('ui.off'), v.remindOn ? 'remcuma' : 'remind', { cls: v.remindOn ? 'active' : '' })}</div>
      ${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  v_siyer(v) {
    const [year, title, text, kid] = v.ev;
    return `${head(t('siyer.title'), t('siyer.stepOf', v.i + 1, v.n))}
      ${progressBar((v.i + 1) / v.n)}
      <p class="count" style="font-size:30px">${esc(year)}</p><h3 class="center">${esc(title)}</h3>
      <p>${esc(v.kids ? kid : text)}</p>
      <div class="grid3">${btn('◀', 'siprev')}${btn(t('elif.say'), 'sisay', { cls: 'primary' })}${btn('▶', 'sinext')}</div>
      <p class="muted small">${esc(t('siyer.intro'))}</p>
      <div class="grid2">${btn(t('story.menu'), 'stories')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  // Urkunden: für jedes geschaffte Abzeichen eine Urkunde als Bild
  v_certs(v) {
    return `${head(t('cert.menu'), t('cert.sub'))}
      <div class="list">${v.list.map((b) => btn(`${b.ok ? '★' : '☆'} ${b.name}`, b.ok ? `cert:${b.i}` : 'noop', { cls: b.ok ? 'primary' : '', sub: b.ok ? t('cert.save') : t('cert.locked') })).join('')}</div>
      ${v.msg ? `<p class="gold">${esc(v.msg)}</p>` : ''}
      <div class="grid2">${btn(t('par.menu'), 'parents')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  // Hoca-Modus: Aufgaben wählen und als Link teilen
  v_hoca(v) {
    return `${head(t('hoca.title'), t('hoca.sub'))}
      <p class="small">${esc(t('hoca.intro'))}</p>
      ${btn(`${t('hoca.name')}: ${v.name || '–'}`, 'hname', { cls: 'wide' })}
      <h3>${esc(t('hoca.pick'))}</h3>
      <div class="grid2">${v.all.map((x) => btn(`${x.on ? '✓ ' : ''}${x.label}`, `hpick:${x.id}`, { cls: x.on ? 'active' : '' })).join('')}</div>
      ${btn(t('hoca.share'), 'hshare', { cls: 'primary wide' })}
      ${v.link ? `<p class="small" style="word-break:break-all">${esc(v.link)}</p>` : ''}
      ${v.msg ? `<p class="gold">${esc(v.msg)}</p>` : ''}
      <div class="grid2">${btn(t('par.menu'), 'parents')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  // Aufgaben vom Hoca: Liste mit Haken, Ergebnis zurückschicken
  v_tasks(v) {
    return `${head(t('hoca.tasks'), t('hoca.from', v.from))}
      <p class="count">${v.done} / ${v.list.length}</p>
      ${v.done === v.list.length && v.list.length ? `<p class="center gold">${esc(t('hoca.allDone'))}</p>` : ''}
      <div class="list">${v.list.map((x) => btn(`${x.ok ? '✅' : '⬜'} ${x.label}`, x.action, { cls: x.ok ? 'active' : '' })).join('')}</div>
      ${btn(t('hoca.result'), 'tresult', { cls: 'primary wide' })}
      ${v.msg ? `<p class="gold">${esc(v.msg)}</p>` : ''}
      <div class="grid2">${btn(t('hoca.clear'), 'tclear')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  // Mein Weg: Schritte für Anfänger, Gründe zum Beten, Garten der letzten zwei Wochen
  v_path(v) {
    const tabs = Object.entries(t('path.tabs')).map(([id, l]) => btn(l, `path:${id}`, { cls: v.part === id ? 'active' : '' })).join('');
    let body = '';
    if (v.part === 'steps') {
      const c = v.steps[v.cur];
      body = `<p class="small">${esc(t('path.intro'))}</p>
        ${v.restart ? `<p class="gold">${esc(t('path.restart'))}</p>` : v.streak ? `<p class="center gold"><b>🔥 ${esc(t('path.streak', v.streak))}</b></p>` : ''}
        ${c ? `<div class="pcard"><h3>${esc(t('path.next'))} · ${esc(t('path.stepOf', v.cur + 1, v.steps.length))}</h3><p><b>${esc(c.title)}</b></p><p class="small">${esc(c.text)}</p>${btn(t('path.go'), c.action, { cls: 'primary wide' })}</div>` : `<p class="gold">${esc(t('path.allDone'))}</p>`}
        ${btn(t('path.oneNow', v.now.name), `prayer:${v.now.id}`, { cls: 'wide' })}
        <div class="list">${v.steps.map((s, i) => btn(`${s.ok ? '✅' : i === v.cur ? '👉' : '⬜'} ${s.title}`, s.action, { cls: s.ok ? 'active' : '' })).join('')}</div>`;
    } else if (v.part === 'why') {
      body = v.why.map(([title, text, kid]) => `<div class="pcard"><h3>${esc(title)}</h3><p class="small">${esc(v.kids ? kid : text)}</p></div>`).join('');
    } else {
      body = `<p class="center" style="font-size:34px;letter-spacing:4px">${v.garden.slice(0, 7).join('')}<br>${v.garden.slice(7).join('')}</p>
        <p class="small">${esc(v.gardenEmpty ? t('path.gardenEmpty') : t('path.garden'))}</p>
        ${btn(t('track.title'), 'tracker', { cls: 'primary wide' })}`;
    }
    return `${head(t('path.title'), t('path.sub'))}<div class="grid3">${tabs}</div>${body}${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  // Gebet anpassen: im Sitzen (Boden/Stuhl) und unterwegs (Seferî)
  v_adapt(v) {
    const modes = [['off', t('sit.off')], ['floor', t('sit.floor')], ['chair', t('sit.chair')]];
    const cur = v.sitting || 'off';
    return `${head(t('sit.title'), t('sit.sub'))}
      <p>${esc(t('sit.intro'))}</p>
      <h3>${esc(t('sit.label'))}</h3>
      <div class="grid3">${modes.map(([id, l]) => btn(l, `sitting:${id}`, { cls: cur === id ? 'active' : '' })).join('')}</div>
      ${v.sitting ? `<p class="gold small">${esc(t(`sit.mode.${v.sitting}`))}</p>` : ''}
      <p class="muted small">${esc(t(`sit.note.${v.madhab.id}`))}</p>
      <p class="muted small">${esc(t('sit.lying'))}</p>
      <div class="setting"><div><b>${esc(t('sit.travel'))}</b><small>${esc(t('sit.travelSub'))}</small></div>${btn(v.travel ? t('ui.on') : t('ui.off'), 'travel', { cls: v.travel ? 'active' : '' })}</div>
      <h3>${esc(t('sefer.title'))}</h3>
      ${t('sefer.about').map((p) => `<p class="small">${esc(p)}</p>`).join('')}
      <p class="gold small">${esc(t(`sefer.qasr.${v.madhab.id}`))}</p>
      ${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  // Kaza: Zähler für verpasste Gebete und Fastentage
  v_kaza(v) {
    const row = (id) => `<div class="setting"><div><b>${esc(v.names[id])}</b><small>${esc(t('kaza.open', v.k[id]))}</small></div>
      <div class="grid3" style="min-width:190px">${btn('−', `kz:${id}:-1`)}${btn('+', `kz:${id}:1`)}${id === 'fast' ? '' : btn('▶', `kazapray:${id}`, { cls: 'primary' })}</div></div>`;
    return `${head(t('kaza.title'), t('kaza.sub'))}
      <p class="small">${esc(t('kaza.intro'))}</p>
      <p class="count">${v.open}</p><p class="center muted">${esc(t('kaza.made', v.k.made))}</p>
      ${v.ids.map(row).join('')}
      <h3>${esc(t('kaza.estimate'))}</h3><p class="muted small">${esc(t('kaza.estimateSub'))}</p>
      <div class="grid3">${btn('−', 'kz:years:-1')}${btn(t('kaza.years', v.years), 'noop', { cls: 'active' })}${btn('+', 'kz:years:1')}</div>
      <div class="grid2">${btn(t('kaza.fill'), 'kz:fill', { cls: 'primary' })}${btn(t('kaza.reset'), 'kz:reset')}</div>
      ${t('kaza.tips').map((p) => `<p class="muted small">• ${esc(p)}</p>`).join('')}
      ${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  // Elif-Ba: Reiter Buchstaben, Vokalzeichen, erste Wörter, Quiz
  v_elif(v) {
    const tabs = Object.entries(t('elif.tabs')).map(([id, l]) => btn(l, `elif:${id}`, { cls: v.part === id ? 'active' : '' })).join('');
    let body = '';
    if (v.part === 'letters') {
      const L = v.letter, forms = t('elif.forms');
      body = `<p class="center muted small">${esc(t('elif.letterOf', v.i + 1, v.total))}</p>
        <p class="ar huge" dir="rtl">${esc(L.ch)}</p>
        <p class="center"><b>${esc(L.name)}</b> · <span class="ar" dir="rtl">${esc(L.arName)}</span></p>
        <p class="center muted small">${esc(L.tip)}${L.joins ? '' : ` · ${esc(t('elif.noJoin'))}`}</p>
        <div class="forms">${L.forms.map((f, k) => `<div><b>${esc(f)}</b><small>${esc(forms[k])}</small></div>`).join('')}</div>
        <div class="grid3">${btn('→', 'elprev')}${btn(t('elif.say'), 'elsay', { cls: 'primary' })}${btn('←', 'elnext')}</div>
        <div class="abc">${LETTERS_ALL.map((x) => btn(x.ch, `elgo:${x.i}`, { cls: x.i === v.i ? 'active' : '' })).join('')}</div>
        <p class="muted small">${esc(v.kids ? t('elif.kids') : t('elif.intro'))}</p>`;
    } else if (v.part === 'marks') {
      body = `<p class="muted small">${esc(t('elif.marksIntro'))}</p>
        <div class="list">${v.marks.map((m, k) => btn(`${m.ar}   ${m.tr}`, `elsay:m:${k}`, { sub: `${m.name} – ${m.desc}` })).join('')}</div>`;
    } else if (v.part === 'words') {
      body = `<p class="muted small">${esc(t('elif.wordsIntro'))}</p>
        <div class="grid2">${v.words.map((w, k) => btn(w.ar, `elsay:w:${k}`, { sub: `${w.tr} · ${w.de}` })).join('')}</div>`;
    } else {
      const z = v.quiz;
      if (!z || !z.cur) {
        body = `<p class="count">${esc(z ? t('elif.done', z.score, z.q.length) : '')}</p><p class="center muted">${esc(t('elif.best', v.best))}</p>${btn(t('elif.again'), 'elif:quiz', { cls: 'primary wide' })}`;
      } else {
        const c = z.cur, ok = z.picked === c.ans;
        body = `<p class="center muted small">${esc(t('elif.quizOf', z.i + 1, z.q.length))} · ⭐ ${z.score}</p>
          <p class="ar huge" dir="rtl">${esc(c.letter.forms[c.form])}</p><p class="center">${esc(t('elif.quizQ'))}</p>
          <div class="grid2">${c.opts.map((o) => btn(o.name, `elq:${o.k}`, { cls: z.picked == null ? '' : o.k === c.ans ? 'active' : o.k === z.picked ? 'wrong' : '' })).join('')}</div>
          ${z.picked == null ? '' : `<p class="center gold">${esc(ok ? t('elif.right') : t('elif.wrong', c.letter.name))}</p>${btn(t('elif.nextQ'), 'elq:0', { cls: 'primary wide' })}`}`;
      }
    }
    return `${head(t('elif.title'), t('elif.sub'))}<div class="grid2">${tabs}</div>${body}${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  // Die 99 Namen Allahs: ein Name groß, Liste aller Namen, Quiz
  v_esma(v) {
    const tabs = `<div class="grid3">${btn(t('esma.name'), 'esma', { cls: !v.all && !v.quiz ? 'active' : '' })}${btn(t('esma.list'), 'esma:list', { cls: v.all ? 'active' : '' })}${btn(t('esma.quiz'), 'esma:quiz', { cls: v.quiz ? 'active' : '' })}</div>`;
    let body;
    if (v.all) body = `<div class="list">${v.all.map((e) => btn(`${e.i + 1}. ${e.ar}`, `esma:${e.i}`, { sub: [e.tr, e.mean].filter(Boolean).join(' – ') })).join('')}</div>`;
    else if (v.quiz) {
      const z = v.quiz;
      if (!z.cur) body = `<p class="count">${esc(t('elif.done', z.score, z.q.length))}</p><p class="center muted">${esc(t('elif.best', v.best))}</p>${btn(t('elif.again'), 'esma:quiz', { cls: 'primary wide' })}`;
      else {
        const c = z.cur;
        body = `<p class="center muted small">${esc(t('elif.quizOf', z.i + 1, z.q.length))} · ⭐ ${z.score}</p>
          <p class="ar big" dir="rtl">${esc(c.name.ar)}</p><p class="center gold">${esc(c.name.tr)}</p><p class="center">${esc(t('esma.quizQ'))}</p>
          <div class="list">${c.opts.map((o) => btn(o.mean, `esq:${o.k}`, { cls: z.picked == null ? '' : o.k === c.ans ? 'active' : o.k === z.picked ? 'wrong' : '' })).join('')}</div>
          ${z.picked == null ? '' : `<p class="center gold">${esc(z.picked === c.ans ? t('elif.right') : t('elif.wrong', c.name.mean))}</p>${btn(t('elif.nextQ'), 'esq:0', { cls: 'primary wide' })}`}`;
      }
    } else {
      const e = v.name;
      body = `<p class="center muted small">${esc(t('esma.nameOf', e.i + 1))} · ${esc(t('esma.learned', v.seen))}</p>
        <p class="ar big" dir="rtl" style="font-size:64px">${esc(e.ar)}</p>
        ${e.tr ? `<p class="center gold"><b>${esc(e.tr)}</b></p>` : ''}<p class="center">${esc(e.mean)}</p>
        <div class="grid3">${btn('←', 'esprev')}${btn(t('elif.say'), 'essay', { cls: 'primary' })}${btn('→', 'esnext')}</div>
        <p class="muted small">${esc(v.kids ? t('esma.kids') : t('esma.intro'))}</p>`;
    }
    return `${head(t('esma.title'), t('esma.sub'))}${tabs}${body}${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  // Wissen zu Hac und Umre: Reiter mit Grundlagen, Pflichtteilen, Zeitplan, Iḥrām, Medina, Vorbereitung, Geschichte
  v_hajjinfo(v) {
    const tabs = Object.entries(t('hinfo.tabs'));
    return `${head(t('hinfo.title'), v.nextText)}
      <div class="grid3">${tabs.map(([id, l]) => btn(l, `hajjinfo:${id}`, { cls: v.part === id ? 'active' : '' })).join('')}</div>
      ${v.kids ? `<p class="gold">${esc(t(`hinfo.kid.${v.part}`))}</p>` : ''}
      ${t(`hinfo.${v.part}`).map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="grid2">${btn(t('hajj.title'), 'pilgrim')}${btn(t('ui.menu'), 'menu')}</div>`;
  }

  v_profiles(v) {
    return `${head(t('prof.title'), t('prof.sub'))}
      ${v.list.map((p) => `<div class="voice ${p.active ? 'cur' : ''}">
        <b><button class="icon" data-a="picon:${p.id}">${p.icon}</button> ${esc(p.name)}</b>
        <small>${esc([p.kids ? `🧒 ${t('prof.kids')}` : '', t('prof.today', p.today), t('prof.streak', p.streak), t('prof.stars', p.stars), t('prof.suras', p.suras)].filter(Boolean).join(' · '))}</small>
        <div class="grid3">${btn(p.active ? t('prof.active') : t('prof.use'), p.active ? 'noop' : `puse:${p.id}`, { cls: p.active ? 'active' : 'primary' })}${btn(t('prof.rename'), `pren:${p.id}`)}${p.id !== 'main' ? btn(v.pDel === p.id ? t('prof.delSure') : t('prof.del'), `pdel:${p.id}`) : ''}</div>
      </div>`).join('')}
      ${v.list.length < v.max ? btn(t('prof.add'), 'padd', { cls: 'primary wide' }) : `<p class="muted small">${esc(t('prof.max'))}</p>`}
      <p class="muted small">${esc(t('prof.note'))}</p>
      ${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
  }

  v_remind(v) {
    const toggle = `<div class="setting"><div><b>${esc(t('rem.on'))}</b><small>${esc(t('rem.onSub'))}</small></div>${btn(v.on ? t('ui.on') : t('ui.off'), 'remon', { cls: v.on ? 'active' : '' })}</div>`;
    return `${head(t('rem.title'), t('rem.sub'))}
      <p class="gold">${esc(t('ui.next', v.next.name, v.next.time, v.next.inText))}</p>
      ${toggle}
      <div class="grid2">${btn(t('rem.min', v.before), 'rembefore', { cls: 'active' })}${btn(t('rem.test'), 'remtest')}</div>
      ${v.ios ? `<p class="muted small">${esc(t('rem.ios'))}</p>` : ''}
      ${btn(t('rem.cal'), 'remcal', { cls: 'primary wide' })}
      <p class="muted small">${esc(t('rem.calSub'))}</p>
      <h3>${esc(t('rem.which'))}</h3>
      <div class="grid5">${v.prayerList.map((p) => btn(`${p.on ? '✓ ' : ''}${p.name}`, `remp:${p.id}`, { cls: p.on ? 'active' : '' })).join('')}</div>
      <div class="setting"><div><b>${esc(t('holy.remind'))}</b><small>${esc(t('holy.remindSub'))}</small></div>${btn(v.holy ? t('ui.on') : t('ui.off'), 'remholy', { cls: v.holy ? 'active' : '' })}</div>
      ${btn(t('holy.cal'), 'holycal', { cls: 'wide' })}
      ${v.msg ? `<p class="gold">${esc(v.msg)}</p>` : ''}
      ${btn(t('ui.back'), v.back, { cls: 'wide' })}`;
  }

  v_info() {
    return `${head(t('ui.info'))}
      ${t('ui.infoText').map((p) => `<p>${esc(p)}</p>`).join('')}
      <p><a class="gold" href="./anleitung.html">📖 Anleitung</a> · <a class="gold" href="./beta.html">🧪 Beta-Test</a></p>
      ${btn(t('ui.back'), 'settings', { cls: 'wide' })}`;
  }
}
