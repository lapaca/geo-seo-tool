import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const specialty = url.searchParams.get('specialty')
  const sort = url.searchParams.get('sort') || 'rating' // rating | orders | price_low | price_high

  const experts = await prisma.expert.findMany({
    where: { isActive: true },
    include: { _count: { select: { reviews: true } } },
    orderBy: sort === 'orders' ? { completedOrders: 'desc' }
      : sort === 'price_low' ? { priceMin: 'asc' }
      : sort === 'price_high' ? { priceMax: 'desc' }
      : { avgRating: 'desc' },
  })

  const result = experts
    .map((e) => ({
      id: e.id,
      name: e.name,
      avatar: e.avatar,
      title: e.title,
      bio: e.bio,
      specialties: JSON.parse(e.specialties) as string[],
      contactType: e.contactType,
      contactValue: e.contactValue,
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

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const { getServerSession } = await import('next-auth')
  const { authOptions } = await import('@/lib/auth-options')
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
