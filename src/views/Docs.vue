<template>
  <NConfigProvider :theme-overrides="workbenchTheme">
    <div class="docs-shell" :class="{ 'is-dark': isDarkMode }">
      <DocsTopMenu />
      <DocsSubMenu
        :title="currentTitle"
        :headings="mobileHeadings"
        :active-heading="activeHeading"
        :active-title="activeTitle"
        :scroll-to-heading="scrollToMobileHeading"
      />
      <div v-if="!isHome" class="docs-body">
        <aside v-if="!isMobile" class="docs-sider" :class="{ 'is-collapsed': collapsed }">
          <div class="docs-sider-scroll">
            <DocsLeftMenu :collapsed="collapsed" />
          </div>
          <button class="docs-sider-trigger" type="button" :aria-label="collapsed ? '展开侧栏' : '收起侧栏'"
            :aria-expanded="!collapsed" @click="collapsed = !collapsed">
            <NIcon :component="collapsed ? ChevronForwardOutline : ChevronBackOutline" :size="14" />
          </button>
        </aside>
        <NScrollbar ref="mainScrollRef" class="docs-scroll" :x-scrollable="false" :native-scrollbar="false">
          <div class="docs-main" :style="contentStyle">
            <div class="docs-content">
              <RouterView v-slot="{ Component }">
                <Transition name="fade" mode="out-in" appear @before-leave="holdPageTransition"
                  @after-leave="releasePageTransition" @leave-cancelled="releasePageTransition">
                  <component :is="Component" :key="$route.path" @update:toc="handleTocUpdate" />
                </Transition>
              </RouterView>
            </div>
          </div>
        </NScrollbar>
      </div>
      <PullToRefresh v-if="!isHome" target=".docs-scroll > .n-scrollbar-container" :top="isMobile ? 50 : 59" />
    </div>

    <NBackTop class="docs-back-top" :listen-to="getMainScrollContainer" :visibility-height="240" :right="24" :bottom="24" />

  </NConfigProvider>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue'
import { NConfigProvider, NScrollbar, NIcon, NBackTop } from 'naive-ui'
import { ChevronBackOutline, ChevronForwardOutline } from '@vicons/ionicons5'
import DocsTopMenu from '../components/DocsTopMenu.vue'
import PullToRefresh from '../components/PullToRefresh.vue'
import DocsLeftMenu from '../components/DocsLeftMenu.vue'
import DocsSubMenu from '../components/DocsSubMenu.vue'
import { getWorkbenchThemeOverrides } from '../constants/theme'
import { holdPageTransition, releasePageTransition } from '../shared/state/pageLoadingProgress'
import type { ThemeContext } from '../types/theme'

const route = useRoute()

const isHome = computed(() => route.path === '/')
const themeCtx = inject<ThemeContext | null>('theme', null)
const isDarkMode = themeCtx?.isDarkMode ?? ref(false)
// 沿用首页色板，只改底色 / 边框 / 文字层级，按钮主色仍然是用户组主题
const workbenchTheme = computed(() => getWorkbenchThemeOverrides(isDarkMode.value))

const collapsed = ref(false)
const isMobile = ref(window.innerWidth <= 768 || window.screen.width <= 768)

// 顶栏（+ 移动端副导航）固定悬浮，主内容用等高的 padding-top 让出位置
const contentStyle = computed(() => {
  if (isMobile.value) {
    return { padding: '0 12px 32px', paddingTop: isHome.value ? '50px' : '60px' }
  }
  return { padding: isHome.value ? '0 24px 40px' : '24px', paddingTop: isHome.value ? '59px' : '24px' }
})

const currentTitle = computed(() => {
  return (route.meta.title as string) || '使用文档'
})
const mobileHeadings = ref<{ id: string; text: string; depth: number }[]>([])
const activeHeading = ref('')
const activeTitle = computed(() => mobileHeadings.value.find(item => item.id === activeHeading.value)?.text || '')
const handleTocUpdate = (toc: { headings: { id: string; text: string; depth: number }[]; activeHeading: string }) => {
  mobileHeadings.value = toc.headings
  activeHeading.value = toc.activeHeading
}
const scrollToMobileHeading = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  activeHeading.value = id
  history.replaceState(history.state, '', `${route.path}#${encodeURIComponent(id)}`)
}
watch(() => route.path, () => {
  mobileHeadings.value = []
  activeHeading.value = ''
  scrollToTop()
})

// 主内容由 NScrollbar 滚动，切页 / 点锚点都要走它
const mainScrollRef = ref<InstanceType<typeof NScrollbar> | null>(null)
const getMainScrollContainer = () => document.querySelector<HTMLElement>('.docs-scroll > .n-scrollbar-container') ?? document.documentElement
const scrollToTop = () => {
  mainScrollRef.value?.scrollTo({ top: 0 })
}

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768 || window.screen.width <= 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/docsLayout.scss';

.n-drawer-body-content-wrapper {
  padding: 0;
}

:global(html:has(.docs-shell)),
:global(body:has(.docs-shell)) {
  height: 100%;
  overflow: hidden;
  overscroll-behavior-y: none;
}

:global(.docs-back-top) {
  box-sizing: border-box;
  width: 40px !important;
  min-width: 40px !important;
  height: 40px !important;
  padding: 0 !important;
  border-radius: 50%;
}

.docs-content {
  box-sizing: border-box;
  width: min(100%, 1200px);
  margin: 0 auto;
  padding: 0 20px;
}
</style>
