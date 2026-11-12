<template>
  <NConfigProvider :theme-overrides="getExemptedTheme()" abstract>
    <div class="menu-container">
      <NScrollbar style="height: 100%" :x-scrollable="false">
        <NMenu v-model:expanded-keys="expandedKeys" :value="activeKey" :options="menuOptions" :indent="18"
          :collapsed="collapsed" :collapsed-width="64" :icon-size="18" :collapsed-icon-size="22" />
      </NScrollbar>
    </div>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { computed, h, ref, watch, type Component } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { NConfigProvider, NMenu, NScrollbar, NIcon, type MenuOption } from 'naive-ui'
import {
  AlertCircleOutline, DocumentLockOutline, InformationCircleOutline, RocketOutline,
  PersonOutline, WifiOutline, PhonePortraitOutline, ShieldCheckmarkOutline, GlobeOutline,
  HelpCircleOutline, AppsOutline, GameControllerOutline, DesktopOutline, TerminalOutline,
  FolderOutline, CodeSlashOutline, ServerOutline
} from '@vicons/ionicons5'
import { getExemptedTheme } from '../constants/theme'
import { docGroups, docPath } from '../shared/docs'

defineProps<{ collapsed?: boolean }>()
const emit = defineEmits(['menu-click'])
const route = useRoute()
const activeKey = computed(() => route.path.replace(/^\/docs\//, '').replace(/\/$/, ''))
const expandedKeys = ref(docGroups.filter(group => !group.standalone).map(group => group.id))
const icons: Record<string, Component> = {
  AlertCircleOutline, DocumentLockOutline, InformationCircleOutline, RocketOutline,
  PersonOutline, WifiOutline, PhonePortraitOutline, ShieldCheckmarkOutline, GlobeOutline,
  HelpCircleOutline, AppsOutline, GameControllerOutline, DesktopOutline, TerminalOutline,
  FolderOutline, CodeSlashOutline, ServerOutline
}
const renderIcon = (name?: string) => () => h(NIcon, null, { default: () => h(icons[name || ''] || DocumentLockOutline) })
const pageOption = (page: (typeof docGroups)[number]['pages'][number]): MenuOption => ({
  key: page.path,
  label: () => h(RouterLink, { to: docPath(page.path), onClick: () => emit('menu-click') }, { default: () => page.navTitle || page.title }),
  icon: renderIcon(page.icon)
})
const menuOptions: MenuOption[] = docGroups.map(group => group.standalone ? pageOption(group.pages[0]) : ({
  key: group.id,
  label: group.title,
  icon: renderIcon(group.icon),
  children: group.pages.map(pageOption)
}))
watch(activeKey, key => {
  const group = docGroups.find(group => group.pages.some(page => page.path === key))
  if (group && !expandedKeys.value.includes(group.id)) expandedKeys.value.push(group.id)
})
</script>

<style lang="scss" scoped>
.menu-container { height: 100%; overflow: hidden; }
</style>
