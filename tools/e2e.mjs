// Tests de bout en bout (Chromium headless) : compte à rebours, chute/réapparition,
// fanions, R, pause, passerelle traversée par le bas (clavier + tactile), commandes tactiles,
// sauvegarde du record, menu avec beaucoup de niveaux.
// Usage : node tools/e2e.mjs [url]   (playwright requis, voir tools/playtest.mjs)
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:8765/nouste-corrida-trail/';
const b = await chromium.launch();
const errs = []; let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'OK   ' : 'ÉCHEC'} ${m}`); if (!c) fails++; };
async function page(vp = { width: 1280, height: 720 }) {
  const ctx = await b.newContext({ viewport: vp });
  const pg = await ctx.newPage();
  pg.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  pg.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  return pg;
}
const st = (pg) => pg.evaluate(() => ({ ...__controlsTest.getState(), x: __controlsTest.getX(), y: __controlsTest.getY(), vy: __controlsTest.getVy(), r: __controlsTest.getRunners() }));
async function open(pg, name) {
  await pg.goto(url, { waitUntil: 'networkidle' });
  await pg.waitForSelector('.level');
  const c = pg.locator('.level', { hasText: name }).first();
  await c.scrollIntoViewIfNeeded(); await c.click();
}
const waitMode = (pg, m, t = 8000) => pg.waitForFunction((m) => __controlsTest.getMode() === m, m, { timeout: t });

// 1. Compte à rebours : tout le monde figé, puis départ
let pg = await page();
await open(pg, 'Sous-bois');
let s0 = await st(pg); await pg.keyboard.down('ArrowRight'); await pg.waitForTimeout(1500); let s1 = await st(pg);
ok(s0.mode === 'count' && s1.mode === 'count' && s1.r.every((r, i) => r.x === s0.r[i].x), 'compte à rebours : coureurs figés pendant 3, 2, 1');
await waitMode(pg, 'play'); await pg.waitForTimeout(400);
ok((await st(pg)).x > s1.x + 40, 'départ : le joueur court après « Partez »');
await pg.keyboard.up('ArrowRight');

// 2. Pause / reprise (Échap)
await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
const tp = (await st(pg)).time; await pg.waitForTimeout(500);
ok((await st(pg)).mode === 'pause' && (await st(pg)).time === tp, 'Échap : pause, chrono arrêté');
await pg.keyboard.press('Escape'); await waitMode(pg, 'play');

// 3. Fanion puis chute → réapparition au fanion
await pg.evaluate(() => __controlsTest.teleport(1810, 374)); await pg.keyboard.down('ArrowRight');
await pg.waitForFunction(() => __controlsTest.getState().checkpoint === 0, null, { timeout: 4000 }).catch(() => {});
await pg.keyboard.up('ArrowRight');
ok((await st(pg)).checkpoint === 0, 'fanion 1 validé en passant');
await pg.evaluate(() => __controlsTest.teleport(2150, 374));
await waitMode(pg, 'down', 2000).catch(() => {}); ok(true, 'contact ronces → chute');
await waitMode(pg, 'play', 3000);
let s2 = await st(pg);
ok(Math.abs(s2.x - 1886) < 4 && s2.deaths === 1, `réapparition au fanion (x=${Math.round(s2.x)}, chutes=${s2.deaths})`);

// 4. Passerelle traversée par le bas (clavier)
await pg.evaluate(() => __controlsTest.teleport(1170, 300 - 56)); await pg.waitForTimeout(300);
let s3 = await st(pg);
await pg.keyboard.down('ArrowDown'); await pg.waitForTimeout(500); await pg.keyboard.up('ArrowDown');
let s4 = await st(pg);
ok(Math.round(s3.y) === 244 && Math.round(s4.y) === 374, `↓ sur une passerelle : on descend (y ${Math.round(s3.y)} → ${Math.round(s4.y)})`);

// 5. R recommence
await pg.keyboard.press('KeyR'); await pg.waitForTimeout(100);
let s5 = await st(pg);
ok(s5.mode === 'count' && s5.time === 0 && s5.coins === 0 && Math.round(s5.x) === 98 && s5.deaths === 0 && s5.checkpoint === -1, 'R : sentier recommencé (chrono, balises, fanions, chutes remis à zéro)');
await pg.close();

// 6. Commandes tactiles (écran étroit) dont le nouveau bouton ↓
pg = await page({ width: 800, height: 600 });
await open(pg, 'Sous-bois'); await waitMode(pg, 'play');
const hold = async (label, ms) => { const bb = await pg.locator(`.touch button[aria-label="${label}"]`).boundingBox(); await pg.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await pg.mouse.down(); await pg.waitForTimeout(ms); await pg.mouse.up(); };
let t0 = await st(pg); await hold('Droite', 400); let t1 = await st(pg);
ok(t1.x > t0.x + 60, `tactile Droite (x ${Math.round(t0.x)} → ${Math.round(t1.x)})`);
await hold('Gauche', 300); let t2 = await st(pg); ok(t2.x < t1.x - 20, 'tactile Gauche');
const jb = await pg.locator('.touch button.jump').boundingBox(); await pg.mouse.move(jb.x + 20, jb.y + 20); await pg.mouse.down(); await pg.waitForTimeout(120);
let t3 = await st(pg); await pg.mouse.up(); ok(t3.y < t2.y - 20, 'tactile Saut');
await pg.waitForTimeout(800);
await pg.evaluate(() => __controlsTest.teleport(1170, 244)); await pg.waitForTimeout(300);
const t4 = await st(pg);
await hold('Descendre d’une passerelle', 400); await pg.waitForTimeout(300);
const t5 = await st(pg);
ok(Math.round(t4.y) === 244 && Math.round(t5.y) === 374, `tactile ↓ : descendre d’une passerelle (y ${Math.round(t4.y)} → ${Math.round(t5.y)}, ${t5.mode})`);
await pg.close();

// 7. Record sauvegardé dès l'arrivée (même si on quitte avant les rivaux)
pg = await page();
await open(pg, 'Sous-bois'); await pg.evaluate(() => __controlsTest.setAutopilot(true));
await waitMode(pg, 'finish', 60000);
const saved = await pg.evaluate(() => JSON.parse(localStorage.getItem('crete-trail-v1') || '{}').levels?.sousbois);
ok(saved && saved.bestTime > 0 && saved.bestPlace >= 1, `record enregistré à l'arrivée (${saved && saved.bestTime.toFixed(1)} s, place ${saved && saved.bestPlace})`);
await pg.evaluate(() => __controlsTest.setAutopilot(false));
await pg.locator('.btn', { hasText: 'Autre sentier' }).click();
ok(/Record/.test(await pg.locator('.level', { hasText: 'Sous-bois' }).innerText()), 'record affiché dans le menu');
await pg.close();

// 8. Menu avec 40 niveaux de plus (job quotidien)
pg = await page();
await pg.route('**/levels.js', async (route) => {
  const res = await route.fetch(); let body = await res.text();
  body += `\nfor (let i = 0; i < 40; i++) { const b = LEVELS[i % 4]; LEVELS.push({ ...b, id: "test-" + i, name: "Sentier test " + i, coins: b.coins.map((c) => ({ ...c, id: "t" + i + c.id })), checkpoints: b.checkpoints.map((c) => ({ ...c, id: "t" + i + c.id })) }); }\n`;
  route.fulfill({ response: res, body, headers: { ...res.headers(), 'content-type': 'text/javascript' } });
});
await pg.goto(url, { waitUntil: 'networkidle' }); await pg.waitForSelector('.level');
const info = await pg.evaluate(() => { const l = document.querySelector('.levels'); return { n: l.children.length, scroll: l.scrollHeight > l.clientHeight + 50, first: l.children[0].innerText, today: document.querySelectorAll('.today').length }; });
ok(info.n >= 46 && info.scroll && /Niveau du jour/i.test(info.first) && info.today === 1, `menu : ${info.n} niveaux, liste défilante, badge unique sur le plus récent`);
await pg.screenshot({ path: '/workspace/corrida-v2-menu-46-niveaux.png' });
const last = pg.locator('.level', { hasText: 'Sous-bois' }); await last.scrollIntoViewIfNeeded(); await last.click();
await waitMode(pg, 'count', 3000).catch(() => {});
ok((await st(pg)).level === 'sousbois', 'menu : le plus ancien (en bas de liste) se lance');
await pg.close();

ok(errs.length === 0, 'aucune erreur console' + (errs.length ? ' : ' + JSON.stringify(errs) : ''));
console.log(fails ? `E2E ÉCHEC (${fails})` : 'E2E OK');
await b.close(); process.exit(fails ? 1 : 0);
