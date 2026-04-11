'use client'

import { useState } from 'react'
import { ChevronDown, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { SeoIssue, GeoIssue } from '@/types'

interface IssueListProps {
  title: string
  issues: (SeoIssue | GeoIssue)[]
}

export function IssueList({ title, issues }: IssueListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Sort: fail > warning > pass, within each group by severity
  const sortOrder = { fail: 0, warning: 1, pass: 2 }
  const severityOrder = { high: 0, medium: 1, low: 2 }

  const sorted = [...issues].sort((a, b) => {
    const statusDiff = sortOrder[a.status] - sortOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  function StatusIcon({ status }: { status: string }) {
    if (status === 'pass') return <CheckCircle2 className="h-5 w-5 text-green-500" />
    if (status === 'fail') return <XCircle className="h-5 w-5 text-red-500" />
    return <AlertCircle className="h-5 w-5 text-yellow-500" />
  }

  function severityBadge(severity: string) {
    const map: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-600',
    }
    const label: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低',
    }
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[severity]}`}>
        {label[severity]}
      </span>
    )
  }

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="space-y-2">
        {sorted.map((issue) => {
          const isExpanded = expandedId === issue.id
          return (
            <div
              key={issue.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50"
              >
                <StatusIcon status={issue.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{issue.name}</span>
                    {severityBadge(issue.severity)}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-gray-500">{issue.description}</p>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 text-sm">
                  {issue.currentValue && (
                    <div className="mb-3">
                      <p className="font-medium text-gray-700">当前值：</p>
                      <p className="mt-1 rounded bg-white p-2 text-gray-600 font-mono text-xs">
                        {issue.currentValue}
                      </p>
                    </div>
                  )}
                  {issue.recommendation && (
                    <div>
                      <p className="font-medium text-gray-700">建议：</p>
                      <p className="mt-1 text-gray-600">{issue.recommendation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
