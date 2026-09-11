import { useState } from 'react'
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
  const [gdpr, setGdpr] = useState(false)

  async function trimite(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setStare('trimite')
    setMesajEroare('')
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nume: f.get('nume'),
          email: f.get('email'),
          telefon: f.get('telefon'),
          mesaj: f.get('mesaj'),
          botcheck: f.get('botcheck'),
          gdpr,
          sursa: sursaVizitei(),
        }),
      })
      const d = (await r.json()) as { ok: boolean; eroare?: string }
      if (!r.ok || !d.ok) throw new Error(d.eroare || 'Mesajul nu a putut fi trimis')
      setStare('trimis')
    } catch (er) {
      setStare('eroare')
      setMesajEroare(er instanceof Error ? er.message : 'Mesajul nu a putut fi trimis')
    }
  }

  if (stare === 'trimis') {
    return (
      <div className="mt-8 rounded-[1.5rem] bg-verde-5 p-6">
        <p className="font-medium text-verde">Mesajul a ajuns la Dorina.</p>
        <p className="mt-1 text-gri">Îți răspunde în aceeași zi, pe email sau pe telefon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={trimite} className="mt-8 space-y-5">
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
      <input type="text" name="botcheck" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="flex items-start gap-3 text-sm text-gri">
        <Checkbox checked={gdpr} onCheckedChange={(v) => setGdpr(v === true)} className="mt-0.5" />
        <span>Sunt de acord ca datele mele să fie folosite ca să mi se răspundă, conform <a href="/confidentialitate/" className="text-albastru underline">politicii de confidențialitate</a>.</span>
      </label>
      {stare === 'eroare' && <p role="alert" className="rounded-xl bg-[#fdeaee] px-4 py-3 text-sm text-rosu">{mesajEroare}</p>}
      <Button type="submit" disabled={stare === 'trimite' || !gdpr} className="h-12 rounded-full px-7 text-base">
        {stare === 'trimite' ? 'Se trimite…' : 'Trimite mesajul'}
      </Button>
    </form>
  )
}
