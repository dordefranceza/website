/**
 * Lectia, dusa in calendarul telefonului.
 *
 * Artiom: „calendarul de la Google este cel mai bun, ca acolo vin notificari pe
 * telefon". Are dreptate, si nu are rost sa ne batem cu el: noi tinem evidenta,
 * dar amintirea cu treizeci de minute inainte o da mai bine telefonul.
 *
 * Doua cai, amandoua fara cont legat si fara permisiuni cerute nimanui:
 *   - un LINK „pune in Google Calendar", o apasare pe telefon;
 *   - un FISIER .ics atasat, pe care il inteleg Apple, Outlook si Google.
 *
 * Sincronizarea adevarata prin Google Calendar API (lectia apare singura, se
 * muta singura, se sterge singura) e alta treaba, mai mare, si cere acces la
 * contul Google al Dorinei.
 */
import type { Client, Programare, Setari } from '../lib/tipuri'
import { TIPURI } from '../lib/tipuri'
import { dataOraRo } from '../lib/timp'
import { adresaSite } from './mediu'

/** Instantul in forma ceruta de calendare: 20260915T170000Z. */
function campUtc(instant: string | Date): string {
  return new Date(instant).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function sfarsitul(p: Programare): Date {
  return new Date(Date.parse(p.incepe) + p.durata_min * 60_000)
}

function titlul(p: Programare, c: Client, pentruDorina: boolean): string {
  const tip = TIPURI[p.tip].nume
  return pentruDorina ? `${tip}: ${c.nume}` : `${tip} cu Dorina`
}

function descrierea(p: Programare, c: Client, setari: Setari, pentruDorina: boolean): string {
  const link = p.link_zoom || setari.link_zoom
  const randuri = [
    pentruDorina ? `Cursant: ${c.nume}` : 'Profesoara: Dorina',
    pentruDorina && c.email ? `Email: ${c.email}` : '',
    pentruDorina && c.telefon ? `Telefon: ${c.telefon}` : '',
    pentruDorina && c.nivel ? `Nivel: ${c.nivel}` : '',
    link ? `Google Meet: ${link}` : 'Linkul vine pe email înainte de lecție.',
    '',
    pentruDorina ? `Cabinet: ${adresaSite()}/admin/#/programari` : `DorDeFranceza: ${adresaSite()}`,
  ]
  return randuri.filter(Boolean).join('\n')
}

/**
 * Linkul care deschide Google Calendar cu lectia deja completata. O apasare pe
 * telefon si evenimentul e acolo, cu notificarile obisnuite ale telefonului.
 */
export function linkGoogleCalendar(p: Programare, c: Client, setari: Setari, pentruDorina = false): string {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: titlul(p, c, pentruDorina),
    dates: `${campUtc(p.incepe)}/${campUtc(sfarsitul(p))}`,
    details: descrierea(p, c, setari, pentruDorina),
    location: p.link_zoom || setari.link_zoom || 'Zoom',
  })
  return `https://calendar.google.com/calendar/render?${q}`
}

/*
 * In .ics, randurile lungi se taie la 75 de octeti si se continua cu un spatiu
 * la inceputul randului urmator. Taierea se face pe OCTETI, nu pe caractere:
 * un „ă" ocupa doi, iar un rand taiat la mijlocul lui sparge fisierul in
 * Outlook. De asta numaram octeti si taiem doar intre caractere intregi.
 */
function pliaza(rand: string): string {
  const octeti = Buffer.from(rand, 'utf8')
  if (octeti.length <= 75) return rand

  const bucati: string[] = []
  let curent = ''
  let lungime = 0
  for (const caracter of rand) {
    const cat = Buffer.byteLength(caracter, 'utf8')
    // Randurile de continuare incep cu un spatiu, deci au un octet in minus.
    const maxim = bucati.length === 0 ? 75 : 74
    if (lungime + cat > maxim) {
      bucati.push(curent)
      curent = ''
      lungime = 0
    }
    curent += caracter
    lungime += cat
  }
  if (curent) bucati.push(curent)
  return bucati.join('\r\n ')
}

function scapaIcs(valoare: string): string {
  return valoare.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Un singur eveniment, randurile lui. */
function eveniment(p: Programare, c: Client, setari: Setari, pentruDorina: boolean): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${p.id}@dordefranceza.com`,
    `DTSTAMP:${campUtc(new Date())}`,
    `DTSTART:${campUtc(p.incepe)}`,
    `DTEND:${campUtc(sfarsitul(p))}`,
    `SUMMARY:${scapaIcs(titlul(p, c, pentruDorina))}`,
    `DESCRIPTION:${scapaIcs(descrierea(p, c, setari, pentruDorina))}`,
    `LOCATION:${scapaIcs(p.link_zoom || setari.link_zoom || 'Zoom')}`,
    'STATUS:CONFIRMED',
    // Amintirea, cu 30 de minute inainte, cat a cerut Artiom. Merge fara nicio
    // setare pe telefon: e scrisa in eveniment, nu in calendar.
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${scapaIcs(`Peste 30 de minute: ${titlul(p, c, pentruDorina)} (${dataOraRo(p.incepe)})`)}`,
    'END:VALARM',
    'END:VEVENT',
  ]
}

/** Fisierul .ics al uneia sau al mai multor lectii, gata de atasat la email. */
export function fisierIcs(p: Programare | Programare[], c: Client, setari: Setari, pentruDorina = false): string {
  const lista = Array.isArray(p) ? p : [p]
  const randuri = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DorDeFranceza//Programari//RO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...lista.flatMap((x) => eveniment(x, c, setari, pentruDorina)),
    'END:VCALENDAR',
  ]
  return randuri.map(pliaza).join('\r\n') + '\r\n'
}

/** Fisierul .ics in forma ceruta de Resend pentru atasamente. */
export function atasamentIcs(p: Programare | Programare[], c: Client, setari: Setari, pentruDorina = false) {
  return {
    nume: 'lectie.ics',
    continut: Buffer.from(fisierIcs(p, c, setari, pentruDorina), 'utf8').toString('base64'),
  }
}
