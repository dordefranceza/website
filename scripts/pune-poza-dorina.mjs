/**
 * Pune poza Dorinei pe site, dintr-un singur fișier.
 *
 *   node scripts/pune-poza-dorina.mjs ~/Desktop/dorina.jpg
 *
 * Face trei lucruri: taie pătrat centrat pe partea de sus (acolo e fața într-un
 * portret vertical), scoate trei mărimi în WebP și le pune în public/images/.
 * Dacă fișierul e HEIC, îl convertește tot aici.
 */
import sharp from 'sharp'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const sursa = process.argv[2]
if (!sursa || !existsSync(sursa)) {
  console.error('Dă calea către poză. Exemplu:\n  node scripts/pune-poza-dorina.mjs ~/Desktop/dorina.jpg')
  process.exit(1)
}

const dest = join(process.cwd(), 'public', 'images')
mkdirSync(dest, { recursive: true })

const meta = await sharp(sursa).metadata()
const latura = Math.min(meta.width, meta.height)

/**
 * Un portret vertical are fața în treimea de sus. Un pătrat luat din centru
 * i-ar tăia fruntea, deci pornim mai de sus și lăsăm puțin aer deasupra.
 */
const sus = meta.height > meta.width ? Math.round((meta.height - latura) * 0.12) : Math.round((meta.height - latura) / 2)
const stanga = Math.round((meta.width - latura) / 2)

const patrat = sharp(sursa).extract({ left: stanga, top: sus, width: latura, height: latura })

for (const [nume, px, calitate] of [
  ['dorina-800', 800, 84],
  ['dorina-480', 480, 82],
  ['dorina-320', 320, 80],
]) {
  await patrat.clone().resize(px, px, { fit: 'cover', kernel: 'lanczos3' }).webp({ quality: calitate }).toFile(join(dest, `${nume}.webp`))
  console.log(`${nume}.webp gata`)
}

console.log(`\nPoza originală: ${meta.width}x${meta.height}. Pătratul luat: ${latura}px, de la ${sus}px de sus.`)
console.log('Gata. Reîncarcă pagina.')

/**
 * Pentru secțiunea „Despre” rama e 4:5, mai înaltă decât un pătrat. Dacă îi
 * dăm pătratul, browserul taie din el și ajunge prea aproape de față. Aici
 * scoatem o variantă 4:5 luată din poza întreagă.
 */
const inaltimeCeruta = Math.round(meta.width * 1.25)
if (meta.height >= inaltimeCeruta) {
  await sharp(sursa)
    .extract({ left: 0, top: Math.round((meta.height - inaltimeCeruta) * 0.1), width: meta.width, height: inaltimeCeruta })
    .resize(720, 900, { fit: 'cover', kernel: 'lanczos3' })
    .webp({ quality: 84 })
    .toFile(join(dest, 'dorina-portret.webp'))
} else {
  // Poza e prea lată pentru 4:5: o lăsăm întreagă și o încadrăm cu object-cover.
  await sharp(sursa).resize(720, 900, { fit: 'cover', position: 'top', kernel: 'lanczos3' }).webp({ quality: 84 }).toFile(join(dest, 'dorina-portret.webp'))
}
console.log('dorina-portret.webp gata (4:5, pentru secțiunea Despre)')
