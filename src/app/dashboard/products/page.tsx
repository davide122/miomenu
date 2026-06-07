import Image from "next/image"

import { AppShell } from "@/components/dashboard/app-shell"
import { Badge } from "@/components/ui/badge"
import { ButtonLink, Button } from "@/components/ui/button"
import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"
import {
  deleteProductAction,
  moveProductAction,
  toggleProductAvailabilityAction,
  toggleProductFlagAction
} from "@/lib/menu/product-actions"

export default async function ProductsPage() {
  const { business } = await requireDashboardContext()

  const products = await prisma.product.findMany({
    where: { businessId: business.id },
    include: {
      category: true,
      media: { where: { type: "IMAGE" }, orderBy: { sortOrder: "asc" }, take: 1 }
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  })

  return (
    <AppShell
      title="Prodotti"
      brandColor={business.primaryColor}
      description="Aggiungi e aggiorna prodotti in pochi secondi. Foto e video rendono il menu più appetitoso."
      actions={<ButtonLink href="/dashboard/products/new">Nuovo prodotto</ButtonLink>}
    >
      <section className="rounded-3xl border border-border bg-surface p-2 shadow-soft sm:p-3">
        {products.length ? (
          <div className="grid gap-2">
            {products.map((p) => {
              const media = p.media[0]
              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-3xl border border-border bg-surface px-4 py-4 transition-colors duration-200 hover:bg-surface-muted sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-14 w-14 flex-none overflow-hidden rounded-2xl border border-border bg-background">
                      {media?.type === "IMAGE" ? (
                        <Image
                          src={media.url}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="h-full w-full bg-[color:var(--accent)]/10" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {p.name}
                        </p>
                        {!p.isAvailable ? (
                          <Badge variant="danger">Non disponibile</Badge>
                        ) : null}
                        {p.isFeatured ? (
                          <Badge variant="brand">In evidenza</Badge>
                        ) : null}
                        {p.isNew ? <Badge variant="muted">Novità</Badge> : null}
                        {p.isPromo ? <Badge variant="default">Promo</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {p.category.name}
                        {p.price ? ` • € ${p.price.toString()}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <form action={toggleProductAvailabilityAction}>
                      <input type="hidden" name="productId" value={p.id} />
                      <Button type="submit" variant="secondary" size="sm">
                        {p.isAvailable ? "Disattiva" : "Attiva"}
                      </Button>
                    </form>

                    <ButtonLink
                      href={`/dashboard/products/${p.id}/edit`}
                      variant="secondary"
                      size="sm"
                    >
                      Modifica
                    </ButtonLink>

                    <details className="relative">
                      <summary className="list-none">
                        <span className="inline-flex h-10 select-none items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-muted">
                          Azioni
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 text-muted"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M8.5 10.5 12 14l3.5-3.5"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </summary>

                      <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-56 overflow-hidden rounded-3xl border border-border bg-surface shadow-float">
                        <div className="grid gap-2 p-2">
                          <form action={moveProductAction}>
                            <input type="hidden" name="productId" value={p.id} />
                            <input type="hidden" name="direction" value="UP" />
                            <Button type="submit" variant="secondary" size="sm" className="w-full">
                              Sposta su
                            </Button>
                          </form>
                          <form action={moveProductAction}>
                            <input type="hidden" name="productId" value={p.id} />
                            <input type="hidden" name="direction" value="DOWN" />
                            <Button type="submit" variant="secondary" size="sm" className="w-full">
                              Sposta giù
                            </Button>
                          </form>
                          <div className="h-px bg-border" />
                          <form action={toggleProductFlagAction}>
                            <input type="hidden" name="productId" value={p.id} />
                            <input type="hidden" name="flag" value="FEATURED" />
                            <Button
                              type="submit"
                              variant={p.isFeatured ? "primary" : "secondary"}
                              size="sm"
                              className="w-full"
                            >
                              {p.isFeatured ? "Rimuovi evidenza" : "Metti in evidenza"}
                            </Button>
                          </form>
                          <form action={toggleProductFlagAction}>
                            <input type="hidden" name="productId" value={p.id} />
                            <input type="hidden" name="flag" value="NEW" />
                            <Button
                              type="submit"
                              variant={p.isNew ? "primary" : "secondary"}
                              size="sm"
                              className="w-full"
                            >
                              {p.isNew ? "Rimuovi novità" : "Segna novità"}
                            </Button>
                          </form>
                          <form action={toggleProductFlagAction}>
                            <input type="hidden" name="productId" value={p.id} />
                            <input type="hidden" name="flag" value="PROMO" />
                            <Button
                              type="submit"
                              variant={p.isPromo ? "primary" : "secondary"}
                              size="sm"
                              className="w-full"
                            >
                              {p.isPromo ? "Rimuovi promo" : "Segna promo"}
                            </Button>
                          </form>
                          <div className="h-px bg-border" />
                          <form action={deleteProductAction}>
                            <input type="hidden" name="productId" value={p.id} />
                            <Button type="submit" variant="ghost" size="sm" className="w-full">
                              Elimina
                            </Button>
                          </form>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-surface p-6">
            <p className="text-sm font-semibold text-foreground">
              Inizia dal primo prodotto
            </p>
            <p className="mt-2 text-sm text-muted">
              Aggiungi nome, prezzo e una foto. Il resto è opzionale.
            </p>
            <div className="mt-4">
              <ButtonLink href="/dashboard/products/new">Crea prodotto</ButtonLink>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  )
}
