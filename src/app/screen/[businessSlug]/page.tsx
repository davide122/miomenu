import Image from "next/image"
import { notFound } from "next/navigation"

import { AutoRefresh } from "@/components/screen/auto-refresh"
import { cn } from "@/lib/cn"
import { prisma } from "@/lib/db"
import { formatPrice } from "@/lib/money"
import { appUrl } from "@/lib/url"
import { qrDataUrl } from "@/lib/qrcode"

export const dynamic = "force-dynamic"

export default async function ScreenPage({
  params,
  searchParams
}: {
  params: Promise<{ businessSlug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { businessSlug } = await params
  const sp = (await searchParams) ?? {}
  const preview = sp.preview === "1"
  const cfgRaw = typeof sp.cfg === "string" ? sp.cfg : ""
  const business = await prisma.business.findFirst({
    where: { slug: businessSlug, isActive: true }
  })
  if (!business) notFound()

  const categories = await prisma.category.findMany({
    where: { businessId: business.id, isVisible: true },
    include: {
      products: {
        where: { businessId: business.id, isAvailable: true },
        include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }]
      }
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  })

  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
  const previewCfg: {
    primaryColor?: string
    themeMode?: "LIGHT" | "DARK"
    visualStyle?: "MINIMAL" | "ELEGANT" | "MODERN" | "STREET" | "LUXURY"
    fontStyle?: "INTER" | "SYSTEM" | "GEIST"
    screenUi?: Record<string, unknown>
  } | null = (() => {
    if (!preview || !cfgRaw) return null
    try {
      const parsed = JSON.parse(decodeURIComponent(cfgRaw)) as Record<string, unknown>
      const screenUi = (parsed.screenUi as Record<string, unknown> | undefined) ?? undefined
      const primaryColor = typeof parsed.primaryColor === "string" && hex.test(parsed.primaryColor) ? parsed.primaryColor : undefined
      const themeMode = parsed.themeMode === "LIGHT" || parsed.themeMode === "DARK" ? parsed.themeMode : undefined
      const visualStyle =
        parsed.visualStyle === "MINIMAL" ||
        parsed.visualStyle === "ELEGANT" ||
        parsed.visualStyle === "MODERN" ||
        parsed.visualStyle === "STREET" ||
        parsed.visualStyle === "LUXURY"
          ? parsed.visualStyle
          : undefined
      const fontStyle =
        parsed.fontStyle === "INTER" || parsed.fontStyle === "SYSTEM" || parsed.fontStyle === "GEIST"
          ? parsed.fontStyle
          : undefined

      return { primaryColor, themeMode, visualStyle, fontStyle, screenUi }
    } catch {
      return null
    }
  })()

  const effectiveThemeMode = previewCfg?.themeMode ?? business.themeMode
  const isDark = effectiveThemeMode === "DARK"
  const screenUi =
    ({
      ...(((business.screenUi as Record<string, unknown> | null) ?? {}) as Record<string, unknown>),
      ...(((previewCfg?.screenUi as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>)
    } as {
      accent?: string
      showQr?: boolean
      featuredMax?: number
      headerTitleText?: string
      headerSubtitleText?: string
      headerTitleColor?: string
      headerSubtitleColor?: string
      featuredTitleText?: string
      scanHintText?: string
      showImages?: boolean
      cardStyle?: "GLASS" | "SOLID"
      animationStyle?: "NONE" | "FADE" | "SLIDE"
      animationSpeed?: "SLOW" | "NORMAL" | "FAST"
      backgroundMotion?: boolean
    })
  const accent = screenUi?.accent ?? previewCfg?.primaryColor ?? business.primaryColor
  const showQr = screenUi?.showQr ?? false
  const featuredMax =
    typeof screenUi?.featuredMax === "number" ? screenUi.featuredMax : 6
  const headerTitleText = screenUi?.headerTitleText ?? business.name
  const headerSubtitleText = screenUi?.headerSubtitleText ?? "Menu su schermo"
  const headerTitleColor = screenUi?.headerTitleColor
  const headerSubtitleColor = screenUi?.headerSubtitleColor
  const featuredTitleText = screenUi?.featuredTitleText ?? "In evidenza"
  const scanHintText = screenUi?.scanHintText ?? "Scansiona per aprire il menu"
  const showImages = screenUi?.showImages ?? true
  const cardStyle = screenUi?.cardStyle ?? "GLASS"
  const animationStyle = screenUi?.animationStyle ?? "FADE"
  const animationSpeed = screenUi?.animationSpeed ?? "NORMAL"
  const backgroundMotion = screenUi?.backgroundMotion ?? true

  const qrImg: string | undefined = showQr
    ? await (async () => {
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
        const img = await qrDataUrl(qrLink)
        return img ?? undefined
      })()
    : undefined

  const featured = categories
    .flatMap((c) => c.products.map((p) => ({ ...p, categoryName: c.name })))
    .filter((p) => p.isFeatured || p.isPromo || p.isNew)
    .slice(0, Math.max(0, featuredMax))

  const stepMs =
    animationSpeed === "FAST" ? 4200 : animationSpeed === "SLOW" ? 9000 : 6500
  const totalMs = Math.max(1, featured.length) * stepMs
  const enableLoop = animationStyle !== "NONE" && featured.length > 4
  const slots = 4
  const loopSetsCount = enableLoop ? featured.length : 0
  const gridTotalMs = Math.max(1, loopSetsCount) * stepMs

  if (!preview) {
    await prisma.analyticsEvent.create({
      data: { businessId: business.id, type: "SCREEN_VIEW" }
    })
  }

  const cardClass = cn(
    "rounded-[28px] border backdrop-blur-xl",
    cardStyle === "SOLID"
      ? isDark
        ? "border-white/10 bg-black/35"
        : "border-border bg-white"
      : isDark
        ? "border-white/10 bg-white/5"
        : "border-border bg-surface-glass"
  )

  return (
    <div
      className={cn(
        "min-h-screen",
        isDark ? "bg-[#070A11] text-white" : "bg-background text-foreground"
      )}
      style={
        ({
          ["--brand" as never]: accent,
          ["--accent" as never]: accent
        } as never)
      }
    >
      {preview ? null : <AutoRefresh intervalMs={15000} />}
      <div className="relative min-h-screen overflow-hidden">
        <style>{`
          .tv-carousel { display: ${enableLoop ? "block" : "none"}; }
          .tv-grid { display: ${enableLoop ? "none" : "grid"}; }
          @media (prefers-reduced-motion: reduce) {
            .tv-carousel { display: none !important; }
            .tv-grid { display: grid !important; }
            .tv-slide { animation: none !important; opacity: 1 !important; transform: none !important; position: relative !important; inset: auto !important; }
            .tv-motion { animation: none !important; }
          }
          .tv-slide { opacity: 0; transform: translateY(10px) scale(1.01); }
          .tv-slide--fade { animation-name: tvFade; animation-duration: var(--total); animation-delay: calc(var(--i) * var(--step)); animation-timing-function: linear; animation-iteration-count: infinite; }
          .tv-slide--slide { animation-name: tvSlide; animation-duration: var(--total); animation-delay: calc(var(--i) * var(--step)); animation-timing-function: linear; animation-iteration-count: infinite; }
          .tv-gridcard { opacity: 0; transform: translateY(10px) scale(1.01); }
          .tv-gridcard--fade { animation-name: tvGridFade; animation-duration: var(--gTotal); animation-delay: calc(var(--set) * var(--step)); animation-timing-function: linear; animation-iteration-count: infinite; }
          .tv-gridcard--slide { animation-name: tvGridSlide; animation-duration: var(--gTotal); animation-delay: calc(var(--set) * var(--step)); animation-timing-function: linear; animation-iteration-count: infinite; }
          @keyframes tvFade {
            0% { opacity: 0; transform: translateY(10px) scale(1.01); }
            6% { opacity: 1; transform: translateY(0) scale(1); }
            24% { opacity: 1; transform: translateY(0) scale(1); }
            30% { opacity: 0; transform: translateY(-8px) scale(1); }
            100% { opacity: 0; transform: translateY(-8px) scale(1); }
          }
          @keyframes tvSlide {
            0% { opacity: 0; transform: translateY(28px) scale(1.01); }
            10% { opacity: 1; transform: translateY(0) scale(1); }
            24% { opacity: 1; transform: translateY(0) scale(1); }
            33% { opacity: 0; transform: translateY(-20px) scale(1); }
            100% { opacity: 0; transform: translateY(-20px) scale(1); }
          }
          @keyframes tvGridFade {
            0% { opacity: 0; transform: translateY(10px) scale(1.01); }
            10% { opacity: 1; transform: translateY(0) scale(1); }
            78% { opacity: 1; transform: translateY(0) scale(1); }
            92% { opacity: 0; transform: translateY(-8px) scale(1); }
            100% { opacity: 0; transform: translateY(-8px) scale(1); }
          }
          @keyframes tvGridSlide {
            0% { opacity: 0; transform: translateY(22px) scale(1.01); }
            12% { opacity: 1; transform: translateY(0) scale(1); }
            76% { opacity: 1; transform: translateY(0) scale(1); }
            92% { opacity: 0; transform: translateY(-16px) scale(1); }
            100% { opacity: 0; transform: translateY(-16px) scale(1); }
          }
          .tv-motion { animation: tvBg 16s ease-in-out infinite; }
          @keyframes tvBg {
            0% { transform: translate3d(-2%, -1%, 0) scale(1.05); opacity: .55; }
            50% { transform: translate3d(2%, 1%, 0) scale(1.08); opacity: .75; }
            100% { transform: translate3d(-2%, -1%, 0) scale(1.05); opacity: .55; }
          }
        `}</style>

        {business.coverUrl ? (
          <Image
            src={business.coverUrl}
            alt=""
            fill
            priority
            className={cn("object-cover", isDark ? "opacity-35" : "opacity-55")}
            sizes="100vw"
            unoptimized
          />
        ) : null}
        {backgroundMotion ? (
          <div
            className={cn(
              "pointer-events-none absolute -inset-20 blur-3xl",
              isDark ? "opacity-60" : "opacity-70",
              "tv-motion"
            )}
            style={
              ({
                background:
                  "radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 60%), radial-gradient(60% 60% at 80% 30%, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0) 55%), radial-gradient(70% 70% at 55% 80%, rgba(14,165,233,0.20) 0%, rgba(14,165,233,0) 55%)"
              } as never)
            }
          />
        ) : null}
        <div
          className={cn(
            "absolute inset-0",
            isDark ? "bg-black/65" : "bg-white/85"
          )}
        />

        <div className="relative z-10 grid min-h-screen grid-cols-[1.4fr_1fr] gap-10 p-10">
          <section className="min-w-0">
            <div className="flex items-center justify-between gap-6">
              <div className="min-w-0">
                <h1
                  className="truncate text-[52px] font-semibold leading-[60px] tracking-tight"
                  style={headerTitleColor ? ({ color: headerTitleColor } as never) : undefined}
                >
                  {headerTitleText}
                </h1>
                <p
                  className={cn("mt-3 text-xl", isDark ? "text-white/70" : "text-muted")}
                  style={
                    headerSubtitleColor
                      ? ({ color: headerSubtitleColor } as never)
                      : undefined
                  }
                >
                  {headerSubtitleText}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {business.logoUrl ? (
                  <div
                    className={cn(
                      "relative h-16 w-16 overflow-hidden rounded-3xl border",
                      isDark ? "border-white/10 bg-white/10" : "border-border bg-surface"
                    )}
                  >
                    <Image
                      src={business.logoUrl}
                      alt={`${business.name} logo`}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-3xl bg-[color:var(--accent)]" />
                )}
              </div>
            </div>

            <div className="mt-10">
              <div className="flex items-end justify-between gap-6">
                <h2 className="text-2xl font-semibold tracking-tight">{featuredTitleText}</h2>
                <div className={cn("text-sm", isDark ? "text-white/70" : "text-muted")}>
                  {scanHintText}
                </div>
              </div>

              <div className="mt-5">
                {featured.length ? (
                  <>
                    <div className="tv-carousel">
                      <div
                        className="relative grid grid-cols-2 gap-6"
                        style={
                          ({
                            ["--step" as never]: `${stepMs}ms`,
                            ["--gTotal" as never]: `${gridTotalMs}ms`
                          } as never)
                        }
                      >
                        {Array.from({ length: slots }).map((_, slotIndex) => (
                          <div key={slotIndex} className="relative h-[420px]">
                            {featured.map((p, setIndex) => {
                              const index = (setIndex + slotIndex) % featured.length
                              const item = featured[index]
                              const media = item.media[0]
                              const isVideo = media?.type === "VIDEO"
                              const isImage = media?.type === "IMAGE"

                              return (
                                <div
                                  key={`${item.id}_${slotIndex}_${setIndex}`}
                                  className={cn(
                                    "tv-gridcard absolute inset-0",
                                    animationStyle === "SLIDE"
                                      ? "tv-gridcard--slide"
                                      : "tv-gridcard--fade"
                                  )}
                                  style={({ ["--set" as never]: setIndex } as never)}
                                >
                                  <div className={cn(cardClass, "relative h-full overflow-hidden p-8")}>
                                    {showImages && media?.url ? (
                                      <div className="absolute inset-0">
                                        {isImage ? (
                                          <Image
                                            src={media.url}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                            sizes="40vw"
                                            unoptimized
                                          />
                                        ) : isVideo ? (
                                          <video
                                            className="h-full w-full object-cover"
                                            src={media.url}
                                            muted
                                            loop
                                            playsInline
                                            autoPlay
                                          />
                                        ) : null}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/65 via-black/30 to-black/10" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                                      </div>
                                    ) : null}

                                    <div className="relative z-10 flex h-full flex-col justify-end">
                                      <div className="flex items-end justify-between gap-8">
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium text-white/80">
                                            {item.categoryName}
                                          </p>
                                          <p className="mt-2 truncate text-5xl font-semibold tracking-tight text-white">
                                            {item.name}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-5xl font-semibold tracking-tight text-white">
                                            {item.price ? `€ ${formatPrice(item.price)}` : "—"}
                                          </p>
                                        </div>
                                      </div>
                                      {item.shortDescription ? (
                                        <p className="mt-4 line-clamp-2 text-2xl text-white/85">
                                          {item.shortDescription}
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="tv-grid grid grid-cols-2 gap-4">
                      {featured.slice(0, 4).map((p) => {
                        const media = p.media[0]
                        return (
                          <div key={p.id} className={cn(cardClass, "p-6")}>
                            <div className="flex items-start justify-between gap-5">
                              <div className="min-w-0">
                                <div className="flex items-center gap-4">
                                  {showImages && media?.url ? (
                                    <div
                                      className={cn(
                                        "relative h-16 w-16 overflow-hidden rounded-2xl border",
                                        isDark
                                          ? "border-white/10 bg-black/20"
                                          : "border-border bg-surface"
                                      )}
                                    >
                                      {media.type === "IMAGE" ? (
                                        <Image
                                          src={media.url}
                                          alt={p.name}
                                          fill
                                          className="object-cover"
                                          sizes="64px"
                                          unoptimized
                                        />
                                      ) : (
                                        <video
                                          className="h-full w-full object-cover"
                                          src={media.url}
                                          muted
                                          loop
                                          playsInline
                                          autoPlay
                                        />
                                      )}
                                    </div>
                                  ) : null}
                                  <div className="min-w-0">
                                    <p className="truncate text-2xl font-semibold tracking-tight">
                                      {p.name}
                                    </p>
                                    <p
                                      className={cn(
                                        "mt-2 text-sm",
                                        isDark ? "text-white/70" : "text-muted"
                                      )}
                                    >
                                      {p.categoryName}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-semibold tracking-tight">
                                  {p.price ? `€ ${formatPrice(p.price)}` : "—"}
                                </p>
                              </div>
                            </div>

                            {p.shortDescription ? (
                              <p
                                className={cn(
                                  "mt-4 line-clamp-2 text-lg",
                                  isDark ? "text-white/80" : "text-foreground/80"
                                )}
                              >
                                {p.shortDescription}
                              </p>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div
                    className={cn(
                      cardClass,
                      "p-7 text-lg",
                      isDark ? "text-white/70" : "text-muted"
                    )}
                  >
                    Nessun prodotto in evidenza. Attiva “Metti in evidenza” su alcuni prodotti.
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="min-w-0">
            <div className="grid gap-6">
              {showQr ? (
                <div className={cn(cardClass, "p-6")}>
                  <p className="text-sm font-medium">QR Menu</p>
                  <div className="mt-5 flex items-center gap-5">
                    <div className="rounded-3xl bg-white p-3">
                      {qrImg ? (
                        <Image src={qrImg} alt="QR menu" width={176} height={176} />
                      ) : (
                        <div className="h-[176px] w-[176px] rounded-3xl bg-black/5" />
                      )}
                    </div>
                    <div className={cn("text-base", isDark ? "text-white/80" : "text-muted")}>
                      Apri il menu sul telefono
                      <div className={cn("mt-2 text-sm", isDark ? "text-white/60" : "text-muted")}>
                        /menu/{business.slug}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className={cn(cardClass, "p-6")}>
                <p className="text-sm font-medium">Categorie</p>
                <div className="mt-5 grid gap-5">
                  {categories.slice(0, 6).map((c) => (
                    <div key={c.id} className="min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="truncate text-lg font-semibold">{c.name}</p>
                        <p className={cn("text-sm", isDark ? "text-white/70" : "text-muted")}>
                          {c.products.length}
                        </p>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {c.products.slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            className={cn(
                              "flex items-center justify-between gap-5 rounded-3xl border px-4 py-3",
                              isDark
                                ? "border-white/10 bg-black/10"
                                : "border-border bg-surface"
                            )}
                            style={
                              isDark
                                ? ({ backgroundColor: "rgba(0,0,0,0.18)" } as never)
                                : undefined
                            }
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              {showImages && p.media[0]?.url ? (
                                <div
                                  className={cn(
                                    "relative h-10 w-10 flex-none overflow-hidden rounded-2xl border",
                                    isDark
                                      ? "border-white/10 bg-black/20"
                                      : "border-border bg-surface"
                                  )}
                                >
                                  {p.media[0].type === "IMAGE" ? (
                                    <Image
                                      src={p.media[0].url}
                                      alt={p.name}
                                      fill
                                      className="object-cover"
                                      sizes="40px"
                                      unoptimized
                                    />
                                  ) : (
                                    <video
                                      className="h-full w-full object-cover"
                                      src={p.media[0].url}
                                      muted
                                      loop
                                      playsInline
                                      autoPlay
                                    />
                                  )}
                                </div>
                              ) : null}
                              <p className="truncate text-base font-medium">{p.name}</p>
                            </div>
                            <p className={cn("text-base", isDark ? "text-white/80" : "text-foreground/80")}>
                              {p.price ? `€ ${formatPrice(p.price)}` : "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cn("text-xs", isDark ? "text-white/50" : "text-muted")}>
                Aggiornamento automatico attivo
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
