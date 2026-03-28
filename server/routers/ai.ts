import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { estimates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const TRADE_TAKEOFF_PROMPTS: Record<string, string> = {
  electrical: `You are an expert Australian electrical estimator. Analyze the provided construction plan description and extract electrical quantities. 
Return a JSON object with:
- items: array of { description, unit, quantity, unitRate (AUD), category ("Materials"|"Labour"|"Plant") }
- confidence: number 0-100
- assumptions: array of strings
Focus on: power points, light points, switchboards, circuits, conduit runs, cable lengths, smoke alarms, data points.
Use current Australian market rates (2024-25).`,

  plumbing: `You are an expert Australian plumbing estimator. Analyze the provided construction plan description and extract plumbing quantities.
Return a JSON object with:
- items: array of { description, unit, quantity, unitRate (AUD), category ("Materials"|"Labour"|"Plant") }
- confidence: number 0-100
- assumptions: array of strings
Focus on: fixtures (toilets, basins, showers), pipe runs (copper, PEX, PVC), hot water systems, drainage, valves.
Use current Australian market rates (2024-25).`,

  carpentry: `You are an expert Australian carpentry estimator. Analyze the provided construction plan description and extract carpentry quantities.
Return a JSON object with:
- items: array of { description, unit, quantity, unitRate (AUD), category ("Materials"|"Labour"|"Plant") }
- confidence: number 0-100
- assumptions: array of strings
Focus on: framing (wall, roof, floor), cladding, decking, doors, windows, skirting, architraves.
Use current Australian market rates (2024-25).`,

  concreting: `You are an expert Australian concreting estimator. Analyze the provided construction plan description and extract concreting quantities.
Return a JSON object with:
- items: array of { description, unit, quantity, unitRate (AUD), category ("Materials"|"Labour"|"Plant") }
- confidence: number 0-100
- assumptions: array of strings
Focus on: concrete volume (m³), reinforcement (kg), formwork (m²), finishing, pump hire, excavation.
Use current Australian market rates (2024-25).`,

  hvac: `You are an expert Australian HVAC estimator. Analyze the provided construction plan description and extract HVAC quantities.
Return a JSON object with:
- items: array of { description, unit, quantity, unitRate (AUD), category ("Materials"|"Labour"|"Plant") }
- confidence: number 0-100
- assumptions: array of strings
Focus on: split systems (kW), ducted systems, ductwork (m), grilles, refrigerant piping, electrical connections.
Use current Australian market rates (2024-25).`,

  flooring: `You are an expert Australian flooring estimator. Analyze the provided construction plan description and extract flooring quantities.
Return a JSON object with:
- items: array of { description, unit, quantity, unitRate (AUD), category ("Materials"|"Labour"|"Plant") }
- confidence: number 0-100
- assumptions: array of strings
Focus on: floor areas (m²) by room, tile types, timber flooring, carpet, vinyl, adhesives, underlay, skirting.
Use current Australian market rates (2024-25).`,

  landscaping: `You are an expert Australian landscaping estimator. Analyze the provided construction plan description and extract landscaping quantities.
Return a JSON object with:
- items: array of { description, unit, quantity, unitRate (AUD), category ("Materials"|"Labour"|"Plant") }
- confidence: number 0-100
- assumptions: array of strings
Focus on: turf (m²), garden beds, retaining walls (lm), paving (m²), irrigation, plants, soil, mulch, fencing.
Use current Australian market rates (2024-25).`,

  cabinetry: `You are an expert Australian cabinetry estimator. Analyze the provided construction plan description and extract cabinetry quantities.
Return a JSON object with:
- items: array of { description, unit, quantity, unitRate (AUD), category ("Materials"|"Labour"|"Plant") }
- confidence: number 0-100
- assumptions: array of strings
Focus on: base cabinets (lm), wall cabinets (lm), benchtops (lm), doors, drawers, handles, appliances, splashback.
Use current Australian market rates (2024-25).`,

  rendering: `You are an expert Australian plastering and rendering estimator. Analyze the provided construction plan description and extract quantities.
Return a JSON object with:
- items: array of { description, unit, quantity, unitRate (AUD), category ("Materials"|"Labour"|"Plant") }
- confidence: number 0-100
- assumptions: array of strings
Focus on: wall areas (m²), ceiling areas (m²), render coats, plasterboard, cornice (lm), set, texture coatings.
Use current Australian market rates (2024-25).`,

  "cabinet-making": `You are an expert Australian cabinet making estimator. Analyze the provided construction plan description and extract quantities.
Return a JSON object with:
- items: array of { description, unit, quantity, unitRate (AUD), category ("Materials"|"Labour"|"Plant") }
- confidence: number 0-100
- assumptions: array of strings
Focus on: custom cabinets (ea), wardrobes, built-ins, sheet materials (sheets), hardware, finishes, installation.
Use current Australian market rates (2024-25).`,
};

export const aiRouter = router({
  analyzePlan: protectedProcedure.input(z.object({
    estimateId: z.number(),
    trade: z.string(),
    planDescription: z.string().min(10),
    projectDetails: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verify ownership
    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");

    const systemPrompt = TRADE_TAKEOFF_PROMPTS[input.trade] ?? TRADE_TAKEOFF_PROMPTS.electrical;

    const userMessage = `Project Details: ${input.projectDetails ?? "Standard residential project"}

Plan Description / Quantities to Estimate:
${input.planDescription}

Please provide a detailed takeoff with accurate Australian market pricing.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "takeoff_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    unit: { type: "string" },
                    quantity: { type: "number" },
                    unitRate: { type: "number" },
                    category: { type: "string" },
                  },
                  required: ["description", "unit", "quantity", "unitRate", "category"],
                  additionalProperties: false,
                },
              },
              confidence: { type: "number" },
              assumptions: { type: "array", items: { type: "string" } },
            },
            required: ["items", "confidence", "assumptions"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    if (!content) throw new Error("No response from AI");

    const result = JSON.parse(content) as {
      items: Array<{ description: string; unit: string; quantity: number; unitRate: number; category: string }>;
      confidence: number;
      assumptions: string[];
    };

    // Save AI data to estimate
    await db.update(estimates).set({
      aiConfidenceScore: result.confidence,
      aiAssumptions: result.assumptions as any,
      aiTakeoffData: result.items as any,
    }).where(eq(estimates.id, input.estimateId));

    return result;
  }),

  generateQuoteSummary: protectedProcedure.input(z.object({
    trade: z.string(),
    clientName: z.string().optional(),
    projectAddress: z.string().optional(),
    lineItemsSummary: z.string(),
    total: z.number(),
  })).mutation(async ({ input }) => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional Australian trade contractor. Write a concise, professional quote summary paragraph (2-3 sentences) that describes the scope of work for the client. Be specific about what is included. Use professional Australian English.",
        },
        {
          role: "user",
          content: `Trade: ${input.trade}
Client: ${input.clientName ?? "Client"}
Address: ${input.projectAddress ?? "Project site"}
Work items: ${input.lineItemsSummary}
Total value: $${input.total.toFixed(2)} inc. GST

Write a professional scope of works summary.`,
        },
      ],
    });
    const summaryContent = response.choices[0]?.message?.content;
    return { summary: typeof summaryContent === 'string' ? summaryContent : "" };
  }),
});
