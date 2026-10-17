import { chromium } from 'playwright';
// Test de jouabilité automatique (pilote automatique + vrais rivaux) dans Chromium headless.
// Usage : node tools/playtest.mjs [url] [levelId|last] [capture.png]
// Prérequis : npm i playwright && npx playwright install chromium (hors du dépôt) ;
// servir le site sous un sous-chemin, ex. tools/serve.sh puis url http://localhost:8765/nouste-corrida-trail/
const url = process.argv[2] || 'http://localhost:8765/nouste-corrida-trail/';
let levelId = process.argv[3] || 'last';
const shot = process.argv[4];
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
await pg.goto(url, { waitUntil: 'networkidle' });
await pg.waitForSelector('.level');
// click the menu card for this level (real UI path)
const cards = await pg.$$('.level');
let clicked = false;
const L = await pg.evaluate(async (id) => { const m = await import(new URL('levels.js', location.href).href); return id === 'last' ? m.LEVELS.at(-1) : m.LEVELS.find(l => l.id === id); }, levelId);
if (!L) throw new Error('niveau introuvable: ' + levelId); levelId = L.id;
for (const c of cards) if ((await c.innerText()).includes(L.name)) { await c.click(); clicked = true; break; }
if (!clicked) throw new Error('card not found');
await pg.evaluate((L) => {
  const T = window.__controlsTest; const W = 30, H = 56;
  let holdJump = 0, log = [];
  window.__auto = { log, deaths: 0 };
  function support(x, yb) { let best = null; for (const s of L.solids) { if (x + W <= s.x || x >= s.x + s.w) continue; if (Math.abs(s.y - yb) < 8 && (!best || s.x > best.x)) best = s; } return best; }
  function wantJump(x, y) {
    const t = x + W, n = y + H;
    for (const e of L.hazards) if (e.x < t + 58 && e.x + e.w > t - 4 && Math.abs(e.y + e.h - n) < 40) return true;
    const r = support(x, n);
    if (r) { const i = r.x + r.w - t; let a = null, o = Infinity;
      for (const e of L.solids) if (e !== r && !(e.x + e.w < r.x + r.w + 6 || e.y > n + 200 || e.y < n - 160) && e.x < o) { a = e; o = e.x; }
      if (a && i < 80 && i > -31) { const gap = a.x - (r.x + r.w), up = n - a.y, c = Math.min(62, 22 + Math.max(0, up) * 0.4); if (up < -90 && gap < 110) {} else if (gap < 205 && i < c) return true; } }
    for (const e of L.solids) if (!(e.oneWay || e === r) && !(e.x > t + 42 || e.x + e.w < t + 2) && e.y < n - 14 && e.y > n - 130 && e.h < 90) return true;
    return false;
  }
  setInterval(() => {
    const mode = T.getMode(); if (mode !== 'play') { T.setKeys([]); return; }
    const x = T.getX(), y = T.getY(), vy = T.getVy();
    if (holdJump > 0) { holdJump--; T.setKeys(['ArrowRight', 'Space']); return; }
    if (vy === 0 && wantJump(x, y)) { holdJump = 22; T.setKeys(['ArrowRight', 'Space']); return; }
    T.setKeys(['ArrowRight']);
  }, 16);
}, L);
const t0 = Date.now(); let last = '';
let downCount = 0, lastMode = '';
while (Date.now() - t0 < 75000) {
  await pg.waitForTimeout(250);
  const st = await pg.evaluate(() => ({ mode: __controlsTest.getMode(), r: __controlsTest.getRunners() }));
  if (st.mode === 'down' && lastMode !== 'down') { downCount++; console.log('player fell/died near x=', st.r[0].x, 'y=', st.r[0].y); }
  lastMode = st.mode;
  if (shot && Date.now() - t0 > 9000 && Date.now() - t0 < 9300) await pg.screenshot({ path: shot });
  if (st.mode === 'finish') { await pg.waitForTimeout(3000); break; }
}
const fin = await pg.evaluate(() => ({ mode: __controlsTest.getMode(), r: __controlsTest.getRunners(), rank: [...document.querySelectorAll('.rank tbody tr')].map(t => t.innerText.replace(/\t/g, ' ')) }));
console.log(levelId, 'mode', fin.mode, 'playerDeaths', downCount, 'secs', ((Date.now() - t0) / 1000).toFixed(1));
console.log(JSON.stringify(fin.r)); console.log(fin.rank.join('\n'));
console.log('ERRORS', JSON.stringify(errs));
await b.close();
const ok = fin.mode === 'finish' && downCount === 0 && errs.length === 0;
console.log(ok ? 'PLAYTEST OK' : 'PLAYTEST ÉCHEC (le pilote auto doit finir sans chute ni erreur console)');
process.exit(ok ? 0 : 1);
