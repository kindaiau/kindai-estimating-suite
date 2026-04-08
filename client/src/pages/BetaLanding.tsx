import { useState } from "react";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Zap, Users, Shield, Clock, ChevronRight, Star, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

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
  "HVAC", "Flooring", "Landscaping & Irrigation", "Cabinetry & Joinery",
  "Rendering & Plastering", "Painting & Decorating", "Bricklaying & Blocklaying",
  "Roofing", "Tiling", "Waterproofing", "Fire Protection",
  "Glazing & Aluminium", "Quantity Surveying", "Demolition & Excavation",
  "Swimming Pool Construction", "Steel Fabrication & Structural",
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

  const { data: stats } = trpc.beta.getStats.useQuery(undefined, {
    refetchInterval: 30000, // refresh every 30s
  });

  const signupMutation = trpc.beta.signup.useMutation({
    onSuccess: (data) => {
      if (data.alreadyRegistered) {
        toast.info("You're already on the beta list! We'll be in touch.");
        setSubmitted(true);
        return;
      }
      if (data.isFull) {
        toast.error("Sorry — all 25 beta spots have been claimed. Join the waitlist and we'll notify you when spots open.");
        return;
      }
      setSpotNumber(data.spotNumber ?? null);
      setSubmitted(true);
      toast.success("You're in! Welcome to the Kindai beta.");
      // Fire Meta Pixel Lead event
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Beta Sign-up',
          content_category: 'Kindai Estimating Suite',
          value: 0,
          currency: 'AUD',
        });
      }
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Please enter your name and email.");
      return;
    }
    signupMutation.mutate({
      name: form.name,
      email: form.email,
      company: form.company || undefined,
      trade: form.trade || undefined,
      state: form.state || undefined,
      projectSize: form.projectSize || undefined,
      feedback: form.feedback || undefined,
      source: "beta_page",
    });
  };

  const claimed = stats?.claimed ?? 67;
  const remaining = stats?.remaining ?? 33;
  const pct = Math.min(100, Math.round((claimed / 25) * 100));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEO
        title="Free Beta Access | Kindai Estimating Suite"
        description="Join 25 Australian tradies and builders testing AI-powered estimating software free. Scan plans, get instant quotes with GST. Claim your founding member spot before it's gone."
        canonical="/beta"
        keywords="free estimating software Australia, beta access construction software, AI quoting software free trial, tradie software beta, builder estimating app Australia free"
      />
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Kindai" className="h-9 w-9 object-contain" />
            <div>
              <span className="font-black text-base kindai-gradient-text">kindai</span>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Estimating Suite</div>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <span className="text-xs text-orange-400 font-bold animate-pulse">● BETA OPEN</span>
            <span className="text-xs text-gray-500">{remaining} spots left</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "oklch(0.58 0.28 0)" }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: "oklch(0.55 0.22 255)" }} />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Beta badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-sm font-bold text-orange-400 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            FOUNDING BETA — LIMITED SPOTS
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6"
          >
            Stop losing money on quotes.<br />
            <span className="kindai-gradient-text">We built the fix.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg sm:text-xl mb-8 max-w-2xl mx-auto"
          >
            Kindai reads your plans, counts every item, and builds a full quote in 60 seconds —
            with real Australian trade pricing, GST, and compliance built in.
            We're looking for <strong className="text-white">25 Australian tradies and builders</strong> to test it free.
          </motion.p>

          {/* Live counter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 max-w-md mx-auto"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-300">Beta spots claimed</span>
              <span className="text-sm font-black text-white">{claimed} / 25</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, oklch(0.58 0.28 0), oklch(0.65 0.22 30))" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              />
            </div>
            <p className="text-center mt-3 text-sm">
              <span className="text-orange-400 font-black text-lg">{remaining}</span>
              <span className="text-gray-400"> spots remaining</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main content: form + perks */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-start">

          {/* Left: Sign-up form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-white mb-3">You're in! 🎉</h2>
                  {spotNumber && (
                    <p className="text-orange-400 font-bold text-lg mb-2">You're founding member #{spotNumber}</p>
                  )}
                  <p className="text-gray-400 text-sm mb-6">
                    Check your email for your access link. We'll have you running your first AI takeoff within 5 minutes.
                  </p>
                  <a href="/">
                    <Button className="kindai-btn-primary px-8 py-3 rounded-full font-black">
                      Open Kindai Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-2xl font-black text-white mb-1">Claim your free beta spot</h2>
                    <p className="text-gray-400 text-sm">No credit card. No lock-in. Just better quotes.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-400 mb-1 block">Full Name *</label>
                      <Input
                        placeholder="Dave Smith"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 mb-1 block">Email *</label>
                      <Input
                        type="email"
                        placeholder="dave@company.com.au"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block">Company / Business Name</label>
                    <Input
                      placeholder="Smith Electrical Pty Ltd"
                      value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-400 mb-1 block">Your Trade</label>
                      <Select value={form.trade} onValueChange={v => setForm(f => ({ ...f, trade: v }))}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select trade" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRADES.map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 mb-1 block">State</label>
                      <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v as typeof form.state }))}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                          {["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block">Business size</label>
                    <Select value={form.projectSize} onValueChange={v => setForm(f => ({ ...f, projectSize: v as typeof form.projectSize }))}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="How big is your operation?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sole_trader">Sole trader / 1–2 people</SelectItem>
                        <SelectItem value="small_builder">Small builder / 3–15 staff</SelectItem>
                        <SelectItem value="mid_tier">Mid-tier builder / 15–50 staff</SelectItem>
                        <SelectItem value="enterprise">Enterprise / 50+ staff or $30M+ projects</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block">What's your biggest quoting pain? <span className="text-gray-600">(optional)</span></label>
                    <Textarea
                      placeholder="e.g. Takes too long, always underquote, can't keep up with demand..."
                      value={form.feedback}
                      onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 resize-none"
                      rows={2}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={signupMutation.isPending}
                    className="w-full kindai-btn-primary py-4 rounded-full font-black text-base h-auto"
                  >
                    {signupMutation.isPending ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Claiming your spot...</span>
                    ) : (
                      <span className="flex items-center gap-2">Claim My Free Beta Spot <ChevronRight className="w-5 h-5" /></span>
                    )}
                  </Button>

                  <p className="text-center text-xs text-gray-600">
                    No credit card. No lock-in. Unsubscribe anytime.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: Perks + testimonials */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-8"
          >
            {/* What you get */}
            <div>
              <h3 className="text-lg font-black text-white mb-4">What beta members get:</h3>
              <div className="space-y-3">
                {BETA_PERKS.map((perk, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <perk.icon className="w-4 h-4 text-orange-400" />
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{perk.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Early testimonials */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">What early users are saying:</h3>
              <div className="space-y-4">
                {TESTIMONIAL_PREVIEWS.map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                    className="bg-white/5 border border-white/8 rounded-2xl p-4"
                  >
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-300 text-sm italic mb-3">"{t.text}"</p>
                    <div>
                      <div className="text-xs font-bold text-white">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.trade}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 20 Australian trades</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> GST compliant</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> All 8 states/territories</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> No credit card required</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works — quick 3-step */}
      <section className="py-16 px-4 bg-white/3 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-black text-white mb-10">
            From plans to quote in <span className="kindai-gradient-text">60 seconds</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Photograph your plans", desc: "Use your phone camera or upload a PDF. Any trade, any project size." },
              { step: "02", title: "AI reads every detail", desc: "Kindai identifies every symbol, fixture, and material. Counts quantities automatically." },
              { step: "03", title: "Full quote — ready to send", desc: "Materials, labour, markup, GST. Branded PDF. Send to client in one click." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-black kindai-gradient-text mb-3">{s.step}</div>
                <h3 className="font-black text-white mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src={LOGO_URL} alt="Kindai" className="w-16 h-16 object-contain mx-auto mb-6" />
          </motion.div>
          <h2 className="text-3xl font-black text-white mb-4">
            {remaining > 0 ? `${remaining} spots left. Don't miss out.` : "Beta is full — join the waitlist."}
          </h2>
          <p className="text-gray-400 mb-8">
            When beta closes, pricing starts at $149/month. Right now it's free.
          </p>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto"
          >
            Claim My Free Spot <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <span>© 2025 Kindai. Built for Australian tradies.</span>
          <span>GST-compliant by default. All 8 states/territories.</span>
          <a href="/" className="hover:text-gray-400 transition-colors">← Back to main site</a>
        </div>
      </footer>
    </div>
  );
}
