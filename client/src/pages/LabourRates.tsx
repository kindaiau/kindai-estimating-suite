import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Trash2, RefreshCw, Sparkles, Shield } from "lucide-react";
import { useState } from "react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const TRADES = [
  { id: "electrical", name: "Electrical", emoji: "⚡" }, { id: "plumbing", name: "Plumbing", emoji: "🔧" },
  { id: "carpentry", name: "Carpentry", emoji: "🪚" }, { id: "concreting", name: "Concreting", emoji: "🏗️" },
  { id: "hvac", name: "HVAC", emoji: "❄️" }, { id: "flooring", name: "Flooring", emoji: "🟫" },
  { id: "landscaping", name: "Landscaping", emoji: "🌿" }, { id: "cabinetry", name: "Cabinet Making & Joinery", emoji: "🪵" },
  { id: "rendering", name: "Rendering & Plastering", emoji: "🧱" },
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
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-green-500" /> Labour Rates
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Fair Work Act-compliant rates per trade</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedDefaults.mutate({ trade: tradeFilter })}
              disabled={seedDefaults.isPending}
              className="rounded-full font-bold text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${seedDefaults.isPending ? "animate-spin" : ""}`} />
              Load Defaults
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="kindai-btn-primary rounded-full font-bold text-xs px-4">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Rate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg font-black">
                    <Sparkles className="w-5 h-5 text-pink-500" /> Add Labour Rate
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Classification *</Label>
                    <Input placeholder="e.g. Electrician Grade 3" value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Base Rate ($/hr) *</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.baseRate} onChange={e => setForm(f => ({ ...f, baseRate: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Overtime ($/hr)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.overtimeRate} onChange={e => setForm(f => ({ ...f, overtimeRate: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Saturday ($/hr)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.saturdayRate} onChange={e => setForm(f => ({ ...f, saturdayRate: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Sunday ($/hr)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.sundayRate} onChange={e => setForm(f => ({ ...f, sundayRate: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Public Holiday ($/hr)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.publicHolidayRate} onChange={e => setForm(f => ({ ...f, publicHolidayRate: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Travel ($/day)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.travelAllowance} onChange={e => setForm(f => ({ ...f, travelAllowance: e.target.value }))} className="rounded-xl" />
                    </div>
                  </div>
                  <Button
                    className="w-full kindai-btn-primary rounded-xl font-bold"
                    onClick={() => {
                      if (!form.classification || !form.baseRate) return toast.error("Classification and base rate required");
                      createRate.mutate({
                        trade: tradeFilter, classification: form.classification,
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

        {/* Trade Selector Pills */}
        <div className="flex gap-2 flex-wrap">
          {TRADES.map(t => (
            <button
              key={t.id}
              onClick={() => setTradeFilter(t.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                tradeFilter === t.id
                  ? "kindai-gradient text-white shadow-md shadow-pink-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>

        {/* Fair Work Notice */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <strong className="font-bold">Fair Work Act 2009:</strong> These rates are based on applicable Modern Awards. Always verify current rates at{" "}
            <a href="https://www.fairwork.gov.au" target="_blank" rel="noopener noreferrer" className="underline font-bold">fairwork.gov.au</a>.
            Penalty rates, allowances, and overtime must comply with the relevant Award for each classification.
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-secondary/50 rounded-xl animate-pulse" />)}</div>
        ) : !rates || rates.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 rounded-2xl blur-lg opacity-40 kindai-gradient scale-110" />
              <img src={LOGO_URL} alt="Kindai" className="relative w-16 h-16 object-contain" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1">No rates for {TRADES.find(t => t.id === tradeFilter)?.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">Load default Fair Work rates or add your own</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => seedDefaults.mutate({ trade: tradeFilter })} disabled={seedDefaults.isPending} className="rounded-full font-bold text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Load Defaults
              </Button>
              <Button className="kindai-btn-primary rounded-full font-bold text-xs" onClick={() => setOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Rate
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-0 rounded-2xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider">Classification</th>
                  <th className="text-right p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider">Base</th>
                  <th className="text-right p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Overtime</th>
                  <th className="text-right p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Saturday</th>
                  <th className="text-right p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Sunday</th>
                  <th className="text-right p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Travel/day</th>
                  <th className="w-10 p-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="p-3.5 font-bold text-foreground">{r.classification}</td>
                    <td className="p-3.5 text-right font-black kindai-gradient-text">${parseFloat(r.baseRate as string).toFixed(2)}/hr</td>
                    <td className="p-3.5 text-right text-xs text-muted-foreground hidden sm:table-cell">${parseFloat(r.overtimeRate as string || "0").toFixed(2)}</td>
                    <td className="p-3.5 text-right text-xs text-muted-foreground hidden md:table-cell">${parseFloat(r.saturdayRate as string || "0").toFixed(2)}</td>
                    <td className="p-3.5 text-right text-xs text-muted-foreground hidden md:table-cell">${parseFloat(r.sundayRate as string || "0").toFixed(2)}</td>
                    <td className="p-3.5 text-right text-xs text-muted-foreground hidden lg:table-cell">${parseFloat(r.travelAllowance as string || "0").toFixed(2)}</td>
                    <td className="p-3.5">
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
