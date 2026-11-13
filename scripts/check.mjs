import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'))
const pathPattern = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/
const validToc = toc => Number.isInteger(toc?.minDepth) && Number.isInteger(toc?.maxDepth) && toc.minDepth >= 2 && toc.maxDepth <= 6 && toc.minDepth <= toc.maxDepth
assert.equal(manifest.version, 1)
assert(manifest.title?.trim())
assert(validToc(manifest.toc), 'TOC 层级须在 2–6 之间')
const pages = [...manifest.groups.flatMap(group => group.pages), ...(manifest.unlisted || [])]
const paths = new Set()
const groups = new Set()
for (const group of manifest.groups) {
  assert(pathPattern.test(group.id) && !groups.has(group.id) && group.title?.trim() && group.pages.length, `分组无效: ${group.id}`)
  groups.add(group.id)
}
const contents = []
for (const page of pages) {
  assert(pathPattern.test(page.path) && !paths.has(page.path), `重复或无效路径: ${page.path}`)
  assert(page.title?.trim() && page.description?.trim(), `缺少标题或摘要: ${page.path}`)
  if (page.toc) assert(validToc(page.toc), `TOC 层级无效: ${page.path}`)
  paths.add(page.path)
  const text = readFileSync(resolve(root, 'pages', `${page.path}.md`), 'utf8')
  assert(text.trim(), `正文为空: ${page.path}`)
  contents.push({ path: page.path, text })
}
assert(paths.has(manifest.entry), '入口文档不存在')
assert.equal(manifest.entry, 'introduction', '全站第一篇作为文档入口')
assert.equal(manifest.redirects?.['usage/common'], 'introduction', '旧教程 URL 统一跳转全站第一篇')
for (const [from, to] of Object.entries(manifest.redirects || {})) assert(pathPattern.test(from) && !paths.has(from) && paths.has(to), `重定向无效: ${from}`)
for (const page of contents) {
  for (const match of page.text.matchAll(/\]\((\/docs\/[^)\s#]+)(?:#[^)]*)?\)/g)) {
    const path = match[1].slice(6).replace(/\/$/, '')
    assert(paths.has(path) || Object.hasOwn(manifest.redirects || {}, path), `文档内链不存在: ${page.path} -> ${match[1]}`)
  }
  for (const match of page.text.matchAll(/\]\((\/docs-assets\/[^)\s]+)\)/g)) {
    const asset = decodeURIComponent(match[1].slice(13))
    assert(!asset.split('/').includes('..') && existsSync(resolve(root, 'assets', asset)), `图片不存在: ${page.path} -> ${match[1]}`)
  }
}
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name)
    assert(!entry.isSymbolicLink(), `不允许符号链接: ${path}`)
    if (entry.isDirectory()) walk(path)
    else if (entry.name.endsWith('.md')) assert(paths.has(relative(resolve(root, 'pages'), path).replaceAll('\\', '/').slice(0, -3)), `文档未在 manifest 中登记: ${path}`)
  }
}
walk(resolve(root, 'pages'))
console.log(`文档检查通过：${pages.length} 篇正文、${groups.size} 个分组。`)
