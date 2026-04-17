import { useEffect, useRef, useState } from "react";
// Design note: Australian workshop brutalism — keep the assistant practical, sturdy, mobile-first, and friction-free for on-site tradies.
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Send,
  Loader2,
  Sparkles,
  ChevronDown,
  Bot,
  User,
  Lightbulb,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIHelpAssistantProps {
  trade?: string;
  page?: string;
  context?: string;
}

export default function AIHelpAssistant({ trade, page, context }: AIHelpAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "G'day! I'm your Kindai AI Assistant. I know every Australian trade, pricing, compliance rules, and how to use every feature in Kindai. What can I help you with today?",
      timestamp: new Date(),
    },
  ]);
  const [isMinimised, setIsMinimised] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: suggestionsData } = trpc.helpAssistant.getSuggestions.useQuery(
    { trade, page },
    { staleTime: 60_000 },
  );

  const chatMutation = trpc.helpAssistant.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I hit a snag. Try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimised]);

  useEffect(() => {
    if (isOpen && !isMinimised && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimised]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const syncMobileState = () => setIsMobile(mediaQuery.matches);
    syncMobileState();

    mediaQuery.addEventListener("change", syncMobileState);
    return () => mediaQuery.removeEventListener("change", syncMobileState);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const shouldLockBody = isMobile && isOpen && !isMinimised;
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    if (shouldLockBody) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [isMobile, isOpen, isMinimised]);

  const openAssistant = () => {
    setIsMinimised(false);
    setIsOpen(true);
  };

  const closeAssistant = () => {
    setIsMinimised(false);
    setIsOpen(false);
  };

  const toggleMinimised = () => {
    if (!isOpen) {
      openAssistant();
      return;
    }
    setIsMinimised((prev) => !prev);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    chatMutation.mutate({
      message: text,
      trade,
      context,
      history: messages.slice(-8).map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    openAssistant();
    setInput(suggestion);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const suggestions = suggestionsData?.suggestions ?? [];
  const replyCount = Math.max(messages.filter((message) => message.role === "assistant").length - 1, 0);

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={openAssistant}
          className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-white shadow-2xl transition-all duration-200 hover:scale-[1.02] hover:from-orange-600 hover:to-amber-600 sm:bottom-6 sm:right-6"
          aria-label="Open AI Help Assistant"
        >
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold text-sm">Ask Kindai AI</span>
          {replyCount > 0 && (
            <Badge className="flex h-[18px] min-w-[18px] items-center justify-center bg-white px-1.5 py-0 text-xs text-orange-600">
              {replyCount}
            </Badge>
          )}
        </button>
      )}

      {isOpen && !isMinimised && isMobile && (
        <button
          type="button"
          aria-label="Minimise assistant background"
          onClick={() => setIsMinimised(true)}
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
        />
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal={isMobile && !isMinimised ? "true" : "false"}
          aria-label="Kindai AI Assistant"
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border border-zinc-700 bg-zinc-900/98 shadow-2xl backdrop-blur-xl transition-all duration-200",
            isMobile
              ? isMinimised
                ? "bottom-3 left-3 right-3 top-auto h-[64px] rounded-2xl"
                : "inset-0 h-[100dvh] w-screen rounded-none border-none"
              : isMinimised
                ? "bottom-6 right-6 h-[56px] w-[380px] rounded-2xl"
                : "bottom-6 right-6 h-[520px] w-[380px] rounded-2xl",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between border-b border-zinc-700 bg-gradient-to-r from-orange-500/20 to-amber-500/20 px-4 py-3",
              isMobile && !isMinimised && "pt-[max(0.9rem,env(safe-area-inset-top))]",
            )}
          >
            <button
              type="button"
              onClick={() => isMinimised && setIsMinimised(false)}
              className="flex min-w-0 items-center gap-2 text-left"
              aria-label={isMinimised ? "Reopen assistant" : "Kindai AI Assistant"}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">Kindai AI Assistant</p>
                <p className="truncate text-xs text-zinc-400">
                  {trade ? `${trade} expert` : "All trades · Australian pricing"}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleMinimised}
                className="rounded p-1 text-zinc-400 transition-colors hover:text-white"
                aria-label={isMinimised ? "Expand assistant" : "Minimise assistant"}
              >
                {isMinimised ? (
                  <Maximize2 className="h-4 w-4" />
                ) : isMobile ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={closeAssistant}
                className="rounded p-1 text-zinc-400 transition-colors hover:text-white"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimised && (
            <>
              <div
                ref={scrollRef}
                className={cn(
                  "flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 [scrollbar-gutter:stable]",
                  isMobile && "touch-pan-y pb-4",
                )}
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="space-y-3 pr-1">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}-${message.timestamp.getTime()}`}
                      className={cn("flex gap-2", message.role === "user" ? "flex-row-reverse" : "flex-row")}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                          message.role === "assistant"
                            ? "bg-gradient-to-br from-orange-500 to-amber-500"
                            : "bg-zinc-700",
                        )}
                      >
                        {message.role === "assistant" ? (
                          <Bot className="h-4 w-4 text-white" />
                        ) : (
                          <User className="h-4 w-4 text-zinc-300" />
                        )}
                      </div>

                      <div
                        className={cn(
                          "max-w-[85%] break-words whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed",
                          isMobile ? "max-w-[88%]" : "sm:max-w-[280px]",
                          message.role === "assistant"
                            ? "bg-zinc-800 text-zinc-100"
                            : "bg-orange-500 text-white",
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {chatMutation.isPending && (
                    <div className="flex gap-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex items-center gap-1 rounded-xl bg-zinc-800 px-3 py-2">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400 [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {messages.length <= 1 && suggestions.length > 0 && (
                <div className="px-4 pb-2">
                  <div className="mb-2 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-amber-400" />
                    <span className="text-xs text-zinc-500">Suggested questions</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {suggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={`${suggestion}-${index}`}
                        type="button"
                        onClick={() => handleSuggestion(suggestion)}
                        className="truncate rounded-lg px-2 py-1.5 text-left text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-orange-400"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "border-t border-zinc-700 bg-zinc-900/95 px-4 pt-2",
                  isMobile ? "pb-[max(1rem,env(safe-area-inset-bottom))]" : "pb-4",
                )}
              >
                <div className="flex gap-2">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about estimating, pricing, compliance..."
                    className="min-h-[44px] max-h-[120px] flex-1 resize-none rounded-xl border-zinc-700 bg-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500"
                    rows={1}
                  />
                  <Button
                    type="button"
                    onClick={sendMessage}
                    disabled={!input.trim() || chatMutation.isPending}
                    size="icon"
                    className="h-11 flex-shrink-0 self-end rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600"
                  >
                    {chatMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-1.5 text-center text-xs text-zinc-600">
                  Powered by Kindai AI · Australian trade expertise
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
