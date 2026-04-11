import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { validateUrl, hashUrl } from '@/lib/url-validator'
import { CrawlerService } from '@/services/crawler'
import { SeoAnalyzer } from '@/services/seo-analyzer'
import { GeoAnalyzer } from '@/services/geo-analyzer'
import { AiOptimizer } from '@/services/ai-optimizer'
import { AdvancedAnalyzer } from '@/services/advanced-analyzer'

const crawler = new CrawlerService()
const seoAnalyzer = new SeoAnalyzer()
const geoAnalyzer = new GeoAnalyzer()
const aiOptimizer = new AiOptimizer()
const advancedAnalyzer = new AdvancedAnalyzer()

/**
 * Background analysis pipeline.
 * Runs independently after the HTTP response has been sent.
 */
async function runAnalysis(reportId: string, url: string) {
  try {
    // CRAWLING
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'CRAWLING', startedAt: new Date() },
    })
    const crawlData = await crawler.crawl(url)

    // ANALYZING
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'ANALYZING' },
    })
    const seoResult = seoAnalyzer.analyze(crawlData)
    const geoRuleResult = geoAnalyzer.analyze(crawlData)

    // OPTIMIZING (single Claude API call: GEO AI diagnosis + optimization suggestions)
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'OPTIMIZING' },
    })
    const aiResult = await aiOptimizer.analyzeAndOptimize(
      crawlData,
      seoResult.issues,
      geoRuleResult.issues
    )

    // Merge GEO results (rule-based + AI)
    const finalGeoIssues = geoRuleResult.issues.map((issue) => {
      if (issue.aiAssisted) {
        const aiIssue = aiResult.geoAiIssues.find((ai) => ai.id === issue.id)
        return aiIssue || issue
      }
      return issue
    })
    const geoScore = geoAnalyzer.recalculateFullScore(finalGeoIssues)

    // Advanced metrics
    const advancedMetrics = advancedAnalyzer.analyze(
      crawlData, seoResult.issues, finalGeoIssues, seoResult.score, geoScore
    )

    // COMPLETED
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'COMPLETED',
        seoScore: seoResult.score,
        geoScore: geoScore,
        crawlData: JSON.stringify(crawlData),
        seoIssues: JSON.stringify(seoResult.issues),
        geoIssues: JSON.stringify(finalGeoIssues),
        optimizations: JSON.stringify(aiResult.optimizations),
        advancedMetrics: JSON.stringify(advancedMetrics),
      },
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '分析失败'
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'FAILED', errorMsg: errMsg },
    }).catch(() => {})
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response(JSON.stringify({ error: '未登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { url } = await req.json()
  if (!url) {
    return new Response(JSON.stringify({ error: 'URL 必填' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Validate URL (SSRF protection)
  const validation = await validateUrl(url)
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userId = (session.user as Record<string, string>).id
  const urlHashValue = hashUrl(url)

  // Check cache: same user + same URL + completed within 24h
  const cached = await prisma.report.findFirst({
    where: {
      userId,
      urlHash: urlHashValue,
      status: 'COMPLETED',
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (cached) {
    return new Response(
      JSON.stringify({ reportId: cached.id, cached: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Create report
  const report = await prisma.report.create({
    data: { userId, url, urlHash: urlHashValue, status: 'PENDING' },
  })

  // Fire-and-forget: start analysis in background
  runAnalysis(report.id, url)

  // Return reportId immediately
  return new Response(
    JSON.stringify({ reportId: report.id, cached: false }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
