import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { loadDocumentation, renderDocument } from '../../scripts/docs-content.mjs'
import { staticDocument } from '../../scripts/docs-plugin.mjs'

const root = resolve(import.meta.dirname, '../..')
const docs = loadDocumentation(root)

test('community pages retain original Markdown headings and have stable generated TOC', () => {
  assert.equal(docs.pages.length, 22)
  for (const page of docs.compiled.values()) {
    assert.equal(new Set(page.allHeadings.map(h => h.id)).size, page.allHeadings.length)
    assert(page.headings.every(h => h.depth >= 2 && h.depth <= 3))
  }
})

test('headings and alert bodies use one compiler; duplicate headings get distinct anchors', () => {
  const page = renderDocument('# 标题\n\n## 重复\n\n## 重复\n\n:::warning 注意\n\n**安全配置**\n\n:::\n')
  assert.deepEqual(page.headings.map(h => h.id), ['重复', '重复-2'])
  assert.match(page.html, /docs-callout-warning/)
  assert.match(page.html, /<strong>安全配置<\/strong>/)
})

test('panel links use the main site while document links stay local', () => {
  const page = renderDocument('[下载](/dashboard/downloads) [登录](/auth/login) [文档](/docs/usage/common)')
  assert.match(page.html, /href="https:\/\/www\.mefrp\.com\/dashboard\/downloads"/)
  assert.match(page.html, /href="https:\/\/www\.mefrp\.com\/auth\/login"/)
  assert.match(page.html, /href="\/docs\/usage\/common"/)
})

test('community Markdown cannot inject scripts or executable links into static output', () => {
  const page = renderDocument('# 安全\n\n<script>alert(1)</script>\n\n[link](javascript:alert%281%29)\n\n![image](data:text/html,test)')
  assert(!page.html.includes('<script>'))
  assert(!page.html.includes('href="javascript:'))
  assert(!page.html.includes('src="data:'))
})

test('inert typography HTML is preserved while unsafe attributes remain escaped', () => {
  const source = '<u>Underline</u> <mark>Mark</mark> <sub>Subscript</sub> <sup>Superscript</sup> <small>Small</small> <big>Big</big> <abbr title="Attribute">Attr</abbr> <cite>Citation</cite> <code>Code</code>'
  const page = renderDocument(source)
  assert(page.html.includes(source))
  const unsafe = renderDocument('<u onclick="alert(1)">unsafe</u> <mark style="color:red">unsafe</mark>')
  assert(!unsafe.html.includes('<u onclick='))
  assert(!unsafe.html.includes('<mark style='))
})

test('static HTML includes actual body, navigation, metadata and breadcrumb schema without JavaScript', () => {
  for (const page of docs.compiled.values()) {
    const html = staticDocument('<html><head><title>首页</title><meta name="description" content="首页"><meta property="og:title" content="首页"></head><body><div id="app"></div></body></html>', page, docs)
    assert(html.includes(page.html))
    assert(html.includes(`<title>${page.title} | ${docs.manifest.title}</title>`))
    assert(html.includes(`content="${page.description}"`))
    assert(html.includes(`href="https://docs.mefrp.com/docs/${page.path}"`))
    assert.match(html, /BreadcrumbList/)
    assert.equal((html.match(/<title>/g) || []).length, 1)
    assert.equal((html.match(/property="og:title"/g) || []).length, 1)
    if (page.index === false) assert.match(html, /noindex,follow/)
  }
})

test('missing submodule and invalid manifests fail with actionable diagnostics', () => {
  const temp = mkdtempSync(resolve(tmpdir(), 'mefrp-docs-'))
  try {
    assert.throws(() => loadDocumentation(temp), /manifest/)
    mkdirSync(resolve(temp, 'pages'))
    const manifest = { version: 1, title: '社区文档', entry: 'start', toc: { minDepth: 2, maxDepth: 3 }, groups: [{ id: 'start', title: '入门', pages: [{ path: 'start', title: '开始', description: '快速开始' }] }] }
    writeFileSync(resolve(temp, 'manifest.json'), JSON.stringify(manifest))
    writeFileSync(resolve(temp, 'pages/start.md'), '# 开始\n\n[缺失页面](/docs/missing)')
    assert.throws(() => loadDocumentation(temp), /内链不存在/)
    writeFileSync(resolve(temp, 'pages/start.md'), '# 错误标题')
    const result = loadDocumentation(temp)
    assert.match(result.compiled.get('start').html, /错误标题/, '迁移不强制覆盖原文标题')
    manifest.groups[0].pages.push(manifest.groups[0].pages[0])
    writeFileSync(resolve(temp, 'manifest.json'), JSON.stringify(manifest))
    writeFileSync(resolve(temp, 'pages/start.md'), '# 开始')
    assert.throws(() => loadDocumentation(temp), /重复/)
  } finally { rmSync(temp, { recursive: true, force: true }) }
})

test('production build outputs each indexed doc in sitemap and omits maintenance examples', { skip: !process.env.MEFRP_CHECK_DIST }, () => {
  const sitemap = readFileSync(resolve(root, 'dist/sitemap.xml'), 'utf8')
  for (const page of docs.pages) {
    assert.equal(sitemap.includes(`https://docs.mefrp.com/docs/${page.path}</loc>`), page.index !== false)
    const html = readFileSync(resolve(root, `dist/docs/${page.path}/index.html`), 'utf8')
    assert(html.includes(docs.compiled.get(page.path).html))
    assert(!html.includes('/src/main.ts'))
    assert.match(html, /\/assets\/.*\.js/)
  }
})
