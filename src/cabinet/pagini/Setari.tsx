import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import type { Setari as TipSetari } from '@/lib/tipuri'
import { apel, descarcaExport } from '../api'
import { legat } from '../auth'
import { Camp, Card, Eroare, Titlu, Toast, clasaInput, clasaSelect } from '../comune'

export default function Setari() {
  const [s, setS] = useState<TipSetari | null>(null)
  const [admin, setAdmin] = useState('')
  const [mod, setMod] = useState('')
  const [eroare, setEroare] = useState('')
  const [toast, setToast] = useState('')
  const [asteapta, setAsteapta] = useState(false)

  const incarca = () => {
    setEroare('')
    apel<{ setari: TipSetari; admin: string; mod: string }>('setari')
      .then((r) => {
        setS(r.setari)
        setAdmin(r.admin)
        setMod(r.mod)
      })
      .catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [])

  const anunta = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(''), 2500)
  }

  async function salveaza() {
    if (!s) return
    setAsteapta(true)
    try {
      const r = await apel<{ setari: TipSetari }>('setari', { metoda: 'PATCH', corp: s })
      setS(r.setari)
      anunta('Setările au fost salvate')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a salvat')
    } finally {
      setAsteapta(false)
    }
  }

  if (eroare) return <Eroare mesaj={eroare} reincearca={incarca} />
  if (!s) return <p className="text-gri">Se încarcă…</p>

  return (
    <>
      <Titlu sub="Zoom, notificări și regulile calendarului.">Setări</Titlu>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="font-sans text-lg font-medium">Lecțiile</h2>
          <div className="mt-5 space-y-5">
            <Camp eticheta="Linkul tău de Zoom" ajutor="Personal Meeting Room din Zoom. Intră automat în emailul de confirmare al fiecărui cursant.">
              <input type="url" value={s.link_zoom} onChange={(e) => setS({ ...s, link_zoom: e.target.value })} placeholder="https://zoom.us/j/1234567890?pwd=…" className={clasaInput} />
            </Camp>
            <Camp eticheta="Emailul pe care primești notificările">
              <input type="email" value={s.email_notificari} onChange={(e) => setS({ ...s, email_notificari: e.target.value })} placeholder="dorina@exemplu.ro" className={clasaInput} />
            </Camp>
            <div className="flex items-center justify-between rounded-xl bg-crem px-4 py-3">
              <span>
                <span className="block text-sm font-medium">Discuția gratuită de cunoaștere</span>
                <span className="block text-xs text-gri">Oprită, dispare din formularul de programare.</span>
              </span>
              <Switch checked={s.cunoastere_activa} onCheckedChange={(v) => setS({ ...s, cunoastere_activa: v })} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-sans text-lg font-medium">Calendarul</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Camp eticheta="Preaviz minim (ore)" ajutor="Cu cât timp înainte se poate programa.">
              <input type="number" min={0} max={168} value={s.preaviz_ore} onChange={(e) => setS({ ...s, preaviz_ore: Number(e.target.value) })} className={clasaInput} />
            </Camp>
            <Camp eticheta="Cât de departe (zile)" ajutor="Cât în viitor apar sloturi.">
              <input type="number" min={1} max={120} value={s.orizont_zile} onChange={(e) => setS({ ...s, orizont_zile: Number(e.target.value) })} className={clasaInput} />
            </Camp>
            <Camp eticheta="Pasul dintre lecții" ajutor="Lecție de 50 de minute plus pauza.">
              <select value={s.pas_minute} onChange={(e) => setS({ ...s, pas_minute: Number(e.target.value) })} className={clasaSelect}>
                {[30, 45, 60, 75, 90].map((m) => <option key={m} value={m}>{m} de minute</option>)}
              </select>
            </Camp>
          </div>
        </Card>

        <Card>
          <h2 className="font-sans text-lg font-medium">Export</h2>
          <p className="mt-1 text-sm text-gri">Toate programările, cu cursant, sumă și stare, într-un fișier care se deschide în Excel sau Numbers.</p>
          <button type="button" onClick={() => descarcaExport().catch((e: Error) => anunta(e.message))} className="pastila pastila-navy mt-4 !py-2.5 text-sm">Descarcă în Excel (CSV)</button>
        </Card>

        <Card>
          <h2 className="font-sans text-lg font-medium">Contul</h2>
          <p className="mt-1 text-sm text-gri">{admin}</p>
          <p className="mt-3 text-sm text-gri">
            {mod === 'supabase' ? 'Legat la baza de date.' : 'Mod local: datele stau doar pe acest calculator.'}
            {legat ? '' : ' Când se leagă Supabase, cabinetul trece singur pe baza de date.'}
          </p>
          <p className="mt-3 text-sm text-gri">Verificarea în doi pași cu Google Authenticator vine în etapa următoare.</p>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={salveaza} disabled={asteapta} className="pastila pastila-albastra disabled:opacity-60">{asteapta ? 'Un moment…' : 'Salvează setările'}</button>
      </div>
      <Toast text={toast} />
    </>
  )
}
