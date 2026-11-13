<template>
  <div v-if="isMobile" ref="barRef" class="docs-sub-menu">
    <NButton
      class="toc-trigger"
      text
      :aria-expanded="tocOpen"
      aria-controls="mobile-docs-toc"
      @click="tocOpen = !tocOpen"
      @keydown.esc="tocOpen = false"
    >
      <span class="toc-trigger-label">{{ props.activeTitle || props.title || currentTitle }}</span>
      <span class="toc-trigger-hint">本页目录</span>
      <NIcon :component="tocOpen ? ChevronUpOutline : ChevronDownOutline" :size="18" />
    </NButton>
  </div>
  <NDrawer
    v-if="isMobile"
    v-model:show="tocOpen"
    class="mobile-toc-drawer-panel"
    :class="{ 'is-dark': isDarkMode }"
    placement="top"
    :height="drawerHeight"
    :z-index="1200"
    :style="{ top: `${drawerTop}px` }"
    :mask-closable="true"
  >
    <NDrawerContent :native-scrollbar="false" body-content-class="mobile-toc-drawer-content"
      body-content-style="padding: 8px 12px 12px">
      <nav id="mobile-docs-toc" class="mobile-toc-drawer" aria-label="本页目录">
        <NAnchor :bound="130" :show-background="false" :show-rail="false">
          <NAnchorLink
            v-for="heading in props.headings"
            :key="heading.id"
            :href="`#${encodeURIComponent(heading.id)}`"
            :title="heading.text"
            :class="{ 'is-nested': heading.depth > 2, 'is-active': props.activeHeading === heading.id }"
            @click.prevent="selectHeading(heading.id)"
          ><template #title><span :aria-current="props.activeHeading === heading.id ? 'location' : undefined">{{ heading.text }}</span></template></NAnchorLink>
        </NAnchor>
        <p v-if="!props.headings.length" class="toc-empty">本页暂无目录</p>
      </nav>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NAnchor, NAnchorLink, NButton, NDrawer, NDrawerContent, NIcon } from 'naive-ui'
import { ChevronDownOutline, ChevronUpOutline } from '@vicons/ionicons5'
import type { ThemeContext } from '../types/theme'
import type { PropType } from 'vue'

type DocHeading = { id: string; text: string; depth: number }

const props = defineProps({
  title: { type: String, default: '' },
  headings: { type: Array as PropType<DocHeading[]>, default: () => [] },
  activeHeading: { type: String, default: '' },
  activeTitle: { type: String, default: '' },
  scrollToHeading: { type: Function as PropType<(id: string) => void>, required: true }
})

const isMobile = ref(window.innerWidth <= 768 || window.screen.width <= 768)
const tocOpen = ref(false)
const barRef = ref<HTMLElement | null>(null)
const isDarkMode = inject<ThemeContext | null>('theme', null)?.isDarkMode ?? ref(false)
const drawerTop = ref(104)
const route = useRoute()
const currentTitle = computed(() => (route.meta.title as string) || '文档')
const viewportHeight = ref(window.innerHeight)
const drawerHeight = computed(() => Math.max(120, Math.min(640, viewportHeight.value - drawerTop.value - 24)))

const updateDrawerTop = () => {
  if (barRef.value) drawerTop.value = Math.round(barRef.value.getBoundingClientRect().bottom)
}
const selectHeading = (id: string) => {
  tocOpen.value = false
  props.scrollToHeading(id)
}
watch(() => route.path, () => { tocOpen.value = false })

const handleResize = () => {
  viewportHeight.value = window.innerHeight
  isMobile.value = window.innerWidth <= 768 || window.screen.width <= 768
  if (isMobile.value) updateDrawerTop()
  else tocOpen.value = false
}
onMounted(() => {
  updateDrawerTop()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<style lang="scss" scoped>
@use '../assets/styles/components/docsSubMenu.scss';
</style>
