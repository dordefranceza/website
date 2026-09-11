import { useEffect, useState } from 'react'
import type { Blocaj, Disponibilitate as Regula } from '@/lib/tipuri'
import { dataOraRo, dataRo, numeZi, oraRo } from '@/lib/timp'
import { apel } from '../api'
import { Card, Eroare, Titlu, Toast, clasaInput } from '../comune'
import { isoLaLocal, localLaIso, ziIntreaga } from '../timpLocal'
import IconPlus from '~icons/solar/add-circle-bold'
import IconMinus from '~icons/solar/close-circle-bold'

type RegulaLocala = { zi: number; de_la: string; pana_la: string }

export default function Disponibilitate() {
  const [reguli, setReguli] = useState<RegulaLocala[] | null>(null)
  const [blocaje, setBlocaje] = useState<Blocaj[]>([])
  const [eroare, setEroare] = useState('')
  const [toast, setToast] = useState('')
  const [asteapta, setAsteapta] = useState(false)
  const [nou, setNou] = useState({ de_la: '', pana_la: '', motiv: '' })
  const [ziIntreagaCheie, setZiIntreagaCheie] = useState('')

  const incarca = () => {
    setEroare('')
    Promise.all([apel<{ reguli: Regula[] }>('disponibilitate'), apel<{ blocaje: Blocaj[] }>('blocaje')])
      .then(([r, b]) => {
        setReguli(r.reguli.map(({ zi, de_la, pana_la }) => ({ zi, de_la, pana_la })))
        setBlocaje(b.blocaje)
      })
      .catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [])

  const anunta = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(''), 2500)
  }

  async function salveazaReguli() {
    if (!reguli) return
    setAsteapta(true)
    try {
      const r = await apel<{ reguli: Regula[] }>('disponibilitate', { metoda: 'PUT', corp: { reguli } })
      setReguli(r.reguli.map(({ zi, de_la, pana_la }) => ({ zi, de_la, pana_la })))
      anunta('Orarul a fost salvat')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a salvat')
    } finally {
      setAsteapta(false)
    }
  }

  async function adaugaBlocaj(deLa: string, panaLa: string, motiv: string) {
    setAsteapta(true)
    try {
      const r = await apel<{ blocaj: Blocaj }>('blocaj', { metoda: 'POST', corp: { de_la: deLa, pana_la: panaLa, motiv } })
      setBlocaje((b) => [...b, r.blocaj].sort((x, y) => x.de_la.localeCompare(y.de_la)))
      setNou({ de_la: '', pana_la: '', motiv: '' })
      setZiIntreagaCheie('')
      anunta('Interval blocat')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a salvat')
    } finally {
      setAsteapta(false)
    }
  }

  async function stergeBlocaj(id: string) {
    try {
      await apel('blocaj', { metoda: 'DELETE', query: { id } })
      setBlocaje((b) => b.filter((x) => x.id !== id))
      anunta('Deblocat')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a șters')
    }
  }

  const schimba = (i: number, camp: 'de_la' | 'pana_la', v: string) => setReguli((r) => (r ?? []).map((x, j) => (j === i ? { ...x, [camp]: v } : x)))
  const acum = new Date().toISOString()

  return (
    <>
      <Titlu sub="Orele în care cursanții pot alege lecții, plus zilele în care nu ești disponibilă.">Orar</Titlu>
      {eroare && <Eroare mesaj={eroare} reincearca={incarca} />}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-sans text-lg font-medium">Orarul săptămânal</h2>
            <button type="button" onClick={salveazaReguli} disabled={asteapta || !reguli} className="pastila pastila-albastra !py-2.5 text-sm disabled:opacity-60">Salvează orarul</button>
          </div>
          <p className="mt-1 text-sm text-gri">Ora României. Lecțiile se așază din oră în oră (50 de minute plus 10 pauză).</p>
          <div className="mt-5 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((zi) => {
              const ale = (reguli ?? []).map((r, i) => ({ ...r, i })).filter((r) => r.zi === zi)
              return (
                <div key={zi} className="grid gap-2 rounded-2xl bg-crem p-3 sm:grid-cols-[110px_1fr]">
                  <p className="pt-2 text-sm font-medium capitalize">{numeZi(zi)}</p>
                  <div className="space-y-2">
                    {ale.length === 0 && <p className="pt-2 text-sm text-gri">liber toată ziua</p>}
                    {ale.map((r) => (
                      <div key={r.i} className="flex items-center gap-2">
                        <input type="time" step={900} value={r.de_la} onChange={(e) => schimba(r.i, 'de_la', e.target.value)} className={`${clasaInput} !h-10 !w-32 !bg-alb`} />
                        <span className="text-sm text-gri">până la</span>
                        <input type="time" step={900} value={r.pana_la} onChange={(e) => schimba(r.i, 'pana_la', e.target.value)} className={`${clasaInput} !h-10 !w-32 !bg-alb`} />
                        <button type="button" onClick={() => setReguli((x) => (x ?? []).filter((_, j) => j !== r.i))} className="text-gri hover:text-rosu" aria-label="Scoate intervalul">
                          <IconMinus className="size-5" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setReguli((x) => [...(x ?? []), { zi, de_la: '17:00', pana_la: '21:00' }])} className="inline-flex items-center gap-1 text-sm font-medium text-albastru-text">
                      <IconPlus className="size-4" /> Adaugă interval
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-sans text-lg font-medium">Blochează o zi întreagă</h2>
            <p className="mt-1 text-sm text-gri">Școală, vacanță, orice. În ziua aceea nu apar sloturi.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <input type="date" value={ziIntreagaCheie} onChange={(e) => setZiIntreagaCheie(e.target.value)} className={`${clasaInput} !w-auto`} />
              <button
                type="button"
                disabled={!ziIntreagaCheie || asteapta}
                onClick={() => {
                  const { deLa, panaLa } = ziIntreaga(ziIntreagaCheie)
                  void adaugaBlocaj(deLa, panaLa, 'Zi liberă')
                }}
                className="pastila pastila-navy !py-2.5 text-sm disabled:opacity-60"
              >
                Blochează ziua
              </button>
            </div>
          </Card>

          <Card>
            <h2 className="font-sans text-lg font-medium">Blochează un interval</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm"><span className="mb-1 block font-medium">De la</span><input type="datetime-local" value={nou.de_la} onChange={(e) => setNou({ ...nou, de_la: e.target.value })} className={clasaInput} /></label>
              <label className="block text-sm"><span className="mb-1 block font-medium">Până la</span><input type="datetime-local" value={nou.pana_la} onChange={(e) => setNou({ ...nou, pana_la: e.target.value })} className={clasaInput} /></label>
              <label className="block text-sm sm:col-span-2"><span className="mb-1 block font-medium">Motiv (opțional)</span><input value={nou.motiv} onChange={(e) => setNou({ ...nou, motiv: e.target.value })} placeholder="Școală, examen, vacanță" className={clasaInput} /></label>
            </div>
            <button
              type="button"
              disabled={!nou.de_la || !nou.pana_la || asteapta}
              onClick={() => void adaugaBlocaj(localLaIso(nou.de_la), localLaIso(nou.pana_la), nou.motiv)}
              className="pastila pastila-navy mt-4 !py-2.5 text-sm disabled:opacity-60"
            >
              Blochează intervalul
            </button>
          </Card>

          <Card>
            <h2 className="font-sans text-lg font-medium">Intervale blocate</h2>
            {blocaje.filter((b) => b.pana_la >= acum).length === 0 ? (
              <p className="mt-3 text-sm text-gri">Niciunul în viitor.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {blocaje
                  .filter((b) => b.pana_la >= acum)
                  .map((b) => {
                    const oZi = isoLaLocal(b.de_la).endsWith('T00:00') && isoLaLocal(b.pana_la).endsWith('T23:59')
                    return (
                      <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-crem px-4 py-3 text-sm">
                        <span>
                          <span className="block font-medium">{oZi ? dataRo(b.de_la) : `${dataOraRo(b.de_la)} până la ${dataOraRo(b.pana_la)}`}</span>
                          <span className="text-gri">{b.motiv || (oZi ? 'toată ziua' : `${oraRo(b.de_la)} până la ${oraRo(b.pana_la)}`)}</span>
                        </span>
                        <button type="button" onClick={() => void stergeBlocaj(b.id)} className="rounded-full bg-alb px-3 py-1.5 text-xs font-medium hover:text-rosu">Deblochează</button>
                      </li>
                    )
                  })}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <Toast text={toast} />
    </>
  )
}
