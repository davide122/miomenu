import { redirect } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/auth/current"

export default async function AdminUsersPage() {
  const session = await requireSession()
  if (session.role !== "SUPER_ADMIN") redirect("/dashboard")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50
  })

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Utenti</h1>
        <p className="mt-2 text-sm text-muted">Ultimi 50 utenti.</p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Lista</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="grid gap-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {u.name ? u.name : u.email}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">{u.email}</p>
                  </div>
                  <div className="text-xs text-muted">{u.role}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

