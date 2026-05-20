import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ClipboardList, FileText, Hammer, Truck } from "lucide-react";

const deliverySteps = [
  { title: "Onboarding", icon: ClipboardList, text: "Client details, scope, site access, and required documents." },
  { title: "Planning", icon: FileText, text: "Estimate, approvals, materials, labour, and delivery schedule." },
  { title: "In progress", icon: Hammer, text: "Tasks, variations, notes, and customer communication." },
  { title: "Handover", icon: Truck, text: "Completion checks, documents, invoice handover, and follow-up." },
];

export default function ProjectDashboard() {
  const { data: workspace } = trpc.saas.getWorkspace.useQuery();

  return (
    <AppLayout title="Projects">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-black">Project Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Delivery workflow for {workspace?.industry.crmLabels.project ?? "projects"} after a lead becomes a booked job.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {deliverySteps.map(({ title, text, icon: Icon }) => (
            <Card key={title} className="rounded-[8px]">
              <CardContent className="p-5">
                <Icon className="h-6 w-6 text-pink-500" />
                <h2 className="mt-4 font-black">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-[8px]">
          <CardHeader>
            <CardTitle>Delivery controls</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {["Create tasks from won lead", "Generate customer handover checklist", "Track variations and documents"].map((item) => (
              <div key={item} className="flex gap-3 rounded-[8px] border p-4 text-sm leading-6">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
