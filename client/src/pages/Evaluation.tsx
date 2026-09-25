import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, CheckCircle2, FileSearch, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

type ProjectSize = "sole_trader" | "small_builder" | "mid_tier" | "enterprise" | "";
type StateCode = "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "NT" | "ACT" | "";

const fieldClass = "h-11 rounded-xl border-gray-200 bg-white focus-visible:ring-pink-500";
const selectClass = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20";

export default function Evaluation() {
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    trade: "Cabinet making / commercial joinery",
    state: "" as StateCode,
    projectSize: "" as ProjectSize,
    feedback: "",
  });

  const signup = trpc.beta.signup.useMutation({
    onSuccess: (result) => {
      if (!result.success) {
        toast.error("We could not submit the application. Please try again.");
        return;
      }
      setSubmitted(true);
    },
    onError: (error) => toast.error(error.message || "Application failed. Please try again."),
  });

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.trade.trim() || !form.feedback.trim()) {
      toast.error("Please complete your name, email, trade and evaluation notes.");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    let referrerHost: string | undefined;
    try {
      referrerHost = document.referrer ? new URL(document.referrer).host : undefined;
    } catch {
      referrerHost = undefined;
    }
    signup.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
      trade: form.trade.trim(),
      state: form.state || undefined,
      projectSize: form.projectSize || undefined,
      feedback: form.feedback.trim(),
      intent: "Paid Pilot Setup",
      source: "live_plan_evaluation",
      utmCampaign: params.get("utm_campaign") || undefined,
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmContent: params.get("utm_content") || undefined,
      utmTerm: params.get("utm_term") || undefined,
      landingPath: window.location.pathname,
      referrerHost,
      sourceUrl: window.location.href,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <SEO
        title="Founding Workflow Setup | KindAI"
        description="Apply for KindAI's A$2,500 ex-GST founder-led setup for one cabinet or joinery estimating workflow, including the first six months of Sole Tradie."
        canonical="/evaluation"
        keywords="AI estimating software evaluation Australia, construction takeoff demo, tradie estimating software demo"
      />

      <div className="h-1 bg-gradient-to-r from-pink-500 via-orange-500 to-blue-600" />
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5" aria-label="Back to KindAI home">
            <img src={LOGO_URL} alt="KindAI" className="h-9 w-9 object-contain" />
            <div className="text-left">
              <div className="text-lg font-black leading-none kindai-gradient-text">kindai</div>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400">Estimating Suite</div>
            </div>
          </button>
          <Button onClick={() => navigate("/demo")} variant="outline" className="rounded-full border-gray-200 font-bold">
            Explore Sample
          </Button>
        </div>
      </nav>

      <main className="px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <section className="lg:sticky lg:top-10">
            <button onClick={() => navigate("/")} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" /> Back to KindAI
            </button>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-xs font-black text-pink-700">
              <FileSearch className="h-4 w-4" /> Founding Workflow Setup
            </div>
            <h1 className="max-w-xl text-4xl font-black leading-[1.05] sm:text-5xl">
              Configure one real <span className="kindai-gradient-text">cabinet or joinery workflow.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
              Apply first. If the workflow is a fit, the founder-led setup is A$2,500 plus GST and includes one configured workflow, two reviewed real jobs and the first six months of Sole Tradie.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: Lock, title: "No public plan upload", text: "Do not send private files yet. We agree on a secure handover process first." },
                { icon: ShieldCheck, title: "Estimator review stays mandatory", text: "You review quantities, rates, exclusions and compliance before any quote is issued." },
                { icon: CheckCircle2, title: "Fixed paid scope", text: "A$2,500 plus GST. One user, one workflow, two reviewed jobs and six months of Sole Tradie. No open-ended free AI." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-950 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900">{title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Card className="overflow-hidden rounded-3xl border-gray-200 bg-white shadow-xl shadow-gray-200/60">
            <CardContent className="p-6 sm:p-8">
              {submitted ? (
                <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="mt-6 text-2xl font-black">Application received.</h2>
                  <p className="mt-3 max-w-md text-gray-600">
                    Matt will review the details and contact you to confirm fit. No payment has been taken. If approved, you will receive the exact scope and a secure A$2,750 including-GST payment invitation before setup begins.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Button onClick={() => navigate("/demo")} className="kindai-btn-primary rounded-full px-6 font-black">
                      Explore the Sample
                    </Button>
                    <Button onClick={() => navigate("/pricing")} variant="outline" className="rounded-full px-6 font-black">
                      View Plans
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-pink-600">Application</p>
                    <h2 className="mt-2 text-2xl font-black">Apply for one of five founding setups.</h2>
                    <p className="mt-2 text-sm text-gray-500">Application only—no payment or plan upload on this form. Approved applicants receive the fixed scope before checkout.</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} className={fieldClass} autoComplete="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Work email *</Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={fieldClass} autoComplete="email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={fieldClass} autoComplete="tel" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" value={form.company} onChange={(e) => update("company", e.target.value)} className={fieldClass} autoComplete="organization" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trade">Primary trade *</Label>
                      <Input id="trade" value={form.trade} readOnly className={`${fieldClass} bg-gray-50 text-gray-600`} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State or territory</Label>
                      <select id="state" value={form.state} onChange={(e) => update("state", e.target.value)} className={selectClass}>
                        <option value="">Select</option>
                        {(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"] as const).map((state) => <option key={state} value={state}>{state}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectSize">Business size</Label>
                    <select id="projectSize" value={form.projectSize} onChange={(e) => update("projectSize", e.target.value)} className={selectClass}>
                      <option value="">Select</option>
                      <option value="sole_trader">Owner-operator or 1–2 people</option>
                      <option value="small_builder">Small team, 3–15 people</option>
                      <option value="mid_tier">Established team, 15–100 people</option>
                      <option value="enterprise">Large or multi-site operation</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">What job and workflow should we evaluate? *</Label>
                    <Textarea
                      id="feedback"
                      value={form.feedback}
                      onChange={(e) => update("feedback", e.target.value)}
                      className="min-h-36 rounded-xl border-gray-200 focus-visible:ring-pink-500"
                      maxLength={1000}
                      placeholder="Describe the job type, plan package, current estimating process and the result you need. Do not include a file link or private client data."
                      required
                    />
                    <div className="text-right text-xs text-gray-400">{form.feedback.length}/1000</div>
                  </div>

                  <Button type="submit" disabled={signup.isPending} className="kindai-btn-primary h-auto w-full rounded-full py-4 text-base font-black">
                    {signup.isPending ? "Sending application..." : "Apply for Founding Workflow Setup"}
                    {!signup.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                  <p className="text-center text-xs leading-relaxed text-gray-400">
                    By submitting, you agree that KindAI may contact you about this paid setup. This form does not reserve a place, take payment or create a free software account.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
