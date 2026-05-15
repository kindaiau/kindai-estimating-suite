import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SafetyProfileWizardInline from "@/components/SafetyProfileWizard";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Camera,
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
  Upload,
  Users,
  Zap,
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

// ─── Risk Rating Badge ───────────────────────────────────────────────────────

function RiskBadge({ rating }: { rating?: string }) {
  if (!rating) return null;
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-300 border-red-500/40",
    high: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    low: "bg-green-500/20 text-green-300 border-green-500/40",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${colors[rating] || colors.medium}`}>
      {rating.toUpperCase()}
    </Badge>
  );
}

// ─── Work Activity Row ────────────────────────────────────────────────────────

function ActivityRow({
  activity,
  index,
  onChange,
  onDelete,
  disabled,
}: {
  activity: WorkActivity;
  index: number;
  onChange: (updated: WorkActivity) => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="border border-white/10 rounded-lg p-4 bg-white/5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-white/40 font-mono w-5">{index + 1}.</span>
          <Input
            value={activity.task}
            onChange={e => onChange({ ...activity, task: e.target.value })}
            placeholder="Work activity / task name"
            disabled={disabled}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm h-8"
          />
          {activity.isAiGenerated && (
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/40 text-xs shrink-0">
              <Sparkles className="w-2.5 h-2.5 mr-1" />AI
            </Badge>
          )}
          <RiskBadge rating={(activity as any).riskRating} />
        </div>
        {!disabled && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-red-400" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Hazards & Risks</label>
          <Textarea
            value={activity.hazards.join("\n")}
            onChange={e => onChange({ ...activity, hazards: e.target.value.split("\n").filter(Boolean) })}
            placeholder="One hazard per line"
            disabled={disabled}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs min-h-[80px] resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Control Measures (Hierarchy Order)</label>
          <Textarea
            value={activity.controls.join("\n")}
            onChange={e => onChange({ ...activity, controls: e.target.value.split("\n").filter(Boolean) })}
            placeholder="[ELIMINATE] Remove hazard entirely&#10;[ENGINEER] Physical barrier&#10;[ADMIN] Toolbox talk&#10;[PPE] AS/NZS 1801 helmet"
            disabled={disabled}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs min-h-[80px] resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Required PPE (with Standards)</label>
          <Textarea
            value={activity.ppe.join("\n")}
            onChange={e => onChange({ ...activity, ppe: e.target.value.split("\n").filter(Boolean) })}
            placeholder="AS/NZS 1801 safety helmet&#10;AS/NZS 1337.1 safety glasses&#10;AS/NZS 2210.3 safety boots"
            disabled={disabled}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs min-h-[80px] resize-none"
          />
          <div className="mt-2">
            <label className="text-xs text-white/40 mb-1 block">Responsible</label>
            <Input
              value={activity.responsible}
              onChange={e => onChange({ ...activity, responsible: e.target.value })}
              placeholder="PCBU / Supervisor"
              disabled={disabled}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs h-7"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Site Photo Hazard Card ──────────────────────────────────────────────────

function SitePhotoHazardCard({ analysis }: { analysis: any }) {
  if (!analysis || !analysis.hazards?.length) return null;

  const riskColors: Record<string, string> = {
    critical: "border-red-500/60 bg-red-950/30",
    high: "border-orange-500/60 bg-orange-950/30",
    medium: "border-yellow-500/60 bg-yellow-950/30",
    low: "border-green-500/60 bg-green-950/30",
  };

  return (
    <div className={`border rounded-xl p-5 ${riskColors[analysis.overallRiskLevel] || riskColors.medium}`}>
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-[#FF2D78]" />
        <h3 className="font-semibold text-sm">Site Photo Analysis</h3>
        <Badge variant="outline" className={`text-xs ${analysis.overallRiskLevel === "critical" ? "text-red-300 border-red-400/40" : "text-orange-300 border-orange-400/40"}`}>
          {analysis.overallRiskLevel?.toUpperCase()} RISK
        </Badge>
        <span className="text-xs text-white/40 ml-auto">Confidence: {analysis.confidence}%</span>
      </div>
      <p className="text-xs text-white/60 mb-3">{analysis.siteDescription}</p>
      <div className="space-y-2">
        {analysis.hazards.map((h: any, i: number) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <AlertTriangle className={`w-3 h-3 mt-0.5 shrink-0 ${h.severity === "critical" ? "text-red-400" : h.severity === "high" ? "text-orange-400" : "text-yellow-400"}`} />
            <div>
              <span className="text-white/80 font-medium">[{h.category}]</span>{" "}
              <span className="text-white/60">{h.description}</span>
              <div className="text-white/40 mt-0.5">→ {h.immediateAction} ({h.standardReference})</div>
            </div>
          </div>
        ))}
      </div>
      {analysis.unableToAssess?.length > 0 && (
        <div className="mt-3 text-xs text-white/30">
          Unable to assess: {analysis.unableToAssess.join(", ")}
        </div>
      )}
    </div>
  );
}

// ─── AI Intelligence Panel ───────────────────────────────────────────────────

function AIIntelligencePanel({ swmsId }: { swmsId: string }) {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<any>(null);
  const [pdfResult, setPdfResult] = useState<any>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const analysePhotoMutation = trpc.swms.analyseSitePhoto.useMutation();
  const extractPdfMutation = trpc.swms.extractFromPdf.useMutation();
  const { data: aiStats } = trpc.swms.getAIStats.useQuery();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, HEIC)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo must be under 10MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Upload to S3 first
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/trpc/upload.file", {
        method: "POST",
        body: formData,
      });

      // Fallback: convert to base64 data URL for analysis
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        try {
          const result = await analysePhotoMutation.mutateAsync({
            photoUrl: dataUrl,
            swmsId,
          });
          setPhotoAnalysis(result);
          toast.success(`Site photo analysed — ${result.hazards?.length || 0} hazards identified`);
        } catch (err: any) {
          toast.error(err.message || "Failed to analyse photo");
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
      setIsUploadingPhoto(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsUploadingPdf(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        try {
          const result = await extractPdfMutation.mutateAsync({
            pdfUrl: dataUrl,
          });
          setPdfResult(result);
          toast.success(`Extracted ${result.extracted} company procedures from your SWMS`);
        } catch (err: any) {
          toast.error(err.message || "Failed to extract procedures");
        } finally {
          setIsUploadingPdf(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
      setIsUploadingPdf(false);
    }
  };

  return (
    <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-[#FF2D78]" />
        <h3 className="font-semibold text-sm">AI Intelligence Engine</h3>
        <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/40 ml-auto">
          <Zap className="w-2.5 h-2.5 mr-1" />
          {aiStats ? `${(aiStats.totalCorrections || 0) + (aiStats.totalProcedures || 0) + (aiStats.totalProfileItems || 0)} learnings` : "Loading..."}
        </Badge>
      </div>

      {/* AI Stats */}
      {aiStats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-[#FF2D78]">{aiStats.totalCorrections}</div>
            <div className="text-[10px] text-white/40">Corrections Learned</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-emerald-400">{aiStats.totalProfileItems}</div>
            <div className="text-[10px] text-white/40">Safety Standards</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-blue-400">{aiStats.totalProcedures}</div>
            <div className="text-[10px] text-white/40">Company Procedures</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-purple-400">{aiStats.totalPhotosAnalysed}</div>
            <div className="text-[10px] text-white/40">Photos Analysed</div>
          </div>
        </div>
      )}

      {/* Site Photo Upload */}
      <div className="border border-dashed border-white/20 rounded-lg p-4 hover:border-[#FF2D78]/40 transition-colors">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FF2D78]/10 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-[#FF2D78]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Upload Site Photo</div>
            <div className="text-xs text-white/40">AI vision identifies hazards from your site photos — overhead lines, uneven ground, missing guardrails</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-[#FF2D78]/40 text-[#FF2D78] hover:bg-[#FF2D78]/10"
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploadingPhoto}
          >
            {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
            {isUploadingPhoto ? "Analysing..." : "Upload Photo"}
          </Button>
        </div>
      </div>

      {/* Photo Analysis Result */}
      {photoAnalysis && <SitePhotoHazardCard analysis={photoAnalysis} />}

      {/* Past SWMS PDF Upload */}
      <div className="border border-dashed border-white/20 rounded-lg p-4 hover:border-blue-400/40 transition-colors">
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handlePdfUpload}
        />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Learn from Your Past SWMS</div>
            <div className="text-xs text-white/40">Upload an old SWMS PDF — AI extracts your company's standard procedures and applies them to all future documents</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-blue-400/40 text-blue-400 hover:bg-blue-400/10"
            onClick={() => pdfInputRef.current?.click()}
            disabled={isUploadingPdf}
          >
            {isUploadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
            {isUploadingPdf ? "Extracting..." : "Upload PDF"}
          </Button>
        </div>
      </div>

      {/* PDF Extraction Result */}
      {pdfResult && pdfResult.extracted > 0 && (
        <div className="bg-blue-950/30 border border-blue-700/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Extracted {pdfResult.extracted} company procedures</span>
          </div>
          <div className="space-y-1">
            {pdfResult.procedures.slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                <span className="text-blue-400/60">•</span>
                <span>[{p.category}] {p.description}</span>
              </div>
            ))}
            {pdfResult.extracted > 5 && (
              <div className="text-xs text-white/30 mt-1">+ {pdfResult.extracted - 5} more procedures stored</div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Loop Info */}
      <div className="flex items-start gap-2 p-3 bg-emerald-950/20 border border-emerald-700/30 rounded-lg text-xs text-emerald-300/80">
        <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
        <div>
          <strong>Adaptive AI:</strong> Every time you edit an AI-generated control measure, PPE item, or hazard — the system learns your preferences. After 5+ corrections for a trade, future SWMS will automatically use your preferred wording and standards.
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
  const [wizardDismissed, setWizardDismissed] = useState(false);

  // Check if user has set up safety profile
  const { data: profileStatus } = trpc.swms.hasSafetyProfile.useQuery();

  // Show wizard if no profile exists and not dismissed
  if (profileStatus && !profileStatus.hasProfile && !wizardDismissed) {
    return <SafetyProfileWizardInline onComplete={() => setWizardDismissed(true)} />;
  }

  const { data: swmsData, refetch } = trpc.swms.get.useQuery({ id: id! }, { enabled: !!id });
  const { data: signatures } = trpc.swms.getSignatures.useQuery({ id: id! }, { enabled: !!id });
  const updateMutation = trpc.swms.update.useMutation();
  const saveWithCorrectionsMutation = trpc.swms.saveWithCorrections.useMutation();
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
      // Use saveWithCorrections to detect AI learning opportunities
      const corrResult = await saveWithCorrectionsMutation.mutateAsync({
        id: id!,
        workActivities: activities,
      });

      // Also update the details
      await updateMutation.mutateAsync({
        id: id!,
        workActivities: activities,
        ...details,
      });

      setLocalActivities(null);
      setLocalDetails(null);
      await refetch();

      if (corrResult.correctionsDetected > 0) {
        toast.success(`Saved! AI learned ${corrResult.correctionsDetected} new correction${corrResult.correctionsDetected > 1 ? "s" : ""} from your edits.`, {
          icon: "🧠",
        });
      } else {
        toast.success("SWMS saved successfully");
      }
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

        {/* AI Intelligence Panel */}
        <AIIntelligencePanel swmsId={id!} />

        {/* AI disclaimer */}
        <div className="flex items-start gap-3 p-3 bg-amber-950/30 border border-amber-700/40 rounded-lg text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong>Important:</strong> This SWMS was generated with AI assistance based on your estimate data. You are legally responsible as the PCBU for reviewing, verifying, and ensuring this document complies with all relevant WHS legislation before commencing any high-risk construction work. AI-generated rows are marked with an <span className="inline-block bg-emerald-950 text-emerald-400 px-1 rounded text-[10px]">AI</span> badge. <strong>Every edit you make teaches the AI your preferences.</strong>
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
                  disabled={isFinalized}
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
