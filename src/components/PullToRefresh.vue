<template>
  <div v-show="distance > 0 || refreshing" class="pull-to-refresh" role="status" aria-live="polite"
    :style="{ top: `${top}px`, left: `${left}px`, width: `${width}px` }">
    <span class="pull-to-refresh-label">
      <NSpin v-if="refreshing" :size="16" />
      <NIcon v-else :component="distance >= threshold ? RefreshOutline : ArrowDownOutline" :size="18" />
      {{ refreshing ? '正在刷新…' : distance >= threshold ? '释放刷新' : '下拉刷新' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NIcon, NSpin } from 'naive-ui'
import { ArrowDownOutline, RefreshOutline } from '@vicons/ionicons5'

// Bind only to the page's main NScrollbar, never a sidebar or popup.
const props = defineProps<{ top: number; target: string }>()
const route = useRoute()
const distance = ref(0)
const refreshing = ref(false)
const left = ref(0)
const width = ref(0)
const threshold = 64
let container: HTMLElement | null = null
let start: { x: number; y: number; id: number } | undefined
let pulling = false

const reset = () => {
  start = undefined
  pulling = false
  if (!refreshing.value) distance.value = 0
}

const eligibleTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element) || target.closest('input, textarea, select, button, [contenteditable]:not([contenteditable="false"]), [role="slider"]')) return false
  for (let el: Element | null = target; el && el !== container; el = el.parentElement) {
    const style = getComputedStyle(el)
    if ((/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) ||
        (/(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth)) return false
  }
  return true
}

const onStart = (event: TouchEvent) => {
  reset()
  if (refreshing.value || event.touches.length !== 1 || !container || container.scrollTop > 0 || !eligibleTarget(event.target)) return
  const touch = event.touches[0]!
  start = { x: touch.clientX, y: touch.clientY, id: touch.identifier }
}
const onMove = (event: TouchEvent) => {
  if (!start) return
  const touch = event.touches[0]
  if (event.touches.length !== 1 || !touch || touch.identifier !== start.id || !container || container.scrollTop > 0) return reset()
  const dx = Math.abs(touch.clientX - start.x)
  const dy = touch.clientY - start.y
  if (!pulling) {
    if (Math.max(dx, Math.abs(dy)) < 10) return
    if (dy <= 0 || dy <= dx * 1.2) return reset()
    pulling = true
  }
  if (!event.cancelable) return reset()
  event.preventDefault()
  const bounds = container.getBoundingClientRect()
  left.value = bounds.left
  width.value = bounds.width
  distance.value = Math.min(96, Math.max(0, dy) * 0.35)
}
const onEnd = () => {
  if (pulling && distance.value >= threshold && !refreshing.value) {
    refreshing.value = true
    start = undefined
    pulling = false
    window.location.reload()
  } else reset()
}

watch(() => route.fullPath, reset)
onMounted(() => {
  container = document.querySelector<HTMLElement>(props.target)
  container?.addEventListener('touchstart', onStart, { passive: true })
  container?.addEventListener('touchmove', onMove, { passive: false })
  container?.addEventListener('touchend', onEnd)
  container?.addEventListener('touchcancel', reset)
})
onBeforeUnmount(() => {
  container?.removeEventListener('touchstart', onStart)
  container?.removeEventListener('touchmove', onMove)
  container?.removeEventListener('touchend', onEnd)
  container?.removeEventListener('touchcancel', reset)
})
</script>

<style scoped>
.pull-to-refresh {
  position: fixed;
  z-index: 1203;
  display: flex;
  justify-content: center;
  pointer-events: none;
}
.pull-to-refresh-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid var(--docs-line, var(--db-line));
  border-radius: 20px;
  background: var(--docs-bg, var(--db-bg));
  color: var(--docs-muted, var(--db-muted));
  font-size: 13px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
}
</style>
