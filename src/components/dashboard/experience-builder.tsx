"use client"

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import { suggestExperienceAiAction, updateExperienceAction } from "@/lib/business/actions"

type ThemeMode = "LIGHT" | "DARK"
type VisualStyle = "MINIMAL" | "ELEGANT" | "MODERN" | "STREET" | "LUXURY"
type FontStyle = "INTER" | "SYSTEM" | "GEIST"
type ScreenLayout = "LANDSCAPE_16_9" | "PORTRAIT_9_16"

type MenuUi = {
  accent?: string
  heroSurface?: ThemeMode
  heroHeaderStyle?: "glass" | "solid" | "clean"
  heroMood?: VisualStyle
  heroPillText?: string
  heroSubtitleText?: string
  heroTitleColor?: string
  heroSubtitleColor?: string
  showFeaturedRail?: boolean
  showSocial?: boolean
}

type ScreenUi = {
  accent?: string
  headerTitleText?: string
  headerSubtitleText?: string
  headerTitleColor?: string
  headerSubtitleColor?: string
  featuredTitleText?: string
  scanHintText?: string
  showQr?: boolean
  featuredMax?: number
  showImages?: boolean
  cardStyle?: "GLASS" | "SOLID"
  animationStyle?: "NONE" | "FADE" | "SLIDE"
  animationSpeed?: "SLOW" | "NORMAL" | "FAST"
  backgroundMotion?: boolean
}

type ActionResult = { ok: true } | { ok: false; error: string } | undefined
type AiResult =
  | {
      ok: true
      menuUi?: Partial<MenuUi>
      screenUi?: Partial<ScreenUi>
    }
  | { ok: false; error: string }
  | undefined

function isHexColor(value: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}

function ColorPickerField({
  label,
  value,
  placeholder,
  onChange,
  allowEmpty,
  hint
}: {
  label: string
  value: string | undefined
  placeholder: string
  onChange: (next: string | undefined) => void
  allowEmpty?: boolean
  hint?: string
}) {
  const presets = useMemo(
    () => ["#111111", "#0F172A", "#2563EB", "#16A34A", "#D97706", "#DC2626", "#7C3AED", "#0EA5E9"],
    []
  )

  const safe = value && isHexColor(value) ? value : undefined
  const fallback = isHexColor(placeholder) ? placeholder : "#111111"

  const [text, setText] = useState(safe ?? "")
  useEffect(() => setText(safe ?? ""), [safe])

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={safe ?? fallback}
            aria-label={label}
            onChange={(e) => {
              const next = e.currentTarget.value
              setText(next)
              onChange(next)
            }}
            className="h-11 w-11 cursor-pointer rounded-2xl border border-border bg-surface p-1"
          />
          <input
            value={text}
            onChange={(e) => {
              const next = e.currentTarget.value.trim()
              setText(next)
              if (allowEmpty && !next) onChange(undefined)
              else if (isHexColor(next)) onChange(next)
            }}
            onBlur={() => {
              const next = text.trim()
              if (allowEmpty && !next) {
                setText("")
                onChange(undefined)
                return
              }
              if (isHexColor(next)) {
                setText(next)
                onChange(next)
                return
              }
              setText(safe ?? "")
            }}
            placeholder={placeholder}
            className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground outline-none transition-colors duration-200 focus:border-[color:var(--accent)]/35 focus:ring-2 focus:ring-[color:var(--accent)]/15"
          />
          {allowEmpty ? (
            <button
              type="button"
              onClick={() => {
                setText("")
                onChange(undefined)
              }}
              className="h-11 flex-none rounded-2xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-muted"
            >
              Auto
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {presets.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Imposta colore ${c}`}
              onClick={() => {
                setText(c)
                onChange(c)
              }}
              className="h-9 w-9 rounded-2xl border border-border transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

function pill(active: boolean) {
  return cn(
    "inline-flex h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors duration-200",
    active
      ? "border-transparent bg-[color:var(--accent)] text-white"
      : "border-border bg-surface text-foreground hover:bg-surface-muted"
  )
}

function selectClass() {
  return "h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground outline-none transition-colors duration-200 focus:border-[color:var(--accent)]/35 focus:ring-2 focus:ring-[color:var(--accent)]/15"
}

function menuCopy(mood: VisualStyle) {
  const pill =
    mood === "LUXURY"
      ? "Menu"
      : mood === "STREET"
        ? "Menu street"
        : mood === "ELEGANT"
          ? "Menu elegante"
          : mood === "MODERN"
            ? "Menu moderno"
            : "Menu"

  const subtitle =
    mood === "LUXURY"
      ? "Scorri, scegli, chiedi. Pochi secondi."
      : mood === "STREET"
        ? "Tap veloce, scelta semplice."
        : mood === "ELEGANT"
          ? "Scorri e scegli con calma."
          : mood === "MODERN"
            ? "Scorri e scegli velocemente."
            : "Scorri e scegli velocemente."

  return { pill, subtitle }
}

function screenCopy(mood: VisualStyle) {
  const featuredTitle =
    mood === "LUXURY"
      ? "Selezione"
      : mood === "STREET"
        ? "Da provare"
        : "In evidenza"

  const scanHint =
    mood === "LUXURY"
      ? "Scansiona per aprire il menu"
      : mood === "STREET"
        ? "Scansiona e ordina"
        : "Scansiona per aprire il menu"

  return { featuredTitle, scanHint }
}

export function ExperienceBuilder({
  businessId,
  businessSlug,
  initial
}: {
  businessId: string
  businessSlug: string
  initial: {
    primaryColor: string
    themeMode: ThemeMode
    visualStyle: VisualStyle
    fontStyle: FontStyle
    menuUi: MenuUi | null
    screenUi: ScreenUi | null
    screenLayout: ScreenLayout
  }
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateExperienceAction,
    undefined
  )
  const [aiState, aiAction, aiPending] = useActionState<AiResult, FormData>(
    suggestExperienceAiAction,
    undefined
  )
  const [, startTransition] = useTransition()

  const [tab, setTab] = useState<"MENU" | "SCREEN">("MENU")
  const [previewVersion, setPreviewVersion] = useState(0)
  const [previewMode, setPreviewMode] = useState<"DRAFT" | "LIVE">("DRAFT")
  const [liveVersion, setLiveVersion] = useState(0)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const skipFirstSave = useRef(true)

  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor)
  const [themeMode, setThemeMode] = useState<ThemeMode>(initial.themeMode)
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(initial.visualStyle)
  const [fontStyle, setFontStyle] = useState<FontStyle>(initial.fontStyle)

  const [menuUi, setMenuUi] = useState<MenuUi>({
    accent: initial.menuUi?.accent,
    heroSurface: initial.menuUi?.heroSurface,
    heroHeaderStyle: initial.menuUi?.heroHeaderStyle,
    heroMood: initial.menuUi?.heroMood,
    heroPillText: initial.menuUi?.heroPillText,
    heroSubtitleText: initial.menuUi?.heroSubtitleText,
    heroTitleColor: initial.menuUi?.heroTitleColor,
    heroSubtitleColor: initial.menuUi?.heroSubtitleColor,
    showFeaturedRail: initial.menuUi?.showFeaturedRail,
    showSocial: initial.menuUi?.showSocial
  })

  const [screenLayout, setScreenLayout] = useState<ScreenLayout>(initial.screenLayout)
  const [screenUi, setScreenUi] = useState<ScreenUi>({
    accent: initial.screenUi?.accent,
    headerTitleText: initial.screenUi?.headerTitleText,
    headerSubtitleText: initial.screenUi?.headerSubtitleText,
    headerTitleColor: initial.screenUi?.headerTitleColor,
    headerSubtitleColor: initial.screenUi?.headerSubtitleColor,
    featuredTitleText: initial.screenUi?.featuredTitleText,
    scanHintText: initial.screenUi?.scanHintText,
    showQr: initial.screenUi?.showQr,
    featuredMax: initial.screenUi?.featuredMax,
    showImages: initial.screenUi?.showImages,
    cardStyle: initial.screenUi?.cardStyle,
    animationStyle: initial.screenUi?.animationStyle,
    animationSpeed: initial.screenUi?.animationSpeed,
    backgroundMotion: initial.screenUi?.backgroundMotion
  })

  const effectiveAccent = useMemo(() => {
    return (tab === "MENU" ? menuUi.accent : screenUi.accent) || primaryColor
  }, [menuUi.accent, primaryColor, screenUi.accent, tab])

  const previewCfg = useMemo(() => {
    return encodeURIComponent(
      JSON.stringify({
        primaryColor,
        themeMode,
        visualStyle,
        fontStyle,
        menuUi,
        screenUi,
        screenLayout
      })
    )
  }, [fontStyle, menuUi, primaryColor, screenLayout, screenUi, themeMode, visualStyle])

  const persistCfg = useMemo(() => {
    return JSON.stringify({
      primaryColor,
      themeMode,
      visualStyle,
      fontStyle,
      menuUi,
      screenUi,
      screenLayout
    })
  }, [fontStyle, menuUi, primaryColor, screenLayout, screenUi, themeMode, visualStyle])

  useEffect(() => {
    if (!aiState) return
    if (!aiState.ok) return
    if (aiState.menuUi) setMenuUi((v) => ({ ...v, ...(aiState.menuUi ?? {}) }))
    if (aiState.screenUi) setScreenUi((v) => ({ ...v, ...(aiState.screenUi ?? {}) }))
  }, [aiState])

  useEffect(() => {
    const t = window.setTimeout(() => setPreviewVersion((v) => v + 1), 250)
    return () => window.clearTimeout(t)
  }, [previewCfg, tab])

  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false
      return
    }

    setSaveStatus("saving")
    const t = window.setTimeout(() => {
      const fd = new FormData()
      fd.set("mode", "autosave")
      fd.set("businessId", businessId)
      fd.set("primaryColor", primaryColor)
      fd.set("themeMode", themeMode)
      fd.set("visualStyle", visualStyle)
      fd.set("fontStyle", fontStyle)
      fd.set("menuUi", JSON.stringify(menuUi))
      fd.set("screenUi", JSON.stringify(screenUi))
      fd.set("screenLayout", screenLayout)

      startTransition(() => {
        formAction(fd)
      })
    }, 650)

    return () => window.clearTimeout(t)
  }, [businessId, formAction, fontStyle, menuUi, persistCfg, primaryColor, screenLayout, screenUi, themeMode, visualStyle])

  useEffect(() => {
    if (pending) return
    if (saveStatus !== "saving") return
    if (state && "ok" in state && state.ok === false) setSaveStatus("error")
    else {
      setSaveStatus("saved")
      setLiveVersion((v) => v + 1)
    }
  }, [pending, saveStatus, state])

  const previewSrc =
    tab === "MENU"
      ? previewMode === "DRAFT"
        ? `/menu/${businessSlug}?preview=1&cfg=${previewCfg}&v=${previewVersion}`
        : `/menu/${businessSlug}?preview=1&v=${liveVersion}`
      : previewMode === "DRAFT"
        ? `/screen/${businessSlug}?preview=1&cfg=${previewCfg}&v=${previewVersion}`
        : `/screen/${businessSlug}?preview=1&v=${liveVersion}`

  return (
    <div
      className="grid gap-6 lg:grid-cols-[420px_1fr] lg:items-start"
      style={
        {
          ["--accent" as never]: effectiveAccent,
          ["--brand" as never]: effectiveAccent
        } as never
      }
    >
      <form
        action={formAction}
        className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6"
      >
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="mode" value="autosave" />
        <input type="hidden" name="primaryColor" value={primaryColor} />
        <input type="hidden" name="menuUi" value={JSON.stringify(menuUi)} />
        <input type="hidden" name="screenUi" value={JSON.stringify(screenUi)} />
        <input type="hidden" name="screenLayout" value={screenLayout} />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Personalizza esperienza
            </h2>
            <p className="mt-1 text-sm text-muted">
              Cambia e vedi l’anteprima. Si salva da solo.
            </p>
          </div>
          <div
            className={cn(
              "inline-flex h-11 items-center rounded-full border px-4 text-sm font-medium",
              "border-border bg-surface-muted text-foreground"
            )}
          >
            {pending || saveStatus === "saving"
              ? "Salvataggio…"
              : saveStatus === "error" || (state && "ok" in state && state.ok === false)
                ? "Errore salvataggio"
                : saveStatus === "saved"
                  ? "Salvato"
                  : "Pronto"}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("MENU")}
            className={pill(tab === "MENU")}
          >
            Menu mobile
          </button>
          <button
            type="button"
            onClick={() => setTab("SCREEN")}
            className={pill(tab === "SCREEN")}
          >
            TV Mode
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <ColorPickerField
            label="Colore principale"
            value={primaryColor}
            placeholder="#111111"
            onChange={(next) => setPrimaryColor(next || "#111111")}
            hint="Usalo solo per CTA e stati attivi. Il resto resta neutro."
          />

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Tema</label>
            <select
              name="themeMode"
              value={themeMode}
              onChange={(e) => setThemeMode(e.currentTarget.value as ThemeMode)}
              className={selectClass()}
            >
              <option value="LIGHT">Chiaro</option>
              <option value="DARK">Scuro</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Stile</label>
            <select
              name="visualStyle"
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.currentTarget.value as VisualStyle)}
              className={selectClass()}
            >
              <option value="MINIMAL">Minimal</option>
              <option value="ELEGANT">Elegant</option>
              <option value="MODERN">Modern</option>
              <option value="STREET">Street</option>
              <option value="LUXURY">Luxury</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Font</label>
            <select
              name="fontStyle"
              value={fontStyle}
              onChange={(e) => setFontStyle(e.currentTarget.value as FontStyle)}
              className={selectClass()}
            >
              <option value="INTER">Inter</option>
              <option value="SYSTEM">System</option>
              <option value="GEIST">Geist</option>
            </select>
          </div>

          {tab === "MENU" ? (
            <div className="grid gap-4 rounded-3xl border border-border bg-surface-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">Hero</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fd = new FormData()
                      fd.set("businessId", businessId)
                      fd.set("target", "MENU")
                      startTransition(() => aiAction(fd))
                    }}
                    disabled={aiPending}
                    className="h-10 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-muted"
                  >
                    AI
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const mood = menuUi.heroMood ?? visualStyle
                      const copy = menuCopy(mood)
                      setMenuUi((v) => ({
                        ...v,
                        heroPillText: copy.pill,
                        heroSubtitleText: copy.subtitle,
                        heroTitleColor: undefined,
                        heroSubtitleColor: undefined,
                        heroHeaderStyle: v.heroHeaderStyle ?? "glass",
                        heroSurface: v.heroSurface ?? themeMode,
                        showFeaturedRail: v.showFeaturedRail ?? true,
                        showSocial: v.showSocial ?? true
                      }))
                    }}
                    className="h-10 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-muted"
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMenuUi((v) => ({
                        ...v,
                        heroPillText: undefined,
                        heroSubtitleText: undefined,
                        heroTitleColor: undefined,
                        heroSubtitleColor: undefined
                      }))
                    }
                    className="h-10 rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-muted"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Etichetta (pill)
                </label>
                <input
                  value={menuUi.heroPillText ?? ""}
                  onChange={(e) => {
                    const next = e.currentTarget.value.trim()
                    setMenuUi((v) => ({
                      ...v,
                      heroPillText: next || undefined
                    }))
                  }}
                  className={selectClass()}
                  placeholder="Menu"
                />
                <p className="text-xs text-muted">Testo breve sopra il titolo.</p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Sottotitolo
                </label>
                <input
                  value={menuUi.heroSubtitleText ?? ""}
                  onChange={(e) => {
                    const next = e.currentTarget.value.trim()
                    setMenuUi((v) => ({
                      ...v,
                      heroSubtitleText: next || undefined
                    }))
                  }}
                  className={selectClass()}
                  placeholder="Scorri e scegli velocemente."
                />
              </div>

              <div className="grid gap-2">
                <ColorPickerField
                  label="Accent hero"
                  value={menuUi.accent}
                  placeholder={primaryColor}
                  allowEmpty
                  onChange={(next) =>
                    setMenuUi((v) => ({
                      ...v,
                      accent: next
                    }))
                  }
                  hint="Se lasci Auto, usa il colore principale."
                />
              </div>

              <ColorPickerField
                label="Colore titolo"
                value={menuUi.heroTitleColor}
                placeholder="#FFFFFF"
                allowEmpty
                onChange={(next) =>
                  setMenuUi((v) => ({
                    ...v,
                    heroTitleColor: next
                  }))
                }
                hint="Auto = colore ottimizzato per la leggibilità."
              />

              <ColorPickerField
                label="Colore sottotitolo"
                value={menuUi.heroSubtitleColor}
                placeholder="#FFFFFF"
                allowEmpty
                onChange={(next) =>
                  setMenuUi((v) => ({
                    ...v,
                    heroSubtitleColor: next
                  }))
                }
                hint="Auto = colore ottimizzato per la leggibilità."
              />

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Superficie hero
                </label>
                <select
                  value={menuUi.heroSurface ?? themeMode}
                  onChange={(e) => {
                    const next = e.currentTarget.value as ThemeMode
                    setMenuUi((v) => ({
                      ...v,
                      heroSurface: next
                    }))
                  }}
                  className={selectClass()}
                >
                  <option value="LIGHT">Chiara</option>
                  <option value="DARK">Scura</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Stile pill hero
                </label>
                <select
                  value={menuUi.heroHeaderStyle ?? "glass"}
                  onChange={(e) => {
                    const next = e.currentTarget.value as MenuUi["heroHeaderStyle"]
                    setMenuUi((v) => ({
                      ...v,
                      heroHeaderStyle: next
                    }))
                  }}
                  className={selectClass()}
                >
                  <option value="glass">Glass</option>
                  <option value="clean">Clean</option>
                  <option value="solid">Solid</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Mood</label>
                <select
                  value={menuUi.heroMood ?? visualStyle}
                  onChange={(e) => {
                    const next = e.currentTarget.value as VisualStyle
                    setMenuUi((v) => ({
                      ...v,
                      heroMood: next
                    }))
                  }}
                  className={selectClass()}
                >
                  <option value="MINIMAL">Minimal</option>
                  <option value="ELEGANT">Elegant</option>
                  <option value="MODERN">Modern</option>
                  <option value="STREET">Street</option>
                  <option value="LUXURY">Luxury</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Sezioni</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMenuUi((v) => ({
                        ...v,
                        showFeaturedRail: !(v.showFeaturedRail ?? true)
                      }))
                    }
                    className={pill(menuUi.showFeaturedRail ?? true)}
                  >
                    In evidenza
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMenuUi((v) => ({
                        ...v,
                        showSocial: !(v.showSocial ?? true)
                      }))
                    }
                    className={pill(menuUi.showSocial ?? true)}
                  >
                    Social
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 rounded-3xl border border-border bg-surface-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">TV Mode</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fd = new FormData()
                      fd.set("businessId", businessId)
                      fd.set("target", "SCREEN")
                      startTransition(() => aiAction(fd))
                    }}
                    disabled={aiPending}
                    className="h-10 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-muted"
                  >
                    AI
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const mood = visualStyle
                      const copy = screenCopy(mood)
                      setScreenUi((v) => ({
                        ...v,
                        headerSubtitleText: v.headerSubtitleText ?? "Menu su schermo",
                        featuredTitleText: copy.featuredTitle,
                        scanHintText: copy.scanHint,
                        headerTitleColor: undefined,
                        headerSubtitleColor: undefined,
                        showQr: v.showQr ?? false,
                        featuredMax: v.featuredMax ?? 6
                      }))
                    }}
                    className="h-10 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-muted"
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setScreenUi((v) => ({
                        ...v,
                        headerTitleText: undefined,
                        headerSubtitleText: undefined,
                        featuredTitleText: undefined,
                        scanHintText: undefined,
                        headerTitleColor: undefined,
                        headerSubtitleColor: undefined
                      }))
                    }
                    className="h-10 rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-muted"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Titolo</label>
                <input
                  value={screenUi.headerTitleText ?? ""}
                  onChange={(e) => {
                    const next = e.currentTarget.value.trim()
                    setScreenUi((v) => ({
                      ...v,
                      headerTitleText: next || undefined
                    }))
                  }}
                  className={selectClass()}
                  placeholder="Nome attività"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Sottotitolo
                </label>
                <input
                  value={screenUi.headerSubtitleText ?? ""}
                  onChange={(e) => {
                    const next = e.currentTarget.value.trim()
                    setScreenUi((v) => ({
                      ...v,
                      headerSubtitleText: next || undefined
                    }))
                  }}
                  className={selectClass()}
                  placeholder="Menu su schermo"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Layout schermo
                </label>
                <select
                  value={screenLayout}
                  onChange={(e) => setScreenLayout(e.currentTarget.value as ScreenLayout)}
                  className={selectClass()}
                >
                  <option value="LANDSCAPE_16_9">Orizzontale 16:9</option>
                  <option value="PORTRAIT_9_16">Verticale 9:16</option>
                </select>
              </div>

              <div className="grid gap-2">
                <ColorPickerField
                  label="Accent TV"
                  value={screenUi.accent}
                  placeholder={primaryColor}
                  allowEmpty
                  onChange={(next) =>
                    setScreenUi((v) => ({
                      ...v,
                      accent: next
                    }))
                  }
                  hint="Se lasci Auto, usa il colore principale."
                />
              </div>

              <ColorPickerField
                label="Colore titolo"
                value={screenUi.headerTitleColor}
                placeholder={themeMode === "DARK" ? "#FFFFFF" : "#111111"}
                allowEmpty
                onChange={(next) =>
                  setScreenUi((v) => ({
                    ...v,
                    headerTitleColor: next
                  }))
                }
                hint="Auto = colore ottimizzato per la leggibilità."
              />

              <ColorPickerField
                label="Colore sottotitolo"
                value={screenUi.headerSubtitleColor}
                placeholder={themeMode === "DARK" ? "#FFFFFF" : "#6E6E6E"}
                allowEmpty
                onChange={(next) =>
                  setScreenUi((v) => ({
                    ...v,
                    headerSubtitleColor: next
                  }))
                }
                hint="Auto = colore ottimizzato per la leggibilità."
              />

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Titolo sezione (in evidenza)
                </label>
                <input
                  value={screenUi.featuredTitleText ?? ""}
                  onChange={(e) => {
                    const next = e.currentTarget.value.trim()
                    setScreenUi((v) => ({
                      ...v,
                      featuredTitleText: next || undefined
                    }))
                  }}
                  className={selectClass()}
                  placeholder="In evidenza"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Testo suggerimento (scan)
                </label>
                <input
                  value={screenUi.scanHintText ?? ""}
                  onChange={(e) => {
                    const next = e.currentTarget.value.trim()
                    setScreenUi((v) => ({
                      ...v,
                      scanHintText: next || undefined
                    }))
                  }}
                  className={selectClass()}
                  placeholder="Scansiona per aprire il menu"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Elementi</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setScreenUi((v) => ({ ...v, showQr: !(v.showQr ?? false) }))
                    }
                    className={pill(screenUi.showQr ?? false)}
                  >
                    QR visibile
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setScreenUi((v) => ({
                        ...v,
                        showImages: !(v.showImages ?? true)
                      }))
                    }
                    className={pill(screenUi.showImages ?? true)}
                  >
                    Immagini
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setScreenUi((v) => ({
                        ...v,
                        backgroundMotion: !(v.backgroundMotion ?? true)
                      }))
                    }
                    className={pill(screenUi.backgroundMotion ?? true)}
                  >
                    Sfondo
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Stile card</label>
                <select
                  value={screenUi.cardStyle ?? "GLASS"}
                  onChange={(e) => {
                    const next = e.currentTarget.value as ScreenUi["cardStyle"]
                    setScreenUi((v) => ({ ...v, cardStyle: next }))
                  }}
                  className={selectClass()}
                >
                  <option value="GLASS">Glass</option>
                  <option value="SOLID">Solid</option>
                </select>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Animazione</label>
                  <select
                    value={screenUi.animationStyle ?? "FADE"}
                    onChange={(e) => {
                      const next = e.currentTarget.value as ScreenUi["animationStyle"]
                      setScreenUi((v) => ({ ...v, animationStyle: next }))
                    }}
                    className={selectClass()}
                  >
                    <option value="NONE">Nessuna</option>
                    <option value="FADE">Fade</option>
                    <option value="SLIDE">Slide</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Velocità</label>
                  <select
                    value={screenUi.animationSpeed ?? "NORMAL"}
                    onChange={(e) => {
                      const next = e.currentTarget.value as ScreenUi["animationSpeed"]
                      setScreenUi((v) => ({ ...v, animationSpeed: next }))
                    }}
                    className={selectClass()}
                  >
                    <option value="SLOW">Lenta</option>
                    <option value="NORMAL">Normale</option>
                    <option value="FAST">Veloce</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Prodotti in evidenza
                </label>
                <select
                  value={String(screenUi.featuredMax ?? 6)}
                  onChange={(e) => {
                    const next = Number(e.currentTarget.value)
                    setScreenUi((v) => ({
                      ...v,
                      featuredMax: next
                    }))
                  }}
                  className={selectClass()}
                >
                  {[0, 2, 4, 6, 8, 10, 12].map((n) => (
                    <option key={n} value={String(n)}>
                      {n === 0 ? "Nessuno" : `${n} prodotti`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {state && "ok" in state && state.ok === false ? (
            <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
              {state.error}
            </div>
          ) : aiState && "ok" in aiState && aiState.ok === false ? (
            <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
              {aiState.error}
            </div>
          ) : null}
        </div>
      </form>

      <section className="rounded-3xl border border-border bg-surface p-3 shadow-soft sm:p-4">
        <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Anteprima</p>
            <p className="mt-1 text-sm text-muted">
              {tab === "MENU" ? "Menu mobile" : "TV Mode"} ·{" "}
              {previewMode === "DRAFT" ? "Bozza (non salvata)" : "Live (salvata)"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode("DRAFT")}
              className={pill(previewMode === "DRAFT")}
            >
              Bozza
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("LIVE")}
              className={pill(previewMode === "LIVE")}
            >
              Live
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-background">
          <iframe
            key={`${tab}_${previewVersion}`}
            src={previewSrc}
            className={cn(
              "w-full",
              tab === "MENU" ? "h-[820px]" : "h-[820px]"
            )}
          />
        </div>
      </section>
    </div>
  )
}
