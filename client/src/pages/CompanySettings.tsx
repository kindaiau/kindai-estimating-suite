import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Brain, Package, Link2, Plus, Trash2, Upload, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
const QUOTE_TONES = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "detailed", label: "Detailed" },
  { id: "concise", label: "Concise" },
];
const CATEGORIES = ["Materials", "Labour", "Plant", "Subcontract", "Other"];

export default function CompanySettings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // ── Company Profile ──
  const { data: profile, isLoading: profileLoading } = trpc.companyMemory.getProfile.useQuery();
  const upsertProfile = trpc.companyMemory.upsertProfile.useMutation({
    onSuccess: () => { toast.success("Company profile saved"); utils.companyMemory.getProfile.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [profileForm, setProfileForm] = useState({
    businessName: "", abn: "", acn: "", phone: "", email: "", website: "",
    address: "", suburb: "", state: "", postcode: "",
    defaultExclusions: "", defaultInclusions: "", quoteTone: "professional" as string,
    paymentTerms: "", warrantyTerms: "", insuranceDetails: "",
    aiInstructions: "", preferredSuppliers: [] as string[],
  });
  const [newSupplier, setNewSupplier] = useState("");

  useEffect(() => {
    if (profile) {
      setProfileForm({
        businessName: profile.businessName ?? "",
        abn: profile.abn ?? "",
        acn: profile.acn ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        website: profile.website ?? "",
        address: profile.address ?? "",
        suburb: profile.suburb ?? "",
        state: profile.state ?? "",
        postcode: profile.postcode ?? "",
        defaultExclusions: profile.defaultExclusions ?? "",
        defaultInclusions: profile.defaultInclusions ?? "",
        quoteTone: profile.quoteTone ?? "professional",
        paymentTerms: profile.paymentTerms ?? "",
        warrantyTerms: profile.warrantyTerms ?? "",
        insuranceDetails: profile.insuranceDetails ?? "",
        aiInstructions: profile.aiInstructions ?? "",
        preferredSuppliers: (profile.preferredSuppliers as string[] | null) ?? [],
      });
    }
  }, [profile]);

  // ── Price Book ──
  const { data: priceBookItems = [], isLoading: priceBookLoading } = trpc.companyMemory.listPriceBook.useQuery({ trade: undefined });
  const addPriceBookItem = trpc.companyMemory.addPriceBookItem.useMutation({
    onSuccess: () => { toast.success("Item added"); utils.companyMemory.listPriceBook.invalidate(); setShowAddItem(false); resetItemForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deletePriceBookItem = trpc.companyMemory.deletePriceBookItem.useMutation({
    onSuccess: () => { toast.success("Item removed"); utils.companyMemory.listPriceBook.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({
    category: "Materials", name: "", unit: "ea", unitPrice: "", supplierName: "", description: "", itemCode: "", trade: "",
  });
  const resetItemForm = () => setItemForm({ category: "Materials", name: "", unit: "ea", unitPrice: "", supplierName: "", description: "", itemCode: "", trade: "" });

  // ── Xero ──
  const { data: xeroStatus } = trpc.xero.getStatus.useQuery();
  const getXeroAuth = trpc.xero.getAuthUrl.useMutation({
    onSuccess: (data) => { window.open(data.url, "_blank"); toast.info("Redirecting to Xero..."); },
    onError: (e) => toast.error(e.message),
  });
  const disconnectXero = trpc.xero.disconnect.useMutation({
    onSuccess: () => { toast.success("Xero disconnected"); utils.xero.getStatus.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // Check URL params for Xero callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("xero") === "success") {
      toast.success(`Xero connected — ${params.get("org") || "Organisation"}`);
      utils.xero.getStatus.invalidate();
      window.history.replaceState({}, "", "/settings");
    } else if (params.get("xero") === "error") {
      toast.error(`Xero connection failed: ${params.get("msg") || "Unknown error"}`);
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  return (
    <AppLayout title="Company Settings">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-orange-500" /> Company Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your company memory — the AI uses this to personalise every estimate
          </p>
        </div>

        {/* ── AI Instructions ── */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              AI Instructions
              <Badge variant="secondary" className="ml-auto text-[10px]">Highest Priority</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5">
            <div>
              <Label className="text-xs font-bold">Custom AI Instructions</Label>
              <Textarea
                placeholder='e.g. "Always include mobilisation as a separate line item. Use Clipsal products for all GPOs. Add 15% waste to all copper pipe."'
                value={profileForm.aiInstructions}
                onChange={(e) => setProfileForm(p => ({ ...p, aiInstructions: e.target.value }))}
                className="mt-1 min-h-[100px] text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                These instructions are injected into every AI takeoff. Be specific — the AI follows them exactly.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Standard Inclusions</Label>
                <Textarea
                  placeholder="All materials, labour, GST, clean-up"
                  value={profileForm.defaultInclusions}
                  onChange={(e) => setProfileForm(p => ({ ...p, defaultInclusions: e.target.value }))}
                  className="mt-1 min-h-[60px] text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Standard Exclusions</Label>
                <Textarea
                  placeholder="Asbestos removal, scaffolding, council permits"
                  value={profileForm.defaultExclusions}
                  onChange={(e) => setProfileForm(p => ({ ...p, defaultExclusions: e.target.value }))}
                  className="mt-1 min-h-[60px] text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">Preferred Suppliers</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profileForm.preferredSuppliers.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1">
                    {s}
                    <button onClick={() => setProfileForm(p => ({ ...p, preferredSuppliers: p.preferredSuppliers.filter((_, j) => j !== i) }))} className="hover:text-red-500">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <div className="flex gap-1">
                  <Input
                    placeholder="Add supplier..."
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSupplier.trim()) {
                        setProfileForm(p => ({ ...p, preferredSuppliers: [...p.preferredSuppliers, newSupplier.trim()] }));
                        setNewSupplier("");
                      }
                    }}
                    className="h-7 text-xs w-32"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">Quote Tone</Label>
              <Select value={profileForm.quoteTone} onValueChange={(v) => setProfileForm(p => ({ ...p, quoteTone: v }))}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUOTE_TONES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Business Details ── */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Business Name</Label>
                <Input value={profileForm.businessName} onChange={(e) => setProfileForm(p => ({ ...p, businessName: e.target.value }))} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-bold">ABN</Label>
                <Input value={profileForm.abn} onChange={(e) => setProfileForm(p => ({ ...p, abn: e.target.value }))} className="mt-1 h-9 text-sm" placeholder="XX XXX XXX XXX" />
              </div>
              <div>
                <Label className="text-xs font-bold">Phone</Label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-bold">Email</Label>
                <Input value={profileForm.email} onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-bold">Website</Label>
                <Input value={profileForm.website} onChange={(e) => setProfileForm(p => ({ ...p, website: e.target.value }))} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-bold">State</Label>
                <Select value={profileForm.state} onValueChange={(v) => setProfileForm(p => ({ ...p, state: v }))}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {AU_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">Address</Label>
              <Input value={profileForm.address} onChange={(e) => setProfileForm(p => ({ ...p, address: e.target.value }))} className="mt-1 h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Suburb</Label>
                <Input value={profileForm.suburb} onChange={(e) => setProfileForm(p => ({ ...p, suburb: e.target.value }))} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-bold">Postcode</Label>
                <Input value={profileForm.postcode} onChange={(e) => setProfileForm(p => ({ ...p, postcode: e.target.value }))} className="mt-1 h-9 text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Quote Defaults ── */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              Quote Defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5">
            <div>
              <Label className="text-xs font-bold">Payment Terms</Label>
              <Input value={profileForm.paymentTerms} onChange={(e) => setProfileForm(p => ({ ...p, paymentTerms: e.target.value }))} className="mt-1 h-9 text-sm" placeholder="Payment within 14 days of invoice" />
            </div>
            <div>
              <Label className="text-xs font-bold">Warranty Terms</Label>
              <Textarea value={profileForm.warrantyTerms} onChange={(e) => setProfileForm(p => ({ ...p, warrantyTerms: e.target.value }))} className="mt-1 min-h-[60px] text-sm" placeholder="12 months defects liability period..." />
            </div>
            <div>
              <Label className="text-xs font-bold">Insurance Details</Label>
              <Textarea value={profileForm.insuranceDetails} onChange={(e) => setProfileForm(p => ({ ...p, insuranceDetails: e.target.value }))} className="mt-1 min-h-[60px] text-sm" placeholder="Public liability: $20M, Workers comp: ..." />
            </div>
          </CardContent>
        </Card>

        {/* Save Profile Button */}
        <Button
          className="w-full h-11 font-bold rounded-xl"
          onClick={() => upsertProfile.mutate(profileForm as any)}
          disabled={upsertProfile.isPending}
        >
          {upsertProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Company Profile
        </Button>

        {/* ── Price Book ── */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              Price Book
              <Badge variant="secondary" className="ml-auto text-[10px]">{priceBookItems.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-[11px] text-muted-foreground mb-3">
              Your negotiated supplier prices. The AI uses these instead of market estimates when matching items.
            </p>

            {priceBookItems.length > 0 && (
              <div className="space-y-1.5 mb-3 max-h-[300px] overflow-y-auto">
                {priceBookItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {item.category} · ${item.unitPrice}/{item.unit}
                        {item.supplierName && ` · ${item.supplierName}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                      onClick={() => deletePriceBookItem.mutate({ id: item.id })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showAddItem ? (
              <div className="space-y-2 p-3 rounded-xl border bg-background">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] font-bold">Item Name *</Label>
                    <Input value={itemForm.name} onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-xs mt-0.5" placeholder="20mm copper pipe" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold">Category</Label>
                    <Select value={itemForm.category} onValueChange={(v) => setItemForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold">Unit Price ($) *</Label>
                    <Input type="number" step="0.01" value={itemForm.unitPrice} onChange={(e) => setItemForm(f => ({ ...f, unitPrice: e.target.value }))} className="h-8 text-xs mt-0.5" placeholder="12.50" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold">Unit *</Label>
                    <Input value={itemForm.unit} onChange={(e) => setItemForm(f => ({ ...f, unit: e.target.value }))} className="h-8 text-xs mt-0.5" placeholder="lm, ea, m²" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold">Supplier</Label>
                    <Input value={itemForm.supplierName} onChange={(e) => setItemForm(f => ({ ...f, supplierName: e.target.value }))} className="h-8 text-xs mt-0.5" placeholder="Reece, Bunnings..." />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold">Item Code</Label>
                    <Input value={itemForm.itemCode} onChange={(e) => setItemForm(f => ({ ...f, itemCode: e.target.value }))} className="h-8 text-xs mt-0.5" placeholder="SKU or code" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-8 text-xs font-bold"
                    onClick={() => {
                      if (!itemForm.name || !itemForm.unitPrice || !itemForm.unit) {
                        toast.error("Name, price, and unit are required");
                        return;
                      }
                      addPriceBookItem.mutate({
                        ...itemForm,
                        unitPrice: parseFloat(itemForm.unitPrice),
                      });
                    }}
                    disabled={addPriceBookItem.isPending}
                  >
                    {addPriceBookItem.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Add Item
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setShowAddItem(false); resetItemForm(); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-1" onClick={() => setShowAddItem(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Price Book Item
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── Xero Integration ── */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-white" />
              </div>
              Xero Integration
              {xeroStatus?.connected ? (
                <Badge className="ml-auto bg-green-100 text-green-700 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-auto text-[10px]">Not Connected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {xeroStatus?.connected ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connected to Xero. You can now push estimates as invoices directly.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold text-red-600 hover:text-red-700"
                  onClick={() => disconnectXero.mutate()}
                  disabled={disconnectXero.isPending}
                >
                  Disconnect Xero
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect your Xero account to push estimates as draft invoices with one click.
                </p>
                <Button
                  size="sm"
                  className="h-9 text-xs font-bold gap-1.5 bg-[#13B5EA] hover:bg-[#0fa0d0]"
                  onClick={() => getXeroAuth.mutate({ origin: window.location.origin })}
                  disabled={getXeroAuth.isPending}
                >
                  {getXeroAuth.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  Connect to Xero
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
