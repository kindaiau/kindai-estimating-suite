import "dotenv/config";
import { invokeLLM } from "../server/_core/llm";
import { mediaContentFromUrl } from "../server/_core/mediaInputs";

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (!arg.startsWith("--")) continue;
  const key = arg.slice(2);
  const next = process.argv[i + 1];
  if (!next || next.startsWith("--")) {
    args.set(key, "true");
  } else {
    args.set(key, next);
    i++;
  }
}

const url = args.get("url");
const trade = args.get("trade") ?? "electrical";
const context =
  args.get("context") ??
  "Production smoke test. Check that the uploaded plan file can be read and return a small, conservative takeoff sample.";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is required for this live OpenAI smoke test.");
  process.exit(1);
}

if (!url) {
  console.error(
    [
      "Usage:",
      "  OPENAI_API_KEY=... OPENAI_MODEL=gpt-5.5 corepack pnpm tsx scripts/smoke-openai-media.ts --url https://.../plan.pdf --trade electrical",
      "",
      "Use a public or signed URL that OpenAI can fetch. Do not paste secrets into the command history on shared machines.",
    ].join("\n")
  );
  process.exit(1);
}

const response = await invokeLLM({
  messages: [
    {
      role: "system",
      content:
        "You are a senior Australian construction estimator. This is a live smoke test, not a client quote. Return only the requested JSON and be honest if the document cannot be read.",
    },
    {
      role: "user",
      content: [
        mediaContentFromUrl(url),
        {
          type: "text",
          text: `Trade: ${trade}\nContext: ${context}\n\nConfirm whether the model can read this uploaded plan. Extract a tiny representative takeoff sample only; do not fabricate details that are not visible.`,
        },
      ],
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "openai_media_smoke_test",
      strict: true,
      schema: {
        type: "object",
        properties: {
          canReadDocument: { type: "boolean" },
          documentType: { type: "string" },
          visibleEvidence: {
            type: "array",
            items: { type: "string" },
          },
          sampleItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                unit: { type: "string" },
                quantity: { type: "number" },
                confidence: { type: "number" },
              },
              required: ["description", "unit", "quantity", "confidence"],
              additionalProperties: false,
            },
          },
          warnings: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "canReadDocument",
          "documentType",
          "visibleEvidence",
          "sampleItems",
          "warnings",
        ],
        additionalProperties: false,
      },
    },
  },
  thinkingBudget: 2048,
});

const content = response.choices[0]?.message.content;
console.log(
  JSON.stringify(
    {
      model: response.model,
      usage: response.usage,
      result: typeof content === "string" ? JSON.parse(content) : content,
    },
    null,
    2
  )
);
