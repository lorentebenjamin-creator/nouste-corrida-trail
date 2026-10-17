-- =====================================================================
-- NOUSTE CORRIDA TRAIL — classement en ligne (Supabase / PostgreSQL)
-- À exécuter UNE fois dans Dashboard → SQL Editor → New query → Run.
-- Ré-exécutable sans risque (idempotent) : utile après une modification.
-- =====================================================================

-- 1) Table des temps -----------------------------------------------------
create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  level_id    text        not null,
  name        text        not null,
  time_ms     integer     not null,
  balises     smallint    not null default 0,
  created_at  timestamptz not null default now(),

  -- id de niveau comme dans levels.js (minuscules, chiffres, tirets)
  constraint scores_level_id_format check (level_id ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  -- « Nom sur le dossard » : 1 à 20 caractères, sans espaces aux bords,
  -- sans caractères de contrôle ni chevrons
  constraint scores_name_len    check (char_length(name) between 1 and 20),
  constraint scores_name_trim   check (name = btrim(name)),
  constraint scores_name_chars  check (name !~ '[[:cntrl:]<>]'),
  -- temps plausible : de 8 s à 1 h
  constraint scores_time_range  check (time_ms between 8000 and 3600000),
  constraint scores_balises     check (balises between 0 and 500)
);

create index if not exists scores_level_time_idx on public.scores (level_id, time_ms, created_at);
create index if not exists scores_level_name_idx on public.scores (level_id, lower(name), time_ms);
create index if not exists scores_created_idx    on public.scores (created_at);

-- 2) Temps minimum par niveau (anti-triche simple) -----------------------
--    Les niveaux absents de cette table n'ont que la borne générale (8 s).
--    Valeurs ≈ 65 % du temps de l'autopilote (marge pour les très bons joueurs).
create table if not exists public.level_limits (
  level_id    text    primary key,
  min_time_ms integer not null check (min_time_ms >= 8000)
);
insert into public.level_limits (level_id, min_time_ms) values
  ('sousbois',  9000),
  ('crete',    12000),
  ('col',      14000),
  ('breche',   20000),
  ('estive',   19000),
  ('couloir',  19000)
on conflict (level_id) do nothing;

-- 3) Garde-fous à l'insertion (trigger) ----------------------------------
--    • created_at forcé à now() (impossible d'antidater)
--    • temps ≥ minimum du niveau
--    • « rate-limit » : 1 envoi / 5 s par nom et par niveau,
--      et 120 envois / minute au total
create or replace function public.scores_before_insert()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_min integer;
begin
  new.created_at := now();
  new.name := btrim(new.name);

  select min_time_ms into v_min from public.level_limits where level_id = new.level_id;
  if v_min is not null and new.time_ms < v_min then
    raise exception 'temps trop court pour ce niveau' using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from public.scores
    where level_id = new.level_id
      and lower(name) = lower(new.name)
      and created_at > now() - interval '5 seconds'
  ) then
    raise exception 'trop d''envois, réessaie dans quelques secondes' using errcode = 'check_violation';
  end if;

  if (select count(*) from public.scores where created_at > now() - interval '1 minute') >= 120 then
    raise exception 'classement saturé, réessaie plus tard' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists scores_before_insert on public.scores;
create trigger scores_before_insert
  before insert on public.scores
  for each row execute function public.scores_before_insert();

-- 4) RLS : lecture + insertion anonymes uniquement -----------------------
alter table public.scores       enable row level security;
alter table public.level_limits enable row level security;

drop policy if exists "scores lisibles par tous"   on public.scores;
drop policy if exists "scores insérables par tous" on public.scores;
create policy "scores lisibles par tous"
  on public.scores for select to anon, authenticated using (true);
create policy "scores insérables par tous"
  on public.scores for insert to anon, authenticated with check (true);
-- (aucune policy update/delete → interdits)

drop policy if exists "limites lisibles par tous" on public.level_limits;
create policy "limites lisibles par tous"
  on public.level_limits for select to anon, authenticated using (true);

revoke all on public.scores, public.level_limits from anon, authenticated;
grant select, insert on public.scores       to anon, authenticated;
grant select         on public.level_limits to anon, authenticated;

-- 5) Vues : meilleur temps par nom et par niveau -------------------------
--    security_invoker → la vue respecte la RLS de la table.
create or replace view public.leaderboard
with (security_invoker = true) as
select distinct on (level_id, lower(name))
  level_id,
  name,
  lower(name) as name_key,
  time_ms,
  balises,
  created_at
from public.scores
order by level_id, lower(name), time_ms, created_at;

--    Top 3 de chaque niveau en une seule requête (pour le menu)
create or replace view public.level_top
with (security_invoker = true) as
select level_id, name, time_ms, balises, rn
from (
  select l.*, row_number() over (partition by level_id order by time_ms, created_at) as rn
  from public.leaderboard l
) t
where rn <= 3;

grant select on public.leaderboard, public.level_top to anon, authenticated;

-- 6) Recharger le cache de schéma de l'API REST --------------------------
notify pgrst, 'reload schema';

-- Pour vider le classement d'un niveau (depuis le SQL Editor, rôle admin) :
--   delete from public.scores where level_id = 'col';
-- Pour retirer un nom :
--   delete from public.scores where lower(name) = lower('Tricheur');
