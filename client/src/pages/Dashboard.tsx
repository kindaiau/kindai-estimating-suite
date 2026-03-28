import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  FolderOpen,
  Plus,
  Send,
  Zap,
  Building2,
  Droplets,
  Hammer,
  Wind,
  Grid3X3,
  Leaf,
  Package,
  Layers,
  Boxes,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

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

const QUICK_TRADES = [
  { id: "electrical", name: "Electrical" },
  { id: "plumbing", name: "Plumbing" },
  { id: "carpentry", name: "Carpentry" },
  { id: "concreting", name: "Concreting" },
  { id: "hvac", name: "HVAC" },
  { id: "flooring", name: "Flooring" },
  { id: "landscaping", name: "Landscaping" },
  { id: "cabinetry", name: "Cabinetry" },
  { id: "rendering", name: "Rendering" },
  { id: "cabinet-making", name: "Cabinet Making" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: projectStats } = trpc.projects.stats.useQuery();
  const { data: estimateStats } = trpc.estimates.stats.useQuery();
  const { data: recentProjects } = trpc.projects.list.useQuery();

  const firstName = user?.name?.split(" ")[0] ?? "Tradie";

  const statCards = [
    {
      title: "Total Projects",
      value: projectStats?.total ?? 0,
      icon: FolderOpen,
      color: "text-blue-600",
      bg: "bg-blue-50",
      sub: `${projectStats?.draft ?? 0} in draft`,
    },
    {
      title: "Estimates Sent",
      value: estimateStats?.sent ?? 0,
      icon: Send,
      color: "text-amber-600",
      bg: "bg-amber-50",
      sub: `${estimateStats?.draft ?? 0} drafts pending`,
    },
    {
      title: "Jobs Won",
      value: estimateStats?.accepted ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      sub: "Accepted estimates",
    },
    {
      title: "Won Value",
      value: `$${((estimateStats?.totalValue ?? 0) / 1000).toFixed(1)}k`,
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
      sub: "Total accepted value",
    },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              G'day, {firstName} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Here's your estimating overview
            </p>
          </div>
          <Button
            className="kindai-gradient text-white border-0 shadow-sm"
            onClick={() => navigate("/projects")}
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Project
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ title, value, icon: Icon, color, bg, sub }) => (
            <Card key={title} className="border-border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="text-xs font-medium text-foreground mt-0.5">{title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Start Trade Selector */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Start a New Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {QUICK_TRADES.map(({ id, name }) => {
                const Icon = TRADE_ICONS[id] ?? Zap;
                const color = TRADE_COLORS[id] ?? "bg-primary";
                return (
                  <button
                    key={id}
                    onClick={() => navigate("/projects")}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-secondary/50 transition-all group text-center"
                  >
                    <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-foreground leading-tight">{name}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Projects
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="text-xs text-muted-foreground">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {!recentProjects || recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <FolderOpen className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">No projects yet</p>
                <Button size="sm" className="kindai-gradient text-white border-0" onClick={() => navigate("/projects")}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Create First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.slice(0, 5).map((project) => {
                  const Icon = TRADE_ICONS[project.trade] ?? Zap;
                  const color = TRADE_COLORS[project.trade] ?? "bg-primary";
                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{project.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {project.clientName ?? "No client"} {project.suburb ? `· ${project.suburb}` : ""}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] capitalize flex-shrink-0 status-${project.status}`}
                      >
                        {project.status}
                      </Badge>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
