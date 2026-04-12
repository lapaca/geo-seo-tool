import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

const ALLOWED_CONTACT_TYPES = ['wechat', 'email', 'phone', 'telegram'] as const

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { id: expertId } = await params

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: '请求体格式错误' }, { status: 400 })
  }

  const userName = typeof body.userName === 'string' ? body.userName.trim() : ''
  const userContact = typeof body.userContact === 'string' ? body.userContact.trim() : ''
  const userContactType = body.userContactType as string
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!userName || userName.length > 50) {
    return NextResponse.json({ error: '姓名无效' }, { status: 400 })
  }
  if (!userContact || userContact.length > 100) {
    return NextResponse.json({ error: '联系方式无效' }, { status: 400 })
  }
  if (!ALLOWED_CONTACT_TYPES.includes(userContactType as typeof ALLOWED_CONTACT_TYPES[number])) {
    return NextResponse.json({ error: '联系方式类型不支持' }, { status: 400 })
  }
  if (message.length > 1000) {
    return NextResponse.json({ error: '需求描述过长' }, { status: 400 })
  }

  const expert = await prisma.expert.findUnique({ where: { id: expertId } })
  if (!expert) {
    return NextResponse.json({ error: '专家不存在' }, { status: 404 })
  }

  const userId = (session.user as Record<string, string>).id

  // Rate limit: prevent duplicate within 24h to same expert
  const recent = await prisma.contactRequest.findFirst({
    where: {
      userId,
      expertId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  })
  if (recent) {
    return NextResponse.json({ error: '24小时内已联系过该专家，请耐心等待' }, { status: 429 })
  }

  // Global daily limit: max 10 contact requests per user per day
  const dailyCount = await prisma.contactRequest.count({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  })
  if (dailyCount >= 10) {
    return NextResponse.json({ error: '今日联系请求已达上限（10次/日）' }, { status: 429 })
  }

  await prisma.contactRequest.create({
    data: {
      expertId,
      userId,
      userName,
      userContact,
      userContactType,
      message: message || null,
    },
  })

  return NextResponse.json({ success: true })
}
