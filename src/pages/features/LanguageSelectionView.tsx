import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';
import { useLanguage, LanguagePreference } from '../../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';

interface LanguageSelectionProps {}

export function LanguageSelectionView({}: LanguageSelectionProps) {
  const { preference, setPreference, t } = useLanguage();

  const languages = [
    { id: 'auto', name: t('auto-language'), nativeName: t('auto-language') },
    { id: 'en', name: 'English', nativeName: 'English' },
    { id: 'bn', name: 'Bengali', nativeName: 'বাংলা (Bangla)' },
  ];

  const handleSelect = (id: string) => {
    setPreference(id as LanguagePreference);
    // Slight delay to show the checkmark animation before returning
    setTimeout(() => {
      window.history.back();
    }, 300);
  };

  return (
    <div className="flex flex-col font-sans">
      <div className="flex-grow p-4 space-y-2">
        {languages.map((lang, idx) => {
          const isSelected = preference === lang.id;
          return (
            <motion.button
              key={lang.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleSelect(lang.id)}
              className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-between transition-all border ${
                isSelected 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className={`text-base font-semibold ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-200'}`}>
                  {lang.nativeName}
                </span>
                {lang.id !== 'auto' && (
                  <span className={`text-xs mt-0.5 ${isSelected ? 'text-indigo-600/70 dark:text-indigo-400/70' : 'text-slate-400 dark:text-slate-500'}`}>
                    {lang.name}
                  </span>
                )}
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                >
                  <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
