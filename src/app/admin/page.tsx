import { redirect } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/auth/current"

export default async function AdminPage() {
  const session = await requireSession()
  if (session.role !== "SUPER_ADMIN") redirect("/dashboard")

  const [businesses, users] = await Promise.all([
    prisma.business.count(),
    prisma.user.count()
  ])

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-sm text-muted">Controllo piattaforma.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Attività</CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <p className="text-3xl font-semibold tracking-tight">{businesses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Utenti</CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <p className="text-3xl font-semibold tracking-tight">{users}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

