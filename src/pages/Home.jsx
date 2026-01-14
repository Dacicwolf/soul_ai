import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50 flex flex-col items-center justify-center p-6">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-100/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm"
      >
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8 relative"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-xl shadow-purple-200/50">
            <Heart className="w-10 h-10 text-white" fill="white" fillOpacity={0.3} />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="w-6 h-6 text-amber-400" />
          </motion.div>
        </motion.div>

        {/* Main text */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl md:text-3xl font-light text-gray-800 leading-relaxed mb-4"
        >
          Un spațiu sigur pentru a-ți clarifica gândurile.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-500 text-sm mb-12"
        >
          Companion AI pentru sufletul tău
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full"
        >
          <Link to={createPageUrl('ChooseMode')}>
            <Button 
              size="lg"
              className="w-full py-6 text-lg font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-2xl shadow-lg shadow-purple-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-300/50 hover:-translate-y-0.5"
            >
              Începe
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-gray-400 text-xs"
      >
        Cu grijă pentru tine ✨
      </motion.div>
    </div>
  );
}