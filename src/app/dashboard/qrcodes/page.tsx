import Image from "next/image"

import { AppShell } from "@/components/dashboard/app-shell"
import { ButtonLink } from "@/components/ui/button"
import { prisma } from "@/lib/db"
import { requireDashboardContext } from "@/lib/auth/current"
import { appUrl } from "@/lib/url"
import { qrDataUrl } from "@/lib/qrcode"

export default async function QrCodesPage() {
  const { business } = await requireDashboardContext()

  const qr =
    (await prisma.qrCode.findFirst({
      where: { businessId: business.id, type: "GENERAL" }
    })) ??
    (await prisma.qrCode.create({
      data: {
        businessId: business.id,
        type: "GENERAL",
        targetUrl: `/menu/${business.slug}`
      }
    }))

  const qrLink = `${appUrl()}/q/${qr.id}`
  const dataUrl = await qrDataUrl(qrLink)

  const pngHref = `/api/qrcode?format=png&text=${encodeURIComponent(qrLink)}`
  const svgHref = `/api/qrcode?format=svg&text=${encodeURIComponent(qrLink)}`

  return (
    <AppShell
      title="QR Code"
      brandColor={business.primaryColor}
      description="Genera e scarica il QR generale del locale: punta al menu e traccia le scansioni."
      actions={<ButtonLink href={`/menu/${business.slug}`} variant="secondary">Apri menu</ButtonLink>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <section className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                QR generale
              </h2>
              <p className="mt-1 text-sm text-muted">
                Mostralo su tavoli, vetrina o cassa. Aggiorna sempre lo stesso menu.
              </p>
            </div>
          </div>

          <div className="mt-5 grid place-items-center rounded-3xl border border-border bg-surface-muted p-6">
            <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
              <Image
                src={dataUrl}
                alt="QR code"
                width={260}
                height={260}
                className="mx-auto"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink href={pngHref} variant="secondary">
              Scarica PNG
            </ButtonLink>
            <ButtonLink href={svgHref} variant="secondary">
              Scarica SVG
            </ButtonLink>
          </div>
        </section>

        <aside className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Dettagli
          </h2>
          <p className="mt-1 text-sm text-muted">URL del QR:</p>
          <p className="mt-3 break-all rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground">
            {qrLink}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-muted px-4 py-3">
            <p className="text-sm text-muted">Scansioni totali</p>
            <p className="text-sm font-semibold text-foreground">{qr.scans}</p>
          </div>

          <div className="mt-4 grid gap-2">
            <ButtonLink href={`/screen/${business.slug}`} variant="secondary">
              Apri TV Mode
            </ButtonLink>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}
