/**
 * Fereastra prin care Dorina propune o ora unui cursant.
 *
 * Nu creeaza o lectie confirmata: creeaza o propunere, ii trimite omului un
 * email cu doua butoane si asteapta raspunsul lui. Ora ramane ocupata cat
 * timp propunerea asteapta, ca sa nu i-o ia altcineva de sub nas.
 */
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Client, Programare, TipProgramare } from '@/lib/tipuri'
import { TIPURI } from '@/lib/tipuri'
import { apel } from './api'
import { Camp, clasaInput, clasaSelect, clasaTextarea } from './comune'
import { localLaIso } from './timpLocal'

type Props = { inchide: () => void; laTrimitere: (p: Programare) => void; anunta: (t: string) => void }

export default function DialogPropunere({ inchide, laTrimitere, anunta }: Props) {
  const [clienti, setClienti] = useState<Client[]>([])
  const [nume, setNume] = useState('')
  const [email, setEmail] = useState('')
  const [tip, setTip] = useState<TipProgramare>('individual')
  const [cand, setCand] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [asteapta, setAsteapta] = useState(false)
  const [eroare, setEroare] = useState('')

  useEffect(() => {
    apel<{ clienti: Client[] }>('clienti')
      .then((r) => setClienti(r.clienti))
      .catch(() => setClienti([]))
  }, [])

  /** Cand alege un cursant din lista, numele si adresa se completeaza singure. */
  function alegeCursant(valoare: string) {
    setEmail(valoare)
    const c = clienti.find((x) => x.email === valoare)
    if (c) setNume(c.nume)
  }

  async function trimite() {
    setEroare('')
    const incepe = localLaIso(cand)
    if (!incepe) return setEroare('Alege ziua și ora')
    if (Date.parse(incepe) < Date.now()) return setEroare('Ora aleasă e în trecut')
    if (nume.trim().length < 2) return setEroare('Scrie numele cursantului')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setEroare('Adresa de email nu pare corectă')

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
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.5rem] border-0 p-0 sm:max-w-lg">
        <div className="bg-navy p-6 text-alb">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-normal">Propune o lecție</DialogTitle>
            <DialogDescription className="text-alb/70">Cursantul primește un email cu ora propusă și confirmă dintr-un clic.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          <Camp eticheta="Cursantul" ajutor="Alege pe cineva din listă sau scrie o adresă nouă.">
            <input
              list="ddf-cursanti"
              value={email}
              onChange={(e) => alegeCursant(e.target.value)}
              placeholder="email@exemplu.ro"
              type="email"
              className={clasaInput}
            />
            <datalist id="ddf-cursanti">
              {clienti.map((c) => (
                <option key={c.id} value={c.email}>
                  {c.nume}
                </option>
              ))}
            </datalist>
          </Camp>

          <Camp eticheta="Numele lui">
            <input value={nume} onChange={(e) => setNume(e.target.value)} placeholder="Maria Popescu" className={clasaInput} />
          </Camp>

          <div className="grid gap-5 sm:grid-cols-2">
            <Camp eticheta="Ce lecție">
              <select value={tip} onChange={(e) => setTip(e.target.value as TipProgramare)} className={clasaSelect}>
                {(Object.keys(TIPURI) as TipProgramare[]).map((t) => (
                  <option key={t} value={t}>
                    {TIPURI[t].nume}
                  </option>
                ))}
              </select>
            </Camp>
            <Camp eticheta="Ziua și ora" ajutor="Ora României.">
              <input type="datetime-local" value={cand} onChange={(e) => setCand(e.target.value)} className={clasaInput} />
            </Camp>
          </div>

          <Camp eticheta="Un rând de la tine" ajutor="Apare în email, sub detalii. Poate rămâne gol.">
            <textarea value={mesaj} onChange={(e) => setMesaj(e.target.value)} rows={2} placeholder="Ne-am înțeles la telefon pentru ora asta." className={clasaTextarea} />
          </Camp>

          {eroare && (
            <p role="alert" className="rounded-xl bg-[#fdeaee] px-4 py-3 text-sm text-rosu">
              {eroare}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={inchide} className="pastila pastila-alba !py-2.5 text-sm">
              Renunț
            </button>
            <button type="button" onClick={trimite} disabled={asteapta} className="pastila pastila-albastra !py-2.5 text-sm disabled:opacity-60">
              {asteapta ? 'Se trimite…' : 'Trimite propunerea'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
