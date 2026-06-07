"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"

const upsertSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  code: z.string().min(2).max(24),
  title: z.string().min(2).max(48),
  description: z.string().optional().or(z.literal("")),
  discountPercent: z.coerce.number().int().min(1).max(90).optional(),
  active: z.string().optional()
})

export async function upsertPromotionAction(_prev: unknown, formData: FormData) {
  const { business } = await requireDashboardContext()
  const parsed = upsertSchema.safeParse({
    id: formData.get("id") || undefined,
    code: formData.get("code"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    discountPercent: formData.get("discountPercent") || undefined,
    active: formData.get("active") || undefined
  })

  if (!parsed.success) return { ok: false as const, error: "Dati non validi." }

  const code = parsed.data.code.trim().toUpperCase().replace(/\s+/g, "")
  const title = parsed.data.title.trim()
  const description = parsed.data.description ? parsed.data.description.trim() : ""
  const active = parsed.data.active === "on"
  const discountPercent = parsed.data.discountPercent ?? null

  const id = (parsed.data.id ?? "").trim()
  if (id) {
    await prisma.promotion.update({
      where: { id },
      data: {
        code,
        title,
        description: description ? description : null,
        discountPercent,
        active
      }
    })
    redirect("/dashboard/promotions")
  }

  await prisma.promotion.create({
    data: {
      businessId: business.id,
      code,
      title,
      description: description ? description : null,
      discountPercent,
      active
    }
  })

  redirect("/dashboard/promotions")
}

export async function upsertPromotionFormAction(formData: FormData): Promise<void> {
  const res = await upsertPromotionAction(undefined, formData)
  if (res && "ok" in res && res.ok === false) {
    redirect(`/dashboard/promotions?error=${encodeURIComponent(res.error)}`)
  }
  redirect("/dashboard/promotions")
}

export async function deletePromotionAction(formData: FormData) {
  const { business } = await requireDashboardContext()
  const id = String(formData.get("id") || "")
  if (!id) redirect("/dashboard/promotions")

  const promo = await prisma.promotion.findFirst({ where: { id, businessId: business.id } })
  if (!promo) redirect("/dashboard/promotions")

  await prisma.promotion.delete({ where: { id: promo.id } })
  redirect("/dashboard/promotions")
}
