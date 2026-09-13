import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Programare } from '@/lib/tipuri'
import { dataScurtaRo, oraRo } from '@/lib/timp'
import { apel } from '../api'
import { Eroare, EtichetaStare, EtichetaTip, Gol, Titlu, Toast, bani } from '../comune'
import DialogProgramare from '../DialogProgramare'
import DialogPropunere from '../DialogPropunere'

type Filtru = 'noi' | 'debifat' | 'propuse' | 'viitoare' | 'trecute' | 'anulate' | 'toate'
const FILTRE: { cheie: Filtru; nume: string }[] = [
  { cheie: 'noi', nume: 'Noi' },
  { cheie: 'debifat', nume: 'De bifat' },
  { cheie: 'propuse', nume: 'Așteaptă răspuns' },
  { cheie: 'viitoare', nume: 'Viitoare, confirmate' },
  { cheie: 'trecute', nume: 'Trecute' },
  { cheie: 'anulate', nume: 'Anulate' },
  { cheie: 'toate', nume: 'Toate' },
]

/**
 * Lectia a trecut de ora ei si nimeni nu a spus daca s-a tinut.
 *
 * Artiom: „dupa fiecare lectie sa apara acolo cand trece timpul, sa pot pune
 * a trecut sau nu a trecut". Fara asta, o lectie ramane „confirmata" la
 * nesfarsit, banii nu se stie daca se cer, iar statisticile de mai tarziu se
 * fac pe nisip.
 *
 * Se lasa un ceas de la ora de inceput inainte sa fie cerut raspunsul: nu are
 * rost sa intrebi „a avut loc?" in timp ce lectia inca se tine.
 */
function deBifat(p: Programare, acum: string): boolean {
  if (p.stare !== 'confirmata' && p.stare !== 'noua') return false
  const sfarsit = new Date(Date.parse(p.incepe) + p.durata_min * 60_000 + 3_600_000).toISOString()
  return sfarsit < acum
}

export default function Programari() {
  const [lista, setLista] = useState<Programare[] | null>(null)
  const [eroare, setEroare] = useState('')
  const [filtru, setFiltru] = useState<Filtru>('viitoare')
  const [cauta, setCauta] = useState('')
  const [deschisa, setDeschisa] = useState<Programare | null>(null)
  const [toast, setToast] = useState('')
  const [propune, setPropune] = useState(false)

  const incarca = () => {
    setEroare('')
    apel<{ programari: Programare[] }>('programari')
      .then((r) => {
        setLista(r.programari)
        // #/programari?id=... deschide direct o programare (din tablou sau din email).
        const id = new URLSearchParams(location.hash.split('?')[1] ?? '').get('id')
        if (id) {
          const p = r.programari.find((x) => x.id === id)
          if (p) {
            setDeschisa(p)
            setFiltru('toate')
          }
        }
        /* Ce are nevoie de tine se pune singur in fata: intai cererile noi,
           apoi lectiile trecute nebifate. Daca nu e nimic de facut, ramane pe
           lectiile confirmate care urmeaza. */
        const acum = new Date().toISOString()
        if (r.programari.some((p) => p.stare === 'noua')) setFiltru('noi')
        else if (r.programari.some((p) => deBifat(p, acum))) setFiltru('debifat')
      })
      .catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [])

  const anunta = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(''), 2500)
  }

  const nebifate = useMemo(() => {
    const acum = new Date().toISOString()
    return (lista ?? []).filter((p) => deBifat(p, acum))
  }, [lista])

  const filtrate = useMemo(() => {
    if (!lista) return []
    const acum = new Date().toISOString()
    const q = cauta.trim().toLowerCase()
    return lista
      .filter((p) => {
        if (filtru === 'noi') return p.stare === 'noua'
        if (filtru === 'debifat') return deBifat(p, acum)
        if (filtru === 'propuse') return p.stare === 'propusa'
        /*
         * „Viitoare" inseamna lectii care CHIAR vor avea loc, adica cele
         * confirmate. Inainte intra aici si cererile nerezolvate si
         * propunerile fara raspuns, iar Artiom le vedea de doua ori: „daca
         * asteapta raspunsul inseamna ca asteapta raspunsul, nu viitoare".
         * Cele nerezolvate isi au filtrele lor, „Noi" si „Asteapta raspuns".
         */
        if (filtru === 'viitoare') return p.incepe >= acum && p.stare === 'confirmata'
        if (filtru === 'trecute') return p.incepe < acum && p.stare !== 'anulata'
        if (filtru === 'anulate') return p.stare === 'anulata'
        return true
      })
      .filter((p) => !q || `${p.client?.nume} ${p.client?.email} ${p.client?.telefon}`.toLowerCase().includes(q))
      .sort((a, b) => (filtru === 'trecute' ? b.incepe.localeCompare(a.incepe) : a.incepe.localeCompare(b.incepe)))
  }, [lista, filtru, cauta])

  async function marcheazaPlatit(p: Programare, platit: boolean) {
    try {
      const r = await apel<{ programare: Programare }>('programare', { metoda: 'PATCH', corp: { id: p.id, platit } })
      setLista((l) => (l ?? []).map((x) => (x.id === p.id ? r.programare : x)))
      anunta(platit ? 'Marcată ca plătită' : 'Marcată ca neplătită')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a salvat')
    }
  }

  /** „A avut loc" o face facuta, „nu a avut loc" o scoate din socoteala. */
  async function bifeaza(p: Programare, aAvutLoc: boolean) {
    try {
      const r = await apel<{ programare: Programare }>('programare', {
        metoda: 'PATCH',
        corp: { id: p.id, stare: aAvutLoc ? 'finalizata' : 'anulata' },
      })
      setLista((l) => (l ?? []).map((x) => (x.id === p.id ? r.programare : x)))
      anunta(aAvutLoc ? 'Bifată ca făcută' : 'Bifată ca neținută')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a salvat')
    }
  }

  async function confirma(p: Programare) {
    try {
      const r = await apel<{ programare: Programare }>('programare', { metoda: 'PATCH', corp: { id: p.id, stare: 'confirmata' } })
      setLista((l) => (l ?? []).map((x) => (x.id === p.id ? r.programare : x)))
      anunta('Confirmată')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a salvat')
    }
  }

  return (
    <>
      <Titlu
        sub="Toate cererile și lecțiile, cu plata și starea lor."
        actiuni={
          <>
            <button type="button" onClick={() => setPropune(true)} className="pastila pastila-albastra !py-2.5 text-sm">Propune o lecție</button>
            <a href="#/calendar" className="pastila pastila-alba !py-2.5 text-sm">Vezi pe calendar</a>
          </>
        }
      >
        Programări
      </Titlu>

      {nebifate.length > 0 && filtru !== 'debifat' && (
        <button
          type="button"
          onClick={() => setFiltru('debifat')}
          className="mb-4 block w-full rounded-2xl bg-portocaliu-5 px-5 py-3.5 text-left text-sm leading-relaxed text-cerneala"
        >
          <strong className="font-medium">
            {nebifate.length === 1 ? 'O lecție a trecut' : `${nebifate.length} lecții au trecut`} și nu ai spus dacă s-au ținut.
          </strong>{' '}
          Apasă aici ca să le bifezi, altfel nu se știe ce s-a făcut și ce bani mai ai de luat.
        </button>
      )}

      {/*
        Filtrele, in casute egale pe telefon.
        Insirate, se rupeau unde apucau: trei pe primul rand, trei pe al doilea
        si „Toate" singur pe al treilea, cu marginea din dreapta zdrentuita,
        fiindca numele au lungimi foarte diferite. Artiom: „tot asa, butoanele
        sunt haotice, mai mare, mai mica, mic din nou". Pe telefon stau acum
        doua pe rand, toate de aceeasi latime, iar „Toate" tine randul intreg
        la sfarsit: e si raspunsul care le cuprinde pe celelalte, deci merita
        randul lui. De la 640 in sus incap pe o linie, deci acolo raman insirate.
      */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:shrink-0 lg:flex-wrap lg:items-center">
          {FILTRE.map((f) => {
          const n =
            f.cheie === 'noi'
              ? (lista ?? []).filter((p) => p.stare === 'noua').length
              : f.cheie === 'debifat'
                ? nebifate.length
                : f.cheie === 'propuse'
                  ? (lista ?? []).filter((p) => p.stare === 'propusa').length
                  : 0
            return (
              <button
                key={f.cheie}
                type="button"
                onClick={() => setFiltru(f.cheie)}
                className={cn(
                  'flex min-h-10 items-center justify-center rounded-full px-3 text-center text-sm font-medium leading-snug transition lg:px-4',
                  f.cheie === 'toate' && 'col-span-2 sm:col-span-3 lg:col-span-1',
                  filtru === f.cheie ? 'bg-cerneala text-alb' : 'bg-alb hover:bg-crem-inchis',
                )}
              >
                {f.nume}
                {n > 0 && <span className="ml-1.5 rounded-full bg-portocaliu px-1.5 py-0.5 text-[10px] text-alb">{n}</span>}
              </button>
            )
          })}
        </div>
        <input value={cauta} onChange={(e) => setCauta(e.target.value)} placeholder="Caută după nume, email, telefon" className="h-10 w-full min-w-0 rounded-full bg-alb px-4 text-sm outline-none focus:ring-2 focus:ring-albastru lg:ml-auto lg:w-72" />
      </div>

      <div className="mt-6">
        {eroare && <Eroare mesaj={eroare} reincearca={incarca} />}
        {!eroare && lista === null && <p className="text-gri">Se încarcă…</p>}
        {lista && filtrate.length === 0 && <Gol>Nimic aici.</Gol>}
        <ul className="space-y-2">
          {filtrate.map((p) => (
            <li key={p.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-alb px-4 py-3 sm:grid-cols-[110px_60px_1fr_auto_auto_auto] sm:gap-4">
              <button type="button" onClick={() => setDeschisa(p)} className="text-left">
                <span className="block text-sm font-medium">{dataScurtaRo(p.incepe)}</span>
                <span className="block text-sm text-gri sm:hidden">{oraRo(p.incepe)}</span>
              </button>
              <span className="hidden text-sm font-medium sm:block">{oraRo(p.incepe)}</span>
              <button type="button" onClick={() => setDeschisa(p)} className="min-w-0 text-left">
                <span className="block truncate font-medium">{p.client?.nume ?? 'Fără nume'}</span>
                <span className="block truncate text-xs text-gri">{p.client?.scop || p.client?.email}</span>
              </button>
              <div className="col-span-3 flex flex-wrap items-center gap-2 sm:col-span-1">
                <EtichetaTip tip={p.tip} />
                <EtichetaStare stare={p.stare} />
              </div>
              <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                <span className="text-sm text-gri">{p.suma ? bani(p.suma) : 'gratuit'}</span>
                {p.suma > 0 && p.stare !== 'anulata' && (
                  <button
                    type="button"
                    onClick={() => marcheazaPlatit(p, !p.platit)}
                    className={cn('rounded-full px-3 py-1 text-xs font-bold', p.platit ? 'bg-verde-5 text-verde' : 'bg-portocaliu-5 text-[#b8431a]')}
                  >
                    {p.platit ? 'Plătită' : 'Neplătită'}
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-2">
                {deBifat(p, new Date().toISOString()) && (
                  <>
                    <button type="button" onClick={() => bifeaza(p, true)} className="rounded-full bg-verde px-3 py-1.5 text-xs font-bold text-alb">
                      A avut loc
                    </button>
                    <button type="button" onClick={() => bifeaza(p, false)} className="rounded-full bg-crem px-3 py-1.5 text-xs font-medium hover:text-rosu">
                      Nu a avut loc
                    </button>
                  </>
                )}
                {p.stare === 'noua' && !deBifat(p, new Date().toISOString()) && (
                  <button type="button" onClick={() => confirma(p)} className="rounded-full bg-albastru px-3 py-1.5 text-xs font-bold text-alb hover:bg-albastru-inchis">
                    Confirmă
                  </button>
                )}
                <button type="button" onClick={() => setDeschisa(p)} className="rounded-full bg-crem px-3 py-1.5 text-xs font-medium hover:bg-crem-inchis">
                  Detalii
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <DialogProgramare programare={deschisa} inchide={() => setDeschisa(null)} laSalvare={(p) => setLista((l) => (l ?? []).map((x) => (x.id === p.id ? p : x)))} anunta={anunta} />
      {propune && (
        <DialogPropunere
          inchide={() => setPropune(false)}
          laTrimitere={(p) => {
            setLista((l) => [...(l ?? []), p])
            setFiltru('propuse')
          }}
          anunta={anunta}
        />
      )}
      <Toast text={toast} />
    </>
  )
}
