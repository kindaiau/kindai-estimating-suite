import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle,
  AlertCircle, DollarSign, Calendar, FileText, Trash2, Edit3,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-zinc-100 text-zinc-600", icon: FileText },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
};

const REASON_LABELS: Record<string, string> = {
  client_request: "Client Request",
  design_change: "Design Change",
  site_condition: "Site Condition",
  scope_omission: "Scope Omission",
  regulatory: "Regulatory",
  other: "Other",
};

export default function VariationsRegister() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId || "0");

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    reason: "client_request" as const,
    costImpact: "",
    timeImpactDays: "0",
    notes: "",
  });
  const [editStatus, setEditStatus] = useState<string>("");

  const { data: variations = [], refetch } = trpc.variations.list.useQuery({ projectId: pid }, { enabled: pid > 0 });
  const { data: summary } = trpc.variations.getContractSummary.useQuery(
    { projectId: pid, originalContractValue: 0 },
    { enabled: pid > 0 }
  );

  const createMutation = trpc.variations.create.useMutation({
    onSuccess: (result) => {
      toast.success(`Variation ${result.variationNumber} created`);
      setShowCreate(false);
      setForm({ title: "", description: "", reason: "client_request", costImpact: "", timeImpactDays: "0", notes: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.variations.update.useMutation({
    onSuccess: () => {
      toast.success("Variation updated");
      setEditingId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.variations.delete.useMutation({
    onSuccess: () => {
      toast.success("Variation deleted");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!form.title.trim()) return toast.error("Title is required");
    const cost = parseFloat(form.costImpact);
    if (isNaN(cost)) return toast.error("Enter a valid cost impact (e.g. 5000 or -2000)");
    createMutation.mutate({
      projectId: pid,
      title: form.title,
      description: form.description || undefined,
      reason: form.reason,
      costImpact: cost,
      timeImpactDays: parseInt(form.timeImpactDays) || 0,
      notes: form.notes || undefined,
    });
  };

  const handleStatusChange = (id: number, status: string) => {
    updateMutation.mutate({ id, status: status as "draft" | "submitted" | "approved" | "rejected" | "on_hold" });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${pid}`}>
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Project
              </Button>
            </Link>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> New Variation
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Variations Register</h1>
          <p className="text-zinc-500 text-sm mt-1">Track all scope changes, additions, and deductions for this project</p>
        </div>

        {/* Contract Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <p className="text-xs text-zinc-500 mb-1">Original Contract</p>
              <p className="text-xl font-bold text-zinc-900">
                ${(summary.originalValue || 0).toLocaleString("en-AU", { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <p className="text-xs text-zinc-500 mb-1">Approved Variations</p>
              <p className="text-xl font-bold text-green-600">
                ${(summary.revisedContractSum - summary.originalValue).toLocaleString("en-AU", { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <p className="text-xs text-zinc-500 mb-1">Revised Contract Sum</p>
              <p className="text-xl font-bold text-orange-600">
                ${(summary.revisedContractSum || 0).toLocaleString("en-AU", { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <p className="text-xs text-zinc-500 mb-1">Pending Value</p>
              <p className="text-xl font-bold text-blue-600">
                ${(summary.pendingVariations || 0).toLocaleString("en-AU", { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        )}

        {/* Variations list */}
        {variations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-semibold text-zinc-700 mb-1">No variations yet</h3>
            <p className="text-sm text-zinc-500 mb-4">Track scope changes, additions, and deductions here</p>
            <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Create First Variation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {variations.map((v) => {
              const statusCfg = STATUS_CONFIG[v.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
              const StatusIcon = statusCfg.icon;
              const cost = parseFloat(v.costImpact || "0");
              const isPositive = cost >= 0;

              return (
                <div key={v.id} className="bg-white rounded-xl border border-zinc-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-zinc-400">{v.variationNumber}</span>
                        <Badge className={`${statusCfg.color} text-xs border-0`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusCfg.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {REASON_LABELS[v.reason] || v.reason}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-zinc-900">{v.title}</h3>
                      {v.description && (
                        <p className="text-sm text-zinc-500 mt-1">{v.description}</p>
                      )}
                      {(v.timeImpactDays ?? 0) !== 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
                          <Calendar className="w-3 h-3" />
                          <span>{(v.timeImpactDays ?? 0) > 0 ? "+" : ""}{v.timeImpactDays ?? 0} days</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        <div className={`flex items-center gap-1 font-bold text-lg ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {isPositive ? "+" : ""}${Math.abs(cost).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-zinc-400">inc. GST</p>
                      </div>
                      <div className="flex gap-1">
                        <Select
                          value={v.status}
                          onValueChange={(val) => handleStatusChange(v.id, val)}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs border-zinc-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key} className="text-xs">{cfg.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Delete this variation?")) {
                              deleteMutation.mutate({ id: v.id });
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Variation Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Variation Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Title *</label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Additional drainage run to Unit 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detailed description of the variation..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Reason</label>
                <Select value={form.reason} onValueChange={(v) => setForm(f => ({ ...f, reason: v as typeof form.reason }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REASON_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Time Impact (days)</label>
                <Input
                  type="number"
                  value={form.timeImpactDays}
                  onChange={e => setForm(f => ({ ...f, timeImpactDays: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Cost Impact (AUD inc. GST) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="number"
                  value={form.costImpact}
                  onChange={e => setForm(f => ({ ...f, costImpact: e.target.value }))}
                  placeholder="5000 (use negative for deductions)"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">Positive = addition to contract. Negative = deduction.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Internal Notes</label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Internal notes (not shown to client)..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createMutation.isPending ? "Creating..." : "Create Variation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
