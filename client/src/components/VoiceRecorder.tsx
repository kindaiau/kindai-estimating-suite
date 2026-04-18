import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  /** Called with the transcribed text when recording completes */
  onTranscript: (text: string) => void;
  /** Optional trade hint to improve transcription accuracy */
  trade?: string;
  /** Button label shown when idle */
  label?: string;
  className?: string;
  /** If true, shows a compact icon-only button */
  compact?: boolean;
}

type RecordingState = "idle" | "recording" | "uploading" | "transcribing" | "done";

export function VoiceRecorder({
  onTranscript,
  trade,
  label = "Speak Job Description",
  className,
  compact = false,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const uploadAudio = trpc.voice.uploadAudio.useMutation();
  const transcribe = trpc.voice.transcribe.useMutation();

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prefer webm/opus for best compression; fall back to whatever the browser supports
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopTimer();
        streamRef.current?.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size === 0) {
          toast.error("No audio captured. Please try again.");
          setState("idle");
          return;
        }

        // Convert blob → base64
        setState("uploading");
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );

        // Normalise MIME type for server enum
        const serverMime = mimeType.startsWith("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

        try {
          const { url } = await uploadAudio.mutateAsync({
            audioBase64: base64,
            contentType: serverMime as "audio/webm" | "audio/mp4",
          });

          setState("transcribing");
          const tradeHint = trade
            ? `Australian construction estimating. Trade: ${trade}.`
            : undefined;

          const { text } = await transcribe.mutateAsync({
            audioUrl: url,
            language: "en",
            prompt: tradeHint,
          });

          if (!text || text.trim().length === 0) {
            toast.error("Couldn't hear anything. Please try again in a quieter spot.");
            setState("idle");
            return;
          }

          onTranscript(text.trim());
          setState("done");
          toast.success("Voice transcribed — check the description field.");
          setTimeout(() => setState("idle"), 2500);
        } catch (err) {
          console.error("Voice transcription error:", err);
          toast.error("Transcription failed. Please type your description instead.");
          setState("idle");
        }
      };

      recorder.start(250); // collect chunks every 250ms
      setState("recording");
      setRecordingSeconds(0);
      timerRef.current = setInterval(
        () => setRecordingSeconds((s) => s + 1),
        1000
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        toast.error(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else {
        toast.error("Could not access microphone. Please type your description instead.");
      }
      setState("idle");
    }
  }, [trade, uploadAudio, transcribe, onTranscript, stopTimer]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    stopTimer();
  }, [stopTimer]);

  const handleClick = () => {
    if (state === "recording") {
      stopRecording();
    } else if (state === "idle") {
      startRecording();
    }
  };

  const isProcessing = state === "uploading" || state === "transcribing";

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={isProcessing}
        className={cn(
          "relative shrink-0 rounded-full transition-all",
          state === "recording" &&
            "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse",
          state === "done" && "text-green-600",
          className
        )}
        title={
          state === "recording"
            ? `Recording… ${recordingSeconds}s (tap to stop)`
            : state === "uploading"
            ? "Uploading audio…"
            : state === "transcribing"
            ? "Transcribing…"
            : "Speak your job description"
        }
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : state === "done" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : state === "recording" ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(
        "gap-2 rounded-xl border-2 transition-all font-semibold text-sm",
        state === "recording" &&
          "border-red-400 bg-red-50 text-red-600 hover:bg-red-100 animate-pulse",
        state === "done" &&
          "border-green-400 bg-green-50 text-green-700",
        state === "idle" &&
          "border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400",
        className
      )}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {state === "uploading" ? "Uploading…" : "Transcribing…"}
        </>
      ) : state === "done" ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Transcribed!
        </>
      ) : state === "recording" ? (
        <>
          <MicOff className="w-4 h-4" />
          Stop Recording ({recordingSeconds}s)
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          {label}
        </>
      )}
    </Button>
  );
}
