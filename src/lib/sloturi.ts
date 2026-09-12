/**
 * Calculul sloturilor libere. Acelasi cod ruleaza pe server (pentru API) si
 * poate rula in cabinet, ca sa nu existe doua pareri despre ce e liber.
 */
import type { Blocaj, Disponibilitate, OrarZi, Programare, Setari, TipProgramare } from './tipuri'
import { TIPURI } from './tipuri'
import { FUS, desfaZi, localLaUtc, minuteDin, ziUrmatoare } from './timp'

export type OptiuniSloturi = {
  deLa: string
  panaLa: string
  tip: TipProgramare
  reguli: Disponibilitate[]
  /** Zilele cu orar propriu. O zi de aici nu mai asculta de regula saptamanala. */
  orarZi?: OrarZi[]
  blocaje: Blocaj[]
  programari: Pick<Programare, 'incepe' | 'durata_min' | 'stare'>[]
  setari: Setari
  acum?: Date
  fus?: string
}

type Interval = { start: number; sfarsit: number }

function seSuprapun(a: Interval, b: Interval): boolean {
  return a.start < b.sfarsit && b.start < a.sfarsit
}

/**
 * Ora e libera in sensul restrans: nu se loveste de o alta lectie si nu cade
 * intr-un interval blocat. Nu cere si ca ora sa fie in orarul saptamanal.
 *
 * Asta foloseste la propunerile facute de Dorina: ea poate propune si in afara
 * orarului, pentru cineva anume, dar nu are voie sa suprapuna doua lectii.
 */
export function oraNeocupata(
  incepe: string,
  durataMin: number,
  programari: Pick<Programare, 'id' | 'incepe' | 'durata_min' | 'stare'>[],
  blocaje: Blocaj[],
  exceptaId = '',
): boolean {
  const start = Date.parse(incepe)
  if (!Number.isFinite(start)) return false
  const slot: Interval = { start, sfarsit: start + durataMin * 60_000 }

  const ocupate = programari
    .filter((p) => p.stare !== 'anulata' && p.id !== exceptaId)
    .map((p) => ({ start: Date.parse(p.incepe), sfarsit: Date.parse(p.incepe) + p.durata_min * 60_000 }))
  if (ocupate.some((o) => seSuprapun(slot, o))) return false

  const blocate = blocaje.map((b) => ({ start: Date.parse(b.de_la), sfarsit: Date.parse(b.pana_la) }))
  return !blocate.some((b) => seSuprapun(slot, b))
}

/**
 * Sloturile libere pe zile: { 'YYYY-MM-DD': ['2026-09-15T15:00:00.000Z', ...] }.
 * O programare existenta ocupa un pas intreg (lectia plus pauza), indiferent
 * de tipul ei, ca sa nu apara doua lectii lipite.
 */
export function sloturiLibere(o: OptiuniSloturi): Record<string, string[]> {
  const fus = o.fus ?? FUS
  const acum = (o.acum ?? new Date()).getTime()
  const pasMs = Math.max(30, o.setari.pas_minute) * 60_000
  const durataMs = TIPURI[o.tip].durata * 60_000
  const primulPermis = acum + o.setari.preaviz_ore * 3_600_000
  const ultimulPermis = acum + o.setari.orizont_zile * 86_400_000

  const ocupate: Interval[] = [
    ...o.blocaje.map((b) => ({ start: Date.parse(b.de_la), sfarsit: Date.parse(b.pana_la) })),
    ...o.programari
      .filter((p) => p.stare !== 'anulata')
      .map((p) => {
        const start = Date.parse(p.incepe)
        return { start, sfarsit: start + Math.max(p.durata_min * 60_000, pasMs) }
      }),
  ].filter((i) => Number.isFinite(i.start) && Number.isFinite(i.sfarsit))

  const rezultat: Record<string, string[]> = {}
  let zi = o.deLa
  let pazaZile = 0

  while (zi <= o.panaLa && pazaZile++ < 120) {
    const d = desfaZi(zi)
    if (!d) break
    const ziSapt = ((new Date(Date.UTC(d.an, d.luna - 1, d.zi)).getUTCDay() + 6) % 7) + 1
    const sloturi: string[] = []

    /*
     * Ziua cu orar propriu bate saptamana. Nu se aduna cu ea, o inlocuieste:
     * altfel nu s-ar putea inchide o singura marti fara sa se strice toate
     * martile. Un rand cu lista goala inseamna tocmai asta, zi inchisa.
     */
    const proprie = o.orarZi?.find((z) => z.data === zi)
    const intervale = proprie ? proprie.intervale : o.reguli.filter((r) => r.zi === ziSapt)

    for (const regula of intervale) {
      const deLa = minuteDin(regula.de_la)
      const panaLa = minuteDin(regula.pana_la)
      if (!Number.isFinite(deLa) || !Number.isFinite(panaLa)) continue

      for (let m = deLa; m + TIPURI[o.tip].durata <= panaLa; m += pasMs / 60_000) {
        const start = localLaUtc(d.an, d.luna, d.zi, Math.floor(m / 60), m % 60, fus).getTime()
        if (start < primulPermis || start > ultimulPermis) continue
        const slot = { start, sfarsit: start + Math.max(durataMs, pasMs) }
        if (ocupate.some((oc) => seSuprapun(slot, oc))) continue
        sloturi.push(new Date(start).toISOString())
      }
    }

    if (sloturi.length) rezultat[zi] = [...new Set(sloturi)].sort()
    zi = ziUrmatoare(zi)
  }

  return rezultat
}

/** true daca instantul cerut este chiar unul dintre sloturile libere. */
export function slotEsteLiber(incepe: string, o: Omit<OptiuniSloturi, 'deLa' | 'panaLa'>): boolean {
  const t = Date.parse(incepe)
  if (!Number.isFinite(t)) return false
  const zi = new Date(t)
  // Ziua locala a slotului, plus/minus una, ca sa acoperim trecerea peste miezul noptii.
  const parti = new Intl.DateTimeFormat('en-CA', { timeZone: o.fus ?? FUS, year: 'numeric', month: '2-digit', day: '2-digit' }).format(zi)
  const libere = sloturiLibere({ ...o, deLa: ziUrmatoare(parti, -1), panaLa: ziUrmatoare(parti, 1) })
  return Object.values(libere).some((lista) => lista.includes(new Date(t).toISOString()))
}
