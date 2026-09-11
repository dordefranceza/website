/** Fereastra cu detaliile unei programari: stare, plata, ora, linkul de Zoom, note. */
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import type { Programare, StareProgramare } from '@/lib/tipuri'
import { dataOraRo } from '@/lib/timp'
import { apel } from './api'
import { Camp, EtichetaTip, STARE_TEXT, clasaInput, clasaSelect, clasaTextarea } from './comune'
import { isoLaLocal, localLaIso } from './timpLocal'
import IconChat from '~icons/solar/chat-round-line-bold'
import IconLetter from '~icons/solar/letter-bold'
import IconPhone from '~icons/solar/phone-bold'

type Props = { programare: Programare | null; inchide: () => void; laSalvare: (p: Programare) => void; anunta: (t: string) => void }

function cifre(t: string): string {
  const c = t.replace(/\D/g, '')
  if (t.trim().startsWith('+')) return c
  if (c.startsWith('00')) return c.slice(2)
  if (c.startsWith('40') || c.startsWith('373')) return c
  if (c.startsWith('0')) return `40${c.slice(1)}`
  return c
}

export default function DialogProgramare({ programare, inchide, laSalvare, anunta }: Props) {
  const [stare, setStare] = useState<StareProgramare>('noua')
  const [platit, setPlatit] = useState(false)
  const [suma, setSuma] = useState('0')
  const [incepe, setIncepe] = useState('')
  const [link, setLink] = useState('')
  const [note, setNote] = useState('')
  const [asteapta, setAsteapta] = useState(false)
  const [eroare, setEroare] = useState('')

  useEffect(() => {
    if (!programare) return
    setStare(programare.stare)
    setPlatit(programare.platit)
    setSuma(String(programare.suma))
    setIncepe(isoLaLocal(programare.incepe))
    setLink(programare.link_zoom)
    setNote(programare.note)
    setEroare('')
  }, [programare])

  if (!programare) return null
  const c = programare.client

  async function salveaza() {
    if (!programare) return
    setAsteapta(true)
    setEroare('')
    try {
      const iso = localLaIso(incepe)
      const r = await apel<{ programare: Programare }>('programare', {
        metoda: 'PATCH',
        corp: { id: programare.id, stare, platit, suma: Number(suma) || 0, note, link_zoom: link, ...(iso && iso !== programare.incepe ? { incepe: iso } : {}) },
      })
      laSalvare(r.programare)
      anunta('Salvat')
      inchide()
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Nu s-a salvat')
    } finally {
      setAsteapta(false)
    }
  }

  async function trimiteLink() {
    if (!programare) return
    setAsteapta(true)
    setEroare('')
    try {
      await apel('trimite-link', { metoda: 'POST', corp: { id: programare.id, link } })
      anunta(`Linkul a plecat către ${c?.email ?? 'cursant'}`)
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Emailul nu a plecat')
    } finally {
      setAsteapta(false)
    }
  }

  return (
    <Dialog open onOpenChange={(d) => !d && inchide()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.5rem] border-0 p-0 sm:max-w-xl">
        <div className="bg-navy p-6 text-alb">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-normal">{c?.nume ?? 'Programare'}</DialogTitle>
            <DialogDescription className="text-alb/70">{dataOraRo(programare.incepe)} · {programare.durata_min} min</DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <EtichetaTip tip={programare.tip} />
            {programare.sursa && <span className="rounded-full bg-alb/10 px-2.5 py-1 text-xs">din {programare.sursa}</span>}
          </div>
          {c && (
            <div className="mt-4 flex flex-wrap gap-2">
              {c.telefon && (
                <a href={`https://wa.me/${cifre(c.telefon)}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full bg-whatsapp px-3 py-1.5 text-xs font-bold text-cerneala">
                  <IconChat className="size-4" /> WhatsApp
                </a>
              )}
              {c.telefon && (
                <a href={`tel:${c.telefon.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 rounded-full bg-alb/10 px-3 py-1.5 text-xs font-medium">
                  <IconPhone className="size-4" /> {c.telefon}
                </a>
              )}
              <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 rounded-full bg-alb/10 px-3 py-1.5 text-xs font-medium">
                <IconLetter className="size-4" /> {c.email}
              </a>
            </div>
          )}
        </div>

        <div className="space-y-5 p-6">
          {(c?.nivel || c?.scop || programare.mesaj) && (
            <div className="rounded-2xl bg-crem p-4 text-sm">
              {c?.nivel && <p><span className="text-gri">Nivel:</span> {c.nivel}</p>}
              {c?.scop && <p><span className="text-gri">Scop:</span> {c.scop}</p>}
              {programare.mesaj && <p className="mt-2 whitespace-pre-line"><span className="text-gri">Mesaj:</span> {programare.mesaj}</p>}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Camp eticheta="Stare">
              <select value={stare} onChange={(e) => setStare(e.target.value as StareProgramare)} className={clasaSelect}>
                {(Object.keys(STARE_TEXT) as StareProgramare[]).map((s) => (
                  <option key={s} value={s}>{STARE_TEXT[s]}</option>
                ))}
              </select>
            </Camp>
            <Camp eticheta="Data și ora (ora României)">
              <input type="datetime-local" value={incepe} onChange={(e) => setIncepe(e.target.value)} className={clasaInput} />
            </Camp>
            <Camp eticheta="Sumă (€)">
              <input type="number" min="0" step="1" value={suma} onChange={(e) => setSuma(e.target.value)} className={clasaInput} />
            </Camp>
            <div className="flex items-center justify-between rounded-xl bg-crem px-4 py-3">
              <span className="text-sm font-medium">Plătită</span>
              <Switch checked={platit} onCheckedChange={setPlatit} />
            </div>
          </div>

          <Camp eticheta="Link Zoom pentru această lecție" ajutor="Gol înseamnă linkul din Setări.">
            <div className="flex gap-2">
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://zoom.us/j/…" className={clasaInput} />
              <button type="button" onClick={trimiteLink} disabled={asteapta} className="shrink-0 rounded-xl bg-albastru-5 px-4 text-sm font-medium text-navy hover:bg-albastru-10 disabled:opacity-60">
                Trimite linkul
              </button>
            </div>
          </Camp>

          <Camp eticheta="Note (le vezi doar tu)">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={clasaTextarea} />
          </Camp>

          {eroare && <p role="alert" className="rounded-xl bg-[#fdeaee] px-4 py-3 text-sm text-rosu">{eroare}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={inchide} className="pastila pastila-crem !py-3">Renunță</button>
            <button type="button" onClick={salveaza} disabled={asteapta} className="pastila pastila-albastra !py-3 disabled:opacity-60">
              {asteapta ? 'Un moment…' : 'Salvează'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
