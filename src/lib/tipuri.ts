/** Tipurile comune site-ului public, functiilor server si cabinetului. */
import { site } from '../config/site'

export type TipProgramare = 'cunoastere' | 'individual' | 'grup'
export type StareProgramare = 'noua' | 'confirmata' | 'anulata' | 'finalizata'

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
  /** Completat de server la citire, pentru cabinet. */
  client?: Client
}

/** O regula saptamanala: in ziua `zi` (1 = luni ... 7 = duminica), de la ora `de_la` la `pana_la`. */
export type Disponibilitate = {
  id: string
  zi: number
  de_la: string
  pana_la: string
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
  grup: { nume: 'Lecție în grup mic', durata: site.durataLectie, pret: site.preturi.grup },
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
