"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999).optional()
})

export async function createCategoryAction(formData: FormData) {
  const { business } = await requireDashboardContext()
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    sortOrder: formData.get("sortOrder") || undefined
  })
  if (!parsed.success) redirect("/dashboard/categories")

  await prisma.category.create({
    data: {
      businessId: business.id,
      name: parsed.data.name,
      description: parsed.data.description ? parsed.data.description : null,
      sortOrder: parsed.data.sortOrder ?? 0
    }
  })

  redirect("/dashboard/categories")
}

export async function toggleCategoryVisibilityAction(formData: FormData) {
  const { business } = await requireDashboardContext()
  const categoryId = String(formData.get("categoryId") || "")
  if (!categoryId) redirect("/dashboard/categories")

  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId: business.id }
  })
  if (!category) redirect("/dashboard/categories")

  await prisma.category.update({
    where: { id: category.id },
    data: { isVisible: !category.isVisible }
  })

  redirect("/dashboard/categories")
}

export async function deleteCategoryAction(formData: FormData) {
  const { business } = await requireDashboardContext()
  const categoryId = String(formData.get("categoryId") || "")
  if (!categoryId) redirect("/dashboard/categories")

  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId: business.id }
  })
  if (!category) redirect("/dashboard/categories")

  await prisma.category.delete({ where: { id: category.id } })

  redirect("/dashboard/categories")
}

export async function moveCategoryAction(formData: FormData) {
  const { business } = await requireDashboardContext()
  const categoryId = String(formData.get("categoryId") || "")
  const direction = String(formData.get("direction") || "")
  if (!categoryId) redirect("/dashboard/categories")
  if (direction !== "UP" && direction !== "DOWN") redirect("/dashboard/categories")

  const current = await prisma.category.findFirst({
    where: { id: categoryId, businessId: business.id },
    select: { id: true, sortOrder: true }
  })
  if (!current) redirect("/dashboard/categories")

  const neighbor =
    direction === "UP"
      ? await prisma.category.findFirst({
          where: { businessId: business.id, sortOrder: { lt: current.sortOrder } },
          orderBy: { sortOrder: "desc" },
          select: { id: true, sortOrder: true }
        })
      : await prisma.category.findFirst({
          where: { businessId: business.id, sortOrder: { gt: current.sortOrder } },
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true }
        })

  if (!neighbor) redirect("/dashboard/categories")

  await prisma.$transaction([
    prisma.category.update({
      where: { id: current.id },
      data: { sortOrder: neighbor.sortOrder }
    }),
    prisma.category.update({
      where: { id: neighbor.id },
      data: { sortOrder: current.sortOrder }
    })
  ])

  redirect("/dashboard/categories")
}
