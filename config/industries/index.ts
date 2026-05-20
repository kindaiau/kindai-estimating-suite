import { cabinetMakersIndustry } from "./cabinet-makers";
import { electriciansIndustry } from "./electricians";
import type { IndustryConfig, IndustryKey } from "./types";

export const industries = {
  "cabinet-makers": cabinetMakersIndustry,
  electricians: electriciansIndustry,
} satisfies Record<IndustryKey, IndustryConfig>;

export const industryList = Object.values(industries);

export function getIndustryConfig(key?: string | null): IndustryConfig {
  if (key && key in industries) {
    return industries[key as IndustryKey];
  }

  return cabinetMakersIndustry;
}

export function getIndustryByTradeId(tradeId?: string | null): IndustryConfig {
  return industryList.find((industry) => industry.tradeId === tradeId) ?? getIndustryConfig();
}

export type { IndustryConfig, IndustryKey } from "./types";
