import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import crypto from "node:crypto"

const prisma = new PrismaClient()

const email = process.env.SEED_SUPERADMIN_EMAIL || "admin@yourmenu.local"
const name = process.env.SEED_SUPERADMIN_NAME || "Super Admin"

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed disabilitato in produzione.")
  }

  const password =
    process.env.SEED_SUPERADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url")

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      passwordHash,
      role: "SUPER_ADMIN"
    },
    update: {
      name,
      passwordHash,
      role: "SUPER_ADMIN"
    }
  })

  process.stdout.write(
    [
      "Super admin pronto:",
      `email: ${user.email}`,
      `password: ${password}`,
      ""
    ].join("\n")
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
