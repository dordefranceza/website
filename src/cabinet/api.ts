/** Apelurile cabinetului catre /api/cabinet/*, cu token-ul in antet. */
import { token } from './auth'

export class EroareApi extends Error {
  constructor(public cod: number, mesaj: string) {
    super(mesaj)
  }
}

type Optiuni = { metoda?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; corp?: unknown; query?: Record<string, string> }

/*
 * Memorie scurta pentru citiri.
 *
 * Artiom, de doua ori: „schimb paginile in cabinetul asta personal, cam greu se
 * incarca tot". Nu era codul paginii, era drumul: fiecare pagina isi cerea
 * datele de la capat la fiecare intrare, si pana venea raspunsul de la Supabase
 * ecranul statea gol. Dus-intors intre doua pagini insemna de fiecare data
 * aceeasi asteptare pentru aceleasi date.
 *
 * Acum citirile se tin minte cateva zeci de secunde, deci a doua intrare pe
 * aceeasi pagina e instantanee. Orice scriere sterge tot, ca sa nu ramana pe
 * ecran o cifra veche dupa o salvare.
 */
type Intrare = { cand: number; date: unknown }

/**
 * Ce citiri se invechesc dupa fiecare scriere.
 *
 * Scris pe fata, ca sa se vada dintr-o privire ce atinge ce. Ce nu e in lista
 * sterge tot, adica varianta prudenta pentru orice actiune noua.
 */
const LEGATURI: Record<string, string[]> = {
  programare: ['programari', 'sumar', 'clienti'],
  propune: ['programari', 'sumar', 'clienti'],
  'trimite-link': ['programari'],
  'orar-zi': ['orar-zi'],
  disponibilitate: ['disponibilitate'],
  blocaj: ['blocaje'],
  setari: ['setari'],
  client: ['clienti', 'sumar'],
  pachet: ['clienti'],
  grupa: ['grupe', 'programari', 'sumar'],
  'grupa-cursant': ['grupe', 'programari', 'clienti', 'sumar'],
  articol: ['articole'],
}

const memorie = new Map<string, Intrare>()
const VIATA = 120_000

/** Uita tot ce s-a citit. Se cheama dupa fiecare scriere si la iesirea din cont. */
export function uitaCitirile(): void {
  memorie.clear()
}

/**
 * Cere din vreme datele paginilor pe care nu esti inca, cat timp te uiti la
 * prima. Cand ajungi la ele, sunt deja acolo.
 */
export function incalzeste(actiuni: string[] = ['setari', 'clienti', 'blocaje', 'disponibilitate']): void {
  const porneste = () => {
    for (const a of actiuni) void apel(a).catch(() => {})
  }
  /* `in window` ingusteaza tipul pana la `never` pe ramura cealalta, deci
     luam functia direct si o intrebam daca exista. */
  const candELiniste = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => void }).requestIdleCallback
  if (candELiniste) candELiniste(porneste, { timeout: 2000 })
  else window.setTimeout(porneste, 600)
}

export async function apel<T = Record<string, unknown>>(actiune: string, o: Optiuni = {}): Promise<T> {
  const metoda = o.metoda ?? 'GET'
  const cheie = `${actiune}?${new URLSearchParams(o.query ?? {})}`
  if (metoda === 'GET') {
    const tinuta = memorie.get(cheie)
    if (tinuta && Date.now() - tinuta.cand < VIATA) return tinuta.date as T
  }

  const t = await token()
  const q = o.query ? `?${new URLSearchParams(o.query)}` : ''
  const r = await fetch(`/api/cabinet/${actiune}${q}`, {
    method: o.metoda ?? 'GET',
    headers: { Authorization: `Bearer ${t}`, ...(o.corp !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: o.corp !== undefined ? JSON.stringify(o.corp) : undefined,
  })
  if (r.status === 401) {
    uitaCitirile()
    window.dispatchEvent(new CustomEvent('ddf-iesire'))
    throw new EroareApi(401, 'Sesiunea a expirat. Intră din nou.')
  }
  const d = (await r.json().catch(() => ({}))) as { ok?: boolean; eroare?: string }
  if (!r.ok || d.ok === false) throw new EroareApi(r.status, d.eroare || 'Eroare pe server')

  if (metoda === 'GET') memorie.set(cheie, { cand: Date.now(), date: d })
  else {
    /*
     * Dupa o scriere se sterg doar citirile atinse de ea, nu toate.
     * Inainte se golea tot, deci o singura salvare facea ca fiecare pagina sa
     * ceara iar totul de la capat, si cabinetul parea greu fara motiv.
     */
    for (const a of LEGATURI[actiune] ?? ['*']) {
      if (a === '*') memorie.clear()
      else for (const k of [...memorie.keys()]) if (k.startsWith(`${a}?`)) memorie.delete(k)
    }
  }
  return d as T
}

/** Descarca exportul CSV cu token, pentru ca un link simplu nu poate purta antetul. */
export async function descarcaExport(): Promise<void> {
  const t = await token()
  const r = await fetch('/api/cabinet/export', { headers: { Authorization: `Bearer ${t}` } })
  if (!r.ok) throw new EroareApi(r.status, 'Exportul nu a reușit')
  const blob = await r.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (r.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'programari.csv')
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Urca un fisier (imagine) prin multipart si intoarce adresa publica. */
export async function urcaImagine(fisier: File): Promise<string> {
  const t = await token()
  const form = new FormData()
  form.append('fisier', fisier)
  const r = await fetch('/api/cabinet/imagine', { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: form })
  const d = (await r.json().catch(() => ({}))) as { ok?: boolean; url?: string; eroare?: string }
  if (!r.ok || !d.ok || !d.url) throw new EroareApi(r.status, d.eroare || 'Imaginea nu a putut fi urcată')
  return d.url
}
