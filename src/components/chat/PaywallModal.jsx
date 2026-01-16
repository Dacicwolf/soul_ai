import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PaywallModal({ isOpen, onClose, messagesUsed, currentCredits, onPurchaseComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const packages = [
    {
      id: 'bronze',
      name: 'Bronz',
      messages: 10,
      price: 9,
      icon: Sparkles,
      iconColor: 'text-amber-600',
      bgGradient: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200',
      sku: 'bronze_10_messages'
    },
    {
      id: 'silver',
      name: 'Silver',
      messages: 50,
      price: 29,
      icon: Star,
      iconColor: 'text-indigo-600',
      bgGradient: 'from-indigo-50 to-purple-50',
      borderColor: 'border-indigo-300',
      badge: '⭐ BESTSELLER',
      sku: 'silver_50_messages'
    },
    {
      id: 'gold',
      name: 'Gold',
      messages: 100,
      price: 49,
      icon: Crown,
      iconColor: 'text-yellow-600',
      bgGradient: 'from-yellow-50 to-amber-50',
      borderColor: 'border-yellow-300',
      sku: 'gold_100_messages'
    }
  ];

  const handlePurchase = async (pkg) => {
    setIsProcessing(true);
    
    try {
      // Verifică dacă Google Play Billing este disponibil
      if (typeof window.googlePlayBilling === 'undefined') {
        toast.error('Google Play Billing nu este disponibil');
        setIsProcessing(false);
        return;
      }

      // Inițiază fluxul de plată Google Play
      const purchase = await window.googlePlayBilling.purchase(pkg.sku);
      
      if (purchase.success) {
        // Actualizează creditele utilizatorului
        const user = await base44.auth.me();
        const newCredits = (user.message_credits || 0) + pkg.messages;
        
        await base44.auth.updateMe({
          message_credits: newCredits
        });

        toast.success(`Ai primit ${pkg.messages} mesaje! Total: ${newCredits} mesaje`);
        onPurchaseComplete(newCredits);
        onClose();
      }
    } catch (error) {
      console.error('Eroare la procesarea plății:', error);
      toast.error('Plata nu a putut fi procesată. Te rugăm să încerci din nou.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Continuă conversația
              </h2>
              <p className="text-gray-600 text-sm">
                Ai folosit {messagesUsed}/10 mesaje gratuite
              </p>
              {currentCredits > 0 && (
                <p className="text-indigo-600 font-medium text-sm mt-1">
                  Ai {currentCredits} {currentCredits === 1 ? 'mesaj rămas' : 'mesaje rămase'}
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {packages.map((pkg) => {
                const Icon = pkg.icon;
                return (
                  <motion.div
                    key={pkg.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative border-2 ${pkg.borderColor} rounded-2xl p-4 bg-gradient-to-br ${pkg.bgGradient} cursor-pointer transition-shadow hover:shadow-lg`}
                    onClick={() => handlePurchase(pkg)}
                  >
                    {pkg.badge && (
                      <div className="absolute -top-2 right-4 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                        {pkg.badge}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-white/80 ${pkg.iconColor}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-gray-800">{pkg.name}</h3>
                          <p className="text-sm text-gray-600">{pkg.messages} mesaje</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">{pkg.price} lei</div>
                        <div className="text-xs text-gray-500">
                          {(pkg.price / pkg.messages).toFixed(2)} lei/mesaj
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="text-center text-xs text-gray-500">
              Plata se face prin Google Play
            </div>

            {isProcessing && (
              <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-3xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3" />
                  <p className="text-gray-600">Se procesează plata...</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}