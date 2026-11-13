import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadDocumentation, buildSearchIndex, escapeHtml as esc, assetContentType } from './docs-content.mjs'

import { pageSeo, siteOrigin as origin } from '../src/shared/seo.ts'
const href = page => `/docs/${page.path}`
const json = value => JSON.stringify(value).replace(/</g, '\\u003c')

export function structuredData(page, siteTitle) {
  return pageSeo(page, { title: siteTitle }).structuredData
}

export function withMetadata(template, seo) {
  const cleaned = template.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b(?=[^>]*(?:name=["'](?:description|keywords|robots|twitter:[^"']+)["']|property=["']og:[^"']+["']))[^>]*>/gi, '')
    .replace(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/gi, '')
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
  const meta = (entries, attr) => Object.entries(entries).map(([key, value]) => `<meta ${attr}="${key}" content="${esc(value)}">`).join('\n')
  return cleaned.replace('</head>', `<title>${esc(seo.title)}</title>
<meta name="description" content="${esc(seo.description)}">
<meta name="robots" content="${seo.robots}">
<link rel="canonical" id="canonical-tag" href="${esc(seo.url)}">
${meta(seo.openGraph, 'property')}
${meta(seo.twitter, 'name')}
${seo.structuredData ? `<script id="docs-structured-data" type="application/ld+json">${json(seo.structuredData)}</script>` : ''}
</head>`)
}

export function staticDocument(template, page, docs) {
  const { manifest, pages } = docs
  let html = withMetadata(template, pageSeo(page, manifest))
  const metadata = `<script>document.documentElement.classList.add('docs-enhanced')</script>
<style>
:root{color-scheme:light dark;--static-bg:#fff;--static-ink:#111827;--static-muted:#475569;--static-line:#c7d0dc;--static-soft:#f3f5f7;--static-link:#1d4ed8}
@media(prefers-color-scheme:dark){:root{--static-bg:#111a25;--static-ink:#f5f7fb;--static-muted:#c3ccd7;--static-line:#334155;--static-soft:#1b2836;--static-link:#9bc3ff}body{background:var(--static-bg);color:var(--static-ink)}}
.docs-enhanced #docs-static{visibility:hidden}
#docs-static{max-width:1200px;margin:32px auto;padding:24px;display:grid;grid-template-columns:240px minmax(0,1fr) 200px;gap:32px;font:16px/1.7 system-ui;color:var(--static-ink);background:var(--static-bg)}
#portal-static{max-width:920px;margin:0 auto;padding:32px 24px 48px;font:16px/1.7 system-ui;color:var(--static-ink);background:var(--static-bg)}
#portal-static a{color:var(--static-link)}
#docs-static img{max-width:100%;height:auto}#docs-static pre{overflow:auto;background:var(--static-soft);padding:16px}#docs-static a{color:var(--static-link)}#docs-static nav ul{padding-left:20px}#docs-static .docs-callout{padding:16px;border-left:4px solid var(--static-link);background:var(--static-soft)}#docs-static table{border-collapse:collapse}#docs-static td,#docs-static th{border:1px solid var(--static-line);padding:8px}#docs-static h1,#docs-static h2,#docs-static h3{scroll-margin-top:24px}#docs-static .docs-static-outline{position:sticky;top:24px;align-self:start;max-height:calc(100vh - 48px);overflow:auto;border-left:1px solid var(--static-line);padding-left:16px;font-size:14px;color:var(--static-muted)}
@media(max-width:1199px){#docs-static{grid-template-columns:240px minmax(0,1fr)}#docs-static .docs-static-outline{display:none}}@media(max-width:768px){#docs-static{display:block;margin:0;padding:16px}#docs-static>nav{margin-bottom:24px}}
</style>`
  html = html.replace('</head>', metadata + '\n</head>')
  const pageLink = p => `<li><a href="${href(p)}"${p.path === page.path ? ' aria-current="page"' : ''}>${esc(p.navTitle || p.title)}</a></li>`
  const navigation = manifest.groups.map(group => group.standalone ? pageLink(group.pages[0]) : `<li>${esc(group.title)}<ul>${group.pages.map(pageLink).join('')}</ul></li>`).join('')
  const ordered = pages.filter(p => p.index !== false)
  const index = ordered.findIndex(p => p.path === page.path)
  const neighbors = index < 0 ? [] : [ordered[index - 1], ordered[index + 1]].filter(Boolean)
  const toc = page.headings.length ? `<aside class="docs-static-outline"><nav aria-label="本页目录"><strong>本页目录</strong><ul>${page.headings.map(h => `<li><a href="#${encodeURIComponent(h.id)}">${esc(h.text)}</a></li>`).join('')}</ul></nav></aside>` : ''
  const content = `<div id="docs-static"><nav aria-label="文档导航"><a href="https://www.mefrp.com/">返回主站</a><ul>${navigation}</ul></nav><main><nav aria-label="面包屑"><a href="/docs/">${esc(manifest.title)}</a> / ${esc(page.group)} / ${esc(page.title)}</nav><article>${page.html}</article><footer><a href="https://github.com/MagicEdgeNet/ME-Frp-v5-Docs/edit/main/pages/${page.path}.md">在 GitHub 编辑此页</a><nav aria-label="相邻文档">${neighbors.map(p => `<a href="${href(p)}">${esc(p.navTitle || p.title)}</a>`).join(' · ')}</nav></footer></main>${toc}</div>`
  if (!/<div id="app"><\/div>/.test(html)) throw new Error('找不到文档静态正文挂载点')
  return html.replace('<div id="app"></div>', `<div id="app">${content}</div>`)
}

export function docsPlugin() {
  let root
  let contentRoot
  let docs
  const refresh = () => {
    const loaded = loadDocumentation(contentRoot)
    docs = { ...loaded, searchIndex: buildSearchIndex(loaded.publicPages.map(page => loaded.compiled.get(page.path))) }
    return docs
  }
  return {
    name: 'community-documentation', enforce: 'post',
    configResolved(config) {
      root = config.root
      contentRoot = root
      refresh()
    },
    configureServer(server) {
      server.watcher.add(contentRoot)
      server.watcher.on('change', path => {
        if (![resolve(root, 'manifest.json'), resolve(root, 'pages') + '/', resolve(root, 'assets') + '/'].some(prefix => path === prefix || path.startsWith(prefix))) return
        try { refresh(); server.ws.send({ type: 'full-reload' }) } catch (error) { server.config.logger.error(error.message) }
      })
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url, 'http://localhost').pathname
        if (pathname === '/_docs-search.json') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          return res.end(json(docs.searchIndex))
        }
        if (pathname.startsWith('/_docs-data/') && pathname.endsWith('.json')) {
          const page = docs.compiled.get(pathname.slice(12, -5))
          if (!page) { res.statusCode = 404; return res.end('Document not found') }
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          return res.end(json({ html: page.html, headings: page.headings }))
        }
        if (pathname.startsWith('/_docs/') && pathname.endsWith('.md')) {
          const page = docs.compiled.get(pathname.slice(7, -3))
          if (!page) { res.statusCode = 404; return res.end('Document not found') }
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
          return res.end(page.markdown)
        }
        if (pathname.startsWith('/docs-assets/')) {
          let asset
          try { asset = decodeURIComponent(pathname.slice(13)) } catch { res.statusCode = 400; return res.end() }
          if (!docs.assets.includes(asset)) { res.statusCode = 404; return res.end() }
          res.setHeader('Content-Type', assetContentType(asset))
          return res.end(readFileSync(resolve(contentRoot, 'assets', asset)))
        }
        next()
      })
    },
    configurePreviewServer(server) {
      // Vite preview 的 history fallback 不会为无尾斜杠 URL 查找目录 index.html。
      // 与生产托管的 try_files $uri/index.html 规则保持一致。
      server.middlewares.use((req, res, next) => {
        const path = new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '')
        if (path !== '/docs' && !path.startsWith('/docs/')) return next()
        const key = path.slice(6)
        if (key && !docs.compiled.has(key) && !Object.hasOwn(docs.manifest.redirects || {}, key)) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          return res.end(withMetadata(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"></head><body><h1>文档未找到</h1><a href="/docs/">返回文档</a></body></html>`, pageSeo(undefined, docs.manifest, `/docs/${key}`)))
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.end(readFileSync(resolve(root, server.config.build.outDir, `docs/${key ? key + '/' : ''}index.html`)))
      })
    },
    generateBundle(_options, bundle) {
      const index = bundle['index.html']
      if (!index || index.type !== 'asset') throw new Error('无法生成文档静态 HTML：缺少入口 HTML')
      const home = docs.compiled.get('home')
      if (!home) throw new Error('无法生成站点首页：manifest 缺少 home 页面')
      const homeTemplate = String(index.source)
      const homeMarkup = `<main id="portal-static">${home.html}</main>`
      const homeDocument = withMetadata(homeTemplate, pageSeo(undefined, docs.manifest, '/'))
        .replace('</head>', `<style>:root{color-scheme:light dark;--static-bg:#fff;--static-ink:#111827;--static-link:#1d4ed8}@media(prefers-color-scheme:dark){:root{--static-bg:#111a25;--static-ink:#f5f7fb;--static-link:#9bc3ff}body{background:var(--static-bg);color:var(--static-ink)}}#portal-static{max-width:920px;margin:0 auto;padding:32px 24px 48px;font:16px/1.7 system-ui;color:var(--static-ink);background:var(--static-bg)}#portal-static a{color:var(--static-link)}</style></head>`)
        .replace('<div id="app"></div>', `<div id="app">${homeMarkup}</div>`)
      const emit = (fileName, source) => this.emitFile({ type: 'asset', fileName, source })
      for (const page of docs.compiled.values()) {
        emit(`docs/${page.path}/index.html`, staticDocument(homeTemplate, page, docs))
        emit(`_docs-data/${page.path}.json`, json({ html: page.html, headings: page.headings }))
        emit(`_docs/${page.path}.md`, page.markdown)
      }
      emit('docs/index.html', staticDocument(homeTemplate, docs.compiled.get(docs.manifest.entry), docs))
      for (const [from, to] of Object.entries(docs.manifest.redirects || {})) {
        const target = `/docs/${to}`
        emit(`docs/${from}/index.html`, `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${origin}${target}"><script>location.replace(${json(target)}+location.search+location.hash)</script><meta http-equiv="refresh" content="0;url=${target}"><title>文档已移动</title></head><body><a href="${target}">前往文档</a></body></html>`)
      }
      for (const asset of docs.assets) emit(`docs-assets/${asset}`, readFileSync(resolve(contentRoot, 'assets', asset)))
      index.source = homeDocument
      const sitemap = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + docs.pages.filter(page => page.index !== false && page.path !== 'home').map(page => `<url><loc>${origin}${href(page)}</loc></url>`).join('') + `<url><loc>${origin}/</loc></url></urlset>`
      emit('_docs-search.json', json(docs.searchIndex))
      emit('sitemap.xml', sitemap)
    }
  }
}
