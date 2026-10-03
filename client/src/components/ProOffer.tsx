import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { PRO_OFFER } from '@shared/kindaiOffer';

export function ProOffer() {
  const { user } = useAuth();
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const tax = trpc.billing.offerTax.useQuery();
  const checkout = trpc.billing.createCheckout.useMutation({ onSuccess: data => { window.location.assign(data.url); } });
  return <section id="pricing" className="rounded-3xl border border-emerald-400/30 bg-slate-900 p-7 sm:p-10 text-slate-100">
    <p className="text-emerald-300 font-semibold">One Pro subscription</p>
    <h2 className="text-3xl font-semibold mt-3">Your next quote, all the way through.</h2>
    <fieldset className="flex flex-wrap gap-4 my-6"><legend className="sr-only">Billing frequency</legend>
      {(['monthly', 'yearly'] as const).map(value => <label key={value} className="flex gap-2 items-center min-h-11 cursor-pointer"><input type="radio" name="billing" checked={interval === value} onChange={() => setInterval(value)} />{value === 'monthly' ? 'Monthly' : 'Yearly, billed upfront'}</label>)}
    </fieldset>
    <p className="text-4xl font-semibold">A${(interval === 'monthly' ? PRO_OFFER.monthlyCents : PRO_OFFER.yearlyCents) / 100}<span className="text-base text-slate-300"> / {interval === 'monthly' ? 'month' : 'year'}</span></p>
    <p className="text-slate-300 mt-3">Annual saving: A$298 (16.67%) versus twelve monthly payments.</p>
    <p className="text-sm text-slate-300 mt-2">Prices include GST.</p>
    {!tax.data?.ready && <p className="text-sm text-slate-300 mt-2">Checkout is not yet available.</p>}
    <ul className="grid sm:grid-cols-2 gap-3 my-7 text-slate-200">
      <li>Uncapped plan uploads</li><li>Custom trade rate books</li><li>Variation tracking</li><li>Branded GST-ready PDF quotes</li>
    </ul>
    {user ? <button className="min-h-12 rounded-xl bg-emerald-300 text-slate-950 font-semibold px-6 disabled:opacity-50" disabled={!tax.data?.ready || checkout.isPending} onClick={() => checkout.mutate({ planId: 'pro', interval, origin: window.location.origin })}>{checkout.isPending ? 'Opening checkout…' : 'Choose Pro'}</button> : <a href="/login?next=/pricing" className="inline-flex items-center min-h-12 px-6 bg-emerald-300 text-slate-950 font-semibold rounded-xl">Sign in to choose Pro</a>}
    {checkout.error && <p role="alert" className="mt-4 text-amber-200">{checkout.error.message}</p>}
    <p className="text-xs text-slate-400 mt-5">Existing subscribers keep their current subscription. Manage it in Billing.</p>
  </section>;
}
