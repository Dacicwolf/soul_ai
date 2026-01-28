import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2023-10-16",
});

const PRICE_MAP: Record<string, string> = {
    iron: process.env.STRIPE_PRICE_IRON as string,
    bronze: process.env.STRIPE_PRICE_BRONZE as string,
    silver: process.env.STRIPE_PRICE_SILVER as string,
    gold: process.env.STRIPE_PRICE_GOLD as string,
};

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    /* =====================
       CORS
    ===================== */
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        /* =====================
           BODY PARSING
        ===================== */
        const body =
            typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        const { pack, userId } = body;

        /* =====================
           VALIDARE
        ===================== */
        if (!pack || !PRICE_MAP[pack]) {
            return res.status(400).json({ error: "Invalid pack" });
        }

        if (!userId) {
            return res.status(400).json({ error: "Missing userId" });
        }

        /* =====================
           STRIPE CHECKOUT
        ===================== */
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: PRICE_MAP[pack],
                    quantity: 1,
                },
            ],

            // 🔴 METADATA CRITICĂ PENTRU WEBHOOK
            metadata: {
                user_id: userId,
                pack: pack,
            },

            success_url: `${process.env.SITE_URL}/payment-success?pack=${pack}`,
            cancel_url: `${process.env.SITE_URL}/payment-cancel`,
        });

        return res.status(200).json({ url: session.url });
    } catch (err: any) {
        console.error("Stripe checkout error:", err);
        return res.status(500).json({ error: "Stripe failed" });
    }
}
