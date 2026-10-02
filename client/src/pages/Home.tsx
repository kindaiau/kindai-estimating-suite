import { useState } from 'react';
import { ArrowRight, Check, FileText } from 'lucide-react';
import { plumbingLaunch as copy } from '@config/industries/plumbing-launch';
import { illustrativeTimeValue } from '@shared/kindaiOffer';
import { ProOffer } from '@/components/ProOffer';
import SEO from '@/components/SEO';

export default function Home() {
  const [hours, setHours] = useState(5);
  const [saving, setSaving] = useState(30);
  return <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-300 selection:text-slate-950">
    <SEO title="Kindai | Drawing to reviewed GST quote" description={copy.description} />
    <a href="#main" className="sr-only focus:not-sr-only focus:block p-4 bg-emerald-300 text-slate-950">Skip to content</a>
    <header className="max-w-6xl mx-auto px-5 sm:px-8 flex justify-between items-center h-24 border-b border-slate-800">
      <a href="/" aria-label="Kindai home" className="text-2xl font-bold tracking-tight">kindai<span className="text-emerald-300">.</span></a>
      <nav aria-label="Main navigation" className="flex gap-5 items-center text-sm"><a href="#pricing" className="py-3">Pro</a><a href="/login" className="border border-slate-600 px-5 py-3 rounded-lg">Sign in</a></nav>
    </header>
    <main id="main" className="max-w-6xl mx-auto px-5 sm:px-8">
      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-12 py-16 sm:py-24 items-center">
        <div><p className="text-emerald-300 text-sm font-medium mb-6">{copy.audience}</p>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.08]">{copy.headline}</h1>
          <p className="text-lg text-slate-300 mt-7 leading-relaxed">{copy.description}</p>
          <a href="/ai-takeoff" className="inline-flex gap-3 items-center bg-emerald-300 text-slate-950 rounded-xl px-6 py-4 mt-8 font-semibold">Scan one sheet free <ArrowRight size={18} /></a>
          <p className="text-sm text-slate-400 mt-4">One lifetime sheet scan per verified user. No credit card.</p>
        </div>
        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-7 sm:p-9 shadow-2xl">
          <div className="flex items-center gap-3 text-emerald-300 mb-8"><FileText /><span className="text-sm font-medium">A finish line for your quote</span></div>
          <ol className="space-y-6">{copy.steps.map((step, i) => <li key={step} className="flex gap-4 items-center"><span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-slate-800 text-emerald-300 text-sm">0{i+1}</span><span className="font-medium">{step}</span></li>)}</ol>
          <div className="mt-8 border-t border-slate-700 pt-6 flex gap-3 text-sm text-slate-300"><Check className="text-emerald-300 shrink-0" size={18} />Your review comes before the quote leaves.</div>
        </div>
      </section>
      <section className="py-12 border-y border-slate-800 grid md:grid-cols-2 gap-8"><h2 className="text-3xl font-medium leading-snug">{copy.principle}</h2><div><p className="text-emerald-300 mb-3">{copy.founder}</p><p className="text-slate-300 leading-relaxed">{copy.founderCopy}</p></div></section>
      <section className="py-16 grid md:grid-cols-2 gap-10" aria-labelledby="time-title"><div><p className="text-emerald-300 mb-3">Your assumptions. Your time.</p><h2 id="time-title" className="text-3xl font-semibold">What could less quoting time mean?</h2><p className="text-slate-300 mt-4">Adjust the assumptions to reflect your workflow. This is illustrative time value, not guaranteed cash savings or revenue.</p></div>
        <div className="rounded-2xl border border-slate-700 p-6 space-y-6">
          <label className="block">Quoting hours per week: {hours}<input className="block w-full mt-4 accent-emerald-300" type="range" min="0" max="40" value={hours} onChange={e => setHours(Number(e.target.value))} /></label>
          <label className="block">Assumed time saved: {saving}%<input className="block w-full mt-4 accent-emerald-300" type="range" min="0" max="100" value={saving} onChange={e => setSaving(Number(e.target.value))} /></label>
          <output className="block text-3xl text-emerald-300" aria-live="polite">{illustrativeTimeValue(hours, saving).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })}<span className="block text-sm text-slate-300 mt-2">illustrative time value per month</span></output>
          <p className="text-xs text-slate-400">A$95/hour × assumed hours saved × 52/12 weeks per month. Subscription cost is not deducted.</p>
        </div>
      </section>
      <ProOffer />
      <section className="py-16 max-w-2xl"><h2 className="text-2xl font-semibold mb-6">Before you scan</h2><p className="text-slate-300 leading-relaxed">For a multi-page PDF, choose one drawing sheet for your free scan. AI takeoff is a draft: check quantities, drawing scale, exclusions and rates before exporting. Processing time varies with the drawing.</p></section>
    </main>
    <footer className="border-t border-slate-800 max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-wrap gap-6 text-sm text-slate-400"><span>Kindai · Built for the work</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Support</a></footer>
  </div>;
}
