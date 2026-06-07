import { AppShell } from "@/components/dashboard/app-shell"
import { BusinessForm } from "@/components/dashboard/business-form"
import { requireDashboardContext } from "@/lib/auth/current"
import { updateBusinessAction } from "@/lib/business/actions"

export default async function SettingsPage() {
  const { business } = await requireDashboardContext()

  return (
    <AppShell
      title="Impostazioni"
      brandColor={business.primaryColor}
      description="Personalizza l’identità del locale: logo, cover, colore e stile."
    >
      <BusinessForm
        title="Brand & profilo attività"
        action={updateBusinessAction}
        submitLabel="Salva"
        initial={{
          businessId: business.id,
          name: business.name,
          type: business.type,
          primaryColor: business.primaryColor,
          logoUrl: business.logoUrl,
          coverUrl: business.coverUrl,
          whatsapp: business.whatsapp,
          instagram: business.instagram,
          address: business.address,
          themeMode: business.themeMode,
          visualStyle: business.visualStyle,
          fontStyle: business.fontStyle
        }}
      />
    </AppShell>
  )
}
