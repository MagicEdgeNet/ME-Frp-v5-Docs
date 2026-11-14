<template>
  <div class="page-loading-screen" :class="{ 'is-dark': isDarkMode }" role="status" aria-label="ME Frp 正在加载">
    <div class="loading-brand" :key="cycle">
      <svg class="loading-mark" viewBox="-50 -32 100 64" aria-hidden="true">
        <path class="loading-chevron loading-chevron--first" d="M -25 -20 L -5 0 L -25 20" />
        <path class="loading-chevron loading-chevron--second" d="M -10 -20 L 10 0 L -10 20" />
        <path class="loading-chevron loading-chevron--third" d="M 5 -20 L 25 0 L 5 20" />
      </svg>
      <span class="loading-name"><strong>ME Frp</strong><span>幻缘映射</span></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import type { ThemeContext } from '../types/theme'

defineProps<{ cycle: number }>()
const theme = inject<ThemeContext | null>('theme', null)
const isDarkMode = theme?.isDarkMode
</script>

<style scoped>
.page-loading-screen {
  position: fixed;
  z-index: 99999;
  inset: 0;
  display: grid;
  place-items: center;
  background: #fff;
  color: #1f2937;
}

.page-loading-screen.is-dark { background: #0f141c; color: #eef2f6; }
.loading-brand { position: relative; width: 340px; max-width: calc(100vw - 24px); height: 80px; }

.loading-mark {
  position: absolute;
  top: 8px;
  left: 0;
  width: 92px;
  height: 64px;
  color: #2393f2;
  animation: mark-shift 1600ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.is-dark .loading-mark { color: #51a9f5; }
.loading-chevron { fill: none; stroke: currentColor; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
.loading-chevron--first { animation: chevron-first 1600ms ease both; }
.loading-chevron--second { animation: chevron-second 1600ms ease both; }
.loading-chevron--third { animation: chevron-third 1600ms ease both; }

.loading-name {
  position: absolute;
  top: 0;
  left: 96px;
  display: flex;
  height: 80px;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  animation: name-reveal 1600ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.loading-name strong,
.loading-name span { font-size: 25px; font-weight: 650; line-height: 1.15; }

@keyframes chevron-first {
  0%, 8% { opacity: 0; transform: translateX(-30px); }
  40%, 100% { opacity: 0.3; transform: translateX(0); }
}
@keyframes chevron-second {
  0%, 16% { opacity: 0; transform: translateX(-12px); }
  46%, 100% { opacity: 0.6; transform: translateX(0); }
}
@keyframes chevron-third {
  0%, 24% { opacity: 0; transform: translateX(30px); }
  50%, 100% { opacity: 1; transform: translateX(0); }
}
@keyframes mark-shift {
  0%, 50% { transform: translateX(124px); }
  72%, 100% { transform: translateX(0); }
}
@keyframes name-reveal {
  0%, 64% { opacity: 0; transform: translateX(12px); }
  84%, 100% { opacity: 1; transform: translateX(0); }
}
@media (max-width: 380px) {
  .loading-name strong, .loading-name span { font-size: 21px; }
}

@media (prefers-reduced-motion: reduce) {
  .loading-mark, .loading-chevron, .loading-name { animation-duration: 1ms; }
}
</style>
