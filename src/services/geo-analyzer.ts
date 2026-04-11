import type { CrawlData, GeoIssue, IssueStatus } from '@/types'

export class GeoAnalyzer {
  analyze(data: CrawlData): { issues: GeoIssue[]; score: number; pendingAiIssueIds: string[] } {
    const ruleIssues: GeoIssue[] = [
      this.checkStructuredData(data),
      this.checkQAFormat(data),
      this.checkListsAndTables(data),
      this.checkSemanticMarkup(data),
      this.checkSummary(data),
    ]

    const pendingAiIssues = this.createPendingAiIssues()
    const allIssues = [...ruleIssues, ...pendingAiIssues]

    // Score only based on rule issues for now; AI issues will be scored after AI call
    const score = this.calculateScore(ruleIssues)

    return {
      issues: allIssues,
      score,
      pendingAiIssueIds: pendingAiIssues.map((i) => i.id),
    }
  }

  private checkStructuredData(data: CrawlData): GeoIssue {
    const count = data.structuredData.length
    const types = data.structuredData.map((d) => d['@type']).join(', ')
    let status: IssueStatus = 'pass'
    let description = `发现 ${count} 个结构化数据（${types}）`
    let recommendation = ''

    if (count === 0) {
      status = 'fail'
      description = '缺少 JSON-LD 结构化数据'
      recommendation = '添加 Schema.org 结构化数据（如 Article, FAQPage, WebPage），帮助 AI 引擎理解页面内容'
    }

    return {
      id: 'structured-data',
      category: 'structure',
      name: '结构化数据',
      description,
      severity: 'high',
      status,
      currentValue: count > 0 ? types : null,
      recommendation,
      weight: 10,
      aiAssisted: false,
    }
  }

  private checkQAFormat(data: CrawlData): GeoIssue {
    const bodyLower = data.bodyText.toLowerCase()
    const hasQuestionMark = (bodyLower.match(/\?/g) || []).length >= 2
    const hasFaqLike =
      bodyLower.includes('常见问题') ||
      bodyLower.includes('faq') ||
      bodyLower.includes('q&a') ||
      bodyLower.includes('q：') ||
      bodyLower.includes('问：')

    let status: IssueStatus = hasFaqLike ? 'pass' : hasQuestionMark ? 'warning' : 'fail'
    let description = hasFaqLike
      ? '页面包含问答/FAQ 格式内容'
      : '页面缺少问答/FAQ 结构'

    return {
      id: 'qa-format',
      category: 'structure',
      name: '问答格式',
      description,
      severity: 'medium',
      status,
      currentValue: hasFaqLike ? '有 FAQ' : '无 FAQ',
      recommendation: status !== 'pass' ? '添加 FAQ 部分，使用问答格式组织内容，方便 AI 引擎引用' : '',
      weight: 6,
      aiAssisted: false,
    }
  }

  private checkListsAndTables(data: CrawlData): GeoIssue {
    // Check in bodyText for list/table-like patterns
    const hasListPatterns =
      data.bodyText.includes('•') ||
      data.bodyText.includes('·') ||
      /\d+\.\s/.test(data.bodyText) ||
      /[-–]\s/.test(data.bodyText)

    // The crawler strips HTML, so we check body text patterns
    let status: IssueStatus = hasListPatterns ? 'pass' : 'warning'

    return {
      id: 'lists-tables',
      category: 'structure',
      name: '列表和表格',
      description: hasListPatterns ? '页面使用了列表/结构化展示' : '页面缺少列表或表格，内容结构化程度低',
      severity: 'medium',
      status,
      currentValue: hasListPatterns ? '有列表' : '无列表',
      recommendation: status !== 'pass' ? '使用有序/无序列表和表格组织信息，便于 AI 解析和引用' : '',
      weight: 5,
      aiAssisted: false,
    }
  }

  private checkSemanticMarkup(data: CrawlData): GeoIssue {
    const tags = data.semanticTags
    const used = Object.entries(tags).filter(([, v]) => v).map(([k]) => k.replace('has', '').toLowerCase())
    const count = used.length
    let status: IssueStatus = count >= 3 ? 'pass' : count >= 1 ? 'warning' : 'fail'

    return {
      id: 'semantic-markup',
      category: 'structure',
      name: '语义化标签',
      description: count > 0 ? `使用了 ${count} 种语义标签（${used.join(', ')}）` : '未使用 HTML5 语义标签',
      severity: 'medium',
      status,
      currentValue: used.join(', ') || null,
      recommendation: status !== 'pass' ? '使用 <article>, <section>, <main>, <nav> 等语义标签' : '',
      weight: 5,
      aiAssisted: false,
    }
  }

  private checkSummary(data: CrawlData): GeoIssue {
    const bodyLower = data.bodyText.toLowerCase()
    const hasSummary =
      bodyLower.includes('摘要') ||
      bodyLower.includes('概述') ||
      bodyLower.includes('总结') ||
      bodyLower.includes('tl;dr') ||
      bodyLower.includes('summary') ||
      bodyLower.includes('overview') ||
      bodyLower.includes('key takeaway')

    return {
      id: 'summary',
      category: 'content',
      name: '内容摘要',
      description: hasSummary ? '页面包含摘要/总结' : '页面缺少摘要或总结部分',
      severity: 'low',
      status: hasSummary ? 'pass' : 'warning',
      currentValue: hasSummary ? '有摘要' : '无摘要',
      recommendation: hasSummary ? '' : '在文章开头或末尾添加摘要/总结，方便 AI 快速提取核心内容',
      weight: 4,
      aiAssisted: false,
    }
  }

  private createPendingAiIssues(): GeoIssue[] {
    return [
      {
        id: 'content-clarity',
        category: 'content',
        name: '内容清晰度',
        description: '等待 AI 分析...',
        severity: 'high',
        status: 'warning' as IssueStatus,
        currentValue: null,
        recommendation: '',
        weight: 8,
        aiAssisted: true,
      },
      {
        id: 'authority-references',
        category: 'authority',
        name: '引用权威性',
        description: '等待 AI 分析...',
        severity: 'high',
        status: 'warning' as IssueStatus,
        currentValue: null,
        recommendation: '',
        weight: 8,
        aiAssisted: true,
      },
      {
        id: 'fact-density',
        category: 'content',
        name: '事实密度',
        description: '等待 AI 分析...',
        severity: 'medium',
        status: 'warning' as IssueStatus,
        currentValue: null,
        recommendation: '',
        weight: 6,
        aiAssisted: true,
      },
      {
        id: 'content-uniqueness',
        category: 'content',
        name: '内容唯一性',
        description: '等待 AI 分析...',
        severity: 'high',
        status: 'warning' as IssueStatus,
        currentValue: null,
        recommendation: '',
        weight: 8,
        aiAssisted: true,
      },
    ]
  }

  calculateScore(issues: GeoIssue[]): number {
    const scorable = issues.filter((i) => !i.aiAssisted)
    let totalWeight = 0
    let earnedWeight = 0

    for (const issue of scorable) {
      totalWeight += issue.weight
      if (issue.status === 'pass') {
        earnedWeight += issue.weight
      } else if (issue.status === 'warning') {
        earnedWeight += issue.weight * 0.5
      }
    }

    if (totalWeight === 0) return 100
    return Math.round((earnedWeight / totalWeight) * 100)
  }

  recalculateFullScore(issues: GeoIssue[]): number {
    let totalWeight = 0
    let earnedWeight = 0

    for (const issue of issues) {
      totalWeight += issue.weight
      if (issue.status === 'pass') {
        earnedWeight += issue.weight
      } else if (issue.status === 'warning') {
        earnedWeight += issue.weight * 0.5
      }
    }

    if (totalWeight === 0) return 100
    return Math.round((earnedWeight / totalWeight) * 100)
  }
}
