export function AppShell({
  title,
  description,
  actions,
  children
}: {
  title: string
  brandColor?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <div className="sticky top-4 z-20">
        <div className="rounded-3xl border border-border bg-surface-glass px-4 py-4 shadow-soft backdrop-blur-xl sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[28px] font-semibold leading-[36px] tracking-tight text-foreground sm:text-[32px] sm:leading-[40px]">
                {title}
              </h1>
              <p className="mt-1 text-[15px] leading-6 text-muted">
                {description ?? "Gestisci il tuo menu con un flusso semplice e veloce."}
              </p>
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
        </div>
      </div>
      <div className="mt-6 pb-28 lg:pb-0">{children}</div>
    </>
  )
}
