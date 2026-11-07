-- =====================================================================
-- L'Agora — Intranet social hospitalier (MVP)
-- Schéma Supabase (PostgreSQL) : tables, sécurité RLS, filtre anti-
-- données sensibles côté serveur.
-- À exécuter dans Supabase > SQL Editor (projet gratuit).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Profils (liés à auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default 'Collègue',
  service       text not null default 'Non renseigné',
  job           text,                       -- corps de métier
  anonymous     boolean not null default false, -- interactions sociales anonymisées
  role          text not null default 'agent' check (role in ('agent','editor','moderator','admin')),
  created_at    timestamptz not null default now()
);

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(split_part(new.email, '@', 1), 'Collègue'))
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'anon');
$$;

-- ---------------------------------------------------------------------
-- 2. Filtre sémantique anti-données sensibles (côté serveur)
--    Doublé côté client (docs/js/filter.js) — le serveur fait foi.
-- ---------------------------------------------------------------------
create or replace function public.sensitive_reason(txt text)
returns text language plpgsql immutable as $$
declare t text := coalesce(txt, '');
begin
  -- N° de sécurité sociale (NIR) : 13 chiffres + clé, espaces tolérés
  if t ~ '[12][ .]?[0-9]{2}[ .]?(0[1-9]|1[0-2]|[2-9][0-9])[ .]?[0-9][0-9AB][ .]?[0-9]{3}[ .]?[0-9]{3}([ .]?[0-9]{2})?' then
    return 'numéro de sécurité sociale';
  end if;
  -- IPP / NDA / n° d''admission / n° de dossier
  if t ~* '\m(ipp|nda|n°\s*d.?admission|num[ée]ro\s+d.?admission|n°\s*dossier|dossier\s+patient)\M\s*[:#n°]*\s*[0-9]{4,}' then
    return 'identifiant patient (IPP/NDA/admission)';
  end if;
  -- Suite longue de chiffres isolée (7 à 12) = identifiant probable
  if t ~ '(^|[^0-9+])[0-9]{7,12}([^0-9]|$)' and t !~ '(^|\s)0[1-9]([ .-]?[0-9]{2}){4}' then
    return 'identifiant numérique long';
  end if;
  -- Mentions cliniques nominatives
  if t ~* '\m(patient|patiente|résident|résidente)\M.{0,30}\m(m\.|mme|monsieur|madame|chambre|lit)\M' then
    return 'mention nominative d''un patient';
  end if;
  if t ~* '\m(compte[- ]rendu|ordonnance|résultats? d.?analyse|dossier médical)\M' then
    return 'contenu médical / clinique';
  end if;
  return null;
end $$;

create or replace function public.block_sensitive()
returns trigger language plpgsql as $$
declare r text;
begin
  r := public.sensitive_reason(coalesce(new.title,'') || ' ' || coalesce(new.body,''));
  if r is not null then
    raise exception 'Publication bloquée : % détecté. Aucune donnée patient sur L''Agora.', r
      using errcode = 'P0001';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 3. Publications (fil d'actu, portraits, événements, annonces, mercis)
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references public.profiles(id) on delete set null default auth.uid(),
  kind        text not null check (kind in ('news','portrait','event','annonce','kudos','club')),
  category    text,              -- ex : equipement, qvt, covoiturage, troc, logement...
  title       text not null check (char_length(title) between 3 and 140),
  body        text not null check (char_length(body) between 1 and 4000),
  event_date  timestamptz,       -- pour kind = event
  location    text,
  to_team     text,              -- pour kind = kudos (équipe remerciée)
  club_id     uuid,              -- pour kind = club
  status      text not null default 'published' check (status in ('published','hidden')),
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists posts_kind_idx on public.posts(kind, created_at desc);

drop trigger if exists posts_block_sensitive on public.posts;
create trigger posts_block_sensitive before insert or update on public.posts
  for each row execute function public.block_sensitive();

-- ---------------------------------------------------------------------
-- 4. Interactions
-- ---------------------------------------------------------------------
create table if not exists public.reactions (
  post_id    uuid references public.posts(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete set null default auth.uid(),
  title      text,  -- inutilisé, présent pour réutiliser le trigger
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
drop trigger if exists comments_block_sensitive on public.comments;
create trigger comments_block_sensitive before insert or update on public.comments
  for each row execute function public.block_sensitive();

-- Vue publique : masque l'auteur si anonymat demandé
create or replace view public.posts_feed with (security_invoker = true) as
select p.*,
       case when pr.anonymous then 'Collègue anonyme' else pr.display_name end as author_name,
       pr.service as author_service,
       (select count(*) from public.reactions r where r.post_id = p.id) as likes,
       (select count(*) from public.comments c where c.post_id = p.id) as comments_count
from public.posts p
left join public.profiles pr on pr.id = p.author_id;

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.posts(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null default auth.uid(),
  reason      text not null,
  status      text not null default 'open' check (status in ('open','resolved')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Ressources (boîte à outils, annuaire, avantages, vie pratique)
-- ---------------------------------------------------------------------
create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  section     text not null check (section in ('procedure','annuaire','accueil','avantage','pratique','bienetre')),
  category    text,
  title       text not null,
  body        text,
  url         text,
  phone       text,              -- postes fixes / urgences techniques uniquement
  tags        text[] default '{}',
  updated_at  timestamptz not null default now()
);

create table if not exists public.menus (
  day      date primary key,
  starter  text, main text, veggie text, dessert text,
  theme    text
);

-- ---------------------------------------------------------------------
-- 6. Clubs
-- ---------------------------------------------------------------------
create table if not exists public.clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  emoji       text default '⭐',
  description text,
  created_at  timestamptz not null default now()
);
create table if not exists public.club_members (
  club_id uuid references public.clubs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  primary key (club_id, user_id)
);

-- ---------------------------------------------------------------------
-- 7. Baromètre (micro-sondages)
-- ---------------------------------------------------------------------
create table if not exists public.polls (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  options    text[] not null,
  closes_at  timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.poll_votes (
  poll_id    uuid references public.polls(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade default auth.uid(),
  option_idx int not null,
  primary key (poll_id, user_id)
);
create or replace view public.poll_results with (security_invoker = true) as
select poll_id, option_idx, count(*)::int as votes from public.poll_votes group by 1,2;

-- ---------------------------------------------------------------------
-- 8. Row Level Security
--    Lecture : tout agent authentifié. Écriture : selon rôle.
-- ---------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.posts        enable row level security;
alter table public.reactions    enable row level security;
alter table public.comments     enable row level security;
alter table public.reports      enable row level security;
alter table public.resources    enable row level security;
alter table public.menus        enable row level security;
alter table public.clubs        enable row level security;
alter table public.club_members enable row level security;
alter table public.polls        enable row level security;
alter table public.poll_votes   enable row level security;

-- Profils
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select to authenticated using (true);
create policy "profiles update" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- Publications : actus/portraits réservés aux éditeurs (communication interne)
drop policy if exists "posts read"   on public.posts;
drop policy if exists "posts insert" on public.posts;
drop policy if exists "posts update" on public.posts;
drop policy if exists "posts delete" on public.posts;
create policy "posts read" on public.posts for select to authenticated
  using (status = 'published' or author_id = auth.uid() or public.my_role() in ('moderator','admin'));
create policy "posts insert" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and (
    kind in ('event','annonce','kudos','club') or public.my_role() in ('editor','moderator','admin')));
create policy "posts update" on public.posts for update to authenticated
  using (author_id = auth.uid() or public.my_role() in ('moderator','admin'));
create policy "posts delete" on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.my_role() in ('moderator','admin'));

-- Réactions / commentaires
drop policy if exists "reactions read" on public.reactions;
drop policy if exists "reactions write" on public.reactions;
drop policy if exists "reactions delete" on public.reactions;
create policy "reactions read"   on public.reactions for select to authenticated using (true);
create policy "reactions write"  on public.reactions for insert to authenticated with check (user_id = auth.uid());
create policy "reactions delete" on public.reactions for delete to authenticated using (user_id = auth.uid());

drop policy if exists "comments read" on public.comments;
drop policy if exists "comments write" on public.comments;
drop policy if exists "comments delete" on public.comments;
create policy "comments read"   on public.comments for select to authenticated using (true);
create policy "comments write"  on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "comments delete" on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.my_role() in ('moderator','admin'));

-- Signalements : chacun signale, seuls les modérateurs lisent
drop policy if exists "reports insert" on public.reports;
drop policy if exists "reports read" on public.reports;
drop policy if exists "reports update" on public.reports;
create policy "reports insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports read"   on public.reports for select to authenticated using (public.my_role() in ('moderator','admin'));
create policy "reports update" on public.reports for update to authenticated using (public.my_role() in ('moderator','admin'));

-- Contenus éditoriaux (ressources, menus, clubs, sondages)
do $$
declare t text;
begin
  foreach t in array array['resources','menus','clubs','polls'] loop
    execute format('drop policy if exists "%1$s read" on public.%1$s', t);
    execute format('drop policy if exists "%1$s write" on public.%1$s', t);
    execute format('create policy "%1$s read" on public.%1$s for select to authenticated using (true)', t);
    execute format('create policy "%1$s write" on public.%1$s for all to authenticated
                    using (public.my_role() in (''editor'',''admin''))
                    with check (public.my_role() in (''editor'',''admin''))', t);
  end loop;
end $$;

-- Bornes (salle de pause / self) : se connecter avec un compte dédié
-- « borne@... » de rôle agent. Aucune lecture anonyme n'est ouverte.
drop policy if exists "menus kiosk" on public.menus;

drop policy if exists "club_members read" on public.club_members;
drop policy if exists "club_members join" on public.club_members;
drop policy if exists "club_members leave" on public.club_members;
create policy "club_members read"  on public.club_members for select to authenticated using (true);
create policy "club_members join"  on public.club_members for insert to authenticated with check (user_id = auth.uid());
create policy "club_members leave" on public.club_members for delete to authenticated using (user_id = auth.uid());

drop policy if exists "votes read" on public.poll_votes;
drop policy if exists "votes write" on public.poll_votes;
create policy "votes read"  on public.poll_votes for select to authenticated using (true);
create policy "votes write" on public.poll_votes for insert to authenticated with check (user_id = auth.uid());

-- Promotion d'un modérateur/éditeur (à lancer manuellement) :
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'vous@hopital.fr');
