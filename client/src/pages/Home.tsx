import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { SoftwareAppSchema, OrganizationSchema, FAQSchema } from "@/components/StructuredData";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Brain, FileText, Users, BarChart3,
  ChevronRight, CheckCircle2, Star, ArrowRight, HardHat,
  Camera, Sparkles, DollarSign, Truck, Clock, Upload, Play
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef } from "react";

// Reusable scroll-triggered fade-up wrapper
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
  { id: "cabinetry", name: "Cabinet Making", emoji: "🪵", colour: "from-teal-400 to-green-600" },
];

const FEATURES = [
  { icon: Camera, title: "Scan Plans with AI Vision", desc: "Photograph or upload your plans. AI reads every symbol, counts every fixture, measures every room — and generates a full takeoff in seconds.", colour: "text-pink-500 bg-pink-50" },
  { icon: DollarSign, title: "Retail vs Trade Pricing", desc: "See both retail (Bunnings) and trade supplier pricing side-by-side. Know exactly how much you save buying trade — and set your markup.", colour: "text-green-500 bg-green-50" },
  { icon: Truck, title: "Supplier Recommendations", desc: "Get matched with the best trade suppliers for your state. Send material orders directly and get the best pricing on every job.", colour: "text-orange-500 bg-orange-50" },
  { icon: Shield, title: "Australian Compliance", desc: "Auto GST (10%), state licensing prompts (QBCC, VBA, NSW Fair Trading), WHS notices, and AS/NZS standards baked into every quote.", colour: "text-blue-500 bg-blue-50" },
  { icon: Users, title: "Fair Work Labour Rates", desc: "Pre-loaded Award rates for all 10 trades. Overtime, Saturday, Sunday, and public holiday penalty rates calculated automatically.", colour: "text-cyan-500 bg-cyan-50" },
  { icon: BarChart3, title: "Win Rate Dashboard", desc: "Track every quote — sent, accepted, declined. See your win rate, average job value, and total revenue pipeline at a glance.", colour: "text-purple-500 bg-purple-50" },
];

const TESTIMONIALS = [
  { name: "Dave K.", trade: "Electrician, QLD", text: "I photographed the plans on my phone and had a full quote in 3 minutes. This is insane.", stars: 5 },
  { name: "Sarah M.", trade: "Plumber, NSW", text: "The trade vs retail pricing comparison alone saves me thousands a year. Plus it knows QBCC.", stars: 5 },
  { name: "Tom R.", trade: "Concretor, VIC", text: "Scanned a set of plans, AI counted every slab and footing. Dead accurate with waste factors.", stars: 5 },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Snap or Upload", desc: "Take a photo of your plans on your phone, or upload a PDF from your computer.", icon: Camera, colour: "from-pink-500 to-rose-500" },
  { step: "2", title: "AI Analyses", desc: "Our AI reads every symbol, counts fixtures, measures rooms, and identifies all materials needed.", icon: Sparkles, colour: "from-orange-500 to-yellow-500" },
  { step: "3", title: "Get Your Quote", desc: "Full materials list with retail vs trade pricing, labour hours, your markup, and GST — ready to send.", icon: FileText, colour: "from-green-500 to-emerald-500" },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) navigate("/ai-takeoff");
    else window.location.href = getLoginUrl();
  };

  const handleTryAI = () => {
    if (isAuthenticated) navigate("/ai-takeoff");
    else window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Kindai Estimating Suite | AI-Powered Quoting for Australian Trades"
        description="AI estimating software for Australian tradies and builders. Scan plans with your phone, get instant takeoffs, send branded quotes with GST in 60 seconds. 20 trades covered. Free beta access."
        canonical="/"
        keywords="construction estimating software Australia, AI estimating software, trade quoting software Australia, builder quoting app, electrical estimating software Australia, plumbing estimating software, tradie quoting app, construction takeoff software Australia, AI takeoff, quote builder tradies, GST quoting software, QBCC estimating, VBA builder software"
      />
      <SoftwareAppSchema />
      <OrganizationSchema />
      <FAQSchema />
      {/* ── Nav ── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm"
      >
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
              <>
                <Button onClick={() => navigate("/ai-takeoff")} className="kindai-btn-primary px-5 rounded-full text-sm font-bold">
                  <Camera className="w-4 h-4 mr-1.5" /> Scan a Plan
                </Button>
                <Button onClick={() => navigate("/dashboard")} variant="outline" className="px-4 rounded-full text-sm font-bold hidden sm:flex">
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <button onClick={() => window.location.href = getLoginUrl()} className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
                  Sign In
                </button>
                <Button onClick={handleGetStarted} className="kindai-btn-primary px-5 rounded-full text-sm font-bold">
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ── HERO: AI Vision Takeoff ── */}
      <section className="kindai-hero-bg pt-28 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: "oklch(0.58 0.28 0)" }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: "oklch(0.55 0.22 255)" }} />
        <div className="absolute top-40 right-1/3 w-48 h-48 rounded-full opacity-20 blur-2xl" style={{ background: "oklch(0.88 0.18 88)" }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex justify-start mb-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl blur-2xl opacity-40 kindai-gradient scale-110" />
                  <img src={LOGO_URL} alt="Kindai" className="relative w-20 h-20 object-contain drop-shadow-2xl" />
                </div>
              </div>

              {/* BETA BANNER */}
              <motion.a
                href="/beta"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/50 text-orange-300 text-xs font-black mb-3 cursor-pointer hover:bg-orange-500/30 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                BETA ACCESS — ONLY 25 FREE SPOTS — Claim yours now
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.a>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-5 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                AI Construction Estimating Software — Australia's Fastest Takeoff
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-5">
                Scan your plans.<br />
                <span className="kindai-gradient-text">Get your quote.</span>
              </h1>
              <p className="text-lg text-white/70 max-w-xl mb-8 leading-relaxed">
                Australia's fastest <strong className="text-white">AI estimating software</strong> for tradies and builders.
                Photograph your construction plans — AI reads every symbol, counts every fixture,
                calculates materials and labour — and delivers a GST-compliant quote in 60 seconds.
                Covers all 20 trades across NSW, VIC, QLD, WA, SA and beyond.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <Button
                  onClick={handleTryAI}
                  size="lg"
                  className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-2xl"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Free
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  onClick={() => navigate("/demo")}
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 rounded-full text-base font-black h-auto border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Try Live Demo
                </Button>
              </div>
              <div className="flex gap-4 text-white/60 text-sm mt-1">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> No sign-up for demo</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> Real AI results</span>
              </div>
            </motion.div>

            {/* Right: Visual mockup of the AI flow */}
            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative">
                {/* Phone mockup */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-xs text-white/40 ml-2 font-mono">kindai.com.au/ai-takeoff</span>
                  </div>

                  {/* Step 1 */}
                  <div className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white text-sm font-bold">Plan uploaded</span>
                      <span className="ml-auto text-green-400 text-xs font-bold">Done</span>
                    </div>
                    <div className="bg-white/5 rounded-xl h-24 flex items-center justify-center border border-dashed border-white/20">
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-white/30 mx-auto mb-1" />
                        <span className="text-[10px] text-white/30">floor-plan-3bed.pdf</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white text-sm font-bold">AI found 47 items</span>
                      <span className="ml-auto text-xs font-bold text-yellow-400">87% confidence</span>
                    </div>
                    <div className="space-y-1.5">
                      {["20x GPO power points", "15x LED downlights", "1x Switchboard upgrade", "3x Smoke alarms"].map(item => (
                        <div key={item} className="flex items-center gap-2 text-xs text-white/60">
                          <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                          {item}
                        </div>
                      ))}
                      <span className="text-[10px] text-white/30">+ 43 more items...</span>
                    </div>
                  </div>

                  {/* Step 3: Pricing */}
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-4 border border-green-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-bold">Your Quote</span>
                      <span className="text-xs text-green-400 font-bold">20% markup</span>
                    </div>
                    <div className="space-y-1 text-xs text-white/60">
                      <div className="flex justify-between"><span>Materials (trade)</span><span className="text-white font-bold">$4,280</span></div>
                      <div className="flex justify-between"><span>Labour (12h)</span><span className="text-white font-bold">$1,020</span></div>
                      <div className="flex justify-between"><span>Markup (20%)</span><span className="text-pink-400 font-bold">+$1,060</span></div>
                      <div className="flex justify-between"><span>GST (10%)</span><span className="text-white font-bold">$636</span></div>
                      <div className="h-px bg-white/10 my-1" />
                      <div className="flex justify-between text-sm">
                        <span className="text-white font-black">Total (inc GST)</span>
                        <span className="font-black text-lg kindai-gradient-text">$6,996</span>
                      </div>
                    </div>
                    <div className="mt-2 bg-green-500/20 rounded-lg px-3 py-1.5 text-center">
                      <span className="text-[10px] text-green-300 font-bold">Trade pricing saves you $1,240 on materials</span>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div
                  className="absolute -top-3 -right-3 bg-white rounded-xl px-3 py-2 shadow-xl border border-gray-100"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-black text-gray-800">30 seconds</span>
                  </div>
                </motion.div>
                <motion.div
                  className="absolute -bottom-3 -left-3 bg-white rounded-xl px-3 py-2 shadow-xl border border-gray-100"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-black text-gray-800">GST compliant</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Video Explainer ── */}
      <section className="py-16 px-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at center, oklch(0.35 0.18 0) 0%, transparent 70%)" }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-semibold mb-4">
              <Play className="w-3.5 h-3.5 text-pink-400" />
              See it in action
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Watch Kindai <span className="kindai-gradient-text">build a quote in 60 seconds.</span>
            </h2>
            <p className="text-white/60 text-base max-w-xl mx-auto">
              Real plans. Real AI. Real Australian pricing. No demo tricks.
            </p>
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black aspect-video">
            <video
              controls
              preload="metadata"
              poster=""
              className="w-full h-full object-cover"
              style={{ display: 'block' }}
            >
              <source src="https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai_script4_explainer_6ef6dea5.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="flex justify-center gap-6 mt-6">
            <Button
              onClick={handleTryAI}
              size="lg"
              className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              <Camera className="w-5 h-5 mr-2" /> Try It Free
            </Button>
            <Button
              onClick={() => navigate("/demo")}
              size="lg"
              variant="outline"
              className="px-8 py-4 rounded-full text-base font-black h-auto border-white/30 text-white hover:bg-white/10"
            >
              <Play className="w-5 h-5 mr-2" /> Live Demo
            </Button>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              How AI estimating works. <span className="kindai-gradient-text">Three steps. One quote.</span>
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              From plan to priced quote in under a minute. No spreadsheets. No guesswork.
            </p>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <FadeUp key={step.step} delay={i * 0.12} className="text-center group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.colour} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Step {step.step}</div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </FadeUp>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button
              onClick={handleTryAI}
              size="lg"
              className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              <Sparkles className="w-5 h-5 mr-2" /> Try It Now — Free
            </Button>
          </div>
        </div>
      </section>

      {/* ── Trades Grid ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              One AI estimating platform. <span className="kindai-gradient-text">Every Australian trade.</span>
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Each trade gets its own AI model trained on industry-specific symbols, materials, and pricing.
            </p>
          </FadeUp>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {TRADES.map((trade, i) => (
              <motion.button
                key={trade.id + i}
                onClick={handleGetStarted}
                className="group bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: (i % 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
                whileTap={{ scale: 0.97 }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${trade.colour} flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                  {trade.emoji}
                </div>
                <div className="text-sm font-bold text-gray-800">{trade.name}</div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              Everything Australian tradies need to <span className="kindai-gradient-text">quote faster and win more jobs.</span>
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              No fluff. No bloat. Just the tools that actually help you get the job.
            </p>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.09)" }}
              >
                <div className={`w-11 h-11 rounded-xl ${f.colour} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
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
            GST-compliant construction quotes, every time.
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
            <h2 className="text-3xl font-black text-gray-900 mb-2">Australian tradies love it.</h2>
            <p className="text-gray-500 text-sm">Real feedback from electricians, plumbers, and builders across Australia.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-white">
        <FadeUp className="max-w-2xl mx-auto text-center">
          <motion.img
            src={LOGO_URL}
            alt="Kindai"
            className="w-20 h-20 object-contain mx-auto mb-6"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            Ready to replace your estimator with <span className="kindai-gradient-text">AI?</span>
          </h2>
          <p className="text-gray-500 text-base mb-8">
            Join Australian tradies already using Kindai AI Vision to quote faster and win more jobs.
          </p>
          <Button
            onClick={handleTryAI}
            size="lg"
            className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl"
          >
            <Camera className="w-5 h-5 mr-2" />
            Start Scanning — It's Free
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-xs text-gray-400 mt-4">No credit card. No lock-in. Just better quotes.</p>
        </FadeUp>
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
            &copy; 2025 Kindai. Built for Australian tradies. GST-compliant by default.
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
