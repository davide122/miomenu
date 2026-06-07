import Link from "next/link"

import { ButtonLink } from "@/components/ui/button"
import { getSession } from "@/lib/auth/session"

export default async function HomePage() {
  const session = await getSession()
  const billingHref = session ? "/dashboard/billing" : "/login"
  const primaryCtaHref = session ? "/dashboard" : "/register"
  const secondaryCtaHref = session ? "/dashboard/billing" : "/register"
  const loginHref = session ? "/dashboard" : "/login"

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(56,189,248,0.25),transparent_65%),radial-gradient(60%_60%_at_0%_20%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(60%_60%_at_100%_15%,rgba(99,102,241,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-sky-50" />
      </div>

      <header className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
            yourMenu
          </Link>
          <nav className="flex items-center gap-4">
            <a href="#prezzi" className="hidden text-sm font-medium text-muted hover:text-foreground sm:inline">
              Prezzi
            </a>
            <a href="#storie" className="hidden text-sm font-medium text-muted hover:text-foreground sm:inline">
              Perché funziona
            </a>
            <ButtonLink href={loginHref} variant="secondary" size="sm">
              {session ? "Dashboard" : "Accedi"}
            </ButtonLink>
            <ButtonLink href={primaryCtaHref} size="sm">
              {session ? "Apri il tuo menu" : "Inizia"}
            </ButtonLink>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted">
            MENU DIGITALE PREMIUM PER LOCALI FOOD
          </p>
          <h1 className="mt-5 text-[46px] font-semibold leading-[52px] tracking-tight text-foreground sm:text-[72px] sm:leading-[76px]">
            Il menu che sembra un’app.
            <br />
            E vende come una vetrina.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-6 text-muted">
            Un’esperienza super pulita per chi scansiona il QR. Un pannello semplice per chi lavora. Foto, promo, multilingua, schermi e AI: senza caos.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={primaryCtaHref} size="lg">
              {session ? "Vai alla dashboard" : "Crea il tuo menu"}
            </ButtonLink>
            <ButtonLink href={billingHref} variant="secondary" size="lg">
              {session ? "Gestisci piano" : "Vedi i piani"}
            </ButtonLink>
          </div>
        </div>

        <div className="mt-12">
          <div className="rounded-[32px] border border-border bg-white shadow-soft">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <p className="text-sm font-semibold text-foreground">Una demo visiva</p>
              <p className="mt-1 text-sm text-muted">
                Sostituisci questi blocchi con screenshot reali quando li hai.
              </p>
            </div>
            <div className="-mx-5 overflow-x-auto px-5 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6">
              <div className="flex gap-6 pr-6 snap-x snap-mandatory">
                {[
                  { title: "Menu pubblico", detail: "Ricerca, filtri, galleria foto, promo", tone: "from-sky-100 via-white to-sky-100" },
                  { title: "Dashboard", detail: "Inserimento prodotti app-style, veloce", tone: "from-cyan-100 via-white to-cyan-100" },
                  { title: "TV Mode", detail: "Schermi e contenuti da vetrina", tone: "from-indigo-100 via-white to-indigo-50" }
                ].map((s) => (
                  <div
                    key={s.title}
                    className="w-[320px] flex-none snap-start"
                  >
                    <div className="rounded-[28px] border border-border bg-white p-5 shadow-soft">
                      <p className="text-sm font-semibold text-foreground">{s.title}</p>
                      <p className="mt-1 text-sm text-muted">{s.detail}</p>
                      <div className="mt-4 overflow-hidden rounded-[22px] border border-border bg-surface-muted">
                        <div className={`aspect-[9/16] w-full bg-gradient-to-b ${s.tone}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="storie" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="rounded-[32px] border border-border bg-white p-6 shadow-soft sm:p-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted">IL PROBLEMA</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Il menu è spesso un punto morto.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              PDF, immagini illeggibili, troppe pagine o aggiornamenti complicati. Il risultato è sempre lo stesso: il cliente si stanca, sceglie il solito, e tu perdi opportunità.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                { t: "Decisione lenta", d: "Troppe informazioni, poche scelte chiare." },
                { t: "Aggiornamenti difficili", d: "Ogni modifica è una rottura di flusso." },
                { t: "Zero spinta alla vendita", d: "Promo e abbinamenti non esistono." }
              ].map((x) => (
                <div key={x.t} className="flex gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                  <div className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-[color:var(--accent)]" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{x.t}</p>
                    <p className="mt-0.5 text-sm text-muted">{x.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-border bg-white p-6 shadow-soft sm:p-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted">LA SOLUZIONE</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Un sistema unico, pulito, sempre pronto.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              yourMenu è progettato come un prodotto: pochi elementi, fatti bene. Il cliente scansiona e capisce subito. Tu aggiorni in 10 secondi.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                { t: "Galleria foto + video", d: "Prodotti appetitosi e leggibili, senza attese." },
                { t: "Promo e coupon", d: "Spinta immediata alle vendite nei momenti giusti." },
                { t: "Multilingua", d: "Esperienza perfetta anche per turismo." },
                { t: "Upsell smart (AI)", d: "Abbinamenti naturali per aumentare lo scontrino (Gold)." }
              ].map((x) => (
                <div key={x.t} className="flex gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                  <div className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{x.t}</p>
                    <p className="mt-0.5 text-sm text-muted">{x.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="prezzi" className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-[32px] border border-border bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-muted">PREZZI</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Piani semplici, senza sorprese
              </h2>
              <p className="mt-2 text-sm text-muted">
                Parti gratis. Fai upgrade quando vuoi. Pagamento mensile.
              </p>
            </div>
            <ButtonLink href={billingHref} variant="secondary">
              Vai all’abbonamento
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {[
              {
                name: "Free",
                price: "0€",
                note: "Fino a 5 prodotti, senza video.",
                cta: { href: primaryCtaHref, label: "Inizia" },
                items: ["Menu pubblico", "QR Code", "Foto prodotti", "Dashboard"]
              },
              {
                name: "Premium",
                price: "8€",
                note: "al mese",
                cta: { href: billingHref, label: "Passa a Premium" },
                items: ["Prodotti illimitati", "Video prodotti", "Schermi / TV Mode", "Programmazione"]
              },
              {
                name: "Gold",
                price: "12€",
                note: "al mese",
                cta: { href: billingHref, label: "Passa a Gold" },
                items: ["Tutto Premium", "AI integrata", "Supporto prioritario"]
              }
            ].map((p) => (
              <div key={p.name} className="rounded-[28px] border border-border bg-surface px-6 py-6">
                <p className="text-sm font-semibold text-foreground">{p.name}</p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <p className="text-4xl font-semibold tracking-tight text-foreground">{p.price}</p>
                  <p className="text-sm text-muted">{p.note}</p>
                </div>
                <ul className="mt-6 grid gap-2 text-sm text-muted">
                  {p.items.map((x) => (
                    <li key={x} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <ButtonLink
                    href={p.cta.href}
                    className="w-full"
                    size="lg"
                    variant={p.name === "Free" ? "secondary" : "primary"}
                  >
                    {p.cta.label}
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-[32px] border border-border bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-muted">FAQ</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Domande rapide</h2>
              <p className="mt-1 text-sm text-muted">
                Le domande che fanno tutti prima di iniziare.
              </p>
            </div>
            <ButtonLink href={billingHref} variant="secondary">
              Attiva un piano
            </ButtonLink>
          </div>

          <div className="mt-6 grid gap-3">
            {[
              {
                q: "È difficile inserire prodotti e foto?",
                a: "No. La dashboard è pensata per il telefono: scegli categoria, nome, prezzo e foto copertina. Il resto è opzionale."
              },
              {
                q: "Posso usare WhatsApp e Instagram?",
                a: "Sì. Metti i contatti e il menu li mostra in modo pulito e immediato."
              },
              {
                q: "Come funzionano promo e coupon?",
                a: "Crei un codice e un messaggio. Se è attivo, viene evidenziato nel menu pubblico."
              },
              {
                q: "La multilingua è automatica?",
                a: "Puoi aggiungere traduzioni (anche con AI su Gold). Se manca una traduzione, il menu mostra l’italiano."
              },
              {
                q: "Posso cambiare piano quando voglio?",
                a: "Sì. È un abbonamento mensile: puoi fare upgrade o downgrade in qualsiasi momento."
              }
            ].map((item) => (
              <details
                key={item.q}
                className="rounded-[28px] border border-border bg-surface px-6 py-5"
              >
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-[32px] border border-border bg-white shadow-soft">
          <div className="relative px-6 py-10 sm:px-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_0%,rgba(56,189,248,0.22),transparent_60%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-muted">PRONTO</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Crea un menu che la gente usa davvero.
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Parti gratis, pubblica il QR, e fai upgrade quando vuoi.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href={primaryCtaHref} size="lg">
                  {session ? "Apri dashboard" : "Crea il tuo menu"}
                </ButtonLink>
                <ButtonLink href={billingHref} variant="secondary" size="lg">
                  {session ? "Gestisci piano" : "Scegli un piano"}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-10 text-sm text-muted sm:px-6">
          <p>© {new Date().getFullYear()} yourMenu</p>
          <p>Menu digitale premium</p>
        </div>
      </footer>
    </main>
  )
}
