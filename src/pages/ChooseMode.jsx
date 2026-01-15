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
    description: 'Când simți că sunt prea multe de dus',
    details: 'Simți că nu mai ai spațiu să respiri (job, responsabilități, oboseală care se adună)',
    icon: Briefcase,
    bgNormal: '#DCE7FF',
    bgSelected: '#5B7CFA',
    iconBg: '#5B7CFA'
  },
  {
    id: 'parinte',
    title: 'Părinte',
    description: 'Când ai grijă de toți, dar ți-e greu să mai ai timp pentru tine',
    details: 'Provocările și bucuriile vieții de părinte (iubirea și oboseala merg împreună)',
    icon: Users,
    bgNormal: '#EBDDFF',
    bgSelected: '#8E5CF6',
    iconBg: '#8E5CF6'
  },
  {
    id: 'tanar',
    title: 'Tânăr',
    description: 'Când încerci să-ți dai seama ce vrei mai departe',
    details: 'Ai multe întrebări și puține certitudini (Identitate, relații, viitor)',
    icon: Sparkles,
    bgNormal: '#FFE6C7',
    bgSelected: '#FF8C42',
    iconBg: '#FF8C42'
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
            Alege ce se potrivește cel mai bine acum
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
              style={{
                backgroundColor: selectedMode === mode.id ? mode.bgSelected : mode.bgNormal,
                borderColor: selectedMode === mode.id ? mode.bgSelected : 'transparent'
              }}
              className={`w-full p-3 rounded-2xl text-left transition-all duration-200 border hover:brightness-105 ${
                selectedMode === mode.id ? 'shadow-lg' : 'shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div 
                  style={{ backgroundColor: selectedMode === mode.id ? 'rgba(255,255,255,0.2)' : mode.iconBg }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                >
                  <mode.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-base mb-0.5 ${
                    selectedMode === mode.id ? 'text-white' : 'text-[#222]'
                  }`}>
                    {mode.title}
                  </h3>
                  <p className={`text-xs mb-0.5 leading-snug ${
                    selectedMode === mode.id ? 'text-white/90' : 'text-[#222]/80'
                  }`}>
                    {mode.description}
                  </p>
                  <p className={`text-xs leading-snug ${
                    selectedMode === mode.id ? 'text-white/70' : 'text-[#222]/60'
                  }`}>
                    {mode.details}
                  </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform flex-shrink-0 mt-1 ${
                  selectedMode === mode.id ? 'text-white translate-x-1' : 'text-[#222]/40'
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
            to={selectedMode ? `${createPageUrl('Chat')}?mode=${selectedMode}` : '#'}
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