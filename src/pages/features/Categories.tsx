import React from 'react';
import { Bell, History } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from '@/hooks/useLocation';
import { CATEGORIES } from '../Home';
import { cn } from '@/lib/utils';

interface CategoriesViewProps {
  setActiveTab: (tab: string) => void;
}

export function CategoriesView({ setActiveTab }: CategoriesViewProps) {
  const { t, language } = useLanguage();
  const { latitude, longitude } = useLocation(language);

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 px-4 pt-safe pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('categories')}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 text-slate-600 dark:text-slate-300">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <div className="flex-grow overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-5 min-h-full pt-8">
          <div className="grid grid-cols-4 gap-y-6 gap-x-2">
            {CATEGORIES.map((cat, idx) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => {
                  if (cat.id === 'mosque') {
                    const url = `https://www.google.com/maps/search/mosque/@${latitude},${longitude},16z`;
                    window.open(url, '_blank');
                  } else {
                    setActiveTab(cat.id);
                  }
                }}
                className="flex flex-col items-center justify-center group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-2.5 transition-all duration-300 relative",
                  "border border-slate-100 dark:border-slate-700",
                  cat.bg, cat.color
                )}>
                  <cat.icon className="w-[22px] h-[22px] stroke-[2.5px]" />
                </div>
                <span className="text-[9px] font-medium text-slate-600 dark:text-slate-400 text-center leading-tight group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  {t(cat.id as any)}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
