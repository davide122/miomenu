"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function toPositiveInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function TableSignGenerator({
  businessName,
  instagram,
  whatsapp,
  address,
  logoUrl,
  primaryColor,
  qrLink
}: {
  businessName: string
  instagram: string | null
  whatsapp: string | null
  address: string | null
  logoUrl: string | null
  primaryColor: string
  qrLink: string
}) {
  const defaultSocialLine = [instagram ? `Instagram ${instagram}` : null, whatsapp ? `WhatsApp ${whatsapp}` : null]
    .filter(Boolean)
    .join("  •  ")

  const [startTable, setStartTable] = useState("1")
  const [endTable, setEndTable] = useState("12")
  const [tableLabel, setTableLabel] = useState("Tavolo")
  const [signTitle, setSignTitle] = useState(businessName)
  const [subtitle, setSubtitle] = useState("Scansiona il QR e consulta il menu digitale")
  const [socialLine, setSocialLine] = useState(defaultSocialLine)
  const [addressLine, setAddressLine] = useState(address ?? "")
  const [widthMm, setWidthMm] = useState("105")
  const [heightMm, setHeightMm] = useState("148")
  const [showAddress, setShowAddress] = useState(Boolean(address))
  const [showSocials, setShowSocials] = useState(Boolean(defaultSocialLine))

  const start = clamp(toPositiveInt(startTable, 1), 1, 500)
  const end = clamp(toPositiveInt(endTable, start), start, 500)
  const width = clamp(toPositiveInt(widthMm, 105), 60, 250)
  const height = clamp(toPositiveInt(heightMm, 148), 60, 250)
  const previewTable = start
  const totalSigns = end - start + 1
  const qrImageUrl = `/api/qrcode?format=png&text=${encodeURIComponent(qrLink)}`

  const printUrl = useMemo(() => {
    const params = new URLSearchParams({
      start: String(start),
      end: String(end),
      width: String(width),
      height: String(height),
      tableLabel,
      title: signTitle,
      subtitle,
      qr: qrLink,
      accent: primaryColor
    })

    if (showSocials && socialLine.trim()) params.set("social", socialLine.trim())
    if (showAddress && addressLine.trim()) params.set("address", addressLine.trim())
    if (logoUrl) params.set("logo", logoUrl)

    return `/dashboard/qrcodes/table-signs/print?${params.toString()}`
  }, [
    addressLine,
    end,
    height,
    logoUrl,
    primaryColor,
    qrLink,
    showAddress,
    showSocials,
    signTitle,
    socialLine,
    start,
    subtitle,
    tableLabel,
    width
  ])

  const aspectRatio = `${width} / ${height}`

  return (
    <section className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Generatore segnatavolo
          </h2>
          <p className="mt-1 text-sm text-muted">
            Crea una grafica elegante per i tavoli con QR menu, numerazione automatica,
            nome attivita`, social e misure personalizzate.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setWidthMm("105")
              setHeightMm("148")
            }}
          >
            Verticale A6
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setWidthMm("148")
              setHeightMm("105")
            }}
          >
            Orizzontale A6
          </Button>
          <Button
            type="button"
            onClick={() => window.open(printUrl, "_blank", "noopener,noreferrer")}
          >
            Scarica PDF
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="startTable">Primo tavolo</Label>
            <Input
              id="startTable"
              inputMode="numeric"
              value={startTable}
              onChange={(e) => setStartTable(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endTable">Ultimo tavolo</Label>
            <Input
              id="endTable"
              inputMode="numeric"
              value={endTable}
              onChange={(e) => setEndTable(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tableLabel">Etichetta numerazione</Label>
            <Input
              id="tableLabel"
              value={tableLabel}
              onChange={(e) => setTableLabel(e.target.value)}
              placeholder="Tavolo"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="signTitle">Nome attivita`</Label>
            <Input
              id="signTitle"
              value={signTitle}
              onChange={(e) => setSignTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="subtitle">Sottotitolo / CTA</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="widthMm">Larghezza (mm)</Label>
            <Input
              id="widthMm"
              inputMode="numeric"
              value={widthMm}
              onChange={(e) => setWidthMm(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="heightMm">Altezza (mm)</Label>
            <Input
              id="heightMm"
              inputMode="numeric"
              value={heightMm}
              onChange={(e) => setHeightMm(e.target.value)}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="socialLine">Social</Label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={showSocials}
                  onChange={(e) => setShowSocials(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-[color:var(--accent)] focus:ring-[color:var(--accent)]/20"
                />
                Mostra social
              </label>
            </div>
            <Input
              id="socialLine"
              value={socialLine}
              onChange={(e) => setSocialLine(e.target.value)}
              placeholder="Instagram @nome • WhatsApp +39..."
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="addressLine">Indirizzo</Label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={showAddress}
                  onChange={(e) => setShowAddress(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-[color:var(--accent)] focus:ring-[color:var(--accent)]/20"
                />
                Mostra indirizzo
              </label>
            </div>
            <Input
              id="addressLine"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="Via Roma 10, Milano"
            />
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted sm:col-span-2">
            Verranno generati <span className="font-semibold text-foreground">{totalSigns}</span>{" "}
            segnatavolo, dal {tableLabel.toLowerCase() || "tavolo"} {start} al {end}.
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-surface-muted p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Anteprima live</p>
              <p className="text-xs text-muted">
                Proporzione reale {width} x {height} mm
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.open(printUrl, "_blank", "noopener,noreferrer")}
            >
              Apri stampa
            </Button>
          </div>

          <div className="grid place-items-center rounded-[24px] border border-dashed border-border bg-white/60 p-4">
            <div
              className="w-full max-w-[420px]"
              style={{ aspectRatio }}
            >
              <div
                className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.15)]"
              >
                <div
                  className="rounded-[24px] p-5 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, #111827)`
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.32em] text-white/70">
                        {tableLabel || "Tavolo"}
                      </p>
                      <p className="mt-2 text-4xl font-semibold leading-none">
                        {previewTable}
                      </p>
                    </div>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={signTitle}
                        className="h-14 w-14 rounded-2xl border border-white/15 object-cover"
                      />
                    ) : null}
                  </div>

                  <h3 className="mt-6 text-2xl font-semibold leading-tight tracking-tight">
                    {signTitle}
                  </h3>
                  <p className="mt-2 max-w-[26ch] text-sm leading-6 text-white/80">{subtitle}</p>
                </div>

                <div className="mt-5 grid flex-1 gap-4 sm:grid-cols-[1fr_148px] sm:items-center">
                  <div className="space-y-3">
                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Menu digitale
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      Inquadra il QR per sfogliare il menu, scoprire promo e consultare i
                      dettagli dei piatti direttamente dal tavolo.
                    </p>
                    {showSocials && socialLine.trim() ? (
                      <p className="text-sm font-medium leading-6 text-slate-700">{socialLine}</p>
                    ) : null}
                    {showAddress && addressLine.trim() ? (
                      <p className="text-sm leading-6 text-slate-500">{addressLine}</p>
                    ) : null}
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <img src={qrImageUrl} alt="QR menu" className="mx-auto h-full w-full rounded-2xl" />
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                  PDF pronto da stampare o salvare con il tuo browser
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
