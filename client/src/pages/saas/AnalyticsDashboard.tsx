import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, CheckCircle2, DollarSign, FolderKanban, Users } from "lucide-react";

export default function AnalyticsDashboard() {
  const { data } = trpc.saas.analyticsSummary.useQuery();
  const stats = [
    { title: "Leads", value: data?.leads ?? 0, icon: Users, help: "Total CRM leads captured." },
    { title: "Open tasks", value: data?.tasks ?? 0, icon: CheckCircle2, help: "Delivery and follow-up tasks." },
    { title: "Projects", value: data?.deliveryProjects ?? 0, icon: FolderKanban, help: "Delivery projects in the SaaS workflow." },
    { title: "Quoted value", value: `$${Number(data?.quotedValue ?? 0).toLocaleString()}`, icon: DollarSign, help: "Estimate value from the core estimator." },
  ];

  return (
    <AppLayout title="Analytics">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-black">Analytics Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Decision-focused analytics for leads, quotes, follow-ups, project delivery, and revenue workflow. No raw session recording required.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ title, value, icon: Icon, help }) => (
            <Card key={title} className="rounded-[8px]">
              <CardContent className="p-5">
                <Icon className="h-6 w-6 text-pink-500" />
                <div className="mt-4 text-3xl font-black">{value}</div>
                <div className="mt-1 text-sm font-bold">{title}</div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{help}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-[8px]">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-pink-500" />
              <h2 className="text-xl font-black">Revenue signals to watch</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {["Lead source to won job", "Quote sent to accepted", "Follow-up due to booked job"].map((item) => (
                <div key={item} className="rounded-[8px] border p-4 text-sm font-semibold">{item}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
