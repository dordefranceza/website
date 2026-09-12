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

### Două capcane

**Pata portocalie.** Dacă în prompt scrii „one small coral orange detail" pe
bluză, modelul o desenează ca pe o pată de mâncare. Scoate-o din prompt. La
pozele deja făcute am curățat-o în post, nu am regenerat: costă zero.

**Contur crem pe fundal închis nu merge.** Am încercat o variantă pentru cardul
albastru, cu contur crem și haine bleumarin. Arată a pată, nu a desen, iar
Artiom a respins-o pe loc. Fișierul e șters. Pe fundal închis, personajul se
pune **într-un cerc crem**, ca cercurile cu poze din antet.

## Decuparea pe transparent

Nu prin scoaterea unei culori: bluza e crem exact ca fundalul și s-ar găuri.
Se face prin **inundare din margini**: pornești din cele patru laturi și
transparentizezi doar pixelii de fundal legați de margine. Ce e închis de
conturul albastru rămâne. Codul e simplu, cu `sharp`, în istoricul sesiunii.

Apoi se taie marginile goale, se redimensionează la 640px înălțime și se
salvează webp cu `alphaQuality: 100`.

## Ce există acum și unde

| Fișier în `public/images/personaj/` | Unde apare |
|---|---|
| `cu-biscuite.webp` | bannerul de cookie-uri, stânga, tăiată de marginea cardului |
| `cauta.webp` | pagina de 404, în locul rândunicii |
| `scrie.webp` | blogul gol, lângă „primele articole sunt pe drum" |
| `saluta.webp` | `/confirma/` după Confirm, și în cercul crem de pe cardul albastru din apelul final |
| `telefon.webp` | contact, în golul de sub cele trei carduri, doar de la 1024px |

## Regula pe care Artiom a acceptat-o

**Nu în secțiunile paginii de start.** Fiecare are deja semnul ei mic: ușa,
podul, sămânța, fereastra, balconul. Două desene în același loc se bat cap în
cap. Personajul intră doar unde pagina e altfel goală sau unde e o gaură reală
de spațiu.

## Ce a cerut Artiom pentru mai departe

1. **Personajul în cercuri colorate**, ca cercurile cu fotografii din antet.
   Prima aplicare e făcută, pe cardul albastru. Ideea îi place și vrea mai
   mult în direcția asta: cercul e rama personajului.
2. Mai multe poziții și expresii, generate la nevoie, din același caiet.
3. Un biscuite desenat separat există deja, cinci variante, în istoricul
   sesiunii. Artiom a ales să folosim personajul cu biscuitele în mână, nu
   biscuitele singur, dar dacă vrea vreodată semnul singur, varianta 5 era
   preferata lui: cu mușcătură și firimituri.

## Ce NU e legat de personaj și a rămas de făcut

- Datele reale din `src/config/site.ts`: telefonul e încă `+40 700 000 000`,
  emailul `contact@dordefranceza.ro`, pe `.ro` deși site-ul e pe `.com`.
  Instagram și TikTok duc spre conturi care poate nu există.
- `src/config/firma.ts`: tot ce e în paranteze drepte e necompletat, iar
  paginile legale rămân incomplete până se completează.
- Orarul Dorinei: tabelul `disponibilitate` e gol, deci formularul de
  programare nu arată nicio oră liberă.
- Parola Dorinei și verificarea în doi pași: linkul a plecat pe
  `dordefranceza@gmail.com`, restul e la ea.

Restul stării proiectului e în `docs/PREDARE.md`.
