/**
 * EstimateAgentChat
 * A floating chat bubble on the EstimateBuilder page that lets the user
 * edit the estimate conversationally:
 *   "Add 10 hours commissioning at $120/hr"
 *   "Remove the provisional sum"
 *   "What's my current total?"
 *
 * After each action the parent is notified so it can refetch line items.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, Loader2, X, Wand2, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: Array<{ tool: string; result: string }>;
}

interface EstimateAgentChatProps {
  estimateId: number;
  trade?: string;
  /** Called after any successful edit so the parent can refetch line items */
  onEstimateChanged?: () => void;
}

const QUICK_ACTIONS = [
  "What's my current total?",
  "Add a 5% contingency item",
  "Add 2 hours site supervision at $110/hr",
  "Show me items with the highest cost",
];

export function EstimateAgentChat({ estimateId, trade, onEstimateChanged }: EstimateAgentChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimised, setIsMinimised] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `G'day! I'm your Estimate Agent. I can directly edit this estimate — just tell me what to add, remove, or change. Try: "Add 10 hours commissioning at $120/hr"`,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.estimateAgent.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          actions: data.actions.map((a) => ({ tool: a.tool, result: a.result })),
        },
      ]);
      if (data.actions.length > 0) {
        onEstimateChanged?.();
        toast.success(`Estimate updated — ${data.actions.length} change${data.actions.length > 1 ? "s" : ""} made`);
      }
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    },
  });

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

  useEffect(() => {
    if (isOpen && !isMinimised && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimised]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    chatMutation.mutate({
      estimateId,
      message: text,
      history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toolLabel: Record<string, string> = {
    add_line_item: "Added item",
    update_line_item: "Updated item",
    delete_line_item: "Deleted item",
    get_estimate_summary: "Checked totals",
  };

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl px-4 py-3 shadow-xl shadow-violet-500/30 transition-all hover:scale-105 active:scale-95"
          title="Edit estimate with AI"
        >
          <Wand2 className="w-4 h-4" />
          <span className="text-sm font-semibold">Edit with AI</span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 w-[360px] bg-zinc-900 rounded-2xl shadow-2xl shadow-black/40 border border-zinc-700 flex flex-col transition-all",
            isMinimised ? "h-14" : "h-[480px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Wand2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Estimate Agent</p>
                <p className="text-[10px] text-zinc-400">Edit this estimate by talking to me</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => setIsMinimised((v) => !v)}
              >
                <ChevronDown className={cn("w-4 h-4 transition-transform", isMinimised && "rotate-180")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimised && (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center",
                        msg.role === "assistant"
                          ? "bg-gradient-to-br from-violet-500 to-purple-600"
                          : "bg-zinc-700"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <Wand2 className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-zinc-300" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1 max-w-[78%]">
                      <div
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm leading-relaxed",
                          msg.role === "assistant"
                            ? "bg-zinc-800 text-zinc-100"
                            : "bg-violet-600 text-white"
                        )}
                      >
                        {msg.content}
                      </div>
                      {/* Show action badges */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {msg.actions.map((action, j) => (
                            <Badge
                              key={j}
                              variant="outline"
                              className="text-[10px] border-green-600 text-green-400 bg-green-950/40 gap-1"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {toolLabel[action.tool] ?? action.tool}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0 flex items-center justify-center">
                      <Wand2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-zinc-800 rounded-xl px-3 py-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick actions */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex-shrink-0">
                  <p className="text-[10px] text-zinc-500 mb-1.5">Quick actions:</p>
                  <div className="flex flex-col gap-1">
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(action);
                          inputRef.current?.focus();
                        }}
                        className="text-left text-xs text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 px-2 py-1.5 rounded-lg transition-colors truncate"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="px-4 pt-2 pb-4 border-t border-zinc-700 flex-shrink-0">
                <div className="flex gap-2">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add, remove, or change anything..."
                    className="flex-1 min-h-[44px] max-h-[100px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 text-sm resize-none rounded-xl"
                    rows={1}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || chatMutation.isPending}
                    size="icon"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl flex-shrink-0 self-end h-11 w-11"
                  >
                    {chatMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
