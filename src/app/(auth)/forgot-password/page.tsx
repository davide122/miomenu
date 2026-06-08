"use client"

import Link from "next/link"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordResetAction } from "@/lib/auth/actions"

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined)

  return (
    <div className="w-full rounded-[28px] border border-border bg-white p-6 shadow-soft sm:p-7">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted">yourMenu</p>
        <h1 className="mt-4 text-[28px] font-semibold leading-[36px] tracking-tight text-foreground">
          Recupero password
        </h1>
        <p className="mt-1 text-sm text-muted">
          Inserisci la tua email e riceverai un link per impostare una nuova password.
        </p>
      </div>

      <form action={formAction} className="mt-6 grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nome@locale.it"
            autoComplete="email"
            autoFocus
            required
          />
        </div>

        {state?.ok ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Se l’email esiste, ti abbiamo appena inviato un link di recupero.
          </div>
        ) : null}

        {state?.ok === false ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <Button className="w-full" size="lg" type="submit" disabled={pending}>
          Invia link
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted">
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Torna al login
        </Link>
      </div>
    </div>
  )
}
