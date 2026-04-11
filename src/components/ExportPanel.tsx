'use client'

import { useState } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import type { Optimization, ExportFormat } from '@/types'

interface ExportPanelProps {
  reportId: string
  optimizations: Optimization[]
}

export function ExportPanel({ reportId, optimizations }: ExportPanelProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [exportResult, setExportResult] = useState<string | null>(null)

  const accepted = optimizations.filter((o) => o.accepted)

  async function handleExport(format: ExportFormat) {
    if (accepted.length === 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          format,
          optimizationIds: accepted.map((o) => o.id),
        }),
      })

      if (!res.ok) return

      const data = await res.json()
      setExportResult(data.content)

      // Trigger download
      const blob = new Blob([data.content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (accepted.length === 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          format: 'html',
          optimizationIds: accepted.map((o) => o.id),
        }),
      })

      if (!res.ok) return

      const data = await res.json()
      await navigator.clipboard.writeText(data.content)
      setCopied(true)
      setExportResult(data.content)
      setTimeout(() => setCopied(false), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">导出优化内容</h3>
      <p className="mt-1 text-xs text-gray-500">
        已选中 {accepted.length}/{optimizations.length} 项优化
      </p>

      {accepted.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">请先接受至少一项优化建议</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => handleExport('html')}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              导出 HTML
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              导出 JSON
            </button>
            <button
              onClick={() => handleExport('markdown')}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              导出 Markdown
            </button>
            <button
              onClick={handleCopy}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  复制到剪贴板
                </>
              )}
            </button>
          </div>

          {exportResult && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-gray-500">预览：</p>
              <pre className="max-h-48 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
                {exportResult}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  )
}
