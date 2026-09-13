/**
 * Paginile pe intentie: cate una pentru fiecare lucru pe care il vrea omul.
 *
 * De ce exista. Nimeni nu cauta „DorDeFranceza", numele are cateva zile. Omul
 * cauta problema lui: „cum invat franceza de la zero", „DELF B2 cat dureaza",
 * „profesor de franceza pentru copii". Site-ul avea numai pagini despre noi,
 * deci il gasea doar cine il stia deja.
 *
 * **O pagina per intentie, nu per fraza.** Google intelege sinonimele: „cursuri
 * franceza" si „vreau sa invat franceza" sunt acelasi om. O pagina pentru
 * fiecare formulare ar da douazeci de pagini care se aseamana intre ele, adica
 * exact ce Google numeste doorway pages si penalizeaza. Aici sunt cinci, atatea
 * cate nevoi cu adevarat diferite exista.
 *
 * **Nu sunt ascunse.** Intra in meniul de sus, in subsol si in pagina de start.
 * O pagina la care nu duce niciun link e o pagina in care Google nu are
 * incredere, iar una facuta doar pentru cautari, ascunsa de oameni, e chiar
 * definitia unei doorway page.
 *
 * Textul din `paragrafe` si `rezultate` e al Dorinei, luat din `pentruCe`. Nu
 * se rescrie cu alte cuvinte ca sa para continut nou: ar fi acelasi lucru spus
 * mai prost. Ce se adauga aici e partea pe care omul o cauta si pe care pagina
 * `/pentru-ce/` nu o are: intrebarile concrete, cu raspunsuri concrete.
 */
import { pentruCe } from './pagini'
import { site } from './site'

const caz = (scop: string) => pentruCe.cazuri.find((c) => c.scop === scop)!

export type Intentie = {
  /** adresa, fara bara de la inceput si de la sfarsit */
  slug: string
  /** ce scrie in meniu si in subsol */
  meniu: string
  titlu: string
  /** pentru <title>, sub 60 de caractere cu tot cu numele site-ului */
  titluPagina: string
  /** sub 160 de caractere: atat arata Google */
  descriere: string
  eticheta: string
  intro: string
  figura: 'saluta' | 'scrie' | 'arata' | 'incurajeaza' | 'prezinta' | 'cauta' | 'ganditoare' | 'bucura'
  inel: 'roz' | 'verde' | 'portocaliu' | 'albastru'
  /** se pune in adresa formularului, ca sa vina deja ales */
  scop: string
  paragrafe: readonly string[]
  rezultate: readonly string[]
  intrebari: readonly { intrebare: string; raspuns: string }[]
}

export const intentii: Intentie[] = [
  {
    slug: 'franceza-pentru-incepatori',
    meniu: 'Franceza de la zero',
    titlu: 'Franceză pentru începători, de la zero',
    titluPagina: 'Franceză de la zero pentru începători · DorDeFranceza',
    descriere:
      'Cum înveți franceza de la zero, în română, cu Dorina. Prima discuție e gratuită. Vorbești din prima lecție, nu după șase luni.',
    eticheta: 'De la zero',
    intro:
      'Nu ai nevoie de nicio bază, de nicio amintire din școală și de niciun manual cumpărat dinainte. Începem de unde ești, adică de la început, și vorbești din prima lecție.',
    figura: 'saluta',
    inel: 'roz',
    scop: 'Altceva',
    paragrafe: caz('Altceva').paragrafe,
    rezultate: caz('Altceva').rezultate,
    intrebari: [
      {
        intrebare: 'Cât durează până vorbesc franceza de la zero?',
        raspuns:
          'Până la nivelul A2, adică să te descurci singur în situații obișnuite, sunt în jur de 180 până la 200 de ore de lucru. La două lecții pe săptămână înseamnă aproape doi ani; la trei, un an și ceva. Pentru B1, care e nivelul la care conversația chiar merge, socotește 350 până la 400 de ore. Cifrele astea nu sunt inventate de mine, sunt măsurate pe vorbitori de limbi romanice, iar româna te ajută mai mult decât crezi.',
      },
      {
        intrebare: 'E greu franceza pentru un vorbitor de română?',
        raspuns:
          'Mai ușor decât pentru aproape oricine altcineva. Sunt amândouă limbi romanice, deci recunoști câteva mii de cuvinte fără să le fi învățat vreodată, iar structuri care pe un vorbitor de engleză îl chinuie luni întregi ție ți se par normale. Partea grea e pronunția, fiindcă franceza se scrie altfel decât se aude. De asta începem cu ea.',
      },
      {
        intrebare: 'Ce îmi trebuie ca să încep?',
        raspuns:
          'Un calculator sau un telefon, căști și internet. Atât. Materialele le primești de la mine, nu cumperi niciun manual. Linkul lecției vine pe email și intri dintr-un clic, fără cont și fără să instalezi ceva.',
      },
      {
        intrebare: 'Pot să încep dacă nu am timp de temă?',
        raspuns:
          'Da. Tema e opțională și se potrivește pe cât timp ai, nu invers. Cine face zece minute pe zi înaintează mai repede decât cine face două ore sâmbăta, dar și fără temă tot mergi înainte, doar mai încet.',
      },
    ],
  },
  {
    slug: 'pregatire-examene',
    meniu: 'BAC, DELF și DALF',
    titlu: 'Pregătire pentru BAC, DELF și DALF',
    titluPagina: 'Pregătire DELF, DALF și BAC la franceză · DorDeFranceza',
    descriere:
      'Pregătire pentru DELF, DALF și BAC-ul la franceză: structura probei, subiecte din anii trecuți, lucrări corectate cu explicații.',
    eticheta: 'Examene',
    intro:
      'La examene, jumătate din notă se pierde din necunoașterea probei, nu a limbii. Oameni care vorbesc bine iau note mici fiindcă nu știu cum se punctează.',
    figura: 'scrie',
    inel: 'portocaliu',
    scop: 'BAC, DELF sau DALF',
    paragrafe: caz('BAC, DELF sau DALF').paragrafe,
    rezultate: caz('BAC, DELF sau DALF').rezultate,
    intrebari: [
      {
        intrebare: 'Ce nivel de DELF îmi trebuie?',
        raspuns:
          'Depinde pentru ce. Pentru studii în Franța, universitățile cer de obicei B2. Pentru cetățenie franceză, B1. Pentru multe joburi, B1 sau B2. A2 e suficient pentru unele acte de ședere. Dacă nu știi ce ți se cere, adu-mi cerința scrisă la discuția gratuită și îți spun exact ce nivel și cât ar dura.',
      },
      {
        intrebare: 'Cât durează pregătirea pentru DELF B2?',
        raspuns:
          'Dacă ești deja la B1 solid, în jur de trei până la patru luni cu două lecții pe săptămână, plus lucrul tău între ele. Dacă nu ești sigur unde stai, primele douăzeci de minute sunt gratuite și îți spun sincer de unde pornim. Nu te pregătesc de B2 dacă ești la A2, ar fi bani aruncați.',
      },
      {
        intrebare: 'Ce diferență e între DELF și DALF?',
        raspuns:
          'DELF acoperă nivelurile A1 până la B2, DALF acoperă C1 și C2. Sunt diplome ale statului francez, nu expiră niciodată și se recunosc peste tot. Pentru BAC-ul din România e altceva: acolo conteaza programa școlară, nu cadrul european, și pregătirea se face pe subiectele de bacalaureat.',
      },
      {
        intrebare: 'Lucrăm pe subiecte reale?',
        raspuns:
          'Da, pe subiecte din anii trecuți, în condiții de examen, cu ceasul pornit. Fiecare lucrare scrisă se întoarce corectată, cu explicații pe fiecare greșeală, nu doar cu o notă. De obicei sunt trei sau patru greșeli pe care le repeți, și dacă le rezolvi pe alea, nota urcă simțitor.',
      },
    ],
  },
  {
    slug: 'franceza-pentru-munca',
    meniu: 'Pentru muncă și mutare',
    titlu: 'Franceză pentru muncă și pentru mutare',
    titluPagina: 'Franceză pentru job și mutare în Franța · DorDeFranceza',
    descriere:
      'Franceză pentru interviu, pentru jobul la o firmă franceză și pentru primele luni după mutarea în Franța, Belgia sau Elveția.',
    eticheta: 'Muncă și mutare',
    intro:
      'Aici termenul e mereu clar: ai un interviu sau ai o dată de plecare. Asta ajută, fiindcă știm exact cât timp avem și ce trebuie să intre în el.',
    figura: 'arata',
    inel: 'verde',
    scop: 'Job la o firmă franceză',
    paragrafe: [...caz('Job la o firmă franceză').paragrafe, ...caz('Mutare în Franța, Belgia sau Elveția').paragrafe],
    rezultate: [...caz('Job la o firmă franceză').rezultate, ...caz('Mutare în Franța, Belgia sau Elveția').rezultate],
    intrebari: [
      {
        intrebare: 'Ce nivel de franceză îmi trebuie pentru un job în Franța?',
        raspuns:
          'Pentru cele mai multe posturi, B1 te face angajabil și B2 te face comod. Sub A2 e greu, oricât de bun ai fi în meseria ta. Dacă ai deja un anunț la care aplici, trimite-mi-l și îți spun ce nivel cere de fapt, fiindcă ce scrie în anunț și ce se cere la interviu nu sunt mereu același lucru.',
      },
      {
        intrebare: 'Mă pregătești pentru un interviu anume?',
        raspuns:
          'Da, și e felul în care lucrez cel mai des. Îmi trimiți anunțul și lucrăm pe el: ce te vor întreba, cum îți povestești experiența fără să sune tocit, cum ceri o lămurire când nu ai înțeles, ce spui despre salariu. Facem interviul de câteva ori, până nu mai e prima dată.',
      },
      {
        intrebare: 'Mă mut peste trei luni. Ajunge?',
        raspuns:
          'Pentru gramatică, nu. Pentru a te descurca singur în prima lună, da, dacă lucrăm pe situații, nu pe lecții de manual: contul la bancă, contractul de chirie, medicul de familie, înscrierea copiilor la școală, primăria. Fiecare are vocabularul ei și o formulă de politețe pe care dacă nu o știi ești tratat altfel.',
      },
      {
        intrebare: 'Lucrezi și cu Belgia sau Elveția?',
        raspuns:
          'Da. Limba e aceeași, dar actele, instituțiile și câteva cuvinte diferă, iar noi lucrăm pe cele din țara unde te duci tu, nu pe cele din Franța la general. La cifre, de exemplu, belgienii și elvețienii spun altfel decât francezii, și asta contează la telefon.',
      },
    ],
  },
  {
    slug: 'franceza-pentru-copii',
    meniu: 'Pentru copii',
    titlu: 'Franceză pentru copii și adolescenți',
    titluPagina: 'Franceză online pentru copii și adolescenți · DorDeFranceza',
    descriere:
      'Lecții de franceză online pentru copii și adolescenți, explicate în română. Cu jocuri la cei mici, cu ce le place deja la adolescenți.',
    eticheta: 'Copii',
    intro:
      'Copiii au nevoie de altceva decât adulții: de un motiv să vină, nu de un plan pe săptămâni. Dacă lecția e plictisitoare, nimic din ce urmează nu mai contează.',
    figura: 'incurajeaza',
    inel: 'verde',
    scop: 'Pentru copilul meu',
    paragrafe: caz('Pentru copilul meu').paragrafe,
    rezultate: caz('Pentru copilul meu').rezultate,
    intrebari: [
      {
        intrebare: 'De la ce vârstă?',
        raspuns:
          'De pe la șapte ani, când cititul e deja așezat. Sub vârsta asta lecția online e greu de ținut, copilul obosește în douăzeci de minute și nu e vina lui. Cu adolescenții nu e nicio limită de sus.',
      },
      {
        intrebare: 'Cât durează o lecție pentru un copil?',
        raspuns:
          `Tot ${site.durataLectie} de minute, dar altfel împărțite: la cei mici alternăm mai des, ca să nu obosească. Dacă văd că nu ține atenția, îți spun și scurtăm. Nu are rost să plătești pentru un sfert de oră în care copilul se uită pe geam.`,
      },
      {
        intrebare: 'Aflu ce a lucrat copilul meu?',
        raspuns:
          'Da. După fiecare lecție primești un rând, două, despre ce am lucrat și cum a mers. Fără note de la mine și fără presiune în plus, are destulă la școală.',
      },
      {
        intrebare: 'Îi crește nota la școală?',
        raspuns:
          'De obicei da, dar ca efect, nu ca scop. Un copil care înțelege ce se întâmplă la oră nu mai are de ce să ia note mici. Dacă vii doar pentru notă, pot lucra și direct pe programa lui, dar rezultatul ține mai puțin.',
      },
    ],
  },
  {
    slug: 'cursuri-franceza-chisinau',
    meniu: 'Din Chișinău și Moldova',
    titlu: 'Cursuri de franceză din Chișinău, online',
    titluPagina: 'Cursuri de franceză online din Chișinău · DorDeFranceza',
    descriere:
      'Lecții de franceză online pentru cei din Chișinău și din toată Moldova, explicate în română. Prima discuție de 20 de minute e gratuită.',
    eticheta: 'Chișinău și Moldova',
    intro:
      'Lecțiile sunt online, deci nu contează în ce parte a orașului stai și nu pierzi o oră prin trafic. Contează doar să ai internet și un sfert de oră liniște.',
    figura: 'prezinta',
    inel: 'albastru',
    scop: 'Altceva',
    paragrafe: [
      'Nu trebuie să vii nicăieri. Lecția se ține pe Google Meet, intri dintr-un link primit pe email, fără cont și fără să instalezi nimic. Din Chișinău, din Bălți, dintr-un sat sau din străinătate, e același lucru.',
      'Orele sunt scrise în ora României, care e aceeași cu ora Moldovei tot anul, deci nu ai de făcut niciun calcul. Calendarul de pe site arată exact orele libere, iar tu alegi ce îți convine, inclusiv seara după program.',
      'Plata se face prin transfer sau prin Revolut, în euro. Nu ai de mers nicăieri și nu ai de dat bani înainte pe mai multe luni: la lecția singură plătești lecția, la pachet plătești pachetul la început, atât.',
    ],
    rezultate: [
      'Alegi ora din calendar, inclusiv seara, fără să te deplasezi',
      'Vorbești cu cineva care îți explică în română ce nu înțelegi',
      'Nu pierzi timp pe drum, deci lecția te costă doar cât ține',
    ],
    intrebari: [
      {
        intrebare: 'Lecțiile sunt cu adevărat online?',
        raspuns:
          'Da, toate. Nu există sală și nu ai unde să vii. Pentru cineva din Chișinău asta înseamnă că nu pierzi o oră pe drum dus-întors, iar pentru cineva dintr-un sat înseamnă că are acces la același profesor ca cineva din centru.',
      },
      {
        intrebare: 'La ce oră se pot ține lecțiile?',
        raspuns:
          'Orele libere le vezi în calendar și se schimbă de la o săptămână la alta. Sunt și ore de seară, pentru cine lucrează. Ora scrisă pe site e ora României, care coincide cu ora Moldovei tot anul, deci nu ai nimic de socotit.',
      },
      {
        intrebare: 'Cum plătesc din Moldova?',
        raspuns:
          'Prin transfer bancar sau prin Revolut, în euro. Plata se face înainte de lecție, iar ora rămâne rezervată după confirmarea plății. La pachete și la cursul în grup, plata se face la începutul lor.',
      },
      {
        intrebare: 'Pot să încerc înainte să plătesc?',
        raspuns:
          `Da. Prima discuție, de ${site.durataCunoastere} de minute, e gratuită și nu te obligă la nimic. Vorbim despre ce vrei să obții, îți evaluez nivelul și îți spun sincer de unde pornim și cât ar dura.`,
      },
    ],
  },
]
