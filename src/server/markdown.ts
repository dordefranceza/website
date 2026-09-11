/**
 * Markdown -> HTML curat, pentru articolele scrise in cabinet.
 * Sanitizarea e obligatorie: textul vine dintr-un editor, nu din cod, si ar
 * ajunge in pagina fiecarui vizitator.
 */
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

marked.setOptions({ gfm: true, breaks: false })

export function markdownLaHtml(md: string): string {
  const brut = marked.parse(md ?? '', { async: false }) as string
  return sanitizeHtml(brut, {
    allowedTags: ['h2', 'h3', 'h4', 'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'strong', 'em', 'code', 'pre', 'br', 'hr', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    allowedAttributes: { a: ['href', 'title', 'target', 'rel'], img: ['src', 'alt', 'title', 'width', 'height'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (tag, attribs) => {
        const href = attribs.href ?? ''
        const extern = /^https?:\/\//i.test(href) && !/dordefranceza/i.test(href)
        return { tagName: tag, attribs: extern ? { ...attribs, target: '_blank', rel: 'noopener nofollow' } : attribs }
      },
      img: (tag, attribs) => ({ tagName: tag, attribs: { ...attribs, loading: 'lazy', decoding: 'async' } }),
    },
    // O imagine fara adresa reala (http(s) sau un fisier de pe site) nu are ce cauta in articol.
    exclusiveFilter: (cadru) => cadru.tag === 'img' && !/^(https?:\/\/|\/)/.test(cadru.attribs.src ?? ''),
  })
}

/** Textul simplu din markdown, pentru rezumat automat si pentru meta descriere. */
export function textSimplu(md: string, maxim = 160): string {
  const t = (md ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (t.length <= maxim) return t
  const taiat = t.slice(0, maxim)
  return `${taiat.slice(0, Math.max(taiat.lastIndexOf(' '), 60))}…`
}

/** Slug din titlu: diacriticele romanesti devin litere simple. */
export function slugDin(titlu: string): string {
  return (titlu ?? '')
    .toLowerCase()
    .replace(/ă|â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș|ş/g, 's')
    .replace(/ț|ţ/g, 't')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Minute de citit, la 200 de cuvinte pe minut. */
export function minuteCitit(md: string): number {
  const cuvinte = (md ?? '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(cuvinte / 200))
}
