"use client"

import Link from "next/link"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ActionResult = { ok: false; error: string } | undefined

export function AuthForm({
  title,
  subtitle,
  action,
  submitLabel,
  secondaryText,
  secondaryHref,
  showName,
  tertiaryText,
  tertiaryHref
}: {
  title: string
  subtitle?: string
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  submitLabel: string
  secondaryText: string
  secondaryHref: string
  showName?: boolean
  tertiaryText?: string
  tertiaryHref?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const effectiveSubtitle =
    subtitle ??
    (showName
      ? "Crea l’account e pubblica il menu in pochi minuti."
      : "Accedi per gestire menu, prodotti e promo.")

  return (
    <div className="w-full rounded-[28px] border border-border bg-white p-6 shadow-soft sm:p-7">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted">yourMenu</p>
        <h1 className="mt-4 text-[28px] font-semibold leading-[36px] tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {effectiveSubtitle}
        </p>
      </div>

      <form action={formAction} className="mt-6 grid gap-4">
        {showName ? (
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              placeholder="Mario"
              autoComplete="name"
              autoFocus
              required
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nome@locale.it"
            autoComplete="email"
            required
            autoFocus={!showName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={showName ? "new-password" : "current-password"}
            required
          />
          {tertiaryHref && tertiaryText ? (
            <div className="flex justify-end">
              <Link
                href={tertiaryHref}
                className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
              >
                {tertiaryText}
              </Link>
            </div>
          ) : null}
        </div>

        {state?.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <Button className="w-full" size="lg" type="submit" disabled={pending}>
          {submitLabel}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted">
        <Link
          href={secondaryHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {secondaryText}
        </Link>
      </div>
    </div>
  )
}
