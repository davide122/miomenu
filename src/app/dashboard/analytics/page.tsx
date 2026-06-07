import { AppShell } from "@/components/dashboard/app-shell"
import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"

export default async function AnalyticsPage() {
  const { business } = await requireDashboardContext()

  const [qrScans, menuViews] = await Promise.all([
    prisma.analyticsEvent.count({ where: { businessId: business.id, type: "QR_SCAN" } }),
    prisma.analyticsEvent.count({ where: { businessId: business.id, type: "MENU_VIEW" } })
  ])

  return (
    <AppShell
      title="Analytics"
      brandColor={business.primaryColor}
      description="Metriche essenziali: scansioni QR e visite al menu."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface px-5 py-5 shadow-soft">
          <p className="text-sm font-medium text-muted">Scansioni QR</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {qrScans}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-surface px-5 py-5 shadow-soft">
          <p className="text-sm font-medium text-muted">Visite menu</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {menuViews}
          </p>
        </div>
      </div>
    </AppShell>
  )
}
