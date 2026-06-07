export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[248px_1fr] lg:items-start">
          <div className="sticky top-6 hidden h-[calc(100vh-3rem)] lg:block">
            <div className="h-full rounded-3xl border border-border bg-surface-glass p-2 shadow-soft backdrop-blur-xl">
              <div className="h-12 rounded-2xl border border-border bg-surface" />
              <div className="mt-2 grid gap-1">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div key={idx} className="h-12 rounded-2xl bg-surface/70" />
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="sticky top-4 z-20 -mx-4 sm:-mx-6">
              <div className="mx-4 rounded-3xl border border-border bg-surface-glass px-4 py-4 shadow-soft backdrop-blur-xl sm:mx-6 sm:px-6">
                <div className="grid gap-2">
                  <div className="h-8 w-44 rounded-2xl bg-surface" />
                  <div className="h-5 w-72 rounded-2xl bg-surface/70" />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 pb-28 lg:pb-0">
              <div className="h-36 rounded-3xl border border-border bg-surface shadow-soft" />
              <div className="h-72 rounded-3xl border border-border bg-surface shadow-soft" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

