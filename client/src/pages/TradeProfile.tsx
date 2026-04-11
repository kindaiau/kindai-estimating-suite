import { useState, useEffect, useMemo } from "react";
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
  Save, ChevronLeft, Palette, Phone, Globe, MapPin, Hash, Zap,
  DollarSign, TrendingUp, Percent, AlertTriangle, BarChart3, Wrench
} from "lucide-react";

// ─── Canonical trade list (matches shared/trades.ts) ─────────────────────────
const TRADES = [
  { id: "electrical", name: "Electrical", emoji: "⚡" },
  { id: "plumbing", name: "Plumbing", emoji: "🔧" },
  { id: "carpentry", name: "Carpentry", emoji: "🪚" },
  { id: "concreting", name: "Concreting", emoji: "🏗️" },
  { id: "hvac", name: "HVAC", emoji: "❄️" },
  { id: "flooring", name: "Flooring", emoji: "🪵" },
  { id: "landscaping", name: "Landscaping", emoji: "🌿" },
  { id: "cabinetry", name: "Cabinet Making & Joinery", emoji: "🪵" },
  { id: "rendering", name: "Rendering", emoji: "🏠" },
  { id: "gas-install", name: "Gas Installation", emoji: "🔥" },
  { id: "gas-maintenance", name: "Gas Maintenance", emoji: "🔥" },
];

const EMAIL_TYPES = [
  { value: "quote_delivery", label: "Quote Delivery", desc: "Sent when you email a quote to a client", icon: "📤" },
  { value: "quote_followup", label: "Follow-Up (3 days)", desc: "Auto-sent if client hasn't viewed quote", icon: "📩" },
  { value: "quote_reminder", label: "Expiry Reminder (7 days)", desc: "Reminds client quote is expiring soon", icon: "⏰" },
  { value: "quote_accepted", label: "Acceptance Confirmation", desc: "Sent when client accepts the quote", icon: "✅" },
  { value: "supplier_order", label: "Supplier Order", desc: "Materials order sent to your supplier", icon: "📦" },
] as const;

const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"] as const;

// ─── AU Market Benchmarks (2024-25 Fair Work + industry data) ────────────────
const AU_BENCHMARKS: Record<string, {
  labourRate: { low: number; mid: number; high: number };
  markup: { low: number; mid: number; high: number };
  overhead: { low: number; mid: number; high: number };
  profit: { low: number; mid: number; high: number };
  waste: { low: number; mid: number; high: number };
}> = {
  electrical: { labourRate: { low: 42, mid: 52, high: 65 }, markup: { low: 15, mid: 25, high: 40 }, overhead: { low: 8, mid: 12, high: 18 }, profit: { low: 10, mid: 15, high: 25 }, waste: { low: 3, mid: 5, high: 8 } },
  plumbing: { labourRate: { low: 43, mid: 54, high: 68 }, markup: { low: 15, mid: 25, high: 40 }, overhead: { low: 8, mid: 12, high: 18 }, profit: { low: 10, mid: 15, high: 25 }, waste: { low: 3, mid: 5, high: 8 } },
  carpentry: { labourRate: { low: 38, mid: 48, high: 60 }, markup: { low: 15, mid: 22, high: 35 }, overhead: { low: 8, mid: 12, high: 18 }, profit: { low: 10, mid: 15, high: 22 }, waste: { low: 5, mid: 8, high: 12 } },
  concreting: { labourRate: { low: 33, mid: 42, high: 55 }, markup: { low: 12, mid: 20, high: 35 }, overhead: { low: 8, mid: 12, high: 18 }, profit: { low: 10, mid: 15, high: 22 }, waste: { low: 3, mid: 5, high: 10 } },
  hvac: { labourRate: { low: 44, mid: 55, high: 70 }, markup: { low: 18, mid: 28, high: 45 }, overhead: { low: 10, mid: 14, high: 20 }, profit: { low: 12, mid: 18, high: 28 }, waste: { low: 2, mid: 4, high: 7 } },
  flooring: { labourRate: { low: 34, mid: 42, high: 55 }, markup: { low: 15, mid: 22, high: 35 }, overhead: { low: 6, mid: 10, high: 15 }, profit: { low: 10, mid: 15, high: 22 }, waste: { low: 5, mid: 8, high: 12 } },
  landscaping: { labourRate: { low: 32, mid: 40, high: 52 }, markup: { low: 15, mid: 22, high: 35 }, overhead: { low: 6, mid: 10, high: 15 }, profit: { low: 10, mid: 15, high: 22 }, waste: { low: 3, mid: 5, high: 10 } },
  cabinetry: { labourRate: { low: 38, mid: 48, high: 62 }, markup: { low: 18, mid: 28, high: 45 }, overhead: { low: 10, mid: 14, high: 20 }, profit: { low: 12, mid: 18, high: 28 }, waste: { low: 5, mid: 8, high: 12 } },
  rendering: { labourRate: { low: 39, mid: 48, high: 60 }, markup: { low: 15, mid: 22, high: 35 }, overhead: { low: 8, mid: 12, high: 18 }, profit: { low: 10, mid: 15, high: 22 }, waste: { low: 3, mid: 5, high: 8 } },
  "gas-install": { labourRate: { low: 48, mid: 58, high: 72 }, markup: { low: 18, mid: 28, high: 42 }, overhead: { low: 10, mid: 14, high: 20 }, profit: { low: 12, mid: 18, high: 28 }, waste: { low: 3, mid: 5, high: 8 } },
  "gas-maintenance": { labourRate: { low: 48, mid: 55, high: 68 }, markup: { low: 15, mid: 25, high: 38 }, overhead: { low: 8, mid: 12, high: 18 }, profit: { low: 12, mid: 18, high: 25 }, waste: { low: 2, mid: 4, high: 6 } },
};

interface Supplier {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  accountNumber?: string;
  notes?: string;
  isPreferred?: boolean;
}

// ─── Benchmark indicator component ───────────────────────────────────────────
function BenchmarkBar({ value, benchmark, unit, label }: {
  value: number;
  benchmark: { low: number; mid: number; high: number };
  unit: string;
  label: string;
}) {
  const range = benchmark.high - benchmark.low;
  const position = range > 0 ? Math.max(0, Math.min(100, ((value - benchmark.low) / range) * 100)) : 50;
  const isBelow = value < benchmark.low;
  const isAbove = value > benchmark.high;
  const isInRange = !isBelow && !isAbove;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="font-medium" style={{
          color: isInRange ? "#10B981" : isBelow ? "#F59E0B" : "#EF4444"
        }}>
          {isBelow ? "Below market" : isAbove ? "Above market" : "In range"}
        </span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "var(--border-color)" }}>
        {/* Market range highlight */}
        <div className="absolute h-full rounded-full" style={{
          background: "linear-gradient(90deg, #F59E0B22, #10B98144, #EF444422)",
          left: "0%",
          right: "0%",
        }} />
        {/* Your position marker */}
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 shadow-sm"
          style={{
            left: `${Math.max(2, Math.min(98, position))}%`,
            transform: "translate(-50%, -50%)",
            background: isInRange ? "#10B981" : isBelow ? "#F59E0B" : "#EF4444",
            borderColor: "white",
          }}
        />
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
        <span>{unit}{benchmark.low}</span>
        <span>{unit}{benchmark.mid} (avg)</span>
        <span>{unit}{benchmark.high}</span>
      </div>
    </div>
  );
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
    // Advanced rates
    materialMarkup: 20, overheadPercent: 10, profitMargin: 15,
    defaultWasteFactor: 5, mobilisationRate: 0, contingencyPercent: 5,
    // Email
    emailFromName: "", emailFromAddress: "", emailSignature: "",
    sendQuoteAutomatically: false, followUpEnabled: true, followUpDays: 3,
    reminderEnabled: true, reminderDays: 7,
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const trade = TRADES.find(t => t.id === selectedTrade)!;
  const benchmark = AU_BENCHMARKS[selectedTrade] ?? AU_BENCHMARKS.electrical;

  // Effective total margin calculation
  const effectiveMargin = useMemo(() => {
    const matMarkup = form.materialMarkup;
    const overhead = form.overheadPercent;
    const profit = form.profitMargin;
    const contingency = form.contingencyPercent;
    // Simplified: total effective markup on a job
    return matMarkup + overhead + profit + contingency;
  }, [form.materialMarkup, form.overheadPercent, form.profitMargin, form.contingencyPercent]);

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
        materialMarkup: Number((profile as any).materialMarkup ?? 20),
        overheadPercent: Number((profile as any).overheadPercent ?? 10),
        profitMargin: Number((profile as any).profitMargin ?? 15),
        defaultWasteFactor: Number((profile as any).defaultWasteFactor ?? 5),
        mobilisationRate: Number((profile as any).mobilisationRate ?? 0),
        contingencyPercent: Number((profile as any).contingencyPercent ?? 5),
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
            <p style={{ color: "var(--text-muted)" }}>Customise branding, rates, margins, suppliers, and email automation per trade</p>
          </div>
        </div>

        {/* Trade Selector — responsive grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2 mb-8">
          {TRADES.map(t => (
            <button
              key={t.id}
              onClick={() => { setSelectedTrade(t.id); setEditingTemplate(null); }}
              className="p-2 sm:p-3 rounded-xl border-2 text-center transition-all"
              style={{
                borderColor: selectedTrade === t.id ? "var(--kindai-pink)" : "var(--border-color)",
                background: selectedTrade === t.id ? "rgba(255,45,120,0.1)" : "var(--bg-card)",
              }}
            >
              <div className="text-xl sm:text-2xl mb-1">{t.emoji}</div>
              <div className="text-[10px] sm:text-xs font-medium truncate" style={{ color: selectedTrade === t.id ? "var(--kindai-pink)" : "var(--text-secondary)" }}>
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
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="branding" className="gap-1 text-xs sm:text-sm"><Building2 className="w-4 h-4 hidden sm:block" />Business</TabsTrigger>
                <TabsTrigger value="rates" className="gap-1 text-xs sm:text-sm"><DollarSign className="w-4 h-4 hidden sm:block" />Rates & Margins</TabsTrigger>
                <TabsTrigger value="suppliers" className="gap-1 text-xs sm:text-sm"><Truck className="w-4 h-4 hidden sm:block" />Suppliers</TabsTrigger>
                <TabsTrigger value="email" className="gap-1 text-xs sm:text-sm"><Mail className="w-4 h-4 hidden sm:block" />Email</TabsTrigger>
                <TabsTrigger value="defaults" className="gap-1 text-xs sm:text-sm"><Settings className="w-4 h-4 hidden sm:block" />Quote</TabsTrigger>
              </TabsList>
            </div>

            {/* BRANDING TAB */}
            <TabsContent value="branding" className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="col-span-1 sm:col-span-2">
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

            {/* RATES & MARGINS TAB (NEW) */}
            <TabsContent value="rates" className="p-6 space-y-6">
              {/* Summary Card */}
              <div className="rounded-xl border p-4" style={{
                borderColor: "var(--kindai-pink)",
                background: "linear-gradient(135deg, rgba(255,45,120,0.08), rgba(255,107,53,0.08))"
              }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" style={{ color: "var(--kindai-pink)" }} />
                    <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Your Effective Margin</h3>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "var(--kindai-pink)" }}>
                    {effectiveMargin.toFixed(1)}%
                  </div>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Combined: Material Markup ({form.materialMarkup}%) + Overhead ({form.overheadPercent}%) + Profit ({form.profitMargin}%) + Contingency ({form.contingencyPercent}%)
                </p>
                {effectiveMargin < 30 && (
                  <div className="mt-2 flex items-center gap-2 text-xs p-2 rounded-lg" style={{ background: "rgba(245,158,11,0.15)", color: "#D97706" }}>
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Your effective margin is below 30%. Most profitable AU trade businesses target 35-55%.</span>
                  </div>
                )}
              </div>

              {/* Labour Rate */}
              <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-base)" }}>
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" style={{ color: "var(--kindai-orange)" }} />
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Labour Rate</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Default Hourly Rate</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>$</span>
                      <Input type="number" min={0} className="pl-7" value={form.defaultLabourRate}
                        onChange={e => setForm(f => ({ ...f, defaultLabourRate: Number(e.target.value) }))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>/hr</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Base rate for qualified {trade.name.toLowerCase()} worker. Manage detailed rates (overtime, Saturday, Sunday, public holiday) in the <button onClick={() => navigate("/labour")} className="underline" style={{ color: "var(--kindai-pink)" }}>Labour Rates</button> page.
                    </p>
                  </div>
                  <div>
                    <Label>Mobilisation / Travel</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>$</span>
                      <Input type="number" min={0} className="pl-7" value={form.mobilisationRate}
                        onChange={e => setForm(f => ({ ...f, mobilisationRate: Number(e.target.value) }))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>flat</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Flat fee added to every estimate for site travel/setup. Set $0 to exclude.</p>
                  </div>
                </div>
                <BenchmarkBar value={form.defaultLabourRate} benchmark={benchmark.labourRate} unit="$" label="AU market range (qualified rate)" />
              </div>

              {/* Material Markup */}
              <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-base)" }}>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" style={{ color: "#10B981" }} />
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Material Markup</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Material Markup %</Label>
                    <div className="relative mt-1">
                      <Input type="number" min={0} max={200} value={form.materialMarkup}
                        onChange={e => setForm(f => ({ ...f, materialMarkup: Number(e.target.value) }))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>%</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Applied on top of trade/wholesale material costs</p>
                  </div>
                  <div>
                    <Label>Default Waste Factor %</Label>
                    <div className="relative mt-1">
                      <Input type="number" min={0} max={50} value={form.defaultWasteFactor}
                        onChange={e => setForm(f => ({ ...f, defaultWasteFactor: Number(e.target.value) }))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>%</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Extra material ordered to cover cuts, damage, and offcuts</p>
                  </div>
                </div>
                <BenchmarkBar value={form.materialMarkup} benchmark={benchmark.markup} unit="" label="AU market material markup range" />
                <BenchmarkBar value={form.defaultWasteFactor} benchmark={benchmark.waste} unit="" label="AU market waste factor range" />
              </div>

              {/* Overhead & Profit */}
              <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-base)" }}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "#8B5CF6" }} />
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Overhead & Profit</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Overhead / Prelims %</Label>
                    <div className="relative mt-1">
                      <Input type="number" min={0} max={100} value={form.overheadPercent}
                        onChange={e => setForm(f => ({ ...f, overheadPercent: Number(e.target.value) }))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>%</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Insurance, supervision, site setup, admin</p>
                  </div>
                  <div>
                    <Label>Profit Margin %</Label>
                    <div className="relative mt-1">
                      <Input type="number" min={0} max={100} value={form.profitMargin}
                        onChange={e => setForm(f => ({ ...f, profitMargin: Number(e.target.value) }))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>%</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Your net profit target on each job</p>
                  </div>
                  <div>
                    <Label>Contingency %</Label>
                    <div className="relative mt-1">
                      <Input type="number" min={0} max={50} value={form.contingencyPercent}
                        onChange={e => setForm(f => ({ ...f, contingencyPercent: Number(e.target.value) }))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>%</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Buffer for unknowns and scope creep</p>
                  </div>
                </div>
                <BenchmarkBar value={form.overheadPercent} benchmark={benchmark.overhead} unit="" label="AU market overhead range" />
                <BenchmarkBar value={form.profitMargin} benchmark={benchmark.profit} unit="" label="AU market profit margin range" />
              </div>

              {/* Example Calculation */}
              <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-base)" }}>
                <h4 className="font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Example: $10,000 Job Breakdown</h4>
                <div className="space-y-1.5 text-sm">
                  {[
                    { label: "Materials (trade cost)", value: 4000, color: "var(--text-secondary)" },
                    { label: `Material Markup (${form.materialMarkup}%)`, value: 4000 * (form.materialMarkup / 100), color: "#10B981" },
                    { label: `Waste Factor (${form.defaultWasteFactor}%)`, value: 4000 * (form.defaultWasteFactor / 100), color: "#F59E0B" },
                    { label: "Labour (base)", value: 3500, color: "var(--text-secondary)" },
                    { label: `Overhead (${form.overheadPercent}%)`, value: 7500 * (form.overheadPercent / 100), color: "#8B5CF6" },
                    { label: `Profit (${form.profitMargin}%)`, value: 7500 * (form.profitMargin / 100), color: "#EC4899" },
                    { label: `Contingency (${form.contingencyPercent}%)`, value: 7500 * (form.contingencyPercent / 100), color: "#6366F1" },
                    { label: "Mobilisation", value: form.mobilisationRate, color: "#0EA5E9" },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between">
                      <span style={{ color: row.color }}>{row.label}</span>
                      <span className="font-mono font-medium" style={{ color: row.color }}>${row.value.toFixed(0)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold" style={{ borderColor: "var(--border-color)" }}>
                    <span style={{ color: "var(--text-primary)" }}>Subtotal (ex GST)</span>
                    <span style={{ color: "var(--kindai-pink)" }}>
                      ${(4000 + 4000 * (form.materialMarkup / 100) + 4000 * (form.defaultWasteFactor / 100) + 3500 + 7500 * (form.overheadPercent / 100) + 7500 * (form.profitMargin / 100) + 7500 * (form.contingencyPercent / 100) + form.mobilisationRate).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>GST (10%)</span>
                    <span>
                      +${((4000 + 4000 * (form.materialMarkup / 100) + 4000 * (form.defaultWasteFactor / 100) + 3500 + 7500 * (form.overheadPercent / 100) + 7500 * (form.profitMargin / 100) + 7500 * (form.contingencyPercent / 100) + form.mobilisationRate) * 0.1).toFixed(0)}
                    </span>
                  </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="col-span-1 sm:col-span-2">
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

            {/* QUOTE DEFAULTS TAB */}
            <TabsContent value="defaults" className="p-6 space-y-4">
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Quote Defaults for {trade.name}</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>These values pre-fill every new estimate for this trade</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Default Overall Markup %</Label>
                  <div className="relative mt-1">
                    <Input type="number" min={0} max={200} value={form.defaultMarkup}
                      onChange={e => setForm(f => ({ ...f, defaultMarkup: Number(e.target.value) }))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>%</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Legacy overall markup (used if advanced rates not set)</p>
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
