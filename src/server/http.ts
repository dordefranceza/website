/** Utilitare comune rutelor din src/pages/api/. */

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

export function telefonValid(t: string): boolean {
  const cifre = t.replace(/\D/g, '')
  return cifre.length >= 6 && cifre.length <= 20 && /^[\d\s+().\-/]+$/.test(t)
}

export function daNu(v: unknown): boolean {
  return v === true || v === 'true' || v === 'on' || v === 1
}

/* --- Capcane pentru roboti -------------------------------------------------- */

/**
 * Cat trebuie sa stea un om pe formular inainte sa-l trimita. Doua secunde si
 * jumatate: cine scrie nume, email si un mesaj nu termina mai repede. Robotul
 * care completeaza campurile dintr-o data termina in zeci de milisecunde.
 *
 * Numaram in browser, nu comparam ceasuri: ceasul vizitatorului poate fi
 * oricat de gresit, iar diferenta dintre doua masuratori ale lui e corecta.
 */
const ZABOVIT_MINIM_MS = 2500

export function preaRepede(valoare: unknown): boolean {
  const ms = typeof valoare === 'number' ? valoare : Number(valoare)
  // Fara cifra, nu respingem: poate a picat javascriptul. Celelalte capcane raman.
  if (!Number.isFinite(ms) || ms <= 0) return false
  return ms < ZABOVIT_MINIM_MS
}

/** Linkuri, in orice forma in care le scrie un robot. */
const LINKURI = /(https?:\/\/|www\.|\[url|<a\s|\bhttp\b)/gi
/** Un domeniu scris fara schema: „ceva.com", „ceva.ru/pagina". */
const DOMENIU_GOL = /\b[a-z0-9-]+\.(com|net|org|ru|xyz|top|info|biz|online|site|shop|club|link|click|icu)\b/gi
/**
 * Cuvinte care intr-un formular de lectii de franceza nu au ce cauta. Lista e
 * scurta dinadins: fiecare cuvant in plus e un om adevarat respins pe nedrept.
 */
const CUVINTE = /\b(backlink|guest post|seo (service|expert|agency|ranking)|rank (your|higher)|casino|viagra|cialis|bitcoin investment|crypto investment|forex signal|binary option|loan offer|wire transfer|sex cam|porn)\b/gi

function cate(text: string, tipar: RegExp): number {
  return (text.match(tipar) ?? []).length
}

/**
 * Adevarat cand mesajul arata a reclama trimisa de o masina. Regula e
 * deliberat ingaduitoare: un singur link trece, fiindca un om poate sa-si dea
 * profilul de LinkedIn sau pagina firmei la care lucreaza.
 */
export function areMirosDeSpam(mesaj: string, nume: string): boolean {
  const linkuri = cate(mesaj, LINKURI) + cate(mesaj, DOMENIU_GOL)
  const cuvinte = cate(mesaj, CUVINTE)
  // `cate` foloseste String.match, care nu tine minte pozitia. `.test` pe un
  // tipar cu /g/ ar tine minte si ar raspunde altfel la fiecare a doua chemare.
  if (cate(nume, LINKURI) + cate(nume, DOMENIU_GOL) > 0) return true
  if (linkuri >= 2) return true
  if (linkuri >= 1 && cuvinte >= 1) return true
  if (cuvinte >= 2) return true
  return false
}

/* --- Frana pe IP ------------------------------------------------------------ */

const PLAFON = 6
const FEREASTRA_MS = 10 * 60 * 1000
const vazute = new Map<string, number[]>()

export function ipDin(request: Request): string {
  return (request.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'necunoscut'
}

export function preaMulte(ip: string): boolean {
  return preaDese(vazute, ip, PLAFON, FEREASTRA_MS)
}

/**
 * A doua frana, pe adresa de email. IP-ul se schimba dintr-o apasare pe un
 * telefon; adresa pe care vrea raspunsul, nu.
 */
const PLAFON_EMAIL = 4
const FEREASTRA_EMAIL_MS = 60 * 60 * 1000
const scrise = new Map<string, number[]>()

export function preaDeseDeLa(email: string): boolean {
  return email ? preaDese(scrise, email, PLAFON_EMAIL, FEREASTRA_EMAIL_MS) : false
}

function preaDese(unde: Map<string, number[]>, cheie: string, plafon: number, fereastra: number): boolean {
  const acum = Date.now()
  const recente = (unde.get(cheie) ?? []).filter((t) => acum - t < fereastra)
  recente.push(acum)
  unde.set(cheie, recente)
  if (unde.size > 500) {
    for (const [k, timpi] of unde) if (timpi.every((t) => acum - t >= fereastra)) unde.delete(k)
  }
  return recente.length > plafon
}
