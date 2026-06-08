import OpenAI from "openai"
import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/db"
import { getEnv } from "@/lib/env"
import { appUrl } from "@/lib/url"

export const runtime = "nodejs"

const requestSchema = z.object({
  businessSlug: z.string().min(1),
  mode: z.enum(["init", "recommend", "personalize_init", "create_order"]).optional(),
  lang: z.enum(["it", "en"]).optional(),
  answers: z.record(z.string(), z.string()).optional(),
  baseProductId: z.string().min(1).optional(),
  personalization: z.record(z.string(), z.array(z.string().min(1)).max(8)).optional(),
  personalizationSummary: z
    .array(z.object({ question: z.string().min(1).max(120), selected: z.array(z.string().min(1).max(60)).max(8) }))
    .max(8)
    .optional()
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

const personalizeQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().min(1).max(24),
        text: z.string().min(1).max(120),
        multi: z.boolean().optional(),
        options: z
          .array(z.object({ id: z.string().min(1).max(64), label: z.string().min(1).max(48) }))
          .min(2)
          .max(8)
      })
    )
    .min(1)
    .max(6)
})

const recommendSchema = z.object({
  recommendedProductIds: z.array(z.string().min(1)).min(1).max(6),
  reason: z.string().optional()
})

const createOrderSchema = z.object({
  title: z.string().min(1).max(70),
  notes: z.string().max(320).optional(),
  baseProductId: z.string().min(1).optional(),
  recommendedProductIds: z.array(z.string().min(1)).min(1).max(6).optional()
})

function slugId(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24)
}

function extractExtras(products: Array<{ name: string; category: { name: string } }>) {
  const matches = products.filter((p) => {
    const c = p.category.name.toLowerCase()
    const n = p.name.toLowerCase()
    return (
      c.includes("topping") ||
      c.includes("extra") ||
      c.includes("aggiunt") ||
      c.includes("sals") ||
      c.includes("condiment") ||
      n.includes("extra") ||
      n.includes("topping") ||
      n.includes("aggiunt")
    )
  })
  const unique = Array.from(new Set(matches.map((p) => p.name))).slice(0, 6)
  return unique
}

function extractToppingCandidates(
  businessType: string | null,
  baseName: string,
  baseCategory: string,
  products: Array<{ id: string; name: string; category: { name: string }; price: unknown }>
) {
  const t = (businessType ?? "").toUpperCase()
  const base = `${baseName} ${baseCategory}`.toLowerCase()
  const isSweetBase =
    base.includes("waff") ||
    base.includes("crep") ||
    base.includes("pancak") ||
    base.includes("gelat") ||
    base.includes("dessert") ||
    base.includes("dolc") ||
    t === "GELATERIA" ||
    t === "PASTICCERIA"

  const categoryHits = [
    "topping",
    "toppings",
    "extra",
    "aggiunt",
    "sals",
    "crem",
    "guarn",
    "condiment",
    "gelat",
    "gust",
    "pallin",
    "frutt",
    "granell"
  ]

  const nameHits = [
    "nutella",
    "panna",
    "pistacchio",
    "cioccol",
    "caramell",
    "fragol",
    "oreo",
    "smarties",
    "cocco",
    "mandorl",
    "nocciol",
    "crema",
    "marmell",
    "frutti",
    "biscott"
  ]

  const scored = products
    .map((p) => {
      const c = p.category.name.toLowerCase()
      const n = p.name.toLowerCase()
      let score = 0
      if (categoryHits.some((h) => c.includes(h))) score += 4
      if (nameHits.some((h) => n.includes(h))) score += 3
      if (isSweetBase && (c.includes("gelat") || c.includes("gust") || n.includes("gelat"))) score += 2
      return { id: p.id, name: p.name, category: p.category.name, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

  const seen = new Set<string>()
  const unique = []
  for (const item of scored) {
    const k = item.name.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    unique.push(item)
    if (unique.length >= 12) break
  }
  return unique
}

function extractIngredientOptions(ingredients: string | null | undefined) {
  if (!ingredients) return []
  const parts = ingredients
    .split(/[,;•\n]/g)
    .map((s) => s.trim())
    .filter(Boolean)
  const unique = Array.from(new Set(parts)).slice(0, 6)
  return unique
}

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

  if (mode === "personalize_init") {
    const baseProductId = parsedReq.data.baseProductId
    if (!baseProductId || !ids.has(baseProductId)) {
      return NextResponse.json({ ok: false, error: "Prodotto base non valido." }, { status: 400 })
    }

    const base = products.find((p) => p.id === baseProductId) ?? null
    if (!base) {
      return NextResponse.json({ ok: false, error: "Prodotto base non valido." }, { status: 400 })
    }

    const extras = extractExtras(products)
    const toppingCandidates = extractToppingCandidates(
      business.type,
      base.name,
      base.category.name,
      products
    )
    const ingredientOptions = extractIngredientOptions(base.ingredients)

    if (!hasAi) {
      const toppingOptions = toppingCandidates.slice(0, 6)
      const questions = [
        ...(toppingOptions.length
          ? [
              {
                id: "toppings",
                text: lang === "en" ? "What would you like on top?" : "Cosa ci metti sopra?",
                multi: true,
                options: [{ id: "none", label: lang === "en" ? "None" : "Nessuna" }].concat(
                  toppingOptions.map((e) => ({ id: e.id, label: e.name }))
                )
              }
            ]
          : []),
        ...(extras.length && !toppingOptions.length
          ? [
              {
                id: "extras",
                text: lang === "en" ? "Any extras?" : "Vuoi aggiunte?",
                multi: true,
                options: [{ id: "none", label: lang === "en" ? "None" : "Nessuna" }].concat(
                  extras.map((e) => ({ id: slugId(e), label: e }))
                )
              }
            ]
          : []),
        ...(ingredientOptions.length
          ? [
              {
                id: "no",
                text: lang === "en" ? "Remove something?" : "Togli qualcosa?",
                multi: true,
                options: [{ id: "none", label: lang === "en" ? "Nothing" : "Niente" }].concat(
                  ingredientOptions.map((e) => ({ id: slugId(e), label: e }))
                )
              }
            ]
          : []),
      ].slice(0, 3)

      return NextResponse.json({ ok: true, baseProductId, questions })
    }

    try {
      const client = new OpenAI({ apiKey: env.OPENAI_API_KEY! })
      const model = env.OPENAI_MODEL ?? "gpt-4o-mini"

      const system = [
        "Sei un assistente per menu digitali.",
        "Crea 2-4 domande di personalizzazione per un ordine, basandoti SOLO sul contesto fornito.",
        "Le opzioni devono essere selezionabili (niente testo libero).",
        "Se una domanda è multi, includi sempre una opzione 'Nessuna' con id 'none'.",
        "Se proponi 'topping/aggiunte sopra', usa SOLO la lista toppingsCandidates fornita. Se vuota, non proporre topping inventati.",
        "Se proponi 'aggiunte generiche', usa SOLO la lista extras fornita.",
        "Se proponi 'senza ...', usa solo ingredienti reali della lista fornita. Se vuota, non proporre rimozioni inventate.",
        "Restituisci SOLO JSON valido, senza testo extra. Niente emoji."
      ].join("\n")

      const user = [
        `Locale: ${business.name}. Tipo: ${business.type}. Lingua: ${lang}.`,
        "Prodotto base (id, categoria, nome, descrizione, ingredienti):",
        JSON.stringify(
          {
            id: base.id,
            category: base.category.name,
            name: base.name,
            shortDescription: base.shortDescription ?? "",
            description: base.description ?? "",
            ingredients: base.ingredients ?? ""
          },
          null,
          2
        ),
        "",
        "Extras dal DB (usa solo questi se proponi aggiunte):",
        JSON.stringify(extras, null, 2),
        "",
        "Topping candidates dal DB (id, nome, categoria) - usa solo questi per 'cosa ci metti sopra':",
        JSON.stringify(toppingCandidates, null, 2),
        "",
        "Ingredienti (usa solo questi se proponi rimozioni):",
        JSON.stringify(ingredientOptions, null, 2),
        "",
        "Formato JSON:",
        '{ "questions": [{ "id": "extras", "text": "…", "multi": true, "options": [{ "id": "none", "label": "Nessuna" }] }] }',
        "",
        "Vincoli:",
        "- massimo 3 domande se possibile",
        "- 3-6 opzioni per domanda",
        "- id max 24 caratteri (usa snake_case)",
        "- options.id può essere lungo (può essere un product id), ma NON inventare product id"
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
      const parsed = personalizeQuestionsSchema.safeParse(json)
      if (!parsed.success) {
        return NextResponse.json({ ok: true, baseProductId, questions: [] })
      }

      return NextResponse.json({ ok: true, baseProductId, questions: parsed.data.questions.slice(0, 4) })
    } catch {
      return NextResponse.json({ ok: true, baseProductId, questions: [] })
    }
  }

  if (mode === "create_order") {
    if (products.length === 0) {
      return NextResponse.json({ ok: false, error: "Menu vuoto." }, { status: 400 })
    }

    const baseProductIdReq = parsedReq.data.baseProductId
    if (!baseProductIdReq || !ids.has(baseProductIdReq)) {
      return NextResponse.json({ ok: false, error: "Prodotto base non valido." }, { status: 400 })
    }
    const base = products.find((p) => p.id === baseProductIdReq) ?? null
    if (!base) {
      return NextResponse.json({ ok: false, error: "Prodotto base non valido." }, { status: 400 })
    }

    if (!hasAi) {
      const personalization = parsedReq.data.personalization ?? {}
      const personalizationSummary = parsedReq.data.personalizationSummary ?? []

      const title = `${base.name} (personalizzato)`.slice(0, 70)
      const notesParts: string[] = []
      for (const row of personalizationSummary) {
        if (!row.selected.length) continue
        notesParts.push(`${row.question}: ${row.selected.join(", ")}`)
      }
      const notes = notesParts.join("\n").slice(0, 320)

      const created = await prisma.specialOrder.create({
        data: {
          businessId: business.id,
          title,
          notes,
          answers: { quiz: answers, personalization, personalizationSummary },
          baseProductId: base.id,
        }
      })

      return NextResponse.json({
        ok: true,
        orderId: created.id,
        qrUrl: `${appUrl()}/order/${created.id}`,
        baseProductId: base.id,
        title,
        notes
      })
    }

    try {
      const client = new OpenAI({ apiKey: env.OPENAI_API_KEY! })
      const model = env.OPENAI_MODEL ?? "gpt-4o-mini"

      const system = [
        "Sei un assistente per menu digitali.",
        "Crea una comanda speciale chiara per lo staff.",
        "Il prodotto base è già scelto dall'utente: non cambiarlo.",
        "Usa le preferenze di personalizzazione selezionate dall'utente per scrivere note pratiche (topping, senza, ecc).",
        "Restituisci SOLO JSON valido, senza testo extra.",
        "Niente emoji.",
        "Usa SOLO product ids presenti."
      ].join("\n")

      const personalization = parsedReq.data.personalization ?? {}
      const personalizationSummary = parsedReq.data.personalizationSummary ?? []

      const user = [
        `Locale: ${business.name}. Tipo: ${business.type}. Lingua: ${lang}.`,
        "Prodotto base scelto dall'utente:",
        JSON.stringify(
          {
            id: base.id,
            category: base.category.name,
            name: base.name,
            shortDescription: base.shortDescription ?? "",
            description: base.description ?? "",
            ingredients: base.ingredients ?? "",
            price: base.price ? base.price.toString() : ""
          },
          null,
          2
        ),
        "",
        "Risposte quiz (mappa domanda->opzione):",
        JSON.stringify(answers, null, 2),
        "",
        "Personalizzazioni selezionate (mappa domanda->lista opzioni):",
        JSON.stringify(personalization, null, 2),
        "",
        "Personalizzazioni selezionate (leggibili):",
        JSON.stringify(personalizationSummary, null, 2),
        "",
        "Formato JSON:",
        '{ "title": "…", "notes"?: "…" }',
        "",
        "Vincoli:",
        "- title max 70 caratteri",
        "- notes max 320 caratteri",
        "- non inventare opzioni non citate: se qualcosa non è specificato, non aggiungerlo"
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
      const parsed = createOrderSchema.safeParse(json)
      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: "Risposta AI non valida." }, { status: 500 })
      }

      const created = await prisma.specialOrder.create({
        data: {
          businessId: business.id,
          title: parsed.data.title.slice(0, 70),
          notes: parsed.data.notes?.slice(0, 320) ?? null,
          answers: { quiz: answers, personalization, personalizationSummary },
          baseProductId: base.id,
        }
      })

      return NextResponse.json({
        ok: true,
        orderId: created.id,
        qrUrl: `${appUrl()}/order/${created.id}`,
        baseProductId: base.id,
        title: created.title,
        notes: created.notes ?? undefined
      })
    } catch {
      return NextResponse.json({ ok: false, error: "AI non disponibile." }, { status: 503 })
    }
  }

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
