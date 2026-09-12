/** Formularul de contact: un mesaj simplu catre Dorina. */
import type { APIRoute } from 'astro'
import { depozit } from '../../server/depozit'
import { emailContact, trimite } from '../../server/email'
import { verificaEmail } from '../../server/posta'
import {
  areMirosDeSpam, corpJson, daNu, eroare, ipDin, origineOk, preaDeseDeLa, preaMulte,
  preaRepede, raspunde, text, textLung, telefonValid,
} from '../../server/http'

export const prerender = false

export const GET: APIRoute = () => eroare(405, 'Folosiți POST')

/**
 * Robotul prins nu afla ca a fost prins: ii raspundem „gata, am primit".
 * Daca i-am spune adevarul, ar incerca alta forma pana trece.
 */
const TACERE = () => raspunde(200, { ok: true })

export const POST: APIRoute = async ({ request }) => {
  if (!origineOk(request)) return eroare(403, 'Origine nepermisă')
  const date = await corpJson(request)
  if (!date) return eroare(400, 'Cerere invalidă')

  // Capcana 1: campul invizibil. Un om nu-l vede, deci nu-l completeaza.
  if (text(date.botcheck, 10)) return TACERE()
  // Capcana 2: formularul trimis mai repede decat poate cineva sa-l scrie.
  if (preaRepede(date.zabovit)) return TACERE()

  const d = {
    nume: text(date.nume, 120),
    email: text(date.email, 160).toLowerCase(),
    telefon: text(date.telefon, 40),
    mesaj: textLung(date.mesaj, 3000),
    sursa: text(date.sursa, 80),
  }
  if (d.nume.length < 2) return eroare(400, 'Scrie numele tău')
  if (d.mesaj.length < 5) return eroare(400, 'Scrie un mesaj')
  if (!daNu(date.gdpr)) return eroare(400, 'Confirmă că ai citit politica de confidențialitate')
  if (d.telefon && !telefonValid(d.telefon)) return eroare(400, 'Numărul de telefon nu pare corect')

  // Capcana 3: reclama trimisa de o masina. Tot in tacere.
  if (areMirosDeSpam(d.mesaj, d.nume)) return TACERE()

  // Adresa: forma, domeniile de unica folosinta, greselile de tastat, si abia
  // la urma intrebarea catre DNS, care e singura care costa timp.
  const verdict = await verificaEmail(d.email)
  if (!verdict.ok) return raspunde(400, { ok: false, eroare: verdict.motiv, sugestie: verdict.sugestie })

  if (preaMulte(ipDin(request)) || preaDeseDeLa(d.email)) {
    return raspunde(429, { ok: false, eroare: 'Prea multe încercări. Reîncearcă peste câteva minute.' }, { 'Retry-After': '600' })
  }

  try {
    const setari = await depozit().setari()
    const r = await trimite(emailContact(d, setari))
    if (!r.ok) return eroare(502, 'Mesajul nu a putut fi trimis. Scrie-ne pe WhatsApp.')
    return raspunde(200, { ok: true })
  } catch (e) {
    console.error('contact', e)
    return eroare(500, 'Mesajul nu a putut fi trimis. Scrie-ne pe WhatsApp.')
  }
}
