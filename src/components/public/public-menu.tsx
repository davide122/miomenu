"use client"

import Image from "next/image"
import Link from "next/link"
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/cn"
import { openMenuEditorFromPublicAction } from "@/lib/business/actions"

type PublicProduct = {
  id: string
  name: string
  shortDescription: string | null
  description: string | null
  price: string | null
  ingredients: string | null
  isAvailable: boolean
  isFeatured: boolean
  isNew: boolean
  isPromo: boolean
  imageUrl: string | null
  imageUrls: string[]
  videoUrl: string | null
  translations: Record<
    string,
    {
      name: string
      shortDescription?: string
      description?: string
      ingredients?: string
    }
  > | null
  upsellProductIds: string[] | null
  allergens: string[]
}

type PublicCategory = {
  id: string
  name: string
  description: string | null
  products: PublicProduct[]
}

type QuickFilter = "ALL" | "FEATURED" | "NEW" | "PROMO"

type PublicProductWithCategory = PublicProduct & {
  categoryId: string
  categoryName: string
}

type QuizQuestion = {
  id: string
  text: string
  options: Array<{ id: string; label: string }>
}

type PersonalizationQuestion = {
  id: string
  text: string
  multi?: boolean
  options: Array<{ id: string; label: string }>
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
}

function stableNumberFromString(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0
  }
  return h
}

export function PublicMenuClient({
  business,
  categories,
  promotion,
  canEdit,
  businessId
}: {
  business: {
    name: string
    slug: string
    type?: string
    plan?: "FREE" | "PREMIUM" | "GOLD"
    logoUrl: string | null
    coverUrl: string | null
    primaryColor: string
    themeMode?: "LIGHT" | "DARK"
    visualStyle?: "MINIMAL" | "ELEGANT" | "MODERN" | "STREET" | "LUXURY"
    fontStyle?: "INTER" | "SYSTEM" | "GEIST"
    menuUi?: {
      accent?: string
      heroSurface?: "LIGHT" | "DARK"
      heroHeaderStyle?: "glass" | "solid" | "clean"
      heroMood?: "MINIMAL" | "ELEGANT" | "MODERN" | "STREET" | "LUXURY"
      heroPillText?: string
      heroSubtitleText?: string
      heroTitleColor?: string
      heroSubtitleColor?: string
      dishOfDayProductId?: string
      aiQuizEnabled?: boolean
      showFeaturedRail?: boolean
      showSocial?: boolean
    } | null
    whatsapp: string | null
    instagram: string | null
  }
  categories: PublicCategory[]
  promotion?: {
    code: string
    title: string
    description: string | null
    discountPercent: number | null
    active: boolean
  } | null
  canEdit?: boolean
  businessId?: string
}) {
  const [query, setQuery] = useState("")
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("ALL")
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [showAllergens, setShowAllergens] = useState(false)
  const [allergen, setAllergen] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isSheetClosing, setIsSheetClosing] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [shareStatus, setShareStatus] = useState<"IDLE" | "COPIED">("IDLE")
  const [lang, setLang] = useState<"it" | "en">("it")
  const [featuredListOpen, setFeaturedListOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizStatus, setQuizStatus] = useState<"IDLE" | "LOADING" | "READY" | "SUBMITTING" | "DONE" | "ERROR">("IDLE")
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizRecommendedIds, setQuizRecommendedIds] = useState<string[]>([])
  const [quizReason, setQuizReason] = useState("")
  const [quizError, setQuizError] = useState("")
  const [quizOrderStatus, setQuizOrderStatus] = useState<"IDLE" | "CREATING" | "DONE" | "ERROR">("IDLE")
  const [quizOrderId, setQuizOrderId] = useState("")
  const [quizOrderTitle, setQuizOrderTitle] = useState("")
  const [quizOrderNotes, setQuizOrderNotes] = useState("")
  const [quizOrderQrUrl, setQuizOrderQrUrl] = useState("")
  const [quizBaseProductId, setQuizBaseProductId] = useState("")
  const [basePickerOpen, setBasePickerOpen] = useState(false)
  const [personalizeStatus, setPersonalizeStatus] = useState<"IDLE" | "LOADING" | "READY" | "ERROR">("IDLE")
  const [personalizeQuestions, setPersonalizeQuestions] = useState<PersonalizationQuestion[]>([])
  const [personalizeAnswers, setPersonalizeAnswers] = useState<Record<string, string[]>>({})
  const [sheetMediaIndex, setSheetMediaIndex] = useState(0)

  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const quizCloseBtnRef = useRef<HTMLButtonElement | null>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)
  const prevHashRef = useRef<string>("")
  const closeTimerRef = useRef<number | null>(null)
  const shareTimerRef = useRef<number | null>(null)
  const bodyLockRef = useRef<{
    scrollY: number
    overflow: string
    position: string
    top: string
    width: string
  } | null>(null)

  const allProducts = useMemo<PublicProductWithCategory[]>(() => {
    return categories.flatMap((c) =>
      c.products.map((p) => ({
        ...p,
        categoryId: c.id,
        categoryName: c.name
      }))
    )
  }, [categories])

  const uiText = useMemo(() => {
    if (lang === "en") {
      return {
        browse: "Browse",
        editMenu: "Edit menu",
        searchPlaceholder: "Search in the menu...",
        results: "results",
        all: "All",
        featured: "Featured",
        new: "New",
        promo: "Deals",
        availableOnly: "Available only",
        noResults: "No products found. Try removing filters.",
        close: "Close",
        share: "Share",
        copied: "Copied",
        recommended: "Recommended",
        upsellTitle: "You may also like"
      }
    }
    return {
      browse: "Sfoglia",
      editMenu: "Modifica menu",
      searchPlaceholder: "Cerca nel menu...",
      results: "risultati",
      all: "Tutti",
      featured: "In evidenza",
      new: "Novità",
      promo: "Promo",
      availableOnly: "Solo disponibili",
      noResults: "Nessun prodotto trovato. Prova a rimuovere i filtri.",
      close: "Chiudi",
      share: "Condividi",
      copied: "Copiato",
      recommended: "Consigliato",
      upsellTitle: "Ti consigliamo anche"
    }
  }, [lang])

  function getTranslatedProduct<T extends PublicProduct>(p: T): T {
    if (lang === "it") return p
    const t = p.translations?.[lang]
    if (!t) return p
    return {
      ...p,
      name: t.name || p.name,
      shortDescription: t.shortDescription ?? p.shortDescription,
      description: t.description ?? p.description,
      ingredients: t.ingredients ?? p.ingredients
    }
  }

  const featuredRail = useMemo(() => {
    return allProducts
      .filter((p) => p.isFeatured || p.isPromo || p.isNew)
      .filter((p) => (onlyAvailable ? p.isAvailable : true))
      .slice(0, 12)
  }, [allProducts, onlyAvailable])

  function ProductList({
    products,
    showCategory
  }: {
    products: Array<
      PublicProduct & {
        categoryId: string
        categoryName: string
      }
    >
    showCategory?: boolean
  }) {
    return (
      <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
        <div className="max-h-[360px] overflow-y-auto">
          {products.map((p) => (
            <button
              key={p.id}
              id={`prod_${p.id}`}
              type="button"
              aria-label={`Apri dettaglio: ${p.name}`}
              onClick={() => openProduct(p.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors duration-200 last:border-b-0 hover:bg-surface-muted",
                !p.isAvailable ? "opacity-60" : undefined
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                {showCategory ? (
                  <p className="mt-0.5 truncate text-xs text-muted">{p.categoryName}</p>
                ) : null}
              </div>
              <div className="flex flex-none items-center gap-2">
                {p.price ? (
                  <div className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-foreground">
                    € {p.price}
                  </div>
                ) : (
                  <div className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-muted">
                    —
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  function CarouselRow({
    children,
    className
  }: {
    children: ReactNode
    className?: string
  }) {
    return (
      <div
        className={cn(
          "mx-[calc(50%-50vw)] mt-4 w-screen box-border overflow-x-auto px-5 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          className
        )}
      >
        <div className="flex gap-3 pr-5 snap-x snap-mandatory">
          {children}
        </div>
      </div>
    )
  }

  function ProductCarouselCard({
    p,
    size = "featured"
  }: {
    p: (typeof featuredRail)[number]
    size?: "featured" | "category"
  }) {
    const wClass = size === "category" ? "w-[240px]" : "w-[260px]"
    const mediaHClass = size === "category" ? "h-28" : "h-32"
    const mediaSizes = size === "category" ? "240px" : "260px"
    const padClass = size === "category" ? "p-3.5" : "p-4"
    const priceClass =
      size === "category"
        ? "rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold"
        : "rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold"

    return (
      <button
        id={`prod_${p.id}`}
        type="button"
        aria-label={`Apri dettaglio: ${p.name}`}
        onClick={() => openProduct(p.id)}
        className={cn(
          wClass,
          "flex-none snap-start overflow-hidden rounded-3xl border border-border bg-white text-left shadow-soft transition-colors duration-200 hover:bg-surface-muted",
          !p.isAvailable ? "opacity-60" : undefined
        )}
      >
        <div className={cn("relative w-full bg-background", mediaHClass)}>
          {p.imageUrl ? (
            <Image
              src={p.imageUrl}
              alt={p.name}
              fill
              className="object-cover"
              sizes={mediaSizes}
              loading="lazy"
            />
          ) : p.videoUrl ? (
            <video
              className="h-full w-full object-cover"
              src={p.videoUrl}
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            <div className="h-full w-full bg-[color:var(--brand)]/10" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent" />
        </div>
        <div className={padClass}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="mt-1 truncate text-xs text-muted">{p.categoryName}</p>
            </div>
            {p.price ? (
              <div className={priceClass}>
                € {p.price}
              </div>
            ) : null}
          </div>
        </div>
      </button>
    )
  }

  const allergens = useMemo(() => {
    const set = new Set<string>()
    for (const c of categories) {
      for (const p of c.products) {
        for (const a of p.allergens) set.add(a)
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "it"))
  }, [categories])

  const filtered = useMemo(() => {
    const q = normalize(query)
    return categories
      .map((c) => {
        const products = c.products.filter((p) => {
          const matchesQuery = !q
            ? true
            : normalize(p.name).includes(q) ||
              normalize(p.shortDescription ?? "").includes(q) ||
              normalize(p.description ?? "").includes(q)

          const matchesAllergen = !allergen || p.allergens.includes(allergen)
          const matchesAvailability = onlyAvailable ? p.isAvailable : true
          const matchesQuick =
            quickFilter === "ALL"
              ? true
              : quickFilter === "FEATURED"
                ? p.isFeatured
                : quickFilter === "NEW"
                  ? p.isNew
                  : p.isPromo

          return (
            matchesQuery &&
            matchesAllergen &&
            matchesAvailability &&
            matchesQuick
          )
        })
        return { ...c, products }
      })
      .filter((c) => c.products.length > 0)
  }, [categories, query, allergen, quickFilter, onlyAvailable])

  const totalMatches = useMemo(() => {
    return filtered.reduce((acc, c) => acc + c.products.length, 0)
  }, [filtered])

  function scrollToCategory(categoryId: string) {
    const el = document.getElementById(`cat_${categoryId}`)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function scrollToProduct(productId: string) {
    const el = document.getElementById(`prod_${productId}`)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const selected = useMemo<PublicProductWithCategory | null>(() => {
    if (!selectedProductId) return null
    const found = allProducts.find((p) => p.id === selectedProductId) ?? null
    return found ? getTranslatedProduct(found) : null
  }, [allProducts, selectedProductId, lang])

  const sheetCloseMs = reduceMotion ? 0 : 220

  function openProduct(productId: string) {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    if (!selectedProductId) {
      const currentHash = window.location.hash
      prevHashRef.current = currentHash.startsWith("#prod_") ? "" : currentHash
      lastFocusedRef.current = document.activeElement as HTMLElement | null
    }

    setIsSheetClosing(false)
    setSelectedProductId(productId)

    const nextHash = `#prod_${productId}`
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash)
    }
  }

  const closeSheet = useCallback(() => {
    if (!selectedProductId) return
    if (closeTimerRef.current) return

    setIsSheetClosing(true)

    const restoreHash = prevHashRef.current
    if (restoreHash) {
      window.history.replaceState(null, "", restoreHash)
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search)
    }

    closeTimerRef.current = window.setTimeout(() => {
      setSelectedProductId(null)
      setIsSheetClosing(false)
      closeTimerRef.current = null
    }, sheetCloseMs)
  }, [selectedProductId, sheetCloseMs])

  function closeThen(fn: () => void) {
    closeSheet()
    window.setTimeout(fn, sheetCloseMs)
  }

  async function shareSelectedProduct() {
    if (!selected) return

    const url = new URL(window.location.href)
    url.hash = `prod_${selected.id}`

    const share = navigator.share
    if (share) {
      try {
        await share({
          title: selected.name,
          text: `${selected.name} • ${business.name}`,
          url: url.toString()
        })
      } catch {}
      return
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url.toString())
        setShareStatus("COPIED")
        if (shareTimerRef.current) window.clearTimeout(shareTimerRef.current)
        shareTimerRef.current = window.setTimeout(() => {
          setShareStatus("IDLE")
          shareTimerRef.current = null
        }, 1400)
      } catch {}
    }
  }

  const quizRecommendedProducts = useMemo(() => {
    const list = quizRecommendedIds
      .map((id) => allProducts.find((p) => p.id === id) ?? null)
      .filter((p): p is PublicProductWithCategory => p !== null)
      .map((p) => getTranslatedProduct(p))
    return list.slice(0, 6)
  }, [allProducts, quizRecommendedIds, lang])

  const allQuizAnswered =
    quizQuestions.length > 0 && quizQuestions.every((q) => Boolean(quizAnswers[q.id]))

  async function loadQuiz() {
    setQuizError("")
    setQuizStatus("LOADING")
    setQuizQuestions([])
    setQuizAnswers({})
    setQuizRecommendedIds([])
    setQuizReason("")
    setQuizOrderStatus("IDLE")
    setQuizOrderId("")
    setQuizOrderTitle("")
    setQuizOrderNotes("")
    setQuizOrderQrUrl("")
    setQuizBaseProductId("")
    setPersonalizeStatus("IDLE")
    setPersonalizeQuestions([])
    setPersonalizeAnswers({})

    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessSlug: business.slug,
          mode: "init",
          lang
        })
      })
      const data = (await res.json()) as
        | { ok: true; questions: QuizQuestion[] }
        | { ok: false; error: string }

      if (!res.ok || !data.ok) {
        setQuizStatus("ERROR")
        setQuizError(data.ok ? "AI non disponibile." : data.error)
        return
      }

      setQuizQuestions(data.questions)
      setQuizStatus("READY")
    } catch {
      setQuizStatus("ERROR")
      setQuizError("AI non disponibile in questo momento.")
    }
  }

  async function submitQuiz() {
    if (!allQuizAnswered) return
    setQuizError("")
    setQuizStatus("SUBMITTING")

    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessSlug: business.slug,
          mode: "recommend",
          lang,
          answers: quizAnswers
        })
      })
      const data = (await res.json()) as
        | { ok: true; recommendedProductIds: string[]; reason?: string }
        | { ok: false; error: string }

      if (!res.ok || !data.ok) {
        setQuizStatus("ERROR")
        setQuizError(data.ok ? "AI non disponibile." : data.error)
        return
      }

      setQuizRecommendedIds(data.recommendedProductIds)
      setQuizReason(data.reason ?? "")
      const baseId = data.recommendedProductIds[0] ?? ""
      setQuizBaseProductId(baseId)
      setBasePickerOpen(false)
      setPersonalizeStatus("IDLE")
      setPersonalizeQuestions([])
      setPersonalizeAnswers({})
      if (baseId) void loadPersonalization(baseId)
      setQuizStatus("DONE")
    } catch {
      setQuizStatus("ERROR")
      setQuizError("AI non disponibile in questo momento.")
    }
  }

  async function loadPersonalization(baseProductId: string) {
    if (!baseProductId) return
    setQuizError("")
    setPersonalizeStatus("LOADING")
    setPersonalizeQuestions([])
    setPersonalizeAnswers({})
    setQuizOrderStatus("IDLE")
    setQuizOrderId("")
    setQuizOrderTitle("")
    setQuizOrderNotes("")
    setQuizOrderQrUrl("")

    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessSlug: business.slug,
          mode: "personalize_init",
          lang,
          answers: quizAnswers,
          baseProductId
        })
      })
      const data = (await res.json()) as
        | { ok: true; baseProductId: string; questions: PersonalizationQuestion[] }
        | { ok: false; error: string }

      if (!res.ok || !data.ok) {
        setPersonalizeStatus("ERROR")
        setQuizError(data.ok ? "AI non disponibile." : data.error)
        return
      }

      setPersonalizeQuestions(data.questions ?? [])
      setPersonalizeStatus("READY")
    } catch {
      setPersonalizeStatus("ERROR")
      setQuizError("AI non disponibile in questo momento.")
    }
  }

  function togglePersonalAnswer(questionId: string, optionId: string, multi?: boolean) {
    setPersonalizeAnswers((prev) => {
      const current = prev[questionId] ?? []
      if (!multi) return { ...prev, [questionId]: [optionId] }
      if (optionId === "none") return { ...prev, [questionId]: ["none"] }
      const withoutNone = current.filter((x) => x !== "none")
      const exists = withoutNone.includes(optionId)
      const next = exists ? withoutNone.filter((x) => x !== optionId) : withoutNone.concat(optionId)
      return { ...prev, [questionId]: next.length ? next : ["none"] }
    })
  }

  async function createQuizOrder() {
    if (!allQuizAnswered) return
    if (!quizBaseProductId) return
    setQuizError("")
    setQuizOrderStatus("CREATING")
    setQuizOrderId("")
    setQuizOrderTitle("")
    setQuizOrderNotes("")
    setQuizOrderQrUrl("")

    try {
      const personalizationSummary = personalizeQuestions
        .map((q) => {
          const picked = (personalizeAnswers[q.id] ?? []).filter((id) => id !== "none")
          const selected = picked
            .map((id) => q.options.find((o) => o.id === id)?.label ?? "")
            .filter(Boolean)
          return { question: q.text, selected }
        })
        .filter((x) => x.selected.length)

      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessSlug: business.slug,
          mode: "create_order",
          lang,
          answers: quizAnswers,
          baseProductId: quizBaseProductId,
          personalization: personalizeAnswers,
          personalizationSummary
        })
      })
      const data = (await res.json()) as
        | { ok: true; orderId: string; qrUrl: string; title: string; notes?: string }
        | { ok: false; error: string }

      if (!res.ok || !data.ok) {
        setQuizOrderStatus("ERROR")
        setQuizError(data.ok ? "AI non disponibile." : data.error)
        return
      }

      setQuizOrderId(data.orderId)
      setQuizOrderQrUrl(data.qrUrl)
      setQuizOrderTitle(data.title)
      setQuizOrderNotes(data.notes ?? "")
      setQuizOrderStatus("DONE")
    } catch {
      setQuizOrderStatus("ERROR")
      setQuizError("AI non disponibile in questo momento.")
    }
  }

  async function startQuiz() {
    if (selectedProductId) closeSheet()
    setQuizOpen(true)
    if (quizStatus === "IDLE" || quizStatus === "ERROR") {
      await loadQuiz()
    }
  }

  const pairingsFor = useMemo(() => {
    const pool = allProducts.filter((p) => (onlyAvailable ? p.isAvailable : true))

    return (productId: string, categoryId: string) => {
      const candidates = pool.filter(
        (p) => p.id !== productId && p.categoryId !== categoryId
      )
      if (!candidates.length) return []

      const premium = candidates.filter((p) => p.isFeatured || p.isPromo)
      const base = premium.length ? premium : candidates

      const seed = stableNumberFromString(productId)
      const a = base[seed % base.length]
      const b = base.length > 1 ? base[(seed + 7) % base.length] : null

      const picked = [a, b].filter(Boolean) as Array<(typeof base)[number]>
      const deduped: typeof picked = []
      for (const item of picked) {
        if (!deduped.some((x) => x.id === item.id)) deduped.push(item)
      }
      return deduped.slice(0, 2)
    }
  }, [allProducts, onlyAvailable])

  const selectedPairings = useMemo(() => {
    if (!selected) return []
    const upsellIds = (selected.upsellProductIds ?? []).filter(Boolean)
    if (upsellIds.length) {
      const list = upsellIds
        .map((id) => allProducts.find((p) => p.id === id) ?? null)
        .filter((p): p is PublicProductWithCategory => p !== null)
        .filter((p) => (onlyAvailable ? p.isAvailable : true))
        .map((p) => getTranslatedProduct(p))
      return list.slice(0, 3)
    }
    return pairingsFor(selected.id, selected.categoryId).map((p) => getTranslatedProduct(p))
  }, [allProducts, lang, onlyAvailable, pairingsFor, selected])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReduceMotion(mq.matches)
    onChange()

    if (mq.addEventListener) mq.addEventListener("change", onChange)
    else mq.addListener(onChange)

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange)
      else mq.removeListener(onChange)
    }
  }, [])

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const l = sp.get("lang")
    if (l === "en") setLang("en")
  }, [])

  useEffect(() => {
    setSheetMediaIndex(0)
  }, [selectedProductId])

  useEffect(() => {
    if (!selectedProductId && !quizOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (selectedProductId) closeSheet()
      else setQuizOpen(false)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [closeSheet, quizOpen, selectedProductId])

  useEffect(() => {
    if (!selectedProductId && !quizOpen) return

    const body = document.body
    if (!bodyLockRef.current) {
      bodyLockRef.current = {
        scrollY: window.scrollY,
        overflow: body.style.overflow,
        position: body.style.position,
        top: body.style.top,
        width: body.style.width
      }
      body.style.overflow = "hidden"
    }

    const raf = window.requestAnimationFrame(() => {
      if (selectedProductId) closeBtnRef.current?.focus()
      else quizCloseBtnRef.current?.focus()
    })

    return () => {
      window.cancelAnimationFrame(raf)
    }
  }, [quizOpen, selectedProductId])

  useEffect(() => {
    if (selectedProductId || quizOpen) return
    if (!bodyLockRef.current) return

    const { overflow } = bodyLockRef.current
    bodyLockRef.current = null

    const body = document.body
    body.style.overflow = overflow
    lastFocusedRef.current?.focus?.()
  }, [quizOpen, selectedProductId])

  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash
      if (!hash.startsWith("#prod_")) return

      const id = hash.replace("#prod_", "")
      const exists = allProducts.some((p) => p.id === id)
      if (!exists) return

      setIsSheetClosing(false)
      setSelectedProductId(id)
    }

    fromHash()
    window.addEventListener("hashchange", fromHash)
    return () => window.removeEventListener("hashchange", fromHash)
  }, [allProducts])

  const menuUi = business.menuUi ?? null
  const heroAccent = menuUi?.accent ?? business.primaryColor
  const heroSurface = menuUi?.heroSurface ?? business.themeMode ?? "LIGHT"
  const heroMood = menuUi?.heroMood ?? business.visualStyle ?? "MINIMAL"
  const heroHeaderStyle = menuUi?.heroHeaderStyle ?? "glass"
  const allowFeaturedRail = menuUi?.showFeaturedRail ?? true
  const allowSocial = menuUi?.showSocial ?? true
  const heroSubtitleText = menuUi?.heroSubtitleText ?? "Scorri e scegli velocemente."
  const heroTitleColor = menuUi?.heroTitleColor
  const heroSubtitleColor = menuUi?.heroSubtitleColor
  const dishOfDayProductId = (menuUi?.dishOfDayProductId ?? "").trim()
  const dishOfDay = dishOfDayProductId
    ? allProducts.find((p) => p.id === dishOfDayProductId) ?? null
    : null
  const dishOfDayView = dishOfDay ? getTranslatedProduct(dishOfDay) : null
  const allowAiQuiz = menuUi?.aiQuizEnabled ?? true

  const showFeaturedRail =
    allowFeaturedRail &&
    quickFilter === "ALL" &&
    featuredRail.length > 0 &&
    !query.trim() &&
    !allergen

  const showDishOfDay =
    Boolean(dishOfDayView) &&
    quickFilter === "ALL" &&
    !query.trim() &&
    !allergen

  const showQuizCta =
    allowAiQuiz &&
    quickFilter === "ALL" &&
    !query.trim() &&
    !allergen

  const isHeroDark = heroSurface === "DARK"
  const defaultPillTitle =
    heroMood === "LUXURY"
      ? "Menu"
      : heroMood === "STREET"
        ? "Menu street"
        : heroMood === "ELEGANT"
          ? "Menu elegante"
          : heroMood === "MODERN"
            ? "Menu moderno"
            : "Menu"
  const heroPillTextRaw = (menuUi?.heroPillText ?? defaultPillTitle).trim()
  const slugNormalized = business.slug.trim().toLowerCase()
  const pillNormalized = heroPillTextRaw.toLowerCase()
  const looksLikeSlug =
    pillNormalized === slugNormalized ||
    (pillNormalized.length >= 10 && /^[a-z0-9-_.@]+$/.test(pillNormalized) && !pillNormalized.includes(" "))
  const heroPillText = looksLikeSlug ? defaultPillTitle : heroPillTextRaw

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={
        {
          ["--brand" as never]: heroAccent,
          ["--accent" as never]: heroAccent
        } as never
      }
    >
      <div className="mx-auto w-full max-w-3xl">
        <header className="relative">
          <div className="relative overflow-hidden">
            <div className="relative h-52 w-full">
              {business.coverUrl ? (
                <Image
                  src={business.coverUrl}
                  alt={`${business.name} cover`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                  unoptimized
                />
              ) : (
                <div className="h-full w-full bg-[color:var(--accent)]/8" />
              )}
              <div
                className={cn(
                  "absolute inset-0",
                  isHeroDark
                    ? "bg-black/65"
                    : heroMood === "LUXURY"
                      ? "bg-black/45"
                      : "bg-black/40"
                )}
              />
              <div
                className={cn(
                  "absolute inset-0",
                  heroMood === "MINIMAL"
                    ? "bg-gradient-to-b from-transparent via-transparent to-black/10"
                    : heroMood === "ELEGANT" || heroMood === "LUXURY"
                      ? "bg-gradient-to-b from-black/10 via-black/25 to-black/45"
                      : "bg-gradient-to-b from-black/10 via-black/20 to-black/35"
                )}
              />
            </div>

            <div className="px-5 pb-5 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className={cn(
                      "inline-flex max-w-[min(520px,70vw)] items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-tight",
                      heroHeaderStyle === "glass"
                        ? isHeroDark
                          ? "border-white/20 bg-white/10 text-white backdrop-blur-xl"
                          : "border-border bg-surface-glass text-foreground backdrop-blur-xl"
                        : heroHeaderStyle === "solid"
                          ? "border-transparent bg-white text-foreground"
                          : isHeroDark
                            ? "border-white/25 bg-transparent text-white"
                            : "border-border bg-transparent text-foreground"
                    )}
                    title={heroPillText}
                  >
                    <span className="truncate">{heroPillText}</span>
                  </div>

                  <h1
                    className="mt-3 truncate text-2xl font-semibold tracking-tight text-white"
                    style={heroTitleColor ? ({ color: heroTitleColor } as never) : undefined}
                  >
                    {business.name}
                  </h1>
                  <p
                    className="mt-1 text-sm text-white/80"
                    style={
                      heroSubtitleColor ? ({ color: heroSubtitleColor } as never) : undefined
                    }
                  >
                    {heroSubtitleText}
                  </p>

                  {promotion?.active ? (
                    <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-xl">
                      <span className="truncate">{promotion.title}</span>
                      <span className="flex-none rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                        {promotion.code}
                        {typeof promotion.discountPercent === "number"
                          ? ` -${promotion.discountPercent}%`
                          : ""}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-none items-center gap-2">
                 
                  {allowSocial && business.whatsapp ? (
                    <a
                      href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Apri WhatsApp"
                      className={cn(
                        "grid h-11 w-11 place-items-center rounded-2xl border transition-colors duration-200",
                        heroHeaderStyle === "glass"
                          ? isHeroDark
                            ? "border-white/20 bg-white/10 text-white backdrop-blur-xl hover:bg-white/15"
                            : "border-border bg-surface-glass text-foreground backdrop-blur-xl hover:bg-surface"
                          : heroHeaderStyle === "solid"
                            ? "border-transparent bg-white text-foreground hover:bg-white/95"
                            : isHeroDark
                              ? "border-white/25 bg-transparent text-white hover:bg-white/10"
                              : "border-border bg-transparent text-foreground hover:bg-surface"
                      )}
                      title="WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                        <path
                          d="M12 21a8.9 8.9 0 0 1-4.3-1.1L4 21l1.1-3.6A9 9 0 1 1 12 21Z"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 8.6c.3-.6.6-.7 1-.7h.6c.2 0 .4.02.6.4l.8 1.9c.1.3.1.5 0 .7l-.4.6c-.2.2-.2.4 0 .7.3.5 1.3 1.7 2.9 2.2.3.1.5.1.7-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.8c.3.1.4.3.4.5 0 .7-.4 1.7-1 2-.6.4-1.5.4-2.5.1-1-.3-3.3-1.3-4.8-3.4-1.5-2-1.7-3.7-1.6-4.6.1-.9.6-1.6.9-2Z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  ) : null}
                  {allowSocial && business.instagram ? (
                    <a
                      href={
                        business.instagram.startsWith("http")
                          ? business.instagram
                          : `https://instagram.com/${business.instagram.replace(/^@/, "")}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Apri Instagram"
                      className={cn(
                        "grid h-11 w-11 place-items-center rounded-2xl border transition-colors duration-200",
                        heroHeaderStyle === "glass"
                          ? isHeroDark
                            ? "border-white/20 bg-white/10 text-white backdrop-blur-xl hover:bg-white/15"
                            : "border-border bg-surface-glass text-foreground backdrop-blur-xl hover:bg-surface"
                          : heroHeaderStyle === "solid"
                            ? "border-transparent bg-white text-foreground hover:bg-white/95"
                            : isHeroDark
                              ? "border-white/25 bg-transparent text-white hover:bg-white/10"
                              : "border-border bg-transparent text-foreground hover:bg-surface"
                      )}
                      title="Instagram"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                        <path
                          d="M8.2 4.8h7.6A3.4 3.4 0 0 1 19.2 8.2v7.6a3.4 3.4 0 0 1-3.4 3.4H8.2a3.4 3.4 0 0 1-3.4-3.4V8.2a3.4 3.4 0 0 1 3.4-3.4Z"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M16.8 7.2h.01"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </a>
                  ) : null}
                  <div
                    className={cn(
                      "relative h-14 w-14 overflow-hidden rounded-3xl border",
                      "border-white/20 bg-white/10 backdrop-blur-xl"
                    )}
                    style={
                      business.logoUrl
                        ? undefined
                        : ({ backgroundColor: "rgba(255,255,255,0.12)" } as never)
                    }
                  >
                    {business.logoUrl ? (
                      <Image
                        src={business.logoUrl}
                        alt={`${business.name} logo`}
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full bg-[color:var(--accent)]/35" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {canEdit && businessId ? (
                  <form action={openMenuEditorFromPublicAction}>
                    <input type="hidden" name="businessId" value={businessId} />
                    <button
                      type="submit"
                      className={cn(
                        "inline-flex h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors duration-200",
                        isHeroDark
                          ? "border-white/20 bg-white/10 text-white backdrop-blur-xl hover:bg-white/15"
                          : "border-transparent bg-[color:var(--accent)] text-white hover:opacity-90"
                      )}
                    >
                      {uiText.editMenu}
                    </button>
                  </form>
                ) : null}
                <a
                  href="#cat"
                  onClick={(e) => {
                    e.preventDefault()
                    const first = categories[0]?.id
                    if (first) scrollToCategory(first)
                  }}
                  className="inline-flex h-11 items-center rounded-full border border-transparent bg-[color:var(--accent)] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:opacity-90"
                >
                  {uiText.browse}
                </a>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "sticky top-0 z-10 mt-5 border-y backdrop-blur",
              isHeroDark
                ? "border-white/10 bg-[#070A11]/75"
                : "border-border bg-background/95"
            )}
          >
            <div className="px-5 py-4">
              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={uiText.searchPlaceholder}
                  inputMode="search"
                  enterKeyHint="search"
                  className={cn(
                    "h-11 w-full rounded-2xl border px-4 text-sm outline-none transition-colors duration-200",
                    isHeroDark
                      ? "border-white/10 bg-white/8 text-white placeholder:text-white/60 focus:border-white/25 focus:ring-2 focus:ring-white/10"
                      : "border-border bg-surface text-foreground placeholder:text-text-soft focus:border-[color:var(--accent)]/35 focus:ring-2 focus:ring-[color:var(--accent)]/15"
                  )}
                />
                {query.trim() ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className={cn(
                      "h-11 flex-none rounded-2xl border px-4 text-sm font-medium transition-colors duration-200",
                      isHeroDark
                        ? "border-white/10 bg-white/8 text-white hover:bg-white/12"
                        : "border-border bg-surface text-foreground hover:bg-surface-muted"
                    )}
                  >
                    Reset
                  </button>
                ) : null}
              </div>

              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {(
                  [
                    { key: "ALL", label: uiText.all },
                    { key: "FEATURED", label: uiText.featured },
                    { key: "NEW", label: uiText.new },
                    { key: "PROMO", label: uiText.promo }
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={quickFilter === f.key}
                    onClick={() => setQuickFilter(f.key)}
                    className={cn(
                      "h-10 flex-none rounded-full border px-4 text-sm font-medium",
                      quickFilter === f.key
                        ? "border-transparent bg-[color:var(--brand)] text-white"
                        : "border-border bg-white text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={onlyAvailable}
                  onClick={() => setOnlyAvailable((v) => !v)}
                  className={cn(
                    "h-10 flex-none rounded-full border px-4 text-sm font-medium",
                    onlyAvailable
                      ? "border-transparent bg-foreground text-white"
                      : "border-border bg-white text-foreground"
                  )}
                >
                  {uiText.availableOnly}
                </button>
                {allergens.length ? (
                  <button
                    type="button"
                    aria-pressed={showAllergens}
                    onClick={() => setShowAllergens((v) => !v)}
                    className={cn(
                      "h-10 flex-none rounded-full border px-4 text-sm font-medium",
                      showAllergens
                        ? "border-transparent bg-foreground text-white"
                        : "border-border bg-white text-foreground"
                    )}
                  >
                    Allergeni
                  </button>
                ) : null}
              </div>

              {showAllergens && allergens.length ? (
                <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setAllergen(null)}
                    className={cn(
                      "h-10 flex-none rounded-full border px-4 text-sm font-medium",
                      allergen
                        ? "border-border bg-white text-foreground"
                        : "border-transparent bg-[color:var(--brand)] text-white"
                    )}
                  >
                    Tutti
                  </button>
                  {allergens.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAllergen(a)}
                      className={cn(
                        "h-10 flex-none rounded-full border px-4 text-sm font-medium",
                        allergen === a
                          ? "border-transparent bg-[color:var(--brand)] text-white"
                          : "border-border bg-white text-foreground"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className={cn("text-xs", isHeroDark ? "text-white/70" : "text-muted")}>
                  {totalMatches} risultati
                  {allergen ? ` • filtro: ${allergen}` : ""}
                </p>
              </div>
            </div>

            <div className="border-t border-border">
              <div className="flex items-center gap-2 overflow-x-auto px-5 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => scrollToCategory(c.id)}
                    className="h-10 flex-none rounded-full border border-border bg-white px-4 text-sm font-medium hover:bg-background"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="px-5 pb-24 pt-6">
          {showDishOfDay && dishOfDayView ? (
            <section className="mb-8">
              <button
                type="button"
                onClick={() => openProduct(dishOfDayView.id)}
                className="w-full overflow-hidden rounded-[32px] border border-border bg-white text-left shadow-soft transition-colors duration-200 hover:bg-surface-muted"
              >
                <div className="relative h-44 w-full bg-background">
                  {dishOfDayView.imageUrl ? (
                    <Image
                      src={dishOfDayView.imageUrl}
                      alt={dishOfDayView.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 768px"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-[color:var(--brand)]/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
                    Piatto del giorno
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold tracking-tight text-foreground">
                        {dishOfDayView.name}
                      </p>
                      {dishOfDayView.shortDescription ? (
                        <p className="mt-1 text-sm text-muted">
                          {dishOfDayView.shortDescription}
                        </p>
                      ) : null}
                    </div>
                    {dishOfDayView.price ? (
                      <div className="flex-none rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-foreground">
                        € {dishOfDayView.price}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 inline-flex h-11 items-center rounded-full border border-transparent bg-[color:var(--accent)] px-5 text-sm font-semibold text-white">
                    Vedi dettagli
                  </div>
                </div>
              </button>
            </section>
          ) : null}

          {showQuizCta ? (
            <section className="mb-8">
              <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
                <p className="text-sm font-semibold text-foreground">
                  Non sai cosa scegliere?
                </p>
                <p className="mt-1 text-sm text-muted">
                  Rispondi a 3 domande e ti consigliamo cosa prendere.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void startQuiz()}
                    className="h-11 rounded-full border border-transparent bg-[color:var(--accent)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:opacity-90"
                  >
                    Chiedi all’AI
                  </button>
                  <button
                    type="button"
                    onClick={() => void loadQuiz()}
                    className="h-11 rounded-full border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-muted"
                  >
                    Aggiorna quiz
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {showFeaturedRail ? (
            <section className="mb-8">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    {uiText.featured}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Scelte rapide per decidere al volo.
                  </p>
                </div>
                <Badge variant="muted">{featuredRail.length}</Badge>
              </div>

              <CarouselRow>
                {featuredRail.map((p) => (
                  <ProductCarouselCard key={p.id} p={getTranslatedProduct(p)} size="featured" />
                ))}
              </CarouselRow>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFeaturedListOpen((v) => !v)}
                  className="h-11 rounded-full border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-muted"
                >
                  {featuredListOpen ? "Nascondi lista" : "Vedi lista completa"}
                </button>
              </div>

              {featuredListOpen ? (
                <ProductList
                  products={featuredRail.map((p) => getTranslatedProduct(p))}
                  showCategory
                />
              ) : null}
            </section>
          ) : null}

          {filtered.length ? (
            <div className="grid gap-10">
              {filtered.map((c) => (
                <section key={c.id} id={`cat_${c.id}`} className="scroll-mt-32">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">
                        {c.name}
                      </h2>
                      {c.description ? (
                        <p className="mt-1 text-sm text-muted">
                          {c.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="muted">{c.products.length}</Badge>
                      {c.products.length > 4 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCategories((v) => ({
                              ...v,
                              [c.id]: !(v[c.id] ?? false)
                            }))
                          }
                          className="h-10 rounded-full border border-border bg-white px-4 text-sm font-medium transition-colors duration-200 hover:bg-surface-muted"
                        >
                          {expandedCategories[c.id] ? "Nascondi lista" : "Vedi lista"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <CarouselRow>
                    {c.products.map((p) => {
                      const enriched = {
                        ...p,
                        categoryId: c.id,
                        categoryName: c.name
                      }
                      return (
                        <ProductCarouselCard
                          key={p.id}
                          p={getTranslatedProduct(enriched)}
                          size="category"
                        />
                      )
                    })}
                  </CarouselRow>

                  {expandedCategories[c.id] ? (
                    <ProductList
                      products={c.products.map((p) =>
                        getTranslatedProduct({
                          ...p,
                          categoryId: c.id,
                          categoryName: c.name
                        })
                      )}
                    />
                  ) : null}
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted shadow-soft">
              {uiText.noResults}
            </div>
          )}
        </main>

        <footer className="border-t border-border bg-white">
          <div className="flex items-center justify-between px-5 py-6 text-xs text-muted">
            <p>{business.name}</p>
            <Link href="/" className="font-medium text-foreground">
              yourMenu
            </Link>
          </div>
        </footer>

        {quizOpen ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Chiudi quiz"
              onClick={() => setQuizOpen(false)}
              className={cn(
                "absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px] transition-opacity",
                reduceMotion ? "duration-0" : "duration-200"
              )}
            />

            <div
              className={cn(
                "absolute inset-x-0 bottom-0 left-1/2 w-full max-w-3xl -translate-x-1/2",
                "transition-transform ease-out",
                reduceMotion ? "duration-0" : "duration-200"
              )}
            >
              <div
                role="dialog"
                aria-modal="true"
                className={cn(
                  "relative overflow-hidden rounded-t-[34px] border border-border bg-white",
                  "shadow-[0_-30px_80px_rgba(0,0,0,0.35)]",
                  "max-h-[88vh]"
                )}
              >
                <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Chiedi all’AI</p>
                    <p className="mt-1 text-sm text-muted">
                      Rispondi e ti consigliamo cosa prendere.
                    </p>
                  </div>
                  <button
                    ref={quizCloseBtnRef}
                    type="button"
                    onClick={() => setQuizOpen(false)}
                    className="h-10 flex-none rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-muted"
                  >
                    {uiText.close}
                  </button>
                </div>

                <div className="max-h-[72vh] overflow-y-auto border-t border-border px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-4">
                  {quizStatus === "LOADING" ? (
                    <div className="rounded-3xl border border-border bg-surface p-5 text-sm text-muted">
                      Sto preparando il quiz…
                    </div>
                  ) : null}

                  {quizStatus === "ERROR" ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                      {quizError || "AI non disponibile."}
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => void loadQuiz()}
                          className="h-11 rounded-full border border-transparent bg-[color:var(--accent)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:opacity-90"
                        >
                          Riprova
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {quizStatus === "READY" || quizStatus === "SUBMITTING" ? (
                    <div className="grid gap-4">
                      {quizQuestions.map((q) => (
                        <div key={q.id} className="rounded-3xl border border-border bg-surface p-5">
                          <p className="text-sm font-semibold text-foreground">{q.text}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {q.options.map((o) => {
                              const active = quizAnswers[q.id] === o.id
                              return (
                                <button
                                  key={o.id}
                                  type="button"
                                  onClick={() =>
                                    setQuizAnswers((v) => ({
                                      ...v,
                                      [q.id]: o.id
                                    }))
                                  }
                                  className={cn(
                                    "h-10 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                                    active
                                      ? "border-transparent bg-[color:var(--brand)] text-white"
                                      : "border-border bg-white text-foreground hover:bg-surface-muted"
                                  )}
                                >
                                  {o.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        disabled={!allQuizAnswered || quizStatus === "SUBMITTING"}
                        onClick={() => void submitQuiz()}
                        className={cn(
                          "h-12 rounded-full border border-transparent px-6 text-sm font-semibold text-white transition-colors duration-200",
                          !allQuizAnswered || quizStatus === "SUBMITTING"
                            ? "bg-foreground/40"
                            : "bg-[color:var(--accent)] hover:opacity-90"
                        )}
                      >
                        Consigliami
                      </button>
                    </div>
                  ) : null}

                  {quizStatus === "DONE" ? (
                    <div className="grid gap-4">
                      {quizReason ? (
                        <div className="rounded-3xl border border-border bg-surface p-5 text-sm text-foreground">
                          {quizReason}
                        </div>
                      ) : null}

                      {quizRecommendedProducts.length ? (
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Consigliati
                          </p>
                          <ProductList products={quizRecommendedProducts} showCategory />
                        </div>
                      ) : (
                        <div className="rounded-3xl border border-border bg-surface p-5 text-sm text-muted">
                          Nessun consiglio disponibile.
                        </div>
                      )}

                      <div className="rounded-3xl border border-border bg-white p-5">
                        <p className="text-sm font-semibold text-foreground">Personalizza il consiglio</p>
                        <p className="mt-1 text-sm text-muted">
                          Se non ti piace al 100%, scegli una base e aggiusta topping/extra. Alla fine generiamo un QR da mostrare al personale.
                        </p>

                        {quizRecommendedProducts.length ? (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-muted">Scegli base</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {quizRecommendedProducts.map((p) => {
                                const active = quizBaseProductId === p.id
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setQuizBaseProductId(p.id)
                                      setBasePickerOpen(false)
                                      setPersonalizeStatus("IDLE")
                                      setPersonalizeQuestions([])
                                      setPersonalizeAnswers({})
                                      setQuizOrderStatus("IDLE")
                                      setQuizOrderId("")
                                      setQuizOrderTitle("")
                                      setQuizOrderNotes("")
                                      setQuizOrderQrUrl("")
                                      void loadPersonalization(p.id)
                                    }}
                                    className={cn(
                                      "h-10 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                                      active
                                        ? "border-transparent bg-[color:var(--brand)] text-white"
                                        : "border-border bg-white text-foreground hover:bg-surface-muted"
                                    )}
                                  >
                                    {p.name}
                                  </button>
                                )
                              })}
                            </div>
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => setBasePickerOpen((v) => !v)}
                                className="h-10 rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-muted"
                              >
                                {basePickerOpen ? "Chiudi lista completa" : "Scegli da tutto il menu"}
                              </button>
                            </div>
                            {basePickerOpen ? (
                              <div className="mt-3">
                                <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
                                  <div className="max-h-[360px] overflow-y-auto">
                                    {allProducts.map((p) => {
                                      const t = getTranslatedProduct(p)
                                      return (
                                        <button
                                          key={p.id}
                                          type="button"
                                          onClick={() => {
                                            setQuizBaseProductId(p.id)
                                            setBasePickerOpen(false)
                                            setPersonalizeStatus("IDLE")
                                            setPersonalizeQuestions([])
                                            setPersonalizeAnswers({})
                                            setQuizOrderStatus("IDLE")
                                            setQuizOrderId("")
                                            setQuizOrderTitle("")
                                            setQuizOrderNotes("")
                                            setQuizOrderQrUrl("")
                                            void loadPersonalization(p.id)
                                          }}
                                          className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors duration-200 last:border-b-0 hover:bg-surface-muted"
                                        >
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                                            <p className="mt-0.5 truncate text-xs text-muted">{t.categoryName}</p>
                                          </div>
                                          {t.price ? (
                                            <div className="flex-none rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-foreground">
                                              € {t.price}
                                            </div>
                                          ) : null}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {personalizeStatus === "READY" ? (
                          <div className="mt-4 grid gap-4">
                            {personalizeQuestions.map((q) => (
                              <div key={q.id} className="rounded-3xl border border-border bg-surface p-5">
                                <p className="text-sm font-semibold text-foreground">{q.text}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {q.options.map((o) => {
                                    const selected = (personalizeAnswers[q.id] ?? []).includes(o.id)
                                    return (
                                      <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => togglePersonalAnswer(q.id, o.id, q.multi)}
                                        className={cn(
                                          "h-10 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                                          selected
                                            ? "border-transparent bg-[color:var(--brand)] text-white"
                                            : "border-border bg-white text-foreground hover:bg-surface-muted"
                                        )}
                                      >
                                        {o.label}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}

                          </div>
                        ) : null}

                        {personalizeStatus === "ERROR" ? (
                          <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                            {quizError || "AI non disponibile."}
                          </div>
                        ) : null}

                        {quizOrderStatus === "DONE" ? (
                          <div className="mt-4 grid gap-3">
                            <div className="rounded-3xl border border-border bg-surface p-4">
                              <p className="text-sm font-semibold text-foreground">{quizOrderTitle}</p>
                              {quizOrderNotes ? (
                                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{quizOrderNotes}</p>
                              ) : null}
                            </div>
                            <div className="grid place-items-center rounded-3xl border border-border bg-white p-4">
                              <img
                                alt="QR comanda speciale"
                                className="h-56 w-56"
                                src={`/api/qrcode?format=png&text=${encodeURIComponent(quizOrderQrUrl)}`}
                              />
                              <p className="mt-3 text-xs text-muted">Scansionalo per aprire la comanda</p>
                            </div>
                            <a
                              href={`/order/${quizOrderId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--accent)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:opacity-90"
                            >
                              Apri comanda
                            </a>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={quizOrderStatus === "CREATING" || !quizBaseProductId}
                            onClick={() => void createQuizOrder()}
                            className={cn(
                              "mt-4 h-11 w-full rounded-full border border-transparent px-5 text-sm font-semibold text-white transition-colors duration-200",
                              quizOrderStatus === "CREATING" || !quizBaseProductId
                                ? "bg-foreground/40"
                                : "bg-[color:var(--accent)] hover:opacity-90"
                            )}
                          >
                            {quizOrderStatus === "CREATING" ? "Creo il QR…" : "Genera QR comanda"}
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void loadQuiz()}
                          className="h-11 rounded-full border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-muted"
                        >
                          Rifai quiz
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {selected ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Chiudi dettaglio"
              onClick={closeSheet}
              className={cn(
                "absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px] transition-opacity",
                reduceMotion ? "duration-0" : "duration-200",
                isSheetClosing ? "opacity-0" : "opacity-100"
              )}
            />

            <div
              className={cn(
                "absolute inset-0",
                "transition-opacity ease-out",
                reduceMotion ? "duration-0" : "duration-200",
                isSheetClosing ? "opacity-0" : "opacity-100"
              )}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`sheet_title_${selected.id}`}
                className={cn(
                  "relative h-[100dvh] w-full overscroll-contain overflow-y-auto bg-white [-webkit-overflow-scrolling:touch]"
                )}
              >
                <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border bg-white/95 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+16px)] backdrop-blur">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-muted">
                      {selected.categoryName}
                    </p>
                    <h2
                      id={`sheet_title_${selected.id}`}
                      className="mt-1 truncate text-base font-semibold tracking-tight text-foreground"
                    >
                      {selected.name}
                    </h2>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    {selected.price ? (
                      <div className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-foreground">
                        € {selected.price}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void shareSelectedProduct()}
                      className="h-10 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-muted"
                    >
                      {shareStatus === "COPIED" ? uiText.copied : uiText.share}
                    </button>
                    <button
                      ref={closeBtnRef}
                      type="button"
                      onClick={closeSheet}
                      className="h-10 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-muted"
                    >
                      {uiText.close}
                    </button>
                  </div>
                </div>

                <div className="relative h-[42vh] w-full bg-background sm:h-[46vh]">
                  {(selected.imageUrls?.[sheetMediaIndex] ?? selected.imageUrl) ? (
                    <Image
                      src={(selected.imageUrls?.[sheetMediaIndex] ?? selected.imageUrl) as string}
                      alt={selected.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 768px"
                      priority
                    />
                  ) : selected.videoUrl ? (
                    <video
                      className="h-full w-full object-cover"
                      src={selected.videoUrl}
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                  ) : (
                    <div className="h-full w-full bg-[color:var(--brand)]/10" />
                  )}
                  {selected.imageUrls.length > 1 ? (
                    <div className="absolute inset-x-0 bottom-4 px-5">
                      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {selected.imageUrls.map((url, idx) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setSheetMediaIndex(idx)}
                            aria-label={`Foto ${idx + 1}`}
                            className={cn(
                              "relative h-11 w-11 flex-none overflow-hidden rounded-2xl border",
                              idx === sheetMediaIndex
                                ? "border-white/80"
                                : "border-white/30"
                            )}
                          >
                            <Image
                              src={url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="44px"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="px-5 pb-32 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {!selected.isAvailable ? (
                        <Badge variant="danger">Non disponibile</Badge>
                      ) : null}
                      {selected.isFeatured ? (
                        <Badge variant="brand">Consigliato</Badge>
                      ) : null}
                      {selected.isNew ? <Badge variant="muted">Novità</Badge> : null}
                      {selected.isPromo ? <Badge>Promo</Badge> : null}
                    </div>

                    {selected.shortDescription ? (
                      <p className="mt-4 text-sm text-muted">{selected.shortDescription}</p>
                    ) : null}

                    {selected.description ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
                        {selected.description}
                      </p>
                    ) : null}

                    {selectedPairings.length ? (
                      <div className="mt-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold tracking-tight">
                            {uiText.upsellTitle}
                          </p>
                          <Badge variant="muted">{selectedPairings.length}</Badge>
                        </div>

                        <p className="mt-1 text-sm text-muted">
                          Scelte pensate per stare bene insieme.
                        </p>

                        <div className="mt-3 -mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          <div className="flex gap-3 pr-5 snap-x snap-mandatory">
                            {selectedPairings.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => openProduct(p.id)}
                                className="w-[240px] flex-none snap-start overflow-hidden rounded-3xl border border-border bg-white text-left shadow-soft transition-colors duration-200 hover:bg-surface-muted"
                              >
                                <div className="relative h-28 w-full bg-background">
                                  {p.imageUrl ? (
                                    <Image
                                      src={p.imageUrl}
                                      alt={p.name}
                                      fill
                                      className="object-cover"
                                      sizes="240px"
                                      loading="lazy"
                                    />
                                  ) : p.videoUrl ? (
                                    <video
                                      className="h-full w-full object-cover"
                                      src={p.videoUrl}
                                      muted
                                      loop
                                      playsInline
                                      autoPlay
                                    />
                                  ) : (
                                    <div className="h-full w-full bg-[color:var(--brand)]/10" />
                                  )}
                                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/40 to-transparent" />
                                </div>
                                <div className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold">{p.name}</p>
                                      <p className="mt-1 truncate text-xs text-muted">
                                        {p.categoryName}
                                      </p>
                                    </div>
                                    {p.price ? (
                                      <div className="flex-none rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold">
                                        € {p.price}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {selected.ingredients ? (
                      <div className="mt-5">
                        <p className="text-sm font-semibold tracking-tight">Ingredienti</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                          {selected.ingredients}
                        </p>
                      </div>
                    ) : null}

                    {selected.allergens.length ? (
                      <div className="mt-5">
                        <p className="text-sm font-semibold tracking-tight">Allergeni</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selected.allergens.map((a) => (
                            <Badge key={a} variant="muted">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                </div>

                <div className="sticky bottom-0 z-20 border-t border-border bg-white/95 px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-4 backdrop-blur">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => closeThen(() => scrollToProduct(selected.id))}
                        className="h-11 rounded-2xl border border-border bg-white px-4 text-sm font-semibold hover:bg-surface-muted"
                      >
                        Mostra nel menu
                      </button>
                      <button
                        type="button"
                        onClick={() => closeThen(() => scrollToCategory(selected.categoryId))}
                        className="h-11 rounded-2xl border border-border bg-white px-4 text-sm font-semibold hover:bg-surface-muted"
                      >
                        Vai alla categoria
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
