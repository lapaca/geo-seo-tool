import { describe, it, expect } from 'vitest'
import { SeoAnalyzer } from '@/services/seo-analyzer'
import type { CrawlData } from '@/types'

function makeCrawlData(overrides: Partial<CrawlData> = {}): CrawlData {
  return {
    url: 'https://example.com',
    finalUrl: 'https://example.com',
    statusCode: 200,
    loadTimeMs: 500,
    htmlSize: 10000,
    isHttps: true,
    title: 'Test Page Title That Is Long Enough',
    metaDescription: 'This is a meta description that is long enough to pass the minimum length check of one hundred and twenty characters in total.',
    metaKeywords: 'test, seo',
    canonical: 'https://example.com',
    viewport: 'width=device-width, initial-scale=1',
    ogTags: { title: 'Test', description: 'Desc', image: '/img.png', type: 'website', url: 'https://example.com' },
    structuredData: [],
    headings: [{ level: 1, text: 'Main Heading' }, { level: 2, text: 'Sub' }],
    images: [{ src: '/img.png', alt: 'test image' }],
    internalLinks: [{ href: '/a', text: 'a' }, { href: '/b', text: 'b' }, { href: '/c', text: 'c' }],
    externalLinks: [{ href: 'https://ext.com', text: 'ext' }],
    robotsTxt: 'User-agent: *\nAllow: /',
    hasSitemap: true,
    semanticTags: { hasArticle: true, hasSection: true, hasNav: true, hasMain: true, hasAside: false, hasHeader: true, hasFooter: true },
    domCounts: { iframes: 0, forms: 1, cssFiles: 2, jsFiles: 3, inlineStyles: 0, inlineScripts: 1 },
    bodyText: 'Test content for analysis.',
    ...overrides,
  }
}

describe('SeoAnalyzer', () => {
  const analyzer = new SeoAnalyzer()

  it('should return 14 issues', () => {
    const { issues } = analyzer.analyze(makeCrawlData())
    expect(issues).toHaveLength(14)
  })

  it('should score 100 for a perfect page', () => {
    const { score } = analyzer.analyze(makeCrawlData())
    expect(score).toBeGreaterThanOrEqual(90)
  })

  it('should fail on missing title', () => {
    const { issues, score } = analyzer.analyze(makeCrawlData({ title: null }))
    const titleIssue = issues.find((i) => i.id === 'title-length')
    expect(titleIssue?.status).toBe('fail')
    expect(score).toBeLessThan(90)
  })

  it('should warn on short title', () => {
    const { issues } = analyzer.analyze(makeCrawlData({ title: 'Short' }))
    const titleIssue = issues.find((i) => i.id === 'title-length')
    expect(titleIssue?.status).toBe('warning')
  })

  it('should fail on missing meta description', () => {
    const { issues } = analyzer.analyze(makeCrawlData({ metaDescription: null }))
    const issue = issues.find((i) => i.id === 'meta-description')
    expect(issue?.status).toBe('fail')
  })

  it('should fail on missing H1', () => {
    const { issues } = analyzer.analyze(makeCrawlData({ headings: [] }))
    const issue = issues.find((i) => i.id === 'h1-tag')
    expect(issue?.status).toBe('fail')
  })

  it('should warn on multiple H1s', () => {
    const { issues } = analyzer.analyze(makeCrawlData({
      headings: [{ level: 1, text: 'A' }, { level: 1, text: 'B' }],
    }))
    const issue = issues.find((i) => i.id === 'h1-tag')
    expect(issue?.status).toBe('warning')
  })

  it('should fail on HTTP', () => {
    const { issues } = analyzer.analyze(makeCrawlData({ isHttps: false }))
    const issue = issues.find((i) => i.id === 'https')
    expect(issue?.status).toBe('fail')
  })

  it('should warn on missing images alt', () => {
    const { issues } = analyzer.analyze(makeCrawlData({
      images: [{ src: '/a.png', alt: null }, { src: '/b.png', alt: null }],
    }))
    const issue = issues.find((i) => i.id === 'image-alt')
    expect(issue?.status).not.toBe('pass')
  })

  it('should fail on oversized page', () => {
    const { issues } = analyzer.analyze(makeCrawlData({ htmlSize: 4 * 1024 * 1024 }))
    const issue = issues.find((i) => i.id === 'page-size')
    expect(issue?.status).toBe('fail')
  })
})
