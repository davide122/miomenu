"use client"

import Link from "next/link"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPasswordAction } from "@/lib/auth/actions"

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, undefined)

  return (
    <div className="w-full rounded-[28px] border border-border bg-white p-6 shadow-soft sm:p-7">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted">yourMenu</p>
        <h1 className="mt-4 text-[28px] font-semibold leading-[36px] tracking-tight text-foreground">
          Nuova password
        </h1>
        <p className="mt-1 text-sm text-muted">Imposta una nuova password per il tuo account.</p>
      </div>

      {!token ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Link non valido. Richiedi un nuovo recupero password.
        </div>
      ) : null}

      <form action={formAction} className="mt-6 grid gap-4">
        <input type="hidden" name="token" value={token} />

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Conferma password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        {state?.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <Button className="w-full" size="lg" type="submit" disabled={pending || !token}>
          Imposta password
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted">
        <Link
          href="/forgot-password"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Richiedi un nuovo link
        </Link>
      </div>
    </div>
  )
}
