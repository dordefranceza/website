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
import type { Blocaj, CerereProgramare, Client, Disponibilitate, Programare, Setari, StareProgramare } from '../lib/tipuri'
import { SETARI_IMPLICITE } from '../lib/tipuri'
import { inDezvoltare, supabaseLegat, variabila } from './mediu'

export type FiltruProgramari = { deLa?: string; panaLa?: string; stare?: StareProgramare | 'active' }

export type SchimbariProgramare = Partial<Pick<Programare, 'stare' | 'platit' | 'suma' | 'note' | 'link_zoom' | 'incepe'>>
export type SchimbariClient = Partial<Pick<Client, 'nume' | 'email' | 'telefon' | 'nivel' | 'scop' | 'note'>>

export interface Depozit {
  setari(): Promise<Setari>
  salveazaSetari(s: Partial<Setari>): Promise<Setari>
  disponibilitate(): Promise<Disponibilitate[]>
  salveazaDisponibilitate(reguli: Omit<Disponibilitate, 'id'>[]): Promise<Disponibilitate[]>
  blocaje(): Promise<Blocaj[]>
  adaugaBlocaj(b: Omit<Blocaj, 'id'>): Promise<Blocaj>
  stergeBlocaj(id: string): Promise<void>
  programari(f?: FiltruProgramari): Promise<Programare[]>
  programare(id: string): Promise<Programare | null>
  creeazaProgramare(c: CerereProgramare, extra: { durata_min: number; suma: number; link_zoom: string }): Promise<Programare>
  actualizeazaProgramare(id: string, s: SchimbariProgramare): Promise<Programare>
  clienti(): Promise<Client[]>
  actualizeazaClient(id: string, s: SchimbariClient): Promise<Client>
  esteAdmin(email: string): Promise<boolean>
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
  setari: Setari
  disponibilitate: Disponibilitate[]
  blocaje: Blocaj[]
  clienti: Client[]
  programari: Programare[]
}

const GOL: Fisier = {
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
        setari: { ...SETARI_IMPLICITE, ...(d.setari ?? {}) },
        disponibilitate: d.disponibilitate ?? GOL.disponibilitate,
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
  async creeazaProgramare(c: CerereProgramare, extra: { durata_min: number; suma: number; link_zoom: string }) {
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
      stare: 'noua',
      platit: false,
      suma: extra.suma,
      sursa: c.sursa,
      pagina: c.pagina,
      mesaj: c.mesaj,
      link_zoom: extra.link_zoom,
      note: '',
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
  async actualizeazaClient(idC: string, s: SchimbariClient) {
    const f = this.citeste()
    const c = f.clienti.find((x) => x.id === idC)
    if (!c) throw new Error('Clientul nu există')
    Object.assign(c, s, s.email ? { email: normalizeazaEmail(s.email) } : {})
    this.scrie(f)
    return c
  }
  async esteAdmin() { return true }
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

  private arunca(eroare: { message: string } | null, context: string): void {
    if (eroare) throw new Error(`${context}: ${eroare.message}`)
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
  async creeazaProgramare(c: CerereProgramare, extra: { durata_min: number; suma: number; link_zoom: string }) {
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
        stare: 'noua',
        platit: false,
        suma: extra.suma,
        sursa: c.sursa,
        pagina: c.pagina,
        mesaj: c.mesaj,
        link_zoom: extra.link_zoom,
        note: '',
      })
      .select()
      .single()
    this.arunca(error, 'creare programare')
    return normProgramare({ ...(data as Programare), client })
  }
  async actualizeazaProgramare(idP: string, s: SchimbariProgramare) {
    const { data, error } = await this.sb.from('programari').update(s).eq('id', idP).select('*, client:clienti(*)').single()
    this.arunca(error, 'actualizare programare')
    return normProgramare(data as Programare)
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
    const { data, error } = await this.sb.from('admin_email').select('email').eq('email', normalizeazaEmail(email)).maybeSingle()
    this.arunca(error, 'admin_email')
    return Boolean(data)
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
