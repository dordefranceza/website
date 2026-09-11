/**
 * Datele de identificare ale prestatorului. Legea 365/2002 (comertul
 * electronic) si OUG 34/2014 (drepturile consumatorilor) cer ca ele sa fie
 * afisate pe site, usor de gasit. Tot ce e intre [paranteze] se completeaza
 * cu datele reale INAINTE de lansare; pana atunci Base.astro le semnaleaza.
 */
export const firma = {
  /** Forma juridica sub care se vand lectiile: PFA, II sau SRL. */
  denumire: '[Nume Prenume] PFA',
  cui: '[CUI]',
  registru: '[F../..../....]',
  sediu: '[Strada, nr., localitate, județ]',
  email: 'contact@dordefranceza.ro',
  telefon: '+40 700 000 000',
  /** true dupa ce firma devine platitoare de TVA. Schimba textul de la preturi. */
  platitorTva: false,
  /** Autoritatea de supraveghere a datelor si organismele pentru consumatori. */
  anspdcp: 'https://www.dataprotection.ro',
  anpc: 'https://anpc.ro',
  anpcSal: 'https://anpc.ro/ce-este-sal/',
  sol: 'https://ec.europa.eu/consumers/odr',
} as const

/** true cat timp mai exista un camp necompletat. */
export const firmaIncompleta = Object.values(firma).some((v) => typeof v === 'string' && v.startsWith('['))
