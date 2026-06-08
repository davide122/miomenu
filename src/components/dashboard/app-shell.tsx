import Link from "next/link"
import { redirect } from "next/navigation"

import { logoutAction } from "@/lib/auth/actions"
import { getSession } from "@/lib/auth/session"
import { DashboardBottomNav, DashboardSidebarNav, type DashboardNavItem } from "@/components/dashboard/dashboard-nav"

const navItems: DashboardNavItem[] = [
  { href: "/dashboard", label: "Panoramica", icon: "home" },
  { href: "/dashboard/menu", label: "Menu", icon: "menu" },
  { href: "/dashboard/categories", label: "Categorie", icon: "categories" },
  { href: "/dashboard/products", label: "Prodotti", icon: "products" },
  { href: "/dashboard/orders", label: "Comande", icon: "orders" },
  { href: "/dashboard/promotions", label: "Promo", icon: "promotions" },
  { href: "/dashboard/ai", label: "AI", icon: "ai" },
  { href: "/dashboard/media", label: "Media", icon: "media" },
  { href: "/dashboard/qrcodes", label: "QR Code", icon: "qrcode" },
  { href: "/dashboard/screens", label: "Schermi", icon: "screens" },
  { href: "/dashboard/schedules", label: "Programmazione", icon: "schedule" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "analytics" },
  { href: "/dashboard/billing", label: "Abbonamento", icon: "billing" },
  { href: "/dashboard/settings", label: "Impostazioni", icon: "settings" }
]

const mobileNavItems: DashboardNavItem[] = [
  navItems.find((i) => i.href === "/dashboard")!,
  navItems.find((i) => i.href === "/dashboard/products")!,
  navItems.find((i) => i.href === "/dashboard/promotions")!,
  navItems.find((i) => i.href === "/dashboard/orders")!,
  navItems.find((i) => i.href === "/dashboard/settings")!
]

export async function AppShell({
  title,
  brandColor,
  description,
  actions,
  children
}: {
  title: string
  brandColor?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div
      className="min-h-screen bg-background"
      style={
        brandColor
          ? ({
              ["--brand" as never]: brandColor,
              ["--accent" as never]: brandColor
            } as never)
          : undefined
      }
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 2xl:max-w-screen-2xl">
        <div className="grid gap-6 lg:grid-cols-[248px_1fr] lg:items-start">
          <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] lg:flex">
            <div className="flex w-full flex-col gap-2 rounded-3xl border border-border bg-surface-glass p-2 shadow-soft backdrop-blur-xl">
              <Link
                href="/dashboard"
                className="flex h-12 items-center justify-between gap-3 rounded-2xl border border-transparent px-3 text-sm font-semibold tracking-tight text-foreground hover:bg-surface-muted"
                title="yourMenu"
              >
                <span className="tracking-tight">yourMenu</span>
                <span className="rounded-full border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-muted">
                  yM
                </span>
              </Link>

              <DashboardSidebarNav items={navItems} />

              <div className="mt-auto w-full">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    title="Esci"
                    className="flex h-12 w-full items-center gap-3 rounded-2xl border border-transparent px-3 text-muted transition-colors duration-200 hover:bg-surface-muted hover:text-foreground"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                      <path
                        d="M10 7H6.5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2H10"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <path
                        d="M13 8.5 16.5 12 13 15.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16.5 12H9"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-sm font-medium">Esci</span>
                  </button>
                </form>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="sticky top-4 z-20 -mx-4 sm:-mx-6 lg:-mx-8">
              <div className="mx-4 rounded-3xl border border-border bg-surface-glass px-4 py-4 shadow-soft backdrop-blur-xl sm:mx-6 sm:px-6 lg:mx-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-[28px] font-semibold leading-[36px] tracking-tight text-foreground sm:text-[32px] sm:leading-[40px]">
                      {title}
                    </h1>
                    <p className="mt-1 text-[15px] leading-6 text-muted">
                      {description ?? "Gestisci il tuo menu con un flusso semplice e veloce."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {actions}
                    <form action={logoutAction} className="lg:hidden">
                      <button
                        type="submit"
                        className="h-11 rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-muted"
                      >
                        Esci
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pb-28 lg:pb-0">{children}</div>
          </section>
        </div>
      </div>

      <div className="fixed bottom-3 left-0 right-0 z-30 lg:hidden">
        <div className="mx-auto w-full max-w-md px-4">
          <DashboardBottomNav items={mobileNavItems} />
        </div>
      </div>
    </div>
  )
}
