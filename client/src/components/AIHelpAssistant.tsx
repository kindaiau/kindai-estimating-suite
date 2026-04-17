import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  X, Send, Loader2, Sparkles, ChevronDown,
  Bot, User, Lightbulb
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
      content: "G'day! I'm your Kindai AI Assistant. I know every Australian trade, pricing, compliance rules, and how to use every feature in Kindai. What can I help you with today?",
      timestamp: new Date(),
    }
  ]);
  const [isMinimised, setIsMinimised] = useState(false);
  // panelOffset: how many px to lift the panel above the keyboard on iOS
  const [panelOffset, setPanelOffset] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: suggestionsData } = trpc.helpAssistant.getSuggestions.useQuery(
    { trade, page },
    { staleTime: 60_000 }
  );

  const chatMutation = trpc.helpAssistant.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      }]);
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I hit a snag. Try again in a moment.",
        timestamp: new Date(),
      }]);
    },
  });

  // Scroll to bottom whenever messages change
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimised && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimised]);

  // ── iOS / Android keyboard offset via visualViewport ──────────────────────
  // Strategy: measure how much the visual viewport has shrunk and shifted,
  // then translate the panel UP by that amount so the input stays visible.
  useEffect(() => {
    if (!isOpen) {
      setPanelOffset(0);
      return;
    }

    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // On iOS, when the keyboard appears:
      //   vv.height  < window.innerHeight  (viewport shrinks)
      //   vv.offsetTop > 0                 (viewport scrolls down)
      const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop;
      setPanelOffset(keyboardHeight > 50 ? keyboardHeight : 0);
      // After keyboard opens, scroll to latest message
      scrollToBottom();
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update(); // run once immediately

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [isOpen, scrollToBottom]);

  // Reset offset when closed
  useEffect(() => {
    if (!isOpen) setPanelOffset(0);
  }, [isOpen]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    chatMutation.mutate({
      message: text,
      trade,
      context,
      history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const suggestions = suggestionsData?.suggestions ?? [];

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-200 hover:scale-105"
          aria-label="Open AI Help Assistant"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm">Ask Kindai AI</span>
          {messages.length > 1 && (
            <Badge className="bg-white text-orange-600 text-xs px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
              {messages.filter(m => m.role === "assistant").length - 1}
            </Badge>
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/*
            Mobile layout:
              - position: fixed, inset-x-0, bottom-0
              - height: 85dvh (dvh = dynamic viewport height, shrinks with keyboard on modern browsers)
              - transform: translateY(-panelOffset) lifts the whole panel above the keyboard
                on older iOS that doesn't support dvh properly

            Desktop layout:
              - fixed size, bottom-right corner, no transform needed
          */}
          <div
            style={{
              transform: panelOffset > 0 ? `translateY(-${panelOffset}px)` : undefined,
              transition: "transform 0.2s ease-out",
            }}
            className={cn(
              "fixed z-50 bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col",
              // Mobile: full-width sheet anchored to bottom
              "inset-x-0 bottom-0 rounded-t-2xl",
              // Desktop: fixed card, bottom-right
              "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:rounded-2xl",
              // Height: dvh collapses when keyboard opens (modern iOS 15.4+, Android Chrome)
              // The translateY above handles older devices
              isMinimised ? "h-[56px]" : "h-[85dvh] sm:h-[520px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 rounded-t-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Kindai AI Assistant</p>
                  <p className="text-zinc-400 text-xs">
                    {trade ? `${trade} expert` : "All trades · Australian pricing"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimised(!isMinimised)}
                  className="text-zinc-400 hover:text-white p-1.5 rounded transition-colors hidden sm:block"
                >
                  <ChevronDown className={cn("w-4 h-4 transition-transform", isMinimised && "rotate-180")} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-400 hover:text-white p-1.5 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isMinimised && (
              <>
                {/* Messages — flex-1 fills available space, scrollable */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-4 py-3 space-y-3 overscroll-contain"
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center",
                        msg.role === "assistant"
                          ? "bg-gradient-to-br from-orange-500 to-amber-500"
                          : "bg-zinc-700"
                      )}>
                        {msg.role === "assistant"
                          ? <Bot className="w-4 h-4 text-white" />
                          : <User className="w-4 h-4 text-zinc-300" />
                        }
                      </div>
                      <div className={cn(
                        "max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                        msg.role === "assistant"
                          ? "bg-zinc-800 text-zinc-100"
                          : "bg-orange-500 text-white"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex-shrink-0 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-zinc-800 rounded-xl px-3 py-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                {messages.length <= 1 && suggestions.length > 0 && (
                  <div className="px-4 pb-2 flex-shrink-0">
                    <div className="flex items-center gap-1 mb-2">
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-zinc-500">Suggested questions</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {suggestions.slice(0, 3).map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestion(s)}
                          className="text-left text-xs text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 px-2 py-1.5 rounded-lg transition-colors truncate"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input bar — flex-shrink-0 so it's NEVER hidden */}
                <div
                  className="px-4 pt-2 border-t border-zinc-700 flex-shrink-0"
                  style={{
                    paddingBottom: panelOffset > 0
                      ? "0.75rem"
                      : "max(0.75rem, env(safe-area-inset-bottom))",
                  }}
                >
                  <div className="flex gap-2">
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask anything about estimating, pricing, compliance..."
                      className="flex-1 min-h-[44px] max-h-[100px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 text-sm resize-none rounded-xl"
                      rows={1}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || chatMutation.isPending}
                      size="icon"
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl flex-shrink-0 self-end h-11 w-11"
                    >
                      {chatMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1.5 text-center">
                    Powered by Kindai AI · Australian trade expertise
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
