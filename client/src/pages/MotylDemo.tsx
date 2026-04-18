import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// ─── Motyl brand constants ────────────────────────────────────────────────────
const MOTYL_YELLOW = "#F5C800";
const MOTYL_BLACK = "#0A0A0A";
const MOTYL_DARK = "#111111";
const MOTYL_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/motyl-logo_0277f988.webp";
const KINDAI_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";
const CNC_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/cnc-factory_eae967f3.jpg";

// Pre-loaded Motyl plan CDN URLs (APT 314 Kitchen Type-F)
const MOTYL_PLAN_URLS = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/2026-04-1811.36.50_c9e2e4b8.pdf",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/2026-04-1811.48.14_c44e7d5b.pdf",
];

type DemoItem = {
  description: string;
  unit: string;
  quantity: number;
  retailPrice: number;
  tradePrice: number;
  labourMinutes: number;
  wasteFactor: number;
  category: string;
};

type DemoResult = {
  items: DemoItem[];
  confidence: number;
  assumptions: string[];
  planNotes: string;
  roomBreakdown: { room: string; items: string[] }[];
  pricing: {
    materialsCostRetail: number;
    materialsCostTrade: number;
    labourHours: number;
    labourCost: number;
    subtotal: number;
    markupAmount: number;
    gst: number;
    total: number;
    tradeSavings: number;
  };
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1200 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prevRef.current = end;
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <span>{prefix}{display.toLocaleString("en-AU")}{suffix}</span>;
}

// ─── Typewriter text ──────────────────────────────────────────────────────────
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  useEffect(() => {
    if (!started) return;
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 28);
    return () => clearInterval(interval);
  }, [started, text]);
  return <span>{displayed}<span className="animate-pulse">|</span></span>;
}

// ─── Result row reveal ────────────────────────────────────────────────────────
function ResultRow({ item, index }: { item: DemoItem; index: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(t);
  }, [index]);
  const tradeCost = item.tradePrice * item.quantity * (1 + item.wasteFactor / 100);
  return (
    <tr
      className="border-b border-white/5 transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)" }}
    >
      <td className="py-2.5 pr-4 text-sm text-white/90">{item.description}</td>
      <td className="py-2.5 pr-3 text-sm text-white/50 text-right">{item.quantity} {item.unit}</td>
      <td className="py-2.5 pr-3 text-sm text-right" style={{ color: MOTYL_YELLOW }}>{formatCurrency(item.tradePrice)}</td>
      <td className="py-2.5 text-sm font-semibold text-right text-white">{formatCurrency(tradeCost)}</td>
    </tr>
  );
}

export default function MotylDemo() {
  // ── Demo AI state ────────────────────────────────────────────────────────────
  const [result, setResult] = useState<DemoResult | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState<"items" | "quote" | "assumptions">("items");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── ROI calculator state ─────────────────────────────────────────────────────
  const [roiProjects, setRoiProjects] = useState(120);
  const [roiHours, setRoiHours] = useState(4);
  const [roiSalary, setRoiSalary] = useState(85000);
  const [staffTab, setStaffTab] = useState<"time" | "staff">("time");

  // ── Integration logos ────────────────────────────────────────────────────────
  const integrations = [
    { name: "Xero", color: "#13B5EA", desc: "Auto-invoice on quote approval" },
    { name: "Polytec", color: "#E8E8E8", desc: "Live trade pricing" },
    { name: "Laminex", color: "#D4A017", desc: "Live trade pricing" },
    { name: "Blum", color: "#E63946", desc: "Hardware catalogue" },
    { name: "Castella", color: "#888", desc: "Handle & hardware specs" },
    { name: "CNC", color: "#4CAF50", desc: "Cut list export (DXF/CSV)" },
  ];

  // ── ROI calculations ─────────────────────────────────────────────────────────
  const hourlyRate = roiSalary / 1800; // ~1800 working hours/yr
  const manualCost = roiProjects * roiHours * hourlyRate;
  const kindaiCost = roiProjects * 0.5 * hourlyRate;
  const kindaiSubscription = 0; // pricing discussed privately
  const netSaving = manualCost - kindaiCost;
  const roiMultiple = roiHours > 0.5 ? Math.round((manualCost / Math.max(kindaiCost, 1)) * 10) / 10 : 1;
  const hoursSaved = Math.round(roiProjects * (roiHours - 0.5));
  const staffCostSaving = Math.round(roiSalary * 0.8); // 80% of role replaced
  const staffNetSaving = staffCostSaving - kindaiSubscription;

  // ── Run demo ─────────────────────────────────────────────────────────────────
  const runDemo = trpc.demo.runDemo.useMutation({
    onSuccess: (data) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setRunning(false);
      setResult(data as unknown as DemoResult);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    },
    onError: (err) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setRunning(false);
      toast.error("AI error: " + err.message);
    },
  });

  const handleRunDemo = useCallback(() => {
    if (running) return;
    setRunning(true);
    setResult(null);
    setElapsed(0);
    setActiveTab("items");
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    runDemo.mutate({
      trade: "cabinetry",
      planImageUrls: MOTYL_PLAN_URLS,
      jobDescription: "Commercial kitchen joinery for apartment complex. APT 314 Kitchen Type-F. Cabinet codes JF-01 to JF-06. Polytec Gossamer White Smooth doors, Blum LEGRABOX drawer systems, Castella Ledge 100mm handles, Zenith Vitrified Ceramic benchtop, Vridan toughened glass splashback. Full spec sheet provided. Use exact product codes from materials schedule.",
      markupPercent: 20,
      labourRate: 95,
      useTradePrice: true,
    });
  }, [running, runDemo]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div style={{ background: MOTYL_BLACK, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(10,10,10,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(245,200,0,0.15)" }}>
        <div className="flex items-center gap-4">
          <img src={MOTYL_LOGO} alt="Motyl Group" className="h-7 object-contain" />
          <span className="text-white/30 text-lg font-thin">×</span>
          <img src={KINDAI_LOGO} alt="Kindai" className="h-7 object-contain" />
        </div>
        <a
          href="mailto:matthew@kindai.com.au?subject=Kindai%20Pilot%20%E2%80%94%20Motyl%20Group&body=Hi%20Matthew%2C%0A%0AI%27d%20like%20to%20start%20the%20free%20pilot%20for%20Motyl%20Group."
          className="px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all hover:scale-105 whitespace-nowrap"
          style={{ background: MOTYL_YELLOW, color: MOTYL_BLACK }}
        >
          Start Free Pilot
        </a>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* CNC background */}
        <div className="absolute inset-0">
          <img src={CNC_BG} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${MOTYL_BLACK} 40%, rgba(10,10,10,0.6) 100%)` }} />
          {/* Animated grid */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "linear-gradient(rgba(245,200,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,0,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative container mx-auto px-6 py-20">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 border"
              style={{ background: "rgba(245,200,0,0.1)", borderColor: "rgba(245,200,0,0.3)", color: MOTYL_YELLOW }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: MOTYL_YELLOW }} />
              Prepared exclusively for Tomasz Molczyk · Motyl Group · Adelaide, SA
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-none mb-6 text-white">
              You automated<br />
              <span style={{ color: MOTYL_YELLOW }}>the factory.</span>
            </h1>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black leading-none mb-8 text-white/60">
              Now automate<br />the quote.
            </h2>

            <p className="text-base md:text-xl text-white/60 max-w-2xl mb-10 leading-relaxed">
              Your CNC reads a DXF file and cuts perfectly every time.<br />
              <strong className="text-white">Kindai reads a PDF and quotes perfectly every time.</strong><br />
              Same concept. Different part of the business.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-6 sm:gap-8 mb-12">
              {[
                { label: "Time to takeoff", value: "< 60 sec", sub: "vs 4+ hours manual" },
                { label: "Confidence score", value: "96–98%", sub: "with spec sheet" },
                { label: "Replaces", value: "80%", sub: "of estimator role" },
                { label: "Year 1 saving", value: "$60K+", sub: "net of Kindai" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-black" style={{ color: MOTYL_YELLOW }}>{s.value}</div>
                  <div className="text-sm text-white font-semibold">{s.label}</div>
                  <div className="text-xs text-white/40">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleRunDemo}
                className="w-full sm:w-auto px-6 sm:px-8 py-4 rounded-xl text-base sm:text-lg font-black transition-all hover:scale-105 hover:shadow-2xl"
                style={{ background: MOTYL_YELLOW, color: MOTYL_BLACK, boxShadow: `0 0 40px rgba(245,200,0,0.3)` }}
              >
                ⚡ Run AI on Motyl Plans
              </button>
              <a href="#roi"
                className="w-full sm:w-auto text-center px-6 sm:px-8 py-4 rounded-xl text-base sm:text-lg font-bold border transition-all hover:scale-105"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "white" }}>
                See the numbers →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI DEMO SECTION ──────────────────────────────────────────────────── */}
      <div className="py-24 px-6" style={{ background: MOTYL_DARK }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border"
              style={{ borderColor: "rgba(245,200,0,0.3)", color: MOTYL_YELLOW, background: "rgba(245,200,0,0.08)" }}>
              LIVE DEMO — YOUR REAL PLANS
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Watch it read<br /><span style={{ color: MOTYL_YELLOW }}>your APT 314 plans</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              These are the actual Motyl plans from your last project. One click. No setup. No login.
            </p>
          </div>

          {/* Plans loaded card */}
          <div className="rounded-2xl border p-6 mb-6"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(245,200,0,0.2)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-white font-bold text-lg">Motyl Group — APT 314 Kitchen Type-F</div>
                <div className="text-white/40 text-sm">2 documents pre-loaded · Ready to analyse</div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Plans Ready
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "📐", title: "Kitchen Plan (J01-F)", sub: "Plan + Elevation · 2 pages · 1:20 scale", detail: "JF-01 to JF-06 · 2400mm run" },
                { icon: "📋", title: "Materials Schedule", sub: "Full spec sheet · Polytec · Blum · Castella", detail: "Products + codes + finishes" },
              ].map((doc) => (
                <div key={doc.title} className="rounded-xl p-4 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                  <div className="text-2xl mb-2">{doc.icon}</div>
                  <div className="text-white font-semibold text-sm">{doc.title}</div>
                  <div className="text-white/40 text-xs mt-1">{doc.sub}</div>
                  <div className="text-xs mt-1 font-mono" style={{ color: MOTYL_YELLOW }}>{doc.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Run button */}
          {!result && (
            <button
              onClick={handleRunDemo}
              disabled={running}
              className="w-full py-5 rounded-2xl text-xl font-black transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
              style={{ background: running ? "rgba(245,200,0,0.3)" : MOTYL_YELLOW, color: MOTYL_BLACK, boxShadow: running ? "none" : `0 0 60px rgba(245,200,0,0.4)` }}
            >
              {running ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  AI is reading your plans... {elapsed}s
                </span>
              ) : "⚡ Run AI Takeoff on Motyl Plans"}
              {/* Shimmer */}
              {!running && (
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)", animation: "shimmer 2s infinite" }} />
              )}
            </button>
          )}

          {/* Progress bar while running */}
          {running && (
            <div className="mt-4 rounded-xl border p-6" style={{ background: "rgba(245,200,0,0.05)", borderColor: "rgba(245,200,0,0.2)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold">AI analysing plans...</span>
                <span style={{ color: MOTYL_YELLOW }} className="font-mono text-sm">{elapsed}s elapsed</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ background: MOTYL_YELLOW, width: `${Math.min(elapsed * 3, 90)}%`, boxShadow: `0 0 12px rgba(245,200,0,0.6)` }} />
              </div>
              <div className="mt-3 space-y-1">
                {[
                  { t: 2, msg: "✓ Reading Kitchen Plan (J01-F) — Page 1 of 2" },
                  { t: 5, msg: "✓ Reading Materials Schedule — Polytec, Blum, Castella detected" },
                  { t: 9, msg: "✓ Extracting cabinet codes JF-01 to JF-06..." },
                  { t: 14, msg: "✓ Applying 2024-25 Australian trade pricing..." },
                  { t: 20, msg: "✓ Calculating labour hours and markup..." },
                ].filter(s => elapsed >= s.t).map((s, i) => (
                  <div key={i} className="text-xs font-mono" style={{ color: MOTYL_YELLOW }}>{s.msg}</div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div ref={resultsRef} className="mt-6 rounded-2xl border overflow-hidden"
              style={{ borderColor: "rgba(245,200,0,0.3)", background: "rgba(255,255,255,0.02)" }}>
              {/* Results header */}
              <div className="px-6 py-5 border-b flex flex-wrap items-center gap-4"
                style={{ borderColor: "rgba(245,200,0,0.2)", background: "rgba(245,200,0,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-black text-lg" style={{ color: MOTYL_YELLOW }}>
                    {result.confidence}% Confidence
                  </span>
                </div>
                <Badge className="bg-white/10 text-white border-white/20 font-bold">
                  {result.items.length} line items
                </Badge>
                <Badge className="bg-blue-900/30 text-blue-300 border-blue-700/50">
                  {result.pricing?.labourHours != null
                    ? Math.round(result.pricing.labourHours * 10) / 10
                    : Math.round(result.items.reduce((s, i) => s + (i.quantity * i.labourMinutes) / 60, 0) * 10) / 10
                  }h labour
                </Badge>
                <Badge className="font-bold" style={{ background: "rgba(245,200,0,0.15)", color: MOTYL_YELLOW, border: `1px solid rgba(245,200,0,0.3)` }}>
                  Total: {formatCurrency(result.pricing?.total ?? 0)}
                </Badge>
                <span className="text-white/40 text-xs ml-auto">Completed in {elapsed}s</span>
              </div>

              {/* Tabs */}
              <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                {(["items", "quote", "assumptions"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="px-6 py-3 text-sm font-semibold capitalize transition-colors"
                    style={{
                      color: activeTab === tab ? MOTYL_YELLOW : "rgba(255,255,255,0.4)",
                      borderBottom: activeTab === tab ? `2px solid ${MOTYL_YELLOW}` : "2px solid transparent",
                      background: "transparent",
                    }}>
                    {tab === "items" ? "Materials Takeoff" : tab === "quote" ? "Quote Summary" : "AI Assumptions"}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-6 overflow-x-auto">
                {activeTab === "items" && (
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-xs text-white/40 uppercase tracking-wider pb-3 pr-4">Description</th>
                        <th className="text-right text-xs text-white/40 uppercase tracking-wider pb-3 pr-3">Qty</th>
                        <th className="text-right text-xs text-white/40 uppercase tracking-wider pb-3 pr-3">Trade $/unit</th>
                        <th className="text-right text-xs text-white/40 uppercase tracking-wider pb-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((item, i) => <ResultRow key={i} item={item} index={i} />)}
                    </tbody>
                  </table>
                )}

                {activeTab === "quote" && result.pricing && (
                  <div className="max-w-md mx-auto space-y-3">
                    {[
                      { label: "Materials (trade price)", value: result.pricing.materialsCostTrade, color: "text-white" },
                      { label: `Labour (${Math.round(result.pricing.labourHours * 10) / 10}h @ $95/hr)`, value: result.pricing.labourCost, color: "text-white" },
                      { label: "Subtotal", value: result.pricing.subtotal, color: "text-white", border: true },
                      { label: "Markup (20%)", value: result.pricing.markupAmount, color: "" },
                      { label: "GST (10%)", value: result.pricing.gst, color: "text-white/50" },
                    ].map((row, i) => (
                      <div key={i} className={`flex justify-between py-2.5 ${row.border ? "border-t border-white/10 mt-2" : ""}`}>
                        <span className="text-white/50">{row.label}</span>
                        <span className={`font-semibold ${row.color}`} style={row.label.includes("Markup") ? { color: MOTYL_YELLOW } : {}}>
                          {formatCurrency(row.value)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-4 border-t-2 mt-2" style={{ borderColor: MOTYL_YELLOW }}>
                      <span className="text-white font-black text-xl">Total inc GST</span>
                      <span className="font-black text-2xl" style={{ color: MOTYL_YELLOW }}>{formatCurrency(result.pricing.total)}</span>
                    </div>
                    <div className="rounded-xl p-4 mt-2" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                      <div className="text-xs text-green-400 uppercase tracking-wider mb-1">Trade savings vs retail</div>
                      <div className="text-2xl font-black text-green-400">{formatCurrency(result.pricing.tradeSavings ?? 0)} saved</div>
                      <div className="text-xs text-white/30 mt-1">buying at trade vs retail pricing</div>
                    </div>
                  </div>
                )}

                {activeTab === "assumptions" && (
                  <div className="space-y-2">
                    {result.planNotes && (
                      <div className="rounded-xl p-4 mb-4 text-sm italic text-white/60 border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
                        "{result.planNotes}"
                      </div>
                    )}
                    {result.assumptions.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm text-white/70 py-1.5">
                        <span style={{ color: MOTYL_YELLOW }} className="mt-0.5 flex-shrink-0">✓</span>
                        {a}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            {/* ── PDF Download button ── */}
            {result && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    const lines: string[] = [];
                    lines.push("KINDAI AI TAKEOFF — MOTYL GROUP");
                    lines.push("APT 314 Kitchen Type-F · Generated by Kindai Estimating Suite");
                    lines.push("");
                    lines.push(`Confidence: ${result.confidence}%`);
                    lines.push("");
                    lines.push("MATERIALS TAKEOFF");
                    lines.push("-".repeat(60));
                    result.items.forEach((item) => {
                      lines.push(`${item.description}  |  Qty: ${item.quantity} ${item.unit}  |  Trade: $${(item.tradePrice * item.quantity).toFixed(0)}`);
                    });
                    lines.push("");
                    lines.push("QUOTE SUMMARY");
                    lines.push("-".repeat(60));
                    if (result.pricing) {
                      lines.push(`Materials (trade):  ${formatCurrency(result.pricing.materialsCostTrade)}`);
                      lines.push(`Labour (${Math.round(result.pricing.labourHours * 10) / 10}h @ $95/hr):  ${formatCurrency(result.pricing.labourCost)}`);
                      lines.push(`Markup (20%):  ${formatCurrency(result.pricing.markupAmount)}`);
                      lines.push(`GST (10%):  ${formatCurrency(result.pricing.gst)}`);
                      lines.push("");
                      lines.push(`TOTAL INC GST:  ${formatCurrency(result.pricing.total)}`);
                      lines.push(`Trade savings vs retail:  ${formatCurrency(result.pricing.tradeSavings ?? 0)}`);
                    }
                    lines.push("");
                    lines.push("Generated by Kindai Estimating Suite — kindaiestimator.com");
                    lines.push("Contact: matthew@kindai.com.au");
                    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "Kindai-Takeoff-Motyl-APT314.txt";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-3 px-8 py-4 rounded-xl font-black text-base transition-all hover:scale-105 hover:shadow-2xl"
                  style={{ background: MOTYL_YELLOW, color: MOTYL_BLACK, boxShadow: `0 0 30px rgba(245,200,0,0.25)` }}
                >
                  ⬇ Download Quote Summary
                </button>
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {/* ── ROI CALCULATOR ───────────────────────────────────────────────────── */}
      <div id="roi" className="py-24 px-6" style={{ background: "#0D0D0D" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border"
              style={{ borderColor: "rgba(245,200,0,0.3)", color: MOTYL_YELLOW, background: "rgba(245,200,0,0.08)" }}>
              MOTYL ROI CALCULATOR
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              What's manual estimating<br /><span style={{ color: MOTYL_YELLOW }}>actually costing Motyl?</span>
            </h2>
            <p className="text-white/50 text-lg">Move the sliders. Watch the number.</p>
          </div>

          {/* Tab toggle */}
          <div className="flex justify-center mb-8">
            <div className="flex rounded-xl p-1 gap-1" style={{ background: "rgba(255,255,255,0.05)" }}>
              {[{ key: "time", label: "Time Cost" }, { key: "staff", label: "Staff Cost" }].map((t) => (
                <button key={t.key} onClick={() => setStaffTab(t.key as "time" | "staff")}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all"
                  style={{
                    background: staffTab === t.key ? MOTYL_YELLOW : "transparent",
                    color: staffTab === t.key ? MOTYL_BLACK : "rgba(255,255,255,0.5)",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Sliders */}
            <div className="rounded-2xl border p-8 space-y-8" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
              {staffTab === "time" ? (
                <>
                  <div>
                    <div className="flex justify-between mb-3">
                      <span className="text-white/70 text-sm font-semibold">Projects quoted per year</span>
                      <span className="font-black text-xl" style={{ color: MOTYL_YELLOW }}>{roiProjects}</span>
                    </div>
                    <input type="range" min={10} max={300} value={roiProjects} onChange={e => setRoiProjects(+e.target.value)}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: MOTYL_YELLOW }} />
                    <div className="flex justify-between text-xs text-white/30 mt-1"><span>10</span><span>300</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-3">
                      <span className="text-white/70 text-sm font-semibold">Hours per manual takeoff</span>
                      <span className="font-black text-xl" style={{ color: MOTYL_YELLOW }}>{roiHours}h</span>
                    </div>
                    <input type="range" min={1} max={12} value={roiHours} onChange={e => setRoiHours(+e.target.value)}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: MOTYL_YELLOW }} />
                    <div className="flex justify-between text-xs text-white/30 mt-1"><span>1h</span><span>12h</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-3">
                      <span className="text-white/70 text-sm font-semibold">Estimator cost ($/hr loaded)</span>
                      <span className="font-black text-xl" style={{ color: MOTYL_YELLOW }}>${Math.round(hourlyRate)}/hr</span>
                    </div>
                    <input type="range" min={50000} max={120000} step={5000} value={roiSalary} onChange={e => setRoiSalary(+e.target.value)}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: MOTYL_YELLOW }} />
                    <div className="flex justify-between text-xs text-white/30 mt-1"><span>$50K/yr</span><span>$120K/yr</span></div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between mb-3">
                      <span className="text-white/70 text-sm font-semibold">Estimator / draughtsman salary</span>
                      <span className="font-black text-xl" style={{ color: MOTYL_YELLOW }}>{formatCurrency(roiSalary)}/yr</span>
                    </div>
                    <input type="range" min={50000} max={120000} step={5000} value={roiSalary} onChange={e => setRoiSalary(+e.target.value)}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: MOTYL_YELLOW }} />
                    <div className="flex justify-between text-xs text-white/30 mt-1"><span>$50K</span><span>$120K</span></div>
                  </div>
                  <div className="rounded-xl p-4 border" style={{ background: "rgba(245,200,0,0.05)", borderColor: "rgba(245,200,0,0.2)" }}>
                    <div className="text-white/60 text-sm mb-2">Kindai replaces ~80% of the estimating role</div>
                    <div className="text-white/60 text-sm">One employee manages the tool, checks output, handles clients.</div>
                    <div className="text-white/60 text-sm mt-2">The other role? Redeployed or removed.</div>
                  </div>
                </>
              )}
            </div>

            {/* Results */}
            <div className="space-y-4">
              {staffTab === "time" ? (
                <>
                  <div className="rounded-2xl border p-6" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}>
                    <div className="text-xs text-red-400 uppercase tracking-wider mb-2">Current annual cost (manual)</div>
                    <div className="text-4xl font-black text-red-400">
                      <AnimatedNumber value={Math.round(manualCost)} prefix="$" />
                    </div>
                    <div className="text-white/40 text-sm mt-1">{roiProjects} projects × {roiHours}h × ${Math.round(hourlyRate)}/hr</div>
                  </div>
                  <div className="rounded-2xl border p-6" style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.2)" }}>
                    <div className="text-xs text-green-400 uppercase tracking-wider mb-2">With Kindai (30 min/takeoff)</div>
                    <div className="text-4xl font-black text-green-400">
                      <AnimatedNumber value={Math.round(kindaiCost + kindaiSubscription)} prefix="$" />
                    </div>
                    <div className="text-white/40 text-sm mt-1">{roiProjects} projects × 0.5h — contact us for pricing</div>
                  </div>
                  <div className="rounded-2xl border p-6" style={{ background: "rgba(245,200,0,0.08)", borderColor: "rgba(245,200,0,0.3)" }}>
                    <div className="text-xs uppercase tracking-wider mb-2" style={{ color: MOTYL_YELLOW }}>Net saving after Kindai</div>
                    <div className="text-5xl font-black" style={{ color: MOTYL_YELLOW }}>
                      <AnimatedNumber value={Math.max(0, Math.round(netSaving))} prefix="$" />
                    </div>
                    <div className="text-white/40 text-sm mt-1">per year — contact us for commercial pricing</div>
                    <div className="flex gap-6 mt-4">
                      <div><div className="text-2xl font-black text-white"><AnimatedNumber value={Math.max(0, roiMultiple)} suffix="x" /></div><div className="text-xs text-white/40">ROI</div></div>
                      <div><div className="text-2xl font-black text-white"><AnimatedNumber value={hoursSaved > 0 ? Math.round(hoursSaved / 5) : 0} suffix="d" /></div><div className="text-xs text-white/40">Days saved</div></div>
                      <div><div className="text-2xl font-black text-white"><AnimatedNumber value={hoursSaved} suffix="h" /></div><div className="text-xs text-white/40">Hours saved</div></div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border p-6" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}>
                    <div className="text-xs text-red-400 uppercase tracking-wider mb-2">Current staff cost (estimator role)</div>
                    <div className="text-4xl font-black text-red-400">
                      <AnimatedNumber value={roiSalary} prefix="$" suffix="/yr" />
                    </div>
                    <div className="text-white/40 text-sm mt-1">Salary + super + leave + tools + office</div>
                  </div>
                  <div className="rounded-2xl border p-6" style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.2)" }}>
                    <div className="text-xs text-green-400 uppercase tracking-wider mb-2">Kindai replaces 80% of that role</div>
                    <div className="text-4xl font-black text-green-400">
                      <span className="text-2xl">Contact us for pricing</span>
                    </div>
                    <div className="text-white/40 text-sm mt-1">No super · No leave · No office · No sick days</div>
                  </div>
                  <div className="rounded-2xl border p-6" style={{ background: "rgba(245,200,0,0.08)", borderColor: "rgba(245,200,0,0.3)" }}>
                    <div className="text-xs uppercase tracking-wider mb-2" style={{ color: MOTYL_YELLOW }}>Net saving per year</div>
                    <div className="text-5xl font-black" style={{ color: MOTYL_YELLOW }}>
                      <AnimatedNumber value={Math.max(0, staffNetSaving)} prefix="$" />
                    </div>
                    <div className="text-white/40 text-sm mt-1">That's {Math.round(staffNetSaving / roiSalary * 100)}% of the role cost saved</div>
                    <div className="mt-4 text-sm text-white/60">
                      One person still manages Kindai, checks outputs, and handles client relationships. The second seat is freed up.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── INTEGRATIONS ─────────────────────────────────────────────────────── */}
      <div className="py-24 px-6" style={{ background: MOTYL_DARK }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border"
              style={{ borderColor: "rgba(245,200,0,0.3)", color: MOTYL_YELLOW, background: "rgba(245,200,0,0.08)" }}>
              BUILT TO CONNECT
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Connects to everything<br /><span style={{ color: MOTYL_YELLOW }}>Motyl already uses</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Plans → quote → invoice → cut list. One flow. No double entry. No delays.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {integrations.map((int) => (
              <div key={int.name} className="rounded-2xl border p-6 flex flex-col gap-3 transition-all hover:scale-105 hover:border-opacity-60"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                  style={{ background: int.color + "22", color: int.color, border: `1px solid ${int.color}44` }}>
                  {int.name.slice(0, 2)}
                </div>
                <div>
                  <div className="text-white font-bold">{int.name}</div>
                  <div className="text-white/40 text-sm mt-0.5">{int.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* The vision */}
          <div className="rounded-2xl border p-8 text-center" style={{ background: "rgba(245,200,0,0.05)", borderColor: "rgba(245,200,0,0.2)" }}>
            <div className="text-white/60 text-lg mb-4 leading-relaxed max-w-3xl mx-auto">
              "Your CNC machine doesn't ask for a salary. It doesn't take sick days. It doesn't underquote because it was rushing.
              <strong className="text-white"> Kindai is the same thing — but for the front end of your business.</strong>"
            </div>
            <div className="text-white/30 text-sm">— Matthew Symons, Founder, Kindai</div>
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <div className="py-24 px-6 text-center relative overflow-hidden" style={{ background: MOTYL_BLACK }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(245,200,0,0.4) 0%, transparent 70%)" }} />
        <div className="relative max-w-3xl mx-auto">
          <img src={MOTYL_LOGO} alt="Motyl Group" className="h-10 object-contain mx-auto mb-8 opacity-60" />
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Ready to be the first<br />
            <span style={{ color: MOTYL_YELLOW }}>commercial joiner in SA</span><br />
            running AI estimating?
          </h2>
          <p className="text-white/50 text-xl mb-10 max-w-xl mx-auto">
            3 projects. No commitment. We set it up with your price book, your supplier rates, and your standard finishes. 30 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:matthew@kindai.com.au?subject=Kindai%20Pilot%20%E2%80%94%20Motyl%20Group&body=Hi%20Matthew%2C%0A%0AWe%27d%20like%20to%20start%20the%20free%20pilot%20for%20Motyl%20Group.%0A%0AProjects%20per%20year%3A%20%0AMain%20trade%3A%20Commercial%20joinery%20%2F%20shopfitting%0A%0AThanks"
              className="px-10 py-5 rounded-2xl text-xl font-black transition-all hover:scale-105"
              style={{ background: MOTYL_YELLOW, color: MOTYL_BLACK, boxShadow: `0 0 60px rgba(245,200,0,0.3)` }}
            >
              Start Free Pilot →
            </a>
            <a href="tel:+61884477877"
              className="px-10 py-5 rounded-2xl text-xl font-bold border transition-all hover:scale-105"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "white" }}>
              Call Motyl: 08 8447 7877
            </a>
          </div>
          <div className="mt-8 text-white/30 text-sm">
            matthew@kindai.com.au · kindaiestimator.com · Built by Kindai for Motyl Group
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        input[type=range]::-webkit-slider-thumb { background: ${MOTYL_YELLOW}; }
        input[type=range]::-moz-range-thumb { background: ${MOTYL_YELLOW}; border: none; }
      `}</style>
    </div>
  );
}
