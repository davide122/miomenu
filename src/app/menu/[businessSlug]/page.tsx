import { notFound } from "next/navigation"

import { PublicMenuClient } from "@/components/public/public-menu"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { formatPrice } from "@/lib/money"

export const dynamic = "force-dynamic"

export default async function PublicMenuPage({
  params,
  searchParams
}: {
  params: Promise<{ businessSlug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { businessSlug } = await params
  const sp = (await searchParams) ?? {}
  const preview = sp.preview === "1"
  const cfgRaw = typeof sp.cfg === "string" ? sp.cfg : ""

  const business = await prisma.business.findFirst({
    where: { slug: businessSlug, isActive: true }
  })
  if (!business) notFound()

  const session = await getSession()
  const canEdit = !preview && session?.userId === business.ownerId

  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
  const previewCfg: {
    primaryColor?: string
    themeMode?: "LIGHT" | "DARK"
    visualStyle?: "MINIMAL" | "ELEGANT" | "MODERN" | "STREET" | "LUXURY"
    fontStyle?: "INTER" | "SYSTEM" | "GEIST"
    menuUi?: Record<string, unknown>
  } | null = (() => {
    if (!preview || !cfgRaw) return null
    try {
      const parsed = JSON.parse(decodeURIComponent(cfgRaw)) as Record<string, unknown>
      const menuUi = (parsed.menuUi as Record<string, unknown> | undefined) ?? undefined
      const primaryColor = typeof parsed.primaryColor === "string" && hex.test(parsed.primaryColor) ? parsed.primaryColor : undefined
      const themeMode = parsed.themeMode === "LIGHT" || parsed.themeMode === "DARK" ? parsed.themeMode : undefined
      const visualStyle =
        parsed.visualStyle === "MINIMAL" ||
        parsed.visualStyle === "ELEGANT" ||
        parsed.visualStyle === "MODERN" ||
        parsed.visualStyle === "STREET" ||
        parsed.visualStyle === "LUXURY"
          ? parsed.visualStyle
          : undefined
      const fontStyle =
        parsed.fontStyle === "INTER" || parsed.fontStyle === "SYSTEM" || parsed.fontStyle === "GEIST"
          ? parsed.fontStyle
          : undefined

      return { primaryColor, themeMode, visualStyle, fontStyle, menuUi }
    } catch {
      return null
    }
  })()

  const baseMenuUi = (business.menuUi as Record<string, unknown> | null) ?? null
  const mergedMenuUi =
    previewCfg?.menuUi
      ? ({ ...(baseMenuUi ?? {}), ...(previewCfg.menuUi ?? {}) } as never)
      : ((baseMenuUi as never) ?? null)

  const categories = await prisma.category.findMany({
    where: { businessId: business.id, isVisible: true },
    include: {
      products: {
        where: { businessId: business.id },
        include: {
          media: { orderBy: { sortOrder: "asc" } },
          allergens: { include: { allergen: true } }
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
      }
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  })

  const now = new Date()
  const promotion = await prisma.promotion.findFirst({
    where: {
      businessId: business.id,
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
    },
    orderBy: [{ createdAt: "desc" }]
  })

  if (!preview) {
    await prisma.analyticsEvent.create({
      data: { businessId: business.id, type: "MENU_VIEW" }
    })
  }

  return (
    <PublicMenuClient
      business={{
        name: business.name,
        slug: business.slug,
        logoUrl: business.logoUrl,
        coverUrl: business.coverUrl,
        primaryColor: previewCfg?.primaryColor ?? business.primaryColor,
        themeMode: previewCfg?.themeMode ?? business.themeMode,
        visualStyle: previewCfg?.visualStyle ?? business.visualStyle,
        fontStyle: previewCfg?.fontStyle ?? business.fontStyle,
        menuUi: mergedMenuUi,
        whatsapp: business.whatsapp,
        instagram: business.instagram
      }}
      promotion={
        promotion
          ? {
              code: promotion.code,
              title: promotion.title,
              description: promotion.description,
              discountPercent: promotion.discountPercent,
              active: promotion.active
            }
          : null
      }
      canEdit={canEdit}
      businessId={business.id}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        products: c.products.map((p) => {
          const imageUrls = p.media.filter((m) => m.type === "IMAGE").map((m) => m.url)
          const videoUrl = p.media.find((m) => m.type === "VIDEO")?.url ?? null
          return {
            id: p.id,
            name: p.name,
            shortDescription: p.shortDescription,
            description: p.description,
            price: formatPrice(p.price),
            ingredients: p.ingredients,
            isAvailable: p.isAvailable,
            isFeatured: p.isFeatured,
            isNew: p.isNew,
            isPromo: p.isPromo,
            imageUrl: imageUrls[0] ?? null,
            imageUrls,
            videoUrl,
            translations: (p.translations as never) ?? null,
            upsellProductIds: (p.upsellProductIds as never) ?? null,
            allergens: p.allergens.map((a) => a.allergen.name)
          }
        })
      }))}
    />
  )
}
