/**
 * =============================================================================
 *  EMAILURI, PRIN RESEND
 * =============================================================================
 *  Variabile: RESEND_API_KEY, EMAIL_DE (expeditor pe un domeniu verificat in
 *  Resend), EMAIL_DORINA (unde ajung notificarile; setarea din cabinet are
 *  prioritate). Fara cheie, in dezvoltare, emailurile se scriu in
 *  .local/emailuri.json ca sa poata fi verificate.
 * =============================================================================
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Client, Programare, Setari } from '../lib/tipuri'
import { TIPURI } from '../lib/tipuri'
import { dataOraRo, dataRo, oraRo } from '../lib/timp'
import { adresaSite, inDezvoltare, variabila } from './mediu'

export type Email = { catre: string[]; subiect: string; text: string; html: string; raspundeLa?: string }

const NAVY = '#1b1463'
const CERNEALA = '#080331'
const CREM = '#f8f3eb'
const ALBASTRU = '#4865ff'
const GRI = '#5b5a75'

function scapa(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Trimite un email. Nu arunca niciodata: intoarce ok=false si motivul. */
export async function trimite(e: Email): Promise<{ ok: boolean; motiv?: string }> {
  const cheie = variabila('RESEND_API_KEY')
  const de = variabila('EMAIL_DE')

  if (!cheie || !de) {
    if (inDezvoltare) {
      const dosar = join(process.cwd(), '.local')
      mkdirSync(dosar, { recursive: true })
      const cale = join(dosar, 'emailuri.json')
      const lista = existsSync(cale) ? (JSON.parse(readFileSync(cale, 'utf8')) as unknown[]) : []
      lista.push({ trimis: new Date().toISOString(), ...e })
      writeFileSync(cale, JSON.stringify(lista, null, 2), 'utf8')
      console.info(`[email, local] "${e.subiect}" -> ${e.catre.join(', ')}`)
      return { ok: true, motiv: 'local' }
    }
    console.error('Email neconfigurat: lipsesc RESEND_API_KEY sau EMAIL_DE')
    return { ok: false, motiv: 'neconfigurat' }
  }

  const anuleaza = new AbortController()
  const limita = setTimeout(() => anuleaza.abort(), 9_000)
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: anuleaza.signal,
      headers: { Authorization: `Bearer ${cheie}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: de,
        to: e.catre,
        ...(e.raspundeLa ? { reply_to: e.raspundeLa } : {}),
        subject: e.subiect,
        text: e.text,
        html: e.html,
      }),
    })
    if (!r.ok) {
      console.error('Resend a raspuns', r.status, await r.text())
      return { ok: false, motiv: `resend ${r.status}` }
    }
    return { ok: true }
  } catch (eroare) {
    console.error('Trimitere esuata', eroare)
    return { ok: false, motiv: 'retea' }
  } finally {
    clearTimeout(limita)
  }
}

/* --- Sablonul comun --------------------------------------------------------- */

function buton(adresa: string, text: string, fundal = ALBASTRU, culoare = '#ffffff'): string {
  return `<a href="${adresa}" style="display:inline-block;padding:14px 22px;background:${fundal};color:${culoare};font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;margin:0 8px 8px 0">${scapa(text)}</a>`
}

function randuri(lista: { eticheta: string; valoare: string }[]): string {
  return lista
    .filter((r) => r.valoare)
    .map(
      (r) => `<tr>
        <td style="padding:9px 18px 9px 0;vertical-align:top;font-size:13px;color:${GRI};white-space:nowrap">${scapa(r.eticheta)}</td>
        <td style="padding:9px 0;vertical-align:top;font-size:15px;color:${CERNEALA};line-height:1.55">${scapa(r.valoare).replace(/\n/g, '<br>')}</td>
      </tr>`,
    )
    .join('')
}

function sablon(o: { eticheta: string; titlu: string; intro: string; corp: string; butoane: string; subsol: string }): string {
  return `<!doctype html>
<html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${scapa(o.titlu)}</title></head>
<body style="margin:0;padding:24px 16px;background:${CREM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;border-collapse:separate">
    <tr><td style="background:${NAVY};border-radius:20px 20px 0 0;padding:28px 28px 24px">
      <img src="${adresaSite()}/images/semne/marca-alba.png" alt="" width="26" height="33" style="display:block;margin:0 0 14px;border:0">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#aab4ff;font-weight:700">${scapa(o.eticheta)}</p>
      <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:27px;font-weight:400;color:#ffffff;line-height:1.2">${scapa(o.titlu)}</h1>
    </td></tr>
    <tr><td style="background:#ffffff;padding:24px 28px 8px">
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${CERNEALA}">${o.intro}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">${o.corp}</table>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:0 0 20px 20px;padding:16px 28px 28px">${o.butoane}</td></tr>
  </table>
  <p style="max-width:600px;margin:18px auto 0;font-size:12px;line-height:1.6;color:${GRI};text-align:center">${o.subsol}</p>
</body></html>`
}

/* --- Emailurile ------------------------------------------------------------- */

function cifreTelefon(t: string): string {
  const cifre = t.replace(/\D/g, '')
  if (t.trim().startsWith('+')) return cifre
  if (cifre.startsWith('00')) return cifre.slice(2)
  if (cifre.startsWith('40') || cifre.startsWith('373')) return cifre
  if (cifre.startsWith('0')) return `40${cifre.slice(1)}`
  return cifre
}

/** Emailul care ajunge la Dorina la fiecare programare noua. */
export function emailNotificare(p: Programare, c: Client, setari: Setari): Email {
  const tip = TIPURI[p.tip]
  const cand = dataOraRo(p.incepe)
  const cifre = cifreTelefon(c.telefon)
  const catre = [setari.email_notificari || variabila('EMAIL_DORINA')].filter(Boolean)

  const lista = [
    { eticheta: 'Când', valoare: `${cand} (${p.durata_min} min)` },
    { eticheta: 'Tip', valoare: tip.nume + (p.suma ? `, ${p.suma} €` : ', gratuit') },
    { eticheta: 'Nume', valoare: c.nume },
    { eticheta: 'Email', valoare: c.email },
    { eticheta: 'Telefon', valoare: c.telefon },
    { eticheta: 'Nivel', valoare: c.nivel },
    { eticheta: 'Scop', valoare: c.scop },
    { eticheta: 'Mesaj', valoare: p.mesaj },
    { eticheta: 'De unde vine', valoare: p.sursa || 'direct' },
  ]

  const butoane = [
    buton(`${adresaSite()}/admin/#/programari`, 'Deschide în cabinet'),
    cifre ? buton(`https://wa.me/${cifre}?text=${encodeURIComponent(`Bună, ${c.nume.split(' ')[0]}! Sunt Dorina, de la DorDeFranceza. Am primit programarea ta pentru ${cand}.`)}`, 'WhatsApp', '#25d366') : '',
    buton(`mailto:${c.email}`, 'Răspunde pe email', '#ffffff', CERNEALA),
  ].join('')

  return {
    catre,
    raspundeLa: c.email,
    subiect: `Programare nouă: ${c.nume}, ${cand}`,
    text: [`Programare nouă pe DorDeFranceza`, '', ...lista.filter((r) => r.valoare).map((r) => `${r.eticheta}: ${r.valoare}`)].join('\n'),
    html: sablon({
      eticheta: 'Programare nouă',
      titlu: `${c.nume} vrea ${tip.nume.toLowerCase()}`,
      intro: `Programarea a intrat în calendar ca <strong>nouă</strong>. Confirm-o din cabinet sau scrie-i direct.`,
      corp: randuri(lista),
      butoane,
      subsol: 'Trimis automat de site-ul DorDeFranceza. Răspunzând la acest email scrii direct cursantului.',
    }),
  }
}

/** Confirmarea pe care o primeste cursantul imediat dupa programare. */
export function emailConfirmare(p: Programare, c: Client, setari: Setari): Email {
  const tip = TIPURI[p.tip]
  const zi = dataRo(p.incepe)
  const ora = oraRo(p.incepe)
  const prenume = c.nume.split(' ')[0]
  const link = p.link_zoom || setari.link_zoom

  const lista = [
    { eticheta: 'Ce', valoare: tip.nume },
    { eticheta: 'Când', valoare: `${zi}, ora ${ora} (ora României)` },
    { eticheta: 'Durată', valoare: `${p.durata_min} de minute` },
    { eticheta: 'Unde', valoare: link ? 'Pe Zoom, linkul e în butonul de mai jos' : 'Pe Zoom. Linkul vine pe email înainte de lecție.' },
    { eticheta: 'Preț', valoare: p.suma ? `${p.suma} €` : 'Gratuit' },
  ]

  const intro =
    p.tip === 'cunoastere'
      ? `Bună, ${scapa(prenume)}! Mulțumesc că ai făcut primul pas. Ne vedem pe Zoom, vorbim 20 de minute despre ce vrei să obții și îți spun sincer de unde pornim.`
      : `Bună, ${scapa(prenume)}! Lecția ta este în calendar. Mai jos ai toate detaliile.`

  const butoane = [
    link ? buton(link, 'Intră pe Zoom') : '',
    buton(`https://wa.me/${variabila('WHATSAPP_DORINA') || ''}`.replace(/\/$/, ''), 'Scrie-i Dorinei pe WhatsApp', '#25d366'),
  ].join('')

  return {
    catre: [c.email],
    subiect: `Confirmare: ${tip.nume.toLowerCase()}, ${zi}, ${ora}`,
    text: [
      `Bună, ${prenume}!`,
      '',
      `${tip.nume} este programată pentru ${zi}, ora ${ora} (ora României), ${p.durata_min} de minute.`,
      link ? `Link Zoom: ${link}` : 'Linkul de Zoom vine pe email înainte de lecție.',
      '',
      'Dacă nu mai poți ajunge, scrie-mi cu cel puțin 24 de ore înainte și reprogramăm gratuit. Sub 24 de ore, lecția se consideră efectuată.',
      `Regulile complete de anulare și dreptul de retragere în 14 zile: ${adresaSite()}/anulare-si-rambursare/`,
      '',
      'Pe curând,',
      'Dorina, DorDeFranceza',
    ].join('\n'),
    html: sablon({
      eticheta: 'Programare confirmată',
      titlu: `${zi}, ora ${ora}`,
      intro,
      corp: randuri(lista),
      butoane: butoane + `<p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:${GRI}">Dacă nu mai poți ajunge, scrie-mi cu cel puțin 24 de ore înainte și reprogramăm gratuit. Sub 24 de ore, lecția se consideră efectuată. Ai 14 zile în care te poți retrage pentru orice sumă plătită în avans pentru lecții neefectuate: <a href="${adresaSite()}/anulare-si-rambursare/" style="color:${GRI}">detalii</a>.</p>`,
      subsol: 'Ai primit acest email pentru că ai făcut o programare pe DorDeFranceza.',
    }),
  }
}

/** Mesaj din formularul de contact, catre Dorina. */
export function emailContact(d: { nume: string; email: string; telefon: string; mesaj: string; sursa: string }, setari: Setari): Email {
  const catre = [setari.email_notificari || variabila('EMAIL_DORINA')].filter(Boolean)
  const lista = [
    { eticheta: 'Nume', valoare: d.nume },
    { eticheta: 'Email', valoare: d.email },
    { eticheta: 'Telefon', valoare: d.telefon },
    { eticheta: 'Mesaj', valoare: d.mesaj },
    { eticheta: 'De unde vine', valoare: d.sursa || 'direct' },
  ]
  return {
    catre,
    raspundeLa: d.email,
    subiect: `Mesaj de pe site: ${d.nume}`,
    text: lista.filter((r) => r.valoare).map((r) => `${r.eticheta}: ${r.valoare}`).join('\n'),
    html: sablon({
      eticheta: 'Mesaj nou',
      titlu: `${d.nume} ți-a scris`,
      intro: 'Un mesaj din formularul de contact de pe site.',
      corp: randuri(lista),
      butoane: buton(`mailto:${d.email}`, 'Răspunde pe email'),
      subsol: 'Trimis automat de site-ul DorDeFranceza.',
    }),
  }
}

/** Linkul de Zoom trimis manual din cabinet, cu butonul "Trimite linkul". */
export function emailLinkZoom(p: Programare, c: Client, link: string): Email {
  const zi = dataRo(p.incepe)
  const ora = oraRo(p.incepe)
  const prenume = c.nume.split(' ')[0]
  return {
    catre: [c.email],
    subiect: `Linkul de Zoom pentru ${zi}, ${ora}`,
    text: `Bună, ${prenume}!\n\nLinkul pentru lecția de ${zi}, ora ${ora}: ${link}\n\nPe curând,\nDorina`,
    html: sablon({
      eticheta: 'Linkul lecției',
      titlu: `${zi}, ora ${ora}`,
      intro: `Bună, ${scapa(prenume)}! Aici ai linkul pentru lecția noastră. Intră cu 2 minute înainte, ca să avem toate cele 50 de minute.`,
      corp: '',
      butoane: buton(link, 'Intră pe Zoom'),
      subsol: 'Trimis de Dorina din cabinetul DorDeFranceza.',
    }),
  }
}
