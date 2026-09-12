import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { StareProgramare, TipProgramare } from '@/lib/tipuri'
import { TIPURI } from '@/lib/tipuri'

export const bani = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)} €`

export const STARE_TEXT: Record<StareProgramare, string> = { propusa: 'Așteaptă răspuns', noua: 'Nouă', confirmata: 'Confirmată', anulata: 'Anulată', finalizata: 'Făcută' }

const STARE_CLASA: Record<StareProgramare, string> = {
  propusa: 'bg-roz-5 text-[#9c2f7a]',
  noua: 'bg-portocaliu-5 text-[#b8431a]',
  confirmata: 'bg-verde-5 text-verde',
  anulata: 'bg-gri-deschis text-gri',
  finalizata: 'bg-albastru-5 text-navy',
}

export function EtichetaStare({ stare }: { stare: StareProgramare }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', STARE_CLASA[stare])}>{STARE_TEXT[stare]}</span>
}

const TIP_CLASA: Record<TipProgramare, string> = { cunoastere: 'bg-roz-5 text-[#a8358a]', individual: 'bg-albastru-5 text-navy', grup: 'bg-verde-5 text-verde' }

export function EtichetaTip({ tip }: { tip: TipProgramare }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', TIP_CLASA[tip])}>{TIPURI[tip]?.nume ?? tip}</span>
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-[1.5rem] bg-alb p-5 sm:p-6', className)}>{children}</section>
}

export function Titlu({ children, sub, actiuni }: { children: ReactNode; sub?: ReactNode; actiuni?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl">{children}</h1>
        {sub && <p className="mt-1 text-gri">{sub}</p>}
      </div>
      {actiuni && <div className="flex flex-wrap gap-2">{actiuni}</div>}
    </div>
  )
}

export function Gol({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-crem px-5 py-8 text-center text-gri">{children}</p>
}

export function Eroare({ mesaj, reincearca }: { mesaj: string; reincearca?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#fdeaee] px-5 py-4 text-sm text-rosu">
      <span>{mesaj}</span>
      {reincearca && (
        <button type="button" onClick={reincearca} className="rounded-full bg-alb px-3 py-1.5 font-medium">
          Reîncearcă
        </button>
      )}
    </div>
  )
}

export function Camp({ eticheta, children, ajutor }: { eticheta: string; children: ReactNode; ajutor?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{eticheta}</span>
      {children}
      {ajutor && <span className="mt-1 block text-xs text-gri">{ajutor}</span>}
    </label>
  )
}

export const clasaInput = 'h-11 w-full rounded-xl bg-crem px-3 text-[0.95rem] outline-none focus:ring-2 focus:ring-albastru'
export const clasaSelect = clasaInput
export const clasaTextarea = 'w-full rounded-xl bg-crem px-3 py-2.5 text-[0.95rem] outline-none focus:ring-2 focus:ring-albastru'

/** Un mesaj scurt care apare jos si dispare singur. */
export function Toast({ text }: { text: string }) {
  if (!text) return null
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-cerneala px-5 py-3 text-sm font-medium text-alb shadow-lg animate-in fade-in slide-in-from-bottom-2">
      {text}
    </div>
  )
}
