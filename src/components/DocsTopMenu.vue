<template>
  <NConfigProvider :theme-overrides="getExemptedTheme()">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink to="/" class="brand" aria-label="ME Frp 文档首页">
          <AppMark />
          <span>ME Frp <small>DOCS</small></span>
        </RouterLink>

        <nav class="desktop-nav" aria-label="文档主导航">
          <RouterLink to="/">首页</RouterLink>
          <RouterLink :to="docPath('guide/quick-start')">快速开始</RouterLink>
          <RouterLink :to="docPath('concepts/overview')">基础概念</RouterLink>
          <RouterLink :to="docPath('usage/common')">使用教程</RouterLink>
          <RouterLink :to="docPath('faq/account')">常见问题</RouterLink>
        </nav>

        <div class="header-tools">
          <NButton class="search-trigger" quaternary @click="searchOpen = true" aria-label="搜索文档">
            <template #icon><NIcon :component="SearchOutline" /></template><span>搜索</span><kbd>⌘ K</kbd>
          </NButton>
          <span class="tool-divider"></span>
          <a class="github-link" href="https://github.com/MagicEdgeNet/ME-Frp-v5-Docs" target="_blank" rel="noopener noreferrer" aria-label="文档 GitHub 仓库"><NIcon :component="LogoGithub" /></a>
          <a class="panel-link" href="https://www.mefrp.com/dashboard">管理面板</a>
          <NButton quaternary circle class="theme-toggle" :aria-label="isDarkMode ? '切换浅色主题' : '切换深色主题'" @click="toggleTheme">
            <template #icon><NIcon :component="isDarkMode ? SunnyOutline : MoonOutline" /></template>
          </NButton>
          <NButton quaternary circle class="mobile-menu-trigger" aria-label="打开导航菜单" @click="mobileOpen = !mobileOpen">
            <template #icon><NIcon :component="mobileOpen ? CloseOutline : MenuOutline" /></template>
          </NButton>
        </div>
      </div>
      <nav v-if="mobileOpen" class="mobile-nav" aria-label="移动文档导航">
        <RouterLink to="/" @click="mobileOpen = false">首页</RouterLink>
        <RouterLink :to="docPath('guide/quick-start')" @click="mobileOpen = false">快速开始</RouterLink>
        <RouterLink :to="docPath('concepts/overview')" @click="mobileOpen = false">基础概念</RouterLink>
        <RouterLink :to="docPath('usage/common')" @click="mobileOpen = false">使用教程</RouterLink>
        <RouterLink :to="docPath('faq/account')" @click="mobileOpen = false">常见问题</RouterLink>
        <button type="button" @click="searchOpen = true; mobileOpen = false"><NIcon :component="SearchOutline" /> 搜索文档</button>
        <a href="https://github.com/MagicEdgeNet/ME-Frp-v5-Docs">GitHub</a>
        <a href="https://www.mefrp.com/dashboard">管理面板</a>
      </nav>
    </header>

    <NModal v-model:show="searchOpen" :auto-focus="false" :mask-closable="true">
      <section class="search-dialog" role="dialog" aria-modal="true" aria-label="搜索文档">
        <div class="search-input-row"><NIcon :component="SearchOutline" /><input ref="searchInput" v-model="query" placeholder="搜索术语、教程和场景..." @keydown.escape="searchOpen = false" @keydown.enter="openFirstResult" /><kbd>ESC</kbd></div>
        <div class="search-result-list" role="listbox">
          <a v-for="page in results" :key="page.path" :href="docPath(page.path)" role="option" @click="searchOpen = false">
            <span>{{ page.navTitle || page.title }}</span><small>{{ page.description }}</small>
          </a>
          <p v-if="query.trim() && !results.length">没有匹配结果。试试“frpc”“端口”或“TCP”。</p>
          <p v-else-if="!query.trim()">搜索项目介绍、协议类型、客户端和使用场景。</p>
        </div>
      </section>
    </NModal>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { NButton, NConfigProvider, NIcon, NModal } from 'naive-ui'
import { CloseOutline, LogoGithub, MenuOutline, MoonOutline, SearchOutline, SunnyOutline } from '@vicons/ionicons5'
import { RouterLink } from 'vue-router'
import AppMark from './AppMark.vue'
import { docPages, docPath } from '../shared/docs'
import { searchDocuments } from '../shared/search'
import type { ThemeContext } from '../types/theme'
import { getExemptedTheme } from '../constants/theme'

const theme = inject<ThemeContext | null>('theme', null)
const isDarkMode = theme?.isDarkMode ?? ref(false)
const toggleTheme = theme?.toggleTheme ?? (() => {})
const searchOpen = ref(false)
const mobileOpen = ref(false)
const query = ref('')
const searchInput = ref<HTMLInputElement>()
const searchablePages = docPages.filter(page => page.index !== false)
const results = computed(() => searchDocuments(query.value, searchablePages).slice(0, 8))
function openFirstResult() {
  if (results.value[0]) location.href = docPath(results.value[0].path)
}
function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchOpen.value = !searchOpen.value
  }
}
watch(searchOpen, async open => {
  if (!open) { query.value = ''; return }
  await nextTick()
  searchInput.value?.focus()
})
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style lang="scss" scoped>
@use '../assets/styles/components/docsTopMenu.scss' as *;
</style>
