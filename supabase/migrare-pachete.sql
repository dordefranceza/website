-- Pachete de lectii, 13 septembrie 2026.
-- Se ruleaza o singura data, in editorul SQL din Supabase.
--
-- Cursantul cumpara 5, 10 sau 24 de lectii deodata si plateste o data. Lectiile
-- lui se scad apoi din pachet, una cate una, si nu se mai cer bani pe fiecare.
--
-- Un rand aici e o cumparare, nu un abonament: cine ia doua pachete are doua
-- randuri, iar lectiile ramase sunt suma lor minus lectiile facute.
--
-- Dupa ce trece, tabelul trebuie EXPUS Data API-ului, altfel pana si cheia de
-- serviciu ia 500: Integrations, Data API, Settings, Exposed tables.

create table if not exists public.pachete (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clienti (id) on delete cascade,
  nume text not null default '',
  lectii smallint not null check (lectii between 1 and 60),
  pret numeric not null default 0,
  platit boolean not null default false,
  note text not null default '',
  creat timestamptz not null default now()
);

create index if not exists pachete_client_idx on public.pachete (client_id);

alter table public.pachete enable row level security;

-- Aceleasi drepturi ca restul tabelelor. RLS e pornit si nu are nicio politica,
-- deci anon si authenticated primesc lista goala; doar service_role, care
-- ocoleste RLS, ajunge la date.

select 'pachete gata' as rezultat;
