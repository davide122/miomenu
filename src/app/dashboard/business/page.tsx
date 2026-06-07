import { redirect } from "next/navigation"

import { BusinessForm } from "@/components/dashboard/business-form"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/auth/current"
import { createBusinessAction } from "@/lib/business/actions"

export default async function BusinessOnboardingPage() {
  const session = await requireSession()

  const existing = await prisma.business.findFirst({
    where: { ownerId: session.userId }
  })

  if (existing) redirect("/dashboard/settings")

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-5 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <BusinessForm
            title="Crea la tua attività"
            action={createBusinessAction}
            submitLabel="Crea attività"
            initial={{
              type: "ALTRO",
              primaryColor: "#111827",
              themeMode: "LIGHT",
              visualStyle: "MINIMAL",
              fontStyle: "INTER"
            }}
          />

          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold">Risultato premium</p>
              <p className="mt-2 text-sm text-muted">
                Poche scelte, ma fatte bene. Imposti il brand una volta e lo
                ritrovi su QR, menu pubblico e TV Mode.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
