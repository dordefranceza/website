# De verificat mâine, în ordinea asta

Scris în noaptea de 12 spre 13 septembrie 2026, după verificarea de pe live.
Bifează pe rând. Dacă ceva nu merge, scrie-mi ce anume și pe ce ecran.

## 1. Orarul, întâi de toate (5 minute)

Fără el, site-ul e închis: nimeni nu poate programa nimic.

1. Intră pe `dordefranceza.com/admin/` și apasă **Orar**.
2. Apasă pe o zi din calendar, apasă butonul albastru **Adaugă interval**,
   pune orele în care Dorina chiar poate, apasă **Salvează ziua**.
3. Dacă orele se repetă în fiecare săptămână, apasă „Repetă în fiecare ...".
4. Deschide `dordefranceza.com/programare/` pe telefon și vezi dacă apar chiar
   orele alea. Ar trebui să apară imediat.

**Atenție:** orele din următoarele 12 ore nu apar dinadins, ca să nu vină cineva
peste zece minute. Se schimbă la Setări.

## 2. Linkul sălii (1 minut)

La **Setări**, câmpul „Linkul sălii tale, Zoom sau Google Meet". E gol acum, iar
până îl pui, fiecare cursant primește „linkul vine pe email înainte de lecție",
și în calendarul lui nu scrie unde să intre. Pe Tablou ai un rând portocaliu
care te duce direct acolo.

## 3. Programarea, cap la cap (5 minute)

1. De pe telefon, `dordefranceza.com/programare/`, alege discuția gratuită,
   o zi, o oră, completează cu adresa ta și trimite.
2. Uită-te în Gmailul tău: trebuie să vină „Confirmare: ..." cu butonul verde
   **Pune în calendar** și cu fișierul `lectie.ics` atașat.
3. Apasă butonul verde pe telefon: lecția trebuie să intre în calendar, cu
   amintire cu 30 de minute înainte.
4. Uită-te în Gmailul Dorinei: trebuie să vină „Programare nouă: ...".
5. În cabinet, la **Programări**, lecția trebuie să fie la „Noi".
6. Șterge proba: deschide lecția, pune-o pe **Anulată**.

## 4. Propunerea și confirmarea (5 minute)

Asta era stricată până azi-noapte, deci merită probată.

1. **Programări**, butonul **Propune o lecție**. Alege tipul, ziua, ora, scrie
   adresa ta, alege una din propozițiile gata scrise, trimite.
2. În Gmail îți vine „Bine ai venit!". Apasă **Vezi și răspunde**, apoi
   **Confirm, ne vedem atunci**.
3. Trebuie să vezi „Mulțumim, ...! Te-am trecut în calendar", cu fața noastră.
4. În cabinet, lecția trece de la „Așteaptă răspuns" la „Viitoare, confirmate".
5. Mai fă o propunere și apasă de data asta **Nu pot atunci**: în Gmailul
   Dorinei trebuie să vină „... nu poate la ...", cu buton de propus altă oră.

## 5. Grupele (5 minute)

1. **Grupe**, **Grupă nouă**: nume, nivel, ziua, ora, prima lecție, câte lecții,
   câte locuri, prețul pe lecție. Creează.
2. **Adaugă cursant**, cu adresa ta.
3. În Gmail îți vine un singur email cu toată seria și cu un fișier de calendar
   care conține toate lecțiile. Deschide-l pe telefon: intră toate deodată.
4. În **Calendar**, zilele grupei trebuie să fie albastre, cu ora pe ele.
5. Șterge grupa ca să nu rămână de probă.

## 6. Bifarea lecțiilor trecute

Când o lecție trece de ora ei cu un ceas, apare la **De bifat**, cu „A avut loc"
și „Nu a avut loc". Bifează-le, altfel nu se știe ce s-a făcut și ce bani mai ai
de luat.

## 7. Pachetele

Pe fișa unui cursant, apeși cât a cumpărat: 5 lecții, 10, sau intensivul de 24.
Pe cardul lui scrie apoi câte lecții plătite mai are, iar lecțiile acoperite nu
mai apar la „de încasat".

---

# Ce am verificat eu, în noaptea asta

- Toate cele 17 pagini publice răspund 200, iar o adresă inventată dă 404.
- Niciuna nu mai iese din ecran pe telefon (măsurat la 375 de pixeli).
  Articolul de blog ieșea cu 11 pixeli, din cauza tabelului. Reparat.
- Fără erori în consolă pe pagina de start și pe cea de programare.
- Programare adevărată făcută pe site: emailurile au ajuns în amândouă cutiile,
  cu personajul, cu butoanele și cu fișierul de calendar. Gmail recunoaște
  fișierul și arată singur cartonașul cu ora. Proba a fost ștearsă din bază.
- Confirmarea din email, care era complet stricată, merge acum și pe live.

# Ce rămâne de făcut

1. **Legarea contului Google** al Dorinei: lecțiile ar intra singure în
   calendarul ei, fără nicio apăsare, și s-ar genera link de Meet pentru
   fiecare lecție. E o zi de lucru și cere clicuri în Google Cloud.
2. **Poza de profil în Gmail**, în loc de cercul cu „D": cere certificat BIMI
   plătit, în jur de 1000 până la 1500 de euro pe an, plus marcă înregistrată.
   Nu e o setare.
3. **DMARC** e pe `p=none`. Trecut pe `quarantine` ajută la livrare. E o
   schimbare în DNS-ul de la Cloudflare, o fac doar la cererea ta.
4. **Datele firmei** din `src/config/firma.ts` sunt goale, deci identificatorii
   nu apar nicăieri pe site. De completat când e deschisă firma.
5. **Paginile legale** sunt scrise pe legislație românească, dar activitatea e
   în Moldova. De hotărât și de rescris.
6. **Statistici mai mari**, după ce se strâng date reale: câți cumpără după
   proba gratuită, pe ce lună, ce aduce cursanți.
