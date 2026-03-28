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

const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
const TRADES = [
  { id: "electrical", name: "Electrical" }, { id: "plumbing", name: "Plumbing" },
  { id: "carpentry", name: "Carpentry" }, { id: "concreting", name: "Concreting" },
  { id: "hvac", name: "HVAC" }, { id: "flooring", name: "Flooring" },
  { id: "landscaping", name: "Landscaping" }, { id: "cabinetry", name: "Cabinetry" },
  { id: "rendering", name: "Rendering & Plastering" }, { id: "cabinet-making", name: "Cabinet Making" },
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
      <div className="p-6 space-y-5 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your business details and preferences</p>
        </div>

        {/* Account Info */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Name</div>
                <div className="text-sm font-medium">{user?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Email</div>
                <div className="text-sm font-medium">{user?.email ?? "—"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Company / Business Name</Label>
                <Input placeholder="Your Business Pty Ltd" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>ABN</Label>
                <Input placeholder="12 345 678 901" value={form.abn} onChange={e => setForm(f => ({ ...f, abn: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="0400 000 000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>State / Territory</Label>
                <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select state..." /></SelectTrigger>
                  <SelectContent>{AU_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Default Trade</Label>
                <Select value={form.defaultTrade} onValueChange={v => setForm(f => ({ ...f, defaultTrade: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select trade..." /></SelectTrigger>
                  <SelectContent>{TRADES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Licensing */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Licensing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Licence Number</Label>
              <Input placeholder="e.g. EC12345 / QBCC 1234567" value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} />
              <p className="text-xs text-muted-foreground">This will appear on your quotes and estimates</p>
            </div>
          </CardContent>
        </Card>

        <Button
          className="kindai-gradient text-white border-0 shadow-sm"
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
