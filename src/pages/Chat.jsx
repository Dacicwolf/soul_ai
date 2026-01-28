import React, { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatBubble from "@/components/chat/ChatBubble";
import PaywallModal from "@/components/chat/PaywallModal";
import { supabase } from "@/lib/supabaseClient";
import { saveMessages } from "@/services/messages";
import { generateAndSaveSummary } from "@/services/summary";
import { useNavigate } from "react-router-dom";

const FREE_MESSAGES = 20; // păstrat pentru inițializare

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

const SYSTEM_PROMPTS = {
  adult_stresat:
    "Ești un companion AI empatic pentru un adult stresat. Răspunde calm, clar și fără judecată.",
  parinte:
    "Ești un companion AI empatic pentru un părinte. Oferă sprijin, claritate și echilibru.",
  tanar:
    "Ești un companion AI empatic pentru un tânăr. Folosește un ton prietenos și accesibil.",
};

function normalizeText(text) {
  if (typeof text !== "string") return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function selectPrepend(normalizedMessage, prepends) {
  if (!normalizedMessage || !prepends.length) return null;

  for (const p of prepends) {
    if (!p.is_active || !Array.isArray(p.keywords)) continue;
    for (const kw of p.keywords) {
      const k = normalizeText(kw);
      if (normalizedMessage.includes(k)) {
        return p;
      }
    }
  }
  return null;
}

export default function Chat() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const systemSentRef = useRef(false);

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

  const [userId, setUserId] = useState(null);

  // ======================
  // ★ MODIFICAT: COUNTER REAL (RPC)
  // ======================
  const [freeLeft, setFreeLeft] = useState(FREE_MESSAGES);
  const [creditsLeft, setCreditsLeft] = useState(0);

  const [showPaywall, setShowPaywall] = useState(false);
  const [prepends, setPrepends] = useState([]);

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
  }, [activeConversationId, mode, navigate, STORAGE_KEY]);

  // ======================
  // INIT COUNTER DIN DB
  // ======================
  useEffect(() => {
    async function loadCounters() {
      if (!activeConversationId) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("credits, free_messages_used")
        .single();

      if (error) {
        console.error("loadCounters error:", error);
        return;
      }

      const freeUsed = profile?.free_messages_used ?? 0;
      const credits = profile?.credits ?? 0;

      setCreditsLeft(credits);
      setFreeLeft(Math.max(20 - freeUsed, 0));
    }

    loadCounters();
  }, [activeConversationId]);


  /* ======================
     LOAD PREPENDS
     ====================== */
  useEffect(() => {
    async function loadPrepends() {
      const { data, error } = await supabase
        .from("prepends")
        .select("id, trigger_name, keywords, prompt, is_active");

      if (!error && Array.isArray(data)) {
        setPrepends(data);
      }
    }

    loadPrepends();
  }, []);

  /* ======================
     AUTOSCROLL
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

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setUserId(data.user.id);
      }
    }
    loadUser();
  }, []);

  /* ======================
     SEND MESSAGE
     ====================== */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);

    // ======================
    // ★ MODIFICAT: RPC CONSUME MESSAGE
    // ======================
    const { data: consumeResult, error: consumeError } =
      await supabase.rpc("consume_message", {
        p_conversation_id: activeConversationId,
      });

    if (consumeError) {
      console.error("consume_message error:", consumeError);
      setIsLoading(false);
      return;
    }

    const consume = consumeResult?.[0];

    if (!consume?.allowed) {
      setShowPaywall(true);
      setIsLoading(false);
      return;
    }

    // ★ MODIFICAT: update counter real
    setFreeLeft(consume.free_left);
    setCreditsLeft(consume.credits_left);

    const userMessage = inputValue.trim();
    setInputValue("");

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    const normalizedMessage = normalizeText(userMessage);
    const matchedPrepend = selectPrepend(normalizedMessage, prepends);

    if (matchedPrepend) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: matchedPrepend.prompt },
      ]);

      await saveMessages(activeConversationId, [
        { role: "user", content: userMessage },
        { role: "assistant", content: matchedPrepend.prompt },
      ]);

      setIsLoading(false);
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const recent = messages.slice(-5);

      const payloadMessages = [];

      if (!systemSentRef.current) {
        payloadMessages.push({
          role: "system",
          content: SYSTEM_PROMPTS[mode],
        });
        systemSentRef.current = true;
      }

      payloadMessages.push(
        ...recent.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage }
      );

      const { data } = await supabase.functions.invoke("chat-ai", {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body: {
          messages: payloadMessages,
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
     FINALIZE CONVERSATION
     ====================== */
  const finalizeConversation = async () => {
    try {
      if (messages.length > 1) {
        await generateAndSaveSummary(activeConversationId, messages);
      }
    } catch (err) {
      console.error("Eroare la generare summary:", err);
    }
  };

  const handleBack = async () => {
    setIsLoading(true);
    await finalizeConversation();
    setIsLoading(false);
    navigate("/conversation-selector");
  };

  const handleLogout = async () => {
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
              <div className="text-xs text-gray-500">{MODE_LABELS[mode]}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {/* ★ MODIFICAT: afișare counter real */}
            <span className="text-gray-600">
              {freeLeft + creditsLeft} mesaje
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
        messagesUsed={FREE_MESSAGES - freeLeft}
        paidRemaining={creditsLeft}
        userId={userId}
      />
    </div>
  );
}
