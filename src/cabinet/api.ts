/** Apelurile cabinetului catre /api/cabinet/*, cu token-ul in antet. */
import { token } from './auth'

export class EroareApi extends Error {
  constructor(public cod: number, mesaj: string) {
    super(mesaj)
  }
}

type Optiuni = { metoda?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; corp?: unknown; query?: Record<string, string> }

export async function apel<T = Record<string, unknown>>(actiune: string, o: Optiuni = {}): Promise<T> {
  const t = await token()
  const q = o.query ? `?${new URLSearchParams(o.query)}` : ''
  const r = await fetch(`/api/cabinet/${actiune}${q}`, {
    method: o.metoda ?? 'GET',
    headers: { Authorization: `Bearer ${t}`, ...(o.corp !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: o.corp !== undefined ? JSON.stringify(o.corp) : undefined,
  })
  if (r.status === 401) {
    window.dispatchEvent(new CustomEvent('ddf-iesire'))
    throw new EroareApi(401, 'Sesiunea a expirat. Intră din nou.')
  }
  const d = (await r.json().catch(() => ({}))) as { ok?: boolean; eroare?: string }
  if (!r.ok || d.ok === false) throw new EroareApi(r.status, d.eroare || 'Eroare pe server')
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
