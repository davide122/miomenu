import { AppShell } from "@/components/dashboard/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"
import { deletePromotionAction, upsertPromotionFormAction } from "@/lib/promotions/actions"

export default async function PromotionsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { business } = await requireDashboardContext()
  const sp = searchParams ? await searchParams : {}
  const error = typeof sp.error === "string" ? sp.error : ""
  const queryStartedAt = Date.now()

  const promotions = await prisma.promotion.findMany({
    where: { businessId: business.id },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      discountPercent: true,
      active: true
    },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    take: 20
  })

  // #region debug-point C:dashboard-promotions-query
  void fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "dashboard-tab-lag",
      runId: "post-fix",
      hypothesisId: "C",
      location: "src/app/dashboard/promotions/page.tsx",
      msg: "[DEBUG] dashboard promotions query done",
      data: {
        route: "/dashboard/promotions",
        durationMs: Date.now() - queryStartedAt,
        count: promotions.length
      },
      ts: Date.now()
    })
  }).catch(() => {})
  // #endregion

  return (
    <AppShell
      title="Promo"
      brandColor={business.primaryColor}
      description="Crea promo e coupon da mostrare nel menu pubblico."
    >
      <div className="grid gap-4 lg:grid-cols-[420px_1fr] lg:items-start">
        {error ? (
          <div className="lg:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Nuova promo</CardTitle>
            <CardDescription>
              Usa un codice breve (es. DOLCE10). Se attiva, compare nel menu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={upsertPromotionFormAction} className="grid gap-4">
              <input type="hidden" name="id" value="" />
              <div className="grid gap-2">
                <Label htmlFor="code">Codice</Label>
                <Input id="code" name="code" placeholder="DOLCE10" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Titolo</Label>
                <Input id="title" name="title" placeholder="Sconto dolci" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrizione</Label>
                <Input id="description" name="description" placeholder="Valido oggi dalle 16 alle 19" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discountPercent">Sconto %</Label>
                <Input id="discountPercent" name="discountPercent" placeholder="10" inputMode="numeric" />
                <p className="text-xs text-muted">Opzionale. Solo numero.</p>
              </div>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Attiva</p>
                  <p className="mt-0.5 text-xs text-muted">Mostra nel menu pubblico.</p>
                </div>
                <input type="checkbox" name="active" defaultChecked />
              </label>
              <Button type="submit">Crea promo</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Le tue promo</CardTitle>
            <CardDescription>Gestisci e disattiva in 1 click.</CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            {promotions.length ? (
              <div className="grid gap-3">
                {promotions.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-3xl border border-border bg-white px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          Codice: <span className="font-medium text-foreground">{p.code}</span>
                          {typeof p.discountPercent === "number" ? ` • -${p.discountPercent}%` : ""}
                          {p.active ? " • attiva" : " • disattiva"}
                        </p>
                        {p.description ? (
                          <p className="mt-2 text-sm text-muted">{p.description}</p>
                        ) : null}
                      </div>
                      <form action={deletePromotionAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Elimina
                        </Button>
                      </form>
                    </div>

                    <div className="mt-3">
                      <form action={upsertPromotionFormAction} className="grid gap-3 sm:grid-cols-2">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="code" value={p.code} />
                        <input type="hidden" name="title" value={p.title} />
                        <input type="hidden" name="description" value={p.description ?? ""} />
                        <input type="hidden" name="discountPercent" value={p.discountPercent ?? ""} />
                        <label className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
                          <span className="text-sm font-medium">Attiva</span>
                          <input type="checkbox" name="active" defaultChecked={p.active} />
                        </label>
                        <Button type="submit" variant="secondary">
                          Salva
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted">
                Nessuna promo. Creane una a sinistra.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
