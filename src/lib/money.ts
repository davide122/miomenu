import { Prisma } from "@prisma/client"

export function formatPrice(price: Prisma.Decimal | null) {
  if (!price) return null
  const num = Number(price.toString())
  if (!Number.isFinite(num)) return price.toString()
  return num.toFixed(2).replace(".", ",")
}

