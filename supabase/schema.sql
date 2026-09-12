-- =============================================================================
--  DORDEFRANCEZA, schema bazei de date
-- =============================================================================
--  Se ruleaza o singura data, in SQL Editor din Supabase.
--
--  Principiul: browserul nu citeste NIMIC din aceste tabele. Toate citirile si
--  scrierile trec prin functiile serverului (src/pages/api/), care folosesc
--  cheia de serviciu. De aceea RLS e pornit pe toate tabelele si NU exista
--  nicio politica: cheia publica (anon) si un utilizator logat primesc zero
--  randuri. Cheia de serviciu ocoleste RLS, dar ea sta doar pe Vercel.
--
--  Cabinetul se autentifica prin Supabase Auth (email + parola, optional
--  aplicatia de verificare). Serverul verifica token-ul si tabelul admin_email.
-- =============================================================================

create extension if not exists pgcrypto;

-- Setarile cabinetului, un singur rand cu id 'site'.
create table if not exists public.setari (
  id text primary key,
  date jsonb not null default '{}'::jsonb,
  actualizat timestamptz not null default now()
);
insert into public.setari (id, date) values ('site', '{}'::jsonb) on conflict (id) do nothing;

-- Orarul saptamanal: in ziua `zi` (1 = luni ... 7 = duminica), de la `de_la` la `pana_la`.
create table if not exists public.disponibilitate (
  id uuid primary key default gen_random_uuid(),
  zi smallint not null check (zi between 1 and 7),
  de_la text not null check (de_la ~ '^\d{2}:\d{2}$'),
  pana_la text not null check (pana_la ~ '^\d{2}:\d{2}$')
);

-- Intervale blocate (scoala, vacanta).
create table if not exists public.blocaje (
  id uuid primary key default gen_random_uuid(),
  de_la timestamptz not null,
  pana_la timestamptz not null,
  motiv text not null default '',
  creat timestamptz not null default now(),
  check (pana_la > de_la)
);

create table if not exists public.clienti (
  id uuid primary key default gen_random_uuid(),
  nume text not null,
  email text not null unique,
  telefon text not null default '',
  nivel text not null default '',
  scop text not null default '',
  sursa text not null default '',
  note text not null default '',
  creat timestamptz not null default now()
);

create table if not exists public.programari (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clienti (id) on delete cascade,
  tip text not null check (tip in ('cunoastere', 'individual', 'grup')),
  incepe timestamptz not null,
  durata_min integer not null default 50,
  stare text not null default 'noua' check (stare in ('propusa', 'noua', 'confirmata', 'anulata', 'finalizata')),
  platit boolean not null default false,
  suma numeric(8, 2) not null default 0,
  sursa text not null default '',
  pagina text not null default '',
  mesaj text not null default '',
  link_zoom text not null default '',
  note text not null default '',
  reminder_24h timestamptz,
  reminder_20m timestamptz,
  -- Codul din linkul propunerii trimise de Dorina, si pana cand mai e bun.
  token_confirmare text,
  token_expira timestamptz,
  creat timestamptz not null default now()
);
create index if not exists programari_incepe on public.programari (incepe);
create index if not exists programari_client on public.programari (client_id);
create unique index if not exists programari_token on public.programari (token_confirmare) where token_confirmare is not null;

-- Cine are voie in cabinet. O coloana: emailul contului din Supabase Auth.
create table if not exists public.admin_email (
  email text primary key
);
-- DE COMPLETAT: emailul cu care Dorina isi face contul in Authentication > Users.
-- insert into public.admin_email (email) values ('dorina@exemplu.ro');

-- Pregatit pentru etapa 2 (grupe). Tabelul exista, cabinetul inca nu-l foloseste.
create table if not exists public.grupe (
  id uuid primary key default gen_random_uuid(),
  nume text not null,
  nivel text not null default '',
  scop text not null default '',
  orar text not null default '',
  activ boolean not null default true,
  creat timestamptz not null default now()
);
alter table public.programari add column if not exists grupa_id uuid references public.grupe (id) on delete set null;
alter table public.clienti add column if not exists grupa_id uuid references public.grupe (id) on delete set null;

-- RLS pornit peste tot, fara politici: din browser nu se vede nimic.
alter table public.setari enable row level security;
alter table public.disponibilitate enable row level security;
alter table public.blocaje enable row level security;
alter table public.clienti enable row level security;
alter table public.programari enable row level security;
alter table public.admin_email enable row level security;
alter table public.grupe enable row level security;

revoke all on all tables in schema public from anon, authenticated;

-- -----------------------------------------------------------------------------
--  BLOG (adaugat 12 septembrie 2026)
-- -----------------------------------------------------------------------------
create table if not exists public.articole (
  id uuid primary key default gen_random_uuid(),
  slug text not null default '',
  titlu text not null default '',
  rezumat text not null default '',
  continut text not null default '',
  imagine text not null default '',
  imagine_alt text not null default '',
  meta_titlu text not null default '',
  meta_descriere text not null default '',
  publicat boolean not null default false,
  publicat_la timestamptz,
  creat timestamptz not null default now(),
  actualizat timestamptz not null default now()
);
create unique index if not exists articole_slug on public.articole (slug) where slug <> '';
alter table public.articole enable row level security;
revoke all on public.articole from anon, authenticated;

-- Imaginile articolelor stau intr-un bucket PUBLIC numit "imagini" (Storage >
-- New bucket > Public). Scrierea se face doar de pe server, cu cheia de
-- serviciu, deci nu e nevoie de nicio politica de storage pentru anon.

-- -----------------------------------------------------------------------------
--  ORAR PE ZILE (adaugat 13 septembrie 2026)
-- -----------------------------------------------------------------------------
-- Orarul saptamanal raspunde la „in fiecare marti". Nu raspunde la „marti, 22
-- septembrie, sunt libera doar dimineata". Tabelul asta tine ziua anume, iar
-- ziua bate saptamana: daca o data are rand aici, conteaza numai ce scrie in el.
-- Un rand cu `intervale` gol inseamna zi inchisa dinadins, nu zi neatinsa.
create table if not exists public.orar_zi (
  data date primary key,
  intervale jsonb not null default '[]'::jsonb,
  actualizat timestamptz not null default now()
);

alter table public.orar_zi enable row level security;
revoke all on public.orar_zi from anon, authenticated;
