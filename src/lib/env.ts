import { z } from "zod"

const envSchema = z.object({
  AUTH_SECRET: z.string().min(16),
  APP_URL: z.string().url().optional(),

  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),

  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_PREMIUM: z.string().min(1).optional(),
  STRIPE_PRICE_GOLD: z.string().min(1).optional(),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),

  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional().or(z.literal(""))
})

let cached: z.infer<typeof envSchema> | null = null

export function getEnv() {
  if (cached) return cached
  const clean = (v: string | undefined) => {
    if (typeof v !== "string") return undefined
    const t = v.trim()
    return t.length ? t : undefined
  }
  cached = envSchema.parse({
    AUTH_SECRET: process.env.AUTH_SECRET,
    APP_URL: clean(process.env.APP_URL),

    OPENAI_API_KEY: clean(process.env.OPENAI_API_KEY),
    OPENAI_MODEL: clean(process.env.OPENAI_MODEL),

    STRIPE_SECRET_KEY: clean(process.env.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET: clean(process.env.STRIPE_WEBHOOK_SECRET),
    STRIPE_PRICE_PREMIUM: clean(process.env.STRIPE_PRICE_PREMIUM),
    STRIPE_PRICE_GOLD: clean(process.env.STRIPE_PRICE_GOLD),

    SUPABASE_URL: clean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_STORAGE_BUCKET: clean(process.env.SUPABASE_STORAGE_BUCKET),

    R2_ACCOUNT_ID: clean(process.env.R2_ACCOUNT_ID),
    R2_ACCESS_KEY_ID: clean(process.env.R2_ACCESS_KEY_ID),
    R2_SECRET_ACCESS_KEY: clean(process.env.R2_SECRET_ACCESS_KEY),
    R2_BUCKET: clean(process.env.R2_BUCKET),
    R2_PUBLIC_BASE_URL: clean(process.env.R2_PUBLIC_BASE_URL) ?? ""
  })
  return cached
}
