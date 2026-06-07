import { AppShell } from "@/components/dashboard/app-shell"
import { requireDashboardContext } from "@/lib/auth/current"

export default async function MediaPage() {
  const { business } = await requireDashboardContext()

  return (
    <AppShell
      title="Media"
      brandColor={business.primaryColor}
      description="Gestisci asset e contenuti visuali: logo, cover, foto e video."
    >
      <section className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Libreria media
        </h2>
        <p className="mt-2 text-sm text-muted">
          Per ora i media vengono caricati direttamente nei form (logo, cover,
          foto e video dei prodotti). Nella prossima iterazione qui avrai una
          libreria con riuso, tag e pulizia duplicati.
        </p>
      </section>
    </AppShell>
  )
}
