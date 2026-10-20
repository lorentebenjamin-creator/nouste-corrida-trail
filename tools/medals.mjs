// Médailles or / argent / bronze d'un sentier, calculées à partir du temps du PILOTE AUTO
// (tools/playtest.mjs, mode par défaut) puis inscrites dans le bloc du niveau de levels.js :
//
//   medals: { auto: 21.7, gold: 25, silver: 29.5, bronze: 35 }, // tools/medals.mjs
//
// Règle : or = auto × 1,15 ; argent = auto × 1,35 ; bronze = auto × 1,6 ; chaque temps est arrondi
// au DEMI-SECONDE SUPÉRIEURE (25,0 / 25,5…), donc toujours un peu plus généreux que le coefficient.
// Un niveau sans champ `medals` fonctionne (pas de médailles affichées).
//
// Usage (site servi par tools/serve.sh, playwright installé là où on lance node) :
//   node tools/medals.mjs [url] [last|all|<levelId>] [--write]
//   sans --write : affiche seulement ; avec --write : écrit/remplace la ligne `medals:` dans levels.js.
//   node tools/medals.mjs --from-auto <levelId>=<secondes> [...] --write   (sans navigateur, temps connu)
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const levelsPath = join(here, '..', 'levels.js');
export const COEF = { gold: 1.15, silver: 1.35, bronze: 1.6 };
const up05 = (x) => Math.ceil(x * 2 - 1e-9) / 2;
export const medalsFor = (auto) => ({ auto, gold: up05(auto * COEF.gold), silver: up05(auto * COEF.silver), bronze: up05(auto * COEF.bronze) });

const args = process.argv.slice(2), write = args.includes('--write');
let times = {};
if (args.includes('--from-auto')) {
  for (const a of args.filter((x) => /^[a-z0-9-]+=\d+(\.\d+)?$/.test(x))) { const [k, v] = a.split('='); times[k] = Number(v); }
} else {
  const pos = args.filter((a) => !a.startsWith('--'));
  const url = pos[0] || 'http://localhost:8765/nouste-corrida-trail/', which = pos[1] || 'last';
  const r = spawnSync(process.execPath, [join(here, 'playtest.mjs'), url, which], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  process.stdout.write(r.stdout);
  for (const line of r.stdout.split('\n')) {
    const mt = line.match(/^OK\s+\[([a-z0-9-]+)\].*arrivé en (\d+(?:\.\d+)?) s — chutes joueur 0/);
    if (mt) times[mt[1]] = Number(mt[2]);
    else if (/^ÉCHEC/.test(line)) console.log('⚠ pas de médailles pour ce niveau (le pilote auto doit finir sans chute) : ' + line);
  }
}
if (!Object.keys(times).length) { console.log('aucun temps de pilote auto'); process.exit(1); }

let src = readFileSync(levelsPath, 'utf8');
for (const [id, auto] of Object.entries(times)) {
  const md = medalsFor(auto);
  const lineTxt = `medals: { auto: ${md.auto}, gold: ${md.gold}, silver: ${md.silver}, bronze: ${md.bronze} }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)`;
  console.log(`[${id}] auto ${auto} s → or ${md.gold} s, argent ${md.silver} s, bronze ${md.bronze} s`);
  if (!write) continue;
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
