import { AppShell } from "@/components/dashboard/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"
import {
  createCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  toggleCategoryVisibilityAction
} from "@/lib/menu/category-actions"

export default async function CategoriesPage() {
  const { business } = await requireDashboardContext()

  const categories = await prisma.category.findMany({
    where: { businessId: business.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  })

  return (
    <AppShell
      title="Categorie"
      brandColor={business.primaryColor}
      description="Dividi il menu in sezioni. Più categorie = più ordine e scelta più veloce per i clienti."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <section className="rounded-3xl border border-border bg-surface p-2 shadow-soft sm:p-3">
          <div className="flex items-start justify-between gap-4 px-3 pb-3 pt-2 sm:px-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Le tue categorie
              </h2>
              <p className="mt-1 text-sm text-muted">
                Le categorie controllano l’ordine nel menu pubblico e in TV Mode.
              </p>
            </div>
          </div>

          {categories.length ? (
            <div className="grid gap-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col justify-between gap-3 rounded-3xl border border-border bg-surface px-4 py-4 transition-colors duration-200 hover:bg-surface-muted sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {c.name}
                    </p>
                    {c.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {c.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {c.isVisible ? (
                        <Badge variant="muted">Visibile</Badge>
                      ) : (
                        <Badge variant="danger">Nascosta</Badge>
                      )}
                      <Badge variant="default">Ordine {c.sortOrder}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <form action={moveCategoryAction}>
                      <input type="hidden" name="categoryId" value={c.id} />
                      <input type="hidden" name="direction" value="UP" />
                      <Button type="submit" variant="secondary" size="sm">
                        Su
                      </Button>
                    </form>
                    <form action={moveCategoryAction}>
                      <input type="hidden" name="categoryId" value={c.id} />
                      <input type="hidden" name="direction" value="DOWN" />
                      <Button type="submit" variant="secondary" size="sm">
                        Giù
                      </Button>
                    </form>
                    <form action={toggleCategoryVisibilityAction}>
                      <input type="hidden" name="categoryId" value={c.id} />
                      <Button type="submit" variant="secondary" size="sm">
                        {c.isVisible ? "Nascondi" : "Mostra"}
                      </Button>
                    </form>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="categoryId" value={c.id} />
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
              Nessuna categoria. Creane una a destra: es. “Cocktail”, “Gelati”, “Dolci”.
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Crea categoria
            </h2>
            <p className="mt-1 text-sm text-muted">
              Una descrizione breve aiuta la navigazione nel menu pubblico.
            </p>
            <form action={createCategoryAction} className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" placeholder="Cocktail" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Una riga breve per introdurre la categoria."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Ordine</Label>
                <Input id="sortOrder" name="sortOrder" defaultValue="0" />
              </div>
              <Button type="submit">Crea</Button>
            </form>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}
