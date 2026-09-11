/**
 * Datele brandului, intr-un singur loc. Ce e marcat "DE CONFIRMAT" se
 * inlocuieste cu datele reale ale Dorinei inainte de lansare.
 */
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
  moneda: '€',
  preturi: {
    cunoastere: 0,
    individual: 40,
    grup: 25,
  },
  marimeGrup: '3 sau 4 persoane',
} as const

/** Mesajul care se deschide in WhatsApp cand cineva apasa butonul. */
export const mesajWhatsApp = 'Bună, Dorina! Am văzut site-ul DorDeFranceza și aș vrea să aflu mai multe despre lecții.'

export const linkWhatsApp = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(mesajWhatsApp)}`
