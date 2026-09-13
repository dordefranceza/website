/** Fereastra cu detaliile unei programari: stare, plata, ora, linkul de Zoom, note. */
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import type { Programare, StareProgramare } from '@/lib/tipuri'
import { dataOraRo } from '@/lib/timp'
import { apel } from './api'
import { Camp, EtichetaTip, STARE_TEXT, clasaInput, clasaTextarea } from './comune'
import { isoLaLocal, localLaIso } from './timpLocal'
import { numarInternational } from '@/lib/telefon'
import { IconWhatsApp } from '@/components/IconWhatsApp'
import IconLetter from '~icons/solar/letter-bold'
import IconPhone from '~icons/solar/phone-bold'

type Props = { programare: Programare | null; inchide: () => void; laSalvare: (p: Programare) => void; anunta: (t: string) => void }


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

  /*
   * Linkul salii din Setari, pentru cazul in care lectia n-are unul al ei.
   *
   * Sta AICI, inaintea lui `return null`, si asta nu e o chestiune de gust:
   * React cere ca toate carligele sa fie chemate in aceeasi ordine la fiecare
   * randare. Pus dupa iesirea de mai jos, la deschiderea ferestrei se chemau
   * doua carlige in plus fata de randarea dinainte, iar cabinetul se facea
   * pagina alba. Artiom a apasat „Detalii" si exact asta a primit.
   */
  const [linkSala, setLinkSala] = useState('')
  useEffect(() => {
    if (!programare) return
    apel<{ setari: { link_zoom: string } }>('setari')
      .then((r) => setLinkSala(r.setari.link_zoom ?? ''))
      .catch(() => setLinkSala(''))
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

  /* Numarul in forma internationala, cum il cere wa.me. Gol cand omul n-a
     lasat telefon SAU cand a scris unul local, fara tara: atunci nu ghicim,
     fiindca ghicitul ducea mesajul la un strain. */
  const cifreTelefon = numarInternational(c?.telefon ?? '')

  const mesajLink = programare
    ? [
        `Bună, ${(c?.nume ?? '').split(' ')[0]}!`,
        `Ne vedem ${dataOraRo(programare.incepe)} (ora României).`,
        link || linkSala || 'Linkul ți-l trimit înainte de lecție.',
      ].join('\n')
    : ''

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
              {/* Butonul apare doar cand numarul spune si tara. Altfel wa.me
                  duce la alt om, si asta e mai rau decat sa nu ai buton. */}
              {cifreTelefon && (
                <a href={`https://wa.me/${cifreTelefon}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full bg-whatsapp px-3 py-1.5 text-xs font-bold text-cerneala">
                  <IconWhatsApp className="size-4" /> WhatsApp
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

          {/*
            Starea, pusa pe butoane, nu intr-o lista derulanta.
            Artiom, a doua oara despre acelasi lucru: lista derulanta e a
            sistemului, se deschide cenusie peste fereastra noastra si nu
            seamana cu nimic din cabinet. Pe butoane se vad toate cele cinci
            stari deodata si se apasa dintr-o data, nu din doua.
          */}
          <div>
            <p className="mb-2 text-sm font-medium">Stare</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STARE_TEXT) as StareProgramare[]).map((sv) => (
                <button
                  key={sv}
                  type="button"
                  onClick={() => setStare(sv)}
                  aria-pressed={stare === sv}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${stare === sv ? 'bg-cerneala text-alb' : 'bg-crem hover:bg-crem-inchis'}`}
                >
                  {STARE_TEXT[sv]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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

          <Camp eticheta="Link de întâlnire pentru lecția asta" ajutor="Zoom, Google Meet, orice. Gol înseamnă linkul din Setări.">
            <div className="flex gap-2">
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/… sau https://zoom.us/j/…" className={clasaInput} />
              <button type="button" onClick={trimiteLink} disabled={asteapta} className="shrink-0 rounded-xl bg-albastru-5 px-4 text-sm font-medium text-navy hover:bg-albastru-10 disabled:opacity-60">
                Trimite pe email
              </button>
            </div>
          </Camp>

          {/*
            Acelasi link, dar pe WhatsApp, cu mesajul scris deja.
            Emailul se pierde, se duce in Promotii, se citeste a doua zi. Cu
            zece minute inainte de lectie, WhatsApp e singurul care ajunge la
            om, iar Dorina nu mai are de scris nimic de mana: data, ora si
            linkul sunt deja acolo.
          */}
          {cifreTelefon ? (
            <a
              href={`https://wa.me/${cifreTelefon}?text=${encodeURIComponent(mesajLink)}`}
              target="_blank"
              rel="noopener"
              className="-mt-2 inline-flex items-center gap-2 rounded-full bg-verde-5 px-4 py-2.5 text-sm font-medium text-verde hover:bg-verde-10"
            >
              <IconWhatsApp className="size-4" /> Trimite linkul pe WhatsApp
            </a>
          ) : (
            /* Nu putem sti daca omul are WhatsApp, dar putem sti daca numarul
               lui e bun de WhatsApp. Cand nu e, spunem de ce, in loc sa lasam
               un buton care duce aiurea. */
            <p className="-mt-2 rounded-xl bg-crem px-4 py-3 text-sm leading-relaxed text-gri">
              {c?.telefon
                ? <>Numărul <strong className="font-medium text-cerneala">{c.telefon}</strong> nu are prefixul țării, așa că nu pot deschide WhatsApp cu el. Sună-l, sau trimite-i linkul pe email cu butonul de mai sus.</>
                : <>Nu ți-a lăsat număr de telefon, deci linkul merge doar pe email.</>}
            </p>
          )}

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
