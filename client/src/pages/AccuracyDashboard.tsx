import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, Target, Brain, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState, useMemo } from "react";

const TRADES = [
  { id: "all", name: "All Trades" },
  { id: "electrical", name: "Electrical" }, { id: "plumbing", name: "Plumbing" },
  { id: "carpentry", name: "Carpentry" }, { id: "concreting", name: "Concreting" },
  { id: "hvac", name: "HVAC" }, { id: "flooring", name: "Flooring" },
  { id: "landscaping", name: "Landscaping" }, { id: "cabinetry", name: "Cabinet Making" },
  { id: "rendering", name: "Rendering" },
];

export default function AccuracyDashboard() {
  const [selectedTrade, setSelectedTrade] = useState("all");
  const tradeFilter = selectedTrade === "all" ? undefined : selectedTrade;

  const { data: dashboard, isLoading: dashLoading } = trpc.corrections.getAccuracyDashboard.useQuery({ trade: tradeFilter });
  const { data: insights, isLoading: insightsLoading } = trpc.corrections.getLearningInsights.useQuery({ trade: tradeFilter });

  const isLoading = dashLoading || insightsLoading;

  return (
    <AppLayout title="Accuracy Dashboard">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-500" /> Accuracy Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              How accurate are your AI estimates? Track corrections and job outcomes.
            </p>
          </div>
          <Select value={selectedTrade} onValueChange={setSelectedTrade}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRADES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="text-[11px] text-muted-foreground font-bold uppercase">Accuracy Score</div>
              <div className="text-3xl font-black mt-1">
                {dashboard?.accuracyScore != null ? (
                  <span className={dashboard.accuracyScore >= 80 ? "text-green-600" : dashboard.accuracyScore >= 60 ? "text-amber-600" : "text-red-600"}>
                    {dashboard.accuracyScore}%
                  </span>
                ) : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Based on job outcomes</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="text-[11px] text-muted-foreground font-bold uppercase">Jobs Tracked</div>
              <div className="text-3xl font-black mt-1">{dashboard?.totalJobs ?? 0}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Estimated vs actual</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="text-[11px] text-muted-foreground font-bold uppercase">Avg Variance</div>
              <div className="text-3xl font-black mt-1 flex items-center gap-1">
                {dashboard?.avgVariance != null ? (
                  <>
                    <span className={dashboard.avgVariance > 0 ? "text-red-600" : "text-green-600"}>
                      {dashboard.avgVariance > 0 ? "+" : ""}{dashboard.avgVariance}%
                    </span>
                    {dashboard.avgVariance > 0 ? <ArrowUpRight className="w-4 h-4 text-red-500" /> : <ArrowDownRight className="w-4 h-4 text-green-500" />}
                  </>
                ) : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Actual vs quoted</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="text-[11px] text-muted-foreground font-bold uppercase">Avg Profit</div>
              <div className="text-3xl font-black mt-1">
                {dashboard?.avgProfit != null ? (
                  <span className={dashboard.avgProfit >= 0 ? "text-green-600" : "text-red-600"}>
                    {dashboard.avgProfit > 0 ? "+" : ""}{dashboard.avgProfit}%
                  </span>
                ) : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Margin achieved</div>
            </CardContent>
          </Card>
        </div>

        {/* ── AI Learning Insights ── */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              AI Learning Insights
              <Badge variant="secondary" className="ml-auto text-[10px]">{insights?.totalCorrections ?? 0} corrections</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {insights?.learningContext && insights.learningContext.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground mb-2">
                  The AI is learning from your corrections. These patterns are automatically applied to future estimates.
                </p>
                {insights.learningContext.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <Brain className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-foreground">{insight}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-bold">No correction patterns yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  As you edit AI-generated estimates, Kindai learns your preferences and adjusts future takeoffs.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Correction Patterns ── */}
        {insights?.patterns && insights.patterns.length > 0 && (
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                Correction Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-1.5">
                {insights.patterns.map((p, i) => {
                  const [type, field] = p.key.split(":");
                  const label = type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <div className="text-xs font-bold">{label}</div>
                        <div className="text-[10px] text-muted-foreground">{field !== "general" ? field : ""}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{p.count}x</Badge>
                        {p.avgDelta !== 0 && (
                          <Badge className={`text-[10px] ${p.avgDelta > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {p.avgDelta > 0 ? "+" : ""}{p.avgDelta.toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Job Outcomes History ── */}
        {dashboard?.outcomes && dashboard.outcomes.length > 0 && (
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                Job Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-1.5">
                {dashboard.outcomes.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                    <div>
                      <div className="text-xs font-bold capitalize">{o.trade}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Quoted: ${o.quotedTotal.toLocaleString()} → Actual: ${o.actualTotal.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${o.variancePercent > 5 ? "bg-red-100 text-red-700" : o.variancePercent < -5 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        {o.variancePercent > 0 ? "+" : ""}{o.variancePercent.toFixed(1)}%
                      </Badge>
                      {o.clientSatisfaction && (
                        <Badge variant="outline" className="text-[10px] capitalize">{o.clientSatisfaction}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && (!dashboard?.totalJobs || dashboard.totalJobs === 0) && (!insights?.totalCorrections || insights.totalCorrections === 0) && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-black text-foreground">Start Tracking Accuracy</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Edit AI estimates to build correction patterns, and record job outcomes to track how accurate your quotes are over time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
