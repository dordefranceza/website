/**
 * Personajul în cerc, pentru cabinet.
 *
 * Aceleași proporții ca varianta din site, `src/components/PersonajCerc.astro`:
 * figura e 1,11 din diametru, capul stă la 0,038 din el, iar deplasarea pe
 * orizontală aduce CAPUL în mijloc, nu cutia figurii. Fără ea, pozițiile cu un
 * braț întins par descentrate, deși matematic nu sunt.
 *
 * Clasele `.personaj-cerc`, `.pc-disc` și `.pc-figura` stau în `global.css`,
 * nu în componenta Astro, tocmai ca să le poată folosi și fișierul ăsta.
 */
export type NumePersonaj =
  | 'saluta'
  | 'cauta'
  | 'scrie'
  | 'telefon'
  | 'arata'
  | 'prezinta'
  | 'incurajeaza'
  | 'inima'
  | 'asezata'
  | 'ganditoare'

const INEL = {
  roz: 'bg-roz',
  verde: 'bg-verde',
  portocaliu: 'bg-portocaliu',
  albastru: 'bg-albastru',
  navy: 'bg-navy',
  crem: 'bg-crem',
  'crem-inchis': 'bg-crem-inchis',
  'albastru-10': 'bg-albastru-10',
} as const

const DISC = {
  alb: 'bg-alb',
  crem: 'bg-crem',
  'albastru-5': 'bg-albastru-5',
} as const

/** Cât se mută figura pe orizontală, ca fracțiune din lățimea fișierului. */
const DEPLASARE: Record<NumePersonaj, number> = {
  arata: 0.042,
  asezata: 0.104,
  cauta: 0.107,
  ganditoare: -0.127,
  incurajeaza: -0.032,
  inima: 0.005,
  prezinta: -0.196,
  saluta: 0.121,
  scrie: 0.048,
  telefon: -0.052,
}

/** Raportul lățime/înălțime al fiecărui fișier. */
const RAPORT: Record<NumePersonaj, number> = {
  saluta: 257 / 640,
  cauta: 308 / 640,
  scrie: 270 / 640,
  telefon: 249 / 640,
  arata: 382 / 640,
  prezinta: 340 / 640,
  incurajeaza: 249 / 640,
  inima: 310 / 640,
  asezata: 493 / 900,
  ganditoare: 327 / 900,
}

export function PersonajCerc({
  nume,
  inel = 'albastru-10',
  disc = 'alb',
  marime = 140,
  marimeMare,
  grosime = 10,
  className = '',
}: {
  nume: NumePersonaj
  inel?: keyof typeof INEL
  disc?: keyof typeof DISC
  marime?: number
  marimeMare?: number
  grosime?: number
  className?: string
}) {
  const mare = marimeMare ?? marime
  const inaltimeImg = Math.round(mare * 1.11)
  const latimeImg = Math.round(inaltimeImg * RAPORT[nume])
  const deplasare = Math.round(1.11 * RAPORT[nume] * DEPLASARE[nume] * 10000) / 10000

  return (
    <div
      className={`personaj-cerc shrink-0 rounded-full ${INEL[inel]} ${className}`}
      style={
        {
          '--d': `${marime}px`,
          '--d-sm': `${mare}px`,
          '--g': `${grosime}px`,
          '--dep': deplasare,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <div className={`pc-disc relative overflow-hidden rounded-full ${DISC[disc]}`}>
        <img
          src={`/images/personaj/${nume}.webp`}
          alt=""
          width={latimeImg}
          height={inaltimeImg}
          className="pc-figura absolute left-1/2 w-auto max-w-none"
          decoding="async"
        />
      </div>
    </div>
  )
}
