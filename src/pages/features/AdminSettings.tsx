import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Shield, Info, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AdminSettingsProps {
  onBack: () => void;
}

export function AdminSettingsView({ onBack }: AdminSettingsProps) {
  const [postLimit, setPostLimit] = useState<number>(-1);
  const [storyLimit, setStoryLimit] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'social'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setPostLimit(data.postLimit ?? -1);
          setStoryLimit(data.storyLimit ?? -1);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'settings/social');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await setDoc(doc(db, 'settings', 'social'), {
        postLimit,
        storyLimit,
        updatedAt: new Date()
      }, { merge: true });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/social');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-safe pb-3">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-200" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">অ্যাডমিন সেটিংস</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-full font-bold text-sm transition-colors shadow-lg shadow-emerald-600/20"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Info Card */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-4 rounded-2xl flex items-start space-x-3">
            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-emerald-900 dark:text-emerald-300">অ্যাডমিন প্যানেল</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
                এখান থেকে আপনি সোশ্যাল ফিডের পোস্ট এবং স্টোরি লিমিট নিয়ন্ত্রণ করতে পারবেন। আনলিমিটেড করতে চাইলে -১ সেট করুন।
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
              <div className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
            </div>
          ) : (
            <>
              {/* Post Limit Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-slate-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white">পোস্ট লিমিট</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      প্রতিদিন সর্বোচ্চ পোস্ট সংখ্যা
                    </label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="number" 
                        value={postLimit}
                        onChange={(e) => setPostLimit(parseInt(e.target.value) || -1)}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="-1 for unlimited"
                      />
                      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl text-slate-500 font-bold">
                        {postLimit === -1 ? 'আনলিমিটেড' : 'টি'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <p>একজন ইউজার প্রতিদিন সর্বোচ্চ কতটি পোস্ট করতে পারবে তা এখান থেকে নির্ধারণ করুন।</p>
                  </div>
                </div>
              </div>

              {/* Story Limit Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-slate-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white">স্টোরি লিমিট</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      প্রতিদিন সর্বোচ্চ স্টোরি সংখ্যা
                    </label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="number" 
                        value={storyLimit}
                        onChange={(e) => setStoryLimit(parseInt(e.target.value) || -1)}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="-1 for unlimited"
                      />
                      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl text-slate-500 font-bold">
                        {storyLimit === -1 ? 'আনলিমিটেড' : 'টি'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <p>একজন ইউজার প্রতিদিন সর্বোচ্চ কতটি স্টোরি আপলোড করতে পারবে তা এখান থেকে নির্ধারণ করুন।</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold py-4"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>সেটিংস সফলভাবে সেভ হয়েছে!</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
