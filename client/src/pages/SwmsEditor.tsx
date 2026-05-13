import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import type { WorkActivity } from "../../../drizzle/schema";
import { HRCW_LABELS } from "../../../shared/compliance";

// ─── HRCW Badge ───────────────────────────────────────────────────────────────

function HrcwBadge({ category }: { category: string }) {
  const label = HRCW_LABELS[category as keyof typeof HRCW_LABELS] || category;
  return (
    <div className="flex items-start gap-2 p-2 bg-red-950/30 border border-red-800/40 rounded text-xs text-red-300">
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-400" />
      <span>{label}</span>
    </div>
  );
}

// ─── Work Activity Row ────────────────────────────────────────────────────────

function ActivityRow({
  activity,
  index,
  onChange,
  onDelete,
}: {
  activity: WorkActivity;
  index: number;
  onChange: (updated: WorkActivity) => void;
  onDelete: () => void;
}) {
  return (
    <div className="border border-white/10 rounded-lg p-4 bg-white/5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-mono w-5">{index + 1}.</span>
          <Input
            value={activity.task}
            onChange={e => onChange({ ...activity, task: e.target.value })}
            placeholder="Work activity / task name"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm h-8"
          />
          {activity.isAiGenerated && (
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/40 text-xs shrink-0">
              <Sparkles className="w-2.5 h-2.5 mr-1" />AI
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-red-400" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Hazards & Risks</label>
          <Textarea
            value={activity.hazards.join("\n")}
            onChange={e => onChange({ ...activity, hazards: e.target.value.split("\n").filter(Boolean) })}
            placeholder="One hazard per line"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs min-h-[80px] resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Control Measures</label>
          <Textarea
            value={activity.controls.join("\n")}
            onChange={e => onChange({ ...activity, controls: e.target.value.split("\n").filter(Boolean) })}
            placeholder="One control per line (use hierarchy: Elimination → PPE)"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs min-h-[80px] resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Required PPE</label>
          <Textarea
            value={activity.ppe.join("\n")}
            onChange={e => onChange({ ...activity, ppe: e.target.value.split("\n").filter(Boolean) })}
            placeholder="One PPE item per line"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs min-h-[80px] resize-none"
          />
          <div className="mt-2">
            <label className="text-xs text-white/40 mb-1 block">Responsible</label>
            <Input
              value={activity.responsible}
              onChange={e => onChange({ ...activity, responsible: e.target.value })}
              placeholder="PCBU / Supervisor"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs h-7"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SwmsEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const { data: swmsData, refetch } = trpc.swms.get.useQuery({ id: id! }, { enabled: !!id });
  const { data: signatures } = trpc.swms.getSignatures.useQuery({ id: id! }, { enabled: !!id });
  const updateMutation = trpc.swms.update.useMutation();
  const finalizeMutation = trpc.swms.finalize.useMutation();
  const shareMutation = trpc.swms.createShareLink.useMutation();

  // Local editable state
  const [localActivities, setLocalActivities] = useState<WorkActivity[] | null>(null);
  const [localDetails, setLocalDetails] = useState<Record<string, string> | null>(null);

  if (!swmsData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF2D78]" />
      </div>
    );
  }

  const activities = localActivities ?? ((swmsData.workActivities as WorkActivity[]) || []);
  const hrcwCategories = (swmsData.hrcwCategories as string[]) || [];
  const isFinalized = swmsData.status === "finalized";

  const details = localDetails ?? {
    pcbuName: swmsData.pcbuName || "",
    pcbuAbn: swmsData.pcbuAbn || "",
    pcbuAddress: swmsData.pcbuAddress || "",
    pcbuContact: swmsData.pcbuContact || "",
    principalContractorName: swmsData.principalContractorName || "",
    workLocation: swmsData.workLocation || "",
    worksManager: swmsData.worksManager || "",
    responsibleForCompliance: swmsData.responsibleForCompliance || "",
    responsibleForReview: swmsData.responsibleForReview || "",
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: id!,
        workActivities: activities,
        ...details,
      });
      setLocalActivities(null);
      setLocalDetails(null);
      await refetch();
      toast.success("SWMS saved successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!confirm("Finalizing will generate a PDF and lock this SWMS. You can still create a new version. Continue?")) return;
    try {
      const result = await finalizeMutation.mutateAsync({ id: id! });
      await refetch();
      toast.success("SWMS finalized! PDF generated.");
      if (result.pdfUrl) window.open(result.pdfUrl, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Failed to finalize");
    }
  };

  const handleCreateShareLink = async () => {
    setIsGeneratingLink(true);
    try {
      const result = await shareMutation.mutateAsync({ id: id!, origin: window.location.origin });
      setShareUrl(result.shareUrl);
      await navigator.clipboard.writeText(result.shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (e: any) {
      toast.error(e.message || "Failed to create share link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const addActivity = () => {
    const newActivity: WorkActivity = {
      id: `manual_${Date.now()}`,
      task: "",
      hazards: [],
      controls: [],
      ppe: [],
      responsible: "PCBU",
      isAiGenerated: false,
    };
    setLocalActivities([...activities, newActivity]);
  };

  const updateActivity = (index: number, updated: WorkActivity) => {
    const next = [...activities];
    next[index] = updated;
    setLocalActivities(next);
  };

  const deleteActivity = (index: number) => {
    setLocalActivities(activities.filter((_, i) => i !== index));
  };

  const statusColor = {
    draft: "text-yellow-400 border-yellow-400/40",
    pending_review: "text-blue-400 border-blue-400/40",
    approved: "text-green-400 border-green-400/40",
    finalized: "text-purple-400 border-purple-400/40",
  }[swmsData.status] || "text-white/40 border-white/20";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50" onClick={() => navigate(-1 as any)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FF2D78]" />
              <div>
                <div className="font-semibold text-sm">Safe Work Method Statement</div>
                <div className="text-xs text-white/40">SWMS ID: {id} · v{swmsData.version}</div>
              </div>
            </div>
            <Badge variant="outline" className={`text-xs ${statusColor}`}>
              {swmsData.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {!isFinalized && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white/70 hover:bg-white/10"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Save Draft
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white/70 hover:bg-white/10"
              onClick={handleCreateShareLink}
              disabled={isGeneratingLink}
            >
              {isGeneratingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
              Share for Signing
            </Button>
            {swmsData.pdfUrl && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white/70 hover:bg-white/10"
                onClick={() => window.open(swmsData.pdfUrl!, "_blank")}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download PDF
              </Button>
            )}
            {!isFinalized && (
              <Button
                size="sm"
                className="bg-[#FF2D78] hover:bg-[#e02268] text-white"
                onClick={handleFinalize}
                disabled={finalizeMutation.isPending}
              >
                {finalizeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
                Finalize & Generate PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Share link banner */}
        {shareUrl && (
          <div className="flex items-center gap-3 p-3 bg-emerald-950/40 border border-emerald-700/40 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-emerald-300">Share link created and copied to clipboard:</span>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline flex items-center gap-1 truncate">
              {shareUrl} <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        )}

        {/* AI disclaimer */}
        <div className="flex items-start gap-3 p-3 bg-amber-950/30 border border-amber-700/40 rounded-lg text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong>Important:</strong> This SWMS was generated with AI assistance based on your estimate data. You are legally responsible as the PCBU for reviewing, verifying, and ensuring this document complies with all relevant WHS legislation before commencing any high-risk construction work. AI-generated rows are marked with an <span className="inline-block bg-emerald-950 text-emerald-400 px-1 rounded text-[10px]">AI</span> badge.
          </div>
        </div>

        {/* HRCW Identification */}
        {hrcwCategories.length > 0 && (
          <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Identified High-Risk Construction Work (HRCW)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {hrcwCategories.map(cat => <HrcwBadge key={cat} category={cat} />)}
            </div>
          </div>
        )}

        {/* SWMS Details */}
        <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#FF2D78]" />
            SWMS Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: "pcbuName", label: "PCBU / Business Name" },
              { key: "pcbuAbn", label: "ABN" },
              { key: "pcbuAddress", label: "PCBU Address" },
              { key: "pcbuContact", label: "Contact Person" },
              { key: "principalContractorName", label: "Principal Contractor" },
              { key: "workLocation", label: "Work Location / Site Address" },
              { key: "worksManager", label: "Works Manager" },
              { key: "responsibleForCompliance", label: "Responsible for Compliance" },
              { key: "responsibleForReview", label: "Responsible for Review" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-white/40 mb-1 block">{label}</label>
                <Input
                  value={details[key] || ""}
                  onChange={e => setLocalDetails({ ...details, [key]: e.target.value })}
                  disabled={isFinalized}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm h-8"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Work Activities */}
        <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FF2D78]" />
              Work Activity Steps, Hazards & Control Measures
              <Badge variant="outline" className="text-white/40 border-white/20 text-xs">{activities.length} tasks</Badge>
            </h3>
            {!isFinalized && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white/70 hover:bg-white/10 h-7 text-xs"
                onClick={addActivity}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Task
              </Button>
            )}
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">
              No work activities yet. Click "Add Task" to add manually, or go back and regenerate.
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, i) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  index={i}
                  onChange={updated => updateActivity(i, updated)}
                  onDelete={() => deleteActivity(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Worker Signatures */}
        {signatures && signatures.length > 0 && (
          <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF2D78]" />
              Worker Signatures ({signatures.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {signatures.map(sig => (
                <div key={sig.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{sig.workerName}</div>
                    <div className="text-xs text-white/40">
                      Signed {new Date(sig.signedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {sig.workerSignature && (
                    <img
                      src={sig.workerSignature}
                      alt="Signature"
                      className="h-8 ml-auto bg-white rounded px-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
