import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { invokeLLM, type MessageContent } from "../_core/llm";
import {
  fencingConfig,
  fencingProducts,
} from "../../config/industries/fencing";

export const frameSchema = z.object({
  seconds: z.number().finite().min(0).max(120),
  image: z
    .string()
    .max(450000)
    .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/),
});
export const surveySchema = z.object({
  frames: z.array(frameSchema).min(1).max(8),
  notes: z.string().max(4000),
  goats: z.enum(["unknown", "adults", "kids", "mixed"]),
  horns: z.enum(["unknown", "yes", "no"]),
});

export function extractBunningsPrice(
  html: string,
  itemId: string
): number | null {
  // Only accept an exact Product's AUD Offer, never unrelated recommendations or price ranges.
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const match of Array.from(scripts)) {
    let root: unknown;
    try {
      root = JSON.parse(match[1]);
    } catch {
      continue;
    }
    const walk = (value: unknown): number | null => {
      if (!value || typeof value !== "object") return null;
      if (Array.isArray(value)) {
        for (const child of value) {
          const n = walk(child);
          if (n !== null) return n;
        }
        return null;
      }
      const obj = value as Record<string, unknown>;
      const identity = String(obj.sku ?? obj.productID ?? "");
      if (
        obj["@type"] === "Product" &&
        (identity === itemId || String(obj.url ?? "").includes(`_p${itemId}`))
      ) {
        const offers = Array.isArray(obj.offers) ? obj.offers : [obj.offers];
        for (const offer of offers) {
          if (!offer || typeof offer !== "object") continue;
          const o = offer as Record<string, unknown>;
          const price =
            typeof o.price === "number" ||
            (typeof o.price === "string" && /^\d+(\.\d{1,2})?$/.test(o.price))
              ? Number(o.price)
              : NaN;
          if (
            o["@type"] === "Offer" &&
            o.priceCurrency === "AUD" &&
            Number.isFinite(price) &&
            price > 0 &&
            price < 100000
          )
            return price;
        }
      }
      return obj["@graph"] ? walk(obj["@graph"]) : null;
    };
    const price = walk(root);
    if (price !== null) return price;
  }
  return null;
}

const aiReady = () =>
  Boolean(ENV.openAiApiKey || (ENV.forgeApiKey && ENV.forgeApiUrl));
const active = new Set<number>();
export const fencingRouter = router({
  status: protectedProcedure.query(() => ({
    aiReady: aiReady(),
    model: ENV.openAiApiKey ? ENV.openAiModel || "gpt-5.5" : "gemini-2.5-flash",
  })),
  survey: protectedProcedure
    .input(surveySchema)
    .mutation(async ({ input, ctx }) => {
      if (!aiReady())
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "The estimator's AI connection needs configuring. You can still prepare quantities and review your video frames.",
        });
      if (active.has(ctx.user.id))
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Your previous survey is still running.",
        });
      active.add(ctx.user.id);
      try {
        const content: MessageContent[] = [
          {
            type: "text",
            text: `Goats: ${input.goats}. Horns: ${input.horns}. User site notes: ${input.notes || "None"}. ${input.frames.length} sampled frames follow.`,
          },
        ];
        for (const frame of input.frames)
          content.push(
            {
              type: "text",
              text: `Frame at ${frame.seconds.toFixed(1)} seconds`,
            },
            {
              type: "image_url",
              image_url: { url: frame.image, detail: "high" },
            }
          );
        const result = await invokeLLM({
          messages: [
            { role: "system", content: fencingConfig.systemPrompt },
            { role: "user", content },
          ],
          maxTokens: 2400,
          thinkingBudget: 512,
        });
        const response = result.choices[0]?.message.content;
        const report =
          typeof response === "string"
            ? response
            : Array.isArray(response)
              ? response
                  .filter(c => c.type === "text")
                  .map(c => c.text)
                  .join("\n")
              : "";
        if (!report.trim()) throw new Error("Empty survey");
        return {
          report,
          reviewedAt: new Date().toISOString(),
          frameCount: input.frames.length,
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "AI review could not finish. Your measurements are unchanged. Try again or use a shorter clip.",
        });
      } finally {
        active.delete(ctx.user.id);
      }
    }),
  price: protectedProcedure
    .input(z.object({ key: z.enum(["paling", "mesh", "concrete"]) }))
    .mutation(async ({ input }) => {
      const product = fencingProducts[input.key];
      // Fixed catalogue URLs only; never accept arbitrary URLs or forward user credentials.
      try {
        const response = await fetch(product.url, {
          redirect: "error",
          signal: AbortSignal.timeout(10000),
          headers: { Accept: "text/html" },
        });
        if (!response.ok || !response.body) throw new Error("Unavailable");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let html = "";
        let bytes = 0;
        try {
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            if (bytes > 2_000_000) throw new Error("Too large");
            html += decoder.decode(chunk.value, { stream: true });
          }
        } finally {
          await reader.cancel();
        }
        const amount = extractBunningsPrice(html, product.url.split("_p")[1]);
        if (amount === null) throw new Error("No exact price");
        return {
          amount,
          checkedAt: new Date().toISOString(),
          store: "Online listing — confirm local store",
          source: "bunnings" as const,
          url: product.url,
        };
      } catch {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Bunnings did not provide a verifiable price. Open the product, select your store and enter its current GST-inclusive price.",
        });
      }
    }),
});
