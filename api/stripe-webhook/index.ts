import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export const config = {
    api: {
        bodyParser: false,
    },
};

const PACK_CREDITS: Record<string, number> = {
    iron: 50,
    bronze: 100,
    silver: 250,
    gold: 500,
};

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    /* =====================
       HEALTH CHECK
    ===================== */
    if (req.method === "GET" || req.method === "HEAD") {
        return res.status(200).json({ ok: true });
    }

    if (req.method !== "POST") {
        return res.status(405).end();
    }

    // 🔴 VALIDARE ENV VARS (CRITIC)
    const {
        STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET,
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
    } = process.env;

    if (
        !STRIPE_SECRET_KEY ||
        !STRIPE_WEBHOOK_SECRET ||
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
    ) {
        console.error("Missing env vars", {
            STRIPE_SECRET_KEY: !!STRIPE_SECRET_KEY,
            STRIPE_WEBHOOK_SECRET: !!STRIPE_WEBHOOK_SECRET,
            SUPABASE_URL: !!SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
        });
        return res.status(500).json({ error: "Server misconfigured" });
    }

    const sig = req.headers["stripe-signature"];
    if (!sig) {
        return res.status(400).send("Missing Stripe signature");
    }

    let event: Stripe.Event;

    try {
        const stripe = new Stripe(STRIPE_SECRET_KEY, {
            apiVersion: "2023-10-16",
        });

        const rawBody = req.body as Buffer;

        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            STRIPE_WEBHOOK_SECRET
        );

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            const userId = session.metadata?.user_id;
            const pack = session.metadata?.pack;

            if (!userId || !pack || !PACK_CREDITS[pack]) {
                return res.status(200).json({ received: true });
            }

            const supabase = createClient(
                SUPABASE_URL,
                SUPABASE_SERVICE_ROLE_KEY
            );

            const creditsToAdd = PACK_CREDITS[pack];

            await supabase
                .from("profiles")
                .update({
                    credits: supabase.rpc("increment", { x: creditsToAdd }),
                    plan: "paid",
                })
                .eq("id", userId);

            await supabase.from("payments").insert({
                user_id: userId,
                stripe_session_id: session.id,
                status: "completed",
            });
        }

        return res.status(200).json({ received: true });
    } catch (err: any) {
        console.error("Webhook error:", err);
        return res.status(400).send(`Webhook Error`);
    }
}
