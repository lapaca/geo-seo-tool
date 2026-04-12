import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { id: expertId } = await params
  const body = await req.json()
  const { userName, userContact, userContactType, message } = body

  if (!userName || !userContact || !userContactType) {
    return NextResponse.json({ error: '请填写姓名和联系方式' }, { status: 400 })
  }

  const expert = await prisma.expert.findUnique({ where: { id: expertId } })
  if (!expert) {
    return NextResponse.json({ error: '专家不存在' }, { status: 404 })
  }

  const userId = (session.user as Record<string, string>).id

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
