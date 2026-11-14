export interface SearchDocument {
  path: string
  title: string
  navTitle?: string
  description: string
  text: string
}

export interface SearchResult extends SearchDocument {
  key: string
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

function excerpts(document: SearchDocument, terms: string[], maxLength = 150): string[] {
  const paragraphs = document.text.split(/\n+/).map(part => part.trim()).filter(Boolean)
  const snippets: string[] = []
  const seen = new Set<string>()

  for (const paragraph of paragraphs) {
    const lower = paragraph.toLocaleLowerCase('zh-CN')
    for (const term of terms) {
      let matchAt = lower.indexOf(term)
      while (matchAt >= 0) {
        const start = Math.max(0, Math.min(paragraph.length - maxLength, matchAt - Math.floor(maxLength / 3)))
        const end = Math.min(paragraph.length, start + maxLength)
        const snippet = `${start ? '…' : ''}${paragraph.slice(start, end).trim()}${end < paragraph.length ? '…' : ''}`
        if (!seen.has(snippet)) {
          seen.add(snippet)
          snippets.push(snippet)
        }
        matchAt = lower.indexOf(term, matchAt + Math.max(1, term.length))
      }
    }
  }

  return snippets.length ? snippets : [document.description]
}

export function searchDocuments(query: string, documents: SearchDocument[]): SearchResult[] {
  const terms = query.toLocaleLowerCase('zh-CN').trim().split(/\s+/).filter(Boolean)
  if (!terms.length) return []

  return documents.flatMap((document, position) => {
    const title = `${document.title} ${document.navTitle || ''}`.toLocaleLowerCase('zh-CN')
    const description = document.description.toLocaleLowerCase('zh-CN')
    const body = document.text.toLocaleLowerCase('zh-CN')
    const allText = `${title} ${description} ${body}`
    if (!terms.every(term => allText.includes(term))) return []

    const score = terms.reduce((total, term) => total + (
      title.includes(term) ? 12 : description.includes(term) ? 5 : 1
    ), 0)
    return excerpts(document, terms).map((snippet, matchIndex) => ({
      ...document,
      key: `${document.path}:${matchIndex}`,
      snippet,
      score,
      position,
      matchIndex,
    }))
  }).sort((a, b) => b.score - a.score || a.position - b.position || a.matchIndex - b.matchIndex)
    .map(({ position: _position, matchIndex: _matchIndex, ...result }) => result)
}
