<template>
  <div class="portal-shell" :class="{ 'is-dark': isDarkMode }">
    <DocsTopMenu />
    <main class="portal-home">
      <section class="portal-hero">
        <div class="hero-copy">
          <div class="hero-kicker"><span class="status-dot"></span> ME FRP · 使用文档</div>
          <h1>让内网服务，<br /><span>随时随地安全可达。</span></h1>
          <p>了解内网穿透的工作方式，选择适合的连接类型，快速启动你的第一条隧道。</p>
          <div class="hero-actions">
            <NButton type="primary" size="large" tag="a" :href="docPath('introduction')">开始快速配置 <template #icon><NIcon :component="ArrowForwardOutline" /></template></NButton>
            <NButton quaternary size="large" tag="a" :href="docPath('introduction')">了解 ME Frp</NButton>
          </div>
        </div>
        <nav class="hero-shortcuts" aria-label="常用文档">
          <span class="section-label">常用入口</span>
          <a v-for="item in learningPath" :key="item.path" :href="docPath(item.path)">
            <span><small>{{ item.step }}</small><strong>{{ item.title }}</strong><em>{{ item.description }}</em></span>
            <NIcon :component="ArrowForwardOutline" />
          </a>
        </nav>
      </section>

      <section class="portal-section protocols-section">
        <div class="section-heading"><div><span class="section-label">连接类型</span><h2>按服务选择穿透方式</h2></div><a :href="docPath('concepts/protocols')">了解全部类型 <NIcon :component="ArrowForwardOutline" /></a></div>
        <div class="protocol-list">
          <a v-for="item in protocols" :key="item.name" :href="docPath('concepts/protocols')" class="protocol-row">
            <code>{{ item.name }}</code><span>{{ item.use }}</span><small>{{ item.example }}</small><NIcon :component="ArrowForwardOutline" />
          </a>
        </div>
        <p class="protocol-notice"><strong>暂不支持：</strong>STCP、SUDP、XTCP 当前不可在 ME Frp 使用。<a :href="docPath('concepts/protocols')">查看穿透类型说明</a></p>
      </section>

      <section class="portal-section library-section">
        <div class="section-heading"><div><span class="section-label">文档目录</span><h2>按主题浏览</h2></div><p>{{ groups.length }} 个主题</p></div>
        <div class="library-grid">
          <a v-for="group in groups" :key="group.id" class="library-group" :href="docPath(group.pages[0].path)">
            <div class="library-group-heading"><NIcon :component="iconFor(group.icon)" /><span>{{ group.title }}</span><small>{{ group.pages.length }}</small></div>
            <ul><li v-for="page in group.pages.slice(0, 5)" :key="page.path"><span>{{ page.navTitle || page.title }}</span><NIcon :component="ArrowForwardOutline" /></li></ul>
            <span v-if="group.pages.length > 5" class="more-pages">还有 {{ group.pages.length - 5 }} 篇</span>
          </a>
        </div>
      </section>

      <section class="portal-footer-cta">
        <div><span class="section-label">开始使用</span><h2>创建你的第一条隧道</h2><p>在管理面板创建代理，然后让客户端连接到 ME Frp 节点。</p></div>
        <NButton type="primary" tag="a" href="https://www.mefrp.com/dashboard">打开管理面板 <template #icon><NIcon :component="ArrowForwardOutline" /></template></NButton>
      </section>
    </main>
    <HomeFooter />
  </div>
</template>

<script setup lang="ts">
import { inject, ref, type Component } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { AlertCircleOutline, AppsOutline, ArrowForwardOutline, BookOutline, CodeSlashOutline, DesktopOutline, DocumentLockOutline, DocumentTextOutline, FolderOutline, GameControllerOutline, GlobeOutline, HelpCircleOutline, InformationCircleOutline, PersonOutline, PhonePortraitOutline, RocketOutline, ServerOutline, ShieldCheckmarkOutline, TerminalOutline, WifiOutline } from '@vicons/ionicons5'
import type { ThemeContext } from '../types/theme'
import { docGroups, docPath } from '../shared/docs'
import DocsTopMenu from '../components/DocsTopMenu.vue'
import HomeFooter from '../components/HomeFooter.vue'

const theme = inject<ThemeContext | null>('theme', null)
const isDarkMode = theme?.isDarkMode ?? ref(false)
const groups = docGroups.filter(group => group.id !== 'maintenance')
const iconMap: Record<string, Component> = { AppsOutline, AlertCircleOutline, BookOutline, CodeSlashOutline, DocumentLockOutline, DocumentTextOutline, FolderOutline, GameControllerOutline, GlobeOutline, HelpCircleOutline, InformationCircleOutline, PhonePortraitOutline, RocketOutline, ShieldCheckmarkOutline, TerminalOutline, WifiOutline, PersonOutline, DesktopOutline, ServerOutline }
const iconFor = (name?: string) => iconMap[name || ''] || DocumentTextOutline
const learningPath = [
  { step: '01', path: 'concepts/overview', title: '理解内网穿透', description: '连接如何从公网抵达内网服务' },
  { step: '02', path: 'concepts/frpc-frps', title: '认识 Frpc 与 Frps', description: '客户端和节点服务端各自负责什么' },
  { step: '03', path: 'introduction', title: '从项目介绍开始', description: '创建配置并从外部网络验证' },
]
const protocols = [
  { name: 'TCP', use: '通用连接', example: 'SSH · RDP · Minecraft' },
  { name: 'UDP', use: '实时数据报', example: '游戏 · 语音' },
  { name: 'HTTP / HTTPS', use: '网站和 API', example: 'Web 服务 · 控制台' },
]
</script>

<style lang="scss" scoped>
@use '../assets/styles/components/docsHome.scss' as *;
</style>
