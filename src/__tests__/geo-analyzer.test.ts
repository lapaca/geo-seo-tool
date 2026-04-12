import { describe, it, expect } from 'vitest'
import { GeoAnalyzer } from '@/services/geo-analyzer'
import type { CrawlData } from '@/types'

function makeCrawlData(overrides: Partial<CrawlData> = {}): CrawlData {
  return {
    url: 'https://example.com',
    finalUrl: 'https://example.com',
    statusCode: 200,
    loadTimeMs: 500,
    htmlSize: 10000,
    isHttps: true,
    title: 'Test Page',
    metaDescription: 'Test desc',
    metaKeywords: null,
    canonical: null,
    viewport: 'width=device-width',
    ogTags: { title: null, description: null, image: null, type: null, url: null },
    structuredData: [],
    headings: [{ level: 1, text: 'Test' }],
    images: [],
    internalLinks: [],
    externalLinks: [],
    robotsTxt: null,
    hasSitemap: false,
    semanticTags: { hasArticle: false, hasSection: false, hasNav: false, hasMain: false, hasAside: false, hasHeader: false, hasFooter: false },
    domCounts: { iframes: 0, forms: 0, cssFiles: 0, jsFiles: 0, inlineStyles: 0, inlineScripts: 0 },
    bodyText: 'Simple test content.',
    ...overrides,
  }
}

describe('GeoAnalyzer', () => {
  const analyzer = new GeoAnalyzer()

  it('should return 9 issues (5 rule + 4 AI pending)', () => {
    const { issues } = analyzer.analyze(makeCrawlData())
    expect(issues).toHaveLength(9)
  })

  it('should have 4 pending AI issues', () => {
    const { issues, pendingAiIssueIds } = analyzer.analyze(makeCrawlData())
    expect(pendingAiIssueIds).toHaveLength(4)
    const aiIssues = issues.filter((i) => i.aiAssisted)
    expect(aiIssues).toHaveLength(4)
  })

  it('should fail on missing structured data', () => {
    const { issues } = analyzer.analyze(makeCrawlData({ structuredData: [] }))
    const issue = issues.find((i) => i.id === 'structured-data')
    expect(issue?.status).toBe('fail')
  })

  it('should pass on present structured data', () => {
    const { issues } = analyzer.analyze(makeCrawlData({
      structuredData: [{ '@type': 'WebPage' }],
    }))
    const issue = issues.find((i) => i.id === 'structured-data')
    expect(issue?.status).toBe('pass')
  })

  it('should detect FAQ format', () => {
    const { issues } = analyzer.analyze(makeCrawlData({
      bodyText: '常见问题 Q: 什么是GEO？ A: 生成式引擎优化',
    }))
    const issue = issues.find((i) => i.id === 'qa-format')
    expect(issue?.status).toBe('pass')
  })

  it('should calculate score only from rule issues', () => {
    const { score, issues } = analyzer.analyze(makeCrawlData())
    const ruleIssues = issues.filter((i) => !i.aiAssisted)
    expect(ruleIssues.length).toBe(5)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('recalculateFullScore includes AI issues', () => {
    const { issues } = analyzer.analyze(makeCrawlData())
    const fullScore = analyzer.recalculateFullScore(issues)
    expect(fullScore).toBeGreaterThanOrEqual(0)
    expect(fullScore).toBeLessThanOrEqual(100)
  })
})
