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
| 8 | Le Gué des Lucioles *(niveau du jour)* | Très engagé | 956 m | trail **de nuit** (nouvelle palette) et **jet + radeau** : la cascade tombe sur l'embarcadère d'un radeau mobile, deux cycles à lire ensemble |

Règle : **chaque nouveau sentier apporte au moins une nouveauté** (une mécanique inédite ou un
passage clé jamais vu) et la colonne ci-dessus dit laquelle (voir LEVELS.md §6).

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
décrits dans **[LEVELS.md](LEVELS.md)**. Vérification : `node tools/check-levels.mjs`,
puis `tools/playtest.mjs` (pilote automatique sur chaque niveau ; `--human --trials 20` pour un
pilote « humain » imprécis et des taux de réussite), `tools/e2e.mjs` (commandes, fanions, record,
menu) et `tools/e2e-classement.mjs` (classement, faux backend) avec Playwright.

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
