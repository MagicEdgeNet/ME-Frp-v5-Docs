<script setup lang="ts">
import { inject, computed, ref } from 'vue'
import type { ThemeContext } from '../types/theme'

const themeCtx = inject<ThemeContext | null>('theme', null)
const isDarkMode = themeCtx?.isDarkMode ?? ref(false)

// 生成唯一 ID 防止多个 Logo 实例（PC/移动端同时存在）导致 SVG 引用失效
const instanceId = Math.random().toString(36).substring(2, 9)
const mainGradId = computed(() => `mainGrad-${instanceId}`)
const bgGradId = computed(() => `bgGrad-${instanceId}`)
</script>

<template>
    <div class="app-logo-wrapper">
        <!-- Light mode logo -->
        <svg v-if="!isDarkMode" class="logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient :id="mainGradId" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2393f2" />
                    <stop offset="100%" stop-color="#00c6ff" />
                </linearGradient>
                <!-- <linearGradient :id="bgGradId" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#e3f2fd" />
                    <stop offset="100%" stop-color="#bbdefb" />
                </linearGradient> -->
            </defs>
            <rect width="100" height="100" rx="20" :fill="`url(#${bgGradId})`" />
            <g transform="translate(50, 50)">
                <path d="M -25 -20 L -5 0 L -25 20" fill="none" stroke="#2393f2" stroke-width="5" stroke-linecap="round"
                    stroke-linejoin="round" opacity="0.3" />
                <path d="M -10 -20 L 10 0 L -10 20" fill="none" stroke="#2393f2" stroke-width="5" stroke-linecap="round"
                    stroke-linejoin="round" opacity="0.6" />
                <path d="M 5 -20 L 25 0 L 5 20" fill="none" :stroke="`url(#${mainGradId})`" stroke-width="5"
                    stroke-linecap="round" stroke-linejoin="round" />
            </g>
        </svg>

        <!-- Dark mode logo -->
        <svg v-else class="logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient :id="mainGradId" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#51A9F5" />
                    <stop offset="100%" stop-color="#00d4ff" />
                </linearGradient>
                <!-- <linearGradient :id="bgGradId" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1e3a5f" />
                    <stop offset="100%" stop-color="#0d47a1" />
                </linearGradient> -->
            </defs>
            <rect width="100" height="100" rx="20" :fill="`url(#${bgGradId})`" />
            <g transform="translate(50, 50)">
                <path d="M -25 -20 L -5 0 L -25 20" fill="none" stroke="#51A9F5" stroke-width="5" stroke-linecap="round"
                    stroke-linejoin="round" opacity="0.3" />
                <path d="M -10 -20 L 10 0 L -10 20" fill="none" stroke="#51A9F5" stroke-width="5" stroke-linecap="round"
                    stroke-linejoin="round" opacity="0.6" />
                <path d="M 5 -20 L 25 0 L 5 20" fill="none" :stroke="`url(#${mainGradId})`" stroke-width="5"
                    stroke-linecap="round" stroke-linejoin="round" />
            </g>
        </svg>
    </div>
</template>

<style scoped>
.app-logo-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
}

.logo-svg {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
}
</style>
