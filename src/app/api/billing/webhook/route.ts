import Stripe from "stripe"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { getEnv } from "@/lib/env"

export const runtime = "nodejs"

function getStripe() {
  const env = getEnv()
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY mancante.")
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
}

function planFromPriceId(priceId: string | null) {
  const env = getEnv()
  if (priceId && env.STRIPE_PRICE_PREMIUM && priceId === env.STRIPE_PRICE_PREMIUM) return "PREMIUM" as const
  if (priceId && env.STRIPE_PRICE_GOLD && priceId === env.STRIPE_PRICE_GOLD) return "GOLD" as const
  return "FREE" as const
}

async function applySubscriptionToBusiness(args: {
  businessId: string
  customerId: string | null
  subscription: Stripe.Subscription
}) {
  const item = args.subscription.items.data[0] ?? null
  const priceId = item?.price?.id ?? null
  const status = args.subscription.status
  const currentPeriodEnd = args.subscription.current_period_end
    ? new Date(args.subscription.current_period_end * 1000)
    : null

  const active = status === "active" || status === "trialing"
  const plan = active ? planFromPriceId(priceId) : "FREE"

  await prisma.business.update({
    where: { id: args.businessId },
    data: {
      plan,
      stripeCustomerId: args.customerId ?? undefined,
      stripeSubscriptionId: args.subscription.id,
      stripePriceId: priceId ?? undefined,
      stripeSubscriptionStatus: status,
      stripeCurrentPeriodEnd: currentPeriodEnd ?? undefined
    }
  })
}

async function applyFreeToBusiness(args: {
  businessId: string
  customerId: string | null
  subscriptionId: string
}) {
  await prisma.business.update({
    where: { id: args.businessId },
    data: {
      plan: "FREE",
      stripeCustomerId: args.customerId ?? undefined,
      stripeSubscriptionId: args.subscriptionId,
      stripeSubscriptionStatus: "canceled"
    }
  })
}

export async function POST(req: Request) {
  const env = getEnv()
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("STRIPE_WEBHOOK_SECRET mancante.", { status: 500 })
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature) return new NextResponse("Missing stripe-signature", { status: 400 })

  const stripe = getStripe()
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return new NextResponse("Invalid signature", { status: 400 })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null
      const businessId = (session.metadata?.businessId ?? "").trim()
      if (!subscriptionId || !businessId) return NextResponse.json({ received: true })
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      await applySubscriptionToBusiness({ businessId, customerId, subscription })
      return NextResponse.json({ received: true })
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null
      const businessIdFromMetadata = (subscription.metadata?.businessId ?? "").trim()
      const business =
        businessIdFromMetadata
          ? await prisma.business.findUnique({ where: { id: businessIdFromMetadata } })
          : await prisma.business.findFirst({ where: { stripeSubscriptionId: subscription.id } })
      if (!business) return NextResponse.json({ received: true })
      await applySubscriptionToBusiness({ businessId: business.id, customerId, subscription })
      return NextResponse.json({ received: true })
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null
      const businessIdFromMetadata = (subscription.metadata?.businessId ?? "").trim()
      const business =
        businessIdFromMetadata
          ? await prisma.business.findUnique({ where: { id: businessIdFromMetadata } })
          : await prisma.business.findFirst({ where: { stripeSubscriptionId: subscription.id } })
      if (!business) return NextResponse.json({ received: true })
      await applyFreeToBusiness({ businessId: business.id, customerId, subscriptionId: subscription.id })
      return NextResponse.json({ received: true })
    }

    return NextResponse.json({ received: true })
  } catch {
    return new NextResponse("Webhook handler error", { status: 500 })
  }
}
