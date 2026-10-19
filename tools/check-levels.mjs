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
const info = (l, m) => console.log(`info    [${l}] ${m}`);

const ids = new Set();
LEVELS.forEach((L, idx) => {
  const tag = `${idx + 1}:${L.id}`;
  const errorsBefore = errors;
  for (const k of ["id", "name", "blurb", "difficulty", "theme"]) if (typeof L[k] !== "string" || !L[k].trim()) err(tag, `champ texte manquant: ${k}`);
  for (const k of ["width", "floor", "spawnX", "finishX"]) if (typeof L[k] !== "number" || !isFinite(L[k])) err(tag, `champ numérique manquant: ${k}`);
  if (ids.has(L.id)) err(tag, `id déjà utilisé`); ids.add(L.id);
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(L.id || "")) err(tag, `id doit être en minuscules [a-z0-9-], 40 caractères max, sans tiret au début (sinon le classement en ligne refuse les temps)`);
  if (!BUILTIN_THEMES.includes(L.theme)) {
    const t = THEMES[L.theme];
    if (!t) err(tag, `thème inconnu "${L.theme}" (intégrés: ${BUILTIN_THEMES.join(", ")}; ou ajouter dans THEMES)`);
    else for (const k of THEME_KEYS) if (!t[k]) err(tag, `thème ${L.theme}: clé ${k} manquante`);
  }
  if (!Array.isArray(L.rivals) || L.rivals.length !== 3) err(tag, `rivals doit contenir exactement 3 entrées (Léa, Karim, Inès)`);
  else L.rivals.forEach((r, i) => { if (!(r.speed > 0.5 && r.speed <= 1.05)) err(tag, `rivals[${i}].speed hors bornes (0.5–1.05)`); });
  if (L.width > LIMITS.maxWidth) err(tag, `width ${L.width} > ${LIMITS.maxWidth}`);
  for (const k of ["solids", "hazards", "coins", "checkpoints"]) if (!Array.isArray(L[k])) err(tag, `${k} doit être un tableau`);
  for (const k of ["rockfalls", "patrols", "jets"]) if (L[k] != null && !Array.isArray(L[k])) err(tag, `${k} doit être un tableau (ou absent)`);
  if (errors > errorsBefore) return;

  const movers = L.solids.filter(s => s.move);
  const walk = L.solids.filter(s => !s.move && !s.net && (s.kind === "ground" || s.kind === "plank")).sort((a, b) => a.x - b.x);
  const grounds = L.solids.filter(s => s.kind === "ground");
  // Passerelles mobiles : enveloppe de leur trajet
  const env = (m) => ({ x1: m.move.x0 + Math.min(0, m.move.dx), x2: m.move.x0 + Math.max(0, m.move.dx) + m.w,
    y1: m.move.y0 + Math.min(0, m.move.dy), y2: m.move.y0 + Math.max(0, m.move.dy), m });
  for (const m of movers) {
    const mv = m.move, e = env(m), tagm = `passerelle mobile @${mv.x0}`;
    if (m.kind !== "plank") err(tag, `${tagm}: seules les passerelles (mp) peuvent bouger`);
    if (!(mv.period >= 2.4)) err(tag, `${tagm}: period ${mv.period} < 2.4 s`);
    const vmax = Math.PI * Math.max(Math.abs(mv.dx), Math.abs(mv.dy)) / mv.period;
    if (vmax > 220) err(tag, `${tagm}: trop rapide (${vmax.toFixed(0)} px/s > 220)`);
    else if (vmax > 170) warn(tag, `${tagm}: rapide (${vmax.toFixed(0)} px/s)`);
    if (e.y1 < 120 || e.y2 > 660) err(tag, `${tagm}: trajet vertical hors [120, 660]`);
    if (m.w < 110) warn(tag, `${tagm}: largeur ${m.w} < 110`);
    if (e.x2 > L.width) err(tag, `${tagm}: sort du monde`);
  }
  // Filets (net: true) : sol de rattrapage sous une passerelle mobile, hors du parcours obligatoire.
  // Il doit laisser passer un coureur (56 px) sous la passerelle à son point le plus bas.
  for (const n of L.solids.filter(s => s.net)) {
    if (n.move || n.kind !== "ground") err(tag, `filet @${n.x}: doit être un sol fixe`);
    for (const m of movers.map(env)) if (m.x2 > n.x && m.x1 < n.x + n.w && n.y - (m.y2 + 18) < 60)
      err(tag, `filet @${n.x}: trop près de la passerelle mobile @${m.m.move.x0} (${n.y - m.y2 - 18} px < 60, écrasement)`);
  }
  // Pour un trou franchi grâce à des passerelles mobiles : chaîne a → mobiles → b, au mieux de leur trajet.
  const bridged = (a, b) => {
    const ms = movers.map(env).filter(e => e.x2 > a.x + a.w - 20 && e.x1 < b.x + 20).sort((p, q) => p.x1 - q.x1);
    if (!ms.length) return null;
    const nodes = [{ x1: a.x, x2: a.x + a.w, y1: a.y, y2: a.y }, ...ms, { x1: b.x, x2: b.x + b.w, y1: b.y, y2: b.y }];
    const probs = [];
    for (let i = 1; i < nodes.length; i++) {
      const P = nodes[i - 1], Q = nodes[i];
      const gapBest = Math.max(0, Q.x1 - P.x2); // au plus près
      const upBest = Math.max(0, Math.min(P.y2 - Q.y2, P.y2 - Q.y1) > 0 ? Math.min(...[Q.y1, Q.y2].map(q => P.y2 - q).filter(d => d >= 0).concat([P.y1 - Q.y2])) : 0);
      if (gapBest > LIMITS.maxGap) probs.push(`écart minimal ${gapBest} px vers x=${Q.x1}`);
      if (upBest > LIMITS.maxUp) probs.push(`montée minimale ${upBest} px vers x=${Q.x1}`);
    }
    return probs;
  };
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
    const br = bridged(a, b);
    if (br) { br.forEach(pb => err(tag, `${w} (via passerelles mobiles): ${pb}`)); if (!br.length) console.log(`info    [${tag}] ${w}: franchi par passerelle(s) mobile(s) — à valider avec tools/playtest.mjs`); continue; }
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
  // Chutes de pierres
  for (const fl of L.rockfalls || []) {
    const tagf = `chute de pierres @${fl.x}`;
    const g = L.solids.find(s => !s.move && s.y === fl.groundY && fl.x >= s.x && fl.x + fl.size <= s.x + s.w);
    if (!g) err(tag, `${tagf}: pas de sol de dessus y=${fl.groundY} sous la colonne [${fl.x}, ${fl.x + fl.size}]`);
    const tFall = Math.sqrt((2 * (fl.groundY - fl.size - fl.top)) / fl.g);
    if (!(fl.period * (1 - fl.warn) >= tFall + 0.25)) err(tag, `${tagf}: period trop courte (min ${((tFall + 0.25) / (1 - fl.warn)).toFixed(2)} s)`);
    if (fl.period < 1.8) warn(tag, `${tagf}: cadence très rapide (${fl.period} s)`);
    for (const cp of L.checkpoints) if (fl.x + fl.size > cp.x - 10 && fl.x < cp.x + 90) err(tag, `${tagf}: tombe sur la zone de réapparition du fanion @${cp.x}`);
    if (fl.x < L.spawnX + 160) err(tag, `${tagf}: tombe sur le départ`);
  }
  // Patous
  for (const dg of L.patrols || []) {
    const tagp = `patou ${dg.x1}–${dg.x2}`;
    const g = L.solids.find(s => !s.move && s.y === dg.groundY && dg.x1 >= s.x && dg.x2 <= s.x + s.w);
    if (!g) err(tag, `${tagp}: la ronde doit tenir sur UN sol de dessus y=${dg.groundY}`);
    if (dg.x2 - dg.x1 < dg.w + 60) warn(tag, `${tagp}: ronde très courte`);
    const sp = (2 * (dg.x2 - dg.x1 - dg.w)) / dg.period;
    if (sp > 260) err(tag, `${tagp}: trop rapide (${sp.toFixed(0)} px/s)`); else if (sp > 220) warn(tag, `${tagp}: rapide (${sp.toFixed(0)} px/s)`);
    for (const cp of L.checkpoints) if (cp.x + 60 > dg.x1 - 40 && cp.x < dg.x2) err(tag, `${tagp}: passe sur la zone de réapparition du fanion @${cp.x}`);
    if (dg.x1 < L.spawnX + 300) err(tag, `${tagp}: trop près du départ`);
  }
  // Jets de cascade (v3)
  for (const jt of L.jets || []) {
    const tagj = `jet @${jt.x}`, off = jt.period * (1 - jt.on);
    if (!(jt.w >= 30 && jt.w <= 120)) err(tag, `${tagj}: largeur ${jt.w} hors 30–120`);
    if (!(jt.bottom > jt.top)) err(tag, `${tagj}: bottom doit être > top`);
    if (!(jt.period >= 2 && jt.period <= 6)) err(tag, `${tagj}: period ${jt.period} hors 2–6 s`);
    if (!(jt.on >= 0.2 && jt.on <= 0.6)) err(tag, `${tagj}: on ${jt.on} hors 0.2–0.6`);
    if (off < 1.2) err(tag, `${tagj}: pause ${off.toFixed(2)} s < 1,2 s (passage trop serré)`);
    if (!(jt.warn >= 0.4 && jt.warn <= off - 0.3)) err(tag, `${tagj}: warn ${jt.warn} s hors [0,4 ; pause − 0,3]`);
    // un endroit sûr pour attendre juste avant le jet (sol ou passerelle fixe qui finit ≤ 120 px avant)
    const wait = L.solids.some(sd => !sd.move && sd.x + sd.w <= jt.x + 2 && sd.x + sd.w >= jt.x - 120 && sd.y >= jt.top && sd.y <= jt.bottom);
    const under = L.solids.some(sd => !sd.move && sd.x < jt.x + jt.w && sd.x + sd.w > jt.x && sd.y >= jt.top && sd.y <= jt.bottom);
    if (!wait && !under) warn(tag, `${tagj}: aucun sol pour attendre dans les 120 px avant le jet`);
    if (!under) info(tag, `${tagj}: au-dessus d'un ravin (passage chronométré, à valider avec tools/playtest.mjs --human)`);
    for (const cp of L.checkpoints) if (cp.x + 60 > jt.x - 60 && cp.x < jt.x + jt.w + 60) err(tag, `${tagj}: trop près du fanion @${cp.x}`);
    if (jt.x < L.spawnX + 300) err(tag, `${tagj}: trop près du départ`);
  }
  const cids = new Set(L.coins.map(c => c.id));
  if (cids.size !== L.coins.length) err(tag, `ids de balises en double (utiliser un seul v(id) par niveau)`);
  for (const c of L.coins) if (c.x < 0 || c.x > L.width || c.y < 0 || c.y > 760) warn(tag, `balise hors monde @${c.x},${c.y}`);
  const extra = [movers.length && `${movers.length} passerelle(s) mobile(s)`, (L.rockfalls || []).length && `${L.rockfalls.length} chute(s) de pierres`, (L.patrols || []).length && `${L.patrols.length} patou(s)`, (L.jets || []).length && `${L.jets.length} jet(s) de cascade`].filter(Boolean).join(", ");
  console.log(`ok      [${tag}] ${L.name} — ${L.difficulty} — ${Math.round(L.finishX / 10)} m — ${L.coins.length} balises, ${L.checkpoints.length} fanions${extra ? ", " + extra : ""}`);
});
console.log(`\n${LEVELS.length} niveaux, ${errors} erreur(s), ${warnings} avertissement(s)`);
process.exit(errors ? 1 : 0);
