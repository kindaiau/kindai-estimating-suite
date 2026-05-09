import { useEffect, useRef, useState } from "react";
import {
  generateMetaEventId,
  getMetaBrowserContext,
  pixelLead,
  pixelViewBetaPage,
} from "@/lib/metaPixel";
import { getAnalyticsContext, trackEvent } from "@/lib/analytics";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Zap, Users, Shield, Clock, ChevronRight, Star, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const BETA_END_DATE = new Date("2026-05-15T23:59:59+09:30"); // May 15, 2026 ACST
const PILOT_SPOTS_CLAIMED = 12;
const PILOT_SPOTS_TOTAL = 25;
const PILOT_SPOTS_REMAINING = 13;

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, expired: diff <= 0 };
}

const BETA_PERKS = [
  { icon: Zap, text: "Full platform access — free during beta (normally $149–$450/mo)" },
  { icon: Shield, text: "Founding member pricing locked in when we go paid" },
  { icon: Users, text: "Your feedback directly shapes the product" },
  { icon: Star, text: "Your business listed as a Kindai Founding Partner" },
];

const TESTIMONIAL_PREVIEWS = [
  { name: "Dave K.", trade: "Electrician, QLD", text: "Finally quoted a 3-house job in under 10 minutes. Used to take me half a day." },
  { name: "Sarah M.", trade: "Plumbing Business Owner, VIC", text: "The AI read our hydraulic plans and got the quantities right first time. Blown away." },
  { name: "Tom B.", trade: "Builder, NSW", text: "We manage $8M in projects. This is the first tool that actually scales with us." },
];

const TRADES = [
  "Electrical", "Plumbing & Drainage", "Carpentry & Joinery", "Concreting",
  "HVAC", "Flooring", "Landscaping & Irrigation", "Cabinet Making & Joinery",
  "Rendering & Plastering", "Painting & Decorating", "Bricklaying & Blocklaying",
  "Roofing", "Tiling", "Waterproofing", "Fire Protection",
  "Glazing & Aluminium", "Quantity Surveying", "Demolition & Excavation",
  "Swimming Pool Construction", "Steel Fabrication & Structural",
  "Gas Installation & Gasfitting", "Gas Maintenance & Servicing",
  "General Building / Builder", "Other",
];

export default function BetaLanding() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", trade: "", state: "" as "" | "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "NT" | "ACT",
    projectSize: "" as "" | "sole_trader" | "small_builder" | "mid_tier" | "enterprise",
    feedback: "",
    intent: "Pilot Spot Request" as "Pilot Spot Request" | "Paid Pilot Setup" | "Setup Call Request",
  });
  const [submitted, setSubmitted] = useState(false);
  const [paidSetupSecured, setPaidSetupSecured] = useState(false);
  const [spotNumber, setSpotNumber] = useState<number | null>(null);
  const [formStarted, setFormStarted] = useState(false);
  const leadEventIdRef = useRef<string | null>(null);
  const pilotSetupCheckoutMutation = trpc.billing.createPilotSetupCheckout.useMutation();

  // Fire ViewBetaPage pixel event on mount
  useEffect(() => {
    pixelViewBetaPage();
    trackEvent("beta_viewed", getAnalyticsContext());
    const params = new URLSearchParams(window.location.search);
    const intent = params.get("intent");
    if (params.get("paid_setup") === "success") {
      setSubmitted(true);
      setPaidSetupSecured(true);
      toast.success("Payment received. Matt will follow up to book your setup sprint.");
      trackEvent("checkout_succeeded", {
        ...getAnalyticsContext(),
        product: "founding_pilot_setup",
        sessionId: params.get("session_id") ?? undefined,
      });
    }
    if (params.get("checkout") === "cancelled") {
      toast.info("Checkout was cancelled. Your pilot request is still saved.");
      trackEvent("checkout_cancelled", {
        ...getAnalyticsContext(),
        product: "founding_pilot_setup",
      });
    }
    if (intent === "paid-setup") setForm((current) => ({ ...current, intent: "Paid Pilot Setup" }));
    if (intent === "setup-call") setForm((current) => ({ ...current, intent: "Setup Call Request" }));
  }, []);

  const signupMutation = trpc.beta.signup.useMutation({
    onSuccess: async (data) => {
      if (data.alreadyRegistered) {
        toast.info("You're already on the beta list! We'll be in touch.");
        setSubmitted(true);
        trackEvent("beta_signup_succeeded", {
          trade: form.trade,
          state: form.state,
          projectSize: form.projectSize,
          intent: form.intent,
          alreadyRegistered: true,
        });
        leadEventIdRef.current = null;
        return;
      }
      if (data.isFull) {
        toast.error("Sorry — all 25 beta spots have been claimed. Join the waitlist and we'll notify you when spots open.");
        trackEvent("beta_signup_failed", {
          trade: form.trade,
          state: form.state,
          projectSize: form.projectSize,
          intent: form.intent,
          reason: "beta_full",
        });
        leadEventIdRef.current = null;
        return;
      }
      setSpotNumber(data.spotNumber ?? null);
      setSubmitted(true);
      toast.success("You're in! Welcome to the Kindai beta.");

      const leadEventId = leadEventIdRef.current ?? generateMetaEventId("beta_lead");
      pixelLead(
        { content_name: "Beta Sign-up", content_category: "Kindai Estimating Suite", value: 0 },
        { eventId: leadEventId }
      );
      trackEvent("beta_signup_succeeded", {
        trade: form.trade,
        state: form.state,
        projectSize: form.projectSize,
        hasCompany: Boolean(form.company),
        hasFeedback: Boolean(form.feedback),
        intent: form.intent,
        spotNumber: data.spotNumber ?? 0,
      });
      leadEventIdRef.current = null;

      if (form.intent === "Paid Pilot Setup") {
        toast.loading("Opening secure Stripe checkout...", { id: "pilot-setup-checkout" });
        try {
          trackEvent("checkout_started", {
            ...getAnalyticsContext(),
            product: "founding_pilot_setup",
            intent: form.intent,
            trade: form.trade,
            state: form.state,
          });
          const checkout = await pilotSetupCheckoutMutation.mutateAsync({
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
            tradeType: form.trade || undefined,
            origin: window.location.origin,
          });
          toast.dismiss("pilot-setup-checkout");
          window.location.assign(checkout.url);
        } catch (err) {
          toast.error("Your lead is saved, but Stripe checkout did not open. Matt will follow up manually.", {
            id: "pilot-setup-checkout",
          });
          trackEvent("beta_signup_failed", {
            intent: form.intent,
            reason: err instanceof Error ? err.message : "unknown",
          });
        }
      }
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
      trackEvent("beta_signup_failed", {
        trade: form.trade,
        state: form.state,
        projectSize: form.projectSize,
        intent: form.intent,
        reason: err.message ? "server_error" : "unknown",
      });
      leadEventIdRef.current = null;
    },
  });

  const updateForm = (patch: Partial<typeof form>) => {
    if (!formStarted) {
      setFormStarted(true);
      trackEvent("beta_form_started", {
        ...getAnalyticsContext(),
      });
    }
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Please enter your name and email.");
      trackEvent("beta_signup_failed", {
        trade: form.trade,
        state: form.state,
        projectSize: form.projectSize,
        intent: form.intent,
        reason: "validation_missing_name_or_email",
      });
      return;
    }

    const leadEventId = generateMetaEventId("beta_lead");
    const metaContext = getMetaBrowserContext();
    const analyticsContext = getAnalyticsContext();
    leadEventIdRef.current = leadEventId;
    trackEvent("beta_signup_submitted", {
      ...analyticsContext,
      trade: form.trade,
      state: form.state,
      projectSize: form.projectSize,
      hasCompany: Boolean(form.company),
      hasFeedback: Boolean(form.feedback),
      intent: form.intent,
    });

    signupMutation.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      company: form.company || undefined,
      trade: form.trade || undefined,
      intent: form.intent,
      state: form.state || undefined,
      projectSize: form.projectSize || undefined,
      feedback: form.feedback || undefined,
      source: "beta_page",
      utmSource: analyticsContext.utmSource || undefined,
      utmMedium: analyticsContext.utmMedium || undefined,
      utmCampaign: analyticsContext.utmCampaign || undefined,
      utmContent: analyticsContext.utmContent || undefined,
      utmTerm: analyticsContext.utmTerm || undefined,
      landingPath: analyticsContext.path || undefined,
      referrerHost: analyticsContext.referrer || undefined,
      sourceUrl: metaContext.sourceUrl,
      leadEventId,
      fbp: metaContext.fbp,
      fbc: metaContext.fbc,
    });
  };

  const claimed = PILOT_SPOTS_CLAIMED;
  const remaining = PILOT_SPOTS_REMAINING;
  const pct = Math.min(100, Math.round((claimed / PILOT_SPOTS_TOTAL) * 100));
  const countdown = useCountdown(BETA_END_DATE);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEO
        title="Join Kindai Beta | AI Construction Estimating Software Australia"
        description="Get early access to Kindai — AI estimating software built for Australian trades and builders. Limited founding beta spots available."
        canonical="/beta"
        keywords="Kindai beta, AI estimating software beta, construction estimating software Australia, trade quoting app beta"
      />

      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.15),transparent_30%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pb-20 pt-8 lg:px-8">
          <img src={LOGO_URL} alt="Kindai" className="mb-6 h-16 w-auto md:h-20" />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300">
              <Clock className="h-4 w-4" />
              Beta closes in {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl">
              Quote faster without missing costs.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-300 sm:text-xl">
              Kindai helps Australian tradies turn job notes, photos, plans, and supplier pricing into cleaner quote drafts — faster, with GST-aware logic and margin protection.
            </p>

            <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-2">
              {BETA_PERKS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mt-0.5 rounded-full bg-amber-400/15 p-2 text-amber-300"><Icon className="h-5 w-5" /></div>
                  <p className="text-sm text-gray-200">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="#beta-form" onClick={() => updateForm({ intent: "Pilot Spot Request" })}>
                <Button size="lg" className="h-12 rounded-2xl bg-amber-400 px-8 text-base font-semibold text-gray-950 hover:bg-amber-300">
                  Claim Your Pilot Spot <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="#beta-form" onClick={() => updateForm({ intent: "Setup Call Request" })}>
                <Button size="lg" variant="outline" className="h-12 rounded-2xl border-white/20 px-8 text-base font-semibold text-white hover:bg-white/10">
                  Book a 15-Minute Setup Call
                </Button>
              </a>
            </div>
            <p className="mt-5 text-sm font-semibold text-amber-200">
              {claimed} of {PILOT_SPOTS_TOTAL} pilot spots claimed — {remaining} spots remaining.
            </p>
          </motion.div>

          <div className="mt-12 w-full max-w-3xl">
            <div className="mb-3 flex items-center justify-between text-sm text-gray-400">
              <span>{claimed}/{PILOT_SPOTS_TOTAL} spots claimed</span>
              <span>{pct}% full</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-amber-400/20 bg-amber-400/10 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Founding Pilot Setup Sprint</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              We help set up your first quoting workflow with you.
            </h2>
            <p className="mt-4 text-base leading-8 text-gray-300">
              Instead of leaving you to figure out new software alone, we help set up one of your common job types with you.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "1 setup call",
                "1 quoting workflow for a common job type",
                "GST-aware estimate structure",
                "supplier pricing structure",
                "margin and cost checks",
                "founder-led onboarding",
                "7 days of support",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-gray-100">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-amber-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gray-950/80 p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-white">Want to skip the waitlist?</h3>
            <p className="mt-4 text-gray-300">
              Secure a founding pilot setup and Matt will personally help set up your first quoting workflow. Your first 6 months of Kindai are included.
            </p>
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Founding offer</p>
              <p className="mt-1 text-3xl font-extrabold text-white">A$1,000</p>
              <p className="mt-1 text-sm text-gray-300">Setup + first 6 months included</p>
            </div>
            <a href="#beta-form" onClick={() => updateForm({ intent: "Paid Pilot Setup" })}>
              <Button className="mt-6 h-12 w-full rounded-2xl bg-amber-400 text-base font-semibold text-gray-950 hover:bg-amber-300">
                Secure Pilot Setup
              </Button>
            </a>
            <p className="mt-3 text-center text-xs text-gray-500">Secure Stripe checkout opens after your first-step details are saved.</p>
            <p className="mt-4 text-center text-xs text-gray-500">Limited founding pilot spots available.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIAL_PREVIEWS.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-3 flex items-center gap-1 text-amber-300">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-sm leading-7 text-gray-200">“{testimonial.text}”</p>
              <div className="mt-4 text-sm text-gray-400">{testimonial.name} — {testimonial.trade}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="beta-form" className="border-t border-white/10 bg-white/[0.03] py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Founding Pilot Setup Sprint</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Claim your spot before the final 13 are gone.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-gray-300">
              Leave your details and Matt will follow up personally. We collect the job details after the first conversion, not before it.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Fast first step: name, email, optional phone and trade",
                "Your intent is recorded so the follow-up matches what you asked for",
                "Pilot spots are reviewed personally by Matt",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-gray-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-amber-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6 shadow-2xl shadow-amber-950/20 backdrop-blur-xl sm:p-8">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-white">You’re on the list.</h3>
                  <p className="mt-3 text-gray-300">
                    {paidSetupSecured
                      ? "Your paid pilot setup is secured. Matt will follow up to book your setup sprint and confirm the first quoting workflow."
                      : "Welcome to the Kindai beta. We’ll reach out with onboarding details and next steps shortly."}
                  </p>
                  {spotNumber ? (
                    <p className="mt-4 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300">
                      You claimed spot #{spotNumber}
                    </p>
                  ) : null}
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-200">Full name *</label>
                    <Input
                      value={form.name}
                      onChange={(e) => updateForm({ name: e.target.value })}
                      placeholder="Matthew Symons"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-200">Email *</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm({ email: e.target.value })}
                      placeholder="you@company.com"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-200">Phone <span className="text-gray-500">(optional)</span></label>
                    <Input
                      value={form.phone}
                      onChange={(e) => updateForm({ phone: e.target.value })}
                      placeholder="0400 000 000"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-200">Trade type <span className="text-gray-500">(optional)</span></label>
                    <Select value={form.trade} onValueChange={(value) => updateForm({ trade: value })}>
                      <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white">
                        <SelectValue placeholder="Select your trade" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRADES.map((trade) => (
                          <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Intent</p>
                    <p className="mt-1 text-sm text-gray-200">{form.intent}</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={signupMutation.isPending || pilotSetupCheckoutMutation.isPending}
                    className="h-12 w-full rounded-2xl bg-amber-400 text-base font-semibold text-gray-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {signupMutation.isPending || pilotSetupCheckoutMutation.isPending
                      ? form.intent === "Paid Pilot Setup" ? "Opening secure checkout..." : "Sending your request..."
                      : form.intent === "Paid Pilot Setup" ? "Secure My Pilot Setup" : "Claim Your Pilot Spot"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="text-center text-xs leading-6 text-gray-500">
                    By joining the beta, you agree to receive onboarding and product update emails. No spam. Just the good stuff.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}
