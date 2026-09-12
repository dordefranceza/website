import { site, inLei } from './site'

/**
 * Textele site-ului public, toate intr-un loc, ca sa se poata schimba fara
 * sa umbli prin componente. Fara linii de despartire, fara cratime lungi.
 */

export type Nevoie = { icon: string; culoare: 'albastru' | 'verde' | 'portocaliu' | 'roz'; titlu: string; text: string; scop: string }

export const nevoi: Nevoie[] = [
  {
    icon: 'solar:case-round-bold',
    culoare: 'albastru',
    titlu: 'Vreau un job la o firmă franceză',
    text: 'Interviu, CV, emailuri, ședințe. Exersăm exact situațiile din jobul tău, până le stăpânești fără emoții.',
    scop: 'Job la o firmă franceză',
  },
  {
    icon: 'solar:map-point-wave-bold',
    culoare: 'verde',
    titlu: 'Mă mut în Franța, Belgia sau Elveția',
    text: 'Acte, doctor, chirie, școala copiilor, vecini. Franceza de zi cu zi, ca să te descurci singur din prima săptămână.',
    scop: 'Mutare în Franța, Belgia sau Elveția',
  },
  {
    icon: 'solar:diploma-verified-bold',
    culoare: 'portocaliu',
    titlu: 'Am BAC-ul, DELF sau DALF',
    text: 'Structura probei, subiecte din anii trecuți, corectare pe fiecare lucrare. Fără panică în ziua examenului.',
    scop: 'BAC, DELF sau DALF',
  },
  {
    icon: 'solar:sun-2-bold',
    culoare: 'roz',
    titlu: 'Încep de la zero',
    text: 'Nu ai nevoie de nicio bază. Pornim de la pronunție și de la primele fraze utile, în ritmul tău.',
    scop: 'Altceva',
  },
  {
    icon: 'solar:chat-round-dots-bold',
    culoare: 'albastru',
    titlu: 'Înțeleg, dar nu îndrăznesc să vorbesc',
    text: 'Conversație ghidată pe temele care te interesează: călătorii, filme, cultură, oameni. Vorbești din prima lecție.',
    scop: 'Conversație și călătorii',
  },
  {
    icon: 'solar:smile-circle-bold',
    culoare: 'verde',
    titlu: 'Pentru copilul meu',
    text: 'Lecții pentru copii și adolescenți, cu jocuri, povești și note bune la școală ca efect secundar.',
    scop: 'Pentru copilul meu',
  },
]

export const pasi = [
  {
    numar: '01',
    titlu: 'O discuție gratuită, de 20 de minute',
    text: 'Ne cunoaștem pe Zoom. Îți evaluez nivelul, îmi spui ce vrei să obții și până când. Fără nicio obligație.',
  },
  {
    numar: '02',
    titlu: 'Planul tău, pe săptămâni',
    text: 'Primești un plan cu obiective clare: ce vei ști să faci după 4, 8 și 12 lecții. Știi mereu unde ești.',
  },
  {
    numar: '03',
    titlu: 'Lecții de 50 de minute, pe Zoom',
    text: 'Individual sau în grup mic, cu materiale din viața reală și teme scurte. Între lecții, feedback pe WhatsApp.',
  },
]

export const metoda = [
  {
    icon: 'solar:microphone-3-bold',
    titlu: 'Vorbești din prima lecție',
    text: 'Nu așteptăm să știi toată gramatica ca să vorbim. Gramatica vine din vorbit, nu invers.',
  },
  {
    icon: 'solar:document-text-bold',
    titlu: 'Materiale din viața reală',
    text: 'Emailuri, interviuri, formulare, dialoguri de la doctor sau de la bancă. Nu manuale prăfuite.',
  },
  {
    icon: 'solar:calendar-mark-bold',
    titlu: 'Program pe care îl alegi tu',
    text: 'Îți alegi ziua și ora din calendarul Dorinei. Reprogramezi gratuit cu 24 de ore înainte.',
  },
  {
    icon: 'solar:chat-round-check-bold',
    titlu: 'Nu ești singur între lecții',
    text: 'Trimiți un mesaj vocal sau un text pe WhatsApp și primești corectura și încurajarea.',
  },
]

export const planuri = [
  {
    tip: 'cunoastere',
    nume: 'Discuție de cunoaștere',
    pret: 'Gratuit',
    pretSecundar: '',
    detaliu: `${site.durataCunoastere} de minute, pe Zoom`,
    beneficii: ['Îți evaluez nivelul real, nu cel din CV', 'Îmi spui obiectivul și termenul tău', 'Pleci cu un plan, chiar dacă nu continui'],
    buton: 'Programează gratuit',
    evidentiat: false,
  },
  {
    tip: 'individual',
    nume: 'Lecție individuală',
    pret: `${inLei(site.preturi.individual)} lei`,
    pretSecundar: `${site.preturi.individual} ${site.moneda}`,
    detaliu: `pe lecție, ${site.durataLectie} de minute`,
    beneficii: [
      'Plan scris, cu obiective la 4, 8 și 12 lecții',
      'Materiale făcute pe situația ta, incluse',
      'Corectură pe WhatsApp între lecții',
      'Rezumatul lecției pe email, în aceeași zi',
      'Reprogramare gratuită cu 24 de ore înainte',
    ],
    buton: 'Alege individual',
    evidentiat: true, // eticheta spune „Recomandat”, nu „cel mai ales”: nu avem inca date care sa sustina asta
  },
  {
    tip: 'grup',
    nume: 'Lecție în grup mic',
    pret: `${inLei(site.preturi.grup)} lei`,
    pretSecundar: `${site.preturi.grup} ${site.moneda}`,
    detaliu: `pe lecție, ${site.durataLectie} de minute`,
    beneficii: [`${site.marimeGrup} de același nivel`, 'Orar fix, în fiecare săptămână', 'Conversație și exerciții în echipă', 'Materiale incluse'],
    buton: 'Alege grup',
    evidentiat: false,
  },
] as const

export const intrebari = [
  {
    intrebare: 'De ce costă mai mult decât pe o platformă de meditații?',
    raspuns:
      'Pentru că nu cumperi o oră de conversație, ci un drum până la un rezultat: același profesor de fiecare dată, un plan scris cu obiective la 4, 8 și 12 lecții, materiale făcute pe situația ta și corectură pe WhatsApp între lecții. Dacă vrei doar să exersezi vorbitul din când în când, o platformă e alegerea bună și chiar ți-o recomand.',
  },
  {
    intrebare: 'Cum se desfășoară lecțiile?',
    raspuns:
      'Pe Zoom, 50 de minute, cu ecranul partajat. Primești materialele înainte, iar după lecție ai un rezumat scurt și tema, dacă vrei temă.',
  },
  {
    intrebare: 'Ce nivel trebuie să am ca să încep?',
    raspuns:
      'Oricare, de la zero la avansat. La discuția gratuită de cunoaștere îți evaluez nivelul și îți spun sincer de unde pornim și cât durează.',
  },
  {
    intrebare: 'Cât durează până pot vorbi?',
    raspuns:
      'Sincer, nu pot promite un termen: depinde de nivelul de la care pornești, de obiectiv și de cât exersezi între lecții. La discuția de cunoaștere îți spun o estimare pentru situația ta, iar planul are obiective clare la 4, 8 și 12 lecții, ca să vezi singur progresul.',
  },
  {
    intrebare: 'Cum plătesc?',
    raspuns:
      'Prin transfer bancar sau Revolut, după fiecare lecție sau la finalul lunii, cum îți e mai comod. Nu există taxă de înscriere și nici abonament care se reînnoiește singur. Dacă iei un pachet de 5 sau 10 lecții, plătești înainte și primești prețul redus, iar lecțiile pe care nu le faci ți se returnează integral, oricând.',
  },
  {
    intrebare: 'Pot reprograma o lecție?',
    raspuns: 'Da, gratuit, cu cel puțin 24 de ore înainte. Scrii un mesaj pe WhatsApp și alegem altă zi.',
  },
  {
    intrebare: 'Cum funcționează grupul?',
    raspuns:
      'Grupurile au 3 sau 4 persoane de același nivel și un orar fix. După discuția de cunoaștere te pun în grupul potrivit sau, dacă nu există încă, îți spun când se formează.',
  },
  {
    intrebare: 'Pregătiți pentru BAC, DELF sau DALF?',
    raspuns:
      'Da. Lucrăm pe structura exactă a probei, cu subiecte din anii trecuți, simulări cronometrate și corectare pe fiecare lucrare scrisă.',
  },
  {
    intrebare: 'Faceți lecții și pentru copii?',
    raspuns: 'Da, individual, pentru copii și adolescenți. Lecțiile sunt adaptate vârstei, cu jocuri și povești, și ținem legătura cu părinții.',
  },
]

/** Despre Dorina. DE CONFIRMAT cu ea: studii, ani de predare, ce o deosebeste. */
export const despre = {
  titlu: 'Bună, sunt Dorina',
  paragrafe: [
    'Predau franceză online adulților din România care au nevoie de ea pentru ceva concret: un job, o mutare, un examen sau pur și simplu pentru plăcerea de a o vorbi.',
    'Nu cred în lecții în care profesorul vorbește 45 de minute și tu asculți. La mine vorbești tu, greșești liniștit, iar eu te corectez pe loc, cu explicații scurte pe care le ții minte.',
    'Fiecare cursant are un plan al lui. Știi de la început ce vei ști să faci după 4, 8 și 12 lecții, iar între lecții nu ești singur: îmi scrii pe WhatsApp oricând te împiedici de ceva.',
  ],
  puncte: [
    { icon: 'solar:verified-check-bold', text: 'Lecții doar în română și franceză, fără intermediari' },
    { icon: 'solar:users-group-rounded-bold', text: 'Adulți, liceeni și copii' },
    { icon: 'solar:clock-circle-bold', text: 'Lecții de 50 de minute, online' },
    { icon: 'solar:heart-bold', text: 'Corectare blândă, dar sinceră' },
  ],
}

/* ===========================================================================
 *  CE SE ÎNTÂMPLĂ ÎNTR-O LECȚIE
 *  Cel mai frecvent motiv pentru care un adult amână: nu știe cum arată.
 *  Aici i se arată, minut cu minut.
 * ======================================================================== */
export const anatomiaLectiei = [
  {
    cand: 'Primele 5 minute',
    ce: 'Vorbim liber în franceză despre ce ai făcut de la ultima lecție. Nu te corectez încă, doar notez.',
  },
  {
    cand: '20 de minute',
    ce: 'Situația reală din planul tău: un email de trimis, întrebările de la interviu, dialogul de la doctor sau de la bancă.',
  },
  {
    cand: '15 minute',
    ce: 'Exersezi tu. Intervin doar cât să nu rămâi blocat, apoi trecem prin greșelile notate, cu explicații scurte.',
  },
  {
    cand: 'Ultimele 10 minute',
    ce: 'Fixăm ce ai învățat și stabilim ce urmează. În aceeași zi primești pe email rezumatul și tema, dacă vrei temă.',
  },
] as const

/* ===========================================================================
 *  DOVEZI
 *  Rămâne GOL până când Dorina trimite păreri reale, cu acordul scris al
 *  oamenilor. Secțiunea nu se afișează deloc cât timp lista e goală: un site
 *  cu testimoniale inventate se vede și se plătește scump.
 * ======================================================================== */
export type Dovada = {
  /** Prenumele și inițiala sunt de ajuns. Numele complet cere acord separat. */
  nume: string
  context: string
  text: string
}

export const dovezi: Dovada[] = []

/* ===========================================================================
 *  DE CE NU O PLATFORMĂ IEFTINĂ
 *  Obiecția numărul unu la preț. Se răspunde cinstit, fără să vorbim de rău
 *  platformele: ele chiar sunt potrivite pentru alt tip de om.
 * ======================================================================== */
export const comparatie = {
  titlu: 'Se găsesc lecții și la 80 de lei. De ce ai plăti mai mult?',
  intro:
    'Pentru că nu plătești o oră de conversație, ci drumul până la rezultatul tău. Uite diferența, pe față.',
  coloane: ['Pe o platformă cu profesori mulți', 'Cu Dorina'],
  randuri: [
    ['Alt profesor când al tău nu are loc', 'Aceeași persoană, de la prima lecție până la ultima'],
    ['Începi de fiecare dată cu „unde rămăsesem?”', 'Un plan scris, cu obiective la 4, 8 și 12 lecții'],
    ['Lecție de conversație, în general', 'Emailurile, interviul și formularele din situația ta'],
    ['Între lecții ești singur', 'Îmi scrii pe WhatsApp și primești corectura'],
    ['Materiale dintr-un manual', 'Materiale făcute pentru ce ai tu de rezolvat'],
  ],
  concluzie:
    'Dacă vrei doar să exersezi vorbitul din când în când, o platformă e alegerea bună și chiar ți-o recomand. Dacă ai un termen și un obiectiv, ai nevoie de altceva.',
} as const

/* ===========================================================================
 *  PENTRU CINE NU ESTE
 *  Contrar instinctului, asta vinde: arată că nu iei pe oricine și
 *  liniștește omul potrivit că a nimerit unde trebuie.
 * ======================================================================== */
export const nuEstePentru = [
  'Vrei să știi franceză fără să exersezi între lecții. Nu se poate și nu te mint că se poate.',
  'Cauți cel mai ieftin preț pe oră. O să găsești mai ieftin și e în regulă.',
  'Vrei o garanție că iei un nivel până la o dată fixă. Îți pot da un plan realist, nu o promisiune.',
] as const
