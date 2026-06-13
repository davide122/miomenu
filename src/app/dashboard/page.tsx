import { AppShell } from "@/components/dashboard/app-shell"
import { StatCard } from "@/components/dashboard/stat-card"
import { ButtonLink } from "@/components/ui/button"
import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"

export default async function DashboardPage() {
  const { business } = await requireDashboardContext()
  const queryStartedAt = Date.now()

  const [products, categories, qrCodes, screens, recentScans] =
    await Promise.all([
      prisma.product.count({ where: { businessId: business.id } }),
      prisma.category.count({ where: { businessId: business.id } }),
      prisma.qrCode.count({ where: { businessId: business.id } }),
      prisma.screen.count({ where: { businessId: business.id } }),
      prisma.analyticsEvent.findMany({
        where: { businessId: business.id, type: "QR_SCAN" },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ])

  // #region debug-point C:dashboard-overview-query
  void fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "dashboard-tab-lag",
      runId: "post-fix",
      hypothesisId: "C",
      location: "src/app/dashboard/page.tsx",
      msg: "[DEBUG] dashboard overview query done",
      data: {
        route: "/dashboard",
        durationMs: Date.now() - queryStartedAt,
        products,
        categories,
        qrCodes,
        screens,
        recentScans: recentScans.length
      },
      ts: Date.now()
    })
  }).catch(() => {})
  // #endregion

  return (
    <AppShell
      title="Panoramica"
      brandColor={business.primaryColor}
      description="La tua base operativa. Un tap per aggiornare prodotti, QR e TV."
      actions={<ButtonLink href="/dashboard/products/new">Aggiungi prodotto</ButtonLink>}
    >
      {products === 0 ? (
        <section className="mb-6 rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Setup rapido</h2>
          <p className="mt-1 text-sm text-muted">
            Inizia dal primo prodotto: la categoria la puoi scrivere e viene gestita automaticamente.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/dashboard/products/new">Crea primo prodotto</ButtonLink>
            <ButtonLink href="/dashboard/menu" variant="secondary">
              Personalizza menu
            </ButtonLink>
            <ButtonLink href="/dashboard/qrcodes" variant="secondary">
              Genera QR
            </ButtonLink>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Prodotti" value={products} />
        <StatCard label="Categorie" value={categories} />
        <StatCard label="QR generati" value={qrCodes} />
        <StatCard label="Schermi" value={screens} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <section className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Scansioni recenti</h2>
              <p className="mt-1 text-sm text-muted">
                Ultimi eventi registrati dal QR generale.
              </p>
            </div>
            <ButtonLink href="/dashboard/analytics" variant="secondary" size="sm">
              Analytics
            </ButtonLink>
          </div>

          <div className="mt-4 grid gap-2">
            {recentScans.length ? (
              recentScans.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm transition-colors duration-200"
                >
                  <p className="font-medium text-foreground">QR scan</p>
                  <p className="text-muted">
                    {new Date(e.createdAt).toLocaleString("it-IT")}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-surface-muted px-4 py-4 text-sm text-muted">
                Nessuna scansione registrata.
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Continua da qui</h2>
          <p className="mt-1 text-sm text-muted">
            Anteprima, QR e TV Mode in un tap.
          </p>
          <div className="mt-4 grid gap-2">
            <ButtonLink href={`/menu/${business.slug}`} variant="secondary">
              Anteprima menu pubblico
            </ButtonLink>
            <ButtonLink href={`/screen/${business.slug}`} variant="secondary">
              Apri TV Mode
            </ButtonLink>
            <ButtonLink href="/dashboard/qrcodes" variant="secondary">
              Gestisci QR
            </ButtonLink>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}
