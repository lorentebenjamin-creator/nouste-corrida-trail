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

## Classement en ligne (branche `classement`)

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
