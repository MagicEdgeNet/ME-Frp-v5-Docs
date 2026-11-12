const assert = require('node:assert/strict')
const { chromium } = require('playwright-core')
const manifest = require('../../manifest.json')
const allPages = [...manifest.groups.flatMap(group => group.pages), ...manifest.unlisted]
const origin = process.env.MEFRP_PREVIEW_ORIGIN || 'http://127.0.0.1:4176'
assert(['127.0.0.1', 'localhost'].includes(new URL(origin).hostname))
let browser
;(async () => {
  browser = await chromium.launch({ executablePath: process.env.MEFRP_BROWSER_EXECUTABLE || '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' })
  await context.addInitScript(() => {
    window.__brandSeen = false
    new MutationObserver(() => {
      if (document.querySelector('.page-loading-screen')) window.__brandSeen = true
    }).observe(document, { childList: true, subtree: true })
  })
  const apiRequests = []
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin !== origin) {
      if (route.request().resourceType() === 'image' || url.hostname === 'img.fastmirror.net') return route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect width="640" height="320" fill="#2196f3"/></svg>' })
      return route.abort()
    }
    if (url.pathname.startsWith('/api/')) { apiRequests.push(url.pathname); return route.abort() }
    return route.continue()
  })
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${origin}/docs/usage/common`, { waitUntil: 'domcontentloaded' })
  assert.equal(await page.locator('#docs-static:visible').count(), 0, 'Static fallback does not flash a second layout before the app loads')
  assert.equal(await page.evaluate(() => performance.getEntriesByType('navigation')[0].type), 'navigate')
  await page.locator('.docs-page .markdown-container h1').waitFor()
  assert.equal(await page.evaluate(() => window.__brandSeen), true, 'Initial navigation plays the brand animation')
  await page.locator('.page-loading-screen').waitFor({ state: 'hidden' })
  assert.equal((await page.locator('.docs-page h1').textContent()).replace(/^#\s*/, ''), '通用客户端教程')
  assert.equal(await page.title(), '通用客户端 | 幻缘映射 V5 使用文档')
  await page.reload()
  assert.equal(await page.evaluate(() => performance.getEntriesByType('navigation')[0].type), 'reload')
  await page.locator('.docs-page .markdown-container h1').waitFor()
  assert.equal(await page.evaluate(() => window.__brandSeen), false, 'Browser refresh does not play the docs brand animation')
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://docs.mefrp.com/docs/usage/common')
  assert(await page.locator('.docs-toc .n-anchor').count() > 0)
  assert.equal(await page.locator('.docs-breadcrumb.n-breadcrumb').count(), 1)
  assert(await page.locator('.docs-toc a').count() > 0)
  assert.deepEqual(await page.locator('.docs-sider a').allTextContents(), [
    '常见报错速查', '通用客户端', 'Docker 容器', 'fnOS 飞牛私有云', '第三方客户端', '安全提醒',
    '账户相关', '网络相关', '客户端相关', '备案相关', '网站访问相关', '其他问题',
    'Minecraft 开服联机', 'Windows 远程桌面', 'Web 建站', '星露谷物语 联机', 'Navidrome 音乐流媒体',
    'VNC 远程访问', 'SSH 远程访问', 'SMB 文件共享', '幻兽帕鲁联机'
  ], '原侧栏页面名称和顺序保持不变')
  const sidebarGeometry = await page.evaluate(() => {
    const container = document.querySelector('.docs-sider-scroll .n-scrollbar-container')
    const rect = container.getBoundingClientRect()
    return { height: rect.height, bottom: rect.bottom, viewport: innerHeight }
  })
  assert(sidebarGeometry.height > 0)
  assert(Math.abs(sidebarGeometry.bottom - sidebarGeometry.viewport) <= 1, 'Docs sidebar fills the remaining height below the topbar')
  const outline = await page.locator('.docs-outline').boundingBox()
  const body = await page.locator('.docs-body-column').boundingBox()
  assert(outline.x >= body.x + body.width, 'TOC 位于正文右侧，而不是正文内部')
  assert.equal(await page.locator('.docs-outline').evaluate(el => getComputedStyle(el).position), 'sticky')
  assert(await page.evaluate(() => getComputedStyle(document.querySelector('.docs-scroll .n-scrollbar-container')).overscrollBehaviorY) === 'none', 'Docs main scroller prevents duplicate native pull-to-refresh')
  await page.locator('.docs-scroll > .n-scrollbar-container').evaluate(el => { el.scrollTop = 400 })
  await page.waitForTimeout(150)
  assert(await page.locator('.docs-scroll > .n-scrollbar-container').evaluate(el => el.scrollTop > 0), '正文确实发生滚动')
  const pinnedOutline = await page.locator('.docs-outline').boundingBox()
  assert(Math.abs(pinnedOutline.y - outline.y) <= 1, 'TOC 随正文滚动保持悬浮')
  await page.locator('.docs-scroll > .n-scrollbar-container').evaluate(el => { el.scrollTop = 0 })
  const tocId = await page.locator('.docs-toc a').first().getAttribute('href')
  await page.locator('.docs-toc a').first().click()
  assert(page.url().endsWith(tocId))
  assert.equal(await page.locator('.docs-page h1').count(), 1)
  assert.equal(await page.locator('.markdown-container a[href="https://www.mefrp.com/dashboard/downloads"]').count(), 1, 'Panel links leave the standalone docs origin')
  assert(await page.locator('.markdown-container .n-alert').count() > 0, 'Markdown alerts use Naive UI components')
  assert(await page.locator('.markdown-container .n-code').count() > 0, 'Code blocks use Naive UI code rendering')
  const copyButton = page.locator('.docs-code-copy').first().getByRole('button', { name: '复制代码' })
  await copyButton.click()
  await page.locator('.docs-code-copy button[aria-label="代码已复制"]').waitFor()
  const image = page.locator('.markdown-container img').first()
  await image.click()
  const imageModal = page.locator('.image-modal')
  await imageModal.waitFor({ state: 'visible' })
  await imageModal.getByTitle('向右旋转', { exact: true }).click()
  assert.match(await imageModal.locator('.modal-image').getAttribute('style'), /rotate\(90deg\)/)
  await imageModal.getByTitle('放大', { exact: true }).click()
  assert.match(await imageModal.locator('.modal-image').getAttribute('style'), /scale\(1\.1\)/)
  await imageModal.getByTitle('重置', { exact: true }).click()
  assert.match(await imageModal.locator('.modal-image').getAttribute('style'), /rotate\(0deg\) scale\(1\)/)
  const download = page.waitForEvent('download')
  await imageModal.getByTitle('下载', { exact: true }).click()
  await download
  // External hosts without CORS retain the explicit open-original fallback.
  await page.route('https://img.fastmirror.net/**', route => route.request().resourceType() === 'fetch' ? route.abort() : route.continue())
  const original = page.waitForEvent('popup')
  await imageModal.getByTitle('下载', { exact: true }).click()
  const originalPage = await original
  await originalPage.close()
  await page.getByText('图片来源不允许直接下载，已打开原图，请另存为', { exact: true }).waitFor()
  await page.unroute('https://img.fastmirror.net/**')
  await imageModal.getByTitle('关闭', { exact: true }).click()
  await imageModal.waitFor({ state: 'hidden' })

  await page.goto(`${origin}/docs/test`)
  await page.locator('.docs-data-table-scroll .n-data-table').first().waitFor()
  assert.equal(await page.locator('.markdown-container .n-alert').count(), 5, 'All alert types use NAlert')
  assert(await page.locator('.markdown-container .n-code').count() > 0)
  assert.equal(await page.locator('.markdown-container .n-data-table').count(), 1, 'Markdown table uses NDataTable')
  for (const tag of ['u', 'mark', 'sub', 'sup', 'small', 'big', 'abbr[title="Attribute"]', 'cite']) {
    assert.equal(await page.locator(`.markdown-container ${tag}`).count(), 1, `Preserves semantic HTML ${tag}`)
  }
  assert.equal(await page.locator('.markdown-container u').evaluate(el => getComputedStyle(el).textDecorationLine), 'underline')
  assert.notEqual(await page.locator('.markdown-container mark').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)')
  const inlineCodeStyle = await page.locator('.markdown-container :not(pre) > code:not(.n-code)').first().evaluate(el => ({ background: getComputedStyle(el).backgroundColor, radius: getComputedStyle(el).borderRadius }))
  assert.notEqual(inlineCodeStyle.background, 'rgba(0, 0, 0, 0)', 'Inline code has a visible background')
  assert.equal(inlineCodeStyle.radius, '4px')
  const quotePadding = await page.locator('.markdown-container blockquote').first().evaluate(el => parseFloat(getComputedStyle(el).paddingTop))
  assert(quotePadding >= 12, `Blockquotes have readable vertical padding: ${quotePadding}px`)
  assert.equal(await page.locator('.markdown-container .docs-code-toolbar').count(), await page.locator('.markdown-container .n-code').count())
  const tableBounds = await page.locator('.docs-data-table-scroll').first().evaluate(el => {
    const inner = el.querySelector('.n-scrollbar-container')
    return { clientWidth: inner.clientWidth, scrollWidth: inner.scrollWidth, pageWidth: document.documentElement.scrollWidth }
  })
  assert(tableBounds.scrollWidth >= tableBounds.clientWidth)
  assert(tableBounds.pageWidth <= 1440, 'Wide tables scroll inside their own container')
  await page.goto(`${origin}/docs/usage/common`)
  await page.locator('.docs-page .markdown-container h1').waitFor()
  await page.locator('.page-loading-screen').waitFor({ state: 'hidden' })
  const clickHalf = async (name, fraction) => {
    const button = page.getByRole('button', { name, exact: true })
    const rect = await button.boundingBox()
    const point = { x: rect.x + rect.width * fraction, y: rect.y + rect.height / 2 }
    assert(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.docs-sider-trigger'), point), 'Both halves of the trigger must be unobstructed')
    await page.mouse.click(point.x, point.y)
    await page.waitForTimeout(300)
  }
  for (const fraction of [0.25, 0.75]) {
    await clickHalf('收起侧栏', fraction)
    const geometry = await page.locator('.docs-sider').evaluate(sider => {
      const rect = sider.getBoundingClientRect()
      return { width: rect.width, collapsed: !!sider.querySelector('.n-menu--collapsed'), icons: [...sider.querySelectorAll('.n-menu-item-content__icon')].filter(el => el.getBoundingClientRect().width > 0).map(el => {
        const icon = el.getBoundingClientRect()
        return { width: icon.width, offset: icon.x + icon.width / 2 - rect.x - rect.width / 2 }
      }) }
    })
    assert.equal(geometry.width, 64)
    assert(geometry.collapsed)
    assert(geometry.icons.length > 0)
    for (const icon of geometry.icons) { assert.equal(Math.round(icon.width), 22); assert(Math.abs(icon.offset) <= 1) }
    await clickHalf('展开侧栏', fraction)
    assert.equal(await page.locator('.docs-sider').evaluate(el => el.getBoundingClientRect().width), 240)
  }
  await page.locator('.docs-neighbors a').last().click()
  await page.locator('.docs-page h1').filter({ hasText: 'Docker 容器教程' }).waitFor()
  assert.equal(await page.title(), 'Docker 容器 | 幻缘映射 V5 使用文档')
  assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), await page.title())
  assert((await page.locator('#docs-structured-data').textContent()).includes('Docker 容器'))
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.locator('.docs-outline').isVisible(), false, '窄屏不把悬浮 TOC 改成正文内联目录')
  assert.equal(await page.locator('.docs-sider').count(), 0)
  const navTrigger = page.getByRole('button', { name: '打开站点导航' })
  await navTrigger.click()
  const navPopover = page.locator('.docs-mobile-nav-menu')
  await navPopover.waitFor({ state: 'visible' })
  assert.deepEqual((await navPopover.locator('button').allTextContents()).map(text => text.trim()).filter(Boolean), ['首页', '管理面板'])
  assert.equal(await navPopover.locator('a[href^="/docs/"]').count(), 21, '所有文档导航直接显示在菜单内')
  const menuScroll = page.locator('.docs-mobile-nav-scroll > .n-scrollbar-container')
  const checkMenuBounds = async () => {
    const bounds = await menuScroll.evaluate(el => {
      const rect = el.getBoundingClientRect()
      return { width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom,
        viewportWidth: innerWidth, viewportHeight: innerHeight, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }
    })
    assert(bounds.width <= Math.min(320, bounds.viewportWidth - 32) + 1, 'Mobile menu width is capped')
    assert(bounds.height <= Math.min(600, bounds.viewportHeight * 0.7) + 1, 'Entire mobile menu height is capped')
    assert(bounds.right <= bounds.viewportWidth && bounds.bottom <= bounds.viewportHeight, 'Menu fits the viewport')
    assert(bounds.scrollHeight > bounds.clientHeight, 'Full navigation scrolls inside NScrollbar')
    await menuScroll.evaluate(el => { el.scrollTop = el.scrollHeight })
    assert(await menuScroll.evaluate(el => el.scrollTop > 0), 'Menu can scroll to the final document')
  }
  await checkMenuBounds()
  await page.setViewportSize({ width: 667, height: 375 })
  await checkMenuBounds()
  await page.setViewportSize({ width: 390, height: 844 })
  await navPopover.locator('a[href="/docs/app/ssh"]').click()

  await page.locator('.docs-page h1').filter({ hasText: 'SSH 远程命令行访问' }).waitFor()
  await navPopover.waitFor({ state: 'hidden' })
  const tocTrigger = page.locator('.toc-trigger')
  const tocBox = await tocTrigger.boundingBox()
  assert(Math.abs(tocBox.width - 390) <= 1, 'Second-level bar is a full-width TOC trigger')
  await tocTrigger.click()
  const tocDrawer = page.locator('.mobile-toc-drawer-panel')
  await tocDrawer.waitFor({ state: 'visible' })
  assert(await tocDrawer.locator('.mobile-toc-drawer a').count() > 0)
  const layerCheck = await page.evaluate(() => {
    const drawer = document.querySelector('.mobile-toc-drawer-panel').closest('.n-drawer-container')
    return ['.mobile-navbar', '.docs-sub-menu'].every(selector => {
      const bar = document.querySelector(selector)
      const rect = bar.getBoundingClientRect()
      return Number(getComputedStyle(bar).zIndex) > Number(getComputedStyle(drawer).zIndex)
        && bar.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))
    })
  })
  assert(layerCheck, 'Both top bars remain above the TOC mask and drawer')
  assert.equal(await tocDrawer.locator('.n-anchor').count(), 1)
  const activeItem = tocDrawer.locator('a:has([aria-current="location"])')
  assert.equal(await activeItem.count(), 1)
  assert.notEqual(await activeItem.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)', 'Current TOC item has a visible highlight')
  await page.waitForFunction(() => Math.abs(document.querySelector('.mobile-toc-drawer-panel').getBoundingClientRect().top - document.querySelector('.docs-sub-menu').getBoundingClientRect().bottom) <= 1)
  const drawerGeometry = await page.evaluate(() => ({
    barBottom: document.querySelector('.docs-sub-menu').getBoundingClientRect().bottom,
    drawerTop: document.querySelector('.mobile-toc-drawer-panel').getBoundingClientRect().top
  }))
  assert(Math.abs(drawerGeometry.drawerTop - drawerGeometry.barBottom) <= 1, `TOC drawer starts at second bar bottom: ${JSON.stringify(drawerGeometry)}`)
  const mobileTarget = await tocDrawer.locator('.mobile-toc-drawer a').first().getAttribute('href')
  await tocDrawer.locator('.mobile-toc-drawer a').first().click()
  assert(page.url().endsWith(mobileTarget))
  await tocDrawer.waitFor({ state: 'hidden' })
  await tocTrigger.click()
  await tocDrawer.waitFor({ state: 'visible' })
  const mask = page.locator('.n-drawer-container').filter({ has: tocDrawer }).locator('.n-drawer-mask')
  const maskBox = await mask.boundingBox()
  await page.mouse.click(maskBox.x + 10, maskBox.y + maskBox.height - 20)
  await tocDrawer.waitFor({ state: 'hidden' })
  await page.goto(`${origin}/docs/test`)
  await page.locator('.docs-data-table-scroll .n-data-table').first().waitFor()

  const mobileTableBounds = await page.locator('.docs-data-table-scroll').first().evaluate(el => {
    const inner = el.querySelector('.n-scrollbar-container')
    return { clientWidth: inner.clientWidth, scrollWidth: inner.scrollWidth, pageWidth: document.documentElement.scrollWidth }
  })
  assert(mobileTableBounds.scrollWidth > mobileTableBounds.clientWidth, 'Wide data tables scroll inside their own container on mobile')
  assert(mobileTableBounds.pageWidth <= page.viewportSize().width, 'Mobile tables do not widen the document')
  const codeColor = await page.locator('.docs-code-widget .n-code').first().evaluate(el => el.style.getPropertyValue('--n-text-color'))
  await page.getByRole('switch', { name: '切换主题', exact: true }).click()
  await page.waitForFunction(previous => document.querySelector('.docs-code-widget .n-code')?.style.getPropertyValue('--n-text-color') !== previous, codeColor)
  await page.getByRole('switch', { name: '切换主题', exact: true }).click()
  await page.setViewportSize({ width: 667, height: 375 })
  await tocTrigger.click()
  await page.waitForTimeout(400)
  const shortDrawer = await tocDrawer.boundingBox()
  assert(shortDrawer.y + shortDrawer.height <= 375 - 20, 'Short landscape drawer leaves uncovered mask area')
  const compactHeight = await tocDrawer.locator('.mobile-toc-drawer a').first().evaluate(el => el.getBoundingClientRect().height)
  assert(compactHeight <= 40, 'TOC entries use compact spacing')
  await page.goto(origin + '/docs/questions?from=legacy#answer')
  await page.waitForURL('**/docs/faq/account?from=legacy#answer')
  await page.locator('.docs-page .markdown-container h1').waitFor()
  await page.goto(origin + '/')
  await page.waitForURL('**/docs/usage/common')
  await page.locator('.docs-page .markdown-container h1').waitFor()
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://docs.mefrp.com/docs/usage/common')
  await page.locator('.page-loading-screen').waitFor({ state: 'hidden' })
  await page.reload()
  await page.locator('.docs-shell').waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('docs-theme')), 'light', 'Theme preference survives reload')
  assert.deepEqual(errors, [])
  assert.deepEqual(apiRequests, [], 'Standalone documentation never requests panel APIs')
  await context.close()
  const noJs = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' })
  await noJs.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
  const staticPage = await noJs.newPage()
  for (const { path } of allPages) {
    const response = await staticPage.goto(`${origin}/docs/${path}`)
    assert.equal(response.status(), 200)
    assert(await staticPage.locator('#docs-static article').isVisible())
    assert(await staticPage.locator('#docs-static nav a').count() >= 21)
    assert((await staticPage.locator('#docs-static article').innerText()).length > 0)
    assert.equal(await staticPage.locator('link[rel="canonical"]').getAttribute('href'), `https://docs.mefrp.com/docs/${path}`)
    assert.equal(await staticPage.locator('meta[name="description"]').count(), 1)
    if (path === 'usage/common') {
      assert(await staticPage.locator('#docs-static .docs-code-block pre code').count() > 0, 'Static code remains readable without JavaScript')
    }
  }
  const missing = await staticPage.goto(`${origin}/docs/does-not-exist`)
  assert.equal(missing.status(), 404)
  await staticPage.goto(origin + '/')
  assert(await staticPage.locator('#docs-static article').isVisible(), 'Root page is readable without JavaScript')
  await browser.close()
  console.log(JSON.stringify({ pass: true, sidebar: 'collapsed state, 22px centered icons, both halves clickable', navigation: 'shared order, SEO, mobile drawer, anchors', seo: `${allPages.length} production pages readable without JS`, images: 'preview, zoom, rotate, reset, download', errors }))
})().catch(async error => { console.error(error); await browser?.close(); process.exitCode = 1 })
