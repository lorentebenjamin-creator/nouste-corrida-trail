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

// ---- Palettes supplémentaires -----------------------------------------
// Thèmes intégrés au bundle : "forest", "ridge", "col".
// On peut en ajouter ici (toutes les clés sont obligatoires) : le décor est
// entièrement procédural, une palette suffit.
export const THEMES = {
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
    solids: [p(0, 520, 440), p(660, 380, 440), h(820, 440), p(1180, 460, 380), p(1760, 420, 380),
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
  };
})());
