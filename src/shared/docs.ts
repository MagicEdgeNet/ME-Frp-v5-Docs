import manifest from '../../manifest.json'

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

export function updateDocSeo(page: DocPage | undefined) {
  const setMeta = (key: string, content: string, property = false) => {
    const attr = property ? 'property' : 'name'
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
    el.content = content
  }
  document.getElementById('docs-structured-data')?.remove()
  setMeta('robots', page?.index === false ? 'noindex,follow' : 'index,follow')
  const title = document.title
  const description = page?.description || 'ME Frp 幻缘映射使用文档、客户端教程与常见问题。'
  setMeta('description', description)
  const url = `https://docs.mefrp.com${page ? docPath(page.path) : location.pathname}`
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
  canonical.href = url
  for (const [key, value] of Object.entries({ 'og:title': title, 'og:description': description, 'og:url': url, 'og:type': page ? 'article' : 'website' })) setMeta(key, value, true)
  for (const [key, value] of Object.entries({ 'twitter:title': title, 'twitter:description': description, 'twitter:url': url })) setMeta(key, value)
  if (!page) return
  // Remove homepage-only structured data when entering docs through SPA navigation.
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove())
  const script = document.createElement('script')
  script.id = 'docs-structured-data'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'TechArticle', headline: page.title, description: page.description, inLanguage: 'zh-CN', url },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: manifest.title, item: 'https://docs.mefrp.com/docs/' },
      { '@type': 'ListItem', position: 2, name: page.title, item: url }
    ] }
  ] })
  document.head.appendChild(script)
}
