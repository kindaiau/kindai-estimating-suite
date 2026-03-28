import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BookOpen, Package, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const TRADES = [
  { id: "electrical", name: "Electrical", emoji: "⚡" }, { id: "plumbing", name: "Plumbing", emoji: "🔧" },
  { id: "carpentry", name: "Carpentry", emoji: "🪚" }, { id: "concreting", name: "Concreting", emoji: "🏗️" },
  { id: "hvac", name: "HVAC", emoji: "❄️" }, { id: "flooring", name: "Flooring", emoji: "🟫" },
  { id: "landscaping", name: "Landscaping", emoji: "🌿" }, { id: "cabinetry", name: "Cabinetry", emoji: "🚪" },
  { id: "rendering", name: "Rendering & Plastering", emoji: "🧱" }, { id: "cabinet-making", name: "Cabinet Making", emoji: "🪵" },
];
const UNITS = ["ea", "m²", "m³", "lm", "hr", "day", "tonne", "kg", "L", "set", "lot", "point", "circuit", "fixture"];

export default function MaterialsLibrary() {
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    trade: "", name: "", description: "", unit: "ea",
    category: "Materials", unitPrice: "", supplier: "", wasteFactor: "5",
  });

  const utils = trpc.useUtils();
  const { data: materials, isLoading } = trpc.materials.list.useQuery({ trade: tradeFilter === "all" ? undefined : tradeFilter });
  const createMaterial = trpc.materials.create.useMutation({
    onSuccess: () => { toast.success("Material added"); utils.materials.list.invalidate(); setOpen(false); setForm({ trade: "", name: "", description: "", unit: "ea", category: "Materials", unitPrice: "", supplier: "", wasteFactor: "5" }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMaterial = trpc.materials.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); utils.materials.list.invalidate(); },
  });

  const filtered = (materials ?? []).filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Materials Library">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-500" /> Materials Library
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{materials?.length ?? 0} materials</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="kindai-btn-primary rounded-full px-6 font-bold text-sm">
                <Plus className="w-4 h-4 mr-1.5" /> Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-black">
                  <Sparkles className="w-5 h-5 text-pink-500" /> Add Material
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Trade *</Label>
                  <Select value={form.trade} onValueChange={v => setForm(f => ({ ...f, trade: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select trade..." /></SelectTrigger>
                    <SelectContent>{TRADES.map(t => <SelectItem key={t.id} value={t.id}><span className="flex items-center gap-2">{t.emoji} {t.name}</span></SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Material Name *</Label>
                  <Input placeholder="e.g. 2.5mm² TPS Cable" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Description</Label>
                  <Input placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Unit</Label>
                    <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Unit Price ($)</Label>
                    <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} className="rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Supplier</Label>
                    <Input placeholder="e.g. Reece, Bunnings" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Waste Factor (%)</Label>
                    <Input type="number" min="0" max="100" value={form.wasteFactor} onChange={e => setForm(f => ({ ...f, wasteFactor: e.target.value }))} className="rounded-xl" />
                  </div>
                </div>
                <Button
                  className="w-full kindai-btn-primary rounded-xl font-bold"
                  onClick={() => {
                    if (!form.trade || !form.name) return toast.error("Trade and name required");
                    createMaterial.mutate({
                      trade: form.trade, name: form.name,
                      description: form.description || undefined, unit: form.unit,
                      category: form.category || "Materials",
                      unitPrice: parseFloat(form.unitPrice) || 0,
                      supplier: form.supplier || undefined,
                      wasteFactor: parseFloat(form.wasteFactor) || 5,
                    });
                  }}
                  disabled={createMaterial.isPending}
                >
                  {createMaterial.isPending ? "Adding..." : "Add Material"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 rounded-xl" placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl"><SelectValue placeholder="All trades" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {TRADES.map(t => <SelectItem key={t.id} value={t.id}><span className="flex items-center gap-2">{t.emoji} {t.name}</span></SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-secondary/50 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 rounded-2xl blur-lg opacity-40 kindai-gradient scale-110" />
              <img src={LOGO_URL} alt="Kindai" className="relative w-16 h-16 object-contain" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1">No materials found</h3>
            <p className="text-sm text-muted-foreground mb-4">Add materials to your library for quick access when building estimates</p>
            <Button className="kindai-btn-primary rounded-full px-6 font-bold text-sm" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add First Material
            </Button>
          </div>
        ) : (
          <div className="border-0 rounded-2xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider">Material</th>
                  <th className="text-left p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Trade</th>
                  <th className="text-right p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider">Unit</th>
                  <th className="text-right p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="text-right p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Waste</th>
                  <th className="text-left p-3.5 font-bold text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Supplier</th>
                  <th className="w-10 p-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{m.name}</div>
                      {m.description && <div className="text-xs text-muted-foreground mt-0.5">{m.description}</div>}
                    </td>
                    <td className="p-3.5 hidden sm:table-cell">
                      <Badge variant="secondary" className="text-[10px] capitalize rounded-full">{m.trade}</Badge>
                    </td>
                    <td className="p-3.5 text-right text-xs text-muted-foreground font-medium">{m.unit}</td>
                    <td className="p-3.5 text-right font-bold text-foreground">${parseFloat(m.unitPrice as string).toFixed(2)}</td>
                    <td className="p-3.5 text-right text-xs text-muted-foreground hidden md:table-cell">{m.wasteFactor}%</td>
                    <td className="p-3.5 text-xs text-muted-foreground hidden lg:table-cell">{m.supplier ?? "—"}</td>
                    <td className="p-3.5">
                      <button onClick={() => deleteMaterial.mutate({ id: m.id })} className="text-muted-foreground hover:text-destructive transition-colors">
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
