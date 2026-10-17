// Test de jouabilité automatique dans Chromium headless.
// Le joueur est piloté par l'IA du moteur (même physique, même saut que toi),
// les rivaux courent avec leur IA. Un niveau est OK si le pilote auto franchit
// l'arche sans aucune chute, sans erreur console, et qu'aucun rival ne meurt en boucle.
//
// Usage : node tools/playtest.mjs [url] [last|all|<levelId>] [capture.png]
// Prérequis : playwright installé là où on lance node (npm i playwright && npx playwright install chromium),
// et le site servi sous un sous-chemin : tools/serve.sh → http://localhost:8765/nouste-corrida-trail/
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:8765/nouste-corrida-trail/';
const which = process.argv[3] || 'last';
const shot = process.argv[4];
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = [];
pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
pg.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await pg.goto(url, { waitUntil: 'networkidle' });
await pg.waitForSelector('.level');
const all = await pg.evaluate(async () => {
  const m = await import(new URL('levels.js', location.href).href);
  return m.LEVELS.map((l) => ({ id: l.id, name: l.name, finishX: l.finishX, coins: l.coins.length }));
});
const list = which === 'all' ? all : which === 'last' ? [all.at(-1)] : all.filter((l) => l.id === which);
if (!list.length) { console.log('niveau introuvable: ' + which); process.exit(2); }
let allOk = true;
for (const L of list) {
  if (await pg.evaluate(() => !['menu', 'finish'].includes(window.__controlsTest.getMode()))) { await pg.keyboard.press('Escape'); await pg.waitForTimeout(200); }
  await pg.evaluate(() => { const b = [...document.querySelectorAll('.btn')].find((x) => /Autre sentier|Sentiers/.test(x.textContent)); b && b.click(); });
  await pg.waitForSelector('.level');
  const cards = await pg.$$('.level');
  let clicked = false;
  for (const c of cards) if ((await c.innerText()).includes(L.name)) { await c.scrollIntoViewIfNeeded(); await c.click(); clicked = true; break; }
  if (!clicked) { console.log(`[${L.id}] carte du menu introuvable`); allOk = false; continue; }
  await pg.evaluate(() => window.__controlsTest.setAutopilot(true));
  const t0 = Date.now(); let st, shotDone = !shot, lastMode = '', deathsAt = [];
  while (Date.now() - t0 < 150000) {
    await pg.waitForTimeout(250);
    st = await pg.evaluate(() => ({ ...__controlsTest.getState(), r: __controlsTest.getRunners() }));
    if (!shotDone && st.time > 6) { await pg.screenshot({ path: shot }); shotDone = true; }
    if (st.mode === 'down' && lastMode !== 'down') deathsAt.push(`${st.r[0].x},${st.r[0].y}`);
    lastMode = st.mode;
    if (st.mode === 'finish') break;
  }
  await pg.evaluate(() => window.__controlsTest.setAutopilot(false));
  const rivalDeaths = st.r.slice(1).map((x) => `${x.name.split(' ')[0]}:${x.deaths}`).join(' ');
  const loop = st.r.slice(1).some((x) => x.deaths >= 8);
  const ok = st.mode === 'finish' && st.deaths === 0 && !loop;
  allOk &&= ok;
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'} [${L.id}] ${L.name} — ${st.mode === 'finish' ? 'arrivé en ' + st.time.toFixed(1) + ' s' : 'NON arrivé (x=' + st.r[0].x + ')'} — chutes joueur ${st.deaths} — balises ${st.coins}/${L.coins} — rivaux ${rivalDeaths}${deathsAt.length ? ' — chutes à ' + deathsAt.join(' ') : ''}`);
}
console.log('erreurs console :', errs.length ? JSON.stringify(errs) : 'aucune');
allOk &&= errs.length === 0;
console.log(allOk ? 'PLAYTEST OK' : 'PLAYTEST ÉCHEC');
await b.close();
process.exit(allOk ? 0 : 1);
