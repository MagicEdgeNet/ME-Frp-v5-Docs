<template>
  <NDropdown :options="settingsOptions" placement="top-end" trigger="click">
    <NFloatButton class="docs-settings-float" :width="40" :height="40" :right="24" :bottom="24" aria-label="网站设置" title="网站设置">
      <NIcon :component="SettingsOutline" :size="20" />
    </NFloatButton>
  </NDropdown>
</template>

<script setup lang="ts">
import { computed, h, inject, ref } from 'vue'
import { NDropdown, NFloatButton, NIcon, NSwitch } from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import { MoonOutline, SettingsOutline, SunnyOutline } from '@vicons/ionicons5'
import { exemptedSwc } from '../constants/theme'
import type { ThemeContext } from '../types/theme'

const theme = inject<ThemeContext | null>('theme', null)
const isDarkMode = theme?.isDarkMode ?? ref(false)
const toggleTheme = theme?.toggleTheme ?? (() => {})

const settingsOptions = computed<DropdownOption[]>(() => [
  {
    key: 'theme',
    type: 'render',
    render: () => h('div', {
      style: 'display: flex; align-items: center; padding: 8px 12px; height: 20px;',
      role: 'menuitem'
    }, [
      h('span', { style: 'flex: 1; margin-right: 12px; font-size: 14px;' }, '主题切换'),
      h(NSwitch, {
        value: isDarkMode.value,
        'onUpdate:value': toggleTheme,
        railStyle: exemptedSwc,
        size: 'small',
        'aria-label': '切换深色模式',
        'aria-checked': isDarkMode.value,
        role: 'switch'
      }, {
        checked: () => h(NIcon, { 'aria-hidden': 'true' }, { default: () => h(MoonOutline) }),
        unchecked: () => h(NIcon, { 'aria-hidden': 'true' }, { default: () => h(SunnyOutline) })
      })
    ])
  }
])
</script>

<style lang="scss" scoped>
:global(.docs-settings-float) {
  z-index: 1300;
  transition: bottom 200ms ease;
}

:global(.docs-settings-float .n-float-button__fill) {
  border: 2px solid var(--n-text-color, #111111);
  background: var(--n-color-popover, #ffffff);
  color: var(--n-text-color, #111111);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

:global(.docs-settings-float:hover .n-float-button__fill) {
  background: var(--n-color-hover, #eeeeee);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.36);
}

:global(.docs-settings-float:focus-visible) {
  outline: 3px solid var(--n-text-color, #111111);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  :global(.docs-settings-float) { transition: none !important; }
}
</style>
