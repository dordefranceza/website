/**
 * Numărul de telefon, pregătit pentru WhatsApp.
 *
 * Aici a fost un bug urât. Vechea socoteală punea `40` în fața oricărui număr
 * care începea cu zero, adică presupunea că toată lumea e din România. Un
 * cursant din Moldova care scria `069...` ajungea la `4069...`, un număr
 * românesc care există și e al altcuiva. Artiom: „mă duce pe altă parte".
 *
 * Nu se poate ști din cifre din ce țară e cineva, și nici dacă are WhatsApp.
 * Deci nu ghicim: dacă numărul nu spune singur țara, nu facem niciun link.
 * Mai bine niciun buton decât un buton care duce la un străin.
 */

/** Prefixele pe care le recunoaștem scrise fără plus, cu lungimea lor obișnuită. */
const TARI = [
  /^373\d{8}$/, // Moldova
  /^40\d{9}$/, // România
  /^33\d{9}$/, // Franța
  /^32\d{8,9}$/, // Belgia
  /^41\d{9}$/, // Elveția
]

/**
 * Numărul în formă internațională, doar cifre, gata de pus în `wa.me/`.
 * Întoarce '' când nu se poate ști țara: atunci nu se arată butonul.
 */
export function numarInternational(telefon: string): string {
  const brut = (telefon ?? '').trim()
  const cifre = brut.replace(/\D/g, '')
  if (cifre.length < 8) return ''
  // Scris de om cu plus, sau cu 00 în față: ne-a spus el țara.
  if (brut.startsWith('+')) return cifre
  if (cifre.startsWith('00')) return cifre.slice(2)
  // Scris fără plus, dar se potrivește cu un prefix de țară pe lungimea lui.
  if (TARI.some((t) => t.test(cifre))) return cifre
  return ''
}
