import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, User, Building2, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
const TRADES = [
  { id: "electrical", name: "Electrical", emoji: "⚡" }, { id: "plumbing", name: "Plumbing", emoji: "🔧" },
  { id: "carpentry", name: "Carpentry", emoji: "🪚" }, { id: "concreting", name: "Concreting", emoji: "🏗️" },
  { id: "hvac", name: "HVAC", emoji: "❄️" }, { id: "flooring", name: "Flooring", emoji: "🟫" },
  { id: "landscaping", name: "Landscaping", emoji: "🌿" }, { id: "cabinetry", name: "Cabinetry", emoji: "🚪" },
  { id: "rendering", name: "Rendering & Plastering", emoji: "🧱" }, { id: "cabinet-making", name: "Cabinet Making", emoji: "🪵" },
];

export default function Profile() {
  const { user } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery();
  const [form, setForm] = useState({
    companyName: "", abn: "", phone: "", state: "", licenseNumber: "", defaultTrade: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: (profile as any).companyName ?? "",
        abn: (profile as any).abn ?? "",
        phone: (profile as any).phone ?? "",
        state: (profile as any).state ?? "",
        licenseNumber: (profile as any).licenseNumber ?? "",
        defaultTrade: (profile as any).defaultTrade ?? "",
      });
    }
  }, [profile]);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => toast.success("Profile updated"),
    onError: (e) => toast.error(e.message),
  });

  return (
    <AppLayout title="Profile & Settings">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-500" /> Profile & Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your business details and preferences</p>
        </div>

        {/* Account Info */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground font-bold mb-1">Name</div>
                <div className="text-sm font-bold text-foreground">{user?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-bold mb-1">Email</div>
                <div className="text-sm font-bold text-foreground">{user?.email ?? "—"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-bold">Company / Business Name</Label>
                <Input placeholder="Your Business Pty Ltd" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">ABN</Label>
                <Input placeholder="12 345 678 901" value={form.abn} onChange={e => setForm(f => ({ ...f, abn: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Phone</Label>
                <Input placeholder="0400 000 000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">State / Territory</Label>
                <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select state..." /></SelectTrigger>
                  <SelectContent>{AU_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Default Trade</Label>
                <Select value={form.defaultTrade} onValueChange={v => setForm(f => ({ ...f, defaultTrade: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select trade..." /></SelectTrigger>
                  <SelectContent>{TRADES.map(t => <SelectItem key={t.id} value={t.id}><span className="flex items-center gap-2">{t.emoji} {t.name}</span></SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Licensing */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              Licensing
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Licence Number</Label>
              <Input placeholder="e.g. EC12345 / QBCC 1234567" value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} className="rounded-xl" />
              <p className="text-xs text-muted-foreground">This will appear on your quotes and estimates</p>
            </div>
          </CardContent>
        </Card>

        <Button
          className="kindai-btn-primary rounded-full px-8 font-bold"
          onClick={() => updateProfile.mutate({
            companyName: form.companyName || undefined,
            abn: form.abn || undefined,
            phone: form.phone || undefined,
            state: form.state as any || undefined,
            licenseNumber: form.licenseNumber || undefined,
            defaultTrade: form.defaultTrade || undefined,
          })}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </AppLayout>
  );
}
