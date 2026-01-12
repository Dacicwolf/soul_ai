import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Shield, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function Disclaimer() {
  const [accepted, setAccepted] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'adult_stresat';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50 flex flex-col p-6">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full justify-center">
        {/* Shield icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-200/50">
            <Shield className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-semibold text-gray-800 mb-3">
            Înainte de a începe
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Te rugăm să citești și să confirmi că înțelegi natura acestui spațiu
          </p>
        </motion.div>

        {/* Disclaimer card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg mb-8"
        >
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>
              Această aplicație oferă <span className="font-medium text-gray-800">suport emoțional</span> și un spațiu de reflecție.
            </p>
            <p>
              <span className="font-medium text-gray-800">Nu înlocuiește:</span>
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
                Terapia sau consilierea profesională
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
                Sfaturile medicale sau psihologice
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
                Ajutorul de urgență în situații de criză
              </li>
            </ul>
            <div className="pt-2 border-t border-gray-100 mt-4">
              <p className="text-xs text-gray-500">
                În caz de urgență, sună la <span className="font-medium">0800 801 200</span> (Telefonul Sufletului)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Checkbox */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <label 
            className="flex items-start gap-4 cursor-pointer bg-white/50 rounded-xl p-4 border border-white/50 hover:bg-white/70 transition-colors"
            onClick={() => setAccepted(!accepted)}
          >
            <div className="mt-0.5">
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                accepted 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 border-transparent' 
                  : 'border-gray-300 bg-white'
              }`}>
                {accepted && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
            <span className="text-gray-700 text-sm leading-relaxed">
              Înțeleg că aplicația oferă suport emoțional, nu terapie, și accept termenii de utilizare.
            </span>
          </label>
        </motion.div>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link 
            to={accepted ? `${createPageUrl('Chat')}?mode=${mode}` : '#'}
            className={!accepted ? 'pointer-events-none' : ''}
          >
            <Button 
              size="lg"
              disabled={!accepted}
              className="w-full py-6 text-lg font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-2xl shadow-lg shadow-purple-200/50 transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Start conversație
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}