import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bot, Mail, MessageSquare, PlugZap, RefreshCw } from "lucide-react";

const automationCards = [
  {
    agent: "acquisition" as const,
    title: "Lead qualification",
    text: "Score new leads, track source, flag spam, and prepare qualification notes.",
    icon: MessageSquare,
  },
  {
    agent: "conversion" as const,
    title: "Quote follow-up",
    text: "Draft follow-up emails and reminders after quotes are sent. Approval-first by default.",
    icon: Mail,
  },
  {
    agent: "delivery" as const,
    title: "Project handover",
    text: "Create delivery tasks after a lead is won and keep project steps visible.",
    icon: Bot,
  },
  {
    agent: "system" as const,
    title: "Integration webhooks",
    text: "Ready for Zapier, MCP tools, SMS, accounting, and CRM sync events.",
    icon: PlugZap,
  },
];

export default function AutomationCenter() {
  const utils = trpc.useUtils();
  const { data: logs = [] } = trpc.saas.listAutomationLogs.useQuery();
  const createLog = trpc.saas.createAutomationLog.useMutation({
    onSuccess: () => utils.saas.listAutomationLogs.invalidate(),
  });

  return (
    <AppLayout title="Automations">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-black">Automation Center</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Infrastructure for Resend, Zapier, webhooks, MCP tools, CRM syncing, SMS, and approval-first follow-up automation.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {automationCards.map(({ title, text, icon: Icon, agent }) => (
            <Card key={title} className="rounded-[8px]">
              <CardContent className="p-5">
                <Icon className="h-6 w-6 text-pink-500" />
                <h2 className="mt-4 font-black">{title}</h2>
                <p className="mt-2 min-h-20 text-sm leading-6 text-muted-foreground">{text}</p>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => createLog.mutate({ agent, eventType: title.toLowerCase().replaceAll(" ", "_"), status: "drafted" })}
                >
                  Test draft log
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-[8px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Automation logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-[8px] bg-muted p-5 text-sm text-muted-foreground">No automation events yet.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex flex-col gap-2 rounded-[8px] border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-bold">{log.eventType}</div>
                    <div className="text-xs text-muted-foreground">{log.agent} agent</div>
                  </div>
                  <Badge variant={log.status === "failed" ? "destructive" : "secondary"}>{log.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
