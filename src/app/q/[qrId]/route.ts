import { NextResponse, type NextRequest } from "next/server"

import { prisma } from "@/lib/db"
import { appUrl } from "@/lib/url"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ qrId: string }> }
) {
  const { qrId } = await params

  const qr = await prisma.qrCode.findUnique({ where: { id: qrId } })
  if (!qr) return NextResponse.redirect(new URL("/", appUrl()))

  await prisma.qrCode.update({
    where: { id: qr.id },
    data: { scans: { increment: 1 } }
  })

  await prisma.analyticsEvent.create({
    data: {
      businessId: qr.businessId,
      type: "QR_SCAN",
      qrCodeId: qr.id
    }
  })

  return NextResponse.redirect(new URL(qr.targetUrl, appUrl()))
}
