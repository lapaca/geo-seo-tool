'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

interface KeywordData {
  keyword: string
  density: number
}

export function KeywordDensityChart({ data }: { data: Record<string, number> }) {
  const chartData: KeywordData[] = Object.entries(data)
    .slice(0, 10)
    .map(([keyword, density]) => ({ keyword, density }))

  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#eab308']

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold text-gray-900">
        TF-IDF Keyword Density Distribution
      </h3>
      <p className="mb-4 text-xs text-gray-400">关键词词频逆文档频率密度分析 (Top 10 N-gram Extraction)</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
          <YAxis type="category" dataKey="keyword" tick={{ fontSize: 11 }} width={80} />
          <Tooltip formatter={(v) => [`${v}%`, '密度']} contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="density" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
