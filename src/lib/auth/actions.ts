"use server"

import { redirect } from "next/navigation"
import crypto from "node:crypto"
import { z } from "zod"

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session"
import { getEnv } from "@/lib/env"
import { appUrl } from "@/lib/url"

function dbUnavailableMessage() {
  return "Database non disponibile. Controlla DATABASE_URL in .env e che PostgreSQL sia avviato."
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional()
})

export async function registerAction(_prev: unknown, formData: FormData) {
  try {
    const parsed = registerSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name") || undefined
    })
    if (!parsed.success) return { ok: false as const, error: "Dati non validi." }

    const email = parsed.data.email.toLowerCase().trim()
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return { ok: false as const, error: "Email già registrata." }

    const passwordHash = await hashPassword(parsed.data.password)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: parsed.data.name
      }
    })

    await setSessionCookie({
      userId: user.id,
      role: user.role,
      businessId: null
    })
    redirect("/dashboard/business")
  } catch (err) {
    if ((err as { name?: string } | null)?.name === "PrismaClientInitializationError") {
      return { ok: false as const, error: dbUnavailableMessage() }
    }
    throw err
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export async function loginAction(_prev: unknown, formData: FormData) {
  try {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password")
    })
    if (!parsed.success) {
      return { ok: false as const, error: "Credenziali non valide." }
    }

    const email = parsed.data.email.toLowerCase().trim()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return { ok: false as const, error: "Credenziali non valide." }

    const ok = await verifyPassword(parsed.data.password, user.passwordHash)
    if (!ok) return { ok: false as const, error: "Credenziali non valide." }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true }
    })

    await setSessionCookie({
      userId: user.id,
      role: user.role,
      businessId: business?.id ?? null
    })

    redirect(user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard")
  } catch (err) {
    if ((err as { name?: string } | null)?.name === "PrismaClientInitializationError") {
      return { ok: false as const, error: dbUnavailableMessage() }
    }
    throw err
  }
}

export async function logoutAction() {
  await clearSessionCookie()
  redirect("/")
}

async function sendEmail({
  to,
  subject,
  html
}: {
  to: string
  subject: string
  html: string
}) {
  const env = getEnv()
  const from = env.MAIL_FROM ?? env.SMTP_FROM
  if (!from || !env.SMTP_HOST || !env.SMTP_PORT) {
    return {
      ok: false as const,
      error: "Email non configurata. Imposta SMTP_HOST, SMTP_PORT e MAIL_FROM (o SMTP_FROM)."
    }
  }

  const { createTransport } = await import("nodemailer")
  const transporter = createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS
          }
        : undefined
  })

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html
    })
    return { ok: true as const }
  } catch (err) {
    const message = (err as { message?: string } | null)?.message
    return {
      ok: false as const,
      error: message ? `Invio email non riuscito. (${message})` : "Invio email non riuscito."
    }
  }
}

const requestResetSchema = z.object({
  email: z.string().email()
})

type PasswordResetRequestResult =
  | { ok: true }
  | { ok: false; error: string }
  | undefined

export async function requestPasswordResetAction(
  _prev: PasswordResetRequestResult,
  formData: FormData
) {
  try {
    const parsed = requestResetSchema.safeParse({
      email: formData.get("email")
    })
    if (!parsed.success) return { ok: false as const, error: "Email non valida." }

    const email = parsed.data.email.toLowerCase().trim()
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) return { ok: true as const }

    if (!("passwordResetToken" in prisma)) {
      return { ok: false as const, error: "Server non aggiornato. Esegui prisma generate." }
    }

    const token = crypto.randomBytes(32).toString("base64url")
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt }
    })

    const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`
    const html = [
      `<div style="font-family: ui-sans-serif, system-ui; line-height: 1.6">`,
      `<h2 style="margin: 0 0 12px">Recupero password</h2>`,
      `<p style="margin: 0 0 16px">Clicca qui per impostare una nuova password:</p>`,
      `<p style="margin: 0 0 18px"><a href="${resetUrl}">${resetUrl}</a></p>`,
      `<p style="margin: 0; color: #6b7280; font-size: 14px">Il link scade tra 30 minuti.</p>`,
      `</div>`
    ].join("")

    const sent = await sendEmail({
      to: email,
      subject: "Recupero password - yourMenu",
      html
    })
    if (!sent.ok) return { ok: false as const, error: sent.error }

    return { ok: true as const }
  } catch (err) {
    if ((err as { name?: string } | null)?.name === "PrismaClientInitializationError") {
      return { ok: false as const, error: dbUnavailableMessage() }
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false as const, error: dbUnavailableMessage() }
    }
    throw err
  }
}

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8),
  confirm: z.string().min(8)
})

type ResetPasswordResult =
  | { ok: false; error: string }
  | undefined

export async function resetPasswordAction(_prev: ResetPasswordResult, formData: FormData) {
  try {
    const parsed = resetPasswordSchema.safeParse({
      token: formData.get("token"),
      password: formData.get("password"),
      confirm: formData.get("confirm")
    })
    if (!parsed.success) return { ok: false as const, error: "Dati non validi." }
    if (parsed.data.password !== parsed.data.confirm) {
      return { ok: false as const, error: "Le password non coincidono." }
    }

    if (!("passwordResetToken" in prisma)) {
      return { ok: false as const, error: "Server non aggiornato. Esegui prisma generate." }
    }

    const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex")
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true }
    })
    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      return { ok: false as const, error: "Link non valido o scaduto." }
    }

    const passwordHash = await hashPassword(parsed.data.password)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() }
      })
    ])

    redirect("/login?reset=1")
  } catch (err) {
    if ((err as { name?: string } | null)?.name === "PrismaClientInitializationError") {
      return { ok: false as const, error: dbUnavailableMessage() }
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false as const, error: dbUnavailableMessage() }
    }
    throw err
  }
}
