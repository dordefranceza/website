/** Primeste o programare din formularul public, o salveaza si trimite emailurile. */
import type { APIRoute } from 'astro'
import { slotEsteLiber } from '../../lib/sloturi'
import { NIVELURI, SCOPURI, TIPURI, type CerereProgramare, type TipProgramare } from '../../lib/tipuri'
import { depozit } from '../../server/depozit'
import { emailConfirmare, emailNotificare, trimite } from '../../server/email'
import { verificaEmail } from '../../server/posta'
import {
  areMirosDeSpam, corpJson, daNu, eroare, ipDin, origineOk, preaDeseDeLa, preaMulte,
  preaRepede, raspunde, text, textLung, telefonValid,
} from '../../server/http'

export const prerender = false

export const GET: APIRoute = () => eroare(405, 'Folosiți POST')

export const POST: APIRoute = async ({ request }) => {
  if (!origineOk(request)) return eroare(403, 'Origine nepermisă')
  const date = await corpJson(request)
  if (!date) return eroare(400, 'Cerere invalidă')

  // Capcanele pentru roboti. Prins, robotul nu afla ca a fost prins: daca i-am
  // spune, ar incerca alta forma pana trece.
  //  1. campul invizibil, pe care un om nu-l vede si deci nu-l completeaza;
  //  2. formularul trimis mai repede decat poate cineva sa-l scrie.
  if (text(date.botcheck, 10)) return raspunde(200, { ok: true })
  if (preaRepede(date.zabovit)) return raspunde(200, { ok: true })

  const tip = text(date.tip, 20) as TipProgramare
  if (!(tip in TIPURI)) return eroare(400, 'Alege tipul lecției')

  const incepe = text(date.incepe, 40)
  const t = Date.parse(incepe)
  if (!Number.isFinite(t)) return eroare(400, 'Alege ziua și ora')

  const cerere: CerereProgramare = {
    tip,
    incepe: new Date(t).toISOString(),
    nume: text(date.nume, 120),
    email: text(date.email, 160).toLowerCase(),
    telefon: text(date.telefon, 40),
    nivel: text(date.nivel, 40),
    scop: text(date.scop, 80),
    mesaj: textLung(date.mesaj, 2000),
    sursa: text(date.sursa, 80),
    pagina: text(date.pagina, 200),
    gdpr: daNu(date.gdpr),
  }

  if (cerere.nume.length < 2) return eroare(400, 'Scrie numele tău')
  if (cerere.telefon && !telefonValid(cerere.telefon)) return eroare(400, 'Numărul de telefon nu pare corect')
  // 3. reclama trimisa de o masina, tot in tacere.
  if (cerere.mesaj && areMirosDeSpam(cerere.mesaj, cerere.nume)) return raspunde(200, { ok: true })
  // Adresa: forma, domeniile de unica folosinta, greselile de tastat, si abia
  // la urma intrebarea catre DNS, singura care costa timp.
  const verdict = await verificaEmail(cerere.email)
  if (!verdict.ok) return raspunde(400, { ok: false, eroare: verdict.motiv, sugestie: verdict.sugestie })
  if (cerere.nivel && !(NIVELURI as readonly string[]).includes(cerere.nivel)) cerere.nivel = ''
  if (cerere.scop && !(SCOPURI as readonly string[]).includes(cerere.scop)) cerere.scop = ''
  if (!cerere.gdpr) return eroare(400, 'Confirmă că ai citit termenii și politica de confidențialitate')

  if (preaMulte(ipDin(request)) || preaDeseDeLa(cerere.email)) {
    return raspunde(429, { ok: false, eroare: 'Prea multe încercări. Reîncearcă peste câteva minute.' }, { 'Retry-After': '600' })
  }

  try {
    const d = depozit()
    const [setari, reguli, blocaje] = await Promise.all([d.setari(), d.disponibilitate(), d.blocaje()])
    if (tip === 'cunoastere' && !setari.cunoastere_activa) return eroare(400, 'Discuția de cunoaștere nu este disponibilă acum')

    const programari = await d.programari({ deLa: new Date().toISOString(), stare: 'active' })
    if (!slotEsteLiber(cerere.incepe, { tip, reguli, blocaje, programari, setari })) {
      return eroare(409, 'Ora aleasă tocmai s-a ocupat. Alege alta, te rog.')
    }

    const programare = await d.creeazaProgramare(cerere, {
      durata_min: TIPURI[tip].durata,
      suma: TIPURI[tip].pret,
      link_zoom: setari.link_zoom,
    })
    const client = programare.client
    if (client) {
      const [n, c] = await Promise.all([trimite(emailNotificare(programare, client, setari)), trimite(emailConfirmare(programare, client, setari))])
      if (!n.ok) console.error('Notificarea nu a plecat', n.motiv)
      if (!c.ok) console.error('Confirmarea nu a plecat', c.motiv)
    }

    return raspunde(200, { ok: true, id: programare.id, incepe: programare.incepe })
  } catch (e) {
    console.error('programare', e)
    return eroare(500, 'Programarea nu a putut fi salvată. Scrie-ne pe WhatsApp.')
  }
}
