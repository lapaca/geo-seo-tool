'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Star, MessageCircle, Clock, Shield, Award, Sparkles, ChevronDown, ChevronLeft, ChevronRight, X, Send, CheckCircle } from 'lucide-react'
import type { Expert, ExpertReview, ExpertListResponse } from '@/types'

const SPECIALTIES = ['全部', 'GEO优化', '技术SEO', '结构化数据', 'E-E-A-T', 'AI搜索适配', '内容优化', '电商SEO', '国际SEO', 'AI内容']
const SORT_OPTIONS = [
  { value: 'rating', label: '综合评分' },
  { value: 'orders', label: '成交单数' },
  { value: 'price_low', label: '价格从低到高' },
  { value: 'price_high', label: '价格从高到低' },
]

function BadgeTag({ badge }: { badge: string }) {
  const map: Record<string, { label: string; color: string; icon: typeof Shield }> = {
    verified: { label: '官方认证', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Shield },
    senior: { label: '资深专家', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Award },
    new: { label: '新入驻', color: 'bg-green-100 text-green-700 border-green-200', icon: Sparkles },
  }
  const info = map[badge] || map.new
  const Icon = info.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${info.color}`}>
      <Icon className="h-3 w-3" />
      {info.label}
    </span>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
      <span className="ml-1 text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
    </span>
  )
}

function ReviewModal({ expert, onClose }: { expert: Expert; onClose: () => void }) {
  const [reviews, setReviews] = useState<ExpertReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/experts/${expert.id}/reviews`)
      .then((r) => r.json())
      .then((data) => { setReviews(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [expert.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
          <div>
            <h3 className="font-semibold text-gray-900">{expert.name} 的客户评价</h3>
            <p className="text-sm text-gray-500">{expert.completedOrders} 单完成 / 好评率 {((expert.avgRating / 5) * 100).toFixed(0)}%</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          {loading ? <p className="py-8 text-center text-gray-400">加载中...</p>
            : reviews.length === 0 ? <p className="py-8 text-center text-gray-400">暂无评价</p>
            : reviews.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{r.authorName[0]}</div>
                  <span className="text-sm font-medium text-gray-900">{r.authorName}</span>
                </div>
                <StarRating rating={r.rating} />
              </div>
              <p className="mt-2 text-sm text-gray-700">{r.content}</p>
              {r.service && <p className="mt-1 text-xs text-gray-400">服务项目: {r.service}</p>}
              <p className="mt-1 text-xs text-gray-300">{new Date(r.createdAt).toLocaleDateString('zh-CN')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContactModal({ expert, onClose }: { expert: Expert; onClose: () => void }) {
  const [form, setForm] = useState({ userName: '', userContact: '', userContactType: 'wechat', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.userName || !form.userContact) { setError('请填写姓名和联系方式'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/experts/${expert.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || '发送失败'); setLoading(false); return }
      setSuccess(true)
    } catch { setError('网络错误'); setLoading(false) }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">联系请求已发送</h3>
          <p className="mt-2 text-sm text-gray-500">你的联系方式已发送给 {expert.name}，专家会通过你留下的方式主动联系你。</p>
          <p className="mt-1 text-xs text-gray-400">预计响应时间：{expert.avgResponseTime}</p>
          <button onClick={onClose} className="mt-6 w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800">关闭</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="font-semibold text-gray-900">联系 {expert.name}</h3>
            <p className="text-xs text-gray-500">提交你的联系方式，专家会主动联系你</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">你的姓名 <span className="text-red-500">*</span></label>
            <input type="text" value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="你的姓名或公司名" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">联系方式 <span className="text-red-500">*</span></label>
            <div className="mt-1 flex gap-2">
              <select value={form.userContactType} onChange={(e) => setForm({ ...form, userContactType: e.target.value })}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="wechat">微信</option>
                <option value="email">邮箱</option>
                <option value="phone">手机</option>
                <option value="telegram">Telegram</option>
              </select>
              <input type="text" value={form.userContact} onChange={(e) => setForm({ ...form, userContact: e.target.value })}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="你的微信号/邮箱/手机/Telegram" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">需求描述（可选）</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="简单描述你的需求，方便专家提前了解..." />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            <Send className="h-4 w-4" />
            {loading ? '发送中...' : '发送联系请求'}
          </button>
          <p className="text-center text-xs text-gray-400">你的信息仅对该专家可见</p>
        </form>
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-1">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) => p === '...' ? (
        <span key={`e${i}`} className="px-2 text-gray-400">...</span>
      ) : (
        <button key={p} onClick={() => onPageChange(p as number)}
          className={`h-8 w-8 rounded-lg text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
        className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function ExpertsPage() {
  const { data: session } = useSession()
  const [experts, setExperts] = useState<Expert[]>([])
  const [loading, setLoading] = useState(true)
  const [specialty, setSpecialty] = useState('全部')
  const [sort, setSort] = useState('rating')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [reviewTarget, setReviewTarget] = useState<Expert | null>(null)
  const [contactTarget, setContactTarget] = useState<Expert | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (specialty !== '全部') params.set('specialty', specialty)
    params.set('sort', sort)
    params.set('page', String(page))
    fetch(`/api/experts?${params}`)
      .then((r) => r.json())
      .then((data: ExpertListResponse) => {
        setExperts(data.experts)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [specialty, sort, page])

  function handleSpecialtyChange(s: string) {
    setSpecialty(s)
    setPage(1)
  }

  function handleSortChange(s: string) {
    setSort(s)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GEO 人类专家</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} 位专家在线 — 找到最适合你的 GEO/SEO 优化专家
          </p>
        </div>
        <Link href="/experts/register"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-200 hover:shadow-xl transition">
          <Sparkles className="h-4 w-4" />
          入驻成为专家
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((s) => (
            <button key={s} onClick={() => handleSpecialtyChange(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${specialty === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="relative">
          <select value={sort} onChange={(e) => handleSortChange(e.target.value)}
            className="appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-xs text-gray-700">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Expert Cards */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">加载专家列表...</div>
      ) : experts.length === 0 ? (
        <div className="py-20 text-center text-gray-400">暂无匹配的专家</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {experts.map((expert) => (
              <div key={expert.id} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-lg hover:border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-bold text-white">
                    {expert.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{expert.name}</h3>
                      <BadgeTag badge={expert.badge} />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{expert.title}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <StarRating rating={expert.avgRating} />
                      <span className="text-xs text-gray-400">|</span>
                      <button onClick={() => setReviewTarget(expert)} className="text-xs text-blue-600 hover:underline">
                        {expert.completedOrders} 单完成 / {expert.reviewCount || 0} 条评价
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-orange-600">
                      {expert.priceMin === expert.priceMax ? `${expert.priceMin}` : `${expert.priceMin}-${expert.priceMax}`}
                    </p>
                    <p className="text-xs text-gray-400">元/{expert.priceUnit}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{expert.bio}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {expert.specialties.slice(0, 5).map((s) => (
                    <span key={s} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{s}</span>
                  ))}
                  {expert.specialties.length > 5 && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-400">+{expert.specialties.length - 5}</span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{expert.avgResponseTime}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />好评率 {((expert.avgRating / 5) * 100).toFixed(0)}%</span>
                  </div>
                  <button onClick={() => {
                    if (!session) { window.location.href = '/login'; return }
                    setContactTarget(expert)
                  }}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition">
                    联系专家
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {reviewTarget && <ReviewModal expert={reviewTarget} onClose={() => setReviewTarget(null)} />}
      {contactTarget && <ContactModal expert={contactTarget} onClose={() => setContactTarget(null)} />}
    </div>
  )
}
