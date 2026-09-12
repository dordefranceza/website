/**
 * Autentificarea cabinetului, in browser.
 *  - LEGAT: Supabase Auth cu email si parola; daca are aplicatia de verificare
 *    legata, si codul de sase cifre. Token-ul sesiunii merge apoi la server.
 *  - LOCAL: fara Supabase (dezvoltare), se intra cu un buton si token-ul e "local".
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL_SB = (import.meta.env.PUBLIC_SUPABASE_URL as string | undefined)?.replace(/\/+$/, '')
const CHEIE_SB = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined

export const legat = Boolean(URL_SB && CHEIE_SB)

export const sb: SupabaseClient | null = legat
  ? createClient(URL_SB as string, CHEIE_SB as string, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

const CHEIE_LOCAL = 'ddf-cabinet-local'

export type Sesiune = { email: string; cereCod: boolean }

export async function sesiune(): Promise<Sesiune | null> {
  if (!sb) {
    try {
      /**
       * In dezvoltare, fara baza de date legata, cabinetul se deschide singur.
       * Nu e o gaura de securitate: conditia cere si `import.meta.env.DEV`, si
       * lipsa lui Supabase. In productie `sb` exista, deci ramura asta nici nu
       * se atinge, iar serverul refuza oricum orice cerere fara token valid.
       */
      if (import.meta.env.DEV && !localStorage.getItem(CHEIE_LOCAL)) localStorage.setItem(CHEIE_LOCAL, '1')
      return localStorage.getItem(CHEIE_LOCAL) ? { email: 'local@dezvoltare', cereCod: false } : null
    } catch {
      return null
    }
  }
  const { data } = await sb.auth.getSession()
  const email = data.session?.user?.email
  if (!email) return null
  return { email, cereCod: await cereCod() }
}

async function cereCod(): Promise<boolean> {
  if (!sb) return false
  const { data } = await sb.auth.mfa.getAuthenticatorAssuranceLevel()
  return data?.nextLevel === 'aal2' && data.currentLevel !== 'aal2'
}

export async function intra(email: string, parola: string): Promise<Sesiune> {
  if (!sb) {
    localStorage.setItem(CHEIE_LOCAL, '1')
    return { email: 'local@dezvoltare', cereCod: false }
  }
  const { data, error } = await sb.auth.signInWithPassword({ email, password: parola })
  if (error || !data.user?.email) throw new Error(mesajAuth(error?.message))
  return { email: data.user.email, cereCod: await cereCod() }
}

export async function verificaCod(cod: string): Promise<void> {
  if (!sb) return
  const { data: f, error: e1 } = await sb.auth.mfa.listFactors()
  if (e1) throw new Error(e1.message)
  const factor = f?.totp?.find((x) => x.status === 'verified') ?? f?.totp?.[0]
  if (!factor) throw new Error('Nu există nicio aplicație de verificare legată')
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code: cod.replace(/\s/g, '') })
  if (error) throw new Error('Codul nu este corect. Încearcă din nou.')
}

export async function iesi(): Promise<void> {
  try {
    if (sb) await sb.auth.signOut()
    localStorage.removeItem(CHEIE_LOCAL)
  } catch {
    /* se iese oricum */
  }
}

export async function token(): Promise<string> {
  if (!sb) return 'local'
  const { data } = await sb.auth.getSession()
  return data.session?.access_token ?? ''
}

export async function recupereazaParola(email: string): Promise<void> {
  if (!sb) return
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/cabinet/` })
  if (error) throw new Error(mesajAuth(error.message))
}

/* =============================================================================
 *  VERIFICAREA IN DOI PASI, CU O APLICATIE DE AUTENTIFICARE
 * ========================================================================== */

export type StareDoiPasi = { pornit: boolean; factorId: string | null }

const NUME_FACTOR = 'Aplicatia de verificare'

/** Ce aplicatie de verificare are contul acum. */
export async function stareDoiPasi(): Promise<StareDoiPasi> {
  if (!sb) return { pornit: false, factorId: null }
  const { data, error } = await sb.auth.mfa.listFactors()
  if (error) throw new Error(error.message)
  const confirmat = data?.totp?.find((f) => f.status === 'verified')
  return { pornit: Boolean(confirmat), factorId: confirmat?.id ?? null }
}

/**
 * Incepe legarea aplicatiei. Intoarce codul QR, gata de pus intr-un <img>, si
 * cheia scrisa, pentru cine nu poate scana.
 *
 * Factorii ramasi neconfirmati de la o incercare abandonata se sterg intai:
 * Supabase refuza al doilea factor cu acelasi nume si eroarea nu spune de ce.
 */
export async function incepeDoiPasi(): Promise<{ factorId: string; qr: string; cheie: string }> {
  if (!sb) throw new Error('Baza de date nu e legata')
  const { data: existenti } = await sb.auth.mfa.listFactors()
  for (const f of existenti?.totp ?? []) {
    if (f.status !== 'verified') await sb.auth.mfa.unenroll({ factorId: f.id })
  }
  const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: NUME_FACTOR })
  if (error || !data) throw new Error(error?.message ?? 'Nu s-a putut incepe legarea')
  return { factorId: data.id, qr: data.totp.qr_code, cheie: data.totp.secret }
}

/** Confirma legarea cu primul cod de sase cifre din aplicatie. */
export async function confirmaDoiPasi(factorId: string, cod: string): Promise<void> {
  if (!sb) return
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code: cod.replace(/\s/g, '') })
  if (error) throw new Error('Codul nu este corect. Incearca din nou.')
}

/**
 * Scoate aplicatia de pe cont, pentru cand se schimba telefonul.
 * Atentie: stergerea din aplicatia de pe telefon NU scoate factorul de pe
 * server. Daca ramane aici, intrarea cere in continuare un cod pe care nu-l
 * mai are nimeni.
 */
export async function opresteDoiPasi(factorId: string): Promise<void> {
  if (!sb) return
  const { error } = await sb.auth.mfa.unenroll({ factorId })
  if (error) throw new Error(error.message)
}

function mesajAuth(m?: string): string {
  if (!m) return 'Nu s-a putut intra. Încearcă din nou.'
  if (/invalid login/i.test(m)) return 'Email sau parolă greșită.'
  if (/rate limit|too many/i.test(m)) return 'Prea multe încercări. Așteaptă câteva minute.'
  return m
}
