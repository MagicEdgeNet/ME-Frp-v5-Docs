import { createApp, computed, ref } from 'vue'
import { darkTheme } from 'naive-ui'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Docs from './views/Docs.vue'
import DocPage from './views/DocPage.vue'
import NotFound from './views/NotFound.vue'
import { docPages, docsManifest, docPath, findDocPage, updateDocSeo } from './shared/docs'
import type { ThemeContext } from './types/theme'
import { beginPageNavigation, completePageNavigation, failActivePageNavigation, shouldPlayPageLoadingAnimation } from './shared/state/pageLoadingProgress'
import './assets/styles/global.scss'

const savedTheme = localStorage.getItem('docs-theme')
const isDarkMode = ref(savedTheme === 'dark' || (savedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches))
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('docs-theme', isDarkMode.value ? 'dark' : 'light')
}
const themeContext: ThemeContext = {
  isDarkMode,
  theme: computed(() => isDarkMode.value ? darkTheme : null),
  toggleTheme,
}

const routes = [
  { path: '/', redirect: docPath(docsManifest.entry) },
  {
    path: '/docs', component: Docs, redirect: docPath(docsManifest.entry),
    children: [
      ...docPages.map(page => ({ path: page.path, component: DocPage, meta: { title: page.title, description: page.description } })),
      ...Object.entries(docsManifest.redirects || {}).map(([from, to]) => ({ path: from, redirect: docPath(to) })),
    ],
  },
  { path: '/:pathMatch(.*)*', component: NotFound },
]
const router = createRouter({ history: createWebHistory(), routes })
const loads = new WeakMap<object, string>()
router.beforeEach((to, from) => {
  const navigationType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type
  loads.set(to, beginPageNavigation(shouldPlayPageLoadingAnimation(to.path, from.path, from.matched.length === 0, navigationType)))
  const page = findDocPage(to.path)
  document.title = page ? `${page.title} | ${docsManifest.title}` : docsManifest.title
  updateDocSeo(page)
  if (!page) {
    document.title = '文档未找到 | ' + docsManifest.title
    document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.setAttribute('content', 'noindex,follow')
  }
})

router.afterEach((to, _from, failure) => {
  const id = loads.get(to)
  if (!id) return
  loads.delete(to)
  if (failure) failActivePageNavigation()
  else completePageNavigation(id)
})
router.onError(() => failActivePageNavigation())

const app = createApp(App)
app.provide('theme', themeContext)
app.use(router)
app.mount('#app')
