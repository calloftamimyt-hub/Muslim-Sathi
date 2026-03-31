import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, Check, Languages, ChevronDown } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  currentUser: any;
  onReportSuccess?: () => void;
}

type Language = 'en' | 'bn';

const TRANSLATIONS = {
  en: {
    title: 'Report Post',
    subtitle: 'Select the correct reason',
    description: 'Why are you reporting this post? Your report helps us keep our community safe.',
    cancel: 'Cancel',
    submit: 'Submit Report',
    successTitle: 'Report Successful',
    successDesc: 'Thank you for your report. We will review it and take necessary action.',
    reasons: [
      { id: 'non_islamic', label: 'Non-Islamic Content', description: 'This post goes against Islamic values.' },
      { id: 'hate_speech', label: 'Hate Speech', description: 'Offensive speech about religion or a group.' },
      { id: 'spam', label: 'Spam or Misleading', description: 'Irrelevant or promotional posts.' },
      { id: 'harassment', label: 'Harassment or Bullying', description: 'Personal attack on someone.' },
      { id: 'false_info', label: 'False Information', description: 'Spreading incorrect Hadith or religious info.' },
      { id: 'inappropriate', label: 'Inappropriate Content', description: 'Obscene images or language used.' },
    ]
  },
  bn: {
    title: 'রিপোর্ট করুন',
    subtitle: 'সঠিক কারণটি নির্বাচন করুন',
    description: 'কেন আপনি এই পোস্টটি রিপোর্ট করছেন? আপনার রিপোর্ট আমাদের কমিউনিটিকে নিরাপদ রাখতে সাহায্য করবে।',
    cancel: 'বাতিল',
    submit: 'রিপোর্ট সাবমিট',
    successTitle: 'রিপোর্ট সফল হয়েছে',
    successDesc: 'আপনার রিপোর্টের জন্য ধন্যবাদ। আমরা এটি পর্যালোচনা করবো এবং প্রয়োজনীয় ব্যবস্থা নেবো।',
    reasons: [
      { id: 'non_islamic', label: 'অ-ইসলামিক কন্টেন্ট', description: 'এই পোস্টটি ইসলামিক আদর্শের পরিপন্থী।' },
      { id: 'hate_speech', label: 'ঘৃণ্য বক্তব্য (Hate Speech)', description: 'ধর্ম বা কোনো গোষ্ঠী নিয়ে আপত্তিকর কথা।' },
      { id: 'spam', label: 'স্প্যাম বা বিভ্রান্তিকর', description: 'অপ্রাসঙ্গিক বা বিজ্ঞাপনমূলক পোস্ট।' },
      { id: 'harassment', label: 'হয়রানি বা বুলিং', description: 'কাউকে ব্যক্তিগতভাবে আক্রমণ করা হয়েছে।' },
      { id: 'false_info', label: 'ভুল তথ্য', description: 'ভুল হাদিস বা ভুল ধর্মীয় তথ্য ছড়ানো হচ্ছে।' },
      { id: 'inappropriate', label: 'অশ্লীল বা কুরুচিপূর্ণ', description: 'অশ্লীল ছবি বা ভাষা ব্যবহার করা হয়েছে।' },
    ]
  }
};

export function ReportModal({ isOpen, onClose, postId, currentUser, onReportSuccess }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'success'>('select');
  const [lang, setLang] = useState<Language>('en');
  const [isLangOpen, setIsLangOpen] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleReportSubmit = async () => {
    if (!selectedReason || !currentUser) return;

    setLoading(true);
    try {
      const userUid = currentUser.id || currentUser.uid;
      
      // Add report document
      await addDoc(collection(db, 'reports'), {
        postId,
        userUid,
        reason: selectedReason,
        createdAt: serverTimestamp()
      });
      
      // Update post with report count and user ID
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        reportsCount: increment(1),
        reports: arrayUnion(userUid)
      });
      
      // Switch to success step inside the modal
      setStep('success');
      if (onReportSuccess) onReportSuccess();
      
      // Auto close the whole modal after showing success for 2 seconds
      setTimeout(() => {
        onClose();
        // Reset for next time after modal animation finishes
        setTimeout(() => {
          setStep('select');
          setSelectedReason(null);
        }, 500);
      }, 2000);

    } catch (err: any) {
      console.error("Error reporting post:", err);
      const errorMsg = lang === 'bn' 
        ? `রিপোর্ট সাবমিট করা যায়নি: ${err.message || 'সার্ভার সমস্যা'}` 
        : `Failed to submit report: ${err.message || 'Server error'}`;
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : undefined}
            className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
          />

          {/* Main Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[201] bg-white dark:bg-slate-900 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{t.title}</h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.subtitle}</p>
                </div>
              </div>

              {/* Language Switcher */}
              <div className="relative">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Languages className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">{lang}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isLangOpen && (
                    <>
                      <div className="fixed inset-0 z-0" onClick={() => setIsLangOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 shadow-xl rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-10 min-w-[110px]"
                      >
                        <button 
                          onClick={() => { setLang('en'); setIsLangOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 ${lang === 'en' ? 'text-rose-600 bg-rose-50/50' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          English
                        </button>
                        <button 
                          onClick={() => { setLang('bn'); setIsLangOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 ${lang === 'bn' ? 'text-rose-600 bg-rose-50/50' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          বাংলা
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <AnimatePresence mode="wait">
                {step === 'select' ? (
                  <motion.div 
                    key="select"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 px-2 mb-2">
                        {t.description}
                      </p>
                      
                      <div className="space-y-1">
                        {t.reasons.map((reason) => (
                          <button
                            key={reason.id}
                            onClick={() => setSelectedReason(reason.label)}
                            className={`w-full flex items-center space-x-3 p-2.5 rounded-xl border transition-all text-left ${
                              selectedReason === reason.label
                                ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10'
                                : 'border-slate-50 dark:border-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                            }`}
                          >
                            {/* Circular Checkbox Indicator */}
                            <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              selectedReason === reason.label
                                ? 'border-rose-500 bg-rose-500'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {selectedReason === reason.label && (
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              )}
                            </div>

                            <div className="flex-1">
                              <h4 className={`text-[13px] font-bold leading-tight ${selectedReason === reason.label ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                {reason.label}
                              </h4>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{reason.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex space-x-3">
                      <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-3.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 text-[11px]"
                      >
                        {t.cancel}
                      </button>
                      <button
                        onClick={handleReportSubmit}
                        disabled={!selectedReason || loading}
                        className="flex-[2] bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center space-x-2 text-[11px]"
                      >
                        {loading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>{t.submit}</span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="w-20 h-20 bg-primary/10 dark:bg-primary-dark/20 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t.successTitle}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
                      {t.successDesc}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
