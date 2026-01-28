export const config = {
  auth: false,
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star, Crown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

export default function PaywallModal({
  isOpen,
  onClose,
  messagesUsed,
  paidRemaining,
}) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ======================
  // PACHETE
  // ======================
  const packages = [
    {
      id: 'iron_50',
      name: 'Iron',
      messages: 50,
      price: 5,
      priceId: 'price_1SuHM0JMxVYjXiGFk6Rq0jJg',
      icon: Shield,
      iconColor: 'text-gray-600',
      bgGradient: 'from-gray-50 to-gray-400',
      borderColor: 'border-gray-900',
      subtitle: 'Pentru a continua fără presiune',
    },
    {
      id: 'bronze_100',
      name: 'Bronz',
      messages: 100,
      price: 9.9,
      priceId: 'price_1SuHUSJMxVYjXiGFDrH5kgRP',
      icon: Sparkles,
      iconColor: 'text-amber-900',
      bgGradient: 'from-stone-50 to-amber-500',
      borderColor: 'border-amber-800',
      subtitle: 'Echilibrul potrivit pentru utilizare ocazională',
    },
    {
      id: 'silver_250',
      name: 'Silver',
      messages: 250,
      price: 19.9,
      priceId: 'price_1SuHXBJMxVYjXiGFT7iqxmUE',
      icon: Star,
      iconColor: 'text-indigo-900',
      bgGradient: 'from-indigo-50 to-indigo-400',
      borderColor: 'border-indigo-600',
      badge: '⭐ Cel mai avantajos',
      subtitle: 'Cel mai bun raport valoare / mesaje',
      highlight: true,
    },
    {
      id: 'gold_500',
      name: 'Gold',
      messages: 500,
      price: 37.9,
      priceId: 'price_1SuHZIJMxVYjXiGFPDTyefNW',
      icon: Crown,
      iconColor: 'text-yellow-700',
      bgGradient: 'from-yellow-50 to-amber-400',
      borderColor: 'border-amber-600',
      subtitle: 'Pentru utilizare intensivă',
    },
  ];

  // ======================
  // HANDLER CHECKOUT
  // ======================
  const handleCheckout = async () => {
    if (!selectedPackage?.priceId) return;

    // Protecție iframe (opțional, dar bun)
    if (window.self !== window.top) {
      alert('Pentru a cumpăra, deschide aplicația într-o fereastră nouă.');
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            priceId: selectedPackage.priceId,
          },
        }
      );

      if (error) {
        console.error('Checkout invoke error:', error);
        setIsProcessing(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Continuă conversația
              </h2>
              <p className="text-gray-600 text-sm">
                Ai ajuns la limita mesajelor gratuite.
              </p>
              {paidRemaining > 0 && (
                <p className="text-indigo-600 font-medium text-sm mt-1">
                  Mai ai {paidRemaining} mesaje plătite disponibile
                </p>
              )}
            </div>

            {/* Packages */}
            <div className="space-y-3 mb-6">
              {packages.map(pkg => {
                const Icon = pkg.icon;
                const selected = selectedPackage?.id === pkg.id;

                return (
                  <motion.div
                    key={pkg.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative border-2 rounded-2xl p-4 cursor-pointer transition
                      ${pkg.borderColor}
                      bg-gradient-to-br ${pkg.bgGradient}
                      ${selected ? 'ring-2 ring-indigo-500' : ''}
                      ${pkg.highlight ? 'shadow-lg' : ''}
                    `}
                  >
                    {pkg.badge && (
                      <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                        {pkg.badge}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-white/80 ${pkg.iconColor}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{pkg.name}</h3>
                          <p className="text-sm text-gray-800 font-semibold">
                            {pkg.messages} mesaje
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {pkg.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">
                          {pkg.price} lei
                        </div>
                        <div className="text-xs text-gray-500">
                          {(pkg.price / pkg.messages).toFixed(3)} lei / mesaj
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Continue button */}
            <Button
              disabled={!selectedPackage || isProcessing}
              className="w-full rounded-xl py-3 text-base"
              onClick={handleCheckout}
            >
              {isProcessing ? 'Se procesează…' : 'Continuă'}
            </Button>

            <div className="text-center text-xs text-gray-500 mt-4">
              Plată unică · Fără abonament · Acces imediat
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
