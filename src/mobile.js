// Handy-Oberfläche: dieselben Ansichten wie das VR-Panel, als HTML unter der 3D-Szene.
import { drawPictogram, moveFor } from './movement.js';
import { drawBody } from './wudu.js';
import { taqabbal } from './prayer.js';
import { isRTL, t } from './i18n.js';

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
      ${head('NamazVR', t('ui.sub'))}
      <div class="grid5">${v.prayers.map((p) => {
        const row = v.times.rows.find((t) => t.id === p.id);
        return btn(p.name, `prayer:${p.id}`, { cls: p.id === v.times.current ? 'active' : '', sub: `${row.time} · ${p.rakat}` });
      }).join('')}</div>
      <p class="gold">${esc(t('ui.next', v.times.next.name, v.times.next.time, v.times.next.inText))}</p>
      <p class="muted">${esc(v.qibla)} · ${esc(v.madhab)}</p>
      ${btn(t('hajj.menu'), 'pilgrim', { cls: 'primary wide' })}
      <div class="grid2">
        ${btn(t('ui.menuTimes'), 'times')}${btn(t('ui.menuMore'), 'more')}
        ${btn(t('ui.menuWudu'), 'wudu', { cls: v.wuduDone ? '' : 'primary' })}${btn(t('ui.menuLearn'), 'learn')}
        ${btn(t('ui.menuQiblaMobile'), 'qibla')}${btn(t('ui.menuTasbih'), 'tasbih')}
        ${btn(t('ui.menuMosque'), 'mosque')}${btn(t('ui.menuSettings'), 'settings')}
        ${btn(t('ui.menuSuras'), 'suras', { cls: 'primary' })}${btn(t('ui.menuPeace'), 'peace')}
        ${btn(t('track.menu', v.tracked), 'tracker', { cls: v.tracked === 5 ? 'active' : '' })}${btn(t('ram.menu'), 'ramadan')}
        ${btn(t('ui.kidsBtn', v.kids), 'kids', { cls: v.kids ? 'active' : '' })}${btn(t('prof.btn', v.profile.icon, v.profile.name), 'profiles')}

      </div>`;
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
      : s.hajj ? { cue: s.cue, how: [t(`hajj.where.${s.scene}`), s.status].filter(Boolean).join(' · ') }
      : { ...moveFor(v.prevPose, s.pose), ...(s.how ? { how: s.how } : {}) };
    return `
      ${head(s.title, status)}
      ${progressBar((v.index + 1) / v.total)}
      <div class="move"><canvas id="pict" width="240" height="240"></canvas><div><b>${esc(m.cue)}</b><p>${esc(m.how)}</p></div></div>
      ${v.inner ? `<p class="inner">✦ ${esc(v.inner)}</p>` : ''}
      <p class="muted">${esc(s.instr)}</p>
      ${recitation(s)}
      <div class="dock">
        ${v.noVoice ? `<p class="gold small center">${esc(v.canDownload ? t('voice.hintStep') : t('ui.noVoiceLang'))}</p>` : ''}
        ${btn(isRTL() ? '▶' : '◀', 'prev')}${btn(t('ui.menu'), 'menu')}${btn(v.auto ? t('ui.autoOnShort') : t('ui.autoShort'), 'auto', { cls: v.auto ? 'active' : '' })}${btn(v.voice ? '🔊' : '🔇', 'speak', { cls: v.voice ? 'active' : '' })}${btn('👤', 'ghost', { cls: v.ghost !== 'off' ? 'active' : '' })}
        ${btn(v.index === v.total - 1 ? t('ui.done') : t('ui.nextStep'), 'next', { cls: 'primary' })}
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
    if (v.prayer.kind === 'umre' || v.prayer.kind === 'hajj') {
      return `${head(t(`hajj.done.${v.prayer.kind}`), v.prayer.name)}
        <p class="ar big center" dir="rtl">تَقَبَّلَ اللَّهُ مِنَّا وَمِنكُم</p>
        ${t('hajj.doneText').map((p) => `<p>${esc(p)}</p>`).join('')}
        <div class="grid2">${btn(t('ui.again'), 'again')}${btn(t('ui.menu'), 'menu', { cls: 'primary' })}</div>`;
    }
    if (v.prayer.kind === 'wudu') {
      return `${head(t('ui.wuduDone'))}
        <p>${esc(t('ui.wuduWell'))}</p>
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
      <div class="grid2">${btn(t('ui.calm'), 'calm')}${btn(t('ui.menu'), 'menu')}</div>`;
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
    return `${head(t('ui.menuMore'), v.madhab)}
      <div class="list">${v.prayers.map((p) => btn(p.name, `prayer:${p.id}`, { sub: p.rakat ? `${t('ui.rakat', p.rakat)} · ${p.de}` : p.de })).join('')}</div>
      ${btn(t('ui.back'), 'menu', { cls: 'wide' })}`;
  }

  v_settings(v) {
    const toggle = (label, sub, action, on) => `<div class="setting"><div><b>${esc(label)}</b><small>${esc(sub)}</small></div>${btn(on ? t('ui.on') : t('ui.off'), action, { cls: on ? 'active' : '' })}</div>`;
    return `${head(t('ui.settings'))}
      <h3>${esc(t('ui.language'))}</h3>
      <div class="grid2">${v.langs.map((l) => btn(l.name, `lang:${l.id}`, { cls: l.id === v.lang ? 'active' : '' })).join('')}</div>
      <h3>${esc(t('ui.madhabShort'))}</h3>
      <div class="grid2">${v.madhabs.map((m) => btn(m.name, `madhab:${m.id}`, { cls: m.id === v.madhab.id ? 'active' : '' })).join('')}</div>
      <ul class="notes">${v.madhab.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      <h3>${esc(t('ui.guideFor'))}</h3>
      <div class="grid2">${btn(t('ui.men'), 'gender:m', { cls: v.gender !== 'f' ? 'active' : '' })}${btn(t('ui.women'), 'gender:f', { cls: v.gender === 'f' ? 'active' : '' })}</div>
      ${toggle(t('ui.beginner'), t('ui.beginnerSubShort'), 'beginner', v.beginner)}
      ${toggle(t('ui.spiritual'), t('ui.spiritualSubShort'), 'spiritual', v.spiritual)}
      ${btn(t('voice.btn'), 'voice', { cls: 'primary wide' })}
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

  v_pilgrim(v) {
    const toggle = `<div class="setting"><div><b>${esc(t('hajj.walk'))}</b><small>${esc(t('hajj.walkSub'))}</small></div>${btn(v.walkAlong ? t('ui.on') : t('ui.off'), 'walkalong', { cls: v.walkAlong ? 'active' : '' })}</div>`;
    const sounds = `<div class="setting"><div><b>${esc(t('hajj.sounds'))}</b><small>${esc(t('hajj.soundsSub'))}</small></div>${btn(v.sounds ? t('ui.on') : t('ui.off'), 'sounds', { cls: v.sounds ? 'active' : '' })}</div>`;
    return `${head(t('hajj.title'), `${v.madhab} · ${v.gender === 'f' ? t('ui.women') : t('ui.men')}`)}
      ${t('hajj.intro').map((p) => `<p class="muted small">${esc(p)}</p>`).join('')}
      <div class="list">${v.list.map((p, i) => btn(`${i ? '🕋' : '🤍'} ${p.name}`, `prayer:${p.id}`, { cls: 'primary', sub: p.de })).join('')}</div>
      ${toggle}${sounds}
      <p class="muted small">${esc(t('hajj.note'))}</p>
      ${btn(t('ui.menu'), 'menu', { cls: 'wide' })}`;
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
      ${v.msg ? `<p class="gold">${esc(v.msg)}</p>` : ''}
      ${btn(t('ui.back'), 'times', { cls: 'wide' })}`;
  }

  v_info() {
    return `${head(t('ui.info'))}
      ${t('ui.infoText').map((p) => `<p>${esc(p)}</p>`).join('')}
      <p><a class="gold" href="./anleitung.html">📖 Anleitung</a> · <a class="gold" href="./beta.html">🧪 Beta-Test</a></p>
      ${btn(t('ui.back'), 'settings', { cls: 'wide' })}`;
  }
}
