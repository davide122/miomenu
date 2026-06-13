export default function DashboardLoading() {
  return (
    <div>
      <div className="rounded-3xl border border-border bg-surface-glass px-4 py-4 shadow-soft sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="mt-3 h-5 w-72 animate-pulse rounded-2xl bg-surface-muted" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-border bg-surface p-5 shadow-soft"
          >
            <div className="h-5 w-32 animate-pulse rounded-2xl bg-surface-muted" />
            <div className="mt-4 h-4 w-full animate-pulse rounded-2xl bg-surface-muted" />
            <div className="mt-2 h-4 w-4/5 animate-pulse rounded-2xl bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
