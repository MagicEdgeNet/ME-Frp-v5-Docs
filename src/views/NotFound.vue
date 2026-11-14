<template>
  <main class="not-found">
    <NResult status="404" title="文档未找到" description="此页面不存在，可能已移动或链接有误。">
      <template #footer><NButton tag="a" href="/docs/">返回文档首页</NButton></template>
    </NResult>
  </main>
</template>
<script setup lang="ts">
import { NButton, NResult } from 'naive-ui'
</script>
<style scoped>.not-found { display: grid; place-items: center; min-height: 100dvh; }</style>
