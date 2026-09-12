-- Grupe, 13 septembrie 2026.
-- Se ruleaza o singura data, in editorul SQL din Supabase.
--
-- Tabelul `grupe` exista din prima zi, dar avea doar un `orar` scris de mana.
-- O grupa are nevoie de un orar pe care sa poata socoti si masina: ziua, ora,
-- prima lectie, cate lectii tine cursul, cate locuri are si cat costa o lectie.
--
-- Dupa ce trece, tabelul trebuie EXPUS Data API-ului, altfel pana si cheia de
-- serviciu ia 500: Integrations, Data API, Settings, Exposed tables.
-- La crearea proiectului a fost debifat „Automatically expose new tables".

alter table public.grupe add column if not exists zi smallint not null default 1 check (zi between 1 and 7);
alter table public.grupe add column if not exists ora text not null default '18:00' check (ora ~ '^\d{2}:\d{2}$');
alter table public.grupe add column if not exists prima date;
alter table public.grupe add column if not exists lectii smallint not null default 15 check (lectii between 1 and 60);
alter table public.grupe add column if not exists locuri smallint not null default 4 check (locuri between 2 and 12);
alter table public.grupe add column if not exists pret numeric not null default 20;

-- Lectiile unei grupe se sterg odata cu ea doar ca legatura, nu ca istoric:
-- `on delete set null` era deja pus cand s-a creat coloana.
create index if not exists programari_grupa_idx on public.programari (grupa_id);

select 'grupe gata' as rezultat;
