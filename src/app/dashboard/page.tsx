'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ReportListItem } from '@/types'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/reports')
        .then((res) => res.json())
        .then((data) => {
          setReports(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  function getStatusLabel(s: string) {
    const map: Record<string, { text: string; color: string }> = {
      PENDING: { text: '等待中', color: 'bg-gray-100 text-gray-600' },
      CRAWLING: { text: '抓取中', color: 'bg-yellow-100 text-yellow-700' },
      ANALYZING: { text: '分析中', color: 'bg-blue-100 text-blue-700' },
      OPTIMIZING: { text: '优化中', color: 'bg-purple-100 text-purple-700' },
      COMPLETED: { text: '已完成', color: 'bg-green-100 text-green-700' },
      FAILED: { text: '失败', color: 'bg-red-100 text-red-700' },
    }
    return map[s] || { text: s, color: 'bg-gray-100 text-gray-600' }
  }

  function getScoreColor(score: number | null) {
    if (score === null) return 'text-gray-400'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">历史分析记录</h1>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新建分析
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500">暂无分析记录</p>
          <Link href="/" className="mt-2 inline-block text-blue-600 hover:underline">
            开始第一次分析
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reports.map((r) => {
            const status = getStatusLabel(r.status)
            return (
              <Link
                key={r.id}
                href={`/report/${r.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{r.url}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">SEO</p>
                    <p className={`text-lg font-bold ${getScoreColor(r.seoScore)}`}>
                      {r.seoScore ?? '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">GEO</p>
                    <p className={`text-lg font-bold ${getScoreColor(r.geoScore)}`}>
                      {r.geoScore ?? '-'}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                    {status.text}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
