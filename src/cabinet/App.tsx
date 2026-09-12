import { PersonajCerc } from './PersonajCerc'
/**
 * Cabinetul Dorinei: o aplicatie mica in browser, cu rute in hash
 * (#/, #/programari, #/calendar, #/cursanti, #/grupe, #/disponibilitate, #/setari).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { iesi, legat, sesiune, type Sesiune } from './auth'
import { incalzeste, uitaCitirile } from './api'
import Autentificare from './pagini/Autentificare'
import Tablou from './pagini/Tablou'
import Programari from './pagini/Programari'
import Calendar from './pagini/Calendar'
import Clienti from './pagini/Clienti'
import Grupe from './pagini/Grupe'
import Disponibilitate from './pagini/Disponibilitate'
import Setari from './pagini/Setari'
import Blog from './pagini/Blog'
import IconTablou from '~icons/solar/widget-4-bold'
import IconProgramari from '~icons/solar/calendar-mark-bold'
import IconCalendar from '~icons/solar/calendar-bold'
import IconCursanti from '~icons/solar/users-group-rounded-bold'
import IconGrupe from '~icons/solar/users-group-two-rounded-bold'
import IconOrar from '~icons/solar/clock-circle-bold'
import IconSetari from '~icons/solar/settings-bold'
import IconBlog from '~icons/solar/document-text-bold'
import IconIesire from '~icons/solar/logout-2-bold'

const RUTE = [
  { cale: '/', nume: 'Tablou', Icon: IconTablou, Pagina: Tablou },
  { cale: '/programari', nume: 'Programări', Icon: IconProgramari, Pagina: Programari },
  { cale: '/calendar', nume: 'Calendar', Icon: IconCalendar, Pagina: Calendar },
  { cale: '/cursanti', nume: 'Cursanți', Icon: IconCursanti, Pagina: Clienti },
  { cale: '/grupe', nume: 'Grupe', Icon: IconGrupe, Pagina: Grupe },
  { cale: '/disponibilitate', nume: 'Orar', Icon: IconOrar, Pagina: Disponibilitate },
  { cale: '/blog', nume: 'Blog', Icon: IconBlog, Pagina: Blog },
  { cale: '/setari', nume: 'Setări', Icon: IconSetari, Pagina: Setari },
]

function ruta(): string {
  const h = location.hash.replace(/^#/, '') || '/'
  return h.split('?')[0].replace(/\/+$/, '') || '/'
}

export default function App() {
  const [stare, setStare] = useState<'incarca' | 'afara' | 'cod' | 'inauntru'>('incarca')
  const [sesiuneCurenta, setSesiune] = useState<Sesiune | null>(null)
  const [cale, setCale] = useState<string>('/')

  useEffect(() => {
    setCale(ruta())
    const laSchimbare = () => {
      setCale(ruta())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', laSchimbare)
    return () => window.removeEventListener('hashchange', laSchimbare)
  }, [])

  const verifica = useCallback(async () => {
    const s = await sesiune()
    setSesiune(s)
    setStare(!s ? 'afara' : s.cereCod ? 'cod' : 'inauntru')
  }, [])

  /* Odata intrat, cerem in fundal datele paginilor pe care nu esti inca. Cand
     ajungi la ele, sunt deja aduse si nu mai astepti cu ecranul gol. */
  useEffect(() => {
    if (stare === 'inauntru') incalzeste()
  }, [stare])

  useEffect(() => {
    void verifica()
    const laIesire = () => {
      uitaCitirile()
      setSesiune(null)
      setStare('afara')
    }
    window.addEventListener('ddf-iesire', laIesire)
    return () => window.removeEventListener('ddf-iesire', laIesire)
  }, [verifica])

  async function laIesire() {
    await iesi()
    setSesiune(null)
    setStare('afara')
  }

  const bara = useRef<HTMLDivElement | null>(null)
  const primaAsezare = useRef(true)
  const [bulina, setBulina] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [faraTranzitie, setFaraTranzitie] = useState(true)

  /*
   * Pastila care aluneca pe bara de jos. Ii masuram locul din chiar iconita
   * paginii curente, nu din socoteli: latimile difera cu cateva zecimi, iar
   * `flex-1` le imparte cum vrea el.
   *
   * `useLayoutEffect`, nu `useEffect`: mutarea se scrie inainte sa se vada
   * cadrul, altfel pastila apare o clipa in locul vechi. La prima asezare si la
   * rotirea telefonului se muta pe loc, fara alunecare, ca sa nu porneasca din
   * coltul din stanga la fiecare incarcare.
   */
  useLayoutEffect(() => {
    const asaza = (peLoc: boolean) => {
      const el = bara.current?.querySelector<HTMLElement>('[data-activ="true"] [data-pastila]')
      if (!el) return
      if (peLoc) setFaraTranzitie(true)
      setBulina({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight })
      if (peLoc) requestAnimationFrame(() => requestAnimationFrame(() => setFaraTranzitie(false)))
    }
    asaza(primaAsezare.current)
    primaAsezare.current = false

    const laRedimensionare = () => asaza(true)
    window.addEventListener('resize', laRedimensionare)
    return () => window.removeEventListener('resize', laRedimensionare)
  }, [cale])

  if (stare === 'incarca') {
    return (
      /* Aici pulsa marca, adica semnul mic al brandului. Artiom: „apare o ușă,
         o virgulă, nu îmi place". Avea dreptate, la 48 de pixeli semnul nu se
         citeste, arata a eroare de incarcare. Acum e personajul care saluta,
         acelasi de pe site, intr-un cerc. Pulseaza cercul intreg, lin. */
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-crem text-gri">
        <PersonajCerc nume="saluta" inel="albastru-10" disc="alb" marime={120} marimeMare={140} className="motion-safe:animate-pulse" />
        <span>Se deschide cabinetul…</span>
      </div>
    )
  }

  if (stare === 'afara' || stare === 'cod') {
    return <Autentificare cereCod={stare === 'cod'} email={sesiuneCurenta?.email ?? ''} laIntrare={verifica} />
  }


  const activa = RUTE.find((r) => r.cale === cale) ?? RUTE[0]
  const Pagina = activa.Pagina

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      {/*
        Pe telefon, meniul statea sus, ca o fasie de sapte pastile care se trage
        cu degetul. Artiom: „nu e comod deloc, e greu de tot de schimbat". Avea
        dreptate: pastilele erau mici, jumatate din ele ieseau din ecran, si
        trebuia sa tragi cu o mana ca sa ajungi la ele.

        Acum sus ramane doar sigla si iesirea, iar meniul trece JOS, intr-o bara
        fixa, unde ajunge degetul mare fara sa muti mana. Toate sapte incap:
        390 impartit la 7 face 55 de pixeli de fiecare, cat o iconita si o
        eticheta mica. Nimic nu se ascunde dupa „mai mult".

        De la 1024px in sus nu se schimba nimic, ramane coloana din stanga.
      */}
      <aside className="bg-cerneala text-alb lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-7">
          <a href="/" className="inline-flex items-center">
            <img src="/images/semne/nume.webp" alt="Dór de Franceza" className="h-[22px] w-auto [filter:brightness(0)_invert(1)]" />
          </a>
          <p className="hidden text-xs text-alb/50 lg:mt-2 lg:block">Cabinetul Dorinei</p>
          <button type="button" onClick={laIesire} className="inline-flex items-center gap-1.5 rounded-full bg-alb/10 px-3 py-1.5 text-xs font-medium lg:hidden">
            <IconIesire className="size-4" /> Ieși
          </button>
        </div>

        {/* Meniul de pe ecran mare. Pe telefon e cel de jos. */}
        <nav className="hidden gap-1 px-3 pb-3 lg:flex lg:flex-col" aria-label="Cabinet">
          {RUTE.map(({ cale: c, nume, Icon }) => (
            <a
              key={c}
              href={`#${c}`}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium transition',
                c === activa.cale ? 'bg-alb text-cerneala' : 'text-alb/75 hover:bg-alb/10 hover:text-alb',
              )}
            >
              <Icon className="size-5" />
              {nume}
            </a>
          ))}
        </nav>

        <div className="mt-auto hidden px-6 pb-7 lg:block">
          {!legat && <p className="mb-3 rounded-2xl bg-portocaliu/20 px-3 py-2 text-xs text-portocaliu">Mod local: datele stau doar pe acest calculator.</p>}
          <p className="truncate text-xs text-alb/50">{sesiuneCurenta?.email}</p>
          <button type="button" onClick={laIesire} className="mt-2 inline-flex items-center gap-1.5 text-sm text-alb/75 hover:text-alb">
            <IconIesire className="size-4" /> Ieși din cont
          </button>
        </div>
      </aside>

      {/* Bara de jos, doar pe telefon si pe tableta. `pb-[env(safe-area-inset-bottom)]`
          o tine deasupra barei de gesturi de pe iPhone.

          Pastila albastra e UN singur element care aluneca de la o pagina la
          alta, nu un fundal care se stinge pe una si se aprinde pe alta.
          Artiom a cerut acelasi lucru si la comutatorul de preturi, cu aceleasi
          cuvinte: „nu asa brusc". Fundalul care clipeste nu se citeste ca
          miscare; unul care se muta, da. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 bg-cerneala pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Cabinet"
      >
        <div ref={bara} className="relative flex">
          {bulina && (
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute rounded-full bg-albastru',
                faraTranzitie ? '' : 'motion-safe:transition-[transform,width] motion-safe:duration-[380ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
              )}
              style={{
                width: bulina.w,
                height: bulina.h,
                transform: `translate(${bulina.x}px, ${bulina.y}px)`,
                left: 0,
                top: 0,
              }}
            />
          )}
          {RUTE.map(({ cale: c, nume, Icon }) => (
            <a
              key={c}
              href={`#${c}`}
              data-activ={c === activa.cale ? 'true' : undefined}
              aria-current={c === activa.cale ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 px-0.5 pb-2 pt-2.5 text-[10px] font-medium leading-tight',
                'motion-safe:transition-colors motion-safe:duration-300',
                c === activa.cale ? 'text-alb' : 'text-alb/55',
              )}
            >
              <span
                data-pastila
                className={cn(
                  'relative z-10 flex h-7 w-11 items-center justify-center rounded-full',
                  'motion-safe:transition-colors motion-safe:duration-300',
                  c === activa.cale ? 'text-alb' : 'text-alb/70',
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              <span className="w-full truncate text-center">{nume}</span>
            </a>
          ))}
        </div>
      </nav>

      <div className="min-w-0 px-4 pb-28 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-10">
        <Pagina />
      </div>
    </div>
  )
}
