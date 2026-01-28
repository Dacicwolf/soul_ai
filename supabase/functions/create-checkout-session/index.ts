import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

// Configurare CORS - Esențial pentru comunicarea cu browserul (localhost sau domeniu)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // 1. GESTIONARE PRE-FLIGHT (CORS)
  // Aceasta trebuie să fie prima verificare pentru a evita "Blocked by CORS policy"
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // 2. INIȚIALIZARE STRIPE
    // httpClient: Stripe.createFetchHttpClient() elimină eroarea "Deno.core.runMicrotasks"
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? '', {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: '2023-10-16',
    });

    // 3. PARSARE BODY
    const { priceId } = await req.json();

    if (!priceId) {
      throw new Error("ID-ul de preț (priceId) lipsește din cerere.");
    }

    // 4. DEFINIRE URL-URI DE REDIRECȚIONARE
    // Dacă SITE_URL nu este setat în secrete, folosim localhost ca fallback
    const siteUrl = Deno.env.get("SITE_URL") || 'http://localhost:5173';

    // 5. CREARE SESIUNE STRIPE
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/payment-success`,
      cancel_url: `${siteUrl}/payment-cancel`,
    });

    // 6. RĂSPUNS REUȘIT
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
      }
    );

  } catch (err) {
    // 7. GESTIONARE ERORI
    // Trimitem eroarea exactă înapoi pentru a o vedea în Network Tab -> Response
    console.error("Eroare Edge Function:", err.message);

    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
      }
    );
  }
});