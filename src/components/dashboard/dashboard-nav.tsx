"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { cn } from "@/lib/cn"

export type DashboardNavItem = {
  href: string
  label: string
  icon:
    | "home"
    | "menu"
    | "categories"
    | "products"
    | "orders"
    | "media"
    | "qrcode"
    | "screens"
    | "schedule"
    | "analytics"
    | "settings"
    | "billing"
    | "promotions"
    | "ai"
}

function isActivePath(pathname: string | null, href: string) {
  const p = pathname ?? ""
  if (href === "/dashboard") return p === "/dashboard"
  return p === href || p.startsWith(`${href}/`)
}

function reportDashboardDebug(hypothesisId: string, location: string, msg: string, data: Record<string, unknown>) {
  // #region debug-point A:dashboard-nav-report
  fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "dashboard-tab-lag",
      runId: "post-fix",
      hypothesisId,
      location,
      msg,
      data,
      ts: Date.now()
    })
  }).catch(() => {})
  // #endregion
}

function Icon({ name, className }: { name: DashboardNavItem["icon"]; className?: string }) {
  const cls = cn("h-5 w-5", className)
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M4 10.8 12 4l8 6.8v8.6a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 19.4v-8.6Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 21v-6.2a1.4 1.4 0 0 1 1.4-1.4h2.8a1.4 1.4 0 0 1 1.4 1.4V21"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      )
    case "menu":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M7 7h10M7 12h10M7 17h7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      )
    case "categories":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M6 6.5h6v6H6v-6Zm0 11h6v-6H6v6Zm12-11h-6v6h6v-6Zm0 11h-6v-6h6v6Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "products":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M7 7.5h10v11.2A2.3 2.3 0 0 1 14.7 21H9.3A2.3 2.3 0 0 1 7 18.7V7.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M9 7.5V6.7A2.7 2.7 0 0 1 11.7 4h.6A2.7 2.7 0 0 1 15 6.7v.8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M9.5 12h5M9.5 15.5h3.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      )
    case "orders":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M8 7h8M8 11h8M8 15h5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M7 4.8h10A2.2 2.2 0 0 1 19.2 7v12A2.2 2.2 0 0 1 17 21.2H7A2.2 2.2 0 0 1 4.8 19V7A2.2 2.2 0 0 1 7 4.8Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "media":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M6.2 6.8h11.6A2.2 2.2 0 0 1 20 9v9.8A2.2 2.2 0 0 1 17.8 21H6.2A2.2 2.2 0 0 1 4 18.8V9a2.2 2.2 0 0 1 2.2-2.2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M9 14.7 11.4 12l2 2.5 1.3-1.4 2.3 2.9"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.4 10.2h.01"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )
    case "qrcode":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M5.5 5.5h5.5v5.5H5.5V5.5Zm0 7.5h5.5v5.5H5.5V13Zm7.5-7.5h5.5v5.5H13V5.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M13 13h3v3h-3v-3Zm5.5 0V18.5H15"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 18.5V21H13"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "screens":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M6.4 7.2h11.2A2.4 2.4 0 0 1 20 9.6v6.8A2.4 2.4 0 0 1 17.6 18.8H6.4A2.4 2.4 0 0 1 4 16.4V9.6a2.4 2.4 0 0 1 2.4-2.4Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M10 18.8v1.8h4v-1.8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      )
    case "schedule":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M7 5.6v2.7M17 5.6v2.7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M6.2 8.3h11.6A2.2 2.2 0 0 1 20 10.5v8.3A2.2 2.2 0 0 1 17.8 21H6.2A2.2 2.2 0 0 1 4 18.8v-8.3a2.2 2.2 0 0 1 2.2-2.2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 12h4.5M7.5 15.2h6.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      )
    case "analytics":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M5.5 19.5h13"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M8 17.5v-5M12 17.5V9M16 17.5V6.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      )
    case "settings":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M12 14.3a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M19.2 12a7.2 7.2 0 0 0-.08-1l2-1.2-2-3.4-2.3.8a7.3 7.3 0 0 0-1.6-.9l-.4-2.4H10l-.4 2.4c-.55.23-1.08.54-1.58.9l-2.32-.8-2 3.4 2 1.2a7.2 7.2 0 0 0 0 2l-2 1.2 2 3.4 2.3-.8c.5.36 1.03.67 1.6.9l.4 2.4h4.4l.4-2.4c.55-.23 1.08-.54 1.58-.9l2.32.8 2-3.4-2-1.2c.05-.33.08-.66.08-1Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "billing":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M6.5 8.3h11A2.5 2.5 0 0 1 20 10.8v6.4a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.2v-6.4a2.5 2.5 0 0 1 2.5-2.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M4.6 12h14.8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M7.5 16h4.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      )
    case "promotions":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M7 9.2V7.6A2.6 2.6 0 0 1 9.6 5h7.8A1.6 1.6 0 0 1 19 6.6v12.8A1.6 1.6 0 0 1 17.4 21H9.6A2.6 2.6 0 0 1 7 18.4v-1.6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M5 12h8M9.2 9.2 12 12l-2.8 2.8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "ai":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden="true">
          <path
            d="M12 3l1.1 3.5L16.6 7.6l-3.5 1.1L12 12.2l-1.1-3.5L7.4 7.6l3.5-1.1L12 3Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M18 11l.7 2.2 2.3.8-2.3.8L18 17l-.7-2.2-2.3-.8 2.3-.8L18 11Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 13.2 7 14.8l1.6.5-1.6.5-.5 1.6-.5-1.6-1.6-.5 1.6-.5.5-1.6Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      )
  }
}

export function DashboardSidebarNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname()

  useEffect(() => {
    const navStart = Number(window.sessionStorage.getItem("ym_debug_dashboard_nav_start") || "0")
    reportDashboardDebug("A", "src/components/dashboard/dashboard-nav.tsx:sidebar:path", "[DEBUG] sidebar pathname changed", {
      pathname,
      elapsedMs: navStart ? Date.now() - navStart : null
    })
  }, [pathname])

  return (
    <nav className="grid w-full gap-1">
      {items.map((i) => {
        const active = isActivePath(pathname, i.href)
        return (
          <Link
            key={i.href}
            href={i.href}
            onClick={() => {
              window.sessionStorage.setItem("ym_debug_dashboard_nav_start", String(Date.now()))
              reportDashboardDebug("A", "src/components/dashboard/dashboard-nav.tsx:sidebar:click", "[DEBUG] sidebar nav click", {
                href: i.href,
                fromPath: pathname
              })
            }}
            className={cn(
              "group flex h-12 items-center gap-3 rounded-2xl border px-3 text-sm font-medium transition-colors duration-200",
              active
                ? "border-transparent bg-[color:var(--accent)] text-white shadow-float"
                : "border-transparent text-foreground hover:bg-surface-muted"
            )}
            title={i.label}
          >
            <span
              className={cn(
                "transition-colors duration-200",
                active ? "text-white" : "text-muted group-hover:text-foreground"
              )}
            >
              <Icon name={i.icon} />
            </span>
            <span className={cn("truncate", active ? "text-white" : "text-foreground")}>{i.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function DashboardBottomNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname()

  useEffect(() => {
    const navStart = Number(window.sessionStorage.getItem("ym_debug_dashboard_nav_start") || "0")
    reportDashboardDebug("A", "src/components/dashboard/dashboard-nav.tsx:bottom:path", "[DEBUG] bottom pathname changed", {
      pathname,
      elapsedMs: navStart ? Date.now() - navStart : null
    })
  }, [pathname])

  return (
    <nav className="grid grid-cols-5 overflow-hidden rounded-3xl border border-border bg-surface-glass shadow-float backdrop-blur-xl">
      {items.map((i) => {
        const active = isActivePath(pathname, i.href)
        return (
          <Link
            key={i.href}
            href={i.href}
            onClick={() => {
              window.sessionStorage.setItem("ym_debug_dashboard_nav_start", String(Date.now()))
              reportDashboardDebug("A", "src/components/dashboard/dashboard-nav.tsx:bottom:click", "[DEBUG] bottom nav click", {
                href: i.href,
                fromPath: pathname
              })
            }}
            className={cn(
              "grid h-16 place-items-center border-r border-border px-1 text-muted transition-colors duration-200 last:border-r-0",
              active ? "text-foreground" : "hover:text-foreground"
            )}
            title={i.label}
            aria-label={i.label}
          >
            <div className="grid place-items-center gap-1">
              <Icon name={i.icon} className="h-[22px] w-[22px]" />
              <span className={cn("text-[11px] font-medium leading-none", active ? "text-foreground" : "text-muted")}>
                {i.label}
              </span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
