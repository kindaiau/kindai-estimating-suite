import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  sent: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  bounced: "bg-red-100 text-red-700 border-red-200",
};

const DAY_LABELS: Record<number, { label: string; description: string }> = {
  1: { label: "Day 1", description: "Same-day confirmation — warm, professional" },
  3: { label: "Day 3", description: "Check-in — helpful, not pushy" },
  7: { label: "Day 7", description: "Gentle nudge — mild urgency" },
  14: { label: "Day 14", description: "Final follow-up — clear urgency, respectful close" },
};

interface FollowupPreviewProps {
  estimateId: number;
  dayOffset: number;
  clientName: string;
  onClose: () => void;
}

function FollowupPreview({ estimateId, dayOffset, clientName, onClose }: FollowupPreviewProps) {
  const [customBody, setCustomBody] = useState<string | null>(null);
  const preview = trpc.emailFollowup.previewEmail.useMutation();
  const send = trpc.emailFollowup.sendFollowup.useMutation({
    onSuccess: (data) => {
      toast.success(`Follow-up sent to ${data.sentTo}`);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handlePreview = () => {
    preview.mutate({ estimateId, dayOffset, clientName });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {DAY_LABELS[dayOffset]?.description}
      </div>
      {!preview.data ? (
        <Button onClick={handlePreview} disabled={preview.isPending} className="w-full">
          {preview.isPending ? "Generating AI email..." : "Generate Email Preview"}
        </Button>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">SUBJECT</div>
            <div className="p-3 bg-muted rounded text-sm font-medium">{preview.data.subject}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">BODY</div>
            <Textarea
              value={customBody ?? preview.data.body}
              onChange={e => setCustomBody(e.target.value)}
              rows={8}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview} disabled={preview.isPending}>
              Regenerate
            </Button>
            <Button className="flex-1" disabled={send.isPending}>
              {send.isPending ? "Sending..." : "Copy Email Text"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Copy the email text and send via your email client, or use the Send button to mark as sent.
          </p>
        </div>
      )}
    </div>
  );
}

export default function QuoteFollowups() {
  const [selectedEstimate, setSelectedEstimate] = useState<number | null>(null);
  const [previewFollowup, setPreviewFollowup] = useState<{ estimateId: number; dayOffset: number; clientName: string } | null>(null);

  const { data: estimates } = trpc.estimates.list.useQuery({ projectId: undefined });
  const { data: templates } = trpc.emailFollowup.getTemplates.useQuery();
  const { data: followups, refetch: refetchFollowups } = trpc.emailFollowup.getFollowups.useQuery(
    { estimateId: selectedEstimate! },
    { enabled: !!selectedEstimate }
  );

  const scheduleMutation = trpc.emailFollowup.scheduleSequence.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.scheduled} follow-up emails scheduled`);
      refetchFollowups();
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.emailFollowup.cancelFollowup.useMutation({
    onSuccess: () => { toast.success("Follow-up cancelled"); refetchFollowups(); },
  });

  const sentEstimates = estimates?.filter(e => e.status === "sent") ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Quote Follow-up Sequences</h1>
          <p className="text-muted-foreground mt-1">
            Automated AI-written follow-up emails that chase your quotes — Day 1, 3, 7, and 14 after sending.
          </p>
        </div>

        {/* Email Templates Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {templates?.map(t => (
            <Card key={t.key} className="border-l-4 border-l-primary">
              <CardContent className="pt-4 pb-3">
                <div className="text-lg font-bold text-primary">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.tone}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sent Estimates */}
        <Card>
          <CardHeader>
            <CardTitle>Sent Quotes — Manage Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            {sentEstimates.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No quotes with "Sent" status yet. Mark a quote as sent in the Estimate Builder to start a follow-up sequence.
              </p>
            ) : (
              <div className="space-y-3">
                {sentEstimates.map(est => (
                  <div
                    key={est.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedEstimate === est.id ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}
                    onClick={() => setSelectedEstimate(est.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{est.title}</div>
                        <div className="text-sm text-muted-foreground">{est.quoteNumber} · {est.trade} · ${parseFloat(est.total as string || "0").toLocaleString("en-AU")} inc. GST</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            scheduleMutation.mutate({
                              estimateId: est.id,
                              clientEmail: "client@example.com",
                              clientName: "Client",
                            });
                          }}
                          disabled={scheduleMutation.isPending}
                        >
                          Schedule Sequence
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Follow-up Sequence for Selected Estimate */}
        {selectedEstimate && (
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Sequence</CardTitle>
            </CardHeader>
            <CardContent>
              {!followups?.length ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-muted-foreground text-sm">No follow-up sequence scheduled yet.</p>
                  <Button onClick={() => scheduleMutation.mutate({
                    estimateId: selectedEstimate,
                    clientEmail: "client@example.com",
                    clientName: "Client",
                  })}>
                    Schedule 4-Email Sequence
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {followups.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center w-16">
                          <div className="text-lg font-bold text-primary">Day {f.dayOffset}</div>
                        </div>
                        <div>
                          <div className="font-medium">{f.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {f.status === "scheduled" && f.scheduledAt
                              ? `Scheduled for ${new Date(f.scheduledAt).toLocaleDateString("en-AU")}`
                              : f.status === "sent" && f.sentAt
                              ? `Sent ${new Date(f.sentAt).toLocaleDateString("en-AU")}`
                              : f.status}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded border ${STATUS_COLORS[f.status]}`}>
                          {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                        </span>
                        {f.status === "scheduled" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewFollowup({
                                estimateId: selectedEstimate,
                                dayOffset: f.dayOffset || 1,
                                clientName: f.clientName || "Client",
                              })}
                            >
                              Preview Email
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => cancelMutation.mutate({ followupId: f.id })}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewFollowup} onOpenChange={() => setPreviewFollowup(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {previewFollowup ? `${DAY_LABELS[previewFollowup.dayOffset]?.label} Follow-up Email` : ""}
              </DialogTitle>
            </DialogHeader>
            {previewFollowup && (
              <FollowupPreview
                estimateId={previewFollowup.estimateId}
                dayOffset={previewFollowup.dayOffset}
                clientName={previewFollowup.clientName}
                onClose={() => setPreviewFollowup(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Info box */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">How Follow-up Sequences Work</h3>
            <p className="text-sm text-muted-foreground">
              When you mark a quote as "Sent", Kindai schedules 4 AI-written follow-up emails at Day 1, 3, 7, and 14.
              Each email is written in your business voice — warm, direct, and Australian. You can preview and edit each
              email before it goes out, or cancel individual follow-ups. The AI adapts the tone and urgency for each stage,
              so Day 1 is a friendly confirmation and Day 14 is a respectful final nudge.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
