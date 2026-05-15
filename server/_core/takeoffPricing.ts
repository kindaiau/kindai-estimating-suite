export type TakeoffItemLike = {
  section?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  retailPrice?: number;
  tradePrice?: number;
  category?: string;
  labourMinutes?: number;
  wasteFactor?: number;
};

const DEFAULT_TRADE_DISCOUNT = 0.2;

const TRADE_DISCOUNT_BY_TRADE: Record<string, number> = {
  electrical: 0.24,
  plumbing: 0.2,
  carpentry: 0.18,
  concreting: 0.15,
  hvac: 0.18,
  flooring: 0.16,
  landscaping: 0.14,
  cabinetry: 0.18,
  rendering: 0.14,
  painting: 0.14,
  bricklaying: 0.13,
  roofing: 0.15,
  tiling: 0.15,
  waterproofing: 0.14,
  "fire-protection": 0.18,
  glazing: 0.16,
  "quantity-surveying": 0.1,
  demolition: 0.12,
  "swimming-pool": 0.14,
  "steel-fabrication": 0.14,
  "ev-charging": 0.24,
  gasfitting: 0.2,
  "gas-install": 0.2,
  "gas-maintenance": 0.18,
};

function safeNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizePricePair(
  retailPrice: number,
  tradePrice: number,
  tradeDiscount: number
): { retailPrice: number; tradePrice: number } {
  let retail = Math.max(0, safeNumber(retailPrice));
  let trade = Math.max(0, safeNumber(tradePrice));

  if (retail > 0 && trade > retail) {
    const tmp = trade;
    trade = retail;
    retail = tmp;
  }

  if (retail <= 0 && trade > 0) {
    const divisor = 1 - tradeDiscount;
    retail = divisor > 0 ? trade / divisor : trade;
  }

  if (trade <= 0 && retail > 0) {
    trade = retail * (1 - tradeDiscount);
  }

  if (trade > retail && retail > 0) {
    trade = retail;
  }

  return {
    retailPrice: roundCurrency(Math.max(0, retail)),
    tradePrice: roundCurrency(Math.max(0, trade)),
  };
}

function normalizeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export function normalizeTakeoffItem(
  item: TakeoffItemLike,
  trade?: string
): Required<TakeoffItemLike> {
  const tradeDiscount = TRADE_DISCOUNT_BY_TRADE[trade ?? ""] ?? DEFAULT_TRADE_DISCOUNT;
  const prices = normalizePricePair(
    safeNumber(item.retailPrice),
    safeNumber(item.tradePrice),
    tradeDiscount
  );

  return {
    section: normalizeText(item.section, "General"),
    description: normalizeText(item.description, "AI-generated item"),
    unit: normalizeText(item.unit, "ea"),
    quantity: Math.max(0, safeNumber(item.quantity)),
    retailPrice: prices.retailPrice,
    tradePrice: prices.tradePrice,
    category: normalizeText(item.category, "Materials"),
    labourMinutes: Math.max(0, safeNumber(item.labourMinutes)),
    wasteFactor: Math.min(100, Math.max(0, safeNumber(item.wasteFactor))),
  };
}

export function normalizeTakeoffItems<T extends TakeoffItemLike>(
  items: T[],
  trade?: string
): Array<Required<TakeoffItemLike>> {
  return items.map((item) => normalizeTakeoffItem(item, trade));
}
