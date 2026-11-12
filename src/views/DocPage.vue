<template>
  <article class="docs-page" :class="{ 'has-outline': headings.length > 0 }">
    <div class="docs-body-column">
      <NBreadcrumb class="docs-breadcrumb" aria-label="面包屑">
        <NBreadcrumbItem><RouterLink to="/docs">{{ siteManifest.title }}</RouterLink></NBreadcrumbItem>
        <NBreadcrumbItem>{{ page?.title }}</NBreadcrumbItem>
      </NBreadcrumb>
      <NAlert v-if="error" type="error" title="文档加载失败">
        {{ error }} <NButton text @click="loadDocument">重试</NButton>
      </NAlert>
      <NSpin v-else-if="loading" aria-label="正在加载文档" />
      <MarkdownDisplay v-else :html="html" />
      <footer v-if="page" class="docs-page-footer">
        <NButton text tag="a" class="docs-edit-link" :href="`https://github.com/MagicEdgeNet/ME-Frp-v5-Docs/edit/main/pages/${page?.path || ''}.md`" target="_blank" rel="noopener noreferrer">
          <template #icon><NIcon :component="CreateOutline" /></template>
          在 GitHub 编辑此页
        </NButton>
        <nav class="docs-neighbors" aria-label="相邻文档">
          <RouterLink v-if="neighbors.previous" :to="docPath(neighbors.previous.path)">
            <span>上一篇</span><strong>{{ neighbors.previous.navTitle || neighbors.previous.title }}</strong>
          </RouterLink>
          <RouterLink v-if="neighbors.next" :to="docPath(neighbors.next.path)">
            <span>下一篇</span><strong>{{ neighbors.next.navTitle || neighbors.next.title }}</strong>
          </RouterLink>
        </nav>
      </footer>
    </div>
    <aside v-if="headings.length" class="docs-outline" aria-label="本页目录">
      <nav class="docs-toc">
        <div class="docs-outline-title">本页目录</div>
        <NAnchor :bound="130" :show-background="false" :show-rail="true">
          <NAnchorLink v-for="heading in headings" :key="heading.id"
            :href="`#${encodeURIComponent(heading.id)}`" :title="heading.text"
            :class="{ 'is-nested': heading.depth > minTocDepth, 'is-active': activeHeading === heading.id }"
            @click.prevent="scrollToHeading(heading.id)" />
        </NAnchor>
      </nav>
    </aside>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { NAlert, NAnchor, NAnchorLink, NBreadcrumb, NBreadcrumbItem, NButton, NIcon, NSpin } from 'naive-ui'
import { CreateOutline } from '@vicons/ionicons5'
import MarkdownDisplay from '../components/MarkdownDisplay.vue'
import { docsManifest as siteManifest, docNeighbors, docPath, findDocPage } from '../shared/docs'
import { beginPageRequest, completePageRequest } from '../shared/state/pageLoadingProgress'

const route = useRoute()
const emit = defineEmits<{
  (event: 'update:toc', toc: { headings: { id: string; text: string; depth: number }[]; activeHeading: string }): void
}>()
const page = computed(() => findDocPage(route.path))
const minTocDepth = computed(() => page.value?.toc?.minDepth ?? siteManifest.toc.minDepth)
const neighbors = computed(() => docNeighbors(route.path))
const html = ref('')
const headings = ref<{ id: string; text: string; depth: number }[]>([])
const loading = ref(true)
const error = ref('')
let controller: AbortController | undefined
let disposed = false
const activeHeading = ref('')
watch([headings, activeHeading], () => {
  emit('update:toc', { headings: headings.value, activeHeading: activeHeading.value })
}, { immediate: true })
let scrollFrame: number | undefined
const updateOutline = () => {
  if (scrollFrame !== undefined) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = undefined
    const container = document.querySelector<HTMLElement>('.docs-scroll > .n-scrollbar-container')
    if (!container) return
    let current = headings.value[0]?.id || ''
    for (const heading of headings.value) {
      const target = document.getElementById(heading.id)
      if (target && target.getBoundingClientRect().top <= container.getBoundingClientRect().top + 130) current = heading.id
    }
    activeHeading.value = current
  })
}

const scrollToHeading = (id: string) => {
  const container = document.querySelector<HTMLElement>('.docs-scroll > .n-scrollbar-container')
  const target = document.getElementById(id)
  if (container && target) {
    container.scrollTo({ top: container.scrollTop + target.getBoundingClientRect().top - container.getBoundingClientRect().top - 16, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  history.replaceState(history.state, '', `${route.path}#${encodeURIComponent(id)}`)
}
const loadDocument = async () => {
  controller?.abort()
  const request = controller = new AbortController()
  const progress = beginPageRequest()
  loading.value = true
  error.value = ''
  let failed = false
  try {
    if (!page.value) throw new Error('文档不存在')
    const response = await fetch(`/_docs-data/${page.value.path}.json`, { signal: request.signal })
    if (!response.ok) throw new Error(`请求失败（${response.status}）`)
    const data = await response.json()
    if (typeof data.html !== 'string' || !Array.isArray(data.headings)) throw new Error('文档构建产物无效')
    if (!disposed && request === controller) {
      html.value = data.html
      headings.value = data.headings
      activeHeading.value = data.headings[0]?.id || ''
    }
  } catch (cause) {
    if (!disposed && request === controller && !request.signal.aborted) {
      error.value = cause instanceof Error ? cause.message : '暂时无法获取文档，请重试'
      failed = true
    }
  } finally {
    if (!disposed && request === controller) loading.value = false
    completePageRequest(progress, failed)
  }
}
onMounted(() => {
  document.querySelector('.docs-scroll > .n-scrollbar-container')?.addEventListener('scroll', updateOutline, { passive: true })
  void loadDocument()
})
onBeforeUnmount(() => {
  disposed = true
  controller?.abort()
  document.querySelector('.docs-scroll > .n-scrollbar-container')?.removeEventListener('scroll', updateOutline)
  if (scrollFrame !== undefined) cancelAnimationFrame(scrollFrame)
})
</script>

<style lang="scss" scoped>
.docs-page { display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; gap: 32px; padding-bottom: 40px; }
.docs-page.has-outline { grid-template-columns: minmax(0, 1fr) 200px; }
.docs-body-column { min-width: 0; }
.docs-breadcrumb { margin-bottom: 20px; font-size: 14px; color: var(--docs-muted); }
a { color: var(--docs-accent); }
.docs-outline { position: sticky; top: 77px; align-self: start; max-height: calc(100dvh - 101px); overflow-y: auto; padding-left: 16px; }
.docs-outline-title { margin-bottom: 12px; font-size: 14px; font-weight: 600; }
.docs-toc ul { list-style: none; padding: 0; margin: 0; }
.docs-toc li { margin: 8px 0; line-height: 1.5; font-size: 13px; }
.docs-toc a { color: var(--docs-muted); text-decoration: none; }
.docs-toc a:hover, .docs-toc a.is-active { color: var(--docs-accent); }
.docs-toc .is-active { font-weight: 600; }
.docs-toc :deep(.is-active .n-anchor-link__title) { color: var(--docs-accent); font-weight: 600; }
.docs-toc .is-nested { padding-left: 12px; }
@media (max-width: 1199px) {
  .docs-page.has-outline { grid-template-columns: minmax(0, 1fr); }
  .docs-outline { display: none; }
}
.docs-page-footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--docs-line); }
.docs-edit-link { margin-bottom: 4px; }
.docs-neighbors { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
.docs-neighbors a {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  min-height: 68px;
  padding: 12px 16px;
  border: 1px solid var(--docs-line);
  border-radius: 6px;
  color: var(--docs-muted);
  font-size: 14px;
  line-height: 1.5;
  text-decoration: none;
  overflow-wrap: anywhere;
  transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
}
.docs-neighbors a span { color: var(--docs-muted); font-size: 12px; }
.docs-neighbors a strong { margin-top: 4px; color: inherit; font-size: 14px; font-weight: 600; }
.docs-neighbors a:first-child { align-items: flex-start; text-align: left; }
.docs-neighbors a:last-child { align-items: flex-end; text-align: right; }
.docs-neighbors a:hover { border-color: var(--docs-accent); color: var(--docs-accent); background: var(--docs-bg); }
:deep(.docs-callout) { margin: 16px 0; }
:deep(.docs-callout-body > :first-child) { margin-top: 0; }
:deep(.docs-callout-body > :last-child) { margin-bottom: 0; }
@media (max-width: 520px) {
  .docs-neighbors { grid-template-columns: minmax(0, 1fr); }
  .docs-neighbors a:last-child { align-items: flex-start; text-align: left; }
}
</style>
