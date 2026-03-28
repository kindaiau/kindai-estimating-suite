import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Check, X, Sparkles, Zap, Building2, ArrowRight, Shield,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const PLAN_ICONS: Record<string, typeof Zap> = {
  free: Zap,
  pro: Sparkles,
  business: Building2,
};

const PLAN_GRADIENTS: Record<string, string> = {
  free: "from-slate-500 to-slate-600",
  pro: "from-pink-500 via-orange-500 to-yellow-500",
  business: "from-blue-500 via-purple-500 to-pink-500",
};

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const cancelled = new URLSearchParams(search).get("cancelled");
  const [yearly, setYearly] = useState(false);
  const { data: plans } = trpc.billing.getPlans.useQuery();
  const { data: subscription } = trpc.billing.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const checkoutMutation = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecting to checkout...");
      window.open(data.url, "_blank");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubscribe = (planId: "pro" | "business") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    checkoutMutation.mutate({
      planId,
      interval: yearly ? "yearly" : "monthly",
      origin: window.location.origin,
    });
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={LOGO_URL} alt="Kindai" className="w-9 h-9 object-contain" />
            <span className="text-lg font-black kindai-gradient-text" style={{ fontFamily: "'Nunito', sans-serif" }}>
              kindai
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="rounded-full font-bold text-sm"
              >
                Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="kindai-btn-primary rounded-full font-bold text-sm"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        {/* Cancelled notice */}
        {cancelled && (
          <div className="mb-8 p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-sm text-center">
            Checkout was cancelled. No worries — choose a plan when you're ready.
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 rounded-full text-xs font-bold border-pink-200 text-pink-600 bg-pink-50">
            <Shield className="w-3 h-3 mr-1.5" /> 14-day money-back guarantee
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            Simple pricing for{" "}
            <span className="kindai-gradient-text">every tradie</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start free. Upgrade when you're winning more jobs than you can handle.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <Label className={`text-sm font-bold ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </Label>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <Label className={`text-sm font-bold ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
              Yearly
            </Label>
            {yearly && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-bold">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {(plans ?? []).map((plan) => {
            const Icon = PLAN_ICONS[plan.id] ?? Zap;
            const gradient = PLAN_GRADIENTS[plan.id] ?? "from-slate-500 to-slate-600";
            const isPopular = plan.popular;
            const isCurrent = subscription?.tier === plan.id;
            const price = yearly ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 sm:p-8 transition-all duration-200 ${
                  isPopular
                    ? "border-pink-400 shadow-xl shadow-pink-500/10 scale-[1.02]"
                    : "border-border hover:border-pink-200 hover:shadow-lg"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="kindai-gradient text-white font-black text-xs px-4 py-1 rounded-full shadow-md">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-foreground">
                      {formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground text-sm font-medium">/mo</span>
                    )}
                  </div>
                  {yearly && price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatPrice(plan.priceYearly)} billed annually
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                {plan.id === "free" ? (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl font-bold h-11 mb-6"
                    onClick={() => {
                      if (!isAuthenticated) {
                        window.location.href = getLoginUrl();
                      } else {
                        navigate("/dashboard");
                      }
                    }}
                  >
                    {isCurrent ? "Current Plan" : "Get Started Free"}
                  </Button>
                ) : (
                  <Button
                    className={`w-full rounded-xl font-bold h-11 mb-6 ${
                      isPopular
                        ? "kindai-btn-primary"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    }`}
                    disabled={isCurrent || checkoutMutation.isPending}
                    onClick={() => handleSubscribe(plan.id as "pro" | "business")}
                  >
                    {isCurrent ? (
                      "Current Plan"
                    ) : checkoutMutation.isPending ? (
                      "Redirecting..."
                    ) : (
                      <>
                        Subscribe <ArrowRight className="w-4 h-4 ml-1.5" />
                      </>
                    )}
                  </Button>
                )}

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      {f.included ? (
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/30 mt-0.5 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          f.included ? "text-foreground font-medium" : "text-muted-foreground/50"
                        }`}
                      >
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm mb-4">Trusted by Australian tradies</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/60 font-bold">
            <span>🔒 Secure Stripe Payments</span>
            <span>🇦🇺 Australian Company</span>
            <span>💳 Cancel Anytime</span>
            <span>📞 Real Human Support</span>
          </div>
        </div>
      </main>
    </div>
  );
}
