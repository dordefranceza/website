/**
 * Ore si date in fusul Romaniei, fara biblioteci. Programarile se pastreaza
 * ca instante UTC (ISO) si se afiseaza mereu in Europe/Bucharest.
 */

export const FUS = 'Europe/Bucharest'

type Parti = { an: number; luna: number; zi: number; ora: number; minut: number; secunda: number }

function partiIn(instant: Date, fus: string): Parti {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: fus,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)
  const ia = (tip: string) => Number(p.find((x) => x.type === tip)?.value ?? 0)
  return { an: ia('year'), luna: ia('month'), zi: ia('day'), ora: ia('hour') % 24, minut: ia('minute'), secunda: ia('second') }
}

/** Decalajul fusului fata de UTC la un anumit instant, in milisecunde. */
function decalaj(instant: Date, fus: string): number {
  const p = partiIn(instant, fus)
  return Date.UTC(p.an, p.luna - 1, p.zi, p.ora, p.minut, p.secunda) - instant.getTime()
}

/** Ora locala (an, luna, zi, ora, minut) -> instant UTC. Corect si la schimbarea orei. */
export function localLaUtc(an: number, luna: number, zi: number, ora: number, minut: number, fus = FUS): Date {
  const ghicit = Date.UTC(an, luna - 1, zi, ora, minut)
  const d1 = decalaj(new Date(ghicit), fus)
  let utc = ghicit - d1
  const d2 = decalaj(new Date(utc), fus)
  if (d2 !== d1) utc = ghicit - d2
  return new Date(utc)
}

/** Partile locale ale unui instant, plus ziua saptamanii ISO (1 = luni ... 7 = duminica). */
export function localDin(instant: Date | string, fus = FUS): Parti & { ziSapt: number; data: string } {
  const p = partiIn(new Date(instant), fus)
  const ziJs = new Date(Date.UTC(p.an, p.luna - 1, p.zi)).getUTCDay()
  return { ...p, ziSapt: ziJs === 0 ? 7 : ziJs, data: cheieZi(p.an, p.luna, p.zi) }
}

export function cheieZi(an: number, luna: number, zi: number): string {
  return `${an}-${String(luna).padStart(2, '0')}-${String(zi).padStart(2, '0')}`
}

/** 'YYYY-MM-DD' -> { an, luna, zi }. Null daca nu e o zi valida. */
export function desfaZi(cheie: string): { an: number; luna: number; zi: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cheie)
  if (!m) return null
  const an = Number(m[1]), luna = Number(m[2]), zi = Number(m[3])
  if (luna < 1 || luna > 12 || zi < 1 || zi > 31) return null
  return { an, luna, zi }
}

/** 'HH:MM' -> minute de la miezul noptii. */
export function minuteDin(ora: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(ora)
  if (!m) return NaN
  return Number(m[1]) * 60 + Number(m[2])
}

/** Ziua urmatoare (in cheie 'YYYY-MM-DD'), pe calendarul UTC ca sa nu conteze fusul. */
export function ziUrmatoare(cheie: string, pasZile = 1): string {
  const d = desfaZi(cheie)
  if (!d) return cheie
  const t = new Date(Date.UTC(d.an, d.luna - 1, d.zi + pasZile))
  return cheieZi(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())
}

/* --- Afisare in romana ----------------------------------------------------- */

const ZILE = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă']
const ZILE_SCURT = ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ']
const LUNI = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie']

export function oraRo(instant: Date | string, fus = FUS): string {
  const p = localDin(new Date(instant), fus)
  return `${String(p.ora).padStart(2, '0')}:${String(p.minut).padStart(2, '0')}`
}

/** "marți, 15 septembrie 2026" */
export function dataRo(instant: Date | string, fus = FUS): string {
  const p = localDin(new Date(instant), fus)
  return `${ZILE[p.ziSapt % 7]}, ${p.zi} ${LUNI[p.luna - 1]} ${p.an}`
}

/** "marți, 15 septembrie 2026, 18:00" */
export function dataOraRo(instant: Date | string, fus = FUS): string {
  return `${dataRo(instant, fus)}, ${oraRo(instant, fus)}`
}

/** "Ma 15 sept." */
export function dataScurtaRo(instant: Date | string, fus = FUS): string {
  const p = localDin(new Date(instant), fus)
  return `${ZILE_SCURT[p.ziSapt % 7]} ${p.zi} ${LUNI[p.luna - 1].slice(0, 3)}.`
}

export function numeLuna(luna: number): string {
  return LUNI[luna - 1] ?? ''
}

export function numeZi(ziSapt: number): string {
  return ZILE[ziSapt % 7] ?? ''
}

/** Luna calendaristica in care cade un instant, ca 'YYYY-MM'. */
export function cheieLuna(instant: Date | string, fus = FUS): string {
  const p = localDin(new Date(instant), fus)
  return `${p.an}-${String(p.luna).padStart(2, '0')}`
}
