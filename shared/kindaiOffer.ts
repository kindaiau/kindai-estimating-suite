export const PRO_OFFER = {
  id: 'pro', name: 'Pro', currency: 'aud', monthlyCents: 14900, yearlyCents: 149000,
  annualSavingAud: 298, annualSavingPercent: 16.67,
} as const;
export function illustrativeTimeValue(hoursPerWeek: number, savingPercent: number) {
  return Math.max(0, hoursPerWeek) * Math.min(100, Math.max(0, savingPercent)) / 100 * 95 * (52 / 12);
}
