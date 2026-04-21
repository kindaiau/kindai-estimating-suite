import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle, Brain, Ruler, DollarSign, ShieldCheck, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type StepStatus = "pending" | "running" | "done" | "error";

export interface OrchestrationStep {
  step: number;
  title: string;
  description: string;
  status: StepStatus;
  data?: Record<string, unknown>;
}

interface OrchestrationProgressProps {
  estimateId: number;
  trade: string;
  mode: "vision" | "text";
  imageUrls?: string[];
  planDescription?: string;
  additionalContext?: string;
  projectDetails?: string;
  scopeDocUrl?: string;
  onComplete: (result: unknown) => void;
  onError: (message: string) => void;
}

const STEP_ICONS = [Brain, Ruler, DollarSign, ShieldCheck, FileText];
const STEP_COLORS = [
  "from-purple-500 to-indigo-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
];

const INITIAL_STEPS: OrchestrationStep[] = [
  { step: 1, title: "Reading your plan", description: "Detecting project type, rooms, and complexity...", status: "pending" },
  { step: 2, title: "Extracting quantities", description: "Counting items, measuring areas, listing materials...", status: "pending" },
  { step: 3, title: "Applying prices", description: "Matching your price book and market benchmarks...", status: "pending" },
  { step: 4, title: "Checking your rules", description: "Margins, compliance, and missing items...", status: "pending" },
  { step: 5, title: "Building your quote", description: "Assembling the final estimate...", status: "pending" },
];

export function OrchestrationProgress({
  estimateId,
  trade,
  mode,
  imageUrls,
  planDescription,
  additionalContext,
  projectDetails,
  scopeDocUrl,
  onComplete,
  onError,
}: OrchestrationProgressProps) {
  const [steps, setSteps] = useState<OrchestrationStep[]>(INITIAL_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({
      estimateId: String(estimateId),
      trade,
      mode,
      ...(planDescription ? { planDescription } : {}),
      ...(additionalContext ? { additionalContext } : {}),
      ...(projectDetails ? { projectDetails } : {}),
      ...(scopeDocUrl ? { scopeDocUrl } : {}),
    });
    // Append each image URL as a separate param so multi-page PDFs send ALL pages
    if (imageUrls && imageUrls.length > 0) {
      imageUrls.forEach(url => params.append("imageUrl", url));
    }

    const url = `/api/orchestrated-takeoff?${params.toString()}`;

    const es = new EventSource(url);

    es.addEventListener("step", (e) => {
      const data = JSON.parse(e.data) as OrchestrationStep;
      setSteps(prev => prev.map(s => s.step === data.step ? { ...s, ...data } : s));
      if (data.status === "running") setCurrentStep(data.step);
    });

    es.addEventListener("complete", (e) => {
      es.close();
      const result = JSON.parse(e.data);
      onComplete(result);
    });

    es.addEventListener("error", (e) => {
      es.close();
      try {
        const data = JSON.parse((e as MessageEvent).data ?? "{}");
        onError(data.message ?? "AI processing failed");
      } catch {
        onError("AI processing failed");
      }
    });

    // Fallback: if SSE native error fires (connection drop)
    es.onerror = () => {
      es.close();
      onError("Connection to AI server lost. Please try again.");
    };

    return () => {
      es.close();
      controller.abort();
    };
  }, [estimateId, trade, mode, JSON.stringify(imageUrls), planDescription, additionalContext, projectDetails]);

  const completedCount = steps.filter(s => s.status === "done").length;
  const progress = (completedCount / 5) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Overall progress bar */}
      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[i];
          const colorClass = STEP_COLORS[i];
          const isActive = step.status === "running";
          const isDone = step.status === "done";
          const isPending = step.status === "pending";

          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                isActive
                  ? "bg-white border-orange-200 shadow-md shadow-orange-100"
                  : isDone
                  ? "bg-green-50/60 border-green-200"
                  : "bg-gray-50/50 border-gray-100 opacity-60"
              }`}
            >
              {/* Icon */}
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                isDone
                  ? "bg-green-500"
                  : isActive
                  ? `bg-gradient-to-br ${colorClass}`
                  : "bg-gray-200"
              }`}>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 text-gray-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${isDone ? "text-green-700" : isActive ? "text-gray-900" : "text-gray-400"}`}>
                    {step.title}
                  </span>
                  {isActive && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] font-bold px-1.5 py-0">
                      RUNNING
                    </Badge>
                  )}
                  {isDone && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold px-1.5 py-0">
                      DONE
                    </Badge>
                  )}
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={step.description}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`text-xs mt-0.5 ${isDone ? "text-green-600" : isActive ? "text-gray-500" : "text-gray-400"}`}
                  >
                    {step.description}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Step number */}
              <span className={`shrink-0 text-xs font-black ${isDone ? "text-green-500" : isActive ? "text-orange-500" : "text-gray-300"}`}>
                {step.step}/5
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Orchestrated AI — 5-step pipeline
        </span>
        <span>{completedCount}/5 steps complete</span>
      </div>
    </div>
  );
}
