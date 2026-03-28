import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Trash2, Zap, RefreshCw } from "lucide-react";
import { useState } from "react";

const TRADES = [
  { id: "electrical", name: "Electrical" }, { id: "plumbing", name: "Plumbing" },
  { id: "carpentry", name: "Carpentry" }, { id: "concreting", name: "Concreting" },
  { id: "hvac", name: "HVAC" }, { id: "flooring", name: "Flooring" },
  { id: "landscaping", name: "Landscaping" }, { id: "cabinetry", name: "Cabinetry" },
  { id: "rendering", name: "Rendering & Plastering" }, { id: "cabinet-making", name: "Cabinet Making" },
];

export default function LabourRates() {
  const [tradeFilter, setTradeFilter] = useState("electrical");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    classification: "", baseRate: "", overtimeRate: "", saturdayRate: "",
    sundayRate: "", publicHolidayRate: "", travelAllowance: "", toolAllowance: "",
  });

  const utils = trpc.useUtils();
  const { data: rates, isLoading } = trpc.labour.list.useQuery({ trade: tradeFilter });
  const seedDefaults = trpc.labour.seedDefaults.useMutation({
    onSuccess: (d) => {
      if (d.seeded > 0) { toast.success(`${d.seeded} default rates loaded`); utils.labour.list.invalidate(); }
      else toast.info(d.message ?? "Rates already exist");
    },
    onError: (e) => toast.error(e.message),
  });
  const createRate = trpc.labour.create.useMutation({
    onSuccess: () => { toast.success("Rate added"); utils.labour.list.invalidate(); setOpen(false); setForm({ classification: "", baseRate: "", overtimeRate: "", saturdayRate: "", sundayRate: "", publicHolidayRate: "", travelAllowance: "", toolAllowance: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteRate = trpc.labour.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); utils.labour.list.invalidate(); },
  });

  return (
    <AppLayout title="Labour Rates">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Labour Rates</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Fair Work Act-compliant rates per trade</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedDefaults.mutate({ trade: tradeFilter })}
              disabled={seedDefaults.isPending}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${seedDefaults.isPending ? "animate-spin" : ""}`} />
              Load Defaults
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="kindai-gradient text-white border-0">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Rate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Labour Rate</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <div className="space-y-1.5">
                    <Label>Classification *</Label>
                    <Input placeholder="e.g. Electrician Grade 3" value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Base Rate ($/hr) *</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.baseRate} onChange={e => setForm(f => ({ ...f, baseRate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Overtime Rate ($/hr)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.overtimeRate} onChange={e => setForm(f => ({ ...f, overtimeRate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Saturday Rate ($/hr)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.saturdayRate} onChange={e => setForm(f => ({ ...f, saturdayRate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sunday Rate ($/hr)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.sundayRate} onChange={e => setForm(f => ({ ...f, sundayRate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Public Holiday ($/hr)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.publicHolidayRate} onChange={e => setForm(f => ({ ...f, publicHolidayRate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Travel Allowance ($/day)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.travelAllowance} onChange={e => setForm(f => ({ ...f, travelAllowance: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tool Allowance ($/day)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.toolAllowance} onChange={e => setForm(f => ({ ...f, toolAllowance: e.target.value }))} />
                    </div>
                  </div>
                  <Button
                    className="w-full kindai-gradient text-white border-0"
                    onClick={() => {
                      if (!form.classification || !form.baseRate) return toast.error("Classification and base rate required");
                      createRate.mutate({
                        trade: tradeFilter,
                        classification: form.classification,
                        baseRate: parseFloat(form.baseRate),
                        overtimeRate: form.overtimeRate ? parseFloat(form.overtimeRate) : undefined,
                        saturdayRate: form.saturdayRate ? parseFloat(form.saturdayRate) : undefined,
                        sundayRate: form.sundayRate ? parseFloat(form.sundayRate) : undefined,
                        publicHolidayRate: form.publicHolidayRate ? parseFloat(form.publicHolidayRate) : undefined,
                        travelAllowance: form.travelAllowance ? parseFloat(form.travelAllowance) : undefined,
                        toolAllowance: form.toolAllowance ? parseFloat(form.toolAllowance) : undefined,
                      });
                    }}
                    disabled={createRate.isPending}
                  >
                    {createRate.isPending ? "Adding..." : "Add Rate"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Trade Selector */}
        <div className="flex gap-2 flex-wrap">
          {TRADES.map(t => (
            <button
              key={t.id}
              onClick={() => setTradeFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tradeFilter === t.id ? "bg-primary text-white shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"}`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Fair Work Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          <strong>Fair Work Act 2009:</strong> These rates are based on applicable Modern Awards. Always verify current rates at{" "}
          <a href="https://www.fairwork.gov.au" target="_blank" rel="noopener noreferrer" className="underline">fairwork.gov.au</a>.
          Penalty rates, allowances, and overtime must comply with the relevant Award for each classification.
        </div>

        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />)}</div>
        ) : !rates || rates.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">No rates for {TRADES.find(t => t.id === tradeFilter)?.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">Load default Fair Work rates or add your own</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => seedDefaults.mutate({ trade: tradeFilter })} disabled={seedDefaults.isPending}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Load Defaults
              </Button>
              <Button className="kindai-gradient text-white border-0" onClick={() => setOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Rate
              </Button>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-3 font-medium text-xs">Classification</th>
                  <th className="text-right p-3 font-medium text-xs">Base</th>
                  <th className="text-right p-3 font-medium text-xs hidden sm:table-cell">Overtime</th>
                  <th className="text-right p-3 font-medium text-xs hidden md:table-cell">Saturday</th>
                  <th className="text-right p-3 font-medium text-xs hidden md:table-cell">Sunday</th>
                  <th className="text-right p-3 font-medium text-xs hidden lg:table-cell">Travel/day</th>
                  <th className="w-10 p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-3 font-medium">{r.classification}</td>
                    <td className="p-3 text-right font-semibold text-primary">${parseFloat(r.baseRate as string).toFixed(2)}/hr</td>
                    <td className="p-3 text-right text-xs hidden sm:table-cell">${parseFloat(r.overtimeRate as string || "0").toFixed(2)}</td>
                    <td className="p-3 text-right text-xs hidden md:table-cell">${parseFloat(r.saturdayRate as string || "0").toFixed(2)}</td>
                    <td className="p-3 text-right text-xs hidden md:table-cell">${parseFloat(r.sundayRate as string || "0").toFixed(2)}</td>
                    <td className="p-3 text-right text-xs hidden lg:table-cell">${parseFloat(r.travelAllowance as string || "0").toFixed(2)}</td>
                    <td className="p-3">
                      <button onClick={() => deleteRate.mutate({ id: r.id })} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
