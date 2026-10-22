// Capture d'écran d'un sentier à un endroit donné, pilote auto aux commandes (rapatrié et
// généralisé depuis les scripts ponctuels de /workspace/pwtest : hetshot, n10shots, n11live…).
// Usage :
//   node tools/capture.mjs [url] <levelId> <sortie.png> [--x 10500] [--t 12.5] [--wait 300] [--scale 2]
//   --x : capture dès que le joueur dépasse cet x (px) ; --t : dès que le chrono dépasse t (s) ;
//   les deux peuvent être répétés sous forme de liste (--x 3200,10500 → sortie-3200.png, sortie-10500.png).
//   --wait : ms d'attente après le déclenchement (défaut 0) ; --scale : deviceScaleFactor (défaut 1).
// Prérequis : site servi par tools/serve.sh, playwright accessible (lien node_modules, voir README).
import { chromium } from 'playwright';
const pos = [], flags = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) flags[a.slice(2)] = process.argv[++i]; else pos.push(a);
}
if (pos[0] && !/^https?:\/\//.test(pos[0])) pos.unshift('');
const url = pos[0] || 'http://localhost:8765/nouste-corrida-trail/', id = pos[1], out = pos[2] || '/tmp/capture.png';
if (!id) { console.log('usage : node tools/capture.mjs [url] <levelId> <sortie.png> [--x X] [--t T]'); process.exit(2); }
const list = (k) => (flags[k] != null ? String(flags[k]).split(',').map(Number) : []);
const marks = [...list('x').map((v) => ({ k: 'x', v })), ...list('t').map((v) => ({ k: 't', v }))].sort((a, b) => a.v - b.v);
if (!marks.length) marks.push({ k: 't', v: 6 });
const name = (m) => (marks.length === 1 ? out : out.replace(/(\.png)?$/, `-${m.v}.png`));
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: Number(flags.scale || 1) })).newPage();
const errs = []; pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await pg.goto(url, { waitUntil: 'networkidle' }); await pg.waitForSelector('.level');
await pg.evaluate((id) => { const c = window.__controlsTest; c.start(id); c.setAutopilot(true); }, id);
for (const m of marks) {
  await pg.waitForFunction(({ k, v }) => (k === 'x' ? __controlsTest.getX() : __controlsTest.getState().time) >= v, m, { timeout: 120000, polling: 16 });
  if (flags.wait) await pg.waitForTimeout(Number(flags.wait));
  await pg.screenshot({ path: name(m) });
  const s = await pg.evaluate(() => ({ ...__controlsTest.getState(), x: Math.round(__controlsTest.getX()), y: Math.round(__controlsTest.getY()) }));
  console.log(`capture ${name(m)} — ${m.k}=${m.v} — x=${s.x} y=${s.y} t=${s.time.toFixed(2)} s, mode ${s.mode}`);
}
console.log('erreurs console :', errs.length ? JSON.stringify(errs) : 'aucune');
await b.close(); process.exit(errs.length ? 1 : 0);
