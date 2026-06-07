"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState, useTransition, useActionState } from "react"

import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MediaUploader } from "@/components/media/media-uploader"
import { cn } from "@/lib/cn"

type ActionResult =
  | {
      ok: true
      status: "SKIPPED" | "CREATED" | "UPDATED"
      productId?: string
      categoryId?: string
      categoryName?: string
    }
  | { ok: false; error: string }
  | undefined

export function ProductForm({
  title,
  submitLabel,
  action,
  categories,
  businessId,
  plan,
  initial
}: {
  title: string
  submitLabel: string
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  categories: Array<{ id: string; name: string }>
  businessId?: string
  plan?: "FREE" | "PREMIUM" | "GOLD"
  initial?: {
    productId?: string
    categoryId?: string
    name?: string
    shortDescription?: string | null
    description?: string | null
    price?: string | null
    ingredients?: string | null
    allergens?: string
    sortOrder?: number
    isAvailable?: boolean
    isFeatured?: boolean
    isNew?: boolean
    isPromo?: boolean
    imageUrl?: string | null
    imageUrl2?: string | null
    imageUrl3?: string | null
    imageUrl4?: string | null
    videoUrl?: string | null
  }
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [isAutosavePending, startTransition] = useTransition()
  const pendingAny = pending || isAutosavePending

  const formRef = useRef<HTMLFormElement | null>(null)
  const autosaveTimerRef = useRef<number | null>(null)
  const mediaRef = useRef<HTMLDivElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)

  const defaultMode = initial?.productId ? "FULL" : "QUICK"
  const [uiMode, setUiMode] = useState<"QUICK" | "FULL">(defaultMode)
  const [detailsOpen, setDetailsOpen] = useState(defaultMode === "FULL")
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  const initialCategoryName = useMemo(() => {
    const byId = initial?.categoryId
      ? categories.find((c) => c.id === initial.categoryId)?.name ?? ""
      : ""
    return byId
  }, [categories, initial?.categoryId])

  const [productId, setProductId] = useState(initial?.productId ?? "")
  const [resolvedCategoryId, setResolvedCategoryId] = useState(initial?.categoryId ?? "")
  const [categoryName, setCategoryName] = useState(initialCategoryName)
  const [resolvedCategoryName, setResolvedCategoryName] = useState(initialCategoryName)

  const [previewName, setPreviewName] = useState(initial?.name ?? "")
  const [previewShort, setPreviewShort] = useState(initial?.shortDescription ?? "")
  const [previewPrice, setPreviewPrice] = useState(initial?.price ?? "")
  const [previewAvailable, setPreviewAvailable] = useState(initial?.isAvailable ?? true)
  const [previewFeatured, setPreviewFeatured] = useState(initial?.isFeatured ?? false)
  const [previewNew, setPreviewNew] = useState(initial?.isNew ?? false)
  const [previewPromo, setPreviewPromo] = useState(initial?.isPromo ?? false)
  const [previewImageUrl, setPreviewImageUrl] = useState(initial?.imageUrl ?? "")
  const [previewVideoUrl, setPreviewVideoUrl] = useState(plan === "FREE" ? "" : (initial?.videoUrl ?? ""))
  const videoEnabled = plan !== "FREE"

  const categoryLabel = resolvedCategoryName.trim() ? resolvedCategoryName : categoryName.trim()

  const extraPhotosDefaultOpen = Boolean(
    (initial?.imageUrl2 ?? "").trim() ||
      (initial?.imageUrl3 ?? "").trim() ||
      (initial?.imageUrl4 ?? "").trim()
  )

  function PreviewCard({ variant }: { variant: "desktop" | "mobile" }) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-border bg-surface shadow-soft",
          variant === "desktop" ? "p-5 sm:p-6" : "p-4"
        )}
      >
        <p className="text-sm font-medium text-muted">Anteprima</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          {previewName.trim() ? previewName : "Nome prodotto"}
        </p>
        <p className="mt-1 text-sm text-muted">{categoryLabel ? categoryLabel : "Categoria"}</p>

        <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-surface-muted">
          {previewVideoUrl ? (
            <video
              src={previewVideoUrl}
              className="h-56 w-full object-cover"
              muted
              playsInline
              controls
            />
          ) : previewImageUrl ? (
            <div className="relative h-56 w-full">
              <Image
                src={previewImageUrl}
                alt="Anteprima"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 420px"
                unoptimized
              />
            </div>
          ) : (
            <div className="h-56 w-full bg-[color:var(--accent)]/5" />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!previewAvailable ? (
            <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted">
              Non disponibile
            </span>
          ) : null}
          {previewFeatured ? (
            <span className="rounded-full border border-transparent bg-[color:var(--accent)] px-2.5 py-1 text-xs font-medium text-white">
              In evidenza
            </span>
          ) : null}
          {previewNew ? (
            <span className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
              Novità
            </span>
          ) : null}
          {previewPromo ? (
            <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
              Promo
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-foreground">
          {previewShort.trim() ? previewShort : "Descrizione breve del prodotto."}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-muted px-4 py-3">
          <p className="text-sm text-muted">Prezzo</p>
          <p className="text-sm font-semibold text-foreground">
            {previewPrice.trim() ? `€ ${previewPrice.trim()}` : "—"}
          </p>
        </div>
      </div>
    )
  }

  function pillClass(active: boolean) {
    return cn(
      "inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-200",
      active
        ? "border-transparent bg-[color:var(--accent)] text-white"
        : "border-border bg-surface text-foreground hover:bg-surface-muted"
    )
  }

  function scheduleAutosave() {
    if (!formRef.current) return
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = window.setTimeout(() => {
      if (!formRef.current) return
      const fd = new FormData(formRef.current)
      fd.set("mode", "autosave")
      startTransition(() => {
        formAction(fd)
      })
    }, 650)
  }

  useEffect(() => {
    if (!state) return
    if (!state.ok) return

    if (state.productId && state.productId !== productId) setProductId(state.productId)
    if (state.categoryId) setResolvedCategoryId(state.categoryId)
    if (state.categoryName) setResolvedCategoryName(state.categoryName)
  }, [productId, state])

  useEffect(() => {
    setDetailsOpen(uiMode === "FULL")
  }, [uiMode])

  useEffect(() => {
    if (!state) return
    if (!("ok" in state) || !state.ok) return
    if (state.status !== "CREATED") return
    if (uiMode !== "QUICK") return
    mediaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [state, uiMode])

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current)
    }
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
      <form
        ref={formRef}
        action={formAction}
        onInputCapture={scheduleAutosave}
        onChangeCapture={scheduleAutosave}
        className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6"
      >
          <input type="hidden" name="mode" value="submit" />
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="categoryId" value={resolvedCategoryId} />

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Compila il minimo. Il salvataggio è automatico.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "hidden h-10 items-center rounded-full border px-4 text-sm font-semibold sm:inline-flex",
                  pendingAny
                    ? "border-border bg-surface text-foreground"
                    : state && "ok" in state && state.ok && state.status !== "SKIPPED"
                      ? "border-transparent bg-[color:var(--accent)] text-white"
                      : state && "ok" in state && state.ok === false
                        ? "border-border bg-surface text-foreground"
                        : "border-border bg-surface text-foreground"
                )}
              >
                {pendingAny
                  ? "Salvataggio..."
                  : state && "ok" in state && state.ok && state.status !== "SKIPPED"
                    ? "Salvato"
                    : "Pronto"}
              </div>
              <ButtonLink href="/dashboard/categories" variant="secondary" size="sm">
                Categorie
              </ButtonLink>
              <Button type="submit" disabled={pendingAny} size="sm">
                {submitLabel}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setUiMode("QUICK")}
              className={cn(
                "h-10 rounded-full border px-4 text-sm font-semibold transition-colors duration-200",
                uiMode === "QUICK"
                  ? "border-transparent bg-[color:var(--accent)] text-white"
                  : "border-border bg-surface text-foreground hover:bg-surface-muted"
              )}
            >
              Rapido
            </button>
            <button
              type="button"
              onClick={() => setUiMode("FULL")}
              className={cn(
                "h-10 rounded-full border px-4 text-sm font-semibold transition-colors duration-200",
                uiMode === "FULL"
                  ? "border-transparent bg-[color:var(--accent)] text-white"
                  : "border-border bg-surface text-foreground hover:bg-surface-muted"
              )}
            >
              Completo
            </button>
            <p className="text-xs text-muted">
              {uiMode === "QUICK"
                ? "Nome, categoria, prezzo e foto: fatto."
                : "Tutte le opzioni disponibili."}
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome prodotto</Label>
              <Input
                id="name"
                name="name"
                defaultValue={previewName}
                placeholder="Spritz"
                onChange={(e) => setPreviewName(e.currentTarget.value)}
                required
              />
              <p className="text-xs text-muted">
                Usa un nome breve e riconoscibile.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="categoryPick">Categoria</Label>
                <div className="sm:hidden">
                  <select
                    id="categoryPick"
                    value={resolvedCategoryId || "__new__"}
                    onChange={(e) => {
                      const v = e.currentTarget.value
                      if (v === "__new__") {
                        setResolvedCategoryId("")
                        setResolvedCategoryName("")
                        if (categoryName.trim() && categories.some((c) => c.name === categoryName)) {
                          setCategoryName("")
                        }
                        return
                      }
                      const found = categories.find((c) => c.id === v)
                      setResolvedCategoryId(v)
                      setResolvedCategoryName(found?.name ?? "")
                      setCategoryName(found?.name ?? "")
                    }}
                    className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none transition-colors duration-200 focus:border-[color:var(--accent)]/35 focus:ring-2 focus:ring-[color:var(--accent)]/15"
                  >
                    <option value="__new__">Nuova categoria…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {!resolvedCategoryId ? (
                    <div className="mt-2">
                      <Input
                        id="categoryName"
                        name="categoryName"
                        value={categoryName}
                        onChange={(e) => {
                          const next = e.currentTarget.value
                          setCategoryName(next)
                          setResolvedCategoryName("")
                          setResolvedCategoryId("")
                        }}
                        placeholder="Es. Gelati, Pizze, Cocktail"
                      />
                    </div>
                  ) : (
                    <input type="hidden" name="categoryName" value={categoryName} />
                  )}
                  <p className="text-xs text-muted">
                    Seleziona una categoria o creane una nuova.
                  </p>
                </div>

                <div className="hidden sm:block">
                  <Input
                    id="categoryName"
                    name="categoryName"
                    list="category_suggest"
                    value={categoryName}
                    onChange={(e) => {
                      const next = e.currentTarget.value
                      setCategoryName(next)
                      setResolvedCategoryName("")
                      setResolvedCategoryId("")
                    }}
                    placeholder="Es. Gelati, Pizze, Cocktail"
                  />
                  <datalist id="category_suggest">
                    {categories.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted">
                    Scrivi la categoria: se esiste una simile viene usata, altrimenti viene creata.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Prezzo</Label>
                <Input
                  id="price"
                  name="price"
                  defaultValue={previewPrice}
                  placeholder="7.50"
                  onChange={(e) => setPreviewPrice(e.currentTarget.value)}
                />
                <p className="text-xs text-muted">Puoi lasciarlo vuoto per “su richiesta”.</p>
              </div>
            </div>

            {uiMode === "FULL" ? (
              <div className="grid gap-2">
                <Label htmlFor="shortDescription">Descrizione breve</Label>
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  defaultValue={previewShort}
                  placeholder="Una riga appetitosa."
                  onChange={(e) => setPreviewShort(e.currentTarget.value)}
                />
                <p className="text-xs text-muted">
                  Una sola frase: cosa lo rende speciale.
                </p>
              </div>
            ) : null}

            <details
              className="rounded-2xl border border-border bg-surface-muted p-4"
              open={detailsOpen}
              onToggle={(e) => setDetailsOpen(e.currentTarget.open)}
            >
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                {uiMode === "QUICK" ? "Aggiungi dettagli (opzionale)" : "Dettagli avanzati"}
              </summary>
              <div className="mt-4 grid gap-5">
                {uiMode === "QUICK" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="shortDescription">Descrizione breve</Label>
                    <Input
                      id="shortDescription"
                      name="shortDescription"
                      defaultValue={previewShort}
                      placeholder="Una riga appetitosa."
                      onChange={(e) => setPreviewShort(e.currentTarget.value)}
                    />
                    <p className="text-xs text-muted">
                      Una sola frase: cosa lo rende speciale.
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={initial?.description ?? ""}
                    placeholder="Dettagli del prodotto."
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="ingredients">Ingredienti (opzionale)</Label>
                    <Textarea
                      id="ingredients"
                      name="ingredients"
                      defaultValue={initial?.ingredients ?? ""}
                      placeholder="Ingredienti separati da virgole."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="allergens">Allergeni (opzionale)</Label>
                    <Input
                      id="allergens"
                      name="allergens"
                      defaultValue={initial?.allergens ?? ""}
                      placeholder="Glutine, Latte, Frutta a guscio"
                    />
                    <p className="text-xs text-muted">
                      Separa con virgole. Serve per far scegliere più velocemente.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sortOrder">Ordine</Label>
                  <Input
                    id="sortOrder"
                    name="sortOrder"
                    defaultValue={String(initial?.sortOrder ?? 0)}
                  />
                  <p className="text-xs text-muted">
                    Lascia 0 se non ti interessa l’ordine manuale.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className={pillClass(previewFeatured)}>
                    <input
                      type="checkbox"
                      name="isFeatured"
                      defaultChecked={previewFeatured}
                      className="sr-only"
                      onChange={(e) => setPreviewFeatured(e.currentTarget.checked)}
                    />
                    In evidenza
                  </label>
                  <label className={pillClass(previewNew)}>
                    <input
                      type="checkbox"
                      name="isNew"
                      defaultChecked={previewNew}
                      className="sr-only"
                      onChange={(e) => setPreviewNew(e.currentTarget.checked)}
                    />
                    Novità
                  </label>
                  <label className={pillClass(previewPromo)}>
                    <input
                      type="checkbox"
                      name="isPromo"
                      defaultChecked={previewPromo}
                      className="sr-only"
                      onChange={(e) => setPreviewPromo(e.currentTarget.checked)}
                    />
                    Promo
                  </label>
                </div>
              </div>
            </details>

            <div className="flex flex-wrap gap-2">
              <label className={pillClass(previewAvailable)}>
                <input
                  type="checkbox"
                  name="isAvailable"
                  defaultChecked={previewAvailable}
                  className="sr-only"
                  onChange={(e) => setPreviewAvailable(e.currentTarget.checked)}
                />
                Disponibile
              </label>
            </div>

            <div ref={mediaRef} className="grid gap-4">
              <MediaUploader
                label="Foto copertina"
                description="Prima foto mostrata nel menu."
                accept="image/*"
                mode="image"
                nameUrl="imageUrl"
                defaultUrl={initial?.imageUrl ?? ""}
                defaultType="IMAGE"
                businessId={businessId}
                onChange={(v) => setPreviewImageUrl(v?.url ?? "")}
              />

              <details
                className="rounded-2xl border border-border bg-surface-muted p-4"
                defaultOpen={extraPhotosDefaultOpen}
              >
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  Altre foto (opzionale)
                </summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <MediaUploader
                    label="Foto 2"
                    description="Opzionale."
                    accept="image/*"
                    mode="image"
                    nameUrl="imageUrl2"
                    defaultUrl={initial?.imageUrl2 ?? ""}
                    defaultType="IMAGE"
                    businessId={businessId}
                  />
                  <MediaUploader
                    label="Foto 3"
                    description="Opzionale."
                    accept="image/*"
                    mode="image"
                    nameUrl="imageUrl3"
                    defaultUrl={initial?.imageUrl3 ?? ""}
                    defaultType="IMAGE"
                    businessId={businessId}
                  />
                  <MediaUploader
                    label="Foto 4"
                    description="Opzionale."
                    accept="image/*"
                    mode="image"
                    nameUrl="imageUrl4"
                    defaultUrl={initial?.imageUrl4 ?? ""}
                    defaultType="IMAGE"
                    businessId={businessId}
                  />
                </div>
              </details>

              <details className="rounded-2xl border border-border bg-surface-muted p-4">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  Video (opzionale)
                </summary>
                <div className="mt-4">
                  {videoEnabled ? (
                    <MediaUploader
                      label="Video (max 5s)"
                      description="Un loop breve attira l’attenzione."
                      accept="video/*"
                      mode="video"
                      maxVideoSeconds={5}
                      nameUrl="videoUrl"
                      defaultUrl={initial?.videoUrl ?? ""}
                      defaultType="VIDEO"
                      businessId={businessId}
                      onChange={(v) => setPreviewVideoUrl(v?.url ?? "")}
                    />
                  ) : (
                    <div className="rounded-3xl border border-border bg-surface p-5">
                      <p className="text-sm font-semibold text-foreground">Video</p>
                      <p className="mt-1 text-sm text-muted">
                        Disponibile solo con Premium o Gold.
                      </p>
                      <div className="mt-4">
                        <ButtonLink href="/dashboard/billing" variant="secondary" size="sm">
                          Sblocca video
                        </ButtonLink>
                      </div>
                      <input type="hidden" name="videoUrl" value="" />
                    </div>
                  )}
                </div>
              </details>
            </div>

          {state && "ok" in state && state.ok === false ? (
            <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
              {state.error}
            </div>
          ) : null}

          <div ref={previewRef} className="mt-4 lg:hidden">
            <details
              className="rounded-2xl border border-border bg-surface-muted p-4"
              open={mobilePreviewOpen}
              onToggle={(e) => setMobilePreviewOpen(e.currentTarget.open)}
            >
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                Anteprima
              </summary>
              <div className="mt-4">
                <PreviewCard variant="mobile" />
              </div>
            </details>
          </div>

          <div className="sticky bottom-24 z-10 mt-6 lg:hidden">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-glass p-2 shadow-soft backdrop-blur-xl">
              <Button type="submit" disabled={pendingAny} className="flex-1">
                {pendingAny ? "Salvataggio..." : submitLabel}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMobilePreviewOpen(true)
                  window.requestAnimationFrame(() => {
                    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                  })
                }}
              >
                Anteprima
              </Button>
            </div>
          </div>
          </div>
      </form>

      <aside className="hidden lg:block lg:sticky lg:top-24">
        <PreviewCard variant="desktop" />
      </aside>
    </div>
  )
}
