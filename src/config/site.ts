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

  /* DE CONFIRMAT: contactele reale */
  email: 'contact@dordefranceza.ro',
  telefon: '+40 700 000 000',
  whatsapp: '40700000000',
  instagram: 'https://www.instagram.com/dordefranceza',
  tiktok: 'https://www.tiktok.com/@dordefranceza',

  durataLectie: 50,
  durataCunoastere: 20,
  moneda: '€',
  preturi: {
    cunoastere: 0,
    individual: 40,
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
 * Pachetele. Reducerile sunt modelate dupa ce fac scolile de limbi din
 * Romania (Ibsen: 5% la 10 sedinte, 10% la 20), ca oferta sa fie citita ca
 * normala, nu ca improvizatie.
 */
export const pachete = [
  {
    id: 'una',
    nume: 'Lecție de lecție',
    lectii: 1,
    pretLectie: site.preturi.individual,
    reducere: 0,
    nota: 'Plătești după fiecare lecție. Te oprești când vrei.',
  },
  {
    id: 'cinci',
    nume: 'Pachet de 5 lecții',
    lectii: 5,
    pretLectie: 38,
    reducere: 5,
    nota: 'Cât să apuci să vezi primele rezultate. Valabil 3 luni.',
  },
  {
    id: 'zece',
    nume: 'Pachet de 10 lecții',
    lectii: 10,
    pretLectie: 36,
    reducere: 10,
    nota: 'Pentru un obiectiv cu termen: interviu, examen, mutare. Valabil 5 luni.',
  },
] as const

/** Mesajul care se deschide in WhatsApp cand cineva apasa butonul. */
export const mesajWhatsApp = 'Bună, Dorina! Am văzut site-ul DorDeFranceza și aș vrea să aflu mai multe despre lecții.'

export const linkWhatsApp = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(mesajWhatsApp)}`
