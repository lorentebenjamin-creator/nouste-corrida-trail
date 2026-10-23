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
| 11 | Le Névé des Marmottes Frileuses | Haute montagne | 1145 m | sentier **classique** (règle d'alternance, modèle N°4, aucune mécanique) sur un **névé au soleil de midi** (nouvelle palette `neve`) ; passage clé : les **Dents de la Marmotte**, sept séracs étroits (150 px) **en dents de scie** — on monte, on redescend, on remonte plus haut (60 → 90 px) ; jusqu'ici les suites de sauts montaient ou descendaient toujours dans le même sens |
| 12 | La Tourbière des Crapauds Ronfleurs *(niveau du jour)* | Bien engagé | 1065 m | mécanique inédite : les **mottes plongeantes** — des tapis de sphaigne qui flottent sur les gouilles de la tourbière puis **plongent** (plus de sol) et remontent, en cycle ; annoncées par la motte qui **tremble, s'enfonce et fait des bulles**, un panneau « bulles » qui clignote en haut de l'écran et deux panneaux de sentier (« Tourbière : mottes plongeantes », « Bulles : ça plonge, attends la remontée ») ; plongée, sa silhouette reste visible sous l'eau ; passage clé : la **Ronde des Crapauds**, trois mottes qui remontent en vague ; nouvelle palette **tourbiere** (orage sur la tourbière) |

Règle : **chaque nouveau sentier apporte au moins une nouveauté** (une mécanique inédite ou un
passage clé jamais vu) et la colonne ci-dessus dit laquelle (voir LEVELS.md §6).
Alternance : après la série 5–8 à mécaniques, **le N°9 est un sentier classique** (rythme /
endurance, modèle N°4, une seule nouveauté) ; le N°10 est de nouveau à mécaniques (rafales de
vent, mécanique inédite) ; le N°11 est classique (Névé des Marmottes Frileuses) ; le N°12 est à mécaniques (mottes plongeantes, mécanique inédite) ; **le N°13 sera classique**, puis on alterne. Chaque nouveau sentier passe le pilote « humain »
(`playtest --human`, deux profils) et doit respecter la courbe de difficulté.

Difficulté mesurée (pilote « humain », **40 essais**, réussite / chutes moyennes, **23/10/2026** ; profil
attentif par défaut, profil pressé `--delay 180-250 --jitter 80 --hold 0.18-0.5 --calm 0 --hesit 0`).
Depuis la revue du 23/10 le pilote vise **à 35 % de la fenêtre de sauts sûrs** (au lieu de son milieu)
et la fenêtre n'est plus tronquée (voir LEVELS.md §7) : les chiffres sont donc un peu plus indulgents que
ceux des revues précédentes (20/22 oct., fenêtre tronquée), **ne pas les comparer d'une revue à l'autre** :

| N° | Attentif | Pressé |
|---|---|---|
| 1 | 100 % / 0,00 | 100 % / 0,88 |
| 2 | 100 % / 0,07 | 100 % / 0,97 |
| 3 | 100 % / 0,07 | 100 % / 1,20 |
| 4 | 100 % / 0,00 | 95 % / 2,08 |
| 5 | 100 % / 0,28 | 85 % / 3,20 |
| 6 | 100 % / 0,38 | 88 % / 2,48 |
| 7 | 100 % / 0,45 | 90 % / 3,00 |
| 8 | 100 % / 0,63 | 85 % / 2,77 |
| 9 | 100 % / 0,03 | 95 % / 2,02 |
| 10 | 100 % / 0,03 | 95 % / 1,98 |
| 11 | 100 % / 0,23 | 85 % / 3,20 |
| 12 | 100 % / 0,20 | 95 % / 2,45 |

Détails et méthode : LEVELS.md §8. N°12 (mottes plongeantes) : pressé 95 % / 2,45 sur 40 essais
(graines 1–40), 85 % / 2,60 sur 40 autres (graines 41–80) soit 90 % / 2,53 sur 80 ; N°10 : 95 % / 1,98
puis 93 % / 2,38 (94 % sur 80). **Le N°12 est donc bien au niveau du N°10 (« Bien engagé »)**, avec un cran
de chutes en plus : pas de durcissement nécessaire (LEVELS.md §8, revue du 23/10).

## Médailles

Chaque sentier a trois temps cibles, **calibrés sur le pilote « humain »** (revue du 21/10) :
`node tools/medals.mjs <url> last --calibrate --trials 40 --write` lance le pilote automatique
(temps `auto`) puis 40 essais dans chacun des deux profils, attentif et pressé, et choisit les
temps pour qu'environ **17,5 % des essais attentifs décrochent l'or** (fenêtre 10–25 %), ≈ 50 %
l'argent et ≈ 85 % le bronze (au dixième, or au 0,05 s si les temps sont très groupés ; or ≥ auto,
paliers espacés d'au moins 0,5 s). Depuis la revue du 22/10, l'argent vise aussi **≈ 30 % des
essais pressés**, sans dépasser le milieu de l'intervalle or–bronze (il ne colle plus à l'or quand
le bronze est loin) ; depuis la revue du 23/10, l'argent est aussi **≥ or × 1,08** (check-levels
avertit sinon ; le bronze est relevé au besoin). `node tools/medals.mjs <url> all --human --trials 20 --md`
affiche, sans rien écrire, les pourcentages or / argent / bronze des deux profils. L'ancienne règle
(or ×1,15, argent ×1,35, bronze ×1,6) donnait l'or à 85–100 % des essais attentifs sur la plupart
des sentiers ; elle reste disponible sans `--calibrate`. Le menu affiche sous chaque sentier la
médaille de ton record (enregistré dans le navigateur) et les trois temps cibles ; l'écran
d'arrivée affiche la médaille de la course, ton record et le temps à battre pour la médaille
suivante. Un sentier sans champ `medals` s'affiche sans médailles (LEVELS.md §6 étape 5b).

Temps cibles actuels (or / argent / bronze). **Revue du 23/10** : N°1, 2, 3, 4, 9 et 12
recalibrés (40 essais, nouveau pilote) pour respecter la règle **argent ≥ or × 1,08** ; parts sur 40
essais pour ces six niveaux, sur 20 essais (pilote du 23/10) pour les autres, dont les temps
sont **inchangés** (LEVELS.md §8) :

| N° | Or | Argent | Bronze | Attentif or / argent / bronze | Pressé or / argent / bronze |
|---|---|---|---|---|---|
| 1 | 14 s | 15,2 s | 16,4 s | 25 % / 100 % / 100 % | 35 % / 45 % / 48 % |
| 2 | 18,2 s | 19,7 s | 21,2 s | 8 % / 93 % / 98 % | 13 % / 40 % / 60 % |
| 3 | 21,6 s | 23,4 s | 25,2 s | 23 % / 90 % / 93 % | 10 % / 25 % / 30 % |
| 4 | 30,9 s | 33,4 s | 35,9 s | 25 % / 100 % / 100 % | 13 % / 23 % / 35 % |
| 5 | 32,0 s | 37,0 s | 42,1 s | 35 % / 80 % / 85 % | 0 % / 20 % / 45 % |
| 6 | 31,6 s | 37,3 s | 43,1 s | 60 % / 80 % / 95 % | 25 % / 40 % / 60 % |
| 7 | 32,1 s | 36,2 s | 40,3 s | 55 % / 80 % / 80 % | 5 % / 20 % / 45 % |
| 8 | 33,8 s | 37,4 s | 44,5 s | 35 % / 65 % / 100 % | 15 % / 35 % / 60 % |
| 9 | 31,7 s | 34,3 s | 36,9 s | 18 % / 98 % / 98 % | 5 % / 15 % / 25 % |
| 10 | 35,9 s | 40,1 s | 44,5 s | 50 % / 70 % / 95 % | 40 % / 55 % / 65 % |
| 11 | 32,8 s | 36,2 s | 48,0 s | 25 % / 65 % / 100 % | 0 % / 15 % / 40 % |
| 12 | 31 s | 33,5 s | 36,1 s | 23 % / 80 % / 90 % | 5 % / 15 % / 25 % |

Avec le pilote corrigé (plus fiable), les essais attentifs sont plus rapides qu'avant : l'or des
N°5–8, 10 et 11 (non recalibrés) est atteint par 25–60 % des essais attentifs (cible 10–25 %). Un
`--calibrate --trials 40 --write` niveau par niveau les remettrait dans la fenêtre (à décider : il
change les temps cibles déjà affichés aux joueurs).

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
