import { S3Client } from "@aws-sdk/client-s3"

import { getEnv } from "@/lib/env"

export function r2Client() {
  const env = getEnv()
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY
  ) {
    return null
  }

  if (
    env.R2_ACCESS_KEY_ID.startsWith("cfat_") ||
    env.R2_SECRET_ACCESS_KEY.startsWith("cfat_")
  ) {
    return null
  }

  if (env.R2_ACCESS_KEY_ID.length !== 32) {
    return null
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY
    },
    forcePathStyle: true
  })
}

export function r2Bucket() {
  return getEnv().R2_BUCKET ?? null
}

export function r2PublicBaseUrl() {
  const v = getEnv().R2_PUBLIC_BASE_URL
  if (!v) return null
  return v.replace(/\/$/, "")
}
