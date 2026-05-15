/**
 * Safety Profile Setup Wizard
 *
 * Shown to first-time SWMS users who haven't set up their safety profile yet.
 * 3 steps:
 *   1. Upload an old SWMS PDF (optional — AI extracts your company standards)
 *   2. Set standard PPE list (checkboxes + custom entries)
 *   3. Confirmation — "Your AI is now calibrated"
 */

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowRight,
  Brain,
  CheckCircle,
  FileText,
  HardHat,
  Loader2,
  Plus,
  Shield,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

// ─── Standard PPE Items (Australian construction) ────────────────────────────

const STANDARD_PPE = [
  { title: "Hard hat (AS/NZS 1801)", description: "Class A or C hard hat for all site work", checked: true },
  { title: "Safety glasses (AS/NZS 1337)", description: "Clear or tinted safety glasses for all tasks", checked: true },
  { title: "Hi-vis vest (AS/NZS 4602)", description: "Day/night hi-vis vest — Class D/N as required", checked: true },
  { title: "Steel-cap boots (AS/NZS 2210.3)", description: "Steel or composite toe safety boots", checked: true },
  { title: "Hearing protection (AS/NZS 1270)", description: "Earplugs or earmuffs when noise exceeds 85dB", checked: false },
  { title: "P2 dust mask (AS/NZS 1716)", description: "P2 particulate respirator for dusty work", checked: false },
  { title: "Leather work gloves (AS/NZS 2161)", description: "General purpose work gloves", checked: false },
  { title: "Full-face shield", description: "Face shield for grinding, cutting, or chemical splash risk", checked: false },
  { title: "Fall arrest harness (AS/NZS 1891)", description: "Full body harness for work at heights above 2m", checked: false },
  { title: "Sun protection (SPF 50+)", description: "Sunscreen, hat, long sleeves for outdoor work", checked: false },
];

interface Props {
  onComplete: () => void;
}

export default function SafetyProfileWizard({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [ppeItems, setPpeItems] = useState(STANDARD_PPE.map(p => ({ ...p })));
  const [customPpe, setCustomPpe] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ extracted: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractPdfMutation = trpc.swms.extractFromPdf.useMutation();
  const saveMutation = trpc.swms.saveSafetyProfile.useMutation();

  // ─── Step 1: Upload old SWMS ───────────────────────────────────────────────

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File must be under 15MB");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        try {
          const result = await extractPdfMutation.mutateAsync({ pdfUrl: dataUrl });
          setUploadResult({ extracted: result.extracted });
          toast.success(`Extracted ${result.extracted} company procedures from your SWMS`);
        } catch (err: any) {
          toast.error(err.message || "Failed to extract procedures");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Upload failed");
      setIsUploading(false);
    }
  };

  // ─── Step 2: Save PPE ──────────────────────────────────────────────────────

  const handleSavePpe = async () => {
    const selectedItems = ppeItems
      .filter(p => p.checked)
      .map(p => ({
        category: "ppe" as const,
        title: p.title,
        description: p.description,
      }));

    if (selectedItems.length === 0) {
      toast.error("Select at least one PPE item");
      return;
    }

    try {
      await saveMutation.mutateAsync({ items: selectedItems });
      toast.success(`Saved ${selectedItems.length} PPE standards`);
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  const addCustomPpe = () => {
    if (!customPpe.trim()) return;
    setPpeItems(prev => [...prev, { title: customPpe.trim(), description: "Custom PPE item", checked: true }]);
    setCustomPpe("");
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF2D78] to-[#FF6B35] flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Safety Profile Setup</h1>
          <p className="text-white/50 text-sm max-w-sm mx-auto">
            Set up your company safety standards so Kindai generates SWMS that match how your business actually operates.
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                s === step
                  ? "bg-gradient-to-r from-[#FF2D78] to-[#FF6B35] scale-125"
                  : s < step
                  ? "bg-emerald-500"
                  : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Upload Old SWMS */}
        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Upload an old SWMS</h2>
                <p className="text-xs text-white/40">Optional — AI extracts your company procedures</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-blue-400/40 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
              {uploadResult ? (
                <div className="space-y-3">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                  <p className="text-emerald-300 font-bold">
                    Extracted {uploadResult.extracted} procedures
                  </p>
                  <p className="text-white/40 text-xs">Your AI is already learning your standards</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-10 h-10 text-white/30 mx-auto" />
                  <p className="text-white/50 text-sm">Drop a PDF here or click to upload</p>
                  <Button
                    variant="outline"
                    className="border-blue-400/40 text-blue-300 hover:bg-blue-500/10"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Extracting...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Choose PDF</>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white/60 hover:bg-white/5"
                onClick={() => setStep(2)}
              >
                Skip this step
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-[#FF2D78] to-[#FF6B35] text-white font-bold hover:opacity-90"
                onClick={() => setStep(2)}
                disabled={isUploading}
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Standard PPE */}
        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF2D78]/10 flex items-center justify-center">
                <HardHat className="w-5 h-5 text-[#FF2D78]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Your standard PPE</h2>
                <p className="text-xs text-white/40">Select what your crew wears on every job</p>
              </div>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {ppeItems.map((item, i) => (
                <label
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    item.checked
                      ? "bg-[#FF2D78]/5 border-[#FF2D78]/30"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {
                      setPpeItems(prev => prev.map((p, idx) => idx === i ? { ...p, checked: !p.checked } : p));
                    }}
                    className="mt-0.5 accent-[#FF2D78]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-white/40 truncate">{item.description}</div>
                  </div>
                  {i >= STANDARD_PPE.length && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setPpeItems(prev => prev.filter((_, idx) => idx !== i));
                      }}
                      className="text-white/30 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </label>
              ))}
            </div>

            {/* Add custom */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom PPE item..."
                value={customPpe}
                onChange={(e) => setCustomPpe(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomPpe()}
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30"
              />
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white/60 shrink-0"
                onClick={addCustomPpe}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-white/20 text-white/60 hover:bg-white/5"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-[#FF2D78] to-[#FF6B35] text-white font-bold hover:opacity-90"
                onClick={handleSavePpe}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                ) : (
                  <>Save PPE Standards <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Your AI is calibrated</h2>
            <p className="text-white/50 text-sm max-w-sm mx-auto">
              Every SWMS Kindai generates from now on will use your company's PPE standards, procedures, and terminology. The more you use it, the smarter it gets.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <Brain className="w-5 h-5 text-[#FF2D78] mx-auto mb-1" />
                <div className="text-xs text-white/50">Learns corrections</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <HardHat className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-xs text-white/50">Your PPE defaults</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <Shield className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <div className="text-xs text-white/50">Company procedures</div>
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#FF2D78] to-[#FF6B35] text-white font-bold py-3 rounded-xl hover:opacity-90"
              onClick={onComplete}
            >
              <CheckCircle className="w-5 h-5 mr-2" /> Start Creating SWMS
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
