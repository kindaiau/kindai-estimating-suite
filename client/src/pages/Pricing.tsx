import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Shield, Users, Zap, Crown, Sparkles, Brain, Database, GitBranch, BarChart3, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { motion, useInView } from "framer-motion";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

// ─── Tier definitions ─────────────────────────────────────────────────────────
// Takeoff level labels shown on cards
const TIERS = [
  {
    id: "free",
    name: "Evaluation",
    subtitle: "Test the workflow",
    monthlyPrice: 0,
    yearlyTotal: 0,
    color: "from-gray-400 to-gray-500",
    border: "border-gray-200",
    badge: null,
    cta: "Apply for Setup",
    ctaVariant: "outline" as const,
    description: "Explore a representative sample, then apply for the paid cabinet and joinery Founding Workflow Setup.",
    takeoffs: { quickQuote: "Sample", planReading: null, fullTakeoff: null },
    features: [
      { label: "Interactive estimating sample", included: true },
      { label: "A$2,500 + GST setup by application", included: true },
      { label: "Plan Reading (Vision AI)", included: false },
      { label: "Private workspace", included: false },
      { label: "Company Memory", included: false },
      { label: "Correction Review", included: false },
      { label: "PDF Export", included: false },
      { label: "Included users", value: "1" },
    ],
  },
  {
    id: "pro",
    name: "Sole Tradie",
    subtitle: "Owner-operators",
    monthlyPrice: 149,
    yearlyTotal: 1430.4,
    color: "from-pink-500 to-orange-500",
    border: "border-orange-400",
    badge: null,
    cta: "Apply for Setup",
    ctaVariant: "default" as const,
    description: "The A$149 monthly continuation option after the included founding setup period. New customers apply for setup first.",
    takeoffs: { quickQuote: "Included", planReading: "20 / month", fullTakeoff: null },
    features: [
      { label: "Quick Quote — Included", included: true },
      { label: "Plan Reading (Vision AI) — 20 / mo", included: true, highlight: true },
      { label: "Unlimited Projects", included: true },
      { label: "Company Memory (price book)", included: true },
      { label: "Approved Corrections Record", included: true },
      { label: "PDF Export", included: true },
      { label: "Included users", value: "1" },
    ],
  },
];

const FEATURE_HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: "Plan Reading — Vision AI",
    desc: "Upload a supported plan and Kindai identifies dimensions, counts, components, and assumptions for your estimator to review.",
    tier: "Sole Tradie+",
    aiLabel: "Vision processing",
    aiColor: "bg-violet-100 text-violet-700",
  },
  { icon: Database, title: "Company Memory", desc: "Keep your price book, instructions, and job templates together so each draft starts from your business rules.", tier: "Sole Tradie+", aiLabel: null, aiColor: null },
  { icon: GitBranch, title: "Correction Review", desc: "Keep approved estimator changes visible so recurring adjustments can be checked on future drafts.", tier: "Sole Tradie", aiLabel: null, aiColor: null },
];

const COMPETITOR_BENCHMARKS = [
  { name: "Sole Tradie", price: "A$149/mo", notes: "1 included user, 20 AI Vision takeoffs per month", highlight: true },
];

// ─── Premium animated footer ──────────────────────────────────────────────────
function PremiumFooter() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const footerLinks = [
    { label: "Product", links: ["Plan Reading", "Company Memory", "Correction Review", "Pricing"] },
    { label: "Company", links: ["About", "Pricing", "Blog", "Careers"] },
    { label: "Legal", links: ["Privacy Policy", "Terms of Service", "Security", "Support"] },
  ];

  return (
    <footer ref={ref} className="relative overflow-hidden bg-gray-950 pt-20 pb-10 px-4">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-pink-600/20 to-orange-600/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-teal-600/10 to-cyan-600/5 blur-3xl"
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <img src={LOGO_URL} alt="Kindai" className="h-9 w-9" />
              <span className="text-xl font-black kindai-gradient-text">kindai</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Structured estimate drafts from your plans, rates and rules—with human review kept in the workflow.
            </p>
            <span className="text-xs text-gray-500">Controlled founding launch</span>
          </motion.div>

          {/* Link columns */}
          {footerLinks.map((col, i) => (
            <motion.div
              key={col.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: (i + 1) * 0.1 }}
            >
              <h4 className="text-white font-black text-sm mb-4 tracking-wide uppercase">{col.label}</h4>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-400 text-sm hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Animated divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.4 }}
          className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8 origin-left"
        />

        {/* Bottom row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <span className="text-xs text-gray-600">
            © 2026 Kindai. Built for Australian construction businesses.
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Draft outputs require estimator review.</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [yearly, setYearly] = useState(false);

  const handleSubscribe = () => navigate("/evaluation");

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SEO
        title="Pricing | Kindai Estimating Suite"
        description="Apply for a paid cabinet and joinery workflow setup. The included period continues on Sole Tradie at A$149 per month only if the customer chooses to subscribe."
        canonical="/pricing"
        keywords="construction estimating software price Australia, AI estimating software pricing, trade estimating AI Australia"
      />

      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src={LOGO_URL} alt="Kindai" className="h-8 w-8" />
            <span className="text-lg font-black kindai-gradient-text">kindai</span>
          </button>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} size="sm" className="kindai-btn-primary rounded-full text-sm font-bold">
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())} size="sm" className="kindai-btn-primary rounded-full text-sm font-bold">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-12 px-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-pink-600/20 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-orange-600/20 blur-3xl"
          />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-sm font-bold text-orange-400 mb-5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Controlled cabinet and joinery launch
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4"
          >
             AI-assisted estimating using<br />
             <span className="kindai-gradient-text">your rates, your rules, your review.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Start with the representative sample, then apply for one paid cabinet or joinery workflow with one included user.
          </motion.p>
        </div>
      </section>

      {/* Annual toggle */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm font-bold ${!yearly ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? "bg-orange-500" : "bg-gray-300"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${yearly ? "translate-x-7" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-bold ${yearly ? "text-gray-900" : "text-gray-400"}`}>Annual</span>
          {yearly && (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Save 20%</span>
          )}
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start max-w-3xl mx-auto">
            {TIERS.filter(tier => ["free", "pro"].includes(tier.id)).map((tier, i) => {
              const price = tier.monthlyPrice !== null
                ? (yearly && tier.yearlyTotal !== null ? tier.yearlyTotal / 12 : tier.monthlyPrice)
                : null;
              const isPopular = tier.badge === "MOST POPULAR";
              const isDark = tier.id === "business";
              const isCustom = tier.monthlyPrice === null;
              const displayPrice = price === null
                ? null
                : Number.isInteger(price)
                  ? price.toFixed(0)
                  : price.toFixed(2);

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative rounded-2xl border-2 ${tier.border} ${
                    isPopular ? "bg-white shadow-xl shadow-orange-100" :
                    isDark ? "bg-gray-950 shadow-xl shadow-blue-900/20" :
                    "bg-white shadow-sm"
                  } overflow-hidden`}
                >
                  {tier.badge && (
                    <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-0">
                      <span className={`text-white text-[10px] font-black px-3 py-1 rounded-b-lg ${
                        isPopular ? "bg-gradient-to-r from-pink-500 to-orange-500" :
                        isDark ? "bg-gradient-to-r from-blue-500 to-indigo-600" :
                        "bg-gradient-to-r from-amber-400 to-orange-500"
                      }`}>
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-5 pt-7">
                    {/* Icon + name */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shrink-0`}>
                        {tier.id === "free" && <Zap className="w-4 h-4 text-white" />}
                        {tier.id === "pro" && <Users className="w-4 h-4 text-white" />}
                        {tier.id === "business" && <Brain className="w-4 h-4 text-white" />}
                        {tier.id === "enterprise" && <Shield className="w-4 h-4 text-white" />}
                        {tier.id === "enterprise_plus" && <Crown className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <div className={`font-black text-base ${isDark ? "text-white" : "text-gray-900"}`}>{tier.name}</div>
                        <div className="text-[10px] text-gray-400">{tier.subtitle}</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      {isCustom ? (
                        <div>
                          <span className={`text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>Custom</span>
                          <div className="text-[10px] text-gray-400 mt-0.5">Tailored to your business</div>
                        </div>
                      ) : (
                        <div>
                          <span className={`text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                            {price === 0 ? "Included" : `A$${displayPrice}`}
                          </span>
                          {price !== 0 && <span className="text-xs text-gray-400">/mo</span>}
                          {yearly && tier.yearlyTotal !== null && tier.yearlyTotal > 0 && (
                            <div className="text-[10px] text-green-500 font-bold mt-0.5">
                              A${tier.yearlyTotal.toLocaleString("en-AU", { minimumFractionDigits: tier.yearlyTotal % 1 === 0 ? 0 : 2 })}/yr billed annually
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <p className={`text-xs mb-4 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {tier.description}
                    </p>

                    <Button
                      onClick={handleSubscribe}
                      variant={tier.ctaVariant}
                      className={`w-full py-2.5 rounded-full font-black text-sm h-auto mb-4 ${
                        isPopular ? "kindai-btn-primary" :
                        isDark ? "bg-blue-500 hover:bg-blue-400 text-white border-0" :
                        tier.id === "enterprise" ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 hover:opacity-90" :
                        tier.id === "enterprise_plus" ? "border-amber-400 text-amber-600 hover:bg-amber-50" :
                        "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {tier.cta}
                    </Button>

                    {/* Features */}
                    <div className="space-y-2">
                      {tier.features.map((f, fi) => (
                        <div key={fi} className="flex items-start gap-2 text-xs">
                          {"included" in f ? (
                            f.included ? (
                              <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                            )
                          ) : (
                            <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                          )}
                          <span className={`${"included" in f && !f.included ? (isDark ? "text-gray-600" : "text-gray-300") : (isDark ? "text-gray-300" : "text-gray-600")}`}>
                            {f.label}{"value" in f ? `: ${f.value}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            All prices in AUD. GST not included. Cancel anytime on monthly plans.
          </p>
        </div>
      </section>

      {/* Vision AI callout */}
      <section className="py-14 px-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-96 h-96 rounded-full bg-orange-600/10 blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm font-bold text-violet-400 mb-4">
             <Sparkles className="w-3.5 h-3.5" /> Controlled AI-assisted drafting
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
               Two controlled drafting paths
            </h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
               Use text inputs or supported plans with your own rates and rules. Both paths produce drafts for human review.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                level: "01",
                name: "Quick Quote",
                badge: "Paid workspace",
                badgeColor: "bg-gray-700 text-gray-300",
                desc: "Describe the job in plain English. KindAI applies the price-book rows and rules you provide to prepare a draft for review.",
                model: "Text model",
                modelColor: "text-gray-400",
                icon: "💬",
              },
              {
                level: "02",
                name: "Plan Reading",
                badge: "Sole Tradie",
                badgeColor: "bg-violet-900/60 text-violet-300 border border-violet-700",
                desc: "Upload a supported PDF plan. Vision processing proposes dimensions, counts, components and source references for an estimator to check.",
                model: "Vision model",
                modelColor: "text-violet-400",
                icon: "👁️",
                highlight: true,
              },
            ].map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-6 border ${
                  item.highlight
                    ? "bg-violet-950/60 border-violet-700/50 shadow-lg shadow-violet-900/20"
                    : "bg-gray-900 border-gray-800"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{item.icon}</span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${item.badgeColor}`}>{item.badge}</span>
                </div>
                <div className="text-gray-600 text-xs font-bold mb-1">LEVEL {item.level}</div>
                <h3 className="text-white font-black text-lg mb-3">{item.name}</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-4">{item.desc}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className={`text-xs font-bold ${item.modelColor}`}>{item.model}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              What makes Kindai different
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
               The founding workflow keeps company inputs and estimator corrections attached to the drafting process.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURE_HIGHLIGHTS.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mb-3">
                  <feat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-black text-gray-900 text-sm">{feat.title}</h3>
                  <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">{feat.tier}</span>
                  {feat.aiLabel && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${feat.aiColor}`}>{feat.aiLabel}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Included capacity */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              Included capacity at a glance
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
               The controlled launch publishes one continuation plan with one included user and a defined monthly plan-reading allowance.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-bold text-gray-500">Plan</th>
                  <th className="text-left px-5 py-3 font-bold text-gray-500">Price</th>
                  <th className="text-left px-5 py-3 font-bold text-gray-500 hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITOR_BENCHMARKS.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-50 ${row.highlight ? "bg-orange-50" : "hover:bg-gray-50"} transition-colors`}
                  >
                    <td className={`px-5 py-3 font-bold ${row.highlight ? "text-orange-600" : "text-gray-800"}`}>
                      {row.name}
                    </td>
                    <td className={`px-5 py-3 font-bold ${row.highlight ? "text-orange-600" : "text-gray-700"}`}>{row.price}</td>
                    <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">Common questions</h2>
          <div className="space-y-5">
            {[
              {
                q: "Can I buy a team plan now?",
                a: "Not during the controlled founding launch. The public offer covers one cabinet or joinery workflow and one user. Team access will only be sold after permissions, seat limits, onboarding and support are validated.",
              },
              {
                q: "What is Company Memory?",
                a: "Company Memory lets you upload your price book (your actual supplier rates), set AI instructions (e.g. 'always include 10% waste on concrete'), and save job templates. The AI uses all of this every time it generates a quote — so it quotes your way, not a generic way.",
              },
              {
                q: "How does the Correction Learning Loop work?",
                a: "Estimator changes can be recorded beside the draft so recurring corrections are visible during review. The founding offer does not promise autonomous learning or automatic price changes.",
              },
              {
                q: "Can I import my own supplier pricing?",
                a: "Yes. Sole Tradie lets you maintain your own supplier and price-book rows. Drafts must use those customer-provided rates or clearly flag a missing rate for review.",
              },
              {
                q: "Is my data used to train AI models?",
                a: "Uploaded work is processed by the cloud, storage and AI providers required to deliver the service. Advertising trackers are disabled for the controlled launch. See the Privacy Policy for the current processing scope.",
              },
              {
                q: "What file types does Plan Reading (Vision AI) support?",
                a: "Plan Reading accepts PDF, JPG, PNG and WebP files up to 32MB per upload. Clear drawings with readable dimensions and schedules produce the strongest draft for estimator review.",
              },
              {
                q: "How accurate is the AI plan reading? Can I trust the numbers?",
                a: "KindAI produces a structured draft with source notes, assumptions and review flags. Reliability depends on plan quality and job complexity, so a qualified estimator must review quantities, rates, exclusions and compliance before a quote is issued.",
              },
              {
                q: "Can it handle commercial jobs — large builders, joinery contractors, fitouts?",
                a: "Large packages are assessed during application. The founding setup is deliberately limited to one agreed workflow, up to five supported files, and two reviewed jobs. Broader autonomous or enterprise takeoff claims are not part of this offer.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-black text-gray-900 text-sm mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-pink-600/20 blur-3xl"
          />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-orange-500/40 rounded-full px-4 py-1.5 text-sm font-black text-orange-400 mb-5">
            <Sparkles className="w-4 h-4" /> Founding Workflow Setup
          </div>
          <h2 className="text-3xl font-black text-white mb-3">
            Configure one real cabinet or joinery workflow.
          </h2>
          <p className="text-gray-400 mb-2">
            A$2,500 plus GST includes one configured workflow, two reviewed jobs and the first six months of Sole Tradie.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Applications are approved before payment or private-plan processing. No open-ended free AI account.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => navigate("/evaluation")}
              size="lg"
              className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              Apply for Founding Setup <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/demo")}
              size="lg"
              variant="outline"
              className="px-8 py-3 rounded-full text-sm font-black h-auto border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Explore the Interactive Sample
            </Button>
          </div>
        </div>
      </section>

      <PremiumFooter />
    </div>
  );
}
