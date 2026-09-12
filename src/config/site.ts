/**
 * Datele brandului, intr-un singur loc. Ce e marcat "DE CONFIRMAT" se
 * inlocuieste cu datele reale ale Dorinei inainte de lansare.
 */

/**
 * Cursul folosit ca sa afisam preturile si in lei.
 *
 * HG 947/2000 cere ca pretul catre consumatorul din Romania sa fie afisat in
 * lei. Preturile sunt gandite in euro (asa a decis Artiom), deci leul se
 * calculeaza de aici si se rotunjeste in sus la leu. Cursul se actualizeaza
 * manual cand se misca mai mult de cateva procente; pana atunci textul de sub
 * preturi spune cinstit ca leul e orientativ, la cursul zilei.
 *
 * Sursa: BNR, 11 septembrie 2026.
 */
export const cursEuro = 5.2557

/** Pretul in lei, rotunjit in sus la leu intreg. */
export function inLei(euro: number): number {
  return Math.ceil(euro * cursEuro)
}

export const site = {
  nume: 'DorDeFranceza',
  numeAfisat: 'Dor de Franceză',
  profesoara: 'Dorina',
  slogan: 'Franceza pe care ajungi să o vorbești',
  descriere:
    'Lecții online de franceză pentru adulți din România, cu Dorina. Pentru job, pentru mutare în Franța, pentru BAC sau pur și simplu pentru tine. Lecții de 50 de minute, individuale sau în grup mic.',
  url: 'https://dordefranceza.vercel.app',
  limba: 'ro',
  locale: 'ro_RO',
  fusOrar: 'Europe/Bucharest',

  /* Contactele reale ale Dorinei. Numarul e francez, acelasi cu WHATSAPP_DORINA
     de pe Vercel. Emailul e cutia ei adevarata, aceeasi cu EMAIL_DORINA si cu
     randul din admin_email: o adresa pe domeniu ar arata mai bine, dar cutia
     nu exista, iar send.dordefranceza.com doar trimite, nu primeste. */
  email: 'dordefranceza@gmail.com',
  telefon: '+33 6 62 35 20 71',
  whatsapp: '33662352071',
  /**
   * Retelele. Un sir gol inseamna «contul nu exista inca» si scoate legatura
   * din subsol, fara alte modificari. Instagram se pune la loc scriind aici
   * adresa, in ziua in care contul e facut.
   */
  instagram: '',
  tiktok: 'https://www.tiktok.com/@dordefranceza',

  durataLectie: 50,
  /** Lectia de grup e mai lunga: sunt mai multi oameni si fiecare trebuie sa vorbeasca. */
  durataGrup: 80,
  durataCunoastere: 20,
  moneda: '€',
  preturi: {
    cunoastere: 0,
    /** pretul unei lectii singure, cea mai scumpa cale */
    individual: 40,
    /** o lectie de grup luata singura, ca proba; in pachet scade pana la 20 */
    grup: 25,
  },
  marimeGrup: '3 sau 4 persoane',

  /**
   * Garantia pe prima lecție plătită. DE CONFIRMAT cu Dorina inainte de
   * lansare: e o promisiune comerciala, nu o figura de stil, si intra in
   * termeni. Pe false, sectiunea si mentiunile din pagini dispar singure.
   */
  garantie: {
    activa: true,
    text: 'Dacă după prima lecție plătită simți că nu e pentru tine, îți returnez banii pe acea lecție. Fără explicații și fără discuții.',
  },
} as const

/**
 * Pachetele individuale, de la cea mai scumpa cale la cea mai ieftina.
 *
 * Reducerile de dinainte, 5% si 10%, erau decorative: nimeni nu plateste 190 €
 * inainte ca sa economiseasca 10. Scolile din piata dau intre 10 si 20%, asa ca
 * acolo sunt si astea acum.
 *
 * `intensiv` e produsul care justifica pretul premium: doua luni, trei lectii pe
 * saptamana, un obiectiv cu termen.
 */
export const pachete = [
  {
    id: 'una',
    nume: 'O lecție',
    lectii: 1,
    pretLectie: site.preturi.individual,
    nota: 'Plătești după fiecare lecție. Te oprești când vrei.',
    evidentiat: false,
  },
  {
    id: 'cinci',
    nume: 'Pachet de 5 lecții',
    lectii: 5,
    pretLectie: 36,
    nota: 'Cât să apuci să vezi primele rezultate. Valabil 3 luni.',
    evidentiat: false,
  },
  {
    id: 'zece',
    nume: 'Pachet de 10 lecții',
    lectii: 10,
    pretLectie: 33,
    nota: 'Pentru un obiectiv cu termen: interviu, examen, mutare. Valabil 5 luni.',
    evidentiat: false,
  },
  {
    id: 'intensiv',
    nume: 'Intensiv, 2 luni',
    lectii: 24,
    pretLectie: 31,
    nota: 'Trei lecții pe săptămână, două luni. Ritmul în care se vede saltul de nivel.',
    evidentiat: true,
  },
] as const

/**
 * Grupul, pe trepte, ca si individualul.
 *
 * O grupa are nevoie ca aceiasi oameni sa vina la aceeasi ora saptamani la rand,
 * deci cursul intreg ramane produsul principal si cel mai ieftin pe lectie. Dar
 * intre „cursul de doua luni" si „nimic" era prapastie: ceri 300 € unui om care
 * nu a vazut nicio lectie. De aia exista si o lectie de proba, si doua pachete
 * intre ele.
 *
 * Scaderea, citita de-a lungul randului: 25, 24, 22, 20.
 */
export const grupuri = [
  {
    id: 'proba',
    nume: 'Lecție de probă',
    lectii: 1,
    pretLectie: site.preturi.grup,
    nota: 'Intri o dată într-o grupă, vezi cum e și abia apoi decizi.',
    evidentiat: false,
  },
  {
    id: 'cinci',
    nume: 'Pachet de 5 lecții',
    lectii: 5,
    pretLectie: 24,
    nota: 'Cinci săptămâni. Cât să prinzi ritmul grupei.',
    evidentiat: false,
  },
  {
    id: 'zece',
    nume: 'Pachet de 10 lecții',
    lectii: 10,
    pretLectie: 22,
    nota: 'Aproape tot cursul, dar plătit în doi pași.',
    evidentiat: false,
  },
  {
    id: 'curs',
    nume: 'Curs de 2 luni',
    lectii: 15,
    pretLectie: 20,
    nota: 'Cursul întreg, de la început până la capăt, cu loc rezervat.',
    evidentiat: true,
  },
] as const

/** Cursul intreg, produsul principal al grupei. */
export const cursGrup = {
  ...grupuri[grupuri.length - 1],
  durata: site.durataGrup,
} as const

/**
 * Cat la suta economisesti fata de pretul unei lectii luate singure.
 * `baza` e 40 € la individual si 25 € la grup, de aceea se poate da din afara.
 */
export function reducere(pretLectie: number, baza: number = site.preturi.individual): number {
  return Math.round((1 - pretLectie / baza) * 100)
}

/** Cat te costa cu totul un pachet. */
export function total(lectii: number, pretLectie: number): number {
  return lectii * pretLectie
}

/** Mesajul care se deschide in WhatsApp cand cineva apasa butonul. */
export const mesajWhatsApp = 'Bună, Dorina! Am văzut site-ul DorDeFranceza și aș vrea să aflu mai multe despre lecții.'

export const linkWhatsApp = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(mesajWhatsApp)}`
