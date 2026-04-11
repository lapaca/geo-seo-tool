// ==================== 抓取数据 ====================
export interface CrawlData {
  url: string
  finalUrl: string
  statusCode: number
  loadTimeMs: number
  htmlSize: number
  isHttps: boolean

  title: string | null
  metaDescription: string | null
  metaKeywords: string | null
  canonical: string | null
  viewport: string | null

  ogTags: {
    title: string | null
    description: string | null
    image: string | null
    type: string | null
    url: string | null
  }

  structuredData: JsonLdItem[]

  headings: { level: 1 | 2 | 3 | 4 | 5 | 6; text: string }[]
  images: { src: string; alt: string | null }[]
  internalLinks: { href: string; text: string }[]
  externalLinks: { href: string; text: string }[]

  robotsTxt: string | null
  hasSitemap: boolean

  semanticTags: {
    hasArticle: boolean
    hasSection: boolean
    hasNav: boolean
    hasMain: boolean
    hasAside: boolean
    hasHeader: boolean
    hasFooter: boolean
  }

  bodyText: string
}

export interface JsonLdItem {
  '@type': string
  [key: string]: unknown
}

// ==================== 分析结果 ====================
export type IssueSeverity = 'high' | 'medium' | 'low'
export type IssueStatus = 'pass' | 'fail' | 'warning'

export interface SeoIssue {
  id: string
  category: 'meta' | 'content' | 'technical' | 'social'
  name: string
  description: string
  severity: IssueSeverity
  status: IssueStatus
  currentValue: string | null
  recommendation: string
  weight: number
}

export interface GeoIssue {
  id: string
  category: 'structure' | 'content' | 'authority'
  name: string
  description: string
  severity: IssueSeverity
  status: IssueStatus
  currentValue: string | null
  recommendation: string
  weight: number
  aiAssisted: boolean
}

// ==================== AI 优化建议 ====================
export type OptimizationType =
  | 'title'
  | 'meta_description'
  | 'h1'
  | 'structured_data'
  | 'content_rewrite'
  | 'alt_text'
  | 'faq_schema'
  | 'summary'

export interface Optimization {
  id: string
  type: OptimizationType
  issueId: string
  label: string
  original: string | null
  suggestions: string[]
  selectedIndex: number | null
  userEdited: string | null
  accepted: boolean
}

// ==================== 导出 ====================
export type ExportFormat = 'html' | 'json' | 'markdown'

export interface ExportRequest {
  reportId: string
  format: ExportFormat
  optimizationIds: string[]
}

export interface ExportResult {
  format: ExportFormat
  content: string
  filename: string
}

// ==================== SSE ====================
export type SSEEventType =
  | 'status'
  | 'seo_score'
  | 'geo_score'
  | 'seo_issues'
  | 'geo_issues'
  | 'optimization'
  | 'error'
  | 'done'

// ==================== API ====================
export type ReportStatus =
  | 'PENDING'
  | 'CRAWLING'
  | 'ANALYZING'
  | 'OPTIMIZING'
  | 'COMPLETED'
  | 'FAILED'

// ==================== 高级分析指标 ====================
export interface AdvancedMetrics {
  // 性能指标
  performance: {
    ttfb: number          // Time to First Byte (ms)
    domSize: number       // DOM 节点数
    htmlSize: number      // HTML 体积 (bytes)
    loadTime: number      // 加载耗时 (ms)
    resourceCount: number // 资源请求数
    compressionRatio: number // 压缩比率
  }
  // 内容分析
  content: {
    wordCount: number         // 正文字数
    avgSentenceLength: number // 平均句长
    readabilityScore: number  // 可读性评分 0-100 (Flesch-Kincaid 变体)
    keywordDensity: Record<string, number> // 关键词密度 top 10
    contentToCodeRatio: number // 内容/代码比
    uniqueWordsRatio: number   // 词汇丰富度
    paragraphCount: number     // 段落数
    avgParagraphLength: number // 平均段落长度
  }
  // 链接分析
  links: {
    internalCount: number
    externalCount: number
    nofollowCount: number
    brokenCount: number        // 死链数（估计）
    anchorTextDiversity: number // 锚文本多样性 0-1
    linkDepthDistribution: Record<string, number> // 链接深度分布
  }
  // 技术 SEO
  technical: {
    hasHreflang: boolean
    hasAmpVersion: boolean
    hasPWA: boolean
    hasServiceWorker: boolean
    hasWebManifest: boolean
    cssFileCount: number
    jsFileCount: number
    inlineStyleCount: number
    inlineScriptCount: number
    deprecatedTagCount: number // 废弃 HTML 标签数
    iframeCount: number
    formCount: number
  }
  // GEO 高级指标
  geoAdvanced: {
    entityDensity: number       // 实体密度（命名实体/总词数）
    citationCount: number       // 引用计数
    dataPointCount: number      // 数据点计数（数字/统计）
    topicalDepthScore: number   // 主题深度评分 0-100
    eeatSignals: {              // E-E-A-T 信号
      experience: number        // 0-100
      expertise: number
      authoritativeness: number
      trustworthiness: number
    }
    contentFreshness: string | null // 内容时效性检测
    multimodalReadiness: number     // 多模态就绪度 0-100
  }
  // 竞争力指标
  competitiveness: {
    overallGrade: string  // A+ ~ F
    seoMaturityLevel: string // 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
    estimatedDifficulty: number // 优化难度 0-100
    priorityActions: string[]   // Top 5 优先行动项
  }
  // 雷达图数据
  radarData: {
    axis: string
    value: number   // 0-100
    fullMark: number
  }[]
}

export interface ReportResponse {
  id: string
  url: string
  status: ReportStatus
  seoScore: number | null
  geoScore: number | null
  seoIssues: SeoIssue[]
  geoIssues: GeoIssue[]
  optimizations: Optimization[]
  advancedMetrics: AdvancedMetrics | null
  createdAt: string
}

export interface ReportListItem {
  id: string
  url: string
  status: string
  seoScore: number | null
  geoScore: number | null
  createdAt: string
}
