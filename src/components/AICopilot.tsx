"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  "Today's summary",
  "Critical wards?",
  "Recommend interventions",
  "Draft enforcement notice",
];

export function AICopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMessage: ChatMessage = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim() }),
        });

        const data = await res.json();

        if (data.error) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Error: ${data.error}` },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Connection error. Please check your network and try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        style={{ bottom: "3rem", right: "2rem" }}
        aria-label={open ? "Close AI Copilot" : "Open AI Copilot"}
      >
        <span className="material-symbols-outlined text-2xl">
          {open ? "close" : "smart_toy"}
        </span>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] bg-white z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ boxShadow: open ? "-8px 0 40px rgba(0,0,0,0.12)" : "none" }}
        role="dialog"
        aria-label="AI Copilot Chat"
      >
        {/* Glass Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(53,37,205,0.06) 0%, rgba(79,70,229,0.04) 100%)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(199,196,216,0.2)",
          }}
        >
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-lg text-on-primary">smart_toy</span>
          </div>
          <div className="flex-1">
            <h2 className="font-headline text-sm font-bold text-slate-900">AirGuard AI</h2>
            <p className="text-[10px] font-label text-slate-400 uppercase tracking-widest">
              Environmental Copilot
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close panel"
          >
            <span className="material-symbols-outlined text-lg text-slate-400">close</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-2xl bg-surface-low flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary">eco</span>
              </div>
              <div>
                <p className="font-headline text-base text-slate-900">How can I help?</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
                  Ask about air quality, ward data, interventions, or enforcement actions.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-on-primary rounded-2xl rounded-br-md"
                    : "bg-surface-low text-slate-800 rounded-2xl rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-low px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-slate-400 font-label">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-5 py-2 flex flex-wrap gap-2 shrink-0" style={{ borderTop: "1px solid rgba(199,196,216,0.15)" }}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              disabled={loading}
              className="px-3 py-1.5 text-[11px] font-label font-medium rounded-full bg-surface-low text-slate-600 hover:bg-primary hover:text-on-primary transition-colors duration-150 disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="px-5 py-4 shrink-0 flex items-center gap-2"
          style={{ borderTop: "1px solid rgba(199,196,216,0.15)" }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about air quality..."
            disabled={loading}
            className="flex-1 bg-surface-low rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            style={{ border: "none" }}
            aria-label="Chat message input"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-40"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </form>
      </div>

      {/* Backdrop when open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/10 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
