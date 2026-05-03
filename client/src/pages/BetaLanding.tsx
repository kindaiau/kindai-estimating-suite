import { useEffect, useRef, useState } from "react";
import {
  generateMetaEventId,
  getMetaBrowserContext,
  pixelLead,
  pixelViewBetaPage,
} from "@/lib/metaPixel";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Zap, Users, Shield, Clock, ChevronRight, Star, ArrowRight } from "lucide-react";
import PilotSpotCounter from "@/components/PilotSpotCounter";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const BETA_END_DATE = new Date("2026-05-15T23:59:59+09:30"); // May 15, 2026 ACST

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
  { icon: Zap, text: "Full platform access — free during beta (normally $149–$499/mo)" },
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
    name: "", email: "", company: "", trade: "", state: "" as "" | "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "NT" | "ACT",
    projectSize: "" as "" | "sole_trader" | "small_builder" | "mid_tier" | "enterprise",
    feedback: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [spotNumber, setSpotNumber] = useState<number | null>(null);
  const leadEventIdRef = useRef<string | null>(null);

  // Fire ViewBetaPage pixel event on mount
  useEffect(() => { pixelViewBetaPage(); }, []);

  const { data: stats } = trpc.beta.getStats.useQuery(undefined, {
    staleTime: 60_000, // cache for 60s to prevent excessive polling
    refetchInterval: 60_000, // refresh every 60s (was 30s)
  });

  const signupMutation = trpc.beta.signup.useMutation({
    onSuccess: (data) => {
      if (data.alreadyRegistered) {
        toast.info("You're already on the beta list! We'll be in touch.");
        setSubmitted(true);
        leadEventIdRef.current = null;
        return;
      }
      if (data.isFull) {
        toast.error("Sorry — all 25 beta spots have been claimed. Join the waitlist and we'll notify you when spots open.");
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
      leadEventIdRef.current = null;
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
      leadEventIdRef.current = null;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Please enter your name and email.");
      return;
    }

    const leadEventId = generateMetaEventId("beta_lead");
    const metaContext = getMetaBrowserContext();
    leadEventIdRef.current = leadEventId;

    signupMutation.mutate({
      name: form.name,
      email: form.email,
      company: form.company || undefined,
      trade: form.trade || undefined,
      state: form.state || undefined,
      projectSize: form.projectSize || undefined,
      feedback: form.feedback || undefined,
      source: "beta_page",
      sourceUrl: metaContext.sourceUrl,
      leadEventId,
      fbp: metaContext.fbp,
      fbc: metaContext.fbc,
    });
  };

  const claimed = stats?.claimed ?? 0;
  const remaining = stats?.remaining ?? 25;
  const pct = Math.min(100, Math.round((claimed / 25) * 100));
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
              Quote jobs in <span className="text-amber-400">minutes</span>, not days.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-300 sm:text-xl">
              Kindai turns plans, scope and labour into fast, accurate construction estimates — built for Australian trades, builders and quantity surveyors.
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
              <a href="#beta-form">
                <Button size="lg" className="h-12 rounded-2xl bg-amber-400 px-8 text-base font-semibold text-gray-950 hover:bg-amber-300">
                  Claim my spot <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <p className="text-sm text-gray-400">Only {remaining} founding beta spots remaining</p>
            </div>
          </motion.div>

          <div className="mt-12 w-full max-w-3xl">
            <div className="mb-3 flex items-center justify-between text-sm text-gray-400">
              <span>{claimed}/25 spots claimed</span>
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Founding Member Beta</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Get in early and lock in the unfair advantage.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-gray-300">
              We are accepting a small group of Australian trades, builders and estimating teams into the first release of Kindai. If you quote jobs, tender projects or waste too much time on takeoffs, this is for you.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Upload plans and generate takeoffs faster",
                "Build estimates with labour, materials and margin in one workflow",
                "Help shape the product with direct founder access",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-gray-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-amber-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-6 shadow-2xl shadow-amber-950/20 backdrop-blur-xl sm:p-8">
            {!submitted && <PilotSpotCounter variant="form" fallbackClaimed={12} fallbackTotal={25} />}
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
                    Welcome to the Kindai beta. We’ll reach out with onboarding details and next steps shortly.
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
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Matthew Symons"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-200">Email *</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="you@company.com"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-200">Company</label>
                    <Input
                      value={form.company}
                      onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                      placeholder="Kindai"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-200">Trade</label>
                    <Select value={form.trade} onValueChange={(value) => setForm((prev) => ({ ...prev, trade: value }))}>
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-200">State</label>
                      <Select value={form.state} onValueChange={(value: typeof form.state) => setForm((prev) => ({ ...prev, state: value }))}>
                        <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"] as const).map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-200">Business size</label>
                      <Select value={form.projectSize} onValueChange={(value: typeof form.projectSize) => setForm((prev) => ({ ...prev, projectSize: value }))}>
                        <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sole_trader">Sole trader</SelectItem>
                          <SelectItem value="small_builder">Small builder</SelectItem>
                          <SelectItem value="mid_tier">Mid-tier / growing team</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-200">Biggest quoting pain right now?</label>
                    <Textarea
                      value={form.feedback}
                      onChange={(e) => setForm((prev) => ({ ...prev, feedback: e.target.value }))}
                      placeholder="Slow takeoffs, missed items, pricing inconsistency, tender pressure…"
                      className="min-h-[120px] rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={signupMutation.isPending}
                    className="h-12 w-full rounded-2xl bg-amber-400 text-base font-semibold text-gray-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {signupMutation.isPending ? "Claiming your spot..." : "Claim my founding member spot"}
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
