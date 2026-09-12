// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'
import icon from 'astro-icon'
import tailwindcss from '@tailwindcss/vite'
import Icons from 'unplugin-icons/vite'

/** Adresa canonica a site-ului. Singurul loc de schimbat cand vine domeniul. */
const SITE_URL = (process.env.PUBLIC_SITE_URL ?? 'https://dordefranceza.vercel.app').replace(/\/+$/, '')

/**
 * Articolele publicate, pentru sitemap. Paginile de blog se genereaza la
 * cerere, deci integrarea de sitemap nu le vede: le cerem noi din baza de
 * date, la build, daca exista cheile. Fara chei, sitemap-ul are doar /blog/.
 */
async function adreseBlog() {
  const url = (process.env.PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')
  const cheie = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const lista = [`${SITE_URL}/blog/`]
  if (!url || !cheie) return lista
  try {
    const r = await fetch(`${url}/rest/v1/articole?select=slug&publicat=eq.true`, { headers: { apikey: cheie, Authorization: `Bearer ${cheie}` }, signal: AbortSignal.timeout(8000) })
    if (r.ok) for (const a of await r.json()) if (a.slug) lista.push(`${SITE_URL}/blog/${a.slug}/`)
  } catch (e) {
    console.warn('[sitemap] articolele nu au putut fi citite:', e instanceof Error ? e.message : e)
  }
  return lista
}
const ADRESE_BLOG = await adreseBlog()

export default defineConfig({
  site: SITE_URL,
  // Site static, pagina cu pagina. Adaptorul exista pentru functiile din
  // src/pages/api/ si pentru cabinet, care nu se pot congela in build.
  output: 'static',
  adapter: vercel(),
  integrations: [
    react(),
    icon({ include: { solar: ['*'] } }),
    sitemap({ filter: (p) => !p.includes('/cabinet'), customPages: ADRESE_BLOG }),
  ],
  vite: {
    plugins: [tailwindcss(), Icons({ compiler: 'jsx', jsx: 'react' })],
    // sanitize-html e CommonJS si cere htmlparser2, care e doar ESM. Lasat pe
    // dinafara pachetului, Node de pe Vercel crapa cu ERR_REQUIRE_ESM si /blog/
    // da 500. Impachetat aici, Rollup rezolva importurile la build.
    ssr: { noExternal: ['sanitize-html', 'htmlparser2', 'is-plain-object'] },
  },
  // Tot CSS-ul intra in HTML: o cerere blocanta mai putin inainte de primul pixel.
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
})
