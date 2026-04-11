import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { Exporter } from '@/services/exporter'
import type { ExportFormat, Optimization } from '@/types'

const exporter = new Exporter()

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { reportId, format, optimizationIds } = await req.json()

  if (!reportId || !format || !optimizationIds?.length) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  const userId = (session.user as Record<string, string>).id
  const report = await prisma.report.findFirst({
    where: { id: reportId, userId },
  })

  if (!report || !report.optimizations) {
    return NextResponse.json({ error: '报告不存在' }, { status: 404 })
  }

  const optimizations: Optimization[] = JSON.parse(report.optimizations)
  const result = exporter.export(optimizations, optimizationIds, format as ExportFormat)

  return NextResponse.json(result)
}
