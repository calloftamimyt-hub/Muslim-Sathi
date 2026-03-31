import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'post' | 'story';
}

export const LimitReachedModal: React.FC<LimitReachedModalProps> = ({ isOpen, onClose, type }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                সীমা অতিক্রম করেছেন!
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                দুঃখিত, আপনি আজকের জন্য আপনার {type === 'post' ? 'পোস্ট' : 'স্টোরি'} করার সীমা অতিক্রম করেছেন। আগামীকাল আবার চেষ্টা করুন ইনশাআল্লাহ।
              </p>
              
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20"
              >
                ঠিক আছে
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
