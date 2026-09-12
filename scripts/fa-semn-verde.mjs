/**
 * Face varianta verde a unui semn, pentru blocul de garantie.
 *
 * Semnele marcii sunt toate cobalt, dar blocul de garantie e verde: un semn
 * albastru acolo se vede ca venit din alta parte. Asa ca semnul ala, si numai
 * el, are o varianta verde. Cremul din interior ramane crem, ca sa nu se piarda
 * forma.
 *
 * Folosire: node scripts/fa-semn-verde.mjs <semn-sursa> <nume-iesire>
 */
import sharp from 'sharp'

const VERDE = { r: 44, g: 122, b: 52 }
const [sursa, nume] = process.argv.slice(2)
if (!sursa || !nume) {
  console.error('folosire: node scripts/fa-semn-verde.mjs <semn-sursa> <nume-iesire>')
  process.exit(1)
}

const cale = `public/images/semne/${sursa}.webp`
const { data, info } = await sharp(cale).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H } = info
const out = Buffer.from(data)
for (let p = 0; p < W * H; p++) {
  const i = p * 4
  if (out[i + 3] < 20) continue
  const r = out[i], g = out[i + 1], b = out[i + 2]
  if (r > 215 && g > 205 && b > 185) continue
  const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
  const k = lum < 0.25 ? 0.62 : 1
  out[i] = Math.round(VERDE.r * k)
  out[i + 1] = Math.round(VERDE.g * k)
  out[i + 2] = Math.round(VERDE.b * k)
}
const iesire = `public/images/semne/${nume}.webp`
await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .webp({ quality: 92, alphaQuality: 100 })
  .toFile(iesire)
const m = await sharp(iesire).metadata()
console.log(`${iesire}  ${m.width}x${m.height}  raport ${(m.width / m.height).toFixed(4)}`)
