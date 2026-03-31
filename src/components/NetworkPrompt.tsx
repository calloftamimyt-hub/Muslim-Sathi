import { WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface NetworkPromptProps {
  isOnline: boolean;
  onClose: () => void;
}

export function NetworkPrompt({ isOnline }: { isOnline: boolean }) {
  const { t } = useLanguage();
  
  return (
    <AnimatePresence>
      {!isOnline && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-8 max-w-sm w-full shadow-2xl relative border border-slate-100 dark:border-slate-800 text-center"
          >
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <WifiOff className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              {t('no-internet-title') || 'ইন্টারনেট সংযোগ নেই'}
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-base leading-relaxed">
              {t('no-internet-desc') || 'অ্যাপটির এই ফিচারটি ব্যবহার করতে আপনার ইন্টারনেট সংযোগ চালু করা প্রয়োজন। অনুগ্রহ করে ডাটা বা ওয়াইফাই অন করুন।'}
            </p>
            
            <div className="flex flex-col gap-3">
              <div className="animate-pulse flex items-center justify-center gap-2 text-primary font-medium">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>সংযোগের জন্য অপেক্ষা করা হচ্ছে...</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
