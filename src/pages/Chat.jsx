import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Send, ArrowLeft, MoreVertical } from 'lucide-react';
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

const MAX_MESSAGES = 10;
const PAYWALL_TRIGGER = 8;

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
  const [hasPremium, setHasPremium] = useState(false);
  
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showSafetyResponse]);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      const filteredMessages = (data.messages || []).filter(msg => msg.role !== 'system');
      if (filteredMessages.length > 0) {
        setMessages(filteredMessages);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  const initConversation = async () => {
    try {
      // Set initial message immediately
      setMessages([
        { role: 'assistant', content: INITIAL_MESSAGES[mode] }
      ]);
      
      const newConversation = await base44.agents.createConversation({
        agent_name: 'companion',
        metadata: {
          name: `Conversație - ${MODE_LABELS[mode]}`,
          mode: mode
        }
      });
      
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
      
      // Set conversation after messages are added
      setConversationId(newConversation.id);
      setConversation(newConversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const checkSafetyKeywords = (text) => {
    const lowerText = text.toLowerCase();
    return SAFETY_KEYWORDS.some(keyword => lowerText.includes(keyword));
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
    if (!inputValue.trim() || isLoading || !conversation) return;
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

    // Check message limit
    const newCount = messageCount + 1;
    if (!hasPremium && newCount >= PAYWALL_TRIGGER) {
      setShowPaywall(true);
    }

    if (!hasPremium && messageCount >= MAX_MESSAGES) {
      setShowPaywall(true);
      return;
    }

    setMessageCount(newCount);
    setIsLoading(true);

    try {
      // Send message through agent - Claude Sonnet 4.5 will respond
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleUnlockPremium = () => {
    setHasPremium(true);
    setShowPaywall(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const remainingMessages = Math.max(0, MAX_MESSAGES - messageCount);

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
          {!hasPremium && (
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-600">
                <span className={messageCount >= PAYWALL_TRIGGER ? 'text-amber-500' : 'text-indigo-500'}>
                  {messageCount}
                </span>
                <span className="text-gray-400">/{MAX_MESSAGES}</span>
              </div>
              <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(messageCount / MAX_MESSAGES) * 100}%` }}
                  className={`h-full rounded-full ${
                    messageCount >= PAYWALL_TRIGGER 
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                      : 'bg-gradient-to-r from-indigo-400 to-purple-500'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </motion.header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.filter(msg => msg.role !== 'system').map((msg, index) => (
            <ChatBubble
              key={index}
              message={msg.content}
              isUser={msg.role === 'user'}
            />
          ))}
          
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
                onKeyPress={handleKeyPress}
                placeholder={safetyLockCount > 0 ? "Ia-ți un moment..." : "Scrie un mesaj..."}
                disabled={isLoading || (!hasPremium && messageCount >= MAX_MESSAGES) || safetyLockCount > 0}
                className="w-full py-6 pl-4 pr-12 rounded-2xl border-gray-200 bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || (!hasPremium && messageCount >= MAX_MESSAGES) || safetyLockCount > 0}
              className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-purple-200/50 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          {!hasPremium && remainingMessages <= 3 && remainingMessages > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-amber-600 mt-2"
            >
              {remainingMessages} mesaje rămase
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlock={handleUnlockPremium}
        messagesUsed={messageCount}
        maxMessages={MAX_MESSAGES}
      />
    </div>
  );
}