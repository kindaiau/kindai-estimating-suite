import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Shield, Users, Zap, Crown, Sparkles, Brain, Database, GitBranch, BarChart3, FileText } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { pixelViewPricingPage, pixelInitiateCheckout } from "@/lib/metaPixel";
import { getAnalyticsContext, trackEvent } from "@/lib/analytics";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";
const ENTERPRISE_CONTACT_HREF = "mailto:matt@kindaiestimator.com?subject=Enterprise%20%26%20Custom%20Solutions";

// ─── Tier definitions ─────────────────────────────────────────────────────────
const TIERS = [
  {
    id: "sole_trader",
    name: "Sole Tradie",
    subtitle: "Owner-operators",
    monthlyPrice: 149,
    color: "from-pink-500 to-orange-500",
    border: "border-orange-400",
    badge: "MOST POPULAR",
    cta: "Start Sole Tradie",
    ctaVariant: "default" as const,
    description: "For solo tradies who need fast takeoffs, clean quotes, and fewer nights stuck pricing jobs.",
    features: [
      { label: "20 AI Takeoffs / month", included: true },
      { label: "10 Vision Takeoffs / month", included: true },
      { label: "Unlimited projects", included: true },
      { label: "Company Memory (price book)", included: true },
      { label: "Correction Learning Loop", included: true },
      { label: "PDF Export", included: true },
      { label: "Team Members", value: "1" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "Growing trade teams",
    monthlyPrice: 450,
    color: "from-blue-500 to-indigo-600",
    border: "border-blue-400",
    badge: "BEST VALUE",
    cta: "Start Pro",
    ctaVariant: "default" as const,
    description: "For teams that quote more volume, need smarter workflows, and want the AI to learn how the business prices.",
    features: [
      { label: "Unlimited AI Takeoffs", included: true },
      { label: "Unlimited Vision Takeoffs", included: true },
      { label: "Unlimited Projects", included: true },
      { label: "Company Memory (price book)", included: true },
      { label: "Correction Learning Loop", included: true },
      { label: "Orchestrated AI Workflow", included: true },
      { label: "Accuracy Dashboard", included: true },
      { label: "Client-owned accounting integration", included: true },
      { label: "PDF Export", included: true },
      { label: "Team Members", value: "5" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise & Custom Solutions",
    subtitle: "Commercial builders & custom workflows",
    monthlyPrice: null,
    color: "from-amber-400 to-orange-600",
    border: "border-amber-400",
    badge: "CONTACT",
    cta: "Make Contact",
    ctaVariant: "outline" as const,
    description: "Custom onboarding, integrations, data migration, multi-user controls, and commercial support built around your workflow.",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Unlimited team members", included: true },
      { label: "Dedicated onboarding", included: true },
      { label: "Custom supplier price books", included: true },
      { label: "Custom accounting and job-management workflows", included: true },
      { label: "Priority support", included: true },
      { label: "White-label Branding", included: true },
      { label: "Custom AI Training Data", included: true },
    ],
  },
];

const FEATURE_HIGHLIGHTS = [
  { icon: Brain, title: "Orchestrated AI", desc: "5-step pipeline — Plan Interpretation → Quantity Extraction → Pricing → Business Rules → Draft Assembly", tier: "Pro+" },
  { icon: Database, title: "Company Memory", desc: "Your price book, AI instructions, and job templates — the AI learns your business and applies your rates automatically", tier: "Pro+" },
  { icon: GitBranch, title: "Correction Learning", desc: "Every edit you make trains the AI. After 10 jobs it starts pre-adjusting based on your patterns", tier: "Sole Tradie+" },
  { icon: BarChart3, title: "Accuracy Dashboard", desc: "Track estimated vs actual, see where the AI is over/under, and measure improvement over time", tier: "Pro+" },
  { icon: FileText, title: "Client-Owned Integrations", desc: "Connect the accounting or job-management tools your business already uses, without using Kindai's own accounts.", tier: "Pro+" },
  { icon: Shield, title: "Custom Workflows", desc: "We can integrate your current stack or recommend and build a cleaner system for quoting, jobs, accounting, and reporting.", tier: "Enterprise" },
];

const COMPETITOR_BENCHMARKS = [
  { name: "Buildxact AU", price: "$199–$599/mo", notes: "Unlimited users, broad construction" },
  { name: "BuildVision AI", price: "$299/mo", notes: "Cabinet-specific, 500 AI pages" },
  { name: "Kreo Pro", price: "$175/user/mo", notes: "Per-user pricing, annual billing" },
  { name: "Groundplan", price: "From $75/user/mo", notes: "Per-user/operator pricing" },
  { name: "CabMaster", price: "A$106–$321/mo", notes: "Annual plans, cabinet-specific" },
  { name: "Kindai Sole Tradie", price: "A$149/mo", notes: "AI takeoff, company memory, PDF quotes", highlight: true },
  { name: "Kindai Pro", price: "A$450/mo", notes: "Full AI orchestration + integrations + accuracy dashboard", highlight: true },
];

// ─── Premium animated footer ──────────────────────────────────────────────────
function PremiumFooter() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const footerLinks = [
    { label: "Product", links: [
      { label: "AI Takeoff", href: "/ai-takeoff" },
      { label: "Free Demo", href: "/demo" },
      { label: "Help & Best Practices", href: "/help" },
      { label: "Cabinet Joinery", href: "/cabinet-joinery" },
    ] },
    { label: "Company", links: [
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
      { label: "Beta Access", href: "/beta" },
      { label: "Support", href: "/support" },
    ] },
    { label: "Legal", links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Data Deletion", href: "/data-deletion" },
      { label: "Security Contact", href: "/.well-known/security.txt" },
    ] },
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
              From Plans to Quote in Minutes. AI That Learns Your Rates, Your Rules, Your Business.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-500">All systems operational</span>
            </div>
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
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-gray-300 text-sm hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block"
                    >
                      {link.label}
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
            <span className="text-xs text-gray-600">Powered by</span>
            <span className="text-xs font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
              GPT-4o + Real Australian Pricing Data
            </span>
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

  const checkoutMutation = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Opening Stripe checkout...");
      window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    pixelViewPricingPage();
    trackEvent("pricing_viewed", {
      ...getAnalyticsContext(),
      planCount: TIERS.length,
    });
  }, []);

  const handleSubscribe = (tierId: string, price: number) => {
    trackEvent("pricing_plan_clicked", {
      tier: tierId,
      interval: yearly ? "yearly" : "monthly",
      priceMonthly: price,
      authenticated: isAuthenticated,
    });

    if (tierId === "enterprise") {
      trackEvent("enterprise_contact_clicked", {
        location: "pricing",
        tier: tierId,
      });
      window.location.href = ENTERPRISE_CONTACT_HREF;
      return;
    }

    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    pixelInitiateCheckout({ content_name: `Kindai ${tierId}`, value: price });
    trackEvent("checkout_started", {
      tier: tierId,
      interval: yearly ? "yearly" : "monthly",
      priceMonthly: price,
    });
    // Map tier IDs to valid planId enum values
    const planIdMap: Record<string, "sole_trader" | "small_builder" | "mid_builder" | "enterprise"> = {
      sole_trader: "sole_trader",
      pro: "small_builder",
    };
    const planId = planIdMap[tierId];
    if (!planId) return;
    checkoutMutation.mutate({
      planId,
      interval: yearly ? "yearly" : "monthly",
      origin: window.location.origin,
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SEO
        title="Pricing | Kindai Estimating Suite"
        description="Sole Tradie at A$149/mo, Pro at A$450/mo, and Enterprise & Custom Solutions by contact. AI estimating that learns your rates, your rules, your business."
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
            <Sparkles className="w-3.5 h-3.5" /> Simple trade pricing. Enterprise by contact.
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4"
          >
            The AI estimator that learns<br />
            <span className="kindai-gradient-text">your rates, your rules, your business.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Start with Sole Tradie, step up to Pro when the team grows, or talk to us about an enterprise setup built around your workflows.
          </motion.p>
        </div>
      </section>

      {/* Annual toggle */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm font-bold ${!yearly ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            aria-label={yearly ? "Switch to monthly billing" : "Switch to annual billing"}
            className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? "bg-orange-500" : "bg-gray-300"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${yearly ? "translate-x-7" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-bold ${yearly ? "text-gray-900" : "text-gray-600"}`}>Annual</span>
          {yearly && (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Save 20%</span>
          )}
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {TIERS.map((tier, i) => {
              const price = tier.monthlyPrice !== null
                ? (yearly ? Math.round(tier.monthlyPrice * 0.8) : tier.monthlyPrice)
                : null;
              const isPopular = tier.badge === "MOST POPULAR";
              const isBestValue = tier.badge === "BEST VALUE";
              const isCustom = tier.monthlyPrice === null;

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative rounded-2xl border-2 ${tier.border} ${
                    isPopular ? "bg-white shadow-xl shadow-orange-100" :
                    isBestValue ? "bg-gray-950 shadow-xl shadow-blue-900/20" :
                    "bg-white shadow-sm"
                  } overflow-hidden`}
                >
                  {tier.badge && (
                    <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-0">
                      <span className={`text-white text-[10px] font-black px-3 py-1 rounded-b-lg ${
                        isPopular ? "bg-gradient-to-r from-pink-500 to-orange-500" :
                        isBestValue ? "bg-gradient-to-r from-blue-500 to-indigo-600" :
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
                        {tier.id === "sole_trader" && <Users className="w-4 h-4 text-white" />}
                        {tier.id === "pro" && <Brain className="w-4 h-4 text-white" />}
                        {tier.id === "enterprise" && <Shield className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <div className={`font-black text-base ${isBestValue ? "text-white" : "text-gray-900"}`}>{tier.name}</div>
                        <div className={`text-[11px] ${isBestValue ? "text-gray-300" : "text-gray-600"}`}>{tier.subtitle}</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      {isCustom ? (
                        <div>
                          <span className={`text-2xl font-black ${isBestValue ? "text-white" : "text-gray-900"}`}>Custom</span>
                          <div className={`text-[11px] mt-0.5 ${isBestValue ? "text-gray-300" : "text-gray-600"}`}>Tailored to your business</div>
                        </div>
                      ) : (
                        <div>
                          <span className={`text-2xl font-black ${isBestValue ? "text-white" : "text-gray-900"}`}>
                            {price === 0 ? "Free" : `A$${price}`}
                          </span>
                          {price !== 0 && <span className={`text-xs ${isBestValue ? "text-gray-300" : "text-gray-600"}`}>/mo</span>}
                          {yearly && price !== null && price > 0 && (
                            <div className="text-[10px] text-green-500 font-bold mt-0.5">A${price * 12}/yr</div>
                          )}
                        </div>
                      )}
                    </div>

                    <p className={`text-xs mb-4 leading-relaxed ${isBestValue ? "text-gray-300" : "text-gray-600"}`}>
                      {tier.description}
                    </p>

                    {isCustom ? (
                      <Button
                        asChild
                        variant={tier.ctaVariant}
                        className={`w-full py-2.5 rounded-full font-black text-sm h-auto mb-4 ${
                          isPopular ? "kindai-btn-primary" :
                          isBestValue ? "bg-blue-500 hover:bg-blue-400 text-white border-0" :
                          tier.id === "enterprise" ? "border-amber-500 text-amber-700 hover:bg-amber-50" :
                          "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <a href={ENTERPRISE_CONTACT_HREF}>{tier.cta}</a>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubscribe(tier.id, tier.monthlyPrice ?? 0)}
                        disabled={checkoutMutation.isPending}
                        variant={tier.ctaVariant}
                        className={`w-full py-2.5 rounded-full font-black text-sm h-auto mb-4 ${
                          isPopular ? "kindai-btn-primary" :
                          isBestValue ? "bg-blue-500 hover:bg-blue-400 text-white border-0" :
                          tier.id === "enterprise" ? "border-amber-500 text-amber-700 hover:bg-amber-50" :
                          "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {checkoutMutation.isPending ? "Loading..." : tier.cta}
                      </Button>
                    )}

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
                          <span className={`${"included" in f && !f.included ? (isBestValue ? "text-gray-500" : "text-gray-500") : (isBestValue ? "text-gray-200" : "text-gray-700")}`}>
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
            All prices in AUD. GST not included. Annual plans show the equivalent monthly rate.
          </p>
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
              These aren't just features — they're the systems that make your AI estimator smarter every single job.
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
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Market benchmarks */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              How Kindai compares to the market
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              No per-user fees. No seat limits. The only estimator that gets smarter the more you use it.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-bold text-gray-500">Product</th>
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
                      {row.name} {row.highlight && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full ml-1">You</span>}
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
                q: "What's the difference between Sole Tradie and Pro?",
                a: "Sole Tradie gives one operator AI takeoffs, company memory, correction learning and PDF quotes. Pro adds unlimited AI volume, the full orchestration workflow, client-owned accounting integrations, accuracy reporting and team seats.",
              },
              {
                q: "What is Company Memory?",
                a: "Company Memory lets you upload your price book (your actual supplier rates), set AI instructions (e.g. 'always include 10% waste on concrete'), and save job templates. The AI uses all of this every time it generates a quote — so it quotes your way, not a generic way.",
              },
              {
                q: "How does the Correction Learning Loop work?",
                a: "Every time you edit an AI-generated line item, the system records what the AI said vs what you changed it to. After 10-20 corrections per trade, the AI starts pre-adjusting based on your patterns — e.g. 'this user always bumps electrical labour up by 15%'. It compounds over time.",
              },
              {
                q: "Can I import my own supplier pricing?",
                a: "Yes. Sole Tradie and Pro both support your own price book. Pro and Enterprise customers can add deeper supplier workflows and custom setup support.",
              },
              {
                q: "Can Kindai work with my current accounting or job-management system?",
                a: "Yes. We can connect to the tools your business already uses, such as Xero, ServiceM8, MYOB, QuickBooks, Procore, Buildxact, or similar systems. For messy setups, we can also recommend and build a cleaner workflow.",
              },
              {
                q: "Is my data used to train AI models?",
                a: "No. Your uploaded plans, pricing, and job data are never used to train AI models. Your business data is not shared with any third party. Enterprise accounts can request a Data Processing Agreement.",
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
          <h2 className="text-3xl font-black text-white mb-4">
            Pick the plan that matches how you quote.
          </h2>
          <p className="text-gray-400 mb-8">
            Sole Tradie is built for one operator. Pro is built for teams. Enterprise is handled directly so we can scope it properly.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => handleSubscribe("sole_trader", 149)}
              size="lg"
              variant="outline"
              className="px-10 py-4 rounded-full text-base font-black h-auto border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Start Sole Tradie
            </Button>
            <Button
              onClick={() => handleSubscribe("pro", 450)}
              size="lg"
              className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              Start Pro — A$450/mo <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <PremiumFooter />
    </div>
  );
}
