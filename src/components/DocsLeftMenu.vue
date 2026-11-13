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
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NConfigProvider, NMenu, NScrollbar } from 'naive-ui'
import { getExemptedTheme } from '../constants/theme'
import { createDocsMenuOptions, docsMenuActiveKey, docsMenuExpandedKeys } from '../shared/docsMenu'

defineProps<{ collapsed?: boolean }>()
const emit = defineEmits(['menu-click'])
const route = useRoute()
const activeKey = computed(() => docsMenuActiveKey(route.path))
const expandedKeys = ref([...docsMenuExpandedKeys])
const menuOptions = createDocsMenuOptions(() => emit('menu-click'))
watch(activeKey, key => {
  const group = menuOptions.find(option => option.children?.some(child => child.key === key))
  if (group && !expandedKeys.value.includes(String(group.key))) expandedKeys.value.push(String(group.key))
})
</script>

<style lang="scss" scoped>
.menu-container { height: 100%; overflow: hidden; }
</style>
