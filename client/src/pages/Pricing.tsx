import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Shield, Users, Zap, Crown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { pixelViewPricingPage, pixelInitiateCheckout } from "@/lib/metaPixel";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const PRO_FEATURES = [
  "Unlimited users",
  "Unlimited projects",
  "250–500 AI pages per month",
  "Pricing library (your rates)",
  "Branded quote templates",
  "Markup + GST settings",
  "Cabinet, joinery, and 19 other trades",
  "Email support",
  "Month-to-month, cancel anytime",
];

const PILOT_FEATURES = [
  "30–45 day structured pilot",
  "Dedicated onboarding session",
  "Pricing-rule and labour-rate setup",
  "Sample data import",
  "Weekly review and accuracy check",
  "Success criteria agreed upfront",
  "Full Pro platform access during pilot",
  "Team training included",
];

const ENTERPRISE_FEATURES = [
  "Everything in Pro",
  "Higher AI usage limits",
  "Admin and approval workflow",
  "Role-based access controls",
  "Dedicated account support",
  "Security and procurement review",
  "Data Processing Agreement (DPA)",
  "Integration roadmap",
  "Annual contract pricing",
];

const COMPETITOR_BENCHMARKS = [
  { name: "Buildxact AU", price: "$199–$599/mo", notes: "Unlimited users, broad construction" },
  { name: "BuildVision AI", price: "$299/mo", notes: "Cabinet-specific, 500 AI pages, unlimited users" },
  { name: "Kreo Pro", price: "$175/user/mo", notes: "Per-user pricing, annual billing" },
  { name: "Groundplan", price: "From $75/user/mo", notes: "Per-user/operator pricing" },
  { name: "CabMaster", price: "A$106–$321/mo", notes: "Annual plans, cabinet-specific" },
  { name: "Buildertrend", price: "$799–$1,099/mo", notes: "Full project management suite" },
  { name: "Kindai Pro", price: "A$299/mo", notes: "Unlimited users, cabinet-first AI", highlight: true },
];

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

  useEffect(() => { pixelViewPricingPage(); }, []);

  const handleProSubscribe = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    pixelInitiateCheckout({ content_name: "Kindai Pro", value: 299 });
    checkoutMutation.mutate({
      planId: "small_builder",
      interval: yearly ? "yearly" : "monthly",
      origin: window.location.origin,
    });
  };

  const proPrice = yearly ? Math.round(299 * 0.8) : 299;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SEO
        title="Pricing | Kindai Estimating Suite"
        description="Simple pricing for growing joinery and construction teams. Pro at A$299/month with unlimited users. Enterprise pilot for larger manufacturers. No per-user fees."
        canonical="/pricing"
        keywords="construction estimating software price Australia, cabinet estimating software cost, joinery quoting software pricing, AI estimating software Australia"
      />

      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src={LOGO_URL} alt="Kindai" className="h-8 w-8" />
            <span className="text-lg font-black kindai-gradient-text">kindai</span>
          </button>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/cabinet-joinery")}
              variant="ghost"
              size="sm"
              className="text-sm font-bold text-gray-600 hover:text-gray-900"
            >
              Cabinet & Joinery
            </Button>
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
      <section className="pt-16 pb-12 px-4 bg-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 text-sm font-bold text-teal-400 mb-5"
          >
            <Zap className="w-3.5 h-3.5" /> Simple pricing for growing joinery teams
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4"
          >
            Self-serve for smaller teams.<br />
            <span className="kindai-gradient-text">Paid pilots for larger manufacturers.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            No per-user fees. No seat limits. Priced by AI usage — so your whole team can review, approve, and collaborate without extra cost.
          </motion.p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
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

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border-2 border-orange-400 shadow-xl shadow-orange-100 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-black px-4 py-1 rounded-full shadow-lg">
                  MOST POPULAR
                </span>
              </div>
              <div className="p-6 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-gray-900 text-lg">Pro</div>
                    <div className="text-xs text-gray-400">Small–mid joinery teams</div>
                  </div>
                </div>
                <div className="mb-5">
                  <span className="text-4xl font-black text-gray-900">A${proPrice}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                  {yearly && <div className="text-xs text-green-600 font-bold mt-0.5">Billed annually (A${proPrice * 12}/yr)</div>}
                  {!yearly && <div className="text-xs text-gray-400 mt-0.5">Month-to-month, cancel anytime</div>}
                </div>
                <p className="text-gray-500 text-sm mb-5">
                  For teams that want faster first-pass takeoffs and review-ready quote drafts.
                </p>
                <Button
                  onClick={handleProSubscribe}
                  disabled={checkoutMutation.isPending}
                  className="w-full kindai-btn-primary py-3 rounded-full font-black text-base h-auto mb-5"
                >
                  {checkoutMutation.isPending ? "Loading..." : "Start Pro"}
                </Button>
                <div className="space-y-2.5">
                  {PRO_FEATURES.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Enterprise Pilot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gray-950 rounded-2xl border border-teal-500/40 shadow-xl"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-white text-lg">Enterprise Pilot</div>
                    <div className="text-xs text-gray-400">Larger buyers testing real jobs</div>
                  </div>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-black text-white">A$3K–$7.5K</span>
                  <div className="text-xs text-gray-400 mt-0.5">One-off pilot fee. 30–45 days.</div>
                </div>
                <p className="text-gray-400 text-sm mb-5">
                  A structured pilot with onboarding, pricing-rule setup, sample data import, and weekly review. Success criteria agreed upfront.
                </p>
                <Button
                  onClick={() => navigate("/support")}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-white py-3 rounded-full font-black text-base h-auto mb-5"
                >
                  Book Enterprise Pilot <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <div className="space-y-2.5">
                  {PILOT_FEATURES.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Enterprise */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-gray-900 text-lg">Enterprise</div>
                    <div className="text-xs text-gray-400">Multi-estimator / multi-site firms</div>
                  </div>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-black text-gray-900">Custom</span>
                  <div className="text-xs text-gray-400 mt-0.5">Annual contract. Contact us.</div>
                </div>
                <p className="text-gray-500 text-sm mb-5">
                  For larger cabinet and joinery teams that need rollout support, workflow setup, and higher usage.
                </p>
                <Button
                  onClick={() => navigate("/support")}
                  variant="outline"
                  className="w-full py-3 rounded-full font-black text-base h-auto mb-5 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Talk to Us <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <div className="space-y-2.5">
                  {ENTERPRISE_FEATURES.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            All prices in AUD. GST not included. Need more processing capacity? Add page packs or move to Enterprise.
          </p>
        </div>
      </section>

      {/* Market benchmarks */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              How Kindai Pro compares to the market.
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Priced competitively against direct AI cabinet estimating benchmarks. No per-user fees means lower total cost as your team grows.
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
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">Common questions</h2>
          <div className="space-y-5">
            {[
              {
                q: "Why usage-based (pages) instead of per-user?",
                a: "Multiple people in a cabinet business need to review, approve, or view quotes — admin, estimator, sales, owner. Charging per user creates friction and discourages adoption. We meter by AI processing volume instead, which scales with your actual usage.",
              },
              {
                q: "What counts as an 'AI page'?",
                a: "Each page of a plan, drawing, or document processed by the AI takeoff engine counts as one page. A 10-page tender set = 10 pages. Most commercial joinery jobs run 5–20 pages.",
              },
              {
                q: "What's the difference between the Pilot and Enterprise?",
                a: "The Enterprise Pilot is a structured 30–45 day engagement with hands-on setup, weekly reviews, and agreed success criteria — ideal for businesses that need to validate the tool before committing. Enterprise is an ongoing annual contract for teams that have completed a pilot or are ready to roll out at scale.",
              },
              {
                q: "Can I import my own supplier pricing?",
                a: "Yes. Pro and Enterprise plans support custom pricing libraries. You can set your negotiated rates from Laminex, Polytec, Blum, Häfele, Caesarstone, and any other supplier.",
              },
              {
                q: "Is my data used to train AI models?",
                a: "No. Your uploaded plans, pricing, and job data are never used to train AI models. Your business data is not shared with any third party. Enterprise accounts can request a Data Processing Agreement.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-black text-gray-900 text-sm mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gray-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Ready to give your estimators a faster starting point?
          </h2>
          <p className="text-gray-400 mb-8">
            Start with Pro for your team, or book a structured pilot if you're a larger manufacturer.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={handleProSubscribe}
              size="lg"
              className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              Start Pro — A$299/mo
            </Button>
            <Button
              onClick={() => navigate("/support")}
              size="lg"
              variant="outline"
              className="px-10 py-4 rounded-full text-base font-black h-auto border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Book Enterprise Pilot <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 bg-gray-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <span>© 2026 Kindai. Built for Australian construction businesses.</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</a>
            <a href="/support" className="hover:text-gray-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
