/**
 * Formularul public de programare, in trei pasi: tipul, ziua si ora, datele.
 * Sloturile vin de la /api/sloturi (calculate pe server), programarea pleaca
 * la /api/programare. Orele se afiseaza in fusul Romaniei, oricare ar fi
 * fusul browserului.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { NIVELURI, SCOPURI, TIPURI, type TipProgramare } from '@/lib/tipuri'
import { cursGrup, pachete, site } from '@/config/site'
import { dataRo, desfaZi, localDin, numeLuna, oraRo } from '@/lib/timp'
import { sursaVizitei } from '@/lib/sursa'
import IconArrow from '~icons/solar/arrow-right-linear'
import IconBack from '~icons/solar/arrow-left-linear'
import IconMail from '~icons/solar/letter-bold'
import { IconWhatsApp } from '@/components/IconWhatsApp'
import IconCheck from '~icons/solar/check-circle-bold'
import IconCalendar from '~icons/solar/calendar-mark-bold'
import IconClock from '~icons/solar/clock-circle-bold'
import IconUser from '~icons/solar/user-rounded-bold'
import IconUsers from '~icons/solar/users-group-rounded-bold'
import IconCup from '~icons/solar/cup-hot-bold'

type Props = { whatsapp: string }
type Sloturi = Record<string, string[]>

/**
 * Preturile si duratele vin din TIPURI, nu sunt scrise aici, ca sa nu ramana in
 * urma cand se schimba grila. Grupul are si o nota in plus: nu se ia la bucata,
 * lectia rezervata aici e prima dintr-un curs de doua luni.
 */
const TIPURI_LISTA: { tip: TipProgramare; Icon: typeof IconUser; text: string }[] = [
  { tip: 'cunoastere', Icon: IconCup, text: 'Ne cunoaștem, îți evaluez nivelul și pleci cu un plan. Gratuit.' },
  { tip: 'individual', Icon: IconUser, text: `Doar tu și Dorina, pe obiectivul tău. ${TIPURI.individual.durata} de minute.` },
  {
    tip: 'grup',
    Icon: IconUsers,
    text: `${site.marimeGrup} de același nivel, ${TIPURI.grup.durata} de minute. Alegi ora de start a grupei, iar cursul ține ${cursGrup.lectii} lecții.`,
  },
]

const ZILE_SCURT = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du']

function parametru(nume: string): string {
  try {
    return new URLSearchParams(location.search).get(nume) ?? ''
  } catch {
    return ''
  }
}

export default function Programare({ whatsapp }: Props) {
  const [pas, setPas] = useState<1 | 2 | 3 | 4>(1)
  const [tip, setTip] = useState<TipProgramare>('cunoastere')
  const [scopInitial, setScopInitial] = useState('')
  /** Pachetul ales pe pagina de preturi, daca a venit de acolo. */
  const [mesajInitial, setMesajInitial] = useState('')
  const [sloturi, setSloturi] = useState<Sloturi>({})
  const [incarca, setIncarca] = useState(false)
  const [eroareSloturi, setEroareSloturi] = useState('')
  const [luna, setLuna] = useState(() => {
    const p = localDin(new Date())
    return { an: p.an, luna: p.luna }
  })
  const [zi, setZi] = useState('')
  const [slot, setSlot] = useState('')
  const [gdpr, setGdpr] = useState(false)
  const [trimite, setTrimite] = useState(false)
  const [eroare, setEroare] = useState('')
  const [sugestie, setSugestie] = useState('')
  /**
   * Cand s-a deschis formularul. Trimitem cate milisecunde a stat omul pe el,
   * nu ceasul lui: ceasul poate fi oricat de gresit, diferenta nu.
   */
  const deschisLa = useRef(typeof performance === 'undefined' ? 0 : performance.now())
  const formular = useRef<HTMLFormElement | null>(null)
  const [rezultat, setRezultat] = useState<{ incepe: string } | null>(null)

  // Parametrii din link: ?tip=individual&scop=...&pachet=cinci
  //
  // Pachetul nu e retinut nicaieri in baza de date: site-ul arata preturile,
  // iar numaratoarea lectiilor ramane intre Dorina si cursant, ca si plata,
  // care se face prin transfer. Ca sa nu se piarda totusi intentia omului,
  // pachetul ales pe pagina de preturi intra scris in mesajul care ajunge la ea.
  useEffect(() => {
    const t = parametru('tip') as TipProgramare
    if (t in TIPURI) {
      setTip(t)
      setPas(2)
    }
    setScopInitial(parametru('scop'))
    const p = pachete.find((x) => x.id === parametru('pachet'))
    if (p) setMesajInitial(`Vreau ${p.nume.toLowerCase()}, ${p.pretLectie} € pe lecție.`)
  }, [])

  // Sloturile se cer o data pe tip.
  useEffect(() => {
    let anulat = false
    setIncarca(true)
    setEroareSloturi('')
    setZi('')
    setSlot('')
    fetch(`/api/sloturi?tip=${tip}`)
      .then(async (r) => {
        const d = (await r.json()) as { ok: boolean; zile?: Sloturi; eroare?: string }
        if (!r.ok || !d.ok) throw new Error(d.eroare || 'Calendarul nu poate fi citit')
        if (!anulat) {
          setSloturi(d.zile ?? {})
          // Sare la prima luna cu sloturi, ca sa nu vezi un calendar gol.
          const prima = Object.keys(d.zile ?? {}).sort()[0]
          const p = prima ? desfaZi(prima) : null
          if (p) setLuna({ an: p.an, luna: p.luna })
        }
      })
      .catch((e: Error) => !anulat && setEroareSloturi(e.message))
      .finally(() => !anulat && setIncarca(false))
    return () => {
      anulat = true
    }
  }, [tip])

  const zileLuna = useMemo(() => {
    const prima = new Date(Date.UTC(luna.an, luna.luna - 1, 1))
    const decalaj = (prima.getUTCDay() + 6) % 7
    const nrZile = new Date(Date.UTC(luna.an, luna.luna, 0)).getUTCDate()
    const celule: (string | null)[] = Array(decalaj).fill(null)
    for (let z = 1; z <= nrZile; z++) celule.push(`${luna.an}-${String(luna.luna).padStart(2, '0')}-${String(z).padStart(2, '0')}`)
    return celule
  }, [luna])

  const lunaAnterioara = () => setLuna((l) => (l.luna === 1 ? { an: l.an - 1, luna: 12 } : { an: l.an, luna: l.luna - 1 }))
  const lunaUrmatoare = () => setLuna((l) => (l.luna === 12 ? { an: l.an + 1, luna: 1 } : { an: l.an, luna: l.luna + 1 }))
  const azi = localDin(new Date())
  const esteLunaCurenta = luna.an === azi.an && luna.luna === azi.luna

  async function trimiteFormular(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setTrimite(true)
    setEroare('')
    setSugestie('')
    try {
      const r = await fetch('/api/programare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tip,
          incepe: slot,
          nume: f.get('nume'),
          email: f.get('email'),
          telefon: f.get('telefon'),
          nivel: f.get('nivel'),
          scop: f.get('scop'),
          mesaj: f.get('mesaj'),
          botcheck: f.get('website'),
          zabovit: typeof performance === 'undefined' ? 0 : Math.round(performance.now() - deschisLa.current),
          gdpr,
          sursa: sursaVizitei(),
          pagina: location.pathname,
        }),
      })
      const d = (await r.json()) as { ok: boolean; incepe?: string; eroare?: string; sugestie?: string }
      if (!r.ok || !d.ok) {
        if (r.status === 409) {
          setSlot('')
          setPas(2)
        }
        if (d.sugestie) setSugestie(d.sugestie)
        throw new Error(d.eroare || 'Programarea nu a putut fi salvată')
      }
      setRezultat({ incepe: d.incepe ?? slot })
      setPas(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (er) {
      setEroare(er instanceof Error ? er.message : 'Programarea nu a putut fi salvată')
    } finally {
      setTrimite(false)
    }
  }

  /** Serverul a ghicit adresa buna dintr-o greseala de tastat; o punem noi. */
  function acceptaSugestia() {
    const camp = formular.current?.elements.namedItem('email')
    if (camp instanceof HTMLInputElement) {
      camp.value = sugestie
      camp.focus()
    }
    setSugestie('')
    setEroare('')
  }

  /*
   * Mesajul catre Dorina se scrie singur cu ce a ales omul pana in clipa aia.
   * Artiom: „cand a ales data si ora, cand apasa pe gmail sau pe whatsapp,
   * acolo sa fie mesajul pregatit deja cu ora si ziua". Altfel cursantul isi
   * rescrie de mana ce tocmai a apasat, iar Dorina primeste „vreau o lectie"
   * si trebuie sa intrebe inapoi cand.
   */
  const mesajDirect = (() => {
    const ce = TIPURI[tip].nume.toLowerCase()
    if (slot) return `Bună, Dorina! Aș vrea ${ce} pe ${dataRo(slot)}, ora ${oraRo(slot)} (ora României).`
    if (zi) return `Bună, Dorina! Aș vrea ${ce} pe ${dataRo(`${zi}T12:00:00Z`)}.`
    return `Bună, Dorina! Aș vrea să programez ${ce}.`
  })()

  const subiectDirect = slot
    ? `Programare: ${TIPURI[tip].nume.toLowerCase()}, ${dataRo(slot)}, ora ${oraRo(slot)}`
    : `Programare: ${TIPURI[tip].nume.toLowerCase()}`

  const rezumat = (
    <aside className="rounded-[1.5rem] bg-navy p-6 text-alb sm:p-7">
      <p className="text-xs font-bold uppercase tracking-wider text-alb/60">Alegerea ta</p>
      <p className="mt-3 font-display text-2xl">{TIPURI[tip].nume}</p>
      <p className="mt-1 text-alb/70">
        {TIPURI[tip].durata} de minute · {TIPURI[tip].pret ? `${TIPURI[tip].pret} €` : 'gratuit'}
      </p>
      <div className="mt-6 space-y-3 text-[0.95rem]">
        <p className="flex items-center gap-2.5">
          <IconCalendar className="size-5 text-roz" />
          {zi ? dataRo(slot || `${zi}T12:00:00Z`) : <span className="text-alb/50">ziua, la pasul 2</span>}
        </p>
        <p className="flex items-center gap-2.5">
          <IconClock className="size-5 text-roz" />
          {slot ? `ora ${oraRo(slot)} (ora României)` : <span className="text-alb/50">ora, la pasul 2</span>}
        </p>
      </div>
      <p className="mt-8 text-sm text-alb/60">Preferi să vorbim direct?</p>
      {/* Doua usi, nu una: nu toata lumea are WhatsApp si nu toata lumea vrea
          sa dea numarul de telefon ca sa puna o intrebare. */}
      <div className="mt-2 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mesajDirect)}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 rounded-full bg-alb/10 px-4 py-2.5 text-sm font-medium hover:bg-alb/15"
        >
          <IconWhatsApp className="size-4 text-verde-10" /> Scrie pe WhatsApp
        </a>
        <a
          href={`mailto:${site.email}?subject=${encodeURIComponent(subiectDirect)}&body=${encodeURIComponent(mesajDirect)}`}
          className="inline-flex items-center gap-2 rounded-full bg-alb/10 px-4 py-2.5 text-sm font-medium hover:bg-alb/15"
        >
          <IconMail className="size-4 text-roz" /> Scrie pe email
        </a>
      </div>
    </aside>
  )

  if (pas === 4 && rezultat) {
    return (
      <div className="mx-auto mt-12 max-w-2xl rounded-[2rem] bg-alb p-8 text-center sm:p-12">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-verde-5">
          <IconCheck className="size-9 text-verde" />
        </span>
        <h2 className="mt-6 text-3xl sm:text-4xl">Gata, ești în calendar</h2>
        <p className="mt-4 text-lg text-gri">
          {TIPURI[tip].nume}, {dataRo(rezultat.incepe)}, ora {oraRo(rezultat.incepe)}.
        </p>
        <p className="mt-2 text-gri">Confirmarea a plecat pe email, cu toate detaliile. Dacă nu o vezi în câteva minute, verifică și în Spam.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="/" className="pastila pastila-crem">Înapoi la site</a>
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bună, Dorina! Tocmai am programat ${TIPURI[tip].nume.toLowerCase()} pentru ${dataRo(rezultat.incepe)}, ora ${oraRo(rezultat.incepe)}.`)}`}
            target="_blank"
            rel="noopener"
            className="pastila pastila-albastra"
          >
            <IconWhatsApp className="size-5" /> Salută-o pe Dorina
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="lg:sticky lg:top-28 lg:self-start">{rezumat}</div>

      <div className="rounded-[2rem] bg-alb p-6 sm:p-9">
        {/* Pasii */}
        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          {(['Tipul', 'Ziua și ora', 'Datele tale'] as const).map((nume, i) => {
            const n = (i + 1) as 1 | 2 | 3
            const activ = pas === n
            const gata = pas > n
            return (
              <li key={nume} className={cn('flex items-center gap-2', activ ? 'text-cerneala' : gata ? 'text-verde' : 'text-gri')}>
                <span className={cn('flex size-6 items-center justify-center rounded-full text-xs', activ ? 'bg-albastru text-alb' : gata ? 'bg-verde-5 text-verde' : 'bg-gri-deschis')}>
                  {gata ? '✓' : n}
                </span>
                {nume}
              </li>
            )
          })}
        </ol>

        {pas === 1 && (
          <div className="mt-8">
            <h2 className="font-sans text-2xl font-medium">Cu ce începem?</h2>
            <div className="mt-6 grid gap-3">
              {TIPURI_LISTA.map(({ tip: t, Icon, text }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTip(t)
                    setPas(2)
                  }}
                  className={cn(
                    'flex items-center gap-5 rounded-[1.25rem] p-5 text-left transition hover:-translate-y-0.5',
                    tip === t ? 'bg-albastru-5' : 'bg-crem hover:bg-crem-inchis',
                  )}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-alb">
                    <Icon className="size-6 text-albastru" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">{TIPURI[t].nume}</span>
                    <span className="block text-sm text-gri">{text}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-display text-xl">{TIPURI[t].pret ? `${TIPURI[t].pret} €` : 'Gratuit'}</span>
                    {t === 'grup' && (
                      <span className="block text-xs text-gri">
                        pe lecție, {cursGrup.lectii * cursGrup.pretLectie} € cursul
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {pas === 2 && (
          <div className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-sans text-2xl font-medium">Alege ziua</h2>
              <button type="button" onClick={() => setPas(1)} className="inline-flex items-center gap-1 text-sm font-medium text-albastru-text">
                <IconBack className="size-4" /> Schimbă tipul
              </button>
            </div>

            {eroareSloturi && <p role="alert" className="mt-6 rounded-xl bg-[#fdeaee] px-4 py-3 text-sm text-rosu">{eroareSloturi}</p>}

            <div className="mt-6 grid gap-8 md:grid-cols-[1fr_200px]">
              <div>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={lunaAnterioara} disabled={esteLunaCurenta} className="flex size-9 items-center justify-center rounded-full bg-crem disabled:opacity-30" aria-label="Luna anterioară">
                    <IconBack className="size-4" />
                  </button>
                  <p className="font-medium capitalize">
                    {numeLuna(luna.luna)} {luna.an}
                  </p>
                  <button type="button" onClick={lunaUrmatoare} className="flex size-9 items-center justify-center rounded-full bg-crem" aria-label="Luna următoare">
                    <IconArrow className="size-4" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wider text-gri">
                  {ZILE_SCURT.map((z) => (
                    <span key={z} className="py-1">{z}</span>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {zileLuna.map((cheie, i) => {
                    if (!cheie) return <span key={`gol-${i}`} />
                    const libere = sloturi[cheie]?.length ?? 0
                    const aleasa = zi === cheie
                    return (
                      <button
                        key={cheie}
                        type="button"
                        disabled={!libere}
                        onClick={() => {
                          setZi(cheie)
                          setSlot('')
                        }}
                        className={cn(
                          'relative aspect-square rounded-2xl text-[0.95rem] font-medium transition',
                          aleasa ? 'bg-albastru text-alb' : libere ? 'bg-albastru-5 text-navy hover:bg-albastru-10' : 'text-gri/40',
                        )}
                      >
                        {Number(cheie.slice(-2))}
                        {libere > 0 && !aleasa && <span className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-albastru" />}
                      </button>
                    )
                  })}
                </div>
                {incarca && <p className="mt-4 text-sm text-gri">Se încarcă orele libere…</p>}
                {!incarca && !eroareSloturi && Object.keys(sloturi).length === 0 && (
                  <p className="mt-4 text-sm text-gri">Nu sunt ore libere în perioada următoare. Scrie-i Dorinei pe WhatsApp și găsiți împreună o oră.</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gri">{zi ? dataRo(`${zi}T12:00:00Z`) : 'Alege o zi din calendar'}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-2">
                  {(sloturi[zi] ?? []).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={cn('rounded-full px-3 py-2.5 text-sm font-medium transition', slot === s ? 'bg-albastru text-alb' : 'bg-crem hover:bg-crem-inchis')}
                    >
                      {oraRo(s)}
                    </button>
                  ))}
                </div>
                {zi && <p className="mt-3 text-xs text-gri">Ora României</p>}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button type="button" disabled={!slot} onClick={() => setPas(3)} className="h-12 rounded-full px-7 text-base">
                Continuă <IconArrow className="size-5" />
              </Button>
            </div>
          </div>
        )}

        {pas === 3 && (
          <form ref={formular} onSubmit={trimiteFormular} className="relative mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-sans text-2xl font-medium">Datele tale</h2>
              <button type="button" onClick={() => setPas(2)} className="inline-flex items-center gap-1 text-sm font-medium text-albastru-text">
                <IconBack className="size-4" /> Schimbă ora
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-nume">Numele tău</Label>
                <Input id="p-nume" name="nume" required autoComplete="name" className="h-12 rounded-xl bg-crem" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-telefon">Telefon, opțional (pentru WhatsApp)</Label>
                <Input id="p-telefon" name="telefon" type="tel" autoComplete="tel" inputMode="tel" placeholder="07xx xxx xxx" className="h-12 rounded-xl bg-crem" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="p-email">Email, pentru confirmare și linkul de Zoom</Label>
                <Input id="p-email" name="email" type="email" required autoComplete="email" inputMode="email" className="h-12 rounded-xl bg-crem" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-nivel">Nivelul tău acum</Label>
                <select id="p-nivel" name="nivel" defaultValue="" className="h-12 w-full rounded-xl bg-crem px-3 text-[0.95rem]">
                  <option value="">Alege</option>
                  {NIVELURI.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-scop">Pentru ce ai nevoie de franceză</Label>
                <select id="p-scop" name="scop" defaultValue={scopInitial} className="h-12 w-full rounded-xl bg-crem px-3 text-[0.95rem]">
                  <option value="">Alege</option>
                  {SCOPURI.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="p-mesaj">Ceva ce ar trebui să știe Dorina? (opțional)</Label>
                <Textarea id="p-mesaj" name="mesaj" rows={3} defaultValue={mesajInitial} className="rounded-xl bg-crem" placeholder="Termen, situație, ce ai încercat până acum…" />
              </div>
            </div>

            {/* Capcana. Nu `display:none`: robotii care citesc CSS sar peste asa
                ceva. Scos din ecran, fara tab si fara voce, deci niciun om nu-l
                atinge. */}
            <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
              <label htmlFor="p-website">Site web</label>
              <input type="text" id="p-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <label className="mt-5 flex items-start gap-3 text-sm text-gri">
              <Checkbox checked={gdpr} onCheckedChange={(v) => setGdpr(v === true)} className="mt-0.5" />
              <span>
                Am citit <a href="/termeni/" className="text-albastru-text underline">termenii și condițiile</a> și{' '}
                <a href="/confidentialitate/" className="text-albastru-text underline">politica de confidențialitate</a>. Vreau ca lecția să aibă loc la data aleasă, chiar dacă e înainte de expirarea celor 14 zile de retragere, și înțeleg că pentru lecțiile efectuate nu mai pot cere banii înapoi.
              </span>
            </label>

            {eroare && (
              <div role="alert" className="mt-5 rounded-xl bg-[#fdeaee] px-4 py-3 text-sm text-rosu">
                <p>{eroare}</p>
                {sugestie && (
                  <button type="button" onClick={acceptaSugestia} className="mt-1.5 font-medium underline underline-offset-2">
                    Da, pune {sugestie}
                  </button>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gri">
                {TIPURI[tip].nume}, {dataRo(slot)}, ora {oraRo(slot)}
              </p>
              <Button type="submit" disabled={trimite || !gdpr} className="h-12 rounded-full px-7 text-base">
                {trimite ? 'Se salvează…' : 'Confirmă programarea'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
