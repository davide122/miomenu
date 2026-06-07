import { PutObjectCommand } from "@aws-sdk/client-s3"
import { NextResponse } from "next/server"
import crypto from "node:crypto"

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { getEnv } from "@/lib/env"
import { r2Bucket, r2Client, r2PublicBaseUrl } from "@/lib/storage/r2"

function sanitizeFileName(name: string) {
  const base = name.split("/").pop() ?? name
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120)
}

function inferMediaType(contentType: string) {
  if (contentType.startsWith("video/")) return "VIDEO" as const
  return "IMAGE" as const
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File mancante." }, { status: 400 })
  }

  const businessIdRaw = form.get("businessId")
  const businessId = typeof businessIdRaw === "string" && businessIdRaw.trim().length
    ? businessIdRaw.trim()
    : undefined

  const durationSecondsRaw = form.get("durationSeconds")
  const durationSeconds =
    typeof durationSecondsRaw === "string" && durationSecondsRaw.trim().length
      ? Number(durationSecondsRaw)
      : undefined

  const isImage = file.type.startsWith("image/")
  const isVideo = file.type.startsWith("video/")
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Tipo file non supportato." }, { status: 400 })
  }

  if (isVideo) {
    if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds)) {
      return NextResponse.json({ error: "Durata video mancante." }, { status: 400 })
    }
    if (durationSeconds > 5.1) {
      return NextResponse.json(
        { error: "Video troppo lungo. Massimo 5 secondi." },
        { status: 400 }
      )
    }
  }

  const maxSize = isVideo ? 30 * 1024 * 1024 : 15 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File troppo grande." }, { status: 400 })
  }

  if (businessId) {
    if (session.role !== "SUPER_ADMIN") {
      const owned = await prisma.business.findFirst({
        where: { id: businessId, ownerId: session.userId, isActive: true },
        select: { id: true }
      })
      if (!owned) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
  }

  const env = getEnv()
  const client = r2Client()
  const bucket = r2Bucket()
  const publicBaseUrl = r2PublicBaseUrl()

  const scope = businessId ? `business/${businessId}` : `user/${session.userId}`
  const mediaType = inferMediaType(file.type)
  const folder = mediaType === "VIDEO" ? "videos" : "images"
  const extName = sanitizeFileName(file.name)
  const random = crypto.randomBytes(12).toString("base64url")
  const key = `${scope}/${folder}/${Date.now()}_${random}_${extName}`

  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_STORAGE_BUCKET) {
    const supabaseBase = env.SUPABASE_URL.endsWith("/")
      ? env.SUPABASE_URL.slice(0, -1)
      : env.SUPABASE_URL

    const url = `${supabaseBase}/storage/v1/object/${encodeURIComponent(env.SUPABASE_STORAGE_BUCKET)}/${key}`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        "content-type": file.type,
        "x-upsert": "true"
      },
      body: Buffer.from(await file.arrayBuffer())
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return NextResponse.json(
        {
          error:
            "Upload fallito su Supabase. Controlla SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET e che il bucket esista. " +
            (text ? `Dettagli: ${text}` : "")
        },
        { status: 400 }
      )
    }

    const publicUrl = `${supabaseBase}/storage/v1/object/public/${encodeURIComponent(env.SUPABASE_STORAGE_BUCKET)}/${key}`

    return NextResponse.json({ publicUrl, mediaType })
  }

  if (!client || !bucket) {
    return NextResponse.json(
      {
        error:
          "Storage non configurato. Imposta Supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET) oppure R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)."
      },
      { status: 400 }
    )
  }

  const body = Buffer.from(await file.arrayBuffer())
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: file.type,
        Body: body
      })
    )
  } catch (err) {
    const anyErr = err as { name?: string; message?: string; Code?: string } | null
    const message = anyErr?.message ?? ""
    if (anyErr?.Code === "InvalidArgument" || /Credential access key has length/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Credenziali R2 non valide. In .env inserisci le S3 Access Keys di R2 (Access Key ID 32 caratteri + Secret), non un token cfat_."
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Upload fallito." }, { status: 500 })
  }

  const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${key}` : `/api/media/${key}`

  return NextResponse.json({
    publicUrl,
    mediaType
  })
}
