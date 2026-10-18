# Format des niveaux — NOUSTE CORRIDA TRAIL (copie statique)

> **Source de vérité :** le dépôt GitHub (`main`) et sa copie de travail `/workspace/corrida-site`.
> Les autres dossiers (`/workspace/corrida-classement`, …) ne sont que des copies alignées sur
> `main` : ne jamais y travailler. Toujours commencer par `git pull` dans `/workspace/corrida-site`.

Tous les niveaux vivent dans **`levels.js`** (module ES, lisible, non minifié).
Le moteur du jeu (`assets/game.js`, code lisible) fait simplement
`import { LEVELS, THEMES } from "../levels.js"` : **ajouter un niveau = ajouter un bloc
`LEVELS.push(...)` à la fin de `levels.js`**, rien d'autre à toucher (ni build, ni HTML).

Le menu affiche les niveaux du plus récent au plus ancien (liste défilante), numérotés
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
  patrols: [ ... ],        // OPTIONNEL (v2) : patous, helper patou()
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
solids: [ p(3920, 440, 380), mp(4440, 380, 120, 0, -200, 4.2), p(4640, 340, 200) ], // ascenseur
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
  `tools/playtest.mjs`** (obligatoire).

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

## 4. Thèmes

Le décor est **100 % procédural** (dégradé de ciel, crêtes, sapins, sol, ronces) : un thème
est juste une palette. Intégrés : `forest` (Sous-bois), `ridge` (Crête), `col` (Col du vent).
On peut en ajouter dans `THEMES` de `levels.js` (fusionnés dans le bundle) avec **toutes** ces
clés : `skyTop skyMid skyBot ridge ridge2 pine pine2 dirt dirtDark grass grassDark wood woodDark
rock rockDark thorn leaf berry fog`. Exemple : `breche` (neige au crépuscule) du niveau 4.
Réutiliser un thème existant est toujours sûr. Palettes ajoutées : `breche` (niv. 4, neige au
crépuscule), `estive` (niv. 5, pâturage d'été), `pierrier` (niv. 6, pierrier sous l'orage), `cascade` (niv. 7, gorges moussues).

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
   mécanique inédite** (§3b/§3c, ou une nouvelle à coder) **ou au moins un passage clé jamais
   vu** (une combinaison ou une mise en page qui n'existe dans aucun niveau précédent : ex. jet
   au-dessus d'un bac mobile, patou sur une passerelle haute, cheminée sous les pierres…).
   Le dire dans un commentaire `// Passage clé : …` au-dessus de l'élément concerné **et** dans la
   colonne « Nouveauté du sentier » du tableau du `README.md`. Un niveau qui ne fait que
   réassembler des passages déjà vus n'est pas accepté.
   Ne jamais modifier ni supprimer un niveau existant, ni changer d'`id`.
4. Vérifier : `node tools/check-levels.mjs` → **0 erreur et 0 avertissement pour le nouveau niveau**
   (les niveaux 1–3 d'origine ont des avertissements connus, c'est normal ; les lignes `info`
   sur les passerelles mobiles imposent l'étape 5).
5. Tester en vrai (recommandé, obligatoire avec des mécaniques v2) :
   ```bash
   tools/serve.sh &                       # http://localhost:8765/nouste-corrida-trail/
   # dans un dossier où playwright est installé (npm i playwright && npx playwright install chromium) :
   node /chemin/vers/tools/playtest.mjs http://localhost:8765/nouste-corrida-trail/ last /tmp/niveau.png
   node /chemin/vers/tools/playtest.mjs http://localhost:8765/nouste-corrida-trail/ all   # tous les niveaux
   node /chemin/vers/tools/e2e.mjs http://localhost:8765/nouste-corrida-trail/            # commandes, fanions, record, menu
   node /chemin/vers/tools/playtest.mjs http://localhost:8765/nouste-corrida-trail/ last --human --trials 20 --verbose
   ```
   Pilote humain : viser **≥ 60 % de réussite** (≤ 5 chutes) pour un niveau « Engagé »/« Extrême »,
   ≥ 90 % en dessous ; `--verbose` liste les essais ratés et l'endroit des chutes.
   Attendu : `PLAYTEST OK` (le pilote auto finit sans chute, aucun rival en boucle, aucune erreur
   console) et `E2E OK`. Si le pilote auto échoue, la ligne indique où il est tombé (`chutes à x,y`) :
   élargir la plateforme, réduire l'écart, ralentir la passerelle ou décaler la phase.
6. Classement en ligne (Supabase) : **rien à faire**. Aucun SQL, aucune ligne `level_limits` à
   ajouter : un nouvel `id` est accepté automatiquement avec la borne générale (temps ≥ 8 s).
   `level_limits` (temps minimum par niveau) est un réglage facultatif fait à la main dans le SQL
   Editor ; le job ne doit pas y toucher. Ne pas modifier `leaderboard-config.js`.
   Les tests locaux (playtest/e2e) gardent le nom « Toi » et n'envoient donc aucun temps.
7. Mettre à jour la liste des niveaux du `README.md`, puis
   `git commit -am "Niveau N : <nom>" && git push`. GitHub Pages redéploie en 1–2 min
   (cache ~10 min côté navigateur).

## 7. Ce qui a été modifié par rapport au bundle d'origine

* `assets/index-wVumaOia.js` : l'hydratation TanStack Router/SSR est remplacée par un rendu client
  du jeu dans `#root` (le routeur cassait sous un sous-chemin et sans HTML SSR), qui charge
  `./game.js`. Le reste (React, etc.) est inchangé.
* `assets/game.js` (ex-`routes-DUFPCL9U.js`, dé-minifié et maintenu à la main) :
  niveaux importés de `../levels.js` + palettes `THEMES` ; menu du plus récent au plus ancien
  (`N°k`, badge « Niveau du jour ») ; sprites en chemins relatifs ; **v2** : passerelles mobiles,
  chutes de pierres, patous ; IA par simulation (rivaux + pilote auto) ; rivaux immobiles 0,85 s
  après une chute ; record enregistré dès l'arrivée du joueur ; bouton tactile ↓ (descendre d'une
  passerelle) ; bouton pause masqué pendant une chute (il n'y faisait rien) ; brouillard des
  ravins corrigé au pied des falaises ; API de test `window.__controlsTest` (`setAutopilot`,
  `teleport`, `getState`, …).
* `assets/routes-x3PbsDEU.css` : URLs des polices relatives. `custom.css` : liste de niveaux
  défilante, badge, bouton ↓.
* Supprimés : `extensions.js` de grok.com, manifeste `/__grok/…`.

## 8. Courbe de difficulté (niveaux 1–7)

| N° | Niveau | Étiquette | Longueur | Ravins | Ronces | Mécaniques v2 | Rivaux (vitesse) | Pilote auto |
|---|---|---|---|---|---|---|---|---|
| 1 | Sous-bois des cèdres | Balade | 498 m | 4 | 4 | — | 0.93 / 0.84 / 0.74 | 14,2 s |
| 2 | La crête | Rythme | 646 m | 10 | 7 | — | 0.97 / 0.88 / 0.78 | 18,2 s |
| 3 | Col du vent | Hors-piste | 762 m | 12 | 11 | — | 0.99 / 0.9 / 0.82 | 21,8 s |
| 4 | La Brèche aux Isards | Haute route | 1090 m | 20 | 8 | — | 1 / 0.92 / 0.85 | 30,9 s |
| 5 | L'Estive des Patous | Technique | 940 m | 10 | 3 | 5 passerelles mobiles, 4 patous | 1 / 0.93 / 0.86 | 29,1 s |
| 6 | Le Couloir des Pierres | Extrême | 1030 m | 13 | 2 | 4 passerelles mobiles, 11 chutes de pierres, 2 patous | 1 / 0.94 / 0.88 | 29,4 s |
| 7 | La Cascade des Desmans | Engagé | 950 m | 9 | 4 | 2 radeaux lents, 1 patou, **1 jet de cascade** | 1 / 0.93 / 0.86 | 31,9 s |

Progression voulue : 1–3 apprennent sauts, ronces, passerelles ; 4 = endurance (le plus long,
aucune mécanique, rivaux à 1,00) ; 5 = découverte des mécaniques v2 avec du temps pour lire
(bacs lents, patous, chemin double, ascenseur) ; 6 = tout combiné en cadence (pierres
rapprochées, cheminée, bacs au-dessus du vide, rivaux les plus rapides). « Pilote auto » = temps
du pilote parfait de `tools/playtest.mjs` (un humain met nettement plus). Pour un nouveau niveau
quotidien, viser entre 4 et 6 et varier : un niveau « classique » (modèle 4) puis un niveau à
mécaniques (modèle 5/6).

### Pilote « humain » (`tools/playtest.mjs --human`)

Même cerveau que l'autopilote (simulation exacte de la physique), rendu imprécis :

* **délai de réaction** 150–200 ms (tiré par essai) : les décisions sont prises sur l'état
  extrapolé à +délai et exécutées après ce délai ; si l'anticipation se termine mal (danger pas
  vu), réflexe sur l'état présent ; après une chute, il repart après le délai ;
* **sauts imprécis** : il vise le milieu de la fenêtre de sauts sûrs (pas le dernier moment), puis
  un **jitter gaussien** σ = 45 ms (borné ±2σ) décale l'appel ; **durée d'appui** aléatoire
  0,28–0,55 s (relâcher tôt = saut plus bas) ;
* **graines déterministes** (essai i → graine 1 + i) : résultats reproductibles ;
* réussite = arche franchie avec **≤ 5 chutes** (essai arrêté au-delà), sur 20 essais.

Profil « attentif » (défaut) et profil « pressé » (`--delay 180-250 --jitter 80 --hold 0.18-0.5`),
20 essais par niveau, le 18/10/2026 :

| N° | Niveau | Étiquette | Attentif : réussite | chutes moy. | temps moy. | Pressé : réussite | chutes moy. | temps moy. |
|---|---|---|---|---|---|---|---|---|
| 1 | Sous-bois des cèdres | Balade | 100 % | 0,15 | 15,4 s | 95 % | 0,80 | 17,3 s |
| 2 | La crête | Rythme | 100 % | 0,10 | 19,8 s | 100 % | 0,70 | 22,0 s |
| 3 | Col du vent | Hors-piste | 100 % | 0,10 | 22,8 s | 100 % | 0,95 | 28,1 s |
| 4 | La Brèche aux Isards | Haute route | 100 % | 0,25 | 33,3 s | 95 % | 1,95 | 38,6 s |
| 5 | L'Estive des Patous | Technique | 100 % | 0,65 | 34,3 s | 70 % | 3,55 | 44,3 s |
| 6 | Le Couloir des Pierres | Extrême | 95 % | 1,85 | 41,7 s | 75 % | 3,55 | 46,8 s |
| 7 | La Cascade des Desmans | Engagé | 95 % | 1,55 | 41,3 s | 80 % | 3,45 | 48,1 s |

Lecture : la pente est régulière jusqu'à 4, puis marche nette à 5 (mécaniques). 5, 6 et 7 sont
du même ordre pour un joueur pressé ; l'Estive (5, « Technique ») est même la plus dure dans ce
profil (13 chutes sur 20 essais vers x≈4600 : bac mobile du niveau). Aucun niveau n'est
déraisonnable (< 30 % de réussite). Le modèle reste plus régulier qu'un vrai débutant : ces
chiffres comparent les niveaux entre eux, ce ne sont pas des taux réels.
