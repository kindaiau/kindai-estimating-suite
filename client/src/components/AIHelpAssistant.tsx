import { useState, useRef, useEffect } from "react";
// Design note: Australian workshop brutalism — keep the assistant practical, sturdy, mobile-first, and friction-free for on-site tradies.
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, X, Send, Loader2, Sparkles, ChevronDown,
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimised && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimised]);

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
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 group"
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
        <div
          className={cn(
            "fixed z-50 bg-zinc-900/98 border border-zinc-700 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 backdrop-blur-xl",
            isMinimised
              ? "left-3 right-3 bottom-3 top-auto h-[56px] rounded-2xl sm:left-auto sm:right-6 sm:w-[380px]"
              : "inset-x-3 top-3 bottom-3 rounded-[1.6rem] sm:top-auto sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px] sm:h-[520px] sm:inset-x-auto sm:rounded-2xl"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 rounded-t-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/20">
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
                className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
              >
                <ChevronDown className={cn("w-4 h-4 transition-transform", isMinimised && "rotate-180")} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimised && (
            <>
              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3"
              >
                <div className="space-y-3 pr-1">
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
                        "max-w-[85%] sm:max-w-[280px] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
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
              </div>

              {/* Suggestions */}
              {messages.length <= 1 && suggestions.length > 0 && (
                <div className="px-4 pb-2">
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

              {/* Input */}
              <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 border-t border-zinc-700 bg-zinc-900/95">
                <div className="flex gap-2">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about estimating, pricing, compliance..."
                    className="flex-1 min-h-[40px] max-h-[100px] bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 text-sm resize-none rounded-xl"
                    rows={1}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || chatMutation.isPending}
                    size="icon"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl flex-shrink-0 self-end"
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
      )}
    </>
  );
}
