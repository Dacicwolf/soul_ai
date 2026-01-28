import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Heart, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {

  const { isAdmin } = useAuth();

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50 flex flex-col items-center justify-center p-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center text-center max-w-md"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-light text-gray-800 leading-relaxed mb-4"
        >
          Bun venit! 💜
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 mb-6"
        >
          Acest spațiu este creat pentru reflecție, claritate și siguranță emoțională.
        </motion.p>

        {/* INFO BOX */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/70 backdrop-blur-lg rounded-2xl p-5 shadow-md mb-6 text-left w-full"
        >
          <div className="flex items-start gap-3 mb-3">
            <Heart className="w-5 h-5 text-rose-500 mt-1" />
            <p className="text-sm text-gray-700">
              Nu ești judecat. Nu ești analizat. Nu ești corectat.
            </p>
          </div>
          <div className="flex items-start gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-500 mt-1" />
            <p className="text-sm text-gray-700">
              Răspunsurile sunt generate automat și nu înlocuiesc un specialist uman.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-500 mt-1" />
            <p className="text-sm text-gray-700">
              Conversațiile sunt confidențiale și nu sunt analizate manual.
            </p>
          </div>
        </motion.div>

        {/* TERMS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 mb-6 text-left w-full"
        >
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked)}
          />
          <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
            Sunt de acord cu termenii și condițiile și înțeleg limitările acestui serviciu.
          </label>
        </motion.div>

        {/* CONTINUE */}
        <Link
          to={acceptedTerms ? createPageUrl('conversation-selector') : '#'}
          className={!acceptedTerms ? 'pointer-events-none w-full' : 'w-full'}
        >
          <Button
            size="lg"
            disabled={!acceptedTerms}
            className="w-full py-6 rounded-xl shadow-lg"
          >
            Continuă
          </Button>
        </Link>

        {/* ADMIN BUTTONS */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full mt-6 space-y-3"
          >
            <Link to="/admin/prompts">
              <Button
                variant="outline"
                className="w-full py-4 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                ⚙️ Prompturi AI
              </Button>
            </Link>

            <Link to="/admin/prepends">
              <Button
                variant="outline"
                className="w-full py-4 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                🧩 Prepend-uri & Triggers
              </Button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
