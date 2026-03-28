import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight, CheckCircle2, Clock, DollarSign,
  FolderOpen, Plus, Send, Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const TRADES = [
  { id: "electrical",      name: "Electrical",      emoji: "⚡", gradient: "from-yellow-400 to-orange-500" },
  { id: "plumbing",        name: "Plumbing",        emoji: "🔧", gradient: "from-blue-400 to-cyan-500" },
  { id: "carpentry",       name: "Carpentry",       emoji: "🪚", gradient: "from-amber-500 to-yellow-600" },
  { id: "concreting",      name: "Concreting",      emoji: "🏗️", gradient: "from-slate-400 to-slate-600" },
  { id: "hvac",            name: "HVAC",            emoji: "❄️", gradient: "from-sky-400 to-blue-600" },
  { id: "flooring",        name: "Flooring",        emoji: "🟫", gradient: "from-purple-400 to-violet-600" },
  { id: "landscaping",     name: "Landscaping",     emoji: "🌿", gradient: "from-green-400 to-emerald-600" },
  { id: "cabinetry",       name: "Cabinetry",       emoji: "🚪", gradient: "from-orange-400 to-red-500" },
  { id: "rendering",       name: "Rendering",       emoji: "🧱", gradient: "from-rose-400 to-pink-600" },
  { id: "cabinet-making",  name: "Cabinet Making",  emoji: "🪵", gradient: "from-teal-400 to-green-600" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: projectStats } = trpc.projects.stats.useQuery();
  const { data: estimateStats } = trpc.estimates.stats.useQuery();
  const { data: recentProjects } = trpc.projects.list.useQuery();

  const firstName = user?.name?.split(" ")[0] ?? "Tradie";

  const statCards = [
    { title: "Total Projects", value: projectStats?.total ?? 0, icon: FolderOpen, gradient: "from-blue-500 to-indigo-600", sub: `${projectStats?.draft ?? 0} in draft` },
    { title: "Estimates Sent", value: estimateStats?.sent ?? 0, icon: Send, gradient: "from-orange-400 to-pink-500", sub: `${estimateStats?.draft ?? 0} drafts pending` },
    { title: "Jobs Won", value: estimateStats?.accepted ?? 0, icon: CheckCircle2, gradient: "from-green-400 to-emerald-600", sub: "Accepted estimates" },
    { title: "Won Value", value: `$${((estimateStats?.totalValue ?? 0) / 1000).toFixed(1)}k`, icon: DollarSign, gradient: "from-pink-500 to-rose-600", sub: "Total accepted value" },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

        {/* ── Welcome Banner ── */}
        <div className="relative overflow-hidden rounded-2xl kindai-hero-bg p-6 sm:p-8">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{ background: "oklch(0.58 0.28 0)" }} />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full opacity-15 blur-2xl" style={{ background: "oklch(0.88 0.18 88)" }} />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0 hidden sm:block">
                <div className="absolute inset-0 rounded-2xl blur-lg opacity-50 kindai-gradient scale-110" />
                <img src={LOGO_URL} alt="Kindai" className="relative w-14 h-14 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  G'day, {firstName} 👋
                </h1>
                <p className="text-white/60 text-sm mt-0.5">
                  Here's your estimating overview — let's win some jobs today.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/projects")}
              className="kindai-btn-primary rounded-full px-6 font-bold text-sm h-10 flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" /> New Project
            </Button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map(({ title, value, icon: Icon, gradient, sub }) => (
            <Card key={title} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <CardContent className="p-4 sm:p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">{value}</div>
                <div className="text-xs font-bold text-foreground mt-0.5">{title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Quick Start Trade Selector ── */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 pt-5 px-5 sm:px-6">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              Start a New Estimate
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Pick your trade to begin</p>
          </CardHeader>
          <CardContent className="px-5 sm:px-6 pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {TRADES.map(({ id, name, emoji, gradient }) => (
                <button
                  key={id}
                  onClick={() => navigate("/projects")}
                  className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                    {emoji}
                  </div>
                  <span className="text-xs font-bold text-foreground leading-tight">{name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Recent Projects ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between px-5 sm:px-6 pt-5">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Recent Projects
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="text-xs text-muted-foreground hover:text-foreground">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="px-5 sm:px-6 pb-5">
            {!recentProjects || recentProjects.length === 0 ? (
              <div className="text-center py-10">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 rounded-2xl blur-lg opacity-40 kindai-gradient scale-110" />
                  <img src={LOGO_URL} alt="Kindai" className="relative w-16 h-16 object-contain" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No projects yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create your first project to start estimating</p>
                <Button
                  onClick={() => navigate("/projects")}
                  className="kindai-btn-primary rounded-full px-6 font-bold text-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Create First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentProjects.slice(0, 5).map((project) => {
                  const trade = TRADES.find(t => t.id === project.trade);
                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${trade?.gradient ?? "from-gray-400 to-gray-500"} flex items-center justify-center flex-shrink-0 text-lg shadow-sm`}>
                        {trade?.emoji ?? "📋"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{project.name}</div>
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
