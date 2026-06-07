import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "yourMenu",
  description: "Il menu digitale premium per QR, TV e contenuti video."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.className}>
      <body>
        {process.env.NODE_ENV === "development" ? (
          <Script id="dev-unregister-sw" strategy="afterInteractive">
            {`
              (async () => {
                if (!("serviceWorker" in navigator)) return
                const regs = await navigator.serviceWorker.getRegistrations()
                await Promise.all(regs.map((r) => r.unregister()))
                if (!("caches" in window)) return
                const keys = await caches.keys()
                await Promise.all(keys.map((k) => caches.delete(k)))
              })().catch(() => {})
            `}
          </Script>
        ) : null}
        {children}
      </body>
    </html>
  )
}
