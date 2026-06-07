"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import OpenAI from "openai"

import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"
import { getEnv } from "@/lib/env"

function requireGoldPlan(plan: string) {
  if (plan !== "GOLD") {
    return "Funzione AI disponibile solo con il piano Gold."
  }
  return null
}

function requireOpenAi() {
  const env = getEnv()
  if (!env.OPENAI_API_KEY) {
    return { ok: false as const, error: "Manca OPENAI_API_KEY in .env." }
  }
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  const model = env.OPENAI_MODEL ?? "gpt-4o-mini"
  return { ok: true as const, client, model }
}

function redirectWithError(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`)
}

const translationSchema = z.object({
  name: z.string().min(1),
  shortDescription: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  ingredients: z.string().optional().or(z.literal(""))
})

export async function generateProductEnglishTranslationAction(formData: FormData): Promise<void> {
  const { business } = await requireDashboardContext()
  const planGuard = requireGoldPlan(business.plan)
  const productId = String(formData.get("productId") || "")
  if (planGuard) {
    if (productId) redirectWithError(`/dashboard/products/${productId}/edit`, planGuard)
    redirectWithError("/dashboard/products", planGuard)
  }

  if (!productId) redirectWithError("/dashboard/products", "Prodotto non valido.")

  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      description: true,
      ingredients: true,
      translations: true
    }
  })
  if (!product) redirectWithError("/dashboard/products", "Prodotto non valido.")

  const ai = requireOpenAi()
  if (!ai.ok) redirectWithError(`/dashboard/products/${product.id}/edit`, ai.error)

  const system = [
    "You are a professional food menu copywriter and translator.",
    "Translate from Italian to English.",
    "Keep it concise, premium, and readable.",
    "Return only valid JSON, no extra text.",
    "No emojis."
  ].join("\n")

  const user = [
    "Translate these fields (leave empty string if missing):",
    JSON.stringify(
      {
        name: product.name,
        shortDescription: product.shortDescription ?? "",
        description: product.description ?? "",
        ingredients: product.ingredients ?? ""
      },
      null,
      2
    ),
    "",
    "JSON format:",
    '{ "name": string, "shortDescription"?: string, "description"?: string, "ingredients"?: string }'
  ].join("\n")

  try {
    const res = await ai.client.chat.completions.create({
      model: ai.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })

    const content = res.choices[0]?.message?.content ?? ""
    const json = JSON.parse(content) as unknown
    const parsed = translationSchema.safeParse(json)
    if (!parsed.success) redirectWithError(`/dashboard/products/${product.id}/edit`, "Risposta AI non valida.")

    const existing = (product.translations as Record<string, unknown> | null) ?? {}
    const next = { ...existing, en: parsed.data }

    await prisma.product.update({
      where: { id: product.id },
      data: { translations: next as never }
    })

    redirect(`/dashboard/products/${product.id}/edit?done=translate-en`)
  } catch {
    redirectWithError(`/dashboard/products/${product.id}/edit`, "AI non disponibile in questo momento.")
  }
}

const upsellSchema = z.record(z.string(), z.array(z.string()).max(3))

export async function generateUpsellsForBusinessAction(_: FormData): Promise<void> {
  const { business } = await requireDashboardContext()
  const planGuard = requireGoldPlan(business.plan)
  if (planGuard) redirectWithError("/dashboard/ai", planGuard)

  const ai = requireOpenAi()
  if (!ai.ok) redirectWithError("/dashboard/ai", ai.error)

  const products = await prisma.product.findMany({
    where: { businessId: business.id },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      description: true,
      price: true,
      category: { select: { name: true } }
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  })

  if (products.length < 3) {
    redirectWithError("/dashboard/ai", "Aggiungi almeno 3 prodotti per generare gli upsell.")
  }

  const system = [
    "You are a menu merchandising expert.",
    "Goal: increase average order value with natural pairings.",
    "Return only valid JSON.",
    "No emojis.",
    "For each product id, return up to 3 other product ids as upsell suggestions.",
    "Avoid suggesting the same product id."
  ].join("\n")

  const user = [
    "Products list (id, category, name, shortDescription, description, price if any):",
    JSON.stringify(
      products.map((p) => ({
        id: p.id,
        category: p.category.name,
        name: p.name,
        shortDescription: p.shortDescription ?? "",
        description: p.description ?? "",
        price: p.price ? p.price.toString() : ""
      })),
      null,
      2
    ),
    "",
    "Output JSON format:",
    '{ "<productId>": ["<upsellId1>", "<upsellId2>", "<upsellId3>"] }'
  ].join("\n")

  try {
    const res = await ai.client.chat.completions.create({
      model: ai.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })

    const content = res.choices[0]?.message?.content ?? ""
    const json = JSON.parse(content) as unknown
    const parsed = upsellSchema.safeParse(json)
    if (!parsed.success) redirectWithError("/dashboard/ai", "Risposta AI non valida.")

    const ids = new Set(products.map((p) => p.id))
    const updates: Array<{ id: string; upsellProductIds: string[] }> = []
    for (const [id, upsells] of Object.entries(parsed.data)) {
      if (!ids.has(id)) continue
      const clean = Array.from(new Set(upsells.filter((u) => ids.has(u) && u !== id))).slice(0, 3)
      updates.push({ id, upsellProductIds: clean })
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.product.update({
          where: { id: u.id },
          data: { upsellProductIds: u.upsellProductIds as never }
        })
      )
    )

    redirect("/dashboard/ai?done=upsell")
  } catch {
    redirectWithError("/dashboard/ai", "AI non disponibile in questo momento.")
  }
}
