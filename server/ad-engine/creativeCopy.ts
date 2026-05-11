import { invokeLLM } from "../_core/llm";
import { getMarketingBrain } from "./marketingBrain";
import type { GeneratedCopy } from "./types";

type CopyInput = {
  productBenefits: string;
  audiencePainPoints: string;
  offer?: string;
  tone?: string;
};

const scoreText = (headline: string, primaryText: string, cta: string) => {
  const text = `${headline} ${primaryText} ${cta}`.toLowerCase();
  const clarity = headline.length <= 72 && primaryText.length <= 280 ? 86 : 72;
  const emotionalPull = ["stress", "chaos", "save", "win", "clear", "fast", "burnout"].some((word) =>
    text.includes(word)
  )
    ? 88
    : 70;
  const ctaStrength = /start|get|book|try|build|launch|see/.test(cta.toLowerCase()) ? 90 : 68;
  const overall = Math.round((clarity + emotionalPull + ctaStrength) / 3);
  return { clarity, emotionalPull, ctaStrength, overall };
};

const fallbackCopy = (input: CopyInput): GeneratedCopy[] => {
  const brain = getMarketingBrain();
  const headline = input.offer?.toLowerCase().includes("estimator")
    ? "Quote faster with AI estimating"
    : "Turn messy growth into a simple AI system";
  const primaryText = input.offer?.toLowerCase().includes("estimator")
    ? `Built for Australian builders and trades who are tired of ${input.audiencePainPoints || brain.primaryProduct.painPoints.join(", ")}. ${input.productBenefits || brain.primaryProduct.promise}`
    : `Built for founders who need ${input.productBenefits || "clearer execution"} without ${input.audiencePainPoints || "more manual work"}. Launch faster, track what matters and keep the next move obvious.`;
  const cta = input.offer?.toLowerCase().includes("estimator") ? "See Kindai Estimator" : input.offer ? `Get ${input.offer}` : "Start building";
  return [{ headline, primaryText, cta, scores: scoreText(headline, primaryText, cta) }];
};

export async function generateAdCopy(input: CopyInput): Promise<GeneratedCopy[]> {
  if (!process.env.OPENAI_API_KEY && !process.env.BUILT_IN_FORGE_API_KEY) {
    return fallbackCopy(input);
  }

  try {
    const brain = getMarketingBrain();
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: [
            "You write direct, high-converting Meta ad copy for Kindai.",
            "Primary product to scale: Kindai Estimator for Australian builders and trades.",
            `Primary goal: ${brain.primaryGoal} / booked call.`,
            `Product promise: ${brain.primaryProduct.promise}`,
            `Audience: ${brain.primaryProduct.audience.join(", ")}`,
            `Benefits: ${brain.primaryProduct.benefits.join(", ")}`,
            `Pain points: ${brain.primaryProduct.painPoints.join(", ")}`,
            `Forbidden claims: ${brain.guardrails.forbiddenClaims.join(", ")}`,
            "Keep copy simple, concrete, compliant and benefit-led. Return strict JSON only.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
      outputSchema: {
        name: "ad_copy_variants",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["variants"],
          properties: {
            variants: {
              type: "array",
              minItems: 3,
              maxItems: 5,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["headline", "primaryText", "cta"],
                properties: {
                  headline: { type: "string" },
                  primaryText: { type: "string" },
                  cta: { type: "string" },
                },
              },
            },
          },
        },
      },
      thinkingBudget: 128,
    });
    const content = response.choices[0]?.message.content;
    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content)) as {
      variants?: Array<Omit<GeneratedCopy, "scores">>;
    };
    return (parsed.variants?.length ? parsed.variants : fallbackCopy(input)).map((variant) => ({
      ...variant,
      scores: scoreText(variant.headline, variant.primaryText, variant.cta),
    }));
  } catch (error) {
    console.warn("[AdEngine] Falling back to local copy generator:", error);
    return fallbackCopy(input);
  }
}
