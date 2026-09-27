import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateFence,
  defaultFenceInput,
  fenceInputSchema,
  fencingCsv,
  priceFence,
} from "../shared/fencing";
import {
  extractBunningsPrice,
  fencingRouter,
  surveySchema,
} from "./routers/fencing";
import type { TrpcContext } from "./_core/context";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
vi.mock("./_core/env", () => ({
  ENV: {
    openAiApiKey: "test-only",
    openAiModel: "test-model",
    forgeApiKey: "",
    forgeApiUrl: "",
  },
}));
const ctx = (user: boolean) =>
  ({ user: user ? { id: 1 } : null, req: {}, res: {} }) as TrpcContext;
const frame = { seconds: 2, image: "data:image/jpeg;base64,/9j/AA==" };
const survey = {
  frames: [frame],
  notes: "Measured 30m",
  goats: "mixed" as const,
  horns: "yes" as const,
};

describe("fence takeoff", () => {
  it("rounds separate run bays up and never silently shares corner posts", () => {
    const result = calculateFence({
      ...defaultFenceInput,
      runs: [10, 10],
      spacing: 2.4,
    });
    expect(result.length).toBe(20);
    expect(result.bays).toBe(10);
    expect(result.posts).toBe(12);
    expect(result.lines.find(l => l.key === "brace")?.quantity).toBe(4);
    expect(result.lines.find(l => l.key === "post")?.quantity).toBe(8);
  });
  it("caps rail bays to stock length and counts waste and whole rolls", () => {
    const r = calculateFence({
      ...defaultFenceInput,
      runs: [50],
      spacing: 3,
      railLength: 2,
      railRows: 2,
    });
    expect(r.bays).toBe(25);
    expect(r.lines.find(l => l.key === "rail")?.quantity).toBe(55);
    expect(r.lines.find(l => l.key === "mesh")?.quantity).toBe(2);
  });
  it("counts timber palings separately from mesh and wire", () => {
    const r = calculateFence({
      ...defaultFenceInput,
      style: "timber",
      runs: [3],
      waste: 0,
    });
    expect(r.lines.find(l => l.key === "paling")?.quantity).toBe(20);
    expect(r.lines.some(l => ["mesh", "wire", "brace"].includes(l.key))).toBe(
      false
    );
  });
  it("includes gate sets without subtracting gate widths twice", () => {
    const a = calculateFence(defaultFenceInput);
    const b = calculateFence({ ...defaultFenceInput, gates: 1 });
    expect(a.length).toBe(b.length);
    expect(b.lines.find(l => l.key === "gate")?.quantity).toBe(1);
    expect(
      b.lines.find(l => l.key === "concrete")!.quantity -
        a.lines.find(l => l.key === "concrete")!.quantity
    ).toBe(4);
  });
  it("rejects empty runs, negative values and zero spacing", () => {
    for (const change of [
      { runs: [] },
      { runs: [0] },
      { runs: [-1] },
      { spacing: 0 },
      { waste: NaN },
    ])
      expect(
        fenceInputSchema.safeParse({ ...defaultFenceInput, ...change }).success
      ).toBe(false);
  });
  it("keeps missing prices incomplete and does not add GST twice", () => {
    const lines = [{ key: "mesh" as const, quantity: 2, basis: "test" }];
    expect(priceFence(lines, {}).complete).toBe(false);
    expect(
      priceFence(lines, {
        mesh: {
          amount: 100,
          checkedAt: "2026-09-06",
          source: "manual",
          store: "test",
          url: "",
        },
      })
    ).toEqual({ subtotal: 200, complete: true, missing: [] });
    expect(fencingCsv(lines, {})).toContain("PRICE NEEDED");
  });
});

describe("Bunnings evidence", () => {
  const html = (v: unknown) =>
    `<script type="application/ld+json">${JSON.stringify(v)}</script>`;
  const product = {
    "@type": "Product",
    sku: "0528068",
    offers: { "@type": "Offer", price: "123.45", priceCurrency: "AUD" },
  };
  it("accepts an exact AUD product offer only", () => {
    expect(extractBunningsPrice(html(product), "0528068")).toBe(123.45);
    expect(extractBunningsPrice(html(product), "9999999")).toBeNull();
    expect(
      extractBunningsPrice(
        html({
          ...product,
          offers: { ...product.offers, priceCurrency: "USD" },
        }),
        "0528068"
      )
    ).toBeNull();
    expect(extractBunningsPrice("<h1>$100 sale</h1>", "0528068")).toBeNull();
    expect(
      extractBunningsPrice(
        html({
          ...product,
          offers: {
            "@type": "AggregateOffer",
            lowPrice: 1,
            priceCurrency: "AUD",
          },
        }),
        "0528068"
      )
    ).toBeNull();
  });
});

describe("goat video AI boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ENV.openAiApiKey = "test-only";
  });
  it("requires authentication", async () => {
    await expect(
      fencingRouter.createCaller(ctx(false)).survey(survey)
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(invokeLLM).not.toHaveBeenCalled();
  });
  it("rejects remote images, oversize frames and more than eight frames", () => {
    expect(
      surveySchema.safeParse({
        ...survey,
        frames: [{ ...frame, image: "https://example.com/photo.jpg" }],
      }).success
    ).toBe(false);
    expect(
      surveySchema.safeParse({ ...survey, frames: Array(9).fill(frame) })
        .success
    ).toBe(false);
    expect(
      surveySchema.safeParse({
        ...survey,
        frames: [
          { ...frame, image: "data:image/jpeg;base64," + "A".repeat(450001) },
        ],
      }).success
    ).toBe(false);
  });
  it("uses the shared AI layer with timestamps and no automatic estimate changes", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: "Visible observations: ground gap at 2 seconds.",
          },
        },
      ],
    } as Awaited<ReturnType<typeof invokeLLM>>);
    const result = await fencingRouter.createCaller(ctx(true)).survey(survey);
    expect(result.report).toContain("ground gap");
    const args = vi.mocked(invokeLLM).mock.calls[0][0];
    expect(args.messages[0].content).toContain("Do not infer exact lengths");
    expect(JSON.stringify(args.messages)).toContain("Frame at 2.0 seconds");
    expect(JSON.stringify(args.messages)).toContain("data:image/jpeg");
  });
  it("returns a clear configuration error without fabricating a review", async () => {
    ENV.openAiApiKey = "";
    await expect(
      fencingRouter.createCaller(ctx(true)).survey(survey)
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(invokeLLM).not.toHaveBeenCalled();
  });
});
