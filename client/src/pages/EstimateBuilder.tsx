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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeft, Bot, CheckCircle2, DollarSign, ExternalLink,
  FileText, Loader2, Plus, Shield, Sparkles, Trash2,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Streamdown } from "streamdown";

const CATEGORIES = ["Materials", "Labour", "Plant & Equipment", "Subcontract", "Preliminaries", "Other"];
const UNITS = ["ea", "m²", "m³", "lm", "hr", "day", "tonne", "kg", "L", "set", "lot", "point", "circuit", "fixture"];

export default function EstimateBuilder() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const estimateId = parseInt(params.id ?? "0");
  const [addOpen, setAddOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
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

  const analyzePlan = trpc.ai.analyzePlan.useMutation({
    onSuccess: (data) => {
      setAiResult(data);
      setAiLoading(false);
    },
    onError: (e) => { toast.error(e.message); setAiLoading(false); },
  });

  const handleAiAnalyze = () => {
    if (!aiDescription.trim()) return toast.error("Please describe your project");
    setAiLoading(true);
    setAiResult(null);
    analyzePlan.mutate({
      estimateId,
      trade: estimate?.trade ?? "",
      planDescription: aiDescription,
    });
  };

  const handleAddAiItems = async () => {
    if (!aiResult?.items) return;
    for (const item of aiResult.items) {
      await addItem.mutateAsync({
        estimateId,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unitRate: item.unitRate,
        wasteFactor: 5,
        isFromAi: true,
      });
    }
    toast.success(`${aiResult.items.length} items added from AI takeoff`);
    setAiOpen(false);
    setAiResult(null);
    setAiDescription("");
  };

  const handleAddItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.unitRate) {
      return toast.error("Description, quantity and rate are required");
    }
    addItem.mutate({
      estimateId,
      category: newItem.category,
      description: newItem.description,
      unit: newItem.unit,
      quantity: parseFloat(newItem.quantity),
      unitRate: parseFloat(newItem.unitRate),
      wasteFactor: parseFloat(newItem.wasteFactor) || 0,
      notes: newItem.notes || undefined,
    });
  };

  if (isLoading) return (
    <AppLayout><div className="p-6 animate-pulse space-y-4">
      <div className="h-8 w-64 bg-secondary rounded" />
      <div className="h-48 bg-secondary rounded-xl" />
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
      <div className="p-6 space-y-5">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${estimate.projectId}`)} className="mb-3 -ml-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Project
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">{estimate.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground font-mono">{estimate.quoteNumber}</span>
                <Badge variant="secondary" className={`text-[10px] capitalize status-${estimate.status}`}>{estimate.status}</Badge>
                {confidence !== null && confidence !== undefined && (
                  <Badge variant="secondary" className={`text-[10px] ${confidence >= 80 ? "confidence-high bg-green-50" : confidence >= 60 ? "confidence-medium bg-amber-50" : "confidence-low bg-red-50"}`}>
                    AI {confidence}% confident
                  </Badge>
                )}
              </div>
            </div>
            <Select value={estimate.status} onValueChange={(v) => updateStatus.mutate({ id: estimateId, status: v as any })}>
              <SelectTrigger className="w-32 text-xs h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["draft", "review", "sent", "accepted", "declined"].map(s => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="items">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="items" className="text-xs">Line Items</TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs">Compliance</TabsTrigger>
            <TabsTrigger value="summary" className="text-xs">Quote Summary</TabsTrigger>
          </TabsList>

          {/* Line Items Tab */}
          <TabsContent value="items" className="space-y-4 mt-4">
            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {/* AI Takeoff */}
              <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/5">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Takeoff
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-primary" /> AI-Powered Takeoff
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-primary">
                      Describe your project scope and the AI will generate a detailed takeoff with Australian market pricing.
                    </div>
                    <div className="space-y-1.5">
                      <Label>Project Description / Scope</Label>
                      <Textarea
                        placeholder={`Describe the work scope, dimensions, and any specific requirements.\n\nExample: "3-bedroom house, 180m² floor area. Need to install 20 power points, 15 light points, 1x 3-phase switchboard, smoke alarms to NCC requirements, and outdoor weatherproof GPOs."`}
                        className="min-h-32 text-sm"
                        value={aiDescription}
                        onChange={e => setAiDescription(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full kindai-gradient text-white border-0"
                      onClick={handleAiAnalyze}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analysing...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Takeoff</>}
                    </Button>

                    {aiResult && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-foreground">AI Takeoff Results</div>
                          <Badge className={`text-xs ${aiResult.confidence >= 80 ? "bg-green-100 text-green-800" : aiResult.confidence >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                            {aiResult.confidence}% Confidence
                          </Badge>
                        </div>

                        {aiResult.assumptions?.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" /> Assumptions Made
                            </div>
                            <ul className="space-y-0.5">
                              {aiResult.assumptions.map((a: string, i: number) => (
                                <li key={i} className="text-xs text-amber-700">• {a}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="border border-border rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-secondary/50">
                              <tr>
                                <th className="text-left p-2 font-medium">Description</th>
                                <th className="text-right p-2 font-medium">Qty</th>
                                <th className="text-right p-2 font-medium">Unit</th>
                                <th className="text-right p-2 font-medium">Rate</th>
                                <th className="text-right p-2 font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {aiResult.items.map((item: any, i: number) => (
                                <tr key={i} className="border-t border-border">
                                  <td className="p-2">{item.description}</td>
                                  <td className="p-2 text-right">{item.quantity}</td>
                                  <td className="p-2 text-right">{item.unit}</td>
                                  <td className="p-2 text-right">${item.unitRate.toFixed(2)}</td>
                                  <td className="p-2 text-right font-medium">${(item.quantity * item.unitRate).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <Button className="w-full kindai-gradient text-white border-0" onClick={handleAddAiItems}>
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
                  <Button size="sm" className="kindai-gradient text-white border-0">
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Line Item</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <Label>Category</Label>
                        <Select value={newItem.category} onValueChange={v => setNewItem(f => ({ ...f, category: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Description *</Label>
                        <Input placeholder="e.g. 10mm² TPS cable" value={newItem.description} onChange={e => setNewItem(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Unit</Label>
                        <Select value={newItem.unit} onValueChange={v => setNewItem(f => ({ ...f, unit: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Quantity *</Label>
                        <Input type="number" min="0" step="0.001" placeholder="0" value={newItem.quantity} onChange={e => setNewItem(f => ({ ...f, quantity: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Unit Rate ($ excl. GST) *</Label>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" value={newItem.unitRate} onChange={e => setNewItem(f => ({ ...f, unitRate: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Waste Factor (%)</Label>
                        <Input type="number" min="0" max="100" placeholder="0" value={newItem.wasteFactor} onChange={e => setNewItem(f => ({ ...f, wasteFactor: e.target.value }))} />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Notes (optional)</Label>
                        <Input placeholder="Any notes..." value={newItem.notes} onChange={e => setNewItem(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                    </div>
                    {newItem.quantity && newItem.unitRate && (
                      <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal (excl. waste):</span>
                          <span className="font-medium">${(parseFloat(newItem.quantity) * parseFloat(newItem.unitRate)).toFixed(2)}</span>
                        </div>
                        {parseFloat(newItem.wasteFactor) > 0 && (
                          <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">With {newItem.wasteFactor}% waste:</span>
                            <span className="font-medium">${(parseFloat(newItem.quantity) * parseFloat(newItem.unitRate) * (1 + parseFloat(newItem.wasteFactor) / 100)).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <Button className="w-full kindai-gradient text-white border-0" onClick={handleAddItem} disabled={addItem.isPending}>
                      {addItem.isPending ? "Adding..." : "Add Item"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Line Items Table */}
            {itemsLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-lg" />)}
              </div>
            ) : (lineItems ?? []).length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No line items yet</p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" className="border-primary/40 text-primary" onClick={() => setAiOpen(true)}>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Takeoff
                  </Button>
                  <Button size="sm" className="kindai-gradient text-white border-0" onClick={() => setAddOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Manually
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{category}</div>
                    <div className="border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th className="text-left p-3 font-medium text-xs">Description</th>
                            <th className="text-right p-3 font-medium text-xs w-16">Qty</th>
                            <th className="text-right p-3 font-medium text-xs w-12">Unit</th>
                            <th className="text-right p-3 font-medium text-xs w-24">Rate</th>
                            <th className="text-right p-3 font-medium text-xs w-24">Subtotal</th>
                            <th className="w-10 p-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(items ?? []).map((item) => (
                            <tr key={item.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  {item.isFromAi && <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />}
                                  <span>{item.description}</span>
                                </div>
                                {item.notes && <div className="text-xs text-muted-foreground mt-0.5">{item.notes}</div>}
                              </td>
                              <td className="p-3 text-right text-xs">{parseFloat(item.quantity as string)}</td>
                              <td className="p-3 text-right text-xs text-muted-foreground">{item.unit}</td>
                              <td className="p-3 text-right text-xs">${parseFloat(item.unitRate as string).toFixed(2)}</td>
                              <td className="p-3 text-right text-xs font-medium">${parseFloat(item.subtotal as string).toFixed(2)}</td>
                              <td className="p-3">
                                <button
                                  onClick={() => deleteItem.mutate({ id: item.id, estimateId })}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
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
              <Card className="border-border shadow-sm ml-auto max-w-xs">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal (excl. GST)</span>
                    <span className="font-medium">${subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (10%)</span>
                    <span className="font-medium">${gstAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                    <span>Total (inc. GST)</span>
                    <span className="text-primary">${total.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full kindai-gradient text-white border-0 mt-1"
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
                {/* Licensing */}
                {compliance.licensing && (
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> Licensing Requirements
                        {estimate.complianceState && <Badge variant="secondary" className="text-xs">{estimate.complianceState}</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm"><span className="text-muted-foreground">Licensing Body:</span> <span className="font-medium">{compliance.licensing.body}</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Licence Type:</span> <span className="font-medium">{compliance.licensing.type}</span></div>
                      <a href={compliance.licensing.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                        <ExternalLink className="w-3 h-3" /> Apply / Verify Licence
                      </a>
                    </CardContent>
                  </Card>
                )}

                {/* WHS Notice */}
                <Card className="border-amber-200 bg-amber-50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="w-4 h-4" /> WHS / OH&S Notice
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-amber-700 leading-relaxed">{compliance.whsNotice}</p>
                  </CardContent>
                </Card>

                {/* Standards */}
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Applicable Australian Standards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {compliance.standards.map((s: any) => (
                        <div key={s.code} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-semibold text-foreground">{s.code}</span>
                            <span className="text-xs text-muted-foreground ml-1.5">{s.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Check */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                  <input
                    type="checkbox"
                    id="complianceCheck"
                    checked={estimate.complianceChecked ?? false}
                    onChange={(e) => updateStatus.mutate({ id: estimateId, complianceChecked: e.target.checked })}
                    className="w-4 h-4 rounded border-border accent-primary"
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
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quote Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Quote Number</div>
                    <div className="text-sm font-mono font-medium">{estimate.quoteNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Valid For</div>
                    <div className="text-sm font-medium">{estimate.quoteValidDays} days</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Subtotal (excl. GST)</div>
                    <div className="text-sm font-medium">${subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">GST (10%)</div>
                    <div className="text-sm font-medium">${gstAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">Total (inc. GST)</div>
                    <div className="text-xl font-bold text-primary">${total.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>

                {compliance?.quoteDisclaimer && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-foreground mb-1.5">Quote Disclaimer</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{compliance.quoteDisclaimer}</p>
                  </div>
                )}

                {estimate.quoteTerms && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-foreground mb-1.5">Terms & Conditions</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{estimate.quoteTerms}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="kindai-gradient text-white border-0"
                    onClick={() => {
                      updateStatus.mutate({ id: estimateId, status: "sent" });
                      toast.success("Quote marked as sent!");
                    }}
                  >
                    Mark as Sent
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("PDF generation coming soon — export to Xero/MYOB available")}>
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Assumptions Log */}
            {assumptions && assumptions.length > 0 && (
              <Card className="border-amber-200 bg-amber-50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="w-4 h-4" /> AI Assumption Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
        </Tabs>
      </div>
    </AppLayout>
  );
}
