'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Star, MessageCircle, Clock, Shield, Award, Sparkles, ChevronDown, X } from 'lucide-react'
import type { Expert, ExpertReview } from '@/types'

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
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
        />
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
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {loading ? (
            <p className="py-8 text-center text-gray-400">加载中...</p>
          ) : reviews.length === 0 ? (
            <p className="py-8 text-center text-gray-400">暂无评价</p>
          ) : reviews.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                    {r.authorName[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{r.authorName}</span>
                </div>
                <StarRating rating={r.rating} />
              </div>
              <p className="mt-2 text-sm text-gray-700">{r.content}</p>
              {r.service && (
                <p className="mt-1 text-xs text-gray-400">服务项目: {r.service}</p>
              )}
              <p className="mt-1 text-xs text-gray-300">
                {new Date(r.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContactModal({ expert, onClose }: { expert: Expert; onClose: () => void }) {
  const typeLabel: Record<string, string> = {
    wechat: '微信',
    email: '邮箱',
    telegram: 'Telegram',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
            {expert.name[0]}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-gray-900">{expert.name}</h3>
          <p className="text-sm text-gray-500">{expert.title}</p>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-xs text-gray-400">{typeLabel[expert.contactType] || expert.contactType}</p>
          <p className="mt-1 text-lg font-mono font-semibold text-gray-900 select-all">{expert.contactValue}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs">
          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-gray-400">报价范围</p>
            <p className="font-semibold text-gray-900">
              {expert.priceMin === expert.priceMax
                ? `${expert.priceMin}元/${expert.priceUnit}`
                : `${expert.priceMin}-${expert.priceMax}元/${expert.priceUnit}`}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-gray-400">平均响应</p>
            <p className="font-semibold text-gray-900">{expert.avgResponseTime}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          关闭
        </button>
      </div>
    </div>
  )
}

export default function ExpertsPage() {
  const { data: session } = useSession()
  const [experts, setExperts] = useState<Expert[]>([])
  const [loading, setLoading] = useState(true)
  const [specialty, setSpecialty] = useState('全部')
  const [sort, setSort] = useState('rating')
  const [reviewTarget, setReviewTarget] = useState<Expert | null>(null)
  const [contactTarget, setContactTarget] = useState<Expert | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (specialty !== '全部') params.set('specialty', specialty)
    params.set('sort', sort)
    fetch(`/api/experts?${params}`)
      .then((r) => r.json())
      .then((data) => { setExperts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [specialty, sort])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GEO 人类专家</h1>
          <p className="mt-1 text-sm text-gray-500">
            找到最适合你的 GEO/SEO 优化专家，一对一解决问题
          </p>
        </div>
        <Link
          href="/experts/register"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-200 hover:shadow-xl transition"
        >
          <Sparkles className="h-4 w-4" />
          入驻成为专家
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialty(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                specialty === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-xs text-gray-700"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {experts.map((expert) => (
            <div
              key={expert.id}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-lg hover:border-blue-200"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-bold text-white">
                  {expert.name[0]}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Name + Badge */}
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">{expert.name}</h3>
                    <BadgeTag badge={expert.badge} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{expert.title}</p>

                  {/* Rating */}
                  <div className="mt-2 flex items-center gap-3">
                    <StarRating rating={expert.avgRating} />
                    <span className="text-xs text-gray-400">|</span>
                    <button
                      onClick={() => setReviewTarget(expert)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {expert.completedOrders} 单完成 / {expert.reviewCount || 0} 条评价
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-orange-600">
                    {expert.priceMin === expert.priceMax
                      ? `${expert.priceMin}`
                      : `${expert.priceMin}-${expert.priceMax}`}
                  </p>
                  <p className="text-xs text-gray-400">元/{expert.priceUnit}</p>
                </div>
              </div>

              {/* Bio */}
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">{expert.bio}</p>

              {/* Specialties */}
              <div className="mt-3 flex flex-wrap gap-1">
                {expert.specialties.slice(0, 5).map((s) => (
                  <span key={s} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {s}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {expert.avgResponseTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    好评率 {((expert.avgRating / 5) * 100).toFixed(0)}%
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!session) {
                      window.location.href = '/login'
                      return
                    }
                    setContactTarget(expert)
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition"
                >
                  联系专家
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {reviewTarget && <ReviewModal expert={reviewTarget} onClose={() => setReviewTarget(null)} />}
      {contactTarget && <ContactModal expert={contactTarget} onClose={() => setContactTarget(null)} />}
    </div>
  )
}
