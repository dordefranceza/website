/** Tipurile comune site-ului public, functiilor server si cabinetului. */
import { site } from '../config/site'

export type TipProgramare = 'cunoastere' | 'individual' | 'grup'
/** `propusa` = trimisa de Dorina cursantului, asteapta un raspuns de la el. */
export type StareProgramare = 'propusa' | 'noua' | 'confirmata' | 'anulata' | 'finalizata'

export type Client = {
  id: string
  nume: string
  email: string
  telefon: string
  nivel: string
  scop: string
  sursa: string
  note: string
  creat: string
}

export type Programare = {
  id: string
  client_id: string
  tip: TipProgramare
  /** Instant ISO (UTC). Se afiseaza mereu in fusul Europe/Bucharest. */
  incepe: string
  durata_min: number
  stare: StareProgramare
  platit: boolean
  suma: number
  sursa: string
  pagina: string
  mesaj: string
  link_zoom: string
  note: string
  creat: string
  /** Codul secret din linkul de confirmare, doar pentru propuneri. */
  token_confirmare?: string | null
  /** Pana cand mai poate fi confirmata propunerea. */
  token_expira?: string | null
  /** Grupa din care face parte lectia, daca e o lectie de grup. */
  grupa_id?: string | null
  /** Completat de server la citire, pentru cabinet. */
  client?: Client
}

/**
 * O grupa: aceiasi oameni, aceeasi ora, in fiecare saptamana, un numar stiut de
 * lectii.
 *
 * Grupa nu tine ea lectiile. Lectiile stau tot in `programari`, cate un rand
 * pentru fiecare cursant, toate legate de grupa prin `grupa_id`. Asa, tot ce e
 * deja construit merge mai departe fara sa fie atins: fiecare om isi primeste
 * emailul lui, fisierul lui de calendar si plata lui se numara separat, iar
 * grupa se vede intreaga intr-un singur loc.
 */
export type Grupa = {
  id: string
  nume: string
  nivel: string
  scop: string
  /** Ziua saptamanii, 1 = luni ... 7 = duminica. */
  zi: number
  /** 'HH:MM', ora Romaniei. */
  ora: string
  /** Ziua primei lectii, 'YYYY-MM-DD'. */
  prima: string
  /** Cate lectii tine cursul. */
  lectii: number
  /** Cati incap. */
  locuri: number
  /** Pretul unei lectii, pe cursant. */
  pret: number
  activ: boolean
  creat: string
  /** Completate de server la citire, pentru cabinet. */
  cursanti?: Client[]
  /** Prima lectie care nu a trecut inca, ISO. */
  urmatoarea?: string | null
  /** Cate lectii au fost tinute deja din curs. */
  tinute?: number
}

/** O regula saptamanala: in ziua `zi` (1 = luni ... 7 = duminica), de la ora `de_la` la `pana_la`. */
export type Disponibilitate = {
  id: string
  zi: number
  de_la: string
  pana_la: string
}

/** Un interval dintr-o zi: „de la 17:00 pana la 21:00". */
export type Interval = { de_la: string; pana_la: string }

/**
 * Orarul unei zile anume, care bate regula saptamanala.
 *
 * Exista ca sa poata fi apasata orice zi din an, nu doar „luni" la modul
 * general. Daca ziua are un rand aici, conteaza NUMAI ce scrie in el; un rand
 * cu `intervale` gol inseamna zi inchisa dinadins, nu zi neatinsa. Zilele fara
 * rand cad inapoi pe orarul saptamanal.
 */
export type OrarZi = {
  /** Ziua, ca 'YYYY-MM-DD'. */
  data: string
  intervale: Interval[]
}

/** Un interval blocat (scoala, vacanta, orice): nu se pot face programari in el. */
export type Blocaj = {
  id: string
  de_la: string
  pana_la: string
  motiv: string
}

export type Setari = {
  link_zoom: string
  email_notificari: string
  /** Discutia gratuita de cunoastere se poate opri din cabinet. */
  cunoastere_activa: boolean
  /** Cate ore inainte trebuie facuta o programare. */
  preaviz_ore: number
  /** Cate zile inainte se pot face programari. */
  orizont_zile: number
  /** Pasul dintre doua sloturi, in minute (lectie 50 + pauza 10). */
  pas_minute: number
}

export const SETARI_IMPLICITE: Setari = {
  link_zoom: '',
  email_notificari: '',
  cunoastere_activa: true,
  preaviz_ore: 12,
  orizont_zile: 45,
  pas_minute: 60,
}

/** Cererea care vine din formularul public de programare. */
export type CerereProgramare = {
  tip: TipProgramare
  incepe: string
  nume: string
  email: string
  telefon: string
  nivel: string
  scop: string
  mesaj: string
  sursa: string
  pagina: string
  gdpr: boolean
  botcheck?: string
}

export const TIPURI: Record<TipProgramare, { nume: string; durata: number; pret: number }> = {
  cunoastere: { nume: 'Discuție de cunoaștere', durata: 20, pret: 0 },
  individual: { nume: 'Lecție individuală', durata: site.durataLectie, pret: site.preturi.individual },
  /* grupul are lectii mai lungi: sunt mai multi oameni si fiecare trebuie sa
     apuce sa vorbeasca. Durata intra direct in calculul sloturilor libere. */
  grup: { nume: 'Lecție în grup mic', durata: site.durataGrup, pret: site.preturi.grup },
}

export const NIVELURI = ['Încep de la zero', 'A1', 'A2', 'B1', 'B2', 'C1', 'Nu știu sigur'] as const

export const SCOPURI = [
  'Job la o firmă franceză',
  'Mutare în Franța, Belgia sau Elveția',
  'BAC, DELF sau DALF',
  'Conversație și călătorii',
  'Pentru copilul meu',
  'Altceva',
] as const

/* --- Blog ------------------------------------------------------------------- */

export type Articol = {
  id: string
  slug: string
  titlu: string
  rezumat: string
  /** Markdown scris in cabinet. HTML-ul se genereaza pe server, curatat. */
  continut: string
  imagine: string
  imagine_alt: string
  meta_titlu: string
  meta_descriere: string
  publicat: boolean
  publicat_la: string | null
  creat: string
  actualizat: string
}

export type ArticolSchimbari = Partial<Omit<Articol, 'id' | 'creat' | 'actualizat'>>
