/**
 * Orarul, ca un calendar adevarat.
 *
 * Prima varianta avea doar sapte randuri, „luni" pana „duminica", si atat.
 * Artiom, a treia oara: „eu sa apas in orice zi a anului sa pun cand sunt
 * libera, cand nu am pus este blocat, atunci si sa pun de la ora asta pana la
 * ora asta, sa pot modifica". Avea dreptate: un orar care se repeta e bun ca
 * temelie, dar nu poate spune „marti, 22 septembrie, doar dimineata".
 *
 * Deci: calendar pe luni, apesi orice zi, ii pui orele ei. Ziua apasata bate
 * saptamana. Zilele neatinse cad pe orarul obisnuit, iar daca nici acela nu
 * are nimic, ziua e inchisa si nimeni nu poate programa in ea.
 *
 * Orele deja luate de cursanti se vad in ziua lor, fiindca intrebarea
 * urmatoare a fost tocmai asta: dispare ora cand cineva se programeaza? Da,
 * dispare singura, si acum se si vede de ce.
 */
import { useEffect, useMemo, useState } from 'react'
import type { Blocaj, Disponibilitate as Regula, Interval, OrarZi, Programare, Setari } from '@/lib/tipuri'
import { SETARI_IMPLICITE } from '@/lib/tipuri'
import { cheieZi, dataOraRo, dataRo, desfaZi, localDin, minuteDin, numeLuna, numeZi, oraRo, ziUrmatoare } from '@/lib/timp'
import { apel } from '../api'
import { Card, Eroare, Titlu, Toast, clasaInput } from '../comune'
import { isoLaLocal, localLaIso } from '../timpLocal'
import IconPlus from '~icons/solar/add-circle-bold'
import IconMinus from '~icons/solar/close-circle-bold'
import IconInapoi from '~icons/solar/arrow-left-linear'
import IconInainte from '~icons/solar/arrow-right-linear'
import { PersonajCerc } from '../PersonajCerc'

type RegulaLocala = { zi: number; de_la: string; pana_la: string }

const CAPETE = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du']

/** Cate zile are luna, si pe ce coloana incepe (0 = luni). */
function formaLunii(luna: string) {
  const [an, l] = luna.split('-').map(Number)
  const nrZile = new Date(Date.UTC(an, l, 0)).getUTCDate()
  const offset = (new Date(Date.UTC(an, l - 1, 1)).getUTCDay() + 6) % 7
  return { an, l, nrZile, offset }
}

/** Luna urmatoare sau cea dinainte, ca 'YYYY-MM'. */
function mutaLuna(luna: string, pas: number): string {
  const [an, l] = luna.split('-').map(Number)
  const d = new Date(Date.UTC(an, l - 1 + pas, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Ziua saptamanii ISO (1 = luni) a unei chei 'YYYY-MM-DD'. */
function ziSaptamanii(cheie: string): number {
  const d = desfaZi(cheie)
  if (!d) return 1
  return ((new Date(Date.UTC(d.an, d.luna - 1, d.zi)).getUTCDay() + 6) % 7) + 1
}

/** „17-21", sau „17-21 +1" cand ziua are mai multe bucati. */
function peScurt(intervale: Interval[]): string {
  if (!intervale.length) return ''
  const i = intervale[0]
  const taie = (o: string) => (o.endsWith(':00') ? o.slice(0, 2) : o)
  return `${taie(i.de_la)}-${taie(i.pana_la)}${intervale.length > 1 ? ` +${intervale.length - 1}` : ''}`
}

export default function Disponibilitate() {
  const azi = localDin(new Date()).data

  const [reguli, setReguli] = useState<RegulaLocala[] | null>(null)
  const [zileProprii, setZileProprii] = useState<OrarZi[]>([])
  const [programari, setProgramari] = useState<Programare[]>([])
  const [blocaje, setBlocaje] = useState<Blocaj[]>([])
  const [setari, setSetari] = useState<Setari>(SETARI_IMPLICITE)

  const [luna, setLuna] = useState(azi.slice(0, 7))
  const [aleasa, setAleasa] = useState(azi)
  const [ciorna, setCiorna] = useState<Interval[]>([])
  const [ciornaPentru, setCiornaPentru] = useState('')

  /* Cele doua cereri vin separat, iar ciorna nu are voie sa porneasca pana nu
     sunt amandoua pe masa. Fara steagurile astea exista o cursa urata: daca
     regulile ajungeau inaintea zilelor, panoul se deschidea GOL pentru o zi
     care avea ore, arata „nesalvat", si o apasare pe Salveaza inchidea ziua. */
  const [gataReguli, setGataReguli] = useState(false)
  const [gataLuna, setGataLuna] = useState(false)

  const [eroare, setEroare] = useState('')
  const [toast, setToast] = useState('')
  const [asteapta, setAsteapta] = useState(false)
  const [nou, setNou] = useState({ de_la: '', pana_la: '', motiv: '' })

  const anunta = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(''), 3000)
  }

  /* Datele care nu tin de luna aratata se cer o singura data. */
  const incarca = () => {
    setEroare('')
    Promise.all([
      apel<{ reguli: Regula[] }>('disponibilitate'),
      apel<{ blocaje: Blocaj[] }>('blocaje'),
      apel<{ setari: Setari }>('setari'),
    ])
      .then(([r, b, s]) => {
        setReguli(r.reguli.map(({ zi, de_la, pana_la }) => ({ zi, de_la, pana_la })))
        setBlocaje(b.blocaje)
        setSetari(s.setari)
        setGataReguli(true)
      })
      .catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [])

  /* Zilele proprii si lectiile se cer pe luna aratata, cu o zi in plus de
     fiecare parte, ca sa nu lipseasca nimic la marginea lunii. */
  const incarcaLuna = () => {
    setGataLuna(false)
    const { an, l, nrZile } = formaLunii(luna)
    const deLa = ziUrmatoare(cheieZi(an, l, 1), -1)
    const panaLa = ziUrmatoare(cheieZi(an, l, nrZile), 1)
    Promise.all([
      apel<{ zile: OrarZi[] }>('orar-zi', { query: { deLa, panaLa } }),
      apel<{ programari: Programare[] }>('programari', { query: { deLa: `${deLa}T00:00:00.000Z`, panaLa: `${panaLa}T23:59:59.999Z` } }),
    ])
      .then(([z, p]) => {
        setZileProprii(z.zile)
        setProgramari(p.programari)
        setGataLuna(true)
      })
      .catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarcaLuna, [luna])

  /** Orele care se aplica unei zile: ale ei daca le are, altfel ale saptamanii. */
  const oreleZilei = (cheie: string): { intervale: Interval[]; proprie: boolean } => {
    const a = zileProprii.find((z) => z.data === cheie)
    if (a) return { intervale: a.intervale, proprie: true }
    const zs = ziSaptamanii(cheie)
    return { intervale: (reguli ?? []).filter((r) => r.zi === zs).map(({ de_la, pana_la }) => ({ de_la, pana_la })), proprie: false }
  }

  /* Ciorna se ia de la capat ori de cate ori se schimba ziua aleasa sau ajung
     date noi de pe server. Fara `ciornaPentru`, o salvare ar rescrie ziua cu
     ce era pe ecran inainte de raspuns. */
  useEffect(() => {
    setCiorna([])
    setCiornaPentru('')
  }, [aleasa])

  useEffect(() => {
    if (!gataReguli || !gataLuna) return
    if (ciornaPentru === aleasa) return
    setCiorna(oreleZilei(aleasa).intervale.map((i) => ({ ...i })))
    setCiornaPentru(aleasa)
  }, [aleasa, gataReguli, gataLuna, reguli, zileProprii, ciornaPentru])

  const alesProprie = zileProprii.some((z) => z.data === aleasa)
  const nesalvat = ciornaPentru === aleasa && JSON.stringify(ciorna) !== JSON.stringify(oreleZilei(aleasa).intervale)

  const lectiileZilei = useMemo(
    () =>
      programari
        .filter((p) => p.stare !== 'anulata' && localDin(p.incepe).data === aleasa)
        .sort((a, b) => a.incepe.localeCompare(b.incepe)),
    [programari, aleasa],
  )

  /** Cate lectii are fiecare zi, ca sa se vada bulina pe calendar. */
  const lectiiPeZi = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of programari) {
      if (p.stare === 'anulata') continue
      const z = localDin(p.incepe).data
      m.set(z, (m.get(z) ?? 0) + 1)
    }
    return m
  }, [programari])

  async function salveazaZiua(intervale: Interval[] | null, mesaj: string) {
    if (intervale !== null && ciornaPentru !== aleasa) return
    setAsteapta(true)
    try {
      const r = await apel<{ zile: OrarZi[] }>('orar-zi', { metoda: 'PUT', corp: { data: aleasa, intervale } })
      setZileProprii((toate) => [...toate.filter((z) => z.data !== aleasa), ...r.zile].sort((a, b) => a.data.localeCompare(b.data)))
      setCiornaPentru('')
      anunta(mesaj)
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a salvat')
    } finally {
      setAsteapta(false)
    }
  }

  /** Muta orele zilei in orarul saptamanal, si scoate exceptia care le tinea. */
  async function repetaSaptamanal() {
    const zs = ziSaptamanii(aleasa)
    const noi = [...(reguli ?? []).filter((r) => r.zi !== zs), ...ciorna.map((i) => ({ zi: zs, de_la: i.de_la, pana_la: i.pana_la }))]
    setAsteapta(true)
    try {
      const r = await apel<{ reguli: Regula[] }>('disponibilitate', { metoda: 'PUT', corp: { reguli: noi } })
      setReguli(r.reguli.map(({ zi, de_la, pana_la }) => ({ zi, de_la, pana_la })))
      await apel('orar-zi', { metoda: 'PUT', corp: { data: aleasa, intervale: null } })
      setZileProprii((toate) => toate.filter((z) => z.data !== aleasa))
      setCiornaPentru('')
      anunta(`Orele astea se repetă acum în fiecare ${numeZi(zs)}.`)
    } catch (e) {
      anunta(e instanceof Error ? e.message : 'Nu s-a salvat')
    } finally {
      setAsteapta(false)
    }
  }

  /** Scoate din orarul saptamanal toate orele unei zile. Zilele deja apasate in
      calendar nu se ating: ele au orarul lor si nu asculta de saptamana. */
  async function nuMaiRepeta(zi: number) {
    setAsteapta(true)
    try {
      const r = await apel<{ reguli: Regula[] }>('disponibilitate', { metoda: 'PUT', corp: { reguli: (reguli ?? []).filter((x) => x.zi !== zi) } })
      setReguli(r.reguli.map(({ zi: z, de_la, pana_la }) => ({ zi: z, de_la, pana_la })))
      setCiornaPentru('')
      anunta(`Nu se mai repetă în fiecare ${numeZi(zi)}.`)
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
      anunta('Ora blocată')
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

  const { an, l, nrZile, offset } = formaLunii(luna)
  const acum = new Date().toISOString()
  const aleasaParti = desfaZi(aleasa)
  const areReguli = (reguli ?? []).length > 0

  /* Cate zile din luna aratata sunt deschise. Raspunde dintr-o privire la „de
     ce nu poate nimeni sa programeze", fara sa fie numarate cu ochiul. */
  const deschiseInLuna = useMemo(() => {
    let n = 0
    for (let i = 1; i <= nrZile; i++) if (oreleZilei(cheieZi(an, l, i)).intervale.length) n++
    return n
  }, [an, l, nrZile, zileProprii, reguli])

  return (
    <>
      <Titlu sub="Apasă pe o zi și pune orele în care poți. Zilele fără ore rămân închise.">Orar</Titlu>
      {eroare && <Eroare mesaj={eroare} reincearca={incarca} />}

      {/* Cat timp nicio zi nu are ore, site-ul e practic inchis. Randul asta o
          spune, altfel ecranul pare linistit si nimeni nu afla. */}
      {reguli !== null && deschiseInLuna === 0 && (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-portocaliu-5 p-5 sm:flex-row sm:items-center">
          <PersonajCerc nume="ganditoare" inel="portocaliu" disc="alb" marime={84} className="hidden sm:block" />
          <div>
            <p className="font-medium text-cerneala">În {numeLuna(l)} nu se poate programa nicio lecție</p>
            <p className="mt-1.5 text-sm leading-relaxed text-cerneala/80">
              Nicio zi din luna asta nu are ore, deci pe site calendarul apare gol. Apasă o zi mai jos, pune orele, și
              apasă Salvează ziua.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-sans text-lg font-medium first-letter:uppercase">{numeLuna(l)} {an}</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setLuna(mutaLuna(luna, -1))} className="flex size-9 items-center justify-center rounded-full bg-crem hover:bg-crem-inchis" aria-label="Luna dinainte">
                <IconInapoi className="size-4" />
              </button>
              <button type="button" onClick={() => { setLuna(azi.slice(0, 7)); setAleasa(azi) }} className="rounded-full bg-crem px-4 py-2 text-sm font-medium hover:bg-crem-inchis">
                Azi
              </button>
              <button type="button" onClick={() => setLuna(mutaLuna(luna, 1))} className="flex size-9 items-center justify-center rounded-full bg-crem hover:bg-crem-inchis" aria-label="Luna următoare">
                <IconInainte className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-1.5">
            {CAPETE.map((c) => (
              <p key={c} className="pb-1 text-center text-xs font-medium text-gri">{c}</p>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <div key={`gol${i}`} />
            ))}
            {Array.from({ length: nrZile }, (_, i) => {
              const cheie = cheieZi(an, l, i + 1)
              const { intervale, proprie } = oreleZilei(cheie)
              const deschisa = intervale.length > 0
              const lectii = lectiiPeZi.get(cheie) ?? 0
              return (
                <button
                  key={cheie}
                  type="button"
                  onClick={() => setAleasa(cheie)}
                  aria-pressed={aleasa === cheie}
                  className={[
                    'flex min-h-[3.6rem] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-sm transition sm:min-h-[4.2rem]',
                    deschisa ? 'bg-albastru-5 font-medium text-cerneala' : 'bg-crem text-gri',
                    cheie < azi ? 'opacity-45' : 'hover:-translate-y-0.5',
                    aleasa === cheie ? 'ring-2 ring-albastru' : cheie === azi ? 'ring-1 ring-navy/30' : '',
                  ].join(' ')}
                >
                  <span className="leading-none">{i + 1}</span>
                  <span className={`text-[0.62rem] leading-none ${deschisa ? 'text-albastru-text' : 'text-gri'}`}>
                    {deschisa ? peScurt(intervale) : 'închis'}
                  </span>
                  <span className="flex h-1.5 items-center gap-0.5">
                    {proprie && <span className="size-1.5 rounded-full bg-portocaliu" />}
                    {lectii > 0 && <span className="size-1.5 rounded-full bg-verde" />}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gri">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded bg-albastru-5" /> zi deschisă</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded bg-crem" /> închisă, nu se poate programa</span>
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-portocaliu" /> orar pus doar pe ziua aia</span>
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-verde" /> are lecții</span>
          </div>
        </Card>

        <Card className="xl:sticky xl:top-6 xl:self-start">
          {/* `capitalize` ar face „13 Septembrie", cu luna cu majuscula la mijloc
              de propozitie. `first-letter` ridica doar litera dintai. */}
          <h2 className="font-sans text-lg font-medium first-letter:uppercase">
            {aleasaParti ? `${numeZi(ziSaptamanii(aleasa))}, ${aleasaParti.zi} ${numeLuna(aleasaParti.luna)}` : ''}
          </h2>
          {/* Trei situatii, si fiecare cere alt raspuns. Un singur text pentru
              toate lasa omul sa creada ca mai are ceva de facut altundeva. */}
          <p className="mt-1 text-sm leading-relaxed text-gri">
            {alesProprie
              ? 'Orele astea sunt puse de tine, numai pe ziua asta. Nu depind de nimic altceva.'
              : oreleZilei(aleasa).intervale.length
                ? `Ziua ia orele care se repetă în fiecare ${numeZi(ziSaptamanii(aleasa))}. Dacă le schimbi aici, se schimbă numai în ziua asta.`
                : 'Ziua e închisă, nimeni nu poate programa în ea. Pune-i orele și salveaz-o.'}
          </p>

          {aleasa < azi && <p className="mt-3 rounded-xl bg-crem px-4 py-2.5 text-sm text-gri">Ziua a trecut. Poți privi, dar nu mai are cine să programeze în ea.</p>}

          <div className="mt-4 space-y-2">
            {ciorna.length === 0 && <p className="text-sm text-gri">Nicio oră. Ziua e închisă și nu apare pe site.</p>}
            {ciorna.map((i, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="time"
                  step={900}
                  value={i.de_la}
                  onChange={(e) => setCiorna((c) => c.map((x, j) => (j === idx ? { ...x, de_la: e.target.value } : x)))}
                  className={`${clasaInput} !h-10 min-w-0 flex-1 !bg-crem max-sm:!px-2`}
                />
                <span className="shrink-0 text-sm text-gri">la</span>
                <input
                  type="time"
                  step={900}
                  value={i.pana_la}
                  onChange={(e) => setCiorna((c) => c.map((x, j) => (j === idx ? { ...x, pana_la: e.target.value } : x)))}
                  className={`${clasaInput} !h-10 min-w-0 flex-1 !bg-crem max-sm:!px-2`}
                />
                <button type="button" onClick={() => setCiorna((c) => c.filter((_, j) => j !== idx))} className="shrink-0 text-gri hover:text-rosu" aria-label="Scoate intervalul">
                  <IconMinus className="size-5" />
                </button>
              </div>
            ))}
            {/* Artiom: „acest buton să fie mai vizibil, ăsta e unul din cele mai
                importante". Era un rand de text albastru, de aceeasi marime cu
                explicatiile din jur, si se pierdea intre ele. Acum e un buton
                cat randul, cu fundal, greu de ratat si usor de nimerit cu
                degetul. */}
            <button
              type="button"
              onClick={() => setCiorna((c) => [...c, c.length ? { de_la: '17:00', pana_la: '21:00' } : { de_la: '09:00', pana_la: '13:00' }])}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-albastru-10 px-4 py-3 font-medium text-albastru-text transition hover:bg-albastru hover:text-alb"
            >
              <IconPlus className="size-5" /> Adaugă interval
            </button>
          </div>

          {/* Orele scrise pe dos nu ajung in baza de date, deci se spune inainte. */}
          {ciorna.some((i) => minuteDin(i.de_la) >= minuteDin(i.pana_la)) && (
            <p className="mt-3 rounded-xl bg-portocaliu-5 px-4 py-2.5 text-sm leading-relaxed text-cerneala">
              Un interval se termină înainte să înceapă. Îndreaptă-l, altfel nu se salvează.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={asteapta || !nesalvat}
              onClick={() => void salveazaZiua(ciorna, 'Ziua a fost salvată. Orele apar pe site imediat.')}
              className={`pastila !py-2.5 text-sm disabled:opacity-60 ${nesalvat ? 'pastila-albastra motion-safe:animate-pulse' : 'bg-crem-inchis text-cerneala'}`}
            >
              {nesalvat ? 'Salvează ziua' : 'Ziua e salvată'}
            </button>
            {ciorna.length > 0 && (
              <button type="button" onClick={() => setCiorna([])} className="pastila pastila-alba !py-2.5 text-sm">
                Închide ziua
              </button>
            )}
          </div>

          {/* Trecerea la alta zi arunca ciorna. Se spune, fiindca exact asta l-a
              pacalit pe Artiom la orarul saptamanal: schimbase si plecase. */}
          {nesalvat && (
            <p className="mt-2.5 text-sm leading-relaxed text-gri">Nu ai salvat încă. Dacă apeși altă zi, se pierde.</p>
          )}

          <div className="mt-4 space-y-2">
            {ciorna.length > 0 && (
              <button type="button" disabled={asteapta} onClick={() => void repetaSaptamanal()} className="block text-sm font-medium text-albastru-text disabled:opacity-60">
                Repetă în fiecare {numeZi(ziSaptamanii(aleasa))}, la nesfârșit
              </button>
            )}
            {alesProprie && (
              <button type="button" disabled={asteapta} onClick={() => void salveazaZiua(null, 'Orele puse pe ziua asta au fost scoase.')} className="block text-sm font-medium text-gri underline underline-offset-4 disabled:opacity-60">
                Scoate orele puse pe ziua asta
              </button>
            )}
          </div>

          {/* Raspunsul la „dispare ora cand se programeaza cineva?". Da, dispare,
              si de aici se vede cine a luat-o. */}
          <div className="mt-6">
            <p className="text-sm font-medium">Lecții în ziua asta</p>
            {lectiileZilei.length === 0 ? (
              <p className="mt-1.5 text-sm text-gri">Niciuna deocamdată.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {lectiileZilei.map((p) => (
                  <li key={p.id} className="flex items-baseline gap-2.5 rounded-xl bg-verde-5 px-3.5 py-2 text-sm">
                    <span className="font-medium">{oraRo(p.incepe)}</span>
                    <span className="text-cerneala/80">{p.client?.nume || 'cursant'}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-sm leading-relaxed text-gri">O oră luată dispare singură de pe site, nu trebuie să o blochezi tu.</p>
          </div>
        </Card>
      </div>

      {/*
        Cardul cu orele care se repeta apare DOAR daca exista asa ceva.
        Cand era mereu pe ecran, cu sapte randuri „inchis", punea la indoiala
        munca de sus: Artiom pusese ore in calendar si dedesubt scria ca luni e
        inchis. „Ce-i asta? Ce mai trebuie mie jos?" Nimic. Daca nu repeti
        nimic, cardul nu mai are ce sa spuna, deci nu mai apare.
      */}
      <div className={`mt-6 grid gap-6 ${areReguli ? 'xl:grid-cols-[minmax(0,1fr)_22rem]' : ''}`}>
        {areReguli && (
          <Card>
            <h2 className="font-sans text-lg font-medium">Ore care se repetă singure</h2>
            <p className="mt-1 text-sm leading-relaxed text-gri">
              Zilele de mai jos primesc orele astea în fiecare săptămână, la nesfârșit, fără să le mai pui tu. Orice zi
              pe care o schimbi în calendar trece peste ele, numai în ziua aia.
            </p>
            <div className="mt-4 space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((zi) => {
                const ale = (reguli ?? []).filter((r) => r.zi === zi)
                if (!ale.length) return null
                return (
                  <div key={zi} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl bg-crem px-4 py-2.5 text-sm">
                    <span>
                      <span className="font-medium capitalize">în fiecare {numeZi(zi)}</span>
                      <span className="ml-2.5 text-cerneala/80">{ale.map((r) => `${r.de_la} la ${r.pana_la}`).join(', ')}</span>
                    </span>
                    <button
                      type="button"
                      disabled={asteapta}
                      onClick={() => void nuMaiRepeta(zi)}
                      className="rounded-full bg-alb px-3 py-1.5 text-xs font-medium hover:text-rosu disabled:opacity-60"
                    >
                      Nu mai repeta
                    </button>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        <div className={areReguli ? 'space-y-6' : 'grid gap-6 md:grid-cols-2 md:items-start'}>
          <Card>
            <h2 className="font-sans text-lg font-medium">Blochează o oră anume</h2>
            <p className="mt-1 text-sm leading-relaxed text-gri">
              Pentru o gaură într-o zi altfel bună: dentist, ședință, drum. Ca să închizi o zi întreagă, apas-o în
              calendar și scoate-i orele.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm"><span className="mb-1 block font-medium">De la</span><input type="datetime-local" value={nou.de_la} onChange={(e) => setNou({ ...nou, de_la: e.target.value })} className={clasaInput} /></label>
              <label className="block text-sm"><span className="mb-1 block font-medium">Până la</span><input type="datetime-local" value={nou.pana_la} onChange={(e) => setNou({ ...nou, pana_la: e.target.value })} className={clasaInput} /></label>
              <label className="block text-sm sm:col-span-2"><span className="mb-1 block font-medium">Motiv (opțional)</span><input value={nou.motiv} onChange={(e) => setNou({ ...nou, motiv: e.target.value })} placeholder="Dentist, ședință, drum" className={clasaInput} /></label>
            </div>
            <button
              type="button"
              disabled={!nou.de_la || !nou.pana_la || asteapta}
              onClick={() => void adaugaBlocaj(localLaIso(nou.de_la), localLaIso(nou.pana_la), nou.motiv)}
              className="pastila pastila-navy mt-4 !py-2.5 text-sm disabled:opacity-60"
            >
              Blochează
            </button>
          </Card>

          <Card>
            <h2 className="font-sans text-lg font-medium">Ore blocate</h2>
            {blocaje.filter((b) => b.pana_la >= acum).length === 0 ? (
              <p className="mt-3 text-sm text-gri">Niciuna în viitor.</p>
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

      <p className="mt-6 text-sm leading-relaxed text-gri">
        Cursanții văd orele libere pe {setari.orizont_zile} de zile înainte, iar orele din următoarele {setari.preaviz_ore} ore
        nu apar, ca să nu te trezești cu o lecție peste câteva minute. Amândouă se schimbă la{' '}
        <a href="#/setari" className="text-albastru-text underline underline-offset-2">Setări</a>.
      </p>

      <Toast text={toast} />
    </>
  )
}
