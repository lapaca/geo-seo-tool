'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { ScoreRing } from '@/components/ScoreRing'
import { IssueList } from '@/components/IssueList'
import { DiffPreview } from '@/components/DiffPreview'
import { ExportPanel } from '@/components/ExportPanel'
import type { SeoIssue, GeoIssue, Optimization, ReportStatus } from '@/types'

interface ReportData {
  id: string
  url: string
  status: ReportStatus
  seoScore: number | null
  geoScore: number | null
  seoIssues: SeoIssue[]
  geoIssues: GeoIssue[]
  optimizations: Optimization[]
  createdAt: string
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { status: authStatus } = useSession()
  const router = useRouter()

  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'issues' | 'optimizations'>('issues')

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/report/${id}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        setError('报告不存在')
        setLoading(false)
        return
      }
      const data = await res.json()
      setReport(data)
      setLoading(false)
      return data.status as string
    } catch {
      setError('加载失败')
      setLoading(false)
      return 'FAILED'
    }
  }, [id, router])

  // Initial load + polling for in-progress reports
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (authStatus !== 'authenticated') return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      const status = await fetchReport()
      if (cancelled) return

      // Keep polling if analysis is still running
      if (status && !['COMPLETED', 'FAILED'].includes(status)) {
        timer = setTimeout(poll, 2000)
      }
    }

    poll()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [authStatus, router, fetchReport])

  // Handle optimization updates from DiffPreview
  function handleOptimizationUpdate(optId: string, update: Partial<Optimization>) {
    if (!report) return
    setReport({
      ...report,
      optimizations: report.optimizations.map((o) =>
        o.id === optId ? { ...o, ...update } : o
      ),
    })
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">加载报告中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Link href="/" className="mt-3 inline-block text-blue-600 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  if (!report) return null

  const isProcessing = !['COMPLETED', 'FAILED'].includes(report.status)

  function getStatusLabel(s: string) {
    const map: Record<string, { text: string; color: string }> = {
      PENDING: { text: '等待中...', color: 'text-gray-500' },
      CRAWLING: { text: '正在抓取网页...', color: 'text-yellow-600' },
      ANALYZING: { text: '正在分析 SEO/GEO...', color: 'text-blue-600' },
      OPTIMIZING: { text: '正在生成 AI 优化建议...', color: 'text-purple-600' },
      COMPLETED: { text: '分析完成', color: 'text-green-600' },
      FAILED: { text: '分析失败', color: 'text-red-600' },
    }
    return map[s] || { text: s, color: 'text-gray-500' }
  }

  const statusInfo = getStatusLabel(report.status)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/dashboard" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <h1 className="mt-1 text-xl font-bold text-gray-900 break-all">{report.url}</h1>
          <div className="mt-1 flex items-center gap-3">
            <span className={`text-sm font-medium ${statusInfo.color}`}>
              {isProcessing && (
                <RefreshCw className="mr-1 inline h-3.5 w-3.5 animate-spin" />
              )}
              {statusInfo.text}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(report.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
          <svg className="mx-auto h-10 w-10 animate-spin text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-3 text-sm text-blue-700">{statusInfo.text}</p>
          <p className="mt-1 text-xs text-blue-500">请稍候，页面会自动更新</p>
        </div>
      )}

      {/* Score Overview */}
      {(report.seoScore !== null || report.geoScore !== null) && (
        <div className="mb-6 flex justify-center gap-12 rounded-lg border border-gray-200 bg-white p-6">
          <ScoreRing label="SEO 评分" score={report.seoScore} />
          <ScoreRing label="GEO 评分" score={report.geoScore} />
        </div>
      )}

      {/* Tabs */}
      {report.status === 'COMPLETED' && (
        <>
          <div className="mb-4 flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'issues'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              问题清单
              <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                {report.seoIssues.filter((i) => i.status !== 'pass').length +
                  report.geoIssues.filter((i) => i.status !== 'pass').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('optimizations')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'optimizations'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              优化建议
              <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                {report.optimizations.length}
              </span>
            </button>
          </div>

          {activeTab === 'issues' && (
            <div className="space-y-8">
              <IssueList title="SEO 检查结果" issues={report.seoIssues} />
              <IssueList title="GEO 检查结果" issues={report.geoIssues} />
            </div>
          )}

          {activeTab === 'optimizations' && (
            <div className="space-y-6">
              <DiffPreview
                optimizations={report.optimizations}
                onUpdate={handleOptimizationUpdate}
              />
              <ExportPanel
                reportId={report.id}
                optimizations={report.optimizations}
              />
            </div>
          )}
        </>
      )}

      {/* Failed state */}
      {report.status === 'FAILED' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">分析失败</p>
          <Link href="/" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            重新分析
          </Link>
        </div>
      )}
    </div>
  )
}
