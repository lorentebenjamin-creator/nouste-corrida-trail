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
| 9 | La Hêtraie des Palombes | Endurance | 1120 m | sentier **classique** (règle d'alternance, modèle N°4, aucune mécanique) en **hêtraie d'automne** (nouvelle palette) ; passage clé : la **palombière**, des **ronces posées sur les passerelles** perchées au-dessus du vide (jusqu'ici toujours au sol) |
| 10 | Le Plateau des Bérets Envolés | Bien engagé | 1000 m | mécanique inédite : les **rafales de vent de face** — annoncées par les **herbes qui se couchent**, la manche à air qui se lève et un panneau « vent », elles font courir au ralenti et **raccourcissent les sauts** ; passages clés : la **Crête des Bérets**, trois sauts de 140 px au-dessus du vide à prendre pendant le calme, et (revue du 21/10) le **Ravin du Béret**, 185 px, annoncé par un panneau « Ravin : saute au calme » — la rafale y fait **tomber** ; nouvelle palette **lande** |
| 11 | Le Névé des Marmottes Frileuses *(niveau du jour)* | Haute montagne | 1145 m | sentier **classique** (règle d'alternance, modèle N°4, aucune mécanique) sur un **névé au soleil de midi** (nouvelle palette `neve`) ; passage clé : les **Dents de la Marmotte**, sept séracs étroits (150 px) **en dents de scie** — on monte, on redescend, on remonte plus haut (60 → 90 px) ; jusqu'ici les suites de sauts montaient ou descendaient toujours dans le même sens |

Règle : **chaque nouveau sentier apporte au moins une nouveauté** (une mécanique inédite ou un
passage clé jamais vu) et la colonne ci-dessus dit laquelle (voir LEVELS.md §6).
Alternance : après la série 5–8 à mécaniques, **le N°9 est un sentier classique** (rythme /
endurance, modèle N°4, une seule nouveauté) ; le N°10 est de nouveau à mécaniques (rafales de
vent, mécanique inédite) ; le N°11 est classique (Névé des Marmottes Frileuses) ; **le N°12 sera de nouveau à mécaniques**, puis on alterne. Chaque nouveau sentier passe le pilote « humain »
(`playtest --human`, deux profils) et doit respecter la courbe de difficulté.

Difficulté mesurée (pilote « humain », 20 essais, réussite / chutes moyennes, 21/10/2026 ; profil attentif
revu le 21/10 : hésitations et attente du calme ; profil pressé inchangé, `--calm 0 --hesit 0`) :

| N° | Attentif | Pressé |
|---|---|---|
| 1 | 100 % / 0,10 | 95 % / 0,80 |
| 2 | 100 % / 0,10 | 100 % / 0,70 |
| 3 | 100 % / 0,10 | 100 % / 0,85 |
| 4 | 100 % / 0,35 | 95 % / 1,95 |
| 5 | 100 % / 0,75 | 85 % / 2,80 |
| 6 | 100 % / 1,65 | 70 % / 3,80 |
| 7 | 95 % / 1,10 | 80 % / 3,45 |
| 8 | 100 % / 1,45 | 70 % / 3,65 |
| 9 | 100 % / 0,55 | 90 % / 1,65 |
| 10 | 100 % / 0,25 | 80 % / 2,65 |
| 11 | 100 % / 0,40 | 100 % / 2,25 |

Détails et méthode : LEVELS.md §8. Sur 40 essais, N°10 en profil pressé : 75 % / 2,92, entre le
N°7 (80 %) et le N°8 (75 %). N°11 (classique) sur 40 essais : attentif 100 % / 0,42, pressé 98 % / 2,13
(plus de chutes que le N°9, 88 % / 2,00, mais pas de ronce sur passerelle : réussite plus haute).
**Revue du 22/10** : ronce ajoutée sur un sérac du N°11 ; sur 40 essais, attentif 100 % / 0,63,
pressé **93 % / 2,40**, désormais un cran au-dessus du N°9 en chutes et proche en réussite.

## Médailles

Chaque sentier a trois temps cibles, **calibrés sur le pilote « humain »** (revue du 21/10) :
`node tools/medals.mjs <url> last --calibrate --trials 40 --write` lance le pilote automatique
(temps `auto`) puis 40 essais dans chacun des deux profils, attentif et pressé, et choisit les
temps pour qu'environ **17,5 % des essais attentifs décrochent l'or** (fenêtre 10–25 %), ≈ 50 %
l'argent et ≈ 85 % le bronze (au dixième, or au 0,05 s si les temps sont très groupés ; or ≥ auto,
paliers espacés d'au moins 0,5 s). Depuis la revue du 22/10, l'argent vise aussi **≈ 30 % des
essais pressés**, sans dépasser le milieu de l'intervalle or–bronze (il ne colle plus à l'or quand
le bronze est loin). `node tools/medals.mjs <url> all --human --trials 20 --md`
affiche, sans rien écrire, les pourcentages or / argent / bronze des deux profils. L'ancienne règle
(or ×1,15, argent ×1,35, bronze ×1,6) donnait l'or à 85–100 % des essais attentifs sur la plupart
des sentiers ; elle reste disponible sans `--calibrate`. Le menu affiche sous chaque sentier la
médaille de ton record (enregistré dans le navigateur) et les trois temps cibles ; l'écran
d'arrivée affiche la médaille de la course, ton record et le temps à battre pour la médaille
suivante. Un sentier sans champ `medals` s'affiche sans médailles (LEVELS.md §6 étape 5b).

| N° | Or | Argent | Bronze | Attentif or / argent / bronze | Pressé or / argent / bronze |
|---|---|---|---|---|---|
| 1 | 14,1 s | 14,6 s | 15,1 s | 10 % / 60 % / 90 % | 35 % / 50 % / 55 % |
| 2 | 18,25 s | 18,8 s | 19,3 s | 25 % / 85 % / 90 % | 30 % / 45 % / 50 % |
| 3 | 21,7 s | 22,2 s | 22,7 s | 25 % / 80 % / 90 % | 10 % / 30 % / 30 % |
| 4 | 31,1 s | 31,8 s | 34,2 s | 15 % / 50 % / 85 % | 5 % / 10 % / 15 % |
| 5 | 32,0 s | 33,0 s | 42,1 s | 20 % / 55 % / 80 % | 0 % / 20 % / 25 % |
| 6 | 31,6 s | 35,2 s | 43,1 s | 10 % / 35 % / 80 % | 0 % / 5 % / 30 % |
| 7 | 32,1 s | 34,5 s | 40,3 s | 25 % / 60 % / 85 % | 0 % / 5 % / 30 % |
| 8 | 33,8 s | 37,4 s | 44,5 s | 15 % / 60 % / 95 % | 15 % / 30 % / 40 % |
| 9 | 32,0 s | 32,5 s | 37,8 s | 15 % / 55 % / 75 % | 10 % / 30 % / 60 % |
| 10 | 35,9 s | 40,1 s | 44,5 s | 20 % / 50 % / 90 % | 25 % / 40 % / 45 % |
| 11 | 32,8 s | 33,4 s | 43,6 s | 15 % / 60 % / 85 % | 0 % / 10 % / 50 % |

(20 essais par profil, 21/10 ; calibrage sur 40 essais.)

## Source de référence

**Le dépôt GitHub (`main`) et sa copie de travail `/workspace/corrida-site` sont la seule source
de vérité.** L'ancien worktree de la branche `classement` est **périmé** (resté au niveau 7, il
n'a jamais été réaligné sur `main`) : il a été archivé le 21/10 dans
`/workspace/corrida-classement-ARCHIVE`. Ne rien y modifier ; toujours partir d'un `git pull` sur
`/workspace/corrida-site`.

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
menu, médailles), `tools/e2e-classement.mjs` (classement, faux backend), `tools/medals.mjs` (temps des
médailles) et `tools/capture.mjs` (capture d'un passage) avec Playwright.

**Les outils de référence sont ceux de `tools/` (ce dépôt)** : on les lance depuis la racine du
dépôt, avec Playwright fourni par un lien symbolique temporaire `node_modules` (ignoré par git,
jamais commité), pas avec des copies des scripts placées dans un autre dossier (ex. `pwtest`) :
```bash
ln -s /workspace/pwtest/node_modules node_modules   # Playwright déjà installé là
tools/serve.sh &                                     # http://localhost:8765/nouste-corrida-trail/
node tools/check-levels.mjs && node tools/playtest.mjs all && node tools/e2e.mjs && node tools/e2e-classement.mjs
kill %1; rm node_modules                             # à la fin : arrêter le serveur, supprimer le lien
```
Une amélioration d'outil se fait dans `tools/` et se commite (LEVELS.md §6 étape 5).

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
