<template>
  <NConfigProvider :theme-overrides="getExemptedTheme()">
    <div class="navbar-slot" aria-hidden="true"></div>
    <NLayoutHeader class="navbar pc-navbar docs-navbar" :class="{ 'is-dark': isDarkMode }" role="banner">
      <div class="navbar-content">
        <div class="logo"><RouterLink to="/" class="logo-link" aria-label="ME Frp 文档首页"><AppLogo /><span class="logo-text"><b>幻缘映射</b><em>文档中心</em></span></RouterLink></div>
        <nav class="nav-links" aria-label="文档导航">
          <RouterLink :to="docPath('introduction')"><NButton :bordered="false">快速开始</NButton></RouterLink>
          <NPopover v-model:show="showDesktopMenu" trigger="click" placement="bottom-end" :show-arrow="false">
            <template #trigger><NButton quaternary aria-label="打开完整文档目录">更多文档</NButton></template>
            <NScrollbar class="docs-desktop-nav-scroll" style="width: min(380px, calc(100vw - 32px)); max-height: min(72dvh, 640px)" :native-scrollbar="false">
              <NMenu :options="menuOptions" :value="currentMenuKey" :default-expanded-keys="docsMenuExpandedKeys" @update:value="handleMenuSelect" />
            </NScrollbar>
          </NPopover>
          <NButton quaternary aria-label="搜索文档" @click="openSearch"><template #icon><NIcon :component="SearchOutline" /></template>搜索文档</NButton>
          <NButton secondary type="primary" tag="a" href="https://www.mefrp.com/dashboard">管理面板</NButton>
        </nav>
      </div>
    </NLayoutHeader>
    <NLayoutHeader class="navbar mobile-navbar docs-navbar" :class="{ 'is-dark': isDarkMode }" role="banner">
      <div class="mobile-header">
        <div class="mobile-left"><RouterLink to="/" class="logo-link" aria-label="ME Frp 文档首页"><AppLogo /><span class="logo-text"><b>幻缘映射</b><em>文档</em></span></RouterLink></div>
        <div class="mobile-right" @click.stop>
          <NButton text class="header-action" aria-label="搜索文档" @click="openSearch"><NIcon :size="20" :component="SearchOutline" /></NButton>
          <NPopover v-model:show="showMobileMenu" trigger="click" placement="bottom-end" :show-arrow="false">
            <template #trigger>
              <NButton text class="header-action menu-button" aria-label="打开完整文档目录" :aria-expanded="showMobileMenu">
                <NIcon :size="22" :component="MenuOutline" />
              </NButton>
            </template>
            <NScrollbar class="docs-mobile-nav-scroll" style="width: min(360px, calc(100vw - 32px)); max-height: min(72dvh, 640px)" :native-scrollbar="false">
              <NMenu :options="menuOptions" :value="currentMenuKey" :default-expanded-keys="docsMenuExpandedKeys" @update:value="handleMenuSelect" />
            </NScrollbar>
          </NPopover>
        </div>
      </div>
    </NLayoutHeader>
    <NModal v-model:show="searchOpen" :auto-focus="false" :mask-closable="true" :close-on-esc="true" @after-enter="focusSearchInput">
      <div class="search-dialog" :class="{ 'is-dark': isDarkMode }" role="dialog" aria-modal="true" aria-labelledby="search-dialog-title">
        <header class="search-dialog-header">
          <div class="search-input-row">
            <NIcon :component="SearchOutline" />
            <label class="visually-hidden" for="docs-search-input">搜索概念、协议或使用场景</label>
            <NInput ref="searchInput" v-model:value="query" class="search-query" type="text" autocomplete="off" :bordered="false" placeholder="搜索概念、协议或使用场景"
              :input-props="{ id: 'docs-search-input', role: 'combobox', 'aria-autocomplete': 'list', 'aria-controls': 'docs-search-results', 'aria-expanded': Boolean(query.trim()), 'aria-activedescendant': results[activeResult] ? `search-result-${activeResult}` : undefined }"
              @keydown="onSearchKeydown" />
            <kbd>ESC</kbd>
            <NButton quaternary circle class="search-close" aria-label="关闭搜索" @click="searchOpen = false"><NIcon :component="CloseOutline" /></NButton>
          </div>
          <h2 id="search-dialog-title" class="visually-hidden">搜索全部文档</h2>
        </header>
        <div id="docs-search-results" class="search-result-list" role="listbox" aria-label="搜索结果" aria-live="polite">
          <p v-if="searchLoading" role="status">正在加载文档索引…</p>
          <p v-else-if="searchError" class="search-error" role="status">{{ searchError }} <NButton text @click="loadSearchIndex">重新加载</NButton></p>
          <RouterLink v-for="(result, index) in results" v-else :id="`search-result-${index}`" :key="result.key" :to="docPath(result.path)" role="option" :aria-selected="activeResult === index" @mouseenter="activeResult = index" @focus="activeResult = index" @click="searchOpen = false">
            <span class="result-title">{{ result.navTitle || result.title }}</span>
            <small>{{ result.snippet || result.description }}</small>
            <span class="result-path">{{ docPath(result.path) }}</span>
          </RouterLink>
          <p v-if="!searchLoading && !searchError && query.trim() && !results.length" role="status">没有匹配的文档，请尝试更短的关键词。</p>
          <p v-else-if="!searchLoading && !searchError && !query.trim()">输入关键词，搜索全部公开文档正文。</p>
        </div>
        <footer class="search-dialog-footer"><span>{{ searchIndex?.length ?? '全部' }} 篇公开文章</span><span><kbd>↑</kbd><kbd>↓</kbd> 选择　<kbd>↵</kbd> 打开</span></footer>
      </div>
    </NModal>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { computed, h, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { NButton, NConfigProvider, NIcon, NInput, NLayoutHeader, NMenu, NModal, NPopover, NScrollbar } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { BookOutline, CloseOutline, LogoGithub, MenuOutline, SearchOutline, SpeedometerOutline } from '@vicons/ionicons5'
import AppLogo from './AppLogo.vue'
import { docGroups, docPath } from '../shared/docs'
import { createDocsMenuOptions, docsMenuActiveKey, docsMenuExpandedKeys } from '../shared/docsMenu'
import { loadSearchIndex as fetchSearchIndex, searchDocuments, type SearchDocument } from '../shared/search'
import type { ThemeContext } from '../types/theme'
import { getExemptedTheme } from '../constants/theme'

const theme = inject<ThemeContext | null>('theme', null)
const isDarkMode = theme?.isDarkMode ?? ref(false)
const router = useRouter()
const showDesktopMenu = ref(false)
const showMobileMenu = ref(false)
const searchOpen = ref(false)
const query = ref('')
const searchInput = ref<InstanceType<typeof NInput> | null>(null)
const searchIndex = ref<SearchDocument[] | null>(null)
const searchLoading = ref(false)
const searchError = ref('')
const activeResult = ref(0)
const results = computed(() => searchDocuments(query.value, searchIndex.value || []).slice(0, 12))
const menuOptions: MenuOption[] = [
  { key: 'docs-home', label: () => h(RouterLink, { to: '/', onClick: closeMenus }, { default: () => '文档首页' }), icon: () => h(NIcon, null, { default: () => h(BookOutline) }) },
  { type: 'divider', key: 'docs-menu-divider-before-index' },
  ...createDocsMenuOptions(closeMenus),
  { type: 'divider', key: 'docs-menu-divider-after-index' },
  { label: '管理面板', key: 'https://www.mefrp.com/dashboard', icon: () => h(NIcon, null, { default: () => h(SpeedometerOutline) }) },
  { label: 'GitHub', key: 'https://github.com/MagicEdgeNet/ME-Frp-v5-Docs', icon: () => h(NIcon, null, { default: () => h(LogoGithub) }) },
]
const currentMenuKey = computed(() => docsMenuActiveKey(router.currentRoute.value.path))
function closeMenus() {
  showDesktopMenu.value = false
  showMobileMenu.value = false
}
function handleMenuSelect(key: string) {
  if (key.startsWith('https://')) {
    closeMenus()
    window.location.assign(key)
  } else if (key === 'docs-home') {
    closeMenus()
    void router.push('/')
  } else if (docGroups.some(group => group.pages.some(page => page.path === key))) {
    closeMenus()
    void router.push(docPath(key))
  }
}
let lastSearchTrigger: HTMLElement | undefined
async function focusSearchInput() {
  await nextTick()
  searchInput.value?.focus()
}
function openSearch(event: MouseEvent) {
  lastSearchTrigger = event.currentTarget as HTMLElement
  closeMenus()
  searchOpen.value = true
}
async function loadSearchIndex() {
  if (searchLoading.value || searchIndex.value) return
  searchLoading.value = true
  searchError.value = ''
  try {
    searchIndex.value = await fetchSearchIndex()
  } catch {
    searchError.value = '暂时无法加载文档索引，请检查网络后重试。'
  } finally {
    searchLoading.value = false
  }
}
function openResult(index: number) {
  const result = results.value[index]
  if (!result) return
  searchOpen.value = false
  void router.push(docPath(result.path))
}
function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' && results.value.length) {
    event.preventDefault()
    activeResult.value = (activeResult.value + 1) % results.value.length
  } else if (event.key === 'ArrowUp' && results.value.length) {
    event.preventDefault()
    activeResult.value = (activeResult.value - 1 + results.value.length) % results.value.length
  } else if (event.key === 'Enter' && results.value.length) {
    event.preventDefault()
    openResult(activeResult.value)
  } else if (event.key === 'Escape') {
    searchOpen.value = false
  }
}
function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchOpen.value = !searchOpen.value
  }
  if (event.key === 'Escape') closeMenus()
}
watch(query, () => { activeResult.value = 0 })
watch(activeResult, async index => {
  await nextTick()
  document.getElementById(`search-result-${index}`)?.scrollIntoView({ block: 'nearest' })
})
watch(searchOpen, async open => {
  if (!open) {
    query.value = ''
    activeResult.value = 0
    await nextTick()
    if (lastSearchTrigger?.isConnected) lastSearchTrigger.focus()
    return
  }
  closeMenus()
  void loadSearchIndex()
})
onMounted(() => { document.addEventListener('keydown', onKeydown) })
onUnmounted(() => { document.removeEventListener('keydown', onKeydown) })
</script>

<style lang="scss" scoped>
@use '../assets/styles/components/docsTopMenu.scss' as *;
</style>
