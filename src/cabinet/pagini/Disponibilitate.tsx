import { useEffect, useMemo, useRef, useState } from 'react'
import type { Blocaj, Disponibilitate as Regula, Programare, Setari } from '@/lib/tipuri'
import { SETARI_IMPLICITE } from '@/lib/tipuri'
import { sloturiLibere } from '@/lib/sloturi'
import { dataOraRo, dataRo, desfaZi, localDin, numeLuna, numeZi, oraRo, ziUrmatoare } from '@/lib/timp'
import { apel } from '../api'
import { Card, Eroare, Titlu, Toast, clasaInput } from '../comune'
import { isoLaLocal, localLaIso, ziIntreaga } from '../timpLocal'
import IconPlus from '~icons/solar/add-circle-bold'
import IconMinus from '~icons/solar/close-circle-bold'
import { PersonajCerc } from '../PersonajCerc'

type RegulaLocala = { zi: number; de_la: string; pana_la: string }

export default function Disponibilitate() {
  const [reguli, setReguli] = useState<RegulaLocala[] | null>(null)
  const [blocaje, setBlocaje] = useState<Blocaj[]>([])
  const [eroare, setEroare] = useState('')
  const [toast, setToast] = useState('')
  const [asteapta, setAsteapta] = useState(false)
  const [nou, setNou] = useState({ de_la: '', pana_la: '', motiv: '' })
  const [ziIntreagaCheie, setZiIntreagaCheie] = useState('')
  const [setari, setSetari] = useState<Setari>(SETARI_IMPLICITE)
  const [programari, setProgramari] = useState<Programare[]>([])

  /*
   * Amprenta orarului asa cum e salvat pe server. Artiom a adaugat intervale,
   * a plecat de pe pagina si nu s-a intamplat nimic pe site: „nu apare nimic,
   * nu inteleg nimic". Nimic nu-i spunea ca mai are de apasat Salveaza.
   */
  const salvat = useRef('[]')
  const incarca = () => {
    setEroare('')
    /*
     * Setarile si programarile viitoare nu se afiseaza aici, dar intra in
     * socoteala previzualizarii de mai jos: fara ele am arata ore libere peste
     * lectii deja luate, sau ore pe care preavizul le ascunde oricum.
     */
    Promise.all([
      apel<{ reguli: Regula[] }>('disponibilitate'),
      apel<{ blocaje: Blocaj[] }>('blocaje'),
      apel<{ setari: Setari }>('setari'),
      apel<{ programari: Programare[] }>('programari', { query: { deLa: new Date().toISOString() } }),
    ])
      .then(([r, b, s, p]) => {
        const curate = r.reguli.map(({ zi, de_la, pana_la }) => ({ zi, de_la, pana_la }))
        salvat.current = JSON.stringify(curate)
        setReguli(curate)
        setBlocaje(b.blocaje)
        setSetari(s.setari)
        setProgramari(p.programari)
      })
      .catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [])

  const anunta = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(''), 2500)
  }

  const nesalvat = reguli !== null && JSON.stringify(reguli) !== salvat.current

  /*
   * Previzualizarea, si de ce exista. Orarul de mai jos are doar nume de zile:
   * „luni", „marti". Artiom, uitandu-se la el: „acolo este doar saptamana si nu
   * este clar care luna, care data exacta". Avea dreptate, ecranul cerea un
   * salt in cap intre o regula care se repeta si zilele adevarate din calendar.
   *
   * Asa ca aratam chiar zilele: aceleasi ore pe care le vede cursantul pe site,
   * cu data lor, calculate cu exact acelasi cod ca API-ul public. Se recalculeaza
   * in timp ce scrii, deci se vede imediat ce iese dintr-un interval schimbat.
   */
  const ZILE_ARATATE = 12
  const ORIZONT_PREVIZUALIZARE = 28

  const previzualizare = useMemo(() => {
    if (!reguli) return [] as [string, string[]][]
    const acum = new Date()
    const azi = localDin(acum).data
    const libere = sloturiLibere({
      deLa: azi,
      panaLa: ziUrmatoare(azi, Math.min(setari.orizont_zile, ORIZONT_PREVIZUALIZARE)),
      tip: 'individual',
      reguli: reguli.map((r, i) => ({ id: String(i), ...r })),
      blocaje,
      programari,
      setari,
      acum,
    })
    return Object.entries(libere).sort(([a], [b]) => a.localeCompare(b))
  }, [reguli, blocaje, programari, setari])

  const oreTotal = previzualizare.reduce((n, [, lista]) => n + lista.length, 0)

  /** Zilele aratate, grupate pe luni, ca sa scrie o data „septembrie", nu la fiecare rand. */
  const peLuni: { cheie: string; titlu: string; zile: [string, string[]][] }[] = []
  for (const intrare of previzualizare.slice(0, ZILE_ARATATE)) {
    const d = desfaZi(intrare[0])
    if (!d) continue
    const cheie = `${d.an}-${d.luna}`
    const grup = peLuni.find((g) => g.cheie === cheie)
    if (grup) grup.zile.push(intrare)
    else peLuni.push({ cheie, titlu: `${numeLuna(d.luna)} ${d.an}`, zile: [intrare] })
  }
  const zileRamase = previzualizare.length - Math.min(previzualizare.length, ZILE_ARATATE)

  /** In romana, numerele terminate in 00 sau in 20 pana la 99 cer „de": 28 de zile, dar 12 ore. */
  const deDe = (n: number) => (n % 100 === 0 || n % 100 >= 20 ? `${n} de` : `${n}`)

  /** „luni" singur nu spune nimic; alaturi de el punem data la care cade data viitoare. */
  const aziCheie = localDin(new Date()).data
  const aziZiSapt = localDin(new Date()).ziSapt
  function urmatoareaData(zi: number): string {
    const peste = (zi - aziZiSapt + 7) % 7
    if (peste === 0) return 'azi'
    if (peste === 1) return 'mâine'
    const d = desfaZi(ziUrmatoare(aziCheie, peste))
    return d ? `${d.zi} ${numeLuna(d.luna).slice(0, 3)}.` : ''
  }

  async function salveazaReguli() {
    if (!reguli) return
    setAsteapta(true)
    try {
      const r = await apel<{ reguli: Regula[] }>('disponibilitate', { metoda: 'PUT', corp: { reguli } })
      const curate = r.reguli.map(({ zi, de_la, pana_la }) => ({ zi, de_la, pana_la }))
      salvat.current = JSON.stringify(curate)
      setReguli(curate)
      anunta('Orarul a fost salvat. Orele apar pe site imediat.')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a salvat')
    } finally {
      setAsteapta(false)
    }
  }

  async function adaugaBlocaj(deLa: string, panaLa: string, motiv: string) {
    setAsteapta(true)
    try {
      const r = await apel<{ blocaj: Blocaj }>('blocaj', { metoda: 'POST', corp: { de_la: deLa, pana_la: panaLa, motiv } })
      setBlocaje((b) => [...b, r.blocaj].sort((x, y) => x.de_la.localeCompare(y.de_la)))
      setNou({ de_la: '', pana_la: '', motiv: '' })
      setZiIntreagaCheie('')
      anunta('Interval blocat')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a salvat')
    } finally {
      setAsteapta(false)
    }
  }

  async function stergeBlocaj(id: string) {
    try {
      await apel('blocaj', { metoda: 'DELETE', query: { id } })
      setBlocaje((b) => b.filter((x) => x.id !== id))
      anunta('Deblocat')
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a șters')
    }
  }

  const schimba = (i: number, camp: 'de_la' | 'pana_la', v: string) => setReguli((r) => (r ?? []).map((x, j) => (j === i ? { ...x, [camp]: v } : x)))
  const acum = new Date().toISOString()

  return (
    <>
      <Titlu sub="Orele în care cursanții pot alege lecții, plus zilele în care nu ești disponibilă.">Orar</Titlu>
      {eroare && <Eroare mesaj={eroare} reincearca={incarca} />}

      {/*
        Cat timp orarul e gol, calendarul de pe site nu arata NICIO ora si
        nimeni nu poate programa nimic. Fara randul asta, ecranul arata linistit
        si nu spune nimanui ca site-ul e, practic, inchis.
      */}
      {reguli !== null && reguli.length === 0 && (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-portocaliu-5 p-5 sm:flex-row sm:items-center">
          <PersonajCerc nume="ganditoare" inel="portocaliu" disc="alb" marime={84} className="hidden sm:block" />
          <div>
            <p className="font-medium text-cerneala">Deocamdată nimeni nu poate programa o lecție</p>
            <p className="mt-1.5 text-sm leading-relaxed text-cerneala/80">
              Orarul e gol, deci pe site nu apare nicio oră liberă și butonul de programare nu are ce
              să arate. Adaugă mai jos măcar un interval, într-o zi, și salvează.
            </p>
          </div>
        </div>
      )}

      {/* Randul asta apare doar cat timp exista modificari neduse la capat. */}
      {nesalvat && (
        <p className="mb-4 rounded-2xl bg-albastru-5 px-5 py-3.5 text-sm leading-relaxed text-cerneala">
          Ai schimbat orarul dar nu l-ai salvat încă. Apasă <strong className="font-medium">Salvează orarul</strong>,
          altfel nu se schimbă nimic pe site.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-sans text-lg font-medium">Orarul săptămânal</h2>
            <button
              type="button"
              onClick={salveazaReguli}
              disabled={asteapta || !reguli}
              className={`pastila !py-2.5 text-sm disabled:opacity-60 ${nesalvat ? 'pastila-albastra motion-safe:animate-pulse' : 'bg-crem-inchis text-cerneala'}`}
            >
              {nesalvat ? 'Salvează orarul' : 'Orarul e salvat'}
            </button>
          </div>
          {/*
            Artiom a citit „Orarul saptamanal" ca „orarul pentru saptamana asta"
            si a intrebat de ce nu poate pune si mai departe. Nu e vina lui:
            ecranul nu spunea nicaieri ca intervalele se repeta. Acum o spune
            din primul rand.
          */}
          <p className="mt-1 text-sm leading-relaxed text-gri">
            Se repetă în <strong className="font-medium text-cerneala">fiecare săptămână</strong>, la nesfârșit. Pui o dată
            intervalele și rămân așa până le schimbi tu. Pentru zilele în care nu poți, folosește blocările din dreapta.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gri">
            Ora României. Lecțiile se așază din oră în oră (50 de minute plus 10 pauză). Cât de departe văd cursanții
            orele libere se alege la <a href="#/setari" className="text-albastru-text underline underline-offset-2">Setări</a>.
          </p>
          <div className="mt-5 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((zi) => {
              const ale = (reguli ?? []).map((r, i) => ({ ...r, i })).filter((r) => r.zi === zi)
              return (
                <div key={zi} className="grid gap-2 rounded-2xl bg-crem p-3 sm:grid-cols-[110px_1fr]">
                  <p className="pt-2 text-sm font-medium capitalize">
                    {numeZi(zi)}
                    {/* Data viitoare la care cade ziua asta. Fara ea, „luni" e o
                        idee abstracta si nu se leaga de nicio zi din calendar. */}
                    <span className="ml-1.5 font-normal normal-case text-gri">{urmatoareaData(zi)}</span>
                  </p>
                  <div className="space-y-2">
                    {/* Scria „liber toată ziua", care înseamnă exact pe dos.
                        O zi fără niciun interval nu e liberă, e închisă: pe
                        site nu apare nicio oră și nimeni nu poate programa
                        nimic în ea. Dorina se putea uita la ecranul ăsta, să
                        vadă șapte zile „libere" și să nu înțeleagă niciodată
                        de ce nu vine nimeni. */}
                    {ale.length === 0 && <p className="pt-2 text-sm text-gri">nicio oră liberă, nu se poate programa</p>}
                    {ale.map((r) => (
                      /* Pe telefon cele doua casute de ora, scrisul dintre ele si
                         butonul de scos nu incap pe 375 de pixeli daca orele sunt
                         late fix: randul iesea din ecran cu vreo 40 de pixeli.
                         Asa isi impart ce ramane, iar de la 640 revin la latimea
                         lor obisnuita. */
                      <div key={r.i} className="flex items-center gap-2">
                        <input type="time" step={900} value={r.de_la} onChange={(e) => schimba(r.i, 'de_la', e.target.value)} className={`${clasaInput} !h-10 min-w-0 flex-1 !bg-alb max-sm:!px-2 sm:!w-32 sm:flex-none`} />
                        <span className="shrink-0 text-sm text-gri">
                          {/* Pe telefon doar „la": „pana la" fura vreo 35 de pixeli,
                              iar „09:00" e mai lat decat „17:00" (cifra 1 e ingusta)
                              si ajungea sub iconita de ceas. */}
                          <span className="sm:hidden">la</span>
                          <span className="hidden sm:inline">până la</span>
                        </span>
                        <input type="time" step={900} value={r.pana_la} onChange={(e) => schimba(r.i, 'pana_la', e.target.value)} className={`${clasaInput} !h-10 min-w-0 flex-1 !bg-alb max-sm:!px-2 sm:!w-32 sm:flex-none`} />
                        <button type="button" onClick={() => setReguli((x) => (x ?? []).filter((_, j) => j !== r.i))} className="shrink-0 text-gri hover:text-rosu" aria-label="Scoate intervalul">
                          <IconMinus className="size-5" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setReguli((x) => [...(x ?? []), { zi, de_la: '17:00', pana_la: '21:00' }])} className="inline-flex items-center gap-1 text-sm font-medium text-albastru-text">
                      <IconPlus className="size-4" /> Adaugă interval
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-sans text-lg font-medium">
              {nesalvat ? 'Așa va arăta după ce salvezi' : 'Orele libere, pe zile'}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gri">
              Chiar orele pe care le vede cursantul în calendarul de pe site, cu data lor, pe următoarele{' '}
              {deDe(Math.min(setari.orizont_zile, ORIZONT_PREVIZUALIZARE))} zile.
            </p>

            {previzualizare.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-portocaliu-5 px-4 py-3.5 text-sm leading-relaxed text-cerneala">
                Nicio oră liberă. Cine intră acum pe site vede calendarul gol și nu poate programa nimic.
              </p>
            ) : (
              <>
                <p className="mt-3.5 text-sm text-cerneala">
                  <strong className="font-medium">
                    {oreTotal === 1 ? 'o oră liberă' : `${deDe(oreTotal)} ore libere`}
                  </strong>
                  , în {previzualizare.length === 1 ? 'o zi' : `${deDe(previzualizare.length)} zile`}.
                </p>
                <div className="mt-4 space-y-4">
                  {peLuni.map((g) => (
                    <div key={g.cheie}>
                      <p className="text-xs font-medium uppercase tracking-wide text-gri">{g.titlu}</p>
                      <ul className="mt-2 space-y-1.5">
                        {g.zile.map(([cheie, lista]) => {
                          /* Prânzul UTC, ca ziua să rămână aceeași indiferent de fus. */
                          const p = localDin(new Date(`${cheie}T12:00:00Z`))
                          return (
                            <li key={cheie} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-crem px-4 py-2.5 text-sm">
                              <span className="font-medium capitalize">
                                {numeZi(p.ziSapt)} {p.zi}
                              </span>
                              <span className="text-gri">{lista.map((s) => oraRo(s)).join(' · ')}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
                {zileRamase > 0 && (
                  <p className="mt-3 text-sm text-gri">
                    Și încă {zileRamase === 1 ? 'o zi' : `${deDe(zileRamase)} zile`} la fel, mai departe.
                  </p>
                )}
              </>
            )}

            <p className="mt-4 text-sm leading-relaxed text-gri">
              Orele din următoarele {setari.preaviz_ore === 1 ? 'o oră' : `${deDe(setari.preaviz_ore)} ore`} nu apar, ca
              să nu te trezești cu o lecție peste câteva minute. Se schimbă la{' '}
              <a href="#/setari" className="text-albastru-text underline underline-offset-2">Setări</a>.
            </p>
          </Card>

          <Card>
            <h2 className="font-sans text-lg font-medium">Blochează o zi întreagă</h2>
            <p className="mt-1 text-sm text-gri">Școală, vacanță, orice. În ziua aceea nu apar sloturi.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <input type="date" value={ziIntreagaCheie} onChange={(e) => setZiIntreagaCheie(e.target.value)} className={`${clasaInput} !w-auto`} />
              <button
                type="button"
                disabled={!ziIntreagaCheie || asteapta}
                onClick={() => {
                  const { deLa, panaLa } = ziIntreaga(ziIntreagaCheie)
                  void adaugaBlocaj(deLa, panaLa, 'Zi liberă')
                }}
                className="pastila pastila-navy !py-2.5 text-sm disabled:opacity-60"
              >
                Blochează ziua
              </button>
            </div>
          </Card>

          <Card>
            <h2 className="font-sans text-lg font-medium">Blochează un interval</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm"><span className="mb-1 block font-medium">De la</span><input type="datetime-local" value={nou.de_la} onChange={(e) => setNou({ ...nou, de_la: e.target.value })} className={clasaInput} /></label>
              <label className="block text-sm"><span className="mb-1 block font-medium">Până la</span><input type="datetime-local" value={nou.pana_la} onChange={(e) => setNou({ ...nou, pana_la: e.target.value })} className={clasaInput} /></label>
              <label className="block text-sm sm:col-span-2"><span className="mb-1 block font-medium">Motiv (opțional)</span><input value={nou.motiv} onChange={(e) => setNou({ ...nou, motiv: e.target.value })} placeholder="Școală, examen, vacanță" className={clasaInput} /></label>
            </div>
            <button
              type="button"
              disabled={!nou.de_la || !nou.pana_la || asteapta}
              onClick={() => void adaugaBlocaj(localLaIso(nou.de_la), localLaIso(nou.pana_la), nou.motiv)}
              className="pastila pastila-navy mt-4 !py-2.5 text-sm disabled:opacity-60"
            >
              Blochează intervalul
            </button>
          </Card>

          <Card>
            <h2 className="font-sans text-lg font-medium">Intervale blocate</h2>
            {blocaje.filter((b) => b.pana_la >= acum).length === 0 ? (
              <p className="mt-3 text-sm text-gri">Niciunul în viitor.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {blocaje
                  .filter((b) => b.pana_la >= acum)
                  .map((b) => {
                    const oZi = isoLaLocal(b.de_la).endsWith('T00:00') && isoLaLocal(b.pana_la).endsWith('T23:59')
                    return (
                      <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-crem px-4 py-3 text-sm">
                        <span>
                          <span className="block font-medium">{oZi ? dataRo(b.de_la) : `${dataOraRo(b.de_la)} până la ${dataOraRo(b.pana_la)}`}</span>
                          <span className="text-gri">{b.motiv || (oZi ? 'toată ziua' : `${oraRo(b.de_la)} până la ${oraRo(b.pana_la)}`)}</span>
                        </span>
                        <button type="button" onClick={() => void stergeBlocaj(b.id)} className="rounded-full bg-alb px-3 py-1.5 text-xs font-medium hover:text-rosu">Deblochează</button>
                      </li>
                    )
                  })}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <Toast text={toast} />
    </>
  )
}
