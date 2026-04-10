import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { pixelViewContent } from "@/lib/metaPixel";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { CheckCircle2, ArrowRight, Shield, Clock, Users, FileText, ChevronRight } from "lucide-react";

const LOGO_URL = import.meta.env.VITE_APP_LOGO || "/favicon.ico";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Upload the plan",
    desc: "Drop in PDFs, tender drawings, or marked-up site sketches. Any format your team already uses.",
  },
  {
    step: "02",
    title: "Kindai drafts the takeoff",
    desc: "It creates a first-pass scope and pricing structure based on your setup — cabinet quantities, hardware, panels, benchtops, labour allowances.",
  },
  {
    step: "03",
    title: "Your estimator reviews and sends",
    desc: "Nothing is issued blind. Your team checks, edits, approves, and sends the quote. Every time.",
  },
];

const WHY_DIFFERENT = [
  { text: "Faster first-pass estimates — reduce manual counting time" },
  { text: "More consistent pricing across jobs and estimators" },
  { text: "Cleaner handoff between admin, estimator, and sales" },
  { text: "Less scope missed on repeat cabinetry work" },
  { text: "Better review process before quotes go out" },
  { text: "Uses your pricing rules, labour logic, markup, and GST settings" },
];

const PROOF_ITEMS = [
  { item: "Laminex Chalk Matt 16mm MDF board", qty: "48 sheets", price: "$94.50/sheet", total: "$4,536" },
  { item: "Polytec Ravine Natural Oak 18mm", qty: "24 sheets", price: "$118.00/sheet", total: "$2,832" },
  { item: "Blum TANDEM plus BLUMOTION 550mm", qty: "96 runners", price: "$38.40/pair", total: "$3,686" },
  { item: "Blum CLIP top BLUMOTION 110° hinges", qty: "144 hinges", price: "$6.20 ea", total: "$893" },
  { item: "Caesarstone 6131 Bianco Drift 20mm", qty: "18 lineal m", price: "$485/lm", total: "$8,730" },
  { item: "Hettich soft-close drawer inserts", qty: "48 sets", price: "$22.80/set", total: "$1,094" },
  { item: "Workshop fabrication labour (80h)", qty: "80 hrs", price: "$95/hr", total: "$7,600" },
  { item: "Site installation labour (32h)", qty: "32 hrs", price: "$110/hr", total: "$3,520" },
];

export default function CabinetJoinery() {
  const [, navigate] = useLocation();

  useEffect(() => {
    pixelViewContent({ content_name: "Cabinet Joinery Landing", content_category: "Landing" });
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SEO
        title="AI Estimating for Cabinet Makers & Joinery Teams | Kindai"
        description="Kindai helps cabinet and joinery businesses produce faster first-pass takeoffs and review-ready quote drafts. Built for commercial joinery teams, not just residential kitchens."
        canonical="/cabinet-joinery"
        keywords="cabinet making estimating software Australia, joinery estimating AI, commercial joinery quoting software, cabinet takeoff software, AI estimating cabinet makers"
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Kindai" className="h-9 w-9 object-contain" />
            <div>
              <span className="font-black text-base kindai-gradient-text">kindai</span>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest">Estimating Suite</div>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/demo")}
              className="text-sm font-bold border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              See a Cabinet Estimate
            </Button>
            <Button
              onClick={() => window.location.href = 'mailto:matt@kindaiestimator.com?subject=Enterprise%20Pilot%20Enquiry%20%E2%80%93%20Cabinet%20Making'}
              size="sm"
              className="kindai-btn-primary text-xs font-bold px-4"
            >
              Book Enterprise Pilot
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl" style={{ background: "oklch(0.58 0.28 0)" }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-8 blur-3xl" style={{ background: "oklch(0.55 0.22 255)" }} />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 text-sm font-bold text-teal-400 mb-6"
          >
            <span>🪵</span> Cabinet Making & Joinery
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 text-white"
          >
            AI takeoffs and quote drafts<br />
            <span className="kindai-gradient-text">for cabinet makers and joinery teams.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg sm:text-xl mb-8 max-w-2xl"
          >
            Upload a plan, marked-up PDF, or site photo. Kindai creates a first-pass takeoff and draft quote so your estimator can review, adjust, and send faster.
          </motion.p>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 mb-10"
          >
            {[
              "Built for cabinet and joinery scopes",
              "Uses your pricing rules, labour logic, markup, and GST settings",
              "Review-ready output before anything goes to the client",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                {item}
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <Button
              onClick={() => window.location.href = 'mailto:matt@kindaiestimator.com?subject=Enterprise%20Pilot%20Enquiry%20%E2%80%93%20Cabinet%20Making'}
              size="lg"
              className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              Book an Enterprise Pilot <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/demo")}
              size="lg"
              variant="outline"
              className="px-8 py-4 rounded-full text-base font-black h-auto border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              See a Cabinet Estimate
            </Button>
          </motion.div>

          {/* Demo Video with Voiceover */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-14 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900"
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              controls
              className="w-full aspect-video"
              poster=""
            >
              <source src="https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai_cabinet_demo_voiceover_50c05dcb.mp4" type="video/mp4" />
            </video>
            <div className="px-4 py-3 bg-gray-900/80 text-center">
              <p className="text-sm text-gray-400">Real screen recording — Cabinet Making AI takeoff demo with voiceover</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 2 — What buyers care about */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold mb-5">
              For estimators and business owners
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-5">
              Give your estimators a faster starting point —<br />
              <span className="kindai-gradient-text">not another black box.</span>
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Kindai helps cabinet teams move from drawings to a review-ready estimate faster by reducing manual counting, standardising pricing logic, and making quote preparation more consistent across the business.
            </p>
            <p className="text-gray-500 text-base leading-relaxed">
              Every output is a draft for your estimator to review. Your team checks every line, adjusts quantities, overrides prices, and approves before anything goes to a client. Kindai accelerates the process — your estimators make the call.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 — Proof block */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold mb-4">
              Real output example
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              What a Kindai cabinet estimate looks like.
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Cabinet quantities, panel and hardware lines, benchtop allowances, labour and markup — structured for your estimator to review and adjust.
            </p>
          </div>

          <div className="bg-gray-950 rounded-2xl p-6 border border-white/10 shadow-2xl max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/50 font-mono">Kindai AI Takeoff — Commercial Kitchen Joinery, 3-level office fitout</span>
              <span className="ml-auto text-xs text-teal-400 font-bold">Draft — pending estimator review</span>
            </div>

            <div className="space-y-2 text-xs mb-4">
              {PROOF_ITEMS.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/5 items-center">
                  <span className="text-white/70 col-span-5">{row.item}</span>
                  <span className="text-white/40 col-span-2 text-right">{row.qty}</span>
                  <span className="text-white/40 col-span-3 text-right">{row.price}</span>
                  <span className="text-green-400 font-bold col-span-2 text-right">{row.total}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-white/50">
                <span>Subtotal (ex GST)</span>
                <span className="text-white font-bold">$32,891</span>
              </div>
              <div className="flex justify-between text-xs text-white/50">
                <span>Markup (18%)</span>
                <span className="text-orange-400 font-bold">+$5,920</span>
              </div>
              <div className="flex justify-between text-xs text-white/50">
                <span>GST (10%)</span>
                <span className="text-white font-bold">$3,881</span>
              </div>
              <div className="flex justify-between items-center bg-gradient-to-r from-teal-500/20 to-green-500/20 rounded-lg px-3 py-2 border border-teal-500/30 mt-2">
                <span className="text-white font-black text-sm">Total Quote (inc GST)</span>
                <span className="text-teal-400 font-black text-xl">$42,692</span>
              </div>
            </div>

            <p className="text-white/25 text-[10px] text-center mt-3">
              AI-generated draft — all quantities, prices and totals reviewed and approved by estimator before issue
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 — How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              How Kindai fits into a cabinet estimating workflow.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-5xl font-black kindai-gradient-text mb-4">{step.step}</div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4 text-gray-200">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Why it's different */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-200 text-gray-600 text-xs font-bold mb-5">
                Built for the way cabinet teams actually quote
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6">
                Less time counting.<br />More time winning jobs.
              </h2>
              <div className="space-y-3">
                {WHY_DIFFERENT.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Clock, label: "Time saved per estimate", value: "2–4 hrs", sub: "on first-pass takeoffs" },
                { icon: FileText, label: "Quote consistency", value: "100%", sub: "same logic every job" },
                { icon: Users, label: "Team access", value: "Unlimited", sub: "users on Pro plan" },
                { icon: Shield, label: "Data security", value: "Enterprise", sub: "grade infrastructure" },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <stat.icon className="w-5 h-5 text-teal-500 mb-3" />
                  <div className="text-xs text-gray-400 mb-1">{stat.label}</div>
                  <div className="text-2xl font-black text-gray-900 mb-0.5">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 — Enterprise block */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-bold mb-5">
            <Shield className="w-3.5 h-3.5 text-blue-400" /> For larger cabinet manufacturers and joinery businesses
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-5">
            Structured pilot for teams that need to get it right.
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            If you manage multiple estimators, multiple project types, or high quote volume, Kindai can be rolled out through a structured 30–45 day pilot with onboarding, pricing-rule setup, sample data import, and weekly review sessions.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
            {[
              { title: "30–45 day pilot", desc: "Real jobs, real data, real results. Success criteria agreed upfront." },
              { title: "Pricing rule setup", desc: "Your supplier rates, labour models, markup rules, and GST settings configured before day one." },
              { title: "Weekly review", desc: "We review outputs with your team, adjust the model, and track accuracy against your benchmarks." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h3 className="font-black text-white text-sm mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <Button
onClick={() => window.location.href = 'mailto:matt@kindaiestimator.com?subject=30-Day%20Pilot%20Enquiry%20%E2%80%93%20Cabinet%20Making'}
            size="lg"
            className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-xl"
          >
            Book a 30-Day Pilot <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Section 7 — Final CTA */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-5">
            Stop starting every cabinet estimate from scratch.
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-2xl mx-auto">
            See how Kindai helps your team draft quotes faster, review with confidence, and respond to more opportunities without adding estimator headcount.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => window.location.href = 'mailto:matt@kindaiestimator.com?subject=Enterprise%20Pilot%20Enquiry%20%E2%80%93%20Cabinet%20Making'}
              size="lg"
              className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              Book an Enterprise Pilot <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>© 2026 Kindai. Built for Australian construction businesses.</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</a>
            <a href="/support" className="hover:text-gray-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
