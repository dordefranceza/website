// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'
import icon from 'astro-icon'
import tailwindcss from '@tailwindcss/vite'
import Icons from 'unplugin-icons/vite'

/** `astro build`, nu `astro dev`. Unele setari au voie doar la build. */
const LA_BUILD = process.argv.includes('build')

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
    // /confirma/ e o pagina privata, ajunsi acolo doar cu codul din email.
    sitemap({ filter: (p) => !p.includes('/admin') && !p.includes('/confirma'), customPages: ADRESE_BLOG }),
  ],
  vite: {
    plugins: [tailwindcss(), Icons({ compiler: 'jsx', jsx: 'react' })],
    // sanitize-html e CommonJS si cere htmlparser2, care e doar ESM. Lasat pe
    // dinafara pachetului, Node de pe Vercel crapa cu ERR_REQUIRE_ESM si /blog/
    // da 500. Impachetat aici, Rollup rezolva importurile la build.
    //
    // Numai la build: in dezvoltare, Vite le leaga singur, iar fortarea lor in
    // pachet arunca ReferenceError pe fiecare ruta care trece prin markdown.
    ssr: LA_BUILD ? { noExternal: ['sanitize-html', 'htmlparser2', 'is-plain-object'] } : {},
  },
  /*
   * Paza de CSRF a lui Astro, OPRITA dinadins, fiindca o facem noi.
   *
   * `checkOrigin` compara antetul `origin` cu originea din `request.url`. In
   * spatele proxy-ului de pe Vercel cele doua nu ies mereu la fel, iar Astro
   * respinge cererea INAINTE sa ajunga la pagina, cu „Cross-site POST form
   * submissions are forbidden". Artiom a apasat „Confirm" din emailul primit
   * pe telefon si exact asta a primit: o pagina neagra cu textul ala, iar
   * lectia n-a fost confirmata niciodata.
   *
   * Se observa doar la formularele HTML adevarate: restul site-ului trimite
   * JSON prin fetch, iar paza lui Astro nu se uita la JSON. De aceea programarea
   * de pe site mergea si numai confirmarea din email cadea.
   *
   * Ce ramane in loc: `origineOk` din src/server/http.ts, care verifica acelasi
   * antet dar fata de o lista scrisa de noi, si care respinge orice POST fara
   * `origin`. Vezi si src/pages/confirma.astro, care il cheama.
   */
  security: { checkOrigin: false },

  // Tot CSS-ul intra in HTML: o cerere blocanta mai putin inainte de primul pixel.
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
})
