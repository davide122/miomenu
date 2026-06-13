import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { getDashboardBusinessOrNull } from "@/lib/auth/current"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const business = await getDashboardBusinessOrNull()

  if (!business) {
    return children
  }

  return <DashboardShell brandColor={business.primaryColor}>{children}</DashboardShell>
}
