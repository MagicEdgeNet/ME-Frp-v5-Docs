import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, relative, extname } from 'node:path'
import { Marked } from 'marked'

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
export const slugify = value => value.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').replace(/^(\d)/, 'h-$1')
const safePath = value => typeof value === 'string' && /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(value)

function safeHref(value) {
  // Never let community content inject executable URLs, including encoded schemes.
  let decoded
  try { decoded = decodeURIComponent(value).replace(/[\s\u0000-\u001f]/g, '') } catch { return '#' }
  if (/^(?:javascript|data|vbscript):/i.test(decoded) || decoded.startsWith('//')) return '#'
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded) && !/^(?:https?|mailto|ms-settings):/i.test(decoded)) return '#'
  if (/^\/(?:dashboard|auth)(?:\/|$)/.test(value) || value === '/') return `https://www.mefrp.com${value}`
  return value
}

export function renderDocument(markdown, toc = { minDepth: 2, maxDepth: 3 }) {
  const headings = []
  const ids = new Set()
  const links = []
  const parser = new Marked({ gfm: true, breaks: true })
  parser.use({
    renderer: {
      html({ text }) {
        // Only inert typography tags are accepted; no arbitrary attributes,
        // containers, event handlers or executable HTML from community content.
        return text.split(/(<[^>]*>)/g).map(part => {
          if (/^<\/?(?:u|mark|sub|sup|small|big|cite|code|abbr)\s*>$/i.test(part)) return part
          const abbreviation = /^<abbr\s+title=(?:"([^"]*)"|'([^']*)')\s*>$/i.exec(part)
          if (abbreviation) return `<abbr title="${escapeHtml(abbreviation[1] ?? abbreviation[2])}">`
          return escapeHtml(part)
        }).join('')
      },
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        const text = html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        const base = slugify(text) || `heading-${headings.length + 1}`
        let id = base
        for (let suffix = 2; ids.has(id); suffix++) id = `${base}-${suffix}`
        ids.add(id)
        headings.push({ id, text, depth })
        return `<h${depth} id="${escapeHtml(id)}">${html}</h${depth}>\n`
      },
      code({ text, lang }) {
        const language = (lang || 'text').trim().split(/[ \t]/, 1)[0]
        return `<figure class="docs-code-block"><figcaption class="docs-code-toolbar"><span class="docs-code-language">${escapeHtml(language)}</span></figcaption><pre><code class="language-${escapeHtml(language)}">${escapeHtml(text)}</code></pre></figure>\n`
      },
      link({ href, title, tokens }) {
        links.push(href)
        return `<a href="${escapeHtml(safeHref(href))}"${title ? ` title="${escapeHtml(title)}"` : ''}>${this.parser.parseInline(tokens)}</a>`
      },
      image({ href, title, text }) {
        links.push(href)
        return `<img src="${escapeHtml(safeHref(href))}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy">`
      }
    },
    extensions: [{
      name: 'admonition', level: 'block',
      start(source) { return source.indexOf(':::') },
      tokenizer(source) {
        const match = /^:::(info|tip|warning|error|success|default)(?:[ \t]+([^\n]*))?\n([\s\S]*?)\n:::[ \t]*(?:\n|$)/.exec(source)
        if (!match) return undefined
        return { type: 'admonition', raw: match[0], kind: match[1], title: match[2] || match[1], tokens: this.lexer.blockTokens(match[3]) }
      },
      renderer(token) {
        return `<aside class="docs-callout docs-callout-${token.kind}" data-docs-alert data-type="${escapeHtml(token.kind)}" data-title="${escapeHtml(token.title)}"><strong>${escapeHtml(token.title)}</strong><div class="docs-callout-body">${this.parser.parse(token.tokens)}</div></aside>\n`
      }
    }]
  })
  const html = parser.parse(markdown)
  return { html, headings: headings.filter(h => h.depth >= toc.minDepth && h.depth <= toc.maxDepth), allHeadings: headings, links }
}

export function loadDocumentation(root) {
  const manifestPath = resolve(root, 'manifest.json')
  if (!existsSync(manifestPath)) throw new Error('缺少 manifest.json，请从文档仓库根目录运行构建')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (manifest.version !== 1 || !manifest.title?.trim() || !Array.isArray(manifest.groups)) throw new Error('无效的文档 manifest')
  const toc = manifest.toc
  if (!Number.isInteger(toc?.minDepth) || !Number.isInteger(toc?.maxDepth) || toc.minDepth < 2 || toc.maxDepth > 6 || toc.minDepth > toc.maxDepth) throw new Error('无效的 TOC 标题层级')
  const pages = []
  const seen = new Set()
  const groupIds = new Set()
  for (const group of manifest.groups) {
    if (!safePath(group.id) || groupIds.has(group.id) || !group.title?.trim() || !Array.isArray(group.pages) || !group.pages.length) throw new Error('无效或重复的文档分组')
    groupIds.add(group.id)
    pages.push(...group.pages.map(page => ({ ...page, group: group.title })))
  }
  pages.push(...(manifest.unlisted || []).map(page => ({ ...page, group: '维护者参考' })))
  const compiled = new Map()
  for (const page of pages) {
    if (!safePath(page.path) || seen.has(page.path) || !page.title?.trim() || !page.description?.trim()) throw new Error(`无效或重复的文档元数据: ${page.path}`)
    seen.add(page.path)
    if (page.toc && (!Number.isInteger(page.toc.minDepth) || !Number.isInteger(page.toc.maxDepth) || page.toc.minDepth < 2 || page.toc.maxDepth > 6 || page.toc.minDepth > page.toc.maxDepth)) throw new Error(`无效的页内目录层级: ${page.path}`)
    const markdown = readFileSync(resolve(root, 'pages', `${page.path}.md`), 'utf8')
    const result = renderDocument(markdown, page.toc || toc)
    // 只迁移内容，不强制改写历史正文标题或补写一级标题。
    compiled.set(page.path, { ...page, ...result, markdown })
  }
  for (const file of listFiles(resolve(root, 'pages'))) {
    if (file.endsWith('.md') && !seen.has(file.slice(0, -3))) throw new Error(`正文未登记在 manifest: ${file}`)
  }
  if (!seen.has(manifest.entry)) throw new Error('文档入口不存在')
  for (const [from, to] of Object.entries(manifest.redirects || {})) {
    if (!safePath(from) || seen.has(from) || !seen.has(to)) throw new Error(`无效的文档重定向: ${from}`)
  }
  const assets = listFiles(resolve(root, 'assets'))
  for (const page of compiled.values()) {
    for (const href of page.links) {
      const url = new URL(href, `https://docs.mefrp.com/docs/${page.path}`)
      if (url.origin !== 'https://docs.mefrp.com') continue
      if (url.pathname.startsWith('/docs-assets/') && !assets.includes(decodeURIComponent(url.pathname.slice('/docs-assets/'.length)))) throw new Error(`文档资源不存在: ${page.path} -> ${href}`)
      if (!url.pathname.startsWith('/docs/')) continue
      const target = url.pathname.slice(6).replace(/\/$/, '')
      const canonical = manifest.redirects?.[target] || target
      if (!compiled.has(canonical)) throw new Error(`文档内链不存在: ${page.path} -> ${href}`)
      if (url.hash) {
        const id = decodeURIComponent(url.hash.slice(1))
        if (!compiled.get(canonical).allHeadings.some(h => h.id === id)) throw new Error(`文档锚点不存在: ${page.path} -> ${href}`)
      }
    }
  }
  return { manifest, pages, compiled, assets }
}

export function listFiles(root) {
  if (!existsSync(root)) return []
  const result = []
  function walk(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (item.name.startsWith('.')) continue
      const path = resolve(dir, item.name)
      if (item.isSymbolicLink()) throw new Error(`不允许文档资源符号链接: ${path}`)
      if (item.isDirectory()) walk(path)
      else if (item.isFile()) result.push(relative(root, path).split('\\').join('/'))
    }
  }
  walk(root)
  return result
}

export function assetContentType(path) {
  return ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.pdf': 'application/pdf' })[extname(path)] || 'application/octet-stream'
}
