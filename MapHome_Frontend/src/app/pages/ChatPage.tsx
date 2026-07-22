import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Plus, MessageSquare, Trash2, Menu, X, Sparkles, ChevronDown, Search, Home, FileText, MapPin, ArrowLeft } from "lucide-react";
import api, { AI_URL } from "@/app/utils/api";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Simple markdown renderer
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

interface ChatSession {
  _id: string;
  title: string;
  updatedAt: string;
}

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Xin chào! Tôi là trợ lý ảo MapHome. Bạn cần tìm phòng trọ hay có câu hỏi gì không?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [provider, setProvider] = useState<"auto" | "gemini" | "groq" | "openrouter" | "monica" | "github" | "sambanova">("auto");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const modelOptions: { value: "auto" | "gemini" | "groq" | "openrouter" | "monica" | "github" | "sambanova"; label: string; desc: string; icon: string }[] = [
    { value: "auto",        label: "✨ Auto",       desc: "Tự động chọn AI tốt nhất",       icon: "✨" },
    { value: "github",      label: "🐙 GitHub",     desc: "GitHub Models (GPT-4o)",         icon: "🐙" },
    { value: "sambanova",   label: "🚀 SambaNova",  desc: "Llama 3.1 70B (Siêu nhanh)",     icon: "🚀" },
    { value: "gemini",      label: "🔵 Gemini",     desc: "Google Gemini (tự động chọn phiên bản)",  icon: "🔵" },
    { value: "openrouter",  label: "🟢 OpenRouter", desc: "Gemini Flash Free via OpenRouter", icon: "🟢" },
    { value: "groq",        label: "🟡 Llama 3.3",  desc: "Meta Llama 3.3-70B via Groq",     icon: "🟡" },
    { value: "monica",      label: "🟣 Monica",     desc: "Monica AI (GPT-4o/Claude)",      icon: "🟣" },
  ];
  
  const currentModel = modelOptions.find((o) => o.value === provider) ?? modelOptions[0];

  const providerModelMap: Record<string, string> = {
    auto: "",
    github: "gpt-4o",
    sambanova: "Meta-Llama-3.3-70B-Instruct",
    monica: "gpt-4o",
    gemini: "gemini-2.5-flash",
    groq: "llama-3.3-70b-versatile",
    openrouter: "openrouter/free",
  };

  // Load sessions on mount
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      const res = await api.get("/api/chat/sessions");
      setSessions(res.data);
    } catch (error) {
      console.error("Failed to load sessions", error);
    }
  };

  const loadSessionDetails = async (id: string) => {
    try {
      const res = await api.get(`/api/chat/sessions/${id}`);
      const loadedMessages = res.data.messages.map((m: any) => ({
        text: m.content,
        role: m.role,
        timestamp: new Date(m.timestamp),
      }));
      setMessages(loadedMessages);
      setCurrentSessionId(id);
      if (window.innerWidth < 768) setIsSidebarOpen(false); // Auto close sidebar on mobile
    } catch (error) {
      toast.error("Không thể tải lịch sử đoạn chat");
    }
  };

  const createNewChat = () => {
    setCurrentSessionId(null);
    setMessages([
      {
        text: "Xin chào! Tôi là trợ lý ảo MapHome. Bạn cần tìm phòng trọ hay có câu hỏi gì không?",
        role: "assistant",
        timestamp: new Date(),
      },
    ]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/chat/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      if (currentSessionId === id) {
        createNewChat();
      }
      toast.success("Đã xoá đoạn chat");
    } catch (error) {
      toast.error("Lỗi khi xoá");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveSessionToBackend = async (
    currentId: string | null,
    finalMessages: Message[],
    firstUserMessageText?: string
  ) => {
    if (!user) return;
    try {
      const payload: any = {
        messages: finalMessages.map((m) => ({
          role: m.role,
          content: m.text,
          timestamp: m.timestamp,
        })),
      };
      
      if (currentId) {
        payload.sessionId = currentId;
      } else if (firstUserMessageText) {
        // Generate title for new chat
        const title = firstUserMessageText.split(" ").slice(0, 6).join(" ") + "...";
        payload.title = title;
      }

      const res = await api.post("/api/chat/sessions", payload);
      const savedSession = res.data;
      
      if (!currentId) {
        setCurrentSessionId(savedSession._id);
        setSessions((prev) => [
          { _id: savedSession._id, title: savedSession.title, updatedAt: savedSession.updatedAt },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error("Failed to save session", error);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessageText = message.trim();
    setMessage("");

    const newUserMsg: Message = {
      text: userMessageText,
      role: "user",
      timestamp: new Date(),
    };

    const currentMessages = [...messages, newUserMsg];
    setMessages(currentMessages);
    setIsLoading(true);

    const assistantMsgPlaceholder: Message = {
      text: "",
      role: "assistant",
      timestamp: new Date(),
    };
    setMessages([...currentMessages, assistantMsgPlaceholder]);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${AI_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": (import.meta as any).env?.VITE_MAPHOME_AI_API_KEY || "maphome_secret_key_123",
        },
        body: JSON.stringify({
          message: userMessageText,
          provider: provider,
          model: providerModelMap[provider] || undefined,
          history: currentMessages
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

      setIsLoading(false);

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
            } catch (err) {}
          }
        }
      }

      // Stream finished. Save to backend.
      if (user) {
        const finalMsgs = [...currentMessages, { text: accumulatedText, role: "assistant" as const, timestamp: new Date() }];
        // Wait for state to settle, then save
        saveSessionToBackend(currentSessionId, finalMsgs, currentMessages.length === 2 ? userMessageText : undefined);
      }

    } catch (error) {
      console.error("AI Chat Error:", error);
      setIsLoading(false);
      setMessages((prev) => {
        const newMsgs = [...prev];
        const lastIdx = newMsgs.length - 1;
        if (newMsgs[lastIdx].text === "") {
          newMsgs[lastIdx].text = "Xin lỗi, tôi đang gặp chút sự cố kỹ thuật. Vui lòng thử lại sau giây lát!";
        }
        return newMsgs;
      });
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-slate-50 border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col shadow-2xl md:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-white/50 backdrop-blur-sm">
          <Link to="/" className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" />
            MapHome
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <Button
            onClick={createNewChat}
            className="w-full justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white shadow-lg shadow-indigo-500/20 transition-all rounded-xl py-5"
          >
            <Plus size={18} />
            <span className="font-bold text-[15px]">Đoạn chat mới</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 no-scrollbar">
          <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Lịch sử trò chuyện</h3>
          
          {!user && (
            <div className="text-center p-4 text-sm text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm mx-2">
              Vui lòng <Link to="/login" className="text-indigo-600 font-bold hover:underline">Đăng nhập</Link> để lưu lịch sử chat.
            </div>
          )}
          
          {sessions.map((s) => (
            <div
              key={s._id}
              onClick={() => loadSessionDetails(s._id)}
              className={cn(
                "group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all",
                currentSessionId === s._id ? "bg-indigo-50 border border-indigo-100/50 shadow-sm" : "hover:bg-slate-100 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={cn(
                  "p-1.5 rounded-lg",
                  currentSessionId === s._id ? "bg-indigo-100 text-indigo-600" : "bg-white text-slate-400 border border-slate-200"
                )}>
                  <MessageSquare size={16} />
                </div>
                <span className={cn(
                  "truncate text-[14px]",
                  currentSessionId === s._id ? "text-indigo-700 font-bold" : "text-slate-600 font-medium"
                )}>{s.title}</span>
              </div>
              <button 
                onClick={(e) => deleteSession(s._id, e)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all p-1.5 rounded-md"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        
        {/* Header - Glassmorphism & Model Selector */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 shrink-0 bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link 
              to="/"
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-full transition-colors hidden md:flex"
              title="Về trang chủ"
            >
              <ArrowLeft size={22} />
            </Link>
            
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full md:hidden transition-colors"
            >
              <Menu size={22} />
            </button>

            {/* Mobile Back Button (only show when sidebar is hidden) */}
            <Link 
              to="/"
              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-full transition-colors md:hidden"
              title="Về trang chủ"
            >
              <ArrowLeft size={22} />
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                <Bot size={18} className="text-white" />
              </div>
              <h1 className="font-black text-slate-800 tracking-tight hidden sm:block">MapHome AI</h1>
            </div>
          </div>

          {/* Model Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen((v) => !v)}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full px-4 py-2 transition-all shadow-sm"
            >
              <span className="text-sm font-bold text-slate-700">{currentModel.label}</span>
              <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isModelDropdownOpen && "rotate-180")} />
            </button>
            
            <AnimatePresence>
              {isModelDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                >
                  {modelOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setProvider(opt.value); setIsModelDropdownOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition-colors",
                        provider === opt.value ? "bg-indigo-50/50 border-l-2 border-indigo-600" : ""
                      )}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-bold truncate", provider === opt.value ? "text-indigo-700" : "text-slate-700")}>{opt.label.replace(opt.icon + " ", "")}</p>
                        <p className="text-[11px] text-slate-400 truncate">{opt.desc}</p>
                      </div>
                      {provider === opt.value && <span className="text-indigo-600">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-slate-50/30">
          <div className="max-w-4xl mx-auto flex flex-col min-h-full">
            {messages.length === 1 && !currentSessionId ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 md:py-20">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-8 border border-white/20"
                >
                  <Sparkles size={40} className="text-white md:w-12 md:h-12" />
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4 text-center"
                >
                  Xin chào, {user?.fullName?.split(' ')[0] || user?.username || "bạn"}!
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-slate-500 text-lg md:text-xl text-center max-w-2xl font-medium px-4"
                >
                  Tôi là trợ lý AI thông minh của MapHome. Tôi có thể giúp gì cho bạn hôm nay?
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 w-full max-w-2xl px-4"
                >
                  {[
                    { icon: <Search size={20} className="text-indigo-500" />, title: "Tìm phòng trọ", desc: "Gợi ý các căn hộ, phòng trọ giá tốt", prompt: "Gợi ý cho tôi vài phòng trọ giá rẻ, an ninh tốt ở trung tâm thành phố." },
                    { icon: <MapPin size={20} className="text-purple-500" />, title: "Khám phá khu vực", desc: "Đánh giá tiện ích xung quanh", prompt: "Tiện ích và an ninh quanh khu vực Quận 7 như thế nào?" },
                    { icon: <FileText size={20} className="text-emerald-500" />, title: "Tư vấn hợp đồng", desc: "Lưu ý khi ký hợp đồng thuê", prompt: "Tôi cần lưu ý những điều khoản gì khi ký hợp đồng thuê phòng trọ?" },
                    { icon: <Home size={20} className="text-amber-500" />, title: "Kinh nghiệm thuê", desc: "Mẹo tìm phòng không bị lừa", prompt: "Cho tôi xin vài mẹo để tránh bị lừa đảo khi đi tìm phòng trọ nhé." }
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setMessage(item.prompt)}
                      className="flex flex-col items-start p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform mb-3 border border-slate-100">
                        {item.icon}
                      </div>
                      <h3 className="font-bold text-slate-700 mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </button>
                  ))}
                </motion.div>
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                {messages.map((msg, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    key={idx}
                    className={cn(
                      "flex gap-3 md:gap-5",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm text-sm font-bold",
                      msg.role === "user" ? "bg-white border border-slate-200 text-slate-600" : "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                    )}>
                      {msg.role === "user" ? ((user?.fullName || user?.username)?.charAt(0) || "U") : <Bot size={20} />}
                    </div>
                    
                    <div className={cn(
                      "flex flex-col max-w-[85%] md:max-w-[75%]",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div
                        className={cn(
                          "px-5 py-3.5 md:py-4 rounded-[24px] text-[15px] leading-relaxed shadow-sm",
                          msg.role === "user"
                            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm"
                            : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
                        )}
                        dangerouslySetInnerHTML={renderMarkdown(msg.text)}
                      />
                      <span className="text-[11px] text-slate-400 mt-2 font-medium px-2">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex gap-3 md:gap-5 flex-row">
                <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                  <Bot size={20} />
                </div>
                <div className="bg-white border border-slate-100 px-5 py-4 rounded-[24px] rounded-tl-sm flex items-center gap-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area - Redesigned Pill Style */}
        <div className="shrink-0 bg-white border-t border-slate-100 p-4 pb-6 md:p-6 md:pb-8">
          <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSend} className="relative flex items-center gap-3 bg-slate-50 border-2 border-slate-100 p-2 pl-6 rounded-full focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition-all shadow-inner">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập câu hỏi của bạn tại đây..."
                className="flex-1 bg-transparent border-none py-3 text-[15px] md:text-base text-slate-700 outline-none placeholder:text-slate-400 font-medium"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim() || isLoading}
                className="rounded-full w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:shadow-none shrink-0"
              >
                <Send size={20} className={message.trim() && !isLoading ? "ml-1" : ""} />
              </Button>
            </form>
            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400 font-medium">
              <Sparkles size={12} className="text-indigo-400" /> MapHome AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.
            </div>
          </div>
        </div>

      </div>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
