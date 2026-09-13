/**
 * Datele de identificare ale prestatorului.
 *
 * Activitatea e in **Republica Moldova**, deci legea care conteaza e cea de
 * acolo, nu cea romana: Legea nr. 8/2016 privind drepturile consumatorilor la
 * incheierea contractelor si Legea nr. 105/2003 privind protectia
 * consumatorilor. Pana pe 13 septembrie 2026 paginile citau OUG 34/2014 si
 * ANPC, adica legi si autoritati romanesti care nu obliga un vanzator din
 * Moldova. Un articol de lege citat gresit e mai rau decat niciunul: arata ca
 * textul a fost copiat de undeva.
 *
 * Ce ramane valabil si pentru cumparatorii din Romania: ei isi pastreaza
 * protectiile lor oriunde ar fi vanzatorul, iar noi le dam oricum, scrise ca
 * promisiune, nu ca trimitere la un articol.
 *
 * Tot ce e intre [paranteze] se completeaza cu datele reale cand se deschide
 * firma, in decembrie 2026. Pana atunci nu se afiseaza deloc, vezi `numeLegal`.
 */
export const firma = {
  /** Forma juridica sub care se vand lectiile: PFA, II sau SRL. */
  denumire: '[Denumirea] SRL',
  /** IDNO, numarul de identificare de stat din Moldova. */
  cui: '[IDNO]',
  registru: '[Nr. de inregistrare, ASP]',
  sediu: '[Strada, nr., localitatea, raionul]',
  email: 'dordefranceza@gmail.com',
  telefon: '+33 6 62 35 20 71',
  /** true dupa ce firma devine platitoare de TVA. Schimba textul de la preturi. */
  platitorTva: false,
  /**
   * Autoritatile din Moldova, verificate pe 13 septembrie 2026.
   * Erau ANPC si dataprotection.ro, adica autoritatile romane, care n-au ce
   * face cu un vanzator din Moldova.
   */
  dateProtectie: 'https://datepersonale.md',
  consumatori: 'https://consumator.gov.md',
  /*
   * Aici era si platforma europeana SOL (ODR). S-a inchis pe 20 iulie 2025,
   * prin Regulamentul (UE) 2024/3228, si oricum nu s-a aplicat niciodata
   * Moldovei. Scoasa de peste tot.
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
