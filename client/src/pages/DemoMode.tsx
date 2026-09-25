import { useState, useEffect } from "react";
import { pixelViewDemoPage, pixelRunTakeoff } from "@/lib/metaPixel";
import { getAnalyticsContext, trackEvent } from "@/lib/analytics";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Sparkles, Loader2, CheckCircle2, DollarSign,
  Clock, Shield, ChevronRight, ArrowRight, Package,
  TrendingUp, Zap, Star, Lock, BarChart3
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const TRADES = [
  { id: "cabinetry",         name: "Cabinet Making & Joinery",  emoji: "🪵",  colour: "from-teal-400 to-green-600" },
] as const;

type TradeId = typeof TRADES[number]["id"];

const SAMPLE_SCOPES: Record<string, string> = {
  electrical: "3-bedroom residential house, 180m². Full electrical fit-out including power points, downlights, switchboard, smoke alarms.",
  plumbing: "3-bedroom house, 2 bathrooms. Full plumbing rough-in and fit-off including hot water unit, toilets, basins, shower.",
  carpentry: "New residential build, 200m². Frame and fit-out including wall frames, roof trusses, flooring, internal doors.",
  concreting: "House slab 180m², 100mm thick with mesh reinforcement. Includes footings, edge beams, and surface finish.",
  hvac: "3-bedroom house, 180m². Ducted reverse-cycle air conditioning system with 5 outlets and zoning.",
  flooring: "Open-plan living area 80m² plus 3 bedrooms 40m² total. Hybrid flooring with underlay.",
  landscaping: "Backyard 120m². Includes lawn, garden beds, retaining wall, paving, and irrigation system.",
  cabinetry: "Commercial kitchen fitout. 6.4m run of 18mm Laminex MDF base cabinets (900mm high x 600mm deep), 6.4m overhead cabinets (700mm high x 350mm deep), 3.2m island bench with 40mm Caesarstone top, full-height pantry unit (2400mm), 2 x 4-drawer towers. Polytec Ravine doors throughout, Blum CLIP top BLUMOTION hinges, Blum Legrabox drawers, stainless steel handles.",
  rendering: "Double brick house, external render 280m². Acrylic texture coat finish.",
  "gas-install": "New residential house, 3 gas appliance connections. Natural gas. Cooktop, instantaneous hot water unit, and gas ducted heater. 15m total pipe run from meter.",
  "gas-maintenance": "Annual gas service for residential property. 4 gas appliances: cooktop, oven, instantaneous hot water, and ducted heater. Include leak test and compliance certificate.",
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
  const [selectedTrade, setSelectedTrade] = useState<TradeId>("cabinetry");
  const [markupPercent, setMarkupPercent] = useState(20);
  const [labourRate, setLabourRate] = useState(95);
  const [useTradePrice, setUseTradePrice] = useState(true);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [activeTab, setActiveTab] = useState<"materials" | "summary">("materials");

  // Track sample exploration without treating it as a product trial.
  useEffect(() => {
    pixelViewDemoPage();
    trackEvent("demo_viewed", {
      ...getAnalyticsContext(),
      defaultTrade: selectedTrade,
    });
  }, []);

  const runDemo = trpc.demo.runDemo.useMutation({
    onSuccess: (data) => {
      setResult(data as DemoResult);
      setActiveTab("materials");
      toast.success("Sample recalculated. Scroll down to review it.");
      pixelRunTakeoff({ trade: selectedTrade, job_type: "demo" });
      trackEvent("demo_takeoff_succeeded", {
        trade: selectedTrade,
        itemCount: data.items?.length ?? 0,
        total: data.pricing?.total ?? 0,
      });
    },
    onError: (err) => {
      toast.error("Demo failed: " + err.message);
      trackEvent("demo_takeoff_failed", {
        trade: selectedTrade,
        reason: "server_error",
      });
    },
  });

  const handleTradeSelect = (tradeId: TradeId) => {
    setSelectedTrade(tradeId);
    setResult(null);
    trackEvent("demo_trade_selected", {
      trade: tradeId,
    });
  };

  const handleRun = () => {
    if (!selectedTrade) {
      toast.error("Please select a trade first.");
      trackEvent("demo_takeoff_failed", { reason: "validation_missing_trade" });
      return;
    }
    trackEvent("demo_takeoff_started", {
      trade: selectedTrade,
      markupPercent,
      labourRate,
      useTradePrice,
    });
    runDemo.mutate({
      trade: selectedTrade,
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
        title="Interactive Estimating Sample | KindAI"
        description="Explore a representative KindAI estimating sample. Choose a trade and adjust labour, markup, and pricing assumptions without uploading private plans."
        canonical="/demo"
        keywords="AI estimating sample Australia, construction estimating demonstration, tradie quoting software, builder estimating software"
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
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-bold px-2.5 py-1 hidden sm:inline-flex">
              <Sparkles className="w-3 h-3 mr-1" /> Interactive Sample
            </Badge>
            <Button
              onClick={() => navigate("/evaluation")}
              className="kindai-btn-primary px-4 py-2 rounded-full text-xs font-bold h-auto"
            >
              Apply for Setup <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">

          {/* ── Header ── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold mb-4">
              <Zap className="w-3.5 h-3.5" /> Representative sample. No upload required.
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              Explore how KindAI <span className="kindai-gradient-text">structures an estimate</span>
            </h1>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Choose a trade, review a sample scope, then adjust labour, markup and pricing assumptions. Your plans stay off the public demo.
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
                        className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl border text-left transition-all text-[11px] sm:text-xs font-bold ${
                          selectedTrade === trade.id
                            ? "border-pink-500 bg-pink-50 text-pink-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-sm sm:text-base">{trade.emoji}</span>
                        <span className="leading-tight line-clamp-2">{trade.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Representative sample scope */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-black text-gray-900 mb-2">2. Review the sample scope</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {SAMPLE_SCOPES[selectedTrade] ?? "Representative Australian trade estimate."}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-100">
                    This is sample data for product exploration. No private plan is uploaded and no live AI run is consumed.
                  </p>
                </CardContent>
              </Card>

              {/* Pricing Controls */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-black text-gray-900 mb-3">3. Adjust the pricing assumptions</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-600 font-semibold">Markup</span>
                        <span className="font-black text-pink-600">{markupPercent}%</span>
                      </div>
                      <Slider
                        aria-label="Markup percentage"
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
                        aria-label="Labour hourly rate"
                        value={[labourRate]}
                        onValueChange={([v]) => setLabourRate(v)}
                        min={50} max={180} step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-semibold">Use trade pricing</span>
                      <button
                        type="button"
                        aria-label={useTradePrice ? "Disable trade pricing" : "Enable trade pricing"}
                        aria-pressed={useTradePrice}
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
                    Recalculating sample...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Recalculate Sample
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Shield, text: "No plan upload", colour: "text-blue-500" },
                  { icon: Clock, text: "Instant sample", colour: "text-orange-500" },
                  { icon: DollarSign, text: "Editable rates", colour: "text-green-500" },
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
                    <h3 className="text-xl font-black text-gray-800 mb-2">Ready to explore</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">
                      Select a trade and recalculate the sample to see how estimate items, labour, markup and GST fit together.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {["Sample rates", "GST calculated", "Labour hours", "Markup control"].map(tag => (
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
                    <h3 className="text-xl font-black text-gray-800 mb-2">Recalculating the sample...</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">
                      Applying the selected rates, markup and GST settings.
                    </p>
                    <div className="space-y-2 max-w-xs mx-auto text-left">
                      {["Loading sample scope...", "Applying sample rates...", "Calculating labour...", "Adding markup and GST..."].map((step, i) => (
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
                      <span className="text-sm font-black text-green-700">Representative sample</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-black text-blue-700">{result.items.length} sample line items</span>
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
                            <h3 className="text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">Sample Assumptions</h3>
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
                            Want KindAI configured for your workflow?
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Apply for the A$2,500 plus GST Founding Workflow Setup. It includes one cabinet or joinery workflow, two reviewed jobs and six months of Sole Tradie.
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {["Two reviewed jobs", "Founder-led setup", "One user", "Six months included"].map(f => (
                              <span key={f} className="text-xs bg-white border border-pink-200 text-pink-700 rounded-full px-2.5 py-1 font-semibold">{f}</span>
                            ))}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              onClick={() => navigate("/evaluation")}
                              className="kindai-btn-primary px-6 py-2.5 rounded-full text-sm font-black h-auto shadow-lg"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Apply for Founding Setup
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
                          <p className="text-xs text-gray-600 mt-2">Application only. Approved applicants receive the exact scope before payment or private-plan processing.</p>
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
              { icon: Star, text: "Explore safely", sub: "No private files enter the public sample", colour: "text-yellow-500" },
              { icon: BarChart3, text: "See the structure", sub: "Review line items, labour, markup and GST", colour: "text-green-500" },
              { icon: TrendingUp, text: "Prove it properly", sub: "Apply for the paid setup with two real jobs", colour: "text-blue-500" },
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
