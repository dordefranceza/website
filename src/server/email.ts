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
import { FIGURI } from './figuri'
import { numarInternational } from '../lib/telefon'

export type Atasament = {
  nume: string
  /** Base64. */
  continut: string
  /** Cand e pus, atasamentul nu se arata ca fisier: se leaga din HTML prin `cid:`. */
  contentId?: string
}

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
    /*
     * Pozele cerute de HTML prin `cid:personaj-...` se ataseaza singure aici.
     * Un singur loc, deci orice email nou primeste poza fara sa fie nevoie sa
     * si-o ceara. Nu se vad ca fisiere in mesaj: `content_id` le face parte din
     * scrisoare, iar clientii le arata fara sa mai intrebe.
     */
    const cerute = [...new Set([...e.html.matchAll(/cid:personaj-([a-z]+)/g)].map((m) => m[1]))]
    const atasamente: Atasament[] = [
      ...(e.atasamente ?? []),
      ...cerute.filter((n) => FIGURI[n]).map((n) => ({ nume: `${n}.png`, continut: FIGURI[n], contentId: `personaj-${n}` })),
    ]

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
        ...(atasamente.length
          ? { attachments: atasamente.map((a) => ({ filename: a.nume, content: a.continut, ...(a.contentId ? { content_id: a.contentId } : {}) })) }
          : {}),
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
  return `<a href="${adresa}" style="display:inline-block;padding:14px 22px;background:${fundal};color:${culoare};font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;margin:0 4px 8px">${scapa(text)}</a>`
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
  /** Randul mare de sub titlu, in antet. La programari: ora. */
  subtitlu?: string
  intro: string
  corp: string
  butoane: string
  /** Randul marunt de sub butoane: reguli, termene, ce urmeaza. */
  nota?: string
  subsol: string
  figura?: 'saluta' | 'telefon' | 'incurajeaza' | 'scrie'
}): string {
  /* Intro-ul, fara etichete HTML si fara spatii duble: exact ce merita citit
     in lista de mesaje, inainte ca omul sa deschida. */
  const previzualizare = o.intro.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 160)

  const figura = o.figura
    ? `<td width="112" style="width:112px;vertical-align:top;padding-left:18px" class="figura-cel">
          <img src="cid:personaj-${o.figura}" alt="" width="112" height="112" style="display:block;width:112px;height:112px;border:0;border-radius:999px" class="figura-img">
        </td>`
    : ''

  return `<!doctype html>
<html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${scapa(o.titlu)}</title>
<style>
  /*
    Pe telefon figura NU se mai ascunde, se micsoreaza.
    Prima varianta o scotea de tot sub 520px, ca sa aiba titlul toata latimea.
    Artiom s-a uitat pe telefon: „nu-i nici poza cea cu fata, nu stiu de ce, pe
    pc este parca". Avea dreptate sa se mire: personajul e jumatate din motivul
    pentru care emailul arata a noi. Deci ramane, la 68 de pixeli, iar titlul
    scade cu doua puncte ca sa incapa amandoua.
  */
  @media (max-width:520px) {
    .figura-cel { width:68px !important; padding-left:12px !important; }
    .figura-img { width:68px !important; height:68px !important; }
    .titlu-email { font-size:23px !important; }
    .ora-email { font-size:26px !important; }
  }
</style>
</head>
<body style="margin:0;padding:32px 16px;background:${CREM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <!--
    Randul pe care il arata Gmail sub subiect.
    Fara el, cutia postala citeste inceputul paginii si iese „D'or de Franceza
    Prima ta lectie Bine ai ve…", adica numele si eticheta lipite una de alta.
    Artiom a vazut exact asta pe telefon. Aici punem o propozitie intreaga, iar
    dupa ea o coada de spatii invizibile, ca sa nu mai traga Gmail si din HTML.
  -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0">${scapa(previzualizare)}</div>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0">${'&#847;&zwnj;&nbsp;'.repeat(60)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;border-collapse:separate">
    <tr><td style="background:${NAVY};border-radius:24px 24px 0 0;padding:34px 32px 30px">
      <!--
        Randul de sus tine doar numele si figura. Titlul a coborat sub el, pe
        toata latimea.
        Inainte, titlul statea in aceeasi celula cu numele, deci intr-o coloana
        ingustata cu 112 pixeli de figura. O data lunga se rupea acolo oricum,
        si iesea „marti, 15 / septembrie 2026, / ora 17:00", trei randuri
        zdrentuite lipite de stanga. Artiom: „nu-i frumos aranjat textul... sa
        fie jos, deja in mijloc, frumos, mare". Pe toata latimea si centrata,
        data incape pe un rand, iar ora sta sub ea, singura si mare.
      -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse"><tr>
        <td style="vertical-align:middle">
          <!--
            Numele scris cu litere, nu pus ca imagine.
            Gmail, Outlook si Apple Mail nu incarca pozele din emailuri pana
            cand omul nu apasa „afiseaza imaginile", iar pana atunci in capul
            mesajului statea o iconita de imagine rupta cu textul alternativ
            langa ea. Artiom a primit exact asta si a crezut ca e bug. Scris cu
            litere, numele se vede intotdeauna, oricare ar fi setarea.
          -->
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.2;color:#ffffff">D&rsquo;or <i>de</i> Franceza</p>
        </td>
        ${figura}
      </tr></table>
      <p style="margin:26px 0 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#aab4ff;font-weight:700;text-align:center">${scapa(o.eticheta)}</p>
      <h1 class="titlu-email" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:29px;font-weight:400;color:#ffffff;line-height:1.25;text-align:center">${scapa(o.titlu)}</h1>
      ${o.subtitlu ? `<p class="ora-email" style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:31px;font-weight:400;color:#ffffff;line-height:1.2;text-align:center">${scapa(o.subtitlu)}</p>` : ''}
    </td></tr>
    <tr><td style="background:#ffffff;padding:28px 32px 10px">
      <p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:${CERNEALA}">${o.intro}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">${o.corp}</table>
    </td></tr>
    <!--
      Butoanele stateau lipite de stanga fiindca celula nu spunea nimic despre
      aliniere. Artiom, despre cele doua verzi: „pune-le in mijloc, si al
      Dorinei in mail tot asa, nu doar la clienti". Deci se centreaza aici, o
      data, pentru toate emailurile. Atributul align pe celula e pentru Outlook,
      care ignora alinierea mostenita de <a>-uri.
    -->
    <tr><td align="center" style="background:#ffffff;border-radius:0 0 24px 24px;padding:18px 32px 32px;text-align:center">${o.butoane}${
      o.nota ? `<p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${GRI};text-align:center">${o.nota}</p>` : ''
    }</td></tr>
  </table>
  <p style="max-width:600px;margin:20px auto 0;font-size:12px;line-height:1.7;color:${GRI};text-align:center">${o.subsol}</p>
</body></html>`
}

/**
 * Data mare din antet, legata ca sa nu se rupa oriunde.
 *
 * Pe telefon „miercuri, 16 septembrie 2026" nu incape pe un rand la marimea
 * asta, iar browserul rupea unde apuca: „miercuri, 16 / septembrie 2026", cu
 * anul aruncat singur pe rand. Spatiile dinauntrul datei devin neseparabile,
 * deci singurul loc unde se mai poate rupe ramane virgula de dupa ziua
 * saptamanii, adica exact acolo unde s-ar opri si cineva care citeste cu voce
 * tare. Pe ecran lat incape oricum pe un rand si nu se schimba nimic.
 */
/**
 * Randul cu regulile de anulare, scris dupa lectia care e, nu turnat la fel
 * peste tot.
 *
 * Inainte era un text unic, lipit la fiecare confirmare: „scrie-mi cu cel
 * putin 24 de ore inainte... ai 14 zile in care te poti retrage pentru orice
 * suma platita in avans". Artiom s-a oprit la el: „trebuie sa fie acel text?
 * adica e logic daca clientul a ales maine sa aiba programare?". Nu era, din
 * doua motive:
 *
 * 1. La discutia de cunoastere nu se plateste nimic, deci nu exista nicio suma
 *    de retras. Randul despre banii dati in avans nu are obiect, si un om care
 *    citeste despre rambursari la ceva gratuit se intreaba ce n-a inteles.
 * 2. Daca lectia e peste mai putin de 24 de ore, regula de 24 de ore e deja
 *    imposibil de respectat in clipa in care omul o citeste. Ii ceri ceva ce
 *    nu mai poate face, si suna a portita.
 *
 * Ce NU se scoate niciodata e legatura catre pagina cu regulile. Confirmarea
 * asta e suportul durabil pe care cumparatorul primeste conditiile, deci
 * linkul ramane, oricat de scurt ar fi restul randului.
 */
function dataLegata(zi: string): string {
  return zi.replace(/(\d+)\s+(\S+)\s+(\d{4})/u, '$1\u00a0$2\u00a0$3')
}

function notaAnulare(p: Programare): { html: string; text: string } {
  const adresa = `${adresaSite()}/anulare-si-rambursare/`
  const link = `<a href="${adresa}" style="color:${GRI}">regulile complete</a>`
  const subDouazeciSiPatru = new Date(p.incepe).getTime() - Date.now() < 24 * 3_600_000

  if (!p.suma) {
    const spus = subDouazeciSiPatru
      ? 'Lecția e în mai puțin de 24 de ore. Dacă apare ceva, scrie-mi cât poți de repede și găsim altă oră.'
      : 'Dacă nu mai poți ajunge, scrie-mi și mutăm ora. Discuția e gratuită, nu pierzi nimic.'
    return { html: `${spus} Aici sunt ${link}.`, text: `${spus}\nRegulile complete: ${adresa}` }
  }

  const spus = subDouazeciSiPatru
    ? 'Lecția e în mai puțin de 24 de ore, deci reprogramarea gratuită nu se mai aplică. Dacă apare ceva, scrie-mi cât poți de repede.'
    : 'Dacă nu mai poți ajunge, scrie-mi cu cel puțin 24 de ore înainte și reprogramăm gratuit. Sub 24 de ore, lecția se consideră efectuată.'
  const retragere = 'Ai 14 zile în care te poți retrage pentru orice sumă plătită în avans pentru lecții neefectuate'
  return {
    html: `${spus} ${retragere}: ${link}.`,
    text: `${spus}\n${retragere}. Regulile complete: ${adresa}`,
  }
}

/* --- Emailurile ------------------------------------------------------------- */



/** Emailul care ajunge la Dorina la fiecare programare noua. */
export function emailNotificare(p: Programare, c: Client, setari: Setari): Email {
  const tip = TIPURI[p.tip]
  const cand = dataOraRo(p.incepe)
  const cifre = numarInternational(c.telefon)
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
      subsol: 'Lecția e atașată ca fișier de calendar: pe telefon se deschide singură în Calendar, cu amintire cu 30 de minute înainte. Răspunzând la acest email scrii direct cursantului.',
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
    { eticheta: 'Unde', valoare: link ? 'Online, linkul e în butonul de mai jos' : 'Online. Linkul vine pe email înainte de prima lecție.' },
  ]

  const butoane = [
    link ? buton(link, 'Intră la lecție') : '',
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
      link ? `Link Google Meet: ${link}` : 'Linkul vine pe email înainte de prima lecție.',
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

/**
 * Cursantul a apasat „Nu pot atunci".
 *
 * Fara emailul asta, refuzul ar fi doar o lectie anulata printre altele in
 * cabinet, iar Dorina ar afla despre el abia cand s-ar uita. Artiom: „daca
 * clientul refuza, sa-mi vina pe cabinet, sa pot apasa si sa retrimit".
 */
export function emailRefuz(p: Programare, c: Client, setari: Setari): Email {
  const cand = dataOraRo(p.incepe)
  const cifre = numarInternational(c.telefon)
  const catre = [setari.email_notificari || variabila('EMAIL_DORINA')].filter(Boolean)

  const lista = [
    { eticheta: 'Cine', valoare: c.nume },
    { eticheta: 'Ora propusă', valoare: cand },
    { eticheta: 'Ce', valoare: TIPURI[p.tip].nume },
    { eticheta: 'Email', valoare: c.email },
    { eticheta: 'Telefon', valoare: c.telefon },
  ]

  const butoane = [
    buton(`${adresaSite()}/admin/#/programari`, 'Propune altă oră'),
    cifre ? buton(`https://wa.me/${cifre}?text=${encodeURIComponent(`Bună, ${c.nume.split(' ')[0]}! Am văzut că ora de ${cand} nu îți convine. Când ți-ar fi bine?`)}`, 'Întreabă pe WhatsApp', '#25d366') : '',
    buton(`mailto:${c.email}`, 'Răspunde pe email', '#ffffff', CERNEALA),
  ].join('')

  return {
    catre,
    raspundeLa: c.email,
    subiect: `${c.nume} nu poate la ${cand}`,
    text: [`${c.nume} a răspuns că nu poate la ${cand}.`, '', ...lista.filter((r) => r.valoare).map((r) => `${r.eticheta}: ${r.valoare}`), '', `Propune-i altă oră din cabinet: ${adresaSite()}/admin/#/programari`].join('\n'),
    html: sablon({
      figura: 'telefon',
      eticheta: 'Ora nu convine',
      titlu: `${c.nume} nu poate atunci`,
      intro: `Ora a fost eliberată, deci o poate lua altcineva. Propune-i alta din cabinet, sau întreabă-l direct când i-ar fi bine.`,
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
    { eticheta: 'Unde', valoare: link ? 'Online, linkul e în butonul de mai jos' : 'Online. Linkul vine pe email înainte de lecție.' },
    { eticheta: 'Preț', valoare: p.suma ? `${p.suma} €` : 'Gratuit' },
  ]

  const intro =
    p.tip === 'cunoastere'
      ? `Bună, ${scapa(prenume)}! Mulțumesc că ai făcut primul pas. Ne vedem pe Google Meet, vorbim 20 de minute despre ce vrei să obții și îți spun sincer de unde pornim.`
      : `Bună, ${scapa(prenume)}! Lecția ta este în calendar. Mai jos ai toate detaliile.`

  const butoane = [
    link ? buton(link, 'Intră la lecție') : '',
    buton(linkGoogleCalendar(p, c, setari), 'Pune în calendar', '#0b8043'),
    buton(`https://wa.me/${variabila('WHATSAPP_DORINA') || ''}`.replace(/\/$/, ''), 'Scrie-i Dorinei pe WhatsApp', '#25d366'),
  ].join('')

  const nota = notaAnulare(p)

  return {
    catre: [c.email],
    subiect: `Confirmare: ${tip.nume.toLowerCase()}, ${zi}, ${ora}`,
    atasamente: [atasamentIcs(p, c, setari)],
    text: [
      `Bună, ${prenume}!`,
      '',
      `${tip.nume} este programată pentru ${zi}, ora ${ora} (ora României), ${p.durata_min} de minute.`,
      link ? `Link Google Meet: ${link}` : 'Linkul vine pe email înainte de lecție.',
      '',
      nota.text,
      '',
      'Pe curând,',
      'Dorina, DorDeFranceza',
    ].join('\n'),
    html: sablon({
      figura: 'saluta',
      eticheta: 'Programare confirmată',
      /* Ziua pe un rand, ora pe altul. Impreuna se rupeau urat pe telefon. */
      titlu: dataLegata(zi),
      subtitlu: `ora ${ora}`,
      intro,
      corp: randuri(lista),
      butoane,
      nota: nota.html,
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

  const subsolPas = panaLa ? `Ora e ținută pentru tine până pe ${scapa(panaLa)}. După aceea se eliberează.` : ''

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
      titlu: primaLectie ? 'Bine ai venit!' : dataLegata(zi),
      /* La prima lectie titlul e urarea, iar ora sta in tabelul de dedesubt:
         doua randuri mari, unul peste altul, s-ar bate cap in cap. */
      subtitlu: primaLectie ? undefined : `ora ${ora}`,
      intro: primaLectie
        ? `Bună, ${scapa(prenume)}! Mă bucur că ai ajuns aici. Prima ta ${scapa(tip.nume.toLowerCase())} e programată pe <strong>${scapa(zi)}, ora ${scapa(ora)}</strong>. Apasă butonul de mai jos și confirmi dintr-un singur clic, sau îmi spui tot de acolo dacă ora nu îți convine.`
        : `Bună, ${scapa(prenume)}! Îți propun ora asta. Apasă butonul și îmi spui acolo dacă îți convine sau nu, dintr-un singur clic.`,
      corp: randuri(lista),
      butoane,
      nota: subsolPas,
      subsol: 'Răspunzând la acest email îi scrii direct Dorinei.',
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

/** Linkul lectiei trimis manual din cabinet, cu butonul "Trimite linkul". */
export function emailLinkZoom(p: Programare, c: Client, link: string): Email {
  const zi = dataRo(p.incepe)
  const ora = oraRo(p.incepe)
  const prenume = c.nume.split(' ')[0]
  return {
    catre: [c.email],
    subiect: `Linkul pentru lecția de ${zi}, ${ora}`,
    text: `Bună, ${prenume}!\n\nLinkul pentru lecția de ${zi}, ora ${ora}: ${link}\n\nPe curând,\nDorina`,
    html: sablon({
      figura: 'saluta',
      eticheta: 'Linkul lecției',
      titlu: dataLegata(zi),
      subtitlu: `ora ${ora}`,
      intro: `Bună, ${scapa(prenume)}! Aici ai linkul pentru lecția noastră. Intră cu două minute înainte, ca să avem tot timpul nostru.`,
      corp: '',
      butoane: buton(link, 'Intră la lecție'),
      /* Cursantul n-are ce sti despre „cabinet": e unealta Dorinei, nu a lui.
         Artiom a incercuit randul asta si a avut dreptate. */
      subsol: 'Ne vedem la ora stabilită. Dacă apare ceva, răspunde la acest email.',
    }),
  }
}
