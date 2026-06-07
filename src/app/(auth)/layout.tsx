import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(56,189,248,0.22),transparent_65%),radial-gradient(60%_60%_at_0%_20%,rgba(34,211,238,0.16),transparent_55%),radial-gradient(60%_60%_at_100%_15%,rgba(99,102,241,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-sky-50" />
      </div>

      <header className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
            yourMenu
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/#prezzi" className="hidden text-sm font-medium text-muted hover:text-foreground sm:inline">
              Prezzi
            </Link>
            <Link href="/" className="text-sm font-medium text-muted hover:text-foreground">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          {children}
        </div>
      </section>
    </main>
  )
}
