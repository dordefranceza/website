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

## Design, runda a treia, 12 septembrie seara

Patru lucruri cerute de Artiom după ce a văzut site-ul pe live.

**Sigla.** Vârful de jos al accentului stătea pixel lângă pixel cu marginea lui
D. Acum sunt șase pixeli între ele, în fișierul de 566x70. Accentul s-a mutat pe
pixeli, nu s-a redesenat: masca lui se ia din `nume.webp`, unde e singurul lucru
albastru, și aceeași mască mută și `nume-alb.png`, varianta din emailuri.
Se reajustează cu `node scripts/muta-accent-sigla.mjs <pixeli>`.

**Iconița de WhatsApp.** Era o bulină de chat generică din Solar. Acum e logoul
adevărat, `src/icons/whatsapp.svg`, luat automat de astro-icon din `src/icons`.
Fără pachet nou: Solar nu are sigle de marcă, iar un set întreg de logo-uri
pentru un singur semn ar fi fost o dependință în plus. Are `currentColor`, deci
își ia culoarea din clasa de lângă el.

**Antetul, fără nicio fotografie.** Cele trei poze generate păreau false, fiindcă
erau. Vezi `docs/PREDARE-PERSONAJ.md` pentru ce a luat locul lor și pentru
variantele dintre care a ales.

**Valul se mișcă.** `src/components/Val.astro`: trei valuri suprapuse, perioade
care nu se împart una la alta, două spre stânga și unul spre dreapta. Bucla se
închide exact, verificat punând animația la început și la sfârșit și comparând
pixel cu pixel. Respectă `prefers-reduced-motion`.

**Rămân nefolosite șase poze** în `public/images/`: `antet-paris.webp`,
`antet-cafenea.webp`, `antet-birou.webp`, `dorina-320.webp`, `dorina-480.webp`,
`dorina-800.webp`. Cu totul 216 KB. Nu s-au șters, așteaptă cuvântul lui Artiom.
`dorina-portret.webp` rămâne folosită, la Despre.

## Iconițele site-ului, 12 septembrie seara

Marca din iconiță e litera **D** cu accentul din siglă și Turnul Eiffel în golul
literei. Litera și accentul nu sunt redesenate: se decupează din `nume.webp`,
deci sunt exact literele siglei.

Se refac toate dintr-o comandă:

```bash
node scripts/fa-iconitele.mjs
```

Scrie `favicon.ico` (16, 32, 48), `favicon.png` (96), `apple-touch-icon.png`
(180) și `icoana-512.png`.

**Două capcane, ambele verificate pe live pe 12 septembrie.**

1. `/favicon.ico` întorcea **pagina proprie de 404, în HTML, 84 KB**, cu tip
   `text/html`. Crawlerele cer întâi adresa aia. Un fișier real pe disc rezolvă:
   fișierele statice câștigă în fața rutelor.
2. Google nu ia neapărat iconița din `rel="icon"`. Citește și `apple-touch-icon`
   și o preferă adesea pe cea mai mare pe care o găsește, deci se schimbă TOATE
   fișierele, nu unul.

**Ce i s-a spus lui Artiom și a decis altfel.** La 16 pixeli, turnul mănâncă
golul din D, iar golul ăla e ce face un D să se citească drept D. I-am arătat
varianta simplă, fără turn, și una cu turn mic. A ales turnul mare, știind.
Dacă se răzgândește, se schimbă un singur număr în script.

După ce ajunge pe live, Google își reîmprospătează iconița din rezultate în
ritmul lui, de la zile la săptămâni. Merită cerută reindexarea paginii de start
din Search Console.

## Grila de prețuri, 12 septembrie seara

Refăcută după o discuție de strategie. Prețurile stau **numai** în
`src/config/site.ts`, nicăieri altundeva.

| Individual | Pe lecție | Total |
|---|---|---|
| O lecție, 50 min | 40 € | 40 € |
| Pachet 5 | 36 € | 180 € |
| Pachet 10 | 33 € | 330 € |
| Intensiv, 2 luni, 24 lecții | 31 € | 744 € |

| În grup, lecții de 80 min | Pe lecție | Total |
|---|---|---|
| Lecție de probă | 25 € | 25 € |
| Pachet 5 | 24 € | 120 € |
| Pachet 10 | 22 € | 220 € |
| Curs de 2 luni, 15 lecții | 20 € | 300 € |

**De ce grupul are lecții de 80 de minute:** sunt mai mulți oameni și fiecare
trebuie să apuce să vorbească. Durata intră direct în calculul orelor libere;
`sloturi.ts` o folosește și la lungimea slotului, și la verificarea
suprapunerilor, deci nu a fost nevoie de nimic în plus.

**Cifra care vinde:** 20 € pentru 80 de minute înseamnă 15 € pe oră, exact media
platformelor ieftine cu care ne comparăm în secțiunea de alături.

**Piața, cercetată pe 12 septembrie:** platformele de meditații din România au
media 80 lei pe oră; Institutul Francez cere 37 lei pe oră la grup; Ibsen,
școală premium din București, 160 lei pe oră individual. Dorina la 40 € pentru
50 de minute înseamnă 253 lei pe oră, adică 1,6 ori peste cel mai scump
concurent comparabil.

**Ce NU există:** evidența pachetelor. Nu e niciun tabel și niciun câmp pe
programare. Site-ul arată prețuri, iar numărătoarea lecțiilor rămâne între
Dorina și cursant, ca și plata, care se face manual prin transfer. Pachetul ales
pe pagina de prețuri intră scris în mesajul care ajunge la ea, atât. Artiom a
decis conștient să lăsăm așa până după lansare.

## Formularele: cine trece și cine nu

Refăcut pe 12 septembrie, la cererea lui Artiom: „să nu fie un gmail aiurea pus
care poate să-l pună oricare".

Adresa de email trece prin `src/server/posta.ts`, nu printr-un regex:

1. sintaxa strânsă (lungimile din RFC 5321, fără puncte lipite sau la capete);
2. 73 de domenii de unică folosință;
3. **întrebăm DNS-ul dacă domeniul chiar primește poștă.** Asta taie și
   `gmail.con`, și domeniile inventate pe loc. Fără MX încercăm și adresa A,
   cum cere RFC 5321, altfel am tăia domenii mici dar adevărate;
4. greșelile de tastat la furnizorii mari întorc o sugestie cu buton, nu un
   refuz: „ai vrut gmail.com?".

**Dacă DNS-ul nu răspunde, adresa trece.** Un mesaj pierdut de la un om
adevărat costă mai mult decât un spam primit.

**Capcană de ținut minte:** unele filtre DNS nu spun „nu există", ci răspund cu
o adresă a lor din intervalele private. Pe mașina lui Artiom, un domeniu
inventat întoarce `100.127.132.229`. De aceea adresele din 10/8, 100.64/10,
127/8, 169.254/16, 172.16/12 și 192.168/16 nu se numără ca „domeniul există".

Roboții au trei capcane: câmpul invizibil (scos din ecran, nu `display:none`,
fiindcă pe ăla îl sar), formularul trimis sub 2,5 secunde, și mesajele cu două
linkuri sau vocabular de reclamă. Un singur link trece. **Robotul prins
primește „gata, am primit"**: dacă i-am spune adevărul, ar încerca altă formă
până trece. A doua frână e pe adresa de email, nu doar pe IP.

Nu e nici Turnstile, nici reCAPTCHA, dinadins: amândouă sunt scripturi de la
terți, iar politica de cookie-uri promite că site-ul nu cheamă pe nimeni fără
acord.

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

### 3. Verificarea în doi pași

Ecranul de înrolare există acum în cabinet, la Setări, sub Contul: cod QR de
scanat cu Google Authenticator, casetă pentru codul de șase cifre și buton de
scos aplicația când se schimbă telefonul. În Supabase, TOTP e pornit, iar
serverul cerea deja `aal2` de la conturile care au un factor confirmat.

Capcana de ținut minte: ștergerea aplicației de pe telefon NU scoate factorul
de pe server. Dacă rămâne acolo, intrarea cere în continuare un cod pe care
nu-l mai are nimeni. Se scoate din Setări, cât timp mai ești logat, sau din
Supabase, de la utilizator.

Nu a fost încercat pe viu: cere o intrare în cabinet, deci întâi trebuie pusă
parola din invitație.

### 4. Google Analytics, cu consimțământ

Cont `DorDeFranceza` pe `dordefranceza@gmail.com`, proprietate
`dordefranceza.com`, fus România, monedă euro. Condițiile acceptate cu țara pe
**România**, deci înțelegerea e cu Google Ireland, nu cu Google LLC. Toate cele
patru opțiuni de partajare a datelor cu Google sunt **debifate**.

Cod de măsurare: `G-ZD3K7S0VPR`, pus pe Vercel ca `PUBLIC_GA_ID`, tip Config.

Regula din cod, în `src/components/Consimtamant.astro`: până când vizitatorul
nu apasă „Sunt de acord", nu se încarcă nimic de la Google. Alegerea stă în
localStorage, nu într-un cookie. Se schimbă dintr-un buton pus în politica de
cookie-uri, care cheamă `window.ddfCookie.redeschide()`.

Fără `PUBLIC_GA_ID`, componenta nu scoate nimic în pagină: ștergi variabila și
site-ul se întoarce la starea fără urmărire, fără alte modificări.

Verificat pe domeniul live, toate trei căile: fără alegere nu există nici
script, nici dataLayer; după „Sunt de acord" apare scriptul cu codul corect;
după „Nu, mulțumesc" nu se încarcă nimic.

Politica de cookie-uri e rescrisă din temelii, iar cea de confidențialitate
spune ce se trimite, cui, pe ce temei și cum se retrage acordul.

### 5. Orarul Dorinei

Tabelul `disponibilitate` e gol, deci `/api/sloturi` întoarce zile goale și
formularul de programare nu arată nicio oră liberă. Dorina își pune orarul din
cabinet, la Disponibilitate. Până atunci nimeni nu poate rezerva.

### 6. Datele reale, în cod

**`src/config/site.ts`: gata, pe 12 septembrie seara.**

| Câmp | Valoare |
|---|---|
| `telefon` | `+33 6 62 35 20 71`, numărul real al Dorinei, francez |
| `whatsapp` | `33662352071`, același cu `WHATSAPP_DORINA` de pe Vercel |
| `email` | `dordefranceza@gmail.com` |
| `instagram` | gol, contul nu există încă |
| `tiktok` | `@dordefranceza`, confirmat de Artiom că există |

Numărul substituent `+40 700 000 000` trimitea toți vizitatorii într-un WhatsApp
inexistent, din antet, din bara de jos de pe telefon, din subsol, de pe cardul
albastru, de pe contact și de pe programare. Toate trec prin `linkWhatsApp` din
`site.ts`, deci s-au reparat dintr-un singur rând.

Emailul: `contact@dordefranceza.com` ar arăta mai bine, dar cutia nu există, iar
`send.dordefranceza.com` doar trimite. Până se face o cutie reală pe domeniu,
adresa de pe site e gmailul, ca să nu se piardă mesaje. Artiom a ales asta știind
compromisul.

Instagram: un șir gol scoate singur legătura din subsol, fără altă modificare.
Când se face contul, se scrie adresa acolo și reapare.

**`src/config/firma.ts`: ÎNCĂ NECOMPLETAT, și e mai mult decât patru câmpuri.**

Pe 12 septembrie Artiom a spus că activitatea e de **antreprenor individual în
Moldova**, nu în România. Asta strică presupunerea pe care sunt scrise paginile
legale acum, care sunt scrise pentru un prestator român:

- `cui` și `registru` nu există în Moldova: acolo e **IDNO** de 13 cifre și
  Registrul de stat ținut de Agenția Servicii Publice;
- autoritatea pentru date nu e ANSPDCP, ci **Centrul Național pentru Protecția
  Datelor cu Caracter Personal** din Chișinău. Atenție: fiindcă site-ul se
  adresează cursanților din România, GDPR se aplică oricum (art. 3 alin. 2), iar
  un cursant din România se poate plânge tot la ANSPDCP;
- ANPC și SAL sunt pentru comercianți din România. Dreptul de retragere în 14
  zile rămâne, fiindcă legea consumatorului din țara cumpărătorului se aplică,
  dar formularea „acești termeni sunt guvernați de legea română" trebuie
  recitită de cineva care știe, nu rescrisă din ureche;
- separat de povestea cu Moldova, și valabil oricum: platforma europeană **SOL**
  este ÎNCHISĂ. Verificat pe 12 septembrie 2026, cerând chiar adresa din cod:
  `https://ec.europa.eu/consumers/odr` redirectează spre
  `consumer-redress.ec.europa.eu/site-relocation_en`, unde Comisia scrie negru
  pe alb că platforma e închisă. Legătura apare în trei locuri: subsolul
  fiecărei pagini, pagina de termeni și pagina de anulare. Trebuie scoasă sau
  înlocuită, indiferent în ce țară e înregistrată firma.

Nimic din toate astea nu s-a atins. Nu se completează din presupuneri: e nevoie
de denumirea exactă, IDNO și adresa sediului, plus o decizie despre paginile
legale.

`src/config/continut.ts`: bucățile marcate DE CONFIRMAT despre Dorina.

### 7. O programare de probă

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
