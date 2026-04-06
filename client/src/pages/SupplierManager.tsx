import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TRADES } from "@shared/trades";

const SUPPLIER_TYPES = [
  { value: "trade_account", label: "Trade Account" },
  { value: "retail", label: "Retail" },
  { value: "direct", label: "Direct from Manufacturer" },
  { value: "custom", label: "Custom" },
];

export default function SupplierManager() {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<string>("all");
  const [form, setForm] = useState<{
    supplierName: string;
    supplierWebsite: string;
    supplierType: "trade_account" | "retail" | "direct" | "custom";
    accountNumber: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    discountPercent: number;
    notes: string;
    trades: string[];
  }>({
    supplierName: "",
    supplierWebsite: "",
    supplierType: "trade_account",
    accountNumber: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    discountPercent: 0,
    notes: "",
    trades: [] as string[],
  });

  const { data: mySuppliers, refetch } = trpc.suppliers.list.useQuery();
  const { data: recommended } = trpc.suppliers.getRecommended.useQuery(
    { trade: selectedTrade === "all" ? "electrical" : selectedTrade },
    { enabled: true }
  );

  const addMutation = trpc.suppliers.add.useMutation({
    onSuccess: () => {
      toast.success(`${form.supplierName} has been added to your suppliers.`);
      refetch();
      setAddOpen(false);
      setForm({ supplierName: "", supplierWebsite: "", supplierType: "trade_account", accountNumber: "", contactName: "", contactEmail: "", contactPhone: "", discountPercent: 0, notes: "", trades: [] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.suppliers.delete.useMutation({
    onSuccess: () => { toast.success("Supplier removed"); refetch(); },
  });

  const handleAddRecommended = (s: { name: string; website: string; type: string; trades: string[]; notes: string }) => {
    setForm({
      supplierName: s.name,
      supplierWebsite: s.website,
      supplierType: (s.type === "trade" ? "trade_account" : "retail") as "trade_account" | "retail" | "direct" | "custom",
      accountNumber: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      discountPercent: s.type === "trade" ? 20 : 0,
      notes: s.notes,
      trades: s.trades,
    });
    setAddOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Supplier Connections</h1>
            <p className="text-muted-foreground mt-1">
              Link your trade accounts to generate instant material order lists from your estimates.
            </p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>+ Add Supplier</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Supplier Connection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Supplier Name *</Label>
                    <Input value={form.supplierName} onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))} placeholder="e.g. Reece Plumbing" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={form.supplierType} onValueChange={v => setForm(f => ({ ...f, supplierType: v as typeof form.supplierType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUPPLIER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Trade Discount %</Label>
                    <Input type="number" min={0} max={60} value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: Number(e.target.value) }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Website</Label>
                    <Input value={form.supplierWebsite} onChange={e => setForm(f => ({ ...f, supplierWebsite: e.target.value }))} placeholder="https://www.supplier.com.au" />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="Your trade account #" />
                  </div>
                  <div>
                    <Label>Contact Name</Label>
                    <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={!form.supplierName || addMutation.isPending}
                  onClick={() => addMutation.mutate(form)}
                >
                  {addMutation.isPending ? "Adding..." : "Add Supplier"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* My Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle>My Suppliers ({mySuppliers?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!mySuppliers?.length ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No suppliers connected yet. Add your trade accounts below to unlock material order lists.
              </p>
            ) : (
              <div className="space-y-3">
                {mySuppliers.map(s => (
                  <div key={s.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{s.supplierName}</span>
                        <Badge variant={s.supplierType === "trade_account" ? "default" : "secondary"}>
                          {SUPPLIER_TYPES.find(t => t.value === s.supplierType)?.label}
                        </Badge>
                        {Number(s.discountPercent) > 0 && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            {s.discountPercent}% discount
                          </Badge>
                        )}
                      </div>
                      {s.accountNumber && <p className="text-sm text-muted-foreground">Account: {s.accountNumber}</p>}
                      {s.contactName && <p className="text-sm text-muted-foreground">{s.contactName} {s.contactEmail ? `· ${s.contactEmail}` : ""} {s.contactPhone ? `· ${s.contactPhone}` : ""}</p>}
                      {s.supplierWebsite && (
                        <a href={s.supplierWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          {s.supplierWebsite}
                        </a>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate({ id: s.id })}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Suppliers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recommended Australian Suppliers</CardTitle>
              <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by trade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  {TRADES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommended?.map((s, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{s.name}</span>
                      <Badge variant={s.type === "trade" ? "default" : "secondary"}>
                        {s.type === "trade" ? "Trade Account" : "Retail"}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleAddRecommended(s)}>
                      + Add
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.notes}</p>
                  <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    {s.website}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">How Supplier Integration Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium text-primary">1. Connect Your Accounts</div>
                <p className="text-muted-foreground">Add your trade account details and discount percentages for each supplier.</p>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-primary">2. Build Your Estimate</div>
                <p className="text-muted-foreground">Use AI Vision Takeoff or manual entry to build your full materials list.</p>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-primary">3. Generate Order List</div>
                <p className="text-muted-foreground">One click generates a formatted order list with your trade pricing applied, ready to send or call in.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
