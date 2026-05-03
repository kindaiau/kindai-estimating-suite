import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// ─── GetGas brand constants ────────────────────────────────────────────────────
const GG_RED = "#E8003D";
const GG_BLACK = "#0A0A0A";
const GG_DARK = "#111111";
const GG_CARD = "#161616";
const GG_BORDER = "rgba(232,0,61,0.2)";
const KINDAI_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

// ─── Real GetGas package pricing from ServiceM8 (9,042 jobs analysed) ─────────
const GG_PACKAGES = [
  {
    id: "single_story",
    name: "1st & 2nd Fix — Single Storey",
    description: "Complete gas installation for a single storey new home. Hot plate & hot water included.",
    avgPrice: 1810,
    builderRate: 1679,
    plumberRate: 1219,
    jobCount: 264,
    includes: ["1st fix rough-in", "2nd fix appliance connections", "Hot water connection", "Cooktop connection", "Sound test & commissioning", "AS/NZS 5601 compliance cert"],
    category: "new_build",
    icon: "🏠",
  },
  {
    id: "double_story",
    name: "1st & 2nd Fix — Double Storey",
    description: "Complete gas installation for a double storey new home. Hot plate & hot water included.",
    avgPrice: 2323,
    builderRate: 1886,
    plumberRate: 1426,
    jobCount: 235,
    includes: ["1st fix rough-in (both levels)", "2nd fix appliance connections", "Hot water connection", "Cooktop connection", "Sound test & commissioning", "AS/NZS 5601 compliance cert"],
    category: "new_build",
    icon: "🏢",
  },
  {
    id: "appliance_std",
    name: "Standard Appliance Package",
    description: "Cooktop + hot water gas connection. Standard residential package.",
    avgPrice: 206,
    builderRate: null,
    plumberRate: null,
    jobCount: 718,
    includes: ["Gas cooktop connection", "Hot water gas connection", "Compliance check", "Sound test"],
    category: "appliance",
    icon: "🔥",
  },
  {
    id: "appliance_bayonet",
    name: "Appliance Package + Bayonet",
    description: "Cooktop, hot water, and outdoor bayonet connection.",
    avgPrice: 284,
    builderRate: null,
    plumberRate: null,
    jobCount: 183,
    includes: ["Gas cooktop connection", "Hot water gas connection", "Bayonet outlet installation", "Sound test"],
    category: "appliance",
    icon: "🔥",
  },
  {
    id: "bbq_standard",
    name: "BBQ Installation — Standard",
    description: "Standard BBQ gas connection with bayonet outlet.",
    avgPrice: 350,
    builderRate: null,
    plumberRate: null,
    jobCount: 183,
    includes: ["BBQ gas point", "Bayonet outlet", "Compliance check", "Sound test"],
    category: "bbq",
    icon: "🍖",
  },
  {
    id: "bbq_interlock_ff",
    name: "BBQ + Interlock (With Flame Failure)",
    description: "BBQ installation with safety interlock system and flame failure device.",
    avgPrice: 1639,
    builderRate: null,
    plumberRate: null,
    jobCount: 74,
    includes: ["BBQ gas point", "Safety interlock system", "Flame failure device", "Compliance cert", "Sound test"],
    category: "bbq",
    icon: "🍖",
  },
  {
    id: "bbq_interlock_no_ff",
    name: "BBQ + Interlock (No Flame Failure)",
    description: "BBQ installation with safety interlock system, no flame failure device.",
    avgPrice: 2865,
    builderRate: null,
    plumberRate: null,
    jobCount: 75,
    includes: ["BBQ gas point", "Safety interlock system", "Full interlock wiring", "Compliance cert", "Sound test"],
    category: "bbq",
    icon: "🍖",
  },
  {
    id: "inground",
    name: "Inground Pipework",
    description: "Underground gas pipe installation. Price varies with run length and depth.",
    avgPrice: 2804,
    builderRate: null,
    plumberRate: null,
    jobCount: 217,
    includes: ["Excavation", "PE yellow gas pipe", "Backfill & reinstatement", "Pressure test", "Compliance documentation"],
    category: "infrastructure",
    icon: "⛏️",
  },
  {
    id: "excess_flow_950",
    name: "Excess Flow Valve — 950MJ/H",
    description: "Safety excess flow valve for high-demand installations.",
    avgPrice: 330,
    builderRate: null,
    plumberRate: null,
    jobCount: 90,
    includes: ["Excess flow valve supply", "Installation", "Pressure test"],
    category: "safety",
    icon: "🛡️",
  },
  {
    id: "lpg_reg",
    name: "LPG Regulator Kit Setup",
    description: "LPG cylinder regulator installation and setup.",
    avgPrice: 601,
    builderRate: null,
    plumberRate: null,
    jobCount: 27,
    includes: ["LPG regulator supply", "Installation", "Pressure test", "Compliance check"],
    category: "lpg",
    icon: "🔵",
  },
  {
    id: "pool_heater",
    name: "Pool Heater Connection",
    description: "Gas connection for pool or spa heater.",
    avgPrice: 238,
    builderRate: null,
    plumberRate: null,
    jobCount: 17,
    includes: ["Gas pipe extension to heater", "Appliance connection", "Pressure test", "Commissioning"],
    category: "appliance",
    icon: "🏊",
  },
  {
    id: "cooktop",
    name: "Cooktop Installation",
    description: "Standalone gas cooktop connection.",
    avgPrice: 126,
    builderRate: null,
    plumberRate: null,
    jobCount: 73,
    includes: ["Cooktop gas connection", "Flexible hose", "Sound test"],
    category: "appliance",
    icon: "🍳",
  },
];

// ─── Top gas materials from Reece/ServiceM8 ───────────────────────────────────
const GG_MATERIALS = [
  { name: "DUOPEX GAS PIPE 20MM BAR 5MTR", cost: 36.37, sell: 40.01, unit: "LEN" },
  { name: "DUOPEX GAS PIPE 26MM BAR 5MTR", cost: 55.30, sell: 60.83, unit: "LEN" },
  { name: "DUOPEX GAS PIPE 32MM BAR 5MTR", cost: 77.79, sell: 85.57, unit: "LEN" },
  { name: "FLEX HOSE 20MM GAS (3/4\" MXF) 600MM", cost: 40.43, sell: 60.65, unit: "EA" },
  { name: "FLEX HOSE 20MM GAS (3/4\" MXF) 900MM", cost: 44.50, sell: 66.75, unit: "EA" },
  { name: "DURA FLEX HOSE 10MM GAS (1/2\"MXF) 450MM", cost: 21.11, sell: 23.22, unit: "EA" },
  { name: "B-PRESS GAS STR CONNECTOR 15MM", cost: 9.82, sell: 10.80, unit: "EA" },
  { name: "B-PRESS GAS STR CONNECTOR 20MM", cost: 12.76, sell: 14.04, unit: "EA" },
  { name: "B-PRESS GAS ELBOW 90DEG X 15MM", cost: 12.23, sell: 13.45, unit: "EA" },
  { name: "B-PRESS GAS ELBOW 90DEG X 20MM", cost: 15.44, sell: 16.98, unit: "EA" },
  { name: "DUOPEX GAS CRIMP STRAIGHT FITTING 20", cost: 8.00, sell: 8.80, unit: "EA" },
  { name: "DUOPEX GAS CRIMP ELBOW 20MM", cost: 9.08, sell: 9.99, unit: "EA" },
  { name: "DUOPEX GAS CRIMP TEE 20MM", cost: 13.88, sell: 15.27, unit: "EA" },
  { name: "PE GAS PIPE Y/S SDR11 PE100 50 X 7M", cost: 46.20, sell: 69.30, unit: "LEN" },
  { name: "ARCO COMBI VALVE", cost: 25.53, sell: 38.30, unit: "EA" },
];

// ─── Staff ────────────────────────────────────────────────────────────────────
const GG_STAFF = ["Matthew Symons", "Steven Pogorecki", "Paul Tucker", "Luke Pogorecki"];

type DemoResult = {
  items: Array<{
    description: string;
    unit: string;
    quantity: number;
    retailPrice: number;
    tradePrice: number;
    labourMinutes: number;
    wasteFactor: number;
    category: string;
  }>;
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

function PackageCard({ pkg, selected, onSelect }: { pkg: typeof GG_PACKAGES[0]; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-xl p-4 transition-all duration-200"
      style={{
        background: selected ? "rgba(232,0,61,0.12)" : GG_CARD,
        border: `1px solid ${selected ? GG_RED : "rgba(255,255,255,0.08)"}`,
        transform: selected ? "scale(1.01)" : "scale(1)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{pkg.icon}</span>
          <span className="text-sm font-semibold text-white">{pkg.name}</span>
        </div>
        <Badge className="text-xs shrink-0" style={{ background: selected ? GG_RED : "rgba(255,255,255,0.1)", color: "white", border: "none" }}>
          {pkg.jobCount} jobs
        </Badge>
      </div>
      <p className="text-xs text-white/50 mb-3">{pkg.description}</p>
      <div className="flex items-center justify-between">
        <div>
          {pkg.builderRate ? (
            <div className="text-xs text-white/40">
              Builder: <span className="text-white/70">{formatCurrency(pkg.builderRate)}</span>
              {" | "}Plumber: <span className="text-white/70">{formatCurrency(pkg.plumberRate!)}</span>
            </div>
          ) : (
            <div className="text-xs text-white/40">Avg from your jobs</div>
          )}
        </div>
        <div className="text-lg font-bold" style={{ color: GG_RED }}>
          {formatCurrency(pkg.avgPrice)}
        </div>
      </div>
    </div>
  );
}

export default function GetGasDemo() {
  const [result, setResult] = useState<DemoResult | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState<"packages" | "ai" | "materials">("packages");
  const [selectedPackages, setSelectedPackages] = useState<string[]>(["single_story"]);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [markupPercent, setMarkupPercent] = useState(20);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── ROI state ─────────────────────────────────────────────────────────────
  const [roiJobs, setRoiJobs] = useState(150);
  const [roiHours, setRoiHours] = useState(1.5);

  // ── ROI calculations ──────────────────────────────────────────────────────
  const hourlyRate = 120; // gas fitter charge-out
  const manualCost = roiJobs * roiHours * hourlyRate;
  const kindaiCost = roiJobs * 0.25 * hourlyRate;
  const netSaving = manualCost - kindaiCost;
  const roiMultiple = Math.round((manualCost / Math.max(kindaiCost, 1)) * 10) / 10;

  // ── Package estimate builder ───────────────────────────────────────────────
  const selectedPkgs = GG_PACKAGES.filter(p => selectedPackages.includes(p.id));
  const packageTotal = selectedPkgs.reduce((sum, p) => sum + p.avgPrice, 0);
  const packageGst = packageTotal * 0.1;
  const packageTotalGst = packageTotal + packageGst;

  const togglePackage = (id: string) => {
    setSelectedPackages(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const categories = [
    { id: "all", label: "All" },
    { id: "new_build", label: "New Build" },
    { id: "appliance", label: "Appliances" },
    { id: "bbq", label: "BBQ" },
    { id: "infrastructure", label: "Infrastructure" },
    { id: "safety", label: "Safety" },
    { id: "lpg", label: "LPG" },
  ];

  const filteredPackages = filterCategory === "all"
    ? GG_PACKAGES
    : GG_PACKAGES.filter(p => p.category === filterCategory);

  // ── AI Vision demo ────────────────────────────────────────────────────────
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

  const handleRunAI = useCallback(() => {
    if (running) return;
    setRunning(true);
    setResult(null);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    runDemo.mutate({
      trade: "plumbing",
      planImageUrls: [],
      jobDescription: "New residential gas installation — single storey 4-bedroom home, South Australia. Rinnai B26 continuous flow hot water system, 900mm gas cooktop, outdoor BBQ bayonet, LPG setup. First fix rough-in through wall cavities, second fix appliance connections, excess flow valve on meter, sound test and AS/NZS 5601 compliance certificate required. Use GetGas standard package pricing: single storey builder rate $1,679 ex GST.",
      markupPercent,
      labourRate: 120,
      useTradePrice: true,
    });
  }, [running, runDemo, markupPercent]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div style={{ background: GG_BLACK, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(10,10,10,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${GG_BORDER}` }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-lg tracking-tight">GET</span>
            <span className="font-black text-lg tracking-tight" style={{ color: GG_RED }}>GAS</span>
          </div>
          <span className="text-white/30 text-lg font-thin">×</span>
          <img src={KINDAI_LOGO} alt="Kindai" className="h-6 object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <Badge style={{ background: "rgba(232,0,61,0.15)", color: GG_RED, border: `1px solid ${GG_BORDER}` }}>
            Live Data — 9,042 Jobs
          </Badge>
          <a href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">← Back to Kindai</a>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div className="pt-16 pb-12 px-4 md:px-8" style={{ borderBottom: `1px solid ${GG_BORDER}` }}>
        <div className="max-w-5xl mx-auto">
          <div className="pt-12 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: GG_RED }} />
              <span className="text-xs tracking-widest uppercase text-white/40">Specialist Gas Installation — South Australia</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-none mb-2">
              THE GAS PARTNER<br />
              <span style={{ color: GG_RED }}>BUILDERS TRUST</span>
            </h1>
            <p className="text-white/50 text-lg mt-4 max-w-xl">
              Kindai AI now powers GetGas estimating — trained on 9,042 real jobs, your actual Reece pricing, and AS/NZS 5601 compliance requirements.
            </p>
          </div>

          {/* ── Stats bar ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: "Jobs Analysed", value: 9042, suffix: "" },
              { label: "Gas Materials", value: 319, suffix: "" },
              { label: "Avg Single Storey", value: 1679, prefix: "$" },
              { label: "Avg Double Storey", value: 1886, prefix: "$" },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-4" style={{ background: GG_CARD, border: `1px solid rgba(255,255,255,0.06)` }}>
                <div className="text-2xl font-black text-white">
                  <AnimatedNumber value={stat.value} prefix={stat.prefix || ""} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

        {/* ── Tab nav ───────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit" style={{ background: GG_CARD }}>
          {[
            { id: "packages", label: "📦 Package Builder" },
            { id: "ai", label: "🤖 AI Vision Takeoff" },
            { id: "materials", label: "🔧 Price Book" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.id ? GG_RED : "transparent",
                color: activeTab === tab.id ? "white" : "rgba(255,255,255,0.5)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── PACKAGE BUILDER TAB ───────────────────────────────────────────── */}
        {activeTab === "packages" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Package list */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Select Packages</h2>
                <div className="flex gap-1 flex-wrap">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategory(cat.id)}
                      className="px-2.5 py-1 rounded-lg text-xs transition-all"
                      style={{
                        background: filterCategory === cat.id ? "rgba(232,0,61,0.2)" : "rgba(255,255,255,0.05)",
                        color: filterCategory === cat.id ? GG_RED : "rgba(255,255,255,0.5)",
                        border: `1px solid ${filterCategory === cat.id ? GG_BORDER : "transparent"}`,
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPackages.map(pkg => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    selected={selectedPackages.includes(pkg.id)}
                    onSelect={() => togglePackage(pkg.id)}
                  />
                ))}
              </div>
            </div>

            {/* Quote summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 rounded-xl p-5" style={{ background: GG_CARD, border: `1px solid ${GG_BORDER}` }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: GG_RED }} />
                  <h3 className="text-sm font-bold text-white">Quote Summary</h3>
                </div>

                {selectedPkgs.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-8">Select packages to build your quote</p>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      {selectedPkgs.map(pkg => (
                        <div key={pkg.id} className="flex items-center justify-between">
                          <span className="text-xs text-white/70">{pkg.icon} {pkg.name.split("—")[0].trim()}</span>
                          <span className="text-xs font-semibold text-white">{formatCurrency(pkg.builderRate || pkg.avgPrice)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Subtotal (ex GST)</span>
                        <span className="text-white">{formatCurrency(packageTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">GST (10%)</span>
                        <span className="text-white">{formatCurrency(packageGst)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold pt-1 border-t border-white/10">
                        <span className="text-white">Total (inc GST)</span>
                        <span style={{ color: GG_RED }}>{formatCurrency(packageTotalGst)}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="text-xs text-white/40 mb-2">What's included:</div>
                      {selectedPkgs.map(pkg => (
                        <div key={pkg.id}>
                          <div className="text-xs text-white/60 font-medium mb-1">{pkg.icon} {pkg.name}</div>
                          {pkg.includes.map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-white/40 ml-2">
                              <span style={{ color: GG_RED }}>✓</span> {item}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 rounded-lg text-xs text-white/40" style={{ background: "rgba(232,0,61,0.05)", border: `1px solid ${GG_BORDER}` }}>
                      <strong className="text-white/60">AS/NZS 5601 Compliant</strong> — OTR licensed, SA. All prices ex GST. Commercial & complex jobs custom quoted.
                    </div>

                    <button
                      className="w-full mt-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ background: GG_RED }}
                      onClick={() => toast.success("Quote saved! Connect Xero to auto-generate invoice.")}
                    >
                      Save Quote → Xero
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── AI VISION TAKEOFF TAB ─────────────────────────────────────────── */}
        {activeTab === "ai" && (
          <div>
            <div className="rounded-xl p-6 mb-6" style={{ background: GG_CARD, border: `1px solid ${GG_BORDER}` }}>
              <h2 className="text-lg font-bold text-white mb-2">AI Vision Takeoff — Gas Installation</h2>
              <p className="text-white/50 text-sm mb-4">
                Upload a floor plan or describe the job. Kindai AI analyses it against AS/NZS 5601 requirements and your GetGas pricing.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Markup %</label>
                  <input
                    type="range" min={0} max={50} value={markupPercent}
                    aria-label="Markup percentage"
                    onChange={e => setMarkupPercent(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  <div className="text-sm text-white/70 mt-1">{markupPercent}% markup</div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleRunAI}
                    disabled={running}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: running ? "rgba(232,0,61,0.4)" : GG_RED }}
                  >
                    {running ? `⚡ Analysing... ${elapsed}s` : "⚡ Run AI Takeoff — Single Storey Gas Install"}
                  </button>
                </div>
              </div>

              <div className="text-xs text-white/30 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                Demo: Single storey 4-bed SA home — Rinnai B26 HWS, 900mm cooktop, BBQ bayonet, LPG setup, AS/NZS 5601 compliance cert
              </div>
            </div>

            {/* AI Results */}
            {result && (
              <div ref={resultsRef}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "Materials (Trade)", value: result.pricing.materialsCostTrade, prefix: "$" },
                    { label: "Labour", value: result.pricing.labourCost, prefix: "$" },
                    { label: "Total ex GST", value: result.pricing.subtotal + result.pricing.markupAmount, prefix: "$" },
                    { label: "Total inc GST", value: result.pricing.total, prefix: "$" },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl p-4" style={{ background: GG_CARD, border: `1px solid ${GG_BORDER}` }}>
                      <div className="text-xl font-black" style={{ color: GG_RED }}>
                        <AnimatedNumber value={stat.value} prefix={stat.prefix} />
                      </div>
                      <div className="text-xs text-white/40 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid rgba(255,255,255,0.08)` }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "rgba(232,0,61,0.1)" }}>
                        <th className="text-left py-3 px-4 text-xs text-white/60 font-medium">Item</th>
                        <th className="text-right py-3 px-3 text-xs text-white/60 font-medium">Qty</th>
                        <th className="text-right py-3 px-3 text-xs text-white/60 font-medium">Unit Price</th>
                        <th className="text-right py-3 px-4 text-xs text-white/60 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((item, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="py-2.5 px-4 text-sm text-white/90">{item.description}</td>
                          <td className="py-2.5 px-3 text-sm text-white/50 text-right">{item.quantity} {item.unit}</td>
                          <td className="py-2.5 px-3 text-sm text-right" style={{ color: GG_RED }}>{formatCurrency(item.tradePrice)}</td>
                          <td className="py-2.5 px-4 text-sm font-semibold text-right text-white">
                            {formatCurrency(item.tradePrice * item.quantity * (1 + item.wasteFactor / 100))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {result.planNotes && (
                  <div className="mt-4 p-4 rounded-xl text-sm text-white/60" style={{ background: "rgba(232,0,61,0.05)", border: `1px solid ${GG_BORDER}` }}>
                    <strong className="text-white/80">AI Notes:</strong> {result.planNotes}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PRICE BOOK TAB ────────────────────────────────────────────────── */}
        {activeTab === "materials" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">GetGas Price Book</h2>
                <p className="text-sm text-white/40">319 gas materials — live Reece/ServiceM8 pricing</p>
              </div>
              <Badge style={{ background: "rgba(232,0,61,0.15)", color: GG_RED, border: `1px solid ${GG_BORDER}` }}>
                Last synced: Today
              </Badge>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid rgba(255,255,255,0.08)` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(232,0,61,0.1)" }}>
                    <th className="text-left py-3 px-4 text-xs text-white/60 font-medium">Material</th>
                    <th className="text-right py-3 px-3 text-xs text-white/60 font-medium">Unit</th>
                    <th className="text-right py-3 px-3 text-xs text-white/60 font-medium">Cost</th>
                    <th className="text-right py-3 px-4 text-xs text-white/60 font-medium">Sell Price</th>
                    <th className="text-right py-3 px-4 text-xs text-white/60 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {GG_MATERIALS.map((mat, i) => {
                    const margin = ((mat.sell - mat.cost) / mat.sell * 100).toFixed(0);
                    return (
                      <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4 text-sm text-white/90">{mat.name}</td>
                        <td className="py-2.5 px-3 text-xs text-white/40 text-right">{mat.unit}</td>
                        <td className="py-2.5 px-3 text-sm text-white/50 text-right">{formatCurrency(mat.cost)}</td>
                        <td className="py-2.5 px-3 text-sm font-semibold text-right text-white">{formatCurrency(mat.sell)}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(232,0,61,0.15)", color: GG_RED }}>
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 rounded-xl text-sm text-white/50" style={{ background: GG_CARD, border: `1px solid rgba(255,255,255,0.06)` }}>
              Full price book of 319 items synced from your ServiceM8 account. Connect Xero to auto-update pricing when supplier invoices are received.
            </div>
          </div>
        )}

        {/* ── ROI CALCULATOR ────────────────────────────────────────────────── */}
        <div className="mt-12 rounded-2xl p-6" style={{ background: GG_CARD, border: `1px solid ${GG_BORDER}` }}>
          <h2 className="text-xl font-black text-white mb-1">ROI Calculator</h2>
          <p className="text-white/40 text-sm mb-6">How much time does GetGas spend quoting vs installing?</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-white/50">Jobs per year</label>
                  <span className="text-xs text-white/70 font-semibold">{roiJobs}</span>
                </div>
                <input type="range" min={20} max={500} value={roiJobs}
                  aria-label="Jobs per year"
                  onChange={e => setRoiJobs(Number(e.target.value))}
                  className="w-full accent-red-500" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-white/50">Hours to quote manually</label>
                  <span className="text-xs text-white/70 font-semibold">{roiHours}h</span>
                </div>
                <input type="range" min={0.5} max={8} step={0.5} value={roiHours}
                  aria-label="Hours to quote manually"
                  onChange={e => setRoiHours(Number(e.target.value))}
                  className="w-full accent-red-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="text-xs text-white/40 mb-1">Manual quoting cost</div>
                <div className="text-xl font-black text-white/60">{formatCurrency(manualCost)}</div>
                <div className="text-xs text-white/30">@ $120/hr gas fitter rate</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(232,0,61,0.08)", border: `1px solid ${GG_BORDER}` }}>
                <div className="text-xs text-white/40 mb-1">Time saved with Kindai</div>
                <div className="text-xl font-black" style={{ color: GG_RED }}>{formatCurrency(netSaving)}</div>
                <div className="text-xs text-white/30">{roiMultiple}× faster quoting</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── INTEGRATIONS ──────────────────────────────────────────────────── */}
        <div className="mt-8 rounded-2xl p-6" style={{ background: GG_CARD, border: `1px solid rgba(255,255,255,0.06)` }}>
          <h2 className="text-base font-bold text-white mb-4">Connected Systems</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "ServiceM8", color: GG_RED, desc: "9,042 jobs synced", status: "live" },
              { name: "Xero", color: "#13B5EA", desc: "Auto-invoice on approval", status: "connect" },
              { name: "Reece", color: "#E8E8E8", desc: "319 materials priced", status: "live" },
              { name: "AS/NZS 5601", color: "#4CAF50", desc: "Compliance built-in", status: "live" },
            ].map(int => (
              <div key={int.name} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="font-bold text-sm mb-1" style={{ color: int.color }}>{int.name}</div>
                <div className="text-xs text-white/40">{int.desc}</div>
                <div className="mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: int.status === "live" ? "rgba(74,222,128,0.1)" : "rgba(232,0,61,0.1)",
                      color: int.status === "live" ? "#4ade80" : GG_RED,
                    }}>
                    {int.status === "live" ? "● Live" : "Connect →"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STAFF ─────────────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-xl p-4" style={{ background: GG_CARD, border: `1px solid rgba(255,255,255,0.06)` }}>
          <div className="text-xs text-white/40 mb-3">GetGas Team — OTR Licensed Gas Fitters, SA</div>
          <div className="flex flex-wrap gap-2">
            {GG_STAFF.map(name => (
              <div key={name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: GG_RED }}>
                  {name.split(" ").map(n => n[0]).join("")}
                </div>
                <span className="text-sm text-white/70">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/20">
            GetGas × Kindai — Powered by real ServiceM8 data. AS/NZS 5601 compliant. OTR licensed SA.
            All prices ex GST unless stated. Commercial & complex projects custom quoted by Steve — 0433 757 108.
          </p>
        </div>
      </div>
    </div>
  );
}
