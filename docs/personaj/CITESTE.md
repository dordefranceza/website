# Personajul DorDeFranceza

O femeie desenată în limbajul semnelor de pe site: un singur contur albastru
cobalt tras cu carioca, păr și pantaloni bloc plin bleumarin, bluză crem,
fără umbre și fără degradeuri.

**Nu seamănă cu Dorina, dinadins.** Fotografia ei reală e deja pe site.
Personajul e marca, nu profesoara.

## Fișierele

- `caiet-fara-biscuite.webp` — **caietul de referință**. Patru vederi ale
  aceleiași fete: față, trei sferturi, profil, spate. Mâinile goale.
  Ăsta se dă ca imagine de referință la FIECARE generare nouă, altfel la a
  treia poză iese altă femeie.
- `caiet-cu-biscuite.webp` — prima variantă, cu biscuitele în mână. Păstrată
  fiindcă din ea a fost decupată silueta din banner.

## Cum se generează o poză nouă

Higgsfield, `seedream_v5_pro`, 3 credite pe imagine, cu caietul curat trecut
la `medias` cu rolul `image_references`. În prompt se descrie doar ce se
schimbă (poziția, ce ține în mână), și se repetă că e același personaj, cu
aceeași față, același păr și aceleași haine.

## Unde apare pe site

| Poza | Locul |
|---|---|
| `cu-biscuite` | bannerul de cookie-uri, in stanga, taiata de marginea cardului |
| `cauta` | pagina de 404, in locul randunicii |
| `scrie` | blogul gol, langa textul „primele articole sunt pe drum" |
| `saluta` | `/confirma/`, dupa ce cursantul apasa Confirm |
| `telefon` | contact, in golul de sub cele trei carduri, doar de la 1024px |
| `invita` | apelul final de pe pagina de start, pe cardul albastru |
| `citeste` | sus pe `/cookies/`, langa titlu: citeste regulile, cu biscuitele in cealalta mana |

`invita` e singura cu contur crem si haine bleumarin: cea obisnuita are contur
albastru si ar disparea pe cardul albastru.

**Regula asta a cazut.** Scria aici ca personajul nu se pune in sectiunile
paginii de start. Artiom a cerut exact pe dos in aceeasi seara: „cand dai
scroll sa apara iarasi un personaj la locul potrivit, cu mimica potrivita,
langa butoane sa arate catre buton". Acum sunt opt aparitii pe pagina de start.
Semnele mici au ramas toate; nu se bat cap in cap fiindca personajul sta in
cerc, la alta scara.

Decupajul se face prin inundare din margini, nu prin scoaterea unei culori:
bluza e crem ca fundalul si s-ar gauri.

Generat pe 12 septembrie 2026. Prima încercare a ieșit bună la amândouă
caietele, deci 6 credite în total.

Pe 12 septembrie, seara, încă 6 credite pentru `citeste`: două variante ale
aceleiași idei, biscuite într-o mână și foaia cu reguli în cealaltă. Amândouă
au ieșit bune din prima; Artiom a ales-o pe cea care citește foaia. Compozițiile
cu două obiecte diferite, câte unul în fiecare mână, sunt cele mai riscante:
merită generate în două variante, nu una.

## Unde stau, pe scurt, toate fisierele

Sectiunea asta e scrisa ca sa poata fi trimisa unui chat nou, fara explicatii.

| Ce | Unde |
|---|---|
| Caietul de referinta, obligatoriu la fiecare generare | `docs/personaj/caiet-fara-biscuite.webp` |
| Pozele folosite pe site si in cabinet | `public/images/personaj/*.webp` |
| Pozele folosite in emailuri, 240x240, cerc crem pe navy | `public/images/email/*.png` |
| Aceleasi poze scrise in cod, ca sa calatoreasca in email | `src/server/figuri.ts` |
| Componenta care le incadreaza in cerc, pe site | `src/components/PersonajCerc.astro` |
| Aceeasi, pentru cabinet | `src/cabinet/PersonajCerc.tsx` |

Numele spun pozitia: `saluta`, `scrie`, `cauta`, `telefon`, `arata`, `prezinta`,
`incurajeaza`, `inima`, `asezata`, `ganditoare`, `citeste`, `cu-biscuite`,
`bienvenue-sus`, `bienvenue-lateral`, `se-uita-jos-a`, `se-uita-jos-b`.

## Doua tabele de completat la fiecare poza noua

In amandoua componentele PersonajCerc stau `RAPORT`, latimea impartita la
inaltime pentru fiecare fisier, si `DEPLASARE`, cat se muta pe orizontala ca sa
vina CAPUL in mijlocul cercului, nu cutia desenului. Fara a doua, pozitiile cu un
brat intins par strambe desi matematic nu sunt. **O poza noua trebuie adaugata in
amandoua tabelele, in amandoua fisierele.**

## In emailuri poza NU se ia de pe site

Calatoreste inauntrul mesajului, legata prin `content_id`. Altfel Gmail de pe
telefon nu o arata pana nu apesi butonul de afisare a imaginilor, si cursantul
care primeste primul email de la noi vede un gol. De aceea exista `figuri.ts`:

    node scripts/fa-poze-email.mjs      face PNG-urile din webp-urile de pe site
    node scripts/fa-figuri-email.mjs    scrie figuri.ts din PNG-uri

Cele patru folosite acum in emailuri: `saluta`, `scrie`, `telefon`, `incurajeaza`.
