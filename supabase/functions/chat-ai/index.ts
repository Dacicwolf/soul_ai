import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
    // CORS (important pentru browser)
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        // Parse body
        const body = await req.json();
        const { messages, provider } = body ?? {};

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: "Invalid messages payload" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // 🔑 OpenAI key (MUST be set in Supabase → Project Settings → Functions → Secrets)
        const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
        if (!OPENAI_API_KEY) {
            return new Response(
                JSON.stringify({ error: "OPENAI_API_KEY missing" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Call OpenAI
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages,
            }),
        });

        if (!aiRes.ok) {
            const errText = await aiRes.text();
            return new Response(
                JSON.stringify({ error: "OpenAI error", details: errText }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const aiJson = await aiRes.json();
        const content =
            aiJson?.choices?.[0]?.message?.content ?? "(Răspuns gol de la AI)";

        // ✅ SUCCESS — RETURN RESPONSE (CRUCIAL)
        return new Response(
            JSON.stringify({ content }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );

    } catch (err) {
        // ✅ ERROR — RETURN RESPONSE (CRUCIAL)
        return new Response(
            JSON.stringify({
                error: "chat-ai runtime error",
                message: String(err),
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
});
