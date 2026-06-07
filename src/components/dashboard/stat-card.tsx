export function StatCard({
  label,
  value,
  hint
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface px-5 py-5 shadow-soft">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </div>
  )
}
