import manifest from '../../manifest.json'
import { pageSeo } from './seo'

export interface DocPage {
  path: string
  title: string
  description: string
  navTitle?: string
  icon?: string
  index?: boolean
  toc?: { minDepth: number; maxDepth: number }
}
export const docsManifest = manifest
export const docGroups: { id: string; title: string; icon?: string; standalone?: boolean; pages: DocPage[] }[] = manifest.groups
export const docPages: DocPage[] = [...docGroups.flatMap(group => group.pages), ...manifest.unlisted]
export const orderedDocPages = docGroups.flatMap(group => group.pages).filter(page => page.index !== false)
export const docPath = (path: string) => `/docs/${path}`
export const findDocPage = (path: string) => docPages.find(page => docPath(page.path) === path.replace(/\/$/, ''))
export const docNeighbors = (path: string) => {
  const index = orderedDocPages.findIndex(page => docPath(page.path) === path.replace(/\/$/, ''))
  return { previous: index > 0 ? orderedDocPages[index - 1] : undefined, next: index >= 0 ? orderedDocPages[index + 1] : undefined }
}

export function updateDocSeo(page: DocPage | undefined, path: string) {
  const seo = pageSeo(page, manifest, path)
  document.title = seo.title
  const setMeta = (key: string, content: string, property = false) => {
    const attr = property ? 'property' : 'name'
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
    el.content = content
  }
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove())
  setMeta('robots', seo.robots)
  setMeta('description', seo.description)
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
  canonical.href = seo.url
  for (const [key, value] of Object.entries(seo.openGraph)) setMeta(key, value, true)
  for (const [key, value] of Object.entries(seo.twitter)) setMeta(key, value)
  if (!seo.structuredData) return
  const script = document.createElement('script')
  script.id = 'docs-structured-data'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(seo.structuredData)
  document.head.appendChild(script)
}
