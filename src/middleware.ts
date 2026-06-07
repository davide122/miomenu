import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

type SessionPayload = {
  userId: string
  role: "SUPER_ADMIN" | "BUSINESS_OWNER"
  businessId?: string | null
}

async function readSession(req: NextRequest) {
  const token = req.cookies.get("ym_session")?.value
  if (!token) return null
  const secret = process.env.AUTH_SECRET
  if (!secret) return null
  try {
    const { payload } = await jwtVerify<SessionPayload>(
      token,
      new TextEncoder().encode(secret)
    )
    return payload
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isDashboard = pathname.startsWith("/dashboard")
  const isAdmin = pathname.startsWith("/admin")

  if (!isDashboard && !isAdmin) return NextResponse.next()

  const session = await readSession(req)
  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (isAdmin && session.role !== "SUPER_ADMIN") {
    const url = req.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
}

