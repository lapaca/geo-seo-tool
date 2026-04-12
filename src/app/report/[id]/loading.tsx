export default function ReportLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
        <div className="mt-3 h-6 w-96 rounded bg-gray-200 animate-pulse" />
        <div className="mt-2 h-4 w-48 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-lg border border-gray-200 bg-white animate-pulse" />
        ))}
      </div>
      <div className="mt-6 h-10 w-full rounded bg-gray-200 animate-pulse" />
      <div className="mt-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg border border-gray-200 bg-white animate-pulse" />
        ))}
      </div>
    </div>
  )
}
