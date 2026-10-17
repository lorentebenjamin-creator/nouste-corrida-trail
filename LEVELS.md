# Format des niveaux — NOUSTE CORRIDA TRAIL (copie statique)

Tous les niveaux vivent dans **`levels.js`** (module ES, lisible, non minifié).
Le bundle du jeu (`assets/routes-DUFPCL9U.js`) fait simplement
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
  garder les sols entre `y ≈ 250` et `y ≈ 450` (les niveaux d'origine : 260–440).
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

## 4. Thèmes

Le décor est **100 % procédural** (dégradé de ciel, crêtes, sapins, sol, ronces) : un thème
est juste une palette. Intégrés : `forest` (Sous-bois), `ridge` (Crête), `col` (Col du vent).
On peut en ajouter dans `THEMES` de `levels.js` (fusionnés dans le bundle) avec **toutes** ces
clés : `skyTop skyMid skyBot ridge ridge2 pine pine2 dirt dirtDark grass grassDark wood woodDark
rock rockDark thorn leaf berry fog`. Exemple : `breche` (neige au crépuscule) du niveau 4.
Réutiliser un thème existant est toujours sûr.

## 5. Physique (extraite du code, `assets/routes-*.js`)

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

IA des rivaux : ils courent toujours à droite et sautent si une ronce est à < 58 px, si le bord
approche avec une plateforme à < 205×speed px, ou si un rocher/tronc est devant. Au bout de
8 morts un rival est déclaré arrivé (temps + 22 s). Si les rivaux meurent souvent, la course
perd son intérêt : viser 0 mort pour les rivaux (`tools/playtest.mjs` l'affiche).

## 6. Recette : ajouter UN niveau (job quotidien)

1. `git pull`. Ouvrir `levels.js`, aller tout en bas (après le dernier `LEVELS.push`).
2. Copier le bloc du niveau 4 comme modèle et le coller à la fin. Changer :
   * `id` : nouveau, unique, minuscules (ex. `"lac-gaube"`), utilisé aussi dans `v(id)` et `y(id, …)` ;
   * `name`, `blurb` (≈ 1 phrase, français), `difficulty`, `theme` (existant de préférence) ;
   * la géométrie. Méthode : enchaîner des sections de gauche à droite en notant l'`x` de fin de
     chaque sol ; démarrer par `p(0, ≥600, floor)` ; finir par un sol à `floor` qui couvre
     `finishX` à `finishX + 300` ; `width` ≈ fin du dernier sol + 100.
   * 3 à 5 fanions répartis, chacun en début de plateforme sûre ;
   * balises : quelques `line` à sol−70 et des `arc(…, 40)` au-dessus des sauts ;
   * `rivals` : vitesses ~1.0 / 0.92 / 0.85 (baisser pour un niveau plus facile).
3. Ne jamais modifier ni supprimer un niveau existant, ni changer d'`id`.
4. Vérifier : `node tools/check-levels.mjs` → **0 erreur et 0 avertissement pour le nouveau niveau**
   (les niveaux d'origine ont des avertissements connus, c'est normal).
5. Tester en vrai (recommandé) :
   ```bash
   tools/serve.sh &                       # http://localhost:8765/nouste-corrida-trail/
   # dans un dossier où playwright est installé (npm i playwright && npx playwright install chromium) :
   node /chemin/vers/tools/playtest.mjs http://localhost:8765/nouste-corrida-trail/ last /tmp/niveau.png
   ```
   Attendu : `PLAYTEST OK` (pilote auto arrivé sans chute, aucune erreur console) et idéalement
   0 mort pour les rivaux dans la ligne JSON. Sinon élargir les plateformes / réduire les écarts.
6. Mettre à jour la liste des niveaux du `README.md`, puis
   `git commit -am "Niveau N : <nom>" && git push`. GitHub Pages redéploie en 1–2 min
   (cache ~10 min côté navigateur).

## 7. Ce qui a été modifié dans le bundle d'origine

* `assets/index-wVumaOia.js` : l'hydratation TanStack Router/SSR (`hydrateRoot(document, …)`)
  est remplacée par un rendu client du composant du jeu dans `#root` (le routeur cassait sous
  un sous-chemin et sans HTML SSR). Le reste du fichier est inchangé.
* `assets/routes-DUFPCL9U.js` : données de niveaux retirées et remplacées par
  `import { LEVELS, THEMES } from "../levels.js"` ; `Object.assign(T, THEMES)` pour les palettes ;
  menu trié du plus récent au plus ancien avec `N°k` et badge « Niveau du jour » ; chemins des
  sprites rendus relatifs (`game/*.png`).
* `assets/routes-x3PbsDEU.css` : URLs des polices relatives. `custom.css` : liste de niveaux
  défilante + badge.
* Supprimés : `extensions.js` de grok.com, manifeste `/__grok/…`.
