"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Minimize2,
  Maximize2,
  Lightbulb,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type AiContext = "setup_wizard" | "floor_planner" | "dashboard" | "general";

interface AiAssistantWidgetProps {
  context?: AiContext;
  currentStep?: string;
  wizardData?: Record<string, any>;
  /** External trigger — when this increments, the proactive help bubble shows */
  proactiveMessage?: string | null;
  onFloorPlanGenerated?: (layout: any) => void;
}

const QUICK_ACTIONS: Record<string, { label: string; message: string }[]> = {
  setup_wizard: [
    { label: "What should I do here?", message: "What should I do on this step? Explain briefly." },
    { label: "Give me an example", message: "Give me a real-world example of how to fill this step for my business type." },
    { label: "Help with services", message: "Help me decide what services/devices to add for my business." },
    { label: "Explain pricing", message: "How should I set up pricing and duration tiers?" },
  ],
  floor_planner: [
    { label: "Design my layout", message: "Design an optimal floor layout for my business based on my services." },
    { label: "Add more stations", message: "I want to add more stations. Where should they go?" },
    { label: "Optimize spacing", message: "Check my layout for spacing issues and suggest improvements." },
  ],
  dashboard: [
    { label: "Boost bookings", message: "How can I increase my bookings?" },
    { label: "Manage slots", message: "How do I block or manage time slots?" },
    { label: "Read reviews", message: "How do I manage customer reviews?" },
  ],
  general: [
    { label: "How does Bokingo work?", message: "Explain how Bokingo works in brief." },
    { label: "Help me get started", message: "I want to list my business. What are the steps?" },
  ],
};

export function AiAssistantWidget({
  context = "general",
  currentStep,
  wizardData,
  proactiveMessage,
  onFloorPlanGenerated,
}: AiAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showProactive, setShowProactive] = useState(false);
  const [proactiveText, setProactiveText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show proactive help bubble
  useEffect(() => {
    if (proactiveMessage && !isOpen) {
      setProactiveText(proactiveMessage);
      setShowProactive(true);
      const t = setTimeout(() => setShowProactive(false), 12000);
      return () => clearTimeout(t);
    }
  }, [proactiveMessage, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const history = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await api.post<{ reply: string; layout?: any }>(
          "/ai-assistant/chat",
          {
            message: text.trim(),
            context,
            currentStep,
            wizardData,
            conversationHistory: history,
          },
        );

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // If there's a floor plan layout in the response, emit it
        if (res.layout && onFloorPlanGenerated) {
          onFloorPlanGenerated(res.layout);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Sorry, I couldn't connect right now. Please try again in a moment!",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, context, currentStep, wizardData, onFloorPlanGenerated],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleProactiveClick = () => {
    setShowProactive(false);
    setIsOpen(true);
    if (proactiveText) {
      // Add the proactive message as assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: proactiveText,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const quickActions = QUICK_ACTIONS[context] || QUICK_ACTIONS.general;

  return (
    <>
      {/* Proactive help bubble */}
      <AnimatePresence>
        {showProactive && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-[60] max-w-xs cursor-pointer"
            onClick={handleProactiveClick}
          >
            <div className="relative bg-white rounded-2xl shadow-2xl border border-primary/20 p-4 pr-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProactive(false);
                }}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="flex items-start gap-3">
                <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">
                    Need help?
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {proactiveText}
                  </p>
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute -bottom-2 right-10 w-4 h-4 bg-white border-r border-b border-primary/20 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowProactive(false);
        }}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all",
          isOpen
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "bg-gradient-to-br from-primary to-accent text-white hover:shadow-primary/30 hover:scale-105",
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <Sparkles className="h-6 w-6" />
              {/* Pulse indicator */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 bg-white rounded-2xl shadow-2xl border border-border/60 flex flex-col overflow-hidden",
              isExpanded
                ? "bottom-4 right-4 left-4 top-4 sm:left-auto sm:top-4 sm:right-4 sm:bottom-4 sm:w-[560px]"
                : "bottom-24 right-6 w-[380px] max-h-[560px] h-[75vh]",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Bokingo AI
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Your setup assistant
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                  aria-label={isExpanded ? "Minimize" : "Maximize"}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
            >
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-base font-bold text-foreground mb-1">
                    Hi! I&apos;m Bokingo AI 👋
                  </h4>
                  <p className="text-sm text-muted-foreground mb-6 max-w-[280px] mx-auto leading-relaxed">
                    I can help you set up your business, design your floor plan,
                    and answer any questions.
                  </p>

                  {/* Quick actions */}
                  <div className="space-y-2">
                    {quickActions.map((qa) => (
                      <button
                        key={qa.label}
                        onClick={() => sendMessage(qa.message)}
                        className="w-full text-left px-4 py-2.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-sm text-foreground font-medium"
                      >
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2.5",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-muted/70 text-foreground rounded-bl-md",
                    )}
                  >
                    <MessageContent content={msg.content} />
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center mt-0.5">
                      <User className="h-3.5 w-3.5 text-foreground/60" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-muted/70 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" />
                      <span
                        className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-border/40 px-4 py-3 bg-white"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-muted/50 rounded-xl px-4 py-2.5 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0"
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">
                Powered by Bokingo AI · Answers may not be perfect
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Markdown-ish message renderer ───────────────────────────────────────────

function MessageContent({ content }: { content: string }) {
  // Simple markdown: bold, bullets, code blocks
  const parts = content.split(/(\*\*.*?\*\*|`[^`]+`|\n- |\n\d+\. )/g);

  return (
    <div className="whitespace-pre-wrap">
      {content.split("\n").map((line, i) => {
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-1.5 mt-1">
              <span className="text-primary mt-0.5">•</span>
              <span>{formatInline(line.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const [num, ...rest] = line.split(/\.\s/);
          return (
            <div key={i} className="flex gap-1.5 mt-1">
              <span className="text-primary font-semibold text-xs mt-0.5 min-w-[1rem]">
                {num}.
              </span>
              <span>{formatInline(rest.join(". "))}</span>
            </div>
          );
        }
        if (line.trim() === "") return <br key={i} />;
        return (
          <p key={i} className={i > 0 ? "mt-1.5" : ""}>
            {formatInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
