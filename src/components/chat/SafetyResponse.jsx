import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Heart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SafetyResponse({ onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-4 my-4"
    >
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-100 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="font-medium text-gray-800">Îmi pasă de tine</h3>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Ceea ce simți este important și merită atenție. Nu ești singur/ă în asta. 
          Te încurajez să vorbești cu cineva care te poate ajuta.
        </p>

        <div className="bg-white rounded-xl p-4 mb-4 border border-rose-100">
          <div className="flex items-center gap-3 mb-2">
            <Phone className="w-5 h-5 text-rose-500" />
            <span className="font-medium text-gray-800">Telefonul Sufletului</span>
          </div>
          <a 
            href="tel:0800801200"
            className="text-2xl font-semibold text-rose-500 hover:text-rose-600 transition-colors"
          >
            0800 801 200
          </a>
          <p className="text-xs text-gray-500 mt-1">Gratuit, confidențial, 24/7</p>
        </div>

        <div className="space-y-2 mb-4">
          <a
            href="https://www.telefonulsufletului.ro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <ExternalLink className="w-4 h-4" />
            telefonulsufletului.ro
          </a>
        </div>

        <Button
          variant="outline"
          onClick={onContinue}
          className="w-full mt-2 border-rose-200 text-gray-600 hover:bg-rose-50"
        >
          Continuă conversația
        </Button>
      </div>
    </motion.div>
  );
}