import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Blocaj, Programare } from '@/lib/tipuri'
import { localDin, numeLuna, numeZi, oraRo, ziUrmatoare } from '@/lib/timp'
import { apel } from '../api'
import { Eroare, EtichetaTip, Titlu, Toast } from '../comune'
import DialogProgramare from '../DialogProgramare'
import { ziIntreaga } from '../timpLocal'
import IconBack from '~icons/solar/arrow-left-linear'
import IconNext from '~icons/solar/arrow-right-linear'

function lunea(cheie: string): string {
  const [a, l, z] = cheie.split('-').map(Number)
  const d = new Date(Date.UTC(a, l - 1, z))
  const decalaj = (d.getUTCDay() + 6) % 7
  return ziUrmatoare(cheie, -decalaj)
}

export default function Calendar() {
  const azi = localDin(new Date()).data
  const [start, setStart] = useState(lunea(azi))
  const [programari, setProgramari] = useState<Programare[]>([])
  const [blocaje, setBlocaje] = useState<Blocaj[]>([])
  const [eroare, setEroare] = useState('')
  const [deschisa, setDeschisa] = useState<Programare | null>(null)
  const [toast, setToast] = useState('')

  const zile = useMemo(() => Array.from({ length: 7 }, (_, i) => ziUrmatoare(start, i)), [start])

  const incarca = () => {
    setEroare('')
    const deLa = ziIntreaga(zile[0]).deLa
    const panaLa = ziIntreaga(zile[6]).panaLa
    Promise.all([apel<{ programari: Programare[] }>('programari', { query: { deLa, panaLa } }), apel<{ blocaje: Blocaj[] }>('blocaje')])
      .then(([p, b]) => {
        setProgramari(p.programari)
        setBlocaje(b.blocaje)
      })
      .catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [start])

  const anunta = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(''), 2500)
  }

  const p0 = localDin(new Date(`${zile[0]}T12:00:00Z`))
  const p6 = localDin(new Date(`${zile[6]}T12:00:00Z`))
  const titluSapt = p0.luna === p6.luna ? `${p0.zi} până la ${p6.zi} ${numeLuna(p0.luna)} ${p0.an}` : `${p0.zi} ${numeLuna(p0.luna)} până la ${p6.zi} ${numeLuna(p6.luna)} ${p6.an}`

  return (
    <>
      <Titlu
        sub="Săptămâna, zi cu zi. Apasă pe o lecție ca să o deschizi."
        actiuni={
          <>
            <button type="button" onClick={() => setStart(lunea(azi))} className="pastila pastila-alba !py-2.5 text-sm">Azi</button>
            <a href="#/disponibilitate" className="pastila pastila-alba !py-2.5 text-sm">Orar și zile blocate</a>
          </>
        }
      >
        Calendar
      </Titlu>

      <div className="mb-5 flex items-center justify-between rounded-2xl bg-alb px-4 py-3">
        <button type="button" onClick={() => setStart(ziUrmatoare(start, -7))} className="flex size-9 items-center justify-center rounded-full bg-crem" aria-label="Săptămâna anterioară">
          <IconBack className="size-4" />
        </button>
        <p className="font-medium">{titluSapt}</p>
        <button type="button" onClick={() => setStart(ziUrmatoare(start, 7))} className="flex size-9 items-center justify-center rounded-full bg-crem" aria-label="Săptămâna următoare">
          <IconNext className="size-4" />
        </button>
      </div>

      {eroare && <Eroare mesaj={eroare} reincearca={incarca} />}

      <div className="grid gap-3 md:grid-cols-7 md:gap-2">
        {zile.map((zi, i) => {
          const p = localDin(new Date(`${zi}T12:00:00Z`))
          const aleZilei = programari.filter((x) => localDin(x.incepe).data === zi && x.stare !== 'anulata').sort((a, b) => a.incepe.localeCompare(b.incepe))
          const { deLa, panaLa } = ziIntreaga(zi)
          const blocajeZilei = blocaje.filter((b) => b.de_la < panaLa && b.pana_la > deLa)
          const esteAzi = zi === azi
          return (
            <div key={zi} className={cn('rounded-2xl p-3', esteAzi ? 'bg-albastru-5' : 'bg-alb')}>
              <p className="flex items-baseline justify-between md:block">
                <span className="text-xs font-bold uppercase tracking-wider text-gri">{numeZi(i + 1)}</span>
                <span className={cn('font-display text-2xl md:mt-1 md:block', esteAzi && 'text-albastru')}>{p.zi}</span>
              </p>
              <div className="mt-3 space-y-2">
                {blocajeZilei.map((b) => (
                  <div key={b.id} className="rounded-xl bg-gri-deschis px-3 py-2 text-xs text-gri">
                    <span className="font-medium">Blocat</span> {b.motiv && `· ${b.motiv}`}
                    <span className="block">{oraRo(b.de_la < deLa ? deLa : b.de_la)} până la {oraRo(b.pana_la > panaLa ? panaLa : b.pana_la)}</span>
                  </div>
                ))}
                {aleZilei.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => setDeschisa(x)}
                    className={cn('block w-full rounded-xl px-3 py-2 text-left text-sm transition hover:-translate-y-0.5', x.stare === 'noua' ? 'bg-portocaliu-5' : 'bg-crem')}
                  >
                    <span className="block font-medium">{oraRo(x.incepe)} · {x.client?.nume?.split(' ')[0] ?? '…'}</span>
                    <span className="mt-1 block"><EtichetaTip tip={x.tip} /></span>
                  </button>
                ))}
                {aleZilei.length === 0 && blocajeZilei.length === 0 && <p className="py-2 text-xs text-gri">liber</p>}
              </div>
            </div>
          )
        })}
      </div>

      <DialogProgramare programare={deschisa} inchide={() => setDeschisa(null)} laSalvare={() => incarca()} anunta={anunta} />
      <Toast text={toast} />
    </>
  )
}
