import Stripe from "stripe";
import { buffer } from "micro";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

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
    if (req.method !== "POST") {
        return res.status(405).end();
    }

    const sig = req.headers["stripe-signature"] as string;
    const buf = await buffer(req);

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            buf,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        console.error("Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.user_id;
        const pack = session.metadata?.pack;

        if (!userId || !pack || !PACK_CREDITS[pack]) {
            return res.status(200).json({ received: true });
        }

        const creditsToAdd = PACK_CREDITS[pack];

        // 1️⃣ Update credits + plan
        await supabase
            .from("profiles")
            .update({
                credits: supabase.rpc("increment", {
                    x: creditsToAdd,
                }),
                plan: "paid",
            })
            .eq("id", userId);

        // 2️⃣ Save payment (audit)
        await supabase.from("payments").insert({
            user_id: userId,
            stripe_session_id: session.id,
            status: "completed",
        });
    }

    return res.status(200).json({ received: true });
}
