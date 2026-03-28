import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight, Check, X, Sparkles, Building2, HardHat, Users, Crown,
  Calculator, TrendingUp, ChevronRight, Zap, Shield,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const TIER_ICONS: Record<string, typeof Sparkles> = {
  free: Zap,
  solo: HardHat,
  trade_business: Users,
  commercial: Building2,
  enterprise: Crown,
};

const TIER_GRADIENTS: Record<string, string> = {
  free: "from-slate-500 to-slate-600",
  solo: "from-pink-500 to-orange-500",
  trade_business: "from-orange-500 to-yellow-500",
  commercial: "from-blue-500 to-purple-600",
  enterprise: "from-purple-600 to-pink-600",
};

const TIER_BORDERS: Record<string, string> = {
  free: "border-slate-200",
  solo: "border-pink-300 shadow-pink-100",
  trade_business: "border-orange-300 shadow-orange-100",
  commercial: "border-blue-300 shadow-blue-100",
  enterprise: "border-purple-300 shadow-purple-100",
};

// ROI data for each tier
const ROI_DATA: Record<string, { replaces: string; cost: string; savings: string; roi: string }> = {
  solo: {
    replaces: "5-10 hrs/wk of manual quoting",
    cost: "$588/yr",
    savings: "$30,000+/yr in time saved",
    roi: "55x return",
  },
  trade_business: {
    replaces: "Part-time estimator ($50K/yr)",
    cost: "$1,908/yr",
    savings: "$48,000+/yr",
    roi: "26x return",
  },
  commercial: {
    replaces: "Full-time estimator ($130K/yr)",
    cost: "$7,668/yr",
    savings: "$122,000+/yr",
    roi: "17x return",
  },
  enterprise: {
    replaces: "2-3 estimators ($300K+/yr)",
    cost: "$14,388/yr",
    savings: "$285,000+/yr",
    roi: "22x return",
  },
};

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [yearly, setYearly] = useState(true);

  const { data: plans } = trpc.billing.getPlans.useQuery();
  const checkoutMutation = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Opening Stripe checkout...");
      window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    checkoutMutation.mutate({
      planId: planId as "solo" | "trade_business" | "commercial" | "enterprise",
      interval: yearly ? "yearly" : "monthly",
      origin: window.location.origin,
    });
  };

  const displayPlans = plans ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src={LOGO_URL} alt="Kindai" className="h-8 w-8" />
            <span className="text-lg font-black text-white">kindai</span>
          </button>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded-full text-sm font-bold border-white/20 text-white hover:bg-white/10">
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())} variant="outline" className="rounded-full text-sm font-bold border-white/20 text-white hover:bg-white/10">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 rounded-full px-4 py-1.5 text-sm font-bold mb-6">
            <Calculator className="w-3.5 h-3.5 mr-1.5" />
            Value-Based Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
            Pay based on what{" "}
            <span className="bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              you save
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            An Australian estimator costs $95K-$150K per year. Kindai does 80% of that work.
            Choose the tier that matches your business size.
          </p>

          {/* Yearly/Monthly Toggle */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className={`text-sm font-bold ${!yearly ? "text-white" : "text-slate-500"}`}>Monthly</span>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <span className={`text-sm font-bold ${yearly ? "text-white" : "text-slate-500"}`}>Yearly</span>
            {yearly && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 rounded-full text-xs font-bold">
                Save 20%
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Estimator Cost Comparison Banner */}
      <section className="px-4 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-red-400">$130K+</div>
                <div className="text-sm text-slate-400 mt-1">Full-time estimator<br />(loaded cost/yr)</div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-2xl font-black text-slate-500">vs</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-green-400">$7.7K</div>
                <div className="text-sm text-slate-400 mt-1">Kindai Commercial<br />(per year)</div>
              </div>
            </div>
            <div className="text-center mt-4">
              <span className="text-lg font-black text-yellow-400">That's a 17x return on investment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Main 3 tiers (Solo, Trade Business, Commercial) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {displayPlans.filter((p) => ["solo", "trade_business", "commercial"].includes(p.id)).map((plan) => {
              const Icon = TIER_ICONS[plan.id] ?? Zap;
              const gradient = TIER_GRADIENTS[plan.id] ?? "from-slate-500 to-slate-600";
              const border = TIER_BORDERS[plan.id] ?? "border-slate-200";
              const roi = ROI_DATA[plan.id];
              const monthlyPrice = yearly
                ? Math.round(plan.priceYearly / 12 / 100)
                : plan.priceMonthly / 100;

              return (
                <Card
                  key={plan.id}
                  className={`relative bg-slate-900 border-2 ${border} shadow-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl ${
                    plan.popular ? "ring-2 ring-pink-500/50" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-center text-xs font-black py-1.5 uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className={`pb-2 ${plan.popular ? "pt-10" : "pt-6"}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">{plan.name}</h3>
                        <p className="text-xs text-slate-400 font-bold">{plan.tagline}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      <span className="text-5xl font-black text-white">${monthlyPrice}</span>
                      <span className="text-slate-400 text-sm font-bold">/mo</span>
                      {yearly && (
                        <div className="text-xs text-green-400 font-bold mt-0.5">
                          Billed yearly (${(plan.priceYearly / 100).toLocaleString()}/yr)
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* ROI Badge */}
                    {roi && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-xs font-black text-green-400 uppercase">{roi.roi}</span>
                        </div>
                        <p className="text-xs text-green-300/80">
                          Replaces: {roi.replaces}
                        </p>
                        <p className="text-xs text-green-300/80">
                          You save: <strong className="text-green-400">{roi.savings}</strong>
                        </p>
                      </div>
                    )}

                    <Separator className="bg-slate-700" />

                    {/* Features */}
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          {f.included ? (
                            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                          )}
                          <span className={f.included ? "text-slate-300" : "text-slate-600"}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={checkoutMutation.isPending}
                      className={`w-full rounded-full font-black text-sm py-5 bg-gradient-to-r ${gradient} text-white hover:opacity-90 transition-opacity`}
                    >
                      {checkoutMutation.isPending ? "Loading..." : "Get Started"}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Free + Enterprise row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Tier */}
            {displayPlans.filter((p) => p.id === "free").map((plan) => (
              <Card key={plan.id} className="bg-slate-900/50 border border-slate-700 overflow-hidden">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-slate-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white">{plan.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{plan.description}</p>
                    <p className="text-xs text-slate-500 mt-1">3 estimates/mo, 1 AI takeoff, 5 projects</p>
                  </div>
                  <Button
                    onClick={() => isAuthenticated ? navigate("/dashboard") : (window.location.href = getLoginUrl())}
                    variant="outline"
                    className="rounded-full font-bold text-sm border-slate-600 text-slate-300 hover:bg-slate-800 flex-shrink-0"
                  >
                    Try Free <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Enterprise Tier */}
            {displayPlans.filter((p) => p.id === "enterprise").map((plan) => (
              <Card key={plan.id} className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 overflow-hidden">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white">{plan.name}</h3>
                    <p className="text-sm text-slate-300 mt-0.5">{plan.description}</p>
                    <p className="text-xs text-purple-300 mt-1 font-bold">
                      From ${yearly ? "1,199" : "1,499"}/mo — Unlimited everything, dedicated support, custom integrations
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs rounded-full">
                        <TrendingUp className="w-3 h-3 mr-1" /> Saves $285K+/yr
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs rounded-full">
                        <Shield className="w-3 h-3 mr-1" /> SLA-backed
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={checkoutMutation.isPending}
                    className="rounded-full font-black text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 flex-shrink-0"
                  >
                    Contact Sales <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-white mb-8">
            How Kindai compares to{" "}
            <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
              the competition
            </span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800">
                  <th className="text-left p-4 font-black text-white">Software</th>
                  <th className="text-left p-4 font-black text-white">Annual Cost</th>
                  <th className="text-left p-4 font-black text-white">AI Takeoff</th>
                  <th className="text-left p-4 font-black text-white">Trade-Specific</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {[
                  { name: "Procore", cost: "$20K-$150K+", ai: "Limited", trade: "No" },
                  { name: "PlanSwift", cost: "$1,749/yr", ai: "No", trade: "No" },
                  { name: "Bluebeam", cost: "$3,240/yr", ai: "No", trade: "No" },
                  { name: "Buildxact", cost: "$3,588-$7,188/yr", ai: "Basic", trade: "Resi only" },
                  { name: "Xactimate", cost: "$2,690/yr", ai: "No", trade: "Insurance" },
                  { name: "CostX (RIB)", cost: "$10K-$30K+/yr", ai: "No", trade: "No" },
                ].map((comp) => (
                  <tr key={comp.name} className="bg-slate-900 hover:bg-slate-800/80">
                    <td className="p-4 text-slate-300 font-bold">{comp.name}</td>
                    <td className="p-4 text-red-400 font-bold">{comp.cost}</td>
                    <td className="p-4 text-slate-400">{comp.ai}</td>
                    <td className="p-4 text-slate-400">{comp.trade}</td>
                  </tr>
                ))}
                <tr className="bg-gradient-to-r from-pink-900/30 to-orange-900/30">
                  <td className="p-4 text-white font-black flex items-center gap-2">
                    <img src={LOGO_URL} className="w-5 h-5" alt="" /> Kindai
                  </td>
                  <td className="p-4 text-green-400 font-black">$468-$14.4K/yr</td>
                  <td className="p-4 text-green-400 font-bold">
                    <Check className="w-4 h-4 inline mr-1" />Vision AI
                  </td>
                  <td className="p-4 text-green-400 font-bold">
                    <Check className="w-4 h-4 inline mr-1" />10 trades
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="px-4 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black text-white mb-4">Built for Australian tradies</h2>
          <p className="text-slate-400 mb-6">
            GST-compliant, Fair Work Act labour rates, state-based licensing (QBCC, VBA, NSW Fair Trading),
            AS/NZS standards references, and pricing in AUD. This isn't an American tool with a currency converter.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Electrical", "Plumbing", "Carpentry", "HVAC", "Flooring", "Concreting", "Landscaping", "Cabinetry", "Rendering", "Cabinet Making"].map((trade) => (
              <Badge key={trade} className="bg-slate-800 text-slate-300 border-slate-700 rounded-full text-xs font-bold px-3 py-1">
                {trade}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Test mode notice */}
      <section className="px-4 pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm text-center">
            <strong>Test Mode:</strong> Use card <code className="bg-yellow-500/20 px-1.5 py-0.5 rounded font-mono text-xs">4242 4242 4242 4242</code> with any future expiry and any CVC.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Kindai" className="h-6 w-6" />
            <span className="text-sm font-bold text-slate-500">Kindai Estimating Suite</span>
          </div>
          <p className="text-xs text-slate-600">All prices in AUD. GST inclusive where applicable.</p>
        </div>
      </footer>
    </div>
  );
}
