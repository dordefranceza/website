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
  email: 'dordefranceza@gmail.com',
  telefon: '+33 6 62 35 20 71',
  /** true dupa ce firma devine platitoare de TVA. Schimba textul de la preturi. */
  platitorTva: false,
  /** Autoritatea de supraveghere a datelor si organismele pentru consumatori. */
  anspdcp: 'https://www.dataprotection.ro',
  anpc: 'https://anpc.ro',
  anpcSal: 'https://anpc.ro/ce-este-sal/',
  /*
   * Aici era platforma europeana SOL (ODR), `ec.europa.eu/consumers/odr`.
   * **S-a inchis pe 20 iulie 2025**, prin Regulamentul (UE) 2024/3228: adresa
   * duce acum la un anunt al Comisiei, nu la un formular. Un link catre o
   * platforma care nu mai exista nu e doar inutil, e o trimitere gresita
   * intr-un text legal, deci a fost scos de peste tot.
   *
   * Ce ramane valabil pentru un consumator: intai direct cu noi, apoi ANPC
   * si entitatile SAL de mai sus.
   */
} as const

/** true cat timp mai exista un camp necompletat. */
export const firmaIncompleta = Object.values(firma).some((v) => typeof v === 'string' && v.startsWith('['))

/**
 * Invers, pentru citit mai usor in pagini.
 *
 * **Regula, de la Artiom:** cat timp firma nu e deschisa, datele de
 * identificare NU se afiseaza deloc. Un „[Nume Prenume] PFA" pe un site public
 * arata a lucru neterminat si nu acopera pe nimeni juridic, deci e mai rau
 * decat tacerea. In clipa in care se completeaza `firma`, blocul din subsol si
 * randurile din paginile legale reapar singure, fara sa umble nimeni prin ele.
 */
export const firmaCompleta = !firmaIncompleta

/**
 * Cum ne numim cand nu avem inca denumirea legala. Marca, nu o forma juridica
 * inventata: nu scriem „PFA" cat timp nu exista un PFA.
 */
export const numeLegal = firmaCompleta ? firma.denumire : 'DorDeFranceza'
