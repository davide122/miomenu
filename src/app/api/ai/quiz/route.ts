import OpenAI from "openai"
import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/db"
import { getEnv } from "@/lib/env"

export const runtime = "nodejs"

const requestSchema = z.object({
  businessSlug: z.string().min(1),
  mode: z.enum(["init", "recommend"]).optional(),
  lang: z.enum(["it", "en"]).optional(),
  answers: z.record(z.string(), z.string()).optional()
})

const questionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().min(1).max(24),
        text: z.string().min(1).max(120),
        options: z
          .array(z.object({ id: z.string().min(1).max(24), label: z.string().min(1).max(48) }))
          .min(2)
          .max(6)
      })
    )
    .min(2)
    .max(6)
})

const recommendSchema = z.object({
  recommendedProductIds: z.array(z.string().min(1)).min(1).max(6),
  reason: z.string().optional()
})

function fallbackQuestions(businessType: string | null) {
  const t = (businessType ?? "").toUpperCase()
  const q1 =
    t === "BAR"
      ? "Che vibe ti va?"
      : t === "GELATERIA" || t === "PASTICCERIA"
        ? "Che gusto ti va?"
        : "Che ti va oggi?"
  return [
    {
      id: "q1",
      text: q1,
      options: [
        { id: "light", label: "Leggero" },
        { id: "classic", label: "Classico" },
        { id: "rich", label: "Sostanzioso" }
      ]
    },
    {
      id: "q2",
      text: "Preferenze?",
      options: [
        { id: "meat", label: "Carne" },
        { id: "fish", label: "Pesce" },
        { id: "veg", label: "Vegetariano" }
      ]
    },
    {
      id: "q3",
      text: "Budget?",
      options: [
        { id: "low", label: "Basso" },
        { id: "mid", label: "Medio" },
        { id: "high", label: "Indifferente" }
      ]
    }
  ]
}

function pickFallbackRecommendations(products: Array<{ id: string; score: number }>) {
  return products
    .sort((a, b) => b.score - a.score)
    .map((p) => p.id)
    .slice(0, 4)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsedReq = requestSchema.safeParse(body)
  if (!parsedReq.success) {
    return NextResponse.json({ ok: false, error: "Richiesta non valida." }, { status: 400 })
  }

  const mode = parsedReq.data.mode ?? "init"
  const lang = parsedReq.data.lang ?? "it"

  const business = await prisma.business.findFirst({
    where: { slug: parsedReq.data.businessSlug, isActive: true },
    select: { id: true, name: true, type: true }
  })
  if (!business) {
    return NextResponse.json({ ok: false, error: "Business non valido." }, { status: 404 })
  }

  const products = await prisma.product.findMany({
    where: { businessId: business.id, isAvailable: true },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      description: true,
      ingredients: true,
      price: true,
      category: { select: { name: true } }
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 120
  })

  const env = getEnv()
  const hasAi = Boolean(env.OPENAI_API_KEY)

  if (mode === "init") {
    if (!hasAi) {
      return NextResponse.json({
        ok: true,
        questions: fallbackQuestions(business.type)
      })
    }

    try {
      const client = new OpenAI({ apiKey: env.OPENAI_API_KEY! })
      const model = env.OPENAI_MODEL ?? "gpt-4o-mini"

      const system = [
        "Sei un assistente per menu digitali.",
        "Crea un mini quiz (2-4 domande) per aiutare un cliente a scegliere cosa ordinare.",
        "Usa SOLO le opzioni, niente testo libero.",
        "Restituisci SOLO JSON valido, senza testo extra.",
        "Niente emoji."
      ].join("\n")

      const user = [
        `Locale: ${business.name}. Tipo: ${business.type}. Lingua: ${lang}.`,
        "Prodotti disponibili (id, categoria, nome, descrizione breve, descrizione, ingredienti, prezzo):",
        JSON.stringify(
          products.map((p) => ({
            id: p.id,
            category: p.category.name,
            name: p.name,
            shortDescription: p.shortDescription ?? "",
            description: p.description ?? "",
            ingredients: p.ingredients ?? "",
            price: p.price ? p.price.toString() : ""
          })),
          null,
          2
        ),
        "",
        "Formato JSON:",
        '{ "questions": [{ "id": "q1", "text": "…", "options": [{ "id": "a", "label": "…" }] }] }',
        "",
        "Vincoli:",
        "- 3 domande se possibile",
        "- 3 opzioni per domanda",
        "- Testo breve e chiaro"
      ].join("\n")

      const res = await client.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })

      const content = res.choices[0]?.message?.content ?? ""
      const json = JSON.parse(content) as unknown
      const parsed = questionsSchema.safeParse(json)
      if (!parsed.success) {
        return NextResponse.json({
          ok: true,
          questions: fallbackQuestions(business.type)
        })
      }

      return NextResponse.json({ ok: true, questions: parsed.data.questions })
    } catch {
      return NextResponse.json({
        ok: true,
        questions: fallbackQuestions(business.type)
      })
    }
  }

  const answers = parsedReq.data.answers ?? {}
  const ids = new Set(products.map((p) => p.id))

  if (!hasAi) {
    const scored = products.map((p) => {
      let score = 0
      const text = `${p.category.name} ${p.name} ${p.shortDescription ?? ""} ${p.description ?? ""} ${p.ingredients ?? ""}`.toLowerCase()
      const a1 = answers.q1 ?? ""
      const a2 = answers.q2 ?? ""
      const a3 = answers.q3 ?? ""
      if (a1 === "light") score += text.includes("insalat") || text.includes("bowl") ? 3 : 0
      if (a1 === "rich") score += text.includes("burger") || text.includes("carbon") || text.includes("fritt") ? 3 : 0
      if (a2 === "veg") score += text.includes("veg") || text.includes("verd") ? 2 : 0
      if (a2 === "fish") score += text.includes("pesce") || text.includes("tonno") || text.includes("gamber") ? 2 : 0
      if (a2 === "meat") score += text.includes("carne") || text.includes("pollo") || text.includes("manzo") ? 2 : 0
      if (a3 === "low") score += p.price && p.price.toNumber() <= 10 ? 1 : 0
      if (a3 === "high") score += 0
      return { id: p.id, score }
    })

    const recommendedProductIds = pickFallbackRecommendations(scored)
    return NextResponse.json({
      ok: true,
      recommendedProductIds,
      reason: "Ecco alcune scelte che potrebbero piacerti."
    })
  }

  try {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY! })
    const model = env.OPENAI_MODEL ?? "gpt-4o-mini"

    const system = [
      "Sei un assistente per menu digitali.",
      "In base alle risposte del quiz, suggerisci 3-4 prodotti tra quelli disponibili.",
      "Restituisci SOLO JSON valido, senza testo extra.",
      "Niente emoji.",
      "Usa SOLO product ids presenti."
    ].join("\n")

    const user = [
      `Locale: ${business.name}. Tipo: ${business.type}. Lingua: ${lang}.`,
      "Risposte quiz (mappa domanda->opzione):",
      JSON.stringify(answers, null, 2),
      "",
      "Prodotti disponibili (id, categoria, nome, descrizione breve, descrizione, ingredienti, prezzo):",
      JSON.stringify(
        products.map((p) => ({
          id: p.id,
          category: p.category.name,
          name: p.name,
          shortDescription: p.shortDescription ?? "",
          description: p.description ?? "",
          ingredients: p.ingredients ?? "",
          price: p.price ? p.price.toString() : ""
        })),
        null,
        2
      ),
      "",
      "Formato JSON:",
      '{ "recommendedProductIds": ["<id1>", "<id2>"], "reason"?: "testo breve" }',
      "",
      "Vincoli:",
      "- 3 o 4 suggerimenti",
      "- reason max 180 caratteri",
      "- Italiano"
    ].join("\n")

    const res = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })

    const content = res.choices[0]?.message?.content ?? ""
    const json = JSON.parse(content) as unknown
    const parsed = recommendSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({
        ok: true,
        recommendedProductIds: products.slice(0, 4).map((p) => p.id),
        reason: "Ecco alcune scelte che potrebbero piacerti."
      })
    }

    const recommendedProductIds = Array.from(
      new Set(parsed.data.recommendedProductIds.filter((id) => ids.has(id)))
    ).slice(0, 4)

    return NextResponse.json({
      ok: true,
      recommendedProductIds: recommendedProductIds.length ? recommendedProductIds : products.slice(0, 4).map((p) => p.id),
      reason: parsed.data.reason?.slice(0, 180)
    })
  } catch {
    return NextResponse.json({
      ok: true,
      recommendedProductIds: products.slice(0, 4).map((p) => p.id),
      reason: "Ecco alcune scelte che potrebbero piacerti."
    })
  }
}
