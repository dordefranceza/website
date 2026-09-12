import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Client } from '@/lib/tipuri'
import { NIVELURI, SCOPURI } from '@/lib/tipuri'
import { dataRo } from '@/lib/timp'
import { apel } from '../api'
import { Camp, Eroare, Gol, Titlu, Toast, bani, clasaInput, clasaSelect, clasaTextarea } from '../comune'
import DialogPropunere from '../DialogPropunere'

type Categorie = 'individual' | 'grup' | 'proba'

type ClientCuCifre = Client & {
  lectii: number
  individuale: number
  grup: number
  probe: number
  grupe: string[]
  categorie: Categorie
  platit: number
  deIncasat: number
  ultima: string | null
}

/*
 * Artiom: „sa fie aparte cursanti individuali, in grup si acest de test 20
 * min". Categoria nu se completeaza de mana, se vede din lectiile omului, deci
 * nu poate ramane in urma realitatii.
 */
const GRUPARI: { cheie: 'toti' | Categorie; nume: string }[] = [
  { cheie: 'toti', nume: 'Toți' },
  { cheie: 'individual', nume: 'Individuali' },
  { cheie: 'grup', nume: 'În grupe' },
  { cheie: 'proba', nume: 'Doar proba de 20 min' },
]

const ETICHETA: Record<Categorie, { text: string; clasa: string }> = {
  individual: { text: 'individual', clasa: 'bg-albastru-5 text-navy' },
  grup: { text: 'în grupă', clasa: 'bg-verde-5 text-verde' },
  proba: { text: 'doar proba', clasa: 'bg-roz-5 text-[#a8358a]' },
}

export default function Clienti() {
  const [lista, setLista] = useState<ClientCuCifre[] | null>(null)
  const [eroare, setEroare] = useState('')
  const [cauta, setCauta] = useState('')
  const [grup, setGrup] = useState<'toti' | Categorie>('toti')
  const [deschis, setDeschis] = useState<ClientCuCifre | null>(null)
  /* Fereastra de propus o ora, deschisa fie goala (cursant nou), fie cu omul
     deja completat, cand vine de pe fisa lui. Artiom descria fluxul asa: „se
     duce in cabinet, apasa cursanti, adauga, trimite cerere si gata". */
  const [propune, setPropune] = useState<null | { nume: string; email: string }>(null)
  const [toast, setToast] = useState('')

  const incarca = () => {
    setEroare('')
    apel<{ clienti: ClientCuCifre[] }>('clienti').then((r) => setLista(r.clienti)).catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [])

  const filtrati = useMemo(() => {
    const q = cauta.trim().toLowerCase()
    return (lista ?? [])
      .filter((c) => grup === 'toti' || c.categorie === grup)
      .filter((c) => !q || `${c.nume} ${c.email} ${c.telefon} ${c.scop} ${c.grupe.join(' ')}`.toLowerCase().includes(q))
  }, [lista, cauta, grup])

  /* Cati au facut proba gratuita si au ramas. E cifra care spune daca discutia
     de 20 de minute isi merita locul pe site. */
  const cifre = useMemo(() => {
    const toti = lista ?? []
    const cuProba = toti.filter((c) => c.probe > 0)
    const ramasi = cuProba.filter((c) => c.individuale + c.grup > 0)
    return {
      total: toti.length,
      individuali: toti.filter((c) => c.categorie === 'individual').length,
      inGrupe: toti.filter((c) => c.categorie === 'grup').length,
      doarProba: toti.filter((c) => c.categorie === 'proba').length,
      probe: cuProba.length,
      ramasi: ramasi.length,
      deIncasat: toti.reduce((s, c) => s + c.deIncasat, 0),
    }
  }, [lista])

  return (
    <>
      <Titlu
        sub="Toți cei care au făcut măcar o programare."
        actiuni={
          <button type="button" onClick={() => setPropune({ nume: '', email: '' })} className="pastila pastila-albastra !py-2.5 text-sm">
            Cursant nou, propune-i o oră
          </button>
        }
      >
        Cursanți
      </Titlu>

      {lista && lista.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <p className="rounded-2xl bg-alb px-5 py-4 text-sm">
            <span className="block text-2xl font-medium">{cifre.ramasi} din {cifre.probe}</span>
            <span className="text-gri">au rămas după discuția gratuită</span>
          </p>
          <p className="rounded-2xl bg-alb px-5 py-4 text-sm">
            <span className="block text-2xl font-medium">{cifre.individuali} · {cifre.inGrupe}</span>
            <span className="text-gri">individuali · în grupe</span>
          </p>
          <p className={`rounded-2xl px-5 py-4 text-sm ${cifre.deIncasat > 0 ? 'bg-portocaliu-5' : 'bg-alb'}`}>
            <span className="block text-2xl font-medium">{bani(cifre.deIncasat)}</span>
            <span className="text-gri">de încasat pe lecții făcute</span>
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {GRUPARI.map((g) => {
          const n = g.cheie === 'toti' ? cifre.total : g.cheie === 'individual' ? cifre.individuali : g.cheie === 'grup' ? cifre.inGrupe : cifre.doarProba
          return (
            <button
              key={g.cheie}
              type="button"
              onClick={() => setGrup(g.cheie)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${grup === g.cheie ? 'bg-cerneala text-alb' : 'bg-alb hover:bg-crem-inchis'}`}
            >
              {g.nume}
              {n > 0 && <span className={`ml-1.5 text-xs ${grup === g.cheie ? 'text-alb/60' : 'text-gri'}`}>{n}</span>}
            </button>
          )
        })}
        <input value={cauta} onChange={(e) => setCauta(e.target.value)} placeholder="Caută" className="ml-auto h-10 w-full rounded-full bg-alb px-4 text-sm outline-none focus:ring-2 focus:ring-albastru sm:w-72" />
      </div>

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
                  <span className={`rounded-full px-2.5 py-1 font-bold ${ETICHETA[c.categorie].clasa}`}>{ETICHETA[c.categorie].text}</span>
                  {c.grupe.map((g) => (
                    <span key={g} className="rounded-full bg-crem px-2.5 py-1">{g}</span>
                  ))}
                  {c.nivel && <span className="rounded-full bg-crem px-2.5 py-1">{c.nivel}</span>}
                  {c.scop && <span className="rounded-full bg-crem px-2.5 py-1">{c.scop}</span>}
                </div>
                <p className="mt-3 text-xs text-gri">
                  {c.lectii} {c.lectii === 1 ? 'lecție' : 'lecții'} · {bani(c.platit)} plătit{c.ultima ? ` · ultima: ${dataRo(c.ultima)}` : ''}
                </p>
                {c.deIncasat > 0 && <p className="mt-1 text-xs font-medium text-[#b8431a]">{bani(c.deIncasat)} de încasat</p>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {propune && (
        <DialogPropunere
          initial={propune}
          inchide={() => setPropune(null)}
          laTrimitere={() => incarca()}
          anunta={(t) => {
            setToast(t)
            window.setTimeout(() => setToast(''), 3000)
          }}
        />
      )}

      {deschis && (
        <DialogClient
          client={deschis}
          laPropunere={() => {
            setPropune({ nume: deschis.nume, email: deschis.email })
            setDeschis(null)
          }}
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

function DialogClient({ client, inchide, laSalvare, laPropunere }: { client: ClientCuCifre; inchide: () => void; laSalvare: (c: Client) => void; laPropunere: () => void }) {
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
        <div className="flex flex-wrap justify-end gap-2">
          {/* Drumul cel mai scurt de la „am vorbit cu el" la „i-am trimis ora":
              de pe fisa lui, fara sa mai cauti nimic. */}
          <button type="button" onClick={laPropunere} className="pastila pastila-alba mr-auto !py-3">Propune-i o oră</button>
          <button type="button" onClick={inchide} className="pastila pastila-crem !py-3">Renunță</button>
          <button type="button" onClick={salveaza} disabled={asteapta} className="pastila pastila-albastra !py-3 disabled:opacity-60">{asteapta ? 'Un moment…' : 'Salvează'}</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
