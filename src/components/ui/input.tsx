import { cn } from "@/lib/cn"

export function Input({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-text-soft focus:border-[color:var(--accent)]/35 focus:ring-2 focus:ring-[color:var(--accent)]/15",
        className
      )}
      {...props}
    />
  )
}
