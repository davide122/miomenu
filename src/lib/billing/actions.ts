"use server"

import Stripe from "stripe"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/db"
import { getEnv } from "@/lib/env"
import { requireDashboardContext } from "@/lib/auth/current"
import { appUrl } from "@/lib/url"

function getStripe() {
  const env = getEnv()
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY mancante.")
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
}

function priceIdForPlan(plan: "PREMIUM" | "GOLD") {
  const env = getEnv()
  if (plan === "PREMIUM") {
    if (!env.STRIPE_PRICE_PREMIUM) throw new Error("STRIPE_PRICE_PREMIUM mancante.")
    return env.STRIPE_PRICE_PREMIUM
  }
  if (!env.STRIPE_PRICE_GOLD) throw new Error("STRIPE_PRICE_GOLD mancante.")
  return env.STRIPE_PRICE_GOLD
}

export async function startSubscriptionCheckoutAction(formData: FormData): Promise<void> {
  try {
    const desired = String(formData.get("plan") || "").toUpperCase()
    const plan = desired === "GOLD" ? "GOLD" : "PREMIUM"

    const { user, business } = await requireDashboardContext()
    const stripe = getStripe()

    const customerId = business.stripeCustomerId
      ? business.stripeCustomerId
      : await stripe.customers
          .create({
            email: user.email,
            name: user.name ?? undefined,
            metadata: { businessId: business.id }
          })
          .then((c) => c.id)

    if (!business.stripeCustomerId) {
      await prisma.business.update({
        where: { id: business.id },
        data: { stripeCustomerId: customerId }
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
      success_url: `${appUrl()}/dashboard/billing?success=1`,
      cancel_url: `${appUrl()}/dashboard/billing?canceled=1`,
      subscription_data: {
        metadata: { businessId: business.id, plan }
      },
      metadata: { businessId: business.id, plan }
    })

    if (!session.url) redirect("/dashboard/billing?error=checkout")
    redirect(session.url)
  } catch (err) {
    const message = (err as Error).message || "Errore pagamento."
    redirect(`/dashboard/billing?error=${encodeURIComponent(message)}`)
  }
}

export async function openBillingPortalAction(): Promise<void> {
  const { user, business } = await requireDashboardContext()
  const stripe = getStripe()

  const customerId = business.stripeCustomerId
    ? business.stripeCustomerId
    : await stripe.customers
        .create({
          email: user.email,
          name: user.name ?? undefined,
          metadata: { businessId: business.id }
        })
        .then((c) => c.id)

  if (!business.stripeCustomerId) {
    await prisma.business.update({
      where: { id: business.id },
      data: { stripeCustomerId: customerId }
    })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl()}/dashboard/billing`
  })

  redirect(session.url)
}
