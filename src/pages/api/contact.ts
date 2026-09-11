/** Formularul de contact: un mesaj simplu catre Dorina. */
import type { APIRoute } from 'astro'
import { depozit } from '../../server/depozit'
import { emailContact, trimite } from '../../server/email'
import { corpJson, daNu, emailValid, eroare, ipDin, origineOk, preaMulte, raspunde, text, textLung, telefonValid } from '../../server/http'

export const prerender = false

export const GET: APIRoute = () => eroare(405, 'Folosiți POST')

export const POST: APIRoute = async ({ request }) => {
  if (!origineOk(request)) return eroare(403, 'Origine nepermisă')
  const date = await corpJson(request)
  if (!date) return eroare(400, 'Cerere invalidă')
  if (text(date.botcheck, 10)) return raspunde(200, { ok: true })

  const d = {
    nume: text(date.nume, 120),
    email: text(date.email, 160).toLowerCase(),
    telefon: text(date.telefon, 40),
    mesaj: textLung(date.mesaj, 3000),
    sursa: text(date.sursa, 80),
  }
  if (d.nume.length < 2) return eroare(400, 'Scrie numele tău')
  if (!emailValid(d.email)) return eroare(400, 'Adresa de email nu pare corectă')
  if (d.telefon && !telefonValid(d.telefon)) return eroare(400, 'Numărul de telefon nu pare corect')
  if (d.mesaj.length < 5) return eroare(400, 'Scrie un mesaj')
  if (!daNu(date.gdpr)) return eroare(400, 'Trebuie să fii de acord cu prelucrarea datelor')
  if (preaMulte(ipDin(request))) return raspunde(429, { ok: false, eroare: 'Prea multe încercări. Reîncearcă peste câteva minute.' }, { 'Retry-After': '600' })

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
