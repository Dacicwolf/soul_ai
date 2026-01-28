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
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const body =
            typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        const { pack } = body;

        if (!pack || !PRICE_MAP[pack]) {
            return res.status(400).json({ error: "Invalid pack" });
        }

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: PRICE_MAP[pack],
                    quantity: 1,
                },
            ],
            success_url: `${process.env.SITE_URL}/payment-success?pack=${pack}`,
            cancel_url: `${process.env.SITE_URL}/payment-cancel`,
        });

        return res.status(200).json({ url: session.url });
    } catch (err: any) {
        console.error("Stripe error:", err);
        return res.status(500).json({
            error: err?.message || "Stripe failed",
        });
    }