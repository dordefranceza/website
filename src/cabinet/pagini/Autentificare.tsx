import { useState } from 'react'
import { intra, legat, recupereazaParola, verificaCod } from '../auth'
import { clasaInput } from '../comune'

type Props = { cereCod: boolean; email: string; laIntrare: () => Promise<void> }

export default function Autentificare({ cereCod, email, laIntrare }: Props) {
  const [mod, setMod] = useState<'intrare' | 'cod' | 'recuperare'>(cereCod ? 'cod' : 'intrare')
  const [eroare, setEroare] = useState('')
  const [info, setInfo] = useState('')
  const [asteapta, setAsteapta] = useState(false)

  async function trimite(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEroare('')
    setInfo('')
    setAsteapta(true)
    try {
      if (mod === 'intrare') {
        const s = await intra(String(f.get('email') ?? ''), String(f.get('parola') ?? ''))
        if (s.cereCod) setMod('cod')
        else await laIntrare()
      } else if (mod === 'cod') {
        await verificaCod(String(f.get('cod') ?? ''))
        await laIntrare()
      } else {
        await recupereazaParola(String(f.get('email') ?? ''))
        setInfo('Dacă adresa există, ai primit un email cu linkul de resetare.')
      }
    } catch (er) {
      setEroare(er instanceof Error ? er.message : 'Nu s-a putut intra')
    } finally {
      setAsteapta(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md rounded-[2rem] bg-alb p-8 sm:p-10">
        <p className="font-display text-3xl">
          Dor<span className="italic">de</span>Franceza
        </p>
        <h1 className="mt-6 font-sans text-2xl font-medium">
          {mod === 'cod' ? 'Codul din aplicație' : mod === 'recuperare' ? 'Parolă uitată' : 'Cabinetul Dorinei'}
        </h1>
        <p className="mt-1 text-gri">
          {mod === 'cod'
            ? `Deschide Google Authenticator și scrie codul de șase cifre pentru ${email || 'contul tău'}.`
            : mod === 'recuperare'
              ? 'Îți trimitem pe email un link cu care alegi o parolă nouă.'
              : legat
                ? 'Intră cu emailul și parola ta.'
                : 'Fără bază de date legată: intri direct, în modul local.'}
        </p>

        <form onSubmit={trimite} className="mt-8 space-y-4">
          {mod === 'cod' ? (
            <input name="cod" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required autoFocus placeholder="123 456" className={`${clasaInput} text-center text-2xl tracking-[0.3em]`} />
          ) : legat ? (
            <>
              <input name="email" type="email" autoComplete="email" required placeholder="Email" className={clasaInput} />
              {mod === 'intrare' && <input name="parola" type="password" autoComplete="current-password" required placeholder="Parola" className={clasaInput} />}
            </>
          ) : null}

          {eroare && <p role="alert" className="rounded-xl bg-[#fdeaee] px-4 py-3 text-sm text-rosu">{eroare}</p>}
          {info && <p className="rounded-xl bg-verde-5 px-4 py-3 text-sm text-verde">{info}</p>}

          <button type="submit" disabled={asteapta} className="pastila pastila-albastra w-full !py-3.5 disabled:opacity-60">
            {asteapta ? 'Un moment…' : mod === 'cod' ? 'Verifică' : mod === 'recuperare' ? 'Trimite linkul' : legat ? 'Intră' : 'Intră în modul local'}
          </button>
        </form>

        {legat && mod !== 'cod' && (
          <button type="button" onClick={() => setMod(mod === 'intrare' ? 'recuperare' : 'intrare')} className="mt-5 text-sm font-medium text-albastru">
            {mod === 'intrare' ? 'Am uitat parola' : 'Înapoi la intrare'}
          </button>
        )}
        <a href="/" className="mt-5 block text-sm text-gri hover:text-cerneala">
          Înapoi la site
        </a>
      </div>
    </div>
  )
}
