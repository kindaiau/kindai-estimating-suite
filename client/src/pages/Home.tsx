/**
 * Kindai Homepage — Conversion-focused landing page
 *
 * Design philosophy: Award-level SaaS landing page with dark hero, product proof,
 * product proof and a clear path to the paid Founding Workflow Setup.
 * No waitlist. No beta. Controlled founding launch only.
 *
 * Structure: Hero → Proof status → How It Works → Founding Scope → Data Handling → Final CTA → Footer
 */
import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { SoftwareAppSchema, OrganizationSchema, FAQSchema } from "@/components/StructuredData";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Zap, Shield, Brain, FileText, Users, BarChart3,
  ChevronRight, CheckCircle2, ArrowRight, HardHat,
  Camera, Sparkles, DollarSign, Truck, Upload, Play, Lock
} from "lucide-react";
import { motion, useInView, useMotionValueEvent, useScroll } from "framer-motion";
import { useRef, useState } from "react";

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
              <Button onClick={() => navigate("/evaluation")} className="kindai-btn-primary px-5 rounded-full text-sm font-bold hidden sm:flex">
                Apply for Setup
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

// ─── Company inputs section ───────────────────────────────────────────────────
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
          <span className="kindai-gradient-text">AI Drafting Around Your Rates,<br /> Your Rules, Your Business.</span>
        </h2>
        <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Company memory keeps your prices, rules and supplier preferences together.
          Approved corrections remain visible for future review, while your estimator keeps final control.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          {[
            { label: "Inputs", value: "Your rates", sub: "not generic defaults" },
            { label: "Review", value: "Visible", sub: "assumptions and flags" },
            { label: "Control", value: "Human", sub: "approval before issue" },
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
  { step: 1, title: "Hand Over Agreed Files", desc: "After approval and payment, provide up to five supported cabinet or joinery files through the controlled setup process.", icon: Upload, colour: "from-pink-500 to-orange-500" },
  { step: 2, title: "Review the AI Draft", desc: "KindAI proposes candidate quantities, items and assumptions so a qualified estimator can check the scope before pricing is finalised.", icon: Sparkles, colour: "from-yellow-500 to-orange-500" },
  { step: 3, title: "Approve the Estimate", desc: "Apply your labour, material rates, markup and GST, then review exclusions before an approved quote is issued.", icon: FileText, colour: "from-green-500 to-emerald-500" },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/evaluation");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="KindAI | Cabinet & Joinery Founding Workflow Setup"
        description="KindAI helps Australian cabinet and joinery estimators turn supported plans, business rules and rates into a structured draft for human review. Explore a sample or apply for the paid Founding Workflow Setup."
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
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-black mb-6"
            >
              <Shield className="w-3.5 h-3.5" /> AI-assisted estimating with human review
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-6">
              <span className="kindai-gradient-text">
                From Plans to a Reviewable<br className="hidden sm:block" /> Estimate Draft.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/70 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              KindAI reads supported plans, applies your estimating rules and builds a structured draft for your estimator to check. Built for Australian trade businesses.
            </p>

            {!isAuthenticated ? (
              <div className="max-w-md mx-auto lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <Button
                    onClick={() => navigate("/evaluation")}
                    size="lg"
                    className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-xl flex-1"
                  >
                    Apply for Founding Setup <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    onClick={() => navigate("/demo")}
                    size="lg"
                    variant="outline"
                    className="px-6 py-4 rounded-full text-base font-black h-auto border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    Explore a Sample
                  </Button>
                </div>
                <p className="text-white/40 text-xs">Application only. Approved setup: A$2,500 + GST, including six months of Sole Tradie.</p>
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
                      <span className="text-[10px] text-white/30">illustrative-kitchen-joinery.pdf</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white text-sm font-bold">Illustrative draft items</span>
                    <span className="ml-auto text-xs font-bold text-yellow-400">Review required</span>
                  </div>
                  <div className="space-y-1.5">
                    {["12x base cabinet carcasses", "8x wall cabinet carcasses", "26x soft-close hinges", "6x drawer runner sets"].map(item => (
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
                    <span className="text-white text-sm font-bold">Illustrative draft total</span>
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
                    <span className="text-[10px] text-green-300 font-bold">Customer rates and markup shown separately</span>
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
                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-black text-gray-800">Draft output</span>
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
                  <span className="text-xs font-black text-gray-800">GST shown separately</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Proof video status ── */}
      <section className="py-12 sm:py-16 px-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at center, oklch(0.35 0.18 0) 0%, transparent 70%)" }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-semibold mb-3">
              <Play className="w-3.5 h-3.5 text-pink-400" />
              Proof video in production
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">
              We removed the polished demo. <span className="kindai-gradient-text">The next video will show real corrections.</span>
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              It will use a permissioned founding setup and show the source, draft, estimator changes and final review—without unsupported speed or accuracy claims.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center shadow-2xl sm:px-10">
            <Lock className="mx-auto h-10 w-10 text-pink-400" />
            <h3 className="mt-4 text-xl font-black text-white">No simulated customer result will be presented as proof.</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
              Until the first customer approves a real case study, use the transparent interactive sample below to inspect the estimate structure.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-5 mt-6">
            <Button
              onClick={() => navigate("/evaluation")}
              size="lg"
              className="kindai-btn-primary w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-black h-auto shadow-xl"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Apply for Founding Setup
            </Button>
            <Button
              onClick={() => navigate("/demo")}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-black h-auto border-white/30 text-white hover:bg-white/10"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Explore the Sample
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
              How the founding workflow works. <span className="kindai-gradient-text">Three steps. One reviewable draft.</span>
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              KindAI prepares a structured draft. Your estimator checks quantities, rates, exclusions and compliance before issue.
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
              onClick={() => navigate("/evaluation")}
              size="lg"
              className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              <Sparkles className="w-5 h-5 mr-2" /> Apply for Setup
            </Button>
          </div>
        </div>
      </section>

      {/* ── Founding launch scope ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold mb-4">
              Cabinet and joinery only
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              One workflow. One user. Two reviewed jobs.
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              The controlled launch does not sell every trade, enterprise automation or a final-quote button. It tests one repeated estimating workflow with visible evidence and human review.
            </p>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { title: "Defined input", desc: "Up to five agreed files per reviewed job, each no larger than 32MB." },
              { title: "Authorised company data", desc: "Up to 150 price-book rows and 20 written estimating rules supplied by the customer." },
              { title: "Estimator decision", desc: "Source notes, assumptions, quantities, rates and exclusions are checked before issue." },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <h3 className="font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button onClick={() => navigate("/cabinet-joinery")} variant="outline" className="rounded-full font-bold">
              Review the cabinet and joinery scope <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Data handling ── */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-bold mb-4">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> Data handling and review
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Built for businesses that take <span className="kindai-gradient-text">data seriously.</span>
            </h2>
            <p className="text-white/60 text-base max-w-2xl mx-auto">
              Access is restricted to your workspace and the service providers required to process and store your work. Advertising trackers are disabled in the controlled founding launch.
            </p>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "🔒", title: "Your data is yours", desc: "We do not use uploaded plans or job data for advertising. Required cloud, storage, email, payment and AI providers process data only to deliver the service." },
              { icon: "🛡️", title: "Protected transfer and storage", desc: "HTTPS protects data in transit. Storage locations, retention and access requirements are confirmed before private files are accepted." },
              { icon: "👤", title: "One-user founding scope", desc: "Team invitations are disabled until seat permissions and organisation access have been validated." },
              { icon: "📄", title: "Processing scope first", desc: "The application and setup process confirms the current providers, data path and required customer controls." },
              { icon: "🤝", title: "Founder-led setup", desc: "One workflow, agreed company inputs and two reviewed jobs before any broader rollout is considered." },
              { icon: "✅", title: "Human review required", desc: "The founding process requires estimator approval before a draft can be treated as a client quote." },
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
            <a href="/privacy-policy" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm font-bold transition-colors">
              Read the current privacy policy <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Proof process ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Make the decision on your own work.</h2>
            <p className="text-gray-500 text-sm max-w-2xl mx-auto">
              We will not ask you to trust anonymous quotes or generic accuracy claims. The paid setup uses two real jobs to test where KindAI helps and where estimator review is still required.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { number: "01", title: "Explore the sample", text: "See the estimate structure and adjust labour, markup and GST without uploading private plans." },
              { number: "02", title: "Apply for the fixed setup", text: "If approved, A$2,500 plus GST covers one configured workflow, two reviewed jobs and six months of Sole Tradie." },
              { number: "03", title: "Review the evidence", text: "Check extracted items, assumptions, missing scope and pricing logic before deciding whether to continue after the included period." },
            ].map((item, i) => (
              <motion.div
                key={item.number}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="text-xs font-black text-pink-600 tracking-widest mb-3">{item.number}</div>
                <h3 className="font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
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
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-orange-500/40 rounded-full px-4 py-1.5 text-sm font-black text-orange-400 mb-5">
            <Shield className="w-4 h-4" /> Founding Workflow Setup
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Pay for a defined setup. <span className="kindai-gradient-text">Keep control of every estimate.</span>
          </h2>
          <p className="text-gray-400 text-base mb-8">
            A$2,500 plus GST for one cabinet or joinery workflow, two reviewed jobs and the first six months of Sole Tradie. Applications are approved before payment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => navigate("/evaluation")}
              size="lg"
              className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              Apply for Founding Setup <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/pricing")}
              size="lg"
              variant="outline"
              className="px-8 py-3 rounded-full text-sm font-black h-auto border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              View Plans
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-4">The application takes no payment. Approved applicants receive the fixed scope before checkout or private-plan processing.</p>
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
                Structured estimate drafts from your plans, rates and rules—with human review kept in the workflow.
              </p>
              <p className="text-xs text-gray-500">Controlled founding cohort: five businesses.</p>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h4 className="text-white font-black text-sm mb-4 tracking-wide uppercase">Product</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Representative Sample", href: "/demo" },
                  { label: "Founding Setup", href: "/evaluation" },
                  { label: "Review Guidance", href: "/help" },
                  { label: "Pricing", href: "/pricing" },
                ].map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors duration-200 inline-block">{link.label}</a>
                  </li>
                ))}
              </ul>
            </FadeUp>

            <FadeUp delay={0.2}>
              <h4 className="text-white font-black text-sm mb-4 tracking-wide uppercase">Launch focus</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Cabinet Making", href: "/cabinet-joinery" },
                  { label: "Commercial Joinery", href: "/cabinet-joinery" },
                  { label: "Founding Setup", href: "/evaluation" },
                  { label: "Representative Sample", href: "/demo" },
                  { label: "Review Guidance", href: "/help" },
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
              <span className="text-xs text-gray-600">Draft outputs require estimator review.</span>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
