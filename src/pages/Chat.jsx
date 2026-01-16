import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Send, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ChatBubble from '@/components/chat/ChatBubble';
import SafetyResponse from '@/components/chat/SafetyResponse';
import PaywallModal from '@/components/chat/PaywallModal';

const SAFETY_KEYWORDS = [
  'nu mai vreau să trăiesc',
  'vreau să dispar',
  'să mă rănesc',
  'nu mai are rost',
  'vreau să mor',
  'mă sinucid',
  'să mă omor',
  'vreau să renunț la viață'
];



const FREE_MESSAGES = 10;
const SOFT_PAYWALL_TRIGGER = 8;
const HARD_PAYWALL_TRIGGER = 10;

const MODE_LABELS = {
  adult_stresat: 'Adult stresat',
  parinte: 'Părinte',
  tanar: 'Tânăr'
};

const INITIAL_MESSAGES = {
  adult_stresat: 'Bună! Sunt aici să te ascult. Te pot ajuta să-ți clarifici gândurile. Putem vorbi despre ce te apasă acum sau despre o situație concretă.',
  parinte: 'Bună! Sunt aici să te ascult. Putem vorbi despre ce te apasă acum sau despre o situație din familie care te obosește.',
  tanar: 'Hey! Sunt aici să te ascult. Putem vorbi despre ce te frământă acum sau despre o situație care te încurcă.'
};

export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'adult_stresat';
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [showSafetyResponse, setShowSafetyResponse] = useState(false);
  const [safetyLockCount, setSafetyLockCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [freeMessagesUsed, setFreeMessagesUsed] = useState(0);
  const [paidMessagesRemaining, setPaidMessagesRemaining] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load AI prompts
  const { data: aiPrompts } = useQuery({
    queryKey: ['aiPrompts'],
    queryFn: async () => {
      const result = await base44.entities.AIPrompts.list();
      return result.length > 0 ? result[0] : null;
    },
    initialData: null,
  });

  // Load prepend prompts
  const { data: prependPrompts } = useQuery({
    queryKey: ['prependPrompts'],
    queryFn: async () => {
      const result = await base44.entities.PrependPrompts.list();
      return result.filter(p => p.is_active);
    },
    initialData: [],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showSafetyResponse]);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant') {
      inputRef.current?.focus();
    }
  }, [isLoading, messages]);

  useEffect(() => {
    checkAuthAndInit();
  }, []);

  const checkAuthAndInit = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      
      // Încarcă datele utilizatorului
      const user = await base44.auth.me();
      setCurrentUser(user);
      setIsAdmin(user.role === 'admin');
      
      // Setează mesajele
      const freeUsed = user.freeMessagesUsed || 0;
      const paidRemaining = user.paidMessagesRemaining || 0;
      setFreeMessagesUsed(freeUsed);
      setPaidMessagesRemaining(paidRemaining);
      
      // Dacă utilizatorul nou, inițializează
      if (user.freeMessagesUsed === undefined) {
        await base44.auth.updateMe({ 
          freeMessagesUsed: 0,
          paidMessagesRemaining: 0
        });
      }
      
      initConversation();
    } catch (error) {
      console.error('Auth check failed:', error);
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      const filteredMessages = (data.messages || []).filter(msg => msg.role !== 'system');
      setMessages(prevMessages => {
        const uiOnlyMessages = prevMessages.filter(m => m.uiOnly);
        return [...uiOnlyMessages, ...filteredMessages];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  const initConversation = async () => {
    try {
      // Show initial message immediately
      setMessages([{
        role: 'assistant',
        content: INITIAL_MESSAGES[mode],
        uiOnly: true
      }]);
      
      const newConversation = await base44.agents.createConversation({
        agent_name: 'companion',
        metadata: {
          name: `Conversație - ${MODE_LABELS[mode]}`,
          mode: mode
        }
      });
      
      // Set conversation first so it's available for sending messages
      setConversation(newConversation);
      setConversationId(newConversation.id);
      
      // Send system prompt
      const systemPrompt = getSystemPrompt();
      await base44.agents.addMessage(newConversation, {
        role: 'system',
        content: systemPrompt
      });
      
      // Add initial AI greeting
      await base44.agents.addMessage(newConversation, {
        role: 'assistant',
        content: INITIAL_MESSAGES[mode]
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const normalize = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .trim();

  const checkSafetyKeywords = (text) => {
    const normalizedText = normalize(text);
    return SAFETY_KEYWORDS.some(keyword => normalizedText.includes(normalize(keyword)));
  };

  // 🔒 CONVERSATION LOGIC LOCKED
  // Nu modifica tone, empatie sau reguli fără QA complet.
  // Această logică este stabilă și validată.
  const detectPrependTrigger = (text) => {
    if (!prependPrompts || prependPrompts.length === 0) return null;

    const normalizedText = normalize(text);
    
    // 1️⃣ Check ALL triggers with keywords
    for (const trigger of prependPrompts) {
      if (trigger.keywords.some(keyword => {
        const normalizedKeyword = normalize(keyword);
        // Skip empty keywords after normalization (like '...')
        if (!normalizedKeyword) return false;
        return normalizedText.includes(normalizedKeyword);
      })) {
        return trigger.prompt;
      }
    }
    
    return null;
  };

  const getSystemPrompt = () => {
    if (!aiPrompts) {
      // Fallback prompts if not configured
      const fallbackPrompts = {
        adult_stresat: 'Ești un companion AI empatic și cald specializat în suportul adulților stresați. Asculți, validezi emoțiile și ajuți utilizatorul să-și clarifice gândurile despre presiunea de la job, responsabilități și burnout. NU oferi sfaturi medicale sau terapie. Fii calm, pragmatic și non-judgmental. Răspunde în română, maxim 3-4 fraze scurte.',
        parinte: 'Ești un companion AI empatic și cald specializat în suportul părinților. Asculți, validezi emoțiile și ajuți utilizatorul să-și clarifice gândurile despre provocările și bucuriile parentale. NU oferi sfaturi medicale sau terapie. Fii înțelegător și non-judgmental. Răspunde în română, maxim 3-4 fraze scurte.',
        tanar: 'Ești un companion AI empatic și cald specializat în suportul tinerilor. Asculți, validezi emoțiile și ajuți utilizatorul să-și clarifice gândurile despre identitate, relații și viitor. NU oferi sfaturi medicale sau terapie. Fii accesibil și relatable. Răspunde în română, maxim 3-4 fraze scurte.'
      };
      return fallbackPrompts[mode];
    }

    // Use configured prompts
    const generalPrompt = aiPrompts.general_prompt || '';
    const specificPrompts = {
      adult_stresat: aiPrompts.adult_stresat_prompt || '',
      parinte: aiPrompts.parinte_prompt || '',
      tanar: aiPrompts.tanar_prompt || ''
    };
    
    const specificPrompt = specificPrompts[mode];
    return `${generalPrompt}\n\n${specificPrompt}`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    // Wait for conversation to be ready
    if (!conversation || !conversationId) {
      console.log('Waiting for conversation to initialize...');
      return;
    }
    if (safetyLockCount > 0) {
      setSafetyLockCount(prev => prev - 1);
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');

    // Check for safety keywords
    if (checkSafetyKeywords(userMessage)) {
      setShowSafetyResponse(true);
      setSafetyLockCount(2);
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
      return;
    }

    // === PSEUDOCOD EXACT ===
    // if (user.role === 'admin') → allowMessage()
    if (isAdmin) {
      // Admin → trimite mesaj direct
      setMessageCount(messageCount + 1);
      setIsLoading(true);

      const prependPrompt = detectPrependTrigger(userMessage);
      const messageToSend = prependPrompt 
        ? `${prependPrompt}\n\n---\nMesaj utilizator: ${userMessage}`
        : userMessage;

      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: messageToSend
      });

      setIsLoading(false);
      return;
    }

    // if (user.freeMessagesUsed < 10) → incrementează, soft paywall la 8
    if (freeMessagesUsed < FREE_MESSAGES) {
      const newFree = freeMessagesUsed + 1;
      setFreeMessagesUsed(newFree);
      await base44.auth.updateMe({ freeMessagesUsed: newFree });

      if (newFree === SOFT_PAYWALL_TRIGGER) {
        setShowPaywall(true);
      }

      // Permite mesaj
      setMessageCount(messageCount + 1);
      setIsLoading(true);

      const prependPrompt = detectPrependTrigger(userMessage);
      const messageToSend = prependPrompt 
        ? `${prependPrompt}\n\n---\nMesaj utilizator: ${userMessage}`
        : userMessage;

      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: messageToSend
      });

      setIsLoading(false);
      return;
    }

    // if (user.paidMessagesRemaining > 0) → decrementează
    if (paidMessagesRemaining > 0) {
      const newPaid = paidMessagesRemaining - 1;
      setPaidMessagesRemaining(newPaid);
      await base44.auth.updateMe({ paidMessagesRemaining: newPaid });

      // Permite mesaj
      setMessageCount(messageCount + 1);
      setIsLoading(true);

      const prependPrompt = detectPrependTrigger(userMessage);
      const messageToSend = prependPrompt 
        ? `${prependPrompt}\n\n---\nMesaj utilizator: ${userMessage}`
        : userMessage;

      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: messageToSend
      });

      setIsLoading(false);
      return;
    }

    // Hard paywall → blochează mesaj
    setShowPaywall(true);
        };

  const handlePurchaseComplete = (addedMessages) => {
    const newPaid = paidMessagesRemaining + addedMessages;
    setPaidMessagesRemaining(newPaid);
    setShowPaywall(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('ChooseMode')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Button>
            </Link>
            <div>
              <h1 className="font-medium text-gray-800">Companion AI</h1>
              <p className="text-xs text-gray-500">{MODE_LABELS[mode]}</p>
            </div>
          </div>
          
          {/* Message counter */}
          <div className="flex items-center gap-3">
            {!isAdmin && (
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-600">
                  <span className={(FREE_MESSAGES - freeMessagesUsed + paidMessagesRemaining) <= 2 ? 'text-amber-500' : 'text-indigo-500'}>
                    {FREE_MESSAGES - freeMessagesUsed + paidMessagesRemaining}
                  </span>
                  <span className="text-gray-400 text-xs ml-1">mesaje</span>
                </div>
              </div>
            )}
            {isAdmin && (
              <div className="text-xs text-indigo-600 font-medium">
                Admin • Nelimitat
              </div>
            )}
            <button 
              onClick={() => {
                window.location.href = '/';
                base44.auth.logout();
              }}
              className="flex flex-col items-center gap-1 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
              <span className="text-xs text-gray-500">Ieșire</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
            {messages.filter(msg => msg.role !== 'system').map((msg, index) => {
              // Extract original user message if prepend was used
              let displayContent = msg.content;
              if (msg.role === 'user' && msg.content.includes('---\nMesaj utilizator:')) {
                displayContent = msg.content.split('---\nMesaj utilizator:')[1].trim();
              }

              return (
                <ChatBubble
                  key={index}
                  message={displayContent}
                  isUser={msg.role === 'user'}
                />
              );
            })}
          
          {isLoading && <ChatBubble isTyping />}
          
          {showSafetyResponse && (
            <SafetyResponse 
              onContinue={() => {
                setShowSafetyResponse(false);
              }} 
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky bottom-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-4 py-4"
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={safetyLockCount > 0 ? "Ia-ți un moment..." : "Scrie un mesaj..."}
                disabled={isLoading || (!isAdmin && (FREE_MESSAGES - freeMessagesUsed + paidMessagesRemaining) <= 0) || safetyLockCount > 0}
                className="w-full py-6 pl-4 pr-12 rounded-2xl border-gray-200 bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || (!isAdmin && (FREE_MESSAGES - freeMessagesUsed + paidMessagesRemaining) <= 0) || safetyLockCount > 0}
              className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-purple-200/50 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {!isAdmin && (() => {
            const remaining = FREE_MESSAGES - freeMessagesUsed + paidMessagesRemaining;
            return remaining <= 3 && remaining > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs text-amber-600 mt-2"
              >
                {remaining} {remaining === 1 ? 'mesaj rămas' : 'mesaje rămase'}
              </motion.p>
            );
          })()}
        </div>
      </motion.div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchaseComplete={handlePurchaseComplete}
        messagesUsed={freeMessagesUsed}
        paidRemaining={paidMessagesRemaining}
      />
    </div>
  );
}