import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

// Motyl brand colours
const MOTYL_YELLOW = "#F5A800";
const MOTYL_BLACK = "#1A1A1A";

// Pre-uploaded Motyl plan CDN URLs
const MOTYL_PLAN_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/motyl-apt314-kitchen-plan_5980945a.pdf";
const MOTYL_SPEC_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/motyl-apt314-materials-schedule_a9bfd1f6.pdf";

type DemoItem = {
  section: string;
  description: string;
  unit: string;
  quantity: number;
  tradePrice: number;
  retailPrice: number;
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

// ─── ROI Calculator ──────────────────────────────────────────────────────────
function ROICalculator() {
  const [projectsPerYear, setProjectsPerYear] = useState(80);
  const [hoursPerTakeoff, setHoursPerTakeoff] = useState(4);
  const [estimatorRate, setEstimatorRate] = useState(95);

  const currentCost = projectsPerYear * hoursPerTakeoff * estimatorRate;
  const kindaiTime = 0.5; // 30 min per takeoff with Kindai
  const kindaiCost = projectsPerYear * kindaiTime * estimatorRate;
  const annualSaving = currentCost - kindaiCost;
  const kindaiSubscription = 799 * 12; // Commercial tier
  const netSaving = annualSaving - kindaiSubscription;
  const roiMultiple = Math.round(annualSaving / kindaiSubscription);
  const paybackDays = Math.round((kindaiSubscription / annualSaving) * 365);

  return (
    <div className="rounded-2xl overflow-hidden border border-[#F5A800]/30 bg-[#111]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#F5A800]/20" style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #222 100%)" }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">💰</span>
          <h3 className="text-xl font-bold text-white">Motyl ROI Calculator</h3>
        </div>
        <p className="text-gray-400 text-sm">How much is manual estimating costing Motyl Group right now?</p>
      </div>

      <div className="p-8 grid md:grid-cols-2 gap-8">
        {/* Sliders */}
        <div className="space-y-8">
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">Projects quoted per year</label>
              <span className="text-[#F5A800] font-bold text-lg">{projectsPerYear}</span>
            </div>
            <Slider
              min={10} max={300} step={5}
              value={[projectsPerYear]}
              onValueChange={([v]) => setProjectsPerYear(v)}
              className="accent-yellow-400"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10</span><span>300</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">Hours per manual takeoff</label>
              <span className="text-[#F5A800] font-bold text-lg">{hoursPerTakeoff}h</span>
            </div>
            <Slider
              min={1} max={12} step={0.5}
              value={[hoursPerTakeoff]}
              onValueChange={([v]) => setHoursPerTakeoff(v)}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1h</span><span>12h</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">Estimator cost ($/hr loaded)</label>
              <span className="text-[#F5A800] font-bold text-lg">${estimatorRate}/hr</span>
            </div>
            <Slider
              min={60} max={180} step={5}
              value={[estimatorRate]}
              onValueChange={([v]) => setEstimatorRate(v)}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$60</span><span>$180</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="rounded-xl p-4 bg-red-950/40 border border-red-800/40">
            <div className="text-xs text-red-400 uppercase tracking-wider mb-1">Current annual cost (manual)</div>
            <div className="text-3xl font-black text-red-400">{formatCurrency(currentCost)}</div>
            <div className="text-xs text-gray-500 mt-1">{projectsPerYear} projects × {hoursPerTakeoff}h × ${estimatorRate}/hr</div>
          </div>

          <div className="rounded-xl p-4 bg-green-950/40 border border-green-800/40">
            <div className="text-xs text-green-400 uppercase tracking-wider mb-1">With Kindai (30 min/takeoff)</div>
            <div className="text-3xl font-black text-green-400">{formatCurrency(kindaiCost)}</div>
            <div className="text-xs text-gray-500 mt-1">{projectsPerYear} projects × 0.5h × ${estimatorRate}/hr</div>
          </div>

          <div className="rounded-xl p-5 border-2 border-[#F5A800]" style={{ background: "linear-gradient(135deg, #1A1A1A, #222)" }}>
            <div className="text-xs text-[#F5A800] uppercase tracking-wider mb-1">Net saving after Kindai subscription</div>
            <div className="text-4xl font-black" style={{ color: MOTYL_YELLOW }}>{formatCurrency(netSaving)}</div>
            <div className="text-xs text-gray-400 mt-1">per year · Kindai Commercial = $799/mo</div>
            <div className="flex gap-3 mt-3">
              <div className="text-center">
                <div className="text-xl font-black text-white">{roiMultiple}x</div>
                <div className="text-xs text-gray-500">ROI</div>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="text-center">
                <div className="text-xl font-black text-white">{paybackDays}d</div>
                <div className="text-xs text-gray-500">Payback</div>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="text-center">
                <div className="text-xl font-black text-white">{Math.round(projectsPerYear * (hoursPerTakeoff - kindaiTime)).toLocaleString()}h</div>
                <div className="text-xs text-gray-500">Hours saved</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Live Demo Section ────────────────────────────────────────────────────────
function LiveDemo() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"materials" | "quote">("materials");
  const resultsRef = useRef<HTMLDivElement>(null);

  const runDemo = trpc.demo.runDemo.useMutation();

  // Convert PDF URL to base64 pages via the upload endpoint
  const uploadPages = trpc.demo.uploadDemoPlanPages.useMutation();

  async function handleRunDemo() {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      // Fetch both PDFs and convert to base64
      const [planResp, specResp] = await Promise.all([
        fetch(MOTYL_PLAN_URL),
        fetch(MOTYL_SPEC_URL),
      ]);
      const [planBuf, specBuf] = await Promise.all([
        planResp.arrayBuffer(),
        specResp.arrayBuffer(),
      ]);

      const toBase64 = (buf: ArrayBuffer) => {
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      };

      // Upload both PDFs as pages
      const uploaded = await uploadPages.mutateAsync({
        pages: [
          { fileBase64: toBase64(planBuf), fileName: "motyl-apt314-kitchen-plan.pdf", contentType: "application/pdf" },
          { fileBase64: toBase64(specBuf), fileName: "motyl-apt314-materials-schedule.pdf", contentType: "application/pdf" },
        ],
      });

      const imageUrls = uploaded.pages.map((p) => p.url);

      // Run the AI demo
      const demoResult = await runDemo.mutateAsync({
        trade: "cabinetry",
        planImageUrls: imageUrls,
        jobDescription: "Motyl Group APT 314 Kitchen Type-F (J01-F). Commercial apartment kitchen joinery. Carcass: Polytec White 18mm MDF. Doors/Drawers: Polytec Gossamer White Smooth. Benchtop: Stone Ambassador Zenith Vitrified Ceramic. Splashback: Vridan Toughened Glass Mirror Backed. End Panels: Polytec Maison Oak Matt. Hardware: Castella Ledge 100mm handles, Blum LEGRABOX drawer systems. Sink: Verve 399 undermount. Appliances: SMEG induction cooktop + rangehood. 6 base cabinets (JF-01 to JF-06), 2400mm wide kitchen run.",
        markupPercent: 20,
        labourRate: 95,
        useTradePrice: true,
      });

      setResult(demoResult as DemoResult);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Plans preview */}
      <div className="rounded-2xl border border-[#F5A800]/30 bg-[#111] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F5A800]/20 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">Motyl Group — APT 314 Kitchen Type-F</h3>
            <p className="text-gray-400 text-sm mt-0.5">2 documents pre-loaded: Kitchen Plan (J01-F) + Materials Schedule</p>
          </div>
          <Badge className="bg-green-900/60 text-green-400 border-green-700">✓ Plans Ready</Badge>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#1A1A1A] border border-gray-700 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5A800]/10 flex items-center justify-center text-xl">📐</div>
            <div>
              <div className="text-sm font-medium text-white">Kitchen Plan (J01-F)</div>
              <div className="text-xs text-gray-400">Plan + Elevation views · 2 pages · 1:20 scale</div>
              <div className="text-xs text-[#F5A800] mt-0.5">JF-01 to JF-06 · 2400mm run</div>
            </div>
          </div>
          <div className="rounded-xl bg-[#1A1A1A] border border-gray-700 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5A800]/10 flex items-center justify-center text-xl">📋</div>
            <div>
              <div className="text-sm font-medium text-white">Materials Schedule</div>
              <div className="text-xs text-gray-400">Full spec sheet · Polytec · Blum · Castella</div>
              <div className="text-xs text-[#F5A800] mt-0.5">Products + codes + finishes</div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleRunDemo}
            disabled={isRunning}
            className="w-full py-4 rounded-xl font-black text-lg text-black transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99]"
            style={{ background: isRunning ? "#555" : `linear-gradient(135deg, ${MOTYL_YELLOW}, #FFD700)` }}
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI is reading your plans...
              </span>
            ) : result ? (
              "✓ Takeoff Complete — Run Again"
            ) : (
              "⚡ Run AI Takeoff on Motyl Plans"
            )}
          </button>
          {isRunning && (
            <p className="text-center text-xs text-gray-500 mt-2">Reading cabinet codes, dimensions, and spec sheet... ~30 seconds</p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-700 bg-red-950/40 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div ref={resultsRef} className="rounded-2xl border border-[#F5A800]/40 bg-[#111] overflow-hidden">
          {/* Results header */}
          <div className="px-6 py-5 border-b border-[#F5A800]/20" style={{ background: "linear-gradient(135deg, #1A1A1A, #222)" }}>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/50 border border-green-700">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 font-bold text-sm">{result.confidence}% Confidence</span>
              </div>
              <Badge className="bg-[#F5A800]/10 text-[#F5A800] border-[#F5A800]/30">{result.items.length} line items</Badge>
              <Badge className="bg-blue-900/40 text-blue-400 border-blue-700">
                {result.pricing?.labourHours != null
                  ? Math.round(result.pricing.labourHours * 10) / 10
                  : Math.round(result.items.reduce((s, i) => s + (i.quantity * i.labourMinutes) / 60, 0) * 10) / 10
                }h labour
              </Badge>
            </div>
            {result.planNotes && (
              <p className="text-gray-400 text-sm italic">"{result.planNotes}"</p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {(["materials", "quote"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "text-[#F5A800] border-b-2 border-[#F5A800]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "materials" ? "📦 Materials Takeoff" : "💵 Quote Summary"}
              </button>
            ))}
          </div>

          {/* Materials table */}
          {activeTab === "materials" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#1A1A1A]">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Item</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Qty</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Unit</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Trade $</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-[#1A1A1A]/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium text-sm">{item.description}</div>
                        <div className="text-xs text-gray-500">{item.section} · {item.category}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs">{item.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-300">${item.tradePrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-white">
                        {formatCurrency(item.quantity * item.tradePrice * (1 + item.wasteFactor / 100))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Quote summary */}
          {activeTab === "quote" && result.pricing && (
            <div className="p-6 max-w-md mx-auto space-y-3">
              {[
              { label: "Materials (trade price)", value: result.pricing.materialsCostTrade, color: "text-white" },
              { label: `Labour (${Math.round(result.pricing.labourHours * 10) / 10}h @ $95/hr)`, value: result.pricing.labourCost, color: "text-white" },
              { label: "Subtotal", value: result.pricing.subtotal, color: "text-white", border: true },
              { label: "Markup (20%)", value: result.pricing.markupAmount, color: "text-[#F5A800]" },
              { label: "GST (10%)", value: result.pricing.gst, color: "text-gray-400" },
              ].map((row, i) => (
                <div key={i} className={`flex justify-between py-2 ${row.border ? "border-t border-gray-700" : ""}`}>
                  <span className="text-gray-400">{row.label}</span>
                  <span className={`font-semibold ${row.color}`}>{formatCurrency(row.value)}</span>
                </div>
              ))}
              <div className="flex justify-between py-3 border-t-2 border-[#F5A800]">
                <span className="text-white font-bold text-lg">Total inc GST</span>
                <span className="font-black text-2xl" style={{ color: MOTYL_YELLOW }}>{formatCurrency(result.pricing.total)}</span>
              </div>
              <div className="rounded-xl bg-green-950/40 border border-green-800/40 p-4 mt-4">
                <div className="text-xs text-green-400 uppercase tracking-wider mb-1">Trade savings vs retail</div>
                <div className="text-2xl font-black text-green-400">
                  {formatCurrency(result.pricing.tradeSavings ?? 0)} saved
                </div>
                <div className="text-xs text-gray-500 mt-1">buying at trade vs retail pricing</div>
              </div>
            </div>
          )}

          {/* Assumptions */}
          {result.assumptions && result.assumptions.length > 0 && (
            <div className="px-6 pb-6">
              <div className="rounded-xl bg-[#1A1A1A] border border-gray-700 p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">AI Assumptions</div>
                <ul className="space-y-1">
                  {result.assumptions.slice(0, 5).map((a, i) => (
                    <li key={i} className="text-xs text-gray-400 flex gap-2">
                      <span className="text-[#F5A800] mt-0.5">→</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MotylDemo() {
  useEffect(() => {
    document.title = "Kindai × Motyl Group — AI Estimating Demo";
  }, []);

  return (
    <div className="min-h-screen" style={{ background: MOTYL_BLACK, color: "white" }}>
      {/* Top bar */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Kindai logo */}
          <Link href="/">
            <span className="font-black text-lg tracking-tight" style={{ color: MOTYL_YELLOW }}>kindai</span>
          </Link>
          <span className="text-gray-600">×</span>
          {/* Motyl logo text */}
          <span className="font-bold text-white text-sm tracking-widest uppercase">MOTYL GROUP</span>
        </div>
        <a
          href="mailto:matthew@kindai.com.au?subject=Kindai%20Demo%20Follow-Up%20%E2%80%94%20Motyl%20Group"
          className="text-xs px-4 py-2 rounded-full font-semibold text-black transition-all hover:brightness-110"
          style={{ background: MOTYL_YELLOW }}
        >
          Book a Call with Matthew →
        </a>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#F5A800]/30 bg-[#F5A800]/5 text-[#F5A800] text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[#F5A800] animate-pulse" />
          Prepared exclusively for Motyl Group
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4">
          What if your plans<br />
          <span style={{ color: MOTYL_YELLOW }}>quoted themselves?</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-3">
          We took your real APT 314 Kitchen Type-F plans and ran them through Kindai's AI.
          Below is what it produced — in under 60 seconds.
        </p>
        <p className="text-sm text-gray-600">
          Polytec Gossamer White Smooth · Blum LEGRABOX · Castella Ledge · Zenith Vitrified Ceramic — all read directly from your spec sheet.
        </p>
      </div>

      {/* Stats bar */}
      <div className="border-y border-gray-800 bg-[#111]">
        <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Time to takeoff", value: "< 60 sec", sub: "vs 4+ hours manual" },
            { label: "Confidence score", value: "96–98%", sub: "with spec sheet" },
            { label: "Motyl projects/yr", value: "365", sub: "completed projects" },
            { label: "Potential saving", value: "$120K+", sub: "per year for Motyl" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-black" style={{ color: MOTYL_YELLOW }}>{s.value}</div>
              <div className="text-sm text-white font-medium">{s.label}</div>
              <div className="text-xs text-gray-500">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">

        {/* Section 1: Live Demo */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-black text-sm" style={{ background: MOTYL_YELLOW }}>1</div>
            <h2 className="text-2xl font-bold text-white">Live AI Takeoff — Your Real Plans</h2>
          </div>
          <LiveDemo />
        </section>

        {/* Section 2: ROI Calculator */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-black text-sm" style={{ background: MOTYL_YELLOW }}>2</div>
            <h2 className="text-2xl font-bold text-white">What's Manual Estimating Costing Motyl?</h2>
          </div>
          <ROICalculator />
        </section>

        {/* Section 3: How it works */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-black text-sm" style={{ background: MOTYL_YELLOW }}>3</div>
            <h2 className="text-2xl font-bold text-white">How Kindai Works for Motyl</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: "📤", title: "Upload your plans", body: "Drag in any PDF — shop drawings, joinery elevations, materials schedules. Up to 50 pages per project." },
              { icon: "🤖", title: "AI reads everything", body: "Kindai reads every cabinet code, dimension, material callout, and product spec. It uses your exact Polytec and Blum codes — not generic substitutes." },
              { icon: "📄", title: "Quote in 60 seconds", body: "Full materials takeoff with trade pricing, labour hours, markup, and GST. One click to PDF. Ready to send." },
            ].map((step) => (
              <div key={step.title} className="rounded-xl bg-[#111] border border-gray-800 p-5">
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="font-bold text-white mb-2">{step.title}</div>
                <div className="text-sm text-gray-400">{step.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border-2 border-[#F5A800] p-8 text-center" style={{ background: "linear-gradient(135deg, #1A1A1A, #222)" }}>
          <h2 className="text-3xl font-black text-white mb-3">
            Ready to see it on a full<br />
            <span style={{ color: MOTYL_YELLOW }}>commercial shopfit project?</span>
          </h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            We can set up a Motyl-specific account with your price book, supplier rates, and standard finishes pre-loaded. 30-minute setup. No IT required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:matthew@kindai.com.au?subject=Kindai%20Demo%20Follow-Up%20%E2%80%94%20Motyl%20Group&body=Hi%20Matthew%2C%0A%0AI%27d%20like%20to%20discuss%20setting%20up%20Kindai%20for%20Motyl%20Group."
              className="px-8 py-4 rounded-xl font-black text-black text-lg transition-all hover:brightness-110"
              style={{ background: MOTYL_YELLOW }}
            >
              Book a Call with Matthew →
            </a>
            <a
              href="https://kindaiestimator.com/demo"
              className="px-8 py-4 rounded-xl font-semibold text-white border border-gray-600 hover:border-gray-400 transition-colors"
            >
              Try the Full Demo
            </a>
          </div>
          <p className="text-xs text-gray-600 mt-4">matthew@kindai.com.au · kindaiestimator.com</p>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 px-6 py-6 text-center text-xs text-gray-600">
        <p>This page was prepared by Kindai specifically for Motyl Group. The AI takeoff above uses real Motyl plans.</p>
        <p className="mt-1">© 2025 Kindai Estimating Suite · <a href="https://kindaiestimator.com" className="hover:text-gray-400">kindaiestimator.com</a></p>
      </div>
    </div>
  );
}
