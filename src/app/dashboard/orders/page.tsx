import { redirect } from "next/navigation"

import { AppShell } from "@/components/dashboard/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"

async function markDoneAction(formData: FormData) {
  "use server"
  const { business } = await requireDashboardContext()
  const id = String(formData.get("id") || "")
  if (!id) redirect("/dashboard/orders?error=ID non valido")

  await prisma.specialOrder.updateMany({
    where: { id, businessId: business.id },
    data: { status: "DONE", completedAt: new Date() }
  })

  redirect("/dashboard/orders")
}

async function deleteOrderAction(formData: FormData) {
  "use server"
  const { business } = await requireDashboardContext()
  const id = String(formData.get("id") || "")
  if (!id) redirect("/dashboard/orders?error=ID non valido")

  await prisma.specialOrder.deleteMany({ where: { id, businessId: business.id } })
  redirect("/dashboard/orders")
}

export default async function OrdersPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { business } = await requireDashboardContext()
  const sp = searchParams ? await searchParams : {}
  const error = typeof sp.error === "string" ? sp.error : ""

  const orders = await prisma.specialOrder.findMany({
    where: { businessId: business.id },
    include: { baseProduct: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 80
  })

  const open = orders.filter((o) => o.status === "NEW")
  const done = orders.filter((o) => o.status !== "NEW")

  return (
    <AppShell
      title="Comande speciali"
      brandColor={business.primaryColor}
      description="Richieste generate dal quiz AI con QR. Puoi segnarle come fatte o eliminarle."
    >
      <div className="grid gap-4">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Da fare</CardTitle>
            <CardDescription>Le ultime comande create dal menu pubblico.</CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            {open.length ? (
              <div className="grid gap-3">
                {open.map((o) => (
                  <div key={o.id} className="rounded-3xl border border-border bg-white px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{o.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          {o.baseProduct ? `Base: ${o.baseProduct.name}` : "Base: —"} •{" "}
                          {o.createdAt.toLocaleString("it-IT")}
                        </p>
                        {o.notes ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{o.notes}</p>
                        ) : null}
                        <p className="mt-3 text-xs text-muted">
                          Link QR:{" "}
                          <a
                            className="font-medium text-foreground underline underline-offset-2"
                            href={`/order/${o.id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            /order/{o.id}
                          </a>
                        </p>
                      </div>
                      <div className="flex flex-none items-center gap-2">
                        <form action={markDoneAction}>
                          <input type="hidden" name="id" value={o.id} />
                          <Button type="submit" size="sm">
                            Fatto
                          </Button>
                        </form>
                        <form action={deleteOrderAction}>
                          <input type="hidden" name="id" value={o.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Elimina
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted">
                Nessuna comanda aperta.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storico</CardTitle>
            <CardDescription>Comande completate o archiviate.</CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            {done.length ? (
              <div className="grid gap-3">
                {done.slice(0, 30).map((o) => (
                  <div key={o.id} className="rounded-3xl border border-border bg-white px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{o.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          Stato: {o.status} • {o.createdAt.toLocaleString("it-IT")}
                        </p>
                        {o.notes ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{o.notes}</p>
                        ) : null}
                      </div>
                      <form action={deleteOrderAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Elimina
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted">
                Storico vuoto.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

