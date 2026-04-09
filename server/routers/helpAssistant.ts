import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

const KINDAI_SYSTEM_PROMPT = `You are the Kindai AI Assistant — an expert in Australian construction estimating, trade pricing, compliance, and project management.

You have deep knowledge of:
- All 20 Australian construction trades: Electrical, Plumbing & Drainage, Carpentry & Joinery, Concreting, HVAC, Flooring, Landscaping, Cabinet Making & Joinery, Rendering & Plastering, Painting & Decorating, Bricklaying, Roofing, Tiling, Waterproofing, Fire Protection, Glazing & Aluminium, Quantity Surveying, Demolition & Excavation, Swimming Pool Construction, Steel Fabrication
- 2024-25 Australian trade pricing (Reece, Middy's, Bowens, Boral, Daikin, Bunnings Trade, Tradelink, Clipsal, HPM, Hager)
- Australian labour rates per trade (Fair Work Act 2024-25)
- State/territory licensing: QBCC (QLD), VBA (VIC), NSW Fair Trading, SA CBS, WA DMIRS, TAS Consumer Building & Occupational Services, NT NT Build, ACT Access Canberra
- Australian Standards: AS/NZS 3000 (Wiring Rules), AS 3500 (Plumbing), AS 1684 (Timber Framing), AS 3600 (Concrete), AS 1851 (Fire), NCC/BCA
- GST, markup strategies, margin calculations
- Kindai Estimating Suite features: AI Vision Takeoff, Materials Library, Labour Rates, Compliance, PDF Export, Benchmarking, Quote Follow-ups, Supplier Integration, Team Management, Tender Management, Variations Register
- How to use every feature in the Kindai platform

RESPONSE STYLE:
- Be direct, practical, and specific — no waffle
- Use Australian terminology (tradie, GPO, m², lm, etc.)
- Give specific prices, quantities, and rates when asked
- If asked about a specific job, provide a rough estimate breakdown
- Keep responses concise but complete — bullet points for lists, paragraphs for explanations
- Always mention relevant Kindai features that can help

You are here to help Australian tradies and builders win more jobs, price accurately, and run better businesses.`;

export const helpAssistantRouter = router({
  // Public chat — works without login for demo users
  chat: publicProcedure.input(z.object({
    message: z.string().min(1).max(2000),
    trade: z.string().optional(),
    context: z.string().optional(), // e.g., "viewing estimate #123 for plumbing"
    history: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })).max(10).default([]),
  })).mutation(async ({ input }) => {
    const tradeContext = input.trade
      ? `\n\nCurrent context: The user is working on a ${input.trade} estimate.`
      : "";
    const pageContext = input.context
      ? `\nPage context: ${input.context}`
      : "";

    const systemContent = KINDAI_SYSTEM_PROMPT + tradeContext + pageContext;

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemContent },
      ...input.history.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: input.message },
    ];

    const response = await invokeLLM({ messages });
    const content = response.choices[0]?.message?.content;
    const text = typeof content === "string" ? content : JSON.stringify(content);

    return { reply: text };
  }),

  // Quick suggestions based on current page/trade
  getSuggestions: publicProcedure.input(z.object({
    trade: z.string().optional(),
    page: z.string().optional(),
  })).query(({ input }) => {
    const tradeSuggestions: Record<string, string[]> = {
      electrical: [
        "What's the 2024-25 rate for a licensed electrician in QLD?",
        "How do I price a 3-phase switchboard upgrade?",
        "What cable sizes do I need for a 20A circuit?",
        "What's included in a standard residential electrical prelim?",
      ],
      plumbing: [
        "What's the current rate for a plumber in VIC?",
        "How do I price a 5-townhouse hydraulic rough-in?",
        "What's the difference between Type B and Type L copper pipe?",
        "What sections should I include in a commercial plumbing estimate?",
      ],
      carpentry: [
        "What's the current rate for a carpenter in NSW?",
        "How do I price wall framing for a 200m² house?",
        "What timber sizes are standard for residential framing?",
        "What's included in a carpentry prelim for a new build?",
      ],
      concreting: [
        "How do I price a 180m² house slab with mesh?",
        "What's the current rate for a concretor in QLD?",
        "How much concrete do I need for a 100mm slab?",
        "What's the difference between N20 and N32 concrete?",
      ],
      hvac: [
        "How do I price a ducted system for a 200m² house?",
        "What's the current rate for an HVAC technician?",
        "What size ducted system do I need for a 5-bedroom house?",
        "What's included in an HVAC commissioning prelim?",
      ],
      painting: [
        "How do I price interior painting for a 3-bedroom house?",
        "What's the current rate for a painter in NSW?",
        "How much paint do I need for 280m² of walls?",
        "What's the difference between trade and retail paint pricing?",
      ],
      roofing: [
        "How do I price a metal roof for a 200m² house?",
        "What's the current rate for a roofer in QLD?",
        "What's the difference between Colorbond and Zincalume?",
        "What's included in a roofing prelim?",
      ],
      "quantity-surveying": [
        "How do I prepare a bill of quantities for a $5M commercial project?",
        "What's the standard QS fee for a $2M residential project?",
        "What's included in a cost plan vs a BQ?",
        "How do I handle PC sums and provisional sums?",
      ],
    };

    const pageSuggestions: Record<string, string[]> = {
      estimate: [
        "How do I add a contingency to my estimate?",
        "What markup should I use for residential work?",
        "How do I calculate GST on a quote?",
        "What's a fair margin for a $500K project?",
      ],
      materials: [
        "Where can I get the best trade pricing in Australia?",
        "How do I set up a trade account with Reece?",
        "What's the difference between retail and trade pricing?",
        "How do I add custom materials to my library?",
      ],
      projects: [
        "How do I organise a multi-building project in Kindai?",
        "What's the best way to track project variations?",
        "How do I use the tender management feature?",
        "How do I invite a team member to a project?",
      ],
    };

    const suggestions = [
      ...(input.trade ? (tradeSuggestions[input.trade] ?? []) : []),
      ...(input.page ? (pageSuggestions[input.page] ?? []) : []),
    ];

    const defaults = [
      "How do I get started with Kindai?",
      "What trades does Kindai support?",
      "How does the AI Vision Takeoff work?",
      "How do I export a quote to PDF?",
      "What's the best markup for my trade?",
      "How do I set up my supplier accounts?",
    ];

    return {
      suggestions: suggestions.length > 0
        ? suggestions.slice(0, 4)
        : defaults.slice(0, 4),
    };
  }),
});
