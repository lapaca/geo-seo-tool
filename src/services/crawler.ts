import * as cheerio from 'cheerio'
import type { CrawlData, JsonLdItem } from '@/types'

const MAX_BODY_TEXT = 5000
const FETCH_TIMEOUT = 15000

export class CrawlerService {
  async crawl(url: string): Promise<CrawlData> {
    const start = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    let response: Response
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'GeoSeoBot/1.0 (+https://geo-seo-tool.com)',
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      })
    } finally {
      clearTimeout(timer)
    }

    const html = await response.text()
    const loadTimeMs = Date.now() - start
    const finalUrl = response.url
    const $ = cheerio.load(html)

    const baseUrl = new URL(finalUrl)

    const [robotsTxt, hasSitemap] = await Promise.all([
      this.checkRobotsTxt(baseUrl.origin),
      this.checkSitemap(baseUrl.origin),
    ])

    return {
      url,
      finalUrl,
      statusCode: response.status,
      loadTimeMs,
      htmlSize: new Blob([html]).size,
      isHttps: finalUrl.startsWith('https'),
      ...this.extractMeta($),
      ogTags: this.extractOpenGraph($),
      structuredData: this.extractStructuredData($),
      headings: this.extractHeadings($),
      images: this.extractImages($, baseUrl),
      ...this.extractLinks($, baseUrl),
      robotsTxt,
      hasSitemap,
      semanticTags: this.detectSemanticTags($),
      bodyText: this.extractBodyText($),
    }
  }

  private extractMeta($: cheerio.CheerioAPI) {
    return {
      title: $('title').first().text().trim() || null,
      metaDescription: $('meta[name="description"]').attr('content')?.trim() || null,
      metaKeywords: $('meta[name="keywords"]').attr('content')?.trim() || null,
      canonical: $('link[rel="canonical"]').attr('href')?.trim() || null,
      viewport: $('meta[name="viewport"]').attr('content')?.trim() || null,
    }
  }

  private extractOpenGraph($: cheerio.CheerioAPI) {
    return {
      title: $('meta[property="og:title"]').attr('content')?.trim() || null,
      description: $('meta[property="og:description"]').attr('content')?.trim() || null,
      image: $('meta[property="og:image"]').attr('content')?.trim() || null,
      type: $('meta[property="og:type"]').attr('content')?.trim() || null,
      url: $('meta[property="og:url"]').attr('content')?.trim() || null,
    }
  }

  private extractStructuredData($: cheerio.CheerioAPI): JsonLdItem[] {
    const items: JsonLdItem[] = []
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '')
        if (Array.isArray(data)) {
          items.push(...data)
        } else if (data && data['@type']) {
          items.push(data)
        }
      } catch {
        // skip invalid JSON-LD
      }
    })
    return items
  }

  private extractHeadings($: cheerio.CheerioAPI): CrawlData['headings'] {
    const headings: CrawlData['headings'] = []
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const tag = (el as unknown as { tagName: string }).tagName.toLowerCase()
      const level = parseInt(tag[1], 10) as 1 | 2 | 3 | 4 | 5 | 6
      const text = $(el).text().trim()
      if (text) headings.push({ level, text })
    })
    return headings
  }

  private extractImages($: cheerio.CheerioAPI, baseUrl: URL): CrawlData['images'] {
    const images: CrawlData['images'] = []
    $('img').each((_, el) => {
      const src = $(el).attr('src')
      if (!src) return
      let fullSrc = src
      try {
        fullSrc = new URL(src, baseUrl.origin).toString()
      } catch { /* keep as is */ }
      images.push({
        src: fullSrc,
        alt: $(el).attr('alt')?.trim() || null,
      })
    })
    return images
  }

  private extractLinks($: cheerio.CheerioAPI, baseUrl: URL) {
    const internalLinks: CrawlData['internalLinks'] = []
    const externalLinks: CrawlData['externalLinks'] = []

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim()
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return

      const text = $(el).text().trim().slice(0, 100)
      try {
        const linkUrl = new URL(href, baseUrl.origin)
        if (linkUrl.hostname === baseUrl.hostname) {
          internalLinks.push({ href: linkUrl.pathname, text })
        } else {
          externalLinks.push({ href: linkUrl.toString(), text })
        }
      } catch {
        // relative link
        internalLinks.push({ href, text })
      }
    })

    return { internalLinks, externalLinks }
  }

  private extractBodyText($: cheerio.CheerioAPI): string {
    // Remove noise elements
    $('script, style, nav, footer, header, aside, noscript, iframe, svg').remove()

    let text = $('body').text() || ''
    // Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim()
    // Truncate
    if (text.length > MAX_BODY_TEXT) {
      text = text.slice(0, MAX_BODY_TEXT)
    }
    return text
  }

  private async checkRobotsTxt(origin: string): Promise<string | null> {
    try {
      const res = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000) })
      if (res.ok) return await res.text()
      return null
    } catch {
      return null
    }
  }

  private async checkSitemap(origin: string): Promise<boolean> {
    try {
      const res = await fetch(`${origin}/sitemap.xml`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  private detectSemanticTags($: cheerio.CheerioAPI): CrawlData['semanticTags'] {
    return {
      hasArticle: $('article').length > 0,
      hasSection: $('section').length > 0,
      hasNav: $('nav').length > 0,
      hasMain: $('main').length > 0,
      hasAside: $('aside').length > 0,
      hasHeader: $('header').length > 0,
      hasFooter: $('footer').length > 0,
    }
  }
}
