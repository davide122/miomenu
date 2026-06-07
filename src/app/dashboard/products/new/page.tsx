import { AppShell } from "@/components/dashboard/app-shell"
import { ProductForm } from "@/components/dashboard/product-form"
import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"
import { upsertProductAction } from "@/lib/menu/product-actions"

export default async function NewProductPage() {
  const { business } = await requireDashboardContext()

  const categories = await prisma.category.findMany({
    where: { businessId: business.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true }
  })

  return (
    <AppShell
      title="Prodotti"
      brandColor={business.primaryColor}
      description="Crea e modifica prodotti con anteprima live."
    >
      <ProductForm
        title="Aggiungi prodotto"
        submitLabel="Crea prodotto"
        action={upsertProductAction}
        categories={categories}
        businessId={business.id}
        plan={business.plan}
        initial={{
          isAvailable: true
        }}
      />
    </AppShell>
  )
}
