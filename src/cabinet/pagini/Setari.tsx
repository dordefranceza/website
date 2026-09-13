import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import type { Setari as TipSetari } from '@/lib/tipuri'
import { apel, descarcaExport } from '../api'
import { confirmaDoiPasi, incepeDoiPasi, legat, opresteDoiPasi, puneParola, stareDoiPasi, type StareDoiPasi } from '../auth'
import { Camp, Card, Eroare, Titlu, Toast, clasaInput } from '../comune'
import { Alege } from '@/components/ui/alege'

export default function Setari() {
  const [s, setS] = useState<TipSetari | null>(null)
  const [admin, setAdmin] = useState('')
  const [mod, setMod] = useState('')
  const [eroare, setEroare] = useState('')
  const [toast, setToast] = useState('')
  const [asteapta, setAsteapta] = useState(false)
  const [doiPasi, setDoiPasi] = useState<StareDoiPasi | null>(null)
  const [inrolare, setInrolare] = useState<{ factorId: string; qr: string; cheie: string } | null>(null)
  const [cod, setCod] = useState('')
  const [lucreaza, setLucreaza] = useState(false)
  const [parolaNoua, setParolaNoua] = useState('')
  const [parolaDinNou, setParolaDinNou] = useState('')

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

  useEffect(() => {
    if (!legat) return
    stareDoiPasi()
      .then(setDoiPasi)
      .catch(() => setDoiPasi({ pornit: false, factorId: null }))
  }, [])

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

  async function salveazaParola() {
    if (parolaNoua.length < 8) return anunta('Parola trebuie să aibă cel puțin 8 caractere')
    if (parolaNoua !== parolaDinNou) return anunta('Cele două parole nu sunt la fel')
    setLucreaza(true)
    try {
      await puneParola(parolaNoua)
      setParolaNoua('')
      setParolaDinNou('')
      anunta('Parola a fost schimbată')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Parola nu s-a schimbat')
    } finally {
      setLucreaza(false)
    }
  }

  async function legAplicatia() {
    setLucreaza(true)
    try {
      setInrolare(await incepeDoiPasi())
      setCod('')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a putut incepe legarea')
    } finally {
      setLucreaza(false)
    }
  }

  async function confirmAplicatia() {
    if (!inrolare) return
    setLucreaza(true)
    try {
      await confirmaDoiPasi(inrolare.factorId, cod)
      setInrolare(null)
      setCod('')
      setDoiPasi(await stareDoiPasi())
      anunta('Verificarea în doi pași e pornită')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Codul nu e corect')
    } finally {
      setLucreaza(false)
    }
  }

  async function scoateAplicatia() {
    if (!doiPasi?.factorId) return
    if (!window.confirm('Scoți aplicația de verificare? După asta se intră doar cu parola.')) return
    setLucreaza(true)
    try {
      await opresteDoiPasi(doiPasi.factorId)
      setDoiPasi(await stareDoiPasi())
      anunta('Aplicația a fost scoasă')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a putut scoate')
    } finally {
      setLucreaza(false)
    }
  }

  if (eroare) return <Eroare mesaj={eroare} reincearca={incarca} />
  if (!s) return <p className="text-gri">Se încarcă…</p>

  return (
    <>
      <Titlu sub="Sala de lecții, notificările și regulile calendarului.">Setări</Titlu>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="font-sans text-lg font-medium">Lecțiile</h2>
          <div className="mt-5 space-y-5">
            {/* Nu e „linkul de Zoom", e linkul salii tale, oricare ar fi ea.
                Artiom intreba pe buna dreptate „unde primeste clientul linkul,
                Zoom sau Meet?": raspunsul e ca aici pui unul singur, permanent,
                si pleaca singur la toata lumea. */}
            <Camp
              eticheta="Linkul sălii tale, Zoom sau Google Meet"
              ajutor="Unul singur, permanent. Intră automat în emailul fiecărui cursant, în fișierul de calendar și în butonul de intrat. La Zoom e „Personal Meeting Room”, la Meet e linkul din meet.google.com/new pe care îl păstrezi."
            >
              <input type="url" value={s.link_zoom} onChange={(e) => setS({ ...s, link_zoom: e.target.value })} placeholder="https://meet.google.com/abc-defg-hij" className={clasaInput} />
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
              <Alege
                valoare={String(s.pas_minute)}
                schimba={(v) => setS({ ...s, pas_minute: Number(v) })}
                optiuni={[30, 45, 60, 75, 90].map((m) => ({ valoare: String(m), text: `${m} de minute` }))}
              />
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

          <div className="mt-7">
            <h3 className="font-sans text-[0.95rem] font-medium">Parola</h3>
            {!legat ? (
              <p className="mt-2 text-sm text-gri">Merge doar cu baza de date legată.</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-gri">Dacă ai intrat prima dată din linkul primit pe email, pune-ți aici o parolă a ta. Cel puțin 8 caractere.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={parolaNoua}
                    onChange={(e) => setParolaNoua(e.target.value)}
                    placeholder="Parola nouă"
                    aria-label="Parola nouă"
                    className={`${clasaInput} max-w-[13rem]`}
                  />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={parolaDinNou}
                    onChange={(e) => setParolaDinNou(e.target.value)}
                    placeholder="Încă o dată"
                    aria-label="Scrie parola încă o dată"
                    className={`${clasaInput} max-w-[13rem]`}
                  />
                  <button type="button" onClick={salveazaParola} disabled={lucreaza || !parolaNoua} className="pastila pastila-albastra !py-2.5 text-sm disabled:opacity-60">Salvează parola</button>
                </div>
              </>
            )}
          </div>

          <div className="mt-7">
            <h3 className="font-sans text-[0.95rem] font-medium">Verificarea în doi pași</h3>
            {!legat ? (
              <p className="mt-2 text-sm text-gri">Merge doar cu baza de date legată.</p>
            ) : doiPasi === null ? (
              <p className="mt-2 text-sm text-gri">Se încarcă…</p>
            ) : doiPasi.pornit ? (
              <>
                <p className="mt-2 text-sm text-gri">Pornită. La fiecare intrare în cabinet ți se cere codul de șase cifre din aplicație.</p>
                <button type="button" onClick={scoateAplicatia} disabled={lucreaza} className="pastila pastila-navy mt-4 !py-2.5 text-sm disabled:opacity-60">Scoate aplicația</button>
              </>
            ) : inrolare ? (
              <>
                <p className="mt-2 text-sm text-gri">Deschide Google Authenticator, apasă pe plus, alege scanarea unui cod QR și îndreaptă telefonul spre imaginea de mai jos.</p>
                <img src={inrolare.qr} alt="Codul QR pentru aplicația de verificare" width={176} height={176} className="mt-4 rounded-xl bg-alb p-2" />
                <p className="mt-3 text-sm text-gri">Dacă nu poți scana, scrie în aplicație cheia asta:</p>
                <p className="mt-1 select-all break-all font-mono text-[0.8rem] text-cerneala">{inrolare.cheie}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <input
                    value={cod}
                    onChange={(e) => setCod(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    aria-label="Codul de șase cifre din aplicație"
                    className={`${clasaInput} max-w-[9rem]`}
                  />
                  <button type="button" onClick={confirmAplicatia} disabled={lucreaza || cod.replace(/\s/g, '').length < 6} className="pastila pastila-albastra !py-2.5 text-sm disabled:opacity-60">Confirmă</button>
                  <button type="button" onClick={() => setInrolare(null)} className="text-sm text-gri underline-offset-4 hover:underline">Renunț</button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-gri">Oprită. Cu ea pornită, cine îți află parola tot nu intră fără telefonul tău.</p>
                <button type="button" onClick={legAplicatia} disabled={lucreaza} className="pastila pastila-albastra mt-4 !py-2.5 text-sm disabled:opacity-60">Leagă Google Authenticator</button>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={salveaza} disabled={asteapta} className="pastila pastila-albastra disabled:opacity-60">{asteapta ? 'Un moment…' : 'Salvează setările'}</button>
      </div>
      <Toast text={toast} />
    </>
  )
}
