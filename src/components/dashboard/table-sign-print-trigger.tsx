"use client"

import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"

export function TableSignPrintTrigger() {
  const printedRef = useRef(false)

  useEffect(() => {
    if (printedRef.current) return
    printedRef.current = true

    const timeout = window.setTimeout(() => {
      window.print()
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <div className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between gap-3 rounded-3xl border border-border bg-white px-5 py-4 shadow-soft print:hidden">
      <div>
        <p className="text-sm font-semibold text-foreground">Segnatavolo pronto</p>
        <p className="text-sm text-muted">
          Si apre la stampa: scegli &quot;Salva come PDF&quot; oppure stampa diretta.
        </p>
      </div>
      <Button type="button" onClick={() => window.print()}>
        Stampa / Salva PDF
      </Button>
    </div>
  )
}
