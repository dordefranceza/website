-- Propunerea de lectie: o stare noua si codul din linkul de confirmare.
-- De rulat o singura data, in SQL Editor din Supabase, pe proiectul existent.
-- Pe o baza noua nu e nevoie: schema.sql le are deja.

alter table public.programari drop constraint if exists programari_stare_check;
alter table public.programari
  add constraint programari_stare_check
  check (stare in ('propusa', 'noua', 'confirmata', 'anulata', 'finalizata'));

alter table public.programari add column if not exists token_confirmare text;
alter table public.programari add column if not exists token_expira timestamptz;

create unique index if not exists programari_token
  on public.programari (token_confirmare)
  where token_confirmare is not null;
