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

export default defineConfig({
  site: SITE_URL,
  // Site static, pagina cu pagina. Adaptorul exista pentru functiile din
  // src/pages/api/ si pentru cabinet, care nu se pot congela in build.
  output: 'static',
  adapter: vercel(),
  integrations: [
    react(),
    icon({ include: { solar: ['*'] } }),
    sitemap({ filter: (p) => !p.includes('/cabinet') }),
  ],
  vite: {
    plugins: [tailwindcss(), Icons({ compiler: 'jsx', jsx: 'react' })],
  },
  build: { inlineStylesheets: 'never' },
  compressHTML: true,
})
