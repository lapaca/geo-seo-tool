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

export interface ReportResponse {
  id: string
  url: string
  status: ReportStatus
  seoScore: number | null
  geoScore: number | null
  seoIssues: SeoIssue[]
  geoIssues: GeoIssue[]
  optimizations: Optimization[]
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
