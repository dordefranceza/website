/**
 * Personajul in cerc, pentru antetul emailurilor.
 *
 * De ce fisiere gata facute si nu HTML: in emailuri nu te poti bizui pe
 * `border-radius` (Outlook pe Windows il ignora) si nici pe transparenta peste
 * un fundal colorat. Asa ca desenam cercul crem SI fundalul bleumarin direct in
 * poza. Iese un dreptunghi obisnuit, care arata la fel peste tot.
 *
 * Folosire: node scripts/fa-poze-email.mjs
 *   scrie in public/images/email/<nume>.png
 */
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const NAVY = { r: 0x1b, g: 0x14, b: 0x63 }
const CREM = { r: 0xf8, g: 0xf3, b: 0xeb }
const D = 240            // diametrul, la doua ori marimea de afisare
const POZE = ['saluta', 'telefon', 'incurajeaza', 'scrie']

mkdirSync('public/images/email', { recursive: true })

/** Masca rotunda, desenata la patru ori marimea si micsorata: margine curata. */
async function cerc(d) {
  const mare = d * 4
  const svg = `<svg width="${mare}" height="${mare}"><circle cx="${mare / 2}" cy="${mare / 2}" r="${mare / 2}" fill="#fff"/></svg>`
  // Aplatizat pe negru SI trecut explicit pe alb-negru: `greyscale()` singur
  // pastreaza canalul alfa al SVG-ului, iar `joinChannel` primeste doi octeti
  // pe pixel in loc de unul si masca nu se aplica deloc.
  const brut = await sharp(Buffer.from(svg))
    .resize(d, d)
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .toColourspace('b-w')
    .raw()
    .toBuffer()
  if (brut.length !== d * d) throw new Error(`masca are ${brut.length} octeti, trebuia ${d * d}`)
  return brut
}

const masca = await cerc(D)

for (const nume of POZE) {
  // Figura, la inaltimea folosita si in PersonajCerc: 1,11 din diametru.
  const inaltime = Math.round(D * 1.11)
  const figura = await sharp(`public/images/personaj/${nume}.webp`).resize({ height: inaltime }).png().toBuffer()
  const { width: lf } = await sharp(figura).metadata()

  // Panza e mai inalta decat cercul, fiindca figura e mai inalta decat el:
  // sharp nu primeste pozitii negative, deci asezam pe o panza mare si taiem
  // pe urma patratul de sus. Ce ramane afara e chiar ce ascunde si cercul.
  const sus = Math.round(D * 0.038)
  const panza = Math.max(D, inaltime + sus)
  // Doua treceri, nu una: `extract` in aceeasi conducta cu `composite` se
  // aplica inaintea lui si sharp se plange ca figura nu incape.
  const intreaga = await sharp({ create: { width: D, height: panza, channels: 3, background: CREM } })
    .composite([{ input: figura, left: Math.round((D - lf) / 2), top: sus }])
    .png()
    .toBuffer()
  const peCrem = await sharp(intreaga).extract({ left: 0, top: 0, width: D, height: D }).png().toBuffer()

  // Taiem rotund PE PIXELI, nu prin `composite` cu masca.
  //
  // Capcana, aceeasi ca la favicon: o masca de un singur canal data lui
  // `joinChannel` sau lui `blend: dest-in` nu se aplica, iar ce iese e un
  // patrat plin. Aici amestecam noi: cat e masca de alba, atat se vede din
  // figura; cat e neagra, atat se vede bleumarinul. Marginea ramane lina,
  // fiindca masca vine dintr-un cerc desenat la patru ori marimea.
  const { data: px } = await sharp(peCrem).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const iesire = Buffer.alloc(D * D * 3)
  for (let i = 0; i < D * D; i++) {
    const a = masca[i] / 255
    iesire[i * 3] = Math.round(px[i * 3] * a + NAVY.r * (1 - a))
    iesire[i * 3 + 1] = Math.round(px[i * 3 + 1] * a + NAVY.g * (1 - a))
    iesire[i * 3 + 2] = Math.round(px[i * 3 + 2] * a + NAVY.b * (1 - a))
  }

  await sharp(iesire, { raw: { width: D, height: D, channels: 3 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(`public/images/email/${nume}.png`)

  console.log(`public/images/email/${nume}.png  ${D}x${D}`)
}
