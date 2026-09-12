# Predare, 12 septembrie 2026

Starea exactă a proiectului la finalul primei sesiuni de lucru. Cine continuă
citește doar fișierul ăsta și știe tot.

---

## Ce e gata

**Codul.** Site public complet, cabinet, blog, pagini legale. 16 commituri,
toate pe `main`, urcate pe <https://github.com/dordefranceza/website>
(repo **PUBLIC**, deci nicio cheie nu are voie să intre în el).
Local: `/Users/artiom/LUCRU/Claude Code/dordefranceza`.
Dev server: `npm run dev`, sau `.claude/launch.json` → `dordefranceza`, port 4360.

**Viteza.** Lighthouse mobil, build servit local cu gzip: 98-100 performanță,
100 accesibilitate, 100 bune practici, 100 SEO. Harness în
`scratchpad/lh/serve.mjs` plus `run.sh`.

**GitHub.** `ark4su-cloud` e colaborator pe repo, deci `git push` merge din
terminal fără alte setări.

**Supabase.** Proiect creat și sănătos.

| Ce | Valoare |
|---|---|
| Organizație | DorDeFranceza (Free) |
| Ref proiect | `tlssfcovuhonydonuevb` |
| URL | `https://tlssfcovuhonydonuevb.supabase.co` |
| Regiune | Central EU (Frankfurt), eu-central-1 |
| Panou | <https://supabase.com/dashboard/project/tlssfcovuhonydonuevb> |

Rulat deja acolo:
- toată `supabase/schema.sql`, cele 8 tabele există: `admin_email`, `articole`,
  `blocaje`, `clienti`, `disponibilitate`, `grupe`, `programari`, `setari`
- bucket `imagini`, public, pentru pozele din blog
- `admin_email` conține `dordefranceza@gmail.com`

La creare am **debifat** „Automatically expose new tables", ca accesul să fie
controlat manual. RLS e pornit pe toate tabelele, fără nicio politică: din
browser nu se vede nimic, tot trece prin server cu cheia de serviciu.

Parola bazei de date a fost generată de Supabase și nu a fost salvată nicăieri.
Nu e nevoie de ea: codul folosește cheile API. Dacă va trebui vreodată, se
resetează din panou.

**Vercel.** Proiect creat, legat de GitHub.

| Ce | Valoare |
|---|---|
| Echipă | dordefranceza (Hobby) |
| Proiect | `dordefranceza` |
| Panou | <https://vercel.com/dordefranceza/dordefranceza> |
| Adresă | `https://dordefranceza.vercel.app` |

Aplicația GitHub a Vercel e instalată **doar** pe repo-ul `website`, nu pe tot
contul.

---

## Ce a rămas de făcut, în ordine

### 1. Reparat variabilele de mediu pe Vercel

**Capcana, citește înainte să atingi ceva.** La import, Vercel a citit
`.env.example` și a creat 8 variabile **goale, de tip Secret**. O variabilă
Secret nu mai poate fi schimbată în Config, iar Vercel **refuză** să salveze o
variabilă care începe cu `PUBLIC_` dacă e Secret („Remove the public framework
prefix to keep this value private").

Deci: **șterge toate cele 8** din
<https://vercel.com/dordefranceza/dordefranceza/settings/environment-variables>
(meniul „..." de pe fiecare rând → Delete) și adaugă-le din nou cu tipul corect:

| Variabilă | Tip | Valoare |
|---|---|---|
| `PUBLIC_SITE_URL` | Config | `https://dordefranceza.vercel.app` sau domeniul real |
| `PUBLIC_SUPABASE_URL` | Config | `https://tlssfcovuhonydonuevb.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Config | cheia *publishable* din Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | cheia *secret* din Supabase |
| `RESEND_API_KEY` | Secret | din resend.com |
| `EMAIL_DE` | Config | expeditorul, pe domeniu verificat în Resend |
| `EMAIL_DORINA` | Config | unde ajung notificările |
| `WHATSAPP_DORINA` | Config | numărul ei, doar cifre cu prefix |

Cheile Supabase sunt la
<https://supabase.com/dashboard/project/tlssfcovuhonydonuevb/settings/api-keys>,
tabul „Publishable and secret API keys". Fiecare are buton de copiere; cea
secretă trebuie întâi dezvăluită cu ochiul. Treci-le prin clipboard, nu prin
chat.

După ce sunt puse, **Redeploy** din Deployments, altfel nu se aplică.

### 2. Resend

Contul e făcut (<https://resend.com/onboarding>). De acolo:
- Domains → adaugă un subdomeniu, de exemplu `send.dordefranceza.ro`, și pune
  înregistrările DNS cerute
- API Keys → cheie nouă, doar „Sending access"
- `EMAIL_DE` trebuie să fie pe domeniul verificat, altfel Resend refuză

**Blocant real:** fără domeniu cumpărat nu se poate verifica niciun expeditor.
Până atunci, emailurile de confirmare către cursanți nu pleacă. Site-ul merge,
programarea se salvează, doar confirmarea automată stă. Artiom trebuie să
decidă dacă ia domeniul acum.

### 3. Contul Dorinei în cabinet

Supabase → Authentication → Users → Add user, cu `dordefranceza@gmail.com`
(deja trecut în `admin_email`) sau cu adresa ei reală. Dacă folosești altă
adresă, adaug-o și în tabel:

```sql
insert into public.admin_email (email) values ('adresa@exemplu.ro')
on conflict (email) do nothing;
```

Parola o pune ea, nu Claude.

### 4. Datele reale, în cod

- `src/config/firma.ts`: tot ce e în `[paranteze]` e necompletat. Fără ele,
  paginile legale sunt incomplete. În dezvoltare apare un avertisment portocaliu
  cât timp lipsesc.
- `src/config/site.ts`: email, telefon, WhatsApp, Instagram, TikTok sunt
  substituenți.
- `src/config/continut.ts`: bucățile marcate DE CONFIRMAT despre Dorina.

### 5. Verificarea finală

După primul deploy reușit, deschide fiecare pagină pe adresa live, nu un
eșantion: `/`, `/programare/`, `/preturi/`, `/despre/`, `/blog/`, `/contact/`,
`/confidentialitate/`, `/termeni/`, `/cookies/`, `/anulare-si-rambursare/`,
`/formular-retragere/`, `/credite/`, `/cabinet/`, plus o adresă inexistentă
pentru 404. Apoi o programare de probă, ca să vezi că emailul pleacă.

---

## Decizii deja luate de Artiom, nu le schimba fără să întrebi

- Lecția are **50 de minute**. Individual **40 €**, grup **25 €**.
- Prețurile se afișează **în euro**, cu echivalentul în lei scris mic dedesubt.
  Leul rămâne pentru HG 947/2000; dacă cere să dispară, se scoate, dar i s-a
  spus ce înseamnă.
- Sigla e **„D´or de Franceza"**, cu accentul albastru **între D și o**, strâns.
  A respins varianta cu gol mare. A respins și „ó" ca marcă separată lângă nume.
- Fotografiile și semnele de pe site sunt **generate și decupate**, nu desenate
  în cod. A spus limpede că ce desenez eu în cod e urât. Fișierele stau în
  `public/images/semne/`.
- Avatarul „DOR" nu e încă ales. Cele 20 de variante sunt în `docs/avatare/`.
- Poza Dorinei e instalată, din `~/Downloads/dorina.jpg`, prin
  `scripts/pune-poza-dorina.mjs`.

---

## Capcane care au costat timp

- **Chrome.** Sunt două Chrome cu extensia Claude. Cel cu contul Dor De
  Franceza e cel conectat mai recent. `list_connected_browsers` nu le
  deosebește; întreabă-l pe care să lucrezi.
- **Editorul SQL din Supabase.** Textul lung se pune cu
  `monaco.editor.getModels()[0].setValue(...)`, iar SQL-ul se aduce cu `fetch`
  din repo-ul public de pe GitHub. Tastarea manuală merge pentru comenzi scurte:
  Monaco nu dublează parantezele.
- **Pagina rămâne cu modificări nesalvate** în editorul SQL și blochează
  navigarea. Deschide alt tab în loc să lupți cu dialogul.
- **Imaginile din containere `hidden lg:block`** se descarcă și pe telefon dacă
  au `loading="eager"`. Cu `lazy` nu se mai descarcă deloc acolo: LCP a scăzut
  de la 3,5 s la 1,8 s.
