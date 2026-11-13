const assert = require('node:assert/strict')
const { chromium } = require('playwright-core')
const origin = process.env.MEFRP_PREVIEW_ORIGIN || 'http://127.0.0.1:4187'
assert(['127.0.0.1', 'localhost'].includes(new URL(origin).hostname))
let browser
;(async () => {
  browser = await chromium.launch({ executablePath: process.env.MEFRP_BROWSER_EXECUTABLE || '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce', serviceWorkers: 'block' })
  await context.addInitScript(() => {
    localStorage.setItem('token', 'LOCAL_REFRESH_FIXTURE')
    localStorage.setItem('group', 'vip')
    localStorage.setItem('sensitiveAdVisibility', 'false')
    localStorage.setItem('apiBaseUrl', `${location.origin}/api`)
    window.__documentId = Math.random()
    window.__brandSeen = false
    new MutationObserver(() => {
      if (document.querySelector('.page-loading-screen')) window.__brandSeen = true
    }).observe(document, { subtree: true, childList: true })
  })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin !== origin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    let data = {}
    if (url.pathname.endsWith('/user/info')) data = { userId: 42, username: '测试用户', email: 'test@example.invalid', group: 'vip', traffic: 1024 }
    if (url.pathname.endsWith('/notice') || url.pathname.endsWith('/popupNotice')) data = ''
    if (url.pathname.endsWith('/trafficStats')) data = { dates: [], trafficIn: [], trafficOut: [], totalTraffic: [] }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ code: 200, data }) })
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const cdp = await context.newCDPSession(page)
  async function swipe(x, y, dx, dy, cancel = false, release = true) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let step = 1; step <= 12; step++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * step / 12, y: y + dy * step / 12 }] })
      await page.waitForTimeout(20)
    }
    if (release) {
      await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] })
      await page.waitForTimeout(400)
    }
  }
  for (const [path, selector, ready] of [
    ['/docs/usage/common', '.docs-scroll > .n-scrollbar-container', '.docs-page .markdown-container h1'],

  ]) {
    await page.goto(origin + path, { waitUntil: 'domcontentloaded' })
    await page.locator(ready).waitFor()
    await page.locator('.page-loading-screen').waitFor({ state: 'hidden' })
    if (path.startsWith('/docs')) assert(await page.evaluate(() => window.__brandSeen), 'First direct docs navigation plays the brand animation')
    const id = await page.evaluate(() => window.__documentId)
    const scroller = page.locator(selector)
    assert.equal(await scroller.evaluate(el => getComputedStyle(el).overscrollBehaviorY), 'none', 'Native refresh is disabled only for the custom-refresh shell')
    await scroller.evaluate(el => {
      const nested = document.createElement('div')
      nested.id = 'nested-refresh-fixture'
      nested.style.cssText = 'height: 180px; overflow: auto; background: #ddd; margin-top: 20px'
      nested.innerHTML = '<div style="height: 500px">Nested scroll area</div>'
      el.querySelector('main, .docs-main').prepend(nested)
    })
    const nestedBox = await page.locator('#nested-refresh-fixture').boundingBox()
    await swipe(nestedBox.x + 20, nestedBox.y + 15, 0, 180)
    assert.equal(await page.evaluate(() => window.__documentId), id, 'Nested scroll area never triggers page refresh')
    await page.locator('#nested-refresh-fixture').evaluate(el => el.remove())
    await scroller.evaluate(el => { el.scrollTop = 0 })
    await swipe(180, 190, 130, 20)
    assert.equal(await page.evaluate(() => window.__documentId), id, 'Horizontal gestures do not refresh')
    await swipe(180, 190, 0, 55)
    assert.equal(await page.evaluate(() => window.__documentId), id, 'Short pull does not refresh')
    await swipe(180, 190, 0, 180, true)
    assert.equal(await page.evaluate(() => window.__documentId), id, 'Cancelled pull does not refresh')
    await scroller.evaluate(el => { const filler = document.createElement('div'); filler.style.height = '2000px'; el.append(filler); el.scrollTop = 300 })
    await swipe(180, 300, 0, 160)
    assert.equal(await page.evaluate(() => window.__documentId), id, 'Pulling while scrolled does not refresh')
    await scroller.evaluate(el => { el.scrollTop = 0 })
    await page.waitForTimeout(400)
    await swipe(180, 190, 0, 200, false, false)
    const gestureState = await scroller.evaluate(el => ({ top: el.scrollTop, target: document.elementFromPoint(180, 190)?.outerHTML.slice(0, 250) }))
    assert.equal(gestureState.top, 0, JSON.stringify(gestureState))
    const refreshHint = page.getByRole('status').filter({ hasText: '释放刷新' })
    await refreshHint.waitFor()
    const refreshHintBounds = await refreshHint.boundingBox()
    if (path.startsWith('/docs')) assert(refreshHintBounds.y >= 98, 'Pull-to-refresh feedback sits below both fixed mobile bars')
    const reloaded = page.waitForEvent('domcontentloaded')
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await reloaded
    await page.locator(ready).waitFor()
    assert.notEqual(await page.evaluate(() => window.__documentId), id, 'Releasing a full pull reloads the document')
    assert.equal(await page.evaluate(() => performance.getEntriesByType('navigation')[0].type), 'reload')
    if (path.startsWith('/docs')) assert.equal(await page.evaluate(() => window.__brandSeen), false, 'Pull-to-refresh skips the docs brand animation')
    assert.equal(await page.evaluate(() => scrollY), 0, 'Only the internal content container scrolls')
  }
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ pass: true, checks: 'real touch reload, threshold, cancellation, nested scrolling, direction, navigation type, docs brand policy', errors }))
  await browser.close()
})().catch(async error => { console.error(error); await browser?.close(); process.exitCode = 1 })
