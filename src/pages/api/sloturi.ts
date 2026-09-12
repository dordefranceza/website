/** Sloturile libere pentru formularul public de programare. */
import type { APIRoute } from 'astro'
import { sloturiLibere } from '../../lib/sloturi'
import { TIPURI, type TipProgramare } from '../../lib/tipuri'
import { localDin, ziUrmatoare } from '../../lib/timp'
import { depozit } from '../../server/depozit'
import { eroare, raspunde } from '../../server/http'

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  const tip = (url.searchParams.get('tip') ?? 'individual') as TipProgramare
  if (!(tip in TIPURI)) return eroare(400, 'Tip necunoscut')

  try {
    const d = depozit()
    const [setari, reguli, blocaje] = await Promise.all([d.setari(), d.disponibilitate(), d.blocaje()])
    if (tip === 'cunoastere' && !setari.cunoastere_activa) return eroare(400, 'Discuția de cunoaștere nu este disponibilă acum')

    const acum = new Date()
    const azi = localDin(acum).data
    const panaLa = ziUrmatoare(azi, setari.orizont_zile)
    const programari = await d.programari({ deLa: acum.toISOString(), stare: 'active' })

    // Zilele cu orar propriu se cer doar pentru fereastra ceruta, nu tot anul.
    const orarZi = await d.orarZi(azi, panaLa)

    const zile = sloturiLibere({ deLa: azi, panaLa, tip, reguli, orarZi, blocaje, programari, setari, acum })
    return raspunde(200, { ok: true, zile, durata: TIPURI[tip].durata, preaviz_ore: setari.preaviz_ore, orizont_zile: setari.orizont_zile })
  } catch (e) {
    console.error('sloturi', e)
    return eroare(500, 'Calendarul nu poate fi citit acum')
  }
}
