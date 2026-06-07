"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const prev = new Array<number>(b.length + 1)
  const cur = new Array<number>(b.length + 1)

  for (let j = 0; j <= b.length; j += 1) prev[j] = j
  for (let i = 1; i <= a.length; i += 1) {
    cur[0] = i
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j <= b.length; j += 1) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = cur[j]
  }
  return prev[b.length]
}

function similarityScore(aRaw: string, bRaw: string) {
  const a = normalizeText(aRaw)
  const b = normalizeText(bRaw)
  if (!a || !b) return 0
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) return 0.92

  const aTokens = a.split(/[\s/,_-]+/).filter(Boolean)
  const bTokens = b.split(/[\s/,_-]+/).filter(Boolean)
  const aSet = new Set(aTokens)
  const bSet = new Set(bTokens)
  let inter = 0
  for (const t of aSet) if (bSet.has(t)) inter += 1
  const union = aSet.size + bSet.size - inter
  const jaccard = union ? inter / union : 0

  const dist = levenshtein(a, b)
  const ratio = 1 - dist / Math.max(a.length, b.length)

  return Math.max(jaccard, ratio)
}

function isAllowedMediaUrl(value: string | undefined) {
  if (!value) return true
  if (value.startsWith("/api/media/")) return true
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

const baseSchema = z.object({
  productId: z.string().optional(),
  categoryId: z.string().min(1),
  name: z.string().min(2),
  shortDescription: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  price: z.string().optional().or(z.literal("")),
  ingredients: z.string().optional().or(z.literal("")),
  allergens: z.string().optional().or(z.literal("")),
  isAvailable: z.string().optional(),
  isFeatured: z.string().optional(),
  isNew: z.string().optional(),
  isPromo: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  imageUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(isAllowedMediaUrl),
  imageUrl2: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(isAllowedMediaUrl),
  imageUrl3: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(isAllowedMediaUrl),
  imageUrl4: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(isAllowedMediaUrl),
  videoUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(isAllowedMediaUrl)
})

const autosaveSchema = z.object({
  mode: z.enum(["autosave", "submit"]).optional(),
  productId: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  categoryName: z.string().optional().or(z.literal("")),
  name: z.string().optional().or(z.literal("")),
  shortDescription: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  price: z.string().optional().or(z.literal("")),
  ingredients: z.string().optional().or(z.literal("")),
  allergens: z.string().optional().or(z.literal("")),
  isAvailable: z.string().optional(),
  isFeatured: z.string().optional(),
  isNew: z.string().optional(),
  isPromo: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  imageUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(isAllowedMediaUrl),
  imageUrl2: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(isAllowedMediaUrl),
  imageUrl3: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(isAllowedMediaUrl),
  imageUrl4: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(isAllowedMediaUrl),
  videoUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(isAllowedMediaUrl)
})

function parsePrice(value: string | undefined) {
  const v = (value ?? "").trim()
  if (!v) return null
  const normalized = v.replace(",", ".")
  const num = Number(normalized)
  if (!Number.isFinite(num) || num < 0) return null
  return new Prisma.Decimal(normalized)
}

function parseAllergens(input: string | undefined) {
  const list = (input ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return Array.from(new Set(list))
}

async function upsertAllergens(productId: string, businessId: string, allergens: string[]) {
  await prisma.productAllergen.deleteMany({ where: { productId } })
  if (!allergens.length) return

  const records = await Promise.all(
    allergens.map(async (name) => {
      const existing = await prisma.allergen.findUnique({ where: { name } })
      if (existing) return existing
      return await prisma.allergen.create({ data: { name } })
    })
  )

  await prisma.productAllergen.createMany({
    data: records.map((a) => ({ productId, allergenId: a.id }))
  })

  await prisma.analyticsEvent.create({
    data: {
      businessId,
      type: "PRODUCT_VIEW",
      productId,
      metadata: { source: "dashboard_edit_allergens" }
    }
  })
}

async function setMediaByType(productId: string, type: "IMAGE" | "VIDEO", urlValue?: string) {
  const url = (urlValue ?? "").trim()
  if (!url) {
    await prisma.productMedia.deleteMany({ where: { productId, type } })
    return
  }
  await prisma.productMedia.deleteMany({ where: { productId, type } })
  await prisma.productMedia.create({
    data: {
      productId,
      url,
      type,
      sortOrder: type === "IMAGE" ? 0 : 1
    }
  })
}

async function setImageGallery(productId: string, urls: Array<string | undefined>) {
  const clean = urls.map((u) => (u ?? "").trim()).filter(Boolean)
  await prisma.productMedia.deleteMany({ where: { productId, type: "IMAGE" } })
  if (!clean.length) return
  await prisma.productMedia.createMany({
    data: clean.map((url, idx) => ({
      productId,
      url,
      type: "IMAGE" as const,
      sortOrder: idx
    }))
  })
}

async function resolveCategoryId({
  businessId,
  categoryId,
  categoryName,
  productName
}: {
  businessId: string
  categoryId?: string
  categoryName?: string
  productName?: string
}) {
  const directId = (categoryId ?? "").trim()
  if (directId) {
    const found = await prisma.category.findFirst({
      where: { id: directId, businessId },
      select: { id: true, name: true }
    })
    if (found) return found
  }

  const desired = (categoryName ?? "").trim()
  if (desired.length > 0 && desired.length < 2) {
    const first = await prisma.category.findFirst({
      where: { businessId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true }
    })
    if (first) return first
    const created = await prisma.category.create({
      data: { businessId, name: "Generale", sortOrder: 0, isVisible: true },
      select: { id: true, name: true }
    })
    return created
  }
  const categories = await prisma.category.findMany({
    where: { businessId },
    select: { id: true, name: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  })

  if (desired) {
    let best: { id: string; name: string; score: number } | null = null
    for (const c of categories) {
      const score = similarityScore(desired, c.name)
      if (!best || score > best.score) best = { id: c.id, name: c.name, score }
    }

    if (best && best.score >= 0.72) return { id: best.id, name: best.name }

    const last = await prisma.category.findFirst({
      where: { businessId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true }
    })
    const created = await prisma.category.create({
      data: {
        businessId,
        name: desired,
        sortOrder: (last?.sortOrder ?? 0) + 1,
        isVisible: true
      },
      select: { id: true, name: true }
    })
    return created
  }

  if (categories.length) {
    const hint = (productName ?? "").trim()
    if (hint) {
      let best: { id: string; name: string; score: number } | null = null
      for (const c of categories) {
        const score = similarityScore(hint, c.name)
        if (!best || score > best.score) best = { id: c.id, name: c.name, score }
      }
      if (best && best.score >= 0.6) return { id: best.id, name: best.name }
    }
    return categories[0]
  }

  const created = await prisma.category.create({
    data: { businessId, name: "Generale", sortOrder: 0, isVisible: true },
    select: { id: true, name: true }
  })
  return created
}

export type UpsertProductResult =
  | {
      ok: true
      status: "SKIPPED" | "CREATED" | "UPDATED"
      productId?: string
      categoryId?: string
      categoryName?: string
    }
  | { ok: false; error: string }
  | undefined

export async function upsertProductAction(_prev: UpsertProductResult, formData: FormData): Promise<UpsertProductResult> {
  const { business } = await requireDashboardContext()
  const isFree = business.plan === "FREE"

  const parsed = autosaveSchema.safeParse({
    mode: formData.get("mode") || undefined,
    productId: formData.get("productId") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    categoryName: formData.get("categoryName") || undefined,
    name: formData.get("name") || undefined,
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    price: formData.get("price") || undefined,
    ingredients: formData.get("ingredients") || undefined,
    allergens: formData.get("allergens") || undefined,
    isAvailable: formData.get("isAvailable") || undefined,
    isFeatured: formData.get("isFeatured") || undefined,
    isNew: formData.get("isNew") || undefined,
    isPromo: formData.get("isPromo") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    imageUrl2: formData.get("imageUrl2") || undefined,
    imageUrl3: formData.get("imageUrl3") || undefined,
    imageUrl4: formData.get("imageUrl4") || undefined,
    videoUrl: formData.get("videoUrl") || undefined
  })

  if (!parsed.success) return { ok: false as const, error: "Dati non validi." }

  const mode = parsed.data.mode ?? "submit"
  const name = (parsed.data.name ?? "").trim()
  if (name.length < 2) {
    if (mode === "autosave") return { ok: true as const, status: "SKIPPED" }
    return { ok: false as const, error: "Inserisci un nome valido." }
  }

  const resolvedCategory = await resolveCategoryId({
    businessId: business.id,
    categoryId: parsed.data.categoryId,
    categoryName: parsed.data.categoryName,
    productName: name
  })

  const productId = (parsed.data.productId ?? "").trim()
  const allergens = parseAllergens(parsed.data.allergens)
  const requestedVideo = (parsed.data.videoUrl ?? "").trim()

  if (isFree && requestedVideo) {
    if (mode === "autosave") {
      if (productId) await setMediaByType(productId, "VIDEO", "")
    } else {
      return { ok: false as const, error: "Il piano gratuito non supporta video. Passa a Premium o Gold." }
    }
  }

  if (productId) {
    const existing = await prisma.product.findFirst({
      where: { id: productId, businessId: business.id },
      select: { id: true }
    })
    if (!existing) return { ok: false as const, error: "Prodotto non valido." }

    await prisma.product.update({
      where: { id: productId },
      data: {
        categoryId: resolvedCategory.id,
        name,
        shortDescription: parsed.data.shortDescription ? parsed.data.shortDescription : null,
        description: parsed.data.description ? parsed.data.description : null,
        price: parsePrice(parsed.data.price),
        ingredients: parsed.data.ingredients ? parsed.data.ingredients : null,
        isAvailable: parsed.data.isAvailable === "on",
        isFeatured: parsed.data.isFeatured === "on",
        isNew: parsed.data.isNew === "on",
        isPromo: parsed.data.isPromo === "on",
        sortOrder: parsed.data.sortOrder ?? 0
      }
    })

    await Promise.all([
      setImageGallery(productId, [
        parsed.data.imageUrl,
        parsed.data.imageUrl2,
        parsed.data.imageUrl3,
        parsed.data.imageUrl4
      ]),
      setMediaByType(productId, "VIDEO", isFree ? "" : parsed.data.videoUrl)
    ])
    await upsertAllergens(productId, business.id, allergens)

    if (mode === "submit") redirect(`/dashboard/products/${productId}/edit`)
    return {
      ok: true as const,
      status: "UPDATED",
      productId,
      categoryId: resolvedCategory.id,
      categoryName: resolvedCategory.name
    }
  }

  if (isFree) {
    const count = await prisma.product.count({ where: { businessId: business.id } })
    if (count >= 5) {
      if (mode === "autosave") return { ok: true as const, status: "SKIPPED" }
      return {
        ok: false as const,
        error: "Piano gratuito: massimo 5 prodotti. Passa a Premium o Gold per sbloccare i prodotti illimitati."
      }
    }
  }

  const created = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: resolvedCategory.id,
      name,
      shortDescription: parsed.data.shortDescription ? parsed.data.shortDescription : null,
      description: parsed.data.description ? parsed.data.description : null,
      price: parsePrice(parsed.data.price),
      ingredients: parsed.data.ingredients ? parsed.data.ingredients : null,
      isAvailable: parsed.data.isAvailable === "on",
      isFeatured: parsed.data.isFeatured === "on",
      isNew: parsed.data.isNew === "on",
      isPromo: parsed.data.isPromo === "on",
      sortOrder: parsed.data.sortOrder ?? 0
    }
  })

  await Promise.all([
    setImageGallery(created.id, [
      parsed.data.imageUrl,
      parsed.data.imageUrl2,
      parsed.data.imageUrl3,
      parsed.data.imageUrl4
    ]),
    setMediaByType(created.id, "VIDEO", isFree ? "" : parsed.data.videoUrl)
  ])
  await upsertAllergens(created.id, business.id, allergens)

  if (mode === "submit") redirect("/dashboard/products")
  return {
    ok: true as const,
    status: "CREATED",
    productId: created.id,
    categoryId: resolvedCategory.id,
    categoryName: resolvedCategory.name
  }
}

export async function createProductAction(_prev: unknown, formData: FormData) {
  const { business } = await requireDashboardContext()
  const isFree = business.plan === "FREE"
  const parsed = baseSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    price: formData.get("price") || undefined,
    ingredients: formData.get("ingredients") || undefined,
    allergens: formData.get("allergens") || undefined,
    isAvailable: formData.get("isAvailable") || undefined,
    isFeatured: formData.get("isFeatured") || undefined,
    isNew: formData.get("isNew") || undefined,
    isPromo: formData.get("isPromo") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    imageUrl2: formData.get("imageUrl2") || undefined,
    imageUrl3: formData.get("imageUrl3") || undefined,
    imageUrl4: formData.get("imageUrl4") || undefined,
    videoUrl: formData.get("videoUrl") || undefined
  })
  if (!parsed.success) return { ok: false as const, error: "Dati non validi." }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, businessId: business.id }
  })
  if (!category) return { ok: false as const, error: "Categoria non valida." }

  if (isFree) {
    const count = await prisma.product.count({ where: { businessId: business.id } })
    if (count >= 5) {
      return {
        ok: false as const,
        error: "Piano gratuito: massimo 5 prodotti. Passa a Premium o Gold per sbloccare i prodotti illimitati."
      }
    }
    const requestedVideo = (parsed.data.videoUrl ?? "").trim()
    if (requestedVideo) {
      return { ok: false as const, error: "Il piano gratuito non supporta video. Passa a Premium o Gold." }
    }
  }

  const product = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: category.id,
      name: parsed.data.name,
      shortDescription: parsed.data.shortDescription ? parsed.data.shortDescription : null,
      description: parsed.data.description ? parsed.data.description : null,
      price: parsePrice(parsed.data.price),
      ingredients: parsed.data.ingredients ? parsed.data.ingredients : null,
      isAvailable: parsed.data.isAvailable === "on",
      isFeatured: parsed.data.isFeatured === "on",
      isNew: parsed.data.isNew === "on",
      isPromo: parsed.data.isPromo === "on",
      sortOrder: parsed.data.sortOrder ?? 0
    }
  })

  await Promise.all([
    setImageGallery(product.id, [
      parsed.data.imageUrl,
      parsed.data.imageUrl2,
      parsed.data.imageUrl3,
      parsed.data.imageUrl4
    ]),
    setMediaByType(product.id, "VIDEO", isFree ? "" : parsed.data.videoUrl)
  ])
  await upsertAllergens(product.id, business.id, parseAllergens(parsed.data.allergens))

  redirect("/dashboard/products")
}

export async function updateProductAction(_prev: unknown, formData: FormData) {
  const { business } = await requireDashboardContext()
  const isFree = business.plan === "FREE"
  const parsed = baseSchema.safeParse({
    productId: formData.get("productId") || undefined,
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    price: formData.get("price") || undefined,
    ingredients: formData.get("ingredients") || undefined,
    allergens: formData.get("allergens") || undefined,
    isAvailable: formData.get("isAvailable") || undefined,
    isFeatured: formData.get("isFeatured") || undefined,
    isNew: formData.get("isNew") || undefined,
    isPromo: formData.get("isPromo") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    imageUrl2: formData.get("imageUrl2") || undefined,
    imageUrl3: formData.get("imageUrl3") || undefined,
    imageUrl4: formData.get("imageUrl4") || undefined,
    videoUrl: formData.get("videoUrl") || undefined
  })
  if (!parsed.success) return { ok: false as const, error: "Dati non validi." }
  if (!parsed.data.productId) return { ok: false as const, error: "Prodotto non valido." }

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, businessId: business.id }
  })
  if (!product) return { ok: false as const, error: "Prodotto non valido." }

  if (isFree) {
    const requestedVideo = (parsed.data.videoUrl ?? "").trim()
    if (requestedVideo) {
      return { ok: false as const, error: "Il piano gratuito non supporta video. Passa a Premium o Gold." }
    }
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, businessId: business.id }
  })
  if (!category) return { ok: false as const, error: "Categoria non valida." }

  await prisma.product.update({
    where: { id: product.id },
    data: {
      categoryId: category.id,
      name: parsed.data.name,
      shortDescription: parsed.data.shortDescription ? parsed.data.shortDescription : null,
      description: parsed.data.description ? parsed.data.description : null,
      price: parsePrice(parsed.data.price),
      ingredients: parsed.data.ingredients ? parsed.data.ingredients : null,
      isAvailable: parsed.data.isAvailable === "on",
      isFeatured: parsed.data.isFeatured === "on",
      isNew: parsed.data.isNew === "on",
      isPromo: parsed.data.isPromo === "on",
      sortOrder: parsed.data.sortOrder ?? 0
    }
  })

  await Promise.all([
    setImageGallery(product.id, [
      parsed.data.imageUrl,
      parsed.data.imageUrl2,
      parsed.data.imageUrl3,
      parsed.data.imageUrl4
    ]),
    setMediaByType(product.id, "VIDEO", isFree ? "" : parsed.data.videoUrl)
  ])
  await upsertAllergens(product.id, business.id, parseAllergens(parsed.data.allergens))

  redirect(`/dashboard/products/${product.id}/edit`)
}

export async function toggleProductAvailabilityAction(formData: FormData) {
  const { business } = await requireDashboardContext()
  const productId = String(formData.get("productId") || "")
  if (!productId) redirect("/dashboard/products")

  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id }
  })
  if (!product) redirect("/dashboard/products")

  await prisma.product.update({
    where: { id: product.id },
    data: { isAvailable: !product.isAvailable }
  })

  redirect("/dashboard/products")
}

export async function toggleProductFlagAction(formData: FormData) {
  const { business } = await requireDashboardContext()
  const productId = String(formData.get("productId") || "")
  const flag = String(formData.get("flag") || "")
  if (!productId) redirect("/dashboard/products")

  const key =
    flag === "FEATURED"
      ? "isFeatured"
      : flag === "NEW"
        ? "isNew"
        : flag === "PROMO"
          ? "isPromo"
          : null
  if (!key) redirect("/dashboard/products")

  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id },
    select: { id: true, isFeatured: true, isNew: true, isPromo: true }
  })
  if (!product) redirect("/dashboard/products")

  const next =
    key === "isFeatured"
      ? !product.isFeatured
      : key === "isNew"
        ? !product.isNew
        : !product.isPromo

  await prisma.product.update({
    where: { id: product.id },
    data: { [key]: next }
  })

  redirect("/dashboard/products")
}

export async function moveProductAction(formData: FormData) {
  const { business } = await requireDashboardContext()
  const productId = String(formData.get("productId") || "")
  const direction = String(formData.get("direction") || "")
  if (!productId) redirect("/dashboard/products")
  if (direction !== "UP" && direction !== "DOWN") redirect("/dashboard/products")

  const current = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id },
    select: { id: true, sortOrder: true, categoryId: true }
  })
  if (!current) redirect("/dashboard/products")

  const neighbor =
    direction === "UP"
      ? await prisma.product.findFirst({
          where: {
            businessId: business.id,
            categoryId: current.categoryId,
            sortOrder: { lt: current.sortOrder }
          },
          orderBy: { sortOrder: "desc" },
          select: { id: true, sortOrder: true }
        })
      : await prisma.product.findFirst({
          where: {
            businessId: business.id,
            categoryId: current.categoryId,
            sortOrder: { gt: current.sortOrder }
          },
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true }
        })

  if (!neighbor) redirect("/dashboard/products")

  await prisma.$transaction([
    prisma.product.update({
      where: { id: current.id },
      data: { sortOrder: neighbor.sortOrder }
    }),
    prisma.product.update({
      where: { id: neighbor.id },
      data: { sortOrder: current.sortOrder }
    })
  ])

  redirect("/dashboard/products")
}

export async function deleteProductAction(formData: FormData) {
  const { business } = await requireDashboardContext()
  const productId = String(formData.get("productId") || "")
  if (!productId) redirect("/dashboard/products")

  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id }
  })
  if (!product) redirect("/dashboard/products")

  await prisma.product.delete({ where: { id: product.id } })
  redirect("/dashboard/products")
}
