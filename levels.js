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
// pierre(x, w, y) : comme p(), mais dessinée en pierre mouillée au ras de l'eau (palette avec `lake`, N°15).
export const pierre = (x, w, y) => ({ ...p(x, w, y), stone: true });
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
// panneau(x, yDuSol, "Ligne 1|Ligne 2") : PANNEAU de sentier planté sur un sol de dessus `yDuSol`
//   (décor seul, aucun effet de jeu ; « | » sépare les lignes, 2 lignes de ≈ 18 caractères max).
//   À mettre dans le tableau `signs` du niveau. Obligatoire avant un « ravin au calme » (§3d) :
//   ravin sous une rafale que l'on ne franchit qu'au calme (la rafale fait tomber).
export const panneau = (x, yDuSol, text) => ({ x, y: yDuSol, text });

// ---- Mécanique v5 ----------------------------------------------------------
// motte(x, y, w, period=4.4, on=0.6, phase=0, warn=0.9) : MOTTE PLONGEANTE — passerelle (planche
//   18 px, traversable par-dessous, ↓ pour descendre) de dessus `y`, posée sur l'eau d'une tourbière.
//   Cycle de `period` s : à flot pendant la fraction `on` du cycle (au début du cycle, décalé par
//   `phase` ∈ [0,1[), puis elle PLONGE (plus de sol : on tombe dans le ravin) et remonte au cycle
//   suivant. Pendant les `warn` s qui précèdent la plongée, elle tremble, s'enfonce, fait des bulles
//   et un panneau « bulles » clignote en haut de l'écran. À mettre dans `solids` (LEVELS.md §3e).
export const motte = (x, y, w, period = 4.4, on = 0.6, phase = 0, warn = 0.9) => ({
  x, y, w, h: 18, oneWay: true, kind: "plank", sink: { y0: y, period, on, phase, warn },
});

// ---- Mécanique v6 ----------------------------------------------------------
// thermique(x1, x2, period=5, on=0.55, phase=0, warn=1.0, lift=0.4, fall=360, fade=0.7) : ASCENDANCE
//   THERMIQUE — zone [x1, x2] (toute la hauteur) où l'air chaud monte du fond d'un ravin. Cycle de
//   `period` s : active pendant la fraction `on` du cycle (au début du cycle, décalé par `phase`),
//   puis repos. Active, elle PORTE en l'air : dès l'apex du saut la gravité est multipliée par `lift`
//   et la chute plafonnée à `fall` px/s → on plane et le saut s'allonge (≈ 420 px à plat au lieu de
//   250) : un ravin trop large pour un saut normal se franchit PENDANT l'ascendance. Si elle s'arrête
//   en plein vol, on retombe normalement (dans le ravin). Annonce `warn` s avant (duvet et feuilles qui
//   montent, flamme qui se dresse, panneau « spirale ») ; dans les `fade` dernières s elle faiblit
//   (le panneau clignote : trop tard pour partir). À mettre dans le tableau `thermals` (LEVELS.md §3f).
export const thermique = (x1, x2, period = 5, on = 0.55, phase = 0, warn = 1.0, lift = 0.4, fall = 360, fade = 0.7) => ({
  x1, x2, period, on, phase, warn, lift, fall, fade,
});

// ---- Mécanique v7 ----------------------------------------------------------
// amanite(x, y, w=140, bounce=1000) : AMANITE REBONDISSANTE — chapeau de champignon géant (dessus `y`,
//   largeur `w`) planté au fond d'un ravin sur un grand pied blanc. Se poser dessus RELANCE le coureur
//   vers le haut (vy = −bounce, ≈ 230 px au-dessus du chapeau avec 1000), sans appuyer sur saut : on se
//   laisse tomber dans le trou et l'amanite renvoie vers une corniche trop haute pour un saut normal, ou
//   par-dessus un ravin trop large. Le rebond est toujours le même (pas de « saut court »), ↓ ne la
//   traverse pas. Toujours au-dessus du vide : la rater = chute. À mettre dans `solids` (LEVELS.md §3g).
export const amanite = (x, y, w = 140, bounce = 1000) => ({ x, y, w, h: 18, oneWay: true, kind: "plank", bounce });

// ---- Mécanique v8 ----------------------------------------------------------
// tyro(x1, y1, x2, y2, grab=8, speed=480, accel=900) : TYROLIENNE — câble d'acier tendu de (x1, y1) à (x2, y2)
//   (x2 > x1, y2 ≥ y1 : on descend), entre deux pylônes de bois plantés sur les sols sous ses bouts.
//   EN L'AIR, les mains du coureur (62 px au-dessus du haut de sa boîte, ≈ le haut du sprite) qui
//   croisent le câble (à ±3 px) l'attrapent, seulement si le centre du coureur est entre x1+grab et
//   x2−60 (grab > 8 : la POIGNÉE jaune est garée au-dessus du vide, à x1+grab ; un saut trop tôt passe
//   sous le câble avant elle et tombe dans la crevasse). Le pylône de départ reste au bord. On glisse alors
//   vers la droite à `speed` px/s (plus vite qu'en courant, 352), sans gravité ni commandes, puis on
//   est lâché au bout avec l'élan de la glisse. Au sol, les mains sont à y_sol − 118 : on règle la
//   difficulté avec la MONTÉE à faire pour attraper le câble au point de prise (85–134 px ; un saut
//   complet monte de 137, un appui de 0,25 s de ≈ 129, de 0,2 s de ≈ 118). Câble raté = chute.
//   Lâcher : bout du câble ≈ 150–160 px au-dessus du sol d'arrivée (pieds à ≈ 40 px du sol).
//   À mettre dans le tableau `ziplines` du niveau (LEVELS.md §3h).
export const tyro = (x1, y1, x2, y2, grab = 8, speed = 480, accel = 900) => ({ x1, y1, x2, y2, grab, speed, accel });

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
  neve: {
    // Niveau 11 : névé d'altitude au soleil de midi (neige éblouissante, crevasses bleu nuit)
    skyTop: "#0b3d7a", skyMid: "#4f97d8", skyBot: "#e3f2ff",
    ridge: "#6f86a3", ridge2: "#c4d5e8",
    pine: "#1f3540", pine2: "#3e5b68",
    dirt: "#7d8b9a", dirtDark: "#4d5a68",
    grass: "#f3f8fd", grassDark: "#bfd0e1",
    wood: "#8a6440", woodDark: "#553f2a",
    rock: "#a0abb6", rockDark: "#5f6b78",
    thorn: "#28303c", leaf: "#3f5a4c", berry: "#3f78c8",
    fog: "#142338",
  },
  tourbiere: {
    // Niveau 12 : tourbière sous l'orage qui monte (ciel ardoise, lumière soufrée à l'horizon,
    // laîches jaunes, tourbe brune, eau noire des gouilles, canneberges)
    skyTop: "#262b3b", skyMid: "#6c7287", skyBot: "#dcc58a",
    ridge: "#353c38", ridge2: "#646d5c",
    pine: "#1f2d27", pine2: "#435747",
    dirt: "#4b3a2b", dirtDark: "#2c2219",
    grass: "#a39f4c", grassDark: "#6d6c33",
    wood: "#7a5a3a", woodDark: "#4a3624",
    rock: "#8e8f87", rockDark: "#5a5b55",
    thorn: "#251f1b", leaf: "#5b6a38", berry: "#c23a2e",
    fog: "#121510",
    // Clés facultatives : eau de la tourbière au fond des ravins (décor), couleurs des mottes (v5).
    water: "#36351f", waterHi: "#a9ab84", moss: "#86a84c", mossDark: "#55702f",
  },
  vignes: {
    // Niveau 13 : coteaux de vignes au coucher du soleil (ciel rose et or, argile rouge,
    // feuilles de vigne rousses de fin de vendange, grappes violettes)
    skyTop: "#2b1d4a", skyMid: "#c4607a", skyBot: "#f7c27a",
    ridge: "#4a2f52", ridge2: "#8a5068",
    pine: "#2f3a22", pine2: "#6b7a2e",
    dirt: "#7a4a30", dirtDark: "#4e2e1e",
    grass: "#b59a3e", grassDark: "#7d6a2a",
    wood: "#8a5634", woodDark: "#55331f",
    rock: "#c2a98e", rockDark: "#7e6a58",
    thorn: "#2a1c1e", leaf: "#a8452c", berry: "#5a2a6a",
    fog: "#1e1220",
  },
  falaise: {
    // Niveau 14 : falaises calcaires d'un canyon en plein après-midi (ciel chaud, roche blonde,
    // buis et chênes verts, ravins profonds où l'air chaud monte)
    skyTop: "#3f7fc0", skyMid: "#8fc1e3", skyBot: "#f3dfae",
    ridge: "#9a8a74", ridge2: "#c9b796",
    pine: "#3e5a2c", pine2: "#6f8a3c",
    dirt: "#c9a46e", dirtDark: "#8a6a42",
    grass: "#8fa84a", grassDark: "#5f7630",
    wood: "#8a6238", woodDark: "#553a20",
    rock: "#e2d3b4", rockDark: "#a8936e",
    thorn: "#2e3a1e", leaf: "#c98a2e", berry: "#b23a2a",
    fog: "#5a4a3a",
    // décor des ravins (revue 26/10, game.js drawCanyon) : parois calcaires striées, fond profond, rivière
    canyon: { wall: "#d8c29a", wallDark: "#9c8360", strata: "rgba(110,80,50,0.45)", back: "#7a6248", deep: "#22180f", river: "#3f7f8c", riverHi: "#c8eef0" },
  },
  lac: {
    // Niveau 15 : lac d'altitude à l'aube (ciel rose et lilas, eau turquoise, pierres plates grises,
    // pelouses alpines encore dans l'ombre)
    skyTop: "#3a4f7a", skyMid: "#c99ab0", skyBot: "#fbe2c4",
    ridge: "#4a5a78", ridge2: "#8a9ab8",
    pine: "#1f3a34", pine2: "#3f6a58",
    dirt: "#6a5a4a", dirtDark: "#43382e",
    grass: "#6fa860", grassDark: "#4a7a44",
    wood: "#86603c", woodDark: "#523a24",
    rock: "#b4b2aa", rockDark: "#76746c",
    thorn: "#2a2a24", leaf: "#4f7a50", berry: "#d05a6a",
    fog: "#16283a",
    // Clés facultatives (décor) : eau du lac visible au fond des trous entre les pierres.
    water: "#2f7f94", waterHi: "#bfeef2",
    // Revue du 27/10 (palette lac seulement) : niveau de l'eau (y monde) au pied des pierres et dans les trous,
    // surface du lac en arrière-plan (y écran) avec reflets et vaguelettes ; sols marqués `stone` (pierre(…))
    // dessinés en pierres grises mouillées (reflet, mousse légère) au ras de l'eau.
    lake: 505, lakeBg: 318,
    stone: "#8e9499", stoneDark: "#5b6166", stoneHi: "#e3eef0", moss: "#7a9a52",
  },
  brume: {
    // Niveau 16 : vieille forêt de sapins dans la brume du crépuscule (ciel violet et cuivre, mousses
    // sombres, troncs moussus ; les amanites rouges à pois blancs ressortent sur ce fond froid)
    skyTop: "#1d2240", skyMid: "#5d5a86", skyBot: "#e3a77a",
    ridge: "#2b2f4c", ridge2: "#4d5274",
    pine: "#14241e", pine2: "#2a4636",
    dirt: "#4e3d2e", dirtDark: "#30261c",
    grass: "#6a9a52", grassDark: "#466e38",
    wood: "#7c5838", woodDark: "#4a3422",
    rock: "#8c8a90", rockDark: "#5a5960",
    thorn: "#1f1a1d", leaf: "#4d6e3c", berry: "#e0452e",
    fog: "#121628",
  },
  etoiles: {
    // Niveau 17 : crête de nuit sous les étoiles (ciel indigo, lueur violette à l'horizon, herbe
    // givrée bleutée, cairns de pierre claire ; liseré clair obligatoire pour une palette de nuit)
    // Revue 29/10 : dirtDark relevé + `pit` quasi noir — les flancs des dents se détachent des brèches
    // (avant, dirtDark #2b2832 ≈ fog #03050d : trous invisibles à 1 s).
    skyTop: "#050817", skyMid: "#18204a", skyBot: "#5e4673",
    ridge: "#0d1330", ridge2: "#252d55",
    pine: "#0a1120", pine2: "#1a2838",
    dirt: "#5a5566", dirtDark: "#3e3a48",
    grass: "#8a9bb4", grassDark: "#56637c",
    wood: "#6e5640", woodDark: "#403226",
    rock: "#b2b6c8", rockDark: "#6a6e82",
    thorn: "#17131f", leaf: "#3a4a5e", berry: "#f2cc66",
    fog: "#03050d",
    pit: "#000106",
    rim: "#e8f0ff",
  },
  glacier: {
    // Niveau 18 : glacier crevassé en fin d'après-midi (ciel froid qui dore à l'horizon, croûte de
    // neige, glace bleue, moraine grise ; crevasses bleu nuit opaques grâce à `pit`)
    skyTop: "#18324f", skyMid: "#5687ab", skyBot: "#f2cfa4",
    ridge: "#4c6680", ridge2: "#a6bfd2",
    pine: "#1d2d36", pine2: "#344c57",
    dirt: "#4f93b2", dirtDark: "#2a5f7d",
    grass: "#eef8fc", grassDark: "#a9d3e3",
    wood: "#8a6440", woodDark: "#553f2a",
    rock: "#8f9296", rockDark: "#56595f",
    thorn: "#24313d", leaf: "#3f5a4c", berry: "#e8553a",
    fog: "#0b2438",
    pit: "#071a2a",
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
    medals: { auto: 13.9, gold: 14.4, silver: 15.6, bronze: 16.8 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 75 %, argent 100 %, bronze 100 % ; pressés : or 45 %, argent 45 %, bronze 57 %)
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
    medals: { auto: 18.1, gold: 18.7, silver: 20.2, bronze: 21.7 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 78 %, argent 98 %, bronze 100 % ; pressés : or 35 %, argent 48 %, bronze 65 %)
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
    medals: { auto: 21.6, gold: 22.3, silver: 24.1, bronze: 25.9 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 80 %, argent 93 %, bronze 100 % ; pressés : or 20 %, argent 30 %, bronze 38 %)
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
    medals: { auto: 30.8, gold: 31.8, silver: 34.4, bronze: 37 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 100 %, argent 100 %, bronze 100 % ; pressés : or 20 %, argent 30 %, bronze 43 %)
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
    medals: { auto: 31.8, gold: 32.8, silver: 36.9, bronze: 41 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 65 %, argent 83 %, bronze 85 % ; pressés : or 10 %, argent 15 %, bronze 28 %)
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
    medals: { auto: 29.4, gold: 30.3, silver: 33.8, bronze: 37.4 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 50 %, argent 75 %, bronze 88 % ; pressés : or 8 %, argent 25 %, bronze 35 %)
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
    medals: { auto: 31.7, gold: 32.7, silver: 36.5, bronze: 40.4 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 65 %, argent 80 %, bronze 85 % ; pressés : or 10 %, argent 23 %, bronze 43 %)
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
    medals: { auto: 29.8, gold: 33.8, silver: 37.4, bronze: 44.5 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 18 %, argent 50 %, bronze 85 %)
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
    medals: { auto: 31.6, gold: 32.6, silver: 35.3, bronze: 38 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 98 %, argent 98 %, bronze 98 % ; pressés : or 15 %, argent 20 %, bronze 35 %)
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
  c.line(8270, 8570, 370, 4); c.arc(8670, 8770, 330, 3, 50); c.line(8920, 9040, 370, 2);
  c.arc(9110, 9250, 320, 3, 40); c.line(9320, 9520, 370, 3);
  c.arc(9600, 9670, 330, 3, 40); c.line(9750, 9950, 370, 3);
  return {
    id, name: "Le Plateau des Bérets Envolés",
    blurb: "Lande ventée où les bérets s'envolent : quand les herbes se couchent, la rafale arrive. Attends le calme pour sauter.",
    difficulty: "Bien engagé", theme: "lande",
    width: 10475, floor: 440, spawnX: 60,
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
      // Sprint final face au vent : tronc, puis l'aire d'attente du Ravin du Béret (240 px sans danger)
      p(8190, 900, 440), g(8670, 440),
      // Passage clé (revue 21/10) : le RAVIN DU BÉRET, 185 px. Au calme on le saute largement
      // (saut ≈ 252 px) ; sous la rafale le saut tombe à ≈ 132 px (+ 30 de corps) : on tombe, et
      // une rafale qui se lève juste après l'appel suffit aussi. La rafale DÉCIDE du saut : on
      // attend sur l'aire, herbes droites et manche à air pendante, puis on saute.
      p(9275, 1100, 440),
    ],
    // Panneau dédié avant le ravin (en plus des herbes, de la manche à air et du panneau « vent »)
    signs: [panneau(8800, 440, "Ravin :|saute au calme")],
    hazards: [
      _(480, 70, 440),
      _(3700, 64, 380),
      _(5120, 70, 440),
      _(9600, 70, 440),
    ],
    // Mécanique v4 : rafales de vent de face (LEVELS.md §3d). Cycles différents pour chaque zone.
    gusts: [
      rafale(2480, 3150, 4.2, 0.45, 0.2),  // découverte : un seul ravin sous le vent
      rafale(5300, 6200, 4.6, 0.45, 0.55), // passage clé : la Crête des Bérets (3 sauts de 140 px)
      rafale(6950, 8150, 4.0, 0.45, 0.1),  // terrasses en montée + rocher
      rafale(8630, 8860, 3.8, 0.4, 0.7),   // sprint final : le tronc face au vent
      rafale(8960, 9560, 4.4, 0.45, 0.3),  // Ravin du Béret : ravin de 185 px, à sauter au calme
    ],
    coins: c.list,
    checkpoints: [y(id, 2140, 440, 1), y(id, 4690, 440, 2), y(id, 6270, 400, 3), y(id, 8220, 440, 4)],
    finishX: 10000,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 30.8, gold: 35.9, silver: 40.1, bronze: 44.5 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 15 %, argent 53 %, bronze 93 %)
    // Avertissements de check-levels examinés et acceptés (LEVELS.md §6b) :
    acceptedWarnings: [
      { match: "ground@8190→ground@9275: écart 185 px", reason: "Ravin du Béret (ravin au calme, revue 21/10) : écart voulu > portée sous la rafale (≈ 181 px) ; au calme le rival le plus lent (0,86) porte à ≈ 244 px. Playtest : pilote auto et rivaux sans chute, humain 40 essais (pilote corrigé du 23/10) attentif 100 % / pressé 95 % (≈ 94 % sur 80 essais) ; 75 % avec l'ancien pilote, 21/10." },
    ],
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 11 — Le Névé des Marmottes Frileuses (niveau du jour, 2026-10-22)
// Niveau classique (règle d'alternance, après le N°10 à mécaniques) — nouveauté : un seul passage
// clé inédit, les DENTS DE LA MARMOTTE, sept séracs étroits (150 px) en dents de scie, une montée
// puis une descente à chaque saut, de plus en plus hautes (60 → 70 → 80 → 90 px). Jusqu'ici les
// suites de sauts montaient ou descendaient toujours dans le même sens. Aucune mécanique v2/v3/v4 :
// sols, ravins (crevasses), ronces, rochers, troncs, passerelles fixes et fanions, sur le modèle
// du niveau 4. Nouvelle palette `neve` (névé au soleil de midi).
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "neve-marmottes", c = v(id);
  c.line(120, 640, 370, 5); c.arc(770, 980, 380, 3, 40); c.line(1060, 1220, 370, 2);
  c.arc(1350, 1550, 310, 3, 40); c.line(1630, 1790, 300, 2); c.arc(1920, 2110, 250, 3, 40);
  c.line(2190, 2330, 240, 2); c.arc(2460, 2670, 250, 3, 40); c.line(2750, 3030, 370, 2);
  c.arc(3160, 3360, 320, 3, 40); c.arc(3440, 3670, 320, 3, 40); c.arc(3750, 3950, 310, 3, 40);
  c.arc(4030, 4260, 310, 3, 40); c.arc(4340, 4540, 300, 3, 40); c.arc(4620, 4850, 300, 3, 40);
  c.arc(4930, 5130, 290, 3, 40); c.arc(5210, 5430, 290, 3, 40); c.line(5520, 6020, 370, 4);
  c.arc(6150, 6350, 320, 3, 40); c.arc(6440, 6600, 270, 3, 40); c.arc(6680, 6840, 270, 3, 40);
  c.arc(6930, 7090, 320, 3, 40); c.line(7170, 7390, 370, 2); c.arc(7520, 7710, 320, 3, 40);
  c.line(7790, 7930, 310, 2); c.arc(8060, 8250, 240, 3, 40); c.line(8330, 8450, 230, 2);
  c.arc(8580, 8780, 240, 3, 40); c.line(8860, 9000, 310, 2); c.arc(9130, 9350, 320, 3, 40);
  c.line(9410, 9830, 370, 4); c.arc(9960, 10185, 380, 3, 40); c.line(10265, 10385, 370, 2);
  c.arc(10515, 10740, 380, 3, 40); c.line(10820, 11640, 370, 5);
  return {
    id, name: "Le Névé des Marmottes Frileuses",
    blurb: "Neige éblouissante et crevasses bleues : les séracs montent et descendent en dents de scie. Garde le rythme, les marmottes sifflent.",
    difficulty: "Haute montagne", theme: "neve",
    width: 11900, floor: 440, spawnX: 60,
    solids: [
      // Départ sur le névé, puis ressauts vers les séracs
      p(0, 800, 440),
      p(940, 440, 440), h(1100, 440),
      p(1510, 440, 370),
      p(2070, 420, 310), g(2190, 310),
      p(2630, 560, 440),
      // Passage clé : les DENTS DE LA MARMOTTE — sept séracs de 150 px en dents de scie
      // (monter, redescendre, remonter plus haut…), crevasses de 130 px en montée, 160 en descente
      p(3320, 150, 380), p(3630, 150, 440),
      p(3910, 150, 370), p(4220, 150, 440),
      p(4500, 150, 360), p(4810, 150, 440), // revue du 22/10 : ronce au bord du 6e sérac (dent basse)
      p(5090, 150, 350),
      p(5390, 790, 440), h(5900, 440),
      // Les ponts de neige : passerelles au-dessus de la grande crevasse
      m(6310, 380, 160), m(6560, 330, 150), m(6800, 380, 160),
      p(7050, 500, 440),
      // Montée au col des marmottes
      p(7670, 420, 380),
      p(8210, 400, 300), g(8330, 300),
      // Descente sur le névé
      p(8740, 420, 380),
      p(9310, 680, 440),
      // Dernier sprint jusqu'à l'arche
      p(10145, 400, 440),
      p(10700, 1100, 440), g(10900, 440),
    ],
    hazards: [
      _(470, 70, 440),
      _(1640, 64, 370),
      // Revue du 22/10 : ronce de 60 px sur la lèvre du 6e sérac (dent basse après la descente de
      // 80 px) — un saut lâché trop tôt retombe dedans ; un saut complet la survole (≈ 90 px de réception).
      _(4810, 60, 440),
      _(7250, 64, 440),
      _(7790, 64, 380),
      _(9680, 70, 440),
      _(11250, 74, 440),
    ],
    coins: c.list,
    checkpoints: [y(id, 2660, 440, 1), y(id, 5420, 440, 2), y(id, 8760, 380, 3), y(id, 10175, 440, 4)],
    finishX: 11450,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    // Avertissements de check-levels examinés et acceptés (LEVELS.md §6b) :
    acceptedWarnings: [
      { match: "ronce @4810: seulement 150 px avant le bord", reason: "Revue du 22/10 : ronce voulue sur la lèvre d'un sérac de 150 px (dent basse des Dents de la Marmotte), pour durcir le N°11 en profil pressé (98 % → 93 % sur 40 essais) ; la ronce se survole en descendant du sérac précédent (80 px plus haut, 160 px de crevasse) et il reste ≈ 90 px de sérac pour se recevoir et repartir vers la dent suivante, comme sur tous les séracs de 150 px du passage ; validé playtest auto (0 chute, rivaux 0 chute) et humain (attentif 100 %)." },
    ],
    medals: { auto: 32.3, gold: 33.3, silver: 36.5, bronze: 39.7 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 73 %, argent 78 %, bronze 88 % ; pressés : or 5 %, argent 13 %, bronze 20 %)
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 12 — La Tourbière des Crapauds Ronfleurs (niveau du jour, 2026-10-23)
// Niveau à mécaniques (règle d'alternance, après le N°11 classique) — nouveauté : une mécanique
// inédite, les MOTTES PLONGEANTES (v5, `motte()`, LEVELS.md §3e) : des tapis de sphaigne qui
// flottent sur les gouilles de la tourbière, puis plongent (plus de sol) et remontent, en cycle.
// Annonce : la motte tremble, s'enfonce, fait des bulles et un panneau « bulles » clignote en haut
// de l'écran ; plongée, sa silhouette et un contour pointillé restent visibles ; deux panneaux de
// sentier expliquent la règle. Aucune autre mécanique (pas de combinaison). Nouvelle palette
// `tourbiere` (tourbière sous l'orage qui monte).
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "tourbiere-crapauds", c = v(id);
  c.line(140, 620, 370, 5); c.arc(680, 860, 380, 3, 40); c.arc(970, 1110, 350, 3, 40);
  c.arc(1230, 1400, 330, 3, 40); c.arc(1490, 1610, 300, 3, 40); c.line(1960, 2440, 370, 4);
  c.arc(2500, 2640, 380, 3, 40); c.line(2650, 2770, 370, 2); c.arc(2790, 2920, 380, 3, 40);
  c.arc(3130, 3260, 370, 3, 40); c.arc(3500, 3660, 330, 3, 40); c.arc(3760, 3920, 290, 3, 40);
  c.line(4240, 4660, 370, 4); c.arc(4710, 4850, 380, 3, 40); c.arc(4990, 5120, 370, 3, 40);
  c.arc(5270, 5400, 370, 3, 40); c.arc(5600, 5720, 350, 3, 40); c.arc(5980, 6140, 330, 3, 40);
  c.line(6180, 6480, 310, 3); c.arc(6540, 6670, 290, 3, 40); c.arc(6750, 6880, 240, 3, 40);
  c.arc(7060, 7190, 330, 3, 40); c.line(7240, 7720, 370, 4); c.arc(7780, 7920, 380, 3, 40);
  c.arc(8060, 8190, 350, 3, 40); c.arc(8340, 8470, 350, 3, 40); c.arc(8620, 8750, 380, 3, 40);
  c.arc(9100, 9230, 370, 3, 40); c.arc(9420, 9580, 330, 3, 40); c.line(9600, 9900, 310, 3);
  c.arc(9940, 10090, 330, 3, 40); c.arc(10260, 10420, 350, 3, 40); c.line(10480, 10900, 370, 4);
  return {
    id, name: "La Tourbière des Crapauds Ronfleurs",
    blurb: "L'orage gronde sur la tourbière : les mottes de mousse flottent… puis plongent. Quand ça fait des bulles, attends qu'elles remontent !",
    difficulty: "Bien engagé", theme: "tourbiere",
    width: 11080, floor: 440, spawnX: 60,
    solids: [
      // Départ sur la lande tourbeuse, ressauts de laîches
      p(0, 700, 440),
      p(810, 470, 440), h(1020, 440),
      p(1380, 400, 380),
      p(1900, 600, 440),
      // Première gouille : UNE motte plongeante, lente, seule (découverte ; panneau juste avant)
      motte(2620, 440, 170, 4.4, 0.7, 0),
      p(2910, 600, 440),
      p(3640, 420, 380), g(3790, 380),
      p(4190, 520, 440),
      // Deuxième gouille : deux mottes, la seconde remonte 0,44 s après la première (petite vague)
      motte(4830, 440, 160, 4.4, 0.6, 0), motte(5110, 420, 160, 4.4, 0.6, 0.9),
      p(5390, 600, 440), h(5640, 440),
      // Les buttes de sphaigne
      p(6120, 420, 380),
      p(6660, 400, 330),
      p(7180, 600, 440),
      // Passage clé : la RONDE DES CRAPAUDS — trois mottes (dont une plus haute) qui remontent et
      // plongent en vague, chacune 0,44 s après la précédente : partir dès que la première remonte
      motte(7900, 440, 160, 4.4, 0.6, 0), motte(8180, 400, 160, 4.4, 0.6, 0.9), motte(8460, 440, 160, 4.4, 0.6, 0.8),
      p(8740, 700, 440),
      // Sortie de la tourbière et sprint final
      p(9560, 400, 380),
      p(10080, 900, 440), g(10300, 440),
    ],
    hazards: [
      _(1520, 64, 380),
      _(3170, 64, 440),
      _(6780, 64, 330),
      _(9140, 64, 440),
    ],
    signs: [
      panneau(2330, 440, "Tourbière :|mottes plongeantes"),
      panneau(4560, 440, "Bulles : ça plonge|attends la remontée"),
    ],
    coins: c.list,
    checkpoints: [y(id, 1920, 440, 1), y(id, 4210, 440, 2), y(id, 7200, 440, 3), y(id, 8760, 440, 4)],
    finishX: 10650,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 30.9, gold: 31.9, silver: 34.5, bronze: 37.1 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 73 %, argent 80 %, bronze 93 % ; pressés : or 15 %, argent 15 %, bronze 28 %)
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 13 — Les Coteaux des Vendangeurs Assoiffés (niveau du jour, 2026-10-24)
// Niveau classique (règle d'alternance, après le N°12 à mécaniques) — nouveauté : un seul passage
// clé inédit, la GRANDE DÉGRINGOLADE, sept terrasses de vigne étroites (130 px) qui DESCENDENT
// d'un coup du chai perché (y = 190) jusqu'au pied du coteau (y = 440), 35–40 px plus bas à chaque
// saut, ravins de 160 px : on les enchaîne sans s'arrêter (on se reçoit loin sur la terrasse,
// il faut relancer aussitôt). Jusqu'ici les descentes faisaient 2 marches au plus. Aucune mécanique
// v2/v3/v4/v5 : sols, ravins, ronces, rochers, troncs (barriques), passerelles fixes et fanions,
// sur le modèle du niveau 4. Nouvelle palette `vignes` (coteaux au coucher du soleil).
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "coteaux-vendangeurs", c = v(id);
  c.line(160, 400, 370, 3); c.arc(780, 960, 330, 3, 40); c.line(1200, 1340, 370, 2);
  c.arc(1360, 1530, 290, 3, 40); c.line(1700, 1880, 300, 2); c.arc(1910, 2080, 230, 3, 40);
  c.line(2280, 2460, 240, 2); c.arc(2480, 2640, 180, 3, 40); c.line(2700, 2980, 180, 3);
  c.arc(3000, 3160, 140, 3, 40); c.arc(3280, 3440, 100, 3, 40); c.line(3460, 3540, 120, 2);
  c.line(3660, 3820, 120, 2);
  c.arc(3860, 4020, 120, 3, 40); c.arc(4150, 4310, 160, 3, 40); c.arc(4440, 4600, 195, 3, 40);
  c.arc(4730, 4890, 230, 3, 40); c.arc(5020, 5180, 265, 3, 40); c.arc(5310, 5470, 295, 3, 40);
  c.arc(5600, 5760, 330, 3, 40); c.line(5900, 6200, 370, 4);
  c.arc(6600, 6740, 330, 3, 40); c.arc(6910, 7040, 250, 3, 40); c.arc(7200, 7340, 250, 3, 40);
  c.arc(7510, 7650, 290, 3, 40); c.line(7700, 7860, 370, 2); c.arc(8150, 8300, 290, 3, 40);
  c.line(8320, 8420, 310, 2); c.arc(8720, 8850, 230, 3, 40); c.line(8900, 9200, 240, 4);
  c.arc(9270, 9420, 260, 3, 40); c.line(9440, 9560, 300, 2); c.arc(9860, 10010, 330, 3, 40);
  c.line(10060, 10380, 370, 4); c.arc(10710, 10860, 330, 3, 40); c.line(10900, 11040, 370, 2);
  c.line(11250, 11640, 370, 4);
  return {
    id, name: "Les Coteaux des Vendangeurs Assoiffés",
    blurb: "Coucher de soleil sur les vignes : grimpe jusqu'au chai perché, puis dévale les terrasses sans rater une marche.",
    difficulty: "Grand raid", theme: "vignes",
    width: 12060, floor: 440, spawnX: 60,
    solids: [
      // Départ au pied des vignes, puis ressauts vers le coteau
      p(0, 800, 440),
      p(940, 440, 440), h(1100, 440),
      p(1510, 420, 370),
      p(2060, 440, 310), g(2190, 310),
      // Montée au chai perché
      p(2620, 400, 250),
      m(3140, 200, 160),
      p(3420, 440, 190), h(3560, 190),
      // Passage clé : la GRANDE DÉGRINGOLADE — sept terrasses de 130 px qui descendent du chai
      // (190 → 230 → 270 → 305 → 340 → 375 → 405 → 440), ravins de 160 px (150 px avant la 3e terrasse,
      // revue du 24/10 : elle commence à 4580, 150 px de large, pour étaler le point chaud x≈4600)
      p(4020, 130, 230), p(4310, 130, 270), p(4580, 150, 305),
      p(4890, 130, 340), p(5180, 130, 375), p(5470, 130, 405),
      p(5760, 850, 440), h(6300, 440),
      // Les rangs de vigne : passerelles au-dessus de la combe
      m(6740, 400, 170), m(7040, 360, 160), m(7340, 400, 170),
      p(7650, 520, 440), g(7900, 440),
      // Montée au pressoir
      p(8300, 420, 380),
      p(8850, 420, 310),
      // Descente vers la cave
      p(9420, 440, 370), h(9600, 370),
      p(10010, 700, 440),
      // Dernier sprint entre les barriques jusqu'à l'arche
      p(10860, 1100, 440), g(11100, 440),
    ],
    hazards: [
      _(480, 70, 440),
      _(1640, 64, 370),
      // Passage clé : ronces de 45–55 px sur la lèvre des 3e, 5e et 6e terrasses (revue du 24/10 : 6e
      // passée de 45 à 55 px, 3e avancée avec sa terrasse ; pressé 85 % → 88 %, chutes 24/14/12 → 15/14/16) — un saut lâché trop tôt
      // retombe dedans ; un saut complet les survole (≈ 50 px de terrasse pour se recevoir et relancer).
      _(4580, 45, 305),
      _(5180, 55, 375),
      _(5470, 55, 405),
      _(8440, 64, 380),
      _(10450, 70, 440),
      _(11400, 74, 440),
    ],
    coins: c.list,
    // Panneau avant la Grande Dégringolade (revue du 24/10) : annonce la descente d'un coup et les ronces
    // de lèvre (point chaud x≈4600 en profil pressé : saut lâché trop tôt).
    signs: [panneau(3470, 190, "Dégringolade :|saute à fond")],
    checkpoints: [y(id, 2640, 250, 1), y(id, 5790, 440, 2), y(id, 8870, 310, 3), y(id, 10040, 440, 4)],
    finishX: 11650,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 32.9, gold: 33.9, silver: 38.3, bronze: 42.8 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 53 %, argent 60 %, bronze 85 % ; pressés : or 3 %, argent 18 %, bronze 30 %)
    // Avertissements de check-levels examinés et acceptés (LEVELS.md §6b) :
    acceptedWarnings: [
      { match: "ronce @4580: seulement 150 px avant le bord", reason: "Passage clé de la Grande Dégringolade (24/10) : ronce voulue sur la lèvre d'une terrasse de 150 px (3e terrasse, ravin de 150 px avant), survolée par un saut complet depuis la terrasse précédente (35–40 px plus haut, ravin de 160 px) ; un saut lâché trop tôt retombe dedans. Validé playtest auto (0 chute, rivaux 0 chute) et humain 40 essais : attentif 100 %, pressé 85 % / 3,0 chutes (N°11 : 85 % / 3,2). Revue du 24/10 : 3e terrasse à 4580 (150 px, ravin 150 px), ronce de la 6e à 55 px, panneau avant la descente ; humain 40 essais : attentif 100 % / 0,45, pressé 88 % / 2,90 (chutes x≈5500:16, 4600:15, 5200:14)." },
      { match: "ronce @5180: seulement 130 px avant le bord", reason: "Passage clé de la Grande Dégringolade (24/10) : ronce voulue sur la lèvre d'une terrasse de 130 px, survolée par un saut complet depuis la terrasse précédente (35–40 px plus haut, ravin de 160 px) ; un saut lâché trop tôt retombe dedans. Validé playtest auto (0 chute, rivaux 0 chute) et humain 40 essais : attentif 100 %, pressé 85 % / 3,0 chutes (N°11 : 85 % / 3,2). Revue du 24/10 : 3e terrasse à 4580 (150 px, ravin 150 px), ronce de la 6e à 55 px, panneau avant la descente ; humain 40 essais : attentif 100 % / 0,45, pressé 88 % / 2,90 (chutes x≈5500:16, 4600:15, 5200:14)." },
      { match: "ronce @5470: seulement 130 px avant le bord", reason: "Passage clé de la Grande Dégringolade (24/10) : ronce voulue sur la lèvre d'une terrasse de 130 px, survolée par un saut complet depuis la terrasse précédente (35–40 px plus haut, ravin de 160 px) ; un saut lâché trop tôt retombe dedans. Validé playtest auto (0 chute, rivaux 0 chute) et humain 40 essais : attentif 100 %, pressé 85 % / 3,0 chutes (N°11 : 85 % / 3,2). Revue du 24/10 : 3e terrasse à 4580 (150 px, ravin 150 px), ronce de la 6e à 55 px, panneau avant la descente ; humain 40 essais : attentif 100 % / 0,45, pressé 88 % / 2,90 (chutes x≈5500:16, 4600:15, 5200:14)." },
    ],
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 14 — Les Gorges des Vautours Fainéants (niveau du jour, 2026-10-26)
// Niveau à mécaniques (règle d'alternance, après le N°13 classique) — nouveauté : mécanique v6
// inédite, les ASCENDANCES THERMIQUES (`thermals`, helper thermique(), LEVELS.md §3f). Cinq
// ravins de 330–340 px, trop larges pour un saut normal (≈ 320 px au mieux), se franchissent en
// PLANANT : on saute quand l'air chaud monte (duvet et feuilles qui montent en spirale, flamme
// dressée, panneau « spirale ») et l'on se pose loin, comme les vautours. Si l'ascendance s'arrête
// en plein vol, on retombe dans les gorges : quand elle faiblit (panneau qui clignote), on attend la
// suivante. Pas d'autre mécanique : sols, ravins, ronces, rochers, troncs, fanions.
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "gorges-vautours", c = v(id);
  c.line(160, 600, 370, 4); c.arc(1290, 1390, 380, 3, 40); c.arc(1830, 1930, 330, 3, 40);
  c.line(2000, 2400, 370, 3);
  c.arc(2660, 2950, 360, 5, 70);
  c.arc(3580, 3680, 350, 3, 40); c.line(3720, 3780, 330, 2); c.arc(4120, 4220, 340, 3, 40);
  c.line(4280, 4520, 370, 3);
  c.arc(4750, 5050, 360, 5, 70); c.arc(5340, 5640, 340, 5, 70);
  c.line(5700, 5860, 350, 2); c.arc(6185, 6290, 320, 3, 40); c.arc(6710, 6820, 300, 3, 40);
  c.line(6900, 7220, 370, 3);
  c.arc(7450, 7750, 360, 5, 70);
  c.line(7850, 8250, 370, 3); c.arc(8340, 8440, 330, 3, 40); c.arc(8880, 8980, 320, 3, 40);
  c.line(9060, 9300, 370, 3);
  c.arc(9710, 10000, 360, 5, 70); c.line(10100, 10800, 370, 5);
  return {
    id, name: "Les Gorges des Vautours Fainéants",
    blurb: "Les vautours ne battent jamais des ailes : ils attendent que l'air chaud monte. Fais comme eux pour planer au-dessus des gorges !",
    difficulty: "Technique", theme: "falaise",
    width: 11320, floor: 440, spawnX: 60,
    solids: [
      // Départ sur le causse, ressauts calcaires
      p(0, 700, 440),
      p(820, 460, 440), h(1000, 440),
      p(1400, 420, 380),
      p(1940, 700, 440),
      // Première gorge : UNE ascendance longue (3 s), la découverte ; panneau et flamme avant le bord
      p(2970, 600, 440),
      p(3690, 420, 400), g(3800, 400),
      p(4230, 500, 440),
      // La Valse des Vautours : deux gorges de suite, l'îlot du milieu (260 px) et une seconde
      // ascendance qui se lève 1,2 s après la première (on enchaîne sans traîner)
      p(5065, 260, 440),
      p(5655, 520, 440),
      // Les vires de la falaise
      p(6300, 400, 380),
      p(6830, 600, 440),
      // Passage clé : le GRAND PLANÉ — la gorge la plus large (340 px) sous une ascendance courte
      // (2,25 s, dont 0,7 s où elle faiblit) : partir dès qu'elle se lève, sinon attendre la suivante
      p(7770, 560, 440),
      p(8450, 420, 380), h(8600, 380),
      p(8990, 700, 440),
      // Dernière gorge puis sprint jusqu'à l'arche
      p(10020, 1200, 440), g(10300, 440),
    ],
    hazards: [
      _(1560, 64, 380),
      _(5900, 64, 440),
      _(9380, 64, 440),
    ],
    // Revue du 26/10 : chute plafonnée à 300 px/s (au lieu de 360) — on plane plus loin (≈ 464 px au lieu
    // de 417 en saut complet, 74 images de vol) : toutes les chutes du 24/10 étaient des réceptions courtes
    // (≈ 30 px avant le bord) sur des sauts pris tôt et/ou appui bref (LEVELS.md §8).
    thermals: [
      thermique(2440, 3120, 5, 0.6, 0, 1.0, 0.4, 300),
      thermique(4530, 5215, 5, 0.55, 0, 1.0, 0.4, 300),
      thermique(5240, 5805, 5, 0.55, 0.76, 1.0, 0.4, 300),
      // Passage clé : ascendance courte du Grand Plané
      thermique(7230, 7920, 5, 0.45, 0.3, 1.0, 0.4, 300),
      thermique(9540, 10170, 5, 0.55, 0.5, 1.0, 0.4, 300),
    ],
    signs: [
      panneau(2230, 440, "Ascendance :|saute quand ça monte"),
      panneau(7000, 440, "Ça faiblit ?|attends la suivante"),
    ],
    coins: c.list,
    checkpoints: [y(id, 1960, 440, 1), y(id, 4250, 440, 2), y(id, 6850, 440, 3), y(id, 9010, 440, 4)],
    finishX: 10900,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 32.3, gold: 33.3, silver: 36.8, bronze: 40.3 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 43 %, argent 63 %, bronze 85 % ; pressés : or 3 %, argent 8 %, bronze 20 %)
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 15 — Le Lac des Truites Bavardes (niveau du jour, 2026-10-27)
// Niveau classique (règle d'alternance, après le N°14 à mécaniques) — nouveauté : un seul passage
// clé inédit, le SAUTE-PIERRES, huit pierres plates au ras de l'eau, toutes à la même hauteur, de
// plus en plus ÉTROITES (180 → 120 px, jamais si étroites jusqu'ici), séparées par des trous de
// 165 px : pas un seul sol de repos, on traverse le lac d'un seul élan. Aucune mécanique v2–v6 :
// sols, ravins, ronces, rochers, troncs, passerelles fixes et fanions, sur le modèle du niveau 4.
// Nouvelle palette `lac` (lac d'altitude à l'aube, eau turquoise au fond des trous).
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "lac-truites", c = v(id);
  c.line(160, 400, 370, 3); c.arc(770, 960, 330, 3, 40); c.line(1200, 1340, 370, 2);
  c.arc(1360, 1530, 290, 3, 40); c.line(1700, 1880, 300, 2); c.arc(1910, 2080, 230, 3, 40);
  c.line(2280, 2460, 240, 2); c.arc(2480, 2640, 330, 3, 40); c.line(2700, 3000, 370, 3);
  c.arc(3170, 3365, 330, 3, 40); c.arc(3515, 3710, 330, 3, 40); c.arc(3840, 4035, 330, 3, 40);
  c.arc(4155, 4350, 330, 3, 40); c.arc(4460, 4655, 330, 3, 40); c.arc(4755, 4950, 330, 3, 40);
  c.arc(5050, 5245, 330, 3, 40); c.arc(5335, 5530, 330, 3, 40); c.arc(5620, 5815, 330, 3, 40);
  c.line(5865, 6035, 370, 4); c.line(6395, 6465, 300, 2); c.arc(6530, 6750, 290, 3, 70);
  c.arc(6950, 7170, 290, 3, 70); c.arc(7370, 7590, 290, 3, 70); c.line(7765, 7765, 370, 1); c.line(7815, 8005, 370, 2);
  c.arc(8015, 8175, 290, 3, 40); c.line(8365, 8545, 330, 2); c.arc(8565, 8715, 220, 3, 40);
  c.line(8765, 9065, 260, 3); c.arc(9075, 9235, 260, 3, 40); c.line(9465, 9625, 300, 2);
  c.arc(9635, 9795, 330, 3, 40); c.line(9845, 10145, 370, 3); c.arc(10455, 10625, 330, 3, 40);
  c.line(10665, 10825, 370, 2); c.line(10985, 11185, 370, 2); c.line(11315, 11405, 370, 2);
  return {
    id, name: "Le Lac des Truites Bavardes",
    blurb: "L'aube rosit le lac : traverse-le de pierre en pierre sans jamais t'arrêter, les truites commentent chaque saut.",
    difficulty: "Tour des lacs", theme: "lac",
    width: 11825, floor: 440, spawnX: 60,
    solids: [
      // Départ sur la pelouse du déversoir, ressauts vers le belvédère
      p(0, 800, 440),
      p(940, 440, 440), h(1100, 440),
      p(1510, 420, 370),
      p(2060, 440, 310), g(2190, 310),
      // Descente sur la rive
      p(2620, 560, 440),
      // Passage clé : le SAUTE-PIERRES — huit pierres plates au ras de l'eau, même hauteur, de plus en
      // plus étroites (180, 160, 150, 140, 130, 130, 120, 120 px), trous de 165 px, aucun sol de repos
      pierre(3345, 180, 440), pierre(3690, 160, 440), pierre(4015, 150, 440), pierre(4330, 140, 440),
      pierre(4635, 130, 440), pierre(4930, 130, 440), pierre(5225, 120, 440), pierre(5510, 120, 440),
      p(5795, 560, 440), h(6095, 440),
      // Les ROCHERS DES TRUITES (revue du 27/10) : quatre gros rochers (haut 345) séparés par trois criques.
      // Chemin SÛR (pilote auto, rivaux) : on se laisse tomber dans la crique (dalle basse 500), saut par-dessus
      // l'eau sur la marche (420) collée au rocher suivant, ressaut sur place → ≈ 0,5 s perdue par crique.
      // RACCOURCI RISQUÉ (champ shortcuts) : grand saut de rocher en rocher, 270 px bord à bord (saut complet,
      // élan maximal) ; trop tôt ou appui trop court → on retombe dans la crique (temps perdu), voire à l'eau.
      pierre(6355, 150, 345),
      pierre(6505, 155, 500), pierre(6730, 45, 420),
      pierre(6775, 150, 345),
      pierre(6925, 155, 500), pierre(7150, 45, 420),
      pierre(7195, 150, 345),
      pierre(7345, 155, 500), pierre(7570, 45, 420),
      pierre(7615, 100, 345),
      p(7715, 320, 440),
      // Montée au refuge (revue du 27/10 : première marche ramenée de 60 à 40 px — point chaud x≈8100)
      p(8155, 420, 400),
      p(8695, 400, 330),
      // Descente vers le torrent de sortie
      p(9215, 440, 370), h(9385, 370),
      p(9775, 700, 440),
      // Dernier sprint le long du torrent jusqu'à l'arche
      p(10605, 1120, 440), g(10865, 440),
    ],
    hazards: [
      _(480, 70, 440),
      _(1640, 64, 370),
      _(8265, 64, 400),
      _(10175, 64, 440),
      _(11215, 74, 440),
    ],
    signs: [panneau(2950, 440, "Saute-pierres :|ne t'arrête pas"), panneau(6235, 440, "Raccourci risqué :|de rocher en rocher")],
    // Raccourcis risqués (revue du 27/10, LEVELS.md §6) : sauts de rocher en rocher au-dessus des criques.
    // from–to = rocher de départ (haut y), land/landY = rocher d'arrivée. L'IA de référence ne les prend pas.
    shortcuts: [
      { name: "Rochers des Truites 1", from: 6355, to: 6505, y: 345, land: 6775, landY: 345 },
      { name: "Rochers des Truites 2", from: 6775, to: 6925, y: 345, land: 7195, landY: 345 },
      { name: "Rochers des Truites 3", from: 7195, to: 7345, y: 345, land: 7615, landY: 345 },
    ],
    coins: c.list,
    checkpoints: [y(id, 2650, 440, 1), y(id, 5825, 440, 2), y(id, 8715, 330, 3), y(id, 9805, 440, 4)],
    finishX: 11415,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 33.8, autoShort: 32.2, gold: 33.5, silver: 36.2, bronze: 38.9 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 40 %, argent 95 %, bronze 98 % ; pressés : or 10 %, argent 20 %, bronze 28 %)
    acceptedWarnings: [
      { match: "ground@5795→ground@6355: marche montante sans trou (95 px)", reason: "Revue du 27/10 : montée sur le premier des Rochers des Truites avec tout l'élan de la rive (pilote auto sans perte de temps, rivaux sans chute au playtest)." },
      { match: "ground@6730→ground@6775: marche montante sans trou (75 px)", reason: "Revue du 27/10 : marche voulue du chemin sûr des Rochers des Truites (ressaut sur place ≈ 0,5 s) — c'est le temps que fait gagner le raccourci risqué (shortcuts)." },
      { match: "ground@7150→ground@7195: marche montante sans trou (75 px)", reason: "Revue du 27/10 : marche voulue du chemin sûr des Rochers des Truites (ressaut sur place) — temps gagné par le raccourci risqué (shortcuts)." },
      { match: "ground@7570→ground@7615: marche montante sans trou (75 px)", reason: "Revue du 27/10 : marche voulue du chemin sûr des Rochers des Truites (ressaut sur place) — temps gagné par le raccourci risqué (shortcuts)." },
    ],
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 16 — La Forêt des Amanites Farceuses (niveau du jour, 2026-10-28)
// Niveau à mécaniques (règle d'alternance, après le N°15 classique) — mécanique v7 inédite : les
// AMANITES REBONDISSANTES (§3g), chapeaux de champignons géants au fond des ravins qui relancent le
// coureur vers le haut (≈ 230 px) : on se laisse tomber dessus pour atteindre une corniche trop haute
// pour un saut normal. Progression : une amanite seule où il suffit de se laisser tomber (découverte),
// une amanite loin du bord qu'il faut viser d'un saut, le RICOCHET (passage clé, trois amanites de
// suite au-dessus d'un long ravin, durci 28/10), puis l'Échelle (deux rebonds, durcie 28/10) ; à la fin, les Souches Moussues
// (raccourci risqué de souche en souche, §6 étape 3c : l'or l'exige).
// Nouvelle palette `brume` (vieille forêt de sapins dans la brume du crépuscule).
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "amanites-farceuses", c = v(id);
  c.line(160, 600, 370, 4); c.arc(1300, 1400, 380, 3, 40); c.line(1450, 1600, 370, 2); c.line(1890, 1990, 370, 2);
  c.arc(2060, 2240, 260, 4, 60); c.line(2320, 2700, 250, 4);
  c.line(2950, 3250, 370, 3); c.arc(3600, 3740, 380, 3, 40); c.arc(3800, 3980, 250, 3, 50);
  c.line(4060, 4400, 270, 3); c.line(4500, 4560, 330, 3);
  // balises après le panneau Ricochet (écart ≥ 40 px), puis arcs du Ricochet durci
  c.line(4860, 5120, 330, 2); c.arc(5310, 5550, 330, 3, 70); c.arc(5630, 5870, 350, 3, 70); c.arc(5950, 6170, 310, 3, 70);
  c.line(6320, 6780, 330, 4); c.line(7120, 7260, 370, 3);
  c.arc(7340, 7540, 300, 3, 50); c.line(7580, 7740, 270, 2); c.arc(7840, 8060, 190, 3, 40);
  c.line(8140, 8540, 150, 3); c.arc(8600, 8700, 200, 3, 40); c.line(8800, 9100, 260, 4);
  c.line(9400, 9420, 370, 2); c.line(9685, 9880, 370, 3);
  // arcs du raccourci des Souches (saut de souche en souche)
  c.arc(10080, 10330, 220, 3, 60); c.arc(10500, 10750, 220, 3, 60); c.arc(10920, 11170, 220, 3, 60);
  c.line(11320, 11900, 370, 5);
  return {
    id, name: "La Forêt des Amanites Farceuses",
    blurb: "Au crépuscule, les amanites géantes renvoient les coureurs dans les airs : laisse-toi tomber dessus et rebondis jusqu'aux corniches !",
    difficulty: "Technique", theme: "brume",
    width: 12500, floor: 440, spawnX: 60,
    solids: [
      // Départ dans la clairière, ressauts de mise en jambes
      p(0, 700, 440),
      p(820, 460, 440), h(1000, 440),
      p(1400, 620, 440),
      // Découverte : UNE amanite collée au bord — il suffit de se laisser tomber, elle renvoie sur la
      // corniche (120 px plus haut que le sentier : trop haut pour un saut normal)
      amanite(2030, 480, 130),
      p(2270, 480, 320),
      p(2880, 680, 440),
      // L'amanite du milieu : 160 px de vide avant elle, il faut la viser d'un saut (un saut trop court ou
      // trop long renvoie à côté de la corniche)
      amanite(3720, 480, 130),
      p(4000, 460, 340),
      p(4580, 560, 400),
      // Passage clé : le RICOCHET (revue 28/10) — 170 px de vide avant la 1re (viser), chapeaux 120,
      // creux ~200 px bord à bord, 2e plus basse (timing), ronce large à la réception
      amanite(5310, 480, 120), amanite(5630, 510, 120), amanite(5950, 480, 120),
      p(6160, 560, 400),
      // Retour au sentier (vide avant l'Échelle : viser la 1re amanite)
      p(6890, 250, 440),
      // L'Échelle des Amanites (revue 28/10) : 150 px de vide d'appel, marche courte, ronce en haut
      amanite(7310, 480, 120),
      p(7570, 170, 330),
      amanite(7840, 360, 120),
      p(8080, 560, 220),
      // Descente de la corniche
      p(8780, 540, 280),
      p(9320, 600, 440),
      // Les SOUCHES MOUSSUES (raccourci risqué, LEVELS.md §6 étape 3c, modèle des Rochers des Truites du N°15) :
      // quatre grosses souches (haut 345) séparées par trois creux de mousse. Chemin SÛR (pilote auto, rivaux) :
      // on se laisse tomber dans le creux (dalle basse 500), saut par-dessus le trou sur la marche (420) collée à
      // la souche suivante, ressaut sur place → ≈ 0,5 s perdue par creux. RACCOURCI (champ shortcuts) : grand
      // saut de souche en souche, 270 px bord à bord ; trop tôt ou appui trop court → retombée dans le creux.
      p(9920, 150, 345),
      p(10070, 155, 500), p(10295, 45, 420),
      p(10340, 150, 345),
      p(10490, 155, 500), p(10715, 45, 420),
      p(10760, 150, 345),
      p(10910, 155, 500), p(11135, 45, 420),
      p(11180, 100, 345),
      // Dernier sprint dans la clairière jusqu'à l'arche
      p(11280, 1220, 440), g(11560, 440),
    ],
    hazards: [
      _(1700, 64, 440),
      _(3300, 64, 440),
      _(4210, 64, 340),
      _(6160, 88, 400), // ronce à la réception du Ricochet
      _(6900, 64, 440),
      _(8080, 72, 220), // ronce à la réception de l'Échelle
    ],
    signs: [
      panneau(1760, 440, "Amanites :|laisse-toi tomber"),
      panneau(3420, 440, "Amanite au milieu :|vise-la d'un saut"),
      panneau(4700, 400, "Ricochet :|d'amanite en amanite"), // décalé (≥ 40 px des balises, revue 28/10)
      panneau(6980, 440, "Échelle :|deux rebonds"),
      panneau(9560, 440, "Raccourci risqué :|de souche en souche"),
    ],
    coins: c.list,
    checkpoints: [y(id, 2900, 440, 1), y(id, 4600, 400, 2), y(id, 6180, 400, 3), y(id, 9340, 440, 4)],
    finishX: 12000,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 35.5, autoShort: 33.9, gold: 35.1, silver: 38.1, bronze: 41.1 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 23 %, argent 55 %, bronze 85 % ; pressés : or 10 %, argent 28 %, bronze 35 %)
    // Raccourcis risqués (LEVELS.md §6 étape 3c) : sauts de souche en souche au-dessus des creux de mousse.
    shortcuts: [
      { name: "Souches Moussues 1", from: 9920, to: 10070, y: 345, land: 10340, landY: 345 },
      { name: "Souches Moussues 2", from: 10340, to: 10490, y: 345, land: 10760, landY: 345 },
      { name: "Souches Moussues 3", from: 10760, to: 10910, y: 345, land: 11180, landY: 345 },
    ],
    acceptedWarnings: [
      { match: "ground@4580→plank@5310: écart 170 px", reason: "Revue 28/10 : vide voulu avant la 1re amanite du Ricochet (viser d'un saut, comme l'amanite du milieu) ; rival le plus lent porte à plat ≈ 217 px, playtest auto et rivaux 0 chute." },
      { match: "ground@6160→ground@6890: écart 170 px", reason: "Revue 28/10 : creux voulu entre la réception du Ricochet et l'appel de l'Échelle (durcissement pressé) ; playtest auto et rivaux 0 chute." },
      { match: "ground@6890→plank@7310: écart 170 px", reason: "Revue 28/10 : vide voulu avant la 1re amanite de l'Échelle (viser) ; playtest auto et rivaux 0 chute." },
      { match: "ground@9320→ground@9920: marche montante sans trou (95 px)", reason: "Montée sur la première des Souches Moussues avec tout l'élan (modèle des Rochers des Truites du N°15, pilote auto sans perte de temps)." },
      { match: "ground@10295→ground@10340: marche montante sans trou (75 px)", reason: "Marche voulue du chemin sûr des Souches Moussues (ressaut sur place ≈ 0,5 s) — c'est le temps que fait gagner le raccourci risqué (shortcuts)." },
      { match: "ground@10715→ground@10760: marche montante sans trou (75 px)", reason: "Marche voulue du chemin sûr des Souches Moussues (ressaut sur place) — temps gagné par le raccourci risqué (shortcuts)." },
      { match: "ground@11135→ground@11180: marche montante sans trou (75 px)", reason: "Marche voulue du chemin sûr des Souches Moussues (ressaut sur place) — temps gagné par le raccourci risqué (shortcuts)." },
    ],
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 17 — La Crête des Chamois Noctambules (niveau du jour, 2026-10-29)
// Niveau classique (règle d'alternance, après le N°16 à mécaniques) — nouveauté : un seul passage
// clé inédit, la CRÊTE DES CAIRNS : sept dents de crête étroites (220 px) dont chacune porte un cairn
// (rocher) planté AU BORD du vide ; un seul saut doit franchir le cairn ET le trou (100 → 140 px).
// Trop tôt, on retombe dans le trou ; trop tard, on bute contre le cairn et on repart sans élan.
// Jusqu'ici les rochers étaient toujours posés au milieu d'un sol, loin du bord. Puis les SAUTS DE
// CHAMOIS (raccourci risqué de bloc en bloc, §6 étape 3c, modèle des Rochers des Truites : l'or
// l'exige). Aucune mécanique : sols, ravins, ronces, rochers, troncs, fanions, sur le modèle du N°4.
// Nouvelle palette `etoiles` (crête de nuit sous les étoiles, avec `rim`).
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "crete-chamois", c = v(id);
  c.line(160, 400, 370, 3); c.arc(740, 920, 330, 3, 40); c.arc(1020, 1150, 330, 3, 40);
  c.arc(1380, 1540, 290, 3, 40); c.line(1760, 1900, 300, 2); c.arc(1930, 2090, 220, 3, 40);
  c.line(2280, 2460, 230, 2); c.arc(2500, 2660, 260, 3, 40); c.line(2720, 2880, 370, 3);
  // arcs de la Crête des Cairns (cairn + trou en un seul saut)
  for (const [r, l] of [[3194, 3350], [3514, 3670], [3834, 4000], [4164, 4330], [4494, 4670], [4834, 5010], [5174, 5370]]) c.arc(r - 10, l + 20, 330, 3, 60);
  c.line(5560, 5900, 370, 4); c.arc(5960, 6100, 300, 3, 40); c.arc(6180, 6290, 290, 3, 40);
  c.arc(6500, 6640, 230, 3, 40); c.line(6700, 6980, 240, 3); c.arc(7020, 7170, 270, 3, 40);
  c.line(7220, 7420, 370, 3);
  // arcs des Sauts de Chamois (trajectoire du raccourci)
  c.arc(7965, 8185, 290, 3, 70); c.arc(8385, 8605, 290, 3, 70); c.arc(8805, 9025, 290, 3, 70);
  c.line(9200, 9200, 370, 1); c.line(9250, 9440, 370, 2);
  c.arc(9460, 9600, 320, 3, 40); c.arc(9680, 9790, 310, 3, 40); c.arc(10000, 10140, 250, 3, 40);
  c.line(10200, 10480, 260, 3); c.arc(10520, 10660, 280, 3, 40); c.arc(10830, 10920, 280, 2, 40);
  c.arc(11160, 11300, 330, 3, 40); c.line(11350, 11600, 370, 3); c.arc(11630, 11740, 320, 3, 40);
  c.line(11800, 11950, 370, 2); c.arc(11990, 12110, 330, 3, 40); c.line(12150, 12240, 370, 2);
  return {
    id, name: "La Crête des Chamois Noctambules",
    blurb: "Minuit sur la crête, frontale allumée : saute les cairns au bord du vide, les chamois noctambules t'attendent au sommet.",
    difficulty: "Crête de nuit", theme: "etoiles",
    width: 12690, floor: 440, spawnX: 60,
    solids: [
      // Départ sur l'épaule de la crête, ressauts de mise en jambes
      p(0, 760, 440),
      p(900, 500, 440), h(1060, 440),
      p(1525, 420, 370),
      p(2070, 440, 300), h(2170, 300),
      p(2650, 600, 440),
      // Passage clé : la CRÊTE DES CAIRNS — sept cairns plantés au bord du vide (le premier au bout du
      // sol d'appel), dents de crête de 220 px, trous de 100, 100, 110, 110, 120, 120, 140 px : un seul
      // saut franchit le cairn et le trou ; trop tôt = dans le trou, trop tard = contre le cairn
      h(3194, 440),
      p(3350, 220, 440), h(3514, 440),
      p(3670, 220, 440), h(3834, 440),
      p(4000, 220, 440), h(4164, 440),
      p(4330, 220, 440), h(4494, 440),
      p(4670, 220, 440), h(4834, 440),
      p(5010, 220, 440), h(5174, 440),
      p(5370, 600, 440),
      // Montée vers l'antécime
      p(6090, 420, 380),
      p(6630, 400, 310),
      // Descente sur le replat des chamois
      p(7150, 640, 440),
      // Les SAUTS DE CHAMOIS (raccourci risqué, LEVELS.md §6 étape 3c, modèle des Rochers des Truites du N°15) :
      // quatre blocs de granit (haut 345) séparés par trois brèches. Chemin SÛR (pilote auto, rivaux) : on se
      // laisse tomber dans la brèche (dalle basse 500), saut par-dessus le trou sur la marche (420) collée au
      // bloc suivant, ressaut sur place → ≈ 0,5 s perdue par brèche. RACCOURCI (champ shortcuts) : grand saut
      // de bloc en bloc, 270 px bord à bord ; trop tôt ou appui trop court → retombée dans la brèche.
      p(7790, 150, 345),
      p(7940, 155, 500), p(8165, 45, 420),
      p(8210, 150, 345),
      p(8360, 155, 500), p(8585, 45, 420),
      p(8630, 150, 345),
      p(8780, 155, 500), p(9005, 45, 420),
      p(9050, 100, 345),
      p(9150, 320, 440),
      // Montée au sommet
      p(9590, 420, 400),
      p(10130, 400, 330),
      // Descente vers le col
      p(10650, 520, 380), h(10850, 380),
      // Dernier sprint sur le col jusqu'à l'arche
      p(11290, 1300, 440), g(12000, 440),
    ],
    hazards: [
      _(470, 70, 440),
      _(1640, 64, 370),
      _(6200, 64, 380),
      _(9700, 64, 400),
      _(11650, 70, 440),
    ],
    signs: [
      panneau(3050, 440, "Cairns au bord :|saute cairn et trou"),
      panneau(7600, 440, "Raccourci risqué :|de bloc en bloc"),
    ],
    // Raccourcis risqués (LEVELS.md §6 étape 3c) : sauts de bloc en bloc au-dessus des brèches.
    shortcuts: [
      { name: "Sauts de Chamois 1", from: 7790, to: 7940, y: 345, land: 8210, landY: 345 },
      { name: "Sauts de Chamois 2", from: 8210, to: 8360, y: 345, land: 8630, landY: 345 },
      { name: "Sauts de Chamois 3", from: 8630, to: 8780, y: 345, land: 9050, landY: 345 },
    ],
    coins: c.list,
    checkpoints: [y(id, 2680, 440, 1), y(id, 5400, 440, 2), y(id, 7180, 440, 3), y(id, 10150, 330, 4)],
    finishX: 12250,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 36.5, autoShort: 34.9, gold: 36.4, silver: 39.4, bronze: 48.8 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 33 %, argent 78 %, bronze 98 % ; pressés : or 8 %, argent 13 %, bronze 33 %)
    // Avertissements de check-levels examinés et acceptés (LEVELS.md §6b) :
    acceptedWarnings: [
      { match: "rock @3194: seulement 56 px avant le bord", reason: "Passage clé de la Crête des Cairns (29/10) : cairn planté au bord du vide, voulu ; un seul saut franchit cairn + trou (100–140 px). Validé playtest auto (0 chute, rivaux 0 chute) et humain 40 essais : attentif 100 % / 0,30, pressé 85 % / 3,02." },
      { match: "rock @3514: seulement 56 px avant le bord", reason: "Passage clé de la Crête des Cairns (29/10) : cairn planté au bord du vide, voulu ; un seul saut franchit cairn + trou (100–140 px). Validé playtest auto (0 chute, rivaux 0 chute) et humain 40 essais : attentif 100 % / 0,30, pressé 85 % / 3,02." },
      { match: "rock @3834: seulement 56 px avant le bord", reason: "Passage clé de la Crête des Cairns (29/10) : cairn planté au bord du vide, voulu ; un seul saut franchit cairn + trou (100–140 px). Validé playtest auto (0 chute, rivaux 0 chute) et humain 40 essais : attentif 100 % / 0,30, pressé 85 % / 3,02." },
      { match: "rock @4164: seulement 56 px avant le bord", reason: "Passage clé de la Crête des Cairns (29/10) : cairn planté au bord du vide, voulu ; un seul saut franchit cairn + trou (100–140 px). Validé playtest auto (0 chute, rivaux 0 chute) et humain 40 essais : attentif 100 % / 0,30, pressé 85 % / 3,02." },
      { match: "rock @4494: seulement 56 px avant le bord", reason: "Passage clé de la Crête des Cairns (29/10) : cairn planté au bord du vide, voulu ; un seul saut franchit cairn + trou (100–140 px). Validé playtest auto (0 chute, rivaux 0 chute) et humain 40 essais : attentif 100 % / 0,30, pressé 85 % / 3,02." },
      { match: "rock @4834: seulement 56 px avant le bord", reason: "Passage clé de la Crête des Cairns (29/10) : cairn planté au bord du vide, voulu ; un seul saut franchit cairn + trou (100–140 px). Validé playtest auto (0 chute, rivaux 0 chute) et humain 40 essais : attentif 100 % / 0,30, pressé 85 % / 3,02." },
      { match: "rock @5174: seulement 56 px avant le bord", reason: "Passage clé de la Crête des Cairns (29/10) : cairn planté au bord du vide, voulu ; un seul saut franchit cairn + trou (100–140 px). Validé playtest auto (0 chute, rivaux 0 chute) et humain 40 essais : attentif 100 % / 0,30, pressé 85 % / 3,02." },
      { match: "ground@7150→ground@7790: marche montante sans trou (95 px)", reason: "Montée sur le premier des Sauts de Chamois avec tout l'élan (modèle des Rochers des Truites du N°15) ; pilote auto sans perte de temps, rivaux 0 chute au playtest." },
      { match: "ground@8165→ground@8210: marche montante sans trou (75 px)", reason: "Marche voulue du chemin sûr des Sauts de Chamois (ressaut sur place ≈ 0,5 s) — c'est le temps que fait gagner le raccourci risqué (shortcuts)." },
      { match: "ground@8585→ground@8630: marche montante sans trou (75 px)", reason: "Marche voulue du chemin sûr des Sauts de Chamois (ressaut sur place) — temps gagné par le raccourci risqué (shortcuts)." },
      { match: "ground@9005→ground@9050: marche montante sans trou (75 px)", reason: "Marche voulue du chemin sûr des Sauts de Chamois (ressaut sur place) — temps gagné par le raccourci risqué (shortcuts)." },
    ],
  };
})());

// ---------------------------------------------------------------------
// NIVEAU 18 — Le Glacier des Choucas Voltigeurs (niveau du jour, 2026-10-30)
// Niveau à mécaniques (règle d'alternance, après le N°17 classique) — mécanique INÉDITE v8 : la
// TYROLIENNE (`tyro()`, LEVELS.md §3h). Un câble d'acier tendu au-dessus d'une crevasse trop large
// pour un saut (520–680 px) : on saute au bord, les mains attrapent le câble et l'on glisse (480 px/s,
// plus vite qu'en courant) jusqu'au sol d'arrivée, plus bas. Appui trop court ou saut mal placé :
// on rate le câble et on tombe. Annoncée par un panneau, câble et pylônes visibles de loin, chevrons
// jaunes au point d'accroche. Passage clé : le RELAIS DES CHOUCAS, quatre tyroliennes enchaînées
// depuis des séracs de 300 px (on ressaute presque dès la réception), de plus en plus hautes à
// attraper (128 → 134 px à monter sur 137 : il faut sauter À FOND). Puis les SÉRACS SUSPENDUS
// (raccourci risqué de bloc en bloc, §6 étape 3c : l'or l'exige). Nouvelle palette `glacier`.
// ---------------------------------------------------------------------
LEVELS.push((() => {
  const id = "glacier-choucas", c = v(id);
  // câbles (montée à faire pour les attraper, mains au sol à y − 118) : Z1 104, Z2 116 px ; relais
  // Z3 128, Z4 131, Z5 133, Z6 134 px (un saut complet monte de 137)
  // (au point de prise : poignée garée à 30 px du bord pour Z2, à 60 px au-dessus du vide pour le relais)
  const Z1 = tyro(2500, 218, 3150, 312), Z2 = tyro(4800, 201, 5560, 322, 30),
    Z3 = tyro(6520, 182, 7150, 312, 60), Z4 = tyro(7360, 208, 7980, 342, 60),
    Z5 = tyro(8200, 236, 8800, 362, 60), Z6 = tyro(9020, 256, 9640, 382, 60);
  // balises le long du câble, à hauteur du corps du coureur en glisse (câble + 90)
  const along = (z, n) => { for (let k = 0; k < n; k++) { const x = z.x1 + 120 + ((z.x2 - z.x1 - 240) * k) / (n - 1); c.line(x, x, Math.round(z.y1 + ((z.y2 - z.y1) * (x - z.x1)) / (z.x2 - z.x1) + 90), 1); } };
  c.line(160, 420, 370, 3); c.arc(760, 900, 330, 3, 40); c.arc(1040, 1180, 330, 3, 40);
  c.arc(1400, 1520, 300, 3, 40); c.line(1560, 1640, 310, 2); c.arc(1700, 1800, 260, 3, 50);
  c.arc(1870, 1990, 320, 3, 40); c.line(2250, 2440, 370, 3);
  along(Z1, 5); c.line(3300, 3380, 400, 2); c.arc(3370, 3480, 360, 3, 50); c.arc(3690, 3820, 360, 3, 40);
  c.arc(3940, 4060, 300, 3, 50); c.arc(4180, 4320, 320, 3, 40); c.line(4400, 4700, 370, 3);
  along(Z2, 6); c.line(5650, 5780, 410, 2); c.arc(5820, 5940, 360, 3, 50); c.arc(5930, 6010, 350, 3, 40);
  c.line(6270, 6460, 370, 3);
  along(Z3, 5); along(Z4, 5); along(Z5, 5); along(Z6, 5);
  c.line(9790, 9940, 470, 2); c.arc(9970, 10100, 430, 3, 50); c.arc(10270, 10370, 420, 3, 40);
  c.line(10440, 10690, 410, 3); c.arc(10740, 10840, 390, 3, 30); c.line(10890, 11090, 370, 3); c.line(11370, 11440, 370, 2);
  // arcs des Séracs Suspendus (trajectoire du raccourci)
  c.arc(11645, 11865, 290, 3, 70); c.arc(12065, 12285, 290, 3, 70); c.arc(12485, 12705, 290, 3, 70);
  c.line(12880, 13100, 370, 3); c.arc(13130, 13260, 330, 3, 40); c.line(13340, 13620, 370, 3);
  return {
    id, name: "Le Glacier des Choucas Voltigeurs",
    blurb: "Les crevasses sont trop larges ? Saute, attrape la tyrolienne et file au-dessus du vide comme les choucas.",
    difficulty: "Tyroliennes", theme: "glacier",
    width: 14080, floor: 440, spawnX: 60,
    solids: [
      // Départ sur la moraine, ressauts de mise en jambes
      p(0, 760, 440),
      p(900, 480, 440), h(1080, 440),
      p(1500, 420, 380),
      // 1re TYROLIENNE (apprentissage) : 560 px de crevasse, câble bas (104 px à monter)
      p(2040, 460, 440),
      p(3060, 620, 470), h(3420, 470),
      p(3800, 420, 420), h(3960, 420),
      // 2e TYROLIENNE : 680 px de crevasse, câble plus haut (116 px)
      p(4300, 500, 440),
      p(5480, 520, 480),
      // Passage clé : le RELAIS DES CHOUCAS — quatre tyroliennes enchaînées ; entre deux, un sérac
      // de 300 px seulement (on ressaute presque dès la réception), câbles de plus en plus hauts
      // (128 → 134 px à monter : appui long obligatoire, un saut lâché tôt passe dessous)
      p(6100, 420, 440),
      p(7060, 300, 470),
      p(7900, 300, 500),
      p(8720, 300, 520),
      p(9560, 700, 540), _(9990, 64, 540),
      // Remontée sur la langue du glacier
      p(10360, 400, 480),
      // Les SÉRACS SUSPENDUS (raccourci risqué, LEVELS.md §6 étape 3c, modèle des Sauts de Chamois du
      // N°17) : quatre séracs (haut 345) séparés par trois crevasses. Chemin SÛR (pilote auto, rivaux) :
      // on se laisse tomber dans la crevasse (dalle basse 500), saut sur la marche (420) collée au sérac
      // suivant, ressaut sur place → ≈ 0,5 s perdue par crevasse. RACCOURCI (champ shortcuts) : grand
      // saut de sérac en sérac, 270 px bord à bord ; trop tôt ou appui trop court → dans la crevasse.
      p(10830, 640, 440),
      p(11470, 150, 345),
      p(11620, 155, 500), p(11845, 45, 420),
      p(11890, 150, 345),
      p(12040, 155, 500), p(12265, 45, 420),
      p(12310, 150, 345),
      p(12460, 155, 500), p(12685, 45, 420),
      p(12730, 100, 345),
      p(12830, 320, 440),
      // Dernier sprint jusqu'à l'arche, au refuge
      p(13240, 840, 440), g(13400, 440),
    ],
    hazards: [
      _(470, 70, 440),
      _(1640, 64, 380),
      _(5720, 64, 480),
      _(9990, 64, 540),
    ],
    ziplines: [Z1, Z2, Z3, Z4, Z5, Z6],
    signs: [
      panneau(2120, 440, "Tyrolienne :|saute au câble !"),
      panneau(6140, 440, "Relais des Choucas :|saute à fond ×4"),
      panneau(11220, 440, "Raccourci risqué :|de sérac en sérac"),
    ],
    // Raccourcis risqués (LEVELS.md §6 étape 3c) : sauts de sérac en sérac au-dessus des crevasses.
    shortcuts: [
      { name: "Séracs Suspendus 1", from: 11470, to: 11620, y: 345, land: 11890, landY: 345 },
      { name: "Séracs Suspendus 2", from: 11890, to: 12040, y: 345, land: 12310, landY: 345 },
      { name: "Séracs Suspendus 3", from: 12310, to: 12460, y: 345, land: 12730, landY: 345 },
    ],
    coins: c.list,
    checkpoints: [y(id, 2060, 440, 1), y(id, 4320, 440, 2), y(id, 6110, 440, 3), y(id, 10380, 480, 4), y(id, 13250, 440, 5)],
    finishX: 13640,
    rivals: [{ speed: 1.0 }, { speed: 0.93 }, { speed: 0.86 }],
    medals: { auto: 37.6, autoShort: 35.9, gold: 37.1, silver: 40.1, bronze: 43.1 }, // tools/medals.mjs --calibrate (40 essais attentifs : or 43 %, argent 93 %, bronze 98 % ; pressés : or 10 %, argent 23 %, bronze 35 %)
    // Avertissements de check-levels examinés et acceptés (LEVELS.md §6b) :
    acceptedWarnings: [
      { match: "ground@10830→ground@11470: marche montante sans trou (95 px)", reason: "Montée sur le premier des Séracs Suspendus avec tout l'élan (modèle des Sauts de Chamois du N°17) ; pilote auto sans perte de temps, rivaux 0 chute au playtest." },
      { match: "ground@11845→ground@11890: marche montante sans trou (75 px)", reason: "Marche voulue du chemin sûr des Séracs Suspendus (ressaut sur place ≈ 0,5 s) — c'est le temps que fait gagner le raccourci risqué (shortcuts)." },
      { match: "ground@12265→ground@12310: marche montante sans trou (75 px)", reason: "Marche voulue du chemin sûr des Séracs Suspendus (ressaut sur place) — temps gagné par le raccourci risqué (shortcuts)." },
      { match: "ground@12685→ground@12730: marche montante sans trou (75 px)", reason: "Marche voulue du chemin sûr des Séracs Suspendus (ressaut sur place) — temps gagné par le raccourci risqué (shortcuts)." },
    ],
  };
})());
