import { redirect } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSession } from "@/lib/auth/current"

export default async function AdminPlansPage() {
  const session = await requireSession()
  if (session.role !== "SUPER_ADMIN") redirect("/dashboard")

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Piani</h1>
        <p className="mt-2 text-sm text-muted">Predisposizione SaaS.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Free",
              price: "0€",
              features: [
                "Menu pubblico",
                "QR Code",
                "Fino a 5 prodotti",
                "Foto prodotti",
                "Senza video"
              ]
            },
            {
              name: "Premium",
              price: "8€/mese",
              features: [
                "Tutto integrato",
                "Prodotti illimitati",
                "Video prodotti",
                "Schermi / TV Mode",
                "Programmazione"
              ]
            },
            {
              name: "Gold",
              price: "12€/mese",
              features: [
                "Tutto Premium",
                "AI integrata",
                "Supporto prioritario"
              ]
            }
          ].map((p) => (
            <Card key={p.name}>
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                <p className="text-2xl font-semibold tracking-tight">{p.price}</p>
                <ul className="mt-4 grid gap-2 text-sm text-muted">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
