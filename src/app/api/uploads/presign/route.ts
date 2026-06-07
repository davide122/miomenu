import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import crypto from "node:crypto"

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { r2Bucket, r2Client, r2PublicBaseUrl } from "@/lib/storage/r2"

const bodySchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive(),
  durationSeconds: z.number().positive().optional(),
  businessId: z.string().optional()
})

function sanitizeFileName(name: string) {
  const base = name.split("/").pop() ?? name
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120)
}

function inferMediaType(contentType: string) {
  if (contentType.startsWith("video/")) return "VIDEO"
  return "IMAGE"
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const client = r2Client()
  const bucket = r2Bucket()
  const publicBaseUrl = r2PublicBaseUrl()
  if (!client || !bucket) {
    return NextResponse.json(
      {
        error:
          "Storage non configurato. Imposta R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET."
      },
      { status: 400 }
    )
  }

  const isImage = parsed.data.contentType.startsWith("image/")
  const isVideo = parsed.data.contentType.startsWith("video/")
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Tipo file non supportato." }, { status: 400 })
  }

  if (isVideo) {
    if (typeof parsed.data.durationSeconds !== "number") {
      return NextResponse.json({ error: "Durata video mancante." }, { status: 400 })
    }
    if (parsed.data.durationSeconds > 5.1) {
      return NextResponse.json(
        { error: "Video troppo lungo. Massimo 5 secondi." },
        { status: 400 }
      )
    }
  }

  const maxSize = isVideo ? 30 * 1024 * 1024 : 15 * 1024 * 1024
  if (parsed.data.size > maxSize) {
    return NextResponse.json({ error: "File troppo grande." }, { status: 400 })
  }

  if (parsed.data.businessId) {
    if (session.role !== "SUPER_ADMIN") {
      const owned = await prisma.business.findFirst({
        where: { id: parsed.data.businessId, ownerId: session.userId, isActive: true },
        select: { id: true }
      })
      if (!owned) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
  }

  const scope = parsed.data.businessId
    ? `business/${parsed.data.businessId}`
    : `user/${session.userId}`

  const extName = sanitizeFileName(parsed.data.fileName)
  const random = crypto.randomBytes(12).toString("base64url")
  const mediaType = inferMediaType(parsed.data.contentType)
  const folder = mediaType === "VIDEO" ? "videos" : "images"

  const key = `${scope}/${folder}/${Date.now()}_${random}_${extName}`

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: parsed.data.contentType
  })

  let uploadUrl: string
  try {
    uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 })
  } catch (err) {
    const anyErr = err as { message?: string } | null
    const message = anyErr?.message ?? ""
    if (/Credential access key has length/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Credenziali R2 non valide. In .env inserisci le S3 Access Keys di R2 (Access Key ID 32 caratteri + Secret), non un token cfat_."
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Presign fallito." }, { status: 500 })
  }
  const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${key}` : `/api/media/${key}`

  return NextResponse.json({
    uploadUrl,
    publicUrl,
    mediaType
  })
}
