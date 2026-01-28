import { supabase } from '@/lib/supabaseClient';

/**
 * Salvează mesaje pentru o conversație (batch insert)
 * @param {string} conversationId
 * @param {Array<{role: string, content: string}>} messages
 */
export async function saveMessages(conversationId, messages) {
    if (!conversationId || !Array.isArray(messages) || messages.length === 0) {
        return;
    }

    const rows = messages.map(m => ({
        conversation_id: conversationId,
        role: m.role,
        content: m.content,
    }));

    const { error } = await supabase
        .from('messages')
        .insert(rows);

    if (error) {
        console.error('saveMessages error:', error);
        throw error;
    }
}
