const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { runInNewContext } = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

// 使用真实协调器源码及虚拟时钟，不等待真实网络或 200ms 稳定窗口。
function fixture(withProvider = true) {
  const events = []
  const timers = new Map()
  let clock = 0
  let timerId = 0
  const bar = { start: () => events.push('start'), finish: () => events.push('finish'), error: () => events.push('error') }
  const window = { $loadingBar: withProvider ? bar : undefined }
  const module = { exports: {} }
  const source = readFileSync(resolve(__dirname, '../../src/shared/state/pageLoadingProgress.ts'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  runInNewContext(compiled, {
    exports: module.exports, module, window,
    require: name => {
      assert.equal(name, 'vue')
      return { nextTick: callback => Promise.resolve().then(callback), ref: value => ({ value }) }
    },
    Date: class extends Date { static now() { return clock } },
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, at: clock + delay }); return timerId },
    clearTimeout: id => timers.delete(id),
  })
  const advance = duration => {
    const until = clock + duration
    while (true) {
      const next = [...timers.entries()].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at)[0]
      if (!next) break
      timers.delete(next[0])
      clock = next[1].at
      next[1].callback()
    }
    clock = until
  }
  return { api: module.exports, events, window, bar, advance }
}

async function navigate(api) {
  const id = api.beginPageNavigation()
  api.completePageNavigation(id)
  await Promise.resolve()
  return id
}

test('同页面并发和串行请求只启动、结束一次', async () => {
  const { api, events, advance } = fixture()
  const id = await navigate(api)
  assert.equal(api.beginPageRequest(), id)
  api.beginPageRequest()
  api.completePageRequest(id)
  advance(1000)
  assert.deepEqual(events, ['start'], '还有并发请求时不能结束')
  api.completePageRequest(id)
  advance(100)
  api.beginPageRequest()
  advance(1000)
  assert.deepEqual(events, ['start'], '串行后续请求复用当前进度')
  api.completePageRequest(id)
  advance(199)
  assert.deepEqual(events, ['start'])
  advance(1)
  assert.deepEqual(events, ['start', 'finish'])
})

test('连续 await 的请求不会在响应拦截器中间结束', async () => {
  const { api, events, advance } = fixture()
  const id = await navigate(api)
  for (let i = 0; i < 5; i++) {
    api.beginPageRequest()
    api.completePageRequest(id)
    await Promise.resolve()
  }
  assert.deepEqual(events, ['start'])
  advance(200)
  assert.deepEqual(events, ['start', 'finish'])
})

test('out-in 退出动画空档和新组件请求属于同一个页面周期', async () => {
  const { api, events, advance } = fixture()
  const id = api.beginPageNavigation()
  const element = {}
  api.holdPageTransition(element)
  api.completePageNavigation(id)
  await Promise.resolve()
  advance(1000)
  assert.deepEqual(events, ['start'])
  api.releasePageTransition(element)
  api.beginPageRequest()
  advance(1000)
  assert.deepEqual(events, ['start'])
  api.completePageRequest(id)
  advance(200)
  assert.deepEqual(events, ['start', 'finish'])
  api.releasePageTransition(element)
  advance(200)
  assert.deepEqual(events, ['start', 'finish'], '重复释放不重复结束')
})

test('快速切页转交可见进度，旧请求和旧导航不影响新页', async () => {
  const { api, events, advance } = fixture()
  const old = api.beginPageNavigation()
  const element = {}
  api.holdPageTransition(element)
  api.beginPageRequest()
  const current = api.beginPageNavigation()
  api.beginPageRequest()
  api.completePageNavigation(old)
  api.completePageRequest(old, true)
  api.releasePageTransition(element)
  await Promise.resolve()
  advance(1000)
  assert.deepEqual(events, ['start'])
  api.completePageNavigation(current)
  await Promise.resolve()
  advance(1000)
  assert.deepEqual(events, ['start'])
  api.completePageRequest(current)
  advance(200)
  assert.deepEqual(events, ['start', 'finish'])
})

test('请求失败只在整页结束后显示错误，后续刷新不继承失败', async () => {
  const { api, events, advance } = fixture()
  const id = await navigate(api)
  api.beginPageRequest()
  api.beginPageRequest()
  api.completePageRequest(id, true)
  advance(1000)
  assert.deepEqual(events, ['start'])
  api.completePageRequest(id)
  advance(200)
  assert.deepEqual(events, ['start', 'error'])
  api.beginPageRequest()
  api.completePageRequest(id)
  advance(200)
  assert.deepEqual(events, ['start', 'error', 'start', 'finish'])
})

test('无请求页面和延迟挂载的 provider 都只结束一次', async () => {
  const { api, events, advance, window, bar } = fixture(false)
  await navigate(api)
  window.$loadingBar = bar
  api.syncPageLoadingProgress()
  api.syncPageLoadingProgress()
  advance(200)
  assert.deepEqual(events, ['start', 'finish'])
})

test('品牌动画仅用于首次进入、首页和认证边界', () => {
  const { api } = fixture()
  for (const [to, from, initial, navigationType, expected] of [
    ['/dashboard/home', '/', true, undefined, true],
    ['/', '/dashboard/home', false, undefined, true],
    ['/auth/login', '/', false, undefined, true],
    ['/auth/register', '/auth/login', false, undefined, false],
    ['/dashboard/home', '/auth/login', false, undefined, true],
    ['/dashboard/manage-proxies', '/dashboard/home', false, undefined, false],
    ['/docs/usage', '/dashboard/home', false, undefined, false],
    ['/docs/usage/common', '/', true, 'navigate', true],
    ['/docs/usage/common', '/', true, 'reload', false],
  ]) assert.equal(api.shouldPlayPageLoadingAnimation(to, from, initial, navigationType), expected)
})

test('普通切页不展示品牌遮罩', async () => {
  const { api, advance } = fixture()
  const id = api.beginPageNavigation(false)
  assert.equal(api.pageLoadingScreenVisible.value, false)
  api.completePageNavigation(id)
  await Promise.resolve()
  advance(200)
  assert.equal(api.pageLoadingScreenVisible.value, false)
})

test('加载遮罩等待完整动画和请求，后台操作不重播', async () => {
  const { api, advance } = fixture()
  const id = await navigate(api)
  assert.equal(api.pageLoadingScreenVisible.value, true)
  advance(1599)
  assert.equal(api.pageLoadingScreenVisible.value, true)
  advance(1)
  assert.equal(api.pageLoadingScreenVisible.value, false)
  api.beginPageRequest()
  api.completePageRequest(id)
  advance(200)
  assert.equal(api.pageLoadingScreenVisible.value, false)

  const next = await navigate(api)
  api.beginPageRequest()
  advance(3000)
  assert.equal(api.pageLoadingScreenVisible.value, true)
  api.completePageRequest(next)
  advance(200)
  assert.equal(api.pageLoadingScreenVisible.value, false)
})

test('新请求和快速切页取消旧遮罩退出计时', async () => {
  const { api, advance } = fixture()
  const old = await navigate(api)
  advance(1500)
  api.beginPageRequest()
  advance(200)
  assert.equal(api.pageLoadingScreenVisible.value, true)
  const next = await navigate(api)
  api.completePageRequest(old)
  advance(1599)
  assert.equal(api.pageLoadingScreenVisible.value, true)
  advance(1)
  assert.equal(api.pageLoadingScreenVisible.value, false)
  assert.notEqual(old, next)
})

test('路由错误结束进度，未知或重复完成不造成额外结束', async () => {
  const { api, events, advance } = fixture()
  api.beginPageNavigation()
  api.failActivePageNavigation()
  api.completePageRequest(undefined, true)
  api.completePageRequest('missing', true)
  advance(200)
  assert.deepEqual(events, ['start', 'error'])
  api.completePageRequest('page-1', true)
  advance(200)
  assert.deepEqual(events, ['start', 'error'])
})
