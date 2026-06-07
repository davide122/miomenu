import { cn } from "@/lib/cn"

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-text-soft focus:border-[color:var(--accent)]/35 focus:ring-2 focus:ring-[color:var(--accent)]/15",
        className
      )}
      {...props}
    />
  )
}
