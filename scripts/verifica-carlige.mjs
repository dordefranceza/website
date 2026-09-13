/**
 * Caută cârlige React chemate după o ieșire timpurie.
 *
 * Greșeala asta am făcut-o de două ori în aceeași noapte: un `useState` pus
 * după `if (!ceva) return null`. React cere ca toate cârligele să fie chemate
 * în aceeași ordine la fiecare randare, iar când componenta trece de ieșire se
 * cheamă deodată mai multe decât înainte și ecranul se face alb. Nu dă nicio
 * eroare la build și nici `astro check` nu o vede: se rupe abia la clic.
 *
 *   node scripts/verifica-carlige.mjs
 *
 * Iese cu 1 dacă găsește ceva, deci poate sta și într-un hook de git.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const CARLIG = /\b(useState|useEffect|useMemo|useRef|useCallback|useLayoutEffect)\s*\(/

function fisiere(dir) {
  return readdirSync(dir).flatMap((n) => {
    const cale = join(dir, n)
    if (statSync(cale).isDirectory()) return fisiere(cale)
    return cale.endsWith('.tsx') ? [cale] : []
  })
}

/** Corpul fiecărei componente (funcție cu nume care începe cu majusculă). */
function* componente(text) {
  for (const m of text.matchAll(/^(?:export default function|function)\s+([A-Z]\w*)\s*\(/gm)) {
    const nume = m[1]
    const start = text.indexOf('{', m.index + m[0].length - 1)
    if (start < 0) continue
    let adanc = 0
    let i = start
    for (; i < text.length; i++) {
      if (text[i] === '{') adanc++
      else if (text[i] === '}' && --adanc === 0) break
    }
    yield [nume, text.slice(start, i + 1)]
  }
}

let gasite = 0
for (const f of fisiere('src')) {
  for (const [nume, corp] of componente(readFileSync(f, 'utf8'))) {
    const linii = corp.split('\n')
    let adanc = 0
    let iesire = -1
    for (let n = 0; n < linii.length; n++) {
      const l = linii[n]
      if (adanc === 1) {
        // `return (` e randarea componentei, nu o iesire timpurie
        if (iesire < 0 && /\breturn\b/.test(l) && !l.includes('return (')) iesire = n
        else if (iesire >= 0 && CARLIG.test(l)) {
          gasite++
          console.error(`${f} :: ${nume}`)
          console.error(`  ieșire pe randul ${iesire + 1}: ${linii[iesire].trim().slice(0, 70)}`)
          console.error(`  cârlig după ea, randul ${n + 1}: ${l.trim().slice(0, 70)}\n`)
          break
        }
      }
      adanc += (l.match(/\{/g) ?? []).length - (l.match(/\}/g) ?? []).length
    }
  }
}

if (gasite) {
  console.error(`${gasite} ${gasite === 1 ? 'loc' : 'locuri'} unde ecranul se face alb la clic. Mută cârligele înaintea ieșirii.`)
  process.exit(1)
}
console.log('Cârligele React sunt toate chemate înaintea oricărei ieșiri. Curat.')
