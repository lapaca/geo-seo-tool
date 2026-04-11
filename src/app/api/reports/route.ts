import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const userId = (session.user as Record<string, string>).id

  const reports = await prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      url: true,
      status: true,
      seoScore: true,
      geoScore: true,
      createdAt: true,
    },
  })

  return NextResponse.json(
    reports.map((r: typeof reports[number]) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  )
}
