import { PRO_OFFER } from '../../shared/kindaiOffer';
export function proPrice(interval: 'monthly' | 'yearly') {
  return interval === 'monthly' ? PRO_OFFER.monthlyCents : PRO_OFFER.yearlyCents;
}
export function proTaxConfig() {
  const configuredBehavior = process.env.PRO_GST_BEHAVIOR;
  if (configuredBehavior && configuredBehavior !== PRO_OFFER.taxBehavior) throw new Error('Pro prices must include GST. Checkout stopped because tax configuration conflicts with the advertised offer.');
  const automatic = process.env.PRO_STRIPE_AUTOMATIC_TAX;
  if (!['true', 'false'].includes(automatic ?? '')) {
    throw new Error('Pro checkout is awaiting confirmed Stripe tax settings.');
  }
  return { behavior: PRO_OFFER.taxBehavior, automatic: automatic === 'true' };
}
export function assertProPrice(price: { unit_amount: number | null; currency: string; recurring: { interval: string; interval_count: number } | null; tax_behavior?: string | null }, interval: 'monthly' | 'yearly', taxBehavior: string) {
  if (taxBehavior !== PRO_OFFER.taxBehavior || price.unit_amount !== proPrice(interval) || price.currency !== 'aud' || price.recurring?.interval !== (interval === 'monthly' ? 'month' : 'year') || price.recurring?.interval_count !== 1 || price.tax_behavior !== taxBehavior) throw new Error('Configured Stripe price does not match the Pro offer. Checkout stopped.');
}
