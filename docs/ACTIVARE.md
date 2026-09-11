# Cum se pune în funcțiune DorDeFranceza

Site-ul merge local fără nicio configurare: datele stau în `.local/date.json`,
emailurile se scriu în `.local/emailuri.json`, iar în cabinet se intră cu butonul
„Intră în modul local". Pașii de mai jos îl leagă de servicii reale.

## 1. Supabase (baza de date și contul Dorinei)

1. Proiect nou pe supabase.com, regiunea Frankfurt (UE).
2. SQL Editor: rulează `supabase/schema.sql`.
3. Authentication > Users > Add user: emailul Dorinei și o parolă lungă.
   Bifează „Auto confirm user".
4. SQL Editor: `insert into public.admin_email (email) values ('emailul-ei');`
5. Project Settings > API: copiază URL-ul, cheia publică (anon) și cheia de
   serviciu (service_role) în variabilele de mediu.
6. Authentication > Multi-Factor: TOTP pornit (este pornit implicit). Când
   Dorina își leagă Google Authenticator din cabinet (etapa 2), serverul cere
   codul la fiecare intrare.

## 2. Resend (emailuri)

1. Cont pe resend.com, adaugă domeniul (recomandat un subdomeniu, de exemplu
   `send.dordefranceza.ro`) și pune înregistrările DNS cerute.
2. API Keys: cheie nouă, doar „Sending access".
3. `EMAIL_DE` trebuie să fie pe domeniul verificat.

## 3. Vercel

1. Proiect nou din repo, framework Astro.
2. Environment Variables: toate cele din `.env.example`.
3. După deploy, `PUBLIC_SITE_URL` devine domeniul real; canonical, sitemap și
   linkurile din emailuri îl urmează.

## 4. Primele setări în cabinet

Cabinet > Setări: linkul personal de Zoom (Personal Meeting Room), emailul pe
care vin notificările, dacă discuția de cunoaștere gratuită e activă.
Cabinet > Disponibilitate: orele din fiecare zi a săptămânii și zilele blocate.

## Ce mai lipsește pentru lansare

- Poza Dorinei în `public/images/` și în `Antet.astro` / `Despre.astro`
  (acum e un desen de rezervă).
- Datele reale din `src/config/site.ts`: email, telefon, WhatsApp, Instagram,
  TikTok.
- Textele marcate DE CONFIRMAT în `src/config/continut.ts` și în paginile
  legale.
- Imaginea Open Graph `public/images/og.png` (1200×630).
