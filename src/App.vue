<template>
  <NConfigProvider :theme="isDarkMode ? darkTheme : null" :theme-overrides="getWorkbenchThemeOverrides(isDarkMode)">
    <NGlobalStyle />
    <NLoadingBarProvider><NMessageProvider><DocsApp /></NMessageProvider></NLoadingBarProvider>
  </NConfigProvider>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import { darkTheme, NConfigProvider, NGlobalStyle, NLoadingBarProvider, NMessageProvider } from 'naive-ui'
import type { ThemeContext } from './types/theme'
import { getWorkbenchThemeOverrides } from './constants/theme'
import DocsApp from './components/DocsApp.vue'
const { isDarkMode } = inject<ThemeContext>('theme')!
</script>
