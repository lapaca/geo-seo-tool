面向中小团队的的一站式 GEO（生成式引擎优化）+ SEO（搜索引擎优化）分析与优化工具。用户输入网页 URL，系统自动抓取并分析页面内容，给出 SEO/GEO 问题诊断和优化建议

技术栈
- **框架**：Next.js 14+ (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS + shadcn/ui
- **数据库**：SQLite (Prisma ORM)，MVP 阶段够用
- **认证**：NextAuth.js（邮箱密码 + 可选 OAuth）
- **AI**：Claude API (Anthropic SDK)
- **网页抓取**：cheerio（HTML 解析）+ fetch（抓取）
- **部署**：Vercel

架构决策要点：

前端通过 SSE（Server-Sent Events）接收分析进度，替代轮询
认证统一使用 NextAuth.js，不手写 JWT
GEO AI 诊断与优化建议合并为一次 Claude API 调用
新增 URL Validator（增强 SSRF 防护）和 Token Manager（AI token 预算控制）
详情可见@TECH——DESIGN.MD

### 包含
- [x] 用户注册/登录（邮箱密码）
- [x] 单页面 URL 分析
- [x] SEO 规则引擎检查（14 项）
- [x] GEO 规则引擎检查（9 项）
- [x] SEO + GEO 双评分
- [x] Claude AI 生成优化建议（Title、Description、H1、结构化数据）
- [x] 原文 vs 优化对比预览
- [x] 导出优化内容（HTML/JSON/复制）
- [x] 历史记录

数据库500模拟数据注册测试
登陆测试
复杂性大站taobao等网页测试
