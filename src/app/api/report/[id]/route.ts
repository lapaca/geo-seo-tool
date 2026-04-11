import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { id } = await params
  const userId = (session.user as Record<string, string>).id

  const report = await prisma.report.findFirst({
    where: { id, userId },
  })

  if (!report) {
    return NextResponse.json({ error: '报告不存在' }, { status: 404 })
  }

  return NextResponse.json({
    id: report.id,
    url: report.url,
    status: report.status,
    seoScore: report.seoScore,
    geoScore: report.geoScore,
    seoIssues: report.seoIssues ? JSON.parse(report.seoIssues) : [],
    geoIssues: report.geoIssues ? JSON.parse(report.geoIssues) : [],
    optimizations: report.optimizations ? JSON.parse(report.optimizations) : [],
    createdAt: report.createdAt.toISOString(),
  })
}
