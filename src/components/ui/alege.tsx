/**
 * Meniul de ales, in stilul site-ului.
 *
 * Inainte erau `<select>`-uri obisnuite. Ele arata bine cat stau inchise,
 * fiindca se lasa imbracate cu CSS, dar lista care se deschide o deseneaza
 * sistemul de operare, nu pagina: pe Mac si pe iPhone iese panoul cenusiu al
 * Apple, cu fontul lor si colturile lor. Artiom a deschis unul in cabinet pe
 * telefon: „am vrut sa fie designul ca pe website, frumos, nu asa standard de
 * la Apple". Lista nativa nu se poate stiliza, in niciun browser, deci singura
 * cale e sa fie inlocuita cu una desenata de noi.
 *
 * Se foloseste Select din radix-ui, acelasi pachet din care vine si dialogul:
 * el tine tastatura, cititoarele de ecran si inchiderea la Escape, iar noi
 * punem doar hainele. Un `<select>` imbracat cu `<div>`-uri de mana ar pierde
 * exact partile astea.
 */
import { cn } from '@/lib/utils'
import { Select as SelectPrimitive } from 'radix-ui'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'

export type Optiune = { valoare: string; text: string }

/*
 * Radix refuza o optiune cu valoarea sir gol: ar fi acelasi lucru cu „nimic
 * ales" si n-ar mai sti sa le deosebeasca. In cabinet insa „Nestabilit" e o
 * alegere adevarata, salvata ca sir gol in baza de date. Deci golul circula
 * inauntru sub alt nume si se traduce inapoi la intrare si la iesire.
 */
const GOL = '__gol__'

export function Alege({
  valoare,
  schimba,
  optiuni,
  clasa,
}: {
  valoare: string
  schimba: (v: string) => void
  optiuni: readonly Optiune[]
  clasa?: string
}) {
  return (
    <SelectPrimitive.Root value={valoare === '' ? GOL : valoare} onValueChange={(v) => schimba(v === GOL ? '' : v)}>
      <SelectPrimitive.Trigger
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-crem px-3 text-left text-[0.95rem] outline-none',
          'focus:ring-2 focus:ring-albastru data-[state=open]:ring-2 data-[state=open]:ring-albastru',
          clasa,
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="size-4 shrink-0 text-gri transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        {/*
          `position="popper"` deschide lista sub buton, ca un meniu de site, nu
          peste el cum face varianta implicita. Latimea vine din buton, prin
          variabila pe care o pune Radix, deci meniul nu iese nici mai ingust
          nici mai lat decat campul.
        */}
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl bg-alb p-1.5 shadow-[0_12px_40px_rgba(8,3,49,0.16)] animate-in fade-in slide-in-from-top-1"
        >
          <SelectPrimitive.Viewport className="max-h-[16.5rem] overflow-y-auto">
            {optiuni.map((o) => {
              const v = o.valoare === '' ? GOL : o.valoare
              return (
                <SelectPrimitive.Item
                  key={v}
                  value={v}
                  className="flex cursor-pointer select-none items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[0.95rem] text-cerneala outline-none data-[highlighted]:bg-crem data-[state=checked]:font-medium"
                >
                  <SelectPrimitive.ItemText>{o.text}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator asChild>
                    <CheckIcon className="size-4 shrink-0 text-albastru" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              )
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

/** Scurtatura pentru listele de siruri simple, cu un rand de „nimic ales" in fata. */
export function optiuniDin(lista: readonly string[], gol?: string): Optiune[] {
  const l = lista.map((t) => ({ valoare: t, text: t }))
  return gol ? [{ valoare: '', text: gol }, ...l] : l
}
