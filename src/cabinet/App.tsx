/**
 * Cabinetul Dorinei: o aplicatie mica in browser, cu rute in hash
 * (#/, #/programari, #/calendar, #/cursanti, #/disponibilitate, #/setari).
 */
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { iesi, legat, sesiune, type Sesiune } from './auth'
import Autentificare from './pagini/Autentificare'
import Tablou from './pagini/Tablou'
import Programari from './pagini/Programari'
import Calendar from './pagini/Calendar'
import Clienti from './pagini/Clienti'
import Disponibilitate from './pagini/Disponibilitate'
import Setari from './pagini/Setari'
import Blog from './pagini/Blog'
import IconTablou from '~icons/solar/widget-4-bold'
import IconProgramari from '~icons/solar/calendar-mark-bold'
import IconCalendar from '~icons/solar/calendar-bold'
import IconCursanti from '~icons/solar/users-group-rounded-bold'
import IconOrar from '~icons/solar/clock-circle-bold'
import IconSetari from '~icons/solar/settings-bold'
import IconBlog from '~icons/solar/document-text-bold'
import IconIesire from '~icons/solar/logout-2-bold'

const RUTE = [
  { cale: '/', nume: 'Tablou', Icon: IconTablou, Pagina: Tablou },
  { cale: '/programari', nume: 'Programări', Icon: IconProgramari, Pagina: Programari },
  { cale: '/calendar', nume: 'Calendar', Icon: IconCalendar, Pagina: Calendar },
  { cale: '/cursanti', nume: 'Cursanți', Icon: IconCursanti, Pagina: Clienti },
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

  useEffect(() => {
    void verifica()
    const laIesire = () => {
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

  if (stare === 'incarca') {
    return (
      <div className="flex min-h-screen items-center justify-center text-gri">
        <span className="flex flex-col items-center gap-4">
          <img src="/images/semne/marca.webp" alt="" aria-hidden="true" className="h-12 w-auto animate-pulse" />
          <span>Se deschide cabinetul…</span>
        </span>
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

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3" aria-label="Cabinet">
          {RUTE.map(({ cale: c, nume, Icon }) => (
            <a
              key={c}
              href={`#${c}`}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-medium transition lg:rounded-2xl lg:px-4 lg:py-3',
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

      <div className="min-w-0 px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
        <Pagina />
      </div>
    </div>
  )
}
