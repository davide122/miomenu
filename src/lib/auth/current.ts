import { redirect } from "next/navigation"

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth/session"

export async function requireSession() {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

export async function requireDashboardContext() {
  const session = await requireSession()

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  })
  if (!user) redirect("/login")

  const businessId =
    session.businessId ??
    (await prisma.business
      .findFirst({ where: { ownerId: user.id }, select: { id: true } })
      .then((b) => b?.id ?? null))

  if (!businessId) redirect("/dashboard/business")

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: user.id, isActive: true }
  })
  if (!business) redirect("/dashboard/business")

  return { session, user, business }
}

