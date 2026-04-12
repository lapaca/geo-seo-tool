import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

const PAGE_SIZE = 20

export async function GET(req: Request) {
  const url = new URL(req.url)
  const specialty = url.searchParams.get('specialty')
  const sort = url.searchParams.get('sort') || 'rating'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const skip = (page - 1) * PAGE_SIZE

  const where = { isActive: true }

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

  const result = experts
    .map((e) => ({
      id: e.id,
      name: e.name,
      avatar: e.avatar,
      title: e.title,
      bio: e.bio,
      specialties: JSON.parse(e.specialties) as string[],
      // contactType and contactValue are NOT exposed to frontend
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
    }))
    .filter((e) => {
      if (!specialty) return true
      return e.specialties.some((s) => s.includes(specialty))
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

  const body = await req.json()
  const { name, title, bio, specialties, contactType, contactValue, priceMin, priceMax, priceUnit } = body

  if (!name || !title || !bio || !specialties?.length || !contactType || !contactValue || !priceMin) {
    return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
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
      priceMin,
      priceMax: priceMax || priceMin,
      priceUnit: priceUnit || '次',
      badge: 'new',
    },
  })

  return NextResponse.json({ id: expert.id, success: true })
}
