import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, Send, X, Bot, Loader2, Sparkles } from "lucide-react";
import api, { API_BASE, AI_URL } from "@/app/utils/api";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Simple markdown renderer: supports **bold**, *italic*, and newlines
const renderMarkdown = (text: string) => {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
  return { __html: html };
};

interface Message {
  text: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export const AIChatAssistant: React.FC = () => {
  const location = useLocation();

  // Excluded paths where AI Chat should not appear
  const excludedPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/admin/login",
  ];
  const isExcludedPage = excludedPaths.includes(location.pathname);

  if (isExcludedPage) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Xin chào! Tôi là trợ lý ảo MapHome. Tôi có thể giúp gì cho bạn hôm nay?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<"auto" | "gemini" | "groq" | "openrouter">("auto");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Danh sách model có thể chọn
  const modelOptions: { value: "auto" | "gemini" | "groq" | "openrouter"; label: string; desc: string; icon: string }[] = [
    { value: "auto",        label: "✨ Auto",       desc: "Tự động chọn AI tốt nhất",       icon: "✨" },
    { value: "gemini",      label: "🔵 Gemini",     desc: "Google Gemini (tự động chọn phiên bản)",  icon: "🔵" },
    { value: "openrouter",  label: "🟢 OpenRouter", desc: "Gemini Flash Free via OpenRouter", icon: "🟢" },
    { value: "groq",        label: "🟡 Llama 3.3",  desc: "Meta Llama 3.3-70B via Groq",     icon: "🟡" },
  ];
  const currentModel = modelOptions.find((o) => o.value === provider) ?? modelOptions[0];

  // Map provider → model name cụ thể để gửi lên backend
  const providerModelMap: Record<string, string> = {
    auto: "",
    gemini: "gemini-2.5-flash",
    groq: "llama-3.3-70b-versatile",
    openrouter: "openrouter/free",
  };
  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to detect current property ID from URL and handle visibility
  useEffect(() => {
    const handleLocationChange = () => {
      const path = location.pathname;
      const match = path.match(/\/room\/([a-zA-Z0-9]+)/);
      const id = match ? match[1] : null;
      setCurrentPropertyId(id);

      if (id && messages.length === 1 && messages[0].role === "assistant") {
        setMessages([
          {
            text: "Tôi thấy bạn đang xem căn phòng này. Bạn có thắc mắc gì về tiện ích hay giá thuê không? Tôi có thể giải đáp ngay!",
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
      }
    };

    handleLocationChange();
  }, [location.pathname, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");

    const newUserMsg: Message = {
      text: userMessage,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    // Prepare an empty assistant message for streaming
    const assistantMsgPlaceholder: Message = {
      text: "",
      role: "assistant",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsgPlaceholder]);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${AI_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": (import.meta as any).env?.VITE_MAPHOME_AI_API_KEY || "maphome_secret_key_123", // API Key bảo vệ server Python
        },
        body: JSON.stringify({
          message: userMessage,
          propertyId: currentPropertyId,
          provider: provider,
          model: providerModelMap[provider] || undefined,
          history: messages
            .filter((_, idx) => idx > 0)
            .map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.text,
            })),
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finished = false;
      let accumulatedText = "";

      setIsLoading(false); // Hide thinking indicator once streaming starts

      while (!finished) {
        const { value, done } = await reader.read();
        finished = done;
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              finished = true;
              break;
            }

            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                accumulatedText += data.content;
                // Update the last message (the assistant's placeholder)
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const lastIdx = newMsgs.length - 1;
                  newMsgs[lastIdx] = {
                    ...newMsgs[lastIdx],
                    text: accumulatedText,
                  };
                  return newMsgs;
                });
              }
            } catch (err) {
              // Ignore partial JSON or noise
            }
          }
        }
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      setIsLoading(false);
      setMessages((prev) => {
        const newMsgs = [...prev];
        // Replace last placeholder with error if it was empty
        const lastIdx = newMsgs.length - 1;
        if (newMsgs[lastIdx].text === "") {
          newMsgs[lastIdx].text =
            "Xin lỗi, tôi đang gặp chút sự cố kỹ thuật. Vui lòng thử lại sau giây lát!";
        }
        return newMsgs;
      });
    }
  };

  return (
    <>
      {/* Chat Window - anchored independently from bottom-24 to leave room for buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[580px] max-h-[calc(100vh-140px)] rounded-[32px] shadow-[0_20px_50px_rgba(79,70,229,0.15)] border border-white/40 bg-white/90 backdrop-blur-2xl overflow-hidden flex flex-col"
          >
            {/* Header - Vibrant Gradient */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-6 text-white relative shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-12 w-12 flex items-center justify-center bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shadow-inner">
                    <Bot size={28} className="text-white" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-indigo-600 rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-none tracking-tight">
                    MapHome AI
                  </h3>
                  <p className="text-indigo-100/80 text-[11px] font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-indigo-100 rounded-full animate-pulse"></span>
                    Trợ lý ảo thông minh
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              {/* Model Selector Dropdown */}
              <div className="relative mt-4">
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 bg-black/20 hover:bg-black/30 border border-white/15 rounded-xl px-3 py-2 transition-all backdrop-blur-md"
                >
                  <span className="text-[12px] font-bold text-white">{currentModel.label}</span>
                  <span className="text-white/70 text-[10px]">{currentModel.desc}</span>
                  <svg className={cn("w-3 h-3 text-white/70 transition-transform", isModelDropdownOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <AnimatePresence>
                  {isModelDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden"
                    >
                      {modelOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setProvider(opt.value); setIsModelDropdownOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-indigo-50",
                            provider === opt.value ? "bg-indigo-50 border-l-2 border-indigo-500" : ""
                          )}
                        >
                          <span className="text-base">{opt.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[13px] font-bold truncate", provider === opt.value ? "text-indigo-700" : "text-gray-800")}>{opt.label.replace(opt.icon + " ", "")}</p>
                            <p className="text-[11px] text-gray-400 truncate">{opt.desc}</p>
                          </div>
                          {provider === opt.value && <span className="text-indigo-500">✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Messages Area - Clean & Spaced */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth no-scrollbar">
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={cn(
                    "flex flex-col",
                    msg.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-5 py-3.5 rounded-[24px] text-sm leading-relaxed shadow-sm",
                      msg.role === "user"
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none"
                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-none font-medium",
                    )}
                    dangerouslySetInnerHTML={renderMarkdown(msg.text)}
                  />
                  <span className="text-[10px] text-slate-400 mt-2 font-bold px-2">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex flex-col items-start animate-pulse">
                  <div className="bg-white border border-slate-100 px-5 py-3.5 rounded-[24px] rounded-tl-none flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      MapHome đang xử lý...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Pill Style */}
            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 pl-5 rounded-[20px] focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all shadow-inner"
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hỏi tôi bất cứ điều gì..."
                  className="flex-1 bg-transparent border-none py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 font-medium"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!message.trim() || isLoading}
                  className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white h-11 w-11 shrink-0 shadow-lg shadow-indigo-500/20 transform active:scale-90 transition-all border-none"
                >
                  <Send size={18} />
                </Button>
              </form>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Sparkles size={10} className="text-indigo-400" />
                <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  Powered by MapHome Intelligence
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button - redesigned to match premium style */}
      <motion.button
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-[100] group transition-all duration-300",
          isOpen
            ? "bg-slate-800 text-white shadow-slate-900/40"
            : "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-500/40 hover:shadow-indigo-500/60",
        )}
      >
        <motion.div
          animate={isOpen ? { rotate: 0 } : { y: [0, -2, 0] }}
          transition={isOpen ? {} : { duration: 2, repeat: Infinity }}
        >
          {isOpen ? (
            <X size={28} />
          ) : (
            <Sparkles className="size-8 group-hover:scale-110 transition-transform" />
          )}
        </motion.div>

        {!isOpen && (
          <div className="absolute right-full mr-4 bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-2 rounded-xl shadow-xl border border-indigo-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-4 group-hover:translate-x-0 whitespace-nowrap">
            <p className="text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-widest">
              Trò chuyện với AI
            </p>
          </div>
        )}
      </motion.button>
    </>
  );
};
