/**
 * Construieste toate iconitele site-ului din aceleasi piese ale marcii:
 * litera D si accentul, decupate chiar din sigla, plus Turnul Eiffel din
 * familia de semne, asezat in golul literei.
 *
 * De ce se fac TOATE, nu doar favicon.png: Google nu ia neaparat iconita din
 * <link rel="icon">. Citeste si apple-touch-icon, si adesea o prefera pe cea
 * mai mare pe care o gaseste. Daca ramane una veche undeva, aia ajunge in
 * rezultate.
 *
 * Si de ce exista favicon.ico: crawlerele cer intai adresa aia. Fara fisier pe
 * disc, site-ul raspunde cu propria pagina de 404, in HTML. Verificat pe live
 * pe 12 septembrie 2026: 84 KB de HTML in loc de o iconita.
 *
 * Folosire: node scripts/fa-iconitele.mjs
 */
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const S = 512
const ALBASTRU = { r: 72, g: 101, b: 255 }
const ALB = { r: 255, g: 255, b: 255 }

const disc = (c) =>
  sharp(Buffer.from(`<svg width="${S}" height="${S}"><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="rgb(${c.r},${c.g},${c.b})"/></svg>`)).png().toBuffer()

/** pastreaza forma (canalul alfa) si ii da o culoare plata; `ingrosare` umfla liniile subtiri */
async function recoloreaza(src, culoare, inaltime, ingrosare = 0) {
  const img = sharp(src).ensureAlpha()
  const { data, info } = await (inaltime ? img.resize({ height: inaltime }) : img).raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  let alfa = new Uint8Array(W * H)
  for (let p = 0; p < W * H; p++) alfa[p] = data[p * 4 + 3]
  for (let pas = 0; pas < ingrosare; pas++) {
    const nou = new Uint8Array(W * H)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let m = 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
        if (alfa[ny * W + nx] > m) m = alfa[ny * W + nx]
      }
      nou[y * W + x] = m
    }
    alfa = nou
  }
  const out = Buffer.alloc(W * H * 4)
  for (let p = 0; p < W * H; p++) { out[p * 4] = culoare.r; out[p * 4 + 1] = culoare.g; out[p * 4 + 2] = culoare.b; out[p * 4 + 3] = alfa[p] }
  return { buf: await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer(), W, H }
}

/** golul din burta literei: zona transparenta dinauntru, negasita dinspre margini */
async function burta(dBuf) {
  const { data, info } = await sharp(dBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const gol = new Uint8Array(W * H), coada = new Int32Array(W * H)
  let cap = 0, len = 0
  const transparent = (p) => data[p * 4 + 3] < 40
  const pune = (x, y) => { const p = y * W + x; if (gol[p] || !transparent(p)) return; gol[p] = 1; coada[len++] = p }
  for (let x = 0; x < W; x++) { pune(x, 0); pune(x, H - 1) }
  for (let y = 0; y < H; y++) { pune(0, y); pune(W - 1, y) }
  while (cap < len) {
    const p = coada[cap++], x = p % W, y = (p / W) | 0
    if (x > 0) pune(x - 1, y); if (x < W - 1) pune(x + 1, y)
    if (y > 0) pune(x, y - 1); if (y < H - 1) pune(x, y + 1)
  }
  let minX = W, minY = H, maxX = -1, maxY = -1
  for (let p = 0; p < W * H; p++) {
    if (gol[p] || !transparent(p)) continue
    const x = p % W, y = (p / W) | 0
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

const dSursa = await sharp('public/images/semne/nume.webp').extract({ left: 0, top: 0, width: 66, height: 70 }).trim({ threshold: 8 }).png().toBuffer()
const accSursa = await sharp('public/images/semne/nume.webp').extract({ left: 63, top: 0, width: 16, height: 18 }).trim({ threshold: 8 }).png().toBuffer()

const inaltimeD = Math.round(S * 0.58)
const D = await recoloreaza(dSursa, ALB, inaltimeD)
/* accentul la 0,28 din inaltimea literei: Artiom l-a vrut putin mai mare decat prima incercare, care era 0,22 */
const acc = await recoloreaza(accSursa, ALB, Math.round(inaltimeD * 0.28))
const b = await burta(D.buf)
const turn = await recoloreaza('public/images/semne/eiffel.webp', ALB, Math.round(b.h * 0.80), 2)

const latimeTot = D.W + 4 + acc.W
const stangaD = Math.round((S - latimeTot) / 2)
const susD = Math.round((S - D.H) / 2)

const marca = await sharp(await disc(ALBASTRU)).composite([
  { input: D.buf, left: stangaD, top: susD },
  { input: acc.buf, left: stangaD + D.W + 2, top: susD + Math.round(D.H * 0.02) },
  { input: turn.buf, left: stangaD + b.x + Math.round((b.w - turn.W) / 2), top: susD + b.y + Math.round((b.h - turn.H) / 2) },
]).png().toBuffer()

/** un .ico e doar un antet plus cateva PNG-uri puse cap la cap */
function faIco(imagini) {
  const antet = Buffer.alloc(6)
  antet.writeUInt16LE(0, 0); antet.writeUInt16LE(1, 2); antet.writeUInt16LE(imagini.length, 4)
  const intrari = []
  let pozitie = 6 + imagini.length * 16
  for (const { px, png } of imagini) {
    const e = Buffer.alloc(16)
    e.writeUInt8(px >= 256 ? 0 : px, 0); e.writeUInt8(px >= 256 ? 0 : px, 1)
    e.writeUInt8(0, 2); e.writeUInt8(0, 3)
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6)
    e.writeUInt32LE(png.length, 8); e.writeUInt32LE(pozitie, 12)
    intrari.push(e); pozitie += png.length
  }
  return Buffer.concat([antet, ...intrari, ...imagini.map((i) => i.png)])
}

await sharp(marca).resize(96, 96).png({ compressionLevel: 9 }).toFile('public/favicon.png')
await sharp(marca).resize(180, 180).flatten({ background: ALBASTRU }).png({ compressionLevel: 9 }).toFile('public/apple-touch-icon.png')
await sharp(marca).resize(512, 512).flatten({ background: ALBASTRU }).png({ compressionLevel: 9 }).toFile('public/icoana-512.png')

const bucati = []
for (const px of [16, 32, 48]) bucati.push({ px, png: await sharp(marca).resize(px, px).png({ compressionLevel: 9 }).toBuffer() })
writeFileSync('public/favicon.ico', faIco(bucati))

console.log('favicon.png 96, apple-touch-icon 180, icoana-512, favicon.ico 16/32/48')
