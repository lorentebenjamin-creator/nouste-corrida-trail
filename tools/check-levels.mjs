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
// Portée horizontale d'un saut complet (pieds revenus à la hauteur d'arrivée, `up` px plus haut),
// même intégration que le moteur (pas 1/60 s, LEVELS.md §5), course à 352 px/s × `slow` dès l'appel
// (rafale qui souffle pendant tout le saut ; slow = 1 : calme).
function jumpReach(slow = 1, up = 0) {
  let vx = 352, vy = -770, x = 0, yy = 0; const dt = 1 / 60;
  for (let f = 0; f < 300; f++) {
    const dv = 352 * slow - vx; vx += Math.sign(dv) * Math.min(Math.abs(dv), 2100 * dt);
    let gr = vy < 0 ? 2100 : 4700; if (Math.abs(vy) < 110) gr = 1200; vy = Math.min(1080, vy + gr * dt);
    x += vx * dt; yy += vy * dt; if (vy > 0 && yy >= -up) return x;
  }
  return x;
}
// v6 (LEVELS.md §3f) : portée d'un saut complet DANS une ascendance active pendant tout le vol
// (gravité × lift dès l'apex, chute plafonnée à `fall`), course à 352 × speed. Renvoie [portée, images].
function thermReach(speed, lift, fall, up = 0) {
  let vx = 352 * speed, vy = -770, x = 0, yy = 0; const dt = 1 / 60;
  for (let f = 0; f < 300; f++) {
    let gr = vy < 0 ? 2100 : 4700; if (Math.abs(vy) < 110) gr = 1200;
    const th = vy > -110; vy = Math.min(th ? fall : 1080, vy + gr * (th ? lift : 1) * dt);
    x += vx * dt; yy += vy * dt; if (vy > 0 && yy >= -up) return [x, f + 1];
  }
  return [x, 300];
}
// v7 (LEVELS.md §3g) : rebond sur une amanite (vy = −bounce depuis le chapeau), course à 352 × speed.
// Renvoie [portée horizontale quand les pieds redescendent à `up` px au-dessus du chapeau, images, apex].
function bounceReach(speed, bounce, up = 0) {
  let vx = 352 * speed, vy = -bounce, x = 0, yy = 0, top = 0; const dt = 1 / 60;
  for (let f = 0; f < 300; f++) {
    let gr = vy < 0 ? 2100 : 4700; if (Math.abs(vy) < 110) gr = 1200; vy = Math.min(1080, vy + gr * dt);
    x += vx * dt; yy += vy * dt; top = Math.min(top, yy); if (vy > 0 && yy >= -up) return [x, f + 1, -top];
  }
  return [x, 300, -top];
}
let errors = 0, warnings = 0;
const err = (l, m) => { errors++; console.log(`ERREUR  [${l}] ${m}`); };
// Avertissements acceptés : champ `acceptedWarnings: [{ match: "début du message", reason: "pourquoi" }]`
// dans le bloc du niveau (voir LEVELS.md §6b). Un avertissement dont le texte commence par `match`
// est listé à part (avec sa raison) et ne compte pas comme avertissement non justifié.
let accepting = [], acceptedList = [];
const warn = (l, m) => {
  const a = accepting.find((x) => m.startsWith(x.match));
  if (a) { a.used = true; acceptedList.push(`accepté [${l}] ${m} — ${a.reason}`); return; }
  warnings++; console.log(`avert.  [${l}] ${m}`);
};
const info = (l, m) => console.log(`info    [${l}] ${m}`);

const ids = new Set();
LEVELS.forEach((L, idx) => {
  const tag = `${idx + 1}:${L.id}`;
  const errorsBefore = errors;
  accepting = [];
  if (L.acceptedWarnings != null) {
    if (!Array.isArray(L.acceptedWarnings)) err(tag, `acceptedWarnings doit être un tableau de { match, reason }`);
    else for (const a of L.acceptedWarnings) {
      if (!a || typeof a.match !== "string" || !a.match.trim()) err(tag, `acceptedWarnings : chaque entrée doit avoir un "match" non vide`);
      else if (typeof a.reason !== "string" || a.reason.trim().length < 10) err(tag, `acceptedWarnings "${a.match}" : raison manquante ou trop courte`);
      else accepting.push({ match: a.match, reason: a.reason.trim(), used: false });
    }
  }
  // Médailles (facultatives) : medals: { auto, gold, silver, bronze } écrit par tools/medals.mjs
  if (L.medals != null) {
    const md = L.medals, okNum = (x) => typeof x === "number" && isFinite(x) && x > 0;
    // Niveau à raccourci risqué (champ shortcuts, revue du 27/10) : `auto` = pilote auto par le chemin SÛR,
    // `autoShort` = pilote auto par les raccourcis ; l'or doit EXIGER le raccourci : autoShort ≤ or < auto.
    const hasSc = Array.isArray(L.shortcuts) && L.shortcuts.length > 0;
    if (![md.auto, md.gold, md.silver, md.bronze].every(okNum)) err(tag, `medals : auto, gold, silver et bronze doivent être des nombres > 0`);
    else if (hasSc && !okNum(md.autoShort)) err(tag, `medals : niveau à raccourci (shortcuts) sans autoShort (tools/medals.mjs --calibrate)`);
    else if (hasSc && !(md.autoShort <= md.gold && md.gold < md.auto && md.gold < md.silver && md.silver < md.bronze)) err(tag, `medals : niveau à raccourci, il faut autoShort ≤ or < auto (l'or exige le raccourci) et or < argent < bronze`);
    else if (hasSc) { if (md.gold < md.autoShort * 1.03 - 1e-9) warn(tag, `medals : or ${md.gold} s à moins de 3 % au-dessus du pilote auto par les raccourcis ${md.autoShort} s`); }
    else if (!(md.auto <= md.gold && md.gold < md.silver && md.silver < md.bronze)) err(tag, `medals : il faut auto ≤ or < argent < bronze`);
    // Or ≥ auto × 1,03 (revue du 24/10) : un or à 0,1–0,2 s du pilote auto n'est atteignable que par un essai
    // parfait (quasi jamais en profil pressé) : recalibrer (tools/medals.mjs --calibrate) ou justifier.
    else if (md.gold < md.auto * 1.03 - 1e-9) warn(tag, `medals : or ${md.gold} s à moins de 3 % au-dessus du pilote auto ${md.auto} s (+${((md.gold / md.auto - 1) * 100).toFixed(1)} %, viser ≥ ${(Math.ceil(md.auto * 1.03 * 10 - 1e-6) / 10).toFixed(1)} s)`);
    // Écart relatif or → argent (revue du 23/10) : argent ≥ or × 1,08. En dessous, l'argent « colle » à l'or
    // (quelques dixièmes = le jitter d'une image) : recalibrer (tools/medals.mjs --calibrate) ou justifier.
    else if (md.silver < md.gold * 1.08 - 1e-9) warn(tag, `medals : argent ${md.silver} s à moins de 8 % au-dessus de l'or ${md.gold} s (+${((md.silver / md.gold - 1) * 100).toFixed(1)} %, viser ≥ ${(Math.ceil(md.gold * 1.08 * 10 - 1e-6) / 10).toFixed(1)} s)`);
  } else info(tag, `pas de médailles (lancer tools/medals.mjs ${L.id} --write)`);
  // Raccourcis risqués (revue du 27/10, LEVELS.md §6) : { name, from, to, y, land, landY } — rocher de départ
  // (sol de dessus y couvrant from–to) et rocher d'arrivée (sol de dessus landY commençant en land).
  if (L.shortcuts != null) {
    if (!Array.isArray(L.shortcuts)) err(tag, `shortcuts doit être un tableau (ou absent)`);
    else for (const q of L.shortcuts) {
      const nm = `raccourci « ${q?.name || "?"} »`;
      if (!q || ![q.from, q.to, q.y, q.land, q.landY].every((x) => typeof x === "number" && isFinite(x)) || !(q.from < q.to && q.to < q.land)) { err(tag, `${nm} : from < to < land et y, landY numériques requis`); continue; }
      if (!L.solids.some((sd) => !sd.move && sd.kind === "ground" && sd.y === q.y && sd.x === q.from && sd.x + sd.w === q.to)) err(tag, `${nm} : pas de sol de dessus y=${q.y} de ${q.from} à ${q.to} (rocher de départ)`);
      if (!L.solids.some((sd) => !sd.move && sd.kind === "ground" && sd.y === q.landY && sd.x === q.land)) err(tag, `${nm} : pas de sol de dessus y=${q.landY} commençant en ${q.land} (rocher d'arrivée)`);
      if (q.land - q.to > 285) err(tag, `${nm} : ${q.land - q.to} px bord à bord, infranchissable (≤ 285)`);
    }
  }
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
  for (const k of ["rockfalls", "patrols", "jets", "gusts", "thermals", "ziplines"]) if (L[k] != null && !Array.isArray(L[k])) err(tag, `${k} doit être un tableau (ou absent)`);
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
    // Saut d'ascendance (v6, §3f) : ravin trop large pour un saut normal, franchi en planant dans une
    // ascendance thermique qui couvre l'appel et la réception.
    const tmz = (L.thermals || []).find((t) => t.x1 <= a.x + a.w - 40 && t.x2 >= b.x + 40);
    if (tmz && gap > LIMITS.softGap) {
      const sMin = Math.min(...(L.rivals || []).map((r) => r.speed)), edge = a.x + a.w;
      const [rS] = thermReach(sMin, tmz.lift, tmz.fall, up), [rP, fP] = thermReach(1, tmz.lift, tmz.fall, up);
      const rNorm = jumpReach(1, up) + 30 + 0.11 * 352;
      if (up > LIMITS.maxUp) err(tag, `${w}: montée ${up} px > ${LIMITS.maxUp} (l'ascendance ne porte qu'à la descente)`);
      if (gap > rS + 30 - 40) err(tag, `${w}: saut d'ascendance ${gap} px trop long (rival le plus lent ${sMin} : portée ≈ ${Math.round(rS + 30)} px, marge < 40)`);
      if (fP > 78) err(tag, `${w}: vol d'ascendance trop long (${fP} images > 78 : l'IA ne le voit pas finir ; éviter les réceptions plus basses)`);
      if (gap < rNorm) warn(tag, `${w}: saut d'ascendance de ${gap} px franchissable sans elle (portée normale ≈ ${Math.round(rNorm)} px) : mécanique sans effet`);
      if (a.w < 150) warn(tag, `${w}: plateforme d'appel ${a.w} px < 150 pour attendre l'ascendance`);
      const wx1 = edge - 150, hit = (x1, x2) => x2 > wx1 && x1 < edge;
      if (L.hazards.some((hz) => hit(hz.x, hz.x + hz.w)) || L.solids.some((sd) => (sd.kind === "rock" || sd.kind === "log") && hit(sd.x, sd.x + sd.w)) || (L.rockfalls || []).some((fl) => hit(fl.x, fl.x + fl.size)) || (L.patrols || []).some((dg) => hit(dg.x1, dg.x2)))
        warn(tag, `${w}: saut d'ascendance sans aire d'attente sûre (150 px sans danger avant le bord)`);
      info(tag, `${w}: SAUT D'ASCENDANCE (écart ${gap} px, montée ${up} ; portée en planant ≈ ${Math.round(rP + 30)} px joueur / ${Math.round(rS + 30)} px rival ${sMin}, ${fP} images ; sans ascendance ≈ ${Math.round(rNorm)} px) — valider avec tools/playtest.mjs --human`);
      continue;
    }
    // Tyrolienne (v8, §3h) : câble qui part du bord de `a` et se termine au-dessus de `b` (glisse sans gravité).
    const zlz = (L.ziplines || []).find((z) => z.x1 >= a.x + a.w - 60 && z.x1 <= a.x + a.w + 30 && z.x2 > b.x + 40 && z.x2 < b.x + b.w);
    if (zlz) {
      const gx = zlz.x1 + (zlz.grab ?? 8), rise = Math.round(a.y - 118 - (zlz.y1 + ((zlz.y2 - zlz.y1) * (gx - zlz.x1)) / (zlz.x2 - zlz.x1))), drop = b.y - (zlz.y2 + 118);
      if (rise < 85 || rise > 134) err(tag, `${w}: tyrolienne à ${rise} px au-dessus des mains (il faut 85–134 : un saut complet monte de 137, prise à ±3 px du câble)`);
      if (drop < 10 || drop > 80) err(tag, `${w}: lâcher de la tyrolienne à ${drop} px au-dessus du sol d'arrivée (il faut 10–80)`);
      if (b.x + b.w - zlz.x2 < 150) err(tag, `${w}: sol d'arrivée trop court après le bout du câble (${b.x + b.w - zlz.x2} px < 150)`);
      info(tag, `${w}: TYROLIENNE (écart ${gap} px, câble ${zlz.x2 - zlz.x1} px, ${rise} px à monter pour l'attraper, poignée à ${gx - zlz.x1} px, lâcher ${drop} px au-dessus du sol) — valider avec tools/playtest.mjs --human`);
      continue;
    }
    // Rebond d'amanite (v7, §3g) : depuis le chapeau, la relance (vy = −bounce) remplace le saut.
    if (a.bounce) {
      const sMin = Math.min(...(L.rivals || []).map((r) => r.speed));
      const [rS] = bounceReach(sMin, a.bounce, up), [rP, fP, apex] = bounceReach(1, a.bounce, up);
      const mid = a.x + a.w / 2;
      if (up > apex - 40) err(tag, `${w}: rebond trop haut (montée ${up} px, apex du rebond ≈ ${Math.round(apex)} px, marge < 40)`);
      if (b.x > mid + rS + 30 - 30) err(tag, `${w}: rebond trop court pour le rival le plus lent ${sMin} (depuis le milieu du chapeau ≈ ${Math.round(rS)} px, il faut ${b.x - mid} px + 30 de marge)`);
      if (b.x + b.w < mid + rP + 40) warn(tag, `${w}: réception trop courte après le rebond (on la dépasse)`);
      if (fP > 75) warn(tag, `${w}: vol de rebond de ${fP} images (> 75 : l'IA voit mal la fin)`);
      info(tag, `${w}: REBOND D'AMANITE (écart ${gap} px, montée ${up} ; portée depuis le chapeau ≈ ${Math.round(rP)} px joueur / ${Math.round(rS)} px rival ${sMin}, apex ${Math.round(apex)} px, ${fP} images) — valider avec tools/playtest.mjs --human`);
      continue;
    }
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
  // Rafales de vent de face (v4, LEVELS.md §3d)
  const gs = (L.gusts || []).slice().sort((a, b) => a.x1 - b.x1);
  gs.forEach((gu, gi) => {
    const tagg = `rafale ${gu.x1}–${gu.x2}`, calm = gu.period * (1 - gu.on);
    if (!(gu.x2 - gu.x1 >= 200)) err(tag, `${tagg}: zone trop étroite (< 200 px)`);
    if (!(gu.period >= 2.5 && gu.period <= 7)) err(tag, `${tagg}: period ${gu.period} hors 2,5–7 s`);
    if (!(gu.on >= 0.25 && gu.on <= 0.6)) err(tag, `${tagg}: on ${gu.on} hors 0,25–0,6`);
    if (calm < 1.4) err(tag, `${tagg}: calme ${calm.toFixed(2)} s < 1,4 s (passage trop serré)`);
    else if (calm < 1.8) warn(tag, `${tagg}: calme court (${calm.toFixed(2)} s)`);
    if (!(gu.warn >= 0.6 && gu.warn <= calm - 0.4)) err(tag, `${tagg}: warn ${gu.warn} s hors [0,6 ; calme − 0,4] (la rafale doit être annoncée assez tôt)`);
    if (!(gu.slow >= 0.45 && gu.slow <= 0.7)) err(tag, `${tagg}: slow ${gu.slow} hors 0,45–0,7`);
    if (gu.x1 < L.spawnX + 300) err(tag, `${tagg}: trop près du départ`);
    if (gu.x2 > L.width) err(tag, `${tagg}: sort du monde`);
    if (gi && gu.x1 < gs[gi - 1].x2) err(tag, `${tagg}: chevauche la rafale ${gs[gi - 1].x1}–${gs[gi - 1].x2}`);
    if (!L.solids.some(sd => !sd.move && sd.kind === "ground" && gu.x1 - 14 >= sd.x && gu.x1 - 14 <= sd.x + sd.w)) warn(tag, `${tagg}: pas de sol à x1−14 pour la manche à air (annonce moins lisible)`);
    // une seule mécanique à la fois : pas de passerelle mobile ni de jet dans le vent
    for (const m of movers.map(env)) if (m.x2 > gu.x1 && m.x1 < gu.x2) warn(tag, `${tagg}: passerelle mobile @${m.m.move.x0} dans la zone (combinaison peu lisible)`);
    for (const jt of L.jets || []) if (jt.x + jt.w > gu.x1 && jt.x < gu.x2) warn(tag, `${tagg}: jet @${jt.x} dans la zone (combinaison peu lisible)`);
    // sauts sous la rafale : il faut pouvoir attendre le calme sur la plateforme d'appel
    let reach2 = walk[0];
    for (let i = 1; i < walk.length; i++) {
      const a = reach2, b = walk[i], gap = b.x - (a.x + a.w);
      if (b.x + b.w > a.x + a.w) reach2 = b;
      if (gap <= 0 || b.x < gu.x1 || a.x + a.w > gu.x2) continue;
      if (a.w < 150) warn(tag, `${tagg}: plateforme d'appel ${a.kind}@${a.x} trop courte (${a.w} px < 150) pour attendre le calme`);
      info(tag, `${tagg}: saut ${a.kind}@${a.x}→${b.kind}@${b.x} (écart ${gap}) sous la rafale — passage chronométré, à valider avec tools/playtest.mjs --human`);
      // « Ravin au calme » (revue 21/10) : la rafale fait TOMBER (même appel au ras du bord, avec le
      // temps de coyote) alors qu'on passe au calme. Il faut alors : un panneau (signs) dont le texte
      // parle du calme, dans les 900 px avant le bord ; une aire d'attente ≥ 150 px sans danger
      // juste avant le bord (ni ronce, ni rocher/tronc, ni pierres, ni patou).
      const up2 = a.y - b.y, edge = a.x + a.w;
      const rGust = jumpReach(gu.slow, up2) + 30 + 0.11 * 352 * gu.slow, rCalm = jumpReach(1, up2) + 30;
      if (gap >= rGust) {
        if (gap > rCalm - 40) warn(tag, `${tagg}: ravin au calme ${a.kind}@${a.x}→${b.kind}@${b.x} : écart ${gap} px trop près de la portée au calme (${Math.round(rCalm)} px, marge < 40)`);
        info(tag, `${tagg}: RAVIN AU CALME ${a.kind}@${a.x}→${b.kind}@${b.x} (écart ${gap} px ; portée sous la rafale ≈ ${Math.round(rGust)} px, au calme ≈ ${Math.round(rCalm)} px) : la rafale fait tomber — valider avec tools/playtest.mjs --human`);
        const sg = (L.signs || []).find((sn) => sn.x <= edge && sn.x >= edge - 900 && /calme/i.test(sn.text || ""));
        if (!sg) warn(tag, `${tagg}: ravin au calme @${edge} sans panneau (signs: panneau(x, yDuSol, "Ravin :|saute au calme")) dans les 900 px avant le bord`);
        const wx1 = edge - 150, hit = (x1, x2) => x2 > wx1 && x1 < edge;
        const blocked = L.hazards.some((hz) => hit(hz.x, hz.x + hz.w)) || L.solids.some((sd) => (sd.kind === "rock" || sd.kind === "log") && hit(sd.x, sd.x + sd.w))
          || (L.rockfalls || []).some((fl) => hit(fl.x, fl.x + fl.size)) || (L.patrols || []).some((dg) => hit(dg.x1, dg.x2));
        if (a.w < 150 || blocked) warn(tag, `${tagg}: ravin au calme @${edge} sans aire d'attente sûre (≥ 150 px de sol sans danger avant le bord)`);
      }
    }
  });
  // Ascendances thermiques (v6, LEVELS.md §3f)
  const tms = (L.thermals || []).slice().sort((a, b) => a.x1 - b.x1);
  tms.forEach((tm, ti) => {
    const tagt = `ascendance ${tm.x1}–${tm.x2}`, onT = tm.period * tm.on, off = tm.period - onT;
    if (!(tm.x2 - tm.x1 >= 200)) err(tag, `${tagt}: zone trop étroite (< 200 px)`);
    if (!(tm.period >= 3 && tm.period <= 7)) err(tag, `${tagt}: period ${tm.period} hors 3–7 s`);
    if (!(tm.on >= 0.35 && tm.on <= 0.7)) err(tag, `${tagt}: on ${tm.on} hors 0,35–0,7`);
    if (onT < 1.8) err(tag, `${tagt}: ascendance ${onT.toFixed(2)} s < 1,8 s (un vol dure ≈ 1,2 s)`);
    if (off < 1.2) err(tag, `${tagt}: repos ${off.toFixed(2)} s < 1,2 s (illisible)`);
    if (!(tm.warn >= 0.6 && tm.warn <= off - 0.3)) err(tag, `${tagt}: warn ${tm.warn} s hors [0,6 ; repos − 0,3] (l'ascendance doit être annoncée assez tôt)`);
    if (!(tm.fade >= 0.4 && tm.fade <= onT - 1)) err(tag, `${tagt}: fade ${tm.fade} s hors [0,4 ; ascendance − 1]`);
    if (!(tm.lift >= 0.3 && tm.lift <= 0.6)) err(tag, `${tagt}: lift ${tm.lift} hors 0,3–0,6`);
    if (!(tm.fall >= 250 && tm.fall <= 450)) err(tag, `${tagt}: fall ${tm.fall} hors 250–450 px/s`);
    if (tm.x1 < L.spawnX + 300) err(tag, `${tagt}: trop près du départ`);
    if (tm.x2 > L.width) err(tag, `${tagt}: sort du monde`);
    if (ti && tm.x1 < tms[ti - 1].x2) err(tag, `${tagt}: chevauche l'ascendance ${tms[ti - 1].x1}–${tms[ti - 1].x2}`);
    for (const cp of L.checkpoints) if (cp.x + 60 > tm.x1 && cp.x < tm.x2) warn(tag, `${tagt}: fanion @${cp.x} dans la zone`);
    if (!L.solids.some((sd) => !sd.move && sd.kind === "ground" && tm.x1 - 14 >= sd.x && tm.x1 - 14 <= sd.x + sd.w)) warn(tag, `${tagt}: pas de sol à x1−14 pour la flamme (annonce moins lisible)`);
    if (movers.some((m) => { const e = env(m); return e.x2 > tm.x1 && e.x1 < tm.x2; }) || (L.jets || []).some((jt) => jt.x + jt.w > tm.x1 && jt.x < tm.x2) || (L.gusts || []).some((gu) => gu.x2 > tm.x1 && gu.x1 < tm.x2) || L.solids.some((sd) => sd.sink && sd.x < tm.x2 && sd.x + sd.w > tm.x1))
      warn(tag, `${tagt}: autre mécanique dans la zone (combinaison peu lisible)`);
    if (ti === 0 && !(L.signs || []).some((sn) => sn.x <= tm.x1 && sn.x >= tm.x1 - 1500 && /ascendance/i.test(sn.text || ""))) warn(tag, `${tagt}: première ascendance sans panneau (texte « ascendance ») dans les 1500 px avant`);
  });
  if (tms.length) info(tag, `${tms.length} ascendance(s) thermique(s) : passages chronométrés, à valider avec tools/playtest.mjs --human`);
  // Mottes plongeantes (v5, LEVELS.md §3e) : passerelles qui plongent périodiquement (plus de sol)
  const sinks = L.solids.filter((sd) => sd.sink).sort((a, b) => a.x - b.x);
  sinks.forEach((sd, si) => {
    const sk = sd.sink, tagk = `motte @${sd.x}`, upT = sk.period * sk.on, downT = sk.period - upT;
    if (sd.kind !== "plank" || !sd.oneWay || sd.move) err(tag, `${tagk}: doit être une passerelle fixe (helper motte())`);
    if (sk.y0 !== sd.y) err(tag, `${tagk}: y0 ≠ y (utiliser motte(x, y, w, …))`);
    if (!(sk.period >= 3 && sk.period <= 7)) err(tag, `${tagk}: period ${sk.period} hors 3–7 s`);
    if (!(sk.on >= 0.4 && sk.on <= 0.8)) err(tag, `${tagk}: on ${sk.on} hors 0,4–0,8`);
    if (upT < 1.8) err(tag, `${tagk}: à flot ${upT.toFixed(2)} s < 1,8 s (passage trop serré)`);
    if (downT < 1) err(tag, `${tagk}: plongée ${downT.toFixed(2)} s < 1 s (illisible)`);
    if (!(sk.warn >= 0.6 && sk.warn <= upT - 0.8)) err(tag, `${tagk}: warn ${sk.warn} s hors [0,6 ; à flot − 0,8] (la plongée doit être annoncée assez tôt)`);
    if (sd.w < 140) warn(tag, `${tagk}: largeur ${sd.w} < 140 (on n'a pas le temps de s'y poser et repartir)`);
    if (sd.y < 120 || sd.y > 600) err(tag, `${tagk}: hauteur hors [120, 600]`);
    if (L.hazards.some((hz) => hz.x < sd.x + sd.w && hz.x + hz.w > sd.x && hz.y + hz.h === sd.y)) err(tag, `${tagk}: pas de ronce sur une motte`);
    if (L.solids.some((o) => o !== sd && !o.sink && o.x < sd.x + sd.w && o.x + o.w > sd.x && o.y > sd.y && o.y - sd.y < 200 && (o.kind === "ground" || o.kind === "plank")))
      warn(tag, `${tagk}: un sol/passerelle juste dessous (la plongée ne fait pas tomber : mécanique illisible)`);
    for (const cp of L.checkpoints) if (cp.x + 60 > sd.x - 120 && cp.x < sd.x + sd.w + 60) err(tag, `${tagk}: trop près du fanion @${cp.x}`);
    if (sd.x < L.spawnX + 600) err(tag, `${tagk}: trop près du départ`);
    if (movers.some((m) => { const e = env(m); return e.x2 > sd.x - 300 && e.x1 < sd.x + sd.w + 300; }) || (L.jets || []).some((jt) => jt.x + jt.w > sd.x - 300 && jt.x < sd.x + sd.w + 300) || (L.gusts || []).some((gu) => gu.x2 > sd.x - 300 && gu.x1 < sd.x + sd.w + 300))
      warn(tag, `${tagk}: autre mécanique à moins de 300 px (combinaison peu lisible)`);
    // première motte d'une suite : une plateforme fixe ≥ 150 px juste avant, pour attendre la remontée
    const prev = walk.filter((o) => !o.sink && o.x + o.w <= sd.x + 2).pop();
    if (!si || sinks[si - 1].x + sinks[si - 1].w < (prev ? prev.x : 0)) {
      if (!prev || prev.w < 150 || sd.x - (prev.x + prev.w) > 160) warn(tag, `${tagk}: pas de plateforme fixe ≥ 150 px juste avant pour attendre la remontée`);
      const sg = (L.signs || []).find((sn) => sn.x <= sd.x && sn.x >= sd.x - 1500);
      if (si === 0 && !sg) warn(tag, `${tagk}: première motte sans panneau de sentier dans les 1500 px avant (annonce de la mécanique)`);
    }
  });
  if (sinks.length) info(tag, `${sinks.length} motte(s) plongeante(s) : passages chronométrés, à valider avec tools/playtest.mjs --human`);
  // Amanites rebondissantes (v7, LEVELS.md §3g) : chapeaux qui relancent vers le haut, au-dessus du vide
  const bns = L.solids.filter((sd) => sd.bounce).sort((a, b) => a.x - b.x);
  bns.forEach((bn, bi) => {
    const tagb = `amanite @${bn.x}`;
    if (bn.kind !== "plank" || !bn.oneWay || bn.move || bn.sink) err(tag, `${tagb}: doit être une passerelle fixe (helper amanite())`);
    if (!(bn.bounce >= 850 && bn.bounce <= 1150)) err(tag, `${tagb}: bounce ${bn.bounce} hors 850–1150`);
    if (bn.w < 120) warn(tag, `${tagb}: largeur ${bn.w} < 120 (cible trop petite)`);
    if (bn.y < 300 || bn.y > 600) err(tag, `${tagb}: hauteur hors [300, 600]`);
    if (L.hazards.some((hz) => hz.x < bn.x + bn.w && hz.x + hz.w > bn.x && hz.y + hz.h === bn.y)) err(tag, `${tagb}: pas de ronce sur une amanite`);
    if (L.solids.some((o) => o !== bn && o.x < bn.x + bn.w && o.x + o.w > bn.x && o.y > bn.y && o.y - bn.y < 200 && (o.kind === "ground" || o.kind === "plank")))
      warn(tag, `${tagb}: un sol juste dessous (l'amanite doit être au-dessus du vide : mécanique illisible)`);
    for (const cp of L.checkpoints) if (cp.x + 60 > bn.x - 120 && cp.x < bn.x + bn.w + 60) err(tag, `${tagb}: trop près du fanion @${cp.x}`);
    if (bn.x < L.spawnX + 600) err(tag, `${tagb}: trop près du départ`);
    if (movers.some((m) => { const e = env(m); return e.x2 > bn.x - 300 && e.x1 < bn.x + bn.w + 300; }) || (L.jets || []).some((jt) => jt.x + jt.w > bn.x - 300 && jt.x < bn.x + bn.w + 300) || (L.gusts || []).some((gu) => gu.x2 > bn.x - 300 && gu.x1 < bn.x + bn.w + 300) || (L.thermals || []).some((tm) => tm.x2 > bn.x - 300 && tm.x1 < bn.x + bn.w + 300) || L.solids.some((sd) => sd.sink && sd.x < bn.x + bn.w + 300 && sd.x + sd.w > bn.x - 300))
      warn(tag, `${tagb}: autre mécanique à moins de 300 px (combinaison peu lisible)`);
    if (bi === 0 && !(L.signs || []).some((sn) => sn.x <= bn.x && sn.x >= bn.x - 1500 && /amanite/i.test(sn.text || ""))) warn(tag, `${tagb}: première amanite sans panneau (texte « amanite ») dans les 1500 px avant`);
  });
  if (bns.length) info(tag, `${bns.length} amanite(s) rebondissante(s) : à valider avec tools/playtest.mjs --human`);
  // Tyroliennes (v8, LEVELS.md §3h) : câbles attrapés en l'air au-dessus des crevasses
  if (L.ziplines != null && !Array.isArray(L.ziplines)) err(tag, `ziplines doit être un tableau (ou absent)`);
  const zls = (L.ziplines || []).slice().sort((a, b) => a.x1 - b.x1);
  zls.forEach((zl, zi) => {
    const tagz = `tyrolienne @${zl.x1}`;
    if (!(zl.x2 - zl.x1 >= 200 && zl.x2 - zl.x1 <= 1000)) err(tag, `${tagz}: longueur ${zl.x2 - zl.x1} hors 200–1000`);
    if (!(zl.y2 >= zl.y1 && (zl.y2 - zl.y1) / (zl.x2 - zl.x1) <= 0.35)) err(tag, `${tagz}: le câble doit descendre (pente 0–0,35)`);
    if (!(zl.speed >= 380 && zl.speed <= 560)) err(tag, `${tagz}: speed ${zl.speed} hors 380–560`);
    if (!((zl.grab ?? 8) >= 8 && (zl.grab ?? 8) <= 90)) err(tag, `${tagz}: grab ${zl.grab} hors 8–90 (poignée trop loin du bord)`);
    const gr = (px) => L.solids.find((sd) => !sd.move && sd.kind === "ground" && px >= sd.x && px <= sd.x + sd.w);
    if (!gr(zl.x1) || !gr(zl.x2)) err(tag, `${tagz}: pylône sans sol dessous (x1 et x2 doivent être au-dessus d'un sol fixe)`);
    const zy = (x) => zl.y1 + ((zl.y2 - zl.y1) * (x - zl.x1)) / (zl.x2 - zl.x1);
    for (const sd of L.solids) {
      const x1 = Math.max(sd.x, zl.x1 + 8), x2 = Math.min(sd.x + sd.w, zl.x2);
      if (x1 >= x2) continue;
      // pieds du coureur en glisse : câble + 118 ; il faut 20 px de marge au-dessus de tout obstacle
      if (Math.max(zy(x1), zy(x2)) + 118 + 20 > sd.y) err(tag, `${tagz}: le coureur en glisse touche ${sd.kind}@${sd.x} (câble trop bas)`);
      if (sd.y - Math.min(zy(x1), zy(x2)) < 118 + 6 + 85 && (sd.kind === "ground" || sd.kind === "plank") && x2 - x1 > 40 && x1 > zl.x1 + 40 && x2 < zl.x2 - 70)
        warn(tag, `${tagz}: un sol sous le câble d'où l'on peut l'attraper en marchant (mécanique sans risque)`);
    }
    for (const cp of L.checkpoints) if (cp.x > zl.x1 - 150 && cp.x < zl.x2 + 60) err(tag, `${tagz}: trop près du fanion @${cp.x}`);
    if (zl.x1 < L.spawnX + 600) err(tag, `${tagz}: trop près du départ`);
    if (L.hazards.some((hz) => hz.x < zl.x2 + 150 && hz.x + hz.w > zl.x2 - 60)) err(tag, `${tagz}: ronce sous le lâcher (150 px après le bout du câble)`);
    if (movers.some((m) => { const e = env(m); return e.x2 > zl.x1 - 300 && e.x1 < zl.x2 + 300; }) || (L.jets || []).some((jt) => jt.x + jt.w > zl.x1 - 300 && jt.x < zl.x2 + 300) || (L.gusts || []).some((gu) => gu.x2 > zl.x1 - 300 && gu.x1 < zl.x2 + 300) || (L.thermals || []).some((tm) => tm.x2 > zl.x1 - 300 && tm.x1 < zl.x2 + 300) || L.solids.some((sd) => (sd.sink || sd.bounce) && sd.x < zl.x2 + 300 && sd.x + sd.w > zl.x1 - 300))
      warn(tag, `${tagz}: autre mécanique à moins de 300 px (combinaison peu lisible)`);
    if (zi === 0 && !(L.signs || []).some((sn) => sn.x <= zl.x1 && sn.x >= zl.x1 - 1500 && /tyrolienne/i.test(sn.text || ""))) warn(tag, `${tagz}: première tyrolienne sans panneau (texte « tyrolienne ») dans les 1500 px avant`);
  });
  if (zls.length) info(tag, `${zls.length} tyrolienne(s) : à valider avec tools/playtest.mjs --human`);
  // Panneaux de sentier (facultatifs, décor) : posés sur un sol, texte court
  if (L.signs != null && !Array.isArray(L.signs)) err(tag, `signs doit être un tableau (ou absent)`);
  for (const sn of L.signs || []) {
    if (typeof sn.text !== "string" || !sn.text.trim()) { err(tag, `panneau @${sn.x}: texte manquant`); continue; }
    if (!L.solids.some((sd) => !sd.move && sd.kind === "ground" && sd.y === sn.y && sn.x - 10 >= sd.x && sn.x + 10 <= sd.x + sd.w)) err(tag, `panneau @${sn.x}: pas planté sur un sol de dessus y=${sn.y}`);
    const lines = sn.text.split("|");
    if (lines.length > 2 || lines.some((t) => t.trim().length > 20)) warn(tag, `panneau @${sn.x}: texte trop long (2 lignes de 20 caractères max, séparées par « | »)`);
    // Balise trop proche d'un panneau (revue 28/10) : planche 164×(16+16·lignes), texte à
    // y ∈ [sol−64−bh, sol−64] ; balise visuelle ≈ 11 px de rayon. Avertissement si une balise
    // est à hauteur du texte et à moins de 40 px du bord horizontal de la planche.
    const bw = 164, bh = 16 + lines.length * 16, top = sn.y - 64 - bh, bot = top + bh;
    const x0 = sn.x - bw / 2, x1 = x0 + bw;
    for (const c of L.coins) {
      if (c.y + 11 < top || c.y - 11 > bot) continue;
      const gap = c.x < x0 ? x0 - c.x : c.x > x1 ? c.x - x1 : 0;
      if (gap < 40) warn(tag, `balise trop proche d'un panneau @${sn.x} (balise @${Math.round(c.x)},${Math.round(c.y)} : ${Math.round(gap)} px < 40)`);
    }
  }
  const cids = new Set(L.coins.map(c => c.id));
  if (cids.size !== L.coins.length) err(tag, `ids de balises en double (utiliser un seul v(id) par niveau)`);
  for (const c of L.coins) if (c.x < 0 || c.x > L.width || c.y < 0 || c.y > 760) warn(tag, `balise hors monde @${c.x},${c.y}`);
  const extra = [movers.length && `${movers.length} passerelle(s) mobile(s)`, (L.rockfalls || []).length && `${L.rockfalls.length} chute(s) de pierres`, (L.patrols || []).length && `${L.patrols.length} patou(s)`, (L.jets || []).length && `${L.jets.length} jet(s) de cascade`, (L.gusts || []).length && `${L.gusts.length} rafale(s) de vent`, L.solids.some((sd) => sd.sink) && `${L.solids.filter((sd) => sd.sink).length} motte(s) plongeante(s)`, (L.thermals || []).length && `${L.thermals.length} ascendance(s)`, L.solids.some((sd) => sd.bounce) && `${L.solids.filter((sd) => sd.bounce).length} amanite(s)`, (L.ziplines || []).length && `${L.ziplines.length} tyrolienne(s)`, (L.signs || []).length && `${L.signs.length} panneau(x)`].filter(Boolean).join(", ");
  for (const a of accepting) if (!a.used) warn(tag, `acceptedWarnings obsolète : "${a.match}" ne correspond plus à aucun avertissement (le retirer)`);
  accepting = [];
  console.log(`ok      [${tag}] ${L.name} — ${L.difficulty} — ${Math.round(L.finishX / 10)} m — ${L.coins.length} balises, ${L.checkpoints.length} fanions${extra ? ", " + extra : ""}`);
});
if (acceptedList.length) console.log(`\nAvertissements acceptés (acceptedWarnings, justifiés dans levels.js) :\n` + acceptedList.map((x) => "  " + x).join("\n"));
console.log(`\n${LEVELS.length} niveaux, ${errors} erreur(s), ${warnings} avertissement(s) non justifié(s), ${acceptedList.length} accepté(s)`);
process.exit(errors ? 1 : 0);
