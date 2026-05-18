/**
 * Kindai Homepage — Conversion-focused landing page
 *
 * Design philosophy: Award-level SaaS landing page with dark hero, product proof,
 * social proof, and a clear path to the $9 Pro Trial or free signup.
 * No waitlist. No beta. This is a live product.
 *
 * Structure: Hero → Video → How It Works → AI That Learns → Trades → Features →
 * Cabinet Proof → Compliance → Enterprise Trust → Testimonials → Final CTA → Footer
 */
import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { SoftwareAppSchema, OrganizationSchema, FAQSchema } from "@/components/StructuredData";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap, Shield, Brain, FileText, Users, BarChart3,
  ChevronRight, CheckCircle2, Star, ArrowRight, HardHat,
  Camera, Sparkles, DollarSign, Truck, Clock, Upload, Play, Lock
} from "lucide-react";
import { motion, useInView, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { pixelViewContent, pixelInitiateCheckout, generateMetaEventId, getMetaBrowserContext } from "@/lib/metaPixel";
import { ph } from "@/lib/posthog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

// ─── Reusable scroll-triggered fade-up wrapper ───────────────────────────────
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

// ─── Scroll-aware sticky nav ─────────────────────────────────────────────────
function ScrollNav({ isAuthenticated, navigate }: {
  isAuthenticated: boolean;
  navigate: (path: string) => void;
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
            <Button onClick={() => navigate("/dashboard")} variant="outline" className={`px-4 rounded-full text-sm font-bold ${scrolled ? '' : 'border-white/30 text-white hover:bg-white/10'}`}>
              Dashboard
            </Button>
          ) : (
            <>
              <a href="/pricing" className={`text-sm font-semibold transition-colors hidden sm:block ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'}`}>
                Pricing
              </a>
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
              <Button onClick={() => navigate("/pricing")} className="kindai-btn-primary px-5 rounded-full text-sm font-bold hidden sm:flex">
                Try Pro — A$9
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

// ─── AI That Learns section ──────────────────────────────────────────────────
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
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          {[
            { label: "Accuracy", value: "85–92%", sub: "on clear plans" },
            { label: "Speed", value: "60 sec", sub: "first-pass takeoff" },
            { label: "Savings", value: "80%", sub: "less quoting time" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-black kindai-gradient-text">{stat.value}</div>
              <div className="text-xs text-gray-400 font-bold mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  { step: 1, title: "Upload Your Plans", desc: "Drop a PDF plan, photo, or describe the job. Kindai accepts construction drawings, joinery elevations, and hand-drawn sketches.", icon: Upload, colour: "from-pink-500 to-orange-500" },
  { step: 2, title: "AI Analyses Everything", desc: "GPT-4o Vision reads every symbol, counts fixtures, measures rooms, and identifies all materials needed — in under 60 seconds.", icon: Sparkles, colour: "from-yellow-500 to-orange-500" },
  { step: 3, title: "Get Your Quote", desc: "Full materials list with retail vs trade pricing, labour hours, your markup, and GST — ready to send to your client.", icon: FileText, colour: "from-green-500 to-emerald-500" },
];

const TRADES = [
  { id: "electrical", name: "Electrical", emoji: "⚡", colour: "from-yellow-400 to-orange-500" },
  { id: "plumbing", name: "Plumbing", emoji: "🔧", colour: "from-blue-400 to-blue-600" },
  { id: "carpentry", name: "Carpentry", emoji: "🪚", colour: "from-amber-500 to-orange-600" },
  { id: "concrete", name: "Concreting", emoji: "🏗️", colour: "from-gray-400 to-gray-600" },
  { id: "hvac", name: "HVAC", emoji: "❄️", colour: "from-cyan-400 to-blue-500" },
  { id: "flooring", name: "Flooring", emoji: "🪵", colour: "from-amber-600 to-amber-800" },
  { id: "painting", name: "Painting", emoji: "🎨", colour: "from-pink-400 to-pink-600" },
  { id: "cabinet", name: "Cabinet Making", emoji: "🪵", colour: "from-teal-500 to-teal-700" },
  { id: "roofing", name: "Roofing", emoji: "🏠", colour: "from-red-400 to-red-600" },
  { id: "landscaping", name: "Landscaping", emoji: "🌿", colour: "from-green-400 to-green-600" },
  { id: "demolition", name: "Demolition & Earthmoving", emoji: "🏗️", colour: "from-amber-700 to-yellow-900" },
  { id: "solar-power", name: "Solar Power", emoji: "☀️", colour: "from-yellow-400 to-orange-500" },
  { id: "swimming-pool", name: "Swimming Pools", emoji: "🏊", colour: "from-blue-400 to-cyan-500" },
];

const FEATURES = [
  { icon: Camera, title: "AI Plan Reading", desc: "Upload PDF plans — GPT-4o Vision reads dimensions, counts items, and identifies materials automatically.", tag: "Vision AI" },
  { icon: Brain, title: "Company Memory", desc: "Your price book, your supplier rates, your AI instructions. Kindai quotes your way, not a generic way.", tag: "Pro" },
  { icon: Sparkles, title: "Correction Learning", desc: "Every edit you make trains the AI. After 10-20 corrections, it pre-adjusts based on your patterns.", tag: "Pro" },
  { icon: DollarSign, title: "Trade vs Retail Pricing", desc: "See the real difference between what you pay and what Bunnings charges. Protect your margins.", tag: "All Plans" },
  { icon: BarChart3, title: "Accuracy Dashboard", desc: "Track how accurate the AI is getting over time. See confidence scores, correction rates, and improvement trends.", tag: "Business" },
  { icon: FileText, title: "Branded PDF Quotes", desc: "Export professional, branded quotes with your logo, terms, and GST — ready to email to clients.", tag: "Pro" },
];

const TESTIMONIALS = [
  { name: "Dave K.", trade: "Electrician, QLD", text: "Finally quoted a 3-house job in under 10 minutes. Used to take me half a day.", stars: 5 },
  { name: "Sarah M.", trade: "Plumbing Business Owner, VIC", text: "The AI read our hydraulic plans and got the quantities right first time. Blown away.", stars: 5 },
  { name: "Tom B.", trade: "Builder, NSW", text: "We manage $8M in projects. This is the first tool that actually scales with us.", stars: 5 },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Pro trial form state (used in hero and final CTA)
  const [trialForm, setTrialForm] = useState({ name: "", email: "" });
  const proTrialMutation = trpc.billing.createProTrialCheckout.useMutation({
    onSuccess: (data) => {
      window.location.assign(data.url);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleStartProTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialForm.name.trim() || !trialForm.email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    pixelInitiateCheckout({ content_name: "Kindai Pro Trial $9", value: 9 });
    proTrialMutation.mutate({
      name: trialForm.name.trim(),
      email: trialForm.email.trim(),
      origin: window.location.origin,
    });
  };

  // Lazy-load video section
  const videoSectionRef = useRef(null);
  const videoInView = useInView(videoSectionRef, { once: true, margin: "200px" });

  // Track page view
  useEffect(() => {
    pixelViewContent({ content_name: "Kindai Homepage", content_category: "Landing Page" });
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/pricing");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Kindai | AI Estimating for Australian Trades"
        description="Upload plans, get AI takeoffs and GST-ready quotes in 60 seconds. Try Pro for A$9. Built for Australian tradies and builders."
      />
      <SoftwareAppSchema />
      <OrganizationSchema />

      <ScrollNav isAuthenticated={isAuthenticated} navigate={navigate} />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden kindai-hero-bg pt-16">
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-600/20 to-orange-600/10 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute bottom-20 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-600/15 to-purple-600/10 blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* $9 trial badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-black mb-6"
            >
              <Star className="w-3.5 h-3.5" /> Try Pro for A$9 — 21 days, full access
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-6">
              <span className="kindai-gradient-text">
                From Plans to Quote<br className="hidden sm:block" /> in Minutes.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/70 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              Kindai reads your plans, applies your price book, and builds a GST-ready quote in 60 seconds. Built for Australian tradies.
            </p>

            {/* Hero CTA — direct to pricing or inline trial */}
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <Button
                    onClick={() => navigate("/pricing")}
                    size="lg"
                    className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-xl flex-1"
                  >
                    Start A$9 Pro Trial <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    variant="outline"
                    className="px-6 py-4 rounded-full text-base font-black h-auto border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    Try Free
                  </Button>
                </div>
                <p className="text-white/40 text-xs">No lock-in. Cancel anytime. A$9 gets you 21 days of full Pro access.</p>
              </div>
            ) : (
              <Button
                onClick={() => navigate("/dashboard")}
                size="lg"
                className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </motion.div>

          {/* Right: Product mockup */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs text-white/40 ml-2 font-mono">kindaiestimator.com/ai-takeoff</span>
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
                  <span className="text-xs font-black text-gray-800">60 seconds</span>
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
      </section>

      {/* ── Video Demo — Above the Fold ── */}
      <section ref={videoSectionRef} className="py-12 sm:py-16 px-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at center, oklch(0.35 0.18 0) 0%, transparent 70%)" }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-semibold mb-3">
              <Play className="w-3.5 h-3.5 text-pink-400" />
              30-second demo
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">
              Watch: <span className="kindai-gradient-text">Plan upload → AI quote in 60 seconds</span>
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              Real plans. Real AI. Real Australian pricing.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black aspect-video group cursor-pointer">
            {videoInView ? (
              <video
                controls
                preload="metadata"
                className="w-full h-full object-cover"
                style={{ display: 'block' }}
                poster=""
              >
                <source src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663471157879/KKHxJHBmmkobbTMa.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-xl">
                  <Play className="w-7 h-7 text-white ml-1" />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-5 mt-6">
            <Button
              onClick={() => navigate("/pricing")}
              size="lg"
              className="kindai-btn-primary w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-black h-auto shadow-xl"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Start A$9 Pro Trial
            </Button>
            <Button
              onClick={() => navigate("/demo")}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-black h-auto border-white/30 text-white hover:bg-white/10"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Try Live Demo
            </Button>
          </div>
        </div>
      </section>

      {/* ── AI That Learns ── */}
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
              onClick={() => navigate("/pricing")}
              size="lg"
              className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              <Sparkles className="w-5 h-5 mr-2" /> Start A$9 Pro Trial
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
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-sm">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">{f.tag}</span>
                </div>
                <h3 className="font-black text-gray-900 text-sm mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compliance ── */}
      <section className="py-20 px-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <FadeUp>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-bold mb-4">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> Australian Compliance
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
          </FadeUp>
        </div>
      </section>

      {/* ── Auto-SWMS Feature Highlight ── */}
      <section className="py-20 sm:py-24 px-4 bg-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-green-100/40 to-emerald-100/20 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <FadeUp className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-4">
              <Shield className="w-3.5 h-3.5" /> Auto-SWMS + Compliance Pack
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              AI-generated safety docs that <span className="kindai-gradient-text">learn how your business works.</span>
            </h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto">
              One click after your estimate is approved — Kindai generates a compliant SWMS with hazards, controls, and PPE pre-filled for your trade. Workers sign digitally on their phone.
            </p>
          </FadeUp>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: SWMS mockup */}
            <FadeUp delay={0.1}>
              <div className="bg-gray-950 rounded-2xl p-6 shadow-2xl border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-3 text-xs text-gray-500 font-mono">kindaiestimator.com/swms</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">SWMS — Kitchen Renovation</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">AI Generated</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">High Risk Work Detected</div>
                    <div className="flex flex-wrap gap-1.5">
                      {["Electrical (live work)", "Work at Heights", "Confined Spaces"].map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Work Activity</div>
                    <div className="text-xs text-white font-semibold mb-1">Demolition of existing cabinetry</div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div><span className="text-gray-500">Hazard:</span> <span className="text-orange-300">Falling debris, dust inhalation</span></div>
                      <div><span className="text-gray-500">Control:</span> <span className="text-emerald-300">Exclusion zone, P2 masks</span></div>
                      <div><span className="text-gray-500">PPE:</span> <span className="text-blue-300">Hard hat, safety glasses, gloves</span></div>
                      <div><span className="text-gray-500">Responsible:</span> <span className="text-white">Site supervisor</span></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-[10px] text-gray-500">3 workers pending signature</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">Share Link →</span>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Right: Feature bullets */}
            <FadeUp delay={0.2}>
              <div className="space-y-5">
                {[
                  { icon: "🧠", title: "Learns your company standards", desc: "Upload one old SWMS or set your standard PPE — the AI calibrates to how your business actually operates. Every SWMS after that reflects your procedures, not generic templates." },
                  { icon: "📸", title: "Site photo hazard detection", desc: "Upload a photo of the job site — vision AI identifies overhead power lines, uneven ground, confined entries, and more. Hazards get added to your SWMS automatically." },
                  { icon: "✍️", title: "Digital worker sign-off", desc: "Share a link with your crew. Workers review hazards and sign on their phone before starting work. No paper, no chasing signatures." },
                  { icon: "🔄", title: "Gets smarter with every edit", desc: "When you correct an AI suggestion, Kindai remembers. After a few corrections, it pre-adjusts future SWMS based on your patterns — like having a safety officer who learns on the job." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-4 items-start"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <span className="text-2xl mt-0.5">{item.icon}</span>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
                <div className="pt-4">
                  <button
                    onClick={() => navigate("/pricing")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
                  >
                    <HardHat className="w-4 h-4" /> Included in Business Plan
                  </button>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Cabinet Making Proof ── */}
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
                { icon: "📦", title: "Your supplier price book", desc: "Import your negotiated rates from Laminex, Polytec, Blum, Hafele, and Caesarstone. Your prices, your margins — not generic retail." },
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

      {/* ── Enterprise Trust ── */}
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
                  {[...Array(t.stars)].map((_, si) => (
                    <Star key={si} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
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

      {/* ── Final CTA — $9 Pro Trial ── */}
      <section className="py-24 px-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-pink-600/20 blur-3xl"
          />
        </div>
        <FadeUp className="max-w-2xl mx-auto text-center relative">
          <motion.img
            src={LOGO_URL}
            alt="Kindai"
            className="w-20 h-20 object-contain mx-auto mb-6"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* $9 trial badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-orange-500/40 rounded-full px-4 py-1.5 text-sm font-black text-orange-400 mb-5">
            <Star className="w-4 h-4" /> A$9 for 21 days of full Pro access
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Give your estimators an <span className="kindai-gradient-text">unfair advantage.</span>
          </h2>
          <p className="text-gray-400 text-base mb-3">
            Kindai cuts first-pass takeoff time by up to 80%. Your team quotes more jobs, wins more work, and controls every margin.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Try Pro for A$9. After 21 days, continue at A$149/mo or cancel. No questions asked.
          </p>

          {/* Inline trial form */}
          {!isAuthenticated ? (
            <div className="max-w-sm mx-auto mb-6">
              <form onSubmit={handleStartProTrial} className="flex flex-col gap-3">
                <Input
                  type="text"
                  placeholder="Your name"
                  value={trialForm.name}
                  onChange={(e) => setTrialForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-10 text-sm rounded-xl border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-orange-500"
                  required
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={trialForm.email}
                  onChange={(e) => setTrialForm((f) => ({ ...f, email: e.target.value }))}
                  className="h-10 text-sm rounded-xl border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-orange-500"
                  required
                />
                <Button
                  type="submit"
                  disabled={proTrialMutation.isPending}
                  size="lg"
                  className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl w-full"
                >
                  {proTrialMutation.isPending ? "Opening Stripe..." : "Start A$9 Pro Trial →"}
                </Button>
              </form>
              <p className="text-xs text-gray-600 mt-3">Secure checkout via Stripe. Cancel anytime. No account needed.</p>
            </div>
          ) : (
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl mb-6"
            >
              Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => navigate("/pricing")}
              size="lg"
              variant="outline"
              className="px-8 py-3 rounded-full text-sm font-black h-auto border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              View all plans
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-4">No lock-in. Enterprise onboarding included. Cancel anytime.</p>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer className="relative overflow-hidden bg-gray-950 pt-20 pb-10 px-4">
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
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
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

            <FadeUp delay={0.2}>
              <h4 className="text-white font-black text-sm mb-4 tracking-wide uppercase">Trades</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Electrical", href: "/ai-takeoff" },
                  { label: "Plumbing", href: "/ai-takeoff" },
                  { label: "Concrete", href: "/ai-takeoff" },
                  { label: "Painting", href: "/ai-takeoff" },
                  { label: "Demolition", href: "/ai-takeoff" },
                  { label: "All Trades", href: "/ai-takeoff" },
                ].map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors duration-200 inline-block">{link.label}</a>
                  </li>
                ))}
              </ul>
            </FadeUp>

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

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8 origin-left"
          />

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
    </div>
  );
}
