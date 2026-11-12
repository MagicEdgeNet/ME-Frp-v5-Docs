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
          <NButton quaternary @click="searchOpen = true"><template #icon><NIcon :component="SearchOutline" /></template>搜索文档</NButton>
          <NButton quaternary circle :aria-label="isDarkMode ? '切换浅色主题' : '切换深色主题'" @click="toggleTheme"><NIcon :component="isDarkMode ? SunnyOutline : MoonOutline" /></NButton>
          <NButton secondary type="primary" tag="a" href="https://www.mefrp.com/dashboard">管理面板</NButton>
        </nav>
      </div>
    </NLayoutHeader>
    <NLayoutHeader class="navbar mobile-navbar docs-navbar" :class="{ 'is-dark': isDarkMode }" role="banner">
      <div class="mobile-header">
        <div class="mobile-left"><RouterLink to="/" class="logo-link" aria-label="ME Frp 文档首页"><AppLogo /><span class="logo-text"><b>幻缘映射</b><em>文档</em></span></RouterLink></div>
        <div class="mobile-right" @click.stop>
          <NButton text class="menu-button" aria-label="打开文档导航菜单" :aria-expanded="showMenu" @click="showMenu = !showMenu"><NIcon :size="24" :component="MenuOutline" /></NButton>
          <Transition name="menu-drop"><div v-if="showMenu" class="mobile-dropdown"><nav class="mobile-menu" aria-label="移动文档导航">
            <RouterLink v-for="item in menuItems" :key="item.path" class="mm-item" :to="item.path" @click="showMenu = false"><NIcon :size="16" :component="item.icon" /><span>{{ item.label }}</span></RouterLink>
            <a class="mm-item" href="https://www.mefrp.com/dashboard" @click="showMenu = false"><NIcon :size="16" :component="SpeedometerOutline" /><span>管理面板</span></a>
            <a class="mm-item" href="https://github.com/MagicEdgeNet/ME-Frp-v5-Docs"><NIcon :size="16" :component="LogoGithub" /><span>GitHub</span></a>
            <button class="mm-item" type="button" @click="toggleTheme"><NIcon :size="16" :component="isDarkMode ? SunnyOutline : MoonOutline" /><span>{{ isDarkMode ? '浅色主题' : '深色主题' }}</span></button>
            <button class="mm-item" type="button" @click="showMenu = false; searchOpen = true"><NIcon :size="16" :component="SearchOutline" /><span>搜索文档</span></button>
          </nav></div></Transition>
        </div>
      </div>
    </NLayoutHeader>
    <NModal v-model:show="searchOpen" :auto-focus="false" :mask-closable="true">
      <section class="search-dialog" :class="{ 'is-dark': isDarkMode }" role="dialog" aria-modal="true" aria-label="搜索文档">
        <div class="search-input-row"><NIcon :component="SearchOutline" /><input ref="searchInput" v-model="query" placeholder="搜索概念、协议或使用场景" @keydown.escape="searchOpen = false" @keydown.enter="openFirstResult" /><kbd>ESC</kbd></div>
        <div class="search-result-list" role="listbox">
          <a v-for="page in results" :key="page.path" :href="docPath(page.path)" role="option" @click="searchOpen = false"><span>{{ page.navTitle || page.title }}</span><small>{{ page.description }}</small></a>
          <p v-if="query.trim() && !results.length">没有匹配结果，请尝试其他关键词。</p>
          <p v-else-if="!query.trim()">搜索项目介绍、协议类型、客户端和使用场景。</p>
        </div>
      </section>
    </NModal>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { NButton, NConfigProvider, NIcon, NLayoutHeader, NModal } from 'naive-ui'
import { BookOutline, CodeSlashOutline, LogoGithub, MenuOutline, MoonOutline, RocketOutline, SearchOutline, SpeedometerOutline, SunnyOutline } from '@vicons/ionicons5'
import AppLogo from './AppLogo.vue'
import { docPages, docPath } from '../shared/docs'
import { searchDocuments } from '../shared/search'
import type { ThemeContext } from '../types/theme'
import { getExemptedTheme } from '../constants/theme'

const theme = inject<ThemeContext | null>('theme', null)
const isDarkMode = theme?.isDarkMode ?? ref(false)
const toggleTheme = theme?.toggleTheme ?? (() => {})
const showMenu = ref(false)
const searchOpen = ref(false)
const query = ref('')
const searchInput = ref<HTMLInputElement>()
const results = computed(() => searchDocuments(query.value, docPages.filter(page => page.index !== false)).slice(0, 8))
const menuItems = [
  { label: '首页', path: '/', icon: BookOutline },
  { label: '快速开始', path: docPath('guide/quick-start'), icon: RocketOutline },
  { label: '基础概念', path: docPath('concepts/overview'), icon: CodeSlashOutline },
  { label: '使用教程', path: docPath('usage/common'), icon: BookOutline },
]
function openFirstResult() { if (results.value[0]) location.href = docPath(results.value[0].path) }
function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchOpen.value = !searchOpen.value }
  if (event.key === 'Escape') showMenu.value = false
}
function onDocumentClick(event: MouseEvent) { if (!(event.target as HTMLElement).closest('.mobile-right')) showMenu.value = false }
watch(searchOpen, async open => { if (!open) { query.value = ''; return }; await nextTick(); searchInput.value?.focus() })
onMounted(() => { document.addEventListener('keydown', onKeydown); document.addEventListener('click', onDocumentClick) })
onUnmounted(() => { document.removeEventListener('keydown', onKeydown); document.removeEventListener('click', onDocumentClick) })
</script>

<style lang="scss" scoped>
@use '../assets/styles/components/docsTopMenu.scss' as *;
</style>
