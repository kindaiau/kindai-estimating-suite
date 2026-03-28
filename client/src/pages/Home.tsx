import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Zap, Shield, Brain, FileText, Users, BarChart3,
  ChevronRight, CheckCircle2, Star, ArrowRight, HardHat
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const TRADES = [
  { id: "electrical", name: "Electrical", emoji: "⚡", colour: "from-yellow-400 to-orange-500" },
  { id: "plumbing",   name: "Plumbing",   emoji: "🔧", colour: "from-blue-400 to-cyan-500" },
  { id: "carpentry",  name: "Carpentry",  emoji: "🪚", colour: "from-amber-600 to-yellow-500" },
  { id: "concreting", name: "Concreting", emoji: "🏗️", colour: "from-slate-500 to-slate-700" },
  { id: "hvac",       name: "HVAC",       emoji: "❄️", colour: "from-sky-400 to-blue-600" },
  { id: "flooring",   name: "Flooring",   emoji: "🟫", colour: "from-purple-500 to-violet-600" },
  { id: "landscaping",name: "Landscaping",emoji: "🌿", colour: "from-green-400 to-emerald-600" },
  { id: "cabinetry",  name: "Cabinetry",  emoji: "🚪", colour: "from-orange-400 to-red-500" },
  { id: "rendering",  name: "Rendering",  emoji: "🧱", colour: "from-rose-400 to-pink-600" },
  { id: "cabinet-making", name: "Cabinet Making", emoji: "🪵", colour: "from-teal-400 to-green-600" },
];

const FEATURES = [
  { icon: Brain, title: "AI-Powered Takeoff", desc: "Describe the job in plain English — AI extracts quantities, materials, and labour in seconds. No more manual counting.", colour: "text-pink-500 bg-pink-50" },
  { icon: Shield, title: "Australian Compliance", desc: "Auto GST (10%), state licensing prompts (QBCC, VBA, NSW Fair Trading), WHS notices, and AS/NZS standards baked in.", colour: "text-blue-500 bg-blue-50" },
  { icon: FileText, title: "Professional Quotes", desc: "Generate branded, compliant quotes with your ABN, licence number, and trade-specific terms. Quote number auto-generated.", colour: "text-orange-500 bg-orange-50" },
  { icon: Users, title: "Fair Work Labour Rates", desc: "Pre-loaded Award rates for all 10 trades. Overtime, Saturday, Sunday, and public holiday penalty rates calculated automatically.", colour: "text-green-500 bg-green-50" },
  { icon: Zap, title: "10 Trade Workbenches", desc: "Dedicated estimating environments for Electrical, Plumbing, HVAC, Concreting, Flooring, Landscaping, and more.", colour: "text-yellow-500 bg-yellow-50" },
  { icon: BarChart3, title: "Win Rate Dashboard", desc: "Track every quote — sent, accepted, declined. See your win rate, average job value, and total revenue pipeline at a glance.", colour: "text-purple-500 bg-purple-50" },
];

const TESTIMONIALS = [
  { name: "Dave K.", trade: "Electrician, QLD", text: "Cut my quoting time from 2 hours to 15 minutes. The AI just gets it.", stars: 5 },
  { name: "Sarah M.", trade: "Plumber, NSW", text: "Finally a tool that knows Australian compliance. No more googling QBCC requirements.", stars: 5 },
  { name: "Tom R.", trade: "Concretor, VIC", text: "The materials library with waste factors is a game changer. Dead accurate every time.", stars: 5 },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) navigate("/dashboard");
    else window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Kindai" className="h-10 w-10 object-contain" />
            <div>
              <span className="font-black text-xl tracking-tight kindai-gradient-text">kindai</span>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest -mt-0.5">Estimating Suite</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} className="kindai-btn-primary px-5 rounded-full text-sm font-bold">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <>
                <button onClick={handleGetStarted} className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
                  Sign In
                </button>
                <Button onClick={handleGetStarted} className="kindai-btn-primary px-5 rounded-full text-sm font-bold">
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="kindai-hero-bg pt-32 pb-24 px-4 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: "oklch(0.58 0.28 0)" }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: "oklch(0.55 0.22 255)" }} />
        <div className="absolute top-40 right-1/3 w-48 h-48 rounded-full opacity-20 blur-2xl" style={{ background: "oklch(0.88 0.18 88)" }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl blur-2xl opacity-40 kindai-gradient scale-110" />
              <img src={LOGO_URL} alt="Kindai" className="relative w-28 h-28 object-contain drop-shadow-2xl" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Built for Australian Tradies
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
            Quote faster.<br />
            <span className="kindai-gradient-text">Win more jobs.</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered estimating for Australian trades. Generate accurate, compliant quotes in minutes — not hours. Built for electricians, plumbers, concretors, and 7 more trades.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-2xl"
            >
              Start Estimating Free
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              No credit card required
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: "10", label: "Trade Types" },
              { value: "GST", label: "Auto-Calculated" },
              { value: "AI", label: "Powered Takeoff" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
                <div className="text-2xl font-black kindai-gradient-text">{s.value}</div>
                <div className="text-xs text-white/60 mt-0.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trades Grid ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              One platform. <span className="kindai-gradient-text">Every trade.</span>
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Each trade gets its own dedicated workbench with industry-specific materials, labour rates, and compliance requirements.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {TRADES.map((trade) => (
              <button
                key={trade.id}
                onClick={handleGetStarted}
                className="group bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${trade.colour} flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                  {trade.emoji}
                </div>
                <div className="text-sm font-bold text-gray-800">{trade.name}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              Everything a tradie needs to <span className="kindai-gradient-text">quote and win.</span>
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              No fluff. No bloat. Just the tools that actually help you get the job.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl ${f.colour} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compliance Banner ── */}
      <section className="py-16 px-4 kindai-hero-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl" style={{ background: "oklch(0.88 0.18 88)" }} />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-5">
            <Shield className="w-3.5 h-3.5" /> Australian Compliance Built-In
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Compliant quotes, every time.
          </h2>
          <p className="text-white/70 text-base max-w-2xl mx-auto mb-8">
            Auto GST (10%), QBCC, VBA, NSW Fair Trading, SA, WA, TAS, NT, ACT licensing prompts, WHS/OH&S notices, and AS/NZS standards references — all baked in automatically.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["GST 10%", "QBCC", "VBA", "NSW Fair Trading", "WHS/OH&S", "AS/NZS Standards", "Fair Work Act"].map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Tradies love it.</h2>
            <p className="text-gray-500 text-sm">Real feedback from the field.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="text-sm font-bold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.trade}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <img src={LOGO_URL} alt="Kindai" className="w-20 h-20 object-contain mx-auto mb-6" />
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            Ready to quote <span className="kindai-gradient-text">smarter?</span>
          </h2>
          <p className="text-gray-500 text-base mb-8">
            Join Australian tradies already using Kindai to win more jobs with less effort.
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl"
          >
            Get Started — It's Free
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-xs text-gray-400 mt-4">No credit card. No lock-in. Just better quotes.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Kindai" className="h-8 w-8 object-contain" />
            <div>
              <span className="font-black text-base kindai-gradient-text">kindai</span>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Estimating Suite</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            © 2025 Kindai. Built for Australian tradies. GST-compliant by default.
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
