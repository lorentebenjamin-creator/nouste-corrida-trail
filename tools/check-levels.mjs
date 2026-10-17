// Vérification statique des niveaux : node tools/check-levels.mjs
// Code de sortie 1 s'il y a des ERREURS (les AVERTISSEMENTS n'empêchent pas la publication).
import { LEVELS, THEMES } from "../levels.js";

const BUILTIN_THEMES = ["forest", "ridge", "col"];
const THEME_KEYS = ["skyTop", "skyMid", "skyBot", "ridge", "ridge2", "pine", "pine2", "dirt", "dirtDark",
  "grass", "grassDark", "wood", "woodDark", "rock", "rockDark", "thorn", "leaf", "berry", "fog"];
const LIMITS = {
  maxGap: 200,        // erreur au-delà (saut joueur ≈ 252 px à plat, rivaux plus courts)
  softGap: 165,       // avertissement au-delà (le rival le plus lent rate)
  maxUp: 110,         // erreur au-delà (apex du saut ≈ 137 px)
  softUpGap: 130,     // pour une montée > 20 px, avertir si l'écart dépasse
  afterCheckpoint: 360, // aucun danger dans les 360 px après un fanion (rivaux bloqués 0,85 s après réapparition)
  afterHazard: 235,   // sol restant après une ronce
  afterBlock: 260,    // sol restant après un rocher / tronc
  maxWidth: 30000,    // canvas hors-écran = width × 780 px
};
let errors = 0, warnings = 0;
const err = (l, m) => { errors++; console.log(`ERREUR  [${l}] ${m}`); };
const warn = (l, m) => { warnings++; console.log(`avert.  [${l}] ${m}`); };

const ids = new Set();
LEVELS.forEach((L, idx) => {
  const tag = `${idx + 1}:${L.id}`;
  const errorsBefore = errors;
  for (const k of ["id", "name", "blurb", "difficulty", "theme"]) if (typeof L[k] !== "string" || !L[k].trim()) err(tag, `champ texte manquant: ${k}`);
  for (const k of ["width", "floor", "spawnX", "finishX"]) if (typeof L[k] !== "number" || !isFinite(L[k])) err(tag, `champ numérique manquant: ${k}`);
  if (ids.has(L.id)) err(tag, `id déjà utilisé`); ids.add(L.id);
  if (!/^[a-z0-9-]+$/.test(L.id || "")) err(tag, `id doit être en minuscules [a-z0-9-]`);
  if (!BUILTIN_THEMES.includes(L.theme)) {
    const t = THEMES[L.theme];
    if (!t) err(tag, `thème inconnu "${L.theme}" (intégrés: ${BUILTIN_THEMES.join(", ")}; ou ajouter dans THEMES)`);
    else for (const k of THEME_KEYS) if (!t[k]) err(tag, `thème ${L.theme}: clé ${k} manquante`);
  }
  if (!Array.isArray(L.rivals) || L.rivals.length !== 3) err(tag, `rivals doit contenir exactement 3 entrées (Léa, Karim, Inès)`);
  else L.rivals.forEach((r, i) => { if (!(r.speed > 0.5 && r.speed <= 1.05)) err(tag, `rivals[${i}].speed hors bornes (0.5–1.05)`); });
  if (L.width > LIMITS.maxWidth) err(tag, `width ${L.width} > ${LIMITS.maxWidth}`);
  for (const k of ["solids", "hazards", "coins", "checkpoints"]) if (!Array.isArray(L[k])) err(tag, `${k} doit être un tableau`);
  if (errors > errorsBefore) return;

  const walk = L.solids.filter(s => s.kind === "ground" || s.kind === "plank").sort((a, b) => a.x - b.x);
  const grounds = L.solids.filter(s => s.kind === "ground");
  const end = Math.max(...L.solids.map(s => s.x + s.w));
  if (end > L.width) err(tag, `un élément dépasse width (${end} > ${L.width})`);
  const under = (x, yTop) => grounds.find(g => x >= g.x && x <= g.x + g.w && (yTop == null || g.y === yTop));
  if (!under(L.spawnX, L.floor) || !under(L.spawnX + 120, L.floor)) err(tag, `pas de sol à y=floor sous spawnX`);
  const fin = grounds.find(g => L.finishX >= g.x && L.finishX + 200 <= g.x + g.w);
  if (!fin) err(tag, `il faut un sol continu de finishX à finishX+200`);
  else if (fin.y > L.floor + 28) err(tag, `le sol d'arrivée doit avoir y <= floor+28`);
  if (L.width - L.finishX < 300) warn(tag, `garder ≥300 px entre finishX et width`);
  if (L.finishX < 1000) warn(tag, `niveau très court`);

  // Parcours : pour chaque élément, on le compare à l'élément précédent qui va le plus loin à droite.
  let reach = walk[0];
  for (let i = 1; i < walk.length; i++) {
    const a = reach, b = walk[i];
    const gap = b.x - (a.x + a.w), up = a.y - b.y;
    if (b.x + b.w > a.x + a.w) reach = b;
    if (gap < 0) continue; // chevauchement (passerelle au-dessus d'un sol) : pas un saut obligatoire
    const w = `${a.kind}@${a.x}→${b.kind}@${b.x}`;
    if (up > LIMITS.maxUp) err(tag, `${w}: montée ${up} px > ${LIMITS.maxUp}`);
    if (gap > LIMITS.maxGap) err(tag, `${w}: écart ${gap} px > ${LIMITS.maxGap}`);
    else if (gap > LIMITS.softGap) warn(tag, `${w}: écart ${gap} px (rivaux lents en difficulté)`);
    if (up > 20 && gap > LIMITS.softUpGap) warn(tag, `${w}: montée ${up} px avec écart ${gap} px`);
    if (gap === 0 && up > 0) warn(tag, `${w}: marche montante sans trou (${up} px), les rivaux peuvent se bloquer`);
  }
  for (const hz of L.hazards) {
    const g = L.solids.find(s => s.y === hz.y + hz.h && hz.x >= s.x && hz.x + hz.w <= s.x + s.w);
    if (!g) { err(tag, `ronce @${hz.x}: pas posée sur un sol/passerelle de même hauteur`); continue; }
    if (g.x + g.w - hz.x < LIMITS.afterHazard) warn(tag, `ronce @${hz.x}: seulement ${g.x + g.w - hz.x} px avant le bord (≥${LIMITS.afterHazard})`);
    for (const cp of L.checkpoints) if (hz.x > cp.x && hz.x - cp.x < LIMITS.afterCheckpoint) warn(tag, `ronce @${hz.x} trop près du fanion @${cp.x}`);
    if (hz.x - L.spawnX < LIMITS.afterCheckpoint) warn(tag, `ronce @${hz.x} trop près du départ`);
  }
  for (const b of L.solids.filter(s => s.kind === "rock" || s.kind === "log")) {
    const g = grounds.find(s => s.y === b.y + b.h && b.x >= s.x && b.x + b.w <= s.x + s.w);
    if (!g) { err(tag, `${b.kind} @${b.x}: pas posé sur un sol (utiliser h(x, yDuSol) / g(x, yDuSol))`); continue; }
    if (g.x + g.w - b.x < LIMITS.afterBlock) warn(tag, `${b.kind} @${b.x}: seulement ${g.x + g.w - b.x} px avant le bord (≥${LIMITS.afterBlock})`);
  }
  L.checkpoints.forEach((cp, i) => {
    if (cp.id !== `${L.id}-cp${i + 1}`) err(tag, `fanion ${i + 1}: id ${cp.id} (index doit suivre 1,2,3…)`);
    if (i && cp.x <= L.checkpoints[i - 1].x) err(tag, `fanions pas triés par x`);
    const g = under(cp.x + 20, cp.y);
    if (!g) err(tag, `fanion @${cp.x}: pas de sol dont le dessus est y=${cp.y}`);
    else if (g.x + g.w - cp.x < 360) warn(tag, `fanion @${cp.x}: moins de 360 px de sol après (rivaux verrouillés à la réapparition)`);
  });
  const cids = new Set(L.coins.map(c => c.id));
  if (cids.size !== L.coins.length) err(tag, `ids de balises en double (utiliser un seul v(id) par niveau)`);
  for (const c of L.coins) if (c.x < 0 || c.x > L.width || c.y < 0 || c.y > 760) warn(tag, `balise hors monde @${c.x},${c.y}`);
  console.log(`ok      [${tag}] ${L.name} — ${L.difficulty} — ${Math.round(L.finishX / 10)} m — ${L.coins.length} balises, ${L.checkpoints.length} fanions`);
});
console.log(`\n${LEVELS.length} niveaux, ${errors} erreur(s), ${warnings} avertissement(s)`);
process.exit(errors ? 1 : 0);
