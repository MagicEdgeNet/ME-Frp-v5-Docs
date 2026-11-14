interface SeoPage {
  path: string
  title: string
  description: string
  index?: boolean
}
interface SeoManifest {
  title: string
  unlisted?: SeoPage[]
}
export const siteOrigin = 'https://docs.mefrp.com'

// Used by both the static compiler and SPA navigation. Never infer the target
// URL from location: beforeEach runs before the browser URL has changed.
export function pageSeo(page: SeoPage | undefined, manifest: SeoManifest, path = '/') {
  const homePage = manifest.unlisted?.find(item => item.path === 'home')
  const home = !page && path === '/'
  const title = page ? `${page.title} | ${manifest.title}` : home ? `${homePage?.title || manifest.title} | ${manifest.title}` : `文档未找到 | ${manifest.title}`
  const description = page?.description || (home
    ? homePage?.description || 'ME Frp 幻缘映射使用文档、客户端教程与常见问题。'
    : '此页面不存在，可能已移动或链接有误。请返回 ME Frp 文档首页查找。')
  const url = siteOrigin + (page ? `/docs/${page.path}` : path)
  const robots = page ? (page.index === false ? 'noindex,follow' : 'index,follow') : home ? 'index,follow' : 'noindex,follow'
  const website = { '@type': 'WebSite', name: manifest.title, url: siteOrigin + '/' }
  const structuredData = page ? {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'TechArticle', headline: page.title, description, inLanguage: 'zh-CN', url, isPartOf: website },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: manifest.title, item: siteOrigin + '/docs/' },
        { '@type': 'ListItem', position: 2, name: page.title, item: url }
      ] }
    ]
  } : home ? { '@context': 'https://schema.org', ...website, description, inLanguage: 'zh-CN' } : undefined
  return {
    title, description, url, robots, structuredData,
    openGraph: { 'og:title': title, 'og:description': description, 'og:url': url, 'og:type': page ? 'article' : 'website', 'og:site_name': manifest.title, 'og:locale': 'zh_CN' },
    twitter: { 'twitter:card': 'summary', 'twitter:title': title, 'twitter:description': description, 'twitter:url': url }
  }
}
