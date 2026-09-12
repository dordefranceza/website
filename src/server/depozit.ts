/**
 * =============================================================================
 *  STRATUL DE DATE, PE SERVER
 * =============================================================================
 *  Tot ce citesc si scriu functiile din src/pages/api/ trece pe aici.
 *
 *  Doua implementari, alese singure dupa variabilele de mediu:
 *   - SUPABASE: cand exista PUBLIC_SUPABASE_URL si SUPABASE_SERVICE_ROLE_KEY.
 *     Cheia de server nu ajunge niciodata in browser. Politicile RLS tin
 *     cheia publica (anon) departe de orice tabel, deci singura cale spre
 *     date e prin aceste functii.
 *   - LOCAL: in dezvoltare, fara Supabase, datele stau in .local/date.json.
 *     Serveste la construit si testat, nu la lucru real.
 * =============================================================================
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Articol, ArticolSchimbari, Blocaj, CerereProgramare, Client, Disponibilitate, Grupa, Interval, OrarZi, Pachet, Programare, Setari, StareProgramare } from '../lib/tipuri'
import { SETARI_IMPLICITE } from '../lib/tipuri'
import { inDezvoltare, supabaseLegat, variabila } from './mediu'

export type FiltruProgramari = { deLa?: string; panaLa?: string; stare?: StareProgramare | 'active' }

export type SchimbariProgramare = Partial<Pick<Programare, 'stare' | 'platit' | 'suma' | 'note' | 'link_zoom' | 'incepe' | 'token_confirmare' | 'token_expira'>>
/** Ce stie serverul in plus fata de ce a trimis omul din formular. */
export type ExtraProgramare = {
  durata_min: number
  suma: number
  link_zoom: string
  /** Implicit 'noua'. Propunerile facute de Dorina pornesc ca 'propusa'. */
  stare?: StareProgramare
  token?: string
  tokenExpira?: string
  /** Lectie dintr-o grupa. */
  grupaId?: string
}

export type SchimbariClient = Partial<Pick<Client, 'nume' | 'email' | 'telefon' | 'nivel' | 'scop' | 'note'>>

export type SchimbariGrupa = Partial<Pick<Grupa, 'nume' | 'nivel' | 'scop' | 'zi' | 'ora' | 'prima' | 'lectii' | 'locuri' | 'pret' | 'activ'>>

export interface Depozit {
  setari(): Promise<Setari>
  salveazaSetari(s: Partial<Setari>): Promise<Setari>
  disponibilitate(): Promise<Disponibilitate[]>
  salveazaDisponibilitate(reguli: Omit<Disponibilitate, 'id'>[]): Promise<Disponibilitate[]>
  /** Zilele cu orar propriu, optional doar dintr-un interval de date. */
  orarZi(deLa?: string, panaLa?: string): Promise<OrarZi[]>
  /** Pune orarul unei zile. `null` sterge randul, deci ziua revine la orarul saptamanal. */
  salveazaOrarZi(data: string, intervale: Interval[] | null): Promise<void>
  blocaje(): Promise<Blocaj[]>
  adaugaBlocaj(b: Omit<Blocaj, 'id'>): Promise<Blocaj>
  stergeBlocaj(id: string): Promise<void>
  programari(f?: FiltruProgramari): Promise<Programare[]>
  programare(id: string): Promise<Programare | null>
  creeazaProgramare(c: CerereProgramare, extra: ExtraProgramare): Promise<Programare>
  /** Propunerea gasita dupa codul din linkul de confirmare. */
  programareDupaToken(token: string): Promise<Programare | null>
  actualizeazaProgramare(id: string, s: SchimbariProgramare): Promise<Programare>
  clienti(): Promise<Client[]>
  actualizeazaClient(id: string, s: SchimbariClient): Promise<Client>
  pachete(): Promise<Pachet[]>
  adaugaPachet(p: Omit<Pachet, 'id' | 'creat'>): Promise<Pachet>
  stergePachet(id: string): Promise<void>
  grupe(): Promise<Grupa[]>
  /** Creeaza (id null) sau salveaza o grupa. */
  salveazaGrupa(id: string | null, g: SchimbariGrupa): Promise<Grupa>
  stergeGrupa(id: string): Promise<void>
  esteAdmin(email: string): Promise<boolean>
  /** Toate articolele (cabinet) sau doar cele publicate (site). */
  articole(doarPublicate: boolean): Promise<Articol[]>
  articol(idSauSlug: string): Promise<Articol | null>
  salveazaArticol(id: string | null, s: ArticolSchimbari): Promise<Articol>
  stergeArticol(id: string): Promise<void>
  /** Urca o imagine si intoarce adresa ei publica. */
  urcaImagine(nume: string, tip: string, date: Uint8Array): Promise<string>
}

const id = () => crypto.randomUUID()
const acum = () => new Date().toISOString()

function normalizeazaEmail(e: string): string {
  return e.trim().toLowerCase()
}

/* =============================================================================
 *  LOCAL: un fisier JSON in .local/
 * ========================================================================== */

type Fisier = {
  articole: Articol[]
  setari: Setari
  disponibilitate: Disponibilitate[]
  orarZi: OrarZi[]
  grupe: Grupa[]
  pachete: Pachet[]
  blocaje: Blocaj[]
  clienti: Client[]
  programari: Programare[]
}

const GOL: Fisier = {
  articole: [],
  setari: { ...SETARI_IMPLICITE },
  // Un orar de pornire, ca sa se vada sloturi din prima: luni-vineri 17-21, sambata 10-14.
  disponibilitate: [
    { id: 'd1', zi: 1, de_la: '17:00', pana_la: '21:00' },
    { id: 'd2', zi: 2, de_la: '17:00', pana_la: '21:00' },
    { id: 'd3', zi: 3, de_la: '17:00', pana_la: '21:00' },
    { id: 'd4', zi: 4, de_la: '17:00', pana_la: '21:00' },
    { id: 'd5', zi: 5, de_la: '17:00', pana_la: '21:00' },
    { id: 'd6', zi: 6, de_la: '10:00', pana_la: '14:00' },
  ],
  orarZi: [],
  grupe: [],
  pachete: [],
  blocaje: [],
  clienti: [],
  programari: [],
}

class DepozitLocal implements Depozit {
  private cale = join(process.cwd(), '.local', 'date.json')

  private citeste(): Fisier {
    try {
      if (!existsSync(this.cale)) return structuredClone(GOL)
      const d = JSON.parse(readFileSync(this.cale, 'utf8')) as Partial<Fisier>
      return {
        articole: d.articole ?? [],
        setari: { ...SETARI_IMPLICITE, ...(d.setari ?? {}) },
        disponibilitate: d.disponibilitate ?? GOL.disponibilitate,
        orarZi: d.orarZi ?? [],
        grupe: d.grupe ?? [],
        pachete: d.pachete ?? [],
        blocaje: d.blocaje ?? [],
        clienti: d.clienti ?? [],
        programari: d.programari ?? [],
      }
    } catch {
      return structuredClone(GOL)
    }
  }

  private scrie(f: Fisier): void {
    mkdirSync(join(process.cwd(), '.local'), { recursive: true })
    writeFileSync(this.cale, JSON.stringify(f, null, 2), 'utf8')
  }

  private cuClient(f: Fisier, p: Programare): Programare {
    return { ...p, client: f.clienti.find((c) => c.id === p.client_id) }
  }

  async setari() { return this.citeste().setari }
  async salveazaSetari(s: Partial<Setari>) {
    const f = this.citeste()
    f.setari = { ...f.setari, ...s }
    this.scrie(f)
    return f.setari
  }
  async disponibilitate() { return this.citeste().disponibilitate }
  async salveazaDisponibilitate(reguli: Omit<Disponibilitate, 'id'>[]) {
    const f = this.citeste()
    f.disponibilitate = reguli.map((r) => ({ ...r, id: id() }))
    this.scrie(f)
    return f.disponibilitate
  }
  async orarZi(deLa?: string, panaLa?: string) {
    const toate = this.citeste().orarZi
    return toate.filter((z) => (!deLa || z.data >= deLa) && (!panaLa || z.data <= panaLa)).sort((a, b) => a.data.localeCompare(b.data))
  }
  async salveazaOrarZi(data: string, intervale: Interval[] | null) {
    const f = this.citeste()
    f.orarZi = f.orarZi.filter((z) => z.data !== data)
    if (intervale) f.orarZi.push({ data, intervale })
    this.scrie(f)
  }
  async blocaje() { return this.citeste().blocaje }
  async adaugaBlocaj(b: Omit<Blocaj, 'id'>) {
    const f = this.citeste()
    const nou = { ...b, id: id() }
    f.blocaje.push(nou)
    this.scrie(f)
    return nou
  }
  async stergeBlocaj(idBlocaj: string) {
    const f = this.citeste()
    f.blocaje = f.blocaje.filter((b) => b.id !== idBlocaj)
    this.scrie(f)
  }
  async programari(filtru: FiltruProgramari = {}) {
    const f = this.citeste()
    return f.programari
      .filter((p) => !filtru.deLa || p.incepe >= filtru.deLa)
      .filter((p) => !filtru.panaLa || p.incepe <= filtru.panaLa)
      .filter((p) => !filtru.stare || (filtru.stare === 'active' ? p.stare !== 'anulata' : p.stare === filtru.stare))
      .sort((a, b) => a.incepe.localeCompare(b.incepe))
      .map((p) => this.cuClient(f, p))
  }
  async programare(idP: string) {
    const f = this.citeste()
    const p = f.programari.find((x) => x.id === idP)
    return p ? this.cuClient(f, p) : null
  }
  async programareDupaToken(token: string) {
    const f = this.citeste()
    const p = f.programari.find((x) => x.token_confirmare === token)
    return p ? this.cuClient(f, p) : null
  }
  async creeazaProgramare(c: CerereProgramare, extra: ExtraProgramare) {
    const f = this.citeste()
    const email = normalizeazaEmail(c.email)
    let client = f.clienti.find((x) => x.email === email)
    if (!client) {
      client = { id: id(), nume: c.nume, email, telefon: c.telefon, nivel: c.nivel, scop: c.scop, sursa: c.sursa, note: '', creat: acum() }
      f.clienti.push(client)
    } else {
      Object.assign(client, { nume: c.nume || client.nume, telefon: c.telefon || client.telefon, nivel: c.nivel || client.nivel, scop: c.scop || client.scop })
    }
    const p: Programare = {
      id: id(),
      client_id: client.id,
      tip: c.tip,
      incepe: c.incepe,
      durata_min: extra.durata_min,
      stare: extra.stare ?? 'noua',
      token_confirmare: extra.token ?? null,
      token_expira: extra.tokenExpira ?? null,
      platit: false,
      suma: extra.suma,
      sursa: c.sursa,
      pagina: c.pagina,
      mesaj: c.mesaj,
      link_zoom: extra.link_zoom,
      note: '',
      grupa_id: extra.grupaId ?? null,
      creat: acum(),
    }
    f.programari.push(p)
    this.scrie(f)
    return this.cuClient(f, p)
  }
  async actualizeazaProgramare(idP: string, s: SchimbariProgramare) {
    const f = this.citeste()
    const p = f.programari.find((x) => x.id === idP)
    if (!p) throw new Error('Programarea nu există')
    Object.assign(p, s)
    this.scrie(f)
    return this.cuClient(f, p)
  }
  async clienti() {
    return this.citeste().clienti.sort((a, b) => b.creat.localeCompare(a.creat))
  }
  async grupe() {
    return this.citeste().grupe.sort((a, b) => b.creat.localeCompare(a.creat))
  }
  async pachete() {
    return this.citeste().pachete.sort((a, b) => b.creat.localeCompare(a.creat))
  }
  async adaugaPachet(pa: Omit<Pachet, 'id' | 'creat'>) {
    const f = this.citeste()
    const nou: Pachet = { ...pa, id: id(), creat: acum() }
    f.pachete.push(nou)
    this.scrie(f)
    return nou
  }
  async stergePachet(idP: string) {
    const f = this.citeste()
    f.pachete = f.pachete.filter((x) => x.id !== idP)
    this.scrie(f)
  }
  async salveazaGrupa(idG: string | null, g: SchimbariGrupa) {
    const f = this.citeste()
    if (idG) {
      const gasita = f.grupe.find((x) => x.id === idG)
      if (!gasita) throw new Error('Grupa nu există')
      Object.assign(gasita, g)
      this.scrie(f)
      return gasita
    }
    const noua: Grupa = {
      id: id(), nume: '', nivel: '', scop: '', zi: 1, ora: '18:00', prima: '', lectii: 15, locuri: 4, pret: 20,
      activ: true, creat: acum(), ...g,
    }
    f.grupe.push(noua)
    this.scrie(f)
    return noua
  }
  async stergeGrupa(idG: string) {
    const f = this.citeste()
    f.grupe = f.grupe.filter((x) => x.id !== idG)
    for (const p of f.programari) if (p.grupa_id === idG) p.grupa_id = null
    this.scrie(f)
  }
  async actualizeazaClient(idC: string, s: SchimbariClient) {
    const f = this.citeste()
    const c = f.clienti.find((x) => x.id === idC)
    if (!c) throw new Error('Clientul nu există')
    Object.assign(c, s, s.email ? { email: normalizeazaEmail(s.email) } : {})
    this.scrie(f)
    return c
  }
  async esteAdmin() { return true }
  async articole(doarPublicate: boolean) {
    return this.citeste().articole
      .filter((a) => !doarPublicate || a.publicat)
      .sort((a, b) => (b.publicat_la ?? b.creat).localeCompare(a.publicat_la ?? a.creat))
  }
  async articol(idSauSlug: string) {
    return this.citeste().articole.find((a) => a.id === idSauSlug || a.slug === idSauSlug) ?? null
  }
  async salveazaArticol(idA: string | null, s: ArticolSchimbari) {
    const f = this.citeste()
    if (s.slug && f.articole.some((a) => a.slug === s.slug && a.id !== idA)) throw new Error('Există deja un articol cu această adresă')
    let a = idA ? f.articole.find((x) => x.id === idA) : undefined
    if (idA && !a) throw new Error('Articolul nu există')
    if (!a) {
      a = { id: id(), slug: '', titlu: '', rezumat: '', continut: '', imagine: '', imagine_alt: '', meta_titlu: '', meta_descriere: '', publicat: false, publicat_la: null, creat: acum(), actualizat: acum() }
      f.articole.push(a)
    }
    Object.assign(a, s, { actualizat: acum() })
    if (a.publicat && !a.publicat_la) a.publicat_la = acum()
    this.scrie(f)
    return a
  }
  async stergeArticol(idA: string) {
    const f = this.citeste()
    f.articole = f.articole.filter((a) => a.id !== idA)
    this.scrie(f)
  }
  async urcaImagine(nume: string, _tip: string, date: Uint8Array) {
    const dosar = join(process.cwd(), 'public', 'blog-imagini')
    mkdirSync(dosar, { recursive: true })
    writeFileSync(join(dosar, nume), date)
    return `/blog-imagini/${nume}`
  }
}

/* =============================================================================
 *  SUPABASE: tabelele din supabase/schema.sql, prin cheia de server
 * ========================================================================== */


/* --- Normalizare: Supabase da '2026-09-12T10:00:00+00:00', codul compara siruri ISO cu Z --- */
function iso(v: unknown): string {
  const t = typeof v === 'string' || v instanceof Date ? Date.parse(String(v)) : NaN
  return Number.isFinite(t) ? new Date(t).toISOString() : String(v ?? '')
}
function normClient(c: Client): Client {
  return { ...c, creat: iso(c.creat) }
}
function normProgramare(p: Programare): Programare {
  return { ...p, incepe: iso(p.incepe), creat: iso(p.creat), suma: Number(p.suma) || 0, client: p.client ? normClient(p.client) : undefined }
}
function normArticol(a: Articol): Articol {
  return { ...a, creat: iso(a.creat), actualizat: iso(a.actualizat), publicat_la: a.publicat_la ? iso(a.publicat_la) : null }
}
function normBlocaj(b: Blocaj): Blocaj {
  return { ...b, de_la: iso(b.de_la), pana_la: iso(b.pana_la) }
}

class DepozitSupabase implements Depozit {
  private sb: SupabaseClient

  constructor() {
    this.sb = createClient(variabila('PUBLIC_SUPABASE_URL'), variabila('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  private arunca(eroare: { message?: string } | null, context: string): void {
    if (eroare) throw new Error(`${context}: ${eroare.message ?? 'eroare necunoscută'}`)
  }

  /*
   * Supabase, pe planul gratuit, mai raspunde din cand in cand „Gateway
   * Timeout". Nu e o greseala de-a noastra si nu e ceva de reparat in cod: e
   * baza de date care doarme sau e aglomerata o secunda.
   *
   * Artiom a apasat „Trimite propunerea" fix intr-una din secundele alea si a
   * primit „Eroare pe server". Acum cererea se incearca de trei ori, la 300 si
   * la 800 de milisecunde, si abia apoi se da batuta. Se reincearca DOAR
   * caderile trecatoare, nu si un raspuns limpede de „nu ai voie" sau „randul
   * nu exista", care s-ar repeta la fel de trei ori degeaba.
   */
  private trecatoare(eroare: { message?: string; code?: string } | null): boolean {
    if (!eroare) return false
    const m = `${eroare.message ?? ''} ${eroare.code ?? ''}`.toLowerCase()
    return /gateway timeout|timed? ?out|fetch failed|network|econnreset|socket hang up|503|502|504|upstream/.test(m)
  }

  protected async incearca<T>(cerere: () => PromiseLike<{ data: T; error: { message?: string; code?: string } | null }>) {
    let ultim = await cerere()
    for (const pauza of [300, 800]) {
      if (!this.trecatoare(ultim.error)) return ultim
      await new Promise((r) => setTimeout(r, pauza))
      ultim = await cerere()
    }
    return ultim
  }

  async setari() {
    const { data, error } = await this.sb.from('setari').select('date').eq('id', 'site').maybeSingle()
    this.arunca(error, 'setari')
    return { ...SETARI_IMPLICITE, ...((data?.date as Partial<Setari>) ?? {}) }
  }
  async salveazaSetari(s: Partial<Setari>) {
    const actuale = await this.setari()
    const noi = { ...actuale, ...s }
    const { error } = await this.sb.from('setari').upsert({ id: 'site', date: noi })
    this.arunca(error, 'salvare setari')
    return noi
  }
  async disponibilitate() {
    const { data, error } = await this.sb.from('disponibilitate').select('*').order('zi').order('de_la')
    this.arunca(error, 'disponibilitate')
    return (data ?? []) as Disponibilitate[]
  }
  async salveazaDisponibilitate(reguli: Omit<Disponibilitate, 'id'>[]) {
    const { error: e1 } = await this.sb.from('disponibilitate').delete().neq('zi', -1)
    this.arunca(e1, 'stergere disponibilitate')
    if (reguli.length) {
      const { error: e2 } = await this.sb.from('disponibilitate').insert(reguli)
      this.arunca(e2, 'salvare disponibilitate')
    }
    return this.disponibilitate()
  }
  /*
   * Tabelul `orar_zi` a venit dupa restul schemei. Daca inca nu e creat sau
   * nu e expus Data API-ului, site-ul NU trebuie sa cada: fara el ramane
   * orarul saptamanal, adica exact ce era inainte. De asta lipsa lui se
   * inghite la citire si se spune pe sleau doar la salvare, in cabinet.
   */
  private lipseste(eroare: { code?: string; message?: string } | null): boolean {
    if (!eroare) return false
    const m = eroare.message ?? ''
    return eroare.code === '42P01' || eroare.code === 'PGRST205' || (/orar_zi|pachete/.test(m) && /does not exist|not find/i.test(m))
  }

  async orarZi(deLa?: string, panaLa?: string) {
    let q = this.sb.from('orar_zi').select('data, intervale').order('data')
    if (deLa) q = q.gte('data', deLa)
    if (panaLa) q = q.lte('data', panaLa)
    const { data, error } = await q
    if (this.lipseste(error)) return []
    this.arunca(error, 'orar pe zile')
    return ((data ?? []) as { data: string; intervale: Interval[] }[]).map((z) => ({
      // Postgres da `date` ca 'YYYY-MM-DD', dar taiem oricum, sa nu treaca un timestamp.
      data: String(z.data).slice(0, 10),
      intervale: Array.isArray(z.intervale) ? z.intervale : [],
    }))
  }

  async salveazaOrarZi(data: string, intervale: Interval[] | null) {
    if (intervale === null) {
      const { error } = await this.sb.from('orar_zi').delete().eq('data', data)
      if (this.lipseste(error)) throw new Error('Orarul pe zile nu e pornit inca in baza de date')
      this.arunca(error, 'stergere orar pe zi')
      return
    }
    const { error } = await this.sb.from('orar_zi').upsert({ data, intervale }, { onConflict: 'data' })
    if (this.lipseste(error)) throw new Error('Orarul pe zile nu e pornit inca in baza de date')
    this.arunca(error, 'salvare orar pe zi')
  }

  async blocaje() {
    const { data, error } = await this.sb.from('blocaje').select('*').order('de_la')
    this.arunca(error, 'blocaje')
    return ((data ?? []) as Blocaj[]).map(normBlocaj)
  }
  async adaugaBlocaj(b: Omit<Blocaj, 'id'>) {
    const { data, error } = await this.sb.from('blocaje').insert(b).select().single()
    this.arunca(error, 'adaugare blocaj')
    return normBlocaj(data as Blocaj)
  }
  async stergeBlocaj(idB: string) {
    const { error } = await this.sb.from('blocaje').delete().eq('id', idB)
    this.arunca(error, 'stergere blocaj')
  }
  async programari(filtru: FiltruProgramari = {}) {
    let q = this.sb.from('programari').select('*, client:clienti(*)').order('incepe')
    if (filtru.deLa) q = q.gte('incepe', filtru.deLa)
    if (filtru.panaLa) q = q.lte('incepe', filtru.panaLa)
    if (filtru.stare === 'active') q = q.neq('stare', 'anulata')
    else if (filtru.stare) q = q.eq('stare', filtru.stare)
    const { data, error } = await q
    this.arunca(error, 'programari')
    return ((data ?? []) as Programare[]).map(normProgramare)
  }
  async programare(idP: string) {
    const { data, error } = await this.sb.from('programari').select('*, client:clienti(*)').eq('id', idP).maybeSingle()
    this.arunca(error, 'programare')
    return data ? normProgramare(data as Programare) : null
  }
  async programareDupaToken(token: string) {
    const { data, error } = await this.sb.from('programari').select('*, client:clienti(*)').eq('token_confirmare', token).maybeSingle()
    this.arunca(error, 'programare dupa token')
    return data ? normProgramare(data as Programare) : null
  }
  async creeazaProgramare(c: CerereProgramare, extra: ExtraProgramare) {
    const email = normalizeazaEmail(c.email)
    const { data: existent, error: e0 } = await this.sb.from('clienti').select('*').eq('email', email).maybeSingle()
    this.arunca(e0, 'cautare client')
    let client = existent as Client | null
    if (!client) {
      const { data, error } = await this.sb
        .from('clienti')
        .insert({ nume: c.nume, email, telefon: c.telefon, nivel: c.nivel, scop: c.scop, sursa: c.sursa, note: '' })
        .select()
        .single()
      this.arunca(error, 'creare client')
      client = data as Client
    } else {
      const { data, error } = await this.sb
        .from('clienti')
        .update({ nume: c.nume || client.nume, telefon: c.telefon || client.telefon, nivel: c.nivel || client.nivel, scop: c.scop || client.scop })
        .eq('id', client.id)
        .select()
        .single()
      this.arunca(error, 'actualizare client')
      client = data as Client
    }
    const { data, error } = await this.sb
      .from('programari')
      .insert({
        client_id: client.id,
        tip: c.tip,
        incepe: c.incepe,
        durata_min: extra.durata_min,
        stare: extra.stare ?? 'noua',
        token_confirmare: extra.token ?? null,
        token_expira: extra.tokenExpira ?? null,
        platit: false,
        suma: extra.suma,
        sursa: c.sursa,
        pagina: c.pagina,
        mesaj: c.mesaj,
        link_zoom: extra.link_zoom,
        note: '',
        grupa_id: extra.grupaId ?? null,
      })
      .select()
      .single()
    this.arunca(error, 'creare programare')
    return normProgramare({ ...(data as Programare), client })
  }
  async actualizeazaProgramare(idP: string, s: SchimbariProgramare) {
    const { data, error } = await this.incearca(() => this.sb.from('programari').update(s).eq('id', idP).select('*, client:clienti(*)').single())
    this.arunca(error, 'actualizare programare')
    return normProgramare(data as Programare)
  }
  async pachete() {
    const { data, error } = await this.sb.from('pachete').select('*').order('creat', { ascending: false })
    /* Ca si la `orar_zi`: pana nu e creat si expus tabelul, cabinetul trebuie
       sa mearga mai departe fara pachete, nu sa cada cu totul. */
    if (this.lipseste(error)) return []
    this.arunca(error, 'pachete')
    return ((data ?? []) as Pachet[]).map((p) => ({ ...p, pret: Number(p.pret) || 0 }))
  }
  async adaugaPachet(pa: Omit<Pachet, 'id' | 'creat'>) {
    const { data, error } = await this.sb.from('pachete').insert(pa).select().single()
    if (this.lipseste(error)) throw new Error('Pachetele nu sunt pornite încă în baza de date')
    this.arunca(error, 'adaugare pachet')
    const p = data as Pachet
    return { ...p, pret: Number(p.pret) || 0 }
  }
  async stergePachet(idP: string) {
    const { error } = await this.sb.from('pachete').delete().eq('id', idP)
    this.arunca(error, 'stergere pachet')
  }
  async grupe() {
    const { data, error } = await this.sb.from('grupe').select('*').order('creat', { ascending: false })
    this.arunca(error, 'grupe')
    return ((data ?? []) as Grupa[]).map((g) => ({ ...g, prima: String(g.prima ?? '').slice(0, 10), pret: Number(g.pret) || 0 }))
  }
  async salveazaGrupa(idG: string | null, g: SchimbariGrupa) {
    const q = idG
      ? this.sb.from('grupe').update(g).eq('id', idG).select().single()
      : this.sb.from('grupe').insert(g).select().single()
    const { data, error } = await q
    this.arunca(error, idG ? 'salvare grupa' : 'creare grupa')
    const gr = data as Grupa
    return { ...gr, prima: String(gr.prima ?? '').slice(0, 10), pret: Number(gr.pret) || 0 }
  }
  async stergeGrupa(idG: string) {
    const { error } = await this.sb.from('grupe').delete().eq('id', idG)
    this.arunca(error, 'stergere grupa')
  }
  async clienti() {
    const { data, error } = await this.sb.from('clienti').select('*').order('creat', { ascending: false })
    this.arunca(error, 'clienti')
    return ((data ?? []) as Client[]).map(normClient)
  }
  async actualizeazaClient(idC: string, s: SchimbariClient) {
    const { data, error } = await this.sb
      .from('clienti')
      .update({ ...s, ...(s.email ? { email: normalizeazaEmail(s.email) } : {}) })
      .eq('id', idC)
      .select()
      .single()
    this.arunca(error, 'actualizare client')
    return normClient(data as Client)
  }
  async esteAdmin(email: string) {
    const { data, error } = await this.incearca(() => this.sb.from('admin_email').select('email').eq('email', normalizeazaEmail(email)).maybeSingle())
    this.arunca(error, 'admin_email')
    return Boolean(data)
  }
  async articole(doarPublicate: boolean) {
    let q = this.sb.from('articole').select('*').order('publicat_la', { ascending: false, nullsFirst: true }).order('creat', { ascending: false })
    if (doarPublicate) q = q.eq('publicat', true)
    const { data, error } = await q
    this.arunca(error, 'articole')
    return ((data ?? []) as Articol[]).map(normArticol)
  }
  async articol(idSauSlug: string) {
    const camp = /^[0-9a-f-]{36}$/i.test(idSauSlug) ? 'id' : 'slug'
    const { data, error } = await this.sb.from('articole').select('*').eq(camp, idSauSlug).maybeSingle()
    this.arunca(error, 'articol')
    return data ? normArticol(data as Articol) : null
  }
  async salveazaArticol(idA: string | null, s: ArticolSchimbari) {
    const acumIso = acum()
    if (idA) {
      const existent = await this.articol(idA)
      if (!existent) throw new Error('Articolul nu există')
      const publicat_la = s.publicat && !existent.publicat_la ? acumIso : existent.publicat_la
      const { data, error } = await this.sb.from('articole').update({ ...s, publicat_la, actualizat: acumIso }).eq('id', idA).select().single()
      this.arunca(error, 'salvare articol')
      return normArticol(data as Articol)
    }
    const { data, error } = await this.sb
      .from('articole')
      .insert({ slug: '', titlu: '', rezumat: '', continut: '', imagine: '', imagine_alt: '', meta_titlu: '', meta_descriere: '', publicat: false, ...s, publicat_la: s.publicat ? acumIso : null })
      .select()
      .single()
    this.arunca(error, 'creare articol')
    return normArticol(data as Articol)
  }
  async stergeArticol(idA: string) {
    const { error } = await this.sb.from('articole').delete().eq('id', idA)
    this.arunca(error, 'stergere articol')
  }
  async urcaImagine(nume: string, tip: string, date: Uint8Array) {
    const { error } = await this.sb.storage.from('imagini').upload(`blog/${nume}`, date, { contentType: tip, upsert: false, cacheControl: '31536000' })
    this.arunca(error, 'urcare imagine')
    return `${variabila('PUBLIC_SUPABASE_URL').replace(/\/+$/, '')}/storage/v1/object/public/imagini/blog/${nume}`
  }
}

/* =============================================================================
 *  ALEGEREA
 * ========================================================================== */

let instanta: Depozit | null = null

/** Depozitul potrivit mediului. Arunca daca in productie lipseste Supabase. */
export function depozit(): Depozit {
  if (instanta) return instanta
  if (supabaseLegat()) instanta = new DepozitSupabase()
  else if (inDezvoltare || variabila('DEPOZIT_LOCAL') === '1') instanta = new DepozitLocal()
  else throw new Error('Baza de date nu este configurată (PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  return instanta
}

/** Modul in care lucreaza serverul, pentru cabinet: 'supabase' sau 'local'. */
export function modDepozit(): 'supabase' | 'local' {
  return supabaseLegat() ? 'supabase' : 'local'
}
