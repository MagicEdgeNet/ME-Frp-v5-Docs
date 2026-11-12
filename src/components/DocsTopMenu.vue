<template>
  <NConfigProvider :theme-overrides="getExemptedTheme()">
  <!-- PC 端导航栏 -->
  <NLayoutHeader bordered class="navbar pc-navbar">
    <div class="navbar-content">
      <div class="logo">
        <div class="logo-link">
          <h2>ME Frp 幻缘映射 V5 使用文档</h2>
        </div>
      </div>

      <!-- 桌面端菜单 -->
      <div class="nav-links">
        <NSpace class="desktop-menu">
          <NSwitch size="small" :value="isDarkMode" @update:value="toggleTheme" :rail-style="exemptedSwc">
            <template #checked>
              <NIcon :component="Moon" />
            </template>
            <template #unchecked>
              <NIcon :component="Sunny" />
            </template>
          </NSwitch>
          <a href="https://www.mefrp.com/">
            <NButton text>回到首页</NButton>
          </a>
          <a href="https://www.mefrp.com/dashboard">
            <NButton text>管理面板</NButton>
          </a>
        </NSpace>
      </div>
    </div>
  </NLayoutHeader>

  <!-- 移动端导航栏 -->
  <NLayoutHeader bordered class="navbar mobile-navbar" style="user-select: none">
    <div class="mobile-header">
      <NPopover v-model:show="navOpen" trigger="click" placement="bottom-start" :show-arrow="false">
        <template #trigger>
          <NButton text class="mobile-menu-trigger" aria-label="打开站点导航" :aria-expanded="navOpen">
            <NIcon :component="MenuOutline" :size="22" />
          </NButton>
        </template>
        <NScrollbar class="docs-mobile-nav-scroll" style="width: min(320px, calc(100vw - 32px)); max-height: min(70dvh, 600px)" :x-scrollable="false" :native-scrollbar="false">
          <nav class="docs-mobile-nav-menu" aria-label="文档导航">
            <div class="docs-mobile-nav-links">
              <a href="https://www.mefrp.com/" @click="navOpen = false"><NButton text>首页</NButton></a>
              <a href="https://www.mefrp.com/dashboard" @click="navOpen = false"><NButton text>管理面板</NButton></a>
            </div>
            <NDivider />
            <DocsLeftMenu @menu-click="navOpen = false" />
          </nav>
        </NScrollbar>
      </NPopover>
      <NSwitch size="small" :value="isDarkMode" aria-label="切换主题" @update:value="toggleTheme" :rail-style="exemptedSwc">
        <template #checked><NIcon :component="Moon" /></template>
        <template #unchecked><NIcon :component="Sunny" /></template>
      </NSwitch>
    </div>
  </NLayoutHeader>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'
import type { ThemeContext } from '../types/theme'
import { NLayoutHeader, NButton, NSpace, NSwitch, NIcon, NDivider, NConfigProvider, NPopover, NScrollbar } from 'naive-ui'
import DocsLeftMenu from './DocsLeftMenu.vue'
import { MenuOutline, Moon, Sunny } from '@vicons/ionicons5'
import { getExemptedTheme, exemptedSwc } from '../constants/theme'

const navOpen = ref(false)
const themeCtx = inject<ThemeContext | null>('theme', null)
const isDarkMode = themeCtx?.isDarkMode ?? ref(false)
const toggleTheme = themeCtx?.toggleTheme ?? (() => {})
</script>

<style lang="scss" scoped>
@use '../assets/styles/components/docsTopMenu.scss' as *;
</style>
