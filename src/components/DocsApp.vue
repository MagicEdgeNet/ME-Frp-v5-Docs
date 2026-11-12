<template>
  <RouterView />
  <PageLoadingScreen v-if="pageLoadingScreenVisible" :cycle="pageLoadingScreenCycle" />
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useLoadingBar, useMessage } from 'naive-ui'
import PageLoadingScreen from './PageLoadingScreen.vue'
import { pageLoadingScreenCycle, pageLoadingScreenVisible, syncPageLoadingProgress } from '../shared/state/pageLoadingProgress'

window.$message = useMessage()
window.$loadingBar = useLoadingBar()
onMounted(syncPageLoadingProgress)
</script>
