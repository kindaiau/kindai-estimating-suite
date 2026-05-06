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
import { motion, useInView, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { pixelViewContent } from "@/lib/metaPixel";
import PilotSpotCounter from "@/components/PilotSpotCounter";
import { ph } from "@/lib/posthog";

// Exit-intent ebook popup for bounce reduction
function ExitIntentPopup({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
        <div className="text-center">
          <div className="text-4xl mb-3">📖</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Wait — grab this free guide first</h3>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            "From Plans to Quote in Minutes" — the 12-page guide showing Aussie tradies how to quote faster, protect margins, and win more work.
          </p>
          <a
            href="/guide"
            className="inline-flex items-center gap-2 kindai-btn-primary px-6 py-3 rounded-full text-sm font-black text-white"
          >
            <Zap className="w-4 h-4" /> Get Free Guide
          </a>
          <p className="text-xs text-gray-400 mt-3">No spam. Just the guide.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Hook to detect if user arrived from an ad (UTM params present)
function useIsAdTraffic() {
  const [isAd, setIsAd] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("utm_source") || params.get("utm_campaign") || params.get("fbclid")) {
      setIsAd(true);
    }
  }, []);
  return isAd;
}

// A/B Test: Hero headline experiment for ad traffic
// Variant A: "From Plans to Quote in Minutes." (benefit-led)
// Variant B: "Stop Losing Jobs to Slow Quotes." (pain-led)
const HERO_VARIANTS = {
  A: "From Plans to Quote\nin Minutes.",
  B: "Stop Losing Jobs\nto Slow Quotes.",
} as const;

function useHeroVariant(isAdTraffic: boolean): "A" | "B" {
  const [variant, setVariant] = useState<"A" | "B">("A");
  const tracked = useRef(false);

  useEffect(() => {
    if (!isAdTraffic) return; // Only A/B test ad traffic

    const stored = localStorage.getItem("kindai_hero_variant");
    if (stored === "A" || stored === "B") {
      setVariant(stored);
    } else {
      // 50/50 random assignment
      const assigned = Math.random() < 0.5 ? "A" : "B";
      localStorage.setItem("kindai_hero_variant", assigned);
      setVariant(assigned);
    }
  }, [isAdTraffic]);

  useEffect(() => {
    if (!isAdTraffic || tracked.current) return;
    tracked.current = true;
    ph.heroExperimentExposed(variant, HERO_VARIANTS[variant].replace("\n", " "));
  }, [isAdTraffic, variant]);

  return variant;
}

// Design note: Australian workshop brutalism — blunt pain-first messaging, tradie-friendly proof, and a clear path from ad click to pilot sign-up.

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

// Scroll-aware sticky nav — transparent at top, solid on scroll
function ScrollNav({ isAuthenticated, navigate, handleGetStarted }: {
  isAuthenticated: boolean;
  navigate: (path: string) => void;
  handleGetStarted: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "blur(0px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
        boxShadow: scrolled ? "0 1px 8px rgba(0,0,0,0.06)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_URL} alt="Kindai" className="h-10 w-10 object-contain" />
          <div>
            <span className="font-black text-xl tracking-tight kindai-gradient-text">kindai</span>
            <div
              className="text-[10px] uppercase tracking-[0.18em] -mt-0.5 font-extrabold"
              style={{
                background: "linear-gradient(90deg, oklch(0.58 0.28 0), oklch(0.68 0.22 40))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "0.18em",
              }}
            >
              ESTIMATING SUITE
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button onClick={() => navigate("/dashboard")} variant="outline" className={`px-4 rounded-full text-sm font-bold ${scrolled ? '' : 'border-white/30 text-white hover:bg-white/10'}`}>
                Dashboard
              </Button>
            </>
          ) : (
            <>
              <a href="/about" className={`text-sm font-semibold transition-colors hidden sm:block ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'}`}>
                About
              </a>
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                variant="outline"
                className={`px-4 rounded-full text-sm font-bold ${scrolled ? 'border-gray-300 text-gray-800 hover:bg-gray-50' : 'border-white/40 text-white hover:bg-white/10'}`}
              >
                Log In
              </Button>
              <Button onClick={handleGetStarted} className="kindai-btn-primary px-5 rounded-full text-sm font-bold hidden sm:flex">
                Get Started Free
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

// Scroll-triggered scale-up animation for the "AI That Learns" section
function AIThatLearnsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 sm:py-24 px-5 bg-white overflow-hidden">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.88, y: 40 }}
        animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] mb-6">
          <span className="kindai-gradient-text">AI That Learns Your Rates,<br /> Your Rules, Your Business.</span>
        </h2>
        <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Every correction you make trains the AI — so it gets more accurate every single job.
          Company memory stores your prices, your rules, and your supplier preferences.
          Kindai doesn't just estimate — it <strong className="text-gray-800">learns how you work.</strong>
        </p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap justify-center gap-3 mt-8"
        >
          <span className="flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Company memory
          </span>
          <span className="flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Correction learning
          </span>
          <span className="flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Xero integration
          </span>
        </motion.div>
      </motion.div>
    </section>
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
  { id: "cabinetry",  name: "Cabinet Making & Joinery", emoji: "🪵", colour: "from-teal-400 to-green-600" },
  { id: "rendering",  name: "Rendering",  emoji: "🧱", colour: "from-rose-400 to-pink-600" },
  { id: "gas-install",name: "Gas Installation", emoji: "🔥", colour: "from-orange-400 to-red-500" },
  { id: "gas-maintenance", name: "Gas Maintenance", emoji: "🛠️", colour: "from-amber-400 to-orange-500" },
];

const FEATURES = [
  { icon: Camera, title: "Scan Plans with AI Vision", desc: "Photograph or upload your plans. AI reads every symbol, counts every fixture, measures every room — and generates a full takeoff in seconds.", colour: "text-pink-500 bg-pink-50" },
  { icon: DollarSign, title: "Retail vs Trade Pricing", desc: "See both retail (Bunnings) and trade supplier pricing side-by-side. Know exactly how much you save buying trade — and set your markup.", colour: "text-green-500 bg-green-50" },
  { icon: Truck, title: "Supplier Recommendations", desc: "Get matched with the best trade suppliers for your state. Send material orders directly and get the best pricing on every job.", colour: "text-orange-500 bg-orange-50" },
  { icon: Shield, title: "Australian Compliance", desc: "Draft quotes with GST, configurable Award labour rates, state licensing prompts, and WHS notices. Every quote reviewed by your team before sending.", colour: "text-blue-500 bg-blue-50" },
  { icon: Users, title: "Fair Work Labour Rates", desc: "Pre-loaded Award rates for all 10 trades as a starting point. Override with your own enterprise agreement rates, supplier price books, and custom markup rules.", colour: "text-cyan-500 bg-cyan-50" },
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
  const isAdTraffic = useIsAdTraffic();
  const heroVariant = useHeroVariant(isAdTraffic);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const exitShownRef = useRef(false);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const videoInView = useInView(videoSectionRef, { once: true, margin: "200px" });

  useEffect(() => {
    pixelViewContent({ content_name: "Home Page", content_category: "Landing" });
  }, []);

  // Exit-intent detection — fires once when user moves mouse to top of viewport (desktop)
  // or after 8 seconds of inactivity on mobile
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !exitShownRef.current) {
        exitShownRef.current = true;
        setShowExitPopup(true);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);

    // Mobile: show after 8 seconds if still on page (they haven't scrolled much)
    const mobileTimer = setTimeout(() => {
      if (window.innerWidth < 768 && !exitShownRef.current && window.scrollY < 300) {
        exitShownRef.current = true;
        setShowExitPopup(true);
      }
    }, 8000);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(mobileTimer);
    };
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) navigate("/ai-takeoff");
    else navigate("/beta");
  };

  const handleTryAI = () => {
    ph.ctaClicked("hero");
    if (isAdTraffic) {
      ph.heroExperimentCTAClicked(heroVariant, "claim_pilot_spot");
    }
    if (isAuthenticated) navigate("/ai-takeoff");
    else navigate("/beta");
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Kindai | AI Estimating for Australian Trades"
        description="Scan plans, get instant AI takeoffs and GST-ready quotes in 60 seconds. Built for Australian tradies and builders."
        canonical="/"
        keywords="AI estimating software Australia, construction quoting software, trade takeoff software, builder quoting app, AI construction estimating"
      />
      <SoftwareAppSchema />
      <OrganizationSchema />
      <FAQSchema />
      {/* ── Nav ── */}
      <ScrollNav isAuthenticated={isAuthenticated} navigate={navigate} handleGetStarted={handleGetStarted} />


      {/* ── HERO: Clean, spacious, mobile-first ── */}
      <section className="kindai-hero-bg pt-32 sm:pt-36 pb-24 sm:pb-28 px-5 sm:px-6 relative overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: "oklch(0.58 0.28 0)" }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: "oklch(0.55 0.22 255)" }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-center lg:text-left"
            >
              {/* BETA BANNER */}
              <motion.a
                href="/beta"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/50 text-orange-300 text-xs font-black mb-8 cursor-pointer hover:bg-orange-500/30 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                PILOT PROGRAM — ONLY 25 FOUNDING SPOTS
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.a>

              {/* HERO HEADLINE — A/B tested for ad traffic */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-8">
                <span className="kindai-gradient-text">
                  {isAdTraffic
                    ? HERO_VARIANTS[heroVariant].split("\n").map((line: string, i: number) => (
                        <span key={i}>{line}{i === 0 && <br className="hidden sm:block" />}</span>
                      ))
                    : <>From Plans to Quote<br className="hidden sm:block" /> in Minutes.</>}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-white/70 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
                Kindai reads your plans, applies your price book, and builds a GST-ready quote in 60 seconds. Built for Australian tradies.
              </p>

              {/* On ad traffic: minimal proof. On organic: full counter */}
              {isAdTraffic ? (
                <div className="flex items-center gap-2 text-white/60 text-sm font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span>14 of 25 founding spots claimed</span>
                </div>
              ) : (
                <PilotSpotCounter variant="hero" fallbackClaimed={12} fallbackTotal={25} />
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center lg:items-start justify-center lg:justify-start w-full sm:w-auto mt-4">
                <Button
                  onClick={handleTryAI}
                  size="lg"
                  className="kindai-btn-primary w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-black h-auto shadow-2xl"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Claim Free Pilot Spot
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
                <Button
                  onClick={() => navigate("/demo")}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-black h-auto border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Hide testimonial on mobile for ad traffic — reduce cognitive load */}
              <p className={`text-sm text-white/45 mt-8 max-w-md mx-auto lg:mx-0 ${isAdTraffic ? 'hidden sm:block' : ''}`}>
                "I photographed the plans on my phone and had a full quote in 3 minutes." — <span className="text-white/70 font-semibold">Dave K., Electrician, QLD</span>
              </p>
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

      {/* ── Video Explainer — lazy loaded for faster initial paint ── */}
      <section ref={videoSectionRef} className="py-16 px-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at center, oklch(0.35 0.18 0) 0%, transparent 70%)" }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-semibold mb-4">
              <Play className="w-3.5 h-3.5 text-pink-400" />
              See it in action
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              See how Kindai <span className="kindai-gradient-text">catches missed items in 60 seconds.</span>
            </h2>
            <p className="text-white/60 text-base max-w-xl mx-auto">
              Real plans. Real AI. Real Australian pricing. The speed matters because underquoting costs real money.
            </p>
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black aspect-video">
            {videoInView ? (
              <video
                controls
                preload="metadata"
                poster=""
                className="w-full h-full object-cover"
                style={{ display: 'block' }}
              >
                <source src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663471157879/KKHxJHBmmkobbTMa.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white/30 text-sm">Loading video...</div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 mt-6 px-4 sm:px-0">
            <Button
              onClick={handleTryAI}
              size="lg"
              className="kindai-btn-primary w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-black h-auto shadow-xl"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Claim Free Pilot Spot
            </Button>
            <Button
              onClick={() => navigate("/demo")}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-black h-auto border-white/30 text-white hover:bg-white/10"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* ── AI That Learns — standout brand statement with scale-up animation ── */}
      <AIThatLearnsSection />

      {/* ── How It Works ── */}
      <section className="py-20 px-4 bg-gray-50">
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
      <section className="py-20 px-4 bg-white">
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
      <section className="py-20 px-4 bg-gray-50">
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
            Compliance-ready quotes, built for Australian construction.
          </h2>
          <p className="text-white/70 text-base max-w-2xl mx-auto mb-8">
            Kindai generates draft quotes with GST, configurable labour rates, and compliance prompts pre-loaded for your state and trade. Your team reviews and approves before sending — always.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["GST 10%", "QBCC", "VBA", "NSW Fair Trading", "WHS/OH&S", "AS/NZS Standards", "Award Rates (configurable)", "Human Review Step"].map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cabinet Making Proof Section ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold mb-4">
              <span>🪵</span> Cabinet Making & Joinery
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              Built for commercial joinery firms. <span className="kindai-gradient-text">Not just residential kitchens.</span>
            </h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto">
              Kindai understands cabinet-native language: sheet goods, door profiles, Blum hardware systems, Laminex and Polytec finishes, Caesarstone benchtops, and commercial joinery labour models.
            </p>
          </FadeUp>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left: Sample output */}
            <div className="bg-gray-950 rounded-2xl p-6 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-white/50 font-mono">AI Takeoff — Commercial Kitchen Joinery</span>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { item: "Laminex Chalk Matt 16mm MDF board", qty: "48 sheets", price: "$94.50/sheet" },
                  { item: "Polytec Ravine Natural Oak 18mm", qty: "24 sheets", price: "$118.00/sheet" },
                  { item: "Blum TANDEM plus BLUMOTION 550mm", qty: "96 runners", price: "$38.40/pair" },
                  { item: "Blum CLIP top BLUMOTION 110° hinges", qty: "144 hinges", price: "$6.20 ea" },
                  { item: "Caesarstone 6131 Bianco Drift 20mm", qty: "18 lineal m", price: "$485/lm" },
                  { item: "Soft-close drawer inserts (Hettich)", qty: "48 sets", price: "$22.80/set" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 sm:gap-3 bg-white/5 rounded-lg px-2 sm:px-3 py-2 border border-white/5">
                    <span className="text-white/70 flex-1 min-w-0 truncate">{row.item}</span>
                    <span className="text-white/50 shrink-0 text-right text-[10px] sm:text-xs">{row.qty}</span>
                    <span className="text-green-400 font-bold shrink-0 text-right text-[10px] sm:text-xs">{row.price}</span>
                  </div>
                ))}
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between items-center bg-gradient-to-r from-teal-500/20 to-green-500/20 rounded-lg px-3 py-2 border border-teal-500/30">
                  <span className="text-white font-black text-sm">Total Quote (inc GST)</span>
                  <span className="text-teal-400 font-black text-lg">$187,420</span>
                </div>
                <p className="text-white/30 text-[10px] text-center pt-1">AI draft — reviewed and approved by estimator before sending</p>
              </div>
            </div>
            {/* Right: Feature list */}
            <div className="space-y-4">
              {[
                { icon: "🏭", title: "Commercial-scale joinery", desc: "Office fitouts, hotel joinery, retail shopfitting, multi-residential kitchens. Kindai handles projects from $50K to $5M+." },
                { icon: "📦", title: "Your supplier price book", desc: "Import your negotiated rates from Laminex, Polytec, Blum, Häfele, and Caesarstone. Your prices, your margins — not generic retail." },
                { icon: "👷", title: "Cabinet-specific labour models", desc: "Workshop fabrication hours, site installation, delivery and crane, and finishing — all calculated separately with your rates." },
                { icon: "📋", title: "Shop drawing integration", desc: "Upload your shop drawings or describe the scope. AI extracts every component: carcasses, doors, drawers, hardware, and benchtops." },
                { icon: "✏️", title: "Always your call", desc: "Every AI output is a draft for your estimator to review. Override any item, adjust any quantity, change any price before sending." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Enterprise Trust Block ── */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-bold mb-4">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> Enterprise & Data Security
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Built for businesses that take <span className="kindai-gradient-text">data seriously.</span>
            </h2>
            <p className="text-white/60 text-base max-w-2xl mx-auto">
              Your plans, pricing, and client data never leave your control. Kindai is designed for construction businesses that can't afford a data breach or a compliance failure.
            </p>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "🔒", title: "Your data is yours", desc: "We never use your uploaded plans or job data to train AI models. Your business data is not shared with any third party." },
              { icon: "🛡️", title: "Encrypted at rest & in transit", desc: "AES-256 encryption at rest. TLS 1.3 in transit. Files stored in secure Australian and US-based cloud infrastructure." },
              { icon: "👥", title: "Role-based access controls", desc: "Admin, estimator, and viewer roles. Control who can create, edit, approve, and send quotes within your organisation." },
              { icon: "📄", title: "Data Processing Agreement", desc: "Enterprise accounts can request a DPA for GDPR, Privacy Act, and internal compliance requirements. Available on request." },
              { icon: "🤝", title: "Dedicated enterprise onboarding", desc: "Your own onboarding session, custom price book import, EA labour rate setup, and team training before day one." },
              { icon: "✅", title: "Human review — always", desc: "No quote is ever sent without your team's approval. Kindai generates drafts. Your estimators make the call." },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-white/5 rounded-xl p-5 border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              >
                <span className="text-2xl mb-3 block">{item.icon}</span>
                <h3 className="font-black text-white text-sm mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a href="mailto:matt@kindaiestimator.com?subject=Enterprise%20Enquiry" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm font-bold transition-colors">
              Talk to our enterprise team <ArrowRight className="w-4 h-4" />
            </a>
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
            Give your estimators an <span className="kindai-gradient-text">unfair advantage.</span>
          </h2>
          <p className="text-gray-500 text-base mb-8">
            Kindai cuts first-pass takeoff time by up to 80%. Your team quotes more jobs, wins more work, and controls every margin — without changing how they work.
          </p>
          <Button
            onClick={handleTryAI}
            size="lg"
            className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl"
          >
            <Camera className="w-5 h-5 mr-2" />
            Start Your Pilot — Free
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-xs text-gray-400 mt-4">No lock-in. Enterprise onboarding included. Cancel anytime.</p>
        </FadeUp>
      </section>

      {/* ── Premium Animated Footer ── */}
      <footer className="relative overflow-hidden bg-gray-950 pt-20 pb-10 px-4">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
            {/* Brand */}
            <FadeUp>
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
            </FadeUp>

            {/* Product */}
            <FadeUp delay={0.1}>
              <h4 className="text-white font-black text-sm mb-4 tracking-wide uppercase">Product</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "AI Takeoff", href: "/ai-takeoff" },
                  { label: "Company Memory", href: "/dashboard" },
                  { label: "Xero Integration", href: "/dashboard" },
                  { label: "Accuracy Dashboard", href: "/dashboard" },
                  { label: "Pricing", href: "/pricing" },
                ].map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors duration-200 inline-block">{link.label}</a>
                  </li>
                ))}
              </ul>
            </FadeUp>

            {/* Trades */}
            <FadeUp delay={0.2}>
              <h4 className="text-white font-black text-sm mb-4 tracking-wide uppercase">Trades</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Electrical", href: "/ai-takeoff" },
                  { label: "Plumbing", href: "/ai-takeoff" },
                  { label: "Concrete", href: "/ai-takeoff" },
                  { label: "Painting", href: "/ai-takeoff" },
                  { label: "Carpentry", href: "/ai-takeoff" },
                  { label: "All Trades", href: "/ai-takeoff" },
                ].map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors duration-200 inline-block">{link.label}</a>
                  </li>
                ))}
              </ul>
            </FadeUp>

            {/* Legal */}
            <FadeUp delay={0.3}>
              <h4 className="text-white font-black text-sm mb-4 tracking-wide uppercase">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy Policy", href: "/privacy-policy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Help & Best Practices", href: "/help" },
                  { label: "Support", href: "/support" },
                  { label: "About", href: "/about" },
                ].map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors duration-200 inline-block">{link.label}</a>
                  </li>
                ))}
              </ul>
            </FadeUp>
          </div>

          {/* Animated divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8 origin-left"
          />

          {/* Bottom row */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <span className="text-xs text-gray-600">
              &copy; 2026 Kindai. Built for Australian construction businesses.
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
      {/* Exit-intent popup */}
      <AnimatePresence>
        {showExitPopup && <ExitIntentPopup onClose={() => setShowExitPopup(false)} />}
      </AnimatePresence>
    </div>
  );
}
