import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, Boxes, Droplets, FileText, Grid3X3,
  Hammer, Layers, Leaf, Package, Plus, Wind, Zap,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const TRADE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  electrical: Zap, plumbing: Droplets, carpentry: Hammer, concreting: Building2,
  hvac: Wind, flooring: Grid3X3, landscaping: Leaf, cabinetry: Package,
  rendering: Layers, "cabinet-making": Boxes,
};
const TRADE_COLORS: Record<string, string> = {
  electrical: "bg-amber-500", plumbing: "bg-blue-500", carpentry: "bg-amber-800",
  concreting: "bg-slate-500", hvac: "bg-cyan-500", flooring: "bg-violet-500",
  landscaping: "bg-emerald-500", cabinetry: "bg-orange-500",
  rendering: "bg-pink-500", "cabinet-making": "bg-orange-600",
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
      <div className="h-8 w-48 bg-secondary rounded" />
      <div className="h-32 bg-secondary rounded-xl" />
    </div></AppLayout>
  );

  if (!project) return (
    <AppLayout><div className="p-6 text-center">
      <p className="text-muted-foreground">Project not found</p>
      <Button variant="ghost" onClick={() => navigate("/projects")} className="mt-3">Back to Projects</Button>
    </div></AppLayout>
  );

  const Icon = TRADE_ICONS[project.trade] ?? Zap;
  const color = TRADE_COLORS[project.trade] ?? "bg-primary";

  return (
    <AppLayout title={project.name}>
      <div className="p-6 space-y-5">
        {/* Back + Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="mb-3 -ml-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Projects
          </Button>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {project.clientName && <span className="text-sm text-muted-foreground">{project.clientName}</span>}
                {project.suburb && <span className="text-xs text-muted-foreground">· {project.suburb}, {project.state}</span>}
              </div>
            </div>
            <Select
              value={project.status}
              onValueChange={(v) => updateStatus.mutate({ id: projectId, status: v as any })}
            >
              <SelectTrigger className={`w-32 text-xs h-8 status-${project.status}`}>
                <SelectValue />
              </SelectTrigger>
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
          <Card className="border-border shadow-sm">
            <CardContent className="p-4">
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                {project.clientEmail && (
                  <div><div className="text-xs text-muted-foreground mb-0.5">Email</div><div className="font-medium">{project.clientEmail}</div></div>
                )}
                {project.clientPhone && (
                  <div><div className="text-xs text-muted-foreground mb-0.5">Phone</div><div className="font-medium">{project.clientPhone}</div></div>
                )}
                {project.address && (
                  <div><div className="text-xs text-muted-foreground mb-0.5">Address</div><div className="font-medium">{project.address}</div></div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estimates */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Estimates ({estimates?.length ?? 0})
            </CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="kindai-gradient text-white border-0">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> New Estimate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Estimate</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Estimate Title *</Label>
                    <Input placeholder="e.g. Full Electrical Installation" value={estimateTitle} onChange={e => setEstimateTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Margin (%)</Label>
                    <Input type="number" min="0" max="100" value={margin} onChange={e => setMargin(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Applied on top of materials + labour costs</p>
                  </div>
                  <Button
                    className="w-full kindai-gradient text-white border-0"
                    onClick={() => {
                      if (!estimateTitle) return toast.error("Title required");
                      createEstimate.mutate({
                        projectId,
                        trade: project.trade,
                        title: estimateTitle,
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
          <CardContent>
            {!estimates || estimates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No estimates yet</p>
                <Button size="sm" className="kindai-gradient text-white border-0" onClick={() => setOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Create First Estimate
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {estimates.map((est) => (
                  <div
                    key={est.id}
                    onClick={() => navigate(`/estimates/${est.id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/30 cursor-pointer transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{est.title}</div>
                      <div className="text-xs text-muted-foreground">{est.quoteNumber}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-foreground">${parseFloat(est.total as string).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-muted-foreground">inc. GST</div>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] capitalize status-${est.status}`}>
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
