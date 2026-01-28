import { supabase } from '@/lib/supabaseClient';

/**
 * Returnează lista conversațiilor userului curent
 */
export async function loadConversations() {
    const { data, error } = await supabase
        .from('conversations')
        .select('id, title, summary, is_active, updated_at')
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

/**
 * Returnează conversația activă.
 * Dacă nu există, creează una nouă.
 */
export async function getActiveConversation() {
    // 1. încercăm să luăm conversația activă
    const { data: active, error } = await supabase
        .from('conversations')
        .select('id, summary')
        .eq('is_active', true)
        .maybeSingle();

    if (error) throw error;

    if (active) {
        return active;
    }

    // 2. siguranță: dezactivăm orice ar fi rămas activ
    await supabase
        .from('conversations')
        .update({ is_active: false })
        .eq('is_active', true);

    // 3. creăm o conversație nouă
    const { data: created, error: createError } = await supabase
        .from('conversations')
        .insert({
            title: 'New conversation',
            is_active: true,
        })
        .select('id, summary')
        .single();

    if (createError) throw createError;

    return created;
}
