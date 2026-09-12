/**
 * robots.txt, generat la build din PUBLIC_SITE_URL. Ca fisier static isi ducea
 * cu el domeniul vechi si trimitea Google spre alt sitemap dupa mutarea pe
 * domeniul propriu.
 */
import type { APIRoute } from 'astro'
import { adresaSite } from '../server/mediu'

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: ${adresaSite()}/sitemap-index.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
