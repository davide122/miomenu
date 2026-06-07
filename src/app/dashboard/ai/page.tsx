import { AppShell } from "@/components/dashboard/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireDashboardContext } from "@/lib/auth/current"
import { generateUpsellsForBusinessAction } from "@/lib/ai/product-ai-actions"

export default async function AiPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { business } = await requireDashboardContext()
  const sp = searchParams ? await searchParams : {}
  const done = typeof sp.done === "string" ? sp.done : ""

  return (
    <AppShell
      title="AI"
      brandColor={business.primaryColor}
      description="Traduzioni e upsell automatici (piano Gold)."
    >
      <div className="grid gap-4">
        {done === "upsell" ? (
          <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground">
            Upsell generati. Controlla il menu pubblico per vedere i suggerimenti.
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upsell smart</CardTitle>
              <CardDescription>
                Suggerisce abbinamenti per aumentare lo scontrino medio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={generateUpsellsForBusinessAction}>
                <Button type="submit">Genera upsell</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Traduzioni</CardTitle>
              <CardDescription>
                Usa la traduzione per singolo prodotto dalla pagina modifica prodotto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" disabled>
                Apri da prodotto
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

