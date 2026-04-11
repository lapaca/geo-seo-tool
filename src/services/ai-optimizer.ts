import Anthropic from '@anthropic-ai/sdk'
import type { CrawlData, SeoIssue, GeoIssue, Optimization, IssueStatus } from '@/types'
import { prepareContentForAI } from '@/lib/token-manager'

export class AiOptimizer {
  private client: Anthropic | null

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    this.client = apiKey ? new Anthropic({ apiKey }) : null
  }

  async analyzeAndOptimize(
    crawlData: CrawlData,
    seoIssues: SeoIssue[],
    geoRuleIssues: GeoIssue[]
  ): Promise<{
    geoAiIssues: GeoIssue[]
    optimizations: Optimization[]
  }> {
    // Mock mode when no API key
    if (!this.client) {
      return this.mockResult(crawlData, seoIssues, geoRuleIssues)
    }

    const { system, user } = this.buildPrompt(crawlData, seoIssues, geoRuleIssues)

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    })

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => {
        if (block.type === 'text') return block.text
        return ''
      })
      .join('')

    return this.parseResponse(text, geoRuleIssues, seoIssues)
  }

  private buildPrompt(
    crawlData: CrawlData,
    seoIssues: SeoIssue[],
    geoRuleIssues: GeoIssue[]
  ): { system: string; user: string } {
    const { truncatedBody, meta } = prepareContentForAI(crawlData)

    const failedSeoIssues = seoIssues.filter((i) => i.status !== 'pass')
    const failedGeoIssues = geoRuleIssues.filter((i) => i.status !== 'pass' && !i.aiAssisted)

    const system = `你是一个资深的 SEO 和 GEO（生成式引擎优化）专家。
你需要完成两个任务：

任务1: GEO AI 诊断
对网页内容进行以下 4 项 GEO 维度的分析诊断：
- content-clarity: 内容清晰度 — 段落是否有明确的主题句，AI 能否提取核心观点
- authority-references: 引用权威性 — 是否引用可信来源、数据、统计
- fact-density: 事实密度 — 内容中具体事实/数据/数字的密度
- content-uniqueness: 内容唯一性 — 内容是否有独特观点，非纯搬运

任务2: 优化建议生成
对所有 fail/warning 的问题（SEO + GEO），生成具体可操作的优化建议。

要求：
1. 每个优化建议提供 1-3 个候选方案
2. Title 优化需控制在 30-60 字符
3. Meta Description 需控制在 120-160 字符
4. 结构化数据必须是合法的 JSON-LD 格式
5. 内容改写需保留原文核心意思，增强 AI 可引用性
6. 严格返回 JSON 格式，不要有任何其他文字`

    const issuesList = [...failedSeoIssues, ...failedGeoIssues]
      .map((i) => `- [${i.id}] ${i.name}: ${i.description}`)
      .join('\n')

    const user = `## 网页信息
URL: ${crawlData.url}
当前 Title: ${meta.title || '(无)'}
当前 Description: ${meta.description || '(无)'}
当前 H1: ${meta.h1 || '(无)'}

## 正文内容（截取）
${truncatedBody}

## 已发现的问题
${issuesList || '(无明显问题)'}

请返回以下 JSON 格式（不要包含 \`\`\`json 标记）：
{
  "geoDiagnosis": [
    {
      "id": "content-clarity",
      "status": "pass|fail|warning",
      "description": "具体分析说明",
      "currentValue": "当前情况摘要",
      "recommendation": "改进建议"
    },
    {
      "id": "authority-references",
      "status": "...",
      "description": "...",
      "currentValue": "...",
      "recommendation": "..."
    },
    {
      "id": "fact-density",
      "status": "...",
      "description": "...",
      "currentValue": "...",
      "recommendation": "..."
    },
    {
      "id": "content-uniqueness",
      "status": "...",
      "description": "...",
      "currentValue": "...",
      "recommendation": "..."
    }
  ],
  "optimizations": [
    {
      "type": "title|meta_description|h1|structured_data|content_rewrite|alt_text|faq_schema|summary",
      "issueId": "对应的问题 id",
      "label": "优化项标题",
      "original": "当前内容",
      "suggestions": ["方案1", "方案2"]
    }
  ]
}`

    return { system, user }
  }

  private parseResponse(
    responseText: string,
    geoRuleIssues: GeoIssue[],
    seoIssues: SeoIssue[]
  ): { geoAiIssues: GeoIssue[]; optimizations: Optimization[] } {
    // Try to extract JSON from response
    let jsonStr = responseText.trim()
    // Remove markdown code block if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    let parsed: {
      geoDiagnosis?: Array<{
        id: string
        status: string
        description: string
        currentValue: string
        recommendation: string
      }>
      optimizations?: Array<{
        type: string
        issueId: string
        label: string
        original: string
        suggestions: string[]
      }>
    }

    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      // Fallback: return empty results
      return { geoAiIssues: [], optimizations: [] }
    }

    // Process GEO AI diagnosis
    const geoAiIssues: GeoIssue[] = (parsed.geoDiagnosis || []).map((d) => {
      const severityMap: Record<string, 'high' | 'medium' | 'low'> = {
        'content-clarity': 'high',
        'authority-references': 'high',
        'fact-density': 'medium',
        'content-uniqueness': 'high',
      }
      const weightMap: Record<string, number> = {
        'content-clarity': 8,
        'authority-references': 8,
        'fact-density': 6,
        'content-uniqueness': 8,
      }
      const nameMap: Record<string, string> = {
        'content-clarity': '内容清晰度',
        'authority-references': '引用权威性',
        'fact-density': '事实密度',
        'content-uniqueness': '内容唯一性',
      }
      const categoryMap: Record<string, 'content' | 'authority'> = {
        'content-clarity': 'content',
        'authority-references': 'authority',
        'fact-density': 'content',
        'content-uniqueness': 'content',
      }

      return {
        id: d.id,
        category: categoryMap[d.id] || 'content',
        name: nameMap[d.id] || d.id,
        description: d.description,
        severity: severityMap[d.id] || 'medium',
        status: (['pass', 'fail', 'warning'].includes(d.status) ? d.status : 'warning') as IssueStatus,
        currentValue: d.currentValue || null,
        recommendation: d.recommendation || '',
        weight: weightMap[d.id] || 6,
        aiAssisted: true,
      }
    })

    // Process optimizations
    const optimizations: Optimization[] = (parsed.optimizations || []).map((o, i) => ({
      id: `opt-${i + 1}`,
      type: o.type as Optimization['type'],
      issueId: o.issueId,
      label: o.label,
      original: o.original || null,
      suggestions: o.suggestions || [],
      selectedIndex: null,
      userEdited: null,
      accepted: false,
    }))

    return { geoAiIssues, optimizations }
  }

  private mockResult(
    crawlData: CrawlData,
    seoIssues: SeoIssue[],
    _geoRuleIssues: GeoIssue[]
  ): { geoAiIssues: GeoIssue[]; optimizations: Optimization[] } {
    const geoAiIssues: GeoIssue[] = [
      { id: 'content-clarity', category: 'content', name: '内容清晰度', description: '[Mock] 内容结构清晰，段落有明确主题句', severity: 'high', status: 'pass', currentValue: '良好', recommendation: '', weight: 8, aiAssisted: true },
      { id: 'authority-references', category: 'authority', name: '引用权威性', description: '[Mock] 缺少权威来源引用', severity: 'high', status: 'warning', currentValue: '未发现引用', recommendation: '添加来自权威来源的数据和引用', weight: 8, aiAssisted: true },
      { id: 'fact-density', category: 'content', name: '事实密度', description: '[Mock] 事实密度中等', severity: 'medium', status: 'warning', currentValue: '中等', recommendation: '增加具体数据和统计信息', weight: 6, aiAssisted: true },
      { id: 'content-uniqueness', category: 'content', name: '内容唯一性', description: '[Mock] 内容具有一定独特性', severity: 'high', status: 'pass', currentValue: '较好', recommendation: '', weight: 8, aiAssisted: true },
    ]

    const optimizations: Optimization[] = []
    let idx = 0

    const failedSeo = seoIssues.filter((i) => i.status !== 'pass')
    for (const issue of failedSeo) {
      idx++
      if (issue.id === 'title-length') {
        optimizations.push({
          id: `opt-${idx}`, type: 'title', issueId: issue.id, label: 'Title 优化',
          original: crawlData.title,
          suggestions: [
            `${(crawlData.title || 'My Site').slice(0, 30)} - 优质内容平台`,
            `探索 ${(crawlData.title || 'My Site').slice(0, 25)} | 专业指南`,
          ],
          selectedIndex: null, userEdited: null, accepted: false,
        })
      } else if (issue.id === 'meta-description') {
        optimizations.push({
          id: `opt-${idx}`, type: 'meta_description', issueId: issue.id, label: 'Meta Description 优化',
          original: crawlData.metaDescription,
          suggestions: [
            `[Mock] 这是一段优化后的 Meta Description，包含核心关键词，长度控制在 120-160 字符之间，能够吸引用户点击并准确描述页面内容。`,
          ],
          selectedIndex: null, userEdited: null, accepted: false,
        })
      } else if (issue.id === 'structured-data' || issue.id === 'h1-tag') {
        optimizations.push({
          id: `opt-${idx}`, type: issue.id === 'structured-data' ? 'structured_data' : 'h1', issueId: issue.id,
          label: issue.id === 'structured-data' ? '结构化数据' : 'H1 优化',
          original: null,
          suggestions: issue.id === 'structured-data'
            ? ['{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "' + (crawlData.title || 'Page') + '"\n}']
            : [`[Mock] ${crawlData.title || '页面标题'} - 完整指南`],
          selectedIndex: null, userEdited: null, accepted: false,
        })
      }
    }

    // Always add a summary suggestion
    idx++
    optimizations.push({
      id: `opt-${idx}`, type: 'summary', issueId: 'summary', label: '添加内容摘要',
      original: null,
      suggestions: ['[Mock] 本文介绍了该网页的核心内容，涵盖主要主题和关键信息，帮助读者快速了解全文要点。'],
      selectedIndex: null, userEdited: null, accepted: false,
    })

    return { geoAiIssues, optimizations }
  }
}
