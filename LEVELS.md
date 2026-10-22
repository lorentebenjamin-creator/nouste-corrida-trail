# Format des niveaux — NOUSTE CORRIDA TRAIL (copie statique)

> **Source de vérité :** le dépôt GitHub (`main`) et sa copie de travail `/workspace/corrida-site`.
> Il n'y a pas d'autre copie de travail à jour : l'ancien worktree de la branche `classement`
> (périmé, resté sur le niveau 7) est archivé dans `/workspace/corrida-classement-ARCHIVE` depuis
> le 21/10 — ne jamais y travailler. Toujours commencer par `git pull` dans `/workspace/corrida-site`.

Tous les niveaux vivent dans **`levels.js`** (module ES, lisible, non minifié).
Le moteur du jeu (`assets/game.js`, code lisible) fait simplement
`import { LEVELS, THEMES } from "../levels.js"` : **ajouter un niveau = ajouter un bloc
`LEVELS.push(...)` à la fin de `levels.js`**, rien d'autre à toucher (ni build, ni HTML).

Le menu affiche les niveaux du N°1 (en haut) au plus récent (en bas) (liste défilante), numérotés
`N°1…N°n`, et le dernier niveau de `LEVELS` reçoit le badge **« Niveau du jour »**
(dès qu'il y a plus de 3 niveaux). Les mètres affichés = `Math.round(finishX / 10)`.

---

## 1. Repère et unités

* Unités en pixels « monde ». `x` va vers la droite, **`y` vers le BAS** (0 = haut).
* Le monde fait 780 px de haut (`WORLD_BOTTOM`). Tomber sous `y = 700` = chute (mort).
* La caméra montre 540 px de haut ; elle suit le joueur verticalement entre −24 et +150 :
  garder les sols entre `y ≈ 150` et `y ≈ 450` (niveaux d'origine : 260–440 ; la cheminée du
  niveau 6 monte jusqu'à 170). Au-delà de ~640 on ne voit plus les pieds.
* Coureur : boîte de **30 × 56 px**. Position `(x, y)` = coin haut-gauche.
* 1 m affiché = 10 px.

## 2. Objet niveau

```js
{
  id: "breche",            // unique, [a-z0-9-], NE JAMAIS CHANGER (clé des records localStorage)
  name: "La Brèche aux Isards",
  blurb: "Phrase courte (≈ 1 ligne) affichée sous le nom dans le menu.",
  difficulty: "Haute route",   // étiquette libre (orig. : Balade, Rythme, Hors-piste)
  theme: "breche",         // "forest" | "ridge" | "col" | une clé de THEMES
  width: 11600,            // largeur du monde (≥ fin du dernier sol ; ≤ 30000 : canvas hors-écran width×780)
  floor: 440,              // hauteur de référence : dessus du sol de départ et d'arrivée
  spawnX: 60,              // x de départ (le joueur apparaît à spawnX+28, rivaux autour)
  solids: [ ... ],         // sols, passerelles, rochers, troncs (helpers ci-dessous)
  hazards: [ ... ],        // ronces (mortelles au contact)
  coins: c.list,           // balises (pièces) générées avec v(id)
  checkpoints: [ ... ],    // fanions (points de contrôle), triés par x
  finishX: 10900,          // ligne d'arrivée ; l'arche est dessinée à finishX-86
  rivals: [{speed:1.0},{speed:0.92},{speed:0.85}], // EXACTEMENT 3 : Léa Morel (12), Karim El Yazidi (7), Inès Rocha (23)
  rockfalls: [ ... ],      // OPTIONNEL (v2) : chutes de pierres, helper chute()
  gusts: [ ... ],          // OPTIONNEL (v4) : rafales de vent de face, helper rafale() (§3d)
  signs: [ ... ],          // OPTIONNEL : panneaux de sentier (décor), helper panneau() (§3d, ravin au calme)
  patrols: [ ... ],        // OPTIONNEL (v2) : patous, helper patou()
  medals: { auto: 30.8, gold: 35.5, silver: 42, bronze: 49.5 }, // OPTIONNEL : écrit par tools/medals.mjs (§6 étape 5b)
  acceptedWarnings: [ { match: "…", reason: "…" } ],           // OPTIONNEL : avertissements check-levels acceptés (§6b)
}
```

Le dossard du joueur est le 42 ; les noms/couleurs/sprites des rivaux sont fixes dans le bundle
(tableau `I` : Léa = `game/lea.png`, Karim = `game/karim.png`, Inès = `game/ines.png`).
Seule leur vitesse est réglable par niveau (`speed` multiplie la vitesse de course 352 px/s).
Originaux : 0.93/0.84/0.74 → 0.97/0.88/0.78 → 0.99/0.90/0.82 ; niveau 4 : 1.00/0.92/0.85.

## 3. Helpers (définis et exportés en haut de `levels.js`)

| Helper | Signature | Produit | Notes |
|---|---|---|---|
| `p` | `p(x, w, y)` | **sol plein** de `x` à `x+w`, dessus à `y`, jusqu'en bas du monde | Les trous entre deux `p` sont des ravins (brouillard dessiné automatiquement). |
| `m` | `m(x, y, w)` | **passerelle** (planche) 18 px, traversable par-dessous, on peut descendre avec ↓ | ⚠ ordre `(x, y, w)` ≠ `p(x, w, y)` |
| `h` | `h(x, yDuSol)` | **rocher** 56×48 posé sur un sol de dessus `yDuSol` | Obstacle solide (à sauter). |
| `g` | `g(x, yDuSol)` | **tronc** 100×34 posé sur le sol | Obstacle solide (à sauter). |
| `_` | `_(x, w, yDuSol)` | **ronces** de largeur `w`, 30 px de haut, sur le sol | Contact = mort → retour au dernier fanion. Largeurs d'origine 64–96. |
| `v` | `const c = v(id)` | générateur de **balises** ; `c.list` à mettre dans `coins` | Un seul `v(id)` par niveau (ids `${id}-1…`). |
| `c.line` | `c.line(x1, x2, y, n)` | `n` balises alignées de x1 à x2 à la hauteur `y` | |
| `c.arc` | `c.arc(x1, x2, y, n, lift=52)` | `n` balises en arc, sommet `lift` px au-dessus de `y` | Idéal au-dessus d'un saut. |
| `y` | `y(id, x, yDuSol, k)` | **fanion** n°`k` (1, 2, 3…) | Doit être sur un sol de dessus `yDuSol`. Réapparition à `x+6`. |

Ramassage d'une balise : à moins de 20 px de la boîte du coureur. Une balise à `sol − 70`
se ramasse en courant ; entre `sol − 100` et `sol − 190` il faut sauter.

Départ (`DÉPART`) et arrivée (`ARRIVÉE`) sont dessinés automatiquement à `x=16` et `finishX−86`
sur `floor`. On franchit l'arrivée quand `x > finishX` avec les pieds à `y ≤ floor + 28`.

## 3b. Mécaniques v2 (passerelles mobiles, chutes de pierres, patous)

Toutes sont des **fonctions déterministes du temps** (horloge du monde, remise à 0 au départ) :
pas d'aléatoire, donc l'IA (rivaux et pilote auto) les prédit exactement et un niveau validé par
`tools/playtest.mjs` le reste.

| Helper | Signature | Où | Effet |
|---|---|---|---|
| `mp` | `mp(x, y, w, dx, dy, period, phase=0)` | `solids` | **Passerelle mobile** (planche 18 px, traversable par-dessous, ↓ pour descendre). Va-et-vient sinusoïdal entre `(x, y)` et `(x+dx, y+dy)`, un aller-retour en `period` s ; `phase` ∈ [0,1[ décale le cycle (0.5 = commence à l'autre bout). Elle **porte** les coureurs. `dx` = bac horizontal, `dy<0` = ascenseur. |
| `chute` | `chute(x, yDuSol, period=2.6, phase=0)` | `rockfalls` | **Chute de pierres** sur la colonne `[x, x+34]`. 55 % du cycle = alerte (ombre qui grossit, graviers, panneau « ! » en haut de l'écran), puis un bloc 34×34 tombe (mortel) et éclate au sol. |
| `patou` | `patou(x1, x2, yDuSol, period=4, phase=0)` | `patrols` | **Patou** (chien de berger 54×34) qui fait la ronde entre `x1` et `x2` sur un sol ; un aller-retour en `period` s. Contact = retour au fanion ; on lui saute par-dessus. |

Exemples (voir niveaux 5 et 6 dans `levels.js`) :

```js
solids: [ p(1100, 380, 440), mp(1560, 420, 140, 220, 0, 4.2), p(2060, 640, 440) ], // bac sur un gave
solids: [ p(3920, 500, 380), mp(4440, 380, 150, 0, -200, 4.8), { ...p(4420, 195, 470), net: true }, p(4615, 365, 200) ], // ascenseur + filet
rockfalls: [ chute(1180, 380, 2.2, 0.5) ],
patrols:   [ patou(620, 940, 440, 4.2) ],
```

Règles (vérifiées par `tools/check-levels.mjs`) :

* passerelle mobile : `period ≥ 2.4 s`, vitesse max `π·max(|dx|,|dy|)/period` ≤ 170 px/s (erreur > 220),
  trajet vertical dans [120, 660], largeur ≥ 110 ; à au moins une extrémité de son trajet, l'écart
  avec le sol précédent/suivant doit respecter les limites de saut (≤ 200 px, montée ≤ 110) ;
* chute de pierres : posée au-dessus d'un sol de dessus `yDuSol`, `period` assez longue pour que
  le bloc touche le sol (≈ 2,15 s mini pour un sol à 440), **jamais sur la zone de réapparition
  d'un fanion** (`[cp.x−10, cp.x+90]`) ni sur le départ ;
* patou : toute la ronde sur UN sol, vitesse `2·(x2−x1−54)/period` ≤ 220 px/s, ronde ≥ 114 px,
  jamais sur la zone d'un fanion ni à moins de 300 px du départ ;
* les sections franchies par passerelles mobiles sont signalées en `info` : **les valider avec
  `tools/playtest.mjs`** (obligatoire) ;
* **filet** (`{ ...p(x, w, y), net: true }`) : sol de rattrapage placé sous une passerelle mobile
  (ex. niveau 5 sous l'ascenseur) ; un embarquement raté coûte du temps au lieu d'une chute. Il est
  ignoré par le contrôle du parcours, doit être un sol fixe et laisser **≥ 60 px** sous le bas de la
  passerelle à son point le plus bas (sinon elle écraserait le coureur) — vérifié par check-levels.

Moteur : une passerelle qui **monte** rattrape un coureur qui retombe (ou qui est à l'apex de son
saut) au lieu de le traverser entre deux images (corrigé le 19/10, c'était la cause des chutes
« dans » l'ascenseur de l'Estive).

Idées de mise en page : chemin double (passerelles fixes au-dessus d'un sol gardé par un patou, voir
niveau 5 x≈2840–3800), montée en « cheminée » (passerelles en escalier + ascenseur, niveau 6
x≈1620–2300), descente en terrasses sous les pierres.

## 3c. Mécanique v3 : jet de cascade (`jets`)

```js
jet(x, w, top, bottom, period = 3, on = 0.4, phase = 0, warn = 0.6)
// → { x, w, top, bottom, period, on, phase, warn, push: 260, down: 520 }
jets: [ jet(2632, 64, -400, 720, 3.0, 0.4, 0.7) ],   // niveau 7, entre deux passerelles
```

Rideau d'eau vertical sur la colonne `[x, x+w]`, de `y = top` à `y = bottom`. Cycle déterministe
de `period` s (fonction du temps du monde, comme les autres mécaniques) : **actif** pendant la
fraction `on` du cycle, puis **pause** (un simple filet d'eau). Pendant les `warn` s qui précèdent
l'activation, le filet s'élargit, des gouttes tombent et un panneau bleu « ! » clignote en haut de
l'écran ; un grondement sonore marque le début du jet. `phase` ∈ [0,1[ décale le cycle.

Effet quand il est actif et qu'on le touche : **il ne tue pas**, il repousse (`vx ← −push`) et
plaque vers le bas (`vy ≥ down`). Sur un sol, on recule simplement ; **au-dessus d'un ravin, on
tombe** : c'est un passage chronométré (attendre sur la plateforme d'avant, sauter dans la pause).

IA : la simulation des rivaux et de l'autopilote applique exactement le même jet ; une trajectoire
qui touche un jet actif n'est pas « sûre », donc les rivaux attendent la pause au lieu de rebondir.

Validation (`tools/check-levels.mjs`) : `w` 30–120, `period` 2–6 s, `on` 0,2–0,6, pause
`period·(1−on)` ≥ 1,2 s, `warn` entre 0,4 s et pause − 0,3 s, `bottom > top`, un sol pour attendre
dans les 120 px avant le jet (sinon avertissement), jamais à moins de 60 px d'un fanion ni à moins
de 300 px du départ. Un jet au-dessus d'un ravin est signalé en `info` : le valider avec
`tools/playtest.mjs --human`.

## 3d. Mécanique v4 : rafales de vent de face (`gusts`)

```js
rafale(x1, x2, period = 4.2, on = 0.4, phase = 0, warn = 1.0, slow = 0.5)
// → { x1, x2, period, on, phase, warn, slow }
gusts: [ rafale(5300, 6200, 4.6, 0.45, 0.55) ],   // niveau 10, la Crête des Bérets
```

Zone horizontale `[x1, x2]` (toute la hauteur) balayée par un vent de face. Cycle déterministe de
`period` s (fonction du temps du monde, comme les autres mécaniques) : **rafale** pendant la
fraction `on` du cycle (au début du cycle, décalé par `phase` ∈ [0,1[), puis **calme**.

Effet pendant la rafale, si le centre du coureur est dans la zone : **il ne tue pas** ; la vitesse
de course **vers la droite** est multipliée par `slow` (au sol et en l'air : `vitesse cible =
352 × speed × slow`). On avance donc au ralenti et **un saut pris (ou fini) sous la rafale est
raccourci d'environ moitié** (≈ 126 px à plat au lieu de 252 avec `slow = 0.5`) : un ravin de
120–140 px sous le vent se saute **pendant le calme**, on attend sur la plateforme d'appel.
Reculer, attendre et sauter verticalement ne sont pas affectés. Sans `gusts`, le moteur est
strictement inchangé (`gustSlow` renvoie 1).

Annonce (les `warn` s avant la rafale, `warn ≥ 0,6 s`) :
* **les herbes se couchent** : des touffes (positions déterministes) sur tous les sols et
  passerelles fixes de la zone se couchent vers la gauche, le front de vent arrivant **de la
  droite** jusqu'à l'entrée de la zone ; couchées et agitées pendant la rafale, elles se
  redressent en 0,35 s au calme ;
* une **manche à air** orange et blanche plantée sur le sol juste avant la zone (`x1 − 14`) :
  pendante au calme, elle se lève pendant l'annonce et reste tendue pendant la rafale ;
* un **panneau « vent »** (trois traits) clignote en haut de l'écran pendant l'annonce, fixe
  pendant la rafale ; stries blanches et feuilles qui filent vers la gauche ; souffle sonore au
  début de la rafale.
Couleur des touffes : clé facultative de palette `tuft` (défaut `#e3d9a6`).

IA : la simulation des rivaux, de l'autopilote et du pilote humain (`simRunner`) applique
exactement le même ralentissement ; un saut qui finirait dans le ravin à cause du vent n'est pas
« sûr », donc l'IA attend le calme au bord. `getState()` expose `gustTime` (temps passé ralenti).

Validation (`tools/check-levels.mjs`) : zone ≥ 200 px, `period` 2,5–7 s, `on` 0,25–0,6, calme
`period·(1−on)` ≥ 1,4 s (avertissement sous 1,8 s), `warn` entre 0,6 s et calme − 0,4 s,
`slow` 0,45–0,7 (en dessous, l'IA croirait être bloquée), zones sans chevauchement, à ≥ 300 px du
départ, un sol à `x1 − 14` pour la manche à air (sinon avertissement), pas de passerelle mobile
ni de jet dans la zone (avertissement : une mécanique à la fois), plateforme d'appel ≥ 150 px
avant chaque saut sous la rafale (pour attendre le calme). Chaque saut sous une rafale est
signalé en `info` : le valider avec `tools/playtest.mjs --human`.

### Ravin au calme (revue du 21/10) et panneaux (`signs`)

Jusqu'au 21/10 le vent ne faisait que ralentir : un saut de 120–140 px pris **au ras du bord**
passe encore sous la rafale (portée ≈ 132 px + 30 px de corps + le temps de coyote). Un **ravin au
calme** est un ravin sous une rafale que l'on franchit largement au calme mais **où la rafale fait
tomber** : même appel au ras du bord, la portée sous la rafale (≈ 181 px avec `slow = 0.5`) est
inférieure à l'écart ; une rafale qui se lève juste après l'appel suffit aussi à faire tomber
(portée ≈ 197 px si elle arrive 0,2 s après l'appel). Exemple : le **Ravin du Béret** du N°10
(écart 185 px, zone `rafale(8960, 9560, 4.4, 0.45, 0.3)`). Recette :

```js
p(8190, 900, 440),                       // aire d'attente : ≥ 150 px sans danger avant le bord (ici 240)
p(9275, 1100, 440),                      // écart 185 : ≥ portée sous la rafale, ≤ portée au calme − 40
signs: [panneau(8800, 440, "Ravin :|saute au calme")],   // panneau dédié dans les 900 px avant le bord
gusts: [rafale(8960, 9560, 4.4, 0.45, 0.3)],             // manche à air à x1 − 14, sur l'aire d'attente
```

* `panneau(x, yDuSol, "Ligne 1|Ligne 2")` : panneau jaune sur poteau, planté sur un sol (décor
  seul, aucun effet de jeu ; 2 lignes de 20 caractères max, séparées par `|`). Il s'ajoute aux
  indices de vent (herbes, manche à air, panneau « vent ») ; il ne les remplace pas.
* Un écart > 165 px déclenche l'avertissement « rivaux lents en difficulté » : l'accepter
  (`acceptedWarnings`, §6b) en citant le playtest (le rival le plus lent, 0,86, a une portée de
  ≈ 244 px au calme) ; ne jamais dépasser 200 px (erreur).
* `check-levels` calcule, pour chaque saut sous une rafale, la portée sous la rafale et au calme
  (même intégration que le moteur) ; si la rafale fait tomber, il l'indique en `info`
  (« RAVIN AU CALME ») et **avertit** s'il manque le panneau (texte contenant « calme », dans les
  900 px avant le bord), s'il n'y a pas d'aire d'attente sûre (≥ 150 px sans ronce, rocher,
  tronc, pierres ni patou avant le bord) ou si l'écart laisse moins de 40 px de marge au calme.
* Pilote humain : le profil attentif « joue les accalmies » (il ne saute pas au-dessus du vide
  sous la rafale ni quand les herbes couchées annoncent une rafale qui arriverait avant la fin
  du saut, ≈ 0,8 s) ; le profil pressé (`--calm 0`) ne s'appuie que sur sa lecture du moment.
  Valider avec les deux profils (§6 étape 5) : au moins 70 % en profil pressé pour le N°10.

**Piège connu (pilote IA)** : ne pas poser de **ronce** juste après une réception dans une zone
de vent, sur une plateforme courte (< ~330 px de sol derrière). Si la rafale tombe, l'IA s'arrête
collée à la ronce et ne peut ni sauter sans élan ni reculer (elle tomberait) : essai « bloqué ».
Mettre plutôt un rocher (on peut s'arrêter devant sans risque), ou la ronce sur un long sol.

## 4. Thèmes

Le décor est **100 % procédural** (dégradé de ciel, crêtes, sapins, sol, ronces) : un thème
est juste une palette. Intégrés : `forest` (Sous-bois), `ridge` (Crête), `col` (Col du vent).
On peut en ajouter dans `THEMES` de `levels.js` (fusionnés dans le bundle) avec **toutes** ces
clés : `skyTop skyMid skyBot ridge ridge2 pine pine2 dirt dirtDark grass grassDark wood woodDark
rock rockDark thorn leaf berry fog`. Exemple : `breche` (neige au crépuscule) du niveau 4.
Réutiliser un thème existant est toujours sûr. Palettes ajoutées : `breche` (niv. 4, neige au
crépuscule), `estive` (niv. 5, pâturage d'été), `pierrier` (niv. 6, pierrier sous l'orage), `cascade` (niv. 7, gorges moussues), `nuit` (niv. 8, trail de nuit au clair de lune),
`hetraie` (niv. 9, hêtraie d'automne au petit matin, sapins roux = hêtres), `lande` (niv. 10,
lande ventée du plateau, bruyère mauve, clé facultative `tuft` pour les touffes d'herbe du vent),
`neve` (niv. 11, névé d'altitude au soleil de midi, neige éblouissante, crevasses bleu nuit).

Clés **facultatives** (décor seul, aucun effet de jeu ; utilisées par `nuit`, à mettre sur toute
palette sombre) : `rim` (couleur du liseré clair sur le dessus et les bords des sols et passerelles,
mobiles comprises), `water` + `waterHi` (gave visible au fond des ravins, avec reflets animés ; la
chute reste mortelle sous y = 700), `fireflies: true` (lucioles à positions déterministes au-dessus
des trous, des points d'appel et des trajets des bacs). **Un niveau de nuit doit avoir `rim`.**

## 5. Physique (extraite du code, `assets/game.js`)

| Constante | Valeur |
|---|---|
| Vitesse de course max | 352 px/s × `speed` (joueur : speed = 1) |
| Accélération sol / air | 3600 / 2100 px/s² ; freinage 3000 |
| Impulsion de saut | vy = −770 px/s |
| Gravité montée / descente / près de l'apex (\|vy\|<110) | 2100 / 4700 / 1200 px/s² ; chute max 1080 px/s |
| Coyote time / tampon de saut | 0,11 s / 0,13 s |
| Saut court | relâcher le saut en montée multiplie vy par 0,48 |
| Pas de simulation | 1/60 s (fixe) |

Trajectoire simulée d'un saut complet (pieds), distance horizontale parcourue quand les pieds
repassent à la hauteur d'arrivée :

| Vitesse | Apex | à plat | +60 | +90 | +120 | −90 | −170 |
|---|---|---|---|---|---|---|---|
| 1.00 (joueur, Léa niv.4) | **137 px** | **252 px** | 229 | 217 | 194 | 282 | 305 |
| 0.92 | 137 | 232 | 210 | 200 | 178 | 259 | 281 |
| 0.85 | 137 | 214 | 194 | 185 | 165 | 239 | 259 |

L'écart franchissable bord à bord ≈ distance ci-dessus + ~30 px (largeur du corps) − la distance
d'appel. **Règles de conception sûres** (respectées par le niveau 4, vérifiées par l'outil) :

* écart entre plateformes **≤ 160 px** (erreur > 200) ; montée **≤ 100 px** (erreur > 110) ;
  pour une montée de 60–90 px, écart **≤ 130 px** ;
* plateformes / passerelles d'au moins **150 px** de large dans une suite de sauts ;
* après une ronce, **≥ 235 px** de sol avant le bord ; après un rocher/tronc **≥ 260 px**
  (sinon on retombe dans le ravin) ; laisser **≥ 60 px** entre une réception et l'obstacle suivant ;
* **aucun danger dans les 360 px après un fanion ou le départ**, et ≥ 360 px de sol après un fanion :
  les rivaux réapparaissent verrouillés 0,85 s (ils ne peuvent pas sauter) ;
* éviter « petite chute + obstacle juste après » : l'IA des rivaux saute toujours vers la
  plateforme suivante si l'écart < 205×speed, et retombe trop loin.

IA des rivaux (v2, `aiDecide` dans `assets/game.js`) : à chaque image, chaque rival **simule
la même physique** sur ~1,2 s pour plusieurs plans (avancer ; sauter maintenant ou dans 3/6 images ;
attendre ; reculer ; en l'air : continuer, lâcher, contre-braquer) en tenant compte des ronces, des
passerelles mobiles, des pierres et des patous, et choisit le premier plan sûr (sauter le plus tard
possible, attendre qu'un bac revienne, laisser passer un patou…). Après une chute, un rival reste
immobile 0,85 s au fanion (il ne repart plus droit dans les ronces). Au bout de 8 chutes il est
déclaré arrivé (temps + 22 s) — `tools/playtest.mjs` échoue si cela arrive. Le **pilote auto** du
playtest utilise exactement cette IA pour le joueur (vitesse 1, sauts complets) : s'il passe sans
chute, un humain peut passer.

## 6. Recette : ajouter UN niveau (job quotidien)

1. `git pull`. Ouvrir `levels.js`, aller tout en bas (après le dernier `LEVELS.push`).
2. Copier un bloc existant comme modèle et le coller à la fin : niveau 4 (`breche`) pour un niveau
   classique, niveau 5 (`estive`) ou 6 (`couloir`) pour un niveau avec mécaniques v2. Changer :
   * `id` : nouveau, unique, minuscules (ex. `"lac-gaube"`), utilisé aussi dans `v(id)` et `y(id, …)`.
     Format imposé par le classement en ligne : `^[a-z0-9][a-z0-9-]{0,39}$` (vérifié par check-levels) ;
   * `name`, `blurb` (≈ 1 phrase, français), `difficulty`, `theme` (existant de préférence) ;
   * la géométrie. Méthode : enchaîner des sections de gauche à droite en notant l'`x` de fin de
     chaque sol ; démarrer par `p(0, ≥600, floor)` ; finir par un sol à `floor` qui couvre
     `finishX` à `finishX + 300` ; `width` ≈ fin du dernier sol + 100.
   * 3 à 6 fanions répartis, chacun en début de plateforme sûre (≥ 360 px sans danger après) ;
   * balises : quelques `line` à sol−70 et des `arc(…, 40)` au-dessus des sauts ;
   * `rivals` : vitesses ~1.0 / 0.92 / 0.85 (baisser pour un niveau plus facile) ;
   * optionnel : `rockfalls`, `patrols`, passerelles `mp(...)` (§3b) — 1 à 2 types par niveau suffisent.
3. **Règle « 1 nouveauté par niveau »** : chaque nouveau niveau doit introduire **au moins une
   mécanique inédite** (§3b/§3c/§3d, ou une nouvelle à coder) **ou au moins un passage clé jamais
   vu** (une combinaison ou une mise en page qui n'existe dans aucun niveau précédent : ex. jet
   au-dessus d'un bac mobile, patou sur une passerelle haute, cheminée sous les pierres…).
   Le dire dans un commentaire `// Passage clé : …` au-dessus de l'élément concerné **et** dans la
   colonne « Nouveauté du sentier » du tableau du `README.md`. Un niveau qui ne fait que
   réassembler des passages déjà vus n'est pas accepté.
   Ne jamais modifier ni supprimer un niveau existant, ni changer d'`id`.
3b. **Règle d'alternance** (ajoutée le 19/10) : après une série de niveaux à mécaniques (5, 6, 7, 8
   sont tous à mécaniques), le niveau du jour suivant doit être un niveau **« classique »** de
   rythme/endurance **sur le modèle du niveau 4** (`breche`) : sols, ravins, ronces, rochers,
   troncs, passerelles fixes, fanions — **avec une seule nouveauté** (une seule mécanique de
   §3b/§3c, utilisée avec parcimonie, ou un seul passage clé inédit), pas de combinaison de
   mécaniques. Ensuite on peut alterner : 1 niveau à mécaniques, 1 niveau classique.
   **Le N°9 (prochain job quotidien) DOIT être classique.** Le dire dans le commentaire d'en-tête
   du niveau (`// Niveau classique (règle d'alternance) — nouveauté : …`).
   Suite : N°9 classique, N°10 à mécaniques (rafales de vent, §3d) → **le N°11 DOIT être
   classique** (une seule nouveauté ; il peut utiliser une seule mécanique existante, rafales
   comprises, avec parcimonie), puis N°12 à mécaniques, etc.
4. Vérifier : `node tools/check-levels.mjs` → **0 erreur et 0 avertissement non justifié**
   (dernière ligne : `… 0 erreur(s), 0 avertissement(s) non justifié(s), N accepté(s)`).
   Un avertissement du nouveau niveau se **corrige dans la géométrie** ; on ne l'accepte
   (`acceptedWarnings`, §6b) que s'il est voulu et validé par le playtest humain, avec la raison.
   Les avertissements connus des niveaux 1–3 d'origine sont déjà acceptés. Les lignes `info`
   (passerelles mobiles, jets au-dessus du vide, niveau sans médailles) imposent les étapes 5 et 5b.
5. Tester en vrai (recommandé, obligatoire avec des mécaniques v2) :
   **Source de vérité des outils : `tools/` de ce dépôt** (revue du 22/10). On les lance **depuis
   la racine du dépôt**, Playwright étant fourni par un **lien symbolique temporaire `node_modules`**
   vers une installation existante (`/workspace/pwtest/node_modules` sur la machine du job) ; le
   lien est ignoré par git (`.gitignore`), ne jamais le commiter, le supprimer à la fin, et arrêter
   le serveur. **Ne pas copier les scripts dans `pwtest`** (ni ailleurs) pour les lancer : les
   copies dérivent (constaté le 22/10) et `medals.mjs` / `check-levels.mjs` lisent `../levels.js`
   relativement à leur emplacement (une copie dans `pwtest` ne trouve pas le bon fichier). Toute
   amélioration d'un outil se fait dans `tools/` et se commite.
   ```bash
   ln -s /workspace/pwtest/node_modules node_modules   # Playwright (sinon : npm i playwright && npx playwright install chromium ailleurs)
   tools/serve.sh &                                     # http://localhost:8765/nouste-corrida-trail/
   URL=http://localhost:8765/nouste-corrida-trail/      # URL facultative : c'est la valeur par défaut des outils
   node tools/playtest.mjs $URL last /tmp/niveau.png
   node tools/playtest.mjs $URL all                     # tous les niveaux
   node tools/e2e.mjs $URL                              # commandes, fanions, record, menu, médailles
   node tools/e2e-classement.mjs $URL                   # classement en ligne (faux backend)
   node tools/capture.mjs $URL <id> /tmp/passage.png --x 10500   # capture d'un passage (pilote auto)
   node tools/playtest.mjs $URL last --human --trials 20 --verbose
   # à la fin :
   kill %1; rm node_modules
   ```
   **Pilote humain obligatoire** (job quotidien compris), dans les deux profils :
   ```bash
   node tools/playtest.mjs $URL last --human --trials 20 --verbose                                         # attentif
   node tools/playtest.mjs $URL last --human --trials 20 --jitter 80 --hold 0.18-0.5 --delay 180-250 --calm 0 --hesit 0 --verbose   # pressé
   ```
   (Depuis le 21/10 le profil attentif hésite parfois après une réception et attend le calme avant
   un saut au-dessus du vide dans le vent ; le profil pressé ne fait ni l'un ni l'autre :
   `--calm 0 --hesit 0` redonne exactement le profil pressé des mesures précédentes.)
   Viser **≥ 60 % de réussite** (≤ 5 chutes) en profil pressé pour un niveau « Engagé » et au-delà,
   ≥ 90 % en dessous ; `--verbose` liste les essais ratés et l'endroit des chutes.
   **Courbe monotone** : comparer aux chiffres du niveau précédent (§8). Si l'étiquette dit « plus
   dur » que le précédent, le nouveau niveau doit l'être dans **les deux profils** (plus de chutes
   moyennes, réussite égale ou plus basse) ; sinon, **ajuster la géométrie ou changer l'étiquette**
   (un niveau classique après une série à mécaniques peut légitimement être plus facile : lui donner
   une étiquette cohérente, ex. « Haute route », « Rythme »). Ajouter la ligne du niveau dans les
   deux tableaux du §8.
   Attendu : `PLAYTEST OK` (le pilote auto finit sans chute, aucun rival en boucle, aucune erreur
   console) et `E2E OK`. Si le pilote auto échoue, la ligne indique où il est tombé (`chutes à x,y`) :
   élargir la plateforme, réduire l'écart, ralentir la passerelle ou décaler la phase.
5b. **Médailles, calibrées sur le pilote humain** (obligatoire pour le job quotidien, une fois la
   géométrie définitive ; méthode de la revue du 21/10) :
   ```bash
   node tools/medals.mjs $URL last --calibrate --trials 40 --write   # pilote auto + 2 profils humains, écrit `medals:`
   node tools/medals.mjs $URL all --human --trials 20 --md           # contrôle de tous les niveaux, sans écrire
   node tools/medals.mjs $URL all --calibrate --trials 40 --keep-auto # propositions pour tous, sans écrire
   ```
   `--calibrate` lance le pilote auto (temps `auto`, il faut `chutes joueur 0`), puis le pilote
   humain dans les **deux profils** (attentif ; pressé = `--delay 180-250 --jitter 80 --hold
   0.18-0.5 --calm 0 --hesit 0`) et choisit **au dixième de seconde** les temps cibles d'après les
   essais **attentifs** (un essai raté compte sans médaille) :
   * **or** : la part des essais attentifs qui l'atteignent est la plus proche de **17,5 %**, dans
     la fenêtre **10–25 %** (sinon le script affiche ⚠ : temps trop groupés, voir le pilote humain) ;
   * **argent** ≈ **50 %** des essais attentifs, **bronze** ≈ **85 %** ;
   * **cible d'argent sur le profil pressé** (revue du 22/10) : l'argent est relevé, si besoin,
     jusqu'au temps atteint par **≈ 30 % des essais pressés**, mais **jamais au-delà du milieu de
     l'intervalle or–bronze** (règle d'espacement). Pourquoi : quand les essais attentifs sans
     chute sont très groupés et que les ratés partiels étirent la queue, l'argent « 50 % attentif »
     collait à l'or (N°11 au 21/10 : or 32,8 / argent 33,4 / bronze 43,6 s, soit 0,6 s puis 10,2 s ;
     profil pressé 3 % / 13 % / 50 % sur 40 essais). Le plafond au milieu évite l'excès inverse sur
     les niveaux à mécaniques, où 30 % des pressés n'arrivent qu'au-delà du bronze (N°5–7) : l'argent
     ne prend jamais plus de la moitié de l'écart or–bronze ;
   * toujours `auto ≤ or`, argent ≥ or + 0,5 s, bronze ≥ argent + 0,5 s (paliers progressivement
     plus faciles).
   La ligne écrite donne aussi les parts du profil pressé (`… ; pressés : or 3 %, argent 30 %,
   bronze 50 %`). Sans `--write`, `--calibrate` affiche les propositions sans rien changer :
   l'utiliser sur `all` pour repérer un niveau déséquilibré, **mais ne réécrire que le niveau du
   jour** (ou un niveau dont la géométrie a changé) — ne pas recalibrer tout sans raison.
   Il écrit/remplace, juste sous `rivals:` du bloc, la ligne `medals: { auto, gold, silver, bronze }`
   avec en commentaire les parts obtenues (`// tools/medals.mjs --calibrate (40 essais attentifs :
   or 18 %, argent 50 %, bronze 85 %)`), et affiche pour chaque niveau les pourcentages or / argent /
   bronze des deux profils. Les graines étant fixes, deux lancements donnent les mêmes temps.
   Ne pas l'écrire à la main. **Relancer après toute retouche de géométrie.** Vérifier ensuite
   avec `--human --trials 20` que l'or reste dans 10–25 % des essais attentifs (sur 20 essais,
   ±1 essai de bruit, soit 5–30 %, est acceptable) et ajouter la ligne au tableau des médailles (§8).
   Sur un niveau à rafales, l'or doit rester atteignable **en jouant les accalmies** (le profil
   attentif attend le calme : ses meilleurs temps sont l'objectif de l'or).
   Ancienne règle, encore disponible sans pilote humain (`node tools/medals.mjs $URL last --write`
   ou `--from-auto mon-id=31.6 --write`) : or = auto × 1,15, argent × 1,35, bronze × 1,6, arrondis
   à la demi-seconde supérieure — trop généreuse (85–95 % d'or en profil attentif sur les niveaux
   1–4 et 9), à ne plus utiliser pour le job quotidien.
   Un niveau sans `medals` (ou avec un champ invalide) fonctionne : simplement aucune médaille
   (check-levels l'indique en `info`). Le menu affiche, sous chaque sentier, la médaille du record
   local (localStorage) et les trois temps cibles ; l'écran d'arrivée affiche la médaille de la
   course, le record et le temps visé pour la médaille suivante.
6. Classement en ligne (Supabase) : **rien à faire**. Aucun SQL, aucune ligne `level_limits` à
   ajouter : un nouvel `id` est accepté automatiquement avec la borne générale (temps ≥ 8 s).
   `level_limits` (temps minimum par niveau) est un réglage facultatif fait à la main dans le SQL
   Editor ; le job ne doit pas y toucher. Ne pas modifier `leaderboard-config.js`.
   Les tests locaux (playtest/e2e) gardent le nom « Toi » et n'envoient donc aucun temps.
7. Mettre à jour la liste des niveaux du `README.md`, puis
   `git commit -am "Niveau N : <nom>" && git push`. GitHub Pages redéploie en 1–2 min
   (cache ~10 min côté navigateur).

## 6b. Avertissements acceptés (`acceptedWarnings`)

`check-levels` sépare les avertissements **non justifiés** (à corriger, ils comptent dans le total)
des avertissements **acceptés**, déclarés dans le bloc du niveau :

```js
rivals: [ ... ],
// Avertissements de check-levels examinés et acceptés (LEVELS.md §6b) :
acceptedWarnings: [
  { match: "ronce @860: seulement 220 px avant le bord", reason: "Ronce collée au rocher @820 : un seul saut, …" },
],
```

* `match` = **début exact** du message d'avertissement (copié depuis la sortie, sans `avert.  [n:id]`) ;
  mettre assez de texte pour ne viser qu'un avertissement (`ronce @300:` ≠ `ronce @3000`).
* `reason` obligatoire (≥ 10 caractères) : pourquoi c'est voulu, et la preuve (playtest humain…).
* Les avertissements acceptés sont listés à part, en fin de sortie (`accepté [n:id] … — raison`).
* Une entrée qui ne correspond plus à aucun avertissement (géométrie corrigée) devient un
  avertissement `acceptedWarnings obsolète` : la retirer.
* Les erreurs (`ERREUR`) ne peuvent jamais être acceptées.

Revue du 20/10 : 27 avertissements avant ; corrigés dans la géométrie : N°3 (`col`, le sol
`p(660, …)` passe de 380 à 420 px : 260 px de sol après le rocher @820 et écart 100 au lieu de 140
vers le ressaut, ce qui supprime aussi la montée 60/140) et N°8 (`gue-lucioles`, passerelles de
la nuit 115/125 → 140/140 px : écart 130 au lieu de 155 pour la montée de 40, et 160 au lieu de 175
vers la terrasse) ; les 23 restants sont acceptés (niveaux 1–3 d'origine, radeaux rapides du N°8).

## 7. Ce qui a été modifié par rapport au bundle d'origine

* `assets/index-wVumaOia.js` : l'hydratation TanStack Router/SSR est remplacée par un rendu client
  du jeu dans `#root` (le routeur cassait sous un sous-chemin et sans HTML SSR), qui charge
  `./game.js`. Le reste (React, etc.) est inchangé.
* `assets/game.js` (ex-`routes-DUFPCL9U.js`, dé-minifié et maintenu à la main) :
  niveaux importés de `../levels.js` + palettes `THEMES` ; menu du N°1 en haut au plus récent en bas
  (`N°k`, badge « Niveau du jour ») ; sprites en chemins relatifs ; **v2** : passerelles mobiles,
  chutes de pierres, patous ; IA par simulation (rivaux + pilote auto) ; rivaux immobiles 0,85 s
  après une chute ; record enregistré dès l'arrivée du joueur ; bouton tactile ↓ (descendre d'une
  passerelle) ; bouton pause masqué pendant une chute (il n'y faisait rien) ; brouillard des
  ravins corrigé au pied des falaises ; API de test `window.__controlsTest` (`setAutopilot`,
  `teleport`, `getState`, …).
* **v4 (21/10)** : rafales de vent de face (`gusts`, §3d) — `gustState` / `gustSlow` (vitesse
  cible vers la droite × `slow`, appliquée dans `$` et dans `simRunner`, donc rivaux, autopilote
  et pilote humain la prévoient), touffes d'herbe, manche à air, stries, panneau et souffle
  (`drawGust`, `tickDynamicSounds`), `getState().gustTime`. Niveaux sans `gusts` : inchangés
  (temps autopilote des N°1–9 identiques au dixième après la modification).
* **Revue du 21/10** : panneaux de sentier (`signs`, `drawSign`, décor seul) ; pilote humain :
  option `calm` (attend le calme avant un saut au-dessus du vide dans une rafale) et hésitations
  après certaines réceptions (`hesitP` 0,2, `pauseMin`/`pauseMax` 0,1–0,4 s), sans aucun effet sur
  le pilote auto ni les rivaux ; temps cibles de médaille affichés au centième si besoin (`WT`) ;
  correction de l'affichage des dixièmes (`W(14.1)` affichait 14.0).
* `assets/routes-x3PbsDEU.css` : URLs des polices relatives. `custom.css` : liste de niveaux
  défilante, badge, bouton ↓, médailles (disques CSS, sans emoji).
* Médailles (revue du 20/10) : `medalTargets` / `medalOf` / `medalNext` dans `assets/game.js` lisent
  le champ facultatif `medals` du niveau ; menu (médaille du record local + temps cibles) et écran
  d'arrivée (médaille de la course, record, temps visé pour la suivante). `getState()` expose
  `finishTime` (temps d'arrivée exact du joueur), utilisé par `tools/playtest.mjs` et `tools/medals.mjs`.
* Supprimés : `extensions.js` de grok.com, manifeste `/__grok/…`.

## 8. Courbe de difficulté (niveaux 1–11)

| N° | Niveau | Étiquette | Longueur | Ravins | Ronces | Mécaniques v2 | Rivaux (vitesse) | Pilote auto |
|---|---|---|---|---|---|---|---|---|
| 1 | Sous-bois des cèdres | Balade | 498 m | 4 | 4 | — | 0.93 / 0.84 / 0.74 | 13,9 s |
| 2 | La crête | Rythme | 646 m | 10 | 7 | — | 0.97 / 0.88 / 0.78 | 18,1 s |
| 3 | Col du vent | Hors-piste | 762 m | 12 | 11 | — | 0.99 / 0.9 / 0.82 | 21,6 s |
| 4 | La Brèche aux Isards | Haute route | 1090 m | 20 | 8 | — | 1 / 0.92 / 0.85 | 30,8 s |
| 5 | L'Estive des Patous | Technique | 940 m | 10 | 3 | 5 passerelles mobiles, 4 patous, 1 filet sous l'ascenseur | 1 / 0.93 / 0.86 | 31,8 s |
| 6 | Le Couloir des Pierres | Extrême | 1030 m | 13 | 2 | 4 passerelles mobiles, 11 chutes de pierres, 2 patous | 1 / 0.94 / 0.88 | 29,4 s |
| 7 | La Cascade des Desmans | Engagé | 950 m | 9 | 4 | 2 radeaux lents, 1 patou, **1 jet de cascade** | 1 / 0.93 / 0.86 | 31,7 s |
| 8 | Le Gué des Lucioles | Très engagé | 956 m | 11 | 6 | 2 radeaux, 3 patous, 3 jets (dont **1 sur l'embarcadère d'un radeau**) | 1 / 0.93 / 0.87 | 29,8 s |
| 9 | La Hêtraie des Palombes | Endurance | 1120 m | 19 | 8 (dont **2 sur des passerelles**) | — (classique) | 1 / 0.93 / 0.86 | 31,6 s |
| 10 | Le Plateau des Bérets Envolés | Bien engagé | 1000 m | 14 | 4 | **5 zones de rafales de vent** (8 sauts sous le vent, dont **1 ravin au calme**, le Ravin du Béret, avec panneau) | 1 / 0.93 / 0.86 | 30,8 s |
| 11 | Le Névé des Marmottes Frileuses | Haute montagne | 1145 m | 22 | 6 | — (classique ; passage clé : **7 séracs en dents de scie**) | 1 / 0.93 / 0.86 | 32,3 s |

Médailles **calibrées le 21/10** (`tools/medals.mjs --calibrate --trials 40`, §6 étape 5b) ;
pourcentages ci-dessous sur 20 essais par profil (essais ratés comptés sans médaille) :

| N° | Niveau | Pilote auto | Or | Argent | Bronze | Attentif or / argent / bronze | Pressé or / argent / bronze |
|---|---|---|---|---|---|---|---|
| 1 | Sous-bois des cèdres | 13,9 s | 14,1 s | 14,6 s | 15,1 s | 10 % / 60 % / 90 % | 35 % / 50 % / 55 % |
| 2 | La crête | 18,1 s | 18,25 s | 18,8 s | 19,3 s | 25 % / 85 % / 90 % | 30 % / 45 % / 50 % |
| 3 | Col du vent | 21,6 s | 21,7 s | 22,2 s | 22,7 s | 25 % / 80 % / 90 % | 10 % / 30 % / 30 % |
| 4 | La Brèche aux Isards | 30,8 s | 31,1 s | 31,8 s | 34,2 s | 15 % / 50 % / 85 % | 5 % / 10 % / 15 % |
| 5 | L'Estive des Patous | 31,8 s | 32,0 s | 33,0 s | 42,1 s | 20 % / 55 % / 80 % | 0 % / 20 % / 25 % |
| 6 | Le Couloir des Pierres | 29,4 s | 31,6 s | 35,2 s | 43,1 s | 10 % / 35 % / 80 % | 0 % / 5 % / 30 % |
| 7 | La Cascade des Desmans | 31,7 s | 32,1 s | 34,5 s | 40,3 s | 25 % / 60 % / 85 % | 0 % / 5 % / 30 % |
| 8 | Le Gué des Lucioles | 29,8 s | 33,8 s | 37,4 s | 44,5 s | 15 % / 60 % / 95 % | 15 % / 30 % / 40 % |
| 9 | La Hêtraie des Palombes | 31,6 s | 32,0 s | 32,5 s | 37,8 s | 15 % / 55 % / 75 % | 10 % / 30 % / 60 % |
| 10 | Le Plateau des Bérets Envolés | 30,8 s | 35,9 s | 40,1 s | 44,5 s | 20 % / 50 % / 90 % | 25 % / 40 % / 45 % |
| 11 | Le Névé des Marmottes Frileuses | 32,3 s | 32,8 s | 33,4 s | 43,6 s | 15 % / 60 % / 85 % | 0 % / 10 % / 50 % |

Lecture : sur un niveau sans mécanique, un essai attentif sans chute ni hésitation finit au temps
du pilote auto, d'où un or très proche de `auto` (×1,01) ; sur les niveaux à mécaniques (6, 8, 10),
l'attente (pierres, radeaux, calme) écarte davantage l'or du pilote auto. N°2 : temps attentifs très
groupés (18,15–18,35 s), aucun dixième ne tombe dans la fenêtre 10–25 % (18,2 s → 3 %, 18,3 s → 28 %
sur 40 essais) : or au 0,05 s (18,25 s → 13 % sur 40 essais). Sur les niveaux 1 et 2 le profil pressé,
qui n'hésite jamais, décroche plus souvent l'or que l'attentif (ses essais sans chute sont parfaits).
N°10 : l'or reste atteignable **en jouant les accalmies** (le profil attentif attend le calme ;
20 % d'or sur 20 essais, 15 % sur 40). Avant le calibrage (anciens multiplicateurs, ancien profil),
l'or allait à 85–100 % des essais attentifs sur les N°1–5 et 9, et à 65 % sur le N°10.

Progression voulue : 1–3 apprennent sauts, ronces, passerelles ; 4 = endurance (le plus long,
aucune mécanique, rivaux à 1,00) ; 5 = découverte des mécaniques v2 avec du temps pour lire
(bacs lents, patous, chemin double, ascenseur) ; 6 = tout combiné en cadence (pierres
rapprochées, cheminée, bacs au-dessus du vide, rivaux les plus rapides). « Pilote auto » = temps
du pilote parfait de `tools/playtest.mjs` (un humain met nettement plus). 7 = jet de cascade ;
8 = nuit, jet + radeau, le plus dur des deux profils après la revue du 19/10. 9 = **classique**
sur le modèle du 4 (règle d'alternance, §6 étape 3b) : un peu plus long et un cran au-dessus du 4
(ronces sur les passerelles de la palombière), nettement en dessous des niveaux à mécaniques.
10 = **rafales de vent de face** (mécanique v4 inédite, §3d), entre le 7 et le 8 en profil pressé.
11 = **classique** (névé, séracs en dents de scie), un cran au-dessus du 9 en chutes.
**Prochain niveau (N°12) : à mécaniques**, puis alternance 1 à mécaniques / 1 classique.

### Pilote « humain » (`tools/playtest.mjs --human`)

Même cerveau que l'autopilote (simulation exacte de la physique), rendu imprécis :

* **délai de réaction** 150–200 ms (tiré par essai) : les décisions sont prises sur l'état
  extrapolé à +délai et exécutées après ce délai ; si l'anticipation se termine mal (danger pas
  vu), réflexe sur l'état présent ; après une chute, il repart après le délai ;
* **hésitations** (profil attentif, revue du 21/10) : après une réception, dans 20 % des cas, il
  lâche la direction 0,1–0,4 s (seulement si s'arrêter là est sûr) — sans elles, tous les essais
  sans chute finissaient au centième près au temps du pilote auto et l'or ne pouvait pas être
  calibré ; `--hesit 0` les coupe ;
* **attente du calme** (profil attentif) : dans une zone de rafale, il ne saute pas au-dessus du
  vide pendant la rafale ni quand les herbes couchées annoncent une rafale qui arriverait avant
  la fin du saut (≈ 0,8 s) ; `--calm 0` coupe ce comportement ;
* **sauts imprécis** : il vise le milieu de la fenêtre de sauts sûrs (pas le dernier moment), puis
  un **jitter gaussien** σ = 45 ms (borné ±2σ) décale l'appel ; **durée d'appui** aléatoire
  0,28–0,55 s (relâcher tôt = saut plus bas) ;
* **graines déterministes** (essai i → graine 1 + i) : résultats reproductibles ;
* réussite = arche franchie avec **≤ 5 chutes** (essai arrêté au-delà), sur 20 essais.

Profil « attentif » (défaut) et profil « pressé » (`--delay 180-250 --jitter 80 --hold 0.18-0.5`,
depuis le 21/10 avec `--calm 0 --hesit 0`, ce qui redonne exactement les mêmes essais qu'avant),
20 essais par niveau, le 19/10/2026 (revue `revue-1910`) :

| N° | Niveau | Étiquette | Attentif : réussite | chutes moy. | temps moy. | Pressé : réussite | chutes moy. | temps moy. |
|---|---|---|---|---|---|---|---|---|
| 1 | Sous-bois des cèdres | Balade | 100 % | 0,15 | 15,4 s | 95 % | 0,80 | 17,5 s |
| 2 | La crête | Rythme | 100 % | 0,10 | 20,2 s | 100 % | 0,70 | 22,2 s |
| 3 | Col du vent | Hors-piste | 100 % | 0,10 | 22,8 s | 100 % | 0,95 | 28,2 s |
| 4 | La Brèche aux Isards | Haute route | 100 % | 0,25 | 33,3 s | 95 % | 1,95 | 38,2 s |
| 5 | L'Estive des Patous | Technique | 100 % | 0,45 | 36,9 s | 85 % | 2,80 | 49,8 s |
| 6 | Le Couloir des Pierres | Extrême | 95 % | 1,85 | 42,0 s | 70 % | 3,80 | 48,7 s |
| 7 | La Cascade des Desmans | Engagé | 95 % | 1,55 | 41,4 s | 80 % | 3,45 | 48,6 s |
| 8 | Le Gué des Lucioles | Très engagé | 95 % | 1,80 | 39,2 s | 70 % | 3,70 | 44,0 s |
| 9 | La Hêtraie des Palombes | Endurance | 100 % | 0,20 | 34,0 s | 90 % | 1,65 | 39,4 s |
| 10 | Le Plateau des Bérets Envolés | Bien engagé | 100 % | 0,75 | 35,3 s | 75 % | 2,55 | 38,6 s |

**Mesure du 21/10** (revue `revue-2026-10-21`, profil attentif revu, profil pressé inchangé —
ses chiffres des N°1–9 sont identiques à ceux du tableau ci-dessus) :

| N° | Attentif : réussite | chutes moy. | temps moy. | Pressé : réussite | chutes moy. | temps moy. |
|---|---|---|---|---|---|---|
| 1 | 100 % | 0,10 | 14,8 s | 95 % | 0,80 | 16,0 s |
| 2 | 100 % | 0,10 | 18,7 s | 100 % | 0,70 | 20,9 s |
| 3 | 100 % | 0,10 | 22,3 s | 100 % | 0,85 | 26,0 s |
| 4 | 100 % | 0,35 | 32,5 s | 95 % | 1,95 | 37,2 s |
| 5 | 100 % | 0,75 | 38,0 s | 85 % | 2,80 | 48,7 s |
| 6 | 100 % | 1,65 | 39,2 s | 70 % | 3,80 | 47,7 s |
| 7 | 95 % | 1,10 | 35,0 s | 80 % | 3,45 | 47,0 s |
| 8 | 100 % | 1,45 | 37,4 s | 70 % | 3,65 | 42,7 s |
| 9 | 100 % | 0,55 | 35,2 s | 90 % | 1,65 | 38,3 s |
| 10 | 100 % | 0,25 | 41,2 s | 80 % | 2,65 | 42,3 s |
| 11 | 100 % | 0,40 | 37,8 s | 100 % | 2,25 | 46,1 s |

N°10 avant → après la revue du 21/10 (variante avec le Ravin du Béret, même id, même étiquette) :
attentif 100 % / 0,75 / 34,0 s → 100 % / 0,25 / 41,2 s (il attend désormais le calme : moins de
chutes, plus de temps) ; pressé 75 % / 2,55 → 80 % / 2,65 sur 20 essais, et 75 % / 2,90 → 75 % / 2,92
sur 40 essais, toujours entre le N°7 (80 %) et le N°8 (75 % sur 40 essais, 70 % sur 20). Le ravin
lui-même fait tomber rarement (pilote auto et rivaux l'attendent) : 1 chute sur 40 essais pressés.

Lecture : pente régulière de 1 à 4, marche nette à 5 (mécaniques). Depuis la revue du 19/10,
5 est le plus facile des niveaux à mécaniques dans les deux profils (ascenseur élargi et ralenti,
quai allongé, filet sous l'ascenseur, bacs élargis, et correction moteur de la passerelle qui
monte), et 8 est plus dur que 7 dans les deux profils. 6 (« Extrême ») reste un peu plus dur que
7 (« Engagé ») : c'est cohérent avec les étiquettes. Aucun niveau n'est déraisonnable (≥ 70 %
en profil pressé). Le modèle reste plus régulier qu'un vrai débutant : ces chiffres comparent
les niveaux entre eux, ce ne sont pas des taux réels. Points chauds connus en profil pressé :
N°8 x≈2600 (appui trop court au-dessus de la ronce avant le radeau) et x≈3400 (sortie du radeau).

N°9 (mesuré le 20/10, mêmes réglages) : classique, donc légitimement plus facile que 5–8 (étiquette
« Endurance », pas « plus dur » que « Très engagé »). Sur 20 essais il est au niveau du 4 ; sur
**40 essais** (pour lisser le bruit), il est un cran au-dessus du 4 dans les deux profils :
attentif 100 % / 0,35 contre 100 % / 0,30, pressé 88 % / 2,00 contre 98 % / 1,93. Points chauds
en profil pressé : x≈4000 (ronce sur la planche haute de la palombière), x≈7600–7800 (réception
de la descente du belvédère puis ronce) et x≈10000 (ronce du sprint final).

N°10 (mesuré le 21/10, mêmes réglages) : étiquette « Bien engagé », voulue entre « Engagé » (7)
et « Très engagé » (8). En profil pressé, la réussite (75 %) est entre celles du 7 (80 %) et du 8
(70 %) ; confirmée sur **40 essais** : pressé 75 % / 2,90, attentif 100 % / 0,90. Les chutes
moyennes sont plus basses que 7 et 8 (le vent ne tue pas, il fait perdre du temps : temps moyen
attentif 35–36 s pour un pilote auto à 28,1 s). Points chauds en profil pressé : x≈2900 (premier
ravin sous la rafale, la découverte), x≈2100 (descente vers le bord du plateau) et x≈3600
(ronce de la terrasse de bruyère). Premier jet de géométrie : une ronce juste après la réception
des terrasses du cayolar (x≈7200) piégeait l'IA sous la rafale (§3d « piège connu ») : remplacée
par un rocher.

N°11 (mesuré le 22/10, mêmes réglages) : classique, étiquette « Haute montagne » (sous les
niveaux à mécaniques 5–8 et 10). Sur **40 essais** : attentif 100 % / 0,42 (N°9 : 100 % / 0,35),
pressé 98 % / 2,13 (N°9 : 88 % / 2,00) : plus de chutes que le 9 (ravins plus longs, séracs étroits)
mais aucune ronce sur passerelle, donc presque aucun abandon. Points chauds en profil pressé :
x≈10700 (dernier ravin de 155 px avant le sprint), x≈3300 (entrée des Dents de la Marmotte, montée
de 60 px après 130 px de crevasse) et x≈9700 (ronce après la descente). Premiers jets (séracs de
180 puis 160 px, crevasses de 120/140) : pressé 98–100 % / 1,65–1,98, jugé trop proche du 9.

Revue du 20/10 (géométrie N°3 et N°8, §6b), mêmes réglages, avant → après :
N°3 attentif 100 % / 0,10 → 100 % / 0,05, pressé 100 % / 0,95 → 100 % / 0,85 ;
N°8 attentif 95 % / 1,80 → 95 % / 1,75, pressé 70 % / 3,70 → 70 % / 3,65. Courbe inchangée
(N°3 toujours sous le N°4, N°8 toujours le plus dur en profil pressé avec le N°6).

Avant la revue (18/10, mêmes réglages) : N°5 100 % / 0,65 — 70 % / 3,55 ; N°8 100 % / 0,60 —
70 % / 3,15 (N°5 était le plus dur en profil pressé, N°8 plus facile que 7).
