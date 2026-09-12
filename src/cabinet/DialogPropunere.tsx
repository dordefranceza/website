/**
 * Fereastra prin care Dorina propune o ora unui cursant.
 *
 * Nu creeaza o lectie confirmata: creeaza o propunere, ii trimite omului un
 * email cu un buton si asteapta raspunsul lui. Ora ramane ocupata cat timp
 * propunerea asteapta, ca sa nu i-o ia altcineva de sub nas.
 *
 * Prima varianta punea peste tot controale de sistem: o lista derulanta pentru
 * tipul lectiei, un `datetime-local` pentru ziua si ora, o `datalist` pentru
 * cursanti. Artiom: „nu-mi place, apare ăla de la Apple, nu ai făcut design
 * aparte". Avea dreptate, ferestrele alea sunt ale telefonului, nu ale noastre.
 *
 * Acum tipul lectiei e trei carduri apasabile, cursantii vechi sunt pastile pe
 * care dai clic, ziua si ora sunt doua campuri desenate ca restul cabinetului,
 * iar jos sta un rand care spune cu cuvinte ce urmeaza sa plece.
 */
import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Client, Programare, TipProgramare } from '@/lib/tipuri'
import { TIPURI } from '@/lib/tipuri'
import { dataRo } from '@/lib/timp'
import { apel } from './api'
import { Camp, clasaInput, clasaTextarea } from './comune'
import { localLaIso } from './timpLocal'
import { PersonajCerc } from './PersonajCerc'
import IconCheck from '~icons/solar/check-circle-bold'

type Props = {
  inchide: () => void
  laTrimitere: (p: Programare) => void
  anunta: (t: string) => void
  /** Cursantul deja stiut, cand fereastra se deschide de pe fisa lui. */
  initial?: { nume: string; email: string }
}

/** Ziua de azi si ora rotunda urmatoare, ca sa nu porneasca formularul gol. */
function ziuaDeAzi(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DialogPropunere({ inchide, laTrimitere, anunta, initial }: Props) {
  const [clienti, setClienti] = useState<Client[]>([])
  const [nume, setNume] = useState(initial?.nume ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [tip, setTip] = useState<TipProgramare>('individual')
  const [zi, setZi] = useState(ziuaDeAzi())
  const [ora, setOra] = useState('18:00')
  const [mesaj, setMesaj] = useState('')
  const [asteapta, setAsteapta] = useState(false)
  const [eroare, setEroare] = useState('')

  useEffect(() => {
    apel<{ clienti: Client[] }>('clienti')
      .then((r) => setClienti(r.clienti))
      .catch(() => setClienti([]))
  }, [])

  /** Cursantii care se potrivesc cu ce s-a scris, ca lista sa nu fie un zid. */
  const potriviti = useMemo(() => {
    const cautat = (email + ' ' + nume).toLowerCase().trim()
    const toti = [...clienti].reverse()
    if (!cautat) return toti.slice(0, 6)
    return toti.filter((c) => `${c.nume} ${c.email}`.toLowerCase().includes(cautat)).slice(0, 6)
  }, [clienti, email, nume])

  const cand = zi && ora ? `${zi}T${ora}` : ''
  const emailBun = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  const gata = cand && nume.trim().length >= 2 && emailBun

  async function trimite() {
    setEroare('')
    const incepe = localLaIso(cand)
    if (!incepe) return setEroare('Alege ziua și ora')
    if (Date.parse(incepe) < Date.now()) return setEroare('Ora aleasă e în trecut')
    if (nume.trim().length < 2) return setEroare('Scrie numele cursantului')
    if (!emailBun) return setEroare('Adresa de email nu pare corectă')

    setAsteapta(true)
    try {
      const r = await apel<{ programare: Programare }>('propune', {
        metoda: 'POST',
        corp: { nume: nume.trim(), email: email.trim(), tip, incepe, mesaj: mesaj.trim() },
      })
      laTrimitere(r.programare)
      anunta('Propunerea a plecat pe email')
      inchide()
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Propunerea nu a plecat')
    } finally {
      setAsteapta(false)
    }
  }

  return (
    <Dialog open onOpenChange={(d) => !d && inchide()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.5rem] border-0 p-0 sm:max-w-xl">
        <div className="flex items-center gap-4 bg-navy p-6 text-alb">
          <div className="min-w-0 flex-1">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-normal">Propune o lecție</DialogTitle>
              <DialogDescription className="text-alb/70">
                Cursantul primește un email cu ora propusă și confirmă dintr-un clic. Ora rămâne ținută până răspunde.
              </DialogDescription>
            </DialogHeader>
          </div>
          <PersonajCerc nume="scrie" inel="albastru" disc="alb" marime={64} marimeMare={76} grosime={6} className="hidden shrink-0 sm:block" />
        </div>

        <div className="space-y-6 p-6">
          {/* Tipul lectiei: carduri, nu lista derulanta de sistem. Se vede si
              pretul, care altfel se afla abia din email. */}
          <div>
            <p className="mb-2 text-sm font-medium">Ce lecție</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(TIPURI) as TipProgramare[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTip(t)}
                  aria-pressed={tip === t}
                  className={`rounded-2xl px-4 py-3 text-left transition ${tip === t ? 'bg-albastru text-alb' : 'bg-crem hover:bg-crem-inchis'}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{TIPURI[t].nume}</span>
                    {tip === t && <IconCheck className="size-4 shrink-0" />}
                  </span>
                  <span className={`mt-0.5 block text-xs ${tip === t ? 'text-alb/70' : 'text-gri'}`}>
                    {TIPURI[t].durata} min · {TIPURI[t].pret ? `${TIPURI[t].pret} €` : 'gratuit'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Camp eticheta="Ziua">
              <input type="date" value={zi} min={ziuaDeAzi()} onChange={(e) => setZi(e.target.value)} className={clasaInput} />
            </Camp>
            <Camp eticheta="Ora" ajutor="Ora României.">
              <input type="time" step={900} value={ora} onChange={(e) => setOra(e.target.value)} className={clasaInput} />
            </Camp>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Cursantul</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={nume} onChange={(e) => setNume(e.target.value)} placeholder="Numele lui" className={clasaInput} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@exemplu.ro" className={clasaInput} />
            </div>
            {potriviti.length > 0 && (
              <>
                <p className="mt-3 text-xs text-gri">Sau alege unul dintre cei pe care îi ai deja:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {potriviti.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setNume(c.nume)
                        setEmail(c.email)
                      }}
                      className="rounded-full bg-crem px-3.5 py-2 text-sm transition hover:bg-crem-inchis"
                    >
                      {c.nume}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Camp eticheta="Un rând de la tine" ajutor="Apare în email, sub detalii. Poate rămâne gol.">
            <textarea value={mesaj} onChange={(e) => setMesaj(e.target.value)} rows={2} placeholder="Ne-am înțeles la telefon pentru ora asta." className={clasaTextarea} />
          </Camp>

          {/* Ce pleaca, scris cu cuvinte. Verificarea se face din citit, nu din
              recitit campurile de mai sus. */}
          {gata && (
            <p className="rounded-2xl bg-albastru-5 px-4 py-3.5 text-sm leading-relaxed text-cerneala">
              Îi propui lui <strong className="font-medium">{nume.trim()}</strong> {TIPURI[tip].nume.toLowerCase()} pe{' '}
              <strong className="font-medium">{dataRo(`${zi}T12:00:00Z`)}</strong>, ora <strong className="font-medium">{ora}</strong>.
              Emailul pleacă pe {email.trim()}.
            </p>
          )}

          {eroare && (
            <p role="alert" className="rounded-xl bg-[#fdeaee] px-4 py-3 text-sm text-rosu">
              {eroare}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={inchide} className="pastila pastila-alba !py-2.5 text-sm">
              Renunț
            </button>
            <button type="button" onClick={trimite} disabled={asteapta || !gata} className="pastila pastila-albastra !py-2.5 text-sm disabled:opacity-60">
              {asteapta ? 'Se trimite…' : 'Trimite propunerea'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
