'use client'

interface ScoreRingProps {
  label: string
  score: number | null
  size?: number
}

export function ScoreRing({ label, score, size = 120 }: ScoreRingProps) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const progress = score !== null ? (score / 100) * circumference : 0

  function getColor(s: number | null) {
    if (s === null) return '#d1d5db'
    if (s >= 80) return '#16a34a'
    if (s >= 60) return '#ca8a04'
    if (s >= 40) return '#ea580c'
    return '#dc2626'
  }

  const color = getColor(score)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="relative -mt-[calc(50%+16px)] flex flex-col items-center justify-center" style={{ height: size }}>
        <span className="text-3xl font-bold" style={{ color }}>
          {score !== null ? score : '-'}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-gray-600">{label}</p>
    </div>
  )
}
