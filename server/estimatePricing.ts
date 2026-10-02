import Decimal from 'decimal.js';
import { z } from 'zod';

// AUD rates exclude GST. Round each waste-adjusted line HALF_UP to cents,
// sum lines, apply the estimate's cost markup once, then round GST once.
const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
const fixed = (scale: number, max: number, positive = false) => z.number().finite()
  .min(positive ? 10 ** -scale : 0).max(max)
  .refine(v => new D(v).decimalPlaces() <= scale, `Use at most ${scale} decimal places`);
export const itemFields = z.object({
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  unit: z.string().trim().min(1).max(30),
  quantity: fixed(3, 9999999.999, true),
  unitRate: fixed(2, 99999999.99),
  wasteFactor: fixed(2, 100).default(0),
  notes: z.string().max(10000).optional(),
});
export const markupSchema = fixed(2, 999.99);
export type PricedInput = { quantity: string | number; unitRate: string | number; wasteFactor?: string | number | null };
function scaled(value: string | number, places: number): bigint {
  const n = new D(value);
  if (!n.isFinite() || n.isNegative() || n.decimalPlaces() > places) throw new Error('Invalid stored decimal precision or negative value');
  return BigInt(n.mul(new D(10).pow(places)).toFixed(0));
}
function halfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / BigInt(2)) / denominator;
}
function aud(cents: bigint): string {
  if (cents > BigInt('999999999999')) throw new Error('Amount exceeds supported range');
  return `${cents / BigInt(100)}.${String(cents % BigInt(100)).padStart(2, '0')}`;
}
function lineCents(item: PricedInput): bigint {
  // Thousandths of a unit × integer cents × basis points. No binary floating
  // arithmetic enters the authoritative quote calculations.
  return halfUp(scaled(item.quantity, 3) * scaled(item.unitRate, 2) * (BigInt(10000) + scaled(item.wasteFactor ?? 0, 2)), BigInt(10000000));
}
export function priceLine(item: PricedInput): string { return aud(lineCents(item)); }
export function priceEstimate(items: PricedInput[], markup: string | number | null) {
  const base = items.reduce((sum, item) => sum + lineCents(item), BigInt(0));
  const subtotal = halfUp(base * (BigInt(10000) + scaled(markup ?? 0, 2)), BigInt(10000));
  const gstAmount = halfUp(subtotal, BigInt(10));
  return { subtotal: aud(subtotal), gstAmount: aud(gstAmount), total: aud(subtotal + gstAmount) };
}
