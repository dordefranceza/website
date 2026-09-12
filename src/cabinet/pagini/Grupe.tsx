/**
 * Grupele: aceiasi oameni, aceeasi ora, in fiecare saptamana.
 *
 * Grupa nu tine ea lectiile. Cand adaugi un cursant, i se genereaza aici
 * lectiile ramase din curs, cate un rand pentru fiecare, legate de grupa. De
 * aceea totul construit pana acum merge mai departe fara sa fie atins: omul
 * isi primeste emailul lui cu toata seria, fisierul de calendar cu toate
 * lectiile, iar plata si anularile se numara ca la orice alta lectie.
 *
 * Cine intra la a cincea lectie primeste lectiile de la a cincea incolo, nu
 * toate: nu are rost sa plateasca ce nu a facut.
 */
import { useEffect, useState } from 'react'
import type { Client, Grupa } from '@/lib/tipuri'
import { dataOraRo, numeZi } from '@/lib/timp'
import { apel } from '../api'
import { Card, Camp, Eroare, Titlu, Toast, clasaInput } from '../comune'
import { PersonajCerc } from '../PersonajCerc'
import IconPlus from '~icons/solar/add-circle-bold'
import IconMinus from '~icons/solar/close-circle-bold'

type GrupaPlina = Grupa & { cursanti: Client[]; urmatoarea: string | null; tinute: number }

const GOALA = { nume: '', nivel: '', zi: 2, ora: '19:00', prima: '', lectii: 15, locuri: 4, pret: 20 }

export default function Grupe() {
  const [grupe, setGrupe] = useState<GrupaPlina[] | null>(null)
  const [eroare, setEroare] = useState('')
  const [toast, setToast] = useState('')
  const [asteapta, setAsteapta] = useState(false)

  const [formular, setFormular] = useState<(typeof GOALA & { id?: string }) | null>(null)
  const [adaug, setAdaug] = useState<{ grupa: string; nume: string; email: string } | null>(null)

  const incarca = () => {
    setEroare('')
    apel<{ grupe: GrupaPlina[] }>('grupe')
      .then((r) => setGrupe(r.grupe))
      .catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [])

  const anunta = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(''), 3500)
  }

  async function salveazaGrupa() {
    if (!formular) return
    setAsteapta(true)
    try {
      await apel('grupa', { metoda: 'POST', corp: formular })
      setFormular(null)
      incarca()
      anunta(formular.id ? 'Grupa a fost salvată' : 'Grupa a fost creată. Acum adaugă cursanții în ea.')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a salvat')
    } finally {
      setAsteapta(false)
    }
  }

  async function stergeGrupa(g: GrupaPlina) {
    if (!window.confirm(`Ștergi grupa „${g.nume}"? Lecțiile ei viitoare se anulează, cele ținute rămân în istoric.`)) return
    setAsteapta(true)
    try {
      const r = await apel<{ anulate: number }>('grupa', { metoda: 'DELETE', query: { id: g.id } })
      incarca()
      anunta(`Grupa a fost ștearsă. ${r.anulate} lecții viitoare au fost anulate.`)
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a șters')
    } finally {
      setAsteapta(false)
    }
  }

  async function adaugaCursant() {
    if (!adaug) return
    setAsteapta(true)
    try {
      const r = await apel<{ lectii: number }>('grupa-cursant', {
        metoda: 'POST',
        corp: { grupa_id: adaug.grupa, nume: adaug.nume.trim(), email: adaug.email.trim() },
      })
      setAdaug(null)
      incarca()
      anunta(`Gata. I-am trimis pe email toate cele ${r.lectii} lecții, cu fișierul de calendar.`)
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a adăugat')
    } finally {
      setAsteapta(false)
    }
  }

  async function scoateCursant(g: GrupaPlina, c: Client) {
    if (!window.confirm(`Scoți pe ${c.nume} din „${g.nume}"? Lecțiile lui viitoare din grupă se anulează.`)) return
    setAsteapta(true)
    try {
      const r = await apel<{ anulate: number }>('grupa-cursant', { metoda: 'DELETE', query: { grupa: g.id, client: c.id } })
      incarca()
      anunta(`${c.nume} a fost scos. ${r.anulate} lecții anulate.`)
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a scos')
    } finally {
      setAsteapta(false)
    }
  }

  return (
    <>
      <Titlu
        sub="Aceiași oameni, aceeași oră, în fiecare săptămână."
        actiuni={
          <button type="button" onClick={() => setFormular({ ...GOALA })} className="pastila pastila-albastra !py-2.5 text-sm">
            Grupă nouă
          </button>
        }
      >
        Grupe
      </Titlu>

      {eroare && <Eroare mesaj={eroare} reincearca={incarca} />}

      {formular && (
        <Card className="mb-6">
          <h2 className="font-sans text-lg font-medium">{formular.id ? 'Schimbă grupa' : 'Grupă nouă'}</h2>
          <p className="mt-1 text-sm leading-relaxed text-gri">
            Ziua și ora se repetă săptămânal, din ziua primei lecții. Cursanții îi adaugi după ce salvezi.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Camp eticheta="Numele grupei">
              <input value={formular.nume} onChange={(e) => setFormular({ ...formular, nume: e.target.value })} placeholder="A1 de seară" className={clasaInput} />
            </Camp>
            <Camp eticheta="Nivel">
              <input value={formular.nivel} onChange={(e) => setFormular({ ...formular, nivel: e.target.value })} placeholder="Începător" className={clasaInput} />
            </Camp>
            <Camp eticheta="Prima lecție">
              <input type="date" value={formular.prima} onChange={(e) => setFormular({ ...formular, prima: e.target.value })} className={clasaInput} />
            </Camp>
            <Camp eticheta="În fiecare">
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setFormular({ ...formular, zi: z })}
                    aria-pressed={formular.zi === z}
                    className={`rounded-full px-3 py-2 text-sm capitalize transition ${formular.zi === z ? 'bg-albastru text-alb' : 'bg-crem hover:bg-crem-inchis'}`}
                  >
                    {numeZi(z).slice(0, 2)}
                  </button>
                ))}
              </div>
            </Camp>
            <Camp eticheta="Ora" ajutor="Ora României.">
              <input type="time" step={900} value={formular.ora} onChange={(e) => setFormular({ ...formular, ora: e.target.value })} className={clasaInput} />
            </Camp>
            <Camp eticheta="Câte lecții">
              <input type="number" min={1} max={60} value={formular.lectii} onChange={(e) => setFormular({ ...formular, lectii: Number(e.target.value) })} className={clasaInput} />
            </Camp>
            <Camp eticheta="Câte locuri">
              <input type="number" min={2} max={12} value={formular.locuri} onChange={(e) => setFormular({ ...formular, locuri: Number(e.target.value) })} className={clasaInput} />
            </Camp>
            <Camp eticheta="Preț pe lecție, în euro">
              <input type="number" min={0} value={formular.pret} onChange={(e) => setFormular({ ...formular, pret: Number(e.target.value) })} className={clasaInput} />
            </Camp>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => setFormular(null)} className="pastila pastila-alba !py-2.5 text-sm">Renunț</button>
            <button type="button" onClick={salveazaGrupa} disabled={asteapta || formular.nume.trim().length < 2 || !formular.prima} className="pastila pastila-albastra !py-2.5 text-sm disabled:opacity-60">
              {formular.id ? 'Salvează' : 'Creează grupa'}
            </button>
          </div>
        </Card>
      )}

      {grupe === null ? (
        <p className="text-gri">Se încarcă…</p>
      ) : grupe.length === 0 ? (
        <Card>
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <PersonajCerc nume="prezinta" inel="roz" disc="alb" marime={84} marimeMare={104} />
            <div>
              <p className="font-medium">Nicio grupă deocamdată</p>
              <p className="mt-1.5 text-sm leading-relaxed text-gri">
                O grupă e un curs care se repetă: alegi ziua, ora și câte lecții ține, iar apoi adaugi oamenii în ea.
                Fiecare primește pe email toată seria și fișierul de calendar.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {grupe.map((g) => {
            const libere = g.locuri - g.cursanti.length
            return (
              <Card key={g.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-sans text-lg font-medium">{g.nume}</h2>
                    <p className="mt-1 text-sm text-gri">
                      <span className="capitalize">în fiecare {numeZi(g.zi)}</span>, ora {g.ora}
                      {g.nivel ? `, ${g.nivel}` : ''} · {g.pret ? `${g.pret} € pe lecție` : 'gratuit'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setAdaug({ grupa: g.id, nume: '', email: '' })} disabled={libere <= 0} className="pastila pastila-albastra !py-2.5 text-sm disabled:opacity-60">
                      Adaugă cursant
                    </button>
                    <button type="button" onClick={() => setFormular({ id: g.id, nume: g.nume, nivel: g.nivel, zi: g.zi, ora: g.ora, prima: g.prima, lectii: g.lectii, locuri: g.locuri, pret: g.pret })} className="pastila pastila-alba !py-2.5 text-sm">
                      Schimbă
                    </button>
                    <button type="button" onClick={() => void stergeGrupa(g)} className="rounded-full bg-crem px-4 py-2.5 text-sm font-medium hover:text-rosu">
                      Șterge
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <p className="rounded-xl bg-crem px-4 py-2.5 text-sm">
                    <span className="text-gri">Lecții ținute</span>{' '}
                    <span className="font-medium">{g.tinute} din {g.lectii}</span>
                  </p>
                  <p className="rounded-xl bg-crem px-4 py-2.5 text-sm">
                    <span className="text-gri">Următoarea</span>{' '}
                    <span className="font-medium">{g.urmatoarea ? dataOraRo(g.urmatoarea) : 'niciuna'}</span>
                  </p>
                  <p className={`rounded-xl px-4 py-2.5 text-sm ${libere <= 0 ? 'bg-portocaliu-5' : 'bg-crem'}`}>
                    <span className="text-gri">Locuri</span>{' '}
                    <span className="font-medium">{libere <= 0 ? 'grupa e plină' : `${libere} libere din ${g.locuri}`}</span>
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium">Cursanții din grupă</p>
                  {g.cursanti.length === 0 ? (
                    <p className="mt-1.5 text-sm text-gri">Niciunul încă. Apasă „Adaugă cursant".</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {g.cursanti.map((c) => (
                        <span key={c.id} className="flex items-center gap-2 rounded-full bg-crem py-1.5 pl-4 pr-2 text-sm">
                          {c.nume}
                          <button type="button" onClick={() => void scoateCursant(g, c)} className="text-gri hover:text-rosu" aria-label={`Scoate pe ${c.nume}`}>
                            <IconMinus className="size-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {adaug?.grupa === g.id && (
                  <div className="mt-5 rounded-2xl bg-albastru-5 p-4">
                    <p className="text-sm font-medium">Cine intră în grupă</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input value={adaug.nume} onChange={(e) => setAdaug({ ...adaug, nume: e.target.value })} placeholder="Numele lui" className={`${clasaInput} !bg-alb`} />
                      <input value={adaug.email} onChange={(e) => setAdaug({ ...adaug, email: e.target.value })} type="email" placeholder="email@exemplu.ro" className={`${clasaInput} !bg-alb`} />
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed text-gri">
                      Primește toate lecțiile rămase din curs, pe email, cu fișierul de calendar. Cine intră mai târziu
                      primește doar lecțiile de la data intrării încolo.
                    </p>
                    <div className="mt-3 flex flex-wrap justify-end gap-3">
                      <button type="button" onClick={() => setAdaug(null)} className="pastila pastila-alba !py-2.5 text-sm">Renunț</button>
                      <button type="button" onClick={adaugaCursant} disabled={asteapta || adaug.nume.trim().length < 2 || !adaug.email.includes('@')} className="pastila pastila-albastra !py-2.5 text-sm disabled:opacity-60">
                        <IconPlus className="size-4" /> Adaugă și trimite emailul
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Toast text={toast} />
    </>
  )
}
