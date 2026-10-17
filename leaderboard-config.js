// Configuration du classement en ligne.
// - LEADERBOARD_CONFIG = null  → classement désactivé (aucun appel réseau, rien n'est affiché).
// - provider "supabase" : url du projet + clé publique (publishable / anon). Ces clés sont
//   faites pour être publiques : la sécurité repose sur la RLS et les contraintes de
//   supabase/schema.sql (lecture + insertion seulement).
// - provider "local" : classement stocké dans ce navigateur (démo / tests hors ligne).
export const LEADERBOARD_CONFIG = {
  provider: "supabase",
  url: "https://woeluwllkbquftufngla.supabase.co",
  key: "sb_publishable_hIlnkjfqFK6H8-BaE34vWA_4ySRp-GB",
};
