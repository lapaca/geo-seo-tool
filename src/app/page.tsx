'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, Zap, Shield, BarChart3 } from 'lucide-react'

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!session) {
      router.push('/login')
      return
    }

    if (!url.trim()) {
      setError('请输入网站地址')
      return
    }

    let finalUrl = url.trim()
    if (!finalUrl.startsWith('http')) {
      finalUrl = 'https://' + finalUrl
    }

    setLoading(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '分析失败')
        setLoading(false)
        return
      }

      // Redirect to report page (analysis runs in background)
      router.push(`/report/${data.reportId}`)
    } catch {
      setError('网络错误，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full bg-gradient-to-b from-blue-50 to-gray-50 px-4 pb-20 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            AI 驱动的
            <span className="text-blue-600"> GEO+SEO </span>
            优化工具
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            输入网址，自动分析 SEO 和 GEO 问题，AI 生成优化建议，对比预览后一键导出
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="输入网站地址，如 example.com"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    分析中
                  </span>
                ) : '开始分析'}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </form>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Search, title: 'SEO 分析', desc: '14 项规则自动检查' },
          { icon: Zap, title: 'GEO 分析', desc: 'AI 引擎可引用性评估' },
          { icon: BarChart3, title: '双评分', desc: 'SEO + GEO 综合评分' },
          { icon: Shield, title: '安全可控', desc: '对比预览，确认后导出' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
