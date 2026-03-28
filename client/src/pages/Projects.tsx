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
import {
  ArrowRight, Building2, Boxes, Droplets, FolderOpen, Grid3X3,
  Hammer, Layers, Leaf, Package, Plus, Search, Wind, Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

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
const TRADES = [
  { id: "electrical", name: "Electrical" }, { id: "plumbing", name: "Plumbing" },
  { id: "carpentry", name: "Carpentry" }, { id: "concreting", name: "Concreting" },
  { id: "hvac", name: "HVAC" }, { id: "flooring", name: "Flooring" },
  { id: "landscaping", name: "Landscaping" }, { id: "cabinetry", name: "Cabinetry" },
  { id: "rendering", name: "Rendering & Plastering" }, { id: "cabinet-making", name: "Cabinet Making" },
];
const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

export default function Projects() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", clientName: "", clientEmail: "", clientPhone: "",
    address: "", suburb: "", state: "", postcode: "", trade: "", notes: "",
  });

  const utils = trpc.useUtils();
  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Project created!");
      utils.projects.list.invalidate();
      setOpen(false);
      navigate(`/projects/${data.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (projects ?? []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.clientName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!form.name || !form.trade) return toast.error("Project name and trade are required");
    createProject.mutate({
      ...form,
      state: form.state as any,
      clientEmail: form.clientEmail || undefined,
    });
  };

  return (
    <AppLayout title="Projects">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{projects?.length ?? 0} total projects</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="kindai-gradient text-white border-0 shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Project Name *</Label>
                    <Input placeholder="e.g. Smith Residence Renovation" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Trade *</Label>
                    <Select value={form.trade} onValueChange={v => setForm(f => ({ ...f, trade: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select trade..." /></SelectTrigger>
                      <SelectContent>
                        {TRADES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Client Name</Label>
                    <Input placeholder="John Smith" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Client Phone</Label>
                    <Input placeholder="0400 000 000" value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Client Email</Label>
                    <Input type="email" placeholder="client@example.com" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Site Address</Label>
                    <Input placeholder="123 Main Street" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Suburb</Label>
                    <Input placeholder="Suburb" value={form.suburb} onChange={e => setForm(f => ({ ...f, suburb: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Postcode</Label>
                    <Input placeholder="2000" value={form.postcode} onChange={e => setForm(f => ({ ...f, postcode: e.target.value }))} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>State</Label>
                    <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select state..." /></SelectTrigger>
                      <SelectContent>
                        {AU_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full kindai-gradient text-white border-0" onClick={handleCreate} disabled={createProject.isPending}>
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search projects or clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-secondary/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "Try a different search term" : "Create your first project to get started"}
            </p>
            {!search && (
              <Button className="kindai-gradient text-white border-0" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> New Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const Icon = TRADE_ICONS[project.trade] ?? Zap;
              const color = TRADE_COLORS[project.trade] ?? "bg-primary";
              return (
                <Card
                  key={project.id}
                  className="border-border shadow-sm hover:shadow-md hover:border-primary/30 cursor-pointer transition-all group"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{project.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{project.clientName ?? "No client"}</div>
                      </div>
                      <Badge variant="secondary" className={`text-[10px] capitalize flex-shrink-0 status-${project.status}`}>
                        {project.status}
                      </Badge>
                    </div>
                    {(project.suburb || project.state) && (
                      <div className="text-xs text-muted-foreground mb-3">
                        📍 {[project.suburb, project.state].filter(Boolean).join(", ")}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString("en-AU")}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
