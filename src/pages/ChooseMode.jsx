import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Briefcase, Users, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const modes = [
  {
    id: 'adult_stresat',
    title: 'Adult stresat',
    description: 'Presiune la job, responsabilități, burnout',
    icon: Briefcase,
    gradient: 'from-blue-400 to-indigo-500',
    shadow: 'shadow-indigo-200/50'
  },
  {
    id: 'parinte',
    title: 'Părinte',
    description: 'Provocările și bucuriile parentale',
    icon: Users,
    gradient: 'from-rose-400 to-pink-500',
    shadow: 'shadow-pink-200/50'
  },
  {
    id: 'tanar',
    title: 'Tânăr',
    description: 'Identitate, relații, viitor',
    icon: Sparkles,
    gradient: 'from-amber-400 to-orange-500',
    shadow: 'shadow-orange-200/50'
  }
];

export default function ChooseMode() {
  const [selectedMode, setSelectedMode] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50 flex flex-col p-6">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-10 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 mt-8"
        >
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Cum te simți azi?
          </h1>
          <p className="text-gray-500 text-sm">
            Alege ce te descrie cel mai bine acum
          </p>
        </motion.div>

        {/* Mode cards */}
        <div className="flex-1 flex flex-col justify-center space-y-4">
          {modes.map((mode, index) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              onClick={() => setSelectedMode(mode.id)}
              className={`w-full p-5 rounded-2xl text-left transition-all duration-300 ${
                selectedMode === mode.id
                  ? `bg-gradient-to-r ${mode.gradient} text-white shadow-xl ${mode.shadow}`
                  : 'bg-white/70 backdrop-blur-sm border border-white/50 hover:bg-white hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedMode === mode.id
                    ? 'bg-white/20'
                    : `bg-gradient-to-br ${mode.gradient}`
                }`}>
                  <mode.icon className={`w-6 h-6 ${
                    selectedMode === mode.id ? 'text-white' : 'text-white'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium text-lg ${
                    selectedMode === mode.id ? 'text-white' : 'text-gray-800'
                  }`}>
                    {mode.title}
                  </h3>
                  <p className={`text-sm ${
                    selectedMode === mode.id ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {mode.description}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 transition-transform ${
                  selectedMode === mode.id ? 'text-white translate-x-1' : 'text-gray-300'
                }`} />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 space-y-4"
        >
          <p className="text-center text-gray-400 text-xs">
            Poți schimba oricând
          </p>
          
          <Link 
            to={selectedMode ? `${createPageUrl('Disclaimer')}?mode=${selectedMode}` : '#'}
            className={!selectedMode ? 'pointer-events-none' : ''}
          >
            <Button 
              size="lg"
              disabled={!selectedMode}
              className="w-full py-6 text-lg font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-2xl shadow-lg shadow-purple-200/50 transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuă
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}