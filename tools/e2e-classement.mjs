// Tests du classement en ligne avec un faux backend Supabase (interception réseau, rien n'est
// envoyé au vrai projet) + mode désactivé (config null).
// Usage : node tools/e2e-classement.mjs [url]
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:8765/nouste-corrida-trail/';
const b = await chromium.launch();
const errs = []; let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'OK   ' : 'ÉCHEC'} ${m}`); if (!c) fails++; };

// Faux PostgREST minimal : table scores + vues leaderboard / level_top
const rows = [];
const seed = (level_id, name, time_ms) => rows.push({ level_id, name, time_ms, balises: 10, created_at: rows.length });
['Ana', 'Bixente', 'Maialen', 'Peio', 'Txomin', 'Elixabete', 'Joanes', 'Amaia', 'Unai', 'Xabi', 'Garazi', 'Mikel']
  .forEach((n, i) => seed('crete', n, 15000 + i * 700));
seed('sousbois', 'Ana', 12500); seed('sousbois', 'Ana', 13800); seed('sousbois', 'Peio', 16000);
const board = (lvl) => {
  const m = new Map();
  for (const r of rows.filter((r) => r.level_id === lvl)) { const k = r.name.toLowerCase(), o = m.get(k); if (!o || r.time_ms < o.time_ms) m.set(k, r); }
  return [...m.values()].map((r) => ({ ...r, name_key: r.name.toLowerCase() })).sort((a, b) => a.time_ms - b.time_ms || a.created_at - b.created_at);
};
const posts = []; let headersSeen = null;
async function mock(route) {
  const req = route.request(), u = new URL(req.url()), p = u.searchParams;
  headersSeen = req.headers();
  const json = (body, extra = {}) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', ...extra }, body: JSON.stringify(body) });
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': 'content-range' } });
  if (u.pathname.endsWith('/scores') && req.method() === 'POST') {
    const d = JSON.parse(req.postData()); posts.push(d); rows.push({ ...d, created_at: rows.length });
    return route.fulfill({ status: 201, headers: { 'access-control-allow-origin': '*' }, body: '' });
  }
  if (u.pathname.endsWith('/level_top')) {
    const out = [];
    for (const l of new Set(rows.map((r) => r.level_id))) board(l).slice(0, 3).forEach((r, i) => out.push({ level_id: l, name: r.name, time_ms: r.time_ms, rn: i + 1 }));
    return json(out);
  }
  if (u.pathname.endsWith('/leaderboard')) {
    let l = board(p.get('level_id').slice(3));
    if (p.get('name_key')) l = l.filter((r) => r.name_key === p.get('name_key').slice(3));
    if (p.get('time_ms')) l = l.filter((r) => r.time_ms < Number(p.get('time_ms').slice(3)));
    const total = l.length, lim = Number(p.get('limit') || 1000);
    return json(l.slice(0, lim), { 'access-control-expose-headers': 'content-range', 'content-range': `0-${Math.max(0, Math.min(lim, total) - 1)}/${total}` });
  }
  return route.fulfill({ status: 404, body: '' });
}
async function page(configBody) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const pg = await ctx.newPage();
  pg.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  pg.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await pg.route('**/rest/v1/**', mock);
  if (configBody) await pg.route('**/leaderboard-config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: configBody }));
  return pg;
}
const waitMode = (pg, m, t = 90000) => pg.waitForFunction((m) => __controlsTest.getMode() === m, m, { timeout: t });
async function play(pg, name) {
  const c = pg.locator('.level', { hasText: name }).first(); await c.scrollIntoViewIfNeeded(); await c.click();
  await pg.evaluate(() => __controlsTest.setAutopilot(true)); await waitMode(pg, 'finish'); await pg.evaluate(() => __controlsTest.setAutopilot(false));
}
const setName = async (pg, n) => { await pg.fill('input[aria-label="Nom du coureur"]', n); };

// 1. Menu : top 3 par niveau
let pg = await page();
await pg.goto(url, { waitUntil: 'networkidle' });
await pg.waitForSelector('.level .lb-top');
const crete = await pg.locator('.level', { hasText: 'La crête' }).locator('.lb-top').innerText();
ok(crete.includes('1. Ana 0:15.0') && crete.includes('3. Maialen'), `menu : top 3 de La crête (${crete})`);
const sb = await pg.locator('.level', { hasText: 'Sous-bois' }).locator('.lb-top').innerText();
ok(sb.includes('Ana 0:12.5') && !sb.includes('0:13.8'), 'menu : meilleur temps par nom (doublon fusionné)');
ok(await pg.locator('.level', { hasText: 'Col du vent' }).locator('.lb-top').count() === 0, 'menu : rien sur un niveau sans temps');
ok(headersSeen?.apikey?.startsWith('sb_publishable_') && !headersSeen.authorization, 'clé publishable envoyée dans apikey seulement');

// 2. Nom par défaut « Toi » : pas d'envoi, invitation à mettre son nom
await play(pg, 'La crête');
await pg.waitForSelector('.sheet .lb-list');
ok(posts.length === 0, 'nom « Toi » : rien n’est envoyé');
ok((await pg.locator('.sheet .lb').innerText()).includes('Mets ton nom sur le dossard'), 'nom « Toi » : message pour entrer au classement');
ok(await pg.locator('.sheet .lb-list li').count() === 10, 'top 10 affiché à l’arrivée');
await pg.screenshot({ path: '/workspace/corrida-classement-toi.png' });

// 3. Avec un nom : envoi, rang, surlignage
await pg.locator('.sheet button', { hasText: 'Autre sentier' }).click();
await setName(pg, 'Othool');
await play(pg, 'La crête');
await pg.waitForSelector('.sheet .lb-list li.you', { timeout: 10000 });
const p0 = posts.at(-1);
ok(posts.length === 1 && p0.level_id === 'crete' && p0.name === 'Othool' && p0.time_ms > 8000 && Number.isInteger(p0.time_ms) && p0.balises > 0, `envoi : ${JSON.stringify(p0)}`);
const lbText = await pg.locator('.sheet .lb').innerText();
ok(/Ton meilleur : 6e sur 13/.test(lbText) && (await pg.locator('.sheet .lb-list li.you').innerText()).includes('Othool'), 'rang du joueur affiché et surligné (6e sur 13 : 18,1 s parmi 12 temps de 15,0 à 22,7 s)');
ok(await pg.locator('.sheet .next-level').isVisible(), 'bouton « Niveau suivant » toujours là');
const box = await pg.locator('.sheet').boundingBox();
ok(box.y >= 0 && box.y + box.height <= 720, `écran d’arrivée tient dans 720 px (${Math.round(box.height)} px)`);
await pg.screenshot({ path: '/workspace/corrida-classement-arrivee.png' });

// 4. Joueur hors top 10 : ligne « … Ne » sous la liste
rows.push(...Array.from({ length: 12 }, (_, i) => ({ level_id: 'sousbois', name: `Rapide${i}`, time_ms: 9000 + i * 100, balises: 5, created_at: rows.length + i })));
await pg.locator('.sheet button', { hasText: 'Autre sentier' }).click();
await play(pg, 'Sous-bois');
await pg.waitForSelector('.sheet .lb-list li.far', { timeout: 10000 });
const far = await pg.locator('.sheet .lb-list li.far').innerText();
ok(/1[3-9]e/.test(far) && far.includes('Othool'), `hors top 10 : rang affiché sous la liste (${far.replace(/\s+/g, ' ')})`);
ok(posts.length === 2, 'un seul envoi par arrivée');
await pg.locator('.sheet button', { hasText: 'Autre sentier' }).click();
await pg.waitForSelector('.level .lb-top');
ok((await pg.locator('.level', { hasText: 'Sous-bois' }).locator('.lb-top').innerText()).includes('Rapide0'), 'menu rafraîchi après envoi');
await pg.context().close();

// 5. Désactivé (config null) : aucun appel réseau, rien d'affiché
const before = headersSeen; headersSeen = null;
pg = await page('export const LEADERBOARD_CONFIG = null;');
await pg.goto(url, { waitUntil: 'networkidle' });
await setName(pg, 'Othool');
await play(pg, 'Sous-bois');
await pg.waitForTimeout(500);
ok(headersSeen === null && await pg.locator('.lb, .lb-top').count() === 0, 'config null : classement invisible, aucun appel réseau');
ok(await pg.locator('.sheet .next-level').isVisible(), 'config null : écran d’arrivée normal');
await pg.context().close();

ok(errs.length === 0, 'aucune erreur console' + (errs.length ? ' : ' + errs.slice(0, 3).join(' | ') : ''));
await b.close();
console.log(fails ? `E2E CLASSEMENT ÉCHEC (${fails})` : 'E2E CLASSEMENT OK');
process.exit(fails ? 1 : 0);
