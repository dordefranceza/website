# Predare: personajul și partea de design

Scrisă pe 12 septembrie 2026, la finalul sesiunii. Cine continuă citește doar
fișierul ăsta și poate genera poze noi fără să întrebe nimic.

---

## Ce e personajul

O femeie desenată în limbajul semnelor de pe site: un singur contur albastru
cobalt tras cu carioca, ușor tremurat, păr și pantaloni bloc plin bleumarin,
bluză crem, fără umbre și fără degradeuri.

**Nu seamănă cu Dorina, dinadins.** Fotografia ei reală e deja pe site, la
`/despre/` și în antet. Personajul e marca, nu profesoara. Nu-l apropia de
chipul ei.

## Caietul de referință, fără el nu se generează nimic

`docs/personaj/caiet-fara-biscuite.webp` — patru vederi ale aceleiași femei:
față, trei sferturi, profil, spate, cu mâinile goale.

**Ăsta se dă ca imagine de referință la FIECARE generare nouă.** Fără el, la a
treia poză iese altă femeie, cu altă față. Caietul cu biscuite,
`caiet-cu-biscuite.webp`, a rămas doar fiindcă din el s-a decupat silueta din
bannerul de cookie-uri.

## Rețeta de generare, testată

Unealta: Higgsfield MCP, `generate_image`.
Model: **`seedream_v5_pro`**, `resolution: "2k"`, `use_unlim: false`.
**3 credite pe imagine.** Pe `seedream_v5_lite` e 1 credit, dar ține mai prost
consecvența chipului.

Referința se trece așa, cu `job_id`-ul unei generări anterioare sau cu un
`media_id`:

```json
"medias": [{ "value": "<job_id-ul caietului>", "role": "image_references" }]
```

Job-ul caietului curat, din 12 septembrie: `4cf2bc10-bda5-488d-9111-14515f20f212`.

**Dacă job-ul ăla nu mai merge** (sesiune nouă, altă zi), nu te chinui să urci
fișierul de pe disc. Repo-ul e public, deci caietul are o adresă web directă:

```
https://raw.githubusercontent.com/dordefranceza/website/main/docs/personaj/caiet-fara-biscuite.webp
```

Se trece prin `media_import_url`, care întoarce un `media_id`, iar `media_id`-ul
ăla se pune la `medias[].value`. Verificat pe 12 septembrie: răspunde 200,
`image/webp`, 2040x1152.

Același lucru pentru caietul cu biscuite, dacă va fi vreodată nevoie: aceeași
adresă, cu `caiet-cu-biscuite.webp` la capăt.

Forma promptului care a mers de cinci ori din cinci:

> Single full-body illustration of the same original female character from the
> reference sheet. Identical face, identical shoulder-length dark navy hair,
> identical cream long-sleeve top, identical wide dark navy trousers and flat
> shoes, identical cobalt blue hand-drawn outline, identical flat colour fills
> with no shading and no gradients. **Pose: [ce face, într-o propoziție]**.
> Full body head to toe, centred, on a flat warm cream background with generous
> empty margin around her, even flat lighting, no cast shadow, no floor line.
> Clean modern brand illustration, crisp hand-drawn linework. No text, no
> letters, no numbers, no watermark, no logos, no frame borders. Single subject
> only, exactly one person, no other people, no background objects, no
> furniture, no 3D render, not photorealistic, not anime.

`aspect_ratio: "2:3"` pentru o siluetă întreagă.

### Fața trebuie descrisă, altfel iese alta

La prima `bucura` din 13 septembrie, modelul a desenat gura **deschisă**, cu
interior, și ochiul stâng cu o buclă în plus, sprânceana coborâtă până se
lipea de el. Artiom a văzut-o pe loc: „cu un ochi iese un pic altfel, pare
străin". Avea dreptate, și nu se vedea decât mărind fața.

Caietul de referință ține hainele, părul și conturul, dar **nu ține fața**.
Aia trebuie scrisă în prompt, pe bucăți:

> two small solid round dots for the eyes, both exactly the same size and
> shape, perfectly symmetric, clearly separated from the eyebrows; two short
> thin curved eyebrows, symmetric, not touching the eyes; one tiny curved line
> for the nose; the mouth is a single simple closed curved smile line, mouth
> closed, no open mouth, no teeth, no mouth interior

Cu propozițiile astea a ieșit din prima. Costul greșelii: 3 credite aruncate.
**Uită-te la față mărită înainte să pui poza în site**, decupajul o micșorează
și ascunde exact genul ăsta de greșeală.

### Două capcane

**Pata portocalie.** Dacă în prompt scrii „one small coral orange detail" pe
bluză, modelul o desenează ca pe o pată de mâncare. Scoate-o din prompt. La
pozele deja făcute am curățat-o în post, nu am regenerat: costă zero.

**Contur crem pe fundal închis nu merge.** Am încercat o variantă pentru cardul
albastru, cu contur crem și haine bleumarin. Arată a pată, nu a desen, iar
Artiom a respins-o pe loc. Fișierul e șters. Pe fundal închis, personajul se
pune **într-un cerc crem**, ca cercurile cu poze din antet.

## Cercul, componenta `PersonajCerc.astro`

Inel colorat plus disc deschis, exact limbajul cercurilor cu fotografii din
antet. Proporțiile vin de pe cardul albastru, singurul loc aprobat înainte:
figura are `1,11 × diametru` înălțime și stă la `0,038 × diametru` de sus, deci
iese toată silueta, cu picioarele tăiate de marginea de jos.

```astro
<PersonajCerc nume="arata" inel="portocaliu" disc="crem" marime={132} />
```

Pe fundal crem discul e `alb`, pe fundal închis e `crem`. Pe albastru nu se pune
niciodată direct, conturul cobalt dispare.

**Centrarea se face pe CAP, nu pe cutia figurii.** Artiom a spus despre un cerc
că „fetei nu-i în mijloc", deși matematic figura era centrată. Avea dreptate:
la pozițiile cu un braț întins, cutia se lungește într-o parte, deci mijlocul
cutiei nu mai e mijlocul omului, iar ochiul caută capul. În componentă e un
tabel `DEPLASARE` cu cât se mută fiecare poziție, ca fracțiune din lățimea
fișierului. Cel mai mult se mută `prezinta`, cu 19,6%, și `bienvenue-lateral`.
La `bienvenue-sus` deplasarea e zero dinadins: acolo sus e placarda, nu capul,
iar placarda e chiar ce trebuie să stea în mijloc.

Numerele se recalculează așa: centrul părții de sus a figurii, primele 14% din
înălțime, minus centrul cutiei, împărțit la lățime.

**Două capcane, ambele plătite deja:**

1. Învelișul are nevoie de `width: fit-content`. Fără el e un bloc cât toată
   lățimea, iar `rounded-full` face o pastilă lungă, nu un cerc.
2. Culorile se iau dintr-un tabel cu șiruri scrise întregi (`roz: 'bg-roz'`).
   Tailwind citește fișierul sursă, deci `bg-${culoare}` nu generează niciodată
   regula și cercul rămâne fără fundal.

La `marime`, un raport bun: 130 lângă un buton, 170-190 într-o coloană goală,
200 singur pe pagină.

## Familia de semne frantuzesti

Generata pe 12 septembrie 2026, seara, la cererea lui Artiom: „ceva cu tematica,
poate ceva Franta, bagheta, de ce nu, poate Turnul Eiffel, ceva cultura
franceza". Opt semne, doua planse, 6 credite cu totul.

| Semn | Ce e |
|---|---|
| `eiffel` | Turnul Eiffel, doar contur |
| `bagheta` | bagheta, cu accentul portocaliu |
| `cafea` | ceasca de espresso pe farfurioara |
| `felinar` | felinar parizian |
| `bicicleta` | bicicleta cu cos |
| `acordeon` | acordeon |
| `croasant` | croasant |
| `carte` | carte deschisa |

**Cum s-au facut, ca sa iasa in acelasi stil.** Nu s-au descris cuvintele
stilului, ci s-au dat ca referinta chiar doua semne existente, `barcuta.webp` si
`randunica.webp`, luate prin adresa lor de pe GitHub, fiindca repo-ul e public.
Asa familia noua nu arata lipita de altundeva.

**Decuparea unei planse e un script:**

```bash
node scripts/decupa-plansa.mjs plansa.png 260 eiffel bagheta cafea felinar
```

Numele se dau in ordinea citirii: stanga-sus, dreapta-sus, stanga-jos,
dreapta-jos.

**Capcana din el, platita deja.** Prima incercare taia dupa bucati legate intre
ele si a gasit 15 semne intr-o plansa de 4. Motivul: acordeonul e desenat din
foaie si foaie, cartea din pagini, ceasca si farfurioara sunt doua piese
separate. Acum grupeaza dupa sfertul de plansa in care cade fiecare bucata, si
semnul e reuniunea lor.

**Cremul din interiorul semnelor** vine din generare si e 250,243,229, fata de
cremul site-ului care e 248,243,235. Diferenta de sase unitati pe albastru nu se
vede cu ochiul: verificat punand semnele exact pe cremul paginii. Pe alb,
umplutura calda arata intentionata, ca la semnele vechi.

## Decuparea pe transparent

Nu prin scoaterea unei culori: bluza e crem exact ca fundalul și s-ar găuri.
Se face prin **inundare din margini**: pornești din cele patru laturi și
transparentizezi doar pixelii de fundal legați de margine. Ce e închis de
conturul albastru rămâne. Codul e simplu, cu `sharp`, în istoricul sesiunii.

Apoi se taie marginile goale, se redimensionează la 640px înălțime și se
salvează webp cu `alphaQuality: 100`.

Nu se mai scrie de mână, e un script:

```bash
node scripts/decupa-personaj.mjs /cale/catre/poza.png numele-nou
```

Rezultatul ajunge direct în `public/images/personaj/numele-nou.webp`. Verifică
după aceea că bluza și pantofii nu s-au găurit: pune poza pe un fundal magenta
și uită-te.

## Ce există acum și unde

| Fișier în `public/images/personaj/` | Unde apare |
|---|---|
| `cu-biscuite.webp` | bannerul de cookie-uri, stânga, tăiată de marginea cardului |
| `cauta.webp` | pagina de 404, în cerc portocaliu |
| `scrie.webp` | blogul gol, în cerc roz; și pe pagina de start, la „Cum arată o lecție", în cerc albastru |
| `saluta.webp` | `/confirma/` după Confirm, în cerc verde deschis, și în cercul crem de pe cardul albastru din apelul final |
| `telefon.webp` | contact, în cerc verde; și pe pagina de start, la „Întrebări frecvente", tot verde |
| `arata.webp` | pagina de start, lângă butonul albastru de la „Cum decurge", în cerc portocaliu |
| `prezinta.webp` | pagina de start, la „Pentru ce ai nevoie de franceză", în cerc roz |
| `incurajeaza.webp` | pagina de start, pe cardul negru „De ce merge", cerc roz cu disc crem |
| `inima.webp` | pagina de start și `/preturi/`, lângă garanția de bani înapoi, cerc verde |
| `se-uita-jos-a.webp` | pagina de start și `/preturi/`, deasupra titlului de la prețuri, cerc portocaliu. A luat locul semnului cu sămânța, care nu spunea nimic despre preț |
| `bienvenue-sus.webp` | antetul paginii de start, in stanga, pe un disc albastru pal. Tine placarda cu ambele maini deasupra capului |
| `bienvenue-lateral.webp` | NEFOLOSIT. Aceeasi idee, cu placarda ridicata intr-o mana. Generata in aceeasi runda, pastrata ca rezerva |
| `se-uita-jos-b.webp` | NEFOLOSIT. Varianta cealaltă, stă dreaptă și arată cu degetul în jos. Generată în aceeași rundă și păstrată ca să nu se mai plătească 3 credite dacă Artiom se răzgândește |

Cele patru de jos sunt generate pe 12 septembrie 2026, seara, cu `media_id`-ul
caietului `9bb61939-5e5a-436b-bcf3-1b971d40d1fc` (importat din adresa de pe
GitHub). Au ieșit bune toate patru din prima, 12 credite cu totul.

`arata.webp` și `prezinta.webp` arată spre **stânga privitorului**, fiindcă în
prompt e mâna ei dreaptă. Deci figura stă în dreapta lucrului spre care arată.
Pentru cealaltă direcție există `oglindit` pe componentă, nu se mai generează.

## Regula veche a căzut

Până pe 12 septembrie, la prânz, regula era „nu în secțiunile paginii de start",
fiindcă fiecare are deja semnul ei mic: ușa, podul, sămânța, fereastra,
balconul.

**Seara, Artiom a cerut exact pe dos:** când dai scroll să apară din loc în loc
un personaj, la locul potrivit, cu mimica potrivită, iar lângă butoane să arate
spre buton. Asta e acum regula.

Sunt **opt apariții** pe pagina de start, cam una la două secțiuni, în ordinea
în care le vezi la scroll:

1. prezintă cu palma, la „Pentru ce ai nevoie de franceză", cerc roz
2. arată cu degetul spre butonul albastru, la „Cum decurge", cerc portocaliu
3. scrie rezumatul, la „Cum arată o lecție", cerc albastru
4. degetul mare ridicat, pe cardul negru „De ce merge", cerc roz pe disc crem
5. se apleacă și se uită în jos, deasupra titlului de la prețuri, cerc portocaliu
6. mâna pe inimă, lângă garanția de bani înapoi, cerc verde
7. telefonul în mână, la „Întrebări frecvente", cerc verde
8. salută, pe cardul albastru de la final, în discul crem de dinainte

Ultima e singura care nu trece prin `PersonajCerc`: e scrisă de mână în
`Apel.astro`, fiindcă iese pe jumătate din marginea cardului, iar un cerc
obișnuit ar tăia-o altfel. Pe pagina de start caută `personaj-cerc` în sursă și
numeri șapte, nu opt, exact din motivul ăsta.

Semnele mici au rămas toate. Nu se bat cap în cap fiindcă personajul stă în
cerc, la altă scară, și nu în locul semnului.

## Cuvântul din poză: cum s-a făcut și ce să verifici

Pe 12 septembrie, seara, Artiom a cerut ca personajul să țină o placardă pe care
scrie „Bienvenue", generată cu tot cu text.

**I-am spus dinainte că e riscant** și tot riscant rămâne: modelele strică des
literele, mai ales cuvintele franțuzești. De data asta au ieșit corect toate
trei încercările, dar asta e noroc, nu regulă.

**Nu publica niciodată un cuvânt generat fără să-l mărești și să-l citești
literă cu literă.** Mie mi s-a părut prima dată că ultima literă e F în loc de
E: era tot E, doar că tăietura mea îi ascundea bara de jos. Deci nici panica
grăbită nu ajută, se verifică pe imaginea întreagă, mărită.

Alternativa fără risc, dacă va fi nevoie de alt cuvânt: se generează placarda
**goală** și cuvântul se pune peste, ca text adevărat, cu fontul site-ului.
Artiom a ales varianta cu text generat știind compromisul.

Decuparea pentru antet se face la rezoluție mai mare, fiindcă figura se afișează
la 560px înălțime, nu la 190:

```bash
node scripts/decupa-personaj.mjs poza.png bienvenue-sus 1300
```

**În antet intră acum, și fără cerc.** Tot pe 12 septembrie, seara, Artiom a
spus că fotografiile generate din antet par false. Au ieșit toate trei, iar în
locul lor stau două figuri mari, libere, nu în cercuri: cea care salută în
stânga, oglindită ca mâna ridicată să cadă spre text, și cea care prezintă în
dreapta. Sub ele, cuvântul „Bienvenue" la 6% opacitate, cu fontul serif al
site-ului.

A ales varianta asta dintre trei pe care le-a văzut construite: una cu Dorina
într-o formă moale plus o figură, una hibridă cu Dorina și „Bienvenue", și asta,
fără nicio fotografie. A luat-o pe ultima.

**Apoi a mai schimbat o dată, în aceeași seară.** A cerut o pagină complet
goală: o singură figură mare, cu placarda „Bienvenue", un buton, și nimic
altceva, nici titlu. Am construit-o exact așa și a respins-o el însuși: „pare
săracă". Avea dreptate. Golul ține doar când ce rămâne e mare și așezat cu
curaj; o figură singură pe un câmp alb se citește ca pagină neterminată.

**Forma finală:** figura cu placarda în stânga, pe un disc albastru pal, iar în
dreapta un titlu scurt, o propoziție și un buton. Au rămas afară pastila „Prima
discuție e gratuită", lista de trei puncte și al doilea buton, cel de WhatsApp.

Capcană din construcția asta: discul pal are nevoie de `-z-10`. Fără el acoperea
butonul, fiindcă un element poziționat pictează peste unul nepoziționat, oricare
ar fi ordinea în cod.

Aceeași curățenie s-a făcut și pe `/programare/`, unde aceeași poză cu biroul
stătea în cercul portocaliu din antet. Acolo e acum figura care prezintă, pe o
rondea crem.

**Unde tot nu intră:**

- la „Despre Dorina", unde e fotografia ei adevărată. Personajul nu e Dorina;
- pe telefon, în cercurile din secțiuni. Toate cercurile noi sunt
  `hidden lg:block` sau `xl:block`: acolo coloanele se așază una sub alta și nu
  mai există niciun gol de umplut. În antet, pe telefon, rămâne o singură
  figură, cea care salută.

## Ce a rămas pentru mai departe

1. Mai multe poziții, generate la nevoie, din același caiet. Trei credite bucata
   și niciodată fără să întrebi întâi.
2. Un biscuite desenat separat există deja, cinci variante, în istoricul
   sesiunii din 12 septembrie. Artiom a ales să folosim personajul cu biscuitele
   în mână, nu biscuitele singur, dar dacă vrea vreodată semnul singur, varianta
   5 era preferata lui: cu mușcătură și firimituri.
3. Neverificat cu ochii: cercul de pe blogul gol. În depozitul local există un
   articol de probă, deci starea goală nu se vede pe `npm run dev`. Codul e
   același ca pe celelalte patru pagini, unde s-a văzut că merge.

## Ce NU e legat de personaj și a rămas de făcut

- ~~Datele reale din `src/config/site.ts`~~. Făcute pe 12 septembrie, seara:
  telefon `+33 6 62 35 20 71`, email `dordefranceza@gmail.com`, Instagram scos
  până există contul, TikTok păstrat.
- `src/config/firma.ts`: tot ce e în paranteze drepte e necompletat, iar
  paginile legale rămân incomplete până se completează.
- Orarul Dorinei: tabelul `disponibilitate` e gol, deci formularul de
  programare nu arată nicio oră liberă.
- Parola Dorinei și verificarea în doi pași: linkul a plecat pe
  `dordefranceza@gmail.com`, restul e la ea.

Restul stării proiectului e în `docs/PREDARE.md`.
