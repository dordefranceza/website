/**
 * Scrie src/server/figuri.ts din pozele de la public/images/email/*.png.
 *
 * Pozele calatoresc INAUNTRUL emailului, nu ca adresa de pe site: altfel Gmail
 * de pe telefon nu le incarca pana nu apesi „afiseaza imaginile", iar in capul
 * mesajului ramane un gol. Se ruleaza cand se schimba o poza.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'public/images/email'
const figuri = readdirSync(DIR)
  .filter((n) => n.endsWith('.png'))
  .map((n) => [n.replace(/\.png$/, ''), readFileSync(join(DIR, n)).toString('base64')])

const cap = `/**
 * Personajul, scris in cod ca sa calatoreasca INAUNTRUL emailului.
 *
 * Pana acum poza venea de pe site, printr-o adresa obisnuita. Pe calculator se
 * vedea, fiindca Artiom apasase candva „afiseaza imaginile" pentru expeditorul
 * asta. Pe telefon nu: Gmail nu incarca pozele de la un expeditor necunoscut
 * pana nu i se spune, iar in capul mesajului ramanea un gol. Cursantul, care
 * primeste primul email de la noi in viata lui, vedea tot un gol.
 *
 * Asa, poza pleaca odata cu mesajul, ca atasament nevazut legat prin
 * \`content_id\`. Clientii de email o arata fara sa intrebe pe nimeni, fiindca nu
 * mai e ceva adus de pe internet, e o bucata din scrisoare.
 *
 * Fisierul e generat din public/images/email/*.png:
 *   node scripts/fa-figuri-email.mjs
 * Nu se scrie de mana.
 */
export const FIGURI: Record<string, string> = {
`
writeFileSync('src/server/figuri.ts', cap + figuri.map(([n, b]) => `  ${n}: '${b}',\n`).join('') + '}\n', 'utf8')
console.log('scris src/server/figuri.ts:', figuri.map(([n]) => n).join(', '))
