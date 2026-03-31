import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface DeleteAccountProps {}

export function DeleteAccountView({}: DeleteAccountProps) {
  const { t } = useLanguage();
  const [confirmText, setConfirmText] = useState('');
  
  const targetWord = t('delete-keyword');
  const isMatch = confirmText === targetWord;

  const handleDelete = () => {
    if (isMatch) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      <div className="flex-grow p-4 flex flex-col items-center pt-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-500" />
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">
          {t('confirm-delete-account')}
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-slate-400 text-center mb-8 max-w-sm leading-relaxed">
          {t('delete-warning')}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full max-w-sm bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 mb-8">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">
            {t('confirm-keyword-instruction')} "{targetWord}" {t('type-to-confirm')}
          </label>
          <input 
            type="text" 
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={targetWord}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500/50 text-slate-900 dark:text-white text-center font-bold tracking-widest"
          />
        </motion.div>

        <motion.button 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          onClick={handleDelete}
          disabled={!isMatch}
          className={`w-full max-w-sm p-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all ${
            isMatch 
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 dark:shadow-none' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Trash2 className="w-5 h-5" />
          <span>{t('permanently-delete')}</span>
        </motion.button>
      </div>
    </div>
  );
}
