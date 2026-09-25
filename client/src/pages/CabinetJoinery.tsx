import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { CheckCircle2, ArrowRight, Shield, Clock, Users, FileText, ChevronRight } from "lucide-react";

const LOGO_URL = import.meta.env.VITE_APP_LOGO || "/favicon.ico";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Hand over agreed files",
    desc: "After approval and payment, provide up to five supported PDF, JPG or PNG files through the controlled setup process.",
  },
  {
    step: "02",
    title: "Kindai drafts the takeoff",
    desc: "It creates a first-pass scope and pricing structure based on your setup — cabinet quantities, hardware, panels, benchtops, labour allowances.",
  },
  {
    step: "03",
    title: "Your estimator reviews and sends",
    desc: "Nothing is issued blind. Your team checks, edits, approves, and sends the quote. Every time.",
  },
];

const WHY_DIFFERENT = [
  { text: "One defined cabinet or joinery workflow" },
  { text: "Source notes, assumptions and review flags kept visible" },
  { text: "Customer-authorised price-book rows and written rules" },
  { text: "Two distinct jobs reviewed with the nominated estimator" },
  { text: "No final quote or accuracy guarantee" },
  { text: "Uses your pricing rules, labour logic, markup, and GST settings" },
];

export default function CabinetJoinery() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SEO
        title="AI Estimating for Cabinet Makers & Joinery Teams | Kindai"
        description="Apply for a paid KindAI cabinet and joinery workflow setup covering one user, agreed company inputs and two estimator-reviewed jobs."
        canonical="/cabinet-joinery"
        keywords="cabinet making estimating software Australia, joinery estimating AI, commercial joinery quoting software, cabinet takeoff software, AI estimating cabinet makers"
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Kindai" className="h-9 w-9 object-contain" />
            <div>
              <span className="font-black text-base kindai-gradient-text">kindai</span>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest">Estimating Suite</div>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/demo")}
              className="text-sm font-bold border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              See a Cabinet Estimate
            </Button>
            <Button
              onClick={() => navigate("/evaluation")}
              size="sm"
              className="kindai-btn-primary text-xs font-bold px-4"
            >
              Apply for Founding Setup
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl" style={{ background: "oklch(0.58 0.28 0)" }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-8 blur-3xl" style={{ background: "oklch(0.55 0.22 255)" }} />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 text-sm font-bold text-teal-400 mb-6"
          >
            <span>🪵</span> Cabinet Making & Joinery
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 text-white"
          >
            AI takeoffs and quote drafts<br />
            <span className="kindai-gradient-text">for cabinet makers and joinery teams.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg sm:text-xl mb-8 max-w-2xl"
          >
            Apply for one paid workflow using agreed files, authorised rates and written rules. KindAI prepares a structured draft for your estimator to review before issue.
          </motion.p>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 mb-10"
          >
            {[
              "Built for cabinet and joinery scopes",
              "Uses your pricing rules, labour logic, markup, and GST settings",
              "Review-ready output before anything goes to the client",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                {item}
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <Button
              onClick={() => navigate("/evaluation")}
              size="lg"
              className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              Apply for Founding Setup <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/demo")}
              size="lg"
              variant="outline"
              className="px-8 py-4 rounded-full text-base font-black h-auto border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              See a Cabinet Estimate
            </Button>
          </motion.div>

        </div>
      </section>

      {/* Section 2 — What buyers care about */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold mb-5">
              For estimators and business owners
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-5">
              Give your estimator a visible starting point —<br />
              <span className="kindai-gradient-text">not another black box.</span>
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              KindAI keeps the candidate scope, company inputs, source notes and assumptions together so the nominated estimator can inspect the draft.
            </p>
            <p className="text-gray-500 text-base leading-relaxed">
              Every output remains a draft. Your estimator checks each line, adjusts quantities, overrides prices and approves before anything goes to a client.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 — How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              How Kindai fits into a cabinet estimating workflow.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-5xl font-black kindai-gradient-text mb-4">{step.step}</div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4 text-gray-200">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Why it's different */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-200 text-gray-600 text-xs font-bold mb-5">
                Built for the way cabinet teams actually quote
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6">
                Draft the count first.<br />Review the work that matters.
              </h2>
              <div className="space-y-3">
                {WHY_DIFFERENT.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Clock, label: "Workflow", value: "Draft first", sub: "estimator review before issue" },
                { icon: FileText, label: "Pricing logic", value: "Visible", sub: "rates and assumptions stay reviewable" },
                { icon: Users, label: "Included access", value: "1 user", sub: "in the founding setup" },
                { icon: Shield, label: "Approval", value: "Human", sub: "your team makes the final call" },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <stat.icon className="w-5 h-5 text-teal-500 mb-3" />
                  <div className="text-xs text-gray-400 mb-1">{stat.label}</div>
                  <div className="text-2xl font-black text-gray-900 mb-0.5">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 — Founding setup */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-bold mb-5">
            <Shield className="w-3.5 h-3.5 text-blue-400" /> Five founding cabinet and joinery businesses
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-5">
            One fixed paid setup. No cheap trial.
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            A$2,500 plus GST includes one workflow, one user, up to 150 price-book rows, two reviewed real jobs, 30 days of email support and the first six months of Sole Tradie.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
            {[
              { title: "One defined workflow", desc: "Cabinet making or commercial joinery only for the founding cohort." },
              { title: "Your pricing inputs", desc: "Up to 150 authorised price-book rows and 20 written estimating rules." },
              { title: "Two reviewed jobs", desc: "We record assumptions and corrections with your nominated estimator." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h3 className="font-black text-white text-sm mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={() => navigate("/evaluation")}
            size="lg"
            className="kindai-btn-primary px-8 py-4 rounded-full text-base font-black h-auto shadow-xl"
          >
            Apply for A$2,500 Setup <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Section 7 — Final CTA */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-5">
            Define one cabinet or joinery workflow before any broader rollout.
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-2xl mx-auto">
            Explore the representative sample, then apply for the fixed paid setup if the workflow matches your business.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => navigate("/evaluation")}
              size="lg"
              className="kindai-btn-primary px-10 py-4 rounded-full text-base font-black h-auto shadow-xl"
            >
              Apply for Founding Setup <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>© 2026 Kindai. Built for Australian construction businesses.</span>
          <div className="flex gap-4">
            <a href="/privacy-policy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</a>
            <a href="/support" className="hover:text-gray-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
