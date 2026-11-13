export interface SearchDocument {
  path: string
  title: string
  navTitle?: string
  description: string
  text: string
}

export interface SearchResult extends SearchDocument {
  snippet: string
  score: number
}

let searchIndexRequest: Promise<SearchDocument[]> | undefined

export function loadSearchIndex(): Promise<SearchDocument[]> {
  if (!searchIndexRequest) {
    searchIndexRequest = fetch('/_docs-search.json')
      .then(async response => {
        if (!response.ok) throw new Error(`搜索索引加载失败（${response.status}）`)
        const value: unknown = await response.json()
        if (!Array.isArray(value) || value.some(item => !item || typeof item.path !== 'string' || typeof item.title !== 'string' || typeof item.description !== 'string' || typeof item.text !== 'string')) {
          throw new Error('搜索索引格式无效')
        }
        return value as SearchDocument[]
      })
      .catch(error => {
        searchIndexRequest = undefined
        throw error
      })
  }
  return searchIndexRequest
}

function excerpt(document: SearchDocument, terms: string[], maxLength = 150): string {
  const body = document.text.trim()
  if (!body) return document.description
  const lower = body.toLocaleLowerCase('zh-CN')
  const matches = terms.map(term => lower.indexOf(term)).filter(index => index >= 0)
  if (!matches.length) return document.description
  const matchAt = Math.min(...matches)
  const start = Math.max(0, matchAt - Math.floor(maxLength / 3))
  const end = Math.min(body.length, start + maxLength)
  return `${start ? '…' : ''}${body.slice(start, end).trim()}${end < body.length ? '…' : ''}`
}

export function searchDocuments(query: string, documents: SearchDocument[]): SearchResult[] {
  const terms = query.toLocaleLowerCase('zh-CN').trim().split(/\s+/).filter(Boolean)
  if (!terms.length) return []

  return documents.map((document, position) => {
    const title = `${document.title} ${document.navTitle || ''}`.toLocaleLowerCase('zh-CN')
    const description = document.description.toLocaleLowerCase('zh-CN')
    const body = document.text.toLocaleLowerCase('zh-CN')
    const allText = `${title} ${description} ${body}`
    if (!terms.every(term => allText.includes(term))) return undefined

    const score = terms.reduce((total, term) => total + (
      title.includes(term) ? 12 : description.includes(term) ? 5 : 1
    ), 0)
    return { ...document, snippet: excerpt(document, terms), score, position }
  }).filter((result): result is SearchResult & { position: number } => result !== undefined)
    .sort((a, b) => b.score - a.score || a.position - b.position)
    .map(({ position: _position, ...result }) => result)
}
