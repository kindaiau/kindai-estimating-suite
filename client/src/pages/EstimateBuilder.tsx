import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeft, Bot, CheckCircle2, DollarSign, ExternalLink,
  FileText, Loader2, Plus, Shield, Sparkles, Trash2, Download, Send, Copy,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";

const CATEGORIES = ["Materials", "Labour", "Plant & Equipment", "Subcontract", "Preliminaries", "Other"];
const UNITS = ["ea", "m²", "m³", "lm", "hr", "day", "tonne", "kg", "L", "set", "lot", "point", "circuit", "fixture"];

// ─── Market Benchmark Panel ───────────────────────────────────────────────────
function BenchmarkPanel({ estimateId }: { estimateId: number }) {
  const { data: bench, isLoading } = trpc.estimates.getBenchmark.useQuery({ id: estimateId });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Calculating market benchmark...</div>;
  if (!bench) return <div className="text-center py-12 text-muted-foreground text-sm">Add line items to see market benchmarking.</div>;

  const { analysis, benchmark } = bench;
  const marginStatusColor = analysis.marginStatus === "within" ? "text-green-600" : analysis.marginStatus === "below" ? "text-red-600" : "text-amber-600";
  const competitiveColor = analysis.competitiveIndex >= -20 && analysis.competitiveIndex <= 30 ? "text-green-600" : analysis.competitiveIndex < -20 ? "text-red-600" : "text-amber-600";

  return (
    <div className="space-y-4">
      {/* Overall Position */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm rounded-2xl">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="text-xs text-muted-foreground font-bold mb-1">TOTAL QUOTE</div>
            <div className="text-xl font-black">${bench.totalValue.toLocaleString("en-AU")}</div>
            <div className="text-xs text-muted-foreground mt-1">Market avg ({analysis.sizeBucket}): ${analysis.marketAvg.toLocaleString("en-AU")}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm rounded-2xl">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="text-xs text-muted-foreground font-bold mb-1">VS MARKET</div>
            <div className={`text-xl font-black ${competitiveColor}`}>{analysis.competitiveIndex > 0 ? "+" : ""}{analysis.competitiveIndex}%</div>
            <div className="text-xs text-muted-foreground mt-1">{analysis.competitiveIndex >= -20 && analysis.competitiveIndex <= 30 ? "Competitive" : analysis.competitiveIndex < -20 ? "Below market" : "Above market"}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm rounded-2xl">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="text-xs text-muted-foreground font-bold mb-1">YOUR MARGIN</div>
            <div className={`text-xl font-black ${marginStatusColor}`}>{bench.marginPercent}%</div>
            <div className="text-xs text-muted-foreground mt-1">Benchmark: {benchmark.marginRange.min}–{benchmark.marginRange.max}%</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm rounded-2xl">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="text-xs text-muted-foreground font-bold mb-1">WIN RATE BENCHMARK</div>
            <div className="text-xl font-black text-primary">{benchmark.winRateBenchmark}%</div>
            <div className="text-xs text-muted-foreground mt-1">Industry average for {bench.trade}</div>
          </CardContent>
        </Card>
      </div>

      {/* Labour vs Materials Split */}
      <Card className="border shadow-sm rounded-2xl">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-black">Cost Composition</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Labour</span>
              <span className="font-bold">{bench.labourPercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${bench.labourPercent}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Materials</span>
              <span className="font-bold">{bench.materialsPercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full bg-orange-400" style={{ width: `${bench.materialsPercent}%` }} />
            </div>
          </div>
          <div className="text-xs text-muted-foreground pt-1">
            Labour rate range for {bench.trade}: ${benchmark.labourRateRange.min}–${benchmark.labourRateRange.max}/hr (median ${benchmark.labourRateRange.median}/hr)
          </div>
        </CardContent>
      </Card>

      {/* Analysis Messages */}
      <Card className="border shadow-sm rounded-2xl">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-black">Market Analysis</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-3">
          <div className="p-3 bg-muted/40 rounded-xl text-sm">{analysis.marginMessage}</div>
          <div className="p-3 bg-muted/40 rounded-xl text-sm">{analysis.competitiveMessage}</div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-black">Kindai Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ul className="space-y-2">
              {analysis.recommendations.map((r: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">→</span> {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Trade Sections */}
      {benchmark.sections.length > 0 && (
        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-black">Standard {bench.trade} Sections</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex flex-wrap gap-2">
              {benchmark.sections.map((s: string, i: number) => (
                <span key={i} className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">{s}</span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Ensure your estimate covers all relevant sections for a complete scope.</p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Benchmarks based on 2024–25 Australian construction market data for {bench.trade} projects.
        Rates vary by state, project complexity, and site conditions.
      </p>
    </div>
  );
}

export default function EstimateBuilder() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const estimateId = parseInt(params.id ?? "0");
  const [addOpen, setAddOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [sendQuoteOpen, setSendQuoteOpen] = useState(false);
  const [sendForm, setSendForm] = useState({ clientName: "", clientEmail: "", message: "", expiryDays: "30" });
  const [sentUrl, setSentUrl] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    category: "Materials", description: "", unit: "ea",
    quantity: "", unitRate: "", wasteFactor: "0", notes: "",
  });

  const utils = trpc.useUtils();
  const { data: estimate, isLoading } = trpc.estimates.get.useQuery({ id: estimateId });
  const { data: lineItems, isLoading: itemsLoading } = trpc.estimates.getLineItems.useQuery({ estimateId });
  const { data: compliance } = trpc.compliance.getProfile.useQuery(
    { trade: estimate?.trade ?? "", state: estimate?.complianceState ?? undefined },
    { enabled: !!estimate?.trade }
  );

  const addItem = trpc.estimates.addLineItem.useMutation({
    onSuccess: () => {
      toast.success("Item added");
      utils.estimates.getLineItems.invalidate();
      recalc.mutate({ id: estimateId });
      setAddOpen(false);
      setNewItem({ category: "Materials", description: "", unit: "ea", quantity: "", unitRate: "", wasteFactor: "0", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteItem = trpc.estimates.deleteLineItem.useMutation({
    onSuccess: () => {
      utils.estimates.getLineItems.invalidate();
      recalc.mutate({ id: estimateId });
    },
  });

  const recalc = trpc.estimates.recalculate.useMutation({
    onSuccess: () => utils.estimates.get.invalidate(),
  });

  const updateStatus = trpc.estimates.update.useMutation({
    onSuccess: () => { toast.success("Updated"); utils.estimates.get.invalidate(); },
  });

  const generatePdf = trpc.estimates.generatePdf.useMutation({
    onSuccess: (data) => {
      toast.success("PDF generated! Opening now...");
      window.open(data.url, "_blank");
      utils.estimates.get.invalidate();
    },
    onError: (e) => toast.error("PDF failed: " + e.message),
  });

  const sendQuote = trpc.quoteTokens.sendQuote.useMutation({
    onSuccess: (data) => {
      setSentUrl(data.quoteUrl);
      toast.success("Quote link generated! Copy and send to your client.");
      utils.estimates.get.invalidate();
    },
    onError: (e) => toast.error("Failed to send quote: " + e.message),
  });

  const analyzePlan = trpc.ai.analyzePlan.useMutation({
    onSuccess: (data) => { setAiResult(data); setAiLoading(false); },
    onError: (e) => { toast.error(e.message); setAiLoading(false); },
  });

  const handleAiAnalyze = () => {
    if (!aiDescription.trim()) return toast.error("Please describe your project");
    setAiLoading(true);
    setAiResult(null);
    analyzePlan.mutate({ estimateId, trade: estimate?.trade ?? "", planDescription: aiDescription });
  };

  const handleAddAiItems = async () => {
    if (!aiResult?.items) return;
    for (const item of aiResult.items) {
      await addItem.mutateAsync({
        estimateId, category: item.category, description: item.description,
        unit: item.unit, quantity: item.quantity, unitRate: item.unitRate,
        wasteFactor: 5, isFromAi: true,
      });
    }
    toast.success(`${aiResult.items.length} items added from AI takeoff`);
    setAiOpen(false); setAiResult(null); setAiDescription("");
  };

  const handleAddItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.unitRate) {
      return toast.error("Description, quantity and rate are required");
    }
    addItem.mutate({
      estimateId, category: newItem.category, description: newItem.description,
      unit: newItem.unit, quantity: parseFloat(newItem.quantity),
      unitRate: parseFloat(newItem.unitRate),
      wasteFactor: parseFloat(newItem.wasteFactor) || 0,
      notes: newItem.notes || undefined,
    });
  };

  if (isLoading) return (
    <AppLayout><div className="p-6 animate-pulse space-y-4">
      <div className="h-8 w-64 bg-secondary rounded-xl" />
      <div className="h-48 bg-secondary rounded-2xl" />
    </div></AppLayout>
  );

  if (!estimate) return (
    <AppLayout><div className="p-6 text-center">
      <p className="text-muted-foreground">Estimate not found</p>
    </div></AppLayout>
  );

  const subtotal = parseFloat(estimate.subtotal as string) || 0;
  const gstAmount = parseFloat(estimate.gstAmount as string) || 0;
  const total = parseFloat(estimate.total as string) || 0;
  const confidence = estimate.aiConfidenceScore;
  const assumptions = estimate.aiAssumptions as string[] | null;

  const groupedItems = (lineItems ?? []).reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof lineItems>);

  return (
    <AppLayout title={estimate.title}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${estimate.projectId}`)} className="mb-3 -ml-2 text-muted-foreground rounded-full">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Project
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-foreground">{estimate.title}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono">{estimate.quoteNumber}</span>
                <Badge variant="secondary" className={`text-[10px] capitalize rounded-full status-${estimate.status}`}>{estimate.status}</Badge>
                {confidence !== null && confidence !== undefined && (
                  <Badge variant="secondary" className={`text-[10px] rounded-full ${confidence >= 80 ? "bg-green-50 text-green-700" : confidence >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                    AI {confidence}% confident
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => { setSentUrl(null); setSendQuoteOpen(true); }}
                size="sm"
                className="rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white h-8"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" /> Send to Client
              </Button>
              <Button
                onClick={() => generatePdf.mutate({ id: estimateId })}
                disabled={generatePdf.isPending}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold border-pink-300 text-pink-600 hover:bg-pink-50 h-8"
              >
                {generatePdf.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
                {generatePdf.isPending ? "Generating..." : "Download PDF"}
              </Button>
              {estimate.quotePdfUrl && (
                <Button
                  onClick={() => window.open(estimate.quotePdfUrl!, "_blank")}
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs font-bold text-gray-500 h-8"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Last PDF
                </Button>
              )}
            </div>
            <Select value={estimate.status} onValueChange={(v) => updateStatus.mutate({ id: estimateId, status: v as any })}>
              <SelectTrigger className="w-32 text-xs h-8 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["draft", "review", "sent", "accepted", "declined"].map(s => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="items">
          <TabsList className="bg-gray-100 rounded-full p-1">
            <TabsTrigger value="items" className="text-xs rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Line Items</TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Compliance</TabsTrigger>
            <TabsTrigger value="summary" className="text-xs rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Quote Summary</TabsTrigger>
            <TabsTrigger value="benchmark" className="text-xs rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Market Benchmark</TabsTrigger>
          </TabsList>

          {/* Line Items Tab */}
          <TabsContent value="items" className="space-y-4 mt-4">
            <div className="flex gap-2 flex-wrap">
              {/* AI Takeoff */}
              <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Takeoff
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-black">
                      <Bot className="w-5 h-5 text-pink-500" /> AI-Powered Takeoff
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-100 rounded-2xl p-4 text-xs text-pink-700">
                      <strong className="font-bold">Describe your project scope</strong> and the AI will generate a detailed takeoff with Australian market pricing.
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Project Description / Scope</Label>
                      <Textarea
                        placeholder={`Describe the work scope, dimensions, and any specific requirements.\n\nExample: "3-bedroom house, 180m² floor area. Need to install 20 power points, 15 light points, 1x 3-phase switchboard, smoke alarms to NCC requirements, and outdoor weatherproof GPOs."`}
                        className="min-h-32 text-sm rounded-xl"
                        value={aiDescription}
                        onChange={e => setAiDescription(e.target.value)}
                      />
                    </div>
                    <Button className="w-full kindai-btn-primary rounded-xl font-bold" onClick={handleAiAnalyze} disabled={aiLoading}>
                      {aiLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analysing...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Takeoff</>}
                    </Button>

                    {aiResult && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-black text-foreground">AI Takeoff Results</div>
                          <Badge className={`text-xs rounded-full ${aiResult.confidence >= 80 ? "bg-green-100 text-green-800" : aiResult.confidence >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                            {aiResult.confidence}% confidence
                          </Badge>
                        </div>

                        {aiResult.assumptions?.length > 0 && (
                          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" /> Assumptions Made
                            </div>
                            <ul className="space-y-0.5">
                              {aiResult.assumptions.map((a: string, i: number) => (
                                <li key={i} className="text-xs text-amber-700">• {a}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="border-0 rounded-2xl overflow-hidden shadow-sm bg-white">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                                <th className="text-right p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Qty</th>
                                <th className="text-right p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Unit</th>
                                <th className="text-right p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Rate</th>
                                <th className="text-right p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {aiResult.items.map((item: any, i: number) => (
                                <tr key={i} className="border-t border-gray-100">
                                  <td className="p-2.5 font-medium">{item.description}</td>
                                  <td className="p-2.5 text-right">{item.quantity}</td>
                                  <td className="p-2.5 text-right text-muted-foreground">{item.unit}</td>
                                  <td className="p-2.5 text-right">${item.unitRate.toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-bold">${(item.quantity * item.unitRate).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <Button className="w-full kindai-btn-primary rounded-xl font-bold" onClick={handleAddAiItems}>
                          <Plus className="w-4 h-4 mr-2" /> Add All Items to Estimate
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Manual Add */}
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="kindai-btn-primary rounded-full font-bold text-xs px-4">
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-black">
                      <Sparkles className="w-5 h-5 text-pink-500" /> Add Line Item
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold">Category</Label>
                        <Select value={newItem.category} onValueChange={v => setNewItem(f => ({ ...f, category: v }))}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold">Description *</Label>
                        <Input placeholder="e.g. 10mm² TPS cable" value={newItem.description} onChange={e => setNewItem(f => ({ ...f, description: e.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Unit</Label>
                        <Select value={newItem.unit} onValueChange={v => setNewItem(f => ({ ...f, unit: v }))}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Quantity *</Label>
                        <Input type="number" min="0" step="0.001" placeholder="0" value={newItem.quantity} onChange={e => setNewItem(f => ({ ...f, quantity: e.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Unit Rate ($ excl. GST) *</Label>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" value={newItem.unitRate} onChange={e => setNewItem(f => ({ ...f, unitRate: e.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Waste Factor (%)</Label>
                        <Input type="number" min="0" max="100" placeholder="0" value={newItem.wasteFactor} onChange={e => setNewItem(f => ({ ...f, wasteFactor: e.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold">Notes (optional)</Label>
                        <Input placeholder="Any notes..." value={newItem.notes} onChange={e => setNewItem(f => ({ ...f, notes: e.target.value }))} className="rounded-xl" />
                      </div>
                    </div>
                    {newItem.quantity && newItem.unitRate && (
                      <div className="bg-gray-50 rounded-2xl p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal (excl. waste):</span>
                          <span className="font-bold">${(parseFloat(newItem.quantity) * parseFloat(newItem.unitRate)).toFixed(2)}</span>
                        </div>
                        {parseFloat(newItem.wasteFactor) > 0 && (
                          <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">With {newItem.wasteFactor}% waste:</span>
                            <span className="font-bold">${(parseFloat(newItem.quantity) * parseFloat(newItem.unitRate) * (1 + parseFloat(newItem.wasteFactor) / 100)).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <Button className="w-full kindai-btn-primary rounded-xl font-bold" onClick={handleAddItem} disabled={addItem.isPending}>
                      {addItem.isPending ? "Adding..." : "Add Item"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Line Items Table */}
            {itemsLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-xl" />)}
              </div>
            ) : (lineItems ?? []).length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground mb-1">No line items yet</p>
                <p className="text-xs text-muted-foreground mb-4">Use AI Takeoff or add items manually</p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" className="rounded-full border-pink-200 text-pink-600 font-bold text-xs" onClick={() => setAiOpen(true)}>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Takeoff
                  </Button>
                  <Button size="sm" className="kindai-btn-primary rounded-full font-bold text-xs" onClick={() => setAddOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Manually
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{category}</div>
                    <div className="border-0 rounded-2xl overflow-hidden shadow-sm bg-white">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-bold text-xs text-muted-foreground uppercase tracking-wider">Description</th>
                            <th className="text-right p-3 font-bold text-xs text-muted-foreground uppercase tracking-wider w-16">Qty</th>
                            <th className="text-right p-3 font-bold text-xs text-muted-foreground uppercase tracking-wider w-12">Unit</th>
                            <th className="text-right p-3 font-bold text-xs text-muted-foreground uppercase tracking-wider w-24">Rate</th>
                            <th className="text-right p-3 font-bold text-xs text-muted-foreground uppercase tracking-wider w-24">Subtotal</th>
                            <th className="w-10 p-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(items ?? []).map((item) => (
                            <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  {item.isFromAi && <Sparkles className="w-3 h-3 text-pink-500 flex-shrink-0" />}
                                  <span className="font-medium">{item.description}</span>
                                </div>
                                {item.notes && <div className="text-xs text-muted-foreground mt-0.5">{item.notes}</div>}
                              </td>
                              <td className="p-3 text-right text-xs">{parseFloat(item.quantity as string)}</td>
                              <td className="p-3 text-right text-xs text-muted-foreground">{item.unit}</td>
                              <td className="p-3 text-right text-xs">${parseFloat(item.unitRate as string).toFixed(2)}</td>
                              <td className="p-3 text-right text-xs font-bold">${parseFloat(item.subtotal as string).toFixed(2)}</td>
                              <td className="p-3">
                                <button onClick={() => deleteItem.mutate({ id: item.id, estimateId })} className="text-muted-foreground hover:text-destructive transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            {(lineItems ?? []).length > 0 && (
              <Card className="border-0 shadow-md ml-auto max-w-xs rounded-2xl overflow-hidden">
                <CardContent className="p-5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal (excl. GST)</span>
                    <span className="font-bold">${subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (10%)</span>
                    <span className="font-bold">${gstAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t border-gray-100 pt-2">
                    <span>Total (inc. GST)</span>
                    <span className="kindai-gradient-text">${total.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full kindai-btn-primary rounded-xl font-bold mt-1"
                    onClick={() => recalc.mutate({ id: estimateId })}
                    disabled={recalc.isPending}
                  >
                    {recalc.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5 mr-1.5" />}
                    Recalculate
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4 mt-4">
            {!compliance ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading compliance data...</div>
            ) : (
              <>
                {compliance.licensing && (
                  <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="pb-3 pt-5 px-5">
                      <CardTitle className="text-sm font-black flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        Licensing Requirements
                        {estimate.complianceState && <Badge variant="secondary" className="text-xs rounded-full">{estimate.complianceState}</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 px-5 pb-5">
                      <div className="text-sm"><span className="text-muted-foreground">Licensing Body:</span> <span className="font-bold">{compliance.licensing.body}</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Licence Type:</span> <span className="font-bold">{compliance.licensing.type}</span></div>
                      <a href={compliance.licensing.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-pink-600 hover:underline font-bold">
                        <ExternalLink className="w-3 h-3" /> Apply / Verify Licence
                      </a>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-amber-100 bg-amber-50 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2 pt-5 px-5">
                    <CardTitle className="text-sm font-black flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="w-4 h-4" /> WHS / OH&S Notice
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className="text-xs text-amber-700 leading-relaxed">{compliance.whsNotice}</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 pt-5 px-5">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      Applicable Australian Standards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="space-y-2">
                      {compliance.standards.map((s: any) => (
                        <div key={s.code} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-foreground">{s.code}</span>
                            <span className="text-xs text-muted-foreground ml-1.5">{s.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-3 p-4 rounded-2xl border-0 bg-white shadow-sm">
                  <input
                    type="checkbox"
                    id="complianceCheck"
                    checked={estimate.complianceChecked ?? false}
                    onChange={(e) => updateStatus.mutate({ id: estimateId, complianceChecked: e.target.checked })}
                    className="w-4 h-4 rounded border-border accent-pink-500"
                  />
                  <label htmlFor="complianceCheck" className="text-sm text-foreground cursor-pointer">
                    I confirm this estimate complies with all applicable Australian Standards, licensing requirements, and WHS obligations.
                  </label>
                </div>
              </>
            )}
          </TabsContent>

          {/* Quote Summary Tab */}
          <TabsContent value="summary" className="space-y-4 mt-4">
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-black">Quote Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground font-bold mb-1">Quote Number</div>
                    <div className="text-sm font-mono font-bold">{estimate.quoteNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-bold mb-1">Valid For</div>
                    <div className="text-sm font-bold">{estimate.quoteValidDays} days</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-bold mb-1">Subtotal (excl. GST)</div>
                    <div className="text-sm font-bold">${subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-bold mb-1">GST (10%)</div>
                    <div className="text-sm font-bold">${gstAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-muted-foreground font-bold mb-1">Total (inc. GST)</div>
                    <div className="text-2xl font-black kindai-gradient-text">${total.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>

                {compliance?.quoteDisclaimer && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="text-xs font-bold text-foreground mb-1.5">Quote Disclaimer</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{compliance.quoteDisclaimer}</p>
                  </div>
                )}

                {estimate.quoteTerms && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="text-xs font-bold text-foreground mb-1.5">Terms & Conditions</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{estimate.quoteTerms}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="kindai-btn-primary rounded-full font-bold text-xs px-5"
                    onClick={() => {
                      updateStatus.mutate({ id: estimateId, status: "sent" });
                      toast.success("Quote marked as sent!");
                    }}
                  >
                    Mark as Sent
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full font-bold text-xs" onClick={() => toast.info("PDF generation coming soon — export to Xero/MYOB available")}>
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {assumptions && assumptions.length > 0 && (
              <Card className="border-amber-100 bg-amber-50 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-2 pt-5 px-5">
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="w-4 h-4" /> AI Assumption Log
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <ul className="space-y-1">
                    {assumptions.map((a, i) => (
                      <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">•</span> {a}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Market Benchmark Tab ── */}
          <TabsContent value="benchmark" className="space-y-4 mt-4">
            <BenchmarkPanel estimateId={estimateId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Send Quote to Client Dialog ── */}
      <Dialog open={sendQuoteOpen} onOpenChange={(o) => { setSendQuoteOpen(o); if (!o) setSentUrl(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4 text-orange-500" /> Send Quote to Client
            </DialogTitle>
          </DialogHeader>
          {sentUrl ? (
            <div className="space-y-4 py-2">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-green-800">Quote link ready!</p>
                <p className="text-sm text-green-600 mt-1">Share this link with your client</p>
              </div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={sentUrl}
                  className="flex-1 text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { navigator.clipboard.writeText(sentUrl); toast.success("Link copied!"); }}
                  className="shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-xs text-zinc-500 text-center">Client can view and digitally accept the quote without logging in</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Client Name (optional)</label>
                <input
                  type="text"
                  value={sendForm.clientName}
                  onChange={e => setSendForm(f => ({ ...f, clientName: e.target.value }))}
                  placeholder="John Smith"
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Client Email (optional)</label>
                <input
                  type="email"
                  value={sendForm.clientEmail}
                  onChange={e => setSendForm(f => ({ ...f, clientEmail: e.target.value }))}
                  placeholder="client@example.com"
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Message to Client (optional)</label>
                <Textarea
                  value={sendForm.message}
                  onChange={e => setSendForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Hi, please find your quote attached. Let me know if you have any questions."
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Link expires in</label>
                <select
                  value={sendForm.expiryDays}
                  onChange={e => setSendForm(f => ({ ...f, expiryDays: e.target.value }))}
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSendQuoteOpen(false); setSentUrl(null); }}>Close</Button>
            {!sentUrl && (
              <Button
                onClick={() => sendQuote.mutate({
                  estimateId,
                  clientName: sendForm.clientName || "Client",
                  clientEmail: sendForm.clientEmail || "",
                  origin: window.location.origin,
                  message: sendForm.message || undefined,
                  expiryDays: parseInt(sendForm.expiryDays),
                })}
                disabled={sendQuote.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {sendQuote.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...</> : <><Send className="w-3.5 h-3.5 mr-1.5" /> Generate Quote Link</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
