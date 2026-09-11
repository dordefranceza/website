/** Conversii intre <input type="datetime-local"> (ora Romaniei) si instante ISO. */
import { localDin, localLaUtc } from '@/lib/timp'

export function isoLaLocal(iso: string): string {
  if (!iso) return ''
  const p = localDin(new Date(iso))
  return `${p.data}T${String(p.ora).padStart(2, '0')}:${String(p.minut).padStart(2, '0')}`
}

export function localLaIso(valoare: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(valoare)
  if (!m) return ''
  return localLaUtc(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])).toISOString()
}

/** Inceputul si sfarsitul unei zile locale, ca ISO. */
export function ziIntreaga(cheieZi: string): { deLa: string; panaLa: string } {
  const [a, l, z] = cheieZi.split('-').map(Number)
  return { deLa: localLaUtc(a, l, z, 0, 0).toISOString(), panaLa: localLaUtc(a, l, z, 23, 59).toISOString() }
}
