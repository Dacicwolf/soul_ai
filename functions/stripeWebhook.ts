import Stripe from 'npm:stripe@17.5.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Procesează plata finalizată
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.user_id;
      const messages = parseInt(session.metadata.messages);

      console.log(`Processing payment for user ${userId}, adding ${messages} messages`);

      // Preia utilizatorul curent
      const user = await base44.asServiceRole.entities.User.get(userId);
      const currentPaidMessages = user.paidMessagesRemaining || 0;
      const newTotal = currentPaidMessages + messages;

      // Actualizează mesajele utilizatorului (adaugă la cele existente)
      await base44.asServiceRole.entities.User.update(userId, {
        paidMessagesRemaining: newTotal
      });

      console.log(`User ${userId} purchased ${messages} messages. Total: ${currentPaidMessages} + ${messages} = ${newTotal}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});