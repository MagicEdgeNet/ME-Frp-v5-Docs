import { computed } from 'vue'
import { docPages } from './docs'

export interface SearchResult {
  path: string
  title: string
  navTitle?: string
  description: string
}

const searchable = docPages.filter(page => page.index !== false).map(page => ({
  page,
  text: `${page.title} ${page.navTitle || ''} ${page.description}`.toLocaleLowerCase('zh-CN'),
}))

export function searchDocuments(query: string, pages: SearchResult[] = docPages): SearchResult[] {
  const terms = query.toLocaleLowerCase('zh-CN').trim().split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  const selected = new Set(pages.map(page => page.path))
  return searchable
    .filter(item => selected.has(item.page.path) && terms.every(term => item.text.includes(term)))
    .map(item => item.page)
}

export function useDocumentSearch(query: () => string) {
  return computed(() => searchDocuments(query()))
}
