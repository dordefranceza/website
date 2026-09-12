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

## Ce s-a făcut pe 12 septembrie, după-amiaza

**Variabilele de pe Vercel.** Cele 8 goale, de tip Secret, au fost șterse și
puse la loc cu tipul corect, pe Production și Preview:

| Variabilă | Tip | Valoare |
|---|---|---|
| `PUBLIC_SITE_URL` | Config | `https://dordefranceza.vercel.app` |
| `PUBLIC_SUPABASE_URL` | Config | `https://tlssfcovuhonydonuevb.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Config | cheia publishable |
| `EMAIL_DE` | Config | `DorDeFranceza <onboarding@resend.dev>`, temporar |
| `EMAIL_DORINA` | Config | `dordefranceza@gmail.com` |
| `WHATSAPP_DORINA` | Config | `33662352071` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | cheia secret |
| `RESEND_API_KEY` | Secret | cheie nouă, doar Sending access |

Cheile au trecut prin clipboard, nu prin chat. Secretele apar ca două rânduri
în listă, unul pe Production și unul pe Preview: așa le desparte Vercel, nu e
o greșeală.

**Supabase: tabelele erau nevăzute de API.** Asta ținea site-ul mort. La
creare s-a debifat expunerea automată și nimeni nu a expus tabelele manual
după aceea, deci nici cheia de serviciu nu ajungea la ele: `0 of 8 tables
exposed`. Orice slot, orice programare, orice articol dădea 500. Sunt expuse
acum toate 8, din Integrations → Data API → Settings → Exposed tables.
Verificat imediat după: RLS e pornit pe toate 8, cu zero politici, iar cheia
publică întoarce listă goală chiar și pe `admin_email`, care are un rând.
Deci expunerea nu a deschis nimic spre browser.

**`/blog/` dădea 500 doar în producție.** `sanitize-html` e CommonJS și cere
`htmlparser2`, care a trecut la ESM; lăsate pe dinafara pachetului, Node de pe
Vercel crapă cu `ERR_REQUIRE_ESM`. Reparat în `astro.config.mjs` cu
`ssr.noExternal`, commit `836d06a`, urcat pe `main`. Capcana: Vite în
dezvoltare le leagă singur, deci local nu se vede niciodată.

**Autentificare.** Site URL era încă `http://localhost:3000`, deci orice link
din email ar fi dus în gol. Acum e `https://dordefranceza.vercel.app`, cu
`https://dordefranceza.vercel.app/**` și `http://localhost:4360/**` în
Redirect URLs. Invitația a plecat spre `dordefranceza@gmail.com`; userul
există, cu UID `95cfc3cb-e59a-43c2-9350-a3b8023fc89e`, și își pune parola
singur din linkul primit.

**Verificat pe adresa live, fiecare pagină, nu un eșantion:** `/`,
`/programare/`, `/preturi/`, `/despre/`, `/blog/`, `/contact/`,
`/confidentialitate/`, `/termeni/`, `/cookies/`, `/anulare-si-rambursare/`,
`/formular-retragere/`, `/credite/`, `/cabinet/`, `/sitemap-index.xml`,
`/robots.txt`, toate 200, plus o adresă inexistentă care dă 404 cu pagina
proprie. `/api/sloturi` răspunde 200 pe ambele tipuri.

---

## Ce a rămas de făcut, în ordine

### 1. Domeniul: GATA

`dordefranceza.com`, cumparat de Artiom de la Cloudflare pe 12 septembrie, in
contul lui personal (`Ark4su@gmail.com`), nu in contul Dor De Franceza. Zona
DNS e tot acolo.

Ce e legat deja:
- in Vercel: `dordefranceza.com` pe Production, iar `www.dordefranceza.com`
  face **308 permanent** spre el
- in Cloudflare, ambele CNAME catre `f4c9b55950f13456.vercel-dns-017.com`,
  amandoua pe **DNS only**, norisor gri. Nu le trece pe portocaliu: cu proxy
  si SSL „Flexible" intri in bucla de redirectare
- `PUBLIC_SITE_URL` = `https://dordefranceza.com`, urmat de redeploy
- Supabase → Authentication → URL Configuration: Site URL mutat pe domeniul
  nou, iar `https://dordefranceza.com/**` adaugat in Redirect URLs

`robots.txt` nu mai e fisier static: se genereaza din `src/pages/robots.txt.ts`
pe baza lui `PUBLIC_SITE_URL`. Ca fisier static isi ducea cu el domeniul vechi
si trimitea Google spre alt sitemap.

### 2. Resend: GATA, mai putin proba

`send.dordefranceza.com`, regiunea Ireland (eu-west-1), verificat pe 12
septembrie. Inregistrarile DKIM, SPF, MX si DMARC sunt in Cloudflare, toate pe
DNS only. Urmarirea clicurilor si a deschiderilor e **oprita**, ca sa nu
rescrie linkurile din emailuri si ca sa nu contrazica politica de
confidentialitate.

`EMAIL_DE` = `DorDeFranceza <dorina@send.dordefranceza.com>`.

**Atentie:** adresa asta doar trimite, nu primeste. Daca un cursant da Reply,
mesajul nu ajunge nicaieri. Cand se lamureste ce adresa reala foloseste Dorina,
pune-o pe `reply_to` la emailurile catre cursanti, sau activeaza receiving in
Resend cu inregistrarea MX `inbound-smtp.eu-west-1.amazonaws.com` pe `send`.

### 3. Orarul Dorinei

Tabelul `disponibilitate` e gol, deci `/api/sloturi` întoarce zile goale și
formularul de programare nu arată nicio oră liberă. Dorina își pune orarul din
cabinet, la Disponibilitate. Până atunci nimeni nu poate rezerva.

### 4. Datele reale, în cod

- `src/config/firma.ts`: tot ce e în `[paranteze]` e necompletat. Fără ele,
  paginile legale sunt incomplete. În dezvoltare apare un avertisment portocaliu
  cât timp lipsesc.
- `src/config/site.ts`: email, telefon, WhatsApp, Instagram, TikTok sunt
  substituenți.
- `src/config/continut.ts`: bucățile marcate DE CONFIRMAT despre Dorina.

### 5. O programare de probă

De făcut după ce domeniul e verificat în Resend, ca să se vadă că emailul
pleacă și către cursant, nu doar către Dorina. Emailurile de test nu se trimit
fără acordul lui Artiom.

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
