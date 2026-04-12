import type { CrawlData, AdvancedMetrics, SeoIssue, GeoIssue } from '@/types'

export class AdvancedAnalyzer {
  analyze(
    crawlData: CrawlData,
    seoIssues: SeoIssue[],
    geoIssues: GeoIssue[],
    seoScore: number,
    geoScore: number
  ): AdvancedMetrics {
    return {
      performance: this.analyzePerformance(crawlData),
      content: this.analyzeContent(crawlData),
      links: this.analyzeLinks(crawlData),
      technical: this.analyzeTechnical(crawlData),
      geoAdvanced: this.analyzeGeoAdvanced(crawlData),
      competitiveness: this.analyzeCompetitiveness(seoScore, geoScore, seoIssues, geoIssues),
      radarData: this.buildRadarData(crawlData, seoScore, geoScore, seoIssues, geoIssues),
    }
  }

  private analyzePerformance(data: CrawlData): AdvancedMetrics['performance'] {
    const htmlSize = data.htmlSize
    const textSize = new Blob([data.bodyText]).size
    const compressionRatio = htmlSize > 0 ? Math.round((textSize / htmlSize) * 100) / 100 : 0

    return {
      ttfb: Math.min(data.loadTimeMs * 0.3, data.loadTimeMs), // estimate ~30% of load
      domSize: this.estimateDomNodes(data),
      htmlSize,
      loadTime: data.loadTimeMs,
      resourceCount: this.estimateResourceCount(data),
      compressionRatio,
    }
  }

  private analyzeContent(data: CrawlData): AdvancedMetrics['content'] {
    const text = data.bodyText
    const words = text.split(/\s+/).filter(Boolean)
    const wordCount = words.length

    // Sentence detection (basic)
    const sentences = text.split(/[.!?。！？]+/).filter((s) => s.trim().length > 5)
    const avgSentenceLength = sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0

    // Paragraphs
    const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 20)
    const paragraphCount = Math.max(paragraphs.length, 1)
    const avgParagraphLength = Math.round(wordCount / paragraphCount)

    // Keyword density (top 10 two-char+ words)
    const freq: Record<string, number> = {}
    for (const w of words) {
      const lw = w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
      if (lw.length >= 2) {
        freq[lw] = (freq[lw] || 0) + 1
      }
    }
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
    const keywordDensity: Record<string, number> = {}
    for (const [word, count] of sorted) {
      keywordDensity[word] = Math.round((count / Math.max(wordCount, 1)) * 10000) / 100
    }

    // Unique words ratio
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()))
    const uniqueWordsRatio = wordCount > 0 ? Math.round((uniqueWords.size / wordCount) * 100) / 100 : 0

    // Content to code ratio
    const textBytes = new Blob([text]).size
    const contentToCodeRatio = data.htmlSize > 0 ? Math.round((textBytes / data.htmlSize) * 100) / 100 : 0

    // Readability (simplified Flesch-Kincaid for CJK/mixed)
    const avgWordLen = words.reduce((s, w) => s + w.length, 0) / Math.max(wordCount, 1)
    const readabilityScore = Math.max(0, Math.min(100,
      Math.round(100 - (avgSentenceLength * 1.5) - (avgWordLen * 3))
    ))

    return {
      wordCount,
      avgSentenceLength,
      readabilityScore,
      keywordDensity,
      contentToCodeRatio,
      uniqueWordsRatio,
      paragraphCount,
      avgParagraphLength,
    }
  }

  private analyzeLinks(data: CrawlData): AdvancedMetrics['links'] {
    const allAnchors = [...data.internalLinks, ...data.externalLinks].map((l) => l.text)
    const uniqueAnchors = new Set(allAnchors.filter(Boolean))
    const anchorTextDiversity = allAnchors.length > 0
      ? Math.round((uniqueAnchors.size / allAnchors.length) * 100) / 100
      : 0

    // Link depth distribution
    const depthDist: Record<string, number> = { '1级': 0, '2级': 0, '3级+': 0 }
    for (const link of data.internalLinks) {
      const depth = link.href.split('/').filter(Boolean).length
      if (depth <= 1) depthDist['1级']++
      else if (depth === 2) depthDist['2级']++
      else depthDist['3级+']++
    }

    return {
      internalCount: data.internalLinks.length,
      externalCount: data.externalLinks.length,
      nofollowCount: 0, // would need rel attribute parsing
      brokenCount: 0,
      anchorTextDiversity,
      linkDepthDistribution: depthDist,
    }
  }

  private analyzeTechnical(data: CrawlData): AdvancedMetrics['technical'] {
    const counts = data.domCounts
    return {
      hasHreflang: false,
      hasAmpVersion: false,
      hasPWA: false,
      hasServiceWorker: false,
      hasWebManifest: false,
      cssFileCount: counts.cssFiles,
      jsFileCount: counts.jsFiles,
      inlineStyleCount: counts.inlineStyles,
      inlineScriptCount: counts.inlineScripts,
      deprecatedTagCount: 0,
      iframeCount: counts.iframes,
      formCount: counts.forms,
    }
  }

  private analyzeGeoAdvanced(data: CrawlData): AdvancedMetrics['geoAdvanced'] {
    const text = data.bodyText
    const words = text.split(/\s+/).filter(Boolean)
    const wordCount = Math.max(words.length, 1)

    // Entity density — count capitalized words / proper nouns as rough proxy
    const entityLike = words.filter((w) => /^[A-Z\u4e00-\u9fff]/.test(w) && w.length > 1)
    const entityDensity = Math.round((entityLike.length / wordCount) * 100) / 100

    // Citation count — URLs, "according to", "研究表明" etc.
    const citationPatterns = /https?:\/\/|according to|研究表明|数据显示|报告指出|调查发现|cited|reference|来源|出处/gi
    const citationCount = (text.match(citationPatterns) || []).length

    // Data point count — numbers with context
    const dataPoints = (text.match(/\d+[\.\d]*\s*[%％万亿美元RMB¥$€£kg吨年月日倍]/g) || []).length
    const dataPointCount = dataPoints + (text.match(/\d{4}年/g) || []).length

    // Topical depth — based on heading diversity and content length
    const headingTopics = new Set(data.headings.map((h) => h.text.slice(0, 10)))
    const topicalDepthScore = Math.min(100, Math.round(
      (headingTopics.size * 15) + (wordCount / 50) + (data.structuredData.length * 10)
    ))

    // E-E-A-T signals
    const hasAuthor = /作者|author|by\s/i.test(text)
    const hasDate = /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}/i.test(text)
    const hasCredentials = /博士|教授|专家|PhD|MBA|CTO|CEO|certified|资质/i.test(text)

    const experience = Math.min(100, citationCount * 15 + dataPointCount * 10)
    const expertise = Math.min(100, topicalDepthScore + (hasCredentials ? 20 : 0))
    const authoritativeness = Math.min(100, (hasAuthor ? 30 : 0) + citationCount * 10 + data.structuredData.length * 15)
    const trustworthiness = Math.min(100, (data.isHttps ? 30 : 0) + (hasDate ? 20 : 0) + (data.structuredData.length > 0 ? 20 : 0) + (citationCount > 0 ? 30 : 0))

    // Content freshness
    const dateMatch = text.match(/20\d{2}[-/年]\d{1,2}[-/月]\d{1,2}/)
    const contentFreshness = dateMatch ? dateMatch[0] : null

    // Multimodal readiness
    const imgWithAlt = data.images.filter((i) => i.alt).length
    const multimodalReadiness = Math.min(100, Math.round(
      (data.images.length > 0 ? 20 : 0) +
      (imgWithAlt / Math.max(data.images.length, 1)) * 30 +
      (data.structuredData.length > 0 ? 25 : 0) +
      (data.headings.length >= 3 ? 25 : 0)
    ))

    return {
      entityDensity,
      citationCount,
      dataPointCount,
      topicalDepthScore,
      eeatSignals: { experience, expertise, authoritativeness, trustworthiness },
      contentFreshness,
      multimodalReadiness,
    }
  }

  private analyzeCompetitiveness(
    seoScore: number,
    geoScore: number,
    seoIssues: SeoIssue[],
    geoIssues: GeoIssue[]
  ): AdvancedMetrics['competitiveness'] {
    const combined = (seoScore + geoScore) / 2

    const gradeMap: [number, string][] = [
      [95, 'A+'], [90, 'A'], [85, 'A-'],
      [80, 'B+'], [75, 'B'], [70, 'B-'],
      [65, 'C+'], [60, 'C'], [55, 'C-'],
      [50, 'D+'], [45, 'D'], [40, 'D-'],
      [0, 'F'],
    ]
    const overallGrade = gradeMap.find(([min]) => combined >= min)?.[1] || 'F'

    const maturityLevels: [number, string][] = [
      [80, 'Expert'], [60, 'Advanced'], [40, 'Intermediate'], [0, 'Beginner'],
    ]
    const seoMaturityLevel = maturityLevels.find(([min]) => combined >= min)?.[1] || 'Beginner'

    const failCount = [...seoIssues, ...geoIssues].filter((i) => i.status === 'fail').length
    const estimatedDifficulty = Math.min(100, failCount * 12 + (100 - combined) * 0.5)

    // Priority actions
    const allFails = [...seoIssues, ...geoIssues]
      .filter((i) => i.status === 'fail')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map((i) => i.recommendation || i.name)

    return {
      overallGrade,
      seoMaturityLevel,
      estimatedDifficulty: Math.round(estimatedDifficulty),
      priorityActions: allFails.length > 0 ? allFails : ['继续保持当前优化水平'],
    }
  }

  private buildRadarData(
    data: CrawlData,
    seoScore: number,
    geoScore: number,
    seoIssues: SeoIssue[],
    geoIssues: GeoIssue[]
  ): AdvancedMetrics['radarData'] {
    // Calculate sub-scores per category
    const calcCatScore = (issues: (SeoIssue | GeoIssue)[], cats: string[]) => {
      const filtered = issues.filter((i) => cats.includes(i.category))
      if (filtered.length === 0) return 50
      let total = 0, earned = 0
      for (const i of filtered) {
        total += i.weight
        if (i.status === 'pass') earned += i.weight
        else if (i.status === 'warning') earned += i.weight * 0.5
      }
      return total > 0 ? Math.round((earned / total) * 100) : 50
    }

    return [
      { axis: 'Meta 标签', value: calcCatScore(seoIssues, ['meta']), fullMark: 100 },
      { axis: '内容质量', value: calcCatScore([...seoIssues, ...geoIssues], ['content']), fullMark: 100 },
      { axis: '技术 SEO', value: calcCatScore(seoIssues, ['technical']), fullMark: 100 },
      { axis: '社交媒体', value: calcCatScore(seoIssues, ['social']), fullMark: 100 },
      { axis: '结构化数据', value: calcCatScore(geoIssues, ['structure']), fullMark: 100 },
      { axis: 'AI 可引用性', value: calcCatScore(geoIssues, ['content', 'authority']), fullMark: 100 },
      { axis: '性能指标', value: data.loadTimeMs < 2000 ? 85 : data.loadTimeMs < 5000 ? 60 : 30, fullMark: 100 },
      { axis: '移动端适配', value: data.viewport ? 90 : 20, fullMark: 100 },
    ]
  }

  private estimateDomNodes(data: CrawlData): number {
    // Rough estimate from content density
    return Math.round(data.htmlSize / 50)
  }

  private estimateResourceCount(data: CrawlData): number {
    const counts = data.domCounts
    return data.images.length + counts.cssFiles + counts.jsFiles
  }
}
