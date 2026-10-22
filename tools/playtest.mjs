// Test de jouabilité automatique dans Chromium headless.
//
// Mode par défaut (autopilote) : le joueur est piloté par l'IA du moteur (même physique, même saut
// que toi), les rivaux courent avec leur IA. Un niveau est OK si le pilote auto franchit l'arche
// sans aucune chute, sans erreur console, et qu'aucun rival ne meurt en boucle (≥ 8 chutes).
//
// Mode --human : même cerveau, mais « humain » (voir humanInput dans assets/game.js) :
//   délai de réaction 150–200 ms (tiré par essai), jitter gaussien sur le moment du saut
//   (σ = 45 ms, borné à ±2σ), durée d'appui sur saut aléatoire (0,22–0,55 s ; relâcher tôt = saut
//   plus bas) ; hésitations après certaines réceptions (20 %, 0,1–0,4 s sans avancer) ; dans le
//   vent, ne saute pas au-dessus du vide quand les herbes se couchent ou sous la rafale (attend le
//   calme, revue du 21/10). Graines déterministes : essai i du niveau → graine seed + i.
//   Un essai réussit s'il franchit l'arche avec ≤ --max-deaths chutes (5 par défaut) ;
//   il est arrêté au-delà (ou après 240 s de jeu). Le moteur tourne en accéléré (--turbo).
// Mécaniques : passerelles mobiles, pierres, patous, jets et rafales de vent (v4) sont simulés par
// le moteur lui-même (simRunner) : l'IA les prévoit ; la ligne autopilote affiche le temps ralenti par le vent.
//
// Usage :
//   node tools/playtest.mjs [url] [last|all|<levelId>] [capture.png]
//   node tools/playtest.mjs [url] all --human --trials 20 [--seed 1] [--max-deaths 5] [--jobs 4] [--turbo 24] [--md] [--json]
//   --json : ajoute une ligne « JSON {id, trials, times, deaths} » par niveau (temps d'arrivée de chaque essai, null = raté)
// Prérequis : playwright installé là où on lance node (npm i playwright && npx playwright install chromium),
// et le site servi sous un sous-chemin : tools/serve.sh → http://localhost:8765/nouste-corrida-trail/
import { chromium } from 'playwright';
const pos = [], flags = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) { const k = a.slice(2); const nx = process.argv[i + 1]; if (nx != null && !nx.startsWith('--') && !['human', 'md', 'verbose', 'json'].includes(k)) { flags[k] = nx; i++; } else flags[k] = true; }
  else pos.push(a);
}
if (pos[0] && !/^https?:\/\//.test(pos[0])) pos.unshift(''); // URL facultative : `playtest.mjs all` marche aussi
const url = pos[0] || 'http://localhost:8765/nouste-corrida-trail/';
const which = pos[1] || 'last';
const shot = pos[2];
const human = !!flags.human;
const trials = Number(flags.trials || 20), seed0 = Number(flags.seed || 1), maxDeaths = Number(flags['max-deaths'] ?? 5);
const jobs = Number(flags.jobs || 4), turbo = Number(flags.turbo || 24);
// réglages du pilote humain (défauts dans assets/game.js) : --delay 150-200 (ms) --jitter 45 (ms) --hold 0.28-0.55 (s)
//   --hesit 0.2 (probabilité d'hésiter après une réception) --pause 0.1-0.4 (s, durée de l'hésitation)
//   --calm 1 (attend le calme avant un saut au-dessus du vide dans une zone de rafale ; --calm 0 pour l'ancien comportement)
const hopt = {};
if (flags.delay) { const [a, c] = String(flags.delay).split('-').map(Number); hopt.delayMin = a / 1000; hopt.delayMax = (c ?? a) / 1000; }
if (flags.jitter != null) hopt.jitter = Number(flags.jitter) / 1000;
if (flags.hesit != null) hopt.hesitP = Number(flags.hesit);
if (flags.pause) { const [a, c] = String(flags.pause).split('-').map(Number); hopt.pauseMin = a; hopt.pauseMax = c ?? a; }
if (flags.calm != null) hopt.calm = flags.calm !== '0';
if (flags.hold) { const [a, c] = String(flags.hold).split('-').map(Number); hopt.holdMin = a; hopt.holdMax = c ?? a; }

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
    console.log(`${ok ? 'OK   ' : 'ÉCHEC'} [${L.id}] ${L.name} — ${st.mode === 'finish' ? 'arrivé en ' + (st.finishTime ?? st.time).toFixed(1) + ' s' : 'NON arrivé (x=' + st.r[0].x + ')'} — chutes joueur ${st.deaths} — balises ${st.coins}/${L.coins} — rivaux ${rivalDeaths}${st.jetHits ? ' — jets subis ' + st.jetHits : ''}${st.gustTime ? ' — ralenti par le vent ' + st.gustTime.toFixed(1) + ' s' : ''}${deathsAt.length ? ' — chutes à ' + deathsAt.join(' ') : ''}`);
  }
} else {
  // --- Mode humain : essais en parallèle sur `jobs` pages ---
  const pages = [pg];
  for (let i = 1; i < jobs; i++) pages.push(await newPage());
  async function trial(p, L, sd) {
    await p.evaluate(({ id, sd, turbo, hopt }) => {
      const c = window.__controlsTest;
      c.start(id); c.setAutopilot(true, { human: { ...hopt, seed: sd } }); c.setTurbo(turbo);
    }, { id: L.id, sd, turbo, hopt });
    let st, t0 = Date.now();
    for (;;) {
      await p.waitForTimeout(100);
      st = await p.evaluate(() => ({ ...__controlsTest.getState(), x: __controlsTest.getX(), y: __controlsTest.getY(), r: __controlsTest.getRunners(), H: __controlsTest.getHuman() }));
      if (st.mode === 'finish' || st.deaths > maxDeaths || st.time > 240 || Date.now() - t0 > 180000) break;
    }
    await p.evaluate(() => { const c = window.__controlsTest; c.setTurbo(0); c.setAutopilot(false); c.pause?.(); });
    const ok = st.mode === 'finish' && st.deaths <= maxDeaths;
    const why = ok ? '' : st.deaths > maxDeaths ? `>${maxDeaths} chutes` : st.time > 240 ? `bloqué x=${Math.round(st.x)}` : `délai réel dépassé x=${Math.round(st.x)} t=${st.time.toFixed(0)}`;
    return { ok, why, time: st.finishTime ?? st.time, deaths: st.deaths, D: st.H?.D, rivalMax: Math.max(...st.r.slice(1).map((x) => x.deaths)), deathsAt: st.deathXs || [] };
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
    // --json : une ligne par niveau avec le temps d'arrivée de chaque essai (null = raté), lue par tools/medals.mjs --human
    if (flags.json) console.log('JSON ' + JSON.stringify({ id: L.id, trials, times: res.map((r) => (r.ok ? Math.round(r.time * 100) / 100 : null)), deaths: res.map((r) => r.deaths) }));
    if (flags.verbose) for (const r of res) if (!r.ok) console.log(`      graine ${r.sd} : ${r.why} (chutes ${r.deaths}${r.deathsAt.length ? ' à ' + r.deathsAt.join(',') : ''})`);
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
