import Stripe from "stripe";
import { buffer } from "micro";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/**
 * IMPORTANT:
 * Stripe webhook trebuie să primească RAW body
 */
export const config = {
    api: {
        bodyParser: false,
    },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2023-10-16",
});

const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

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
       HEALTH CHECK (GET)
    ===================== */
    if (req.method === "GET" || req.method === "HEAD") {
        return res.status(200).json({ ok: true });
    }

    /* =====================
       DOAR POST
    ===================== */
    if (req.method !== "POST") {
        return res.status(405).end();
    }

    const sig = req.headers["stripe-signature"];
    if (!sig) {
        return res.status(400).send("Missing Stripe signature");
    }

    let event: Stripe.Event;

    try {
        const buf = await buffer(req);

        event = stripe.webhooks.constructEvent(
            buf,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    /* =====================
       EVENT HANDLING
    ===================== */
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.user_id;
        const pack = session.metadata?.pack;

        if (!userId || !pack || !PACK_CREDITS[pack]) {
            console.warn("Invalid metadata:", session.metadata);
            return res.status(200).json({ received: true });
        }

        const creditsToAdd = PACK_CREDITS[pack];

        // 1️⃣ Update user credits
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                credits: supabase.rpc("increment", { x: creditsToAdd }),
                plan: "paid",
            })
            .eq("id", userId);

        if (updateError) {
            console.error("Supabase update error:", updateError);
        }

        // 2️⃣ Save payment audit
        const { error: insertError } = await supabase.from("payments").insert({
            user_id: userId,
            stripe_session_id: session.id,
            status: "completed",
        });

        if (insertError) {
            console.error("Payment insert error:", insertError);
        }
    }

    return res.status(200).json({ received: true });
}
