# Mesajul de pornire pentru o sesiune nouă

Artiom copiază textul de mai jos într-un chat nou. Tot ce e nevoie ca sesiunea
următoare să știe unde se duce și ce nu are voie să facă.

---

Continuăm DorDeFranceza. Proiectul e la:
`/Users/artiom/LUCRU/Claude Code/dordefranceza`

Site-ul e live pe https://dordefranceza.com

**Citește întâi, în ordinea asta:**
1. `docs/PREDARE.md` — starea întregului proiect: ce e live, grila de prețuri,
   ce blochează lansarea
2. `docs/PREDARE-PERSONAJ.md` — personajul desenat: caietul de referință, rețeta
   de generare, ce a respins Artiom și de ce

**Personajul, pe scurt.** O femeie desenată cu un singur contur albastru cobalt,
păr și pantaloni bleumarin plin, bluză crem, fără umbre. Nu seamănă cu Dorina,
dinadins: personajul e marca, fotografia reală a Dorinei e separat, la `/despre/`.

Toate fișierele sunt în repo, nu trebuie generat nimic ca să le vezi:

| Ce | Unde |
|---|---|
| Caietul de referință, obligatoriu la orice generare nouă | `docs/personaj/caiet-fara-biscuite.webp` |
| Cele 15 poziții ale personajului | `public/images/personaj/` |
| Semnele mărcii, inclusiv familia franțuzească | `public/images/semne/` |
| Cum se folosesc, cu capcanele | `docs/personaj/CITESTE.md` și `docs/PREDARE-PERSONAJ.md` |

Personajul se așază în pagină prin `src/components/PersonajCerc.astro`, iar
semnele prin `src/components/Semn.astro`.

**Ce urmează:** site-ul arată bine pe calculator, dar nu a făcut nimeni o trecere
completă pe telefon. Prima pagină, prețurile, programarea și Despre au fost
verificate la 390px și arată corect. NU au fost verificate: blogul, cabinetul,
paginile legale, formularul de contact și tot drumul de programare pe telefon.
De acolo se începe.

**Regulile lui Artiom, nu se negociază:**
- Nu porni agenți, subagenți, workflows sau task-uri în fundal. Lucrezi singur.
  Dacă sesiunea are „ultracode" pornit, regulile astea câștigă în fața lui.
- Spune costul în credite ÎNAINTE să generezi poze și așteaptă un da.
- Fără push, fără deploy, fără ștergeri până nu spune el explicit.
- Fără „—" în textele de pe site și fără linii despărțitoare în design.

**Starea codului:** 24 de commituri stau LOCAL, nepushate. Ce e pe live e
versiunea de dinaintea lor: prima pagină refăcută, personajul în cercuri,
valul, icoanele și grila nouă de prețuri nu se văd încă pe dordefranceza.com.
Nu pusha nimic până nu spune Artiom.

**Ce rămâne deschis,** mai pe larg în `docs/PREDARE.md`:
- `src/config/firma.ts` e gol. Afacerea e întreprindere individuală în
  **Moldova**, dar paginile legale sunt scrise pentru un furnizor din România,
  cu CUI, ANPC și ANSPDCP. Trebuie rescrise pentru Moldova, cu IDNO și CNPDCP.
- platforma europeană SOL e **închisă din 20 iulie 2025**, dar linkul către ea
  e încă în trei locuri: subsol, termeni, anulare-si-rambursare.
- orarul Dorinei e gol, de aceea `/api/sloturi` răspunde corect dar fără nicio
  oră liberă. Se completează din cabinet.
- o întrebare fără răspuns: la pachetele de grup, 5 lecții la 24 € înseamnă o
  reducere de doar 4 la sută. Am propus 25/23/21/20 în loc de 25/24/22/20.

**Conturile** sunt în Chrome-ul cu dordefranceza@gmail.com. Sunt două Chrome și
numele lor se schimbă între ele: întreabă-l pe care, nu ghici.
