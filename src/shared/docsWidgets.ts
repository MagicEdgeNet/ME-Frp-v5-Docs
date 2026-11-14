import { createVNode, defineComponent, h, onBeforeUnmount, ref, render, type AppContext } from 'vue'
import { NAlert, NButton, NCode, NDataTable, NIcon, NScrollbar } from 'naive-ui'
import { CheckmarkOutline, CopyOutline } from '@vicons/ionicons5'
import DOMPurify from 'dompurify'
import type { HLJSApi } from 'highlight.js'
import { marked } from 'marked'

const safeHtml = (html: string) => DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['a', 'abbr', 'b', 'big', 'blockquote', 'br', 'cite', 'code', 'del', 'em', 'i', 'kbd', 'li', 'mark', 'ol', 'p', 's', 'small', 'span', 'strong', 'sub', 'sup', 'u', 'ul'],
  ALLOWED_ATTR: ['class', 'href', 'rel', 'target', 'title']
})

function mountVNode(component: any, props: Record<string, unknown>, children: any, target: HTMLElement, context: AppContext, mounted: HTMLElement[]) {
  const vnode = createVNode(component, props, children)
  vnode.appContext = context
  render(vnode, target)
  mounted.push(target)
}

function mountAlerts(container: HTMLElement, context: AppContext, mounted: HTMLElement[]) {
  for (const fallback of container.querySelectorAll<HTMLElement>('[data-docs-alert], .n-alert-wrapper')) {
    const rawType = fallback.dataset.type || 'info'
    const type = rawType === 'tip' || rawType === 'default' ? 'info' : rawType
    const legacy = fallback.classList.contains('n-alert-wrapper')
    const title = legacy ? decodeURIComponent(fallback.dataset.title || '') : fallback.dataset.title || ''
    const body = legacy
      ? String(marked.parse(decodeURIComponent(fallback.dataset.content || '')))
      : fallback.querySelector<HTMLElement>('.docs-callout-body')?.innerHTML || ''
    const target = document.createElement('div')
    target.className = 'docs-alert-widget'
    fallback.replaceWith(target)
    mountVNode(NAlert, { type, title, bordered: true }, {
      default: () => h('div', { class: 'docs-alert-content', innerHTML: safeHtml(body) })
    }, target, context, mounted)
  }
}

const CodeCopyButton = defineComponent({
  props: {
    code: { type: String, required: true }
  },
  setup(props) {
    const status = ref<'idle' | 'copied' | 'error'>('idle')
    let resetTimer = 0
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(props.code)
        status.value = 'copied'
      } catch {
        status.value = 'error'
      }
      window.clearTimeout(resetTimer)
      resetTimer = window.setTimeout(() => { status.value = 'idle' }, 1600)
    }
    onBeforeUnmount(() => window.clearTimeout(resetTimer))
    return () => h(NButton, {
      size: 'small',
      quaternary: true,
      title: status.value === 'error' ? '无法访问剪贴板' : '复制代码',
      'aria-label': status.value === 'copied' ? '代码已复制' : '复制代码',
      onClick: copy
    }, {
      icon: () => h(NIcon, { component: status.value === 'copied' ? CheckmarkOutline : CopyOutline }),
      default: () => status.value === 'copied' ? '已复制' : status.value === 'error' ? '复制失败' : '复制'
    })
  }
})


function tableColumns(table: HTMLTableElement) {
  const headers = [...table.querySelectorAll<HTMLTableCellElement>('thead th')]
  const rows = [...table.querySelectorAll<HTMLTableRowElement>('tbody tr')]
  const sourceRows = rows.map(row => [...row.cells].map(cell => ({ text: cell.textContent?.trim() || '', html: cell.innerHTML })))
  const minWidths = headers.map((header, index) => {
    const maxLength = Math.max(header.textContent?.trim().length || 0, ...sourceRows.map(row => row[index]?.text.length || 0))
    return Math.max(96, Math.min(320, maxLength * 8 + 40))
  })
  const columns = headers.map((header, index) => ({
    title: header.textContent?.trim() || '',
    key: `column-${index}`,
    minWidth: minWidths[index],
    align: (header.style.textAlign || 'left') as 'left' | 'center' | 'right',
    render: (row: Record<string, string>) => h('span', {
      class: 'docs-table-cell-content',
      innerHTML: safeHtml(row[`column-${index}`])
    })
  }))
  const data = sourceRows.map((row, rowIndex) => Object.fromEntries([
    ['key', String(rowIndex)],
    ...headers.map((_, index) => [`column-${index}`, row[index]?.html || ''])
  ]))
  return { columns, data, scrollX: Math.max(640, minWidths.reduce((sum, width) => sum + width, 0)), rowCount: rows.length }
}

function mountTables(container: HTMLElement, context: AppContext, mounted: HTMLElement[]) {
  for (const fallback of container.querySelectorAll<HTMLTableElement>('table')) {
    if (!fallback.querySelector('thead th')) continue
    const { columns, data, scrollX, rowCount } = tableColumns(fallback)
    const wrapper = document.createElement('div')
    wrapper.className = 'docs-data-table-scroll'
    wrapper.setAttribute('role', 'region')
    wrapper.setAttribute('aria-label', '可横向滚动的数据表格')
    wrapper.tabIndex = 0
    fallback.replaceWith(wrapper)
    mountVNode(NDataTable, {
      columns,
      data,
      scrollX,
      maxHeight: rowCount > 12 ? 480 : undefined,
      bordered: true,
      striped: true,
      singleLine: false,
      size: 'small',
      rowKey: (row: Record<string, string>) => row.key
    }, null, wrapper, context, mounted)
  }
}

function mountCodeBlocks(container: HTMLElement, context: AppContext, hljs: HLJSApi, mounted: HTMLElement[]) {
  for (const fallback of container.querySelectorAll<HTMLPreElement>('pre')) {
    const codeEl = fallback.querySelector('code')
    if (!codeEl || codeEl.classList.contains('language-mermaid')) continue
    const code = codeEl.textContent || ''
    const language = [...codeEl.classList].find(name => name.startsWith('language-'))?.slice(9) || ''
    const existingWrapper = fallback.parentElement?.classList.contains('docs-code-block')
    const wrapper = existingWrapper ? fallback.parentElement as HTMLElement : document.createElement('figure')
    wrapper.classList.add('docs-code-block')
    const caption = wrapper.querySelector<HTMLElement>('.docs-code-toolbar') || document.createElement('figcaption')
    caption.className = 'docs-code-toolbar'
    const label = caption.querySelector<HTMLElement>('.docs-code-language') || document.createElement('span')
    label.className = 'docs-code-language'
    label.textContent = language ? `${language[0].toUpperCase()}${language.slice(1)}` : 'Text'
    const copy = document.createElement('div')
    copy.className = 'docs-code-copy'
    caption.replaceChildren(label, copy)
    const target = document.createElement('div')
    target.className = 'docs-code-widget'
    wrapper.replaceChildren(caption, target)
    if (!existingWrapper) fallback.replaceWith(wrapper)
    mountVNode(NScrollbar, {
      xScrollable: true,
      nativeScrollbar: false,
      trigger: 'none'
    }, {
      default: () => h(NCode, {
        code,
        language: language || undefined,
        hljs,
        showLineNumbers: code.split('\n').length > 4,
        wordWrap: false,
        trim: false
      })
    }, target, context, mounted)
    mountVNode(CodeCopyButton, { code }, null, copy, context, mounted)
  }
}

export function enhanceDocumentWidgets(container: HTMLElement, context: AppContext, hljs: HLJSApi) {
  const mounted: HTMLElement[] = []
  mountAlerts(container, context, mounted)
  mountTables(container, context, mounted)
  mountCodeBlocks(container, context, hljs, mounted)
  return () => {
    for (const target of mounted.splice(0)) render(null, target)
  }
}
