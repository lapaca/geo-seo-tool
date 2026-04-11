import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../src/generated/prisma/client.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adapter = new PrismaBetterSqlite3({ url: path.join(__dirname, '..', 'dev.db') })
const prisma = new PrismaClient({ adapter })

const experts = [
  {
    name: '张明远',
    avatar: null,
    title: '资深 GEO 优化顾问 / 前 Google SEO 工程师',
    bio: '10年搜索引擎优化经验，专注于生成式引擎优化(GEO)和结构化数据部署。曾为500+企业提供技术SEO咨询，精通Schema.org标记、E-E-A-T信号增强和AI引擎内容适配。',
    specialties: JSON.stringify(['GEO优化', '结构化数据', 'E-E-A-T', '技术SEO', 'AI搜索适配']),
    contactType: 'wechat',
    contactValue: 'geo_expert_zm',
    priceMin: 2000,
    priceMax: 5000,
    priceUnit: '次',
    totalOrders: 156,
    completedOrders: 148,
    avgRating: 4.9,
    avgResponseTime: '30分钟内',
    badge: 'verified',
  },
  {
    name: 'Sarah Chen',
    avatar: null,
    title: 'AI Search Optimization Specialist',
    bio: '前Perplexity内容合作团队成员，深谙AI搜索引擎的内容抓取和引用机制。擅长提升网页在ChatGPT Search、Perplexity、Google AI Overview中的引用率。',
    specialties: JSON.stringify(['AI搜索引用', 'Perplexity优化', 'ChatGPT Search', '内容策略', '引用率提升']),
    contactType: 'email',
    contactValue: 'sarah@geoseo.expert',
    priceMin: 3000,
    priceMax: 8000,
    priceUnit: '项目',
    totalOrders: 89,
    completedOrders: 85,
    avgRating: 4.8,
    avgResponseTime: '1小时内',
    badge: 'verified',
  },
  {
    name: '李科',
    avatar: null,
    title: 'Schema.org 结构化数据架构师',
    bio: '专注于JSON-LD结构化数据实施，精通FAQPage、HowTo、Article等30+Schema类型。帮助100+网站实现Rich Snippets展示，平均CTR提升40%。',
    specialties: JSON.stringify(['JSON-LD', 'Schema.org', 'Rich Snippets', '结构化数据', 'Knowledge Graph']),
    contactType: 'wechat',
    contactValue: 'schema_lk',
    priceMin: 1500,
    priceMax: 3000,
    priceUnit: '次',
    totalOrders: 213,
    completedOrders: 207,
    avgRating: 4.7,
    avgResponseTime: '2小时内',
    badge: 'senior',
  },
  {
    name: '王小磊',
    avatar: null,
    title: '全栈SEO技术顾问 / 内容工程师',
    bio: '全栈SEO从业者，涵盖技术SEO、内容优化、外链建设全链路。尤其擅长Next.js/React SPA应用的SEO优化和SSR渲染策略制定。',
    specialties: JSON.stringify(['技术SEO', 'SSR优化', 'Next.js SEO', '内容优化', '外链策略']),
    contactType: 'wechat',
    contactValue: 'seo_wang',
    priceMin: 800,
    priceMax: 2000,
    priceUnit: '小时',
    totalOrders: 67,
    completedOrders: 63,
    avgRating: 4.6,
    avgResponseTime: '1小时内',
    badge: 'senior',
  },
  {
    name: 'David Park',
    avatar: null,
    title: 'International SEO & GEO Consultant',
    bio: '跨境SEO/GEO专家，精通多语言hreflang部署、国际化结构化数据和跨区域AI搜索策略。服务客户覆盖中/英/日/韩四种语言市场。',
    specialties: JSON.stringify(['国际SEO', 'hreflang', '多语言GEO', '跨境电商SEO', '本地化']),
    contactType: 'email',
    contactValue: 'david@intlseo.com',
    priceMin: 5000,
    priceMax: 15000,
    priceUnit: '项目',
    totalOrders: 42,
    completedOrders: 40,
    avgRating: 4.9,
    avgResponseTime: '4小时内',
    badge: 'verified',
  },
  {
    name: '赵婷',
    avatar: null,
    title: 'E-E-A-T 信号增强专家',
    bio: '专注Google E-E-A-T(经验-专业-权威-可信)信号优化。帮助医疗、金融等YMYL领域网站提升搜索信任度，擅长作者权威性建设和引用网络构建。',
    specialties: JSON.stringify(['E-E-A-T', 'YMYL优化', '权威性建设', '引用网络', '信任信号']),
    contactType: 'wechat',
    contactValue: 'eeat_zhao',
    priceMin: 2500,
    priceMax: 6000,
    priceUnit: '次',
    totalOrders: 78,
    completedOrders: 75,
    avgRating: 4.8,
    avgResponseTime: '30分钟内',
    badge: 'senior',
  },
  {
    name: '刘一凡',
    avatar: null,
    title: 'AI 内容优化工程师',
    bio: '新一代AI内容优化师，擅长利用AI工具高效产出GEO友好内容。精通Prompt Engineering在SEO场景的应用，帮助内容团队10倍提效。',
    specialties: JSON.stringify(['AI内容', 'Prompt Engineering', '内容矩阵', 'GEO内容策略', '自动化']),
    contactType: 'telegram',
    contactValue: '@liu_geo',
    priceMin: 1000,
    priceMax: 3000,
    priceUnit: '次',
    totalOrders: 34,
    completedOrders: 32,
    avgRating: 4.5,
    avgResponseTime: '2小时内',
    badge: 'new',
  },
  {
    name: '陈思远',
    avatar: null,
    title: '电商SEO/GEO专家 / 前阿里巴巴搜索团队',
    bio: '电商搜索优化专家，深耕Product Schema、Merchant Listings和Shopping Graph优化。前阿里搜索团队成员，精通电商场景下的AI搜索引用策略。',
    specialties: JSON.stringify(['电商SEO', 'Product Schema', '商品结构化', 'Shopping Graph', 'Merchant Center']),
    contactType: 'wechat',
    contactValue: 'ecom_seo_chen',
    priceMin: 3000,
    priceMax: 10000,
    priceUnit: '项目',
    totalOrders: 95,
    completedOrders: 91,
    avgRating: 4.7,
    avgResponseTime: '1小时内',
    badge: 'verified',
  },
]

const reviews = [
  { authorName: '张总', rating: 5, content: '非常专业，结构化数据部署后Rich Snippets展现率提升了60%，CTR直接翻倍。', service: 'Schema.org部署' },
  { authorName: '李明', rating: 5, content: '响应很快，方案非常详细，问题定位精准。优化后一周内AI搜索引用就有明显提升。', service: 'GEO优化咨询' },
  { authorName: 'Mike W.', rating: 4, content: 'Good analysis, very thorough. The E-E-A-T improvement plan was particularly helpful.', service: 'E-E-A-T Audit' },
  { authorName: '王女士', rating: 5, content: '帮我们从C-级别优化到了A-，三个月搜索流量增长200%。强烈推荐！', service: '全站SEO优化' },
  { authorName: '创业者小陈', rating: 5, content: '预算有限但效果超出预期，性价比很高。尤其是FAQ Schema的方案很巧妙。', service: 'FAQ Schema实施' },
  { authorName: '跨境电商老板', rating: 5, content: '多语言SEO做得太好了，日本站流量3个月涨了5倍。', service: '国际SEO' },
  { authorName: '内容主编', rating: 4, content: 'AI内容策略落地很顺利，团队效率确实提升了不少。', service: 'AI内容策略' },
  { authorName: '产品经理', rating: 5, content: '电商结构化数据优化后商品在Google Shopping的曝光量明显增加。', service: '电商SEO' },
]

async function seed() {
  console.log('Seeding experts...')

  for (const data of experts) {
    const expert = await prisma.expert.create({ data })
    // Assign 2-4 reviews per expert
    const count = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      const review = reviews[Math.floor(Math.random() * reviews.length)]
      await prisma.expertReview.create({
        data: {
          expertId: expert.id,
          ...review,
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        },
      })
    }
    console.log(`  Created: ${data.name} (${data.badge})`)
  }

  console.log('Done!')
}

seed().catch(console.error).finally(() => process.exit())
