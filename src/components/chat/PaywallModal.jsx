import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PaywallModal({ isOpen, onClose, onUnlock, messagesUsed, maxMessages }) {
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState('');

  const handlePromoSubmit = () => {
    if (promoCode.toLowerCase() === 'suflet2024' || promoCode.toLowerCase() === 'test') {
      onUnlock();
    } else {
      setError('Cod invalid');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        >
          {/* Header decoration */}
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200/50"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
            </div>

            {/* Content */}
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
              Ai folosit {messagesUsed} din {maxMessages} mesaje
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              Dacă vrei să continui, poți activa accesul complet sau folosește un cod promoțional.
            </p>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(messagesUsed / maxMessages) * 100}%` }}
                className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
            </div>

            {/* Promo code section */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Ai un cod promoțional?</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Introdu codul"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setError('');
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handlePromoSubmit}
                  variant="outline"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  Aplică
                </Button>
              </div>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full py-6 text-lg font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl shadow-lg shadow-purple-200/50"
                onClick={() => {/* Handle premium purchase */}}
              >
                Activează acces complet
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-gray-500 hover:text-gray-700"
              >
                Continuă mai târziu
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}