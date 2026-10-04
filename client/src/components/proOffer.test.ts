import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PRO_OFFER } from '@shared/kindaiOffer';
import { NEW_SALES_PLANS, getPlanCheckoutAmount, PRO_PLAN } from '../../../server/stripe/products';
import { assertProPrice } from '../../../server/stripe/proCheckout';

const mocks = vi.hoisted(() => ({ interval: 'monthly', success: null as any, pixel: vi.fn() }));
vi.mock('react', async importOriginal => ({ ...await importOriginal<typeof import('react')>(), useState: () => [mocks.interval, vi.fn()] }));
vi.mock('@/_core/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 1 } }) }));
vi.mock('@/lib/trpc', () => ({ trpc: { billing: {
  offerTax: { useQuery: () => ({ data: { ready: true } }) },
  createCheckout: { useMutation: (options: any) => { mocks.success = options.onSuccess; return { mutate: vi.fn() }; } },
} } }));
vi.mock('react-helmet-async', () => ({ Helmet: ({ children }: any) => children }));
import { ProOffer } from './ProOffer';
import { SoftwareAppSchema, FAQSchema } from './StructuredData';

beforeEach(() => { vi.stubGlobal('React', React); });
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('approved new-sales Pro offer', () => {
  it.each([['monthly', 149], ['yearly', 1490]] as const)('aligns %s UI, analytics, metadata and checkout', (interval, amount) => {
    mocks.interval = interval;
    const html = renderToStaticMarkup(createElement(ProOffer));
    expect(html).toContain(`A$${amount}<`);
    expect(html).toContain('Prices include GST.');
    expect(html).toContain('Annual saving: A$298 (16.67%)');
    const redirect = vi.fn(); vi.stubGlobal('window', { location: { assign: redirect }, fbq: mocks.pixel });
    // Use submitted variables, even if the radio selection changes while checkout is pending.
    mocks.success({ url: 'https://checkout.example.test' }, { interval: interval === 'monthly' ? 'yearly' : 'monthly' });
    expect(mocks.pixel).toHaveBeenCalledWith('track', 'InitiateCheckout', { content_name: 'Kindai Pro', value: interval === 'monthly' ? 1490 : 149, currency: 'AUD', num_items: 1 });
    expect(redirect).toHaveBeenCalledOnce();
    expect(getPlanCheckoutAmount(PRO_PLAN, interval)).toBe(amount * 100);
    expect(() => assertProPrice({ unit_amount: amount * 100, currency: 'aud', recurring: { interval: interval === 'monthly' ? 'month' : 'year', interval_count: 1 }, tax_behavior: 'inclusive' }, interval, 'inclusive')).not.toThrow();
    const markup = renderToStaticMarkup(createElement(SoftwareAppSchema));
    const schema = JSON.parse(markup.slice(markup.indexOf('>') + 1, markup.lastIndexOf('</script>')));
    const offer = schema.offers.find((o: any) => o.name === `Pro (${interval})`);
    expect(offer.price).toBe(String(amount));
    expect(offer.priceSpecification).toMatchObject({ priceCurrency: 'AUD', valueAddedTaxIncluded: true, billingDuration: interval === 'monthly' ? 'P1M' : 'P1Y' });
  });
  it('keeps legacy plans out of new sales and uses the ten-month annual rule', () => {
    expect(NEW_SALES_PLANS.map(p => p.id)).toEqual(['free', 'pro']);
    expect(PRO_OFFER.yearlyCents).toBe(PRO_OFFER.monthlyCents * 10);
    expect(PRO_OFFER.annualSavingAud).toBe((PRO_OFFER.monthlyCents * 12 - PRO_OFFER.yearlyCents) / 100);
    expect(PRO_OFFER.annualSavingPercent).toBe(Number(((1 - PRO_OFFER.yearlyCents / (PRO_OFFER.monthlyCents * 12)) * 100).toFixed(2)));
    expect(renderToStaticMarkup(createElement(FAQSchema))).toContain('A$149/month or A$1490/year, including GST');
  });
});
