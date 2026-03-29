import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Building2, Mail, Truck, Settings, Plus, Trash2, Eye, Wand2,
  Save, ChevronLeft, Palette, Phone, Globe, MapPin, Hash, Zap
} from "lucide-react";

const TRADES = [
  { id: "electrical", name: "Electrical", emoji: "⚡" },
  { id: "plumbing", name: "Plumbing", emoji: "🔧" },
  { id: "carpentry", name: "Carpentry", emoji: "🪚" },
  { id: "concreting", name: "Concreting", emoji: "🏗️" },
  { id: "hvac", name: "HVAC", emoji: "❄️" },
  { id: "flooring", name: "Flooring", emoji: "🪵" },
  { id: "landscaping", name: "Landscaping", emoji: "🌿" },
  { id: "cabinetry", name: "Cabinetry", emoji: "🗄️" },
  { id: "rendering", name: "Rendering", emoji: "🏠" },
  { id: "cabinet_making", name: "Cabinet Making", emoji: "🔨" },
];

const EMAIL_TYPES = [
  { value: "quote_delivery", label: "Quote Delivery", desc: "Sent when you email a quote to a client", icon: "📤" },
  { value: "quote_followup", label: "Follow-Up (3 days)", desc: "Auto-sent if client hasn't viewed quote", icon: "📩" },
  { value: "quote_reminder", label: "Expiry Reminder (7 days)", desc: "Reminds client quote is expiring soon", icon: "⏰" },
  { value: "quote_accepted", label: "Acceptance Confirmation", desc: "Sent when client accepts the quote", icon: "✅" },
  { value: "supplier_order", label: "Supplier Order", desc: "Materials order sent to your supplier", icon: "📦" },
] as const;

const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"] as const;

interface Supplier {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  accountNumber?: string;
  notes?: string;
  isPreferred?: boolean;
}

export default function TradeProfile() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTrade, setSelectedTrade] = useState("electrical");
  const [activeTab, setActiveTab] = useState("branding");
  const [emailType, setEmailType] = useState<string>("quote_delivery");
  const [previewMode, setPreviewMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{ subject: string; bodyHtml: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    businessName: "", abn: "", licenseNumber: "", phone: "", email: "",
    website: "", address: "", brandColour: "#FF2D78",
    defaultMarkup: 20, defaultLabourRate: 95, defaultValidDays: 30,
    defaultTerms: "Payment due within 14 days of invoice. All work guaranteed for 12 months.",
    defaultState: "NSW" as typeof STATES[number],
    emailFromName: "", emailFromAddress: "", emailSignature: "",
    sendQuoteAutomatically: false, followUpEnabled: true, followUpDays: 3,
    reminderEnabled: true, reminderDays: 7,
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const trade = TRADES.find(t => t.id === selectedTrade)!;

  // Load profile when trade changes
  const { data: profile } = trpc.tradeProfiles.get.useQuery(
    { trade: selectedTrade },
    { enabled: isAuthenticated }
  );

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName ?? "",
        abn: profile.abn ?? "",
        licenseNumber: profile.licenseNumber ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        website: profile.website ?? "",
        address: profile.address ?? "",
        brandColour: profile.brandColour ?? "#FF2D78",
        defaultMarkup: Number(profile.defaultMarkup ?? 20),
        defaultLabourRate: Number(profile.defaultLabourRate ?? 95),
        defaultValidDays: profile.defaultValidDays ?? 30,
        defaultTerms: profile.defaultTerms ?? "Payment due within 14 days of invoice.",
        defaultState: (profile.defaultState as typeof STATES[number]) ?? "NSW",
        emailFromName: profile.emailFromName ?? "",
        emailFromAddress: profile.emailFromAddress ?? "",
        emailSignature: profile.emailSignature ?? "",
        sendQuoteAutomatically: profile.sendQuoteAutomatically ?? false,
        followUpEnabled: profile.followUpEnabled ?? true,
        followUpDays: profile.followUpDays ?? 3,
        reminderEnabled: profile.reminderEnabled ?? true,
        reminderDays: profile.reminderDays ?? 7,
      });
      setSuppliers((profile.suppliers as Supplier[]) ?? []);
    }
  }, [profile]);

  // Load email templates
  const { data: templates, refetch: refetchTemplates } = trpc.tradeProfiles.getEmailTemplates.useQuery(
    { trade: selectedTrade },
    { enabled: isAuthenticated }
  );

  const { data: defaultTemplate } = trpc.tradeProfiles.getDefaultTemplate.useQuery(
    { type: emailType as any, trade: selectedTrade },
    { enabled: isAuthenticated }
  );

  const { data: preview } = trpc.tradeProfiles.previewEmail.useQuery(
    {
      bodyHtml: editingTemplate?.bodyHtml ?? defaultTemplate?.bodyHtml ?? "",
      subject: editingTemplate?.subject ?? defaultTemplate?.subject ?? "",
      trade: selectedTrade,
    },
    { enabled: previewMode && !!(editingTemplate ?? defaultTemplate) }
  );

  const upsert = trpc.tradeProfiles.upsert.useMutation({
    onSuccess: () => toast.success("Trade profile saved!"),
    onError: (e) => toast.error(e.message),
  });

  const upsertTemplate = trpc.tradeProfiles.upsertEmailTemplate.useMutation({
    onSuccess: () => {
      toast.success("Email template saved!");
      setEditingTemplate(null);
      refetchTemplates();
    },
    onError: (e) => toast.error(e.message),
  });

  const generateTemplate = trpc.tradeProfiles.generateEmailTemplate.useMutation({
    onSuccess: (data) => {
      setEditingTemplate(data);
      toast.success("AI-generated template ready! Review and save it.");
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent" style={{ borderTopColor: "var(--kindai-pink)" }} />
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: "var(--text-muted)" }}>Sign in to manage trade profiles</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="kindai-btn-primary">Sign In</Button>
        </div>
      </div>
    );
  }

  function handleSaveProfile() {
    upsert.mutate({
      trade: selectedTrade,
      ...form,
      suppliers,
    });
  }

  function addSupplier() {
    setSuppliers(prev => [...prev, { name: "", contactName: "", email: "", phone: "", accountNumber: "" }]);
  }

  function updateSupplier(idx: number, field: keyof Supplier, value: string | boolean) {
    setSuppliers(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  function removeSupplier(idx: number) {
    setSuppliers(prev => prev.filter((_, i) => i !== idx));
  }

  const currentTemplate = templates?.find(t => t.type === emailType);
  const displayTemplate = editingTemplate ?? (currentTemplate ? { subject: currentTemplate.subject, bodyHtml: currentTemplate.bodyHtml } : defaultTemplate);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Trade Profiles</h1>
            <p style={{ color: "var(--text-muted)" }}>Customise branding, suppliers, and email automation per trade</p>
          </div>
        </div>

        {/* Trade Selector */}
        <div className="grid grid-cols-5 gap-2 mb-8">
          {TRADES.map(t => (
            <button
              key={t.id}
              onClick={() => { setSelectedTrade(t.id); setEditingTemplate(null); }}
              className="p-3 rounded-xl border-2 text-center transition-all"
              style={{
                borderColor: selectedTrade === t.id ? "var(--kindai-pink)" : "var(--border-color)",
                background: selectedTrade === t.id ? "rgba(255,45,120,0.1)" : "var(--bg-card)",
              }}
            >
              <div className="text-2xl mb-1">{t.emoji}</div>
              <div className="text-xs font-medium truncate" style={{ color: selectedTrade === t.id ? "var(--kindai-pink)" : "var(--text-secondary)" }}>
                {t.name}
              </div>
            </button>
          ))}
        </div>

        {/* Trade Profile Card */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}>
          {/* Card Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border-color)", background: "rgba(255,45,120,0.05)" }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{trade.emoji}</span>
              <div>
                <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>{trade.name} Profile</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Settings apply to all {trade.name.toLowerCase()} estimates</p>
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={upsert.isPending} className="kindai-btn-primary gap-2">
              <Save className="w-4 h-4" />
              {upsert.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 pt-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="branding" className="gap-2"><Building2 className="w-4 h-4" />Business</TabsTrigger>
                <TabsTrigger value="suppliers" className="gap-2"><Truck className="w-4 h-4" />Suppliers</TabsTrigger>
                <TabsTrigger value="email" className="gap-2"><Mail className="w-4 h-4" />Email</TabsTrigger>
                <TabsTrigger value="defaults" className="gap-2"><Settings className="w-4 h-4" />Defaults</TabsTrigger>
              </TabsList>
            </div>

            {/* BRANDING TAB */}
            <TabsContent value="branding" className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Business Name</Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <Input className="pl-9" placeholder="e.g. Smith Electrical Pty Ltd" value={form.businessName}
                      onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>ABN</Label>
                  <div className="relative mt-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <Input className="pl-9" placeholder="12 345 678 901" value={form.abn}
                      onChange={e => setForm(f => ({ ...f, abn: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Licence Number</Label>
                  <Input placeholder="e.g. EC12345" value={form.licenseNumber}
                    onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <Input className="pl-9" placeholder="0400 000 000" value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="info@yourbusiness.com.au" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <Label>Website</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <Input className="pl-9" placeholder="www.yourbusiness.com.au" value={form.website}
                      onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Business Address</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <Input className="pl-9" placeholder="123 Main Street, Sydney NSW 2000" value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Brand Colour</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="color" value={form.brandColour}
                      onChange={e => setForm(f => ({ ...f, brandColour: e.target.value }))}
                      className="w-12 h-10 rounded-lg border cursor-pointer" style={{ borderColor: "var(--border-color)" }} />
                    <Input value={form.brandColour} onChange={e => setForm(f => ({ ...f, brandColour: e.target.value }))}
                      placeholder="#FF2D78" className="font-mono" />
                    <Palette className="w-5 h-5" style={{ color: form.brandColour }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Used on your branded quote PDFs and emails</p>
                </div>
                <div>
                  <Label>Default State</Label>
                  <Select value={form.defaultState} onValueChange={v => setForm(f => ({ ...f, defaultState: v as any }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* SUPPLIERS TAB */}
            <TabsContent value="suppliers" className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Supplier Connections</h3>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Add your preferred suppliers — materials orders are sent directly to these contacts</p>
                </div>
                <Button onClick={addSupplier} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Supplier
                </Button>
              </div>

              {suppliers.length === 0 && (
                <div className="text-center py-12 rounded-xl border-2 border-dashed" style={{ borderColor: "var(--border-color)" }}>
                  <Truck className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                  <p className="font-medium" style={{ color: "var(--text-secondary)" }}>No suppliers added yet</p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add your preferred {trade.name.toLowerCase()} suppliers to auto-send materials orders</p>
                  <Button onClick={addSupplier} className="mt-4 kindai-btn-primary gap-2">
                    <Plus className="w-4 h-4" /> Add First Supplier
                  </Button>
                </div>
              )}

              {suppliers.map((supplier, idx) => (
                <div key={idx} className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border-color)", background: "var(--bg-base)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏭</span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {supplier.name || `Supplier ${idx + 1}`}
                      </span>
                      {supplier.isPreferred && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,45,120,0.1)", color: "var(--kindai-pink)" }}>
                          Preferred
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={supplier.isPreferred ?? false}
                          onCheckedChange={v => updateSupplier(idx, "isPreferred", v)} />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Preferred</span>
                      </div>
                      <button onClick={() => removeSupplier(idx)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Supplier Name *</Label>
                      <Input className="mt-1" placeholder="e.g. Middy's Electrical" value={supplier.name}
                        onChange={e => updateSupplier(idx, "name", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Contact Name</Label>
                      <Input className="mt-1" placeholder="e.g. Dave Johnson" value={supplier.contactName ?? ""}
                        onChange={e => updateSupplier(idx, "contactName", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Email (for orders)</Label>
                      <Input className="mt-1" type="email" placeholder="orders@supplier.com.au" value={supplier.email ?? ""}
                        onChange={e => updateSupplier(idx, "email", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input className="mt-1" placeholder="1300 000 000" value={supplier.phone ?? ""}
                        onChange={e => updateSupplier(idx, "phone", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Your Account Number</Label>
                      <Input className="mt-1" placeholder="ACC-12345" value={supplier.accountNumber ?? ""}
                        onChange={e => updateSupplier(idx, "accountNumber", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Input className="mt-1" placeholder="e.g. Trade account, 30 day terms" value={supplier.notes ?? ""}
                        onChange={e => updateSupplier(idx, "notes", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* EMAIL AUTOMATION TAB */}
            <TabsContent value="email" className="p-6 space-y-6">
              {/* Email From Settings */}
              <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-base)" }}>
                <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Mail className="w-4 h-4" style={{ color: "var(--kindai-pink)" }} />
                  Sender Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From Name</Label>
                    <Input className="mt-1" placeholder="Dave Smith — Smith Electrical" value={form.emailFromName}
                      onChange={e => setForm(f => ({ ...f, emailFromName: e.target.value }))} />
                  </div>
                  <div>
                    <Label>From Email</Label>
                    <Input className="mt-1" type="email" placeholder="quotes@smithelectrical.com.au" value={form.emailFromAddress}
                      onChange={e => setForm(f => ({ ...f, emailFromAddress: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Email Signature</Label>
                    <Textarea className="mt-1" rows={2} placeholder="Licensed & Insured | All work guaranteed for 12 months" value={form.emailSignature}
                      onChange={e => setForm(f => ({ ...f, emailSignature: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-base)" }}>
                <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Zap className="w-4 h-4" style={{ color: "var(--kindai-orange)" }} />
                  Automation Settings
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg-card)" }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Auto-send quote on creation</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Automatically email quote to client when you click "Generate Quote"</p>
                    </div>
                    <Switch checked={form.sendQuoteAutomatically} onCheckedChange={v => setForm(f => ({ ...f, sendQuoteAutomatically: v }))} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg-card)" }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Follow-up email</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Send follow-up if client hasn't responded after
                        <input type="number" min={1} max={14} value={form.followUpDays}
                          onChange={e => setForm(f => ({ ...f, followUpDays: Number(e.target.value) }))}
                          className="inline-block w-10 mx-1 px-1 text-center rounded border text-xs"
                          style={{ borderColor: "var(--border-color)", background: "var(--bg-base)", color: "var(--text-primary)" }} />
                        days
                      </p>
                    </div>
                    <Switch checked={form.followUpEnabled} onCheckedChange={v => setForm(f => ({ ...f, followUpEnabled: v }))} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg-card)" }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Expiry reminder</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Remind client quote expires after
                        <input type="number" min={1} max={30} value={form.reminderDays}
                          onChange={e => setForm(f => ({ ...f, reminderDays: Number(e.target.value) }))}
                          className="inline-block w-10 mx-1 px-1 text-center rounded border text-xs"
                          style={{ borderColor: "var(--border-color)", background: "var(--bg-base)", color: "var(--text-primary)" }} />
                        days
                      </p>
                    </div>
                    <Switch checked={form.reminderEnabled} onCheckedChange={v => setForm(f => ({ ...f, reminderEnabled: v }))} />
                  </div>
                </div>
              </div>

              {/* Email Template Editor */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border-color)", background: "rgba(255,45,120,0.05)" }}>
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Email Templates</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)} className="gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {previewMode ? "Edit" : "Preview"}
                    </Button>
                    <Button variant="outline" size="sm" disabled={generateTemplate.isPending}
                      onClick={() => generateTemplate.mutate({ type: emailType as any, trade: selectedTrade, businessName: form.businessName, tone: "friendly" })}
                      className="gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      {generateTemplate.isPending ? "Generating..." : "AI Generate"}
                    </Button>
                  </div>
                </div>

                {/* Template Type Selector */}
                <div className="p-4 border-b grid grid-cols-5 gap-2" style={{ borderColor: "var(--border-color)", background: "var(--bg-base)" }}>
                  {EMAIL_TYPES.map(et => (
                    <button key={et.value} onClick={() => { setEmailType(et.value); setEditingTemplate(null); setPreviewMode(false); }}
                      className="p-2 rounded-lg text-center transition-all border"
                      style={{
                        borderColor: emailType === et.value ? "var(--kindai-pink)" : "var(--border-color)",
                        background: emailType === et.value ? "rgba(255,45,120,0.1)" : "var(--bg-card)",
                      }}>
                      <div className="text-lg mb-1">{et.icon}</div>
                      <div className="text-xs font-medium leading-tight" style={{ color: emailType === et.value ? "var(--kindai-pink)" : "var(--text-secondary)" }}>
                        {et.label}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {previewMode && preview ? (
                    <div>
                      <div className="mb-3 p-3 rounded-lg" style={{ background: "var(--bg-base)", border: "1px solid var(--border-color)" }}>
                        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Subject: </span>
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{preview.renderedSubject}</span>
                      </div>
                      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border-color)" }}>
                        <iframe srcDoc={preview.renderedHtml} className="w-full" style={{ height: "500px", border: "none" }} title="Email Preview" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label>Subject Line</Label>
                        <Input className="mt-1 font-mono text-sm"
                          value={editingTemplate?.subject ?? defaultTemplate?.subject ?? ""}
                          onChange={e => setEditingTemplate(prev => ({ ...prev ?? defaultTemplate ?? { subject: "", bodyHtml: "" }, subject: e.target.value }))}
                          placeholder="Email subject with {{variables}}" />
                      </div>
                      <div>
                        <Label>Email Body (HTML)</Label>
                        <Textarea className="mt-1 font-mono text-xs" rows={16}
                          value={editingTemplate?.bodyHtml ?? defaultTemplate?.bodyHtml ?? ""}
                          onChange={e => setEditingTemplate(prev => ({ ...prev ?? defaultTemplate ?? { subject: "", bodyHtml: "" }, bodyHtml: e.target.value }))}
                          placeholder="HTML email template with {{variables}}" />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Variables: {"{{clientName}}, {{businessName}}, {{quoteNumber}}, {{totalAmount}}, {{phone}}, {{acceptanceUrl}}, {{validUntil}}"}
                        </p>
                        <Button onClick={() => {
                          const template = editingTemplate ?? defaultTemplate;
                          if (!template) return;
                          upsertTemplate.mutate({
                            id: currentTemplate?.id,
                            trade: selectedTrade,
                            type: emailType as any,
                            subject: template.subject,
                            bodyHtml: template.bodyHtml,
                          });
                        }} disabled={upsertTemplate.isPending} className="kindai-btn-primary gap-2">
                          <Save className="w-4 h-4" />
                          {upsertTemplate.isPending ? "Saving..." : "Save Template"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* DEFAULTS TAB */}
            <TabsContent value="defaults" className="p-6 space-y-4">
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Quote Defaults for {trade.name}</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>These values pre-fill every new estimate for this trade</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Default Markup %</Label>
                  <div className="relative mt-1">
                    <Input type="number" min={0} max={200} value={form.defaultMarkup}
                      onChange={e => setForm(f => ({ ...f, defaultMarkup: Number(e.target.value) }))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>%</span>
                  </div>
                </div>
                <div>
                  <Label>Default Labour Rate</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>$</span>
                    <Input type="number" min={0} className="pl-7" value={form.defaultLabourRate}
                      onChange={e => setForm(f => ({ ...f, defaultLabourRate: Number(e.target.value) }))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>/hr</span>
                  </div>
                </div>
                <div>
                  <Label>Quote Valid Days</Label>
                  <div className="relative mt-1">
                    <Input type="number" min={1} max={365} value={form.defaultValidDays}
                      onChange={e => setForm(f => ({ ...f, defaultValidDays: Number(e.target.value) }))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>days</span>
                  </div>
                </div>
              </div>
              <div>
                <Label>Default Quote Terms & Conditions</Label>
                <Textarea className="mt-1" rows={4} value={form.defaultTerms}
                  onChange={e => setForm(f => ({ ...f, defaultTerms: e.target.value }))}
                  placeholder="Payment due within 14 days of invoice. All work guaranteed for 12 months..." />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
