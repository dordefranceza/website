# DorDeFranceza

Site-ul și cabinetul Dorinei, profesoară de franceză online pentru adulți din România.

- **Site public**: Astro, Tailwind 4, componente shadcn, iconițe Solar. Pagini: start, programare, prețuri, despre, contact, legal.
- **Programare**: `/programare/` citește sloturile libere din `/api/sloturi` și trimite la `/api/programare`, care salvează și trimite emailurile (Resend).
- **Cabinet**: `/cabinet/`, aplicație React cu tablou, programări, calendar, cursanți, orar și setări. Vorbește doar cu `/api/cabinet/*`.
- **Date**: Supabase (schema în `supabase/schema.sql`). Fără Supabase, în dezvoltare, totul stă în `.local/`.

```bash
npm install
npm run dev
```

Punerea în funcțiune, pas cu pas: `docs/ACTIVARE.md`.
