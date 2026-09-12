/**
 * Decupeaza figura de pe fundalul crem, pe transparent.
 *
 * NU prin scoaterea unei culori: bluza personajului e crem exact ca fundalul
 * si s-ar gauri. Se inunda din cele patru laturi si se transparentizeaza doar
 * pixelii de fundal legati de margine. Ce e inchis de conturul albastru ramane.
 *
 * Apoi se taie marginile goale, se redimensioneaza la 640px inaltime si se
 * salveaza webp cu alphaQuality 100.
 *
 * Folosire: node scripts/decupa-personaj.mjs <intrare.png> <nume-iesire> [inaltime]
 *   pune rezultatul in public/images/personaj/<nume-iesire>.webp
 *   inaltimea implicita e 640px, dublul marimii la care se afiseaza in
 *   sectiuni. Pentru figuri mari, de antet, da 1200 sau mai mult.
 */
import sharp from 'sharp'
import path from 'node:path'

const [intrare, nume, inaltimeCeruta] = process.argv.slice(2)
const INALTIME = Number(inaltimeCeruta) || 640
if (!intrare || !nume) {
  console.error('folosire: node scripts/decupa-personaj.mjs <intrare> <nume-iesire>')
  process.exit(1)
}

/** Cat de departe de culoarea unui pixel de margine mai zice ca e tot fundal. */
const PRAG = 34

const img = sharp(intrare).ensureAlpha()
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels: C } = info

/** Culoarea fundalului, citita din cele patru colturi. */
const colturi = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]]
const fund = [0, 1, 2].map((c) => Math.round(colturi.reduce((s, [x, y]) => s + data[(y * W + x) * C + c], 0) / 4))

const aproape = (i) => {
  const d = Math.abs(data[i] - fund[0]) + Math.abs(data[i + 1] - fund[1]) + Math.abs(data[i + 2] - fund[2])
  return d <= PRAG * 3
}

// Inundare pe latime, pornind din toate marginile.
const vizitat = new Uint8Array(W * H)
const coada = new Int32Array(W * H)
let cap = 0, coadaLen = 0
const pune = (x, y) => {
  const p = y * W + x
  if (vizitat[p]) return
  if (!aproape(p * C)) return
  vizitat[p] = 1
  coada[coadaLen++] = p
}
for (let x = 0; x < W; x++) { pune(x, 0); pune(x, H - 1) }
for (let y = 0; y < H; y++) { pune(0, y); pune(W - 1, y) }
while (cap < coadaLen) {
  const p = coada[cap++]
  const x = p % W, y = (p / W) | 0
  if (x > 0) pune(x - 1, y)
  if (x < W - 1) pune(x + 1, y)
  if (y > 0) pune(x, y - 1)
  if (y < H - 1) pune(x, y + 1)
}

// Fundalul legat de margine devine transparent; restul ramane intact.
let minX = W, minY = H, maxX = -1, maxY = -1
for (let p = 0; p < W * H; p++) {
  const i = p * C
  if (vizitat[p]) {
    data[i + 3] = 0
  } else {
    const x = p % W, y = (p / W) | 0
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
}
if (maxX < 0) { console.error('nu a ramas nimic, praguri gresite'); process.exit(1) }

const iesire = path.join('public/images/personaj', `${nume}.webp`)
const latimeTaiata = maxX - minX + 1
const inaltimeTaiata = maxY - minY + 1

await sharp(data, { raw: { width: W, height: H, channels: C } })
  .extract({ left: minX, top: minY, width: latimeTaiata, height: inaltimeTaiata })
  .resize({ height: INALTIME, fit: 'inside', withoutEnlargement: false })
  .webp({ quality: 88, alphaQuality: 100 })
  .toFile(iesire)

const m = await sharp(iesire).metadata()
console.log(`${iesire}  ${m.width}x${m.height}  (din ${latimeTaiata}x${inaltimeTaiata})`)
