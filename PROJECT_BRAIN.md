# PROJECT_BRAIN.md — GEO+SEO 自动优化工具

> 最后更新: 2026-04-11 — TypeScript 零报错，Build 成功，39 个源文件，已推送 GitHub

## 项目概述
面向个人站长的 AI 驱动 GEO+SEO 分析与优化工具。用户输入 URL → 自动抓取分析 → AI 生成优化建议 → 对比预览 → 导出。

## 技术栈
Next.js 16 + TypeScript + Tailwind CSS | Prisma 7 + SQLite (better-sqlite3) | NextAuth.js 4 | Claude API (Sonnet 4) | cheerio | lucide-react

## 架构决策
- 后台 fire-and-forget 分析：POST `/api/analyze` 立即返回 reportId，分析在后台运行
- 报告页轮询 `/api/report/[id]` 直到 COMPLETED/FAILED（每 2s）
- 单次 Claude API 调用：4 项 GEO AI 诊断 + 全部优化建议
- URL 去重缓存：同用户 + 同 URL + 24h 内复用
- SSRF 增强防护：DNS 解析后 IP 校验 + IPv6 + 端口白名单
- Token 预算：bodyText 截断 3000 字

## 完成状态：100% — 全部模块已实现

### 后端（13 个文件）
| 文件 | 说明 |
|------|------|
| `prisma/schema.prisma` | User + Report 模型，含 urlHash/startedAt/errorMsg |
| `src/lib/db.ts` | Prisma 7 + better-sqlite3 adapter |
| `src/lib/auth-options.ts` | NextAuth Credentials + JWT |
| `src/lib/url-validator.ts` | SSRF 增强（DNS resolve + IPv6 + 端口） |
| `src/lib/token-manager.ts` | bodyText 截断 + token 估算 |
| `src/lib/utils.ts` | cn() |
| `src/types/index.ts` | 全部类型定义 |
| `src/services/crawler.ts` | 网页抓取（cheerio 解析） |
| `src/services/seo-analyzer.ts` | 14 项 SEO 规则 + 加权评分 |
| `src/services/geo-analyzer.ts` | 5 项规则 + 4 项 AI 占位 |
| `src/services/ai-optimizer.ts` | 合并版（GEO 诊断 + 优化建议一次调用） |
| `src/services/exporter.ts` | HTML/JSON/Markdown 导出 |

### API 路由（6 个）
| 路由 | 说明 |
|------|------|
| `POST /api/analyze` | 创建报告 + 后台分析，返回 reportId |
| `POST /api/auth/register` | 注册 |
| `GET/POST /api/auth/[...nextauth]` | NextAuth handler |
| `GET /api/report/[id]` | 获取报告详情 |
| `GET /api/reports` | 历史列表 |
| `POST /api/export` | 导出优化内容 |

### 前端（10 个文件）
| 文件 | 说明 |
|------|------|
| `src/app/layout.tsx` | 根布局，集成 Providers + Header |
| `src/app/page.tsx` | 首页：URL 输入 → POST analyze → 跳转报告页 |
| `src/app/login/page.tsx` | 登录 |
| `src/app/register/page.tsx` | 注册（含自动登录） |
| `src/app/dashboard/page.tsx` | 历史记录列表 + 双评分 |
| `src/app/report/[id]/page.tsx` | **核心页面**：轮询状态 + 双评分圆环 + Tab(问题/优化) + 导出 |
| `src/components/ScoreRing.tsx` | SVG 圆环评分组件 |
| `src/components/IssueList.tsx` | 问题清单（可展开，按严重度排序） |
| `src/components/DiffPreview.tsx` | 原文 vs AI 建议对比（选择候选/自定义编辑/接受拒绝） |
| `src/components/ExportPanel.tsx` | 导出面板（HTML/JSON/MD/剪贴板） |

## 开发阶段

| 阶段 | 状态 |
|------|------|
| P1: 项目骨架 | ✅ |
| P2: 用户认证 | ✅ |
| P3: 页面抓取 | ✅ |
| P4: SEO+GEO 分析 | ✅ |
| P5: AI 优化 + 分析 API | ✅ |
| P6: 前端页面 + 导出 | ✅ |

## 端到端测试结果 (2026-04-11)

全部通过（Mock AI 模式，无 ANTHROPIC_API_KEY）：

| 测试项 | 结果 |
|--------|------|
| 首页加载 | ✅ 200 |
| 注册 API | ✅ `{"success":true}` |
| 登录（NextAuth） | ✅ 获取 session |
| 未登录访问 analyze | ✅ 返回 401 |
| 分析 API（已登录） | ✅ 返回 reportId |
| 后台分析完成 | ✅ status=COMPLETED, SEO=66, GEO=46 |
| SEO 检测 | ✅ 14 项（2 fail, 5 warning） |
| GEO 检测 | ✅ 9 项（3 fail, 4 warning, 含 4 项 AI mock） |
| Mock 优化建议 | ✅ 3 条（title, description, summary） |
| 历史列表 API | ✅ 返回 2 条记录 |
| 导出 API | ✅ 生成 HTML 片段 |
| URL 去重缓存 | ✅ `cached:true` |
| 登录/注册页渲染 | ✅ |
| Dashboard 渲染 | ✅ 客户端渲染 |

### 已修复的问题
1. **SSL 证书校验失败** — Node.js fetch 因代理/证书问题失败。解决：`.env` 加 `NODE_TLS_REJECT_UNAUTHORIZED=0`（仅开发环境）
2. **SSE 流中断** — 首页 `reader.cancel()` 会中断后端分析。解决：改为 fire-and-forget 后台分析 + 报告页轮询
3. **Prisma 7 breaking changes** — datasource URL 移到 `prisma.config.ts`，PrismaClient 需要 adapter 参数
4. **AI optimizer 空 key** — 加了 mock 模式，无 API key 时返回模拟数据

### 待验证
- 配置真实 ANTHROPIC_API_KEY 后测试 Claude API 调用
- 浏览器端完整流程（注册→登录→分析→查看报告→对比→导出）
