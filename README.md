# NOUSTE CORRIDA TRAIL — copie statique

Jeu de course en montagne dans le navigateur : cours, saute les ravins, évite les ronces,
ramasse les balises et passe l'arche avant le peloton (Léa, Karim et Inès).

**Jouer :** https://lorentebenjamin-creator.github.io/nouste-corrida-trail/

Jeu original : **NOUSTE CORRIDA TRAIL** créé par [@othoolman](https://x.com/othoolman),
https://jeunoustecorrida.grok.me — cette copie autonome (sans serveur) est publiée à la demande
de son auteur, pour pouvoir l'héberger soi-même et ajouter des sentiers.

## Sentiers

| N° | Sentier | Difficulté | Longueur | Nouveauté du sentier |
|---|---|---|---|---|
| 1 | Sous-bois des cèdres | Balade | 498 m | apprentissage : sauts, ronces, rocher, tronc, passerelles |
| 2 | La crête | Rythme | 646 m | le rythme : 10 ravins enchaînés, deux rochers à gravir |
| 3 | Col du vent | Hors-piste | 762 m | hors-piste : 11 ronces, petites descentes qui finissent dans les ronces |
| 4 | La Brèche aux Isards | Haute route | 1090 m | endurance : le plus long, enchaînement de 20 ravins |
| 5 | L'Estive des Patous | Technique | 940 m | passerelles mobiles (bacs, ascenseur) et patous |
| 6 | Le Couloir des Pierres | Extrême | 1030 m | chutes de pierres annoncées par leur ombre, cheminée |
| 7 | La Cascade des Desmans | Engagé | 950 m | **jet de cascade** : rideau d'eau intermittent au-dessus d'un ravin |
| 8 | Le Gué des Lucioles | Très engagé | 956 m | trail **de nuit** (nouvelle palette, liseré clair sur les sols, gave visible, lucioles) et **jet + radeau** : la cascade tombe sur l'embarcadère d'un radeau mobile, deux cycles à lire ensemble |
| 9 | La Hêtraie des Palombes *(niveau du jour)* | Endurance | 1120 m | sentier **classique** (règle d'alternance, modèle N°4, aucune mécanique) en **hêtraie d'automne** (nouvelle palette) ; passage clé : la **palombière**, des **ronces posées sur les passerelles** perchées au-dessus du vide (jusqu'ici toujours au sol) |

Règle : **chaque nouveau sentier apporte au moins une nouveauté** (une mécanique inédite ou un
passage clé jamais vu) et la colonne ci-dessus dit laquelle (voir LEVELS.md §6).
Alternance : après la série 5–8 à mécaniques, **le N°9 est un sentier classique** (rythme /
endurance, modèle N°4, une seule nouveauté) ; le N°10 pourra de nouveau être à mécaniques,
puis on alterne. Chaque nouveau sentier passe le pilote « humain »
(`playtest --human`, deux profils) et doit respecter la courbe de difficulté.

Difficulté mesurée (pilote « humain », 20 essais, réussite / chutes moyennes, 19/10/2026 ; N°9 le 20/10) :

| N° | Attentif | Pressé |
|---|---|---|
| 1 | 100 % / 0,15 | 95 % / 0,80 |
| 2 | 100 % / 0,10 | 100 % / 0,70 |
| 3 | 100 % / 0,10 | 100 % / 0,95 |
| 4 | 100 % / 0,25 | 95 % / 1,95 |
| 5 | 100 % / 0,45 | 85 % / 2,80 |
| 6 | 95 % / 1,85 | 70 % / 3,80 |
| 7 | 95 % / 1,55 | 80 % / 3,45 |
| 8 | 95 % / 1,80 | 70 % / 3,70 |
| 9 | 100 % / 0,20 | 90 % / 1,65 |

Détails et méthode : LEVELS.md §8. (Revue du 20/10 : N°3 100 % / 0,05 — 100 % / 0,85 ;
N°8 95 % / 1,75 — 70 % / 3,65 après les retouches de géométrie.)

## Médailles

Chaque sentier a trois temps cibles calculés à partir du **pilote automatique** de
`tools/playtest.mjs` : **or = ×1,15, argent = ×1,35, bronze = ×1,6** (arrondis à la demi-seconde
supérieure). Le menu affiche sous chaque sentier la médaille de ton record (enregistré dans le
navigateur) et les trois temps cibles ; l'écran d'arrivée affiche la médaille de la course, ton
record et le temps à battre pour la médaille suivante. Les temps sont écrits dans `levels.js`
(champ `medals`) par `node tools/medals.mjs <url> last --write` ; un sentier sans ce champ
s'affiche simplement sans médailles (LEVELS.md §6 étape 5b).

## Source de référence

**Le dépôt GitHub (`main`) et sa copie de travail `/workspace/corrida-site` sont la seule source
de vérité.** Tout autre dossier (par ex. `/workspace/corrida-classement`, ancien worktree de la
branche `classement`, désormais aligné sur `main`) n'est qu'une copie : ne rien y modifier, toujours
partir d'un `git pull` sur `/workspace/corrida-site`.

## Commandes

Flèches ou ZQSD (Q gauche, D droite, Z saut), Espace pour sauter, Bas pour traverser une
passerelle, R pour recommencer, Échap pour la pause. Boutons tactiles sur mobile (dont ↓).

## Héberger / modifier

Site 100 % statique : servir le dossier tel quel (fonctionne à la racine ou sous un sous-chemin).
`tools/serve.sh` le sert en local sur http://localhost:8765/nouste-corrida-trail/.

Les niveaux sont dans **`levels.js`** ; le format et la recette pour ajouter un niveau sont
décrits dans **[LEVELS.md](LEVELS.md)**. Vérification : `node tools/check-levels.mjs` (0 erreur, 0 avertissement non justifié ; les
avertissements voulus sont déclarés dans `acceptedWarnings`, LEVELS.md §6b),
puis `tools/playtest.mjs` (pilote automatique sur chaque niveau ; `--human --trials 20` pour un
pilote « humain » imprécis et des taux de réussite), `tools/e2e.mjs` (commandes, fanions, record,
menu), `tools/e2e-classement.mjs` (classement, faux backend) et `tools/medals.mjs` (temps des
médailles) avec Playwright.

## Classement en ligne

Classement partagé par niveau : le meilleur temps de chaque « Nom sur le dossard ».
Affiché à l'arrivée (top 10 + ton rang) et dans le menu (top 3 sous chaque sentier).
Le site reste 100 % statique : le navigateur parle directement à l'API REST de Supabase.

- `leaderboard-config.js` : configuration. `LEADERBOARD_CONFIG = null` → classement désactivé
  (aucun appel réseau, rien d'affiché). Providers : `supabase` (url + clé publique
  *publishable*/anon) ou `local` (localStorage, démo). `?classement=0` dans l'URL le coupe aussi.
- `leaderboard.js` : client (fetch, sans dépendance), backend interchangeable ; toute erreur
  réseau est silencieuse, le jeu continue normalement.
- `supabase/schema.sql` : table `scores` (level_id, name, time_ms, balises, created_at), RLS
  (lecture + insertion anonymes uniquement, ni modification ni suppression), contraintes
  (nom 1–20 caractères, temps 8 s – 1 h, id de niveau valide), trigger anti-abus (date forcée,
  temps minimum par niveau via `level_limits`, 1 envoi / 5 s par nom et niveau, 120 envois / min
  au total) et vues `leaderboard` (meilleur temps par nom) et `level_top` (top 3 par niveau).
- Un temps n'est envoyé que si le joueur a mis son nom (le nom par défaut « Toi » n'est pas envoyé).

Mise en route : exécuter `supabase/schema.sql` dans Supabase → SQL Editor, puis
`node tools/test-supabase.mjs` (tests réels), `node tools/e2e-classement.mjs` (faux backend).
Modération : `delete from public.scores where lower(name) = lower('…');` dans le SQL Editor.
Nouveau niveau : optionnellement `insert into public.level_limits values ('mon-id', 20000);`
(sinon seule la borne générale de 8 s s'applique).

Limite connue : comme tout classement d'un jeu 100 % client, un tricheur motivé peut envoyer un
faux temps plausible via l'API ; les contraintes ne bloquent que l'absurde et les rafales.
