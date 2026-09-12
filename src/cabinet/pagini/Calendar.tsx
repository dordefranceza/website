/**
 * Calendarul lectiilor, pe luni.
 *
 * Inainte era o fasie de sapte zile pe toata latimea ecranului, cu sapte
 * cuvinte „liber" si atat. Artiom: „acum nu-mi place, trebuie de dat slide
 * dreapta, ca avem asa mult loc liber si nu facem cumsecade". Avea dreptate:
 * saptamana ocupa tot ecranul ca sa spuna aproape nimic, iar ca sa vezi
 * saptamana urmatoare trebuia sa te plimbi cu sageata.
 *
 * Acum e aceeasi forma ca la Orar: luna intreaga dintr-o privire, apesi ziua
 * si in dreapta vezi ce e in ea. Doua ecrane care arata la fel si se poarta la
 * fel, nu doua feluri de calendar in aceeasi aplicatie.
 */
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Blocaj, Programare } from '@/lib/tipuri'
import { cheieZi, desfaZi, localDin, numeLuna, numeZi, oraRo } from '@/lib/timp'
import { apel } from '../api'
import { Card, Eroare, EtichetaTip, Titlu, Toast } from '../comune'
import DialogProgramare from '../DialogProgramare'
import { ziIntreaga } from '../timpLocal'
import IconBack from '~icons/solar/arrow-left-linear'
import IconNext from '~icons/solar/arrow-right-linear'

const CAPETE = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du']

function formaLunii(luna: string) {
  const [an, l] = luna.split('-').map(Number)
  const nrZile = new Date(Date.UTC(an, l, 0)).getUTCDate()
  const offset = (new Date(Date.UTC(an, l - 1, 1)).getUTCDay() + 6) % 7
  return { an, l, nrZile, offset }
}

function mutaLuna(luna: string, pas: number): string {
  const [an, l] = luna.split('-').map(Number)
  const d = new Date(Date.UTC(an, l - 1 + pas, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function ziSaptamanii(cheie: string): number {
  const d = desfaZi(cheie)
  if (!d) return 1
  return ((new Date(Date.UTC(d.an, d.luna - 1, d.zi)).getUTCDay() + 6) % 7) + 1
}

export default function Calendar() {
  const azi = localDin(new Date()).data
  const [luna, setLuna] = useState(azi.slice(0, 7))
  const [aleasa, setAleasa] = useState(azi)
  const [programari, setProgramari] = useState<Programare[]>([])
  const [blocaje, setBlocaje] = useState<Blocaj[]>([])
  const [eroare, setEroare] = useState('')
  const [deschisa, setDeschisa] = useState<Programare | null>(null)
  const [toast, setToast] = useState('')

  const incarca = () => {
    setEroare('')
    const { an, l, nrZile } = formaLunii(luna)
    const deLa = ziIntreaga(cheieZi(an, l, 1)).deLa
    const panaLa = ziIntreaga(cheieZi(an, l, nrZile)).panaLa
    Promise.all([apel<{ programari: Programare[] }>('programari', { query: { deLa, panaLa } }), apel<{ blocaje: Blocaj[] }>('blocaje')])
      .then(([p, b]) => {
        setProgramari(p.programari)
        setBlocaje(b.blocaje)
      })
      .catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [luna])

  const anunta = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(''), 2500)
  }

  /** Lectiile fiecarei zile, o singura data, nu la fiecare celula. */
  const peZi = useMemo(() => {
    const m = new Map<string, Programare[]>()
    for (const p of programari) {
      if (p.stare === 'anulata') continue
      const z = localDin(p.incepe).data
      m.set(z, [...(m.get(z) ?? []), p])
    }
    for (const lista of m.values()) lista.sort((a, b) => a.incepe.localeCompare(b.incepe))
    return m
  }, [programari])

  const blocajeleZilei = (zi: string) => {
    const { deLa, panaLa } = ziIntreaga(zi)
    return blocaje.filter((b) => b.de_la < panaLa && b.pana_la > deLa)
  }

  const { an, l, nrZile, offset } = formaLunii(luna)
  const aleasaParti = desfaZi(aleasa)
  const lectiileZilei = peZi.get(aleasa) ?? []
  const blocateAzi = blocajeleZilei(aleasa)
  const inLuna = programari.filter((p) => p.stare !== 'anulata').length

  return (
    <>
      <Titlu
        sub="Luna întreagă. Apasă pe o zi ca să vezi ce e în ea."
        actiuni={
          <>
            <button type="button" onClick={() => { setLuna(azi.slice(0, 7)); setAleasa(azi) }} className="pastila pastila-alba !py-2.5 text-sm">Azi</button>
            <a href="#/disponibilitate" className="pastila pastila-alba !py-2.5 text-sm">Orar și zile blocate</a>
          </>
        }
      >
        Calendar
      </Titlu>

      {eroare && <Eroare mesaj={eroare} reincearca={incarca} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-sans text-lg font-medium first-letter:uppercase">{numeLuna(l)} {an}</h2>
              <p className="mt-0.5 text-sm text-gri">
                {inLuna === 0 ? 'nicio lecție luna asta' : inLuna === 1 ? 'o lecție luna asta' : `${inLuna} lecții luna asta`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setLuna(mutaLuna(luna, -1))} className="flex size-9 items-center justify-center rounded-full bg-crem hover:bg-crem-inchis" aria-label="Luna dinainte">
                <IconBack className="size-4" />
              </button>
              <button type="button" onClick={() => setLuna(mutaLuna(luna, 1))} className="flex size-9 items-center justify-center rounded-full bg-crem hover:bg-crem-inchis" aria-label="Luna următoare">
                <IconNext className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-1.5">
            {CAPETE.map((c) => (
              <p key={c} className="pb-1 text-center text-xs font-medium text-gri">{c}</p>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <div key={`gol${i}`} />
            ))}
            {Array.from({ length: nrZile }, (_, i) => {
              const cheie = cheieZi(an, l, i + 1)
              const ale = peZi.get(cheie) ?? []
              const noi = ale.some((p) => p.stare === 'noua')
              const blocat = blocajeleZilei(cheie).length > 0
              return (
                <button
                  key={cheie}
                  type="button"
                  onClick={() => setAleasa(cheie)}
                  aria-pressed={aleasa === cheie}
                  className={cn(
                    'flex min-h-[3.6rem] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-sm transition sm:min-h-[4.2rem]',
                    ale.length ? (noi ? 'bg-portocaliu-5 font-medium text-cerneala' : 'bg-albastru-5 font-medium text-cerneala') : 'bg-crem text-gri',
                    cheie < azi ? 'opacity-45' : 'hover:-translate-y-0.5',
                    aleasa === cheie ? 'ring-2 ring-albastru' : cheie === azi ? 'ring-1 ring-navy/30' : '',
                  )}
                >
                  <span className="leading-none">{i + 1}</span>
                  {ale.length > 0 && (
                    <span className="text-[0.62rem] leading-none text-albastru-text">
                      {oraRo(ale[0].incepe)}{ale.length > 1 ? ` +${ale.length - 1}` : ''}
                    </span>
                  )}
                  {!ale.length && blocat && <span className="text-[0.62rem] leading-none text-gri">blocat</span>}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gri">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded bg-albastru-5" /> are lecții</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded bg-portocaliu-5" /> are o cerere nouă, de confirmat</span>
          </div>
        </Card>

        <Card className="xl:sticky xl:top-6 xl:self-start">
          <h2 className="font-sans text-lg font-medium first-letter:uppercase">
            {aleasaParti ? `${numeZi(ziSaptamanii(aleasa))}, ${aleasaParti.zi} ${numeLuna(aleasaParti.luna)}` : ''}
          </h2>

          {blocateAzi.length > 0 && (
            <div className="mt-4 space-y-2">
              {blocateAzi.map((b) => {
                const { deLa, panaLa } = ziIntreaga(aleasa)
                return (
                  <p key={b.id} className="rounded-xl bg-crem px-4 py-2.5 text-sm text-gri">
                    <span className="font-medium text-cerneala">Blocat</span>{b.motiv ? `, ${b.motiv}` : ''}
                    <span className="block">{oraRo(b.de_la < deLa ? deLa : b.de_la)} până la {oraRo(b.pana_la > panaLa ? panaLa : b.pana_la)}</span>
                  </p>
                )
              })}
            </div>
          )}

          {lectiileZilei.length === 0 ? (
            <p className="mt-4 text-sm text-gri">Nicio lecție în ziua asta.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {lectiileZilei.map((x) => (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => setDeschisa(x)}
                    className={cn('block w-full rounded-xl px-4 py-3 text-left text-sm transition hover:-translate-y-0.5', x.stare === 'noua' ? 'bg-portocaliu-5' : 'bg-crem')}
                  >
                    <span className="block font-medium">{oraRo(x.incepe)} · {x.client?.nume ?? '…'}</span>
                    <span className="mt-1.5 block"><EtichetaTip tip={x.tip} /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-sm leading-relaxed text-gri">
            Apasă pe o lecție ca să o deschizi: acolo o confirmi, o muți, trimiți linkul de Zoom sau o bifezi plătită.
          </p>
        </Card>
      </div>

      <DialogProgramare programare={deschisa} inchide={() => setDeschisa(null)} laSalvare={() => incarca()} anunta={anunta} />
      <Toast text={toast} />
    </>
  )
}
