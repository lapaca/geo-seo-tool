import { NextResponse } from 'next/server'
import { cleanupStaleReports } from '@/lib/stale-cleanup'

export async function GET(req: Request) {
  // Simple token check for cron protection
  const authHeader = req.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const count = await cleanupStaleReports()
  return NextResponse.json({ cleaned: count })
}
