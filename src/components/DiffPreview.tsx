'use client'

import { useState } from 'react'
import { Check, X, Edit3 } from 'lucide-react'
import type { Optimization } from '@/types'

interface DiffPreviewProps {
  optimizations: Optimization[]
  onUpdate: (id: string, update: Partial<Optimization>) => void
}

export function DiffPreview({ optimizations, onUpdate }: DiffPreviewProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  function handleAccept(opt: Optimization) {
    onUpdate(opt.id, {
      accepted: true,
      selectedIndex: opt.selectedIndex ?? 0,
    })
  }

  function handleReject(opt: Optimization) {
    onUpdate(opt.id, { accepted: false })
  }

  function handleSelectSuggestion(opt: Optimization, index: number) {
    onUpdate(opt.id, { selectedIndex: index, userEdited: null, accepted: true })
  }

  function startEdit(opt: Optimization) {
    const current = opt.userEdited
      ?? (opt.selectedIndex !== null ? opt.suggestions[opt.selectedIndex] : opt.suggestions[0])
      ?? ''
    setEditValue(current)
    setEditingId(opt.id)
  }

  function saveEdit(opt: Optimization) {
    onUpdate(opt.id, { userEdited: editValue, accepted: true })
    setEditingId(null)
  }

  if (optimizations.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        暂无优化建议
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {optimizations.map((opt) => (
        <div
          key={opt.id}
          className={`rounded-lg border bg-white ${
            opt.accepted ? 'border-green-200' : 'border-gray-200'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {opt.type}
              </span>
              <span className="font-medium text-gray-900">{opt.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAccept(opt)}
                className={`rounded p-1.5 ${
                  opt.accepted
                    ? 'bg-green-100 text-green-600'
                    : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                }`}
                title="接受"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleReject(opt)}
                className={`rounded p-1.5 ${
                  !opt.accepted && opt.selectedIndex !== null
                    ? 'bg-red-100 text-red-600'
                    : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                }`}
                title="拒绝"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={() => startEdit(opt)}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="自定义编辑"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content: Original vs Suggestions */}
          <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {/* Original */}
            <div className="p-4">
              <p className="mb-2 text-xs font-medium uppercase text-gray-400">原始内容</p>
              <div className="rounded bg-gray-50 p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap">
                {opt.original || '（无）'}
              </div>
            </div>

            {/* Suggestions */}
            <div className="p-4">
              <p className="mb-2 text-xs font-medium uppercase text-gray-400">优化建议</p>

              {editingId === opt.id ? (
                <div>
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={4}
                    className="w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => saveEdit(opt)}
                      className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : opt.userEdited ? (
                <div className="rounded bg-green-50 p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap ring-1 ring-green-200">
                  {opt.userEdited}
                  <p className="mt-1 text-xs text-green-600">（已自定义编辑）</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {opt.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(opt, i)}
                      className={`block w-full rounded p-3 text-left text-sm font-mono whitespace-pre-wrap transition ${
                        opt.selectedIndex === i
                          ? 'bg-blue-50 ring-2 ring-blue-300'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xs text-gray-400">方案 {i + 1}：</span>
                      <br />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
