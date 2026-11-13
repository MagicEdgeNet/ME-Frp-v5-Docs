<template>
  <NConfigProvider :theme-overrides="getExemptedTheme()">
    <div class="navbar-slot" aria-hidden="true"></div>
    <NLayoutHeader class="navbar pc-navbar docs-navbar" :class="{ 'is-dark': isDarkMode }" role="banner">
      <div class="navbar-content">
        <div class="logo"><RouterLink to="/" class="logo-link" aria-label="ME Frp 文档首页"><AppLogo /><span class="logo-text"><b>幻缘映射</b><em>文档中心</em></span></RouterLink></div>
        <nav class="nav-links" aria-label="文档导航">
          <RouterLink to="/"><NButton :bordered="false">首页</NButton></RouterLink>
          <RouterLink :to="docPath('guide/quick-start')"><NButton :bordered="false">快速开始</NButton></RouterLink>
          <RouterLink :to="docPath('concepts/overview')"><NButton :bordered="false">基础概念</NButton></RouterLink>
          <RouterLink :to="docPath('usage/common')"><NButton :bordered="false">使用教程</NButton></RouterLink>
          <NButton quaternary aria-label="搜索文档" @click="openSearch"><template #icon><NIcon :component="SearchOutline" /></template>搜索文档</NButton>
          <NButton quaternary circle :aria-label="isDarkMode ? '切换浅色主题' : '切换深色主题'" @click="toggleTheme"><NIcon :component="isDarkMode ? SunnyOutline : MoonOutline" /></NButton>
          <NButton secondary type="primary" tag="a" href="https://www.mefrp.com/dashboard">管理面板</NButton>
        </nav>
      </div>
    </NLayoutHeader>
    <NLayoutHeader class="navbar mobile-navbar docs-navbar" :class="{ 'is-dark': isDarkMode }" role="banner">
      <div class="mobile-header">
        <div class="mobile-left"><RouterLink to="/" class="logo-link" aria-label="ME Frp 文档首页"><AppLogo /><span class="logo-text"><b>幻缘映射</b><em>文档</em></span></RouterLink></div>
        <div class="mobile-right" @click.stop>
          <NButton text class="header-action" aria-label="搜索文档" @click="openSearch"><NIcon :size="20" :component="SearchOutline" /></NButton>
          <NButton text class="header-action" :aria-label="isDarkMode ? '切换浅色主题' : '切换深色主题'" @click="toggleTheme"><NIcon :size="20" :component="isDarkMode ? SunnyOutline : MoonOutline" /></NButton>
          <NButton text class="menu-button header-action" aria-label="打开文档导航菜单" :aria-expanded="showMenu" @click="showMenu = !showMenu"><NIcon :size="22" :component="MenuOutline" /></NButton>
          <Transition name="menu-drop"><div v-if="showMenu" class="mobile-dropdown"><nav class="mobile-menu" aria-label="移动文档导航">
            <RouterLink v-for="item in menuItems" :key="item.path" class="mm-item" :to="item.path" @click="showMenu = false"><NIcon :size="16" :component="item.icon" /><span>{{ item.label }}</span></RouterLink>
            <a class="mm-item" href="https://www.mefrp.com/dashboard" @click="showMenu = false"><NIcon :size="16" :component="SpeedometerOutline" /><span>管理面板</span></a>
            <a class="mm-item" href="https://github.com/MagicEdgeNet/ME-Frp-v5-Docs" @click="showMenu = false"><NIcon :size="16" :component="LogoGithub" /><span>GitHub</span></a>
          </nav></div></Transition>
        </div>
      </div>
    </NLayoutHeader>
    <NModal v-model:show="searchOpen" :auto-focus="false" :mask-closable="true" :close-on-esc="true" @after-enter="focusSearchInput">
      <div class="search-dialog" :class="{ 'is-dark': isDarkMode }" role="dialog" aria-modal="true" aria-labelledby="search-dialog-title">
        <header class="search-dialog-header">
          <div class="search-input-row">
            <NIcon :component="SearchOutline" />
            <label class="visually-hidden" for="docs-search-input">搜索概念、协议或使用场景</label>
            <input id="docs-search-input" ref="searchInput" v-model="query" type="search" autocomplete="off" placeholder="搜索概念、协议或使用场景" role="combobox" aria-autocomplete="list" aria-controls="docs-search-results" :aria-expanded="Boolean(query.trim())" :aria-activedescendant="results[activeResult] ? `search-result-${activeResult}` : undefined" @keydown="onSearchKeydown" />
            <kbd>ESC</kbd>
            <NButton quaternary circle class="search-close" aria-label="关闭搜索" @click="searchOpen = false"><NIcon :component="CloseOutline" /></NButton>
          </div>
          <h2 id="search-dialog-title" class="visually-hidden">搜索全部文档</h2>
        </header>
        <div id="docs-search-results" class="search-result-list" role="listbox" aria-label="搜索结果" aria-live="polite">
          <p v-if="searchLoading" role="status">正在加载文档索引…</p>
          <p v-else-if="searchError" class="search-error" role="status">{{ searchError }} <NButton text @click="loadSearchIndex">重新加载</NButton></p>
          <RouterLink v-for="(result, index) in results" v-else :id="`search-result-${index}`" :key="result.path" :to="docPath(result.path)" role="option" :aria-selected="activeResult === index" @mouseenter="activeResult = index" @focus="activeResult = index" @click="searchOpen = false">
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
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NConfigProvider, NIcon, NLayoutHeader, NModal } from 'naive-ui'
import { BookOutline, CloseOutline, CodeSlashOutline, LogoGithub, MenuOutline, MoonOutline, RocketOutline, SearchOutline, SpeedometerOutline, SunnyOutline } from '@vicons/ionicons5'
import AppLogo from './AppLogo.vue'
import { docPath } from '../shared/docs'
import { loadSearchIndex as fetchSearchIndex, searchDocuments, type SearchDocument } from '../shared/search'
import type { ThemeContext } from '../types/theme'
import { getExemptedTheme } from '../constants/theme'

const theme = inject<ThemeContext | null>('theme', null)
const isDarkMode = theme?.isDarkMode ?? ref(false)
const toggleTheme = theme?.toggleTheme ?? (() => {})
const router = useRouter()
const showMenu = ref(false)
const searchOpen = ref(false)
const query = ref('')
const searchInput = ref<HTMLInputElement>()
const searchIndex = ref<SearchDocument[] | null>(null)
const searchLoading = ref(false)
const searchError = ref('')
const activeResult = ref(0)
const results = computed(() => searchDocuments(query.value, searchIndex.value || []).slice(0, 8))
const menuItems = [
  { label: '首页', path: '/', icon: BookOutline },
  { label: '快速开始', path: docPath('guide/quick-start'), icon: RocketOutline },
  { label: '基础概念', path: docPath('concepts/overview'), icon: CodeSlashOutline },
  { label: '使用教程', path: docPath('usage/common'), icon: BookOutline },
]
let lastSearchTrigger: HTMLElement | undefined
async function focusSearchInput() {
  await nextTick()
  searchInput.value?.focus()
}
function openSearch(event: MouseEvent) {
  lastSearchTrigger = event.currentTarget as HTMLElement
  showMenu.value = false
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
  if (event.key === 'Escape') showMenu.value = false
}
function onDocumentClick(event: MouseEvent) { if (!(event.target as HTMLElement).closest('.mobile-right')) showMenu.value = false }
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
  showMenu.value = false
  void loadSearchIndex()
})
onMounted(() => { document.addEventListener('keydown', onKeydown); document.addEventListener('click', onDocumentClick) })
onUnmounted(() => { document.removeEventListener('keydown', onKeydown); document.removeEventListener('click', onDocumentClick) })
</script>

<style lang="scss" scoped>
@use '../assets/styles/components/docsTopMenu.scss' as *;
</style>
