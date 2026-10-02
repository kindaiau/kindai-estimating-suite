import { PRO_OFFER } from '../../shared/kindaiOffer';
export function proPrice(interval: 'monthly' | 'yearly') {
  return interval === 'monthly' ? PRO_OFFER.monthlyCents : PRO_OFFER.yearlyCents;
}
export function proTaxConfig() {
  const behavior = process.env.PRO_GST_BEHAVIOR;
  const automatic = process.env.PRO_STRIPE_AUTOMATIC_TAX;
  if (!['inclusive', 'exclusive'].includes(behavior ?? '') || !['true', 'false'].includes(automatic ?? '')) {
    throw new Error('Pro checkout is awaiting confirmed GST and Stripe tax settings.');
  }
  return { behavior: behavior as 'inclusive' | 'exclusive', automatic: automatic === 'true' };
}
export function assertProPrice(price: { unit_amount: number | null; currency: string; recurring: { interval: string; interval_count: number } | null; tax_behavior?: string | null }, interval: 'monthly' | 'yearly', taxBehavior: string) {
  if (price.unit_amount !== proPrice(interval) || price.currency !== 'aud' || price.recurring?.interval !== (interval === 'monthly' ? 'month' : 'year') || price.recurring?.interval_count !== 1 || price.tax_behavior !== taxBehavior) throw new Error('Configured Stripe price does not match the Pro offer. Checkout stopped.');
}
