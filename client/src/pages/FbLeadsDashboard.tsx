/**
 * FB Leads Dashboard — Kindai Estimating Suite (Admin only)
 *
 * Displays all Facebook leads captured via the /api/webhooks/fb-lead endpoint.
 * Shows HubSpot CRM status, nurture email progress, lead details, and summary stats.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  CheckCircle2,
  Mail,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  Building2,
  MapPin,
  Wrench,
  Clock,
  Send,
  XCircle,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const NURTURE_EMAIL_LABELS: Record<string, { label: string; day: string }> = {
  day1_activation: { label: "Activation", day: "Day 1" },
  day3_social_proof: { label: "Social Proof", day: "Day 3" },
  day7_roi: { label: "ROI Case Study", day: "Day 7" },
  day14_urgency: { label: "Urgency Close", day: "Day 14" },
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  active: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  churned: "bg-red-500/15 text-red-400 border-red-500/30",
};

const NURTURE_STATUS_ICON: Record<string, React.ReactNode> = {
  sent: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  scheduled: <CalendarClock className="h-4 w-4 text-amber-400" />,
  failed: <XCircle className="h-4 w-4 text-red-400" />,
  cancelled: <XCircle className="h-4 w-4 text-zinc-500" />,
};

// ─── Helper components ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-kindai-pink",
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="bg-zinc-900/60 border-zinc-800">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-zinc-800 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-zinc-400">{label}</div>
          {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function NurtureProgressBar({
  emails,
}: {
  emails: { emailKey: string; status: string }[];
}) {
  const keys = ["day1_activation", "day3_social_proof", "day7_roi", "day14_urgency"];
  const emailMap = new Map(emails.map((e) => [e.emailKey, e.status]));

  return (
    <TooltipProvider>
      <div className="flex gap-1 items-center">
        {keys.map((key) => {
          const status = emailMap.get(key) ?? "not_scheduled";
          const meta = NURTURE_EMAIL_LABELS[key];
          let color = "bg-zinc-700";
          if (status === "sent") color = "bg-emerald-500";
          else if (status === "scheduled") color = "bg-amber-500";
          else if (status === "failed") color = "bg-red-500";

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div
                  className={`h-2 w-6 rounded-full ${color} cursor-pointer transition-all hover:scale-110`}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-zinc-800 border-zinc-700 text-xs">
                <div className="font-medium">{meta.day} — {meta.label}</div>
                <div className="text-zinc-400 capitalize">{status.replace("_", " ")}</div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function HubSpotBadge({ contactId }: { contactId: string | null }) {
  if (!contactId) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
        <AlertCircle className="h-3 w-3" /> Not synced
      </span>
    );
  }
  return (
    <a
      href={`https://app.hubspot.com/contacts/contacts/${contactId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
    >
      <CheckCircle2 className="h-3 w-3" />
      {contactId}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

// ─── Lead Detail Dialog ───────────────────────────────────────────────────────

function LeadDetailDialog({
  leadId,
  open,
  onClose,
}: {
  leadId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = trpc.fbLeads.getById.useQuery(
    { id: leadId! },
    { enabled: !!leadId && open }
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Lead Details</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12 text-zinc-400">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Lead info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Name</div>
                <div className="text-white font-medium">{data.lead.name}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Email</div>
                <div className="text-white">{data.lead.email}</div>
              </div>
              {data.lead.company && (
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Company</div>
                  <div className="text-white">{data.lead.company}</div>
                </div>
              )}
              {data.lead.trade && (
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Trade</div>
                  <div className="text-white">{data.lead.trade}</div>
                </div>
              )}
              {data.lead.state && (
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">State</div>
                  <div className="text-white">{data.lead.state}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Status</div>
                <Badge className={STATUS_COLORS[data.lead.status] ?? ""}>
                  {data.lead.status}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Signed Up</div>
                <div className="text-white text-sm">
                  {new Date(data.lead.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* HubSpot */}
            <div className="border-t border-zinc-800 pt-4">
              <div className="text-sm font-medium text-zinc-300 mb-3">HubSpot CRM</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Contact ID</div>
                  <HubSpotBadge contactId={data.lead.hubspotContactId ?? null} />
                </div>
                {data.lead.hubspotDealId && (
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Deal ID</div>
                    <a
                      href={`https://app.hubspot.com/contacts/deals/${data.lead.hubspotDealId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
                    >
                      {data.lead.hubspotDealId}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Nurture emails */}
            <div className="border-t border-zinc-800 pt-4">
              <div className="text-sm font-medium text-zinc-300 mb-3">
                Nurture Sequence ({data.nurtureEmails.length} emails)
              </div>
              {data.nurtureEmails.length === 0 ? (
                <div className="text-sm text-zinc-500">No nurture emails scheduled yet.</div>
              ) : (
                <div className="space-y-2">
                  {data.nurtureEmails.map((ne) => {
                    const meta = NURTURE_EMAIL_LABELS[ne.emailKey];
                    return (
                      <div
                        key={ne.id}
                        className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          {NURTURE_STATUS_ICON[ne.status] ?? <Clock className="h-4 w-4 text-zinc-500" />}
                          <div>
                            <div className="text-sm text-white font-medium">
                              {meta?.day} — {meta?.label ?? ne.emailKey}
                            </div>
                            <div className="text-xs text-zinc-500">
                              Scheduled: {new Date(ne.scheduledAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              ne.status === "sent"
                                ? "border-emerald-500/30 text-emerald-400"
                                : ne.status === "scheduled"
                                ? "border-amber-500/30 text-amber-400"
                                : ne.status === "failed"
                                ? "border-red-500/30 text-red-400"
                                : "border-zinc-700 text-zinc-500"
                            }
                          >
                            {ne.status}
                          </Badge>
                          {ne.sentAt && (
                            <span className="text-xs text-zinc-500">
                              Sent: {new Date(ne.sentAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FbLeadsDashboard() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: stats, isLoading: statsLoading } = trpc.fbLeads.stats.useQuery();
  const { data: leadsData, isLoading: leadsLoading, refetch } = trpc.fbLeads.list.useQuery({
    status: statusFilter as "all" | "pending" | "approved" | "active" | "churned",
    limit: 100,
    offset: 0,
  });

  const approveMutation = trpc.fbLeads.approve.useMutation({
    onSuccess: () => {
      toast.success("Lead approved!", { description: "Status updated to approved." });
      utils.fbLeads.list.invalidate();
      utils.fbLeads.stats.invalidate();
    },
    onError: (e) => {
      toast.error("Error", { description: e.message });
    },
  });

  // Admin guard
  if (user && user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-zinc-400">
          <AlertCircle className="h-6 w-6 mr-2" />
          Admin access required to view this page.
        </div>
      </DashboardLayout>
    );
  }

  const leads = leadsData?.leads ?? [];
  const total = leadsData?.total ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">📣</span> FB Leads Dashboard
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              All leads captured from Facebook Lead Ads via Zapier webhook
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2 border-zinc-700 text-zinc-300 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total FB Leads"
            value={statsLoading ? "—" : stats?.totalLeads ?? 0}
            color="text-pink-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="HubSpot Synced"
            value={statsLoading ? "—" : stats?.hubspotSynced ?? 0}
            sub="Contacts + Deals created"
            color="text-orange-400"
          />
          <StatCard
            icon={Send}
            label="Nurture Sent"
            value={statsLoading ? "—" : stats?.nurtureSent ?? 0}
            sub={`${stats?.nurtureScheduled ?? 0} scheduled`}
            color="text-emerald-400"
          />
          <StatCard
            icon={AlertCircle}
            label="Nurture Failed"
            value={statsLoading ? "—" : stats?.nurtureFailed ?? 0}
            sub="Need attention"
            color={stats?.nurtureFailed ? "text-red-400" : "text-zinc-500"}
          />
        </div>

        {/* Leads table */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">
                Leads ({total})
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-8 text-sm bg-zinc-800 border-zinc-700 text-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {leadsLoading ? (
              <div className="flex items-center justify-center py-16 text-zinc-400">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading leads...
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-2">
                <Users className="h-10 w-10 opacity-30" />
                <div className="text-sm">No FB leads found</div>
                <div className="text-xs text-zinc-600">
                  Leads will appear here once your Zapier webhook is live
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400 font-medium pl-6">Lead</TableHead>
                      <TableHead className="text-zinc-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Wrench className="h-3.5 w-3.5" /> Trade / State
                        </span>
                      </TableHead>
                      <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                      <TableHead className="text-zinc-400 font-medium">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" /> HubSpot
                        </span>
                      </TableHead>
                      <TableHead className="text-zinc-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-blue-400" /> Nurture
                        </span>
                      </TableHead>
                      <TableHead className="text-zinc-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Signed Up
                        </span>
                      </TableHead>
                      <TableHead className="text-zinc-400 font-medium pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        className="border-zinc-800 hover:bg-zinc-800/40 cursor-pointer transition-colors"
                        onClick={() => setSelectedLeadId(lead.id)}
                      >
                        {/* Lead name + email */}
                        <TableCell className="pl-6 py-4">
                          <div className="font-medium text-white text-sm">{lead.name}</div>
                          <div className="text-xs text-zinc-400">{lead.email}</div>
                          {lead.company && (
                            <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3" /> {lead.company}
                            </div>
                          )}
                        </TableCell>

                        {/* Trade / State */}
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-0.5">
                            {lead.trade ? (
                              <span className="text-sm text-zinc-300">{lead.trade}</span>
                            ) : (
                              <span className="text-xs text-zinc-600">—</span>
                            )}
                            {lead.state && (
                              <span className="text-xs text-zinc-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {lead.state}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Status badge */}
                        <TableCell className="py-4">
                          <Badge
                            variant="outline"
                            className={`text-xs ${STATUS_COLORS[lead.status] ?? "border-zinc-700 text-zinc-400"}`}
                          >
                            {lead.status}
                          </Badge>
                        </TableCell>

                        {/* HubSpot */}
                        <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                          <HubSpotBadge contactId={lead.hubspotContactId ?? null} />
                        </TableCell>

                        {/* Nurture progress */}
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1.5">
                            <NurtureProgressBar emails={lead.nurtureEmails} />
                            <span className="text-xs text-zinc-500">
                              {lead.nurtureProgress.sent}/{lead.nurtureProgress.total} sent
                              {lead.nurtureProgress.failed > 0 && (
                                <span className="text-red-400 ml-1">
                                  · {lead.nurtureProgress.failed} failed
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>

                        {/* Signed up date */}
                        <TableCell className="py-4">
                          <div className="text-xs text-zinc-400">
                            {new Date(lead.createdAt).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-xs text-zinc-600">
                            {new Date(lead.createdAt).toLocaleTimeString("en-AU", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {lead.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => approveMutation.mutate({ id: lead.id })}
                                disabled={approveMutation.isPending}
                              >
                                Approve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-zinc-400 hover:text-white"
                              onClick={() => setSelectedLeadId(lead.id)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zapier setup reminder */}
        {(stats?.totalLeads ?? 0) === 0 && !leadsLoading && (
          <Card className="bg-blue-950/30 border-blue-800/40">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="text-2xl">⚡</div>
              <div>
                <div className="text-sm font-medium text-blue-300 mb-1">
                  Connect Zapier to start capturing leads
                </div>
                <div className="text-xs text-blue-400/80 leading-relaxed">
                  Create a Zap: <strong>Facebook Lead Ads</strong> → <strong>Webhooks by Zapier POST</strong> to{" "}
                  <code className="bg-blue-900/40 px-1 rounded text-blue-300">
                    /api/webhooks/fb-lead
                  </code>
                  . Map fields: <code className="bg-blue-900/40 px-1 rounded text-blue-300">name</code>,{" "}
                  <code className="bg-blue-900/40 px-1 rounded text-blue-300">email</code>,{" "}
                  <code className="bg-blue-900/40 px-1 rounded text-blue-300">company</code>,{" "}
                  <code className="bg-blue-900/40 px-1 rounded text-blue-300">trade</code>,{" "}
                  <code className="bg-blue-900/40 px-1 rounded text-blue-300">state</code>.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lead detail dialog */}
      <LeadDetailDialog
        leadId={selectedLeadId}
        open={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
    </DashboardLayout>
  );
}
