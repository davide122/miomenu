import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

import { getEnv } from "@/lib/env"

export type SessionPayload = {
  userId: string
  role: "SUPER_ADMIN" | "BUSINESS_OWNER"
  businessId?: string | null
}

const cookieName = "ym_session"

function secretKey() {
  return new TextEncoder().encode(getEnv().AUTH_SECRET)
}

export async function createSessionToken(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey())
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify<SessionPayload>(token, secretKey())
  return payload
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload)
  const jar = await cookies()
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  })
}

export async function getSession() {
  const jar = await cookies()
  const token = jar.get(cookieName)?.value
  if (!token) return null
  try {
    return await verifySessionToken(token)
  } catch {
    return null
  }
}
