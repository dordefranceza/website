/**
 * Cine are voie in cabinet. Browserul se logheaza la Supabase Auth si trimite
 * token-ul ca "Authorization: Bearer ...". Aici se verifica trei lucruri:
 *   1. token-ul e valid (Supabase il recunoaste);
 *   2. emailul e in tabelul admin_email;
 *   3. daca are aplicatia de verificare legata, sesiunea a trecut si de cod (aal2).
 * In dezvoltare, fara Supabase, se accepta token-ul "local".
 */
import { createClient } from '@supabase/supabase-js'
import { depozit } from './depozit'
import { inDezvoltare, supabaseLegat, variabila } from './mediu'

export type Admin = { email: string }

function tokenDin(request: Request): string {
  const antet = request.headers.get('authorization') ?? ''
  return antet.startsWith('Bearer ') ? antet.slice(7).trim() : ''
}

function revendicari(token: string): Record<string, unknown> {
  try {
    const parte = token.split('.')[1] ?? ''
    return JSON.parse(Buffer.from(parte.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
  } catch {
    return {}
  }
}

/*
 * Verdictul, tinut minte cateva zeci de secunde.
 *
 * Verificarea de mai jos costa TREI drumuri la Supabase: cine e omul, e in
 * lista de admini, si are verificare in doi pasi. Cabinetul cere intre doua si
 * cinci lucruri cand deschizi o pagina, deci se plateau pana la cincisprezece
 * drumuri pentru o singura apasare. Artiom: „apas, se muta, apare peste doua
 * secunde pagina, de ce asa greu?". De aia.
 *
 * Cheia e chiar token-ul, deci un alt om are alt raspuns. Se tine putin si
 * niciodata peste expirarea token-ului: daca i se ia cuiva dreptul, in cel
 * mult un minut nu mai intra. Functiile de pe Vercel se refolosesc intre
 * cereri, deci memoria asta chiar prinde.
 */
type Verdict = { admin: Admin | null; pana: number }
const verdicte = new Map<string, Verdict>()
const VIATA_VERDICT = 60_000

function tinutMinte(token: string): Admin | null | undefined {
  const v = verdicte.get(token)
  if (!v) return undefined
  if (Date.now() > v.pana) {
    verdicte.delete(token)
    return undefined
  }
  return v.admin
}

function tineMinte(token: string, admin: Admin | null): void {
  // Nu peste expirarea token-ului: `exp` e in secunde.
  const exp = Number(revendicari(token).exp) * 1000
  const pana = Math.min(Date.now() + VIATA_VERDICT, Number.isFinite(exp) && exp > 0 ? exp : Infinity)
  if (verdicte.size > 50) verdicte.clear()
  verdicte.set(token, { admin, pana })
}

export async function adminDin(request: Request): Promise<Admin | null> {
  const token = tokenDin(request)
  if (!token) return null

  if (!supabaseLegat()) {
    return inDezvoltare && token === 'local' ? { email: 'local@dezvoltare' } : null
  }

  const stiut = tinutMinte(token)
  if (stiut !== undefined) return stiut

  const url = variabila('PUBLIC_SUPABASE_URL')
  const anon = variabila('PUBLIC_SUPABASE_ANON_KEY')
  const serviciu = variabila('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anon) return null

  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.auth.getUser(token)
  const email = data.user?.email?.toLowerCase()
  if (error || !email || !data.user) {
    tineMinte(token, null)
    return null
  }

  if (!(await depozit().esteAdmin(email))) {
    tineMinte(token, null)
    return null
  }

  // Verificarea in doi pasi: daca are un factor confirmat, sesiunea trebuie sa fie aal2.
  if (serviciu) {
    const admin = createClient(url, serviciu, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: factori } = await admin.auth.admin.mfa.listFactors({ userId: data.user.id })
    const areFactor = (factori?.factors ?? []).some((f) => f.status === 'verified')
    if (areFactor && revendicari(token).aal !== 'aal2') {
      tineMinte(token, null)
      return null
    }
  }

  const admin = { email }
  tineMinte(token, admin)
  return admin
}
