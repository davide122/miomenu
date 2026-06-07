import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { NextResponse } from "next/server"

import { r2Bucket, r2Client } from "@/lib/storage/r2"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: parts } = await params
  const key = parts.join("/")

  const client = r2Client()
  const bucket = r2Bucket()
  if (!client || !bucket || !key) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  const url = await getSignedUrl(client, command, { expiresIn: 60 })
  const res = NextResponse.redirect(url, 307)
  res.headers.set("Cache-Control", "no-store")
  return res
}
