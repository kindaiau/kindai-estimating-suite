import { z } from "zod";
import {
  fencingProducts,
  type FencingProductKey,
} from "../config/industries/fencing";

export const fenceInputSchema = z.object({
  style: z.enum(["mesh", "timber", "timber_mesh", "wire"]),
  runs: z.array(z.number().finite().min(0.01).max(10000)).min(1).max(100),
  spacing: z.number().finite().min(0.5).max(5),
  waste: z.number().finite().min(0).max(30),
  gates: z.number().int().min(0).max(50),
  railRows: z.number().int().min(1).max(5),
  railLength: z.number().finite().min(1).max(6),
  wireRows: z.number().int().min(1).max(12),
  wireRoll: z.number().finite().min(10).max(2000),
  concreteBagsPerPost: z.number().finite().min(0).max(20),
  fastenersPerPack: z.number().int().min(1).max(2000),
  staplesPerPack: z.number().int().min(1).max(2000),
});
export type FenceInput = z.infer<typeof fenceInputSchema>;
export const defaultFenceInput: FenceInput = {
  style: "timber_mesh",
  runs: [30],
  spacing: 2.4,
  waste: 10,
  gates: 0,
  railRows: 2,
  railLength: 2.4,
  wireRows: 2,
  wireRoll: 100,
  concreteBagsPerPost: 2,
  fastenersPerPack: 100,
  staplesPerPack: 100,
};
export type FenceLine = {
  key: FencingProductKey;
  quantity: number;
  basis: string;
};

const roundUp = (value: number) => Math.ceil(value - 1e-9);

export function calculateFence(raw: FenceInput) {
  const input = fenceInputSchema.parse(raw);
  const {
    style,
    runs,
    spacing,
    waste,
    railRows,
    railLength,
    wireRows,
    wireRoll,
  } = input;
  const timber = style === "timber" || style === "timber_mesh";
  const mesh = style === "mesh" || style === "timber_mesh";
  const wire = style !== "timber";
  const factor = 1 + waste / 100;
  // Separate runs start/end at breaks, gates and corners. Do not silently share posts.
  const maxBay = timber ? Math.min(spacing, railLength) : spacing;
  const bays = runs.reduce((sum, length) => sum + roundUp(length / maxBay), 0);
  const length = runs.reduce((sum, value) => sum + value, 0);
  const ends = runs.length * 2;
  const posts = bays + runs.length;
  const lines: FenceLine[] = [];
  const add = (key: FencingProductKey, quantity: number, basis: string) => {
    if (quantity > 0) lines.push({ key, quantity, basis });
  };
  add(
    "post",
    wire ? posts - ends : posts,
    wire
      ? "Intermediate posts only; terminal posts included in brace assemblies."
      : "Each run: rounded-up bays + 1. Gate posts are additional."
  );
  if (wire)
    add(
      "brace",
      ends,
      "Two complete end assemblies per run; corner sharing is not assumed."
    );
  if (timber)
    add(
      "rail",
      roundUp(bays * railRows * factor),
      `${railRows} rows; one ${railLength}m stock rail per bay; includes waste. No unsupported rail joins.`
    );
  if (style === "timber")
    add(
      "paling",
      roundUp(runs.reduce((n, r) => n + roundUp(r / 0.15), 0) * factor),
      "1.8m high, single layer, 150mm cover, no gap/overlap; includes waste."
    );
  if (mesh)
    add(
      "mesh",
      roundUp((length * factor) / 50),
      "1.22m high mesh; 50m rolls pooled across runs with joins/offcut reuse allowed; includes waste."
    );
  if (wire)
    add(
      "wire",
      roundUp((length * wireRows * factor) / wireRoll),
      `${wireRows} strands × length; ${wireRoll}m rolls; includes waste. Mesh selvage wires when mesh selected.`
    );
  add(
    "concrete",
    roundUp(
      (posts + ends * (wire ? 1 : 0) + input.gates * 2) *
        input.concreteBagsPerPost
    ),
    "Bag allowance: fence posts + one stay post per brace + two per gate. Confirm actual holes/yield."
  );
  if (timber)
    add(
      "nails",
      roundUp(
        ((bays * railRows * 4 +
          (style === "timber" ? roundUp(length / 0.15) * railRows * 2 : 0)) *
          factor) /
          input.fastenersPerPack
      ),
      "Four rail fixings per rail, two per paling per rail; check pack count and compatibility."
    );
  if (wire) {
    add(
      "staples",
      roundUp(
        (posts * (wireRows + (mesh ? 8 : 0)) * factor) / input.staplesPerPack
      ),
      "Allowance: eight mesh fixings per post plus one per wire; verify supplier fixing schedule."
    );
    add(
      "tensioner",
      ends * (wireRows + (mesh ? 1 : 0)),
      "One termination set per strand at each end, plus mesh termination per end."
    );
  }
  add(
    "gate",
    input.gates,
    "Complete gate set; gate widths are excluded from fence runs."
  );
  return { length, bays, posts, lines };
}

export type PriceRecord = {
  amount: number;
  checkedAt: string;
  store: string;
  source: "manual" | "bunnings";
  url: string;
};
export type FencePrices = Partial<Record<FencingProductKey, PriceRecord>>;
export function priceFence(lines: FenceLine[], prices: FencePrices) {
  const missing = lines.filter(
    l =>
      !prices[l.key] ||
      !Number.isFinite(prices[l.key]!.amount) ||
      prices[l.key]!.amount < 0
  );
  const subtotal = lines.reduce((sum, l) => {
    const amount = prices[l.key]?.amount;
    return (
      sum +
      (amount !== undefined && Number.isFinite(amount) && amount >= 0
        ? l.quantity * amount
        : 0)
    );
  }, 0);
  return { subtotal, missing, complete: missing.length === 0 };
}
export function fencingCsv(lines: FenceLine[], prices: FencePrices) {
  const cell = (v: unknown) =>
    `"${String(v ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`;
  return [
    [
      "Material",
      "Quantity",
      "Unit",
      "AUD unit price (incl GST)",
      "AUD line total",
      "Price source",
      "Store",
      "Checked",
      "Link",
      "Calculation",
    ],
    ...lines.map(l => {
      const p = prices[l.key];
      const product = fencingProducts[l.key];
      return [
        product.label,
        l.quantity,
        product.unit,
        p?.amount ?? "PRICE NEEDED",
        p ? (p.amount * l.quantity).toFixed(2) : "INCOMPLETE",
        p?.source ?? "unpriced",
        p?.store,
        p?.checkedAt,
        p?.url || product.url,
        l.basis,
      ];
    }),
  ]
    .map(row => row.map(cell).join(","))
    .join("\r\n");
}
