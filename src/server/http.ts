/** Utilitare comune rutelor din src/pages/api/. */

const EMAIL_VALID = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CONTROL = /[\x00-\x1f\x7f]/g

/**
 * De unde pot veni cererile: site-ul, previzualizarile Vercel si masina de
 * dezvoltare. Orice alta origine e o pagina straina care trimite in numele
 * unui vizitator.
 */
const ORIGINI = [
  /^https:\/\/(www\.)?dordefranceza\.(ro|com|md)$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
]

export function origineOk(request: Request): boolean {
  const origine = request.headers.get('origin') ?? ''
  if (!origine) return request.method === 'GET'
  return ORIGINI.some((r) => r.test(origine))
}

export function raspunde(cod: number, corp: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(corp), {
    status: cod,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  })
}

export function eroare(cod: number, mesaj: string): Response {
  return raspunde(cod, { ok: false, eroare: mesaj })
}

export async function corpJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const citit = await request.json()
    return typeof citit === 'object' && citit !== null ? (citit as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export function text(valoare: unknown, maxim: number): string {
  return typeof valoare === 'string' ? valoare.replace(CONTROL, ' ').trim().slice(0, maxim) : ''
}

export function textLung(valoare: unknown, maxim: number): string {
  return typeof valoare === 'string' ? valoare.replace(/[\x00-\x09\x0b\x0c\x0e-\x1f\x7f]/g, ' ').trim().slice(0, maxim) : ''
}

export function emailValid(e: string): boolean {
  return EMAIL_VALID.test(e)
}

export function telefonValid(t: string): boolean {
  const cifre = t.replace(/\D/g, '')
  return cifre.length >= 6 && cifre.length <= 20 && /^[\d\s+().\-/]+$/.test(t)
}

export function daNu(v: unknown): boolean {
  return v === true || v === 'true' || v === 'on' || v === 1
}

/* --- Frana pe IP ------------------------------------------------------------ */

const PLAFON = 6
const FEREASTRA_MS = 10 * 60 * 1000
const vazute = new Map<string, number[]>()

export function ipDin(request: Request): string {
  return (request.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'necunoscut'
}

export function preaMulte(ip: string): boolean {
  const acum = Date.now()
  const recente = (vazute.get(ip) ?? []).filter((t) => acum - t < FEREASTRA_MS)
  recente.push(acum)
  vazute.set(ip, recente)
  if (vazute.size > 500) {
    for (const [cheie, timpi] of vazute) if (timpi.every((t) => acum - t >= FEREASTRA_MS)) vazute.delete(cheie)
  }
  return recente.length > PLAFON
}
