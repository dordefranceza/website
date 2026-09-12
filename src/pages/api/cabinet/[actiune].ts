/**
 * =============================================================================
 *  API-UL CABINETULUI
 * =============================================================================
 *  Toate cererile cabinetului trec pe aici, cu token-ul de autentificare in
 *  antetul Authorization. Serverul verifica cine e (autentificare.ts) si abia
 *  apoi citeste sau scrie prin depozit.
 *
 *  GET    sumar            cifrele tabloului de bord
 *  GET    programari       ?deLa=ISO&panaLa=ISO&stare=
 *  PATCH  programare       { id, stare?, platit?, suma?, note?, link_zoom?, incepe? }
 *  POST   trimite-link     { id, link? }  trimite linkul de Zoom cursantului
 *  GET    clienti
 *  PATCH  client           { id, ...campuri }
 *  GET    disponibilitate  / PUT { reguli: [...] }
 *  GET    blocaje          / POST { de_la, pana_la, motiv } / DELETE ?id=
 *  GET    setari           / PATCH { ...campuri }
 *  GET    export           CSV cu programarile (se deschide in Excel)
 *  GET    articole         toate articolele, publicate sau nu
 *  POST   articol          { id?, titlu, slug, rezumat, continut, imagine, ... } creeaza sau salveaza
 *  DELETE articol          ?id=
 *  POST   imagine          multipart, campul "fisier"; intoarce { url }
 * =============================================================================
 */
import type { APIRoute } from 'astro'
import type { ArticolSchimbari, Blocaj, Disponibilitate, Programare, Setari, StareProgramare, TipProgramare } from '../../../lib/tipuri'
import { TIPURI } from '../../../lib/tipuri'
import { oraNeocupata } from '../../../lib/sloturi'
import { cheieLuna, dataOraRo, localDin, minuteDin } from '../../../lib/timp'
import { adminDin } from '../../../server/autentificare'
import { depozit, modDepozit, type SchimbariClient, type SchimbariProgramare } from '../../../server/depozit'
import { emailLinkZoom, emailPropunere, trimite } from '../../../server/email'
import { slugDin, textSimplu } from '../../../server/markdown'
import { corpJson, emailValid, eroare, origineOk, raspunde, text, textLung } from '../../../server/http'

export const prerender = false

const STARI: StareProgramare[] = ['noua', 'confirmata', 'anulata', 'finalizata']

async function sumar() {
  const d = depozit()
  const acum = new Date()
  const azi = localDin(acum).data
  const lunaAsta = cheieLuna(acum)
  const [toate, clienti] = await Promise.all([d.programari(), d.clienti()])
  const active = toate.filter((p) => p.stare !== 'anulata')
  const inLuna = active.filter((p) => cheieLuna(p.incepe) === lunaAsta)
  const lunaTrecuta = (() => {
    const p = localDin(acum)
    const luna = p.luna === 1 ? 12 : p.luna - 1
    const an = p.luna === 1 ? p.an - 1 : p.an
    return `${an}-${String(luna).padStart(2, '0')}`
  })()
  const inLunaTrecuta = active.filter((p) => cheieLuna(p.incepe) === lunaTrecuta)

  const surse = new Map<string, number>()
  for (const c of clienti) surse.set(c.sursa || 'direct', (surse.get(c.sursa || 'direct') ?? 0) + 1)

  const pe12Luni: { luna: string; lectii: number; incasat: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const p = localDin(acum)
    const t = new Date(Date.UTC(p.an, p.luna - 1 - i, 1))
    const cheie = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}`
    const ale = active.filter((x) => cheieLuna(x.incepe) === cheie)
    pe12Luni.push({ luna: cheie, lectii: ale.length, incasat: ale.filter((x) => x.platit).reduce((s, x) => s + x.suma, 0) })
  }

  return {
    mod: modDepozit(),
    noi: toate.filter((p) => p.stare === 'noua').length,
    azi: active.filter((p) => localDin(p.incepe).data === azi),
    urmatoarele: active.filter((p) => p.incepe >= acum.toISOString()).slice(0, 6),
    luna: {
      cheie: lunaAsta,
      lectii: inLuna.length,
      incasat: inLuna.filter((p) => p.platit).reduce((s, p) => s + p.suma, 0),
      deIncasat: inLuna.filter((p) => !p.platit && p.stare !== 'anulata').reduce((s, p) => s + p.suma, 0),
      clientiNoi: clienti.filter((c) => cheieLuna(c.creat) === lunaAsta).length,
      lunaTrecuta: { lectii: inLunaTrecuta.length, incasat: inLunaTrecuta.filter((p) => p.platit).reduce((s, p) => s + p.suma, 0) },
    },
    surse: [...surse.entries()].map(([sursa, n]) => ({ sursa, n })).sort((a, b) => b.n - a.n),
    pe12Luni,
    clienti: clienti.length,
  }
}

function csv(programari: Programare[]): string {
  const cap = ['Data si ora', 'Tip', 'Durata (min)', 'Stare', 'Platit', 'Suma', 'Nume', 'Email', 'Telefon', 'Nivel', 'Scop', 'Sursa', 'Note']
  const celula = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const linii = programari.map((p) =>
    [
      dataOraRo(p.incepe),
      TIPURI[p.tip]?.nume ?? p.tip,
      p.durata_min,
      p.stare,
      p.platit ? 'da' : 'nu',
      p.suma,
      p.client?.nume ?? '',
      p.client?.email ?? '',
      p.client?.telefon ?? '',
      p.client?.nivel ?? '',
      p.client?.scop ?? '',
      p.sursa,
      p.note,
    ]
      .map(celula)
      .join(';'),
  )
  // BOM-ul face Excel sa citeasca diacriticele corect.
  return '﻿' + [cap.map(celula).join(';'), ...linii].join('\r\n')
}

const gestioneaza: APIRoute = async ({ request, params, url }) => {
  if (!origineOk(request)) return eroare(403, 'Origine nepermisă')
  const admin = await adminDin(request)
  if (!admin) return eroare(401, 'Neautentificat')

  const actiune = params.actiune ?? ''
  const metoda = request.method
  const d = depozit()

  try {
    if (actiune === 'sumar' && metoda === 'GET') return raspunde(200, { ok: true, ...(await sumar()) })

    if (actiune === 'programari' && metoda === 'GET') {
      const stare = url.searchParams.get('stare') ?? ''
      const lista = await d.programari({
        deLa: url.searchParams.get('deLa') ?? undefined,
        panaLa: url.searchParams.get('panaLa') ?? undefined,
        stare: stare === 'active' || STARI.includes(stare as StareProgramare) ? (stare as StareProgramare | 'active') : undefined,
      })
      return raspunde(200, { ok: true, programari: lista })
    }

    if (actiune === 'programare' && metoda === 'PATCH') {
      const b = (await corpJson(request)) ?? {}
      const id = text(b.id, 60)
      if (!id) return eroare(400, 'Lipsește id')
      const s: SchimbariProgramare = {}
      if (typeof b.stare === 'string' && STARI.includes(b.stare as StareProgramare)) s.stare = b.stare as StareProgramare
      if (typeof b.platit === 'boolean') s.platit = b.platit
      if (typeof b.suma === 'number' && Number.isFinite(b.suma) && b.suma >= 0) s.suma = Math.round(b.suma * 100) / 100
      if (typeof b.note === 'string') s.note = textLung(b.note, 2000)
      if (typeof b.link_zoom === 'string') s.link_zoom = text(b.link_zoom, 300)
      if (typeof b.incepe === 'string' && Number.isFinite(Date.parse(b.incepe))) s.incepe = new Date(b.incepe).toISOString()
      return raspunde(200, { ok: true, programare: await d.actualizeazaProgramare(id, s) })
    }

    if (actiune === 'trimite-link' && metoda === 'POST') {
      const b = (await corpJson(request)) ?? {}
      const p = await d.programare(text(b.id, 60))
      if (!p || !p.client) return eroare(404, 'Programarea nu există')
      const setari = await d.setari()
      const link = text(b.link, 300) || p.link_zoom || setari.link_zoom
      if (!link) return eroare(400, 'Nu există niciun link de Zoom. Pune-l în Setări.')
      if (link !== p.link_zoom) await d.actualizeazaProgramare(p.id, { link_zoom: link })
      const r = await trimite(emailLinkZoom(p, p.client, link))
      if (!r.ok) return eroare(502, 'Emailul nu a plecat')
      return raspunde(200, { ok: true })
    }

    /**
     * Propunerea de lectie: Dorina alege omul si ora, cursantul confirma
     * dintr-un clic. Ora nu se blocheaza pana la confirmare, deci se verifica
     * din nou atunci, nu acum.
     */
    if (actiune === 'propune' && metoda === 'POST') {
      const b = (await corpJson(request)) ?? {}
      const tip = text(b.tip, 20) as TipProgramare
      if (!(tip in TIPURI)) return eroare(400, 'Tip necunoscut')
      const incepe = text(b.incepe, 40)
      if (!Number.isFinite(Date.parse(incepe))) return eroare(400, 'Data nu e bună')
      if (Date.parse(incepe) < Date.now()) return eroare(400, 'Ora propusă e în trecut')

      const nume = text(b.nume, 120)
      const email = text(b.email, 160).toLowerCase()
      if (nume.length < 2) return eroare(400, 'Scrie numele cursantului')
      if (!emailValid(email)) return eroare(400, 'Adresa de email nu pare corectă')

      const setari = await d.setari()
      const t = TIPURI[tip]

      // Orarul saptamanal nu conteaza aici: Dorina are voie sa propuna si in
      // afara lui. Ce nu are voie e sa suprapuna doua lectii sau sa cada peste
      // un interval pe care tot ea l-a blocat.
      const [blocaje, active] = await Promise.all([d.blocaje(), d.programari({ deLa: new Date().toISOString(), stare: 'active' })])
      if (!oraNeocupata(new Date(incepe).toISOString(), t.durata, active, blocaje)) {
        return eroare(409, 'Ora asta e deja ocupată sau cade într-un interval blocat.')
      }

      const token = crypto.randomUUID().replace(/-/g, '')
      const expira = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()

      const p = await d.creeazaProgramare(
        {
          tip,
          incepe: new Date(incepe).toISOString(),
          nume,
          email,
          telefon: text(b.telefon, 40),
          nivel: text(b.nivel, 60),
          scop: text(b.scop, 120),
          mesaj: '',
          sursa: 'propusa-de-dorina',
          pagina: '/admin/',
          gdpr: true,
        },
        { durata_min: t.durata, suma: t.pret, link_zoom: setari.link_zoom, stare: 'propusa', token, tokenExpira: expira },
      )
      if (!p.client) return eroare(500, 'Cursantul nu s-a salvat')

      const r = await trimite(emailPropunere(p, p.client, setari, textLung(b.mesaj, 600)))
      if (!r.ok) {
        await d.actualizeazaProgramare(p.id, { stare: 'anulata' })
        return eroare(502, 'Emailul nu a plecat, așa că propunerea a fost anulată. Încearcă din nou.')
      }
      return raspunde(200, { ok: true, programare: p })
    }

    if (actiune === 'clienti' && metoda === 'GET') {
      const [clienti, programari] = await Promise.all([d.clienti(), d.programari()])
      const cu = clienti.map((c) => {
        const ale = programari.filter((p) => p.client_id === c.id && p.stare !== 'anulata')
        return { ...c, lectii: ale.length, platit: ale.filter((p) => p.platit).reduce((s, p) => s + p.suma, 0), ultima: ale.at(-1)?.incepe ?? null }
      })
      return raspunde(200, { ok: true, clienti: cu })
    }

    if (actiune === 'client' && metoda === 'PATCH') {
      const b = (await corpJson(request)) ?? {}
      const id = text(b.id, 60)
      if (!id) return eroare(400, 'Lipsește id')
      const s: SchimbariClient = {}
      for (const camp of ['nume', 'email', 'telefon', 'nivel', 'scop'] as const) if (typeof b[camp] === 'string') s[camp] = text(b[camp], 160)
      if (typeof b.note === 'string') s.note = textLung(b.note, 4000)
      return raspunde(200, { ok: true, client: await d.actualizeazaClient(id, s) })
    }

    if (actiune === 'disponibilitate' && metoda === 'GET') return raspunde(200, { ok: true, reguli: await d.disponibilitate() })
    if (actiune === 'disponibilitate' && metoda === 'PUT') {
      const b = (await corpJson(request)) ?? {}
      const brute = Array.isArray(b.reguli) ? (b.reguli as unknown[]) : []
      const reguli: Omit<Disponibilitate, 'id'>[] = []
      for (const r of brute.slice(0, 60)) {
        const o = (r ?? {}) as Record<string, unknown>
        const zi = Number(o.zi)
        const deLa = text(o.de_la, 5)
        const panaLa = text(o.pana_la, 5)
        if (zi < 1 || zi > 7 || !Number.isFinite(minuteDin(deLa)) || !Number.isFinite(minuteDin(panaLa))) continue
        if (minuteDin(deLa) >= minuteDin(panaLa)) continue
        reguli.push({ zi, de_la: deLa, pana_la: panaLa })
      }
      return raspunde(200, { ok: true, reguli: await d.salveazaDisponibilitate(reguli) })
    }

    if (actiune === 'blocaje' && metoda === 'GET') return raspunde(200, { ok: true, blocaje: await d.blocaje() })
    if (actiune === 'blocaj' && metoda === 'POST') {
      const b = (await corpJson(request)) ?? {}
      const deLa = Date.parse(text(b.de_la, 40))
      const panaLa = Date.parse(text(b.pana_la, 40))
      if (!Number.isFinite(deLa) || !Number.isFinite(panaLa) || panaLa <= deLa) return eroare(400, 'Interval invalid')
      const nou: Omit<Blocaj, 'id'> = { de_la: new Date(deLa).toISOString(), pana_la: new Date(panaLa).toISOString(), motiv: text(b.motiv, 120) }
      return raspunde(200, { ok: true, blocaj: await d.adaugaBlocaj(nou) })
    }
    if (actiune === 'blocaj' && metoda === 'DELETE') {
      const id = url.searchParams.get('id') ?? ''
      if (!id) return eroare(400, 'Lipsește id')
      await d.stergeBlocaj(id)
      return raspunde(200, { ok: true })
    }

    if (actiune === 'setari' && metoda === 'GET') return raspunde(200, { ok: true, setari: await d.setari(), admin: admin.email, mod: modDepozit() })
    if (actiune === 'setari' && metoda === 'PATCH') {
      const b = (await corpJson(request)) ?? {}
      const s: Partial<Setari> = {}
      if (typeof b.link_zoom === 'string') s.link_zoom = text(b.link_zoom, 300)
      if (typeof b.email_notificari === 'string') s.email_notificari = text(b.email_notificari, 160).toLowerCase()
      if (typeof b.cunoastere_activa === 'boolean') s.cunoastere_activa = b.cunoastere_activa
      if (typeof b.preaviz_ore === 'number' && b.preaviz_ore >= 0 && b.preaviz_ore <= 168) s.preaviz_ore = Math.round(b.preaviz_ore)
      if (typeof b.orizont_zile === 'number' && b.orizont_zile >= 1 && b.orizont_zile <= 120) s.orizont_zile = Math.round(b.orizont_zile)
      if (typeof b.pas_minute === 'number' && [30, 45, 60, 75, 90].includes(b.pas_minute)) s.pas_minute = b.pas_minute
      return raspunde(200, { ok: true, setari: await d.salveazaSetari(s) })
    }

    if (actiune === 'export' && metoda === 'GET') {
      const lista = await d.programari()
      return new Response(csv(lista), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="programari-${localDin(new Date()).data}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    if (actiune === 'articole' && metoda === 'GET') return raspunde(200, { ok: true, articole: await d.articole(false) })

    if (actiune === 'articol' && metoda === 'POST') {
      const b = (await corpJson(request)) ?? {}
      const id = text(b.id, 60) || null
      const s: ArticolSchimbari = {}
      if (typeof b.titlu === 'string') s.titlu = text(b.titlu, 160)
      if (typeof b.slug === 'string') s.slug = slugDin(b.slug) || (s.titlu ? slugDin(s.titlu) : '')
      else if (!id && s.titlu) s.slug = slugDin(s.titlu)
      if (typeof b.rezumat === 'string') s.rezumat = textLung(b.rezumat, 400)
      if (typeof b.continut === 'string') s.continut = textLung(b.continut, 60_000)
      if (typeof b.imagine === 'string') s.imagine = text(b.imagine, 400)
      if (typeof b.imagine_alt === 'string') s.imagine_alt = text(b.imagine_alt, 200)
      if (typeof b.meta_titlu === 'string') s.meta_titlu = text(b.meta_titlu, 70)
      if (typeof b.meta_descriere === 'string') s.meta_descriere = text(b.meta_descriere, 170)
      if (typeof b.publicat === 'boolean') s.publicat = b.publicat
      if (s.publicat) {
        const titlu = s.titlu ?? (id ? (await d.articol(id))?.titlu : '')
        const slug = s.slug ?? (id ? (await d.articol(id))?.slug : '')
        if (!titlu) return eroare(400, 'Articolul are nevoie de un titlu ca să fie publicat')
        if (!slug) return eroare(400, 'Articolul are nevoie de o adresă (slug) ca să fie publicat')
      }
      if (s.continut !== undefined && !s.rezumat && !(id && (await d.articol(id))?.rezumat)) s.rezumat = textSimplu(s.continut, 200)
      return raspunde(200, { ok: true, articol: await d.salveazaArticol(id, s) })
    }

    if (actiune === 'articol' && metoda === 'DELETE') {
      const id = url.searchParams.get('id') ?? ''
      if (!id) return eroare(400, 'Lipsește id')
      await d.stergeArticol(id)
      return raspunde(200, { ok: true })
    }

    if (actiune === 'imagine' && metoda === 'POST') {
      const form = await request.formData().catch(() => null)
      const fisier = form?.get('fisier')
      if (!(fisier instanceof File)) return eroare(400, 'Lipsește fișierul')
      const TIPURI_OK: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' }
      const ext = TIPURI_OK[fisier.type]
      if (!ext) return eroare(400, 'Doar imagini JPG, PNG, WebP, AVIF sau GIF')
      if (fisier.size > 6 * 1024 * 1024) return eroare(400, 'Imaginea are peste 6 MB. Micșoreaz-o înainte.')
      const nume = `${localDin(new Date()).data}-${crypto.randomUUID().slice(0, 8)}.${ext}`
      const urlImagine = await d.urcaImagine(nume, fisier.type, new Uint8Array(await fisier.arrayBuffer()))
      return raspunde(200, { ok: true, url: urlImagine })
    }

    return eroare(404, 'Acțiune necunoscută')
  } catch (e) {
    console.error('cabinet', actiune, e)
    const mesaj = e instanceof Error ? e.message : 'Eroare pe server'
    return eroare(/^Există deja/.test(mesaj) ? 409 : 500, mesaj)
  }
}

export const GET = gestioneaza
export const POST = gestioneaza
export const PATCH = gestioneaza
export const PUT = gestioneaza
export const DELETE = gestioneaza
