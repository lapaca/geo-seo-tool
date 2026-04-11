import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const reviews = await prisma.expertReview.findMany({
    where: { expertId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(
    reviews.map((r) => ({
      id: r.id,
      expertId: r.expertId,
      authorName: r.authorName,
      rating: r.rating,
      content: r.content,
      service: r.service,
      createdAt: r.createdAt.toISOString(),
    }))
  )
}
