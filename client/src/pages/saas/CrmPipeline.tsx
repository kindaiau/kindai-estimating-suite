import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

const stages = [
  ["new_lead", "New Lead"],
  ["qualified", "Qualified"],
  ["quote_sent", "Quote Sent"],
  ["follow_up", "Follow-Up"],
  ["won", "Won"],
  ["lost", "Lost"],
] as const;

export default function CrmPipeline() {
  const utils = trpc.useUtils();
  const { data: workspace } = trpc.saas.getWorkspace.useQuery();
  const { data: leads = [] } = trpc.saas.listLeads.useQuery();
  const createLead = trpc.saas.createLead.useMutation({
    onSuccess: () => utils.saas.listLeads.invalidate(),
  });
  const updateStage = trpc.saas.updateLeadStage.useMutation({
    onSuccess: () => utils.saas.listLeads.invalidate(),
  });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", jobType: "", notes: "" });

  const grouped = useMemo(() => {
    return stages.reduce<Record<string, typeof leads>>((acc, [stage]) => {
      acc[stage] = leads.filter((lead) => lead.pipelineStage === stage);
      return acc;
    }, {});
  }, [leads]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await createLead.mutateAsync(form);
    setForm({ name: "", email: "", phone: "", jobType: "", notes: "" });
    setFormOpen(false);
  };

  return (
    <AppLayout title="CRM">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black">CRM Pipeline</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {workspace?.industry.crmLabels.lead ?? "Lead"} pipeline for acquisition and conversion.
            </p>
          </div>
          <Button className="kindai-btn-primary font-black" onClick={() => setFormOpen((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" /> Add lead
          </Button>
        </div>

        {formOpen ? (
          <Card className="rounded-[8px]">
            <CardContent className="pt-6">
              <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Job type</Label>
                  <Input value={form.jobType} onChange={(event) => setForm({ ...form, jobType: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} />
                </div>
                <Button className="kindai-btn-primary md:col-span-2" disabled={createLead.isPending}>
                  {createLead.isPending ? "Creating..." : "Create lead"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-6">
          {stages.map(([stage, label]) => (
            <Card key={stage} className="min-h-[420px] rounded-[8px]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  {label}
                  <Badge variant="secondary">{grouped[stage]?.length ?? 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(grouped[stage] ?? []).map((lead) => (
                  <div key={lead.id} className="rounded-[8px] border bg-card p-3 shadow-sm">
                    <div className="font-black">{lead.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{lead.jobType || "No job type"} - Score {lead.score}</div>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{lead.notes || "No notes yet."}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {stages
                        .filter(([nextStage]) => nextStage !== stage)
                        .slice(0, 2)
                        .map(([nextStage, nextLabel]) => (
                          <Button
                            key={nextStage}
                            size="sm"
                            variant="outline"
                            className="h-8 text-[11px]"
                            onClick={() => updateStage.mutate({ id: lead.id, stage: nextStage })}
                          >
                            {nextLabel}
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
