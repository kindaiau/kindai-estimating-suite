import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { getIndustryConfig, type IndustryKey } from "@config/industries";
import { ArrowRight, BarChart3, CheckCircle2, ClipboardList, FileText, Send, Workflow } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

export default function IndustryLandingPage({ industryKey }: { industryKey: IndustryKey }) {
  const industry = getIndustryConfig(industryKey);
  const [, navigate] = useLocation();
  const captureLead = trpc.saas.captureLandingLead.useMutation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await captureLead.mutateAsync({
      industryKey,
      ...form,
      source: industry.key,
    });
    setForm({ name: "", email: "", phone: "", company: "", message: "" });
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <SEO
        title={industry.landing.seoTitle}
        description={industry.landing.seoDescription}
        canonical={industry.landingPath}
        keywords={`${industry.shortName} estimating software, AI quoting software, trade CRM, Kindai Estimator`}
      />

      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Kindai" className="h-9 w-9 object-contain" />
            <div>
              <div className="text-sm font-black kindai-gradient-text">kindai</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Estimator</div>
            </div>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#workflow">Workflow</a>
            <a href="#proof">Proof</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/login")}>Sign in</Button>
            <Button className="kindai-btn-primary" onClick={() => navigate("/onboarding")}>
              Start setup
            </Button>
          </div>
        </div>
      </nav>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">{industry.name}</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              {industry.landing.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{industry.landing.heroCopy}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="kindai-btn-primary min-h-12 px-6 text-base font-black" onClick={() => navigate("/onboarding")}>
                Build my workspace <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="min-h-12 px-6 text-base font-black" onClick={() => navigate("/demo")}>
                See estimator demo
              </Button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["One dashboard", "One CRM", "Trade-specific AI"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-slate-200 bg-slate-950 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">AI workflow</div>
                <div className="mt-1 text-lg font-black text-white">{industry.shortName} quote engine</div>
              </div>
              <div className="rounded-md bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">Review first</div>
            </div>
            <div className="space-y-3">
              {industry.workflows.slice(0, 5).map((step, index) => (
                <div key={step.id} className="grid grid-cols-[40px_1fr] gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-sm font-black text-white">{index + 1}</div>
                  <div>
                    <div className="text-sm font-black text-white">{step.label}</div>
                    <p className="mt-1 text-xs leading-5 text-white/55">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <Card className="rounded-[8px] border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-2xl font-black">What this fixes</h2>
            <div className="mt-5 space-y-3">
              {industry.landing.painPoints.map((item) => (
                <div key={item} className="flex gap-3 rounded-[8px] bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[8px] border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-2xl font-black">What Kindai does</h2>
            <div className="mt-5 space-y-3">
              {industry.landing.benefits.map((item) => (
                <div key={item} className="flex gap-3 rounded-[8px] bg-white p-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-100">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="workflow" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-black">Three AI agents. One operating system.</h2>
              <p className="mt-3 max-w-2xl text-slate-600">The same backend runs acquisition, conversion, and delivery. The industry config changes the prompts, templates, labels, and workflow.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Acquisition Agent", icon: BarChart3, text: "Captures, scores, filters, and qualifies leads before they clog up your day." },
              { title: "Conversion Agent", icon: Send, text: "Drafts quotes, proposals, reminders, and follow-ups so opportunities keep moving." },
              { title: "Delivery Agent", icon: Workflow, text: "Turns won jobs into project steps, tasks, documents, and handover actions." },
            ].map(({ title, icon: Icon, text }) => (
              <div key={title} className="rounded-[8px] border border-slate-200 p-5">
                <Icon className="h-6 w-6 text-pink-500" />
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="proof" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-black">Examples built for {industry.shortName.toLowerCase()}.</h2>
            <div className="mt-5 space-y-3">
              {industry.landing.workflowExamples.map((example) => (
                <div key={example} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  {example}
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={submit} className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black">Request a setup call</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Tell us what you quote. Nothing is sent automatically.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lead-name">Name</Label>
                <Input id="lead-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-email">Email</Label>
                <Input id="lead-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-phone">Phone</Label>
                <Input id="lead-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-company">Business</Label>
                <Input id="lead-company" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lead-message">What do you need help quoting?</Label>
                <Textarea id="lead-message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} rows={4} />
              </div>
            </div>
            <Button type="submit" disabled={captureLead.isPending} className="kindai-btn-primary mt-5 min-h-11 w-full font-black">
              {captureLead.isPending ? "Sending..." : "Request setup"}
            </Button>
            {captureLead.isSuccess ? <p className="mt-3 text-sm font-semibold text-emerald-600">Request received. We will follow up.</p> : null}
          </form>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:px-6 md:grid-cols-2">
          {industry.landing.testimonials.map((testimonial) => (
            <blockquote key={testimonial.name} className="rounded-[8px] border border-slate-200 p-5">
              <p className="text-base leading-7 text-slate-700">"{testimonial.quote}"</p>
              <footer className="mt-4 text-sm font-bold text-slate-950">{testimonial.name} <span className="font-medium text-slate-500">- {testimonial.role}</span></footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-black">FAQ</h2>
        <div className="mt-6 space-y-3">
          {industry.landing.faqs.map((faq) => (
            <div key={faq.question} className="rounded-[8px] border border-slate-200 bg-white p-5">
              <h3 className="font-black">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={cn("bg-slate-950 px-4 py-12 text-white sm:px-6")}>
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-black">Build the quoting system once. Add more trades later.</h2>
            <p className="mt-3 max-w-2xl text-white/60">This is one platform with trade-specific experiences, not separate disconnected apps.</p>
          </div>
          <Button size="lg" className="kindai-btn-primary min-h-12 px-6 font-black" onClick={() => navigate("/onboarding")}>
            Start setup <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </main>
  );
}
