<template>
  <div class="portal-shell" :class="{ 'is-dark': isDarkMode }">
    <DocsTopMenu />
    <main class="portal-home">
    <section class="portal-hero">
      <div class="hero-copy">
        <div class="hero-kicker"><span class="status-dot"></span> ME FRP / KNOWLEDGE BASE</div>
        <h1>把内网服务，<br /><span>带到你需要的地方。</span></h1>
        <p>从第一条隧道到复杂网络配置，按概念、类型和使用场景逐步了解 ME Frp。</p>
        <div class="hero-actions">
          <NButton type="primary" size="large" tag="a" :href="docPath('guide/quick-start')">
            开始快速配置 <template #icon><NIcon :component="ArrowForwardOutline" /></template>
          </NButton>
          <NButton quaternary size="large" tag="a" :href="docPath('introduction')">了解项目</NButton>
        </div>
      </div>
      <div class="connection-figure" aria-label="访问者经节点和 frpc 访问内网服务">
        <div class="figure-label">连接路径 <span>TCP / TLS</span></div>
        <div class="network-line"></div>
        <div class="network-node visitor"><NIcon :component="GlobeOutline" /><small>访问者</small></div>
        <div class="network-node relay"><NIcon :component="ServerOutline" /><small>ME Frp 节点</small><code>frps</code></div>
        <div class="network-node client"><NIcon :component="LaptopOutline" /><small>你的设备</small><code>frpc</code></div>
        <div class="network-node service"><NIcon :component="CubeOutline" /><small>本地服务</small></div>
        <div class="figure-caption"><span>公网入口</span><span>加密连接</span><span>本地端口</span></div>
      </div>
    </section>

    <section class="portal-search" aria-label="搜索文档">
      <NInput v-model:value="query" size="large" clearable placeholder="搜索 frpc、TCP、端口映射..." @keydown.enter="openFirstResult">
        <template #prefix><NIcon :component="SearchOutline" /></template>
        <template #suffix><kbd>Enter</kbd></template>
      </NInput>
      <div v-if="query.trim()" class="search-results" role="listbox" aria-label="搜索结果">
        <a v-for="page in searchResults" :key="page.path" :href="docPath(page.path)" role="option">
          <span>{{ page.title }}</span><small>{{ page.description }}</small>
        </a>
        <p v-if="!searchResults.length">没有匹配的文档</p>
      </div>
    </section>

    <section class="portal-section route-section">
      <div class="section-heading"><div><span class="section-label">START HERE</span><h2>先建立正确的心智模型</h2></div><p>三步理解服务如何从内网抵达公网</p></div>
      <div class="route-grid">
        <a v-for="(item, index) in learningPath" :key="item.path" class="route-item" :href="docPath(item.path)">
          <span class="route-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <div><h3>{{ item.title }}</h3><p>{{ item.description }}</p></div>
          <NIcon :component="ArrowForwardOutline" />
        </a>
      </div>
    </section>

    <section class="portal-section protocols-section">
      <div class="section-heading"><div><span class="section-label">PROXY TYPES</span><h2>按服务选择穿透类型</h2></div><a :href="docPath('concepts/protocols')">查看类型说明 <NIcon :component="ArrowForwardOutline" /></a></div>
      <div class="protocol-list">
        <a v-for="item in protocols" :key="item.name" :href="docPath('concepts/protocols')" class="protocol-row">
          <code>{{ item.name }}</code><span>{{ item.use }}</span><small>{{ item.example }}</small><NIcon :component="ArrowForwardOutline" />
        </a>
      </div>
    </section>

    <section class="portal-section library-section">
      <div class="section-heading"><div><span class="section-label">DOCUMENTATION</span><h2>按主题浏览</h2></div><p>{{ groups.length }} 个主题 · {{ searchablePages.length }} 篇文档</p></div>
      <div class="library-grid">
        <a v-for="group in groups" :key="group.id" class="library-group" :href="docPath(group.pages[0].path)">
          <div class="library-group-heading"><NIcon :component="iconFor(group.icon)" /><span>{{ group.title }}</span><small>{{ group.pages.length }}</small></div>
          <ul><li v-for="page in group.pages.slice(0, 5)" :key="page.path"><span>{{ page.navTitle || page.title }}</span><NIcon :component="ArrowForwardOutline" /></li></ul>
          <span v-if="group.pages.length > 5" class="more-pages">还有 {{ group.pages.length - 5 }} 篇</span>
        </a>
      </div>
    </section>

    <section class="portal-footer-cta">
      <div><span class="section-label">READY TO CONNECT</span><h2>创建你的第一条隧道</h2><p>在管理面板创建代理，然后让客户端连接到 ME Frp 节点。</p></div>
      <NButton type="primary" tag="a" href="https://www.mefrp.com/dashboard">打开管理面板 <template #icon><NIcon :component="ArrowForwardOutline" /></template></NButton>
    </section>
    <footer class="portal-footer"><span>ME Frp 幻缘映射 V5 文档</span><a href="https://www.mefrp.com/">官网</a><a href="https://github.com/MagicEdgeNet/ME-Frp-v5-Docs">GitHub</a><span>代码 MIT · 原创文档 CC BY-NC-SA 4.0</span></footer>
  </main>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, type Component } from 'vue'
import { NButton, NIcon, NInput } from 'naive-ui'
import { ArrowForwardOutline, AppsOutline, AlertCircleOutline, BookOutline, CodeSlashOutline, DocumentLockOutline, DocumentTextOutline, FolderOutline, GameControllerOutline, GlobeOutline, HelpCircleOutline, InformationCircleOutline, LaptopOutline, PhonePortraitOutline, RocketOutline, SearchOutline, ServerOutline, ShieldCheckmarkOutline, TerminalOutline, WifiOutline, CubeOutline, PersonOutline, DesktopOutline } from '@vicons/ionicons5'
import type { ThemeContext } from '../types/theme'
import { docGroups, docPages, docPath } from '../shared/docs'
import DocsTopMenu from '../components/DocsTopMenu.vue'
import { searchDocuments, type SearchResult } from '../shared/search'

const theme = inject<ThemeContext | null>('theme', null)
const isDarkMode = theme?.isDarkMode ?? ref(false)
const query = ref('')
const groups = docGroups.filter(group => group.id !== 'maintenance')
const searchablePages = docPages.filter(page => page.index !== false)
const searchResults = computed(() => searchDocuments(query.value, searchablePages).slice(0, 6))
const iconMap: Record<string, Component> = { AppsOutline, AlertCircleOutline, BookOutline, CodeSlashOutline, DocumentLockOutline, DocumentTextOutline, FolderOutline, GameControllerOutline, GlobeOutline, HelpCircleOutline, InformationCircleOutline, PhonePortraitOutline, RocketOutline, ShieldCheckmarkOutline, TerminalOutline, WifiOutline, PersonOutline, DesktopOutline, ServerOutline }
const iconFor = (name?: string) => iconMap[name || ''] || DocumentTextOutline
const learningPath = [
  { path: 'concepts/overview', title: '理解内网穿透', description: '知道为什么内网设备需要借助公网节点接受连接。' },
  { path: 'concepts/frpc-frps', title: '认识 frpc 与 frps', description: '分清运行在本地设备上的客户端和节点上的服务端。' },
  { path: 'guide/quick-start', title: '启动第一条隧道', description: '创建代理、启动客户端，并从外部网络验证访问。' },
]
const protocols = [
  { name: 'TCP', use: '通用连接', example: 'SSH · RDP · Minecraft' },
  { name: 'UDP', use: '实时数据报', example: '游戏 · 语音' },
  { name: 'HTTP / HTTPS', use: '网站和 API', example: 'Web 服务 · 控制台' },
  { name: 'STCP / XTCP / SUDP', use: '受限或点对点连接', example: '私有服务 · 直连场景' },
]
function openFirstResult() {
  const first = searchResults.value[0]
  if (first) location.href = docPath((first as SearchResult).path)
}
</script>

<style lang="scss" scoped>
@use '../assets/styles/components/docsHome.scss' as *;
</style>
