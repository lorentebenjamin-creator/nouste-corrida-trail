// =====================================================================
//  NOUSTE CORRIDA TRAIL — DONNÉES DES NIVEAUX
//  Ce fichier est le SEUL à modifier pour ajouter un niveau.
//  Il est importé par assets/routes-DUFPCL9U.js (le jeu) : voir LEVELS.md.
//  Règle d'or : on AJOUTE un niveau à la fin de LEVELS, on ne modifie
//  jamais l'`id` d'un niveau existant (les records localStorage en dépendent).
// =====================================================================

// Hauteur du monde (px). Le sol p() descend jusqu'ici.
const WORLD_BOTTOM = 780;

// ---- Helpers de géométrie (mêmes noms que le bundle d'origine) -------
// p(x, w, y)  : bloc de sol plein. x = bord gauche, w = largeur, y = dessus.
export const p = (x, w, y) => ({ x, y, w, h: WORLD_BOTTOM - y, oneWay: false, kind: "ground" });
// m(x, y, w)  : passerelle (planche) traversable par-dessous, 18 px d'épaisseur.
//               ATTENTION à l'ordre : (x, y, w) — différent de p().
export const m = (x, y, w) => ({ x, y, w, h: 18, oneWay: true, kind: "plank" });
// h(x, y)     : rocher 56×48 posé sur un sol dont le dessus est y.
export const h = (x, y) => ({ x, y: y - 48, w: 56, h: 48, oneWay: false, kind: "rock" });
// g(x, y)     : tronc 100×34 posé sur un sol dont le dessus est y.
export const g = (x, y) => ({ x, y: y - 34, w: 100, h: 34, oneWay: false, kind: "log" });
// _(x, w, y)  : ronces (danger mortel), hauteur 30, posées sur un sol de dessus y.
export const _ = (x, w, y) => ({ x, y: y - 30, w, h: 30 });

// v(levelId) : générateur de balises (pièces). line/arc ajoutent des balises.
export function v(levelId) {
  let n = 0;
  const list = [];
  const add = (x, y) => { n += 1; list.push({ id: `${levelId}-${n}`, x, y }); };
  return {
    list,
    // line(x1, x2, y, count) : `count` balises alignées de x1 à x2 à la hauteur y.
    line: (x1, x2, y, count) => {
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        add(x1 + (x2 - x1) * t, y);
      }
    },
    // arc(x1, x2, y, count, lift=52) : arc de balises, sommet `lift` px au-dessus de y.
    arc: (x1, x2, y, count, lift = 52) => {
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        add(x1 + (x2 - x1) * t, y - Math.sin(t * Math.PI) * lift);
      }
    },
  };
}
// y(levelId, x, groundY, index) : point de contrôle (fanion). index commence à 1.
export const y = (levelId, x, groundY, index) => ({ id: `${levelId}-cp${index}`, x, y: groundY });

// ---- Mécaniques v2 (moteur assets/game.js, voir LEVELS.md §3b) --------
// mp(x, y, w, dx, dy, period, phase=0) : PASSERELLE MOBILE (planche 18 px qui porte les coureurs).
//   Va-et-vient en douceur entre (x, y) et (x+dx, y+dy) ; un aller-retour dure `period` s.
//   phase ∈ [0,1[ décale le cycle (0 = départ en (x, y), 0.5 = départ en (x+dx, y+dy)).
//   dx ≠ 0 : bac horizontal au-dessus d'un torrent ; dy < 0 : ascenseur qui monte.
export const mp = (x, y, w, dx, dy, period, phase = 0) => ({
  x, y, w, h: 18, oneWay: true, kind: "plank", move: { x0: x, y0: y, dx, dy, period, phase },
});
// chute(x, yDuSol, period=2.6, phase=0) : CHUTE DE PIERRES — un bloc 34×34 tombe du ciel sur la
//   colonne [x, x+34] jusqu'au sol de dessus yDuSol, toutes les `period` s. Pendant 55 % du cycle
//   une ombre grossit et des graviers tombent (avertissement), puis le bloc tombe (mortel) et éclate.
//   À mettre dans le tableau `rockfalls` du niveau.
export const chute = (x, yDuSol, period = 2.6, phase = 0) => ({
  x, groundY: yDuSol, period, phase, size: 34, top: -60, g: 1800, warn: 0.55,
});
// patou(x1, x2, yDuSol, period=4, phase=0) : PATOU (chien de berger) qui fait la ronde entre x1 et
//   x2 sur un sol de dessus yDuSol ; un aller-retour dure `period` s. Le toucher = retour au fanion :
//   on lui saute par-dessus (54×34). À mettre dans le tableau `patrols` du niveau.
export const patou = (x1, x2, yDuSol, period = 4, phase = 0) => ({
  x1, x2, groundY: yDuSol, period, phase, w: 54, h: 34,
});

// ---- Mécaniques v3 --------------------------------------------------------
// jet(x, w, top, bottom, period=3, on=0.4, phase=0, warn=0.6) : JET DE CASCADE — un rideau d'eau
//   vertical sur la colonne [x, x+w], de y=top à y=bottom. Cycle de `period` s : actif pendant la
//   fraction `on` du cycle (au début du cycle, décalé par `phase` ∈ [0,1[), puis un filet d'eau ;
//   pendant les `warn` s qui précèdent, le filet grossit et l'écume monte (avertissement).
//   Actif, il ne tue pas : il REPOUSSE le coureur en arrière (vx ← −push) et vers le bas
//   (vy ≥ down). Au-dessus d'un ravin, il faut donc passer pendant la pause.
//   À mettre dans le tableau `jets` du niveau.
export const jet = (x, w, top, bottom, period = 3, on = 0.4, phase = 0, warn = 0.6) => ({
  x, w, top, bottom, period, on, phase, warn, push: 260, down: 520,
});

// ---- Mécanique v4 ----------------------------------------------------------
// rafale(x1, x2, period=4.2, on=0.4, phase=0, warn=1.0, slow=0.5) : RAFALE DE VENT DE FACE sur la
//   zone [x1, x2] (toute la hauteur). Cycle de `period` s : soufflante pendant la fraction `on` du
//   cycle (au début du cycle, décalé par `phase` ∈ [0,1[), puis calme. Pendant les `warn` s qui
//   précèdent, les herbes de la zone se couchent de droite à gauche, la manche à air plantée à
//   l'entrée se lève et un panneau « vent » clignote en haut de l'écran.
//   Active, elle ne tue pas : la vitesse de course vers la droite est multipliée par `slow`
//   (au sol et en l'air) → on avance au ralenti et les sauts sont raccourcis (≈ moitié) :
//   un ravin sous la rafale se saute pendant le calme. À mettre dans le tableau `gusts` du niveau.
export const rafale = (x1, x2, period = 4.2, on = 0.4, phase = 0, warn = 1.0, slow = 0.5) => ({
  x1, x2, period, on, phase, warn, slow,
});

// ---- Palettes supplémentaires -----------------------------------------
// Thèmes intégrés au bundle : "forest", "ridge", "col".
// On peut en ajouter ici (toutes les clés sont obligatoires) : le décor est
// entièrement procédural, une palette suffit.
export const THEMES = {
  estive: {
    skyTop: "#1f4a6b", skyMid: "#7fb2c9", skyBot: "#f6dfa4",
    ridge: "#2f5a46", ridge2: "#5f8a5a",
    pine: "#1d3b2c", pine2: "#3f6f45",
    dirt: "#6e5238", dirtDark: "#4a3726",
    grass: "#7fb04f", grassDark: "#5a8a3a",
    wood: "#93633a", woodDark: "#5e3f25",
    rock: "#a49a8c", rockDark: "#6c645a",
    thorn: "#2f2a20", leaf: "#4f7a36", berry: "#c0483c",
    fog: "#12241c",
  },
  pierrier: {
    skyTop: "#1c1a2b", skyMid: "#5b5470", skyBot: "#c9a98a",
    ridge: "#2c2b38", ridge2: "#4b4a5a",
    pine: "#22232c", pine2: "#3d4150",
    dirt: "#5d5853", dirtDark: "#3b3733",
    grass: "#8c877c", grassDark: "#64605a",
    wood: "#6f5440", woodDark: "#45342a",
    rock: "#a7a2a0", rockDark: "#6a6564",
    thorn: "#2a2628", leaf: "#535a48", berry: "#a8473b",
    fog: "#15141c",
  },
  breche: {
    skyTop: "#0f1c33", skyMid: "#5f7fa8", skyBot: "#e9d7c0",
    ridge: "#2b3a52", ridge2: "#8ea2bb",
    pine: "#1d2a35", pine2: "#4b6170",
    dirt: "#5a5650", dirtDark: "#38352f",
    grass: "#c9d3d6", grassDark: "#8d9ba2",
    wood: "#7d5a3c", woodDark: "#4b3526",
    rock: "#b3b8bd", rockDark: "#6f767d",
    thorn: "#2e2a2c", leaf: "#4c5a44", berry: "#b8433a",
    fog: "#121a26",
  },
  cascade: {
    skyTop: "#123b45", skyMid: "#6fa9a8", skyBot: "#e4efe0",
    ridge: "#24483f", ridge2: "#4f7d6c",
    pine: "#16302a", pine2: "#2f5a49",
    dirt: "#5b4a3a", dirtDark: "#3a2f25",
    grass: "#5f9a5a", grassDark: "#3f7344",
    wood: "#7a5434", woodDark: "#4c3420",
    rock: "#8fa3a0", rockDark: "#5a6b69",
    thorn: "#24302a", leaf: "#3f7a4c", berry: "#c2503f",
    fog: "#0f2a2e",
  },
  nuit: {
    skyTop: "#070b1f", skyMid: "#1d2b55", skyBot: "#56588a",
    ridge: "#121a33", ridge2: "#2a3558",
    pine: "#0c1424", pine2: "#1d2e40",
    dirt: "#4d4239", dirtDark: "#2f2923",
    grass: "#5a8463", grassDark: "#3b6047",
    wood: "#7d5c3b", woodDark: "#4b3725",
    rock: "#9196a8", rockDark: "#5a5f70",
    thorn: "#1b1519", leaf: "#3d5e45", berry: "#e8c14a",
    fog: "#05070f",
    // Lisibilité de nuit (revue 19/10) : liseré clair sur les sols/passerelles, gave visible
    // au fond des ravins, lucioles décoratives au-dessus des trous (aucun effet de jeu).
    rim: "#cfe3ff", water: "#14304f", waterHi: "#7fb6e6", fireflies: true,
  },
  hetraie: {
    // Niveau 9 : hêtraie d'automne au petit matin (feuilles rousses, ciel d'octobre)
    skyTop: "#2a3f66", skyMid: "#9db4c8", skyBot: "#f4d9a8",
    ridge: "#5a4a5e", ridge2: "#8a6f72",
    pine: "#7a3416", pine2: "#c4631f",
    dirt: "#6b4a30", dirtDark: "#45301f",
    grass: "#c98a3a", grassDark: "#8f5a24",
    wood: "#8a5a34", woodDark: "#553620",
    rock: "#a39a8f", rockDark: "#6b645c",
    thorn: "#2e2018", leaf: "#7a5a2a", berry: "#b8322a",
    fog: "#1f1612",
  },
  lande: {
    // Niveau 10 : lande ventée du plateau (bruyère mauve, ciel d'averse qui se déchire)
    skyTop: "#27324d", skyMid: "#8696b0", skyBot: "#ecdcc2",
    ridge: "#3b4560", ridge2: "#6e7a95",
    pine: "#2b382f", pine2: "#53664d",
    dirt: "#5e4d40", dirtDark: "#3c3129",
    grass: "#8c9150", grassDark: "#62683a",
    wood: "#7f5e3e", woodDark: "#4e3a27",
    rock: "#a9a59d", rockDark: "#6d6a64",
    thorn: "#2e2430", leaf: "#8a5a96", berry: "#c05aa0",
    fog: "#181b27",
    // Clé facultative (v4) : couleur des touffes d'herbe qui se couchent sous les rafales.
    tuft: "#ece2b4",
  },
};

// =====================================================================
//  NIVEAUX (l'ordre = l'ordre du jeu ; le dernier est le "Niveau du jour")
// =====================================================================
export const LEVELS = [];

// ---------------------------------------------------------------------
// NIVEAU 1 — Sous-bois des cèdres (original)
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "sousbois", c = v(id);
  c.line(180, 520, 320, 4); c.arc(820, 1020, 340, 3, 64); c.line(1120, 1280, 280, 2);
  c.arc(1640, 1860, 350, 3, 58); c.line(2140, 2480, 260, 3); c.line(2860, 3120, 310, 3);
  c.arc(3360, 3620, 350, 3, 70); c.line(3900, 4500, 320, 4);
  return {
    id, name: "Sous-bois des cèdres",
    blurb: "Sentier ombragé. Saute les ronces, ramasse les balises.",
    difficulty: "Balade", theme: "forest",
    width: 5400, floor: 430, spawnX: 70,
    solids: [p(0, 880, 430), h(460, 430), p(980, 700, 430), m(1160, 300, 170), p(1800, 880, 430),
      m(2160, 280, 240), p(2800, 620, 430), g(3040, 430), p(3560, 1700, 430)],
    hazards: [_(1240, 86, 430), _(2140, 72, 430), _(2420, 72, 430), _(4120, 96, 430)],
    coins: c.list,
    checkpoints: [y(id, 1880, 430, 1), y(id, 3640, 430, 2)],
    finishX: 4980,
    rivals: [{ speed: 0.93 }, { speed: 0.84 }, { speed: 0.74 }],
    medals: { auto: 13.9, gold: 16, silver: 19, bronze: 22.5 }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)
    // Avertissements de check-levels examinés et acceptés (LEVELS.md §6b) :
    acceptedWarnings: [
      { match: "ronce @2140 trop près du fanion @1880", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : ronce à 260 px du fanion, rivaux lents (≤ 0,93)." },
    ],
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 2 — La crête (original)
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "crete", c = v(id);
  c.line(160, 420, 310, 3); c.arc(560, 800, 350, 3, 60); c.line(980, 1180, 226, 3);
  c.arc(1680, 1920, 286, 3, 54); c.line(2100, 2360, 206, 2); c.arc(2320, 2580, 360, 3, 66);
  c.line(2920, 3080, 270, 2); c.line(3180, 3320, 250, 2); c.line(3460, 3600, 280, 2);
  c.arc(4000, 4300, 350, 3, 58); c.line(4700, 5200, 310, 3); c.line(5600, 6100, 290, 3);
  return {
    id, name: "La crête",
    blurb: "Dalles, troncs et une traversée de passerelles.",
    difficulty: "Rythme", theme: "ridge",
    width: 7000, floor: 430, spawnX: 64,
    solids: [p(0, 600, 430), p(730, 480, 430), h(920, 430), p(1330, 420, 356), p(1870, 500, 356),
      p(2510, 420, 430), m(2980, 330, 170), m(3240, 260, 150), m(3480, 330, 170), p(3700, 480, 430),
      p(4320, 400, 430), h(4480, 430), p(4860, 1960, 430), g(5600, 430)],
    hazards: [_(360, 74, 430), _(1560, 70, 356), _(2060, 68, 356), _(2720, 80, 430),
      _(3980, 78, 430), _(5200, 84, 430), _(5480, 70, 430)],
    coins: c.list,
    checkpoints: [y(id, 1400, 356, 1), y(id, 2580, 430, 2), y(id, 3780, 430, 3)],
    finishX: 6460,
    rivals: [{ speed: 0.97 }, { speed: 0.88 }, { speed: 0.78 }],
    medals: { auto: 18.1, gold: 21, silver: 24.5, bronze: 29 }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)
    // Avertissements de check-levels examinés et acceptés (LEVELS.md §6b) :
    acceptedWarnings: [
      { match: "ronce @360 trop près du départ", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : première ronce d'apprentissage, le compte à rebours ne verrouille pas les rivaux comme une réapparition." },
      { match: "ronce @1560: seulement 190 px avant le bord", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : le sol suivant est au même niveau, on enchaîne ronce + saut." },
      { match: "ronce @1560 trop près du fanion @1400", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé)." },
      { match: "ronce @2720: seulement 210 px avant le bord", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : saut suivant vers une passerelle basse." },
      { match: "ronce @2720 trop près du fanion @2580", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé)." },
      { match: "ronce @3980: seulement 200 px avant le bord", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé)." },
      { match: "ronce @3980 trop près du fanion @3780", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé)." },
      { match: "rock @4480: seulement 240 px avant le bord", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : ravin suivant étroit." },
      { match: "fanion @1400: moins de 360 px de sol après", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : rivaux jamais en boucle au playtest." },
      { match: "fanion @2580: moins de 360 px de sol après", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : rivaux jamais en boucle au playtest." },
    ],
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 3 — Col du vent (original)
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "col", c = v(id);
  c.line(150, 380, 320, 3); c.arc(500, 740, 370, 3, 62); c.line(900, 1200, 240, 3);
  c.arc(1500, 1760, 310, 3, 50); c.line(1900, 2200, 190, 3); c.arc(2500, 2780, 370, 3, 68);
  c.line(3000, 3400, 280, 3); c.line(3600, 3900, 250, 3); c.arc(4300, 4600, 360, 3, 60);
  c.line(4900, 5400, 250, 3); c.line(5800, 6400, 290, 4); c.arc(6800, 7200, 360, 3, 64);
  return {
    id, name: "Col du vent",
    blurb: "Le col se referme. Léa ne lâche rien.",
    difficulty: "Hors-piste", theme: "col",
    width: 8200, floor: 440, spawnX: 60,
    solids: [p(0, 520, 440), p(660, 420, 440) /* 380→420 (revue 20/10) : 260 px après le rocher, écart 100 */, h(820, 440), p(1180, 460, 380), p(1760, 420, 380),
      g(1900, 380), p(2300, 380, 320), p(2800, 460, 440), m(3320, 344, 160), m(3560, 276, 150),
      m(3800, 340, 160), p(4020, 360, 440), p(4520, 340, 440), p(5000, 480, 380), h(5220, 380),
      p(5620, 2400, 440)],
    hazards: [_(300, 70, 440), _(860, 64, 440), _(1400, 72, 380), _(1980, 70, 380), _(2460, 68, 320),
      _(3000, 80, 440), _(4200, 74, 440), _(5180, 64, 380), _(6000, 86, 440), _(6320, 74, 440),
      _(6680, 70, 440)],
    coins: c.list,
    checkpoints: [y(id, 1240, 380, 1), y(id, 2860, 440, 2), y(id, 5080, 380, 3)],
    finishX: 7620,
    rivals: [{ speed: 0.99 }, { speed: 0.9 }, { speed: 0.82 }],
    medals: { auto: 21.6, gold: 25, silver: 29.5, bronze: 35 }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)
    // Avertissements de check-levels examinés et acceptés (LEVELS.md §6b) :
    acceptedWarnings: [
      { match: "ground@4520→ground@5000: montée 60 px avec écart 140 px", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : seule montée longue du niveau, pilote pressé sans chute à cet endroit." },
      { match: "ronce @300: seulement 220 px avant le bord", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : ronce d'apprentissage, sol suivant au même niveau." },
      { match: "ronce @300 trop près du départ", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : ronce d'apprentissage juste après le départ." },
      { match: "ronce @860: seulement 220 px avant le bord", reason: "Ronce collée au rocher @820 qui la recouvre en partie : on franchit rocher + ronce d'un seul saut, la règle « rocher » (260 px) est respectée depuis la revue du 20/10." },
      { match: "ronce @1400 trop près du fanion @1240", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé)." },
      { match: "ronce @1980: seulement 200 px avant le bord", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : saut suivant en descente." },
      { match: "ronce @2460: seulement 220 px avant le bord", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé) : saut suivant en descente (320 → 440)." },
      { match: "ronce @3000 trop près du fanion @2860", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé)." },
      { match: "ronce @4200: seulement 180 px avant le bord", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé)." },
      { match: "ronce @5180 trop près du fanion @5080", reason: "Niveau d'origine (bundle), validé par le playtest humain (≥ 95 % en profil pressé)." },
    ],
  };
})());

// >>> NOUVEAUX NIVEAUX : ajouter les blocs LEVELS.push(...) ci-dessous, dans l'ordre. <<<

// ---------------------------------------------------------------------
// NIVEAU 4 — La Brèche aux Isards (ajouté le 2026-10-17)
// Plus long et plus technique que le Col du vent : ressauts, deux
// traversées de passerelles au-dessus du vide, une montée en escalier
// jusqu'à la brèche (dessus à y=260) puis une descente semée de ronces.
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "breche", c = v(id);
  // Balises : lignes ≈70 px au-dessus du sentier (ramassées en courant),
  // arcs au-dessus des sauts (ramassées en sautant).
  c.line(180, 300, 370, 2); c.arc(470, 560, 330, 3, 40); c.arc(780, 900, 320, 3, 40);
  c.arc(1080, 1150, 340, 3, 40); c.arc(1350, 1470, 300, 3, 40); c.arc(1610, 1690, 270, 3, 40);
  c.arc(1890, 2010, 230, 3, 40); c.arc(2140, 2240, 200, 3, 40); c.arc(2450, 2610, 250, 3, 40);
  c.line(2700, 2900, 370, 3);
  c.line(3260, 3340, 280, 2); c.line(3510, 3580, 220, 2); c.line(3750, 3830, 260, 2); c.line(3990, 4070, 200, 2);
  c.arc(4600, 4670, 330, 3, 40); c.arc(4880, 5000, 300, 3, 40); c.line(5060, 5200, 310, 2);
  c.arc(5320, 5440, 240, 3, 40); c.arc(5560, 5660, 220, 3, 40); c.arc(5880, 6000, 180, 3, 40);
  c.line(6060, 6360, 190, 4);
  c.arc(6420, 6560, 200, 3, 40); c.arc(6760, 6830, 250, 3, 40); c.arc(7020, 7160, 280, 3, 40);
  c.line(7590, 7670, 280, 2); c.line(7840, 7910, 230, 2); c.line(8080, 8160, 280, 2);
  c.arc(8200, 8340, 300, 3, 40); c.arc(8760, 8840, 330, 3, 40); c.arc(9100, 9220, 300, 3, 40);
  c.arc(9370, 9440, 270, 3, 40); c.arc(9620, 9760, 280, 3, 40);
  c.arc(10000, 10080, 330, 3, 40); c.arc(10320, 10420, 330, 3, 40); c.arc(10650, 10730, 330, 3, 40);
  c.line(10780, 10880, 370, 3);
  return {
    id, name: "La Brèche aux Isards",
    blurb: "Pierriers, passerelles au-dessus du vide et une descente à fond. Les isards passent, et toi ?",
    difficulty: "Haute route", theme: "breche",
    width: 11600, floor: 440, spawnX: 60,
    solids: [
      // Départ et ressauts
      p(0, 760, 440),
      p(910, 440, 440), h(1080, 440),
      p(1470, 420, 370),
      p(2010, 440, 300), g(2140, 300),
      p(2610, 520, 440),
      // Première traversée de passerelles
      m(3220, 350, 160), m(3470, 290, 150), m(3710, 330, 160), m(3960, 270, 150),
      p(4200, 680, 440),
      // Montée en escalier vers la brèche
      p(5000, 320, 380),
      p(5440, 440, 320), g(5560, 320),
      p(6000, 420, 260),
      // Descente technique
      p(6560, 460, 350),
      p(7160, 300, 440),
      // Seconde traversée (au-dessus du vide)
      m(7550, 350, 160), m(7800, 300, 150), m(8040, 350, 160),
      p(8340, 760, 440),
      p(9220, 400, 380),
      // Dernier sprint jusqu'à l'arche
      p(9760, 1700, 440), g(10320, 440),
    ],
    hazards: [
      _(480, 70, 440),
      _(1620, 64, 370),
      _(4600, 72, 440),
      _(6760, 64, 350),
      _(8760, 72, 440),
      _(9370, 70, 380),
      _(10000, 80, 440),
      _(10650, 74, 440),
    ],
    coins: c.list,
    checkpoints: [y(id, 2650, 440, 1), y(id, 4230, 440, 2), y(id, 6020, 260, 3), y(id, 8370, 440, 4)],
    finishX: 10900,
    rivals: [{ speed: 1.0 }, { speed: 0.92 }, { speed: 0.85 }],
    medals: { auto: 30.8, gold: 35.5, silver: 42, bronze: 49.5 }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 5 — L'Estive des Patous (ajouté le 2026-10-17, branche ameliorations)
// Découverte des mécaniques v2 : patous qui gardent l'estive, bacs mobiles
// au-dessus du gave, un ascenseur de berger et un chemin double (haut/bas).
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "estive", c = v(id);
  c.line(160, 300, 370, 3); c.arc(400, 500, 330, 3, 40); c.arc(700, 860, 320, 4, 50);
  c.arc(960, 1100, 320, 3, 40); c.arc(1180, 1260, 340, 3, 40);
  c.arc(1520, 1980, 320, 5, 50);
  c.line(2120, 2300, 370, 3); c.arc(2420, 2500, 330, 3, 40); c.arc(2700, 2840, 300, 3, 40);
  c.line(2930, 3020, 290, 2); c.line(3150, 3240, 230, 2); c.line(3390, 3500, 210, 3); c.line(3620, 3700, 260, 2);
  c.arc(3800, 3940, 300, 3, 40); c.line(4000, 4300, 310, 3);
  c.line(4460, 4520, 150, 2); c.line(4700, 4900, 130, 3);
  c.arc(4980, 5120, 160, 3, 40); c.arc(5420, 5560, 250, 3, 40); c.arc(5600, 5860, 290, 4, 50);
  c.arc(5880, 6020, 330, 3, 40); c.line(6100, 6500, 370, 4);
  c.line(6720, 6800, 250, 2); c.line(6960, 7060, 260, 2);
  c.line(7360, 7460, 370, 2); c.arc(7520, 7780, 320, 4, 50); c.arc(8100, 8400, 310, 4, 40);
  c.arc(8960, 9050, 330, 3, 40); c.arc(9240, 9340, 330, 3, 40); c.line(9380, 9500, 370, 3);
  return {
    id, name: "L'Estive des Patous",
    blurb: "Les patous gardent le troupeau, les bacs traversent le gave. Choisis ton passage.",
    difficulty: "Technique", theme: "estive",
    width: 9800, floor: 440, spawnX: 60,
    solids: [
      // Estive : premier patou
      p(0, 960, 440),
      p(1100, 380, 440), h(1200, 440),
      // Le gave : un bac mobile (attendre qu'il revienne)
      mp(1560, 420, 140, 220, 0, 4.2),
      p(2060, 640, 440),
      // Chemin double : en bas un patou et des ronces, en haut des passerelles
      p(2840, 960, 440),
      m(2900, 350, 150), m(3120, 290, 150), m(3360, 270, 170), m(3600, 320, 150),
      p(3920, 500, 380), // quai de l'ascenseur allongé de 60 px (revue 19/10) : on embarque sans grand saut
      // L'ascenseur du berger jusqu'à la cabane
      mp(4440, 380, 150, 0, -200, 4.8), // élargi 120→150 et ralenti 4,2→4,8 s (revue 19/10)
      { ...p(4420, 195, 470), net: true }, // prairie basse (filet, net:true) sous l'ascenseur (revue 19/10) : un embarquement raté coûte du temps, plus une chute
      p(4615, 365, 200), // seuil de la cabane avancé de 25 px (revue 19/10) : plus de fente où tomber
      // Descente en terrasses
      p(5120, 300, 290),
      p(5560, 320, 380),
      p(6020, 600, 440),
      // Second gave : un bac qui monte et descend, un bac qui va et vient
      mp(6700, 400, 150, 0, -120, 3.2), // 130→150 (revue 19/10)
      mp(6920, 330, 150, 160, 0, 3.0, 0.5), // 130→150 (revue 19/10)
      p(7300, 700, 440),
      // Dernier bac, puis le sprint vers la cabane
      mp(8080, 420, 160, 200, 0, 4.0, 0.25), // 140→160 (revue 19/10)
      p(8560, 1240, 440), g(9240, 440),
    ],
    hazards: [
      _(420, 70, 440),
      _(3500, 70, 440),
      _(8960, 72, 440),
    ],
    rockfalls: [],
    patrols: [
      patou(620, 940, 440, 4.2),
      patou(2980, 3380, 440, 3.4),
      patou(5600, 5860, 380, 2.8),
      patou(7500, 7900, 440, 3.6, 0.3),
    ],
    coins: c.list,
    checkpoints: [y(id, 2080, 440, 1), y(id, 3960, 380, 2), y(id, 6040, 440, 3), y(id, 7320, 440, 4), y(id, 8580, 440, 5)],
    finishX: 9400,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 31.8, gold: 37, silver: 43, bronze: 51 }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 6 — Le Couloir des Pierres (ajouté le 2026-10-17, branche ameliorations)
// Le plus dur : pierrier sous l'orage (chutes de pierres à lire à l'ombre),
// montée en cheminée jusqu'à y=170, bacs et ascenseur au-dessus du vide,
// patous, et un dernier couloir où les pierres tombent en cadence.
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "couloir", c = v(id);
  c.line(150, 290, 370, 3); c.arc(360, 460, 330, 3, 40); c.arc(540, 640, 330, 3, 40);
  c.arc(900, 1020, 300, 3, 40); c.line(1080, 1180, 310, 2); c.arc(1280, 1380, 270, 3, 40);
  c.arc(1540, 1620, 280, 3, 40); c.line(1650, 1740, 230, 2); c.line(1880, 1960, 150, 2);
  c.line(2110, 2170, 100, 2); c.line(2340, 2600, 100, 4);
  c.arc(2660, 2800, 140, 3, 40); c.line(2840, 3080, 190, 3); c.arc(3120, 3260, 230, 3, 40);
  c.line(3300, 3580, 280, 3); c.arc(3620, 3760, 320, 3, 40); c.line(3800, 3980, 370, 3);
  c.arc(4120, 4400, 320, 4, 50);
  c.line(4640, 4720, 330, 2); c.line(5110, 5190, 290, 2); c.line(5350, 5420, 230, 2);
  c.line(5600, 5900, 160, 4); c.arc(5960, 6100, 200, 3, 40); c.line(6140, 6360, 250, 3);
  c.arc(6400, 6540, 280, 3, 40); c.line(6580, 6800, 340, 3); c.arc(6840, 6980, 330, 3, 40);
  c.line(7040, 7160, 370, 2); c.arc(7180, 7300, 320, 3, 50);
  c.arc(7620, 7960, 320, 5, 50); c.arc(8120, 8230, 330, 3, 40); c.arc(8460, 8560, 330, 3, 40);
  c.arc(8700, 8820, 330, 3, 40); c.arc(9000, 9300, 320, 4, 40);
  c.arc(9700, 9760, 330, 3, 40); c.arc(9900, 9990, 330, 3, 40); c.line(10100, 10250, 370, 3);
  return {
    id, name: "Le Couloir des Pierres",
    blurb: "L'orage gronde, le pierrier se réveille. Lis les ombres, ne t'arrête jamais sous la falaise.",
    difficulty: "Extrême", theme: "pierrier",
    width: 10800, floor: 440, spawnX: 60,
    solids: [
      // Pied du pierrier : premières pierres
      p(0, 900, 440),
      p(1020, 520, 380),
      // La cheminée : passerelles en escalier puis ascenseur
      m(1620, 300, 150), m(1850, 220, 150),
      mp(2080, 220, 130, 0, -80, 3.0),
      p(2300, 380, 170),
      // Descente sous les pierres
      p(2800, 320, 260),
      p(3260, 360, 350),
      p(3760, 760, 440),
      // Au-dessus du vide : bac, passerelle, ascenseur
      mp(4600, 400, 140, 200, 0, 3.8),
      m(5080, 360, 140),
      mp(5320, 360, 130, 0, -140, 3.6),
      p(5560, 400, 230),
      // Dernières terrasses
      p(6100, 300, 320),
      p(6540, 300, 410),
      // Le couloir final
      p(6980, 1900, 440), g(8600, 440),
      // Le dernier ravin : un bac, puis l'arche
      mp(8980, 400, 140, 180, 0, 3.8),
      p(9440, 1300, 440),
    ],
    hazards: [
      _(8150, 72, 440),
      _(9900, 72, 440),
    ],
    rockfalls: [
      chute(400, 440, 2.4),
      chute(580, 440, 2.4, 0.5),
      chute(1180, 380, 2.2, 0.5),
      chute(2480, 170, 2.0),
      chute(3420, 350, 2.4, 0.3),
      chute(5800, 230, 2.0, 0.6),
      chute(7200, 440, 2.2),
      chute(7280, 440, 2.2, 0.5),
      chute(8480, 440, 2.2, 0.25),
      chute(8780, 440, 2.2, 0.7),
      chute(9700, 440, 2.4, 0.4),
    ],
    patrols: [
      patou(4080, 4440, 440, 3.2),
      patou(7600, 7980, 440, 3.4),
    ],
    coins: c.list,
    checkpoints: [y(id, 1040, 380, 1), y(id, 2320, 170, 2), y(id, 3780, 440, 3), y(id, 5580, 230, 4), y(id, 7000, 440, 5), y(id, 9460, 440, 6)],
    finishX: 10300,
    rivals: [{ speed: 1.0 }, { speed: 0.94 }, { speed: 0.88 }],
    medals: { auto: 29.4, gold: 34, silver: 40, bronze: 47.5 }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 7 — La Cascade des Desmans (niveau du jour, 2026-10-18)
// Gorges humides : passerelles au-dessus de la cascade, deux radeaux lents
// sur la vasque, terrasses moussues et un patou au bord de l'eau.
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "cascade-desmans", c = v(id);
  c.line(160, 420, 370, 4); c.arc(820, 960, 360, 3, 40); c.line(1180, 1340, 330, 3);
  c.arc(1380, 1510, 330, 3, 40); c.arc(1570, 1720, 270, 3, 50); c.line(1760, 1940, 270, 3);
  c.arc(1990, 2140, 300, 3, 40); c.arc(2300, 2440, 260, 3, 40); c.arc(2590, 2730, 250, 3, 40);
  c.arc(2890, 3030, 290, 3, 40); c.line(3100, 3400, 370, 4); c.arc(3460, 3540, 330, 3, 40);
  c.arc(3830, 3980, 350, 3, 40); c.line(4000, 4300, 350, 4); c.arc(4320, 4470, 350, 3, 40);
  c.line(4520, 5000, 370, 5); c.arc(5110, 5240, 330, 3, 40); c.arc(5320, 5400, 260, 3, 40);
  c.arc(5660, 5790, 260, 3, 40); c.line(5830, 6150, 230, 4); c.arc(6190, 6340, 260, 3, 40);
  c.line(6380, 6680, 310, 4); c.arc(6720, 6870, 330, 3, 40); c.line(6920, 7240, 370, 4);
  c.arc(7770, 7920, 350, 3, 40); c.line(7940, 8220, 350, 4); c.arc(8240, 8390, 350, 3, 40);
  c.line(8440, 8740, 370, 4); c.arc(8780, 8880, 330, 3, 40); c.arc(9180, 9320, 330, 3, 40);
  c.line(9340, 9450, 370, 2);
  return {
    id, name: "La Cascade des Desmans",
    blurb: "Passerelles trempées, radeaux sur la vasque et un patou au bord de l'eau. Le desman te regarde passer.",
    difficulty: "Engagé", theme: "cascade",
    width: 9900, floor: 440, spawnX: 60,
    solids: [
      // Le sentier des gorges
      p(0, 820, 440),
      p(950, 430, 400), h(1060, 400),
      p(1510, 480, 340), g(1600, 340),
      // Les passerelles de la cascade
      m(2140, 340, 160), m(2430, 290, 160), m(2730, 330, 160), // entre les 2 dernières : le jet
      p(3030, 800, 440),
      // La vasque : un radeau lent
      mp(3980, 420, 140, 200, 0, 4.4),
      p(4470, 640, 440),
      // Terrasses moussues
      p(5240, 420, 370),
      p(5790, 400, 300),
      p(6340, 380, 380),
      // Le bord de l'eau : un patou
      p(6870, 900, 440),
      // Second radeau, puis le sprint vers l'arche
      mp(7920, 420, 140, 180, 0, 4.0, 0.5),
      p(8390, 1400, 440), g(9200, 440),
    ],
    hazards: [
      _(500, 70, 440),
      _(3460, 72, 440),
      _(5330, 64, 370),
      _(8800, 74, 440),
    ],
    rockfalls: [],
    patrols: [
      patou(7300, 7640, 440, 3.6),
    ],
    // Passage clé : le Jet des Desmans tombe sur le ravin entre les passerelles 2 et 3.
    // 1,2 s d'eau puis 1,8 s de pause : attendre sur la passerelle, sauter dans la pause.
    jets: [
      jet(2632, 64, -400, 720, 3.0, 0.4, 0.7),
    ],
    coins: c.list,
    checkpoints: [y(id, 3060, 440, 1), y(id, 4490, 440, 2), y(id, 5810, 300, 3), y(id, 6890, 440, 4), y(id, 8410, 440, 5)],
    finishX: 9500,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 31.7, gold: 36.5, silver: 43, bronze: 51 }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 8 — Le Gué des Lucioles (niveau du jour, 2026-10-19)
// Trail de nuit (palette "nuit") : ressauts, descente vers le gave, le radeau
// du gué qui passe sous une cascade, terrasses, passerelles et deux patous.
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "gue-lucioles", c = v(id);
  c.line(160, 420, 370, 4); c.arc(820, 940, 360, 3, 40); c.line(1170, 1360, 330, 3);
  c.arc(1380, 1500, 320, 3, 40); c.line(1730, 1940, 270, 3); c.arc(1990, 2130, 290, 3, 40);
  c.line(2200, 2500, 370, 4); c.arc(2560, 2680, 330, 3, 40); c.line(2720, 2860, 370, 2);
  c.arc(3000, 3300, 330, 4, 40); c.line(3500, 3800, 370, 4); c.arc(3860, 4100, 330, 3, 40);
  c.arc(4140, 4280, 320, 3, 40); c.line(4320, 4660, 300, 4); c.arc(4700, 4830, 270, 3, 40);
  c.line(4900, 5200, 230, 4); c.arc(5250, 5400, 240, 3, 40); c.arc(5550, 5690, 210, 3, 40);
  c.arc(5840, 5980, 240, 3, 40); c.line(6000, 6180, 270, 3); c.arc(6200, 6300, 230, 3, 40);
  c.arc(6540, 6680, 310, 3, 40); c.line(6760, 7500, 370, 6); c.arc(7640, 7980, 330, 4, 40);
  c.line(8120, 8500, 370, 4); c.arc(8600, 8960, 330, 4, 50); c.arc(9180, 9320, 330, 3, 40);
  c.line(9450, 9540, 370, 2);
  return {
    id, name: "Le Gué des Lucioles",
    blurb: "Trail de nuit à la frontale : le radeau du gué passe sous la cascade. Attends la pause, les lucioles t'éclairent.",
    difficulty: "Très engagé", theme: "nuit",
    width: 10000, floor: 440, spawnX: 60,
    solids: [
      // Le départ dans le noir : ressauts
      p(0, 820, 440),
      p(950, 430, 400), h(1060, 400),
      p(1510, 480, 340), g(1600, 340),
      // Descente vers le gave
      p(2130, 760, 440),
      // Passage clé : le radeau du gué, dont l'embarcadère est sous la cascade
      mp(2920, 420, 125, 240, 0, 4.4), // 140→125 et 4,6→4,4 s (revue 19/10)
      p(3440, 700, 440),
      // Terrasses de la rive droite
      p(4270, 430, 370),
      p(4830, 420, 300),
      // Passerelles dans la nuit
      m(5410, 300, 140), m(5680, 260, 140), // 150→115/125 (revue 19/10) → 140/140 (revue 20/10) : écarts 130 (montée 40) et 160
      p(5980, 560, 340),
      // Le second radeau
      p(6680, 900, 440),
      mp(7610, 420, 120, 200, 0, 3.6, 0.5), // 140→120 et 4,0→3,6 s (revue 19/10)
      // Le sprint final, gardé par un patou
      p(8090, 1800, 440), g(9200, 440),
    ],
    hazards: [
      _(500, 70, 440),
      _(2580, 64, 440), // 72→64 (revue 19/10) : ce n'est pas la ronce qui doit faire le niveau
      _(6220, 64, 340),
      // Rive gauche : deux ronces en rythme avant le second radeau
      _(7080, 64, 440), _(7320, 64, 440),
      _(9380, 70, 440),
    ],
    rockfalls: [],
    patrols: [
      patou(3860, 4100, 440, 3.4),
      patou(4300, 4640, 370, 2.6, 0.5), // revue 19/10 : un patou sur la terrasse
      patou(8600, 8900, 440, 2.8, 0.3), // 3,4→2,8 s (revue 19/10)
    ],
    // Passage clé : la cascade du gué tombe sur l'embarcadère du radeau (jamais vu : jet + bac).
    // 1,44 s d'eau puis 1,76 s de pause, sur un cycle (3,2 s) différent de celui du radeau (4,6 s) :
    // attendre au bord que le radeau soit là ET que l'eau s'arrête, puis embarquer.
    jets: [
      jet(2960, 56, -400, 720, 3.2, 0.5, 0.2),
      // Un second filet entre les deux passerelles de la nuit (attendre sur la première).
      jet(5590, 56, -400, 720, 2.7, 0.55, 0.25),
      // Revue 19/10 : un troisième filet sur le saut qui redescend vers le second radeau.
      jet(6580, 56, -400, 720, 3.0, 0.5, 0.6),
    ],
    coins: c.list,
    checkpoints: [y(id, 2160, 440, 1), y(id, 3470, 440, 2), y(id, 4860, 300, 3), y(id, 6710, 440, 4), y(id, 8110, 440, 5)],
    finishX: 9560,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.87 }],
    medals: { auto: 29.8, gold: 34.5, silver: 40.5, bronze: 48 }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)
    // Avertissements de check-levels examinés et acceptés (LEVELS.md §6b) :
    acceptedWarnings: [
      { match: "passerelle mobile @2920: rapide (171 px/s)", reason: "Radeau accéléré volontairement à la revue du 19/10 (4,6 → 4,4 s) pour un niveau « Très engagé » ; validé playtest auto et humain." },
      { match: "passerelle mobile @7610: rapide (175 px/s)", reason: "Second radeau accéléré volontairement à la revue du 19/10 (4,0 → 3,6 s) ; validé playtest auto et humain." },
    ],
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 9 — La Hêtraie des Palombes (niveau du jour, 2026-10-20)
// Niveau classique (règle d'alternance) — nouveauté : la palombière, des ronces
// posées SUR les passerelles perchées au-dessus du vide (jamais vu : jusqu'ici les
// ronces étaient toujours au sol). Aucune mécanique v2/v3 : sols, ravins, ronces,
// rochers, troncs, passerelles fixes et fanions, sur le modèle du niveau 4.
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "hetraie-palombes", c = v(id);
  c.line(160, 400, 370, 3); c.arc(450, 560, 330, 3, 40); c.arc(800, 900, 330, 3, 40);
  c.arc(1060, 1160, 330, 3, 40); c.arc(1380, 1480, 300, 3, 40); c.arc(1620, 1720, 260, 3, 40);
  c.arc(1940, 2040, 240, 3, 40); c.arc(2140, 2280, 200, 3, 40); c.arc(2480, 2600, 270, 3, 40);
  c.line(2700, 3000, 370, 4);
  c.arc(3180, 3300, 300, 3, 40); c.line(3330, 3430, 290, 2); c.line(3620, 3710, 230, 2);
  c.line(3900, 3990, 190, 2); c.arc(4010, 4110, 150, 3, 40); c.line(4180, 4320, 190, 3);
  c.arc(4360, 4480, 200, 3, 40); c.line(4500, 4620, 230, 2); c.arc(4640, 4740, 190, 3, 40);
  c.line(4800, 4920, 230, 2); c.arc(4960, 5080, 260, 3, 40);
  c.line(5150, 5450, 370, 4); c.arc(5490, 5570, 330, 3, 40);
  c.arc(5830, 5950, 300, 3, 40); c.arc(6060, 6160, 250, 3, 40); c.arc(6350, 6470, 230, 3, 40);
  c.arc(6590, 6710, 180, 3, 40); c.arc(6910, 7030, 160, 3, 40); c.line(7100, 7400, 180, 4);
  c.arc(7450, 7600, 220, 3, 40); c.arc(7760, 7860, 220, 3, 40); c.arc(8040, 8190, 300, 3, 40);
  c.line(8260, 8520, 370, 3); c.arc(8570, 8700, 330, 3, 40); c.line(8720, 8840, 290, 2);
  c.arc(8860, 8980, 260, 3, 40); c.line(9000, 9110, 240, 2); c.arc(9130, 9250, 260, 3, 40);
  c.line(9270, 9390, 280, 2); c.arc(9410, 9540, 300, 3, 40);
  c.line(9620, 9900, 370, 3); c.arc(9980, 10090, 330, 3, 40); c.arc(10300, 10440, 330, 3, 40);
  c.arc(10680, 10820, 330, 3, 40); c.arc(10980, 11090, 330, 3, 40); c.line(11120, 11220, 370, 3);
  return {
    id, name: "La Hêtraie des Palombes",
    blurb: "Hêtres roux d'octobre et palombière perchée : les ronces ont envahi les planches, saute-les sans tomber.",
    difficulty: "Endurance", theme: "hetraie",
    width: 11640, floor: 440, spawnX: 60,
    solids: [
      // Départ sous les hêtres, puis ressauts vers la lisière
      p(0, 780, 440),
      p(920, 440, 440), h(1080, 440),
      p(1480, 440, 370),
      p(2040, 420, 310), g(2160, 310),
      p(2610, 560, 440),
      // Passage clé : la palombière — passerelles perchées au-dessus du vide, envahies de ronces
      m(3300, 360, 160), m(3590, 300, 150),
      m(3870, 260, 460), // planche longue : une ronce posée dessus (voir hazards)
      m(4480, 300, 450), // seconde planche longue, seconde ronce
      p(5070, 760, 440), h(5500, 440),
      // Le chaos de blocs : montée vers le belvédère
      p(5950, 400, 380),
      p(6470, 440, 310), g(6600, 310),
      p(7030, 410, 250),
      // Descente dans les feuilles mortes
      p(7600, 430, 350),
      p(8190, 380, 440),
      // Les passerelles du ruisseau
      m(8700, 360, 150), m(8980, 310, 150), m(9250, 350, 150),
      // Dernier sprint jusqu'à l'arche
      p(9540, 760, 440),
      p(10440, 1100, 440), g(10700, 440),
    ],
    hazards: [
      _(470, 70, 440),
      _(1640, 64, 370),
      // Passage clé : ronces sur les planches de la palombière (sauter sans quitter la planche)
      _(4030, 64, 260),
      _(4660, 76, 300),
      _(6080, 64, 380),
      _(7780, 64, 350),
      _(10000, 70, 440),
      _(11000, 74, 440),
    ],
    coins: c.list,
    checkpoints: [y(id, 2640, 440, 1), y(id, 5100, 440, 2), y(id, 7050, 250, 3), y(id, 9570, 440, 4)],
    finishX: 11200,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 31.6, gold: 36.5, silver: 43, bronze: 51 }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 10 — Le Plateau des Bérets Envolés (niveau du jour, 2026-10-21)
// Niveau à mécaniques (alternance : après le classique N°9) — mécanique INÉDITE v4 :
// les RAFALES DE VENT DE FACE (helper rafale, tableau `gusts`). Quand les herbes se couchent
// (de droite à gauche) et que la manche à air se lève, une rafale arrive : on court au ralenti
// et les sauts sont raccourcis de moitié. Les ravins sous la rafale se sautent pendant le calme.
// Aucune autre mécanique v2/v3 (ni bac, ni patou, ni pierres, ni jet) : sols, ravins, ronces,
// rochers, tronc, passerelles fixes et le vent.
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "plateau-berets", c = v(id);
  c.line(160, 400, 370, 3); c.arc(450, 560, 330, 3, 40); c.arc(820, 960, 360, 3, 40);
  c.line(1150, 1340, 330, 3); c.arc(1380, 1510, 300, 3, 40); c.line(1600, 1900, 270, 4);
  c.arc(1970, 2110, 340, 3, 40); c.line(2200, 2700, 370, 5); c.arc(2810, 2930, 340, 3, 40);
  c.line(3000, 3400, 370, 4); c.arc(3450, 3580, 320, 3, 40); c.line(3800, 3950, 310, 2);
  c.arc(3980, 4110, 270, 3, 40); c.line(4200, 4500, 250, 3); c.arc(4530, 4660, 330, 3, 40);
  c.line(4750, 5050, 370, 4); c.arc(5420, 5560, 340, 3, 40); c.line(5600, 5720, 350, 2);
  c.arc(5760, 5900, 340, 3, 40); c.line(5940, 6060, 350, 2); c.arc(6100, 6240, 320, 3, 40);
  c.line(6310, 6610, 330, 4); c.arc(7000, 7130, 280, 3, 40); c.arc(7250, 7350, 250, 3, 40);
  c.arc(7550, 7670, 220, 3, 40); c.line(7720, 8020, 210, 4); c.arc(8070, 8190, 300, 3, 40);
  c.line(8270, 8570, 370, 4); c.arc(8670, 8770, 330, 3, 50); c.line(8870, 9020, 370, 2);
  c.arc(9070, 9140, 330, 3, 40); c.line(9220, 9420, 370, 3);
  return {
    id, name: "Le Plateau des Bérets Envolés",
    blurb: "Lande ventée où les bérets s'envolent : quand les herbes se couchent, la rafale arrive. Attends le calme pour sauter.",
    difficulty: "Bien engagé", theme: "lande",
    width: 9890, floor: 440, spawnX: 60,
    solids: [
      // Montée vers le plateau : ressauts
      p(0, 820, 440),
      p(950, 430, 400), h(1080, 400),
      p(1510, 460, 340),
      // Le bord du plateau : première rafale sur un ravin (découverte)
      p(2110, 700, 440),
      p(2930, 520, 440),
      // Terrasses de bruyère
      p(3580, 400, 380),
      p(4110, 420, 320),
      p(4660, 760, 440),
      // Passage clé : la Crête des Bérets — deux passerelles au-dessus du vide, sous la rafale
      // (écarts de 140 px : faciles au calme, impossibles sous la rafale)
      m(5560, 420, 200), m(5900, 420, 200),
      p(6240, 760, 400), h(6700, 400),
      // Les terrasses du cayolar, en montée sous la troisième rafale (rocher, pas de ronce :
      // on doit pouvoir s'arrêter devant sans risque si la rafale tombe)
      p(7130, 420, 340), h(7270, 340),
      p(7670, 400, 280),
      // Sprint final face au vent
      p(8190, 1600, 440), g(8670, 440),
    ],
    hazards: [
      _(480, 70, 440),
      _(3700, 64, 380),
      _(5120, 70, 440),
      _(9070, 70, 440),
    ],
    // Mécanique v4 : rafales de vent de face (LEVELS.md §3d). Cycles différents pour chaque zone.
    gusts: [
      rafale(2480, 3150, 4.2, 0.45, 0.2),  // découverte : un seul ravin sous le vent
      rafale(5300, 6200, 4.6, 0.45, 0.55), // passage clé : la Crête des Bérets (3 sauts de 140 px)
      rafale(6950, 8150, 4.0, 0.45, 0.1),  // terrasses en montée + rocher
      rafale(8630, 9320, 3.8, 0.4, 0.7),   // sprint final : tronc et ronce face au vent
    ],
    coins: c.list,
    checkpoints: [y(id, 2140, 440, 1), y(id, 4690, 440, 2), y(id, 6270, 400, 3), y(id, 8220, 440, 4)],
    finishX: 9470,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 28.1, gold: 32.5, silver: 38, bronze: 45 }, // tools/medals.mjs (or ×1,15, argent ×1,35, bronze ×1,6)
  };
})());
