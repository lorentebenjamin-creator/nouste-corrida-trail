// Médailles or / argent / bronze d'un sentier, inscrites dans le bloc du niveau de levels.js :
//
//   medals: { auto: 13.9, gold: 14.2, silver: 14.5, bronze: 15.5 }, // tools/medals.mjs --calibrate …
//
// `auto` = temps du PILOTE AUTO (tools/playtest.mjs, mode par défaut, sans chute) : référence et
// borne basse (on exige auto ≤ or < argent < bronze). Le joueur décroche une médaille si son temps
// d'arrivée est ≤ au temps cible. Un niveau sans champ `medals` fonctionne (pas de médailles).
//
// DEUX MÉTHODES
// 1) Calibrage sur le pilote humain (revue du 21/10, méthode du job quotidien) :
//      node tools/medals.mjs [url] [last|all|<id>] --calibrate [--trials 40] [--write]
//    lance le pilote auto (temps `auto`), puis le pilote « humain » (tools/playtest.mjs --human) dans
//    les deux profils, attentif et pressé, et choisit, au DIXIÈME de seconde (or au 0,05 s si aucun
//    dixième ne tombe dans la fenêtre : temps très groupés ; le jeu l'affiche alors au centième), les temps cibles tels
//    qu'une part donnée des essais ATTENTIFS (ratés compris, comptés sans médaille) les atteigne :
//      or ≈ 40 % (fenêtre visée 30–50 %, revue du 24/10 ; avant 17,5 % / 10–25 %), argent ≈ 50 %, bronze ≈ 85 %,
//    avec or ≥ auto × 1,03 (revue du 24/10 : sinon l'or n'est atteignable que par un essai parfait), argent ≥ or + 0,5 s, bronze ≥ argent + 0,5 s (paliers progressivement plus faciles).
//    Cible d'argent sur le profil PRESSÉ (revue du 22/10) : l'argent est en plus relevé, si besoin,
//    jusqu'au temps atteint par ≈ 30 % des essais pressés, sans dépasser le MILIEU de l'intervalle
//    or–bronze (règle d'espacement : l'argent ne colle plus à l'or quand le bronze est loin, et ne
//    mange jamais plus de la moitié de l'écart or–bronze). Sans essais pressés : règle attentive seule.
//    Cible de bronze sur le profil PRESSÉ (revue du 29/10) : le bronze est relevé, si besoin, jusqu'au
//    temps atteint par ≈ 32 % des essais pressés (fenêtre 30–35 %, comme le N°16 à 35 %), sans jamais
//    descendre sous argent + 0,5 s ni sous le plancher qui garde l'argent ≤ milieu or–bronze. Sinon
//    argent et bronze collent (N°17 avant revue : 13 % / 13 % pressé alors que 85 % finissent).
//    Écart minimal or → argent (revue du 23/10) : argent ≥ or × 1,08 (arrondi au dixième supérieur) ; le
//    bronze est relevé si besoin pour garder l'argent au plus au milieu de l'intervalle or–bronze.
//    Graines déterministes : deux lancements identiques donnent les mêmes temps.
// 2) Ancienne règle (multiplicateurs, sans pilote humain) : or = auto × 1,15 ; argent × 1,35 ;
//    bronze × 1,6, arrondis à la demi-seconde supérieure :
//      node tools/medals.mjs [url] [last|all|<id>] [--write]
//      node tools/medals.mjs --from-auto <levelId>=<secondes> [...] --write   (sans navigateur)
//
// Niveaux à RACCOURCI RISQUÉ (champ `shortcuts`, revue du 27/10, LEVELS.md §6) : le pilote auto de
//    référence prend le chemin sûr (`auto`) ; un second passage `playtest.mjs <id> --shortcut` donne
//    `autoShort` (pilote auto par les raccourcis). Le pilote humain tente les raccourcis dans une part des
//    essais (shortcutP, 0,6 par défaut, tiré par essai). Règle de l'or : plancher autoShort × 1,03 (au lieu de
//    auto × 1,03) et plafond auto − 0,1 s (l'or EXIGE le raccourci), part attentive visée 30–50 % comme ailleurs.
// Contrôle sans rien écrire (pourcentages or/argent/bronze des deux profils pour les seuils actuels) :
//      node tools/medals.mjs [url] all --human [--trials 20] [--md]
// Options : --keep-auto (reprend `auto` de levels.js au lieu de relancer le pilote auto),
//           --seed N, --jobs N (transmis à playtest.mjs), --md (tableau markdown en fin de sortie).
// Prérequis : site servi par tools/serve.sh, playwright installé là où on lance node.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const levelsPath = join(here, '..', 'levels.js');
export const COEF = { gold: 1.15, silver: 1.35, bronze: 1.6 };
export const TARGET = { gold: 0.40, goldMin: 0.30, goldMax: 0.50, goldAuto: 1.03, silver: 0.5, silverPressed: 0.3, bronze: 0.85, bronzePressed: 0.32, bronzePressedMin: 0.30, bronzePressedMax: 0.35, gap: 0.5, silverMin: 1.08 };
export const PROFILES = {
  attentif: [],
  'pressé': ['--delay', '180-250', '--jitter', '80', '--hold', '0.18-0.5', '--calm', '0', '--hesit', '0'],
};
const up05 = (x) => Math.ceil(x * 2 - 1e-9) / 2;
const r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 100) / 100;
export const medalsFor = (auto) => ({ auto, gold: up05(auto * COEF.gold), silver: up05(auto * COEF.silver), bronze: up05(auto * COEF.bronze) });
// part des essais (ratés = null, sans médaille) dont le temps est ≤ t
export const share = (times, t) => times.filter((x) => x != null && x <= t + 1e-9).length / times.length;
// plus petit temps au dixième, ≥ lo, atteint par au moins la part `q` des essais
function quantileUp(times, q, lo) {
  const ok = times.filter((x) => x != null).sort((a, b) => a - b);
  const need = Math.ceil(q * times.length - 1e-9);
  const t = need <= 0 ? lo : need > ok.length ? (ok.at(-1) ?? lo) + 1 : ok[need - 1];
  return Math.max(lo, Math.ceil(t * 10 - 1e-6) / 10);
}
// times = essais attentifs ; pressed = essais pressés (facultatif) — null = raté
export function calibrate(auto, times, pressed, autoShort) {
  // niveau à raccourci (revue du 27/10) : bornes calculées sur le temps du pilote auto par les raccourcis
  const sc = typeof autoShort === 'number' && autoShort < auto, base = sc ? autoShort : auto;
  const lo = Math.ceil(base * 10 - 1e-6) / 10;
  // or ≥ auto × 1,03 (revue du 24/10) : un or à 0,1–0,2 s du pilote auto n'est atteignable que par un essai
  // parfait (quasi jamais en profil pressé). Plancher arrondi au dixième supérieur.
  // Raccourci : plancher autoShort × 1,03, plafond `cap` = auto (chemin sûr) − 0,1 s.
  const cap = sc ? Math.round(auto * 10 - 1) / 10 : Infinity;
  const loGold = Math.min(cap, Math.max(lo, Math.ceil(base * TARGET.goldAuto * 10 - 1e-6) / 10));
  // or : seuil au dixième dont la part d'essais attentifs est la plus proche de 40 % (fenêtre 30–50 %,
  // revue du 24/10 ; avant : 17,5 %, fenêtre 10–25 %), jamais sous auto × 1,03
  const cands = [...new Set([loGold, ...times.filter((x) => x != null && x >= loGold).map((x) => Math.ceil(x * 10 - 1e-6) / 10)])].filter((x) => x <= cap).sort((a, b) => a - b);
  let gold = cands[0], best = Infinity;
  const pick = (cs) => { for (const c of cs) {
    const sh = share(times, c), d = Math.abs(sh - TARGET.gold) + (sh < TARGET.goldMin || sh > TARGET.goldMax ? 1 : 0);
    if (d < best - 1e-9) { best = d; gold = c; }
  } };
  pick(cands);
  // temps très groupés (aucun dixième dans la fenêtre 30–50 %) : on s'autorise le 0,05 s
  // (le jeu affiche alors ce temps cible au centième)
  if (best >= 1) pick([...new Set(times.filter((x) => x != null && x >= loGold).map((x) => Math.ceil(x * 20 - 1e-6) / 20))].filter((x) => x <= cap).sort((a, b) => a - b));
  let silver = r1(Math.max(gold + TARGET.gap, quantileUp(times, TARGET.silver, lo)));
  const bronze0 = r1(Math.max(silver + TARGET.gap, quantileUp(times, TARGET.bronze, lo)));
  // cible pressée (≈ 30 % des essais pressés), plafonnée au milieu de l'intervalle or–bronze
  if (pressed?.length) {
    const mid = Math.floor(((gold + bronze0) / 2) * 10 + 1e-6) / 10;
    silver = r1(Math.max(silver, Math.min(quantileUp(pressed, TARGET.silverPressed, lo), mid)));
  }
  // écart relatif or → argent (revue du 23/10) : argent ≥ or × 1,08, sinon l'argent « colle » à l'or sur les
  // sentiers courts ou très groupés (écart de 0,3 s ≈ une seule image de jitter). check-levels.mjs l'impose
  // (avertissement). Si cette règle relève l'argent, le bronze est relevé au besoin pour que l'argent reste
  // au plus au milieu de l'intervalle or–bronze (règle d'espacement du 22/10).
  const minSilver = Math.ceil(gold * TARGET.silverMin * 10 - 1e-6) / 10;
  let bronzeFloor = silver + TARGET.gap;
  if (silver < minSilver) { silver = r1(minSilver); bronzeFloor = Math.max(silver + TARGET.gap, Math.ceil((2 * silver - gold) * 10 - 1e-6) / 10); }
  let bronze = r1(Math.max(bronzeFloor, bronze0));
  // bronze pressé ≈ 32 % (fenêtre 30–35 %, revue du 29/10) : si trop peu de pressés l'atteignent,
  // on relève le seuil (médaille plus généreuse). Les règles d'écart restent le plancher.
  if (pressed?.length) {
    const bp = quantileUp(pressed, TARGET.bronzePressed, bronzeFloor);
    bronze = r1(Math.max(bronze, bp));
    // si l'argent dépasse le nouveau milieu or–bronze, on relève encore le bronze (espacement)
    const midNeed = Math.ceil((2 * silver - gold) * 10 - 1e-6) / 10;
    if (bronze < midNeed) bronze = r1(Math.max(bronze, midNeed));
  }
  return sc ? { auto, autoShort, gold: r2(gold), silver, bronze } : { auto, gold: r2(gold), silver, bronze };
}

const args = process.argv.slice(2), write = args.includes('--write');
const calib = args.includes('--calibrate'), human = calib || args.includes('--human'), md = args.includes('--md');
const flagVal = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };
const trials = Number(flagVal('--trials', calib ? 40 : 20));
const valued = new Set(['--trials', '--seed', '--jobs']);
const pos = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
if (pos[0] && !/^https?:\/\//.test(pos[0])) pos.unshift(''); // URL facultative : `medals.mjs all --human` marche aussi
const url = pos[0] || 'http://localhost:8765/nouste-corrida-trail/', which = pos[1] || 'last';
const { LEVELS } = await import(pathToFileURL(levelsPath).href + '?t=' + Date.now());
const list = which === 'all' ? LEVELS : which === 'last' ? [LEVELS.at(-1)] : LEVELS.filter((l) => l.id === which);

let times = {};
if (args.includes('--from-auto')) {
  for (const a of args.filter((x) => /^[a-z0-9-]+=\d+(\.\d+)?$/.test(x))) { const [k, v] = a.split('='); times[k] = Number(v); }
} else if (human && (args.includes('--keep-auto') || !calib)) {
  for (const L of list) if (L.medals?.auto) times[L.id] = L.medals.auto;
} else {
  const r = spawnSync(process.execPath, [join(here, 'playtest.mjs'), url, which], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  process.stdout.write(r.stdout);
  for (const line of r.stdout.split('\n')) {
    const mt = line.match(/^OK\s+\[([a-z0-9-]+)\].*arrivé en (\d+(?:\.\d+)?) s — chutes joueur 0/);
    if (mt) times[mt[1]] = Number(mt[2]);
    else if (/^ÉCHEC/.test(line)) console.log('⚠ pas de médailles pour ce niveau (le pilote auto doit finir sans chute) : ' + line);
  }
}
if (!Object.keys(times).length) { console.log('aucun temps de pilote auto'); process.exit(1); }
// niveaux à raccourci : temps du pilote auto par les raccourcis (playtest --shortcut), ou repris de levels.js
const timesShort = {};
for (const L of list) if (L.shortcuts?.length && times[L.id] != null) {
  if (args.includes('--keep-auto') || (human && !calib)) { if (L.medals?.autoShort) timesShort[L.id] = L.medals.autoShort; continue; }
  const r = spawnSync(process.execPath, [join(here, 'playtest.mjs'), url, L.id, '--shortcut'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  const mt = r.stdout.match(/^OK\s+\[[a-z0-9-]+\].*arrivé en (\d+(?:\.\d+)?) s — chutes joueur 0/m);
  if (mt) { timesShort[L.id] = Number(mt[1]); console.log(`[${L.id}] pilote auto par les raccourcis : ${mt[1]} s`); }
  else console.log(`⚠ [${L.id}] pilote auto par les raccourcis : échec\n${r.stdout}`);
}

// --- pilote humain : deux profils en parallèle ---
const hum = {}; // hum[profil][id] = [temps | null]
if (human) {
  const extra = [];
  for (const k of ['--seed', '--jobs']) if (args.includes(k)) extra.push(k, flagVal(k));
  const run = (prof) => new Promise((res) => {
    const ch = spawn(process.execPath, [join(here, 'playtest.mjs'), url, which, '--human', '--trials', String(trials), '--json', ...extra, ...PROFILES[prof]], { stdio: ['ignore', 'pipe', 'inherit'] });
    let out = ''; ch.stdout.on('data', (d) => (out += d));
    ch.on('close', () => {
      hum[prof] = {};
      for (const line of out.split('\n')) {
        if (line.startsWith('JSON ')) { const j = JSON.parse(line.slice(5)); hum[prof][j.id] = j.times; }
        else if (line.trim()) console.log(`[${prof}] ${line}`);
      }
      res();
    });
  });
  await Promise.all(Object.keys(PROFILES).map(run));
}

const pct = (x) => `${Math.round(100 * x)} %`;
let src = readFileSync(levelsPath, 'utf8');
const rows = [];
for (const L of list) {
  const id = L.id, auto = times[id];
  if (auto == null) { console.log(`[${id}] pas de temps auto`); process.exitCode = 1; continue; }
  let mdl, lineTxt;
  if (calib) {
    const ta = hum.attentif?.[id];
    if (!ta) { console.log(`[${id}] pas d'essais humains`); process.exitCode = 1; continue; }
    const tp = hum['pressé']?.[id];
    mdl = calibrate(auto, ta, tp, timesShort[id]);
    const f = (k, ts = ta) => String(Math.round(100 * share(ts, mdl[k])));
    lineTxt = `medals: { auto: ${auto}, ${mdl.autoShort != null ? `autoShort: ${mdl.autoShort}, ` : ''}gold: ${mdl.gold}, silver: ${mdl.silver}, bronze: ${mdl.bronze} }, // tools/medals.mjs --calibrate (${trials} essais attentifs : or ${f('gold')} %, argent ${f('silver')} %, bronze ${f('bronze')} %${tp ? ` ; pressés : or ${f('gold', tp)} %, argent ${f('silver', tp)} %, bronze ${f('bronze', tp)} %` : ''})`;
  } else if (human) {
    mdl = L.medals;
    if (!mdl) { console.log(`[${id}] pas de médailles dans levels.js`); continue; }
  } else {
    mdl = medalsFor(auto);
    lineTxt = `medals: { auto: ${mdl.auto}, gold: ${mdl.gold}, silver: ${mdl.silver}, bronze: ${mdl.bronze} }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)`;
  }
  const row = { n: LEVELS.indexOf(L) + 1, L, md: mdl };
  let txt = `[${id}] auto ${auto} s → or ${mdl.gold} s (×${(mdl.gold / auto).toFixed(2)}), argent ${mdl.silver} s (×${(mdl.silver / auto).toFixed(2)}), bronze ${mdl.bronze} s (×${(mdl.bronze / auto).toFixed(2)})`;
  if (mdl.autoShort) txt += `\n    raccourcis : pilote auto ${mdl.autoShort} s par les raccourcis (or < auto ${auto} s : l'or exige le raccourci)`;
  if (human) for (const prof of Object.keys(PROFILES)) {
    const ts = hum[prof]?.[id] || [];
    row[prof] = ['gold', 'silver', 'bronze'].map((k) => share(ts, mdl[k]));
    row[prof + 'Ok'] = ts.filter((x) => x != null).length / (ts.length || 1);
    txt += `\n    ${prof.padEnd(8)} (${ts.length} essais, réussite ${pct(row[prof + 'Ok'])}) : or ${pct(row[prof][0])}, argent ${pct(row[prof][1])}, bronze ${pct(row[prof][2])}`;
  }
  if (calib) { const g = row.attentif[0]; if (g < TARGET.goldMin || g > TARGET.goldMax) txt += `\n    ⚠ or hors de la fenêtre ${TARGET.goldMin * 100}–${TARGET.goldMax * 100} % (temps attentifs trop groupés, ou plancher auto × ${TARGET.goldAuto})`;
    const bp = row['pressé']?.[2]; if (bp != null && (bp < TARGET.bronzePressedMin || bp > TARGET.bronzePressedMax)) txt += `\n    ⚠ bronze pressé hors de la fenêtre ${TARGET.bronzePressedMin * 100}–${TARGET.bronzePressedMax * 100} % (plancher argent + ${TARGET.gap} s ou milieu or–bronze)`; }
  console.log(txt);
  rows.push(row);
  if (!write || !lineTxt) continue;
  const i = src.indexOf(`const id = "${id}"`);
  if (i < 0) { console.log(`  bloc introuvable pour ${id}`); process.exitCode = 1; continue; }
  const end = src.indexOf('LEVELS.push(', i + 1) < 0 ? src.length : src.indexOf('LEVELS.push(', i + 1);
  const block = src.slice(i, end);
  let nb;
  if (/\n(\s*)medals: \{[^\n]*\n/.test(block)) nb = block.replace(/\n(\s*)medals: \{[^\n]*\n/, (_, ind) => `\n${ind}${lineTxt}\n`);
  else if (/\n(\s*)rivals:[^\n]*\n/.test(block)) nb = block.replace(/\n(\s*)rivals:[^\n]*\n/, (all, ind) => `${all}${ind}${lineTxt}\n`);
  else { console.log(`  ligne rivals: introuvable pour ${id}`); process.exitCode = 1; continue; }
  src = src.slice(0, i) + nb + src.slice(end);
}
if (write) { writeFileSync(levelsPath, src); console.log('levels.js mis à jour'); }
if (md && rows.length) {
  const s = (x) => `${x.toFixed(1).replace('.', ',')} s`;
  console.log(`\n| N° | Niveau | Auto | Or | Argent | Bronze | Attentif or / argent / bronze | Pressé or / argent / bronze |\n|---|---|---|---|---|---|---|---|`);
  for (const r of rows) console.log(`| ${r.n} | ${r.L.name} | ${s(r.md.auto)} | ${s(r.md.gold)} | ${s(r.md.silver)} | ${s(r.md.bronze)} | ${r.attentif ? r.attentif.map(pct).join(' / ') : '—'} | ${r['pressé'] ? r['pressé'].map(pct).join(' / ') : '—'} |`);
}
