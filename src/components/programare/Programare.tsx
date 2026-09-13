/**
 * Formularul public de programare, in trei pasi: tipul, ziua si ora, datele.
 * Sloturile vin de la /api/sloturi (calculate pe server), programarea pleaca
 * la /api/programare. Orele se afiseaza in fusul Romaniei, oricare ar fi
 * fusul browserului.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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

/*
 * Nivelurile, despartite in doua randuri, fiindca sunt doua feluri de raspuns.
 *
 * Puse toate intr-o insiruire care se rupe unde apuca, ieseau haotic: „Încep de
 * la zero" lung langa „A1" de doua litere, apoi randul urmator inceput aiurea.
 * Artiom: „una mai lunga, una mai scurta, unde cate una, unde [cate doua], nu-i
 * tare bine". Asa, codurile stau intr-un rand de casute egale, ca o scara, iar
 * cele doua raspunsuri de om, „de la zero" si „nu stiu", stau deasupra, tot
 * egale intre ele. Randul spune si ceva: ori iti stii nivelul, ori nu.
 *
 * Se calculeaza din lista, nu se scriu de mana: daca se adauga C2 in NIVELURI,
 * intra singur la coduri.
 */
const NIVEL_COD = /^[ABC][12]$/
const NIVELE_COD = NIVELURI.filter((n) => NIVEL_COD.test(n))
const NIVELE_SPUSE = NIVELURI.filter((n) => !NIVEL_COD.test(n))

/** Aceleasi casute peste tot: doar fundalul se schimba cand e aleasa. */
function casuta(ales: boolean): string {
  return cn(
    'flex min-h-12 items-center justify-center rounded-full px-3 py-2.5 text-center text-[0.95rem] leading-snug transition',
    ales ? 'bg-albastru text-alb' : 'bg-crem hover:bg-crem-inchis',
  )
}

function parametru(nume: string): string {
  try {
    return new URLSearchParams(location.search).get(nume) ?? ''
  } catch {
    return ''
  }
}

export default function Programare({ whatsapp }: Props) {
  const [pas, setPas] = useState<1 | 2 | 3 | 4>(1)
  /** Panoul alb cu pasii; la el urca pagina cand se schimba pasul. */
  const panou = useRef<HTMLDivElement>(null)
  /**
   * Se ridica doar cand pasul s-a schimbat fiindca a apasat omul.
   *
   * Fara semnalul asta ar urca si la deschiderea paginii: cine vine de pe
   * /preturi/ cu `?tip=` in adresa sare singur la pasul 2, inca dinainte sa
   * apuce sa citeasca antetul, si i-ar fugi pagina sub ochi.
   */
  const dinApasare = useRef(false)

  /** Trece la alt pas si cere ridicarea paginii la panou. */
  function mergiLaPas(n: 1 | 2 | 3 | 4) {
    dinApasare.current = true
    setPas(n)
  }
  const [tip, setTip] = useState<TipProgramare>('cunoastere')
  /*
   * Nivelul si scopul se aleg de pe pastile, nu din listele sistemului.
   * Artiom, aratand doua poze de pe telefon: lista derulanta se deschide ca o
   * foaie cenusie a telefonului, peste site, si nu seamana cu nimic din ce am
   * facut. Pe pastile se vad toate optiunile deodata si se apasa o data.
   *
   * Valorile pleaca mai departe prin cate un `input hidden`, deci restul
   * formularului, care se trimite cu FormData, ramane neatins.
   */
  const [nivel, setNivel] = useState('')
  const [scop, setScop] = useState('')
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
    setScop(parametru('scop'))
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
          mergiLaPas(2)
        }
        if (d.sugestie) setSugestie(d.sugestie)
        throw new Error(d.eroare || 'Programarea nu a putut fi salvată')
      }
      setRezultat({ incepe: d.incepe ?? slot })
      setPas(4)
    } catch (er) {
      setEroare(er instanceof Error ? er.message : 'Programarea nu a putut fi salvată')
    } finally {
      setTrimite(false)
    }
  }

  /*
   * La fiecare schimbare de pas, pagina urca la panou.
   *
   * Pasul 2 e lung: calendarul, apoi orele libere. Cand omul apasa ora si apoi
   * „Continuă", el e tocmai jos, iar panoul se schimba deasupra lui, in afara
   * ecranului. Ramanea uitandu-se la cardul bleumarin si la subsol, fara sa
   * inteleaga ca formularul a trecut mai departe. Artiom: „raman acolo jos,
   * trebuie sa ma ridice sus, acolo la datele tale, ca sa fie comod clientul".
   *
   * Se ridica pana la marginea de sus a panoului, nu pana la capatul paginii:
   * asa se vad si pasii bifati, deci omul vede din ce a venit si unde a ajuns.
   *
   * Locul lasat pentru bara fixa de sus vine din `scroll-padding-top: 6rem`,
   * pus o data pe `html` in global.css. Prima incercare mai punea si un
   * `scroll-mt-24` pe panou, si cele doua s-au adunat: panoul se oprea la 205
   * pixeli de marginea de sus in loc de 96. Nu se pune al doilea numar.
   *
   * `behavior: 'auto'` e scris dinadins: `html` are `scroll-behavior: smooth`,
   * iar o derulare lina spre un panou care tocmai si-a schimbat inaltimea poate
   * fi taiata la jumatate. Optiunea data in cod bate regula din CSS.
   */
  useLayoutEffect(() => {
    if (!dinApasare.current) return
    dinApasare.current = false
    /* pasul 4 nu mai are panou: el urca pana sus de tot, in efectul de dedesubt */
    if (pas === 4) return
    panou.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }, [pas])

  /*
   * Dupa confirmare, pagina urca inapoi la antet, iar antetul trebuie sa fie
   * deja cel nou.
   *
   * Prima varianta chema `scrollTo` chiar in `trimiteFormular`, inainte ca
   * React sa fi inlocuit formularul cu cardul. Browserul pornea o derulare
   * lina spre 0, pagina se scurta brusc sub ea (formularul e de cateva ori mai
   * inalt decat cardul), derularea era taiata de scurtarea aia si omul ramanea
   * pe la mijloc, cu titlul intrat sub antetul fix. Artiom a vazut exact asta.
   *
   * Deci `useLayoutEffect`, care ruleaza dupa ce DOM-ul nou e pus si inainte de
   * a se desena, si salt instant, nu lin: lin n-are ce castiga aici, omul nu se
   * uita la drum, iar instantul nu poate fi intrerupt de o schimbare de
   * inaltime. Tot aici se schimba si antetul, cele doua variante scrise in
   * programare.astro.
   */
  useLayoutEffect(() => {
    if (pas !== 4 || !rezultat) return
    for (const el of document.querySelectorAll<HTMLElement>('[data-antet]')) {
      el.hidden = el.dataset.antet !== 'gata'
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pas, rezultat])

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

        {/*
          Ziua si ora, scoase din rand si puse intr-o caseta.
          Erau un rand de text gri ca oricare altul, desi singurul lucru pe care
          omul vrea sa-l retina de pe ecranul asta e cand are lectia. Artiom:
          „evidentiaza cel care cu data si ora". Deci fundal crem, ziua cu
          literele de titlu, ora sub ea si tipul lectiei deasupra, marunt.
        */}
        <div className="mt-6 rounded-[1.25rem] bg-crem px-6 py-6 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-wider text-gri">{TIPURI[tip].nume}</p>
          <p className="mt-2 font-display text-2xl leading-tight text-cerneala sm:text-3xl">{dataRo(rezultat.incepe)}</p>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-lg font-medium text-cerneala">
            <IconClock className="size-5 text-albastru" />
            ora {oraRo(rezultat.incepe)}
            <span className="text-base font-normal text-gri">(ora României)</span>
          </p>
        </div>

        {/*
          „verifica si in Spam" cadea singur pe ultimul rand, pe telefon, cu
          „in Spam." atarnand sub restul propozitiei. `whitespace-nowrap` tine
          cele doua cuvinte lipite: ori incap amandoua pe rand, ori coboara
          amandoua.
        */}
        <p className="mt-5 text-gri">
          Confirmarea a plecat pe email, cu toate detaliile. Dacă nu o vezi în câteva minute, uită-te și{' '}
          <span className="whitespace-nowrap">în Spam</span>.
        </p>
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
    /*
     * Pe telefon formularul e primul, rezumatul dupa el.
     *
     * Inainte mergeau in ordinea din cod, deci pe o coloana iesea: antet cat
     * ecranul, apoi cardul bleumarin „Alegerea ta", si abia sub el intrebarea
     * „Cu ce incepem?". Rezumatul ala e gol pana nu alegi ceva, scrie „ziua, la
     * pasul 2", si totusi statea intre om si singurul lucru pe care avea de
     * apasat. Artiom a trimis pagina unui prieten: „a ajuns aici si nu intelegea
     * cum sa programez". Nu era greu de inteles, era greu de gasit.
     *
     * Pe ecran lat raman cum erau, rezumatul in stanga, lipit la derulare.
     */
    <div className="mt-10 grid gap-6 sm:mt-12 lg:grid-cols-[300px_1fr]">
      <div className="order-2 lg:order-1 lg:sticky lg:top-28 lg:self-start">{rezumat}</div>

      <div ref={panou} className="order-1 rounded-[2rem] bg-alb p-6 sm:p-9 lg:order-2">
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
                    mergiLaPas(2)
                  }}
                  className={cn(
                    'flex items-start gap-4 rounded-[1.25rem] p-5 text-left transition hover:-translate-y-0.5 sm:gap-5',
                    tip === t ? 'bg-albastru-5' : 'bg-crem hover:bg-crem-inchis',
                  )}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-alb">
                    <Icon className="size-6 text-albastru" />
                  </span>
                  {/*
                    Pe telefon pretul coboara sub titlu; coloana din dreapta
                    ramane doar pentru ecrane late.
                    Masurat pe un telefon de 417 pixeli: cardul are 329, minus
                    marginile raman 289, din care iconita ia 64. Pretul in
                    dreapta mai lua 84, deci titlului si descrierii le ramaneau
                    141. In 141 de pixeli „Lecție în grup mic" se rupea si lasa
                    „mic" singur pe rand, iar descrierea se subtia la sase
                    randuri. Artiom: „daca ramane un cuvant, sa nu-l pui din rand
                    nou, niciodata". Fara coloana aia, textul are 225 si titlul
                    incape intreg. De la 640 in sus e loc pentru amandoua, deci
                    acolo cardul ramane cum era.
                  */}
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium [text-wrap:balance]">{TIPURI[t].nume}</span>
                    <span className="mt-0.5 block font-display text-xl sm:hidden">
                      {TIPURI[t].pret ? `${TIPURI[t].pret} €` : 'Gratuit'}
                    </span>
                    <span className="mt-1 block text-sm text-gri">{text}</span>
                    {t === 'grup' && (
                      <span className="mt-0.5 block text-xs text-gri">
                        pe lecție, {cursGrup.lectii * cursGrup.pretLectie} € cursul
                      </span>
                    )}
                  </span>
                  <span className="hidden shrink-0 whitespace-nowrap text-right font-display text-xl sm:block">
                    {TIPURI[t].pret ? `${TIPURI[t].pret} €` : 'Gratuit'}
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
              <button type="button" onClick={() => mergiLaPas(1)} className="inline-flex items-center gap-1 text-sm font-medium text-albastru-text">
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
              <Button type="button" disabled={!slot} onClick={() => mergiLaPas(3)} className="h-12 rounded-full px-7 text-base">
                Continuă <IconArrow className="size-5" />
              </Button>
            </div>
          </div>
        )}

        {pas === 3 && (
          <form ref={formular} onSubmit={trimiteFormular} className="relative mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-sans text-2xl font-medium">Datele tale</h2>
              <button type="button" onClick={() => mergiLaPas(2)} className="inline-flex items-center gap-1 text-sm font-medium text-albastru-text">
                <IconBack className="size-4" /> Schimbă ora
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-nume">Numele tău</Label>
                <Input id="p-nume" name="nume" required autoComplete="name" className="h-12 rounded-xl bg-crem" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-telefon">Telefon, opțional. Cu prefixul țării, ca să meargă WhatsApp</Label>
                <Input id="p-telefon" name="telefon" type="tel" autoComplete="tel" inputMode="tel" placeholder="+373 ... sau +40 ..." className="h-12 rounded-xl bg-crem" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="p-email">Email, pentru confirmare și linkul lecției</Label>
                <Input id="p-email" name="email" type="email" required autoComplete="email" inputMode="email" className="h-12 rounded-xl bg-crem" />
              </div>
              <fieldset className="space-y-2.5 sm:col-span-2">
                <legend className="mb-2.5 text-sm font-medium">Nivelul tău acum</legend>
                <input type="hidden" name="nivel" value={nivel} />
                <div className="grid grid-cols-2 gap-2">
                  {NIVELE_SPUSE.map((n) => (
                    <button key={n} type="button" onClick={() => setNivel((x) => (x === n ? '' : n))} aria-pressed={nivel === n} className={casuta(nivel === n)}>
                      {n}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {NIVELE_COD.map((n) => (
                    <button key={n} type="button" onClick={() => setNivel((x) => (x === n ? '' : n))} aria-pressed={nivel === n} className={casuta(nivel === n)}>
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="space-y-2.5 sm:col-span-2">
                <legend className="mb-2.5 text-sm font-medium">Pentru ce ai nevoie de franceză</legend>
                <input type="hidden" name="scop" value={scop} />
                {/*
                  Casute egale, nu insiruire.
                  Frazele au lungimi foarte diferite, deci lipite una de alta
                  ieseau unde cate una pe rand, unde cate doua, cu marginea din
                  dreapta zdrentuita. Intr-o grila toate au aceeasi latime, iar
                  cea care se rupe in doua randuri nu mai strica nimic: randul
                  intreg creste odata cu ea, si ramane drept.
                */}
                <div className="grid gap-2 sm:grid-cols-2">
                  {SCOPURI.map((sc) => (
                    <button key={sc} type="button" onClick={() => setScop((x) => (x === sc ? '' : sc))} aria-pressed={scop === sc} className={casuta(scop === sc)}>
                      {sc}
                    </button>
                  ))}
                </div>
              </fieldset>
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
