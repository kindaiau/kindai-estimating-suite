import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const TRADE_EMOJI: Record<string, string> = {
  electrical: "⚡", plumbing: "🔧", carpentry: "🪚", concreting: "🏗️",
  hvac: "❄️", flooring: "🟫", landscaping: "🌿", cabinetry: "🚪",
  rendering: "🧱", painting: "🎨", bricklaying: "🧱", roofing: "🏠",
  tiling: "⬜", waterproofing: "💧", "fire-protection": "🔥",
  glazing: "🪟", "quantity-surveying": "📐", demolition: "⛏️",
  "swimming-pool": "🏊", "steel-fabrication": "🔩",
};
const TRADE_GRADIENTS: Record<string, string> = {
  electrical: "from-amber-400 to-orange-500", plumbing: "from-blue-400 to-cyan-500",
  carpentry: "from-amber-600 to-yellow-500", concreting: "from-slate-400 to-gray-500",
  hvac: "from-cyan-400 to-blue-500", flooring: "from-violet-400 to-purple-500",
  landscaping: "from-emerald-400 to-green-500", cabinetry: "from-orange-400 to-amber-500",
  rendering: "from-pink-400 to-rose-500", painting: "from-purple-400 to-pink-500",
  bricklaying: "from-red-400 to-orange-500", roofing: "from-slate-500 to-gray-600",
  tiling: "from-teal-400 to-cyan-500", waterproofing: "from-blue-500 to-indigo-600",
  "fire-protection": "from-red-500 to-rose-600", glazing: "from-sky-400 to-blue-500",
  "quantity-surveying": "from-indigo-400 to-violet-500", demolition: "from-stone-400 to-gray-500",
  "swimming-pool": "from-cyan-400 to-teal-500", "steel-fabrication": "from-zinc-500 to-slate-600",
};

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const projectId = parseInt(params.id ?? "0");
  const [open, setOpen] = useState(false);
  const [estimateTitle, setEstimateTitle] = useState("");
  const [margin, setMargin] = useState("15");

  const utils = trpc.useUtils();
  const { data: project, isLoading } = trpc.projects.get.useQuery({ id: projectId });
  const { data: estimates } = trpc.estimates.list.useQuery({ projectId });

  const createEstimate = trpc.estimates.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Estimate ${data.quoteNumber} created!`);
      utils.estimates.list.invalidate();
      setOpen(false);
      navigate(`/estimates/${data.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.projects.update.useMutation({
    onSuccess: () => { toast.success("Status updated"); utils.projects.get.invalidate(); },
  });

  if (isLoading) return (
    <AppLayout><div className="p-6 animate-pulse space-y-4">
      <div className="h-8 w-48 bg-secondary rounded-xl" />
      <div className="h-32 bg-secondary rounded-2xl" />
    </div></AppLayout>
  );

  if (!project) return (
    <AppLayout><div className="p-6 text-center">
      <p className="text-muted-foreground">Project not found</p>
      <Button variant="ghost" onClick={() => navigate("/projects")} className="mt-3 rounded-full">Back to Projects</Button>
    </div></AppLayout>
  );

  const emoji = TRADE_EMOJI[project.trade] ?? "⚡";
  const gradient = TRADE_GRADIENTS[project.trade] ?? "from-pink-400 to-orange-500";

  return (
    <AppLayout title={project.name}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-4xl mx-auto">
        {/* Back + Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="mb-3 -ml-2 text-muted-foreground rounded-full">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Projects
          </Button>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-md text-2xl`}>
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-foreground">{project.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {project.clientName && <span className="text-sm font-bold text-muted-foreground">{project.clientName}</span>}
                {project.suburb && <span className="text-xs text-muted-foreground">· {project.suburb}, {project.state}</span>}
              </div>
            </div>
            <Select value={project.status} onValueChange={(v) => updateStatus.mutate({ id: projectId, status: v as any })}>
              <SelectTrigger className="w-32 text-xs h-8 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["draft", "quoted", "accepted", "declined", "invoiced", "completed"].map(s => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Client Info */}
        {(project.clientEmail || project.clientPhone || project.address) && (
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                {project.clientEmail && (
                  <div><div className="text-xs text-muted-foreground font-bold mb-0.5">Email</div><div className="font-bold">{project.clientEmail}</div></div>
                )}
                {project.clientPhone && (
                  <div><div className="text-xs text-muted-foreground font-bold mb-0.5">Phone</div><div className="font-bold">{project.clientPhone}</div></div>
                )}
                {project.address && (
                  <div><div className="text-xs text-muted-foreground font-bold mb-0.5">Address</div><div className="font-bold">{project.address}</div></div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estimates */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-orange-500 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              Estimates ({estimates?.length ?? 0})
            </CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="kindai-btn-primary rounded-full font-bold text-xs px-4">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> New Estimate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-lg font-black">Create Estimate</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Estimate Title *</Label>
                    <Input placeholder="e.g. Full Electrical Installation" value={estimateTitle} onChange={e => setEstimateTitle(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Margin (%)</Label>
                    <Input type="number" min="0" max="100" value={margin} onChange={e => setMargin(e.target.value)} className="rounded-xl" />
                    <p className="text-xs text-muted-foreground">Applied on top of materials + labour costs</p>
                  </div>
                  <Button
                    className="w-full kindai-btn-primary rounded-xl font-bold"
                    onClick={() => {
                      if (!estimateTitle) return toast.error("Title required");
                      createEstimate.mutate({
                        projectId, trade: project.trade, title: estimateTitle,
                        margin: parseFloat(margin) || 15,
                        complianceState: project.state ?? undefined,
                      });
                    }}
                    disabled={createEstimate.isPending}
                  >
                    {createEstimate.isPending ? "Creating..." : "Create Estimate"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {!estimates || estimates.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground mb-1">No estimates yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create your first estimate to start building your quote</p>
                <Button size="sm" className="kindai-btn-primary rounded-full font-bold text-xs px-5" onClick={() => setOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Create First Estimate
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {estimates.map((est) => (
                  <div
                    key={est.id}
                    onClick={() => navigate(`/estimates/${est.id}`)}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground">{est.title}</div>
                      <div className="text-xs text-muted-foreground font-mono">{est.quoteNumber}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-black text-foreground">${parseFloat(est.total as string).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-muted-foreground">inc. GST</div>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] capitalize rounded-full`}>
                      {est.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
