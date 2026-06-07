import { NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const text = searchParams.get("text")
  const format = (searchParams.get("format") || "png").toLowerCase()

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 })
  }

  if (format === "svg") {
    const svg = await QRCode.toString(text, { type: "svg", margin: 1 })
    return new NextResponse(svg, {
      headers: {
        "content-type": "image/svg+xml",
        "cache-control": "no-store"
      }
    })
  }

  const buffer = await QRCode.toBuffer(text, {
    type: "png",
    margin: 1,
    width: 512,
    color: { dark: "#111827", light: "#FFFFFF" }
  })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store"
    }
  })
}
