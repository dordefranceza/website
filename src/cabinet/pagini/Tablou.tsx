import { useEffect, useState } from 'react'
import type { Programare } from '@/lib/tipuri'
import { dataScurtaRo, numeLuna, oraRo } from '@/lib/timp'
import { apel } from '../api'
import { Card, Eroare, EtichetaStare, EtichetaTip, Gol, Titlu, bani } from '../comune'

type Sumar = {
  mod: 'supabase' | 'local'
  noi: number
  azi: Programare[]
  urmatoarele: Programare[]
  luna: { cheie: string; lectii: number; incasat: number; deIncasat: number; clientiNoi: number; lunaTrecuta: { lectii: number; incasat: number } }
  surse: { sursa: string; n: number }[]
  pe12Luni: { luna: string; lectii: number; incasat: number }[]
  clienti: number
}

export default function Tablou() {
  const [s, setS] = useState<Sumar | null>(null)
  const [eroare, setEroare] = useState('')

  const incarca = () => {
    setEroare('')
    apel<Sumar>('sumar').then(setS).catch((e: Error) => setEroare(e.message))
  }
  useEffect(incarca, [])

  if (eroare) return <Eroare mesaj={eroare} reincearca={incarca} />
  if (!s) return <p className="text-gri">Se încarcă…</p>

  const lunaNume = numeLuna(Number(s.luna.cheie.slice(5)))
  const maxLectii = Math.max(1, ...s.pe12Luni.map((l) => l.lectii))

  return (
    <>
      <Titlu sub={`${lunaNume} ${s.luna.cheie.slice(0, 4)}`}>Bună, Dorina</Titlu>

      {s.mod === 'local' && (
        <p className="mb-6 rounded-2xl bg-portocaliu-5 px-5 py-3 text-sm text-[#b8431a]">
          Modul local: datele stau într-un fișier pe acest calculator. Când se leagă Supabase, cabinetul trece singur pe baza de date.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cifra eticheta="Cereri noi" valoare={String(s.noi)} nota={s.noi ? 'de confirmat' : 'toate confirmate'} href="#/programari" accent="portocaliu" />
        <Cifra eticheta={`Lecții în ${lunaNume}`} valoare={String(s.luna.lectii)} nota={`luna trecută: ${s.luna.lunaTrecuta.lectii}`} accent="albastru" />
        <Cifra eticheta="Încasat luna asta" valoare={bani(s.luna.incasat)} nota={s.luna.deIncasat ? `de încasat: ${bani(s.luna.deIncasat)}` : 'totul încasat'} accent="verde" />
        <Cifra eticheta="Cursanți noi" valoare={String(s.luna.clientiNoi)} nota={`${s.clienti} în total`} href="#/cursanti" accent="roz" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <h2 className="font-sans text-lg font-medium">Astăzi</h2>
          {s.azi.length === 0 ? (
            <Gol>Nicio lecție azi.</Gol>
          ) : (
            <ul className="mt-4 space-y-2">
              {s.azi.map((p) => (
                <Rand key={p.id} p={p} />
              ))}
            </ul>
          )}

          <h2 className="mt-8 font-sans text-lg font-medium">Urmează</h2>
          {s.urmatoarele.length === 0 ? (
            <Gol>Nimic programat încă. Verifică orarul din pagina Orar.</Gol>
          ) : (
            <ul className="mt-4 space-y-2">
              {s.urmatoarele.map((p) => (
                <Rand key={p.id} p={p} />
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-sans text-lg font-medium">Ultimele 12 luni</h2>
            <div className="mt-5 flex h-36 items-end gap-1.5">
              {s.pe12Luni.map((l) => (
                <div key={l.luna} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${l.luna}: ${l.lectii} lecții, ${bani(l.incasat)}`}>
                  <div className="flex w-full flex-col justify-end rounded-t-lg bg-albastru-10" style={{ height: `${Math.max(4, (l.lectii / maxLectii) * 90)}%` }}>
                    <div className="w-full rounded-t-lg bg-albastru" style={{ height: l.lectii ? `${Math.min(100, (l.incasat / Math.max(1, l.lectii * 40)) * 100)}%` : 0 }} />
                  </div>
                  <span className="text-[10px] text-gri">{numeLuna(Number(l.luna.slice(5))).slice(0, 3)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gri">Bara: lecții. Partea închisă: cât din ele e încasat.</p>
          </Card>

          <Card>
            <h2 className="font-sans text-lg font-medium">De unde vin cursanții</h2>
            {s.surse.length === 0 ? (
              <Gol>Încă nimic. Pune linkuri cu ?ref=tiktok, ?ref=instagram pe rețele.</Gol>
            ) : (
              <ul className="mt-4 space-y-2">
                {s.surse.map((x) => (
                  <li key={x.sursa} className="flex items-center justify-between rounded-xl bg-crem px-4 py-2.5 text-sm">
                    <span className="font-medium capitalize">{x.sursa}</span>
                    <span className="text-gri">{x.n}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

function Cifra({ eticheta, valoare, nota, href, accent }: { eticheta: string; valoare: string; nota: string; href?: string; accent: 'portocaliu' | 'albastru' | 'verde' | 'roz' }) {
  const culori = { portocaliu: 'bg-portocaliu-5', albastru: 'bg-albastru-5', verde: 'bg-verde-5', roz: 'bg-roz-5' }
  const continut = (
    <>
      <p className="text-sm font-medium text-gri">{eticheta}</p>
      <p className="mt-2 font-display text-4xl">{valoare}</p>
      <p className="mt-1 text-xs text-gri">{nota}</p>
    </>
  )
  const clasa = `block rounded-[1.5rem] p-5 ${culori[accent]}`
  return href ? (
    <a href={href} className={`${clasa} transition hover:-translate-y-0.5`}>
      {continut}
    </a>
  ) : (
    <div className={clasa}>{continut}</div>
  )
}

function Rand({ p }: { p: Programare }) {
  return (
    <li>
      <a href={`#/programari?id=${p.id}`} className="flex flex-wrap items-center gap-3 rounded-xl bg-crem px-4 py-3 text-sm transition hover:bg-crem-inchis">
        <span className="w-24 font-medium">{dataScurtaRo(p.incepe)}</span>
        <span className="w-12 font-medium">{oraRo(p.incepe)}</span>
        <span className="flex-1 truncate">{p.client?.nume ?? 'Fără nume'}</span>
        <EtichetaTip tip={p.tip} />
        <EtichetaStare stare={p.stare} />
      </a>
    </li>
  )
}
