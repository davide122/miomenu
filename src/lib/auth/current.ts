import { cache } from "react"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth/session"

const dashboardUserSelect = {
  id: true,
  email: true,
  name: true
} as const

const dashboardBusinessSelect = {
  id: true,
  ownerId: true,
  name: true,
  slug: true,
  type: true,
  plan: true,
  stripeCustomerId: true,
  primaryColor: true,
  themeMode: true,
  visualStyle: true,
  fontStyle: true,
  menuUi: true,
  screenUi: true,
  logoUrl: true,
  coverUrl: true,
  whatsapp: true,
  instagram: true,
  address: true
} as const

export const getDashboardBusinessOrNull = cache(async function getDashboardBusinessOrNull() {
  const session = await requireSession()
  return (
    (session.businessId
      ? await prisma.business.findFirst({
          where: { id: session.businessId, ownerId: session.userId, isActive: true },
          select: dashboardBusinessSelect
        })
      : null) ??
    (await prisma.business.findFirst({
      where: { ownerId: session.userId, isActive: true },
      select: dashboardBusinessSelect
    }))
  )
})

export const requireSession = cache(async function requireSession() {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
})

export const requireDashboardContext = cache(async function requireDashboardContext() {
  const startedAt = Date.now()
  // #region debug-point B:dashboard-context-start
  void fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "dashboard-tab-lag",
      runId: "post-fix",
      hypothesisId: "B",
      location: "src/lib/auth/current.ts:requireDashboardContext:start",
      msg: "[DEBUG] dashboard context start",
      data: { startedAt },
      ts: Date.now()
    })
  }).catch(() => {})
  // #endregion

  const session = await requireSession()

  const [user, business] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: dashboardUserSelect
    }),
    getDashboardBusinessOrNull()
  ])
  if (!user) redirect("/login")

  if (!business) redirect("/dashboard/business")

  // #region debug-point B:dashboard-context-end
  void fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "dashboard-tab-lag",
      runId: "post-fix",
      hypothesisId: "B",
      location: "src/lib/auth/current.ts:requireDashboardContext:end",
      msg: "[DEBUG] dashboard context end",
      data: {
        durationMs: Date.now() - startedAt,
        hasSessionBusinessId: Boolean(session.businessId),
        reusedSessionBusiness: Boolean(session.businessId),
        businessId: business.id
      },
      ts: Date.now()
    })
  }).catch(() => {})
  // #endregion

  return { session, user, business }
})
