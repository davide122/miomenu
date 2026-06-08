import { notFound } from "next/navigation"

import { prisma } from "@/lib/db"

export default async function SpecialOrderPage({
  params
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params

  const order = await prisma.specialOrder.findUnique({
    where: { id: orderId },
    include: {
      business: { select: { name: true, primaryColor: true } },
      baseProduct: { select: { id: true, name: true, price: true } }
    }
  })

  if (!order) notFound()

  const recommendedIds = Array.isArray(order.recommendedProductIds)
    ? (order.recommendedProductIds as string[])
    : []

  const recommended = recommendedIds.length
    ? await prisma.product.findMany({
        where: { id: { in: recommendedIds } },
        select: {
          id: true,
          name: true,
          price: true,
          category: { select: { name: true } }
        },
        take: 6
      })
    : []

  return (
    <main
      className="min-h-screen bg-background px-4 py-8"
      style={{ ["--brand" as never]: order.business.primaryColor } as never}
    >
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-3xl border border-border bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold text-muted">{order.business.name}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Comanda speciale
          </h1>
          <p className="mt-2 text-sm text-muted">
            Mostra questa schermata al personale.
          </p>

          <div className="mt-5 rounded-3xl border border-border bg-surface p-5">
            <p className="text-sm font-semibold text-foreground">{order.title}</p>
            {order.notes ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{order.notes}</p>
            ) : null}
          </div>

          {order.baseProduct ? (
            <div className="mt-4 rounded-3xl border border-border bg-white p-5">
              <p className="text-sm font-semibold text-foreground">Base consigliata</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm text-foreground">{order.baseProduct.name}</p>
                {order.baseProduct.price ? (
                  <div className="flex-none rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-foreground">
                    € {order.baseProduct.price.toString()}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {recommended.length ? (
            <div className="mt-4 rounded-3xl border border-border bg-white p-5">
              <p className="text-sm font-semibold text-foreground">Alternative</p>
              <div className="mt-3 grid gap-2">
                {recommended.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">{p.category.name}</p>
                    </div>
                    {p.price ? (
                      <div className="flex-none rounded-full bg-white px-3 py-1 text-sm font-semibold text-foreground">
                        € {p.price.toString()}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
