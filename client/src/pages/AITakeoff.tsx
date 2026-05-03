import { useState, useRef, useMemo, useEffect } from "react";
import { pixelUploadPlan, pixelRunTakeoff } from "@/lib/metaPixel";
import { getAnalyticsContext, trackEvent } from "@/lib/analytics";
import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { Camera, Upload, Zap, Loader2, FileImage, DollarSign,
  TrendingUp, Clock, Package, Users, ExternalLink, ChevronRight,
  Sparkles, ShieldCheck, ArrowRight, BarChart3, Truck, FileText, X as XIcon,
} from "lucide-react";
import { OrchestrationProgress } from "@/components/OrchestrationProgress";
import { TRADES } from "../../../shared/trades";
import ScopingQuestionsPanel from "@/components/ScopingQuestions";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { formatScopingAnswers, getScopingQuestions } from "../../../shared/scopingQuestions";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

type TakeoffItem = {
  description: string;
  unit: string;
  quantity: number;
  retailPrice: number;
  tradePrice: number;
  category: string;
  labourMinutes: number;
  wasteFactor: number;
};

type TakeoffResult = {
  items: TakeoffItem[];
  confidence: number;
  assumptions: string[];
  roomBreakdown: { room: string; items: string[] }[];
  planNotes: string;
};

export default function AITakeoff() {
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedTrade, setSelectedTrade] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [previewDataUrls, setPreviewDataUrls] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  // Legacy single-file aliases
  const uploadedImageUrl = uploadedImageUrls[0] ?? null;
  const previewDataUrl = previewDataUrls[0] ?? null;
  const [additionalContext, setAdditionalContext] = useState("");
  const [textDescription, setTextDescription] = useState("");
  const [mode, setMode] = useState<"vision" | "text">("vision");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<TakeoffResult | null>(null);
  const [markupPercent, setMarkupPercent] = useState(20);
  const [labourRate, setLabourRate] = useState(85);
  const [useTradePrice, setUseTradePrice] = useState(true);
  const [tempEstimateId, setTempEstimateId] = useState<number | null>(null);
  const [scopingAnswers, setScopingAnswers] = useState<Record<string, string | string[] | number>>({});
  const [activeTab, setActiveTab] = useState<"materials" | "labour" | "suppliers" | "summary">("materials");
  const [showOrchestration, setShowOrchestration] = useState(false);
  // Scope of Works document (optional second upload)
  const [scopeDocUrl, setScopeDocUrl] = useState<string | null>(null);
  const [scopeDocName, setScopeDocName] = useState<string | null>(null);
  const [isUploadingScopeDoc, setIsUploadingScopeDoc] = useState(false);
  const scopeDocInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    trackEvent("ai_takeoff_viewed", getAnalyticsContext());
  }, []);

  // Fetch saved trade profile defaults when trade is selected
  const tradeProfileQuery = trpc.tradeProfiles.get.useQuery(
    { trade: selectedTrade },
    { enabled: !!selectedTrade && isAuthenticated, staleTime: 60_000 }
  );

  // Apply saved rates when trade profile loads
  useEffect(() => {
    const profile = tradeProfileQuery.data;
    if (profile) {
      if (profile.defaultMarkup) setMarkupPercent(parseFloat(profile.defaultMarkup));
      if (profile.defaultLabourRate) setLabourRate(parseFloat(profile.defaultLabourRate));
    }
  }, [tradeProfileQuery.data]);

  const uploadPlan = trpc.ai.uploadPlan.useMutation();
  const uploadScopeDoc = trpc.ai.uploadScopeDoc.useMutation();
  const visionTakeoff = trpc.ai.visionTakeoff.useMutation();
  const textTakeoff = trpc.ai.analyzePlan.useMutation();
  const calcPricing = trpc.ai.calculatePricing.useMutation();
  const suppliersQuery = trpc.ai.getSuppliers.useQuery(
    { trade: selectedTrade, state: selectedState || undefined },
    { enabled: !!selectedTrade }
  );

  // Create a temp estimate for the AI to save data to
  const createProject = trpc.projects.create.useMutation();
  const createEstimate = trpc.estimates.create.useMutation();

  const pricing = useMemo(() => {
    if (!result) return null;
    const items = result.items.map(i => ({
      quantity: i.quantity,
      retailPrice: i.retailPrice,
      tradePrice: i.tradePrice,
      labourMinutes: i.labourMinutes,
      wasteFactor: i.wasteFactor,
    }));
    let totalMaterialsRetail = 0;
    let totalMaterialsTrade = 0;
    let totalLabourHours = 0;
    for (const item of items) {
      const wm = 1 + (item.wasteFactor / 100);
      const qty = item.quantity * wm;
      totalMaterialsRetail += qty * item.retailPrice;
      totalMaterialsTrade += qty * item.tradePrice;
      totalLabourHours += (item.quantity * item.labourMinutes) / 60;
    }
    const materialsCost = useTradePrice ? totalMaterialsTrade : totalMaterialsRetail;
    const labourCost = totalLabourHours * labourRate;
    const subtotal = materialsCost + labourCost;
    const markup = subtotal * (markupPercent / 100);
    const subtotalWithMarkup = subtotal + markup;
    const gst = subtotalWithMarkup * 0.1;
    const total = subtotalWithMarkup + gst;
    const savings = totalMaterialsRetail - totalMaterialsTrade;
    return {
      materialsCostRetail: Math.round(totalMaterialsRetail * 100) / 100,
      materialsCostTrade: Math.round(totalMaterialsTrade * 100) / 100,
      tradeSavings: Math.round(savings * 100) / 100,
      labourHours: Math.round(totalLabourHours * 10) / 10,
      labourCost: Math.round(labourCost * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      markupAmount: Math.round(markup * 100) / 100,
      subtotalWithMarkup: Math.round(subtotalWithMarkup * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [result, markupPercent, labourRate, useTradePrice]);

  async function ensureEstimate(): Promise<number> {
    if (tempEstimateId && !isNaN(tempEstimateId)) return tempEstimateId;
    if (!selectedTrade) throw new Error("Please select your trade first");
    const tradeName = TRADES.find(t => t.id === selectedTrade)?.name ?? selectedTrade;
    const proj = await createProject.mutateAsync({
      name: `AI Takeoff — ${tradeName} ${new Date().toLocaleDateString("en-AU")}`,
      trade: selectedTrade,
      state: (selectedState || "NSW") as any,
    });
    const projId = Number(proj.id);
    if (!projId || isNaN(projId)) throw new Error("Failed to create project — please try again");
    const est = await createEstimate.mutateAsync({
      projectId: projId,
      trade: selectedTrade,
      title: `AI Takeoff — ${tradeName}`,
    });
    const estId = Number(est.id);
    if (!estId || isNaN(estId)) throw new Error("Failed to create estimate — please try again");
    setTempEstimateId(estId);
    return estId;
  }

  async function addFiles(files: File[]) {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf", "image/heic", "image/heif"];
    const MAX_SIZE = 32 * 1024 * 1024;
    const MAX_PAGES = 50;
    const valid = files.filter(f => {
      // iOS sometimes reports HEIC with empty type — check extension as fallback
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const isHeic = f.type === "image/heic" || f.type === "image/heif" || ext === "heic" || ext === "heif";
      const effectiveType = isHeic ? "image/heic" : f.type;
      if (!allowed.includes(effectiveType)) { toast.error(`${f.name}: unsupported format. Use JPG, PNG, WebP, PDF, or HEIC.`); return false; }
      if (f.size > MAX_SIZE) { toast.error(`${f.name}: too large (max 32MB).`); return false; }
      return true;
    });
    if (uploadedFiles.length + valid.length > MAX_PAGES) {
      toast.error(`Max ${MAX_PAGES} pages per job.`);
      return;
    }
    if (valid.length === 0) return;
    setUploadedFiles(prev => [...prev, ...valid]);
    setUploadingCount(prev => prev + valid.length);
    setIsUploading(true);
    for (const file of valid) {
      try {
        const base64 = await fileToBase64(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewDataUrls(prev => [...prev, e.target?.result as string]);
        reader.readAsDataURL(file);
        const extUp = file.name.split(".").pop()?.toLowerCase() ?? "";
        const isHeicUp = file.type === "image/heic" || file.type === "image/heif" || extUp === "heic" || extUp === "heif";
        const ctUp = (isHeicUp ? "image/heic" : file.type) as "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | "image/heic" | "image/heif";
        const uploaded = await uploadPlan.mutateAsync({
          fileName: file.name, fileBase64: base64,
          contentType: ctUp,
        });
        setUploadedImageUrls(prev => [...prev, uploaded.url]);
        setUploadingCount(prev => Math.max(0, prev - 1));
        pixelUploadPlan({ trade: selectedTrade });
        trackEvent("ai_takeoff_file_uploaded", {
          trade: selectedTrade,
          state: selectedState,
          mode,
          fileType: ctUp,
          pageCount: uploadedFiles.length + valid.length,
        });
      } catch {
        toast.error(`Upload failed for ${file.name}.`);
        setUploadingCount(prev => Math.max(0, prev - 1));
        trackEvent("ai_takeoff_failed", {
          trade: selectedTrade,
          state: selectedState,
          mode,
          reason: "plan_upload_failed",
        });
      }
    }
    setIsUploading(false);
    if (valid.length > 0) toast.success(`${valid.length} page${valid.length > 1 ? 's' : ''} uploaded.`);
  }

  async function handleFileSelect(file: File) { await addFiles([file]); }

  function removePage(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewDataUrls(prev => prev.filter((_, i) => i !== index));
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
  }

  function clearAllPages() {
    setUploadedFiles([]); setPreviewDataUrls([]); setUploadedImageUrls([]);
    setUploadingCount(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  async function handleAnalyse() {
    if (!selectedTrade) {
      toast.error("Select your trade first");
      trackEvent("ai_takeoff_failed", { mode, reason: "validation_missing_trade" });
      return;
    }
    const missingRequired = getScopingQuestions(selectedTrade).filter((q) => {
      if (!q.required) return false;
      const value = scopingAnswers[q.id];
      return value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    });
    if (missingRequired.length > 0) {
      toast.error(`Answer ${missingRequired.length} required scope question${missingRequired.length > 1 ? "s" : ""} before analysing.`);
      trackEvent("ai_takeoff_failed", {
        trade: selectedTrade,
        state: selectedState,
        mode,
        reason: "validation_missing_scope",
        missingRequiredCount: missingRequired.length,
      });
      return;
    }
    if (mode === "vision" && uploadedImageUrls.length === 0) {
      toast.error("Upload at least one plan page first");
      trackEvent("ai_takeoff_failed", {
        trade: selectedTrade,
        state: selectedState,
        mode,
        reason: "validation_missing_plan",
      });
      return;
    }
    if (mode === "text" && textDescription.length < 10) {
      toast.error("Describe the job (at least 10 characters)");
      trackEvent("ai_takeoff_failed", {
        trade: selectedTrade,
        state: selectedState,
        mode,
        reason: "validation_description_too_short",
      });
      return;
    }

    setIsAnalysing(true);
    setResult(null);
    trackEvent("ai_takeoff_started", {
      trade: selectedTrade,
      state: selectedState,
      mode,
      pageCount: uploadedImageUrls.length,
      hasScopeDoc: Boolean(scopeDocUrl),
      scopingAnswerCount: Object.keys(scopingAnswers).length,
    });
    try {
      const estimateId = await ensureEstimate();
      // Show the orchestration progress UI
      setShowOrchestration(true);
      // The OrchestrationProgress component handles the SSE stream
      // onComplete and onError callbacks will update state
    } catch (err: any) {
      toast.error(err.message || "Failed to start analysis. Please try again.");
      setIsAnalysing(false);
      trackEvent("ai_takeoff_failed", {
        trade: selectedTrade,
        state: selectedState,
        mode,
        reason: "start_failed",
      });
    }
  }

  function handleOrchestrationComplete(result: unknown) {
    const takeoffResult = result as TakeoffResult;
    setResult(takeoffResult);
    setShowOrchestration(false);
    setIsAnalysing(false);
    toast.success(`Takeoff complete! ${takeoffResult.items.length} items found. Confidence: ${takeoffResult.confidence}%`);
    pixelRunTakeoff({ trade: selectedTrade, job_type: mode });
    trackEvent("ai_takeoff_succeeded", {
      trade: selectedTrade,
      state: selectedState,
      mode,
      itemCount: takeoffResult.items.length,
      confidence: takeoffResult.confidence,
      pageCount: uploadedImageUrls.length,
      hasScopeDoc: Boolean(scopeDocUrl),
    });
  }

  function handleOrchestrationError(message: string) {
    setShowOrchestration(false);
    setIsAnalysing(false);
    toast.error(message || "Analysis failed. Please try again.");
    trackEvent("ai_takeoff_failed", {
      trade: selectedTrade,
      state: selectedState,
      mode,
      reason: "orchestration_error",
    });
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const fmt = (n: number) => n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="AI Vision Takeoff | Scan Plans & Get Instant Quotes"
        description="Upload or photograph your construction plans. Kindai AI reads every symbol, counts every fixture, and generates a full materials and labour quote with GST automatically. All 20 Australian trades."
        canonical="/ai-takeoff"
        keywords="AI takeoff software Australia, construction plan scanning, automated quantity takeoff, AI estimating from plans, scan plans get quote, electrical plan takeoff, plumbing takeoff software"
        noIndex={false}
      />
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-pink-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500 rounded-full blur-[150px]" />
        </div>
        <div className="relative container mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-6">
            <img src={LOGO_URL} alt="Kindai" className="w-10 h-10" />
            <span className="text-white font-black text-xl">kindai</span>
            <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-xs font-bold">AI VISION</Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3">
            Scan a plan.{" "}
            <span className="bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Get your quote.
            </span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mb-6">
            Upload a photo or PDF of your plans. Our AI reads every symbol, counts every fixture,
            measures every room — and gives you a full materials list with retail vs trade pricing in seconds.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-yellow-400" /> AI-powered takeoff</span>
            <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-green-400" /> Retail vs trade pricing</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-blue-400" /> Australian compliant</span>
            <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-orange-400" /> Supplier recommendations</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN — Upload & Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Trade Selector */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-white" />
                  </span>
                  1. Select Your Trade
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Select
                  value={selectedTrade}
                  onValueChange={(value) => {
                    setSelectedTrade(value);
                    trackEvent("ai_takeoff_trade_selected", {
                      trade: value,
                      state: selectedState,
                      mode,
                    });
                  }}
                >
                  <SelectTrigger className={`rounded-xl ${!selectedTrade ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200'}`}>
                    <SelectValue placeholder="👇 Choose your trade first..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADES.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-3">
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="rounded-xl border-gray-200">
                      <SelectValue placeholder="State (for suppliers)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Mode Toggle */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <FileImage className="w-3.5 h-3.5 text-white" />
                  </span>
                  2. Upload Plan or Describe Job
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant={mode === "vision" ? "default" : "outline"}
                    className={`flex-1 rounded-xl text-xs font-bold ${mode === "vision" ? "bg-gradient-to-r from-pink-500 to-orange-500 border-0 text-white" : ""}`}
                    onClick={() => setMode("vision")}
                  >
                    <Camera className="w-3.5 h-3.5 mr-1" /> Scan Plan
                  </Button>
                  <Button
                    variant={mode === "text" ? "default" : "outline"}
                    className={`flex-1 rounded-xl text-xs font-bold ${mode === "text" ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-0 text-white" : ""}`}
                    onClick={() => setMode("text")}
                  >
                    <Package className="w-3.5 h-3.5 mr-1" /> Describe Job
                  </Button>
                </div>

                {mode === "vision" ? (
                  <div className="space-y-3">
                    {/* Drop zone — always visible so more pages can be added */}
                    <div className="space-y-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-pink-400 hover:bg-pink-50/50 transition-all cursor-pointer"
                      >
                        {isUploading ? (
                          <Loader2 className="w-7 h-7 mx-auto text-pink-500 animate-spin mb-1.5" />
                        ) : (
                          <Upload className="w-7 h-7 mx-auto text-gray-400 mb-1.5" />
                        )}
                        <p className="text-sm font-bold text-gray-600">
                          {uploadedFiles.length === 0 ? "Upload plans (up to 50 pages)" : `Add more pages (${uploadedFiles.length}/50)`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP, PDF — 32MB each</p>
                      </button>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl text-xs font-bold border-gray-200"
                        onClick={() => cameraInputRef.current?.click()}
                      >
                        <Camera className="w-3.5 h-3.5 mr-1" /> Take Photo with Camera
                      </Button>
                    </div>

                    {/* Upload status */}
                    {uploadingCount > 0 && (
                      <div className="flex items-center gap-1.5 px-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" />
                        <span className="text-xs text-gray-500">Uploading {uploadingCount} file{uploadingCount > 1 ? 's' : ''}...</span>
                      </div>
                    )}
                    {uploadingCount === 0 && uploadedImageUrls.length > 0 && (
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-green-500">✓</span>
                        <span className="text-xs text-green-600 font-semibold">{uploadedImageUrls.length} page{uploadedImageUrls.length > 1 ? 's' : ''} ready to analyse</span>
                      </div>
                    )}

                    {/* Page list */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-1.5 max-h-52 overflow-y-auto">
                        {uploadedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                            {previewDataUrls[idx] ? (
                              <img src={previewDataUrls[idx]} alt={`Page ${idx + 1}`} className="w-8 h-8 object-cover rounded flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                <FileImage className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-700 truncate">Page {idx + 1}: {file.name}</p>
                              <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(1)}MB</p>
                            </div>
                            {uploadedImageUrls[idx] ? (
                              <span className="text-green-500 text-xs flex-shrink-0">✓</span>
                            ) : (
                              <Loader2 className="w-3 h-3 animate-spin text-pink-400 flex-shrink-0" />
                            )}
                            <button onClick={() => removePage(idx)} className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0">
                              <span className="text-gray-400 text-xs">✕</span>
                            </button>
                          </div>
                        ))}
                        {uploadedFiles.length > 1 && (
                          <button onClick={clearAllPages} className="text-[10px] text-gray-400 hover:text-red-500 w-full text-center py-1">
                            Clear all pages
                          </button>
                        )}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.heic,.heif,application/pdf"
                      className="hidden"
                      multiple
                      onChange={(e) => { const files = Array.from(e.target.files ?? []); if (files.length) addFiles(files); e.target.value = ""; }}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                    {/* Scoping Questions */}
                    {selectedTrade && (
                      <ScopingQuestionsPanel
                        tradeId={selectedTrade}
                        onChange={setScopingAnswers}
                      />
                    )}
                    <div className="relative">
                      <Textarea
                        placeholder="Optional: Add extra context (e.g. '3-bed house, 180m², standard residential')"
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                        className="rounded-xl border-gray-200 text-sm min-h-[60px] pr-12"
                      />
                      <div className="absolute bottom-2 right-2">
                        <VoiceRecorder
                          compact
                          trade={selectedTrade}
                          onTranscript={(text) => setAdditionalContext((prev) => prev ? `${prev} ${text}` : text)}
                        />
                      </div>
                    </div>

                    {/* Scope of Works / Spec Sheet upload */}
                    <div className="border border-dashed border-gray-200 rounded-xl p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-xs font-medium text-gray-700">Scope of Works / Spec Sheet</span>
                          <span className="text-[10px] text-gray-400">(optional)</span>
                        </div>
                        {scopeDocUrl && (
                          <button
                            onClick={() => { setScopeDocUrl(null); setScopeDocName(null); }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {scopeDocUrl ? (
                        <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{scopeDocName}</span>
                          <span className="text-green-500 ml-auto flex-shrink-0">✓ Ready</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => scopeDocInputRef.current?.click()}
                          disabled={isUploadingScopeDoc}
                          className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-2 transition-colors border border-transparent hover:border-indigo-200"
                        >
                          {isUploadingScopeDoc ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                          ) : (
                            <><Upload className="w-3.5 h-3.5" /> Upload PDF or image spec sheet</>
                          )}
                        </button>
                      )}
                      <input
                        ref={scopeDocInputRef}
                        type="file"
                        accept="image/*,.pdf,.heic,.heif,application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingScopeDoc(true);
                          try {
                            const buffer = await file.arrayBuffer();
                            const bytes = new Uint8Array(buffer);
                            let binary = "";
                            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                            const base64 = btoa(binary);
                            const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
                            const isHeic = file.type === "image/heic" || file.type === "image/heif" || ext === "heic" || ext === "heif";
                            const contentType = isHeic ? "image/heic" : file.type.startsWith("image/") ? file.type as any : "application/pdf";
                            const result = await uploadScopeDoc.mutateAsync({ fileName: file.name, fileBase64: base64, contentType });
                            setScopeDocUrl(result.url);
                            setScopeDocName(file.name);
                            toast.success("Scope document uploaded — AI will cross-reference it with your plan");
                          } catch (err: any) {
                            toast.error(err.message ?? "Upload failed");
                          } finally {
                            setIsUploadingScopeDoc(false);
                            e.target.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Scoping Questions for text mode */}
                    {selectedTrade && (
                      <ScopingQuestionsPanel
                        tradeId={selectedTrade}
                        onChange={setScopingAnswers}
                      />
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">Job Description</span>
                        <VoiceRecorder
                          trade={selectedTrade}
                          label="Speak Description"
                          onTranscript={(text) => setTextDescription((prev) => prev ? `${prev} ${text}` : text)}
                        />
                      </div>
                      <Textarea
                        placeholder="Describe the job in detail. E.g.: '3-bedroom house, 180m². Need 20 power points, 15 light points, 1 switchboard upgrade, smoke alarms to all bedrooms and hallway. Standard residential wiring.'"
                        value={textDescription}
                        onChange={(e) => setTextDescription(e.target.value)}
                        className="rounded-xl border-gray-200 text-sm min-h-[140px]"
                      />
                    </div>
                  </div>
                )}

                {!selectedTrade && (mode === "vision" ? uploadedImageUrl : textDescription.length >= 10) && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700 font-semibold">
                    <span>⚠️</span> Select your trade above to run the analysis
                  </div>
                )}
                <Button
                  className="w-full rounded-xl font-black text-sm bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 border-0 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAnalyse}
                  disabled={isAnalysing || !selectedTrade || (mode === "vision" && !uploadedImageUrl) || (mode === "text" && textDescription.length < 10)}
                  title={!selectedTrade ? 'Select your trade first' : (mode === 'vision' && !uploadedImageUrl) ? 'Upload a plan first' : ''}
                >
                  {isAnalysing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analysing Plan...</>
                  ) : !selectedTrade ? (
                    <><Zap className="w-4 h-4 mr-2" /> Select Trade to Analyse</>
                  ) : (mode === "vision" && !uploadedImageUrl) ? (
                    <><Upload className="w-4 h-4 mr-2" /> Upload Plan to Analyse</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Analyse &amp; Generate Takeoff</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Pricing Controls */}
            {result && (
              <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-black flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <DollarSign className="w-3.5 h-3.5 text-white" />
                    </span>
                    3. Set Your Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold">Use Trade Pricing</Label>
                    <Switch
                      aria-label={useTradePrice ? "Disable trade pricing" : "Enable trade pricing"}
                      checked={useTradePrice}
                      onCheckedChange={setUseTradePrice}
                    />
                  </div>
                  {useTradePrice && pricing && (
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-green-600 font-bold">You save {fmt(pricing.tradeSavings)} with trade pricing</p>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-bold">Your Markup</Label>
                      <span className="text-sm font-black text-pink-600">{markupPercent}%</span>
                    </div>
                    <Slider
                      aria-label="Markup percentage"
                      value={[markupPercent]}
                      onValueChange={([v]) => setMarkupPercent(v)}
                      min={0} max={100} step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-bold">Labour Rate ($/hr)</Label>
                      <span className="text-sm font-black text-blue-600">${labourRate}</span>
                    </div>
                    <Slider
                      aria-label="Labour hourly rate"
                      value={[labourRate]}
                      onValueChange={([v]) => setLabourRate(v)}
                      min={40} max={200} step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>$40</span><span>$120</span><span>$200</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN — Results */}
          <div className="lg:col-span-2 space-y-4">
            {!result && !isAnalysing && (
              <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-10 h-10 text-pink-500" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 mb-2">Ready to Analyse</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Select your trade, upload a plan photo or describe the job, and our AI will generate
                    a complete materials takeoff with pricing in seconds.
                  </p>
                </CardContent>
              </Card>
            )}

            {isAnalysing && showOrchestration && tempEstimateId && (
              <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-900">AI Orchestration Running</h3>
                      <p className="text-xs text-gray-500">5-step pipeline — takes 30-60 seconds</p>
                    </div>
                  </div>
                  <OrchestrationProgress
                    estimateId={tempEstimateId}
                    trade={selectedTrade}
                    mode={mode}
                    imageUrls={mode === "vision" ? uploadedImageUrls : []}
                    planDescription={mode === "text" ? textDescription : undefined}
                    additionalContext={additionalContext || undefined}
                    projectDetails={additionalContext || undefined}
                    scopeDocUrl={scopeDocUrl ?? undefined}
                    onComplete={handleOrchestrationComplete}
                    onError={handleOrchestrationError}
                  />
                </CardContent>
              </Card>
            )}

            {isAnalysing && !showOrchestration && (
              <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-10 h-10 text-pink-500 mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-gray-500">Preparing analysis...</p>
                </CardContent>
              </Card>
            )}

            {result && pricing && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 font-bold">Total (inc GST)</p>
                      <p className="text-lg font-black text-gray-900">{fmt(pricing.total)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                    <CardContent className="p-4 text-center">
                      <Package className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 font-bold">Materials</p>
                      <p className="text-lg font-black text-gray-900">{fmt(useTradePrice ? pricing.materialsCostTrade : pricing.materialsCostRetail)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                    <CardContent className="p-4 text-center">
                      <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 font-bold">Labour</p>
                      <p className="text-lg font-black text-gray-900">{pricing.labourHours}h</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="w-5 h-5 text-pink-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 font-bold">Confidence</p>
                      <p className="text-lg font-black text-gray-900">{result.confidence}%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-md">
                  {(["materials", "labour", "suppliers", "summary"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all capitalize ${
                        activeTab === tab
                          ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Materials Tab */}
                {activeTab === "materials" && (
                  <Card className="border-0 shadow-md rounded-2xl">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-black">{result.items.length} Items Found</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <div className="overflow-auto max-h-[500px]">
                          <table className="w-full text-xs min-w-[640px]">
                            <thead className="sticky top-0 z-10">
                              <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left py-2.5 px-4 font-bold text-gray-500 bg-gray-50">Item</th>
                                <th className="text-center py-2.5 px-2 font-bold text-gray-500 bg-gray-50">Qty</th>
                                <th className="text-center py-2.5 px-2 font-bold text-gray-500 bg-gray-50">Unit</th>
                                <th className="text-right py-2.5 px-2 font-bold text-green-600 bg-gray-50">Trade $</th>
                                <th className="text-right py-2.5 px-2 font-bold text-gray-400 bg-gray-50">Retail $</th>
                                <th className="text-right py-2.5 px-2 font-bold text-gray-500 bg-gray-50">Waste</th>
                                <th className="text-right py-2.5 px-4 font-bold text-gray-500 bg-gray-50">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.items.map((item, i) => {
                                const price = useTradePrice ? item.tradePrice : item.retailPrice;
                                const wm = 1 + (item.wasteFactor / 100);
                                const total = item.quantity * wm * price;
                                return (
                                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <td className="py-2.5 px-4">
                                      <p className="font-bold text-gray-800">{item.description}</p>
                                      <Badge variant="outline" className="text-[10px] mt-0.5">{item.category}</Badge>
                                    </td>
                                    <td className="text-center py-2.5 px-2 font-bold">{item.quantity}</td>
                                    <td className="text-center py-2.5 px-2 text-gray-500">{item.unit}</td>
                                    <td className="text-right py-2.5 px-2 font-bold text-green-600">{fmt(item.tradePrice)}</td>
                                    <td className="text-right py-2.5 px-2 text-gray-400 line-through">{fmt(item.retailPrice)}</td>
                                    <td className="text-right py-2.5 px-2 text-gray-500">{item.wasteFactor}%</td>
                                    <td className="text-right py-2.5 px-4 font-black">{fmt(total)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Labour Tab */}
                {activeTab === "labour" && (
                  <Card className="border-0 shadow-md rounded-2xl">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-black">Labour Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <div className="overflow-auto max-h-[500px]">
                          <table className="w-full text-xs min-w-[500px]">
                            <thead className="sticky top-0 z-10">
                              <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left py-2.5 px-4 font-bold text-gray-500 bg-gray-50">Task</th>
                              <th className="text-center py-2.5 px-2 font-bold text-gray-500 bg-gray-50">Qty</th>
                              <th className="text-center py-2.5 px-2 font-bold text-gray-500 bg-gray-50">Min/unit</th>
                              <th className="text-right py-2.5 px-2 font-bold text-gray-500 bg-gray-50">Total Hours</th>
                              <th className="text-right py-2.5 px-4 font-bold text-gray-500 bg-gray-50">Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.items.filter(i => i.labourMinutes > 0).map((item, i) => {
                              const hours = (item.quantity * item.labourMinutes) / 60;
                              return (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                  <td className="py-2.5 px-4 font-bold text-gray-800">{item.description}</td>
                                  <td className="text-center py-2.5 px-2">{item.quantity}</td>
                                  <td className="text-center py-2.5 px-2">{item.labourMinutes}m</td>
                                  <td className="text-right py-2.5 px-2">{hours.toFixed(1)}h</td>
                                  <td className="text-right py-2.5 px-4 font-black">{fmt(hours * labourRate)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          </table>
                      </div>
                      <div className="p-4 bg-blue-50 border-t border-blue-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-blue-800">Total Labour</span>
                          <span className="text-lg font-black text-blue-800">{pricing.labourHours}h = {fmt(pricing.labourCost)}</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Based on ${labourRate}/hr rate. Adjust in the pricing controls.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Suppliers Tab */}
                {activeTab === "suppliers" && (
                  <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-black flex items-center gap-2">
                        <Truck className="w-4 h-4 text-orange-500" />
                        Recommended Suppliers
                        {selectedState && <Badge variant="outline" className="text-[10px]">{selectedState}</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      {suppliersQuery.data?.map((supplier, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${supplier.type === "trade" ? "bg-green-100" : "bg-gray-200"}`}>
                            <Package className={`w-5 h-5 ${supplier.type === "trade" ? "text-green-600" : "text-gray-500"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-gray-800">{supplier.name}</p>
                              <Badge className={`text-[10px] border-0 ${supplier.type === "trade" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                {supplier.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{supplier.notes}</p>
                          </div>
                          <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="rounded-lg text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" /> Visit
                            </Button>
                          </a>
                        </div>
                      ))}
                      {(!suppliersQuery.data || suppliersQuery.data.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-6">Select a trade and state to see supplier recommendations.</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Summary Tab */}
                {activeTab === "summary" && (
                  <div className="space-y-4">
                    {/* Pricing Summary */}
                    <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-black">Pricing Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Materials ({useTradePrice ? "Trade" : "Retail"})</span><span className="font-bold">{fmt(useTradePrice ? pricing.materialsCostTrade : pricing.materialsCostRetail)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Labour ({pricing.labourHours}h @ ${labourRate}/hr)</span><span className="font-bold">{fmt(pricing.labourCost)}</span></div>
                        <Separator />
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-bold">{fmt(pricing.subtotal)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Your Markup ({markupPercent}%)</span><span className="font-bold text-pink-600">+{fmt(pricing.markupAmount)}</span></div>
                        <Separator />
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal + Markup</span><span className="font-bold">{fmt(pricing.subtotalWithMarkup)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">GST (10%)</span><span className="font-bold">{fmt(pricing.gst)}</span></div>
                        <Separator />
                        <div className="flex justify-between text-base bg-gradient-to-r from-pink-50 to-orange-50 -mx-4 px-4 py-3 rounded-xl mt-2">
                          <span className="font-black text-gray-800">Total (inc GST)</span>
                          <span className="font-black text-2xl bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">{fmt(pricing.total)}</span>
                        </div>
                        {useTradePrice && (
                          <div className="bg-green-50 rounded-xl p-3 text-center mt-2">
                            <p className="text-xs font-bold text-green-700">Trade pricing saves you {fmt(pricing.tradeSavings)} on materials</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Assumptions */}
                    <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-black">AI Assumptions &amp; Notes</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-2">
                        {result.planNotes && (
                          <div className="bg-yellow-50 rounded-xl p-3 text-xs text-yellow-800">
                            <p className="font-bold mb-1">Plan Notes:</p>
                            <p>{result.planNotes}</p>
                          </div>
                        )}
                        <div className="space-y-1">
                          {result.assumptions.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                              <ChevronRight className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                              <span>{a}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Room Breakdown */}
                    {result.roomBreakdown.length > 0 && (
                      <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-sm font-black">Room Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-2">
                          {result.roomBreakdown.map((room, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl p-3">
                              <p className="text-xs font-black text-gray-800 mb-1">{room.room}</p>
                              <div className="flex flex-wrap gap-1">
                                {room.items.map((item, j) => (
                                  <Badge key={j} variant="outline" className="text-[10px]">{item}</Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
