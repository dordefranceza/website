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

export async function adminDin(request: Request): Promise<Admin | null> {
  const token = tokenDin(request)
  if (!token) return null

  if (!supabaseLegat()) {
    return inDezvoltare && token === 'local' ? { email: 'local@dezvoltare' } : null
  }

  const url = variabila('PUBLIC_SUPABASE_URL')
  const anon = variabila('PUBLIC_SUPABASE_ANON_KEY')
  const serviciu = variabila('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anon) return null

  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.auth.getUser(token)
  const email = data.user?.email?.toLowerCase()
  if (error || !email || !data.user) return null

  if (!(await depozit().esteAdmin(email))) return null

  // Verificarea in doi pasi: daca are un factor confirmat, sesiunea trebuie sa fie aal2.
  if (serviciu) {
    const admin = createClient(url, serviciu, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: factori } = await admin.auth.admin.mfa.listFactors({ userId: data.user.id })
    const areFactor = (factori?.factors ?? []).some((f) => f.status === 'verified')
    if (areFactor && revendicari(token).aal !== 'aal2') return null
  }

  return { email }
}
