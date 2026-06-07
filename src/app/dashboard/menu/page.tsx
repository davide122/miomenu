import { AppShell } from "@/components/dashboard/app-shell"
import { ButtonLink } from "@/components/ui/button"
import { ExperienceBuilder } from "@/components/dashboard/experience-builder"
import { requireDashboardContext } from "@/lib/auth/current"
import { prisma } from "@/lib/db"
import { formatPrice } from "@/lib/money"

export default async function MenuPage() {
  const { business } = await requireDashboardContext()
  const [screen, products] = await Promise.all([
    prisma.screen.findFirst({
      where: { businessId: business.id },
      orderBy: { createdAt: "asc" },
      select: { layout: true }
    }),
    prisma.product.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true, price: true, isAvailable: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 120
    })
  ])

  return (
    <AppShell
      title="Menu"
      brandColor={business.primaryColor}
      description="Personalizza menu mobile e TV Mode come un mini builder."
      actions={
        <ButtonLink href={`/menu/${business.slug}`} variant="secondary">
          Anteprima menu
        </ButtonLink>
      }
    >
      <ExperienceBuilder
        businessId={business.id}
        businessSlug={business.slug}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          price: formatPrice(p.price),
          isAvailable: p.isAvailable
        }))}
        initial={{
          primaryColor: business.primaryColor,
          themeMode: business.themeMode,
          visualStyle: business.visualStyle,
          fontStyle: business.fontStyle,
          menuUi: (business.menuUi as never) ?? null,
          screenUi: (business.screenUi as never) ?? null,
          screenLayout: (screen?.layout ?? "LANDSCAPE_16_9") as never
        }}
      />
    </AppShell>
  )
}
