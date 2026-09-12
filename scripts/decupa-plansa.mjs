/**
 * Taie o plansa de semne in fisiere separate, cate unul pentru fiecare semn.
 *
 * Pasii: se inunda fundalul dinspre cele patru laturi si se transparentizeaza
 * doar pixelii legati de margine (aceeasi metoda ca la personaj, ca sa nu se
 * gaureasca zonele deschise din interiorul unui semn). Apoi ce a ramas se
 * imparte in bucati legate intre ele, fiecare bucata fiind un semn, si fiecare
 * se salveaza taiata pe marginile ei.
 *
 * Folosire: node scripts/decupa-plansa.mjs <plansa.png> <inaltime> <nume1> <nume2> ...
 *   numele se dau in ordinea citirii: stanga-sus, dreapta-sus, stanga-jos, ...
 *   fara nume, doar raporteaza ce bucati a gasit si unde sunt.
 */
import sharp from 'sharp'
import path from 'node:path'

const [intrare, inaltimeStr, ...nume] = process.argv.slice(2)
const INALTIME = Number(inaltimeStr) || 260
const PRAG = 34
/** bucatile mai mici de atat sunt praf de scanare, nu semne */
const MINIM = 900

const { data, info } = await sharp(intrare).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels: C } = info

const colturi = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]]
const fund = [0, 1, 2].map((c) => Math.round(colturi.reduce((s, [x, y]) => s + data[(y * W + x) * C + c], 0) / 4))
const aproapeDeFund = (p) => {
  const i = p * C
  return Math.abs(data[i] - fund[0]) + Math.abs(data[i + 1] - fund[1]) + Math.abs(data[i + 2] - fund[2]) <= PRAG * 3
}

// 1. inundare din margini
const fundal = new Uint8Array(W * H)
const coada = new Int32Array(W * H)
let cap = 0, len = 0
const pune = (x, y) => {
  const p = y * W + x
  if (fundal[p] || !aproapeDeFund(p)) return
  fundal[p] = 1
  coada[len++] = p
}
for (let x = 0; x < W; x++) { pune(x, 0); pune(x, H - 1) }
for (let y = 0; y < H; y++) { pune(0, y); pune(W - 1, y) }
while (cap < len) {
  const p = coada[cap++], x = p % W, y = (p / W) | 0
  if (x > 0) pune(x - 1, y)
  if (x < W - 1) pune(x + 1, y)
  if (y > 0) pune(x, y - 1)
  if (y < H - 1) pune(x, y + 1)
}

// 2. bucatile ramase, fiecare legata in ea insasi
const eticheta = new Int32Array(W * H).fill(-1)
const bucati = []
for (let p0 = 0; p0 < W * H; p0++) {
  if (fundal[p0] || eticheta[p0] >= 0) continue
  const id = bucati.length
  let n = 0, minX = W, minY = H, maxX = -1, maxY = -1
  cap = 0; len = 0
  eticheta[p0] = id; coada[len++] = p0
  while (cap < len) {
    const p = coada[cap++], x = p % W, y = (p / W) | 0
    n++
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
    const vecini = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
    for (const [vx, vy] of vecini) {
      if (vx < 0 || vy < 0 || vx >= W || vy >= H) continue
      const q = vy * W + vx
      if (fundal[q] || eticheta[q] >= 0) continue
      eticheta[q] = id; coada[len++] = q
    }
  }
  bucati.push({ id, n, minX, minY, maxX, maxY })
}

/**
 * Bucatile legate NU sunt semne: acordeonul e din foaie si foaie, cartea din
 * pagini, ceasca si farfuria sunt doua piese. Dar plansa e o retea de 2 pe 2,
 * asa ca semnele se aduna dupa sfertul in care cade fiecare bucata, iar semnul
 * e reuniunea marginilor bucatilor din acel sfert.
 */
const MIC = 60
const sferturi = [0, 1, 2, 3].map(() => ({ minX: W, minY: H, maxX: -1, maxY: -1, n: 0 }))
for (const b of bucati) {
  if (b.n < MIC) continue
  const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2
  const s = sferturi[(cy > H / 2 ? 2 : 0) + (cx > W / 2 ? 1 : 0)]
  s.minX = Math.min(s.minX, b.minX); s.minY = Math.min(s.minY, b.minY)
  s.maxX = Math.max(s.maxX, b.maxX); s.maxY = Math.max(s.maxY, b.maxY)
  s.n += b.n
}
const reale = sferturi.filter((s) => s.maxX >= 0 && s.n >= MINIM)

console.log(`${reale.length} semne gasite, adunate din ${bucati.length} bucati`)
for (const [i, b] of reale.entries()) {
  console.log(`  ${i + 1}. ${b.maxX - b.minX + 1}x${b.maxY - b.minY + 1} la (${b.minX},${b.minY})  ${nume[i] ?? '(fara nume)'}`)
}
if (!nume.length) process.exit(0)

// 3. fiecare bucata, taiata si salvata; restul paginii devine transparent
for (const [i, b] of reale.entries()) {
  if (!nume[i]) continue
  const lat = b.maxX - b.minX + 1, inalt = b.maxY - b.minY + 1
  const buf = Buffer.alloc(lat * inalt * 4)
  for (let y = 0; y < inalt; y++) for (let x = 0; x < lat; x++) {
    const src = ((b.minY + y) * W + (b.minX + x)) * C
    const dst = (y * lat + x) * 4
    const eFundal = fundal[(b.minY + y) * W + (b.minX + x)] === 1
    buf[dst] = data[src]; buf[dst + 1] = data[src + 1]; buf[dst + 2] = data[src + 2]
    buf[dst + 3] = eFundal ? 0 : data[src + 3]
  }
  const iesire = path.join('public/images/semne', `${nume[i]}.webp`)
  await sharp(buf, { raw: { width: lat, height: inalt, channels: 4 } })
    .resize({ height: INALTIME, fit: 'inside' })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(iesire)
  const m = await sharp(iesire).metadata()
  console.log(`  scris ${iesire}  ${m.width}x${m.height}  raport ${(m.width / m.height).toFixed(4)}`)
}
