import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatBubble from "@/components/chat/ChatBubble";
import PaywallModal from "@/components/chat/PaywallModal";
import { supabase } from "@/lib/supabaseClient";
import { saveMessages } from "@/services/messages";
import { generateAndSaveSummary } from "@/services/summary";
import { useNavigate } from "react-router-dom";

const FREE_MESSAGES = 10;

const MODE_LABELS = {
  adult_stresat: "Adult stresat",
  parinte: "Părinte",
  tanar: "Tânăr",
};

const INITIAL_MESSAGES = {
  adult_stresat: "Bună! Sunt aici să te ascult.",
  parinte: "Bună! Sunt aici să te ascult.",
  tanar: "Hey! Sunt aici să te ascult.",
};

export default function Chat() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const mode =
    new URLSearchParams(window.location.search).get("mode") ||
    "adult_stresat";

  const activeConversationId = localStorage.getItem("activeConversationId");
  const STORAGE_KEY = activeConversationId
    ? `chat_draft_${activeConversationId}`
    : null;

  const [messages, setMessages] = useState([]);
  const [conversationSummary, setConversationSummary] = useState("");
  const [chatMode, setChatMode] = useState("new");

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [freeMessagesUsed, setFreeMessagesUsed] = useState(0);
  const [paidMessagesRemaining] = useState(999);
  const [showPaywall, setShowPaywall] = useState(false);

  /* ======================
     LOAD META + DRAFT
     ====================== */
  useEffect(() => {
    async function load() {
      if (!activeConversationId) {
        navigate("/conversation-selector");
        return;
      }

      const { data: state } = await supabase
        .from("conversation_state")
        .select("chat_mode")
        .eq("conversation_id", activeConversationId)
        .single();

      if (state?.chat_mode) setChatMode(state.chat_mode);

      const { data: convo } = await supabase
        .from("conversations")
        .select("summary")
        .eq("id", activeConversationId)
        .single();

      if (convo?.summary) setConversationSummary(convo.summary);

      if (STORAGE_KEY) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed);
              return;
            }
          } catch { }
        }
      }

      setMessages([{ role: "assistant", content: INITIAL_MESSAGES[mode] }]);
    }

    load();
  }, [activeConversationId, mode]);

  /* ======================
     AUTOSCROLL + FOCUS
     ====================== */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!isLoading) inputRef.current?.focus();
  }, [messages, isLoading]);

  /* ======================
     SAVE DRAFT LOCAL
     ====================== */
  useEffect(() => {
    if (STORAGE_KEY && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, STORAGE_KEY]);

  /* ======================
     ENSURE CONVERSATION EXISTS
     ====================== */
  const ensureConversationExists = useCallback(async () => {
    if (!activeConversationId) return;

    const { data } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", activeConversationId)
      .single();

    if (!data) {
      await supabase.from("conversations").insert({
        id: activeConversationId,
        title: `Chat ${new Date().toLocaleString()}`,
      });
    }
  }, [activeConversationId]);

  /* ======================
     SAVE SUMMARY + TITLE
     ====================== */
  const saveConversation = useCallback(async () => {
    if (!activeConversationId) return;

    const real = messages.filter(m => m.role !== "system");
    if (real.length <= 1) return;

    await generateAndSaveSummary(activeConversationId, real);

    const { data: convo } = await supabase
      .from("conversations")
      .select("summary, title")
      .eq("id", activeConversationId)
      .single();

    if (
      convo?.summary &&
      (!convo.title || convo.title.startsWith("Chat "))
    ) {
      const newTitle = convo.summary.split(".")[0].slice(0, 60);
      await supabase
        .from("conversations")
        .update({ title: newTitle })
        .eq("id", activeConversationId);
    }

    if (STORAGE_KEY) localStorage.removeItem(STORAGE_KEY);
  }, [messages, activeConversationId, STORAGE_KEY]);

  /* ======================
     SEND MESSAGE
     ====================== */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (freeMessagesUsed >= FREE_MESSAGES && paidMessagesRemaining <= 0) {
      setShowPaywall(true);
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setFreeMessagesUsed(p => Math.min(p + 1, FREE_MESSAGES));

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const { data: session } = await supabase.auth.getSession();
      const recent = messages.slice(-5);

      const { data } = await supabase.functions.invoke("chat-ai", {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body: {
          messages: [
            ...recent.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage },
          ],
          summary: conversationSummary,
        },
      });

      const aiReply = data?.content || "(Răspuns gol)";
      setMessages(prev => [...prev, { role: "assistant", content: aiReply }]);

      await saveMessages(activeConversationId, [
        { role: "user", content: userMessage },
        { role: "assistant", content: aiReply },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ======================
     BACK / LOGOUT
     ====================== */
  const handleBack = async () => {
    await ensureConversationExists();
    await saveConversation();
    navigate("/conversation-selector");
  };

  const handleLogout = async () => {
    await ensureConversationExists();
    await saveConversation();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  /* ======================
     RENDER
     ====================== */
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50">
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft />
            </Button>
            <div>
              <div className="font-medium">Companion AI</div>
              <div className="text-xs text-gray-500">
                {MODE_LABELS[mode]}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">
              {FREE_MESSAGES - freeMessagesUsed + paidMessagesRemaining} mesaje
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {chatMode === "history" && conversationSummary && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm">
              <strong>Rezumat conversație:</strong>
              <p className="mt-1">{conversationSummary}</p>
            </div>
          )}

          {messages.map((m, i) => (
            <ChatBubble
              key={i}
              message={m.content}
              isUser={m.role === "user"}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="border-t bg-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendMessage()}
            placeholder="Scrie un mesaj..."
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </div>
  );
}
