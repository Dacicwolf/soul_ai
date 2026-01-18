import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userEmail, messages } = await req.json();

    if (!userEmail || !messages) {
      return Response.json({ error: 'Missing userEmail or messages' }, { status: 400 });
    }

    // Găsește utilizatorul după email
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];
    const currentPaid = targetUser.paidMessagesRemaining || 0;
    const newTotal = currentPaid + messages;

    // Actualizează mesajele
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      paidMessagesRemaining: newTotal
    });

    return Response.json({ 
      success: true, 
      user: userEmail,
      previousMessages: currentPaid,
      addedMessages: messages,
      newTotal: newTotal
    });
  } catch (error) {
    console.error('Error adding messages:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});