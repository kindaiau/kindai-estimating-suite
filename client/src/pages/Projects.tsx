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
import { ArrowRight, FolderOpen, Plus, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const TRADES = [
  { id: "electrical", name: "Electrical", emoji: "⚡", gradient: "from-yellow-400 to-orange-500" },
  { id: "plumbing", name: "Plumbing", emoji: "🔧", gradient: "from-blue-400 to-cyan-500" },
  { id: "carpentry", name: "Carpentry", emoji: "🪚", gradient: "from-amber-500 to-yellow-600" },
  { id: "concreting", name: "Concreting", emoji: "🏗️", gradient: "from-slate-400 to-slate-600" },
  { id: "hvac", name: "HVAC", emoji: "❄️", gradient: "from-sky-400 to-blue-600" },
  { id: "flooring", name: "Flooring", emoji: "🟫", gradient: "from-purple-400 to-violet-600" },
  { id: "landscaping", name: "Landscaping", emoji: "🌿", gradient: "from-green-400 to-emerald-600" },
  { id: "cabinetry", name: "Cabinet Making & Joinery", emoji: "🪵", gradient: "from-teal-400 to-green-600" },
  { id: "rendering", name: "Rendering & Plastering", emoji: "🧱", gradient: "from-rose-400 to-pink-600" },
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
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-blue-500" /> Projects
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{projects?.length ?? 0} total projects</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="kindai-btn-primary rounded-full px-6 font-bold text-sm">
                <Plus className="w-4 h-4 mr-1.5" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-black">
                  <Sparkles className="w-5 h-5 text-pink-500" /> Create New Project
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold">Project Name *</Label>
                    <Input placeholder="e.g. Smith Residence Renovation" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold">Trade *</Label>
                    <Select value={form.trade} onValueChange={v => setForm(f => ({ ...f, trade: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select trade..." /></SelectTrigger>
                      <SelectContent>
                        {TRADES.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            <span className="flex items-center gap-2">{t.emoji} {t.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Client Name</Label>
                    <Input placeholder="John Smith" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Client Phone</Label>
                    <Input placeholder="0400 000 000" value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold">Client Email</Label>
                    <Input type="email" placeholder="client@example.com" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold">Site Address</Label>
                    <Input placeholder="123 Main Street" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Suburb</Label>
                    <Input placeholder="Suburb" value={form.suburb} onChange={e => setForm(f => ({ ...f, suburb: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Postcode</Label>
                    <Input placeholder="2000" value={form.postcode} onChange={e => setForm(f => ({ ...f, postcode: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold">State</Label>
                    <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select state..." /></SelectTrigger>
                      <SelectContent>
                        {AU_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full kindai-btn-primary rounded-xl font-bold" onClick={handleCreate} disabled={createProject.isPending}>
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
            className="pl-9 rounded-xl"
            placeholder="Search projects or clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 bg-secondary/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 rounded-2xl blur-lg opacity-40 kindai-gradient scale-110" />
              <img src={LOGO_URL} alt="Kindai" className="relative w-16 h-16 object-contain" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "Try a different search term" : "Create your first project to get started"}
            </p>
            {!search && (
              <Button className="kindai-btn-primary rounded-full px-6 font-bold text-sm" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> New Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const trade = TRADES.find(t => t.id === project.trade);
              return (
                <Card
                  key={project.id}
                  className="border-0 shadow-sm hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group rounded-2xl overflow-hidden"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${trade?.gradient ?? "from-gray-400 to-gray-500"} flex items-center justify-center flex-shrink-0 text-xl shadow-sm group-hover:scale-105 transition-transform`}>
                        {trade?.emoji ?? "📋"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{project.name}</div>
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
