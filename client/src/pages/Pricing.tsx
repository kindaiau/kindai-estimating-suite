import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight, Check, X, Sparkles, Building2, HardHat, Users, Crown,
  Calculator, TrendingUp, ChevronRight, Zap, Shield, AlertTriangle,
  DollarSign, Clock, FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { pixelViewPricingPage, pixelInitiateCheckout } from "@/lib/metaPixel";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const TIER_ICONS: Record<string, typeof Sparkles> = {
  free: Zap,
  sole_trader: HardHat,
  small_builder: Users,
  mid_builder: Building2,
  enterprise: Crown,
};

const TIER_GRADIENTS: Record<string, string> = {
  free: "from-slate-500 to-slate-600",
  sole_trader: "from-pink-500 to-orange-500",
  small_builder: "from-orange-500 to-yellow-500",
  mid_builder: "from-blue-500 to-purple-600",
  enterprise: "from-purple-600 to-pink-600",
};

const TIER_BORDERS: Record<string, string> = {
  free: "border-slate-700",
  sole_trader: "border-pink-500/40 shadow-pink-900/20",
  small_builder: "border-orange-500/40 shadow-orange-900/20",
  mid_builder: "border-blue-500/40 shadow-blue-900/20",
  enterprise: "border-purple-500/40 shadow-purple-900/20",
};

// Real 2024-25 Australian data — fully loaded cost of an estimator
const ROI_DATA: Record<string, {
  replaces: string;
  annualCost: string;
  kindaiCost: string;
  savings: string;
  roi: string;
  payback: string;
}> = {
  sole_trader: {
    replaces: "8–12 hrs/week of manual quoting",
    annualCost: "$35,000 in lost billable time",
    kindaiCost: "$1,428/yr (annual plan)",
    savings: "$33,500+/yr",
    roi: "24x return",
    payback: "Pays for itself in 2 weeks",
  },
  small_builder: {
    replaces: "Part-time estimator ($55K–$75K loaded cost)",
    annualCost: "$65,000/yr (salary + super + leave + on-costs)",
    kindaiCost: "$4,788/yr (annual plan)",
    savings: "$60,000+/yr",
    roi: "13x return",
    payback: "Pays for itself in 4 weeks",
  },
  mid_builder: {
    replaces: "Full-time estimator ($130K–$180K loaded cost)",
    annualCost: "$155,000/yr (salary + super + leave + on-costs + risk)",
    kindaiCost: "$14,388/yr (annual plan)",
    savings: "$140,000+/yr",
    roi: "11x return",
    payback: "Pays for itself in 5 weeks",
  },
  enterprise: {
    replaces: "2–3 full-time estimators ($300K–$450K loaded cost)",
    annualCost: "$350,000+/yr estimating team",
    kindaiCost: "Custom — typically $38K–$48K/yr",
    savings: "$300,000+/yr",
    roi: "8–15x return",
    payback: "Typically pays back in year one",
  },
};

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [yearly, setYearly] = useState(true);
  const [roiTier, setRoiTier] = useState<string>("mid_builder");

  const { data: plans } = trpc.billing.getPlans.useQuery();
  const checkoutMutation = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Opening Stripe checkout...");
      window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  // Fire ViewContent pixel event on mount
  useEffect(() => { pixelViewPricingPage(); }, []);

  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    // Fire InitiateCheckout pixel event
    const plan = displayPlans.find((p) => p.id === planId);
    if (plan) {
      pixelInitiateCheckout({
        content_name: plan.name,
        value: yearly ? (plan.priceYearly ?? plan.priceMonthly) : plan.priceMonthly,
      });
    }
    checkoutMutation.mutate({
      planId: planId as "sole_trader" | "small_builder" | "mid_builder" | "enterprise",
      interval: yearly ? "yearly" : "monthly",
      origin: window.location.origin,
    });
  };

  const displayPlans = plans ?? [];
  const selectedRoi = ROI_DATA[roiTier];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO
        title="Pricing | Kindai Estimating Suite"
        description="Affordable AI estimating software for Australian trades. Plans from $149/month. Replace your $120K estimator. Free trial available. Solo tradies to $100M builders."
        canonical="/pricing"
        keywords="construction estimating software price Australia, estimating software cost, trade quoting software pricing, builder software subscription Australia, Buildxact alternative, Procore alternative"
      />
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

      {/* Hero — Enterprise Positioning */}
      <section className="pt-16 pb-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 rounded-full px-4 py-1.5 text-sm font-bold mb-6">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            The true cost of your estimator is higher than you think
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-5">
            Stop paying{" "}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              $130K–$180K/yr
            </span>
            <br />for a full-time estimator.
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-4">
            Kindai does 80% of a senior estimator's work — AI Vision Takeoff, trade pricing, GST compliance, supplier recommendations — for a fraction of the cost.
          </p>
          <p className="text-base text-slate-500 max-w-2xl mx-auto mb-10">
            And unlike a human estimator, Kindai never underquotes because it was rushed, never takes sick leave, and never leaves for a competitor.
          </p>

          {/* Yearly/Monthly Toggle */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className={`text-sm font-bold ${!yearly ? "text-white" : "text-slate-500"}`}>Monthly</span>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <span className={`text-sm font-bold ${yearly ? "text-white" : "text-slate-500"}`}>Annual</span>
            {yearly && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 rounded-full text-xs font-bold">
                Save 20%
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-600 mb-8">All prices in AUD. GST not included.</p>
        </div>
      </section>

      {/* The Real Cost Banner */}
      <section className="px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-red-950/60 to-orange-950/60 border border-red-500/30 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-black text-white text-center mb-6">
              The true cost of a full-time estimator in Australia (2024–25)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
              {[
                { label: "Base salary", value: "$95K–$182K", icon: DollarSign },
                { label: "Super (11.5%)", value: "+$11K–$21K", icon: TrendingUp },
                { label: "Leave + on-costs", value: "+$12K–$25K", icon: Clock },
                { label: "Underquoting risk", value: "$40K–$75K/job", icon: AlertTriangle },
              ].map((item) => (
                <div key={item.label} className="bg-red-900/30 rounded-xl p-3">
                  <item.icon className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
                  <div className="text-lg font-black text-red-300">{item.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="text-center border-t border-red-500/20 pt-4">
              <span className="text-2xl font-black text-red-300">Total loaded cost: $118,000 – $228,000/yr</span>
              <p className="text-sm text-slate-500 mt-1">Plus the risk of one bad quote wiping out 3–6 months of profit</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards — 3 main tiers */}
      <section className="px-4 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {displayPlans.filter((p) => ["sole_trader", "small_builder", "mid_builder"].includes(p.id)).map((plan) => {
              const Icon = TIER_ICONS[plan.id] ?? Zap;
              const gradient = TIER_GRADIENTS[plan.id] ?? "from-slate-500 to-slate-600";
              const border = TIER_BORDERS[plan.id] ?? "border-slate-700";
              const roi = ROI_DATA[plan.id];
              const monthlyPrice = yearly
                ? Math.round(plan.priceYearly / 12 / 100)
                : plan.priceMonthly / 100;
              const annualPrice = plan.priceYearly / 100;

              return (
                <Card
                  key={plan.id}
                  className={`relative bg-slate-900 border-2 ${border} shadow-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl ${
                    plan.popular ? "ring-2 ring-orange-500/60" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-center text-xs font-black py-1.5 uppercase tracking-wider">
                      ⭐ Most Popular — Best Value
                    </div>
                  )}
                  <CardHeader className={`pb-2 ${plan.popular ? "pt-10" : "pt-6"}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">{plan.name}</h3>
                        <p className="text-xs text-slate-400 font-semibold">{plan.tagline}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-1">
                      <span className="text-5xl font-black text-white">${monthlyPrice.toLocaleString()}</span>
                      <span className="text-slate-400 text-sm font-bold">/mo</span>
                    </div>
                    {yearly && (
                      <div className="text-xs text-green-400 font-bold mb-2">
                        ${annualPrice.toLocaleString()}/yr billed annually — save ${((plan.priceMonthly * 12 / 100) - annualPrice).toLocaleString()}
                      </div>
                    )}
                    <p className="text-sm text-slate-400 leading-relaxed">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* ROI Badge */}
                    {roi && (
                      <div className="bg-green-500/10 border border-green-500/25 rounded-xl p-3.5">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-sm font-black text-green-400">{roi.roi} — {roi.payback}</span>
                        </div>
                        <div className="space-y-1 text-xs text-slate-400">
                          <div className="flex justify-between">
                            <span>Replaces:</span>
                            <span className="text-slate-300 font-semibold text-right ml-2">{roi.replaces}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>You save:</span>
                            <span className="text-green-400 font-black">{roi.savings}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator className="bg-slate-800" />

                    {/* Features */}
                    <ul className="space-y-2">
                      {plan.features.slice(0, 8).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          {f.included ? (
                            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-slate-700 mt-0.5 flex-shrink-0" />
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
                      className={`w-full rounded-full font-black text-sm py-5 bg-gradient-to-r ${gradient} text-white hover:opacity-90 transition-opacity shadow-lg`}
                    >
                      {checkoutMutation.isPending ? "Loading..." : "Get Started Today"}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                    <p className="text-center text-xs text-slate-600">No lock-in contract. Cancel anytime.</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Free Trial + Enterprise row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Trial */}
            {displayPlans.filter((p) => p.id === "free").map((plan) => (
              <Card key={plan.id} className="bg-slate-900/50 border border-slate-700 overflow-hidden">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white">{plan.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{plan.description}</p>
                    <p className="text-xs text-slate-600 mt-1">3 estimates · 3 AI takeoffs · 5 projects · No credit card</p>
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

            {/* Enterprise */}
            {displayPlans.filter((p) => p.id === "enterprise").map((plan) => (
              <Card key={plan.id} className="bg-gradient-to-br from-purple-950/60 to-pink-950/60 border-2 border-purple-500/40 overflow-hidden">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white">{plan.name} — Custom Pricing</h3>
                    <p className="text-sm text-slate-300 mt-0.5">{plan.tagline}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs rounded-full">
                        <TrendingUp className="w-3 h-3 mr-1" /> Saves $300K+/yr
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs rounded-full">
                        <Shield className="w-3 h-3 mr-1" /> SLA-backed
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs rounded-full">
                        Procore integration
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={checkoutMutation.isPending}
                    className="rounded-full font-black text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 flex-shrink-0"
                  >
                    Talk to Sales <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-black text-white">ROI Calculator — Your Business</h2>
            </div>
            <p className="text-sm text-slate-400 mb-6">Select your business size to see your exact return on investment:</p>

            {/* Tier Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { id: "sole_trader", label: "Sole Trader", sub: "1–2 people" },
                { id: "small_builder", label: "Small Builder", sub: "3–15 staff" },
                { id: "mid_builder", label: "Mid-Tier Builder", sub: "15–100 staff" },
                { id: "enterprise", label: "Enterprise", sub: "100+ staff" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setRoiTier(t.id)}
                  className={`rounded-xl p-3 text-center transition-all border ${
                    roiTier === t.id
                      ? "bg-green-500/20 border-green-500/50 text-green-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  <div className="text-sm font-black">{t.label}</div>
                  <div className="text-xs mt-0.5 opacity-70">{t.sub}</div>
                </button>
              ))}
            </div>

            {/* ROI Results */}
            {selectedRoi && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="text-xs font-black text-red-400 uppercase tracking-wider mb-2">Without Kindai</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Replaces:</span>
                      <span className="text-slate-300 font-semibold text-right ml-2 max-w-[180px]">{selectedRoi.replaces}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Annual cost:</span>
                      <span className="text-red-400 font-black">{selectedRoi.annualCost}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="text-xs font-black text-green-400 uppercase tracking-wider mb-2">With Kindai</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kindai cost:</span>
                      <span className="text-slate-300 font-semibold">{selectedRoi.kindaiCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">You save:</span>
                      <span className="text-green-400 font-black text-base">{selectedRoi.savings}</span>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-green-400">{selectedRoi.roi}</div>
                  <div className="text-sm text-green-300/80 mt-1">{selectedRoi.payback}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-white mb-3">
            How Kindai compares to{" "}
            <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
              everything else
            </span>
          </h2>
          <p className="text-center text-slate-500 text-sm mb-8">The only platform with AI Vision Takeoff built for Australian trades</p>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800">
                  <th className="text-left p-4 font-black text-white">Option</th>
                  <th className="text-left p-4 font-black text-white">Annual Cost</th>
                  <th className="text-center p-4 font-black text-white">AI Takeoff</th>
                  <th className="text-center p-4 font-black text-white">AU Trades</th>
                  <th className="text-center p-4 font-black text-white">GST/Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  { name: "Full-time estimator", cost: "$118K–$228K/yr", ai: "No", trade: "Manual", gst: "Manual", highlight: "red" },
                  { name: "Procore", cost: "$20K–$150K+/yr", ai: "Limited", trade: "No", gst: "No", highlight: null },
                  { name: "PlanSwift", cost: "$2,040/yr", ai: "No", trade: "No", gst: "No", highlight: null },
                  { name: "Buildxact", cost: "$1,788–$4,788/yr", ai: "Basic", trade: "Resi only", gst: "Partial", highlight: null },
                  { name: "Cubit (Buildsoft)", cost: "$1,188–$3,588/yr", ai: "No", trade: "No", gst: "No", highlight: null },
                  { name: "CostX / RIB", cost: "$10K–$30K+/yr", ai: "No", trade: "No", gst: "No", highlight: null },
                ].map((comp) => (
                  <tr key={comp.name} className={`${comp.highlight === "red" ? "bg-red-950/30" : "bg-slate-900"} hover:bg-slate-800/60`}>
                    <td className={`p-4 font-bold ${comp.highlight === "red" ? "text-red-300" : "text-slate-300"}`}>{comp.name}</td>
                    <td className={`p-4 font-bold ${comp.highlight === "red" ? "text-red-400" : "text-slate-400"}`}>{comp.cost}</td>
                    <td className="p-4 text-center text-slate-500">{comp.ai}</td>
                    <td className="p-4 text-center text-slate-500">{comp.trade}</td>
                    <td className="p-4 text-center text-slate-500">{comp.gst}</td>
                  </tr>
                ))}
                <tr className="bg-gradient-to-r from-green-950/50 to-emerald-950/50 border-t-2 border-green-500/40">
                  <td className="p-4 font-black text-white flex items-center gap-2">
                    <img src={LOGO_URL} className="w-5 h-5" alt="" /> Kindai
                  </td>
                  <td className="p-4 text-green-400 font-black">$1,428–$38K/yr</td>
                  <td className="p-4 text-center">
                    <span className="text-green-400 font-black flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" /> Vision AI
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-green-400 font-black flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" /> 10 trades
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-green-400 font-black flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" /> Full AU
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Risk Elimination Section */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-black text-white mb-2 text-center">
              The risk you're not pricing in
            </h2>
            <p className="text-slate-400 text-sm text-center mb-6">
              One underquoted job can cost more than a full year of Kindai.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: AlertTriangle,
                  title: "Underquoting risk",
                  desc: "Average underquote on a $500K job = 8–15% = $40K–$75K loss. One bad quote wipes out months of profit.",
                  color: "text-red-400",
                  bg: "bg-red-500/10 border-red-500/20",
                },
                {
                  icon: Clock,
                  title: "Quoting time cost",
                  desc: "Manual takeoffs take 8–20 hours per job. At $85/hr, that's $680–$1,700 of your time per quote.",
                  color: "text-orange-400",
                  bg: "bg-orange-500/10 border-orange-500/20",
                },
                {
                  icon: FileText,
                  title: "Missed opportunities",
                  desc: "Slow quoting = lost jobs. Kindai quotes in 60 seconds. You can tender 10x more jobs per week.",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10 border-blue-500/20",
                },
              ].map((item) => (
                <div key={item.title} className={`${item.bg} border rounded-xl p-4`}>
                  <item.icon className={`w-6 h-6 ${item.color} mb-2`} />
                  <h3 className="font-black text-white text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Australian-built trust section */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-black text-white mb-3">Built for Australian construction. Not adapted from overseas.</h2>
          <p className="text-slate-400 text-sm mb-6">
            GST (10%), Fair Work Act labour rates, state licensing (QBCC, VBA, NSW Fair Trading, SA, WA, TAS, NT, ACT),
            AS/NZS standards, and AUD pricing. Not an American tool with a currency converter bolted on.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Electrical", "Plumbing", "Carpentry", "HVAC", "Flooring", "Concreting", "Landscaping", "Cabinet Making & Joinery", "Rendering", "Painting", "Bricklaying", "Roofing", "Tiling", "Waterproofing", "Fire Protection", "Glazing", "Quantity Surveying", "Demolition", "Swimming Pool", "Steel Fabrication"].map((trade) => (
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
            <strong>Test Mode Active:</strong> Use card <code className="bg-yellow-500/20 px-1.5 py-0.5 rounded font-mono text-xs">4242 4242 4242 4242</code> with any future expiry and any CVC to test checkout.
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
          <p className="text-xs text-slate-600">All prices in AUD. Prices exclude GST. No lock-in contracts.</p>
        </div>
      </footer>
    </div>
  );
}
