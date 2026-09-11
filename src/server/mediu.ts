/**
 * Variabilele de mediu, citite de unde pot sta: process.env pe Vercel,
 * import.meta.env in dezvoltare (Vite pune fisierele .env acolo, nu in process.env).
 */
export function variabila(nume: string): string {
  const dinProces = typeof process !== 'undefined' ? process.env?.[nume] : undefined
  const mediuVite = typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string | undefined> }).env : undefined
  return (dinProces ?? mediuVite?.[nume] ?? '').trim()
}

export const inDezvoltare = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV)

/** true cand exista un proiect Supabase legat (URL + cheia de server). */
export function supabaseLegat(): boolean {
  return Boolean(variabila('PUBLIC_SUPABASE_URL') && variabila('SUPABASE_SERVICE_ROLE_KEY'))
}

/** Adresa publica a site-ului, fara slash la final. */
export function adresaSite(): string {
  return (variabila('PUBLIC_SITE_URL') || 'http://localhost:4321').replace(/\/+$/, '')
}
