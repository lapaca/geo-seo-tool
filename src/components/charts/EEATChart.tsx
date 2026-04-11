'use client'

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts'

interface EEATProps {
  experience: number
  expertise: number
  authoritativeness: number
  trustworthiness: number
}

export function EEATChart({ data }: { data: EEATProps }) {
  const chartData = [
    { axis: 'Experience\n(经验性)', value: data.experience },
    { axis: 'Expertise\n(专业性)', value: data.expertise },
    { axis: 'Authoritativeness\n(权威性)', value: data.authoritativeness },
    { axis: 'Trustworthiness\n(可信度)', value: data.trustworthiness },
  ]

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold text-gray-900">
        E-E-A-T Signal Analysis
      </h3>
      <p className="mb-2 text-xs text-gray-400">
        Google Quality Rater Guidelines 核心信号评估 (Experience-Expertise-Authoritativeness-Trustworthiness)
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#6b7280' }} />
          <Radar
            name="E-E-A-T"
            dataKey="value"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip formatter={(v) => [`${v}/100`, 'Score']} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
