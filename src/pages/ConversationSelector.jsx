import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import {
    Archive,
    ArchiveRestore,
    Search,
    Trash2
} from "lucide-react";

export default function ConversationSelector() {
    const navigate = useNavigate();

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [savedId, setSavedId] = useState(null);

    const [showArchived, setShowArchived] = useState(false);
    const [search, setSearch] = useState("");

    const activeConversationId = localStorage.getItem("activeConversationId");

    /* ======================
       ICON BUTTON STYLES
       ====================== */
    const iconButtonStyle = (disabled) => ({
        padding: "8px 10px",
        marginRight: 6,
        borderRadius: 6,
        border: "1px solid #ccc",
        background: disabled ? "#f5f5f5" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
    });

    const iconStyle = (disabled) => ({
        color: disabled ? "#bbb" : "#333"
    });

    useEffect(() => {
        loadConversations();
    }, [showArchived]);

    async function loadConversations() {
        setLoading(true);

        const { data, error } = await supabase
            .from("conversations")
            .select("id, title, summary, updated_at, is_archived")
            .eq("is_archived", showArchived)
            .is("deleted_at", null)
            .order("updated_at", { ascending: false });

        if (error) setError(error.message);
        else setConversations(data || []);

        setLoading(false);
    }

    /* ======================
       CONVERSAȚIE NOUĂ
       ====================== */
    async function handleNewConversation() {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        const now = new Date();
        const title = `Chat ${now.toLocaleDateString("ro-RO")} / ${now.toLocaleTimeString(
            "ro-RO",
            { hour: "2-digit", minute: "2-digit" }
        )}`;

        await supabase
            .from("conversations")
            .update({ is_active: false })
            .eq("user_id", user.id);

        const { data: conversation } = await supabase
            .from("conversations")
            .insert({
                user_id: user.id,
                title,
                is_active: true,
                is_archived: false,
            })
            .select()
            .single();

        await supabase.from("conversation_state").insert({
            conversation_id: conversation.id,
            chat_mode: "new",
            message_count: 0,
            credit_used: 0,
        });

        localStorage.setItem("activeConversationId", conversation.id);
        navigate("/choose-mode");
    }

    /* ======================
       SELECTARE CONVERSAȚIE
       ====================== */
    async function handleSelectHistory(conversationId) {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        await supabase
            .from("conversations")
            .update({ is_active: false })
            .eq("user_id", user.id)
            .neq("id", conversationId);

        await supabase
            .from("conversations")
            .update({ is_active: true })
            .eq("id", conversationId);

        await supabase
            .from("conversation_state")
            .update({ chat_mode: "history" })
            .eq("conversation_id", conversationId);

        localStorage.setItem("activeConversationId", conversationId);
        navigate("/chat");
    }

    /* ======================
       EDITARE TITLU
       ====================== */
    function startEditing(c) {
        setEditingId(c.id);
        setEditingTitle(c.title || "");
    }

    function cancelEditing() {
        setEditingId(null);
        setEditingTitle("");
    }

    async function saveTitle(conversationId) {
        const newTitle = editingTitle.trim();
        if (!newTitle) {
            cancelEditing();
            return;
        }

        await supabase
            .from("conversations")
            .update({ title: newTitle.slice(0, 80) })
            .eq("id", conversationId);

        setConversations((prev) =>
            prev.map((c) =>
                c.id === conversationId ? { ...c, title: newTitle } : c
            )
        );

        setSavedId(conversationId);
        setTimeout(() => setSavedId(null), 1200);
        cancelEditing();
    }

    function handleKeyDown(e, id) {
        if (e.key === "Enter") {
            e.preventDefault();
            saveTitle(id);
        }
        if (e.key === "Escape") {
            e.preventDefault();
            cancelEditing();
        }
    }

    /* ======================
       SOFT DELETE
       ====================== */
    async function softDeleteConversation(id) {
        if (id === activeConversationId) return;

        if (!window.confirm("Sigur vrei să ștergi conversația?"))
            return;

        await supabase
            .from("conversations")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id);

        setConversations((prev) => prev.filter((c) => c.id !== id));
    }

    /* ======================
       ARHIVARE / RESTAURARE
       ====================== */
    async function archiveConversation(id) {
        if (id === activeConversationId) return;

        if (!window.confirm("Arhivezi această conversație?")) return;

        await supabase
            .from("conversations")
            .update({ is_archived: true, is_active: false })
            .eq("id", id);

        setConversations((prev) => prev.filter((c) => c.id !== id));
    }

    async function restoreConversation(id) {
        await supabase
            .from("conversations")
            .update({ is_archived: false })
            .eq("id", id);

        setConversations((prev) => prev.filter((c) => c.id !== id));
    }

    /* ======================
       FILTRARE
       ====================== */
    const filtered = conversations.filter((c) => {
        const q = search.toLowerCase();
        return (
            c.title?.toLowerCase().includes(q) ||
            c.summary?.toLowerCase().includes(q)
        );
    });

    /* ======================
       RENDER
       ====================== */
    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
            <h2>Conversații</h2>

            <button
                onClick={handleNewConversation}
                style={{ padding: "12px 20px", fontSize: 16, marginBottom: 16 }}
            >
                ➕ Conversație nouă
            </button>

            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", top: 10, left: 10 }} />
                    <input
                        placeholder="Caută conversație…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "100%", padding: "8px 8px 8px 32px" }}
                    />
                </div>
                <button onClick={() => setShowArchived((p) => !p)}>
                    {showArchived ? "⬅ Active" : "🗂 Arhivate"}
                </button>
            </div>

            {loading && <p>Se încarcă…</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {!loading && filtered.length > 0 && (
                <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse" }}>
                    <tbody>
                        {filtered.map((c) => {
                            const isActive = c.id === activeConversationId;

                            return (
                                <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
                                    <td>
                                        {editingId === c.id ? (
                                            <input
                                                autoFocus
                                                value={editingTitle}
                                                maxLength={80}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, c.id)}
                                                onBlur={() => saveTitle(c.id)}
                                                style={{ width: "100%" }}
                                            />
                                        ) : (
                                            <>
                                                <strong>{c.title}</strong>{" "}
                                                <button onClick={() => startEditing(c)}>✏️</button>
                                                {savedId === c.id && (
                                                    <span style={{ color: "green" }}> ✓</span>
                                                )}
                                            </>
                                        )}
                                    </td>

                                    <td>{c.summary?.slice(0, 120)}</td>

                                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                        {showArchived ? (
                                            <>
                                                <button
                                                    onClick={() => restoreConversation(c.id)}
                                                    disabled={isActive}
                                                    title={isActive ? "Conversația activă" : "Restaurează"}
                                                    style={iconButtonStyle(isActive)}
                                                >
                                                    <ArchiveRestore
                                                        size={18}
                                                        style={iconStyle(isActive)}
                                                    />
                                                </button>

                                                <button
                                                    onClick={() => softDeleteConversation(c.id)}
                                                    disabled={isActive}
                                                    title={isActive ? "Conversația activă" : "Șterge"}
                                                    style={iconButtonStyle(isActive)}
                                                >
                                                    <Trash2
                                                        size={18}
                                                        style={iconStyle(isActive)}
                                                    />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => archiveConversation(c.id)}
                                                    disabled={isActive}
                                                    title={isActive ? "Conversația activă" : "Arhivează"}
                                                    style={iconButtonStyle(isActive)}
                                                >
                                                    <Archive
                                                        size={18}
                                                        style={iconStyle(isActive)}
                                                    />
                                                </button>

                                                <button
                                                    onClick={() => handleSelectHistory(c.id)}
                                                    title="Deschide conversația"
                                                    style={iconButtonStyle(false)}
                                                >
                                                    ➜
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
