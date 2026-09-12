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
import type { Client, Grupa, Programare, Setari } from '../lib/tipuri'
import { TIPURI } from '../lib/tipuri'
import { dataOraRo, dataRo, numeZi, oraRo } from '../lib/timp'
import { adresaSite, inDezvoltare, variabila } from './mediu'
import { atasamentIcs, linkGoogleCalendar } from './calendar'

export type Atasament = { nume: string; continut: string }

export type Email = {
  catre: string[]
  subiect: string
  text: string
  html: string
  raspundeLa?: string
  /** Fisiere trimise odata cu mesajul; `continut` e base64. */
  atasamente?: Atasament[]
}

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
        ...(e.atasamente?.length ? { attachments: e.atasamente.map((a) => ({ filename: a.nume, content: a.continut })) } : {}),
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
        <td style="padding:10px 20px 10px 0;vertical-align:top;font-size:12px;letter-spacing:0.02em;color:${GRI};white-space:nowrap">${scapa(r.eticheta)}</td>
        <td style="padding:10px 0;vertical-align:top;font-size:15px;color:${CERNEALA};line-height:1.6">${scapa(r.valoare).replace(/\n/g, '<br>')}</td>
      </tr>`,
    )
    .join('')
}

/**
 * Antetul si corpul fiecarui email.
 *
 * `figura` e una din pozele din public/images/email/: personajul intr-un cerc
 * crem, desenat deja pe fundal bleumarin. Cercul si fundalul sunt in poza,
 * dinadins: in emailuri nu te poti bizui nici pe `border-radius` (Outlook pe
 * Windows il ignora si ar iesi un patrat crem), nici pe transparenta peste o
 * culoare. Asa, oriunde s-ar deschide, arata la fel.
 *
 * Tot din acelasi motiv, antetul e un tabel in tabel si nu flex: clientii de
 * email nu stiu flexbox. Celula figurii are latime fixa, iar Outlook primeste
 * si atributele `width` pe `img`, nu doar stilul.
 */
function sablon(o: {
  eticheta: string
  titlu: string
  intro: string
  corp: string
  butoane: string
  subsol: string
  figura?: 'saluta' | 'telefon' | 'incurajeaza' | 'scrie'
}): string {
  const figura = o.figura
    ? `<td width="112" style="width:112px;vertical-align:top;padding-left:18px" class="fara-figura">
          <img src="${adresaSite()}/images/email/${o.figura}.png" alt="" width="112" height="112" style="display:block;width:112px;height:112px;border:0;border-radius:999px">
        </td>`
    : ''

  return `<!doctype html>
<html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${scapa(o.titlu)}</title>
<style>
  /* Pe ecrane inguste figura iese: titlul are nevoie de toata latimea. */
  @media (max-width:520px) {
    .fara-figura { display:none !important; }
    .titlu-email { font-size:24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:32px 16px;background:${CREM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;border-collapse:separate">
    <tr><td style="background:${NAVY};border-radius:24px 24px 0 0;padding:34px 32px 30px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse"><tr>
        <td style="vertical-align:top">
          <!--
            Numele scris cu litere, nu pus ca imagine.
            Gmail, Outlook si Apple Mail nu incarca pozele din emailuri pana
            cand omul nu apasa „afiseaza imaginile", iar pana atunci in capul
            mesajului statea o iconita de imagine rupta cu textul alternativ
            langa ea. Artiom a primit exact asta si a crezut ca e bug. Scris cu
            litere, numele se vede intotdeauna, oricare ar fi setarea.
          -->
          <p style="margin:0 0 26px;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1;color:#ffffff">D&rsquo;or <i>de</i> Franceza</p>
          <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#aab4ff;font-weight:700">${scapa(o.eticheta)}</p>
          <h1 class="titlu-email" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#ffffff;line-height:1.25">${scapa(o.titlu)}</h1>
        </td>
        ${figura}
      </tr></table>
    </td></tr>
    <tr><td style="background:#ffffff;padding:28px 32px 10px">
      <p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:${CERNEALA}">${o.intro}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">${o.corp}</table>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:0 0 24px 24px;padding:18px 32px 32px">${o.butoane}</td></tr>
  </table>
  <p style="max-width:600px;margin:20px auto 0;font-size:12px;line-height:1.7;color:${GRI};text-align:center">${o.subsol}</p>
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
    /* Intai calendarul: e singurul buton care face ca telefonul sa sune la
       timp. Cabinetul ramane, dar el nu da notificari. */
    buton(linkGoogleCalendar(p, c, setari, true), 'Pune în Google Calendar', '#0b8043'),
    buton(`${adresaSite()}/admin/#/programari`, 'Deschide în cabinet'),
    cifre ? buton(`https://wa.me/${cifre}?text=${encodeURIComponent(`Bună, ${c.nume.split(' ')[0]}! Sunt Dorina, de la DorDeFranceza. Am primit programarea ta pentru ${cand}.`)}`, 'WhatsApp', '#25d366') : '',
    buton(`mailto:${c.email}`, 'Răspunde pe email', '#ffffff', CERNEALA),
  ].join('')

  return {
    catre,
    raspundeLa: c.email,
    subiect: `Programare nouă: ${c.nume}, ${cand}`,
    atasamente: [atasamentIcs(p, c, setari, true)],
    text: [`Programare nouă pe DorDeFranceza`, '', ...lista.filter((r) => r.valoare).map((r) => `${r.eticheta}: ${r.valoare}`)].join('\n'),
    html: sablon({
      figura: 'incurajeaza',
      eticheta: 'Programare nouă',
      titlu: `${c.nume} vrea ${tip.nume.toLowerCase()}`,
      intro: `Programarea a intrat în calendar ca <strong>nouă</strong>. Confirm-o din cabinet sau scrie-i direct.`,
      corp: randuri(lista),
      butoane,
      subsol: 'Lecția e atașată ca fișier de calendar: pe telefon se deschide singură în Calendar, cu amintire cu o oră și cu zece minute înainte. Răspunzând la acest email scrii direct cursantului.',
    }),
  }
}

/**
 * Emailul primit de cineva intrat intr-o grupa.
 *
 * Nu trimite un email pe lectie, ar fi cincisprezece mesaje deodata. Trimite
 * unul singur, cu toata seria scrisa in el, iar fisierul de calendar atasat le
 * contine pe toate: o apasare si tot cursul intra in telefon, fiecare lectie cu
 * amintirea ei.
 */
export function emailGrupa(g: Grupa, c: Client, lectii: Programare[], setari: Setari): Email {
  const prenume = c.nume.split(' ')[0]
  const link = setari.link_zoom
  const prima = lectii[0]
  const listaZile = lectii
    .map((p, i) => `<tr><td style="padding:6px 16px 6px 0;font-size:13px;color:${GRI};white-space:nowrap">${i + 1}</td><td style="padding:6px 0;font-size:15px;color:${CERNEALA}">${scapa(dataOraRo(p.incepe))}</td></tr>`)
    .join('')

  const lista = [
    { eticheta: 'Grupa', valoare: g.nume },
    { eticheta: 'Nivel', valoare: g.nivel },
    { eticheta: 'Când', valoare: `în fiecare ${numeZi(g.zi)}, ora ${g.ora} (ora României)` },
    { eticheta: 'Lecții', valoare: `${lectii.length} din ${g.lectii}` },
    { eticheta: 'Preț', valoare: g.pret ? `${g.pret} € pe lecție` : 'gratuit' },
    { eticheta: 'Unde', valoare: link ? 'Pe Zoom, linkul e în butonul de mai jos' : 'Pe Zoom. Linkul vine pe email înainte de prima lecție.' },
  ]

  const butoane = [
    link ? buton(link, 'Intră pe Zoom') : '',
    prima ? buton(linkGoogleCalendar(prima, c, setari), 'Pune în calendar', '#0b8043') : '',
  ].join('')

  return {
    catre: [c.email],
    raspundeLa: setari.email_notificari || variabila('EMAIL_DORINA') || undefined,
    subiect: `Ești în grupa ${g.nume}: ${numeZi(g.zi)}, ora ${g.ora}`,
    atasamente: lectii.length ? [atasamentIcs(lectii, c, setari)] : undefined,
    text: [
      `Bună, ${prenume}!`,
      '',
      `Ești în grupa ${g.nume}. Ne vedem în fiecare ${numeZi(g.zi)}, la ora ${g.ora} (ora României).`,
      '',
      'Lecțiile tale:',
      ...lectii.map((p, i) => `${i + 1}. ${dataOraRo(p.incepe)}`),
      '',
      link ? `Link Zoom: ${link}` : 'Linkul de Zoom vine pe email înainte de prima lecție.',
      '',
      'Toate lecțiile sunt în fișierul atașat: îl deschizi pe telefon și intră singure în calendar.',
      '',
      'Pe curând,',
      'Dorina, DorDeFranceza',
    ].filter(Boolean).join('\n'),
    html: sablon({
      figura: 'saluta',
      eticheta: 'Grupa ta',
      titlu: 'Bine ai venit!',
      intro: `Bună, ${scapa(prenume)}! Ești în grupa <strong>${scapa(g.nume)}</strong>. Ne vedem în fiecare ${scapa(numeZi(g.zi))}, la ora ${scapa(g.ora)}, ora României.`,
      corp: randuri(lista) + `<tr><td colspan="2" style="padding:18px 0 4px;font-size:12px;letter-spacing:0.02em;color:${GRI}">Lecțiile tale</td></tr>` + listaZile,
      butoane,
      subsol: 'Toate lecțiile sunt în fișierul atașat: îl deschizi pe telefon și intră singure în calendar, fiecare cu amintire cu 30 de minute înainte.',
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
    buton(linkGoogleCalendar(p, c, setari), 'Pune în calendar', '#0b8043'),
    buton(`https://wa.me/${variabila('WHATSAPP_DORINA') || ''}`.replace(/\/$/, ''), 'Scrie-i Dorinei pe WhatsApp', '#25d366'),
  ].join('')

  return {
    catre: [c.email],
    subiect: `Confirmare: ${tip.nume.toLowerCase()}, ${zi}, ${ora}`,
    atasamente: [atasamentIcs(p, c, setari)],
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
      figura: 'saluta',
      eticheta: 'Programare confirmată',
      titlu: `${zi}, ora ${ora}`,
      intro,
      corp: randuri(lista),
      butoane: butoane + `<p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:${GRI}">Dacă nu mai poți ajunge, scrie-mi cu cel puțin 24 de ore înainte și reprogramăm gratuit. Sub 24 de ore, lecția se consideră efectuată. Ai 14 zile în care te poți retrage pentru orice sumă plătită în avans pentru lecții neefectuate: <a href="${adresaSite()}/anulare-si-rambursare/" style="color:${GRI}">detalii</a>.</p>`,
      subsol: 'Ai primit acest email pentru că ai făcut o programare pe DorDeFranceza.',
    }),
  }
}

/**
 * Propunerea pe care Dorina o trimite unui cursant: o ora anume, cu doua
 * butoane. Confirmarea se face dintr-un clic, fara cont si fara parola, pe
 * baza codului din link. Linkul expira, ca sa nu ramana valabil la nesfarsit.
 */
export function emailPropunere(p: Programare, c: Client, setari: Setari, mesajDorinei = '', primaLectie = false): Email {
  const tip = TIPURI[p.tip]
  const zi = dataRo(p.incepe)
  const ora = oraRo(p.incepe)
  const prenume = c.nume.split(' ')[0]
  const link = `${adresaSite()}/confirma/?t=${encodeURIComponent(p.token_confirmare ?? '')}`
  const panaLa = p.token_expira ? dataRo(p.token_expira) : ''

  const lista = [
    { eticheta: 'Ce', valoare: tip.nume },
    { eticheta: 'Când', valoare: `${zi}, ora ${ora} (ora României)` },
    { eticheta: 'Durată', valoare: `${p.durata_min} de minute` },
    { eticheta: 'Preț', valoare: p.suma ? `${p.suma} €` : 'Gratuit' },
    { eticheta: 'De la Dorina', valoare: mesajDorinei },
  ]

  // Un singur buton, si acela doar deschide pagina. Confirmarea propriu-zisa
  // se face printr-un POST de acolo: altfel, orice program care deschide
  // linkurile din emailuri ar confirma lectia in locul omului.
  const butoane = buton(link, 'Vezi și răspunde')

  const subsolPas = panaLa
    ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:${GRI}">Ora e ținută pentru tine până pe ${scapa(panaLa)}. După aceea se eliberează.</p>`
    : ''

  return {
    catre: [c.email],
    raspundeLa: setari.email_notificari || variabila('EMAIL_DORINA') || undefined,
    subiect: `Propunere de lecție: ${zi}, ora ${ora}`,
    text: [
      `Bună, ${prenume}!`,
      '',
      `Îți propun ${tip.nume.toLowerCase()} pe ${zi}, ora ${ora} (ora României), ${p.durata_min} de minute${p.suma ? `, ${p.suma} €` : ', gratuit'}.`,
      mesajDorinei ? `\n${mesajDorinei}` : '',
      '',
      `Deschide și răspunde de aici: ${link}`,
      'Acolo ai și butonul „Nu pot atunci”, dacă ora nu îți convine.',
      panaLa ? `Ora e ținută pentru tine până pe ${panaLa}.` : '',
      '',
      'Dorina, DorDeFranceza',
    ].filter(Boolean).join('\n'),
    html: sablon({
      /*
       * Pentru cineva care vine prima oara, emailul asta e prima intalnire cu
       * scoala. Artiom: „sa fie fata ceea sus, «bine ai venit», si jos «prima
       * ta lectie de proba, care este programata pe data asta, ora asta»".
       * Deci la prima lectie mainile intinse, la a doua doar ora propusa.
       */
      figura: primaLectie ? 'saluta' : 'scrie',
      eticheta: primaLectie ? 'Prima ta lecție' : 'Propunere de lecție',
      titlu: primaLectie ? 'Bine ai venit!' : `${zi}, ora ${ora}`,
      intro: primaLectie
        ? `Bună, ${scapa(prenume)}! Mă bucur că ai ajuns aici. Prima ta ${scapa(tip.nume.toLowerCase())} e programată pe <strong>${scapa(zi)}, ora ${scapa(ora)}</strong>. Apasă butonul de mai jos și confirmi dintr-un singur clic, sau îmi spui tot de acolo dacă ora nu îți convine.`
        : `Bună, ${scapa(prenume)}! Îți propun ora asta. Apasă butonul și îmi spui acolo dacă îți convine sau nu, dintr-un singur clic.`,
      corp: randuri(lista),
      butoane: butoane + subsolPas,
      subsol: 'Trimis de Dorina, de pe site-ul DorDeFranceza.',
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
      figura: 'telefon',
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
      figura: 'saluta',
      eticheta: 'Linkul lecției',
      titlu: `${zi}, ora ${ora}`,
      intro: `Bună, ${scapa(prenume)}! Aici ai linkul pentru lecția noastră. Intră cu 2 minute înainte, ca să avem toate cele 50 de minute.`,
      corp: '',
      butoane: buton(link, 'Intră pe Zoom'),
      subsol: 'Trimis de Dorina din cabinetul DorDeFranceza.',
    }),
  }
}
