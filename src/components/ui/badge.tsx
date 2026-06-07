import { cn } from "@/lib/cn"

type BadgeVariant = "default" | "brand" | "muted" | "danger"

const variants: Record<BadgeVariant, string> = {
  default: "border-border bg-surface text-foreground",
  brand: "border-transparent bg-[color:var(--accent)] text-white",
  muted: "border-transparent bg-surface-muted text-muted",
  danger: "border-transparent bg-red-600 text-white"
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
