import { AppShell } from "@/components/dashboard/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireDashboardContext } from "@/lib/auth/current"
import { openBillingPortalAction, startSubscriptionCheckoutAction } from "@/lib/billing/actions"

export default async function BillingPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { business } = await requireDashboardContext()
  const plan = business.plan

  const sp = searchParams ? await searchParams : {}
  const success = sp.success === "1"
  const canceled = sp.canceled === "1"
  const errorParam = sp.error
  const error = typeof errorParam === "string" ? errorParam : null

  return (
    <AppShell
      title="Abbonamento"
      brandColor={business.primaryColor}
      description="Gestisci piano e pagamenti ricorrenti."
      actions={
        business.stripeCustomerId ? (
          <form action={openBillingPortalAction}>
            <Button variant="secondary" size="sm" type="submit">
              Gestisci
            </Button>
          </form>
        ) : null
      }
    >
      <div className="grid gap-4">
        {success ? (
          <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground">
            Pagamento completato. L’abbonamento si aggiornerà a breve.
          </div>
        ) : null}
        {canceled ? (
          <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
            Checkout annullato.
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className={plan === "FREE" ? "border-border-medium" : ""}>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfetto per iniziare.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-foreground">0€</p>
              <p className="mt-1 text-sm text-muted">Fino a 5 prodotti, senza video.</p>
              <ul className="mt-5 grid gap-2 text-sm text-muted">
                <li>Menu pubblico</li>
                <li>QR Code</li>
                <li>Foto prodotti</li>
                <li>Dashboard</li>
              </ul>
              <div className="mt-6">
                <Button variant="secondary" className="w-full" disabled>
                  {plan === "FREE" ? "Attivo" : "Disponibile"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={plan === "PREMIUM" ? "border-border-medium" : ""}>
            <CardHeader>
              <CardTitle>Premium</CardTitle>
              <CardDescription>Tutto integrato.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-foreground">8€</p>
              <p className="mt-1 text-sm text-muted">al mese</p>
              <ul className="mt-5 grid gap-2 text-sm text-muted">
                <li>Prodotti illimitati</li>
                <li>Video prodotti</li>
                <li>Schermi / TV Mode</li>
                <li>Programmazione</li>
              </ul>
              <div className="mt-6">
                {plan === "PREMIUM" ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Attivo
                  </Button>
                ) : (
                  <form action={startSubscriptionCheckoutAction}>
                    <input type="hidden" name="plan" value="PREMIUM" />
                    <Button className="w-full" type="submit">
                      Passa a Premium
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={plan === "GOLD" ? "border-border-medium" : ""}>
            <CardHeader>
              <CardTitle>Gold</CardTitle>
              <CardDescription>Premium + AI.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-foreground">12€</p>
              <p className="mt-1 text-sm text-muted">al mese</p>
              <ul className="mt-5 grid gap-2 text-sm text-muted">
                <li>Tutto Premium</li>
                <li>AI integrata</li>
                <li>Supporto prioritario</li>
              </ul>
              <div className="mt-6">
                {plan === "GOLD" ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Attivo
                  </Button>
                ) : (
                  <form action={startSubscriptionCheckoutAction}>
                    <input type="hidden" name="plan" value="GOLD" />
                    <Button className="w-full" type="submit">
                      Passa a Gold
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
