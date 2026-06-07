"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { prisma } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session"

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
