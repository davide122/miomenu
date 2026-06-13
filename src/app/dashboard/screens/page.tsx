import { AppShell } from "@/components/dashboard/app-shell"
import { Badge } from "@/components/ui/badge"
import { ButtonLink } from "@/components/ui/button"
import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"

export default async function ScreensPage() {
  const { business } = await requireDashboardContext()

  const screens = await prisma.screen.findMany({
    where: { businessId: business.id },
    select: {
      id: true,
      name: true,
      layout: true,
      status: true
    },
    orderBy: { createdAt: "asc" }
  })

  return (
    <AppShell
      title="Schermi"
      brandColor={business.primaryColor}
      description="TV Mode e digital signage: controlla layout e stato online/offline."
      actions={
        <ButtonLink href={`/screen/${business.slug}`} variant="secondary">
          Apri TV Mode
        </ButtonLink>
      }
    >
      <section className="rounded-3xl border border-border bg-surface p-2 shadow-soft sm:p-3">
        {screens.length ? (
          <div className="grid gap-2">
            {screens.map((s) => (
              <div
                key={s.id}
                className="flex flex-col justify-between gap-3 rounded-3xl border border-border bg-surface px-4 py-4 transition-colors duration-200 hover:bg-surface-muted sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {s.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="muted">{s.layout}</Badge>
                    <Badge variant={s.status === "ONLINE" ? "brand" : "default"}>
                      {s.status}
                    </Badge>
                  </div>
                </div>

                <ButtonLink href={`/screen/${business.slug}`} variant="secondary" size="sm">
                  Anteprima
                </ButtonLink>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted">
            Nessuno schermo configurato.
          </div>
        )}
      </section>
    </AppShell>
  )
}
