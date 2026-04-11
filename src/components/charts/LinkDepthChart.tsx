'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function LinkDepthChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([depth, count]) => ({
    depth,
    count,
  }))

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold text-gray-900">
        Internal Link Depth Distribution
      </h3>
      <p className="mb-4 text-xs text-gray-400">站内链接拓扑深度分布 (Crawl Depth Topology)</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="depth" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="链接数" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
