// Test de jouabilité automatique dans Chromium headless.
//
// Mode par défaut (autopilote) : le joueur est piloté par l'IA du moteur (même physique, même saut
// que toi), les rivaux courent avec leur IA. Un niveau est OK si le pilote auto franchit l'arche
// sans aucune chute, sans erreur console, et qu'aucun rival ne meurt en boucle (≥ 8 chutes).
//
// Mode --human : même cerveau, mais « humain » (voir humanInput dans assets/game.js) :
//   délai de réaction 150–200 ms (tiré par essai), jitter gaussien sur le moment du saut
//   (σ = 45 ms, borné à ±2σ), durée d'appui sur saut aléatoire (0,22–0,55 s ; relâcher tôt = saut
//   plus bas). Graines déterministes : essai i du niveau → graine seed + i.
//   Un essai réussit s'il franchit l'arche avec ≤ --max-deaths chutes (5 par défaut) ;
//   il est arrêté au-delà (ou après 240 s de jeu). Le moteur tourne en accéléré (--turbo).
//
// Usage :
//   node tools/playtest.mjs [url] [last|all|<levelId>] [capture.png]
//   node tools/playtest.mjs [url] all --human --trials 20 [--seed 1] [--max-deaths 5] [--jobs 4] [--turbo 24] [--md]
// Prérequis : playwright installé là où on lance node (npm i playwright && npx playwright install chromium),
// et le site servi sous un sous-chemin : tools/serve.sh → http://localhost:8765/nouste-corrida-trail/
import { chromium } from 'playwright';
const pos = [], flags = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) { const k = a.slice(2); const nx = process.argv[i + 1]; if (nx != null && !nx.startsWith('--') && !['human', 'md'].includes(k)) { flags[k] = nx; i++; } else flags[k] = true; }
  else pos.push(a);
}
const url = pos[0] || 'http://localhost:8765/nouste-corrida-trail/';
const which = pos[1] || 'last';
const shot = pos[2];
const human = !!flags.human;
const trials = Number(flags.trials || 20), seed0 = Number(flags.seed || 1), maxDeaths = Number(flags['max-deaths'] ?? 5);
const jobs = Number(flags.jobs || 4), turbo = Number(flags.turbo || 24);

const b = await chromium.launch();
const errs = [];
async function newPage() {
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await pg.goto(url, { waitUntil: 'networkidle' });
  await pg.waitForSelector('.level');
  return pg;
}
const pg = await newPage();
const all = await pg.evaluate(async () => {
  const m = await import(new URL('levels.js', location.href).href);
  return m.LEVELS.map((l) => ({ id: l.id, name: l.name, difficulty: l.difficulty, finishX: l.finishX, coins: l.coins.length }));
});
const list = which === 'all' ? all : which === 'last' ? [all.at(-1)] : all.filter((l) => l.id === which);
if (!list.length) { console.log('niveau introuvable: ' + which); process.exit(2); }
let allOk = true;

if (!human) {
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
    console.log(`${ok ? 'OK   ' : 'ÉCHEC'} [${L.id}] ${L.name} — ${st.mode === 'finish' ? 'arrivé en ' + st.time.toFixed(1) + ' s' : 'NON arrivé (x=' + st.r[0].x + ')'} — chutes joueur ${st.deaths} — balises ${st.coins}/${L.coins} — rivaux ${rivalDeaths}${st.jetHits ? ' — jets subis ' + st.jetHits : ''}${deathsAt.length ? ' — chutes à ' + deathsAt.join(' ') : ''}`);
  }
} else {
  // --- Mode humain : essais en parallèle sur `jobs` pages ---
  const pages = [pg];
  for (let i = 1; i < jobs; i++) pages.push(await newPage());
  async function trial(p, L, sd) {
    await p.evaluate(({ id, sd, turbo }) => {
      const c = window.__controlsTest;
      c.start(id); c.setAutopilot(true, { human: { seed: sd } }); c.setTurbo(turbo);
    }, { id: L.id, sd, turbo });
    let st, deathsAt = [], last = -1, t0 = Date.now();
    for (;;) {
      await p.waitForTimeout(100);
      st = await p.evaluate(() => ({ ...__controlsTest.getState(), x: __controlsTest.getX(), y: __controlsTest.getY(), r: __controlsTest.getRunners(), H: __controlsTest.getHuman() }));
      if (st.deaths !== last) { st.deaths > 0 && last >= 0 && deathsAt.push(Math.round(st.x)); last = st.deaths; }
      if (st.mode === 'finish' || st.deaths > maxDeaths || st.time > 240 || Date.now() - t0 > 180000) break;
    }
    await p.evaluate(() => { const c = window.__controlsTest; c.setTurbo(0); c.setAutopilot(false); c.pause?.(); });
    const ok = st.mode === 'finish' && st.deaths <= maxDeaths;
    return { ok, time: st.time, deaths: st.deaths, D: st.H?.D, rivalMax: Math.max(...st.r.slice(1).map((x) => x.deaths)), deathsAt };
  }
  const rows = [];
  for (const L of list) {
    const queue = Array.from({ length: trials }, (_, i) => seed0 + i), res = [];
    await Promise.all(pages.map(async (p) => { for (let sd; (sd = queue.shift()) != null;) res.push({ sd, ...(await trial(p, L, sd)) }); }));
    res.sort((a, c) => a.sd - c.sd);
    const okN = res.filter((r) => r.ok).length, fin = res.filter((r) => r.ok);
    const meanDeaths = res.reduce((s, r) => s + r.deaths, 0) / res.length;
    const meanTime = fin.length ? fin.reduce((s, r) => s + r.time, 0) / fin.length : NaN;
    const spots = {}; for (const r of res) for (const x of r.deathsAt) { const k = Math.round(x / 100) * 100; spots[k] = (spots[k] || 0) + 1; }
    const hot = Object.entries(spots).sort((a, c) => c[1] - a[1]).slice(0, 3).map(([x, n]) => `x≈${x}:${n}`).join(' ');
    const loops = res.filter((r) => r.rivalMax >= 8).length;
    rows.push({ L, okN, meanDeaths, meanTime, hot, loops });
    console.log(`${okN / trials >= 0.3 ? 'OK   ' : 'DUR  '} [${L.id}] ${L.name} (${L.difficulty}) — réussite ${okN}/${trials} (${Math.round((100 * okN) / trials)} %) — chutes moy. ${meanDeaths.toFixed(2)} — temps moy. ${isNaN(meanTime) ? '—' : meanTime.toFixed(1) + ' s'}${hot ? ' — chutes surtout à ' + hot : ''}${loops ? ' — RIVAL EN BOUCLE dans ' + loops + ' essai(s)' : ''}`);
    if (loops) allOk = false;
  }
  if (flags.md) {
    console.log(`\n| N° | Niveau | Difficulté | Réussite (≤ ${maxDeaths} chutes) | Chutes moy. | Temps moy. (réussis) |\n|---|---|---|---|---|---|`);
    for (const r of rows) console.log(`| ${all.indexOf(r.L) + 1} | ${r.L.name} | ${r.L.difficulty} | ${r.okN}/${trials} (${Math.round((100 * r.okN) / trials)} %) | ${r.meanDeaths.toFixed(2)} | ${isNaN(r.meanTime) ? '—' : r.meanTime.toFixed(1) + ' s'} |`);
  }
}
console.log('erreurs console :', errs.length ? JSON.stringify(errs) : 'aucune');
allOk &&= errs.length === 0;
console.log(allOk ? 'PLAYTEST OK' : 'PLAYTEST ÉCHEC');
await b.close();
process.exit(allOk ? 0 : 1);
