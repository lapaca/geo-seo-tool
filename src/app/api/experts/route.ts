import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

const PAGE_SIZE = 20
const ALLOWED_CONTACT_TYPES = ['wechat', 'email', 'phone', 'telegram'] as const

export async function GET(req: Request) {
  const url = new URL(req.url)
  const specialty = url.searchParams.get('specialty')
  const sort = url.searchParams.get('sort') || 'rating'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const skip = (page - 1) * PAGE_SIZE

  // Apply specialty filter at DB level using JSON string contains
  const where = {
    isActive: true,
    ...(specialty && specialty !== '全部' ? { specialties: { contains: specialty } } : {}),
  }

  const [experts, total] = await Promise.all([
    prisma.expert.findMany({
      where,
      include: { _count: { select: { reviews: true } } },
      orderBy: sort === 'orders' ? { completedOrders: 'desc' }
        : sort === 'price_low' ? { priceMin: 'asc' }
        : sort === 'price_high' ? { priceMax: 'desc' }
        : { avgRating: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.expert.count({ where }),
  ])

  const result = experts.map((e) => {
    let parsedSpecialties: string[] = []
    try { parsedSpecialties = JSON.parse(e.specialties) } catch { parsedSpecialties = [] }

    return {
      id: e.id,
      name: e.name,
      avatar: e.avatar,
      title: e.title,
      bio: e.bio,
      specialties: parsedSpecialties,
      priceMin: e.priceMin,
      priceMax: e.priceMax,
      priceUnit: e.priceUnit,
      totalOrders: e.totalOrders,
      completedOrders: e.completedOrders,
      avgRating: e.avgRating,
      avgResponseTime: e.avgResponseTime,
      badge: e.badge,
      isActive: e.isActive,
      reviewCount: e._count.reviews,
      createdAt: e.createdAt.toISOString(),
    }
  })

  return NextResponse.json({
    experts: result,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: '请求体格式错误' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const bio = typeof body.bio === 'string' ? body.bio.trim() : ''
  const specialtiesRaw = body.specialties
  const contactType = body.contactType as string
  const contactValue = typeof body.contactValue === 'string' ? body.contactValue.trim() : ''
  const priceMin = Number(body.priceMin)
  const priceMax = Number(body.priceMax) || priceMin
  const priceUnit = typeof body.priceUnit === 'string' ? body.priceUnit : '次'

  // Validate inputs
  if (!name || name.length > 50) {
    return NextResponse.json({ error: '姓名无效（最多50字）' }, { status: 400 })
  }
  if (!title || title.length > 100) {
    return NextResponse.json({ error: '头衔无效（最多100字）' }, { status: 400 })
  }
  if (!bio || bio.length > 500) {
    return NextResponse.json({ error: '简介无效（最多500字）' }, { status: 400 })
  }
  if (!Array.isArray(specialtiesRaw) || specialtiesRaw.length === 0 || specialtiesRaw.length > 10) {
    return NextResponse.json({ error: '请选择 1-10 个擅长领域' }, { status: 400 })
  }
  const specialties = specialtiesRaw.filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0 && s.length <= 30
  )
  if (specialties.length === 0) {
    return NextResponse.json({ error: '擅长领域格式错误' }, { status: 400 })
  }
  if (!ALLOWED_CONTACT_TYPES.includes(contactType as typeof ALLOWED_CONTACT_TYPES[number])) {
    return NextResponse.json({ error: '联系方式类型不支持' }, { status: 400 })
  }
  if (!contactValue || contactValue.length > 100) {
    return NextResponse.json({ error: '联系方式无效' }, { status: 400 })
  }
  if (!Number.isFinite(priceMin) || priceMin <= 0 || priceMin > 1000000) {
    return NextResponse.json({ error: '最低报价无效' }, { status: 400 })
  }
  if (!Number.isFinite(priceMax) || priceMax < priceMin || priceMax > 1000000) {
    return NextResponse.json({ error: '最高报价无效' }, { status: 400 })
  }

  const userId = (session.user as Record<string, string>).id

  const existing = await prisma.expert.findFirst({ where: { userId } })
  if (existing) {
    return NextResponse.json({ error: '您已入驻为专家' }, { status: 409 })
  }

  const expert = await prisma.expert.create({
    data: {
      userId,
      name,
      title,
      bio,
      specialties: JSON.stringify(specialties),
      contactType,
      contactValue,
      priceMin: Math.round(priceMin),
      priceMax: Math.round(priceMax),
      priceUnit,
      badge: 'new',
    },
  })

  return NextResponse.json({ id: expert.id, success: true })
}
