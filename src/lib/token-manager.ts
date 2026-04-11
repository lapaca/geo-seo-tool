import type { CrawlData } from '@/types'

const MAX_BODY_TEXT_LENGTH = 3000

export function estimateTokens(text: string): number {
  let count = 0
  for (const char of text) {
    // CJK characters ~0.5 tokens per char, latin ~0.25
    if (char.charCodeAt(0) > 0x4e00) {
      count += 2
    } else {
      count += 0.25
    }
  }
  return Math.ceil(count)
}

export function stripNoiseContent(bodyText: string): string {
  // Remove repeated whitespace/newlines
  let clean = bodyText.replace(/\n{3,}/g, '\n\n')
  clean = clean.replace(/[ \t]{2,}/g, ' ')
  // Trim
  return clean.trim()
}

export function prepareContentForAI(crawlData: CrawlData): {
  truncatedBody: string
  meta: { title: string; description: string; h1: string }
  tokenEstimate: number
} {
  let body = stripNoiseContent(crawlData.bodyText)

  // Truncate to MAX_BODY_TEXT_LENGTH
  if (body.length > MAX_BODY_TEXT_LENGTH) {
    body = body.slice(0, MAX_BODY_TEXT_LENGTH) + '\n...[内容已截断]'
  }

  const h1 = crawlData.headings.find((h) => h.level === 1)?.text || ''

  const meta = {
    title: crawlData.title || '',
    description: crawlData.metaDescription || '',
    h1,
  }

  const allText = `${meta.title} ${meta.description} ${meta.h1} ${body}`
  const tokenEstimate = estimateTokens(allText)

  return { truncatedBody: body, meta, tokenEstimate }
}
