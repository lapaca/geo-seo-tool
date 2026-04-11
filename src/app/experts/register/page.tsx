'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, X } from 'lucide-react'

const PRESET_SPECIALTIES = [
  'GEO优化', '技术SEO', '结构化数据', 'E-E-A-T', 'AI搜索适配',
  'Schema.org', 'Rich Snippets', '内容优化', '外链建设', '电商SEO',
  '国际SEO', 'hreflang', 'AI内容', 'Prompt Engineering', 'SSR优化',
  'Core Web Vitals', '移动端SEO', '本地SEO',
]

export default function ExpertRegisterPage() {
  const router = useRouter()
  const { status } = useSession()

  const [form, setForm] = useState({
    name: '',
    title: '',
    bio: '',
    specialties: [] as string[],
    contactType: 'wechat' as 'wechat' | 'email' | 'telegram',
    contactValue: '',
    priceMin: 1000,
    priceMax: 3000,
    priceUnit: '次',
  })
  const [customSpecialty, setCustomSpecialty] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  function toggleSpecialty(s: string) {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter((x) => x !== s)
        : [...f.specialties, s],
    }))
  }

  function addCustomSpecialty() {
    const s = customSpecialty.trim()
    if (s && !form.specialties.includes(s)) {
      setForm((f) => ({ ...f, specialties: [...f.specialties, s] }))
      setCustomSpecialty('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name || !form.title || !form.bio || form.specialties.length === 0 || !form.contactValue) {
      setError('请填写所有必填字段')
      return
    }

    if (form.priceMin > form.priceMax) {
      setError('最低报价不能高于最高报价')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/experts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '入驻失败')
        setLoading(false)
        return
      }

      router.push('/experts')
    } catch {
      setError('网络错误')
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="py-20 text-center text-gray-400">加载中...</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/experts" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        返回专家列表
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">入驻成为 GEO 专家</h1>
      <p className="mt-1 text-sm text-gray-500">填写你的专业信息，展示给需要帮助的站长</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* 姓名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            姓名 / 昵称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="如：张明远"
          />
        </div>

        {/* 头衔 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            头衔 / 职位 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="如：资深 GEO 优化顾问 / 前 Google SEO 工程师"
          />
        </div>

        {/* 简介 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            个人简介 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="介绍你的经验、服务领域、成功案例..."
          />
          <p className="mt-1 text-xs text-gray-400">建议 100-300 字，突出你的专业能力</p>
        </div>

        {/* 擅长领域 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            擅长领域 <span className="text-red-500">*</span>
          </label>
          <p className="mt-1 text-xs text-gray-400">选择你擅长的领域（可多选），或添加自定义标签</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {PRESET_SPECIALTIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialty(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  form.specialties.includes(s)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {form.specialties.filter((s) => !PRESET_SPECIALTIES.includes(s)).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {form.specialties.filter((s) => !PRESET_SPECIALTIES.includes(s)).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700">
                  {s}
                  <button type="button" onClick={() => toggleSpecialty(s)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customSpecialty}
              onChange={(e) => setCustomSpecialty(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSpecialty() } }}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="添加自定义标签"
            />
            <button
              type="button"
              onClick={addCustomSpecialty}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              添加
            </button>
          </div>
        </div>

        {/* 联系方式 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            联系方式 <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex gap-2">
            <select
              value={form.contactType}
              onChange={(e) => setForm({ ...form, contactType: e.target.value as 'wechat' | 'email' | 'telegram' })}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="wechat">微信</option>
              <option value="email">邮箱</option>
              <option value="telegram">Telegram</option>
            </select>
            <input
              type="text"
              value={form.contactValue}
              onChange={(e) => setForm({ ...form, contactValue: e.target.value })}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder={form.contactType === 'email' ? 'your@email.com' : '联系账号'}
            />
          </div>
        </div>

        {/* 报价 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            服务报价 <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            <div>
              <input
                type="number"
                value={form.priceMin}
                onChange={(e) => setForm({ ...form, priceMin: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="最低"
                min="0"
              />
              <p className="mt-0.5 text-xs text-gray-400">最低 (元)</p>
            </div>
            <div>
              <input
                type="number"
                value={form.priceMax}
                onChange={(e) => setForm({ ...form, priceMax: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="最高"
                min="0"
              />
              <p className="mt-0.5 text-xs text-gray-400">最高 (元)</p>
            </div>
            <div>
              <select
                value={form.priceUnit}
                onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="次">次</option>
                <option value="小时">小时</option>
                <option value="项目">项目</option>
                <option value="月">月</option>
              </select>
              <p className="mt-0.5 text-xs text-gray-400">单位</p>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-medium text-white shadow-lg shadow-blue-200 disabled:opacity-50 hover:shadow-xl transition"
        >
          {loading ? '提交中...' : '提交入驻申请'}
        </button>
      </form>
    </div>
  )
}
