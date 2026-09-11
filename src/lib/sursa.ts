/** Sursa vizitei, retinuta de Base.astro in localStorage. */
export function sursaVizitei(): string {
  try {
    return localStorage.getItem('ddf-sursa') ?? ''
  } catch {
    return ''
  }
}
