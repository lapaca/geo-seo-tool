'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Download } from 'lucide-react'
import { ScoreRing } from '@/components/ScoreRing'
import { IssueList } from '@/components/IssueList'
import { DiffPreview } from '@/components/DiffPreview'
import { ExportPanel } from '@/components/ExportPanel'
import { AdvancedDashboard } from '@/components/AdvancedDashboard'
import type { SeoIssue, GeoIssue, Optimization, ReportStatus, AdvancedMetrics } from '@/types'

interface ReportData {
  id: string
  url: string
  status: ReportStatus
  seoScore: number | null
  geoScore: number | null
  seoIssues: SeoIssue[]
  geoIssues: GeoIssue[]
  optimizations: Optimization[]
  advancedMetrics: AdvancedMetrics | null
  createdAt: string
}

type TabType = 'overview' | 'issues' | 'optimizations'

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { status: authStatus } = useSession()
  const router = useRouter()

  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/report/${id}`)
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
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

  useEffect(() => {
    if (authStatus === 'unauthenticated') { router.push('/login'); return }
    if (authStatus !== 'authenticated') return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      const status = await fetchReport()
      if (cancelled) return
      if (status && !['COMPLETED', 'FAILED'].includes(status)) {
        timer = setTimeout(poll, 2000)
      }
    }
    poll()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [authStatus, router, fetchReport])

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
          <p className="mt-3 text-sm text-gray-500">Loading Analysis Report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Link href="/" className="mt-3 inline-block text-blue-600 hover:underline">返回首页</Link>
        </div>
      </div>
    )
  }

  if (!report) return null

  const isProcessing = !['COMPLETED', 'FAILED'].includes(report.status)

  const statusMap: Record<string, { text: string; color: string }> = {
    PENDING: { text: 'Initializing Analysis Pipeline...', color: 'text-gray-500' },
    CRAWLING: { text: 'Crawling & Parsing DOM Tree...', color: 'text-yellow-600' },
    ANALYZING: { text: 'Running SEO/GEO Heuristic Engine...', color: 'text-blue-600' },
    OPTIMIZING: { text: 'Generating AI Optimization Matrix...', color: 'text-purple-600' },
    COMPLETED: { text: 'Analysis Complete', color: 'text-green-600' },
    FAILED: { text: 'Analysis Failed', color: 'text-red-600' },
  }
  const statusInfo = statusMap[report.status] || { text: report.status, color: 'text-gray-500' }

  const failCount = report.seoIssues.filter((i) => i.status !== 'pass').length +
    report.geoIssues.filter((i) => i.status !== 'pass').length

  const tabs: { key: TabType; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Advanced Analytics' },
    { key: 'issues', label: 'Diagnostic Report', badge: failCount },
    { key: 'optimizations', label: 'AI Recommendations', badge: report.optimizations.length },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 break-all">{report.url}</h1>
            <div className="mt-1 flex items-center gap-3">
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {isProcessing && <RefreshCw className="mr-1 inline h-3.5 w-3.5 animate-spin" />}
                {statusInfo.text}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(report.createdAt).toLocaleString('zh-CN')}
              </span>
              {report.advancedMetrics && (
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  Report ID: {report.id.slice(0, 8)}
                </span>
              )}
            </div>
          </div>
          {report.status === 'COMPLETED' && (
            <button
              onClick={() => setActiveTab('optimizations')}
              className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
            >
              <Download className="h-3.5 w-3.5" />
              导出优化内容
            </button>
          )}
        </div>
      </div>

      {/* Processing */}
      {isProcessing && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
          <svg className="mx-auto h-10 w-10 animate-spin text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-3 text-sm text-blue-700">{statusInfo.text}</p>
          <p className="mt-1 text-xs text-blue-500">Real-time analysis in progress. Page updates automatically.</p>
        </div>
      )}

      {/* Score Overview — always show when available */}
      {(report.seoScore !== null || report.geoScore !== null) && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-4">
            <ScoreRing label="SEO Score" score={report.seoScore} size={110} />
          </div>
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-4">
            <ScoreRing label="GEO Score" score={report.geoScore} size={110} />
          </div>
          {report.advancedMetrics && (
            <>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-400">Composite Grade</p>
                <p className="mt-1 text-4xl font-black text-gray-900">
                  {report.advancedMetrics.competitiveness.overallGrade}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {report.advancedMetrics.competitiveness.seoMaturityLevel} Level
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-400">Issues Detected</p>
                <p className="mt-1 text-4xl font-black text-red-600">{failCount}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {report.seoIssues.filter((i) => i.status === 'fail').length} critical,{' '}
                  {report.seoIssues.filter((i) => i.status === 'warning').length +
                    report.geoIssues.filter((i) => i.status === 'warning').length} warnings
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      {report.status === 'COMPLETED' && (
        <>
          <div className="mb-6 flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab — Advanced Dashboard */}
          {activeTab === 'overview' && report.advancedMetrics && (
            <AdvancedDashboard metrics={report.advancedMetrics} />
          )}

          {/* Issues Tab */}
          {activeTab === 'issues' && (
            <div className="space-y-8">
              <IssueList title="SEO Diagnostic Results" issues={report.seoIssues} />
              <IssueList title="GEO Diagnostic Results" issues={report.geoIssues} />
            </div>
          )}

          {/* Optimizations Tab */}
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

      {report.status === 'FAILED' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">Analysis pipeline failed</p>
          <Link href="/" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Retry Analysis
          </Link>
        </div>
      )}
    </div>
  )
}
