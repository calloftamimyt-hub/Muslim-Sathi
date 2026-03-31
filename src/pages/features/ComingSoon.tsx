import { motion } from 'motion/react';
import { ArrowLeft, Construction, Sparkles, Heart } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ComingSoonProps {
  categoryName: string;
  onBack: () => void;
}

export function ComingSoon({ categoryName, onBack }: ComingSoonProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Header */}
      <header className="px-4 pt-safe pb-4 flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{categoryName}</h1>
      </header>

      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8 relative"
        >
          <div className="w-32 h-32 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center relative z-10">
            <Construction className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-bounce" />
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-2 -right-2 text-amber-500"
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-md px-4"
        >
          <h2 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-4">
            Coming Soon
          </h2>
          
          <div className="space-y-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative">
              <Heart className="w-5 h-5 text-rose-500 absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 px-1" />
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                আমরা প্রতিনিয়ত নতুন ফিচার যোগ করছি যাতে আপনার অভিজ্ঞতা আরও ভালো হয়।
              </p>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">
              ধন্যবাদ আমাদের সাথে থাকার জন্য।
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer Decoration */}
      <div className="p-8 flex justify-center opacity-20 pointer-events-none">
        <div className="w-full max-w-xs h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full"></div>
      </div>
    </div>
  );
}
