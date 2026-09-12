-- Orar pe zile, 13 septembrie 2026.
-- Se ruleaza o singura data, in editorul SQL din Supabase.
--
-- Dupa ce trece, tabelul trebuie EXPUS Data API-ului, altfel pana si cheia de
-- serviciu ia 500: Settings, API, Exposed schemas / tables. La crearea
-- proiectului a fost debifat „Automatically expose new tables", deci tabelele
-- noi nu apar singure.

create table if not exists public.orar_zi (
  data date primary key,
  intervale jsonb not null default '[]'::jsonb,
  actualizat timestamptz not null default now()
);

alter table public.orar_zi enable row level security;

-- Aceleasi drepturi ca restul tabelelor. Fara ele, Data API-ul nu vede
-- tabelul si pana si cheia de serviciu ia 500. RLS e pornit si nu are nicio
-- politica, deci anon si authenticated primesc lista goala; doar service_role,
-- care ocoleste RLS, ajunge la date. In panou se bifeaza la
-- Integrations, Data API, Settings, Exposed tables.

select 'orar_zi gata' as rezultat;
