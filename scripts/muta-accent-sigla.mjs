// Muta accentul albastru din sigla spre dreapta, cu N pixeli.
// Masca de accent se ia din nume.webp, unde accentul e singurul lucru albastru,
// si se aplica identic pe nume-alb.png, care are aceeasi geometrie dar totul alb.
import sharp from 'sharp'

const [srcMask, files, offset, sufix] = [
  'public/images/semne/nume.webp',
  ['public/images/semne/nume.webp', 'public/images/semne/nume-alb.png'],
  Number(process.argv[2] ?? 6),
  process.argv[3] ?? '',
]

const m = await sharp(srcMask).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels: C } = m.info
const masca = []
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * C, r = m.data[i], g = m.data[i + 1], b = m.data[i + 2], a = m.data[i + 3]
  if (a >= 40 && b > 150 && g > 60 && b - r > 60) masca.push([x, y])
}

for (const f of files) {
  const s = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const d = Buffer.from(s.data)
  const pastrate = masca.map(([x, y]) => {
    const i = (y * W + x) * C
    return [x, y, d[i], d[i + 1], d[i + 2], d[i + 3]]
  })
  for (const [x, y] of masca) { const i = (y * W + x) * C; d[i + 3] = 0 }
  for (const [x, y, r, g, b, a] of pastrate) {
    const nx = x + offset
    if (nx >= W) continue
    const i = (y * W + nx) * C
    const af = a / 255, ab = d[i + 3] / 255, ao = af + ab * (1 - af)
    if (ao <= 0) { d[i + 3] = 0; continue }
    d[i]     = Math.round((r * af + d[i]     * ab * (1 - af)) / ao)
    d[i + 1] = Math.round((g * af + d[i + 1] * ab * (1 - af)) / ao)
    d[i + 2] = Math.round((b * af + d[i + 2] * ab * (1 - af)) / ao)
    d[i + 3] = Math.round(ao * 255)
  }
  const iesire = sufix ? f.replace(/(\.\w+)$/, `${sufix}$1`) : f
  const img = sharp(d, { raw: { width: W, height: H, channels: C } })
  await (iesire.endsWith('.png') ? img.png() : img.webp({ quality: 95, alphaQuality: 100 })).toFile(iesire)
  console.log('scris', iesire, `(+${offset}px)`)
}
