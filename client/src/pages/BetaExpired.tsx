import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Sparkles,
  Zap,
  Shield,
  Camera,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const FEATURES = [
  {
    icon: Camera,
    title: "AI Vision Takeoff",
    desc: "Upload plans, get quantities in minutes — not hours",
  },
  {
    icon: Sparkles,
    title: "Smart Estimating",
    desc: "AI-powered line items with real Australian pricing",
  },
  {
    icon: Shield,
    title: "Auto-SWMS",
    desc: "Generate compliant safety docs from your estimate data",
  },
  {
    icon: FileText,
    title: "Professional Quotes",
    desc: "Branded PDFs with digital acceptance and e-signatures",
  },
  {
    icon: TrendingUp,
    title: "Accuracy Dashboard",
    desc: "Track your win rate and estimating accuracy over time",
  },
  {
    icon: Zap,
    title: "Voice Estimating",
    desc: "Dictate scope notes and let AI build the estimate",
  },
];

export default function BetaExpired() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const checkoutMutation = trpc.billing.createProTrialCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Opening checkout — complete your upgrade to keep building");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Could not start checkout");
    },
  });

  const handleUpgrade = () => {
    checkoutMutation.mutate({ origin: window.location.origin });
  };

  const firstName = user?.name?.split(" ")[0] ?? "mate";

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* ── Rainbow top bar ── */}
      <div
        className="h-1 w-full"
        style={{
          background:
            "linear-gradient(90deg, oklch(58% .28 0), oklch(68% .22 40), oklch(88% .18 88), oklch(72% .25 145), oklch(55% .22 255), oklch(55% .25 310))",
        }}
      />

      {/* ── Background ── */}
      <div className="absolute inset-0 bg-[#fafafa]" />
      <div
        className="absolute top-[-20%] right-[-15%] w-[50vw] h-[50vw] rounded-full opacity-8 blur-[150px]"
        style={{ background: "oklch(58% .28 0)" }}
      />
      <div
        className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full opacity-6 blur-[120px]"
        style={{ background: "oklch(72% .25 145)" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        {/* ── Logo ── */}
        <div className="flex justify-center mb-10">
          <img src={LOGO_URL} alt="Kindai" className="w-14 h-14" />
        </div>

        {/* ── Hero Message ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold mb-6">
            <Clock className="w-4 h-4" />
            Beta period ended
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4"
            style={{ fontFamily: "Nunito, sans-serif", color: "oklch(12% .02 270)" }}
          >
            Thanks for testing Kindai,{" "}
            <span
              className="inline-block"
              style={{
                background:
                  "linear-gradient(135deg, rgb(244,10,91), rgb(252,66,55) 22%, rgb(183,158,5) 45%, rgb(84,192,23) 60%, rgb(0,170,80) 68%, rgb(50,80,200) 85%, rgb(100,50,180) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {firstName}.
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: "oklch(52% .018 270)" }}
          >
            Your free beta access has ended. The good news? Everything you built
            is still here — your projects, estimates, and data are safe. Upgrade
            to Pro to pick up right where you left off.
          </p>
        </div>

        {/* ── Upgrade Card ── */}
        <div
          className="relative rounded-3xl p-8 sm:p-10 mb-12 overflow-hidden"
          style={{
            background: "white",
            border: "1px solid oklch(90% .006 270)",
            boxShadow:
              "0 0 0 1px oklch(58% .28 0 / 0.08), 0 20px 60px oklch(58% .28 0 / 0.08), 0 4px 16px oklch(0% 0 0 / 0.04)",
          }}
        >
          {/* Subtle gradient glow at top */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
            style={{
              background:
                "linear-gradient(90deg, oklch(58% .28 0), oklch(68% .22 40), oklch(88% .18 88), oklch(72% .25 145))",
            }}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5" style={{ color: "oklch(58% .28 0)" }} />
                <span
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: "oklch(58% .28 0)" }}
                >
                  Pro Plan
                </span>
              </div>
              <h2
                className="text-3xl sm:text-4xl font-black"
                style={{ fontFamily: "Nunito, sans-serif", color: "oklch(12% .02 270)" }}
              >
                A$9<span className="text-lg font-medium" style={{ color: "oklch(52% .018 270)" }}>/month</span>
              </h2>
              <p className="text-sm mt-1" style={{ color: "oklch(52% .018 270)" }}>
                7-day free trial included — cancel anytime
              </p>
            </div>

            <Button
              onClick={handleUpgrade}
              disabled={checkoutMutation.isPending}
              className="h-14 px-8 rounded-full text-base font-bold gap-2 text-white shrink-0"
              style={{
                background: "oklch(58% .28 0)",
                boxShadow:
                  "0 0 20px oklch(58% .28 0 / 0.25), 0 0 40px oklch(58% .28 0 / 0.1)",
              }}
            >
              {checkoutMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: "oklch(96% .005 270)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "oklch(58% .28 0 / 0.1)" }}
                >
                  <f.icon className="w-4.5 h-4.5" style={{ color: "oklch(58% .28 0)" }} />
                </div>
                <div>
                  <p
                    className="font-bold text-sm"
                    style={{ fontFamily: "Nunito, sans-serif", color: "oklch(12% .02 270)" }}
                  >
                    {f.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(52% .018 270)" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust / Data Safety ── */}
        <div className="text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: "oklch(52% .018 270)" }}>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" style={{ color: "oklch(72% .25 145)" }} />
              Your data is safe
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" style={{ color: "oklch(72% .25 145)" }} />
              Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" style={{ color: "oklch(72% .25 145)" }} />
              7-day free trial
            </span>
          </div>

          <button
            onClick={() => navigate("/pricing")}
            className="text-sm underline hover:no-underline transition-all"
            style={{ color: "oklch(52% .018 270)" }}
          >
            Compare all plans
          </button>

          <p className="text-xs" style={{ color: "oklch(72% .015 270)" }}>
            Questions? Email{" "}
            <a
              href="mailto:matt@kindaiestimator.com"
              className="underline"
              style={{ color: "oklch(58% .28 0)" }}
            >
              matt@kindaiestimator.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
