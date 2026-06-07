import { notFound } from "next/navigation"

import { AppShell } from "@/components/dashboard/app-shell"
import { ProductForm } from "@/components/dashboard/product-form"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"
import { upsertProductAction } from "@/lib/menu/product-actions"
import { generateProductEnglishTranslationAction } from "@/lib/ai/product-ai-actions"

export default async function EditProductPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { business } = await requireDashboardContext()
  const { id } = await params

  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id, businessId: business.id },
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        allergens: { include: { allergen: true } }
      }
    }),
    prisma.category.findMany({
      where: { businessId: business.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true }
    })
  ])

  if (!product) notFound()

  const images = product.media
    .filter((m: { type: "IMAGE" | "VIDEO"; url: string }) => m.type === "IMAGE")
    .slice(0, 4)
  const image = images[0] ?? null
  const video =
    product.media.find((m: { type: "IMAGE" | "VIDEO"; url: string }) => m.type === "VIDEO") ??
    null
  const allergens = product.allergens
    .map((a: { allergen: { name: string } }) => a.allergen.name)
    .join(", ")

  return (
    <AppShell
      title="Prodotti"
      brandColor={business.primaryColor}
      description="Modifica prodotto con anteprima live."
      actions={
        <form action={generateProductEnglishTranslationAction}>
          <input type="hidden" name="productId" value={product.id} />
          <Button type="submit" variant="secondary" size="sm">
            Genera EN
          </Button>
        </form>
      }
    >
      <ProductForm
        title="Modifica prodotto"
        submitLabel="Salva"
        action={upsertProductAction}
        categories={categories}
        businessId={business.id}
        plan={business.plan}
        initial={{
          productId: product.id,
          categoryId: product.categoryId,
          name: product.name,
          shortDescription: product.shortDescription,
          description: product.description,
          price: product.price ? product.price.toString() : "",
          ingredients: product.ingredients,
          allergens,
          sortOrder: product.sortOrder,
          isAvailable: product.isAvailable,
          isFeatured: product.isFeatured,
          isNew: product.isNew,
          isPromo: product.isPromo,
          imageUrl: image?.url ?? "",
          imageUrl2: images[1]?.url ?? "",
          imageUrl3: images[2]?.url ?? "",
          imageUrl4: images[3]?.url ?? "",
          videoUrl: video?.url ?? ""
        }}
      />
    </AppShell>
  )
}
