import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { sursaVizitei } from '@/lib/sursa'

type Stare = 'gol' | 'trimite' | 'trimis' | 'eroare'

export default function FormularContact() {
  const [stare, setStare] = useState<Stare>('gol')
  const [mesajEroare, setMesajEroare] = useState('')
  const [sugestie, setSugestie] = useState('')
  const [gdpr, setGdpr] = useState(false)
  /**
   * Cand s-a deschis formularul. Trimitem cate milisecunde a stat omul pe el,
   * nu ceasul lui: ceasul poate fi oricat de gresit, diferenta nu.
   */
  const deschisLa = useRef(typeof performance === 'undefined' ? 0 : performance.now())
  const formular = useRef<HTMLFormElement | null>(null)

  async function trimite(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setStare('trimite')
    setMesajEroare('')
    setSugestie('')
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nume: f.get('nume'),
          email: f.get('email'),
          telefon: f.get('telefon'),
          mesaj: f.get('mesaj'),
          botcheck: f.get('website'),
          zabovit: typeof performance === 'undefined' ? 0 : Math.round(performance.now() - deschisLa.current),
          gdpr,
          sursa: sursaVizitei(),
        }),
      })
      const d = (await r.json()) as { ok: boolean; eroare?: string; sugestie?: string }
      if (!r.ok || !d.ok) {
        if (d.sugestie) setSugestie(d.sugestie)
        throw new Error(d.eroare || 'Mesajul nu a putut fi trimis')
      }
      setStare('trimis')
    } catch (er) {
      setStare('eroare')
      setMesajEroare(er instanceof Error ? er.message : 'Mesajul nu a putut fi trimis')
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
    setMesajEroare('')
    setStare('gol')
  }

  if (stare === 'trimis') {
    return (
      <div className="mt-8 rounded-[1.5rem] bg-verde-5 p-6">
        <p className="font-medium text-verde">Mesajul a ajuns la Dorina.</p>
        <p className="mt-1 text-gri">Îți răspunde pe email sau pe telefon, de obicei în aceeași zi.</p>
      </div>
    )
  }

  return (
    <form ref={formular} onSubmit={trimite} className="relative mt-8 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="c-nume">Numele tău</Label>
          <Input id="c-nume" name="nume" required autoComplete="name" className="h-12 rounded-xl bg-crem" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-telefon">Telefon (opțional)</Label>
          <Input id="c-telefon" name="telefon" type="tel" autoComplete="tel" inputMode="tel" className="h-12 rounded-xl bg-crem" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-email">Email</Label>
        <Input id="c-email" name="email" type="email" required autoComplete="email" inputMode="email" className="h-12 rounded-xl bg-crem" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-mesaj">Mesajul</Label>
        <Textarea id="c-mesaj" name="mesaj" required rows={5} className="rounded-xl bg-crem" placeholder="Spune-mi pe scurt pentru ce ai nevoie de franceză și când ai vrea să începi." />
      </div>
      {/* Capcana. Nu `display:none`: robotii care citesc CSS sar peste asa ceva.
          Scos din ecran, fara tab si fara voce, deci niciun om nu-l atinge. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="c-website">Site web</label>
        <input type="text" id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-3 text-sm text-gri">
        <Checkbox checked={gdpr} onCheckedChange={(v) => setGdpr(v === true)} className="mt-0.5" />
        <span>Am citit <a href="/confidentialitate/" className="text-albastru-text underline">politica de confidențialitate</a> și sunt de acord ca datele din formular să fie folosite ca să mi se răspundă.</span>
      </label>
      {stare === 'eroare' && (
        <div role="alert" className="rounded-xl bg-[#fdeaee] px-4 py-3 text-sm text-rosu">
          <p>{mesajEroare}</p>
          {sugestie && (
            <button type="button" onClick={acceptaSugestia} className="mt-1.5 font-medium underline underline-offset-2">
              Da, pune {sugestie}
            </button>
          )}
        </div>
      )}
      <Button type="submit" disabled={stare === 'trimite' || !gdpr} className="h-12 rounded-full px-7 text-base">
        {stare === 'trimite' ? 'Se trimite…' : 'Trimite mesajul'}
      </Button>
    </form>
  )
}
