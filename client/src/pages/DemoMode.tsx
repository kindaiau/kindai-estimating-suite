import { useState, useRef, useEffect } from "react";
import { pixelViewDemoPage, pixelStartTrial, pixelRunTakeoff } from "@/lib/metaPixel";
import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Camera, Sparkles, Loader2, CheckCircle2, DollarSign,
  Clock, Shield, ChevronRight, ArrowRight, Package,
  Users, TrendingUp, Zap, Star, Lock, BarChart3
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const TRADES = [
  { id: "electrical",        name: "Electrical",          emoji: "⚡",  colour: "from-yellow-400 to-orange-500" },
  { id: "plumbing",          name: "Plumbing & Drainage",  emoji: "🔧",  colour: "from-blue-400 to-cyan-500" },
  { id: "carpentry",         name: "Carpentry & Joinery",  emoji: "🪚",  colour: "from-amber-600 to-yellow-500" },
  { id: "concreting",        name: "Concreting",           emoji: "🏗️",  colour: "from-slate-500 to-slate-700" },
  { id: "hvac",              name: "HVAC",                 emoji: "❄️",  colour: "from-sky-400 to-blue-600" },
  { id: "flooring",          name: "Flooring",             emoji: "🟫",  colour: "from-purple-500 to-violet-600" },
  { id: "landscaping",       name: "Landscaping",          emoji: "🌿",  colour: "from-green-400 to-emerald-600" },
  { id: "cabinetry",         name: "Cabinet Making & Joinery",  emoji: "🪵",  colour: "from-teal-400 to-green-600" },
  { id: "rendering",         name: "Rendering & Plastering",emoji: "🧱",  colour: "from-rose-400 to-pink-600" },
  { id: "painting",          name: "Painting & Decorating",emoji: "🎨",  colour: "from-purple-400 to-pink-500" },
  { id: "bricklaying",       name: "Bricklaying",          emoji: "🧱",  colour: "from-red-400 to-orange-500" },
  { id: "roofing",           name: "Roofing",              emoji: "🏠",  colour: "from-slate-500 to-gray-600" },
  { id: "tiling",            name: "Tiling",               emoji: "⬜",  colour: "from-teal-400 to-cyan-500" },
  { id: "waterproofing",     name: "Waterproofing",        emoji: "💧",  colour: "from-blue-500 to-indigo-600" },
  { id: "fire-protection",   name: "Fire Protection",      emoji: "🔥",  colour: "from-red-500 to-rose-600" },
  { id: "glazing",           name: "Glazing & Aluminium",  emoji: "🪟",  colour: "from-sky-400 to-blue-500" },
  { id: "quantity-surveying",name: "Quantity Surveying",   emoji: "📐",  colour: "from-indigo-400 to-violet-500" },
  { id: "demolition",        name: "Demolition & Excavation",emoji: "⛏️", colour: "from-stone-400 to-gray-500" },
  { id: "swimming-pool",     name: "Swimming Pool",        emoji: "🏊",  colour: "from-cyan-400 to-teal-500" },
  { id: "steel-fabrication", name: "Steel Fabrication",    emoji: "🔩",  colour: "from-zinc-500 to-slate-600" },
] as const;

type TradeId = typeof TRADES[number]["id"];

const DEMO_PROMPTS: Record<string, string> = {
  electrical: "3-bedroom residential house, 180m². Full electrical fit-out including power points, downlights, switchboard, smoke alarms.",
  plumbing: "3-bedroom house, 2 bathrooms. Full plumbing rough-in and fit-off including hot water unit, toilets, basins, shower.",
  carpentry: "New residential build, 200m². Frame and fit-out including wall frames, roof trusses, flooring, internal doors.",
  concreting: "House slab 180m², 100mm thick with mesh reinforcement. Includes footings, edge beams, and surface finish.",
  hvac: "3-bedroom house, 180m². Ducted reverse-cycle air conditioning system with 5 outlets and zoning.",
  flooring: "Open-plan living area 80m² plus 3 bedrooms 40m² total. Hybrid flooring with underlay.",
  landscaping: "Backyard 120m². Includes lawn, garden beds, retaining wall, paving, and irrigation system.",
  cabinetry: "Commercial kitchen fitout. 6.4m run of 18mm Laminex MDF base cabinets (900mm high x 600mm deep), 6.4m overhead cabinets (700mm high x 350mm deep), 3.2m island bench with 40mm Caesarstone top, full-height pantry unit (2400mm), 2 x 4-drawer towers. Polytec Ravine doors throughout, Blum CLIP top BLUMOTION hinges, Blum Legrabox drawers, stainless steel handles.",
  rendering: "Double brick house, external render 280m². Acrylic texture coat finish.",

};

type DemoResult = {
  items: Array<{
    description: string;
    unit: string;
    quantity: number;
    retailPrice: number;
    tradePrice: number;
    category: string;
    labourMinutes: number;
    wasteFactor: number;
  }>;
  confidence: number;
  assumptions: string[];
  planNotes: string;
  pricing: {
    materialsCostRetail: number;
    materialsCostTrade: number;
    tradeSavings: number;
    labourHours: number;
    labourCost: number;
    subtotal: number;
    markupAmount: number;
    gst: number;
    total: number;
  };
  demoMode: boolean;
};

export default function DemoMode() {
  const [, navigate] = useLocation();
  const [selectedTrade, setSelectedTrade] = useState<TradeId>("electrical");
  const [jobDescription, setJobDescription] = useState(DEMO_PROMPTS["electrical"]);
  const [markupPercent, setMarkupPercent] = useState(20);
  const [labourRate, setLabourRate] = useState(95);
  const [useTradePrice, setUseTradePrice] = useState(true);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [activeTab, setActiveTab] = useState<"materials" | "summary">("materials");

  // Fire ViewDemoPage + StartTrial pixel events on mount
  useEffect(() => {
    pixelViewDemoPage();
    pixelStartTrial();
  }, []);

  const runDemo = trpc.demo.runDemo.useMutation({
    onSuccess: (data) => {
      setResult(data as DemoResult);
      setActiveTab("materials");
      toast.success("AI takeoff complete! Scroll down to see your quote.");
      // Fire RunTakeoff custom event
      pixelRunTakeoff({ trade: selectedTrade, job_type: "demo" });
    },
    onError: (err) => {
      toast.error("Demo failed: " + err.message);
    },
  });

  const handleTradeSelect = (tradeId: TradeId) => {
    setSelectedTrade(tradeId);
    setJobDescription(DEMO_PROMPTS[tradeId] ?? "");
    setResult(null);
  };

  const handleRun = () => {
    if (!selectedTrade) {
      toast.error("Please select a trade first.");
      return;
    }
    runDemo.mutate({
      trade: selectedTrade,
      jobDescription: jobDescription || undefined,
      markupPercent,
      labourRate,
      useTradePrice,
    });
  };

  const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const selectedTradeObj = TRADES.find(t => t.id === selectedTrade);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Free AI Estimating Demo | Try Without Signing Up"
        description="Try Kindai's AI construction estimating software free — no account needed. Enter a job description, pick your trade, and watch AI generate a full quote with materials, labour, and GST."
        canonical="/demo"
        keywords="free estimating software demo Australia, AI takeoff demo, try construction quoting software, builder software free trial, tradie quoting demo"
      />
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Kindai" className="h-8 w-8 object-contain" />
            <div>
              <span className="font-black text-lg tracking-tight kindai-gradient-text">kindai</span>
              <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest -mt-0.5">Estimating Suite</div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-bold px-2.5 py-1">
              <Sparkles className="w-3 h-3 mr-1" /> Live AI Demo
            </Badge>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="kindai-btn-primary px-4 py-2 rounded-full text-xs font-bold h-auto"
            >
              Sign Up Free <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">

          {/* ── Header ── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold mb-4">
              <Zap className="w-3.5 h-3.5" /> No sign-up required — try the real AI
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              See Kindai AI in <span className="kindai-gradient-text">60 seconds</span>
            </h1>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Describe your job below. Our AI generates a complete materials takeoff with real Australian pricing — no login, no credit card.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* ── Left: Controls ── */}
            <div className="lg:col-span-1 space-y-4">
              {/* Trade Selector */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-black text-gray-900 mb-3">1. Pick your trade</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {TRADES.map((trade) => (
                      <button
                        key={trade.id}
                        onClick={() => handleTradeSelect(trade.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all text-xs font-bold ${
                          selectedTrade === trade.id
                            ? "border-pink-500 bg-pink-50 text-pink-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-base">{trade.emoji}</span>
                        <span className="leading-tight">{trade.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Job Description */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-black text-gray-900 mb-2">2. Describe the job</h3>
                  <p className="text-xs text-gray-400 mb-3">Or use the pre-loaded example below</p>
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="e.g. 3-bedroom house, full electrical fit-out..."
                    className="text-sm min-h-[100px] resize-none border-gray-200"
                  />
                </CardContent>
              </Card>

              {/* Pricing Controls */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-black text-gray-900 mb-3">3. Set your pricing</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-600 font-semibold">Markup</span>
                        <span className="font-black text-pink-600">{markupPercent}%</span>
                      </div>
                      <Slider
                        value={[markupPercent]}
                        onValueChange={([v]) => setMarkupPercent(v)}
                        min={0} max={50} step={5}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-600 font-semibold">Labour Rate</span>
                        <span className="font-black text-blue-600">${labourRate}/hr</span>
                      </div>
                      <Slider
                        value={[labourRate]}
                        onValueChange={([v]) => setLabourRate(v)}
                        min={50} max={180} step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-semibold">Use trade pricing</span>
                      <button
                        onClick={() => setUseTradePrice(!useTradePrice)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${useTradePrice ? "bg-green-500" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useTradePrice ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Run Button */}
              <Button
                onClick={handleRun}
                disabled={runDemo.isPending}
                className="w-full kindai-btn-primary py-4 rounded-xl text-sm font-black h-auto shadow-lg"
              >
                {runDemo.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI is analysing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Takeoff
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Shield, text: "GST Compliant", colour: "text-blue-500" },
                  { icon: Clock, text: "Under 30s", colour: "text-orange-500" },
                  { icon: DollarSign, text: "Real AU Prices", colour: "text-green-500" },
                  { icon: CheckCircle2, text: "No Sign-Up", colour: "text-pink-500" },
                ].map(({ icon: Icon, text, colour }) => (
                  <div key={text} className="flex items-center gap-1.5 bg-white rounded-lg p-2 border border-gray-100">
                    <Icon className={`w-3.5 h-3.5 ${colour}`} />
                    <span className="text-xs font-semibold text-gray-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Results ── */}
            <div className="lg:col-span-2">
              {!result && !runDemo.isPending && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center py-20">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mx-auto mb-5 shadow-xl">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 mb-2">Ready to analyse</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">
                      Select a trade, describe your job, and hit Generate. The AI will build a complete takeoff in seconds.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {["Real AU pricing", "GST calculated", "Labour hours", "Trade savings"].map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {runDemo.isPending && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center py-20">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mx-auto mb-5 shadow-xl animate-pulse">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 mb-2">AI is reading your job...</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">
                      Identifying materials, calculating quantities, applying Australian pricing...
                    </p>
                    <div className="space-y-2 max-w-xs mx-auto text-left">
                      {["Parsing job description...", "Identifying materials...", "Applying 2024-25 AU pricing...", "Calculating labour hours..."].map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" />
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Confidence + summary */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-black text-green-700">{result.confidence}% confidence</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-black text-blue-700">{result.items.length} items found</span>
                    </div>
                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-black text-orange-700">{result.pricing.labourHours}h labour</span>
                    </div>
                    {selectedTradeObj && (
                      <div className={`flex items-center gap-2 bg-gradient-to-r ${selectedTradeObj.colour} rounded-xl px-3 py-2`}>
                        <span className="text-sm font-black text-white">{selectedTradeObj.emoji} {selectedTradeObj.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    {(["materials", "summary"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 rounded-lg text-xs font-black transition-all capitalize ${
                          activeTab === tab ? "bg-white shadow text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {tab === "materials" ? `Materials (${result.items.length})` : "Quote Summary"}
                      </button>
                    ))}
                  </div>

                  {/* Materials Tab */}
                  {activeTab === "materials" && (
                    <Card className="border-gray-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="text-left px-4 py-3 font-black text-gray-600">Item</th>
                              <th className="text-right px-3 py-3 font-black text-gray-600">Qty</th>
                              <th className="text-right px-3 py-3 font-black text-gray-600 hidden sm:table-cell">Retail</th>
                              <th className="text-right px-3 py-3 font-black text-green-600">Trade</th>
                              <th className="text-right px-3 py-3 font-black text-gray-600 hidden md:table-cell">Labour</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.items.map((item: any, i: number) => (
                              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2.5">
                                  <div className="font-semibold text-gray-800 leading-tight">{item.description}</div>
                                  <div className="text-gray-400 text-[10px]">{item.category}</div>
                                </td>
                                <td className="text-right px-3 py-2.5 font-bold text-gray-700">{item.quantity} {item.unit}</td>
                                <td className="text-right px-3 py-2.5 text-gray-400 hidden sm:table-cell">${item.retailPrice.toFixed(2)}</td>
                                <td className="text-right px-3 py-2.5 font-bold text-green-600">${item.tradePrice.toFixed(2)}</td>
                                <td className="text-right px-3 py-2.5 text-gray-400 hidden md:table-cell">{item.labourMinutes}min</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {/* Summary Tab */}
                  {activeTab === "summary" && (
                    <div className="space-y-4">
                      {/* Pricing breakdown */}
                      <Card className="border-gray-200 shadow-sm">
                        <CardContent className="p-5">
                          <h3 className="text-sm font-black text-gray-900 mb-4">Quote Breakdown</h3>
                          <div className="space-y-2.5">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Materials ({useTradePrice ? "trade" : "retail"})</span>
                              <span className="font-bold text-gray-800">{fmt(useTradePrice ? result.pricing.materialsCostTrade : result.pricing.materialsCostRetail)}</span>
                            </div>
                            {useTradePrice && (
                              <div className="flex justify-between text-xs">
                                <span className="text-green-600 font-semibold">Trade savings vs retail</span>
                                <span className="font-bold text-green-600">-{fmt(result.pricing.tradeSavings)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Labour ({result.pricing.labourHours}h @ ${labourRate}/hr)</span>
                              <span className="font-bold text-gray-800">{fmt(result.pricing.labourCost)}</span>
                            </div>
                            <div className="h-px bg-gray-100" />
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Subtotal</span>
                              <span className="font-bold text-gray-800">{fmt(result.pricing.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-pink-600 font-semibold">Markup ({markupPercent}%)</span>
                              <span className="font-bold text-pink-600">+{fmt(result.pricing.markupAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">GST (10%)</span>
                              <span className="font-bold text-gray-800">{fmt(result.pricing.gst)}</span>
                            </div>
                            <div className="h-px bg-gray-200" />
                            <div className="flex justify-between">
                              <span className="font-black text-gray-900">Total (inc GST)</span>
                              <span className="font-black text-xl kindai-gradient-text">{fmt(result.pricing.total)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* AI Assumptions */}
                      {result.assumptions.length > 0 && (
                        <Card className="border-gray-200 shadow-sm">
                          <CardContent className="p-4">
                            <h3 className="text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">AI Assumptions</h3>
                            <ul className="space-y-1.5">
                              {result.assumptions.map((a: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Upgrade CTA */}
                  <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-orange-50 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-black text-gray-900 mb-1">
                            Want to scan actual plans?
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Sign up free to upload photos of your plans and get AI Vision takeoffs. Save quotes, send to clients, and track your pipeline.
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {["📸 Photo plan upload", "📄 PDF plans", "💾 Save quotes", "📧 Send to clients", "📊 Win rate dashboard"].map(f => (
                              <span key={f} className="text-xs bg-white border border-pink-200 text-pink-700 rounded-full px-2.5 py-1 font-semibold">{f}</span>
                            ))}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              onClick={() => window.location.href = getLoginUrl()}
                              className="kindai-btn-primary px-6 py-2.5 rounded-full text-sm font-black h-auto shadow-lg"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Start Free — No Credit Card
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                            <Button
                              onClick={() => navigate("/pricing")}
                              variant="outline"
                              className="px-5 py-2.5 rounded-full text-sm font-bold h-auto border-pink-300 text-pink-600 hover:bg-pink-50"
                            >
                              View Pricing
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Solo Tradie plan from $49/mo. Free tier available.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* ── Social Proof Strip ── */}
          <div className="mt-12 grid sm:grid-cols-3 gap-4">
            {[
              { icon: Star, text: "Tradies love it", sub: "5-star reviews from the field", colour: "text-yellow-500" },
              { icon: BarChart3, text: "Win more jobs", sub: "Faster quotes = more tenders submitted", colour: "text-green-500" },
              { icon: TrendingUp, text: "Save thousands", sub: "Trade pricing vs retail on every job", colour: "text-blue-500" },
            ].map(({ icon: Icon, text, sub, colour }) => (
              <div key={text} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                <Icon className={`w-8 h-8 ${colour}`} />
                <div>
                  <div className="text-sm font-black text-gray-900">{text}</div>
                  <div className="text-xs text-gray-400">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
