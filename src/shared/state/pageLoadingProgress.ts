import { nextTick, ref } from 'vue'
import type { LoadingBarApiInjection } from 'naive-ui/es/loading-bar/src/LoadingBarProvider'
import type { Window } from '../../types'

declare const window: Window

// 响应拦截器先于调用方的 await/then 执行，不能在请求计数刚归零时结束。
// 等页面稳定后统一收尾，让后续串行请求和新挂载组件复用同一条进度。
const PAGE_IDLE_MS = 200
const LOADING_ANIMATION_MS = 1600

export const pageLoadingScreenVisible = ref(false)
export const pageLoadingScreenCycle = ref(0)
export function shouldPlayPageLoadingAnimation(
  to: string,
  from: string,
  initial: boolean,
  navigationType?: PerformanceNavigationTiming['type'],
): boolean {
  if (to === '/docs' || to.startsWith('/docs/')) return initial && navigationType !== 'reload'
  return initial || to === '/' || (from === '/' && to.startsWith('/auth/')) ||
    (from.startsWith('/auth/') && (to === '/dashboard' || to.startsWith('/dashboard/')))
}

let loadingScreenTimer: ReturnType<typeof setTimeout> | undefined

type PageLoad = {
  pendingRequests: number
  pendingTransitions: number
  navigationPending: boolean
  failed: boolean
  startedAt: number
  settleTimer?: ReturnType<typeof setTimeout>
}

let activePageId: string | null = null
let visiblePageId: string | null = null
let nextPageId = 0
const pageLoads = new Map<string, PageLoad>()
const transitionReleases = new WeakMap<Element, () => void>()

function getLoadingBar(): LoadingBarApiInjection | undefined {
  return window.$loadingBar
}

function cancelSettlement(pageLoad: PageLoad): void {
  clearTimeout(loadingScreenTimer)
  clearTimeout(pageLoad.settleTimer)
  pageLoad.settleTimer = undefined
}

function showPageProgress(pageId: string): void {
  const loadingBar = getLoadingBar()
  if (!loadingBar || visiblePageId === pageId) return

  // 快速切页时移交正在显示的进度，不先 finish 再 start 造成闪动。
  if (!visiblePageId) loadingBar.start()
  visiblePageId = pageId
}

function settlePage(pageId: string): void {
  const pageLoad = pageLoads.get(pageId)
  if (!pageLoad) return
  cancelSettlement(pageLoad)
  if (pageLoad.navigationPending || pageLoad.pendingRequests > 0 || pageLoad.pendingTransitions > 0) return

  pageLoad.settleTimer = setTimeout(() => {
    pageLoad.settleTimer = undefined
    if (pageId !== activePageId) {
      pageLoads.delete(pageId)
      return
    }
    if (visiblePageId === pageId) {
      const loadingBar = getLoadingBar()
      if (pageLoad.failed) loadingBar?.error()
      else loadingBar?.finish()
      visiblePageId = null
    }
    pageLoad.failed = false
    const remainingAnimation = pageLoadingScreenVisible.value
      ? Math.max(0, LOADING_ANIMATION_MS - (Date.now() - pageLoad.startedAt))
      : 0
    clearTimeout(loadingScreenTimer)
    loadingScreenTimer = setTimeout(() => {
      if (pageId === activePageId) {
        pageLoadingScreenVisible.value = false
      }
    }, remainingAnimation)
  }, PAGE_IDLE_MS)
}

export function beginPageNavigation(showBrandAnimation = true): string {
  for (const pageLoad of pageLoads.values()) cancelSettlement(pageLoad)
  // 旧页面请求完成后只会携带旧 ID，忽略即可，无需长期保留旧计数。
  pageLoads.clear()
  const pageId = `page-${++nextPageId}`
  activePageId = pageId
  clearTimeout(loadingScreenTimer)
  pageLoadingScreenVisible.value = showBrandAnimation
  if (pageLoadingScreenVisible.value) pageLoadingScreenCycle.value += 1
  pageLoads.set(pageId, {
    pendingRequests: 0,
    pendingTransitions: 0,
    navigationPending: true,
    failed: false,
    startedAt: Date.now(),
  })
  showPageProgress(pageId)
  return pageId
}

export function completePageNavigation(pageId: string): void {
  void nextTick(() => {
    const pageLoad = pageLoads.get(pageId)
    if (!pageLoad) return
    pageLoad.navigationPending = false
    settlePage(pageId)
  })
}

export function failActivePageNavigation(): void {
  const pageId = activePageId
  const pageLoad = pageId ? pageLoads.get(pageId) : undefined
  if (!pageId || !pageLoad) return

  cancelSettlement(pageLoad)
  pageLoad.navigationPending = false
  pageLoad.failed = true
  settlePage(pageId)
}

// out-in 动画退出期间新页面尚未挂载；即使暂时没有请求，也不能结束加载。
export function holdPageTransition(element: Element): void {
  transitionReleases.get(element)?.()
  const pageId = activePageId
  const pageLoad = pageId ? pageLoads.get(pageId) : undefined
  if (!pageId || !pageLoad) return
  cancelSettlement(pageLoad)
  pageLoad.pendingTransitions += 1
  transitionReleases.set(element, () => {
    if (pageLoads.get(pageId) !== pageLoad) return
    pageLoad.pendingTransitions -= 1
    settlePage(pageId)
  })
}

export function releasePageTransition(element: Element): void {
  transitionReleases.get(element)?.()
  transitionReleases.delete(element)
}

export function beginPageRequest(): string | undefined {
  const pageId = activePageId
  const pageLoad = pageId ? pageLoads.get(pageId) : undefined
  if (!pageId || !pageLoad) return

  cancelSettlement(pageLoad)
  pageLoad.pendingRequests += 1
  showPageProgress(pageId)
  return pageId
}

export function completePageRequest(pageId: string | undefined, failed = false): void {
  if (!pageId) return
  const pageLoad = pageLoads.get(pageId)
  if (!pageLoad || pageLoad.pendingRequests === 0) return

  pageLoad.pendingRequests -= 1
  pageLoad.failed ||= failed
  settlePage(pageId)
}

export function syncPageLoadingProgress(): void {
  if (!activePageId) return
  const pageLoad = pageLoads.get(activePageId)
  if (pageLoad && (pageLoad.navigationPending || pageLoad.pendingRequests > 0 || pageLoad.pendingTransitions > 0 || pageLoad.settleTimer !== undefined)) {
    showPageProgress(activePageId)
  }
}
