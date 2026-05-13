import { useRef, useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
  Trash2,
} from "lucide-react";
import type { WorkActivity } from "../../../drizzle/schema";
import { HRCW_LABELS } from "../../../shared/compliance";

// ─── Signature Canvas ─────────────────────────────────────────────────────────

function SignatureCanvas({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getPos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e.nativeEvent as any);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e.nativeEvent as any);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const save = () => {
    if (!hasSignature) {
      toast.error("Please draw your signature first");
      return;
    }
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Draw Your Signature</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white relative">
        <canvas
          ref={canvasRef}
          width={500}
          height={120}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
            Sign here with your mouse or finger
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear} className="text-gray-600">
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Clear
        </Button>
        <Button type="button" size="sm" onClick={save} className="bg-[#FF2D78] hover:bg-[#e02268] text-white">
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          Confirm Signature
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SwmsSign() {
  const { token } = useParams<{ token: string }>();
  const [workerName, setWorkerName] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, error } = trpc.swms.getByToken.useQuery(
    { token: token! },
    { enabled: !!token }
  );
  const signMutation = trpc.swms.sign.useMutation();

  const handleSubmit = async () => {
    if (!workerName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!signature) {
      toast.error("Please draw your signature");
      return;
    }

    try {
      await signMutation.mutateAsync({
        token: token!,
        workerName: workerName.trim(),
        workerSignature: signature,
      });
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to submit signature");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF2D78]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">SWMS Not Found</h2>
          <p className="text-gray-500 text-sm">This link may have expired or is invalid. Contact your supervisor for a new link.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Signature Recorded</h2>
          <p className="text-gray-500 text-sm mb-4">
            Thank you, <strong>{workerName}</strong>. Your signature has been recorded. You confirm that you have read, understood, and agree to comply with this SWMS before commencing work.
          </p>
          <p className="text-xs text-gray-400">
            Signed at {new Date().toLocaleString("en-AU")}
          </p>
        </div>
      </div>
    );
  }

  const { swms: swmsData, signatures: existingSignatures } = data;
  const workActivities = (swmsData.workActivities as WorkActivity[]) || [];
  const hrcwCategories = (swmsData.hrcwCategories as string[]) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF2D78] to-[#FF6B35] text-white px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5" />
            <span className="font-bold text-lg">Safe Work Method Statement</span>
          </div>
          <div className="text-sm opacity-90">
            {swmsData.pcbuName || "Kindai Estimating"} · v{swmsData.version}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Before you sign:</strong> By signing this SWMS you confirm that you have read and understood all hazards, risks, and control measures listed below. You agree to comply with all requirements before and during work.
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Job Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {swmsData.pcbuName && (
              <><span className="text-gray-500">Business:</span><span className="font-medium">{swmsData.pcbuName}</span></>
            )}
            {swmsData.workLocation && (
              <><span className="text-gray-500">Work Location:</span><span className="font-medium">{swmsData.workLocation}</span></>
            )}
            {swmsData.worksManager && (
              <><span className="text-gray-500">Works Manager:</span><span className="font-medium">{swmsData.worksManager}</span></>
            )}
          </div>
        </div>

        {/* HRCW */}
        {hrcwCategories.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              High-Risk Construction Work Identified
            </h3>
            <div className="space-y-2">
              {hrcwCategories.map(cat => (
                <div key={cat} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded p-2">
                  <span className="text-red-500 shrink-0">▸</span>
                  {HRCW_LABELS[cat as keyof typeof HRCW_LABELS] || cat}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Activities */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Work Activities, Hazards & Controls</h3>
          <div className="space-y-4">
            {workActivities.map((activity, i) => (
              <div key={activity.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-[#FF2D78] text-white text-xs rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="font-medium text-gray-900">{activity.task}</span>
                  {activity.isAiGenerated && (
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">AI-assisted</Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  {activity.hazards.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Hazards & Risks</div>
                      <ul className="space-y-0.5">
                        {activity.hazards.map((h, j) => <li key={j} className="text-gray-700">• {h}</li>)}
                      </ul>
                    </div>
                  )}
                  {activity.controls.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Control Measures</div>
                      <ul className="space-y-0.5">
                        {activity.controls.map((c, j) => <li key={j} className="text-gray-700">• {c}</li>)}
                      </ul>
                    </div>
                  )}
                  {activity.ppe.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Required PPE</div>
                      <div className="flex flex-wrap gap-1">
                        {activity.ppe.map((p, j) => (
                          <span key={j} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Existing Signatures */}
        {existingSignatures.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Workers Who Have Signed ({existingSignatures.length})</h3>
            <div className="space-y-2">
              {existingSignatures.map(sig => (
                <div key={sig.id} className="flex items-center gap-3 p-2 bg-emerald-50 rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-medium text-gray-900">{sig.workerName}</span>
                  <span className="text-gray-400 text-xs ml-auto">
                    {new Date(sig.signedAt).toLocaleDateString("en-AU")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Worker Acknowledgement & Signature</h3>
          <p className="text-sm text-gray-600 mb-4">
            By signing below, I confirm I have read and understood this SWMS and agree to comply with all hazard controls and PPE requirements before commencing work.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name (Print)</label>
              <Input
                value={workerName}
                onChange={e => setWorkerName(e.target.value)}
                placeholder="Your full legal name"
                className="border-gray-300"
              />
            </div>
            {!signature ? (
              <SignatureCanvas onSave={setSignature} />
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Signature Captured</label>
                <div className="border border-emerald-300 rounded-lg bg-emerald-50 p-2 flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <img src={signature} alt="Your signature" className="h-10 bg-white rounded px-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-gray-500 text-xs"
                    onClick={() => setSignature(null)}
                  >
                    Redo
                  </Button>
                </div>
              </div>
            )}
            <Button
              className="w-full bg-[#FF2D78] hover:bg-[#e02268] text-white"
              onClick={handleSubmit}
              disabled={signMutation.isPending || !signature || !workerName.trim()}
            >
              {signMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />I Have Read and Agree to This SWMS</>
              )}
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 pb-6">
          Powered by <a href="https://kindaiestimator.com" className="text-[#FF2D78]">kindai</a> · Australian WHS Compliance Tools
        </div>
      </div>
    </div>
  );
}
