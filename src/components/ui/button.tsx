import Link from "next/link"

import { cn } from "@/lib/cn"

type ButtonVariant = "primary" | "secondary" | "ghost"
type ButtonSize = "sm" | "md" | "lg"

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/20 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px"

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[color:var(--accent)] text-white hover:opacity-90",
  secondary:
    "border-border bg-surface text-foreground hover:bg-surface-muted",
  ghost:
    "border-transparent bg-transparent text-foreground hover:bg-surface-muted"
}

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-3",
  md: "h-11 px-4",
  lg: "h-12 px-5 text-base"
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  href,
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant
  size?: ButtonSize
  href: string
}) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
}
