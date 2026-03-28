import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BookOpen, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

const TRADES = [
  { id: "electrical", name: "Electrical" }, { id: "plumbing", name: "Plumbing" },
  { id: "carpentry", name: "Carpentry" }, { id: "concreting", name: "Concreting" },
  { id: "hvac", name: "HVAC" }, { id: "flooring", name: "Flooring" },
  { id: "landscaping", name: "Landscaping" }, { id: "cabinetry", name: "Cabinetry" },
  { id: "rendering", name: "Rendering & Plastering" }, { id: "cabinet-making", name: "Cabinet Making" },
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
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Materials Library</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{materials?.length ?? 0} materials</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="kindai-gradient text-white border-0 shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" /> Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Material</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label>Trade *</Label>
                  <Select value={form.trade} onValueChange={v => setForm(f => ({ ...f, trade: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select trade..." /></SelectTrigger>
                    <SelectContent>{TRADES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Material Name *</Label>
                  <Input placeholder="e.g. 2.5mm² TPS Cable" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Unit</Label>
                    <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unit Price ($)</Label>
                    <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Supplier</Label>
                    <Input placeholder="e.g. Reece, Bunnings" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Waste Factor (%)</Label>
                    <Input type="number" min="0" max="100" value={form.wasteFactor} onChange={e => setForm(f => ({ ...f, wasteFactor: e.target.value }))} />
                  </div>
                </div>
                <Button
                  className="w-full kindai-gradient text-white border-0"
                  onClick={() => {
                    if (!form.trade || !form.name) return toast.error("Trade and name required");
                    createMaterial.mutate({
                      trade: form.trade,
                      name: form.name,
                      description: form.description || undefined,
                      unit: form.unit,
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

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All trades" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {TRADES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-secondary/50 rounded-lg animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">No materials found</h3>
            <p className="text-sm text-muted-foreground mb-4">Add materials to your library for quick access when building estimates</p>
            <Button className="kindai-gradient text-white border-0" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add First Material
            </Button>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-3 font-medium text-xs">Material</th>
                  <th className="text-left p-3 font-medium text-xs hidden sm:table-cell">Trade</th>
                  <th className="text-right p-3 font-medium text-xs">Unit</th>
                  <th className="text-right p-3 font-medium text-xs">Base Price</th>
                  <th className="text-right p-3 font-medium text-xs hidden md:table-cell">Waste</th>
                  <th className="text-left p-3 font-medium text-xs hidden lg:table-cell">Supplier</th>
                  <th className="w-10 p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{m.name}</div>
                      {m.description && <div className="text-xs text-muted-foreground">{m.description}</div>}
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge variant="secondary" className="text-[10px] capitalize">{m.trade}</Badge>
                    </td>
                    <td className="p-3 text-right text-xs text-muted-foreground">{m.unit}</td>
                    <td className="p-3 text-right font-medium">${parseFloat(m.unitPrice as string).toFixed(2)}</td>
                    <td className="p-3 text-right text-xs text-muted-foreground hidden md:table-cell">{m.wasteFactor}%</td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">{m.supplier ?? "—"}</td>
                    <td className="p-3">
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
