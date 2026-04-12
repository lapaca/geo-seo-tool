import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../src/generated/prisma/client.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adapter = new PrismaBetterSqlite3({ url: path.join(__dirname, '..', 'dev.db') })
const prisma = new PrismaClient({ adapter })

// Name pools for diverse generation
const chineseSurnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕']
const chineseFirstNames = ['明远', '子轩', '浩然', '宇航', '思源', '博文', '致远', '雨泽', '晨阳', '逸凡', '文昊', '嘉豪', '书涵', '哲瀚', '健雄', '志强', '国栋', '春兰', '婉容', '淑芬', '雅婷', '静怡', '若曦', '思琪', '婧怡', '美琳', '欣然', '佳怡', '诗韵', '雅静', '梓涵', '艺涵', '若曦', '晓彤', '雨欣', '思颖', '晨曦', '语嫣', '紫萱', '梦琪']
const englishNames = [
  'Sarah Chen', 'David Park', 'Michael Wong', 'Emily Zhang', 'James Liu', 'Olivia Wang',
  'Alex Kim', 'Rachel Chen', 'Kevin Wu', 'Jessica Huang', 'Ryan Lee', 'Sophia Lin',
  'Daniel Zhao', 'Emma Tang', 'Brian Cheng', 'Lisa Xu', 'Jason Song', 'Amanda Feng',
  'Chris Yang', 'Grace Shen', 'Eric Chen', 'Anna Liu', 'Tom Zhang', 'Lily Wang',
  'Mark Johnson', 'Linda Smith', 'John Brown', 'Mary Davis', 'Peter Miller',
]

const titles = [
  '资深 GEO 优化顾问',
  '高级 SEO 策略师',
  'AI 搜索优化专家',
  '结构化数据架构师',
  '技术 SEO 工程师',
  '前 Google SEO 工程师',
  '前 Bing 搜索团队成员',
  '内容优化工程师',
  'E-E-A-T 信号专家',
  'Schema.org 顾问',
  '国际 SEO 专家',
  '电商 SEO 顾问',
  '本地 SEO 专家',
  '企业 SEO 总监',
  '全栈 SEO 工程师',
  'Core Web Vitals 优化师',
  '独立 GEO 咨询师',
  '前 Perplexity 合作方',
  '前 Anthropic 内容顾问',
  'AI 内容策略师',
  '知识图谱工程师',
  'JSON-LD 架构师',
  '多语言 GEO 专家',
  'YMYL 领域顾问',
  '跨境电商 SEO',
]

const orgs = [
  '前字节跳动', '前阿里巴巴', '前腾讯', '前百度', '前 Google', '前 Meta',
  '前 Perplexity', '前 OpenAI', '前 Anthropic', '前 Microsoft', '前 Amazon',
  '前 Shopify', '前 Adobe', '前小红书', '前美团', '前京东', '前网易', '前滴滴',
]

const specialtyPool = [
  'GEO优化', '技术SEO', '结构化数据', 'E-E-A-T', 'AI搜索适配', 'Schema.org',
  'Rich Snippets', '内容优化', '外链建设', '电商SEO', '国际SEO', 'hreflang',
  'AI内容', 'Prompt Engineering', 'SSR优化', 'Core Web Vitals', '移动端SEO',
  '本地SEO', 'YMYL优化', '权威性建设', '引用网络', '信任信号', 'JSON-LD',
  '知识图谱', 'Product Schema', 'FAQPage', 'Article Schema', 'HowTo',
  'Perplexity优化', 'ChatGPT Search', 'Google AI Overview', '内容策略',
  '关键词研究', '竞品分析', '流量增长', 'CTR优化', '转化率优化',
  '站点架构', '内链优化', '爬虫优化', '索引优化', 'sitemap',
]

const bioTemplates = [
  '{year}年搜索引擎优化经验，{org}核心成员。服务过{clients}+客户，擅长{specialty1}和{specialty2}。累计帮助客户流量增长{growth}%。',
  '专注{specialty1}领域{year}年，深谙{specialty2}的底层机制。曾主导多个百万级流量项目的 SEO/GEO 优化战略。',
  '{org}核心团队出身，精通{specialty1}、{specialty2}及{specialty3}。擅长为中大型网站提供系统化的搜索优化解决方案。',
  '全链路 SEO/GEO 专家，从{specialty1}到{specialty2}无死角覆盖。客户满意度 98%，平均优化效果提升 {growth}%。',
  '新一代 AI 搜索优化师，专注于让你的内容被 ChatGPT、Perplexity、Google AI Overview 等 AI 引擎精准引用。擅长{specialty1}。',
  '{year}年一线 SEO 实战经验，{org}战略合作伙伴。精通{specialty1}，尤其擅长复杂业务场景的技术 SEO 实施。',
  '专注{specialty1}，{org}认证顾问。帮助 {clients}+ 网站获得 Rich Snippets 展现，平均 CTR 提升 40%。',
]

const reviewTemplates = [
  { rating: 5, content: '非常专业，结构化数据部署后Rich Snippets展现率提升了60%，CTR直接翻倍。', service: 'Schema.org部署' },
  { rating: 5, content: '响应很快，方案非常详细，问题定位精准。优化后一周内AI搜索引用就有明显提升。', service: 'GEO优化咨询' },
  { rating: 4, content: '分析到位，E-E-A-T 改进方案非常有帮助。', service: 'E-E-A-T审计' },
  { rating: 5, content: '帮我们从C-级别优化到了A-，三个月搜索流量增长200%。强烈推荐！', service: '全站SEO优化' },
  { rating: 5, content: '预算有限但效果超出预期，性价比很高。尤其是FAQ Schema的方案很巧妙。', service: 'FAQ Schema实施' },
  { rating: 5, content: '多语言SEO做得太好了，日本站流量3个月涨了5倍。', service: '国际SEO' },
  { rating: 4, content: 'AI内容策略落地很顺利，团队效率确实提升了不少。', service: 'AI内容策略' },
  { rating: 5, content: '电商结构化数据优化后商品在Google Shopping的曝光量明显增加。', service: '电商SEO' },
  { rating: 5, content: '技术过硬，给出的方案都是可落地的。付款后立即响应。', service: '技术SEO咨询' },
  { rating: 4, content: '合作愉快，方案细致，唯一遗憾是项目时间比预期长。', service: 'SEO项目' },
  { rating: 5, content: '真正懂 GEO 的少数专家之一，我们 AI 引擎引用率从 0 提升到 30%。', service: 'GEO优化' },
  { rating: 5, content: '专业负责，沟通顺畅，强烈推荐给有 GEO 需求的朋友。', service: 'GEO咨询' },
  { rating: 4, content: '整体效果不错，有些建议没完全落地但大方向正确。', service: '整站审计' },
  { rating: 5, content: 'Schema 部署后 Google Search Console 的曝光量翻了3倍！', service: 'Schema部署' },
  { rating: 5, content: '非常专业，给出了一份超详细的优化清单。', service: '深度审计' },
]

const responseTimeOptions = ['10分钟内', '30分钟内', '1小时内', '2小时内', '4小时内']
const priceUnits = ['次', '小时', '项目', '月']
const contactTypes = ['wechat', 'email', 'telegram']
const badges = ['verified', 'senior', 'new']

// Seeded RNG for reproducibility
let seed = 42
function random() {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}
function randInt(min: number, max: number) { return Math.floor(random() * (max - min + 1)) + min }
function pick<T>(arr: T[]): T { return arr[Math.floor(random() * arr.length)] }
function pickMany<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const result: T[] = []
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(random() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

function generateName(): string {
  if (random() < 0.2) return pick(englishNames)
  return pick(chineseSurnames) + pick(chineseFirstNames)
}

function generateBio(specialties: string[]): string {
  const template = pick(bioTemplates)
  return template
    .replace('{year}', String(randInt(3, 15)))
    .replace('{org}', pick(orgs))
    .replace('{clients}', String(randInt(50, 500)))
    .replace('{growth}', String(randInt(50, 300)))
    .replace('{specialty1}', specialties[0] || 'SEO')
    .replace('{specialty2}', specialties[1] || 'GEO')
    .replace('{specialty3}', specialties[2] || '结构化数据')
}

function generatePrice(): { min: number; max: number; unit: string } {
  const tier = random()
  if (tier < 0.2) return { min: randInt(500, 1500), max: randInt(1500, 3000), unit: pick(['次', '小时']) }
  if (tier < 0.6) return { min: randInt(1500, 3500), max: randInt(3500, 6500), unit: pick(['次', '项目']) }
  if (tier < 0.9) return { min: randInt(3000, 6000), max: randInt(6000, 12000), unit: pick(['次', '项目']) }
  return { min: randInt(5000, 10000), max: randInt(10000, 25000), unit: '项目' }
}

function generateContactValue(type: string): string {
  const suffix = randInt(1000, 9999)
  if (type === 'email') return `expert${suffix}@geoseo.expert`
  if (type === 'telegram') return `@geo_expert_${suffix}`
  return `geo_expert_${suffix}`
}

async function seed_() {
  console.log('Clearing existing experts...')
  await prisma.contactRequest.deleteMany({})
  await prisma.expertReview.deleteMany({})
  await prisma.expert.deleteMany({})

  console.log('Seeding 506 experts...')

  const EXPERT_COUNT = 506
  const expertData: Array<{
    name: string
    title: string
    bio: string
    specialties: string
    contactType: string
    contactValue: string
    priceMin: number
    priceMax: number
    priceUnit: string
    totalOrders: number
    completedOrders: number
    avgRating: number
    avgResponseTime: string
    badge: string
  }> = []

  for (let i = 0; i < EXPERT_COUNT; i++) {
    const name = generateName()
    const title = pick(titles)
    const specialtyCount = randInt(3, 6)
    const specialties = pickMany(specialtyPool, specialtyCount)
    const bio = generateBio(specialties)
    const contactType = pick(contactTypes)
    const contactValue = generateContactValue(contactType)
    const price = generatePrice()
    const totalOrders = randInt(5, 300)
    const completedOrders = Math.floor(totalOrders * (0.88 + random() * 0.1))
    const rating = Math.round((3.8 + random() * 1.2) * 10) / 10
    // Badge distribution: 20% verified, 40% senior, 40% new
    const badgeRand = random()
    const badge = badgeRand < 0.2 ? 'verified' : badgeRand < 0.6 ? 'senior' : 'new'

    expertData.push({
      name,
      title,
      bio,
      specialties: JSON.stringify(specialties),
      contactType,
      contactValue,
      priceMin: price.min,
      priceMax: price.max,
      priceUnit: price.unit,
      totalOrders,
      completedOrders,
      avgRating: rating,
      avgResponseTime: pick(responseTimeOptions),
      badge,
    })
  }

  // Batch insert
  const batchSize = 50
  for (let i = 0; i < expertData.length; i += batchSize) {
    const batch = expertData.slice(i, i + batchSize)
    await prisma.expert.createMany({ data: batch })
    process.stdout.write(`\r  Inserted ${Math.min(i + batchSize, expertData.length)}/${expertData.length}`)
  }
  console.log('')

  console.log('Seeding reviews for top experts...')
  const topExperts = await prisma.expert.findMany({
    orderBy: { avgRating: 'desc' },
    take: 100,
  })
  for (const expert of topExperts) {
    const count = randInt(2, 6)
    for (let i = 0; i < count; i++) {
      const template = pick(reviewTemplates)
      await prisma.expertReview.create({
        data: {
          expertId: expert.id,
          authorName: pick(chineseSurnames) + '先生',
          rating: template.rating,
          content: template.content,
          service: template.service,
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  const total = await prisma.expert.count()
  const reviewTotal = await prisma.expertReview.count()
  console.log(`\nDone! ${total} experts, ${reviewTotal} reviews.`)
}

seed_().catch(console.error).finally(() => process.exit())
