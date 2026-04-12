'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ReportError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h2 className="text-xl font-bold text-gray-900">报告加载失败</h2>
      <p className="mt-2 text-sm text-gray-500">{error.message || '抱歉，该报告无法加载'}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={() => reset()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          重试
        </button>
        <Link href="/dashboard" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          返回仪表盘
        </Link>
      </div>
    </div>
  )
}
