"use client"

import { useState } from "react"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MediaUploader } from "@/components/media/media-uploader"

type ActionResult = { ok: false; error: string } | undefined

export function BusinessForm({
  title,
  action,
  submitLabel,
  initial
}: {
  title: string
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  submitLabel: string
  initial?: {
    businessId?: string
    name?: string
    type?: string
    primaryColor?: string
    logoUrl?: string | null
    coverUrl?: string | null
    whatsapp?: string | null
    instagram?: string | null
    address?: string | null
    themeMode?: string
    visualStyle?: string
    fontStyle?: string
  }
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const selectClass =
    "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none transition-colors duration-200 focus:border-[color:var(--accent)]/35 focus:ring-2 focus:ring-[color:var(--accent)]/15"
  const [primaryColor, setPrimaryColor] = useState(initial?.primaryColor ?? "#111111")

  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Poche scelte, ma fatte bene. Così il menu resta sempre elegante.
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-6 grid gap-6">
          {initial?.businessId ? (
            <input type="hidden" name="businessId" value={initial.businessId} />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome attività</Label>
              <Input
                id="name"
                name="name"
                defaultValue={initial?.name ?? ""}
                placeholder="Gelateria Milano"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo attività</Label>
              <select
                id="type"
                name="type"
                defaultValue={initial?.type ?? "ALTRO"}
                className={selectClass}
              >
                <option value="RISTORANTE">Ristorante</option>
                <option value="GELATERIA">Gelateria</option>
                <option value="BAR">Bar</option>
                <option value="PUB">Pub</option>
                <option value="PASTICCERIA">Pasticceria</option>
                <option value="ALTRO">Altro</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="primaryColor">Colore principale</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  aria-label="Colore principale"
                  onChange={(e) => setPrimaryColor(e.currentTarget.value)}
                  className="h-11 w-11 cursor-pointer rounded-2xl border border-border bg-surface p-1"
                />
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.currentTarget.value)}
                  placeholder="#111111"
                />
              </div>
              <p className="text-xs text-muted">
                Suggerimento: scegli un colore scuro e usalo solo per CTA e stati attivi.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="visualStyle">Stile menu</Label>
              <select
                id="visualStyle"
                name="visualStyle"
                defaultValue={initial?.visualStyle ?? "MINIMAL"}
                className={selectClass}
              >
                <option value="MINIMAL">Minimal</option>
                <option value="ELEGANT">Elegant</option>
                <option value="MODERN">Modern</option>
                <option value="STREET">Street</option>
                <option value="LUXURY">Luxury</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="themeMode">Tema</Label>
              <select
                id="themeMode"
                name="themeMode"
                defaultValue={initial?.themeMode ?? "LIGHT"}
                className={selectClass}
              >
                <option value="LIGHT">Chiaro</option>
                <option value="DARK">Scuro</option>
              </select>
            </div>
          </div>

          <MediaUploader
            label="Logo"
            description="Consigliato: PNG/JPG quadrato."
            accept="image/*"
            previewFit="contain"
            nameUrl="logoUrl"
            defaultUrl={initial?.logoUrl ?? ""}
            businessId={initial?.businessId}
          />

          <MediaUploader
            label="Cover"
            description="Immagine orizzontale per header del menu."
            accept="image/*"
            nameUrl="coverUrl"
            defaultUrl={initial?.coverUrl ?? ""}
            businessId={initial?.businessId}
          />

          <div className="grid gap-2">
            <Label htmlFor="fontStyle">Font</Label>
            <select
              id="fontStyle"
              name="fontStyle"
              defaultValue={initial?.fontStyle ?? "INTER"}
              className={selectClass}
            >
              <option value="INTER">Inter</option>
              <option value="SYSTEM">System</option>
              <option value="GEIST">Geist</option>
            </select>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp (opzionale)</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={initial?.whatsapp ?? ""}
                placeholder="+39..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instagram">Instagram (opzionale)</Label>
              <Input
                id="instagram"
                name="instagram"
                defaultValue={initial?.instagram ?? ""}
                placeholder="@nome"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Indirizzo (opzionale)</Label>
            <Input
              id="address"
              name="address"
              defaultValue={initial?.address ?? ""}
              placeholder="Via..."
            />
          </div>

          {state?.error ? (
            <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
              {state.error}
            </div>
          ) : null}

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={pending}>
              {submitLabel}
            </Button>
          </div>
        </form>
    </div>
  )
}
