'use client'

import type { AdvancedMetrics } from '@/types'
import { SeoRadarChart } from '@/components/charts/SeoRadarChart'
import { KeywordDensityChart } from '@/components/charts/KeywordDensityChart'
import { EEATChart } from '@/components/charts/EEATChart'
import { LinkDepthChart } from '@/components/charts/LinkDepthChart'
import {
  Gauge, Zap, FileText, Link2, Code2, Brain,
  TrendingUp, Shield, Activity, Globe,
} from 'lucide-react'

function MetricCard({ icon: Icon, label, value, sublabel, color = 'blue' }: {
  icon: typeof Gauge
  label: string
  value: string | number
  sublabel?: string
  color?: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  }
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <div className={`rounded-md p-1.5 ${colorMap[color]}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-gray-400">{sublabel}</p>}
    </div>
  )
}

function GradeDisplay({ grade, maturity, difficulty }: {
  grade: string
  maturity: string
  difficulty: number
}) {
  const gradeColor: Record<string, string> = {
    'A+': 'text-green-600 bg-green-50 border-green-200',
    'A': 'text-green-600 bg-green-50 border-green-200',
    'A-': 'text-green-600 bg-green-50 border-green-200',
    'B+': 'text-blue-600 bg-blue-50 border-blue-200',
    'B': 'text-blue-600 bg-blue-50 border-blue-200',
    'B-': 'text-blue-600 bg-blue-50 border-blue-200',
    'C+': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    'C': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    'C-': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    'D+': 'text-orange-600 bg-orange-50 border-orange-200',
    'D': 'text-orange-600 bg-orange-50 border-orange-200',
    'D-': 'text-orange-600 bg-orange-50 border-orange-200',
    'F': 'text-red-600 bg-red-50 border-red-200',
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">Competitive Position Index (CPI)</h3>
      <p className="mb-4 text-xs text-gray-400">搜索竞争力定位指数</p>
      <div className="flex items-center gap-6">
        <div className={`flex h-20 w-20 items-center justify-center rounded-xl border-2 ${gradeColor[grade] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
          <span className="text-3xl font-black">{grade}</span>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-gray-400">SEO Maturity Level</span>
            <p className="text-sm font-semibold text-gray-900">{maturity}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">Optimization Difficulty Index</span>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 w-32 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                  style={{ width: `${difficulty}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">{difficulty}/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ label, value, max = 100, color = '#3b82f6' }: {
  label: string
  value: number
  max?: number
  color?: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 text-xs text-gray-500 truncate">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-gray-100">
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 text-right text-xs font-medium text-gray-700">{value}</span>
    </div>
  )
}

export function AdvancedDashboard({ metrics }: { metrics: AdvancedMetrics }) {
  const { performance, content, links, geoAdvanced, competitiveness, radarData } = metrics

  return (
    <div className="space-y-6">
      {/* Grade + Radar row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GradeDisplay
          grade={competitiveness.overallGrade}
          maturity={competitiveness.seoMaturityLevel}
          difficulty={competitiveness.estimatedDifficulty}
        />
        <SeoRadarChart data={radarData} />
      </div>

      {/* KPI Metric Cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Core Web Vitals & Performance Metrics</h3>
        <p className="mb-3 text-xs text-gray-400">核心网页指标 & 性能基准测量</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard icon={Zap} label="TTFB" value={`${performance.ttfb}ms`} sublabel="Time to First Byte" color="green" />
          <MetricCard icon={Activity} label="DOM Nodes" value={performance.domSize.toLocaleString()} sublabel="Document Object Model" color="blue" />
          <MetricCard icon={FileText} label="Payload" value={`${(performance.htmlSize / 1024).toFixed(1)}KB`} sublabel="Transfer Size" color="purple" />
          <MetricCard icon={Gauge} label="Load Time" value={`${(performance.loadTime / 1000).toFixed(2)}s`} sublabel="Full Page Load" color="orange" />
          <MetricCard icon={Code2} label="Content Ratio" value={`${(content.contentToCodeRatio * 100).toFixed(1)}%`} sublabel="Text/Code Ratio" color="cyan" />
          <MetricCard icon={Globe} label="Resources" value={performance.resourceCount} sublabel="HTTP Requests" color="red" />
        </div>
      </div>

      {/* Content Analysis */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Natural Language Processing Analysis</h3>
        <p className="mb-3 text-xs text-gray-400">自然语言处理深度分析 (Lexical & Semantic Profiling)</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard icon={FileText} label="Corpus Size" value={content.wordCount.toLocaleString()} sublabel="Total Word Count" color="blue" />
          <MetricCard icon={Brain} label="Readability" value={`${content.readabilityScore}/100`} sublabel="FK-CJK Readability Index" color="purple" />
          <MetricCard icon={TrendingUp} label="Lexical Diversity" value={`${(content.uniqueWordsRatio * 100).toFixed(1)}%`} sublabel="Type-Token Ratio (TTR)" color="green" />
          <MetricCard icon={FileText} label="Avg. Paragraph" value={`${content.avgParagraphLength} words`} sublabel="Mean Paragraph Length" color="orange" />
        </div>
      </div>

      {/* Keyword + E-E-A-T charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <KeywordDensityChart data={content.keywordDensity} />
        <EEATChart data={geoAdvanced.eeatSignals} />
      </div>

      {/* GEO Advanced */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Generative Engine Optimization Signals</h3>
        <p className="mb-3 text-xs text-gray-400">生成式引擎优化信号矩阵 (AI Crawlability & Citation Readiness)</p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <ProgressBar label="Entity Density (实体密度)" value={Math.round(geoAdvanced.entityDensity * 100)} color="#8b5cf6" />
            <ProgressBar label="Citation Index (引用指数)" value={Math.min(100, geoAdvanced.citationCount * 15)} color="#6366f1" />
            <ProgressBar label="Data Point Density (数据点密度)" value={Math.min(100, geoAdvanced.dataPointCount * 10)} color="#3b82f6" />
            <ProgressBar label="Topical Depth Score (主题深度)" value={geoAdvanced.topicalDepthScore} color="#0ea5e9" />
            <ProgressBar label="Multimodal Readiness (多模态就绪度)" value={geoAdvanced.multimodalReadiness} color="#14b8a6" />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-2 text-xs font-semibold text-gray-700">Content Freshness Detection</h4>
            <p className="mb-4 text-sm text-gray-600">
              {geoAdvanced.contentFreshness
                ? `检测到内容日期标记: ${geoAdvanced.contentFreshness}`
                : '未检测到明确的日期标记 — 建议添加 datePublished 结构化数据'}
            </p>
            <h4 className="mb-2 text-xs font-semibold text-gray-700">Raw Citation Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-gray-50 p-2">
                <span className="text-gray-400">Citations Found</span>
                <p className="text-lg font-bold text-gray-900">{geoAdvanced.citationCount}</p>
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="text-gray-400">Data Points</span>
                <p className="text-lg font-bold text-gray-900">{geoAdvanced.dataPointCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Link Equity & Internal Architecture</h3>
        <p className="mb-3 text-xs text-gray-400">链接权重 & 站内信息架构分析 (PageRank Flow Topology)</p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={Link2} label="Internal Links" value={links.internalCount} sublabel="站内链接" color="green" />
            <MetricCard icon={Link2} label="External Links" value={links.externalCount} sublabel="站外链接" color="blue" />
            <MetricCard icon={Shield} label="Anchor Diversity" value={`${(links.anchorTextDiversity * 100).toFixed(0)}%`} sublabel="锚文本多样性指数" color="purple" />
            <MetricCard icon={Link2} label="Nofollow Ratio" value={`${links.nofollowCount}`} sublabel="NoFollow 标记" color="orange" />
          </div>
          <LinkDepthChart data={links.linkDepthDistribution} />
        </div>
      </div>

      {/* Priority Actions */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-5">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">Priority Action Matrix (PAM)</h3>
        <p className="mb-3 text-xs text-gray-400">基于 Impact/Effort 矩阵的优先行动项排序</p>
        <ol className="space-y-2">
          {competitiveness.priorityActions.map((action, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700">{action}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
