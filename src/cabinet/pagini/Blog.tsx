/**
 * Blogul, in cabinet: lista articolelor si editorul. Textul se scrie in
 * Markdown simplu (titluri cu ##, liste cu -, **ingrosat**), cu butoane de
 * ajutor si previzualizare. Publicarea e un comutator.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { Articol } from '@/lib/tipuri'
import { dataRo } from '@/lib/timp'
import { apel, urcaImagine } from '../api'
import { Camp, Card, Eroare, Gol, Titlu, Toast, clasaInput, clasaTextarea } from '../comune'
import IconPlus from '~icons/solar/add-circle-bold'
import IconBack from '~icons/solar/arrow-left-linear'
import IconEye from '~icons/solar/eye-bold'
import IconPen from '~icons/solar/pen-bold'
import IconImage from '~icons/solar/gallery-add-bold'
import IconTrash from '~icons/solar/trash-bin-trash-bold'

type Ciorna = Pick<Articol, 'titlu' | 'slug' | 'rezumat' | 'continut' | 'imagine' | 'imagine_alt' | 'meta_titlu' | 'meta_descriere' | 'publicat'>

const GOALA: Ciorna = { titlu: '', slug: '', rezumat: '', continut: '', imagine: '', imagine_alt: '', meta_titlu: '', meta_descriere: '', publicat: false }

function slugDin(t: string): string {
  return t.toLowerCase().replace(/ă|â/g, 'a').replace(/î/g, 'i').replace(/ș|ş/g, 's').replace(/ț|ţ/g, 't').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export default function Blog() {
  const [lista, setLista] = useState<Articol[] | null>(null)
  const [eroare, setEroare] = useState('')
  const [deschis, setDeschis] = useState<Articol | 'nou' | null>(null)
  const [toast, setToast] = useState('')

  const incarca = () => {
    setEroare('')
    apel<{ articole: Articol[] }>('articole').then((r) => setLista(r.articole)).catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [])

  const anunta = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(''), 2500)
  }

  if (deschis) {
    return (
      <Editor
        articol={deschis === 'nou' ? null : deschis}
        inapoi={() => {
          setDeschis(null)
          incarca()
        }}
        anunta={anunta}
      />
    )
  }

  return (
    <>
      <Titlu
        sub="Articole scurte care aduc oameni de pe Google și le arată cum lucrezi."
        actiuni={
          <button type="button" onClick={() => setDeschis('nou')} className="pastila pastila-albastra !py-2.5 text-sm">
            <IconPlus className="size-4" /> Articol nou
          </button>
        }
      >
        Blog
      </Titlu>

      {eroare && <Eroare mesaj={eroare} reincearca={incarca} />}
      {lista && lista.length === 0 && <Gol>Niciun articol încă. Începe cu unul scurt: o greșeală pe care o fac toți cursanții și cum o repari.</Gol>}

      <ul className="space-y-2">
        {(lista ?? []).map((a) => (
          <li key={a.id}>
            <button type="button" onClick={() => setDeschis(a)} className="flex w-full items-center gap-4 rounded-2xl bg-alb p-4 text-left transition hover:-translate-y-0.5">
              {a.imagine ? (
                <img src={a.imagine} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-albastru-5 font-display text-2xl text-albastru">Fr</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{a.titlu || 'Fără titlu'}</span>
                <span className="block truncate text-sm text-gri">{a.rezumat || 'Fără rezumat'}</span>
                <span className="mt-1 block text-xs text-gri">{a.publicat && a.publicat_la ? `Publicat ${dataRo(a.publicat_la)}` : `Ciornă, modificată ${dataRo(a.actualizat)}`}</span>
              </span>
              <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-bold', a.publicat ? 'bg-verde-5 text-verde' : 'bg-portocaliu-5 text-[#b8431a]')}>{a.publicat ? 'Publicat' : 'Ciornă'}</span>
            </button>
          </li>
        ))}
      </ul>
      <Toast text={toast} />
    </>
  )
}

function Editor({ articol, inapoi, anunta }: { articol: Articol | null; inapoi: () => void; anunta: (t: string) => void }) {
  const [id, setId] = useState<string | null>(articol?.id ?? null)
  const [c, setC] = useState<Ciorna>(articol ? { ...GOALA, ...articol } : GOALA)
  const [slugManual, setSlugManual] = useState(Boolean(articol?.slug))
  const [previzualizare, setPrevizualizare] = useState(false)
  const [asteapta, setAsteapta] = useState(false)
  const [eroare, setEroare] = useState('')
  const [murdar, setMurdar] = useState(false)
  const zona = useRef<HTMLTextAreaElement>(null)
  const fisierCoperta = useRef<HTMLInputElement>(null)
  const fisierInline = useRef<HTMLInputElement>(null)

  const schimba = <K extends keyof Ciorna>(camp: K, valoare: Ciorna[K]) => {
    setC((x) => ({ ...x, [camp]: valoare }))
    setMurdar(true)
  }

  useEffect(() => {
    if (!slugManual) setC((x) => ({ ...x, slug: slugDin(x.titlu) }))
  }, [c.titlu, slugManual])

  const html = useMemo(() => (previzualizare ? (marked.parse(c.continut || '', { async: false }) as string) : ''), [previzualizare, c.continut])

  async function salveaza(publicat?: boolean) {
    setAsteapta(true)
    setEroare('')
    try {
      const corp = { ...c, ...(publicat !== undefined ? { publicat } : {}), ...(id ? { id } : {}) }
      const r = await apel<{ articol: Articol }>('articol', { metoda: 'POST', corp })
      setId(r.articol.id)
      setC({ ...GOALA, ...r.articol })
      setMurdar(false)
      anunta(publicat === true ? 'Articolul e publicat' : publicat === false ? 'Articolul e retras, rămâne ciornă' : 'Salvat')
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Nu s-a salvat')
    } finally {
      setAsteapta(false)
    }
  }

  async function sterge() {
    if (!id || !confirm('Ștergi articolul definitiv?')) return
    try {
      await apel('articol', { metoda: 'DELETE', query: { id } })
      anunta('Articol șters')
      inapoi()
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Nu s-a șters')
    }
  }

  function insereaza(inainte: string, dupa = '', implicit = 'text') {
    const t = zona.current
    if (!t) return
    const [a, b] = [t.selectionStart, t.selectionEnd]
    const ales = c.continut.slice(a, b) || implicit
    const nou = `${c.continut.slice(0, a)}${inainte}${ales}${dupa}${c.continut.slice(b)}`
    schimba('continut', nou)
    requestAnimationFrame(() => {
      t.focus()
      t.setSelectionRange(a + inainte.length, a + inainte.length + ales.length)
    })
  }

  async function urca(f: File | undefined, unde: 'coperta' | 'inline') {
    if (!f) return
    setAsteapta(true)
    setEroare('')
    try {
      const url = await urcaImagine(f)
      if (unde === 'coperta') schimba('imagine', url)
      else insereaza(`\n![descrie imaginea](${url})\n`, '', '')
      anunta('Imagine urcată')
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Imaginea nu a putut fi urcată')
    } finally {
      setAsteapta(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => (!murdar || confirm('Ai modificări nesalvate. Ieși oricum?')) && inapoi()} className="inline-flex items-center gap-1.5 text-sm font-medium text-albastru-text">
          <IconBack className="size-4" /> Toate articolele
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {id && (
            <button type="button" onClick={sterge} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-gri hover:text-rosu">
              <IconTrash className="size-4" /> Șterge
            </button>
          )}
          <button type="button" onClick={() => salveaza()} disabled={asteapta} className="pastila pastila-alba !py-2.5 text-sm disabled:opacity-60">
            Salvează ciorna
          </button>
          {c.publicat ? (
            <button type="button" onClick={() => salveaza(false)} disabled={asteapta} className="pastila pastila-crem !py-2.5 text-sm disabled:opacity-60">
              Retrage de pe site
            </button>
          ) : (
            <button type="button" onClick={() => salveaza(true)} disabled={asteapta} className="pastila pastila-albastra !py-2.5 text-sm disabled:opacity-60">
              Publică
            </button>
          )}
        </div>
      </div>

      {eroare && <div className="mb-4"><Eroare mesaj={eroare} /></div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <input value={c.titlu} onChange={(e) => schimba('titlu', e.target.value)} placeholder="Titlul articolului" className="w-full bg-transparent font-display text-3xl outline-none placeholder:text-gri/50 sm:text-4xl" />
          <p className="mt-2 text-xs text-gri">
            Adresa: /blog/<input value={c.slug} onChange={(e) => { setSlugManual(true); schimba('slug', slugDin(e.target.value) || e.target.value) }} className="w-64 rounded bg-crem px-1.5 py-0.5 font-mono text-xs outline-none" />/
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-xl bg-crem p-1.5 text-sm">
            {[
              ['Titlu', () => insereaza('\n## ', '\n', 'Titlu de secțiune')],
              ['Subtitlu', () => insereaza('\n### ', '\n', 'Subtitlu')],
              ['Îngroșat', () => insereaza('**', '**')],
              ['Cursiv', () => insereaza('*', '*')],
              ['Listă', () => insereaza('\n- ', '\n', 'primul punct')],
              ['Citat', () => insereaza('\n> ', '\n', 'citat')],
              ['Link', () => insereaza('[', '](https://)', 'textul linkului')],
            ].map(([nume, fn]) => (
              <button key={nume as string} type="button" onClick={fn as () => void} className="rounded-lg bg-alb px-3 py-1.5 font-medium hover:bg-albastru-5">
                {nume as string}
              </button>
            ))}
            <button type="button" onClick={() => fisierInline.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-alb px-3 py-1.5 font-medium hover:bg-albastru-5">
              <IconImage className="size-4" /> Imagine în text
            </button>
            <input ref={fisierInline} type="file" accept="image/*" className="hidden" onChange={(e) => void urca(e.target.files?.[0], 'inline')} />
            <button type="button" onClick={() => setPrevizualizare((p) => !p)} className={cn('ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium', previzualizare ? 'bg-cerneala text-alb' : 'bg-alb hover:bg-albastru-5')}>
              {previzualizare ? <IconPen className="size-4" /> : <IconEye className="size-4" />} {previzualizare ? 'Înapoi la scris' : 'Previzualizare'}
            </button>
          </div>

          {previzualizare ? (
            <div
              className="articol mt-4 min-h-[420px] space-y-4 text-[1.05rem] leading-[1.75] [&_a]:text-albastru-text [&_a]:underline [&_blockquote]:rounded-2xl [&_blockquote]:bg-crem [&_blockquote]:px-5 [&_blockquote]:py-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:font-sans [&_h3]:text-lg [&_h3]:font-medium [&_img]:rounded-2xl [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <textarea
              ref={zona}
              value={c.continut}
              onChange={(e) => schimba('continut', e.target.value)}
              rows={22}
              placeholder={'Scrie liber. Un rând gol desparte paragrafele.\n\n## Un titlu de secțiune\n\nText cu **cuvinte îngroșate** și o listă:\n\n- primul punct\n- al doilea punct'}
              className="mt-4 w-full resize-y rounded-xl bg-crem p-4 text-[1.02rem] leading-relaxed outline-none focus:ring-2 focus:ring-albastru"
            />
          )}
          <p className="mt-2 text-xs text-gri">{c.continut.split(/\s+/).filter(Boolean).length} cuvinte · {Math.max(1, Math.round(c.continut.split(/\s+/).filter(Boolean).length / 200))} min de citit</p>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-sans text-lg font-medium">Imaginea de copertă</h2>
            {c.imagine ? (
              <img src={c.imagine} alt={c.imagine_alt} className="mt-3 aspect-[16/10] w-full rounded-xl object-cover" />
            ) : (
              <div className="mt-3 flex aspect-[16/10] items-center justify-center rounded-xl bg-crem text-sm text-gri">fără imagine</div>
            )}
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => fisierCoperta.current?.click()} disabled={asteapta} className="pastila pastila-crem !py-2.5 text-sm disabled:opacity-60">
                <IconImage className="size-4" /> {c.imagine ? 'Schimbă' : 'Urcă'}
              </button>
              {c.imagine && (
                <button type="button" onClick={() => schimba('imagine', '')} className="pastila !py-2.5 text-sm text-gri hover:text-rosu">Scoate</button>
              )}
              <input ref={fisierCoperta} type="file" accept="image/*" className="hidden" onChange={(e) => void urca(e.target.files?.[0], 'coperta')} />
            </div>
            <div className="mt-3">
              <Camp eticheta="Ce se vede în imagine" ajutor="Pentru cititorii cu cititor de ecran și pentru Google.">
                <input value={c.imagine_alt} onChange={(e) => schimba('imagine_alt', e.target.value)} className={clasaInput} />
              </Camp>
            </div>
          </Card>

          <Card>
            <h2 className="font-sans text-lg font-medium">Pe listă și pe Google</h2>
            <div className="mt-3 space-y-3">
              <Camp eticheta="Rezumat" ajutor="Două propoziții. Gol, se ia din text.">
                <textarea rows={3} value={c.rezumat} onChange={(e) => schimba('rezumat', e.target.value)} className={clasaTextarea} />
              </Camp>
              <Camp eticheta={`Titlu pentru Google (${c.meta_titlu.length}/60)`} ajutor="Gol, se folosește titlul articolului.">
                <input value={c.meta_titlu} maxLength={70} onChange={(e) => schimba('meta_titlu', e.target.value)} className={clasaInput} />
              </Camp>
              <Camp eticheta={`Descriere pentru Google (${c.meta_descriere.length}/160)`}>
                <textarea rows={3} value={c.meta_descriere} maxLength={170} onChange={(e) => schimba('meta_descriere', e.target.value)} className={clasaTextarea} />
              </Camp>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span>
                <span className="block font-medium">{c.publicat ? 'Pe site' : 'Ciornă'}</span>
                <span className="block text-xs text-gri">{c.publicat && c.slug ? <a href={`/blog/${c.slug}/`} target="_blank" rel="noopener" className="text-albastru-text underline">Deschide pe site</a> : 'Nu se vede pe site'}</span>
              </span>
              <Switch checked={c.publicat} onCheckedChange={(v) => void salveaza(v)} disabled={asteapta} />
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
