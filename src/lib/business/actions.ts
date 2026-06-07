"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import OpenAI from "openai"

import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/auth/current"
import { setSessionCookie } from "@/lib/auth/session"
import { getEnv } from "@/lib/env"
import { slugify } from "@/lib/slug"

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

const businessSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["RISTORANTE", "GELATERIA", "BAR", "PUB", "PASTICCERIA", "ALTRO"]),
  primaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional(),
  logoUrl: z.string().optional().or(z.literal("")).refine(isAllowedMediaUrl),
  coverUrl: z.string().optional().or(z.literal("")).refine(isAllowedMediaUrl),
  whatsapp: z.string().optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  themeMode: z.enum(["LIGHT", "DARK"]),
  visualStyle: z.enum(["MINIMAL", "ELEGANT", "MODERN", "STREET", "LUXURY"]),
  fontStyle: z.enum(["INTER", "SYSTEM", "GEIST"])
})

async function uniqueSlug(base: string) {
  const candidate = base || "locale"
  const exists = await prisma.business.findUnique({ where: { slug: candidate } })
  if (!exists) return candidate
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${candidate}-${suffix}`
}

export async function createBusinessAction(_prev: unknown, formData: FormData) {
  const session = await requireSession()
  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    primaryColor: formData.get("primaryColor") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    instagram: formData.get("instagram") || undefined,
    address: formData.get("address") || undefined,
    themeMode: formData.get("themeMode"),
    visualStyle: formData.get("visualStyle"),
    fontStyle: formData.get("fontStyle")
  })

  if (!parsed.success) return { ok: false as const, error: "Dati non validi." }

  const slug = await uniqueSlug(slugify(parsed.data.name))

  const business = await prisma.business.create({
    data: {
      ownerId: session.userId,
      name: parsed.data.name,
      slug,
      type: parsed.data.type,
      primaryColor: parsed.data.primaryColor ?? "#111827",
      logoUrl: parsed.data.logoUrl ? parsed.data.logoUrl : null,
      coverUrl: parsed.data.coverUrl ? parsed.data.coverUrl : null,
      whatsapp: parsed.data.whatsapp ? parsed.data.whatsapp : null,
      instagram: parsed.data.instagram ? parsed.data.instagram : null,
      address: parsed.data.address ? parsed.data.address : null,
      themeMode: parsed.data.themeMode,
      visualStyle: parsed.data.visualStyle,
      fontStyle: parsed.data.fontStyle,
      menus: {
        create: {
          name: "Menu principale",
          isActive: true
        }
      },
      screens: {
        create: {
          name: "Schermo principale",
          screenCode: `scr_${Math.random().toString(36).slice(2, 10)}`
        }
      }
    }
  })

  await setSessionCookie({
    userId: session.userId,
    role: session.role,
    businessId: business.id
  })

  redirect("/dashboard")
}

export async function updateBusinessAction(_prev: unknown, formData: FormData) {
  const session = await requireSession()
  const businessId = String(formData.get("businessId") || "")
  if (!businessId) return { ok: false as const, error: "Business non valido." }

  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    primaryColor: formData.get("primaryColor") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    instagram: formData.get("instagram") || undefined,
    address: formData.get("address") || undefined,
    themeMode: formData.get("themeMode"),
    visualStyle: formData.get("visualStyle"),
    fontStyle: formData.get("fontStyle")
  })

  if (!parsed.success) return { ok: false as const, error: "Dati non validi." }

  await prisma.business.update({
    where: { id: businessId, ownerId: session.userId },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      primaryColor: parsed.data.primaryColor ?? "#111827",
      logoUrl: parsed.data.logoUrl ? parsed.data.logoUrl : null,
      coverUrl: parsed.data.coverUrl ? parsed.data.coverUrl : null,
      whatsapp: parsed.data.whatsapp ? parsed.data.whatsapp : null,
      instagram: parsed.data.instagram ? parsed.data.instagram : null,
      address: parsed.data.address ? parsed.data.address : null,
      themeMode: parsed.data.themeMode,
      visualStyle: parsed.data.visualStyle,
      fontStyle: parsed.data.fontStyle
    }
  })

  await setSessionCookie({
    userId: session.userId,
    role: session.role,
    businessId
  })

  redirect("/dashboard/settings")
}

export async function openMenuEditorFromPublicAction(formData: FormData) {
  const session = await requireSession()
  const businessId = String(formData.get("businessId") || "")
  if (!businessId) redirect("/dashboard/menu")

  const business = await prisma.business.findFirst({
    where: { id: businessId, isActive: true },
    select: { id: true, ownerId: true }
  })

  if (!business) redirect("/dashboard/menu")
  if (business.ownerId !== session.userId) redirect("/dashboard")

  await setSessionCookie({
    userId: session.userId,
    role: session.role,
    businessId: business.id
  })

  redirect("/dashboard/menu")
}

const menuUiSchema = z
  .object({
    accent: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
    heroSurface: z.enum(["LIGHT", "DARK"]).optional(),
    heroHeaderStyle: z.enum(["glass", "solid", "clean"]).optional(),
    heroMood: z.enum(["MINIMAL", "ELEGANT", "MODERN", "STREET", "LUXURY"]).optional(),
    heroPillText: z.string().min(1).max(28).optional(),
    heroSubtitleText: z.string().min(1).max(64).optional(),
    heroTitleColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
    heroSubtitleColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
    dishOfDayProductId: z.string().min(1).max(64).optional(),
    aiQuizEnabled: z.boolean().optional(),
    showFeaturedRail: z.boolean().optional(),
    showSocial: z.boolean().optional()
  })
  .strict()

const screenUiSchema = z
  .object({
    accent: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
    headerTitleText: z.string().min(1).max(40).optional(),
    headerSubtitleText: z.string().min(1).max(64).optional(),
    headerTitleColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
    headerSubtitleColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
    featuredTitleText: z.string().min(1).max(24).optional(),
    scanHintText: z.string().min(1).max(40).optional(),
    showQr: z.boolean().optional(),
    featuredMax: z.number().int().min(0).max(12).optional(),
    showImages: z.boolean().optional(),
    cardStyle: z.enum(["GLASS", "SOLID"]).optional(),
    animationStyle: z.enum(["NONE", "FADE", "SLIDE"]).optional(),
    animationSpeed: z.enum(["SLOW", "NORMAL", "FAST"]).optional(),
    backgroundMotion: z.boolean().optional()
  })
  .strict()

const aiExperienceSchema = z
  .object({
    menuUi: menuUiSchema.partial().optional(),
    screenUi: screenUiSchema.partial().optional()
  })
  .strict()

export async function suggestExperienceAiAction(_prev: unknown, formData: FormData) {
  const session = await requireSession()
  const businessId = String(formData.get("businessId") || "")
  const target = String(formData.get("target") || "BOTH")
  if (!businessId) return { ok: false as const, error: "Business non valido." }

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.userId, isActive: true },
    select: { id: true, name: true, type: true, themeMode: true, visualStyle: true, primaryColor: true }
  })
  if (!business) return { ok: false as const, error: "Business non valido." }

  const env = getEnv()
  if (!env.OPENAI_API_KEY) {
    return {
      ok: false as const,
      error: "Manca OPENAI_API_KEY in .env."
    }
  }

  const categories = await prisma.category.findMany({
    where: { businessId: business.id, isVisible: true },
    select: { name: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 16
  })

  const promptTarget =
    target === "MENU" ? "menu mobile" : target === "SCREEN" ? "TV Mode" : "menu mobile e TV Mode"

  const system = [
    "Sei un designer UX/UI e copywriter per menu digitali premium (Italia, 2026).",
    "Obiettivo: massima leggibilità, elegante, semplice, mai kitsch.",
    "Devi restituire solo JSON valido, senza testo extra.",
    "Non usare emoji.",
    "Mantieni frasi brevi, tono premium."
  ].join("\n")

  const user = [
    `Contesto: ${business.name} (${business.type}).`,
    `Stile: ${business.visualStyle}, tema: ${business.themeMode}.`,
    `Color brand: ${business.primaryColor}.`,
    `Categorie presenti: ${categories.map((c) => c.name).join(", ") || "nessuna"}.`,
    `Task: proponi testi e impostazioni sicure per ${promptTarget}.`,
    "",
    "Formato risposta JSON:",
    "{",
    '  "menuUi": { "heroPillText"?: string, "heroSubtitleText"?: string },',
    '  "screenUi": { "headerSubtitleText"?: string, "featuredTitleText"?: string, "scanHintText"?: string, "showImages"?: boolean, "cardStyle"?: "GLASS"|"SOLID", "animationStyle"?: "NONE"|"FADE"|"SLIDE", "animationSpeed"?: "SLOW"|"NORMAL"|"FAST", "backgroundMotion"?: boolean }',
    "}",
    "",
    "Vincoli:",
    "- heroPillText max 28 caratteri",
    "- heroSubtitleText max 64",
    "- featuredTitleText max 24",
    "- scanHintText max 40",
    "- Italiano"
  ].join("\n")

  try {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    const model = env.OPENAI_MODEL ?? "gpt-4o-mini"
    const res = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })

    const content = res.choices[0]?.message?.content ?? ""
    const json = JSON.parse(content) as unknown
    const parsed = aiExperienceSchema.safeParse(json)
    if (!parsed.success) return { ok: false as const, error: "Risposta AI non valida." }

    const filtered =
      target === "MENU"
        ? { menuUi: parsed.data.menuUi }
        : target === "SCREEN"
          ? { screenUi: parsed.data.screenUi }
          : parsed.data

    return { ok: true as const, ...filtered }
  } catch {
    return { ok: false as const, error: "AI non disponibile in questo momento." }
  }
}

export async function updateExperienceAction(_prev: unknown, formData: FormData) {
  const session = await requireSession()
  const businessId = String(formData.get("businessId") || "")
  if (!businessId) return { ok: false as const, error: "Business non valido." }
  const mode = String(formData.get("mode") || "")

  const rawMenuUi = String(formData.get("menuUi") || "")
  const rawScreenUi = String(formData.get("screenUi") || "")
  const rawScreenLayout = String(formData.get("screenLayout") || "")

  let menuUi: z.infer<typeof menuUiSchema> | undefined
  if (rawMenuUi.trim()) {
    let obj: unknown
    try {
      obj = JSON.parse(rawMenuUi)
    } catch {
      return { ok: false as const, error: "Impostazioni menu non valide." }
    }
    const parsed = menuUiSchema.safeParse(obj)
    if (!parsed.success) return { ok: false as const, error: "Impostazioni menu non valide." }
    menuUi = parsed.data
  }

  let screenUi: z.infer<typeof screenUiSchema> | undefined
  if (rawScreenUi.trim()) {
    let obj: unknown
    try {
      obj = JSON.parse(rawScreenUi)
    } catch {
      return { ok: false as const, error: "Impostazioni TV non valide." }
    }
    const parsed = screenUiSchema.safeParse(obj)
    if (!parsed.success) return { ok: false as const, error: "Impostazioni TV non valide." }
    screenUi = parsed.data
  }

  const patch = businessSchema
    .pick({
      primaryColor: true,
      themeMode: true,
      visualStyle: true,
      fontStyle: true
    })
    .safeParse({
      primaryColor: formData.get("primaryColor") || undefined,
      themeMode: formData.get("themeMode"),
      visualStyle: formData.get("visualStyle"),
      fontStyle: formData.get("fontStyle")
    })

  if (!patch.success) return { ok: false as const, error: "Impostazioni di base non valide." }

  const owned = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.userId, isActive: true },
    select: { id: true }
  })
  if (!owned) return { ok: false as const, error: "Business non valido." }

  try {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        primaryColor: patch.data.primaryColor ?? "#111827",
        themeMode: patch.data.themeMode,
        visualStyle: patch.data.visualStyle,
        fontStyle: patch.data.fontStyle,
        ...(menuUi ? { menuUi } : {}),
        ...(screenUi ? { screenUi } : {})
      }
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("Unknown argument `menuUi`") || msg.includes("Unknown argument `screenUi`")) {
      return {
        ok: false as const,
        error:
          "Aggiornamento in corso. Riavvia il server di sviluppo (stop e npm run dev) e ricarica la pagina."
      }
    }
    throw err
  }

  if (rawScreenLayout === "LANDSCAPE_16_9" || rawScreenLayout === "PORTRAIT_9_16") {
    await prisma.screen.updateMany({
      where: { businessId },
      data: { layout: rawScreenLayout }
    })
  }

  if (mode === "autosave") return { ok: true as const }
  redirect("/dashboard/menu")
}
