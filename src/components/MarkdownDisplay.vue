<template>
  <div>
    <div class="loading-container" v-if="loading">
      <NSpin size="large" />
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else class="markdown-container" :class="{ 'dark-theme': themeStore.isDarkMode.value }" ref="contentRef"
      v-html="renderedContent"></div>

    <!-- 图片查看模态框 -->
    <NModal v-model:show="showImageModal" class="image-viewer-modal" style="width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh;" :mask-closable="true"
      :auto-focus="false" :close-on-esc="true" transform-origin="center">
      <div class="image-viewer-canvas" @pointerdown="handleImagePointerDown" @pointermove="handleImagePointerMove"
        @pointerup="handleImagePointerEnd" @pointercancel="handleImagePointerEnd" @wheel.prevent="handleImageWheel">
        <img :src="modalImage" class="modal-image" alt="查看大图" draggable="false" :style="imageTransformStyle" />
        <div class="image-viewer-toolbar">
          <NDropdown :options="imageActionOptions" placement="bottom-end" @select="handleImageAction">
            <NButton quaternary circle class="image-tools-trigger" aria-label="图片操作">
              <NIcon :component="EllipsisHorizontalOutline" :size="22" />
            </NButton>
          </NDropdown>
        </div>
      </div>
    </NModal>


    <!-- 代码全屏查看模态框 -->
    <NModal v-model:show="showCodeModal" :mask-closable="true" preset="card"
      style="width: 90vw; max-width: 1200px; height: 90vh;" :auto-focus="false">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>代码查看</span>
        </div>
      </template>
      <div v-html="modalCodeContent"></div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, onMounted, onBeforeUnmount, watch, nextTick, inject, getCurrentInstance } from 'vue'
import type { ThemeContext } from '../types/theme'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import {
  NSpin,
  NCode,
  NModal,
  NButton,
  NDropdown,
  NIcon,
  // useMessage
} from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import type { Window } from '../types'
import type { HLJSApi } from 'highlight.js'
import { AddOutline, ArrowRedoOutline, ArrowUndoOutline, CloseOutline, DownloadOutline, EllipsisHorizontalOutline, RefreshOutline, RemoveOutline } from '@vicons/ionicons5'
import { enhanceDocumentWidgets } from '../shared/docsWidgets'

let hljs: HLJSApi
let widgetCleanup: (() => void) | undefined
let mermaidPromise: Promise<typeof import('mermaid')> | undefined

// 声明 window 类型, 使 `$message` 可用
declare const window: Window;

// 使用全局主题
const themeStore = inject<ThemeContext>('theme')!
const markdownInstance = getCurrentInstance()
// Imperatively mounted widgets must inherit the nearest theme provider, not
// only application-level provides, so dark mode and docs theme overrides work.
const markdownAppContext = markdownInstance
  ? {
    ...markdownInstance.appContext,
    provides: (markdownInstance as typeof markdownInstance & { provides: Record<string | symbol, unknown> }).provides
  }
  : undefined

// const message = useMessage()
// 使用全局消息服务（已在 AppContent 中初始化）
const globalMessage = window.$message!

// 全局错误处理函数
const handleErrors = (event: ErrorEvent) => {
  console.error('渲染错误:', event);
  const errorMessage = event.message || '渲染时发生未知错误';

  // 如果是 marked 相关错误, 提供更友好的提示
  if (errorMessage.includes('marked') || errorMessage.includes('toLowerCase')) {
    error.value = '解析时出现问题，可能是格式不正确或内容损坏';
    globalMessage.error('解析失败，请检查文档格式');
  }
};

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  html: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    default: ''
  }
})

const loading = ref(true)
const error = ref('')
const markdownText = ref('')
const renderedContent = ref('')
const contentRef = ref<HTMLElement | null>(null)

// 模态框相关状态
const showImageModal = ref(false)
const modalImage = ref('')
const showCodeModal = ref(false)
const modalCodeContent = ref('')

// MutationObserver 实例，用于在 onBeforeUnmount 中清理
let contentObserver: MutationObserver | null = null

// 图片处理相关状态
const imageRotation = ref(0)
const imageScale = ref(1)
const imagePan = ref({ x: 0, y: 0 })
const imageDragging = ref(false)
const imageTransformStyle = computed(() => ({
  transform: `translate3d(${imagePan.value.x}px, ${imagePan.value.y}px, 0) rotate(${imageRotation.value}deg) scale(${imageScale.value})`,
  maxHeight: '90dvh',
  maxWidth: 'min(90vw, 1400px)',
  transition: imageDragging.value ? 'none' : 'transform 140ms ease-out'
}))
const imageActionOptions: DropdownOption[] = [
  { label: '向左旋转', key: 'rotate-left', icon: () => h(NIcon, { component: ArrowUndoOutline }) },
  { label: '向右旋转', key: 'rotate-right', icon: () => h(NIcon, { component: ArrowRedoOutline }) },
  { label: '放大', key: 'zoom-in', icon: () => h(NIcon, { component: AddOutline }) },
  { label: '缩小', key: 'zoom-out', icon: () => h(NIcon, { component: RemoveOutline }) },
  { label: '重置视图', key: 'reset', icon: () => h(NIcon, { component: RefreshOutline }) },
  { type: 'divider', key: 'image-actions-divider' },
  { label: '下载原图', key: 'download', icon: () => h(NIcon, { component: DownloadOutline }) },
  { label: '关闭', key: 'close', icon: () => h(NIcon, { component: CloseOutline }) },
]
const pointers = new Map<number, { x: number; y: number }>()
let dragStart: { id: number; x: number; y: number; panX: number; panY: number } | undefined
let pinchStart: { distance: number; scale: number } | undefined

const slugifyHeading = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, 'h-$1')
}

const normalizeAnchorKey = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const decodeHashValue = (hash: string): string => {
  const raw = hash.replace(/^#/, '')
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

const findHashTarget = (hash: string): HTMLElement | null => {
  if (!contentRef.value) return null

  const decoded = decodeHashValue(hash)
  if (!decoded) return null

  const directById = document.getElementById(decoded)
  if (directById && contentRef.value.contains(directById)) {
    return directById as HTMLElement
  }

  const normalizedHash = normalizeAnchorKey(decoded)
  const compactHash = normalizedHash.replace(/-/g, '')
  const headings = contentRef.value.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6')

  for (const heading of headings) {
    const element = heading as HTMLElement
    const idKey = normalizeAnchorKey(element.id || '')
    const textKey = normalizeAnchorKey(element.textContent || '')
    const idCompact = idKey.replace(/-/g, '')
    const textCompact = textKey.replace(/-/g, '')

    if (
      idKey === normalizedHash ||
      textKey === normalizedHash ||
      (compactHash && (idCompact === compactHash || textCompact === compactHash))
    ) {
      return element
    }
  }

  return null
}

const scrollToHashTarget = (hash: string, updateUrl = false) => {
  const target = findHashTarget(hash)
  if (!target) return false

  target.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })

  if (window.innerWidth <= 768) {
    window.scrollBy(0, 30)
  }

  if (updateUrl) {
    const currentHash = decodeHashValue(window.location.hash)
    const nextHash = decodeHashValue(hash)
    if (currentHash !== nextHash) {
      history.pushState(null, '', `#${encodeURIComponent(nextHash)}`)
    } else {
      history.replaceState(null, '', `#${encodeURIComponent(nextHash)}`)
    }
  }

  return true
}

const setupHeadingAnchors = () => {
  if (!contentRef.value) return

  const headings = contentRef.value.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6')
  const usedIds = new Set<string>()

  headings.forEach((heading, index) => {
    if (!heading.id) {
      const headingText = heading.textContent || ''
      const baseId = slugifyHeading(headingText) || `heading-${index + 1}`
      let uniqueId = baseId
      let suffix = 2

      while (usedIds.has(uniqueId)) {
        uniqueId = `${baseId}-${suffix}`
        suffix += 1
      }

      heading.id = uniqueId
    }

    usedIds.add(heading.id)

    if (!heading.querySelector('.header-anchor')) {
      const anchor = document.createElement('a')
      anchor.href = `#${encodeURIComponent(heading.id)}`
      anchor.className = 'header-anchor'
      anchor.textContent = '#'
      anchor.setAttribute('data-smooth', 'true')
      anchor.style.opacity = '0.5'
      heading.insertBefore(anchor, heading.firstChild)
    }
  })
}

// 设置 CSS 变量的通用函数
const setupThemeVariables = () => {
  const isDark = themeStore.isDarkMode.value;
  const rootElement = document.documentElement;

  // 只为内联代码保留 CSS 变量设置
  if (isDark) {
    // 只设置内联代码颜色
    rootElement.style.setProperty('--inline-code-color', '#ff9292');
    rootElement.style.setProperty('--inline-code-dark-color', '#ff9292');
  } else {
    // 只设置内联代码颜色
    rootElement.style.setProperty('--inline-code-color', '#d56161');
    rootElement.style.setProperty('--inline-code-dark-color', '#ff9292');
  }
};

// 配置 marked
// 配置以确保正确处理换行和表格
marked.use({
  breaks: true,  // 将单个换行符转换为 <br>
  gfm: true,     // 使用 GitHub 风格的 Markdown (自动包含表格支持)
  pedantic: false // 不使用 pedantic 模式, 这样标准 Markdown 表格格式可以正确解析
})

// 在处理 Markdown 前, 预处理警告框语法
const preprocessAlerts = (text: string): string => {
  if (!text.includes(':::')) return text;

  const lines = text.split('\n');
  let inAlert = false;
  let alertType = '';
  let alertTitle = '';
  let alertContent = [];
  let processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 检测警告框开始
    if (!inAlert && line.startsWith(':::')) {
      // 提取警告框类型和标题
      const match = line.match(/^:::(\w+)(?:\s+(.+))?$/);
      if (match) {
        alertType = match[1];
        alertTitle = match[2] || '';

        // 验证警告框类型
        if (['default', 'info', 'success', 'warning', 'error', 'tip'].includes(alertType)) {
          inAlert = true;
          alertContent = [];
          continue;
        }
      }

      // 如果不是有效的警告框类型或格式不对, 保留原始行
      processedLines.push(lines[i]);
    }
    // 检测警告框结束
    else if (inAlert && line === ':::') {
      // 构建警告框的 HTML, 包含标题
      const alertHTML = `<div class="n-alert-wrapper" data-type="${alertType}" data-title="${encodeURIComponent(alertTitle)}" data-content="${encodeURIComponent(alertContent.join('\n'))}"></div>`;
      processedLines.push(alertHTML);
      inAlert = false;
      alertType = '';
      alertTitle = '';
    }
    // 收集警告框内容
    else if (inAlert) {
      alertContent.push(lines[i]);
    }
    // 非警告框的内容直接保留
    else {
      processedLines.push(lines[i]);
    }
  }

  // 处理未关闭的警告框
  if (inAlert) {
    // 如果警告框没有正确关闭, 将收集的内容作为普通文本添加
    processedLines.push(...alertContent);
  }

  return processedLines.join('\n');
};

// 在处理 Markdown 前, 预处理表格语法以确保它们被正确解析
const preprocessMarkdownTables = (text: string): string => {
  // 检测是否包含表格语法
  if (!text.includes('|')) return text;

  // 将文本按行分割, 方便处理表格
  const lines = text.split('\n');
  let inTable = false;
  let tableStartIndex = -1;
  let processedLines = [];

  // 处理每一行
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 检测表格开始行（包含至少两个 | 字符, 这意味着至少有一列）
    if (!inTable && trimmedLine.includes('|') && (trimmedLine.match(/\|/g) || []).length >= 2) {
      inTable = true;
      tableStartIndex = i;
      processedLines.push(line); // 添加表格头部行

      // 检查下一行是否是分隔符行
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (!nextLine.includes('|') || !nextLine.includes('-')) {
        // 如果下一行不是有效的分隔符行, 插入一个
        const cellCount = (trimmedLine.match(/\|/g) || []).length - 1;
        const separatorLine = '|' + ' --- |'.repeat(cellCount);
        processedLines.push(separatorLine);
      }
      continue;
    }

    // 处理表格中的行
    if (inTable) {
      // 检测表格结束（空行或不包含|的行）
      if (trimmedLine === '' || !trimmedLine.includes('|')) {
        inTable = false;
        // 添加空行以结束表格
        processedLines.push('');
      } else {
        // 针对缺少前导或尾部|的行进行修复
        let fixedLine = trimmedLine;
        if (!fixedLine.startsWith('|')) {
          fixedLine = '| ' + fixedLine;
        }
        if (!fixedLine.endsWith('|')) {
          fixedLine = fixedLine + ' |';
        }

        // 确保分隔行有足够的分隔符
        if (fixedLine.includes('-') && fixedLine.includes('|')) {
          // 计算需要的分隔符数量（基于其他行的单元格数量）
          let cellCount = 0;

          // 先尝试从表头获取列数
          if (tableStartIndex >= 0 && tableStartIndex < i) {
            const headerLine = lines[tableStartIndex].trim();
            cellCount = (headerLine.match(/\|/g) || []).length - 1;
          }

          // 确保分隔行包含足够的分隔符
          if (cellCount > 0) {
            const separators = fixedLine.split('|').filter(part => part.trim() !== '');
            if (separators.length < cellCount) {
              fixedLine = '|' + ' --- |'.repeat(cellCount);
            }
          }
        }

        processedLines.push(fixedLine);
      }
    } else {
      // 非表格内容直接添加
      processedLines.push(line);
    }
  }

  // 如果文件末尾正好是表格, 需要添加空行结束表格
  if (inTable) {
    processedLines.push('');
  }

  const result = processedLines.join('\n');

  return result;
};

/**
 * 处理 Markdown 文本
 * @param {string} text - Markdown 文本
 * @returns {string} - 处理后的 HTML
 */
function processMarkdown(text: string): string {
  try {
    // 使用前先确保所有表格相关标记都被清除
    if (typeof window !== 'undefined') {
      // 记录处理状态, 而不是重置状态
      if (!window.__tableParsingTested) {
        window.__tableParsingTested = true;
      }
    }

    // 预处理警告框语法
    text = preprocessAlerts(text);

    // 预处理特殊值, 确保 null 和 undefined 能正确显示
    text = text.replace(/^null$/gm, '`null`');
    text = text.replace(/^undefined$/gm, '`undefined`');

    // 使用 marked 解析 Markdown
    let html = marked.parse(text) as string;

    // 清除潜在的 XSS 风险
    html = DOMPurify.sanitize(html);

    // 检查是否已经存在处理过的表格
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      const processedTables = tempDiv.querySelectorAll('.table-responsive table.markdown-table');
      if (processedTables.length > 0) {
      } else {
        html = enhanceTablesInHTML(html);
      }
    } else {
      // 在非浏览器环境中简单处理
      html = enhanceTablesInHTML(html);
    }

    // 应用代码高亮
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // 处理代码块
      tempDiv.querySelectorAll('pre code').forEach((el) => {
        try {
          // 添加代码字体样式类
          el.classList.add('code-font');

          if (el.className.includes('language-')) {
            const lang = el.className.replace('language-', '').trim();
            if (hljs.getLanguage(lang)) {
              hljs.highlightElement(el as HTMLElement);
            }
          } else {
            // 手动获取文本内容并高亮, 而不是直接传递元素
            const codeText = el.textContent || '';
            const result = hljs.highlightAuto(codeText);
            el.innerHTML = result.value;
            el.classList.add(`hljs`);
            if (result.language) {
              el.classList.add(`language-${result.language}`);
            }
          }
        } catch (e) {
          console.error('代码高亮出错:', e);
        }
      });

      // 处理内联代码
      tempDiv.querySelectorAll('p code, li code').forEach((el) => {
        el.classList.add('inline-code');
      });

      html = tempDiv.innerHTML;
    }

    return html;
  } catch (error) {
    console.error('处理 Markdown 出错:', error);
    return `<div class="error">Markdown 处理错误: ${error}</div>`;
  }
}


// 深度清理内容的辅助函数, 用于移除所有[object Object]相关内容
const deepCleanContent = (content: any): string => {
  // 处理空值情况
  if (content === null || content === undefined) {
    return '';
  }

  // 确保是字符串, 无论输入是什么类型
  let cleanedContent = String(content);

  // 替换掉各种特殊字符和特殊字面量 - 保留 null 和 undefined 文本
  cleanedContent = cleanedContent
    .replace(/\[object Object\]/g, '')
    // .replace(/undefined/g, '') // 不再替换 undefined 文本
    // .replace(/null/g, '') // 不再替换 null 文本
    .replace(/NaN/g, '0')
    .trim();

  // 处理转义字符
  cleanedContent = cleanedContent
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r');

  return cleanedContent;
};


// 获取并渲染 Markdown 内容
const fetchMarkdownContent = async () => {
  loading.value = true;
  error.value = '';

  // 导入 hljs
  hljs = (await import('../shared/hljs')).hljs;

  try {
    // 文档构建器提供正文和稳定锚点，保留现有代码/图片交互。
    if (props.html) {
      renderedContent.value = DOMPurify.sanitize(props.html)
      loading.value = false
      await nextTick()
      setupEventListeners()
      renderNaiveUIComponents()
      return
    }
    // 如果提供了直接内容, 直接渲染
    if (props.content) {
      // 预处理内容
      markdownText.value = deepCleanContent(props.content);

      try {
        // 确保 markdownText.value 是字符串
        if (markdownText.value === null || markdownText.value === undefined) {
          markdownText.value = '';
        }

        // 检查内容是否包含表格
        const hasTableSyntax = markdownText.value.includes('|') &&
          (markdownText.value.match(/\|/g) || []).length >= 2 &&
          (markdownText.value.includes('\n|') || markdownText.value.includes('|\n'));

        if (hasTableSyntax) {
          markdownText.value = preprocessMarkdownTables(markdownText.value);
        }

        // 处理 Markdown
        renderedContent.value = processMarkdown(markdownText.value);

        // DOM 更新后尝试处理代码块, 但不立即执行
        loading.value = false;

        // 使用 nextTick 等待 DOM 更新，不再使用 setTimeout 轮询
        nextTick(() => {
          if (contentRef.value) {
            // 代码块的渲染由 watch(renderedContent) 处理, 这里只设置事件监听
            setupEventListeners();
            renderNaiveUIComponents();
          }
        });

        return;
      } catch (parseError) {
        console.error('解析错误:', parseError);
        error.value = '内容格式不正确，无法解析';
        loading.value = false;
        return;
      }
    }

    // 确定 Markdown 文件的路径
    let filePath = props.path || '';

    if (!filePath) {
      throw new Error('未提供有效的 Markdown 路径');
    }

    // 如果路径不是以 '/' 开头, 添加前缀
    if (!filePath.startsWith('/')) {
      filePath = `/_docs/${filePath}`;
    }

    // 如果路径不是以 '.md' 结尾, 添加后缀
    if (!filePath.endsWith('.md')) {
      filePath = `${filePath}.md`;
    }

    // 如果路径以 /docs/ 开头, 替换为 /_docs/ (避免与 Vue Router /docs 路由冲突)
    if (filePath.startsWith('/docs/')) {
      filePath = filePath.replace('/docs/', '/_docs/');
    }

    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`无法加载 Markdown 文件: ${response.statusText || '未知错误'}`);
    }

    const text = await response.text();

    // 确保 text 是有效的字符串
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new Error('加载的 Markdown 文件内容为空或无效');
    }

    // 使用深度清理函数处理文件内容
    markdownText.value = deepCleanContent(text);

    try {
      // 确保 markdownText.value 是字符串
      if (markdownText.value === null || markdownText.value === undefined) {
        markdownText.value = '';
      }

      // 处理 Markdown
      renderedContent.value = processMarkdown(markdownText.value);

      // 使用 nextTick 等待 DOM 更新，不再使用 setTimeout 轮询
      loading.value = false;

      nextTick(() => {
        if (contentRef.value) {
          // 代码块的渲染由 watch(renderedContent) 处理, 这里只设置事件监听
          setupEventListeners();
        }
      });

    } catch (parseError) {
      console.error('文件解析错误:', parseError);
      error.value = '文档格式不正确，无法解析';
      loading.value = false;
      return;
    }

  } catch (err) {
    console.error('加载 Markdown 文件时出错:', err);
    error.value = err instanceof Error ? err.message : '加载 Markdown 内容时出错';
    loading.value = false;
  }
};

// 添加事件监听器
const setupEventListeners = () => {
  if (!contentRef.value) return;

  setupHeadingAnchors();

  // 图片点击放大
  const images = contentRef.value.querySelectorAll<HTMLImageElement>('img:not(.modal-image)');
  images.forEach((img: HTMLImageElement) => {
    if (!img.classList.contains('event-attached')) {
      img.classList.add('event-attached');
      img.style.cursor = 'zoom-in';
      img.dataset.action = 'zoom';
      img.addEventListener('click', () => {
        const src = img.dataset.src || img.src;
        if (src) {
          // 重置图片状态
          resetImage();
          openImageModal(src);
        }
      });
    }
  });

  // 平滑滚动锚点链接
  const smoothLinks = contentRef.value.querySelectorAll<HTMLAnchorElement>('a[href^="#"]:not([href="#"])');
  smoothLinks.forEach((link: HTMLAnchorElement) => {
    if (link.dataset.hashBound === 'true') {
      return;
    }
    link.dataset.hashBound = 'true';

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href) {
        scrollToHashTarget(href, true);
      }
    });
  });

  if (window.location.hash) {
    scrollToHashTarget(window.location.hash);
  }
};

// 重置渲染标记, 在内容变化时调用
const resetRenderingFlags = () => {
  if (!contentRef.value) return;

  contentRef.value.removeAttribute('data-code-rendered');

  // 重置所有已处理的代码块标记
  const processedElements = contentRef.value.querySelectorAll<HTMLElement>('[data-processed="true"]');
  processedElements.forEach(el => {
    el.removeAttribute('data-processed');
  });
};

// 监听 content 属性变化, 重新渲染内容
watch(() => props.content, (newContent) => {
  if (newContent !== undefined && newContent !== null) {
    try {
      // 重置渲染状态, 确保新内容能够被处理
      resetRenderingFlags();

      // 使用深度清理函数处理内容
      markdownText.value = deepCleanContent(newContent);

      try {
        // 确保 markdownText.value 是字符串
        if (markdownText.value === null || markdownText.value === undefined) {
          markdownText.value = '';
        }

        // 处理 Markdown
        renderedContent.value = processMarkdown(markdownText.value);

        // 使用 nextTick 包装而不是 await
        nextTick(() => {
          if (contentRef.value) {
            setupEventListeners();
            renderNaiveUIComponents();
          } else {
            console.warn('contentRef 不存在，无法设置事件和渲染 NCode');
          }
        });
      } catch (parseError) {
        console.error('动态内容解析错误:', parseError);
        error.value = '内容格式不正确，无法解析';
        return;
      }
    } catch (err) {
      console.error('渲染 Markdown 内容时出错:', err);
      error.value = err instanceof Error ? err.message : '渲染 Markdown 内容时出错';
    }
  }
}, { immediate: false });

// 监听 path 属性变化, 重新加载内容
watch(() => props.path, (newPath) => {
  if (newPath) {
    // 重置渲染状态, 确保新内容能够被处理
    resetRenderingFlags();
    fetchMarkdownContent();
  }
}, { immediate: false });

// 初始化时和每次路由变化时都确保 CSS 变量设置正确
watch(() => props.path, () => {
  setupThemeVariables();

  // 检查是否需要重新加载内容
  if (props.path) {
    fetchMarkdownContent();
  }
}, { immediate: true });

// 监听内容变化
watch(() => props.content, () => {
  setupThemeVariables();

  // 检查是否需要重新处理内容
  if (props.content) {
    fetchMarkdownContent();
  }
}, { immediate: true });

watch(() => props.html, () => {
  if (props.html) void fetchMarkdownContent()
})

onMounted(() => {
  // 注册全局错误处理
  window.addEventListener('error', handleErrors);

  // 初始设置主题变量
  setupThemeVariables();

  // 初始加载内容
  if (props.path || props.content || props.html) {
    fetchMarkdownContent();
  }
});

// 重置图片状态
const resetImage = () => {
  imageRotation.value = 0
  imageScale.value = 1
  imagePan.value = { x: 0, y: 0 }
}

const setImageScale = (scale: number, originX = 0, originY = 0) => {
  const nextScale = Math.max(0.1, Math.min(5, scale))
  const ratio = nextScale / imageScale.value
  imagePan.value = {
    x: originX - (originX - imagePan.value.x) * ratio,
    y: originY - (originY - imagePan.value.y) * ratio,
  }
  imageScale.value = nextScale
}

const zoomImage = (factor: number) => setImageScale(imageScale.value + factor)

const getImagePoint = (event: PointerEvent | WheelEvent) => {
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  return { x: event.clientX - bounds.left - bounds.width / 2, y: event.clientY - bounds.top - bounds.height / 2 }
}

const pointerDistance = (values: { x: number; y: number }[]) => Math.hypot(values[0]!.x - values[1]!.x, values[0]!.y - values[1]!.y)

const handleImagePointerDown = (event: PointerEvent) => {
  if ((event.target as HTMLElement).closest('.image-viewer-toolbar, .n-dropdown-menu')) return
  event.currentTarget instanceof HTMLElement && event.currentTarget.setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  imageDragging.value = true
  if (pointers.size === 1) {
    dragStart = { id: event.pointerId, x: event.clientX, y: event.clientY, panX: imagePan.value.x, panY: imagePan.value.y }
  } else if (pointers.size === 2) {
    dragStart = undefined
    pinchStart = { distance: pointerDistance([...pointers.values()]), scale: imageScale.value }
  }
}

const handleImagePointerMove = (event: PointerEvent) => {
  if (!pointers.has(event.pointerId)) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (pointers.size >= 2) {
    const points = [...pointers.values()]
    if (!pinchStart) pinchStart = { distance: pointerDistance(points), scale: imageScale.value }
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const midpoint = { x: (points[0]!.x + points[1]!.x) / 2 - bounds.left - bounds.width / 2, y: (points[0]!.y + points[1]!.y) / 2 - bounds.top - bounds.height / 2 }
    setImageScale(pinchStart.scale * pointerDistance(points) / Math.max(1, pinchStart.distance), midpoint.x, midpoint.y)
    return
  }
  if (dragStart?.id === event.pointerId) {
    imagePan.value = { x: dragStart.panX + event.clientX - dragStart.x, y: dragStart.panY + event.clientY - dragStart.y }
  }
}

const handleImagePointerEnd = (event: PointerEvent) => {
  pointers.delete(event.pointerId)
  if (pointers.size < 2) pinchStart = undefined
  if (pointers.size === 1) {
    const [id, point] = [...pointers.entries()][0]!
    dragStart = { id, x: point.x, y: point.y, panX: imagePan.value.x, panY: imagePan.value.y }
  } else if (!pointers.size) {
    dragStart = undefined
    imageDragging.value = false
  }
}

const handleImageWheel = (event: WheelEvent) => {
  if ((event.target as HTMLElement).closest('.image-viewer-toolbar, .n-dropdown-menu')) return
  const point = getImagePoint(event)
  setImageScale(imageScale.value * Math.exp(-event.deltaY * 0.0015), point.x, point.y)
}

const handleImageAction = (key: string) => {
  switch (key) {
    case 'rotate-left': rotateImage(-90); break
    case 'rotate-right': rotateImage(90); break
    case 'zoom-in': zoomImage(0.1); break
    case 'zoom-out': zoomImage(-0.1); break
    case 'reset': resetImage(); break
    case 'download': void downloadImage(); break
    case 'close': closeImageModal(); break
  }
}

// 处理图片旋转
const rotateImage = (degrees: number) => {
  imageRotation.value = (imageRotation.value + degrees) % 360
};

// 下载当前查看的图片
const downloadImage = async () => {
  if (!modalImage.value) return;
  const src = modalImage.value;
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`图片请求失败（${response.status}）`);
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = new URL(src, location.href).pathname.split('/').pop() || 'image';
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Keep the blob alive until the browser has consumed the download.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch {
    // Some external image hosts disallow CORS. Let the user save the original.
    window.open(src, '_blank', 'noopener,noreferrer');
    window.$message?.info('图片来源不允许直接下载，已打开原图，请另存为');
  }
};

// 打开图片模态框
const openImageModal = (src: string) => {
  modalImage.value = src;
  resetImage()
  showImageModal.value = true;

  nextTick(() => {
    document.addEventListener('keydown', handleImageKeydown);
  });
};

watch(showImageModal, show => {
  if (show) return
  resetImage()
  pointers.clear()
  dragStart = undefined
  pinchStart = undefined
  imageDragging.value = false
  document.removeEventListener('keydown', handleImageKeydown)
})

// 关闭图片模态框
const closeImageModal = () => {
  showImageModal.value = false;
};

// 处理键盘事件
const handleImageKeydown = (e: KeyboardEvent) => {
  if (!showImageModal.value) return;

  switch (e.key) {
    case 'Escape':
      closeImageModal();
      break;
    case '+':
    case '=':
      zoomImage(0.1);
      e.preventDefault();
      break;
    case '-':
      zoomImage(-0.1);
      e.preventDefault();
      break;
    case 'ArrowLeft':
      rotateImage(-90);
      e.preventDefault();
      break;
    case 'ArrowRight':
      rotateImage(90);
      e.preventDefault();
      break;
    case 'r':
    case 'R':
      resetImage();
      e.preventDefault();
      break;
    case 'd':
    case 'D':
      downloadImage();
      e.preventDefault();
      break;
  }
};

const renderMermaidDiagrams = async () => {
  const root = contentRef.value
  if (!root) return
  try {
    const codes = Array.from(root.querySelectorAll<HTMLElement>('pre > code.language-mermaid'))
    const diagrams = Array.from(root.querySelectorAll<HTMLElement>('.mermaid-diagram[data-source]'))
    if (!codes.length && !diagrams.length) return
    mermaidPromise ??= import('mermaid')
    const { default: mermaid } = await mermaidPromise
    const dark = themeStore.isDarkMode.value
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'default', layout: 'dagre', htmlLabels: false, flowchart: { curve: 'basis' } })
    const items = [...diagrams.map(element => ({ element, source: element.dataset.source || '', code: undefined as HTMLElement | undefined })),
      ...codes.map(code => ({ element: undefined as HTMLElement | undefined, source: code.textContent || '', code }))]
    for (const item of items) {
      const id = `mefrp-mermaid-${crypto.randomUUID()}`
      const { svg } = await mermaid.render(id, item.source)
      const safeSvg = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })
      const figure = document.createElement('div')
      figure.className = 'mermaid-diagram'
      figure.dataset.source = item.source
      figure.setAttribute('role', 'img')
      figure.setAttribute('aria-label', 'Mermaid 流程图')
      figure.innerHTML = safeSvg
      if (item.code) (item.code.closest('figure.docs-code-block') || item.code.closest('pre'))?.replaceWith(figure)
      else item.element?.replaceWith(figure)
    }
  } catch (renderError) {
    console.error('Mermaid 图表渲染失败:', renderError)
  }
}

// Mount real Naive UI widgets once for each rendered document.
const renderNaiveUIComponents = () => {
  void renderMermaidDiagrams()
  const currentContent = contentRef.value
  if (!currentContent || !hljs || currentContent.getAttribute('data-code-rendered') === 'true') return
  const appContext = markdownAppContext
  if (!appContext) return
  widgetCleanup?.()
  widgetCleanup = enhanceDocumentWidgets(currentContent, appContext, hljs)
  currentContent.setAttribute('data-code-rendered', 'true')
}

// 声明全局 NaiveUI 类型
declare global {
  interface Window {
    $naive?: {
      NCode?: typeof NCode;
    };
  }
}

// 在处理完 Markdown 后调用 NCode 渲染
watch(() => renderedContent.value, () => {

  // 渲染前先检查是否已经渲染过
  if (contentRef.value && contentRef.value.getAttribute('data-code-rendered') === 'true') {
    return;
  }

  // 使用 MutationObserver 监听 DOM 变化，等待 contentRef 出现
  const doRender = () => {
    if (!contentRef.value) return;

    // 再次检查是否已渲染过
    if (contentRef.value.getAttribute('data-code-rendered') === 'true') {
      return;
    }

    setupEventListeners();
    renderNaiveUIComponents();
  };

  // 先用 nextTick 尝试一次
  nextTick(() => {
    if (contentRef.value) {
      doRender();
      return;
    }

    // contentRef 还未出现，设置 MutationObserver 监听根元素 DOM 变化
    const rootEl = document.getElementById('app') || document.body;
    contentObserver = new MutationObserver(() => {
      if (contentRef.value) {
        doRender();
        contentObserver?.disconnect();
        contentObserver = null;
      }
    });

    contentObserver.observe(rootEl, {
      childList: true,
      subtree: true
    });

    // 超时保护: 5 秒后自动断开，避免内存泄漏
    setTimeout(() => {
      if (contentObserver) {
        contentObserver.disconnect();
        contentObserver = null;
      }
    }, 5000);
  });
}, { immediate: true }); // 添加 `immediate: true` 确保初始化时也执行

// 监听主题变化, 更新代码块样式
watch(() => themeStore.isDarkMode.value, () => {

  void renderMermaidDiagrams()

  // 调用通用函数更新 CSS 变量
  setupThemeVariables();

  // 当主题变化时, 仅更新代码块的样式
  if (contentRef.value) {
    // 找到所有已渲染的代码块挂载点
    const mountPoints = contentRef.value.querySelectorAll<HTMLElement>('.n-code-mount-point');
    if (mountPoints.length > 0) {
    }

    // 同时更新内联代码样式
    try {
      const inlineCodes = contentRef.value.querySelectorAll<HTMLElement>('.inline-code');
      if (inlineCodes.length > 0) {
      }
    } catch (err) {
      console.error('更新内联代码样式出错:', err);
    }
  }
});

// 添加使用 NTable 处理表格的函数
const processTablesWithNTable = () => {
  if (!contentRef.value) return;

  // 查找所有表格元素
  const contentElement = contentRef.value as HTMLElement;
  const tables = Array.from(contentElement.querySelectorAll('table')).filter(table => !table.closest('.n-data-table'))

  if (tables.length === 0) {
    return;
  }

  // 检查是否已经处理过表格
  if (typeof window !== 'undefined' && window.__manualTableTested) {
    return;
  }

  let tableCount = 0;

  tables.forEach((table, index) => {
    try {
      // 检查表格是否已经处理过
      if (table.getAttribute('data-processed') === 'true') {
        return;
      }

      // 检查表格是否已经在响应式包装器中
      const isInWrapper = table.closest('.table-responsive') !== null;
      if (isInWrapper) {
        table.setAttribute('data-processed', 'true');
        table.classList.add('markdown-table');
        table.style.width = '100%';
        return;
      }

      tableCount++;

      // 标记表格为已处理
      table.setAttribute('data-processed', 'true');

      // 给表格添加基础样式类和宽度属性
      table.classList.add('markdown-table');
      table.style.width = '100%';

      // 获取表头和数据行
      const headers = table.querySelectorAll('thead th');
      const rows = table.querySelectorAll('tbody tr');

      // 检查表格特征, 用于决定布局模式
      const columnCount = headers.length || (rows[0]?.querySelectorAll('td').length || 0);
      const hasLongContent = checkForLongContent(table);
      const isWideTable = columnCount > 5;

      // 决定表格布局模式 (默认使用自适应模式以填满空间)
      let layoutMode = 'adaptive';
      if (isWideTable || hasLongContent) {
        layoutMode = 'fixed';
      }

      // 添加布局模式类
      table.classList.add(`table-${layoutMode}`);

      // 如果列数较少, 均匀分配列宽
      if (layoutMode === 'adaptive' && columnCount > 0 && columnCount <= 5) {
        const width = `${Math.floor(100 / columnCount)}%`;

        // 设置均匀的列宽
        headers.forEach(header => {
          (header as HTMLElement).style.width = width;
        });

        // 确保第一行也设置了宽度
        if (rows.length > 0) {
          const firstRowCells = rows[0].querySelectorAll('td');
          firstRowCells.forEach(cell => {
            (cell as HTMLElement).style.width = width;
          });
        }

      }

      // 处理表格对齐方式
      processTableAlignment(table);

      // 创建表格包装器用于响应式布局
      const wrapper = document.createElement('div');
      wrapper.className = `table-responsive table-${layoutMode}`;
      wrapper.style.width = '100%';
      wrapper.style.display = 'block';

      // 放置表格到包装器中
      if (table.parentNode) {
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }

      // 为固定模式表格添加滚动指示器
      if (layoutMode === 'fixed') {
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator right';
        indicator.textContent = '滑动查看更多';
        wrapper.appendChild(indicator);

        // 添加滚动事件监听器
        setTimeout(() => {
          const tableWrapper = document.querySelector(`.table-responsive.table-fixed:nth-child(${tableCount})`);
          if (tableWrapper) {
            const scrollIndicator = tableWrapper.querySelector('.scroll-indicator');
            if (scrollIndicator && tableWrapper instanceof HTMLElement) {
              // 初始化滚动指示器状态
              updateScrollIndicator(tableWrapper, scrollIndicator);

              // 添加滚动事件监听
              tableWrapper.addEventListener('scroll', () => {
                updateScrollIndicator(tableWrapper as HTMLElement, scrollIndicator);
              });
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error(`处理表格 #${index + 1} 时出错:`, error);
    }
  });

  if (typeof window !== 'undefined') {
    window.__manualTableTested = true;
  }


  // 在处理完成后再次检查表格宽度
  setTimeout(() => {
    const allTables = contentElement.querySelectorAll('table.markdown-table');
    allTables.forEach((table, index) => {
      const actualWidth = (table as HTMLElement).offsetWidth;
      const parentWidth = table.parentElement?.offsetWidth || 0;

      // 如果表格宽度不足, 强制设置为 100%
      if (actualWidth < parentWidth * 0.95) {
        console.log(`表格 #${index + 1} 宽度不足，强制设置为 100%`);
        (table as HTMLElement).style.width = '100%';
      }
    });
  }, 300);
};

/**
 * 检查表格是否包含长内容
 * @param {HTMLTableElement} table - 表格元素
 * @return {boolean} - 是否包含长内容
 */
function checkForLongContent(table: HTMLTableElement): boolean {
  const cells = table.querySelectorAll('th, td');
  let hasLongContent = false;

  cells.forEach(cell => {
    // 判断单元格内容是否过长
    const content = cell.textContent || '';
    if (content.length > 30 || content.includes(' ') && content.length > 20) {
      hasLongContent = true;
    }
  });

  return hasLongContent;
}

/**
 * 处理表格对齐方式
 * @param {HTMLTableElement} table - 表格元素
 */
function processTableAlignment(table: HTMLTableElement) {
  const headerCells = table.querySelectorAll('thead th');
  const rows = table.querySelectorAll('tbody tr');

  // 检测每列是否都是数字（用于右对齐）
  const numericColumns: boolean[] = [];

  // 初始化数组
  headerCells.forEach((_, index) => {
    numericColumns[index] = true;
  });

  // 检查每列的内容
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    cells.forEach((cell, index) => {
      if (index < numericColumns.length) {
        const content = cell.textContent || '';
        const isNumeric = /^[\d.,]+$/.test(content.trim());
        numericColumns[index] = numericColumns[index] && isNumeric;
      }
    });
  });

  // 应用对齐样式
  headerCells.forEach((cell, index) => {
    if (numericColumns[index]) {
      cell.classList.add('align-right');
    }
  });

  // 为数据单元格设置对齐方式
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    cells.forEach((cell, index) => {
      if (index < numericColumns.length && numericColumns[index]) {
        cell.classList.add('align-right');
      }
    });
  });
}

/**
 * 更新滚动指示器状态
 * @param {HTMLElement} wrapper - 表格包装器
 * @param {Element} indicator - 滚动指示器
 */
function updateScrollIndicator(wrapper: HTMLElement, indicator: Element) {
  // 检查元素是否存在
  if (!wrapper || !indicator) return;

  const hasHorizontalScroll = wrapper.scrollWidth > wrapper.clientWidth;

  // 如果没有水平滚动, 隐藏指示器
  if (!hasHorizontalScroll) {
    indicator.classList.add('hidden');
    return;
  } else {
    indicator.classList.remove('hidden');
  }

  const isAtLeft = wrapper.scrollLeft <= 0;
  const isAtRight = wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth;

  // 移除所有方向类
  indicator.classList.remove('left', 'right', 'both');

  // 根据滚动位置设置适当的类
  if (isAtLeft) {
    indicator.classList.add('right');
    indicator.textContent = '向右滑动查看更多';
  } else if (isAtRight) {
    indicator.classList.add('left');
    indicator.textContent = '向左滑动查看更多';
  } else {
    indicator.classList.add('both');
    indicator.textContent = '左右滑动查看更多';
  }
}

// 在内容渲染完成后处理表格
watch(() => renderedContent.value, () => {
  // 确保 DOM 已更新
  nextTick(() => {
    if (contentRef.value) {
      // 首先渲染代码块
      renderNaiveUIComponents();

      // 等待代码块渲染完成后再处理表格
      setTimeout(() => {
        processTablesWithNTable();
      }, 100);
    }
  });
}, { immediate: false });

// 添加监听主题变化时重新渲染表格
watch(() => themeStore.isDarkMode.value, () => {
  // 主题变化后只更新表格样式, 而不重新创建结构
  nextTick(() => {
    if (contentRef.value) {

      // 获取所有表格和包装器
      const tables = contentRef.value.querySelectorAll<HTMLTableElement>('table.markdown-table');
      const wrappers = contentRef.value.querySelectorAll<HTMLElement>('.table-responsive');

      // 检查是否存在表格
      if (tables.length === 0) {
        return;
      }

      // 更新滚动指示器状态
      wrappers.forEach(wrapper => {
        if (wrapper.classList.contains('table-fixed')) {
          const indicator = wrapper.querySelector('.scroll-indicator');
          if (indicator && wrapper instanceof HTMLElement) {
            updateScrollIndicator(wrapper, indicator);
          }
        }
      });
    }
  });
});

/**
 * 处理 Markdown 表格, 将其替换为更好的 HTML 表格结构
 * @param {string} html - 原始 HTML
 */
function enhanceTablesInHTML(html: string) {
  if (!html) return html;

  if (typeof document === 'undefined') return html;

  // 创建临时 DOM 元素来解析 HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // 查找所有表格元素
  const tables = tempDiv.querySelectorAll('table');
  if (!tables.length) return html;

  let tableCount = 0;

  tables.forEach((table) => {
    // 检查表格是否已经在响应式包装器中
    const isInWrapper = table.closest('.table-responsive') !== null;
    if (isInWrapper) {
      table.classList.add('markdown-table');
      (table as HTMLElement).style.width = '100%';
      return;
    }

    tableCount++;

    // 为表格添加基础样式类和宽度属性
    table.classList.add('markdown-table');
    (table as HTMLElement).style.width = '100%';

    // 获取表头和数据行
    const headers = table.querySelectorAll('thead th');
    const rows = table.querySelectorAll('tbody tr');

    // 检查表格特征, 用于决定布局模式
    const columnCount = headers.length || (rows[0]?.querySelectorAll('td').length || 0);
    const hasLongContent = checkForLongContent(table);
    const isWideTable = columnCount > 5;

    // 决定表格布局模式 (默认使用自适应模式以填满空间)
    let layoutMode = 'adaptive';
    if (isWideTable || hasLongContent) {
      layoutMode = 'fixed';
    }

    // 添加布局模式类
    table.classList.add(`table-${layoutMode}`);

    // 如果列数较少, 均匀分配列宽
    if (layoutMode === 'adaptive' && columnCount > 0 && columnCount <= 5) {
      const width = `${Math.floor(100 / columnCount)}%`;

      // 设置均匀的列宽
      headers.forEach(header => {
        (header as HTMLElement).style.width = width;
      });

      // 确保第一行也设置了宽度
      if (rows.length > 0) {
        const firstRowCells = rows[0].querySelectorAll('td');
        firstRowCells.forEach(cell => {
          (cell as HTMLElement).style.width = width;
        });
      }
    }

    // 处理表格对齐方式
    processTableAlignment(table);

    // 添加响应式包装器
    const wrapper = document.createElement('div');
    wrapper.className = `table-responsive table-${layoutMode}`;
    wrapper.style.width = '100%';
    wrapper.style.display = 'block';

    // 放置表格到包装器中
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);

    // 为固定模式表格添加滚动指示器
    if (layoutMode === 'fixed') {
      const indicator = document.createElement('div');
      indicator.className = 'scroll-indicator right';
      indicator.textContent = '滑动查看更多';
      wrapper.appendChild(indicator);
    }
  });

  return tempDiv.innerHTML;
}

// 组件卸载前清理事件监听器
onBeforeUnmount(() => {
  widgetCleanup?.()
  widgetCleanup = undefined
  // 移除全局错误处理
  window.removeEventListener('error', handleErrors);

  // 断开 MutationObserver
  if (contentObserver) {
    contentObserver.disconnect();
    contentObserver = null;
  }

  // 如果有图片模态框正在显示，清理键盘事件
  if (showImageModal.value) {
    document.removeEventListener('keydown', handleImageKeydown);
  }

  // 清理滚动事件监听器
  if (contentRef.value) {
    const wrappers = contentRef.value.querySelectorAll<HTMLElement>('.table-responsive.table-fixed');
    wrappers.forEach(wrapper => {
      if (wrapper instanceof HTMLElement) {
        wrapper.removeEventListener('scroll', () => {
          const indicator = wrapper.querySelector('.scroll-indicator');
          if (indicator) {
            updateScrollIndicator(wrapper, indicator);
          }
        });
      }
    });
  }
});

</script>

<style lang="scss">
@use '../assets/styles/components/markdownDisplay.scss';


/* 代码字体样式 */
.code-font {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Source Code Pro', 'Courier New', monospace !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
}

.markdown-container pre code {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Source Code Pro', 'Courier New', monospace !important;
}

/* 确保内联代码也使用正确的字体 */
.markdown-container .inline-code {
  font-family: 'Consolas', 'Monaco', 'Menlo', 'Source Code Pro', 'Courier New', monospace !important;
}

/* 透明画布 + 单一浮动操作菜单，避免卡片底色遮挡图片。 */
.image-viewer-canvas {
  position: relative;
  display: flex;
  width: 100vw;
  height: 100dvh;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: transparent;
  touch-action: none;
  user-select: none;
}

.image-viewer-toolbar {
  position: absolute;
  z-index: 2;
  top: max(16px, env(safe-area-inset-top));
  right: max(16px, env(safe-area-inset-right));
  pointer-events: auto;
}

.image-tools-trigger {
  width: 44px;
  height: 44px;
  border: 1px solid color-mix(in srgb, var(--n-text-color, #fff) 24%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--n-color-modal, #151c26) 72%, transparent);
  color: var(--n-text-color, #fff);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  backdrop-filter: blur(14px) saturate(160%);
}

.modal-image {
  display: block;
  max-width: min(90vw, 1400px);
  max-height: 90dvh;
  object-fit: contain;
  box-shadow: 0 8px 32px rgba(0, 0, 0, .32);
  transform-origin: center;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

@media (max-width: 768px) {
  .modal-image { max-width: 94vw; max-height: 88dvh; }
}

@media (prefers-reduced-motion: reduce) {
  .modal-image { transition: none !important; }
}
</style>