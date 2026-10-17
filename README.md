# NOUSTE CORRIDA TRAIL — copie statique

Jeu de course en montagne dans le navigateur : cours, saute les ravins, évite les ronces,
ramasse les balises et passe l'arche avant le peloton (Léa, Karim et Inès).

**Jouer :** https://lorentebenjamin-creator.github.io/nouste-corrida-trail/

Jeu original : **NOUSTE CORRIDA TRAIL** créé par [@othoolman](https://x.com/othoolman),
https://jeunoustecorrida.grok.me — cette copie autonome (sans serveur) est publiée à la demande
de son auteur, pour pouvoir l'héberger soi-même et ajouter des sentiers.

## Sentiers

| N° | Sentier | Difficulté | Longueur |
|---|---|---|---|
| 1 | Sous-bois des cèdres | Balade | 498 m |
| 2 | La crête | Rythme | 646 m |
| 3 | Col du vent | Hors-piste | 762 m |
| 4 | La Brèche aux Isards | Haute route | 1090 m |
| 5 | L'Estive des Patous *(nouveau)* | Technique | 940 m |
| 6 | Le Couloir des Pierres *(nouveau)* | Extrême | 1030 m |

Nouveautés : passerelles mobiles (bacs, ascenseurs), chutes de pierres annoncées par leur ombre,
patous qui gardent l'estive, rivaux plus malins (ils ne se jettent plus dans les ronces).

## Commandes

Flèches ou ZQSD (Q gauche, D droite, Z saut), Espace pour sauter, Bas pour traverser une
passerelle, R pour recommencer, Échap pour la pause. Boutons tactiles sur mobile (dont ↓).

## Héberger / modifier

Site 100 % statique : servir le dossier tel quel (fonctionne à la racine ou sous un sous-chemin).
`tools/serve.sh` le sert en local sur http://localhost:8765/nouste-corrida-trail/.

Les niveaux sont dans **`levels.js`** ; le format et la recette pour ajouter un niveau sont
décrits dans **[LEVELS.md](LEVELS.md)**. Vérification : `node tools/check-levels.mjs`,
puis `tools/playtest.mjs` (pilote automatique sur chaque niveau) et `tools/e2e.mjs` (commandes,
fanions, record, menu) avec Playwright.
