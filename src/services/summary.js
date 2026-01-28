import { supabase } from '@/lib/supabaseClient';

/**
 * Generează și salvează SUMMARY + TITLE pentru o conversație
 *
 * REGULI:
 * - SUMMARY: persoana I ("eu"), 1–3 propoziții, concret
 * - TITLE: titlu semantic + data (DD.MM.YYYY)
 * - TITLE se suprascrie DOAR dacă este generic (ex: "Chat 27.01.2026 / 17:41")
 */
export async function generateAndSaveSummary(conversationId, messages) {
    if (!conversationId || !Array.isArray(messages) || messages.length === 0) {
        return;
    }

    // ======================
    // FOLOSIM DOAR MESAJELE USERULUI
    // ======================
    const userMessages = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .slice(-10);

    if (userMessages.length === 0) return;

    // ======================
    // DATA CURENTĂ (DD.MM.YYYY)
    // ======================
    const now = new Date();
    const dateLabel = now.toLocaleDateString('ro-RO');

    // ======================
    // PROMPT DE SUMARIZARE
    // ======================
    const prompt = [
        {
            role: 'system',
            content: 'Ești un generator de titluri și rezumate concise.',
        },
        {
            role: 'user',
            content:
                'Generează un TITLU și un REZUMAT pentru conversația de mai jos.\n\n' +

                'FORMAT OBLIGATORIU:\n' +
                'TITLE: <titlu semantic>\n' +
                'SUMMARY: <rezumat>\n\n' +

                'REGULI PENTRU TITLE:\n' +
                '- 3–6 cuvinte\n' +
                '- descrie tema principală\n' +
                '- fără dată sau oră (data va fi adăugată separat)\n\n' +

                'REGULI PENTRU SUMMARY:\n' +
                '- scris la persoana I singular ("eu")\n' +
                '- 1–3 propoziții scurte\n' +
                '- descrie ce simt, ce trăiesc sau ce încerc să înțeleg\n' +
                '- NU descrie comportamentul asistentului\n' +
                '- fără analiză sau recomandări\n\n' +

                'MESAJELOR MELE:\n' +
                userMessages.join('\n'),
        },
    ];

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data, error } = await supabase.functions.invoke('chat-ai', {
        headers: {
            Authorization: `Bearer ${session.access_token}`,
        },
        body: {
            messages: prompt,
        },
    });

    if (error) {
        console.error('Summary AI error:', error);
        return;
    }

    const raw = data?.content?.trim();
    if (!raw) return;

    // ======================
    // PARSARE RĂSPUNS AI
    // ======================
    let aiTitle = null;
    let summary = null;

    const titleMatch = raw.match(/TITLE:\s*(.+)/i);
    const summaryMatch = raw.match(/SUMMARY:\s*([\s\S]+)/i);

    if (titleMatch) {
        aiTitle = titleMatch[1].trim();
    }

    if (summaryMatch) {
        summary = summaryMatch[1].trim();
    }

    if (!summary) return;

    // ======================
    // VERIFICARE TITLU EXISTENT
    // ======================
    const { data: existing } = await supabase
        .from('conversations')
        .select('title')
        .eq('id', conversationId)
        .single();

    const normalizedTitle = existing?.title
        ?.trim()
        .toLowerCase();

    // Titluri considerate GENERICE (placeholder)
    const GENERIC_TITLES = [
        'chat',
        'chat nou',
        'conversație',
        'conversatie',
        'nou',
    ];

    /**
     * Titlul este REAL doar dacă:
     * - există
     * - NU începe cu "chat"
     * - NU este unul din titlurile generice
     */
    const hasRealTitle =
        normalizedTitle &&
        !normalizedTitle.startsWith('chat') &&
        !GENERIC_TITLES.includes(normalizedTitle);

    // ======================
    // CONSTRUIRE TITLU FINAL
    // ======================
    const finalTitle = aiTitle
        ? `${aiTitle} · ${dateLabel}`
        : null;

    // ======================
    // UPDATE FINAL
    // ======================
    await supabase
        .from('conversations')
        .update({
            summary,
            ...(finalTitle && !hasRealTitle ? { title: finalTitle } : {}),
        })
        .eq('id', conversationId);
}
