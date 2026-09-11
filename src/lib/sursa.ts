/**
 * Sursa vizitei (tiktok, instagram, facebook...), citita din adresa paginii,
 * nu din browser: site-ul nu scrie nimic in localStorage sau cookie-uri, deci
 * nu are nevoie de banner de consimtamant. Base.astro poarta parametrul
 * `ref` pe linkurile interne, ca sa ajunga pana la formular.
 */
export function sursaVizitei(): string {
  try {
    const p = new URLSearchParams(location.search)
    const sursa = (p.get('ref') || p.get('utm_source') || '').trim().toLowerCase()
    return sursa.replace(/[^a-z0-9._-]/g, '').slice(0, 40)
  } catch {
    return ''
  }
}
