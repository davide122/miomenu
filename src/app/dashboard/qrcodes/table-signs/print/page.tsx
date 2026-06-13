import { TableSignPrintTrigger } from "@/components/dashboard/table-sign-print-trigger"

function parsePositiveInt(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(raw ?? "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function parseText(value: string | string[] | undefined, fallback = "") {
  const raw = Array.isArray(value) ? value[0] : value
  return (raw ?? fallback).trim()
}

export default async function TableSignsPrintPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = searchParams ? await searchParams : {}
  const start = clamp(parsePositiveInt(sp.start, 1), 1, 500)
  const end = clamp(parsePositiveInt(sp.end, 12), start, 500)
  const width = clamp(parsePositiveInt(sp.width, 105), 60, 250)
  const height = clamp(parsePositiveInt(sp.height, 148), 60, 250)
  const title = parseText(sp.title, "yourMenu")
  const subtitle = parseText(sp.subtitle, "Scansiona il QR per consultare il menu")
  const tableLabel = parseText(sp.tableLabel, "Tavolo")
  const qr = parseText(sp.qr)
  const accent = parseText(sp.accent, "#111827")
  const social = parseText(sp.social)
  const address = parseText(sp.address)
  const logo = parseText(sp.logo)

  const numbers = Array.from({ length: end - start + 1 }, (_, index) => start + index)
  const qrImageUrl = `/api/qrcode?format=png&text=${encodeURIComponent(qr)}`

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 print:bg-white print:px-0 print:py-0">
      <TableSignPrintTrigger />

      <div className="mx-auto flex w-full max-w-6xl flex-wrap justify-center gap-4 print:max-w-none print:gap-0">
        {numbers.map((tableNumber) => (
          <article
            key={tableNumber}
            className="m-[4mm] overflow-hidden rounded-[7mm] border border-slate-200 bg-white text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.12)] break-inside-avoid print:shadow-none"
            style={{ width: `${width}mm`, height: `${height}mm` }}
          >
            <div
              className="m-[6mm] rounded-[6mm] px-[6mm] py-[5mm] text-white"
              style={{
                background: `linear-gradient(135deg, ${accent}, #111827)`
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[2.6mm] uppercase tracking-[0.32em] text-white/75">
                    {tableLabel}
                  </p>
                  <p className="mt-[2mm] text-[10mm] font-semibold leading-none">{tableNumber}</p>
                </div>
                {logo ? (
                  <img
                    src={logo}
                    alt={title}
                    className="h-[16mm] w-[16mm] rounded-[4mm] border border-white/15 object-cover"
                  />
                ) : null}
              </div>
              <h1 className="mt-[6mm] text-[6mm] font-semibold leading-tight tracking-tight">
                {title}
              </h1>
              <p className="mt-[2mm] max-w-[34mm] text-[3.1mm] leading-[1.5] text-white/80">
                {subtitle}
              </p>
            </div>

            <div className="grid gap-[4mm] px-[6mm] pb-[6mm] sm:grid-cols-[1fr_38mm] sm:items-center">
              <div>
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-[3mm] py-[1.5mm] text-[2.6mm] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Menu digitale
                </div>
                <p className="mt-[3mm] text-[3.2mm] leading-[1.65] text-slate-600">
                  Inquadra il QR per aprire il menu, vedere piatti, promo e dettagli dal
                  tavolo.
                </p>
                {social ? (
                  <p className="mt-[3mm] text-[3.1mm] font-medium leading-[1.55] text-slate-700">
                    {social}
                  </p>
                ) : null}
                {address ? (
                  <p className="mt-[2mm] text-[2.9mm] leading-[1.55] text-slate-500">{address}</p>
                ) : null}
              </div>

              <div className="rounded-[5mm] border border-slate-200 bg-slate-50 p-[3.5mm]">
                <img src={qrImageUrl} alt={`QR menu ${tableNumber}`} className="h-full w-full rounded-[4mm]" />
              </div>
            </div>
          </article>
        ))}
      </div>

      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        @media print {
          body {
            background: white;
          }
        }
      `}</style>
    </main>
  )
}
