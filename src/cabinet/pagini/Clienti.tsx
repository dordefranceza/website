import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Client } from '@/lib/tipuri'
import { NIVELURI, SCOPURI } from '@/lib/tipuri'
import { dataRo } from '@/lib/timp'
import { apel } from '../api'
import { Camp, Eroare, Gol, Titlu, Toast, bani, clasaInput, clasaSelect, clasaTextarea } from '../comune'

type ClientCuCifre = Client & { lectii: number; platit: number; ultima: string | null }

export default function Clienti() {
  const [lista, setLista] = useState<ClientCuCifre[] | null>(null)
  const [eroare, setEroare] = useState('')
  const [cauta, setCauta] = useState('')
  const [deschis, setDeschis] = useState<ClientCuCifre | null>(null)
  const [toast, setToast] = useState('')

  const incarca = () => {
    setEroare('')
    apel<{ clienti: ClientCuCifre[] }>('clienti').then((r) => setLista(r.clienti)).catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [])

  const filtrati = useMemo(() => {
    const q = cauta.trim().toLowerCase()
    return (lista ?? []).filter((c) => !q || `${c.nume} ${c.email} ${c.telefon} ${c.scop}`.toLowerCase().includes(q))
  }, [lista, cauta])

  return (
    <>
      <Titlu sub="Toți cei care au făcut măcar o programare.">Cursanți</Titlu>
      <input value={cauta} onChange={(e) => setCauta(e.target.value)} placeholder="Caută" className="h-10 w-full rounded-full bg-alb px-4 text-sm outline-none focus:ring-2 focus:ring-albastru sm:w-72" />

      <div className="mt-6">
        {eroare && <Eroare mesaj={eroare} reincearca={incarca} />}
        {lista && filtrati.length === 0 && <Gol>Niciun cursant încă.</Gol>}
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtrati.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setDeschis(c)} className="block w-full rounded-2xl bg-alb p-5 text-left transition hover:-translate-y-0.5">
                <p className="font-medium">{c.nume}</p>
                <p className="truncate text-sm text-gri">{c.email}</p>
                <p className="text-sm text-gri">{c.telefon}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {c.nivel && <span className="rounded-full bg-albastru-5 px-2.5 py-1 font-bold text-navy">{c.nivel}</span>}
                  {c.scop && <span className="rounded-full bg-crem px-2.5 py-1">{c.scop}</span>}
                  {c.sursa && <span className="rounded-full bg-crem px-2.5 py-1">din {c.sursa}</span>}
                </div>
                <p className="mt-3 text-xs text-gri">
                  {c.lectii} {c.lectii === 1 ? 'lecție' : 'lecții'} · {bani(c.platit)} plătit{c.ultima ? ` · ultima: ${dataRo(c.ultima)}` : ''}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {deschis && (
        <DialogClient
          client={deschis}
          inchide={() => setDeschis(null)}
          laSalvare={(c) => {
            setLista((l) => (l ?? []).map((x) => (x.id === c.id ? { ...x, ...c } : x)))
            setToast('Salvat')
            window.setTimeout(() => setToast(''), 2500)
          }}
        />
      )}
      <Toast text={toast} />
    </>
  )
}

function DialogClient({ client, inchide, laSalvare }: { client: ClientCuCifre; inchide: () => void; laSalvare: (c: Client) => void }) {
  const [d, setD] = useState({ nume: client.nume, email: client.email, telefon: client.telefon, nivel: client.nivel, scop: client.scop, note: client.note })
  const [asteapta, setAsteapta] = useState(false)
  const [eroare, setEroare] = useState('')
  const schimba = (c: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [c]: e.target.value }))

  async function salveaza() {
    setAsteapta(true)
    setEroare('')
    try {
      const r = await apel<{ client: Client }>('client', { metoda: 'PATCH', corp: { id: client.id, ...d } })
      laSalvare(r.client)
      inchide()
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Nu s-a salvat')
    } finally {
      setAsteapta(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && inchide()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.5rem] border-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">{client.nume}</DialogTitle>
          <DialogDescription>Cursant din {dataRo(client.creat)}{client.sursa ? `, venit din ${client.sursa}` : ''}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Camp eticheta="Nume"><input value={d.nume} onChange={schimba('nume')} className={clasaInput} /></Camp>
          <Camp eticheta="Telefon"><input value={d.telefon} onChange={schimba('telefon')} className={clasaInput} /></Camp>
          <div className="sm:col-span-2"><Camp eticheta="Email"><input type="email" value={d.email} onChange={schimba('email')} className={clasaInput} /></Camp></div>
          <Camp eticheta="Nivel">
            <select value={d.nivel} onChange={schimba('nivel')} className={clasaSelect}>
              <option value="">Nestabilit</option>
              {NIVELURI.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Camp>
          <Camp eticheta="Scop">
            <select value={d.scop} onChange={schimba('scop')} className={clasaSelect}>
              <option value="">Nestabilit</option>
              {SCOPURI.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Camp>
          <div className="sm:col-span-2">
            <Camp eticheta="Note (le vezi doar tu)" ajutor="Progres, teme date, ce urmează.">
              <textarea rows={5} value={d.note} onChange={schimba('note')} className={clasaTextarea} />
            </Camp>
          </div>
        </div>
        {eroare && <p role="alert" className="rounded-xl bg-[#fdeaee] px-4 py-3 text-sm text-rosu">{eroare}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={inchide} className="pastila pastila-crem !py-3">Renunță</button>
          <button type="button" onClick={salveaza} disabled={asteapta} className="pastila pastila-albastra !py-3 disabled:opacity-60">{asteapta ? 'Un moment…' : 'Salvează'}</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
