import { AppShell } from "@/components/dashboard/app-shell"
import { requireDashboardContext } from "@/lib/auth/current"

export default async function SchedulesPage() {
  const { business } = await requireDashboardContext()

  return (
    <AppShell
      title="Programmazione"
      brandColor={business.primaryColor}
      description="Prepara fasce orarie e contenuti dinamici per menu e schermi."
    >
      <section className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Fasce orarie
        </h2>
        <p className="mt-2 text-sm text-muted">
          Predisposto: colazione, pranzo, aperitivo, cena, weekend ed eventi. In
          una prossima iterazione qui colleghi categorie e contenuti in base
          all’orario.
        </p>
      </section>
    </AppShell>
  )
}
