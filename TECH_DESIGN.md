# GEO+SEO 自动优化工具 - 技术设计文档

## 1. 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    客户端 (Browser)                    │
│  Next.js App Router (React + TypeScript)             │
│  ┌───────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │  首页/输入  │ │ 认证页面  │ │ 分析结果页/仪表盘  │   │
│  └───────────┘ └──────────┘ └───────────────────┘   │
│       ▲ SSE (EventSource)                            │
└───────┼─────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────┐
│                  Next.js API Routes                   │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐           │
│  │NextAuth  │ │ SSE Stream │ │Report API│           │
│  │  Auth    │ │ /api/analyze│ │          │           │
│  └────┬─────┘ └────┬───────┘ └────┬─────┘           │
│       │            │              │                   │
│  ┌────▼────────────▼──────────────▼─────┐            │
│  │          Service Layer                │            │
│  │  ┌─────────┐ ┌─────────┐ ┌────────┐  │            │
│  │  │ Crawler │ │Analyzer │ │   AI   │  │            │
│  │  │ Service │ │(SEO+GEO)│ │Optimizer│  │            │
│  │  └─────────┘ └─────────┘ └────────┘  │            │
│  │  ┌──────────────┐ ┌──────────────┐    │            │
│  │  │ URL Validator │ │Token Manager │    │            │
│  │  │ (SSRF Guard)  │ │(Budget Ctrl) │    │            │
│  │  └──────────────┘ └──────────────┘    │            │
│  └─────────────────┬────────────────────┘            │
│  ┌─────────────────▼──────────────────┐              │
│  │       Prisma ORM + SQLite           │              │
│  └─────────────────────────────────────┘              │
└──────────────────────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Claude API      │
              │  (Anthropic SDK) │
              └─────────────────┘
```

**架构决策要点：**
- 前端通过 SSE（Server-Sent Events）接收分析进度，替代轮询
- 认证统一使用 NextAuth.js，不手写 JWT
- GEO AI 诊断与优化建议合并为一次 Claude API 调用
- 新增 URL Validator（增强 SSRF 防护）和 Token Manager（AI token 预算控制）

---

## 2. 目录结构

```
geo/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # 首页
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── report/[id]/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts  # NextAuth handler
│   │       ├── auth/register/route.ts       # 注册
│   │       ├── analyze/route.ts             # SSE 流式分析
│   │       ├── report/[id]/route.ts
│   │       ├── reports/route.ts
│   │       └── export/route.ts
│   ├── lib/
│   │   ├── db.ts                # Prisma 单例
│   │   ├── auth-options.ts      # NextAuth 配置
│   │   ├── url-validator.ts     # URL 校验 + SSRF 防护
│   │   ├── token-manager.ts     # AI Token 预算管理
│   │   └── utils.ts
│   ├── services/
│   │   ├── crawler.ts           # 网页抓取
│   │   ├── seo-analyzer.ts      # SEO 规则引擎
│   │   ├── geo-analyzer.ts      # GEO 规则引擎（纯规则）
│   │   ├── ai-optimizer.ts      # Claude AI（GEO AI诊断 + 全部优化建议）
│   │   └── exporter.ts          # 导出
│   ├── types/
│   │   └── index.ts
│   └── components/
│       ├── ui/                  # shadcn/ui
│       ├── layout/
│       │   ├── Header.tsx
│       │   └── Footer.tsx
│       ├── UrlInput.tsx
│       ├── ScoreRing.tsx
│       ├── IssueList.tsx
│       ├── DiffPreview.tsx
│       └── ExportPanel.tsx
├── public/
├── .env.local
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 3. 数据模型 (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // file:./dev.db
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  reports   Report[]
}

model Report {
  id        String       @id @default(cuid())
  userId    String
  user      User         @relation(fields: [userId], references: [id])
  url       String
  urlHash   String       // 用于 URL 去重缓存（SHA256 of normalized URL）
  status    String       @default("PENDING") // PENDING|CRAWLING|ANALYZING|OPTIMIZING|COMPLETED|FAILED
  errorMsg  String?      // 失败时的错误信息

  seoScore  Int?
  geoScore  Int?

  crawlData     String?  // JSON string: CrawlData
  seoIssues     String?  // JSON string: SeoIssue[]
  geoIssues     String?  // JSON string: GeoIssue[]
  optimizations String?  // JSON string: Optimization[]

  startedAt DateTime?    // 分析开始时间（僵尸任务检测用）
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@index([userId])
  @@index([urlHash, userId])  // URL 去重查询
  @@index([createdAt])
  @@index([status, startedAt]) // 僵尸任务检测查询
}
```

**vs 上版变化：**
- `status` 改为 String（SQLite 不支持原生 enum，Prisma enum 在 SQLite 上映射为 String）
- 新增 `urlHash` 字段用于同 URL 去重缓存
- 新增 `startedAt` 字段用于僵尸任务检测
- 新增 `errorMsg` 字段用于失败时存储详细错误
- JSON 字段使用 String 存储（SQLite 无原生 JSON 类型）

---

## 4. 核心类型定义

```typescript
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

  // 正文（已做截断，最多 MAX_BODY_TEXT_LENGTH 字符）
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
  // GEO 分为规则检查和 AI 辅助检查
  // 规则检查：structured-data, qa-format, lists-tables, semantic-markup, summary
  // AI 辅助检查：content-clarity, authority-references, fact-density, content-uniqueness
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

// ==================== SSE 事件 ====================
export type SSEEventType =
  | 'status'      // 状态变更
  | 'seo_score'   // SEO 评分完成
  | 'geo_score'   // GEO 评分完成
  | 'seo_issues'  // SEO 问题列表
  | 'geo_issues'  // GEO 问题列表
  | 'optimization' // 单条优化建议（逐条推送）
  | 'error'       // 错误
  | 'done'        // 完成

export interface SSEEvent {
  event: SSEEventType
  data: unknown
}

// ==================== API ====================
export interface ReportResponse {
  id: string
  url: string
  status: string
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
```

---

## 5. 核心服务模块设计

### 5.1 URL Validator — SSRF 防护（增强版）

```typescript
// lib/url-validator.ts

import { lookup } from 'dns/promises'

/**
 * 增强版 URL 校验，防止 SSRF 攻击
 *
 * 检查项：
 * 1. 协议白名单：仅 http/https
 * 2. 主机名黑名单：localhost, 127.0.0.1, ::1, 0.0.0.0
 * 3. DNS 解析后 IP 校验：防止 DNS rebinding
 *    - 10.0.0.0/8（A 类内网）
 *    - 172.16.0.0/12（B 类内网）
 *    - 192.168.0.0/16（C 类内网）
 *    - 169.254.0.0/16（link-local）
 *    - 127.0.0.0/8（loopback）
 *    - ::1, fe80::/10（IPv6 本地）
 * 4. 端口限制：仅 80/443
 */
export async function validateUrl(url: string): Promise<{ valid: boolean; error?: string }>

function isPrivateIP(ip: string): boolean
```

### 5.2 Token Manager — AI Token 预算管理

```typescript
// lib/token-manager.ts

/**
 * 管理 Claude API 的输入 token 预算
 *
 * 策略：
 * - bodyText 截断到 3000 字符（约 1500 tokens for 中文）
 * - 去除导航、footer、sidebar 等噪音内容
 * - 总 prompt 控制在 4000 tokens 以内
 * - 超长时做摘要压缩
 */
export function prepareContentForAI(crawlData: CrawlData): {
  truncatedBody: string
  meta: { title: string; description: string; h1: string }
  tokenEstimate: number
}

export function stripNoiseContent(html: string): string
// 去除 <nav>, <footer>, <aside>, <script>, <style>, 重复导航等

export function estimateTokens(text: string): number
// 粗略估算：中文 ~0.5 token/字符，英文 ~0.25 token/字符
```

### 5.3 Crawler Service

```typescript
// services/crawler.ts

export class CrawlerService {
  async crawl(url: string): Promise<CrawlData>

  private extractMeta(doc: CheerioAPI): Pick<CrawlData, 'title' | 'metaDescription' | 'metaKeywords' | 'canonical' | 'viewport'>
  private extractOpenGraph(doc: CheerioAPI): CrawlData['ogTags']
  private extractStructuredData(doc: CheerioAPI): JsonLdItem[]
  private extractHeadings(doc: CheerioAPI): CrawlData['headings']
  private extractImages(doc: CheerioAPI, baseUrl: string): CrawlData['images']
  private extractLinks(doc: CheerioAPI, baseUrl: string): { internal: CrawlData['internalLinks']; external: CrawlData['externalLinks'] }
  private extractBodyText(doc: CheerioAPI): string  // 去噪后截断到 MAX_BODY_TEXT_LENGTH
  private checkRobotsTxt(url: string): Promise<string | null>
  private checkSitemap(url: string): Promise<boolean>
  private detectSemanticTags(doc: CheerioAPI): CrawlData['semanticTags']
}
```

### 5.4 SEO Analyzer

```typescript
// services/seo-analyzer.ts

export class SeoAnalyzer {
  analyze(data: CrawlData): { issues: SeoIssue[]; score: number }

  // 14 项规则（同上版，此处省略方法签名）
  // 评分算法不变：加权通过率 × 100
}
```

### 5.5 GEO Analyzer（纯规则部分）

```typescript
// services/geo-analyzer.ts

/**
 * 变更：GEO Analyzer 只做纯规则可判断的 5 项检查
 * AI 辅助的 4 项（content-clarity, authority-references, fact-density, content-uniqueness）
 * 移到 AiOptimizer 中，与优化建议生成合并为一次 API 调用
 */
export class GeoAnalyzer {
  analyze(data: CrawlData): { issues: GeoIssue[]; score: number; pendingAiIssueIds: string[] }

  // 纯规则检查（5 项）
  private checkStructuredData(data: CrawlData): GeoIssue
  private checkQAFormat(data: CrawlData): GeoIssue
  private checkListsAndTables(data: CrawlData): GeoIssue
  private checkSemanticMarkup(data: CrawlData): GeoIssue
  private checkSummary(data: CrawlData): GeoIssue

  // AI 辅助检查（4 项）— 创建占位 issue，标记 aiAssisted=true
  // 实际诊断由 AiOptimizer 完成后回填
  private createPendingAiIssues(): GeoIssue[]

  private calculateScore(issues: GeoIssue[]): number
}
```

### 5.6 AI Optimizer（合并版）

```typescript
// services/ai-optimizer.ts

/**
 * 一次 Claude API 调用同时完成：
 * 1. GEO AI 辅助诊断（4 项：内容清晰度、引用权威性、事实密度、内容唯一性）
 * 2. 全部优化建议生成
 *
 * 好处：减少 API 调用次数（2次→1次），节省 token 和延迟
 */
export class AiOptimizer {
  private client: Anthropic

  async analyzeAndOptimize(
    crawlData: CrawlData,
    seoIssues: SeoIssue[],
    geoRuleIssues: GeoIssue[]      // 纯规则检查结果
  ): Promise<{
    geoAiIssues: GeoIssue[]         // AI 辅助诊断的 4 项 GEO 结果
    optimizations: Optimization[]    // 全部优化建议
  }>

  /**
   * Prompt 结构（一次调用，两个任务）：
   *
   * System: 你是 SEO/GEO 优化专家。请完成两个任务：
   *   任务1: 对内容进行 GEO 维度的 AI 诊断
   *   任务2: 对所有问题生成优化建议
   *
   * User: 网页数据 + 已有问题列表
   *
   * 期望返回 JSON：
   * {
   *   "geoDiagnosis": [
   *     { "id": "content-clarity", "status": "fail"|"pass"|"warning", "description": "...", "currentValue": "..." },
   *     ...
   *   ],
   *   "optimizations": [
   *     { "type": "title", "issueId": "...", "label": "...", "original": "...", "suggestions": ["...", "..."] },
   *     ...
   *   ]
   * }
   */
  private buildPrompt(
    crawlData: CrawlData,
    seoIssues: SeoIssue[],
    geoRuleIssues: GeoIssue[]
  ): { system: string; user: string }

  private parseResponse(
    response: string,
    geoRuleIssues: GeoIssue[],
    seoIssues: SeoIssue[]
  ): { geoAiIssues: GeoIssue[]; optimizations: Optimization[] }
}
```

### 5.7 Exporter

```typescript
// services/exporter.ts
// 同上版，无变化
export class Exporter {
  export(optimizations: Optimization[], selectedIds: string[], format: ExportFormat): ExportResult
  private toHtml(items: Optimization[]): string
  private toJson(items: Optimization[]): string
  private toMarkdown(items: Optimization[]): string
}
```

---

## 6. API 设计

### 6.1 认证 — NextAuth.js

```typescript
// lib/auth-options.ts

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // 查找用户 → bcrypt 验证密码 → 返回 user 对象
      }
    })
  ],
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 }, // 7 天
  callbacks: {
    async jwt({ token, user }) { /* 注入 userId */ },
    async session({ session, token }) { /* 注入 userId 到 session */ }
  }
}
```

**注册 API 仍需手写**（NextAuth 不提供注册功能）：

```
POST /api/auth/register
Body: { email, password, name? }
→ bcrypt 加密密码 → 创建 User → 返回 { success: true }
```

### 6.2 POST /api/analyze — SSE 流式分析

```typescript
// app/api/analyze/route.ts

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response(401)

  const { url } = await req.json()

  // 1. URL 校验（增强版 SSRF 防护）
  const validation = await validateUrl(url)
  if (!validation.valid) return Response(400, validation.error)

  // 2. URL 去重检查
  const urlHash = sha256(normalizeUrl(url))
  const cached = await findRecentReport(session.user.id, urlHash, 24h)
  if (cached) return Response({ reportId: cached.id, cached: true })

  // 3. 创建 Report
  const report = await createReport(session.user.id, url, urlHash)

  // 4. 返回 SSE 流
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEventType, data: unknown) => {
        controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      }

      try {
        // CRAWLING
        send('status', 'CRAWLING')
        updateReport(report.id, { status: 'CRAWLING', startedAt: new Date() })
        const crawlData = await crawler.crawl(url)

        // ANALYZING
        send('status', 'ANALYZING')
        updateReport(report.id, { status: 'ANALYZING' })
        const seoResult = seoAnalyzer.analyze(crawlData)
        const geoRuleResult = geoAnalyzer.analyze(crawlData)
        send('seo_issues', seoResult.issues)
        send('seo_score', seoResult.score)
        send('geo_issues', geoRuleResult.issues)

        // OPTIMIZING (AI: GEO 诊断 + 优化建议 — 一次调用)
        send('status', 'OPTIMIZING')
        updateReport(report.id, { status: 'OPTIMIZING' })
        const aiResult = await aiOptimizer.analyzeAndOptimize(
          crawlData, seoResult.issues, geoRuleResult.issues
        )

        // 合并 GEO 结果（规则 + AI）并重新算分
        const finalGeoIssues = mergeGeoIssues(geoRuleResult.issues, aiResult.geoAiIssues)
        const geoScore = recalculateGeoScore(finalGeoIssues)

        send('geo_issues', finalGeoIssues)  // 更新完整 GEO 结果
        send('geo_score', geoScore)

        // 逐条推送优化建议
        for (const opt of aiResult.optimizations) {
          send('optimization', opt)
        }

        // COMPLETED
        await updateReport(report.id, {
          status: 'COMPLETED',
          seoScore: seoResult.score,
          geoScore: geoScore,
          crawlData, seoIssues: seoResult.issues,
          geoIssues: finalGeoIssues,
          optimizations: aiResult.optimizations
        })
        send('status', 'COMPLETED')
        send('done', { reportId: report.id })
      } catch (error) {
        await updateReport(report.id, { status: 'FAILED', errorMsg: error.message })
        send('error', { message: error.message })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

### 6.3 GET /api/report/[id]

```
获取已完成的报告详情（用于仪表盘跳转、页面刷新后恢复）

响应：ReportResponse
```

### 6.4 GET /api/reports

```
获取当前用户的历史报告列表

响应：ReportListItem[]（按 createdAt DESC 排序，分页）
```

### 6.5 POST /api/export

```
请求：ExportRequest
响应：ExportResult
```

---

## 7. URL 去重缓存

```
流程：
1. 用户提交 URL
2. 标准化 URL（去除尾部 /, 统一小写 hostname, 去除 tracking params）
3. SHA256 生成 urlHash
4. 查询: 同 userId + 同 urlHash + createdAt > (now - 24h) + status = COMPLETED
5. 命中 → 返回 { reportId, cached: true }，前端提示 "已有分析结果，查看 or 重新分析？"
6. 未命中 → 正常创建新 Report
```

---

## 8. 僵尸任务检测

```typescript
/**
 * 启动时和每 5 分钟执行一次：
 * 查找 status IN ('CRAWLING', 'ANALYZING', 'OPTIMIZING')
 *   AND startedAt < (now - 5min)
 * 将这些 Report 标记为 FAILED，errorMsg = '分析超时'
 *
 * 实现方式：Next.js API route cron 或 app 启动时调用
 */
async function cleanupStaleReports(): Promise<number>
```

---

## 9. 前端核心组件

### 9.1 SSE 连接 Hook

```typescript
// hooks/useAnalyze.ts

function useAnalyze() {
  const [status, setStatus] = useState<string>('idle')
  const [seoScore, setSeoScore] = useState<number | null>(null)
  const [geoScore, setGeoScore] = useState<number | null>(null)
  const [seoIssues, setSeoIssues] = useState<SeoIssue[]>([])
  const [geoIssues, setGeoIssues] = useState<GeoIssue[]>([])
  const [optimizations, setOptimizations] = useState<Optimization[]>([])
  const [error, setError] = useState<string | null>(null)

  async function startAnalysis(url: string) {
    setStatus('connecting')

    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ url })
    })

    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      // 解析 SSE 事件，更新对应状态
      // optimization 事件逐条 append 到 optimizations 数组
    }
  }

  return { status, seoScore, geoScore, seoIssues, geoIssues, optimizations, error, startAnalysis }
}
```

### 9.2 组件树（同上版）

```
App Layout
├── Header (Logo, Nav, UserMenu via NextAuth useSession)
├── Pages
│   ├── HomePage → UrlInput
│   ├── LoginPage / RegisterPage → AuthForm
│   ├── DashboardPage → ReportList
│   └── ReportPage
│       ├── ReportHeader
│       ├── ScoreOverview (ScoreRing × 2)
│       ├── Tabs: IssueList | OptimizationList (DiffPreview)
│       └── ExportPanel
└── Footer
```

---

## 10. 安全设计（增强版）

| 层面 | 措施 |
|------|------|
| 密码存储 | bcrypt, salt rounds = 12 |
| 会话 | NextAuth JWT, 7天过期, httpOnly |
| SSRF 防护 | 协议白名单 + DNS 解析后 IP 校验（IPv4/IPv6） + 端口限制 |
| API 限流 | 分析: 10次/min/user, 注册: 5次/hr/IP |
| 输入清洗 | URL 校验, XSS 过滤 |
| AI Token 保护 | 正文截断 3000 字符, prompt 总预算 4000 tokens |
| API Key | ANTHROPIC_API_KEY 仅服务端环境变量 |
| 僵尸任务 | 5分钟超时自动标记 FAILED |

---

## 11. 环境变量

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="随机生成32位密钥"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## 12. 依赖清单

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "@anthropic-ai/sdk": "latest",
    "@prisma/client": "^6.x",
    "next-auth": "^4.x",
    "cheerio": "^1.x",
    "bcryptjs": "^2.x",
    "tailwindcss": "^4.x",
    "clsx": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "prisma": "^6.x",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/bcryptjs": "latest"
  }
}
```

**vs 上版变化：**
- 去掉 `jsonwebtoken` + `@types/jsonwebtoken`（改用 NextAuth）
- 新增 `next-auth`

---

## 13. 开发阶段

| 阶段 | 内容 |
|------|------|
| P1 | 项目初始化、Prisma Schema、DB 迁移、目录结构 |
| P2 | NextAuth 认证 + 注册 API + 登录/注册页 |
| P3 | CrawlerService + URL Validator（SSRF 增强） |
| P4 | SeoAnalyzer + GeoAnalyzer（纯规则部分） |
| P5 | AiOptimizer（合并版）+ Token Manager + SSE 分析 API |
| P6 | 前端全部页面 + SSE Hook + 导出 |
