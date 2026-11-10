// Automatische Tests für NamazVR: startet einen kleinen Webserver, öffnet die App im kopflosen Chromium
// (Handy- und Computer-Ansicht) und prüft Inhalte, alle Ansichten und alle Abläufe.
//   cd tests && npm install && npx playwright install chromium && npm test
// Filter: npm test -- inhalte   (nur Tests, deren Name den Text enthält)
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THREE_DIR = path.join(ROOT, 'tests/node_modules/three');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.exr': 'application/octet-stream', '.data': 'application/octet-stream' };

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(ROOT, p.endsWith('/') ? `${p}index.html` : p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// CHROMIUM_PATH: einen schon installierten Chromium nutzen (sonst den von „npx playwright install chromium“)
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });

// Seite öffnen: three.js aus node_modules (statt CDN), Schriften leer, keine Stimmen-Downloads – läuft ohne Internet
async function open(mode, query = '') {
  const ctx = await browser.newContext({ viewport: mode === 'mobile' ? { width: 430, height: 900 } : { width: 1400, height: 900 }, serviceWorkers: 'block', locale: 'de-DE' });
  await ctx.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', (r) => {
    const rel = new URL(r.request().url()).pathname.replace('/npm/three@0.160.0/', '');
    r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(THREE_DIR, rel)) });
  });
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ contentType: 'text/css', body: '' }));
  await ctx.route('https://fonts.gstatic.com/**', (r) => r.abort());
  await ctx.route('https://huggingface.co/**', (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${BASE}/?debug&${mode}${query}`);
  await page.waitForFunction(() => window.salah, null, { timeout: 30000 });
  await page.waitForTimeout(500);
  return { ctx, page, errors };
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const LANGS = ['de', 'tr', 'en', 'ar'];

// ---------- Inhalte ----------
test('inhalte: alle Sprachen haben dieselben Texte wie Deutsch', async () => {
  const { ctx, page } = await open('mobile');
  const problems = await page.evaluate(async () => {
    const out = [];
    const de = (await import('/src/lang/de.js')).default;
    const kind = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);
    for (const l of ['tr', 'en', 'ar']) {
      const d = (await import(`/src/lang/${l}.js`)).default;
      const walk = (a, b, p) => {
        for (const k of Object.keys(a)) {
          const q = p ? `${p}.${k}` : k;
          if (b == null || !(k in b)) { out.push(`${l}: fehlt ${q}`); continue; }
          const ka = kind(a[k]), kb = kind(b[k]);
          if (ka !== kb) { out.push(`${l}: ${q} ist ${kb} statt ${ka}`); continue; }
          if (ka === 'object') walk(a[k], b[k], q);
          // Listen gleicher Länge (z. B. Quizfragen, Abzeichen, Schritte)
          else if (ka === 'array' && a[k].length !== b[k].length) out.push(`${l}: ${q} hat ${b[k].length} statt ${a[k].length} Einträge`);
          else if (ka === 'string' && a[k].trim() && !b[k].trim()) out.push(`${l}: ${q} ist leer`);
        }
      };
      walk(de, d, '');
    }
    return out;
  });
  await ctx.close();
  // Arabisch: Umschrift und Bedeutung sind absichtlich leer (der Text steht schon auf Arabisch da)
  const real = problems.filter((p) => !/^ar: (story\.list\..*\.s\.|mean\.|duas\.mean\.|ram\.duas\..*\.tr )/.test(p));
  if (real.length) throw new Error(`${real.length} Abweichungen:\n  ${real.slice(0, 200).join('\n  ')}`);
});

test('inhalte: Gebete, Waschung, Umre, Hac, Cem, Semah und Geschichten bauen in jeder Sprache vollständige Schritte', async () => {
  const { ctx, page, errors } = await open('mobile');
  const problems = await page.evaluate(async (LANGS) => {
    const out = [];
    const { PRAYERS, EXTRA_PRAYERS, PILGRIMAGES, ALEVI, MADHABS, buildSteps } = await import('/src/prayer.js');
    const { buildWuduSteps } = await import('/src/wudu.js');
    const { buildPilgrimage } = await import('/src/hajj.js');
    const { STORY_LIST, buildStory, storyQuestion } = await import('/src/stories.js');
    const { setLang } = await import('/src/i18n.js');
    const { SURAS, verses } = await import('/src/suras.js');
    const { DUA_CATS, duasOf } = await import('/src/duas.js');
    // Ein Text, der wie ein Schlüssel aussieht („hajj.s.tawaf“), wurde nicht übersetzt
    const raw = (s) => typeof s === 'string' && /^[a-z]+(\.[A-Za-z0-9_]+)+$/.test(s);
    const check = (where, steps) => {
      if (!steps.length) out.push(`${where}: keine Schritte`);
      steps.forEach((s, i) => {
        // Ansage (cue) haben nur Waschung, Umre/Hac und Geschichten; beim Gebet ergibt sie sich aus der Bewegung
        for (const k of s.wudu || s.hajj ? ['title', 'instr', 'cue'] : ['title', 'instr']) if (raw(s[k]) || s[k] == null) out.push(`${where} Schritt ${i} (${s.id || s.key}): ${k} = ${s[k]}`);
        if (!s.title) out.push(`${where} Schritt ${i}: ohne Titel`);
        if (!(s.dur > 0)) out.push(`${where} Schritt ${i}: ohne Dauer`);
        if (!s.pose) out.push(`${where} Schritt ${i}: ohne Haltung`);
        for (const k of ['ar', 'tr', 'de']) if (!Array.isArray(s[k])) out.push(`${where} Schritt ${i}: ${k} fehlt`);
      });
    };
    for (const lang of LANGS) {
      setLang(lang);
      for (const m of MADHABS) for (const g of ['m', 'f']) {
        for (const p of [...PRAYERS, ...EXTRA_PRAYERS]) {
          const steps = buildSteps(p, m.id, g, 'ikhlas');
          check(`${lang}/${m.id}/${g}/${p.id}`, steps);
          if (raw(p.name)) out.push(`${lang}: Name von ${p.id} fehlt`);
          // Jede Rakʿa kommt vor, in der richtigen Reihenfolge
          const rak = steps.map((s) => s.rakah).filter(Boolean);
          if (p.rakat && Math.max(...rak) !== (steps.find((s) => s.of)?.of || p.rakat) && p.kind !== 'witr') out.push(`${lang}/${m.id}/${g}/${p.id}: höchste Rakʿa ${Math.max(...rak)} statt ${p.rakat}`);
          if (rak.some((r, i) => i && r < rak[i - 1] && !steps.some((s) => s.unit))) out.push(`${lang}/${m.id}/${g}/${p.id}: Rakʿāt nicht aufsteigend`);
        }
        check(`${lang}/${m.id}/wudu`, buildWuduSteps(m.id));
        for (const p of [...PILGRIMAGES, ...ALEVI]) check(`${lang}/${m.id}/${g}/${p.id}`, buildPilgrimage(p.kind, m.id, g, 'ikhlas'));
      }
      for (const s of STORY_LIST) {
        const steps = buildStory(s.id);
        check(`${lang}/story/${s.id}`, steps);
        steps.forEach((st, i) => { if (st.instr.length < 60) out.push(`${lang}/story/${s.id} Schritt ${i}: Text zu kurz`); if (st.ar.length && lang !== 'ar' && (!st.tr[0] || !st.de[0])) out.push(`${lang}/story/${s.id} Schritt ${i}: Vers ohne Umschrift/Bedeutung`); });
        const q = storyQuestion(s.id);
        if (q.options.length !== 3 || new Set(q.options).size !== 3 || !(q.correct >= 0) || !q.q) out.push(`${lang}/story/${s.id}: Frage unvollständig`);
        if (raw(s.name) || raw(s.de)) out.push(`${lang}/story/${s.id}: Name fehlt`);
      }
      for (const s of SURAS) {
        const v = verses(s.id);
        if (!v.length) out.push(`${lang}/sura/${s.id}: keine Verse`);
        v.forEach((x, i) => { if (!x.ar || (lang !== 'ar' && (!x.tr || !x.de))) out.push(`${lang}/sura/${s.id} Vers ${i + 1}: unvollständig`); });
        if (raw(s.name)) out.push(`${lang}/sura/${s.id}: Name fehlt`);
      }
      for (const c of DUA_CATS) {
        const list = duasOf(c);
        if (!list.length) out.push(`${lang}/duas/${c}: leer`);
        list.forEach((d, i) => { for (const [k, v] of Object.entries(d)) if (v == null || raw(v) || (k === 'ar' && !v)) out.push(`${lang}/duas/${c} Nr. ${i + 1}: ${k} fehlt`); if (!d.ar) out.push(`${lang}/duas/${c} Nr. ${i + 1}: arabischer Text fehlt`); });
      }
    }
    setLang('de');
    return out;
  }, LANGS);
  await ctx.close();
  if (errors.length) throw new Error(errors.join('\n'));
  if (problems.length) throw new Error(`${problems.length} Probleme:\n  ${problems.slice(0, 200).join('\n  ')}`);
});

test('inhalte: Rakʿāt der Pflichtgebete und feste Zahlen', async () => {
  const { ctx, page } = await open('mobile');
  const r = await page.evaluate(async () => {
    const { PRAYERS, EXTRA_PRAYERS, TASBIH } = await import('/src/prayer.js');
    const { buildPilgrimage } = await import('/src/hajj.js');
    const { SURAS, verses } = await import('/src/suras.js');
    const umre = buildPilgrimage('umre', 'hanafi', 'm', 'ikhlas'), hajj = buildPilgrimage('hajj', 'hanafi', 'm', 'ikhlas');
    const rounds = (steps, type, key) => steps.filter((s) => s.motion?.type === type).reduce((a, s) => a + s.motion[key], 0);
    return {
      rakat: Object.fromEntries([...PRAYERS, ...EXTRA_PRAYERS].map((p) => [p.id, p.rakat])),
      tasbih: TASBIH.map((t) => t.count ?? t.n ?? t.target),
      umreTawaf: rounds(umre, 'tawaf', 'rounds'), umreSay: rounds(umre, 'say', 'laps'),
      hajjThrows: hajj.filter((s) => s.motion?.type === 'throw').map((s) => s.motion.count),
      verses: Object.fromEntries(SURAS.filter((s) => !s.call).map((s) => [s.id, verses(s.id).length])),
    };
  });
  await ctx.close();
  const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${what}: ${JSON.stringify(a)} statt ${JSON.stringify(b)}`); };
  const want = { fajr: 2, dhuhr: 4, asr: 4, maghrib: 3, isha: 4, sfajr: 2, sdhuhr1: 4, sdhuhr2: 2, smaghrib: 2, sisha: 2, witr: 3, jumua: 2, tahiyya: 2, eid: 2, janaza: 0 };
  eq(r.rakat, want, 'Rakʿāt');
  eq(r.umreTawaf, 7, 'Tavaf-Runden der Umre');
  eq(r.umreSay, 7, 'Saʿy-Strecken der Umre');
  // 10. Tag: große Säule (7); 11. Tag: drei Säulen mit je 7 Steinchen (der 12. Tag wird als Schritt erklärt)
  eq(r.hajjThrows, [7, 7, 7, 7], 'Steinwürfe beim Hac');
  // Verszahlen (Fātiḥa mit Basmala als Vers 1)
  const v = { fatiha: 7, ikhlas: 4, falaq: 5, nas: 6, kawthar: 3, asr: 3, fil: 5, quraysh: 4, maun: 7, kafirun: 6, nasr: 3, masad: 5 };
  for (const [id, n] of Object.entries(v)) if (r.verses[id] !== undefined) eq(r.verses[id], n, `Verse von ${id}`);
  if (Object.keys(r.verses).length < 12) throw new Error(`nur ${Object.keys(r.verses).length} Suren`);
});

test('inhalte: Unterschiede der Rechtsschulen', async () => {
  const { ctx, page } = await open('mobile');
  const r = await page.evaluate(async () => {
    const { PRAYERS, EXTRA_PRAYERS, buildSteps } = await import('/src/prayer.js');
    const P = (id) => [...PRAYERS, ...EXTRA_PRAYERS].find((p) => p.id === id);
    const steps = (id, m, g = 'm') => buildSteps(P(id), m, g, 'ikhlas');
    const first = (list, key) => list.find((s) => s.key === key);
    const out = {};
    for (const m of ['hanafi', 'shafii', 'maliki', 'hanbali']) {
      const fajr = steps('fajr', m), witr = steps('witr', m), eid = steps('eid', m), jan = steps('janaza', m);
      const q = fajr.find((s) => s.key === 'qunut'), wq = witr.find((s) => s.key === 'qunut');
      const idx = (list, key, rakah) => list.findIndex((s) => s.key === key && s.rakah === rakah);
      out[m] = {
        fatihaStart: first(fajr, 'fatiha').ar[0].slice(0, 8), fatihaLines: first(fajr, 'fatiha').ar.length,
        opening: first(fajr, 'opening')?.ar[0].slice(0, 12) || null,
        fajrQunut: q ? [q.ar[0].includes('نَسْتَعِينُكَ') ? 'nastaʿīnuka' : 'ihdinī', fajr.indexOf(q) < idx(fajr, 'ruku', 2) ? 'vor' : 'nach'] : null,
        witrUnits: [...new Set(witr.map((s) => s.unit))].length, witrQunut: wq ? (witr.indexOf(wq) < witr.findLastIndex((s) => s.key === 'ruku') ? 'vor' : 'nach') : null,
        eid: eid.filter((s) => s.key === 'takbir' && s.dur > 6).map((s) => (s.dur - 4) / 3),
        janTakbirs: jan.filter((s) => s.key === 'takbir').length, janRuku: jan.some((s) => s.pose === 'ruku' || s.pose === 'sujud'),
        sdhuhrUnits: [...new Set(steps('sdhuhr1', m).map((s) => s.unit))].length,
        thirdRakaSura: steps('maghrib', m).some((s) => s.key === 'sura' && s.rakah === 3),
      };
    }
    return out;
  });
  await ctx.close();
  const want = {
    hanafi: { fatihaStart: 'بِسْمِ ا', fatihaLines: 4, fajrQunut: null, witrUnits: 1, witrQunut: 'vor', eid: [3, 3], sdhuhrUnits: 1 },
    shafii: { fatihaStart: 'بِسْمِ ا', fatihaLines: 4, fajrQunut: ['ihdinī', 'nach'], witrUnits: 2, witrQunut: 'nach', eid: [7, 5], sdhuhrUnits: 2 },
    maliki: { fatihaStart: 'الْحَمْد', fatihaLines: 3, opening: null, fajrQunut: ['nastaʿīnuka', 'vor'], witrUnits: 2, witrQunut: null, eid: [6, 5], sdhuhrUnits: 2 },
    hanbali: { fatihaStart: 'بِسْمِ ا', fatihaLines: 4, fajrQunut: null, witrUnits: 2, witrQunut: 'nach', eid: [6, 5], sdhuhrUnits: 2 },
  };
  for (const [m, w] of Object.entries(want)) {
    for (const [k, v] of Object.entries(w)) if (JSON.stringify(r[m][k]) !== JSON.stringify(v)) throw new Error(`${m}: ${k} = ${JSON.stringify(r[m][k])}, erwartet ${JSON.stringify(v)}`);
    if (r[m].janTakbirs !== 4 || r[m].janRuku) throw new Error(`${m}: Totengebet mit ${r[m].janTakbirs} Takbīren, Rukūʿ/Sujūd: ${r[m].janRuku}`);
    if (r[m].thirdRakaSura) throw new Error(`${m}: Zusatzsure in der 3. Rakʿa des Pflichtgebets`);
  }
});

test('inhalte: Gebetszeiten, Qibla und islamischer Kalender', async () => {
  const { ctx, page } = await open('mobile');
  const r = await page.evaluate(async () => {
    const { qiblaBearing, CITIES } = await import('/src/qibla.js');
    const { prayerStatus } = await import('/src/prayertimes.js');
    const { hijri } = await import('/src/ramadan.js');
    const berlin = { lat: 52.52, lon: 13.405, timeZone: 'Europe/Berlin' };
    const day = (m, d) => prayerStatus(berlin, new Date(Date.UTC(2026, m - 1, d, 11)), 'mwl', 'standard').times;
    const hm = (t, tz = 'Europe/Berlin') => { const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(t).split(':'); return Number(p[0]) * 60 + Number(p[1]); };
    const mar = day(3, 20), order = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    return {
      berlin: qiblaBearing(52.52, 13.405), istanbul: qiblaBearing(41.01, 28.98), jakarta: qiblaBearing(-6.2, 106.85), ny: qiblaBearing(40.71, -74.0),
      cities: CITIES.length,
      ordered: order.every((k, i) => !i || mar[k] > mar[order[i - 1]]),
      marDhuhr: hm(mar.dhuhr), marSunrise: hm(mar.sunrise), marMaghrib: hm(mar.maghrib),
      // 1. Ramadan 1447 = 18./19. Februar 2026; 10. Dhū l-Ḥijja 1447 = 26./27. Mai 2026
      ram: [hijri(2026, 2, 18), hijri(2026, 2, 19)], adha: hijri(2026, 5, 27),
    };
  });
  await ctx.close();
  const near = (v, want, tol, what) => { if (Math.abs(v - want) > tol) throw new Error(`${what}: ${v}, erwartet ${want} ± ${tol}`); };
  near(r.berlin, 136.7, 1, 'Qibla Berlin');
  near(r.istanbul, 151.6, 1.5, 'Qibla Istanbul');
  near(r.jakarta, 295.1, 1.5, 'Qibla Jakarta');
  near(r.ny, 58.5, 1.5, 'Qibla New York');
  if (!r.ordered) throw new Error('Gebetszeiten nicht in der richtigen Reihenfolge');
  // Tagundnachtgleiche in Berlin (MEZ): Sonnenaufgang ≈ 06:10, Mittag ≈ 12:15, Sonnenuntergang ≈ 18:20
  near(r.marSunrise, 6 * 60 + 10, 8, 'Sonnenaufgang Berlin 20.3.');
  near(r.marDhuhr, 12 * 60 + 15, 8, 'Dhuhr Berlin 20.3.');
  near(r.marMaghrib, 18 * 60 + 20, 8, 'Maghrib Berlin 20.3.');
  if (!r.ram.some((h) => h.m === 9 && h.d === 1 && h.y === 1447)) throw new Error(`1. Ramadan 1447 nicht am 18./19.2.2026: ${JSON.stringify(r.ram)}`);
  if (r.adha.m !== 12 || Math.abs(r.adha.d - 10) > 1) throw new Error(`Opferfest: ${JSON.stringify(r.adha)}`);
});

// ---------- Oberfläche ----------
const VIEWS = ['menu', 'times', 'qibla', 'more', 'settings', 'mosque', 'voice', 'profiles', 'remind', 'tracker', 'ramadan', 'learn', 'quiz', 'suras', 'sura:fatiha', 'sura:ezan', 'duas', 'peace', 'calm', 'tasbih', 'info', 'pilgrim', 'alevi', 'muharrem', 'muharrem:asure', 'alevival', 'stories', 'sky'];
// Auf dem Bildschirm darf kein unübersetzter Schlüssel und kein „undefined“ stehen
const BAD = /\b(?:ui|hajj|story|sky|alevi|duas|rem|prof|track|ram|voice|gal|ghost|ext|gfx|wudu|quiz|peace|kids|suras|hands|pn|pd)\.[A-Za-z][\w.]*\b|undefined|NaN|\[object/;

for (const mode of ['mobile', 'desktop']) {
  test(`oberfläche (${mode}): jede Ansicht in jeder Sprache ohne Fehler`, async () => {
    const { ctx, page, errors } = await open(mode);
    const bad = [];
    if (mode === 'desktop') {
      // Am Computer wird auf eine Tafel gezeichnet: alle Texte mitschreiben
      await page.evaluate(() => { window.__texts = []; const c = salah.panel.ctx, f = c.fillText.bind(c); c.fillText = (s, ...a) => { window.__texts.push(String(s)); return f(s, ...a); }; });
    }
    for (const lang of LANGS) {
      await page.evaluate((l) => salah.act(`lang:${l}`), lang);
      for (const v of VIEWS) {
        const text = await page.evaluate(({ v, mode }) => {
          if (mode === 'desktop') window.__texts.length = 0;
          salah.act('menu'); salah.act(v);
          if (mode === 'desktop') return { type: salah.view().type, text: window.__texts.join(' | ') };
          return { type: salah.view().type, text: document.querySelector('#ui').innerText };
        }, { v, mode });
        if (text.text.length < 20) bad.push(`${lang}/${v}: leer`);
        const m = text.text.match(BAD);
        if (m) bad.push(`${lang}/${v}: „${m[0]}“ in „${text.text.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\n/g, ' ')}“`);
      }
    }
    // Am Handy darf nichts seitlich überstehen
    if (mode === 'mobile') {
      for (const v of VIEWS) {
        const w = await page.evaluate((v) => { salah.act('menu'); salah.act(v); return [document.documentElement.scrollWidth, window.innerWidth]; }, v);
        if (w[0] > w[1] + 1) bad.push(`${v}: ${w[0]} px breit bei ${w[1]} px Bildschirm`);
      }
    }
    await page.evaluate(() => { salah.act('lang:de'); salah.act('menu'); });
    await ctx.close();
    if (errors.length) throw new Error(`Fehler in der Konsole:\n  ${[...new Set(errors)].slice(0, 10).join('\n  ')}`);
    if (bad.length) throw new Error(`${bad.length} Auffälligkeiten:\n  ${bad.slice(0, 30).join('\n  ')}`);
  });
}

// ---------- Abläufe ----------
const run = (page, id) => page.evaluate(async (id) => {
  salah.act('menu');
  salah.act(id === 'wudu' ? 'wudu' : `prayer:${id}`);
  salah.state.auto = false;
  const n = salah.state.steps.length, seen = new Set();
  let guard = 0;
  while (salah.state.view === 'step' && guard++ < n + 5) {
    seen.add(salah.state.scene || (salah.state.wuduRoom ? 'wudu' : 'moschee'));
    // Zwischendurch zeichnen lassen (Ortswechsel, Figuren, Tafel)
    if (guard % 12 === 0) await new Promise((r) => requestAnimationFrame(() => r()));
    salah.act('next');
  }
  await new Promise((r) => setTimeout(r, 120));
  return { n, view: salah.state.view, scenes: [...seen], done: salah.view().type };
}, id);

test('abläufe (Handy): jedes Gebet und die Waschung bis zum Ende', async () => {
  const { ctx, page, errors } = await open('mobile');
  const ids = ['wudu', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'sfajr', 'witr', 'jumua', 'eid', 'janaza', 'tahiyya'];
  for (const madhab of ['hanafi', 'shafii', 'maliki', 'hanbali']) {
    await page.evaluate((m) => { salah.act('menu'); salah.act(`madhab:${m}`); }, madhab);
    for (const id of madhab === 'hanafi' ? ids : ['fajr', 'maghrib', 'witr']) {
      const r = await run(page, id);
      if (r.view !== 'done') throw new Error(`${madhab}/${id}: endet in „${r.view}“ nach ${r.n} Schritten`);
    }
  }
  const p = await page.evaluate(() => { salah.act('madhab:hanafi'); return salah.state.progress; });
  for (const id of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) if (!p.done[id]) throw new Error(`Fortschritt: ${id} nicht gezählt`);
  if (!(p.wudu > 0)) throw new Error('Fortschritt: Waschung nicht gezählt');
  const today = await page.evaluate(() => { salah.act('menu'); return salah.view().tracked; });
  if (today !== 5) throw new Error(`Gebets-Tracker: ${today} statt 5 Gebete heute`);
  await ctx.close();
  if (errors.length) throw new Error(`Fehler in der Konsole:\n  ${[...new Set(errors)].slice(0, 10).join('\n  ')}`);
});

test('abläufe (Handy): Gemeinschaftsgebet, als Frau, auf der Empore, Kinder-Modus', async () => {
  const { ctx, page, errors } = await open('mobile');
  await page.evaluate(() => { salah.act('cemaat'); });
  let r = await run(page, 'maghrib');
  if (r.view !== 'done') throw new Error(`Cemaat: endet in ${r.view}`);
  await page.evaluate(() => { salah.act('menu'); salah.act('gender:f'); salah.act('style:gross'); salah.act('women:gallery'); salah.act('kids'); });
  r = await run(page, 'fajr');
  if (r.view !== 'done') throw new Error(`Empore: endet in ${r.view}`);
  const s = await page.evaluate(() => ({ stars: salah.state.progress.stars, scarf: salah.guide.scarf.visible }));
  if (!(s.stars >= 1)) throw new Error('Kinder-Modus: kein Stern nach dem Gebet');
  if (!s.scarf) throw new Error('Als Frau in der Moschee: Kopftuch fehlt');
  await ctx.close();
  if (errors.length) throw new Error(`Fehler in der Konsole:\n  ${[...new Set(errors)].slice(0, 10).join('\n  ')}`);
});

test('abläufe (Handy): Umre und Hac durch alle Orte', async () => {
  const { ctx, page, errors } = await open('mobile');
  const umre = await run(page, 'umre');
  if (umre.view !== 'done') throw new Error(`Umre: endet in ${umre.view}`);
  for (const s of ['miqat', 'haram', 'masa']) if (!umre.scenes.includes(s)) throw new Error(`Umre: Ort ${s} fehlt (${umre.scenes})`);
  const hajj = await run(page, 'hajj');
  if (hajj.view !== 'done') throw new Error(`Hac: endet in ${hajj.view}`);
  for (const s of ['haram', 'mina', 'arafat', 'muzdalifa', 'jamarat', 'masa']) if (!hajj.scenes.includes(s)) throw new Error(`Hac: Ort ${s} fehlt (${hajj.scenes})`);
  // Tavaf läuft von selbst: nach ein paar Sekunden ist man ein Stück gegangen
  const d = await page.evaluate(async () => {
    salah.act('menu'); salah.act('prayer:umre');
    const i = salah.state.steps.findIndex((s) => s.motion?.type === 'tawaf');
    salah.state.i = i - 1; salah.act('next');
    await new Promise((r) => setTimeout(r, 2500));
    return salah.state.pilgrim.d;
  });
  if (!(d > 0.5)) throw new Error(`Tavaf: keine Bewegung (${d} m)`);
  await ctx.close();
  if (errors.length) throw new Error(`Fehler in der Konsole:\n  ${[...new Set(errors)].slice(0, 10).join('\n  ')}`);
});

test('abläufe (Handy): Cemevi und Semah – Frauen ohne Kopftuch', async () => {
  const { ctx, page, errors } = await open('mobile');
  await page.evaluate(() => salah.act('gender:f'));
  const scarf = await page.evaluate(() => { salah.act('prayer:cem'); return { scene: salah.state.scene, scarf: salah.guide.scarf.visible, hair: salah.guide.hair.visible }; });
  if (scarf.scene !== 'cemevi' || scarf.scarf || !scarf.hair) throw new Error(`Cemevi: ${JSON.stringify(scarf)}`);
  for (const id of ['cem', 'semah']) { const r = await run(page, id); if (r.view !== 'done') throw new Error(`${id}: endet in ${r.view}`); }
  const back = await page.evaluate(() => { salah.act('menu'); salah.act('prayer:fajr'); return salah.guide.scarf.visible; });
  if (!back) throw new Error('Zurück in der Moschee: Kopftuch fehlt');
  await ctx.close();
  if (errors.length) throw new Error(`Fehler in der Konsole:\n  ${[...new Set(errors)].slice(0, 10).join('\n  ')}`);
});

test('abläufe (Handy): alle Geschichten mit Frage, Stern und Sternenhimmel', async () => {
  const { ctx, page, errors } = await open('mobile');
  const ids = ['nuh', 'ibrahim', 'musa', 'yunus', 'suleyman', 'hijra'];
  for (const id of ids) {
    // jede Szene kurz laufen lassen (Wasser, Tiere, Feuer …)
    const r = await page.evaluate(async (id) => {
      salah.act('menu'); salah.act(`prayer:${id}`); salah.state.auto = false;
      const n = salah.state.steps.length;
      for (let i = 0; i < n; i++) { await new Promise((res) => setTimeout(res, 350)); if (salah.guide.group.visible) return { figure: true }; salah.act('next'); }
      const q = salah.state.storyQ;
      salah.act(`sans:${q.correct}`);
      return { view: salah.state.view, star: q.star, done: !!salah.state.progress.stories?.[id] };
    }, id);
    if (r.figure) throw new Error(`${id}: es ist eine Figur zu sehen (Propheten werden nicht gezeigt)`);
    if (r.view !== 'done' || !r.star || !r.done) throw new Error(`${id}: ${JSON.stringify(r)}`);
  }
  const sky = await page.evaluate(() => { salah.act('sky'); const v = salah.view(); return { scene: salah.state.scene, stories: v.groups[2].on, lit: v.lit, stars: salah.state.progress.stars }; });
  if (sky.scene !== 'starsky' || sky.stories !== 6 || sky.lit < 6 || sky.stars !== 6) throw new Error(`Sternenhimmel: ${JSON.stringify(sky)}`);
  // Falsche Antwort gibt keinen zweiten Stern, und ein Stern je Geschichte nur einmal
  const again = await page.evaluate(() => { salah.act('prayer:nuh'); while (salah.state.view === 'step') salah.act('next'); salah.act(`sans:${salah.state.storyQ.correct}`); return salah.state.progress.stars; });
  if (again !== 6) throw new Error(`Stern doppelt vergeben: ${again}`);
  await ctx.close();
  if (errors.length) throw new Error(`Fehler in der Konsole:\n  ${[...new Set(errors)].slice(0, 10).join('\n  ')}`);
});

test('abläufe (Computer): Gebet, Waschraum, Hac-Ort und Geschichte auf der Tafel', async () => {
  const { ctx, page, errors } = await open('desktop');
  for (const id of ['fajr', 'wudu', 'umre', 'yunus', 'semah']) {
    const r = await run(page, id);
    if (r.view !== 'done') throw new Error(`${id}: endet in ${r.view}`);
  }
  await page.waitForTimeout(500);
  await ctx.close();
  if (errors.length) throw new Error(`Fehler in der Konsole:\n  ${[...new Set(errors)].slice(0, 10).join('\n  ')}`);
});

// ---------- Funktionen ----------
test('funktionen: Familie & Profile – jedes Kind hat eigenen Fortschritt', async () => {
  const { ctx, page, errors } = await open('mobile');
  page.on('dialog', (d) => d.accept('Elif'));
  const r = await page.evaluate(async () => {
    const kid0 = () => 0;
    salah.act('track:fajr');
    const a = salah.view().tracked;
    salah.act('profiles'); salah.act('padd');
    await new Promise((res) => setTimeout(res, 100));
    const list = salah.view().list || [];
    const b = kid0();
    salah.act('profiles');
    salah.act(`puse:${list.find((p) => p.id !== 'main').id}`);
    const kid = (salah.act('menu'), salah.view().tracked);
    salah.act('track:dhuhr'); salah.act('track:asr');
    salah.act('puse:main');
    const c = (salah.act('menu'), salah.view().tracked);
    salah.act('profiles');
    const stats = salah.view().list.map((p) => p.today);
    return { a, b: kid, c, n: list.length, stats };
  });
  await ctx.close();
  if (r.a !== 1 || r.n !== 2 || r.b !== 0 || r.c !== 1 || r.stats.join() !== '1,2') throw new Error(JSON.stringify(r));
  if (errors.length) throw new Error(errors.join('\n'));
});

test('funktionen: Einstellungen bleiben nach dem Neuladen erhalten', async () => {
  const { ctx, page, errors } = await open('mobile');
  await page.evaluate(() => { salah.act('lang:tr'); salah.act('madhab:shafii'); salah.act('gender:f'); salah.act('track:asr'); });
  await page.reload();
  await page.waitForFunction(() => window.salah);
  const r = await page.evaluate(() => ({ lang: document.documentElement.lang, madhab: salah.state.madhab, gender: salah.state.gender, tracked: salah.view().tracked }));
  await ctx.close();
  if (r.lang !== 'tr' || r.madhab !== 'shafii' || r.gender !== 'f' || r.tracked !== 1) throw new Error(JSON.stringify(r));
  if (errors.length) throw new Error(errors.join('\n'));
});

test('funktionen: Erinnerung und Kalender-Export', async () => {
  const { ctx, page } = await open('mobile');
  const r = await page.evaluate(async () => {
    const { buildIcs, dueReminder, ALL_PRAYERS } = await import('/src/remind.js');
    const { prayerStatus } = await import('/src/prayertimes.js');
    const loc = { lat: 52.52, lon: 13.405, timeZone: 'Europe/Berlin' };
    const now = new Date(Date.UTC(2026, 2, 20, 11));
    const ics = buildIcs(loc, 'mwl', 'standard', 10, 3, now, ['fajr', 'isha']);
    const times = prayerStatus(loc, now, 'mwl', 'standard').times;
    // 10 Minuten vor ʿAṣr ist die Erinnerung fällig, eine Stunde vorher nicht; abgewählte Gebete nie
    const at = (min) => new Date(times.asr.getTime() - min * 60000);
    const due = (d, prayers, sent = new Set()) => dueReminder(loc, d, 'mwl', 'standard', 10, sent, prayers);
    const d1 = due(at(10), ALL_PRAYERS);
    return { ics, all: ALL_PRAYERS.length, d1: d1?.id, d2: due(at(60), ALL_PRAYERS), d3: due(at(10), ['fajr']), d4: due(at(10), ALL_PRAYERS, new Set([d1?.key])) };
  });
  await ctx.close();
  if (r.all !== 5) throw new Error(`ALL_PRAYERS: ${r.all}`);
  const events = (r.ics.match(/BEGIN:VEVENT/g) || []).length;
  // 3 Tage × 2 Gebete; das Fajr des ersten Tages liegt schon in der Vergangenheit
  if (!r.ics.startsWith('BEGIN:VCALENDAR') || !r.ics.trim().endsWith('END:VCALENDAR') || events !== 5) throw new Error(`Kalender: ${events} Termine\n${r.ics.slice(0, 300)}`);
  if (!/TRIGGER:-PT10M/.test(r.ics)) throw new Error('Kalender: Erinnerung 10 Minuten vorher fehlt');
  if (r.d1 !== 'asr') throw new Error(`Erinnerung 10 Minuten vor ʿAṣr: ${r.d1}`);
  if (r.d2 !== null) throw new Error('Erinnerung kommt eine Stunde zu früh');
  if (r.d3 !== null) throw new Error('Erinnerung für ein abgewähltes Gebet');
  if (r.d4 !== null) throw new Error('Erinnerung kommt doppelt');
});

test('seiten: Anleitung und Beta-Seite laden, nichts steht seitlich über', async () => {
  for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: vp, serviceWorkers: 'block' });
    await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ contentType: 'text/css', body: '' }));
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    for (const f of ['anleitung', 'beta']) {
      await page.goto(`${BASE}/${f}.html`);
      const w = await page.evaluate(() => document.documentElement.scrollWidth);
      if (w > vp.width + 1) throw new Error(`${f}.html: ${w} px breit bei ${vp.width} px`);
      // Alle Sprungmarken im Inhaltsverzeichnis haben ein Ziel
      const dead = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.querySelector(h)));
      if (dead.length) throw new Error(`${f}.html: Sprungmarken ohne Ziel: ${dead.join(', ')}`);
    }
    await ctx.close();
    if (errs.length) throw new Error(errs.join('\n'));
  }
});

test('seiten: alle im Code genannten Dateien sind vorhanden', async () => {
  const missing = [];
  for (const f of ['index.html', 'sw.js', 'manifest.webmanifest']) if (!fs.existsSync(path.join(ROOT, f))) missing.push(f);
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  for (const i of man.icons || []) if (!fs.existsSync(path.join(ROOT, i.src))) missing.push(i.src);
  for (const n of ['lobby', 'sky', 'sunset', 'night']) if (!fs.existsSync(path.join(ROOT, 'vendor/hdri', `${n}.exr`))) missing.push(`vendor/hdri/${n}.exr`);
  // Jeder relative Import in src/ zeigt auf eine vorhandene Datei
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const file of walk(path.join(ROOT, 'src')).filter((f) => f.endsWith('.js'))) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/from\s+'(\.[^']+)'|import\('(\.[^']+)'\)|new URL\('(\.[^']+)',\s*import\.meta\.url\)/g)) {
      const rel = m[1] || m[2] || m[3];
      if (rel.endsWith('/')) continue;
      if (!fs.existsSync(path.resolve(path.dirname(file), rel))) missing.push(`${path.relative(ROOT, file)} → ${rel}`);
    }
  }
  if (missing.length) throw new Error(`fehlt: ${missing.join(', ')}`);
});

// ---------- Ausführen ----------
const filter = process.argv.slice(2).join(' ').toLowerCase();
let failed = 0;
const t0 = Date.now();
for (const t of tests) {
  if (filter && !t.name.toLowerCase().includes(filter)) continue;
  const s = Date.now();
  try {
    await t.fn();
    console.log(`✓ ${t.name} (${((Date.now() - s) / 1000).toFixed(1)} s)`);
  } catch (e) {
    failed++;
    console.log(`✗ ${t.name}\n  ${String(e.message).split('\n').join('\n  ')}`);
  }
}
await browser.close();
server.close();
console.log(failed ? `\n${failed} Test(s) fehlgeschlagen` : `\nAlle Tests bestanden (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
process.exit(failed ? 1 : 0);
