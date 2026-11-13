<template>
  <NDropdown :options="appearanceOptions" placement="top-end" trigger="click" @select="handleSelect">
    <NFloatButton class="docs-settings-float" :width="40" :height="40" :right="24" :bottom="24" aria-label="网站设置" title="网站设置">
      <NIcon :component="SettingsOutline" :size="20" />
    </NFloatButton>
  </NDropdown>
</template>

<script setup lang="ts">
import { computed, h, inject, ref } from 'vue'
import { NDropdown, NFloatButton, NIcon } from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import { CheckmarkOutline, DesktopOutline, MoonOutline, SettingsOutline, SunnyOutline } from '@vicons/ionicons5'
import type { ThemeContext, ThemeMode } from '../types/theme'

const theme = inject<ThemeContext | null>('theme', null)
const mode = theme?.mode ?? ref<ThemeMode>('system')
const setMode = theme?.setMode ?? (() => {})
const appearanceOptions = computed<DropdownOption[]>(() => [
  { type: 'group', key: 'appearance', label: '外观', children: [
    { key: 'system', label: `${mode.value === 'system' ? '✓ ' : ''}跟随系统`, icon: () => h(NIcon, null, { default: () => h(mode.value === 'system' ? CheckmarkOutline : DesktopOutline) }) },
    { key: 'light', label: `${mode.value === 'light' ? '✓ ' : ''}浅色主题`, icon: () => h(NIcon, null, { default: () => h(mode.value === 'light' ? CheckmarkOutline : SunnyOutline) }) },
    { key: 'dark', label: `${mode.value === 'dark' ? '✓ ' : ''}深色主题`, icon: () => h(NIcon, null, { default: () => h(mode.value === 'dark' ? CheckmarkOutline : MoonOutline) }) },
  ] },
])

function handleSelect(key: string) {
  if (key === 'system' || key === 'light' || key === 'dark') setMode(key as ThemeMode)
}
</script>

<style lang="scss" scoped>
:global(.docs-settings-float) {
  z-index: 1300;
  transition: bottom 200ms ease;
}

:global(.docs-settings-float .n-float-button__fill) {
  border: 1px solid color-mix(in srgb, var(--n-text-color, #111827) 24%, transparent);
  background: color-mix(in srgb, var(--n-color, #fff) 90%, transparent);
  color: var(--n-text-color, #111827);
  box-shadow: 0 5px 18px color-mix(in srgb, var(--n-text-color, #111827) 22%, transparent);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  backdrop-filter: blur(16px) saturate(180%);
}

:global(.docs-settings-float:hover .n-float-button__fill) {
  background: var(--n-color-hover, #edf3fc);
}

:global(.docs-settings-float:focus-visible) {
  outline: 2px solid var(--n-color-target, #1d4ed8);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  :global(.docs-settings-float) { transition: none !important; }
}
</style>
