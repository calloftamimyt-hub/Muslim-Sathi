import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Globe, ShieldCheck, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { privacyContent } from '../../data/privacyContent';

interface PrivacySecurityProps {
  type: 'privacy' | 'terms';
}

export function PrivacySecurityView({ type }: PrivacySecurityProps) {
  const { language, setLanguage } = useLanguage();
  const content = privacyContent[language === 'bn' ? 'bn' : 'en'][type];

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      <div className="flex-grow p-4 space-y-4">
        <div className="flex justify-end mb-2">
          <button 
            onClick={toggleLanguage}
            className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center space-x-2"
            title="Change Language"
          >
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              {language === 'bn' ? 'English' : 'বাংলা'}
            </span>
          </button>
        </div>
        {/* Intro Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-center flex-col text-center mt-2"
        >
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mb-3">
            {type === 'privacy' ? (
              <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            {type === 'privacy' 
              ? (language === 'bn' ? 'আপনার তথ্যের নিরাপত্তা আমাদের সর্বোচ্চ অগ্রাধিকার' : 'Your data security is our top priority')
              : (language === 'bn' ? 'অ্যাপ ব্যবহারের নিয়মাবলী ও শর্তসমূহ' : 'Rules and conditions for using the app')}
          </p>
        </motion.div>

        {/* Content Cards */}
        {content.sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            {/* Left Accent Line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 dark:bg-indigo-600 rounded-l-xl opacity-80 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 pl-2">{section.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-2">{section.content}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
