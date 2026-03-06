import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type Step = "welcome" | "collecting" | "chat";
type UserType = "learner" | "coach";
type Msg = { role: "user" | "assistant"; content: string };

const LEARNER_FIELDS = [
  { key: "name", label: "What's your name?", placeholder: "Your full name", validate: (v: string) => v.trim().length >= 2 ? "" : "Please enter at least 2 characters" },
  { key: "whatsapp", label: "Your WhatsApp number?", placeholder: "+91 9876543210", validate: (v: string) => /^\+?\d{10,15}$/.test(v.replace(/\s/g, "")) ? "" : "Enter a valid phone number (10-15 digits)" },
  { key: "email", label: "Your email address?", placeholder: "you@example.com", validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter a valid email address" },
  { key: "experience", label: "Your experience level?", placeholder: "Select one", options: ["Beginner", "Intermediate", "Advanced"], validate: () => "" },
  { key: "industry", label: "Which industry are you in?", placeholder: "Select or type", options: ["IT", "Healthcare", "Finance", "Education", "Marketing", "Other"], validate: () => "" },
];

const COACH_FIELDS = [
  { key: "name", label: "What's your name?", placeholder: "Your full name", validate: (v: string) => v.trim().length >= 2 ? "" : "Please enter at least 2 characters" },
  { key: "whatsapp", label: "Your WhatsApp number?", placeholder: "+91 9876543210", validate: (v: string) => /^\+?\d{10,15}$/.test(v.replace(/\s/g, "")) ? "" : "Enter a valid phone number (10-15 digits)" },
  { key: "email", label: "Your email address?", placeholder: "you@example.com", validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter a valid email address" },
  { key: "company", label: "Your company name?", placeholder: "Company name", validate: (v: string) => v.trim().length >= 2 ? "" : "Please enter company name" },
  { key: "country", label: "Which country are you from?", placeholder: "Select or type", options: ["India", "USA", "UK", "Canada", "Australia", "Other"], validate: () => "" },
];

const WHATSAPP_AGENT_URL = "https://api.whatsapp.com/send?phone=919852411280&text=Hi%2C%20I%20want%20to%20know%20more%20about%20AI%20Coach%20Portal.";

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step, fieldIndex]);

  const fields = userType === "learner" ? LEARNER_FIELDS : COACH_FIELDS;

  const handleTypeSelect = (type: UserType) => {
    setUserType(type);
    setStep("collecting");
    setFieldIndex(0);
    setFormData({});
    setError("");
  };

  const selectOption = (value: string) => {
    setInput(value);
    // Auto-submit after a brief moment
    setTimeout(() => submitField(value), 100);
  };

  const submitField = async (value?: string) => {
    const val = (value ?? input).trim();
    if (!val) return;
    const field = fields[fieldIndex];

    const validationError = field.validate(val);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");

    const updated = { ...formData, [field.key]: val };
    setFormData(updated);
    setInput("");

    if (fieldIndex < fields.length - 1) {
      setFieldIndex(fieldIndex + 1);
    } else {
      const lead: Record<string, string> = {
        user_type: userType === "learner" ? "AI Learner" : "AI Coach",
        name: updated.name || "",
        whatsapp: updated.whatsapp || "",
        email: updated.email || "",
      };
      if (userType === "learner") {
        lead.experience = updated.experience || "";
        lead.industry = updated.industry || "";
      } else {
        lead.company = updated.company || "";
        lead.country = updated.country || "";
      }
      await supabase.from("chatbot_leads" as any).insert(lead as any);

      setStep("chat");
      setMessages([
        { role: "assistant", content: `Thanks ${updated.name}! 🎉 I'm your AI Coach Portal assistant. Ask me anything about our courses, coaches, webinars, or blogs!\n\nYou can also **chat with a live agent** anytime using the button below.` },
      ]);
    }
  };

  const handleFieldSubmit = () => submitField();

  const streamChat = async (allMessages: Msg[]) => {
    setIsStreaming(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: allMessages }),
        }
      );

      if (!resp.ok || !resp.body) {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again!" }]);
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > allMessages.length) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                }
                return [...prev, { role: "assistant", content: assistantText }];
              });
            }
          } catch { /* partial JSON */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setIsStreaming(false);
  };

  const handleChatSubmit = () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    streamChat(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      step === "chat" ? handleChatSubmit() : handleFieldSubmit();
    }
  };

  const currentField = step === "collecting" ? fields[fieldIndex] : null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
          aria-label="Open chatbot"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[370px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">AI Coach Portal Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-primary-foreground/20">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {step === "welcome" && (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-medium">👋 Welcome to AI Coach Portal!</p>
                  <p className="mt-1 text-muted-foreground">Are you an AI Learner or do you want to become an AI Coach?</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleTypeSelect("learner")} className="flex-1 rounded-lg border border-primary bg-primary/10 px-3 py-2.5 font-medium text-primary hover:bg-primary/20 transition-colors active:scale-95 touch-manipulation">
                    🎓 AI Learner
                  </button>
                  <button onClick={() => handleTypeSelect("coach")} className="flex-1 rounded-lg border border-primary bg-primary/10 px-3 py-2.5 font-medium text-primary hover:bg-primary/20 transition-colors active:scale-95 touch-manipulation">
                    🏆 AI Coach
                  </button>
                </div>
                {/* Chat with Agent */}
                <a
                  href={WHATSAPP_AGENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-[hsl(142,70%,45%)] bg-[hsl(142,70%,45%)]/10 px-3 py-2.5 font-medium text-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,45%)]/20 transition-colors active:scale-95 touch-manipulation"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat with Live Agent on WhatsApp
                </a>
              </div>
            )}

            {step === "collecting" && (
              <div className="space-y-3">
                {fields.slice(0, fieldIndex + 1).map((f, i) => (
                  <div key={f.key}>
                    <div className="rounded-lg bg-muted p-3 text-muted-foreground">{f.label}</div>
                    {i < fieldIndex && (
                      <div className="mt-1 ml-auto w-fit rounded-lg bg-primary/10 px-3 py-1.5 text-primary">{formData[f.key]}</div>
                    )}
                  </div>
                ))}

                {/* Tappable options for current field */}
                {currentField?.options && fieldIndex === fields.indexOf(currentField) && (
                  <div className="flex flex-wrap gap-2">
                    {currentField.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => selectOption(opt)}
                        className="rounded-lg border border-primary/50 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15 transition-colors active:scale-95 touch-manipulation"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {error && (
                  <p className="text-destructive text-xs font-medium px-1">{error}</p>
                )}
              </div>
            )}

            {step === "chat" && (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "assistant" && <Bot className="h-5 w-5 mt-0.5 shrink-0 text-primary" />}
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : m.content}
                    </div>
                    {m.role === "user" && <User className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />}
                  </div>
                ))}

                {isStreaming && (
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <span className="animate-pulse">●</span> Typing...
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chat with Agent bar (visible in chat step) */}
          {step === "chat" && (
            <div className="px-3 pb-1">
              <a
                href={WHATSAPP_AGENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-[hsl(142,70%,45%)]/10 px-2 py-1.5 text-xs font-medium text-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,45%)]/20 transition-colors active:scale-95 touch-manipulation"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat with Live Agent on WhatsApp
              </a>
            </div>
          )}

          {/* Input */}
          {step !== "welcome" && (
            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => { setInput(e.target.value); setError(""); }}
                  onKeyDown={handleKeyDown}
                  placeholder={step === "collecting" ? (currentField?.options ? "Or type here..." : currentField?.placeholder) : "Ask me anything..."}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  disabled={isStreaming}
                />
                <button
                  onClick={step === "chat" ? handleChatSubmit : handleFieldSubmit}
                  disabled={!input.trim() || isStreaming}
                  className="rounded-lg bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
