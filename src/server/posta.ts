/**
 * Verificarea adresei de email, dincolo de „are o zgârietură și un punct".
 *
 * Artiom a cerut asta cu vorbele lui: „să nu fie un gmail aiurea pus care
 * poate să-l pună oricare". Nu putem dovedi că omul chiar deține adresa fără
 * să-i trimitem un cod, dar putem opri trei sferturi din gunoi înainte să
 * ajungă la Dorina:
 *
 *  1. sintaxa, strânsă mai tare decât regexul de dinainte (lungimi, puncte
 *     lipite, TLD care arată a TLD);
 *  2. domeniile de unică folosință, alea care se sting în zece minute;
 *  3. **domeniul chiar primește poștă**, întrebat la DNS. Asta taie și
 *     `gmail.con`, și `asdfgh.com`, si domeniile inventate pe loc;
 *  4. greșelile de tastare la furnizorii mari, întoarse ca sugestie, nu ca
 *     refuz: omul vede „ai vrut gmail.com?" și se corectează singur.
 *
 * DNS-ul poate să nu răspundă. Atunci lăsăm adresa să treacă: un mesaj
 * pierdut de la un om adevărat costă mai mult decât un spam primit.
 */
import { promises as dns } from 'node:dns'

/** Cât așteptăm DNS-ul. Peste atât, mergem mai departe fără el. */
const RABDARE_MS = 2500

/** Cât ținem minte un domeniu deja întrebat. */
const TINE_MINTE_MS = 6 * 60 * 60 * 1000

/**
 * Adrese de unică folosință. Lista nu are cum să fie completă, apar altele în
 * fiecare zi, dar astea sunt cele care se aleg de obicei dintr-un reflex.
 */
const DE_ARUNCAT = new Set([
  '0-mail.com', '10minutemail.com', '10minutemail.net', '20minutemail.com', '33mail.com',
  'anonbox.net', 'armyspy.com', 'bccto.me', 'burnermail.io', 'cuvox.de',
  'dayrep.com', 'discard.email', 'dispostable.com', 'dropmail.me', 'einrot.com',
  'emailondeck.com', 'emailfake.com', 'fakeinbox.com', 'fakemail.net', 'fleckens.hu',
  'getairmail.com', 'getnada.com', 'grr.la', 'guerrillamail.com', 'guerrillamail.net',
  'guerrillamail.org', 'harakirimail.com', 'inboxbear.com', 'incognitomail.com', 'jetable.org',
  'mail-temporaire.fr', 'mail7.io', 'mailcatch.com', 'maildrop.cc', 'mailforspam.com',
  'mailinator.com', 'mailnesia.com', 'mailsac.com', 'mailtemp.info', 'moakt.com',
  'mohmal.com', 'mytemp.email', 'nada.email', 'nowmymail.com', 'oneoffmail.com',
  'owlymail.com', 'pokemail.net', 'rhyta.com', 'sharklasers.com', 'spam4.me',
  'spambog.com', 'spamgourmet.com', 'superrito.com', 'teleworm.us', 'temp-mail.io',
  'temp-mail.org', 'tempail.com', 'tempinbox.com', 'tempm.com', 'tempmail.net',
  'tempmailo.com', 'tempr.email', 'throwawaymail.com', 'trashmail.com', 'trashmail.de',
  'trbvm.com', 'tmpmail.org', 'vomoto.com', 'wegwerfmail.de', 'yopmail.com',
  'yopmail.fr', 'yopmail.net', 'zetmail.com',
])

/**
 * Furnizorii mari, pentru sugestii. Cheia e greșeala, valoarea e adresa bună.
 * Doar greșeli care chiar se fac la tastat, nu tot dicționarul.
 */
const GRESELI: Record<string, string> = {
  'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com', 'gmail.comm': 'gmail.com', 'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com', 'gmail.cpm': 'gmail.com', 'gmaill.com': 'gmail.com',
  'gnail.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.ro': 'gmail.com',
  'yahoo.co': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com', 'yahoo.cm': 'yahoo.com', 'yhaoo.com': 'yahoo.com',
  'hotmail.co': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com', 'hotamil.com': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlook.co': 'outlook.com',
  'iclould.com': 'icloud.com', 'icloud.co': 'icloud.com', 'iclod.com': 'icloud.com',
  'mail.ru.com': 'mail.ru', 'protonmai.com': 'protonmail.com',
}

/**
 * Sintaxa. Mai strânsă decât regexul de dinainte: fără puncte la capete, fără
 * puncte lipite, partea dinaintea zgârieturii cel mult 64 de caractere (asta
 * cere RFC 5321), domeniul cu cel puțin o etichetă și un TLD numai din litere.
 */
const LOCAL = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/
const DOMENIU = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/

export type Verdict = {
  ok: boolean
  /** ce îi arătăm omului, în română, dacă nu e ok */
  motiv?: string
  /** adresa corectată, când bănuim o greșeală de tastat */
  sugestie?: string
}

function desparte(email: string): [string, string] | null {
  const la = email.lastIndexOf('@')
  if (la < 1 || la === email.length - 1) return null
  return [email.slice(0, la), email.slice(la + 1).toLowerCase()]
}

/** Verificarea care nu are nevoie de rețea. */
export function formaEmail(email: string): Verdict {
  if (email.length < 6 || email.length > 254) return { ok: false, motiv: 'Adresa de email nu pare corectă' }
  const parti = desparte(email)
  if (!parti) return { ok: false, motiv: 'Adresa de email nu pare corectă' }
  const [local, domeniu] = parti
  if (local.length > 64 || !LOCAL.test(local)) return { ok: false, motiv: 'Adresa de email nu pare corectă' }
  if (!DOMENIU.test(domeniu)) return { ok: false, motiv: 'Adresa de email nu pare corectă' }
  if (DE_ARUNCAT.has(domeniu)) {
    return { ok: false, motiv: 'Adresa asta e temporară. Scrie una pe care o citești și peste o săptămână.' }
  }
  const bun = GRESELI[domeniu]
  if (bun) {
    return { ok: false, motiv: `Ai vrut ${local}@${bun}?`, sugestie: `${local}@${bun}` }
  }
  return { ok: true }
}

/* --- Domeniul chiar primește poștă? ---------------------------------------- */

const stiute = new Map<string, { primeste: boolean; cand: number }>()

async function areMX(domeniu: string): Promise<boolean> {
  const acum = Date.now()
  const stiut = stiute.get(domeniu)
  if (stiut && acum - stiut.cand < TINE_MINTE_MS) return stiut.primeste

  let primeste = true
  try {
    const mx = await Promise.race([
      dns.resolveMx(domeniu),
      new Promise<never>((_, nu) => setTimeout(() => nu(new Error('prea încet')), RABDARE_MS)),
    ])
    // Un MX adevarat arata a nume de gazda. Filtrele DNS care raspund in locul
    // internetului intorc adrese numerice; alea nu sunt servere de posta.
    const bune = Array.isArray(mx) ? mx.filter((x) => x?.exchange && !/^\d+\.\d+\.\d+\.\d+$/.test(x.exchange)) : []
    if (bune.length > 0) {
      primeste = true
    } else {
      // Fără MX, un domeniu poate primi totuși poștă pe adresa lui A. RFC 5321
      // spune să încercăm asta, deci o încercăm, altfel tăiem domenii mici dar
      // adevărate.
      primeste = await areAdresa(domeniu)
    }
  } catch (e) {
    const cod = (e as NodeJS.ErrnoException)?.code
    if (cod === 'ENOTFOUND' || cod === 'ENODATA') {
      primeste = await areAdresa(domeniu)
    } else {
      // DNS mut, lent sau supărat. Nu e vina omului care scrie.
      return true
    }
  }

  if (stiute.size > 400) stiute.clear()
  stiute.set(domeniu, { primeste, cand: acum })
  return primeste
}

/**
 * Unii furnizori de internet si unele filtre DNS nu spun „nu există", ci
 * răspund cu o adresă a lor, ca să-ți arate o pagină de reclamă. Adresele alea
 * cad în intervalele private: niciun server de poștă de pe internet nu stă
 * acolo. Deci le numărăm ca „domeniul nu există", nu ca „există".
 *
 * Se vede pe chiar mașina lui Artiom: un domeniu inventat întors ca
 * 100.127.132.229, din intervalul 100.64.0.0/10.
 */
function publica(ip: string): boolean {
  const o = ip.split('.').map(Number)
  if (o.length !== 4 || o.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false
  if (o[0] === 0 || o[0] === 10 || o[0] === 127) return false
  if (o[0] === 100 && o[1] >= 64 && o[1] <= 127) return false
  if (o[0] === 169 && o[1] === 254) return false
  if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return false
  if (o[0] === 192 && o[1] === 168) return false
  return true
}

async function areAdresa(domeniu: string): Promise<boolean> {
  try {
    const a = await Promise.race([
      dns.resolve4(domeniu),
      new Promise<never>((_, nu) => setTimeout(() => nu(new Error('prea încet')), RABDARE_MS)),
    ])
    return Array.isArray(a) && a.some(publica)
  } catch (e) {
    const cod = (e as NodeJS.ErrnoException)?.code
    if (cod === 'ENOTFOUND' || cod === 'ENODATA') return false
    return true
  }
}

/** Verificarea întreagă: formă, plus întrebat DNS-ul dacă domeniul ia poștă. */
export async function verificaEmail(email: string): Promise<Verdict> {
  const forma = formaEmail(email)
  if (!forma.ok) return forma
  const domeniu = desparte(email)![1]
  if (!(await areMX(domeniu))) {
    return { ok: false, motiv: `Domeniul ${domeniu} nu primește emailuri. Verifică adresa.` }
  }
  return { ok: true }
}
