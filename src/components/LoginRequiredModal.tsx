import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, X, User } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export function LoginRequiredModal({ isOpen, onClose, onNavigate }: LoginRequiredModalProps) {
  if (!isOpen) return null;

  const handleGoToProfile = () => {
    onClose();
    if (onNavigate) {
      onNavigate('profile');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Image/Icon Area */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 pt-8 pb-6 flex justify-center items-center">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center border-4 border-emerald-100 dark:border-emerald-900/50">
              <LogIn className="w-10 h-10 text-emerald-600 dark:text-emerald-500 ml-1" />
            </div>
          </div>

          {/* Text Content */}
          <div className="p-6 text-center">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              লগ-ইন প্রয়োজন
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
              সোশ্যাল ক্যাটাগরির এই ফিচারটি ব্যবহার করতে আপনাকে লগ-ইন করতে হবে। দয়া করে আপনার প্রোফাইলে গিয়ে লগ-ইন সম্পন্ন করুন।
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleGoToProfile}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <User className="w-5 h-5" />
                <span>প্রোফাইলে যান</span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors active:scale-[0.98]"
              >
                পরে করব
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
