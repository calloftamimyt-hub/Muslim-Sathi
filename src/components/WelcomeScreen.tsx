import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, ArrowRight, Sparkles, Languages, Check } from 'lucide-react';
import { useLanguage, LanguagePreference } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

interface WelcomeScreenProps {
  onLogin: () => void;
  onSignUp: () => void;
  onSkip: () => void;
  key?: string;
}

export function WelcomeScreen({ onLogin, onSignUp, onSkip }: WelcomeScreenProps) {
  const { t, setPreference, preference } = useLanguage();
  const [step, setStep] = useState<'welcome' | 'language'>('welcome');

  const handleLanguageSelect = (lang: LanguagePreference) => {
    setPreference(lang);
    onSkip(); // This will trigger the app to open
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* Background Gradient Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-primary-light/40 dark:bg-primary-dark/10 rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/40 dark:bg-blue-900/10 rounded-full" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[20%] bg-amber-100/30 dark:bg-amber-900/5 rounded-full" />

      <AnimatePresence mode="wait">
        {step === 'welcome' ? (
          <motion.div 
            key="welcome-step"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col h-full w-full"
          >
            {/* Top Section */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col items-center justify-center px-6 pt-12 text-center relative z-10"
            >
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 0 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary-light/20 dark:shadow-primary-dark/40 mb-6 rotate-3 transition-all duration-500 cursor-pointer group"
              >
                <Sparkles className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-500" />
              </motion.div>
              
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                Muslim <span className="text-primary">Sathi</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-[220px] text-sm leading-tight">
                Your spiritual companion for a <span className="text-primary dark:text-primary-light">better life</span>
              </p>
            </motion.div>



            {/* Bottom Section - Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="px-8 pb-12 space-y-3 relative z-10"
            >
              <button
                onClick={onLogin}
                className="w-full h-13 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-light/20 dark:shadow-primary-dark/20 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all duration-300"
              >
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </button>

              <button
                onClick={onSignUp}
                className="w-full h-13 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl font-bold text-lg flex items-center justify-center space-x-2 active:scale-[0.98] transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary-light/20 dark:hover:border-primary-dark/20"
              >
                <UserPlus className="w-5 h-5" />
                <span>Sign Up</span>
              </button>

              <button
                onClick={() => setStep('language')}
                className="w-full py-3 text-slate-400 dark:text-slate-500 font-bold text-sm flex items-center justify-center space-x-1.5 hover:text-primary dark:hover:text-primary-light transition-colors group"
              >
                <span>Continue as Guest</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="language-step"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col h-full w-full"
          >
            {/* Top Section */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col items-center justify-center px-6 pt-12 text-center relative z-10"
            >
              <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
                <Languages className="w-10 h-10 text-primary" />
              </div>
              
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                Select <span className="text-primary">Language</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-[220px] text-sm leading-tight">
                Choose your preferred language to continue
              </p>
            </motion.div>



            {/* Bottom Section - Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="px-8 pb-12 space-y-4 relative z-10"
            >
              <button
                onClick={() => handleLanguageSelect('en')}
                className={cn(
                  "w-full h-14 rounded-xl font-bold text-lg flex items-center justify-between px-6 transition-all duration-300 active:scale-[0.98]",
                  preference === 'en' 
                    ? "bg-primary text-white shadow-lg shadow-primary-light/20" 
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"
                )}
              >
                <span>English</span>
                {preference === 'en' && <Check className="w-5 h-5" />}
              </button>

              <button
                onClick={() => handleLanguageSelect('bn')}
                className={cn(
                  "w-full h-14 rounded-xl font-bold text-lg flex items-center justify-between px-6 transition-all duration-300 active:scale-[0.98]",
                  preference === 'bn' 
                    ? "bg-primary text-white shadow-lg shadow-primary-light/20" 
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"
                )}
              >
                <span>বাংলা (Bangla)</span>
                {preference === 'bn' && <Check className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setStep('welcome')}
                className="w-full py-2 text-slate-400 dark:text-slate-500 font-bold text-sm flex items-center justify-center space-x-1.5 hover:text-primary transition-colors"
              >
                <span>Back</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
