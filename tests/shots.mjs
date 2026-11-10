// Bildschirmfotos aller Ansichten (Handy und Computer) – zum Ansehen der Gestaltung.
//   node shots.mjs <Zielordner> [handy|computer]
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] || 'shots');
const ONLY = process.argv[3] || '';
fs.mkdirSync(OUT, { recursive: true });
const THREE_DIR = path.join(ROOT, 'tests/node_modules/three');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(ROOT, p.endsWith('/') ? `${p}index.html` : p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

const VIEWS = ['menu', 'times', 'qibla', 'more', 'settings', 'mosque', 'voice', 'profiles', 'remind', 'tracker', 'ramadan', 'learn', 'quiz', 'suras', 'sura:fatiha', 'duas', 'peace', 'calm', 'tasbih', 'info', 'pilgrim', 'alevi', 'muharrem', 'alevival', 'stories', 'sky'];
// Schriften: lokal installierte nutzen, wenn das Netz gesperrt ist (FONT_DIR mit Inter/Amiri als .woff2)
for (const mode of ['mobile', 'desktop']) {
  if (ONLY && !mode.startsWith(ONLY === 'handy' ? 'm' : 'd')) continue;
  const ctx = await browser.newContext({ viewport: mode === 'mobile' ? { width: 390, height: 844 } : { width: 1400, height: 900 }, deviceScaleFactor: mode === 'mobile' ? 2 : 1, serviceWorkers: 'block', locale: 'de-DE' });
  await ctx.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(THREE_DIR, new URL(r.request().url()).pathname.replace('/npm/three@0.160.0/', ''))) }));
  await ctx.route('https://huggingface.co/**', (r) => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('FEHLER', e.message));
  await page.goto(`${BASE}/?debug&${mode}`);
  await page.waitForFunction(() => window.salah, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const shot = async (name) => {
    await page.waitForTimeout(250);
    if (mode === 'desktop') { const d = await page.evaluate(() => salah.panel.canvas.toDataURL('image/png')); fs.writeFileSync(`${OUT}/d-${name}.png`, Buffer.from(d.split(',')[1], 'base64')); } else await page.screenshot({ path: `${OUT}/m-${name}.png` });
  };
  for (const v of VIEWS) { await page.evaluate((v) => { salah.act('menu'); salah.act(v); }, v); await shot(v.replace(':', '-')); }
  await page.evaluate(() => { salah.act('menu'); salah.act('prayer:fajr'); salah.state.auto = false; salah.act('next'); salah.act('next'); salah.act('next'); });
  await shot('step');
  await page.evaluate(() => { while (salah.state.view === 'step') salah.act('next'); });
  await shot('done');
  await page.evaluate(() => { salah.act('menu'); salah.act('wudu'); salah.act('next'); });
  await shot('wudu');
  await page.evaluate(() => { salah.act('menu'); salah.act('prayer:nuh'); salah.state.auto = false; });
  await shot('story');
  await page.evaluate(() => { while (salah.state.view === 'step') salah.act('next'); salah.act('sans:1'); });
  await shot('story-done');
  await page.evaluate(() => { salah.act('lang:ar'); salah.act('menu'); });
  await shot('menu-ar');
  if (mode === 'desktop') { await page.evaluate(() => { salah.act('lang:de'); salah.act('menu'); }); await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}/d-screen.png` }); }
  await ctx.close();
}
await browser.close();
server.close();
