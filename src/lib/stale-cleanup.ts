import { prisma } from '@/lib/db'

const STALE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export async function cleanupStaleReports(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_TIMEOUT_MS)

  const result = await prisma.report.updateMany({
    where: {
      status: { in: ['CRAWLING', 'ANALYZING', 'OPTIMIZING'] },
      startedAt: { lt: cutoff },
    },
    data: {
      status: 'FAILED',
      errorMsg: '分析超时（超过5分钟未完成）',
    },
  })

  if (result.count > 0) {
    console.log(`[StaleCleanup] Marked ${result.count} stale reports as FAILED`)
  }

  return result.count
}
