import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Bot, User, ChevronLeft } from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: string;
  name: string;
  user_type: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

const LearnerChatHistory = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchLeads = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("chatbot_leads")
        .select("id, name, user_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setLeads((data as Lead[]) || []);
      setLoading(false);
    };
    fetchLeads();
  }, [user]);

  const openConversation = async (lead: Lead) => {
    setSelectedLead(lead);
    setLoadingMessages(true);
    const { data } = await supabase
      .from("chat_history")
      .select("id, role, content, created_at")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: true });
    setMessages((data as ChatMessage[]) || []);
    setLoadingMessages(false);
  };

  if (selectedLead) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSelectedLead(null); setMessages([]); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to conversations
        </button>

        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Conversation — {selectedLead.name}
          </h2>
          <span className="text-xs text-muted-foreground">
            {format(new Date(selectedLead.created_at), "dd MMM yyyy")}
          </span>
        </div>

        {loadingMessages ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No messages in this conversation</p>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && <Bot className="h-5 w-5 mt-1 shrink-0 text-primary" />}
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.content}
                  <div className="mt-1 text-[10px] opacity-60">
                    {format(new Date(m.created_at), "HH:mm")}
                  </div>
                </div>
                {m.role === "user" && <User className="h-5 w-5 mt-1 shrink-0 text-muted-foreground" />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">My Chat History</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No chat conversations yet</p>
          <p className="text-xs text-muted-foreground mt-1">Start a conversation with our AI assistant using the chat icon</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map(lead => (
            <button
              key={lead.id}
              onClick={() => openConversation(lead)}
              className="w-full rounded-lg border border-border bg-card p-4 text-left hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{lead.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${lead.user_type === "AI Learner" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"}`}>
                    {lead.user_type}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(lead.created_at), "dd MMM yyyy")}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerChatHistory;
